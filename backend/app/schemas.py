from datetime import datetime
from pydantic import BaseModel, ConfigDict, Field, EmailStr, model_validator
from typing import Optional, List

# --- Organization Schemas ---
class OrganizationBase(BaseModel):
    name: str = Field(..., min_length=1, max_length=255)

class OrganizationCreate(OrganizationBase):
    pass

class OrganizationAdminCreate(BaseModel):
    email: EmailStr

class OrganizationAdminResponse(BaseModel):
    email: str
    created_at: datetime
    
    model_config = ConfigDict(from_attributes=True)

class OrganizationResponse(OrganizationBase):
    id: str
    owner_email: str
    created_at: datetime
    admins: List[OrganizationAdminResponse] = []
    song_count: int = 0
    
    model_config = ConfigDict(from_attributes=True)

# --- Category Schemas ---
class CategoryBase(BaseModel):
    name: str = Field(..., min_length=1, max_length=100)

class CategoryCreate(CategoryBase):
    pass

class CategoryResponse(CategoryBase):
    id: str
    
    model_config = ConfigDict(from_attributes=True)

# --- Language Schemas ---
class LanguageBase(BaseModel):
    name: str = Field(..., min_length=1, max_length=100)

class LanguageCreate(LanguageBase):
    pass

class LanguageResponse(LanguageBase):
    id: str
    
    model_config = ConfigDict(from_attributes=True)

# --- Song Schemas ---
class SongBase(BaseModel):
    title: str = Field(..., min_length=1, max_length=255)
    lyrics: str = Field(..., min_length=1)
    transliteration: Optional[str] = None
    audio_url: Optional[str] = None

class SongCreate(SongBase):
    categories: List[str] = []
    languages: List[str] = []

class SongUpdate(BaseModel):
    title: Optional[str] = None
    lyrics: Optional[str] = None
    transliteration: Optional[str] = None
    audio_url: Optional[str] = None
    categories: Optional[List[str]] = None
    languages: Optional[List[str]] = None

class SongResponse(SongBase):
    id: str
    organization_id: str
    number: int
    categories: List[str] = []
    languages: List[str] = []
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)
    
    @model_validator(mode="before")
    @classmethod
    def convert_relations(cls, data):
        # Check if data is an SQLAlchemy model instance (has categories/languages relation attributes)
        if not isinstance(data, dict):
            # Safe extraction of category names
            cats = []
            if hasattr(data, "categories") and data.categories:
                cats = [c.name for c in data.categories]
                
            # Safe extraction of language names
            langs = []
            if hasattr(data, "languages") and data.languages:
                langs = [l.name for l in data.languages]
                
            return {
                "id": data.id,
                "organization_id": data.organization_id,
                "number": data.number,
                "title": data.title,
                "lyrics": data.lyrics,
                "transliteration": data.transliteration,
                "audio_url": data.audio_url,
                "categories": cats,
                "languages": langs,
                "created_at": data.created_at,
                "updated_at": data.updated_at
            }
        return data

# --- Admin Email Schemas ---
class AdminEmailCreate(BaseModel):
    email: EmailStr

class AdminEmailResponse(BaseModel):
    email: str
    created_at: datetime
    
    model_config = ConfigDict(from_attributes=True)

# --- Auth Schemas ---
class SimulateLoginRequest(BaseModel):
    email: EmailStr

class GoogleLoginRequest(BaseModel):
    id_token: str

class UserResponse(BaseModel):
    email: str
    role: str
    name: Optional[str] = None
    organizations: List[OrganizationResponse] = []

class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserResponse
