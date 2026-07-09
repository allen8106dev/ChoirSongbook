import uuid
from datetime import datetime
from sqlalchemy import Table, Column, String, Integer, Text, DateTime, ForeignKey, UniqueConstraint
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
    __table_args__ = (UniqueConstraint("organization_id", "name", name="uq_categories_org_name"),)
    
    id = Column(String(36), primary_key=True, default=generate_uuid)
    organization_id = Column(String(36), ForeignKey("organizations.id", ondelete="CASCADE"), nullable=False, index=True)
    name = Column(String(100), nullable=False, index=True)
    
    # Relationship back to songs
    organization = relationship("Organization", back_populates="categories")
    songs = relationship("Song", secondary=song_categories, back_populates="categories")

class Language(Base):
    __tablename__ = "languages"
    __table_args__ = (UniqueConstraint("organization_id", "name", name="uq_languages_org_name"),)
    
    id = Column(String(36), primary_key=True, default=generate_uuid)
    organization_id = Column(String(36), ForeignKey("organizations.id", ondelete="CASCADE"), nullable=False, index=True)
    name = Column(String(100), nullable=False, index=True)
    
    # Relationship back to songs
    organization = relationship("Organization", back_populates="languages")
    songs = relationship("Song", secondary=song_languages, back_populates="languages")

class Organization(Base):
    __tablename__ = "organizations"
    
    id = Column(String(36), primary_key=True, default=generate_uuid)
    name = Column(String(255), nullable=False, index=True)
    owner_email = Column(String(255), nullable=False, index=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    admins = relationship("OrganizationAdmin", back_populates="organization", cascade="all, delete-orphan")
    songs = relationship("Song", back_populates="organization", cascade="all, delete-orphan")
    categories = relationship("Category", back_populates="organization", cascade="all, delete-orphan")
    languages = relationship("Language", back_populates="organization", cascade="all, delete-orphan")

class OrganizationAdmin(Base):
    __tablename__ = "organization_admins"
    __table_args__ = (UniqueConstraint("organization_id", "email", name="uq_organization_admin_email"),)
    
    id = Column(String(36), primary_key=True, default=generate_uuid)
    organization_id = Column(String(36), ForeignKey("organizations.id", ondelete="CASCADE"), nullable=False, index=True)
    email = Column(String(255), nullable=False, index=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    organization = relationship("Organization", back_populates="admins")

class Song(Base):
    __tablename__ = "songs"
    
    id = Column(String(36), primary_key=True, default=generate_uuid)
    organization_id = Column(String(36), ForeignKey("organizations.id", ondelete="CASCADE"), nullable=False, index=True)
    number = Column(Integer, nullable=False, index=True)
    title = Column(String(255), nullable=False, index=True)
    lyrics = Column(Text, nullable=False)
    transliteration = Column(Text, nullable=True)
    audio_url = Column(String(1024), nullable=True)
    
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships (Many-to-Many)
    organization = relationship("Organization", back_populates="songs")
    categories = relationship("Category", secondary=song_categories, back_populates="songs")
    languages = relationship("Language", secondary=song_languages, back_populates="songs")

class AdminEmail(Base):
    __tablename__ = "admin_emails"
    
    email = Column(String(255), primary_key=True, index=True)
    created_at = Column(DateTime, default=datetime.utcnow)

class Favourite(Base):
    __tablename__ = "favourites"
    
    id = Column(String(36), primary_key=True, default=generate_uuid)
    user_email = Column(String(255), nullable=False, index=True)
    song_id = Column(String(36), ForeignKey("songs.id", ondelete="CASCADE"), nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)
