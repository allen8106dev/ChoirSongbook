from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
import os
from sqlalchemy import inspect, text

from app.config import settings
from app.database import engine, Base, SessionLocal
from app.routers import auth, songs, categories, languages, admin, favourites, organizations
from app import models, crud, schemas

# Initialize database tables on startup (especially for SQLite local)
# In production with migrations, we use Alembic, but this ensures table creation in local dev
#

# Create local upload directory if it does not exist (only needed for local dev)
try:
    if not os.path.exists(settings.UPLOAD_DIR):
        os.makedirs(settings.UPLOAD_DIR)
except Exception:
    pass  # On Render with Supabase storage, this directory may not be needed


app = FastAPI(

    title=settings.PROJECT_NAME,
    description="Backend service for Choir Songbook Web App",
    version="1.0.0",
    docs_url="/docs" if settings.DEBUG else None,
    redoc_url="/redoc" if settings.DEBUG else None,
)

# CORS setup
# Permit localhost frontend origin and potential production domains
origins = [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
]

allow_credentials = True
if settings.ALLOWED_ORIGINS == "*":
    origins = ["*"]
    allow_credentials = False
elif settings.ALLOWED_ORIGINS:
    additional_origins = [o.strip() for o in settings.ALLOWED_ORIGINS.split(",") if o.strip()]
    origins.extend(additional_origins)

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=allow_credentials,
    allow_methods=["*"],
    allow_headers=["*"],
)


# Include API Routers
app.include_router(auth.router, prefix=settings.API_V1_STR)
app.include_router(songs.router, prefix=settings.API_V1_STR)
app.include_router(categories.router, prefix=settings.API_V1_STR)
app.include_router(languages.router, prefix=settings.API_V1_STR)
app.include_router(admin.router, prefix=settings.API_V1_STR)
app.include_router(favourites.router, prefix=settings.API_V1_STR)
app.include_router(organizations.router, prefix=settings.API_V1_STR)

# Serve local uploads statically
app.mount("/uploads", StaticFiles(directory=settings.UPLOAD_DIR), name="uploads")


@app.get("/api/health", tags=["Health"])
def health_check():
    return {
        "status": "ok",
        "project": settings.PROJECT_NAME,
        "database": "connected"
    }

def ensure_organization_migration():
    """
    Idempotently moves the legacy single songbook into the default church organization.
    Existing rows are updated in place; no songs/members/tags are deleted.
    """
    db = SessionLocal()
    try:
        default_org = crud.get_or_create_default_organization(db)
        default_org_id = default_org.id
    finally:
        db.close()

    inspector = inspect(engine)
    with engine.begin() as conn:
        for table_name in ["songs", "categories", "languages"]:
            if table_name not in inspector.get_table_names():
                continue
            columns = {column["name"] for column in inspector.get_columns(table_name)}
            if "organization_id" not in columns:
                conn.execute(text(f"ALTER TABLE {table_name} ADD COLUMN organization_id VARCHAR(36)"))
            conn.execute(
                text(f"UPDATE {table_name} SET organization_id = :org_id WHERE organization_id IS NULL OR organization_id = ''"),
                {"org_id": default_org_id}
            )

    db = SessionLocal()
    try:
        legacy_admins = db.query(models.AdminEmail).order_by(models.AdminEmail.email).all()
        default_org = crud.get_organization(db, default_org_id)
        owner_candidate = next(
            (
                legacy_admin.email.strip().lower()
                for legacy_admin in legacy_admins
                if legacy_admin.email.strip().lower() != settings.DEVELOPER_EMAIL.strip().lower()
            ),
            legacy_admins[0].email.strip().lower() if legacy_admins else None
        )
        if (
            default_org
            and default_org.owner_email.strip().lower() in {"legacy@choir.org", settings.DEVELOPER_EMAIL.strip().lower()}
            and owner_candidate
        ):
            default_org.owner_email = owner_candidate
            db.commit()

        for legacy_admin in legacy_admins:
            email_clean = legacy_admin.email.strip().lower()
            if default_org and (
                email_clean == default_org.owner_email.strip().lower()
                or email_clean == settings.DEVELOPER_EMAIL.strip().lower()
            ):
                existing_owner_member = db.query(models.OrganizationAdmin).filter(
                    models.OrganizationAdmin.organization_id == default_org_id,
                    models.OrganizationAdmin.email == email_clean
                ).first()
                if existing_owner_member:
                    db.delete(existing_owner_member)
                    db.commit()
                continue
            crud.add_admin_email(db, legacy_admin.email, default_org_id)

        for song in db.query(models.Song).filter(models.Song.organization_id == default_org_id).all():
            for category in song.categories:
                if not category.organization_id:
                    category.organization_id = default_org_id
            for language in song.languages:
                if not language.organization_id:
                    language.organization_id = default_org_id
        db.commit()
        crud.recalculate_song_numbers(db, default_org_id)
    except Exception as e:
        db.rollback()
        print(f"Warning: Could not complete organization migration: {e}")
    finally:
        db.close()

# Seeding default data on application startup if database is empty
@app.on_event("startup")
def seed_data():
    try:
        Base.metadata.create_all(bind=engine)
        ensure_organization_migration()
    except Exception as e:
        print(f"Warning: Could not create tables on startup (migrations may already be applied): {e}")

    
    db = SessionLocal()
    try:
        # Check if songs table is empty
        song_count = db.query(models.Song).count()
        if song_count == 0:
            print("Database is empty. Seeding default categories, languages, member emails, and songs...")
            default_org = crud.get_or_create_default_organization(db)
            
            # 1. Seed member emails
            default_members = ['admin@choir.org', 'director@choir.org']
            default_org.owner_email = default_members[0]
            db.commit()
            for email in default_members:
                if email == default_org.owner_email:
                    continue
                crud.add_admin_email(db, email, default_org.id)
                
            # 2. Seed default categories & languages
            categories_list = ['Worship', 'Praise', 'Christmas', 'Adoration', 'Communion', 'Youth', 'Marriage']
            languages_list = ['English', 'Malayalam', 'Hindi', 'Tamil', 'Spanish']
            
            for c in categories_list:
                crud.get_or_create_category(db, c, default_org.id)
            for l in languages_list:
                crud.get_or_create_language(db, l, default_org.id)
                
            # 3. Seed initial songs
            initial_songs_data = [
                schemas.SongCreate(
                    title="10,000 Reasons (Bless The Lord)",
                    lyrics="Chorus:\nBless the Lord, O my soul, O my soul\nWorship His holy name\nSing like never before, O my soul\nI'll worship Your holy name\n\nVerse 1:\nThe sun comes up, it's a new day dawning\nIt's time to sing Your song again\nWhatever may pass and whatever lies before me\nLet me be singing when the evening comes\n\nVerse 2:\nYou're rich in love and You're slow to anger\nYour name is great and Your heart is kind\nFor all Your goodness I will keep on singing\nTen thousand reasons for my heart to find",
                    transliteration="",
                    languages=["English"],
                    categories=["Worship", "Praise"],
                    audio_url="https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3"
                ),
                schemas.SongCreate(
                    title="Amazing Grace",
                    lyrics="Verse 1:\nAmazing grace! How sweet the sound\nThat saved a wretch like me!\nI once was lost, but now am found;\nWas blind, but now I see.\n\nVerse 2:\n'Twas grace that taught my heart to fear,\nAnd grace my fears relieved;\nHow precious did that grace appear\nThe hour I first believed.\n\nVerse 3:\nThrough many dangers, toils and snares,\nI have already come;\n'Tis grace hath brought me safe thus far,\nAnd grace will lead me home.",
                    transliteration="",
                    languages=["English"],
                    categories=["Praise", "Adoration"],
                    audio_url="https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3"
                ),
                schemas.SongCreate(
                    title="Cornerstone",
                    lyrics="Verse 1:\nMy hope is built on nothing less\nThan Jesus' blood and righteousness\nI dare not trust the sweetest frame\nBut wholly trust in Jesus' Name\n\nChorus:\nChrist alone, Cornerstone\nWeak made strong in the Savior's love\nThrough the storm, He is Lord\nLord of all",
                    transliteration="",
                    languages=["English"],
                    categories=["Worship"],
                    audio_url=""
                ),
                schemas.SongCreate(
                    title="Nanniyeode Njan Sthuthikkum",
                    lyrics="Verse 1:\nനന്ദിയോടെ ഞാൻ സ്തുതിക്കും എന്റെ യേശുനാഥാ\nഎത്ര നല്ലവൻ നീ എനിക്കായ് ചെയ്ത നന്മകൾക്കോർത്തു ഞാൻ\nനന്ദിയോടെ ഞാൻ സ്തുതിക്കും എന്റെ യേശുനാഥാ\n\nChorus:\nഅർഹതയില്ലാത്ത എനിക്ക് നീ തന്ന\nആയുസ്സും ആരോഗ്യവും നന്മകളും\nഓർക്കുമ്പോൾ എൻ മനസ്സു നിറയുന്നു സദാ\nനന്ദിയോടെ ഞാൻ സ്തുതിക്കും എന്റെ യേശുനാഥാ",
                    transliteration="Verse 1:\nNanniyeode njan sthuthikkum ente Yesunadha\nEthra nallavan nee enikkayi cheitha nanmakalkkorthu njan\nNanniyeode njan sthuthikkum ente Yesunadha\n\nChorus:\nArhathayillatha enikku nee thanna\nAayussum aarogyavum nanmakalum\nOrkkumpol en manassu nirayunnu sada\nNanniyeode njan sthuthikkum ente Yesunadha",
                    languages=["Malayalam"],
                    categories=["Worship", "Adoration"],
                    audio_url="https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3"
                ),
                schemas.SongCreate(
                    title="Silent Night",
                    lyrics="Verse 1:\nSilent night, holy night!\nAll is calm, all is bright\nRound yon virgin mother and child\nHoly Infant, so tender and mild\nSleep in heavenly peace,\nSleep in heavenly peace.\n\nVerse 2:\nNoche de paz, noche de amor,\nTodo duerme en derredor.\nEntre sus astros que difunden su luz\nBella anunciando al niñito Jesús\nBrilla la estrella de paz\nBrilla la estrella de paz.",
                    transliteration="",
                    languages=["English", "Spanish"],
                    categories=["Christmas"],
                    audio_url=""
                )
            ]
            
            for song_data in initial_songs_data:
                crud.create_song(db, song_data, default_org.id)
                
            print("Database seeding completed successfully.")
    except Exception as e:
        print(f"Error seeding data: {e}")
    finally:
        db.close()
