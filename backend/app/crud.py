from sqlalchemy.orm import Session
from sqlalchemy import func
from app import models, schemas
from typing import List, Optional

# --- Category CRUD ---
def get_categories(db: Session) -> List[models.Category]:
    return db.query(models.Category).order_by(models.Category.name).all()

def get_category_by_name(db: Session, name: str) -> Optional[models.Category]:
    return db.query(models.Category).filter(func.lower(models.Category.name) == name.lower()).first()

def get_or_create_category(db: Session, name: str) -> models.Category:
    category = get_category_by_name(db, name)
    if not category:
        category = models.Category(name=name.strip())
        db.add(category)
        db.commit()
        db.refresh(category)
    return category

def rename_category(db: Session, old_name: str, new_name: str) -> Optional[models.Category]:
    category = get_category_by_name(db, old_name)
    if category:
        category.name = new_name.strip()
        db.commit()
        db.refresh(category)
    return category

def delete_category(db: Session, name: str) -> bool:
    category = get_category_by_name(db, name)
    if category:
        db.delete(category)
        db.commit()
        return True
    return False


# --- Language CRUD ---
def get_languages(db: Session) -> List[models.Language]:
    return db.query(models.Language).order_by(models.Language.name).all()

def get_language_by_name(db: Session, name: str) -> Optional[models.Language]:
    return db.query(models.Language).filter(func.lower(models.Language.name) == name.lower()).first()

def get_or_create_language(db: Session, name: str) -> models.Language:
    language = get_language_by_name(db, name)
    if not language:
        language = models.Language(name=name.strip())
        db.add(language)
        db.commit()
        db.refresh(language)
    return language

def rename_language(db: Session, old_name: str, new_name: str) -> Optional[models.Language]:
    language = get_language_by_name(db, old_name)
    if language:
        language.name = new_name.strip()
        db.commit()
        db.refresh(language)
    return language

def delete_language(db: Session, name: str) -> bool:
    language = get_language_by_name(db, name)
    if language:
        db.delete(language)
        db.commit()
        return True
    return False


# --- Song CRUD & Recalculation ---
def recalculate_song_numbers(db: Session):
    """
    Fetches all songs from the database, sorts them alphabetically by title,
    updates their number field, and saves them.
    """
    songs = db.query(models.Song).all()
    # Sort case-insensitively, stripping whitespace
    songs.sort(key=lambda s: s.title.strip().lower())
    for index, song in enumerate(songs):
        song.number = index + 1
    db.commit()

def get_song(db: Session, song_id: str) -> Optional[models.Song]:
    return db.query(models.Song).filter(models.Song.id == song_id).first()

def get_song_by_number(db: Session, number: int) -> Optional[models.Song]:
    return db.query(models.Song).filter(models.Song.number == number).first()

def get_songs(db: Session) -> List[models.Song]:
    return db.query(models.Song).order_by(models.Song.number).all()

def create_song(db: Session, song_in: schemas.SongCreate) -> models.Song:
    # Build relationships for categories
    db_categories = [get_or_create_category(db, cat_name) for cat_name in song_in.categories]
    # Build relationships for languages
    db_languages = [get_or_create_language(db, lang_name) for lang_name in song_in.languages]
    
    # We assign number=0 temporarily. It will be immediately recalculated.
    db_song = models.Song(
        title=song_in.title.strip(),
        lyrics=song_in.lyrics,
        transliteration=song_in.transliteration,
        audio_url=song_in.audio_url,
        number=0,
        categories=db_categories,
        languages=db_languages
    )
    db.add(db_song)
    db.commit()
    db.refresh(db_song)
    
    # Recalculate numbers for all songs to ensure alphabetical order
    recalculate_song_numbers(db)
    
    return get_song(db, db_song.id)

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
        db_song.categories = [get_or_create_category(db, cat_name) for cat_name in update_data["categories"]]
        
    if "languages" in update_data and update_data["languages"] is not None:
        db_song.languages = [get_or_create_language(db, lang_name) for lang_name in update_data["languages"]]
        
    db.commit()
    db.refresh(db_song)
    
    # Recalculate numbers in case title changed
    if "title" in update_data:
        recalculate_song_numbers(db)
        
    return get_song(db, db_song.id)

def delete_song(db: Session, song_id: str) -> bool:
    db_song = get_song(db, song_id)
    if db_song:
        db.delete(db_song)
        db.commit()
        # Recalculate numbers
        recalculate_song_numbers(db)
        return True
    return False


# --- Admin Emails CRUD ---
def get_admin_emails(db: Session) -> List[models.AdminEmail]:
    return db.query(models.AdminEmail).all()

def add_admin_email(db: Session, email: str) -> models.AdminEmail:
    email_clean = email.strip().lower()
    admin_email = db.query(models.AdminEmail).filter(models.AdminEmail.email == email_clean).first()
    if not admin_email:
        admin_email = models.AdminEmail(email=email_clean)
        db.add(admin_email)
        db.commit()
        db.refresh(admin_email)
    return admin_email

def remove_admin_email(db: Session, email: str) -> bool:
    email_clean = email.strip().lower()
    admin_email = db.query(models.AdminEmail).filter(models.AdminEmail.email == email_clean).first()
    if admin_email:
        db.delete(admin_email)
        db.commit()
        return True
    return False
