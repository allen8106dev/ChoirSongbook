import uuid
from datetime import datetime
from sqlalchemy import Table, Column, String, Integer, Text, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from app.database import Base

def generate_uuid():
    return str(uuid.uuid4())

# Association Table for Song <-> Category (Many-to-Many)
song_categories = Table(
    "song_categories",
    Base.metadata,
    Column("song_id", String(36), ForeignKey("songs.id", ondelete="CASCADE"), primary_key=True),
    Column("category_id", String(36), ForeignKey("categories.id", ondelete="CASCADE"), primary_key=True)
)

# Association Table for Song <-> Language (Many-to-Many)
song_languages = Table(
    "song_languages",
    Base.metadata,
    Column("song_id", String(36), ForeignKey("songs.id", ondelete="CASCADE"), primary_key=True),
    Column("language_id", String(36), ForeignKey("languages.id", ondelete="CASCADE"), primary_key=True)
)

class Category(Base):
    __tablename__ = "categories"
    
    id = Column(String(36), primary_key=True, default=generate_uuid)
    name = Column(String(100), unique=True, nullable=False, index=True)
    
    # Relationship back to songs
    songs = relationship("Song", secondary=song_categories, back_populates="categories")

class Language(Base):
    __tablename__ = "languages"
    
    id = Column(String(36), primary_key=True, default=generate_uuid)
    name = Column(String(100), unique=True, nullable=False, index=True)
    
    # Relationship back to songs
    songs = relationship("Song", secondary=song_languages, back_populates="languages")

class Song(Base):
    __tablename__ = "songs"
    
    id = Column(String(36), primary_key=True, default=generate_uuid)
    number = Column(Integer, nullable=False, index=True)
    title = Column(String(255), nullable=False, index=True)
    lyrics = Column(Text, nullable=False)
    transliteration = Column(Text, nullable=True)
    audio_url = Column(String(1024), nullable=True)
    
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships (Many-to-Many)
    categories = relationship("Category", secondary=song_categories, back_populates="songs")
    languages = relationship("Language", secondary=song_languages, back_populates="songs")

class AdminEmail(Base):
    __tablename__ = "admin_emails"
    
    email = Column(String(255), primary_key=True, index=True)
    created_at = Column(DateTime, default=datetime.utcnow)
