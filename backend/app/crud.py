from sqlalchemy.orm import Session
from sqlalchemy import func
from app import models, schemas
from typing import List, Optional

DEFAULT_ORGANIZATION_NAME = "St. Anthony's Malankara Catholic Church"

# --- Organization CRUD ---
def get_default_organization(db: Session) -> Optional[models.Organization]:
    return db.query(models.Organization).filter(models.Organization.name == DEFAULT_ORGANIZATION_NAME).first()

def get_organization(db: Session, organization_id: str) -> Optional[models.Organization]:
    return db.query(models.Organization).filter(models.Organization.id == organization_id).first()

def get_or_create_default_organization(db: Session, owner_email: str = "legacy@choir.org") -> models.Organization:
    organization = get_default_organization(db)
    if not organization:
        organization = models.Organization(
            name=DEFAULT_ORGANIZATION_NAME,
            owner_email=owner_email.strip().lower()
        )
        db.add(organization)
        db.commit()
        db.refresh(organization)
    return organization

def get_user_organizations(db: Session, email: str) -> List[models.Organization]:
    email_clean = email.strip().lower()
    return (
        db.query(models.Organization)
        .join(models.OrganizationAdmin)
        .filter(models.OrganizationAdmin.email == email_clean)
        .order_by(models.Organization.name)
        .all()
    )

def get_all_organizations(db: Session) -> List[models.Organization]:
    return db.query(models.Organization).order_by(models.Organization.name).all()

def create_organization(db: Session, name: str, owner_email: str) -> models.Organization:
    owner_clean = owner_email.strip().lower()
    organization = models.Organization(name=name.strip(), owner_email=owner_clean)
    db.add(organization)
    db.commit()
    db.refresh(organization)
    add_admin_email(db, owner_clean, organization.id)
    return organization

def is_org_admin(db: Session, email: str, organization_id: str) -> bool:
    email_clean = email.strip().lower()
    return db.query(models.OrganizationAdmin).filter(
        models.OrganizationAdmin.organization_id == organization_id,
        models.OrganizationAdmin.email == email_clean
    ).first() is not None

def get_org_admins(db: Session, organization_id: str) -> List[models.OrganizationAdmin]:
    return (
        db.query(models.OrganizationAdmin)
        .filter(models.OrganizationAdmin.organization_id == organization_id)
        .order_by(models.OrganizationAdmin.email)
        .all()
    )

def add_admin_email(db: Session, email: str, organization_id: Optional[str] = None) -> models.OrganizationAdmin:
    email_clean = email.strip().lower()
    organization = get_organization(db, organization_id) if organization_id else get_or_create_default_organization(db)
    admin = db.query(models.OrganizationAdmin).filter(
        models.OrganizationAdmin.organization_id == organization.id,
        models.OrganizationAdmin.email == email_clean
    ).first()
    if not admin:
        admin = models.OrganizationAdmin(organization_id=organization.id, email=email_clean)
        db.add(admin)
        db.commit()
        db.refresh(admin)
    legacy_admin = db.query(models.AdminEmail).filter(models.AdminEmail.email == email_clean).first()
    if not legacy_admin and organization.name == DEFAULT_ORGANIZATION_NAME:
        legacy_admin = models.AdminEmail(email=email_clean)
        db.add(legacy_admin)
        db.commit()
    return admin

def remove_admin_email(db: Session, email: str, organization_id: Optional[str] = None) -> bool:
    email_clean = email.strip().lower()
    organization = get_organization(db, organization_id) if organization_id else get_or_create_default_organization(db)
    admin = db.query(models.OrganizationAdmin).filter(
        models.OrganizationAdmin.organization_id == organization.id,
        models.OrganizationAdmin.email == email_clean
    ).first()
    if admin:
        db.delete(admin)
        db.commit()
        if organization.name == DEFAULT_ORGANIZATION_NAME:
            legacy_admin = db.query(models.AdminEmail).filter(models.AdminEmail.email == email_clean).first()
            if legacy_admin:
                db.delete(legacy_admin)
                db.commit()
        return True
    return False

# --- Category CRUD ---
def get_categories(db: Session, organization_id: str) -> List[models.Category]:
    return db.query(models.Category).filter(models.Category.organization_id == organization_id).order_by(models.Category.name).all()

def get_category_by_name(db: Session, name: str, organization_id: str) -> Optional[models.Category]:
    return db.query(models.Category).filter(
        models.Category.organization_id == organization_id,
        func.lower(models.Category.name) == name.lower()
    ).first()

def get_or_create_category(db: Session, name: str, organization_id: str) -> models.Category:
    category = get_category_by_name(db, name, organization_id)
    if not category:
        category = models.Category(name=name.strip(), organization_id=organization_id)
        db.add(category)
        db.commit()
        db.refresh(category)
    return category

def rename_category(db: Session, old_name: str, new_name: str, organization_id: str) -> Optional[models.Category]:
    category = get_category_by_name(db, old_name, organization_id)
    if category:
        category.name = new_name.strip()
        db.commit()
        db.refresh(category)
    return category

def delete_category(db: Session, name: str, organization_id: str) -> bool:
    category = get_category_by_name(db, name, organization_id)
    if category:
        db.delete(category)
        db.commit()
        return True
    return False


# --- Language CRUD ---
def get_languages(db: Session, organization_id: str) -> List[models.Language]:
    return db.query(models.Language).filter(models.Language.organization_id == organization_id).order_by(models.Language.name).all()

def get_language_by_name(db: Session, name: str, organization_id: str) -> Optional[models.Language]:
    return db.query(models.Language).filter(
        models.Language.organization_id == organization_id,
        func.lower(models.Language.name) == name.lower()
    ).first()

def get_or_create_language(db: Session, name: str, organization_id: str) -> models.Language:
    language = get_language_by_name(db, name, organization_id)
    if not language:
        language = models.Language(name=name.strip(), organization_id=organization_id)
        db.add(language)
        db.commit()
        db.refresh(language)
    return language

def rename_language(db: Session, old_name: str, new_name: str, organization_id: str) -> Optional[models.Language]:
    language = get_language_by_name(db, old_name, organization_id)
    if language:
        language.name = new_name.strip()
        db.commit()
        db.refresh(language)
    return language

def delete_language(db: Session, name: str, organization_id: str) -> bool:
    language = get_language_by_name(db, name, organization_id)
    if language:
        db.delete(language)
        db.commit()
        return True
    return False


# --- Song CRUD & Recalculation ---
def recalculate_song_numbers(db: Session, organization_id: str):
    """
    Fetches all songs from the database, sorts them alphabetically by title,
    updates their number field, and saves them.
    """
    songs = db.query(models.Song).filter(models.Song.organization_id == organization_id).all()
    # Sort case-insensitively, stripping whitespace
    songs.sort(key=lambda s: s.title.strip().lower())
    for index, song in enumerate(songs):
        song.number = index + 1
    db.commit()

def get_song(db: Session, song_id: str, organization_id: Optional[str] = None) -> Optional[models.Song]:
    query = db.query(models.Song).filter(models.Song.id == song_id)
    if organization_id:
        query = query.filter(models.Song.organization_id == organization_id)
    return query.first()

def get_song_by_number(db: Session, number: int, organization_id: str) -> Optional[models.Song]:
    return db.query(models.Song).filter(
        models.Song.organization_id == organization_id,
        models.Song.number == number
    ).first()

def get_songs(db: Session, organization_id: str) -> List[models.Song]:
    return db.query(models.Song).filter(models.Song.organization_id == organization_id).order_by(models.Song.number).all()

def create_song(db: Session, song_in: schemas.SongCreate, organization_id: str) -> models.Song:
    # Build relationships for categories
    db_categories = [get_or_create_category(db, cat_name, organization_id) for cat_name in song_in.categories]
    # Build relationships for languages
    db_languages = [get_or_create_language(db, lang_name, organization_id) for lang_name in song_in.languages]
    
    # We assign number=0 temporarily. It will be immediately recalculated.
    db_song = models.Song(
        title=song_in.title.strip(),
        lyrics=song_in.lyrics,
        transliteration=song_in.transliteration,
        audio_url=song_in.audio_url,
        organization_id=organization_id,
        number=0,
        categories=db_categories,
        languages=db_languages
    )
    db.add(db_song)
    db.commit()
    db.refresh(db_song)
    
    # Recalculate numbers for all songs to ensure alphabetical order
    recalculate_song_numbers(db, organization_id)
    
    return get_song(db, db_song.id, organization_id)

def update_song(db: Session, db_song: models.Song, song_in: schemas.SongUpdate) -> models.Song:
    update_data = song_in.model_dump(exclude_unset=True)
    
    # Handle basic fields
    for field in ["title", "lyrics", "transliteration", "audio_url"]:
        if field in update_data:
            val = update_data[field]
            if field == "title" and val is not None:
                val = val.strip()
            setattr(db_song, field, val)
            
    # Handle relationships if provided
    if "categories" in update_data and update_data["categories"] is not None:
        db_song.categories = [get_or_create_category(db, cat_name, db_song.organization_id) for cat_name in update_data["categories"]]
        
    if "languages" in update_data and update_data["languages"] is not None:
        db_song.languages = [get_or_create_language(db, lang_name, db_song.organization_id) for lang_name in update_data["languages"]]
        
    db.commit()
    db.refresh(db_song)
    
    # Recalculate numbers in case title changed
    if "title" in update_data:
        recalculate_song_numbers(db, db_song.organization_id)
        
    return get_song(db, db_song.id, db_song.organization_id)

def delete_song(db: Session, song_id: str, organization_id: str) -> bool:
    db_song = get_song(db, song_id, organization_id)
    if db_song:
        db.delete(db_song)
        db.commit()
        # Recalculate numbers
        recalculate_song_numbers(db, organization_id)
        return True
    return False


# --- Admin Emails CRUD ---
def get_admin_emails(db: Session, organization_id: Optional[str] = None) -> List[models.OrganizationAdmin]:
    organization = get_organization(db, organization_id) if organization_id else get_or_create_default_organization(db)
    return get_org_admins(db, organization.id)
