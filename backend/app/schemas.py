from datetime import datetime
from pydantic import BaseModel, ConfigDict, Field, EmailStr, field_validator, model_validator
from typing import Optional, List
from app.validation import (
    MAX_ORG_NAME, MAX_SONG_TITLE, MAX_CATEGORY_NAME,
    MAX_LANGUAGE_NAME, MAX_LYRICS, MAX_YOUTUBE_URL,
)

# --- Organization Schemas ---
class OrganizationBase(BaseModel):
    name: str = Field(..., min_length=1, max_length=MAX_ORG_NAME)

    @field_validator("name", mode="before")
    @classmethod
    def strip_name(cls, v: str) -> str:
        return v.strip() if isinstance(v, str) else v

class OrganizationCreate(OrganizationBase):
    pass

class OrganizationDeleteConfirm(BaseModel):
    confirm_name: str

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

class OrganizationPublicResponse(OrganizationBase):
    id: str
    song_count: int = 0
    
    model_config = ConfigDict(from_attributes=True)

# --- Category Schemas ---
class CategoryBase(BaseModel):
    name: str = Field(..., min_length=1, max_length=MAX_CATEGORY_NAME)

    @field_validator("name", mode="before")
    @classmethod
    def strip_name(cls, v: str) -> str:
        return v.strip() if isinstance(v, str) else v

class CategoryCreate(CategoryBase):
    pass

class CategoryResponse(CategoryBase):
    id: str
    
    model_config = ConfigDict(from_attributes=True)

# --- Language Schemas ---
class LanguageBase(BaseModel):
    name: str = Field(..., min_length=1, max_length=MAX_LANGUAGE_NAME)

    @field_validator("name", mode="before")
    @classmethod
    def strip_name(cls, v: str) -> str:
        return v.strip() if isinstance(v, str) else v

class LanguageCreate(LanguageBase):
    pass

class LanguageResponse(LanguageBase):
    id: str
    
    model_config = ConfigDict(from_attributes=True)

# --- Song Schemas ---
class SongBase(BaseModel):
    title: str = Field(..., min_length=1, max_length=MAX_SONG_TITLE)
    lyrics: str = Field(..., min_length=1, max_length=MAX_LYRICS)
    transliteration: Optional[str] = None
    audio_url: Optional[str] = Field(None, max_length=MAX_YOUTUBE_URL)

    @field_validator("title", mode="before")
    @classmethod
    def strip_title(cls, v: str) -> str:
        return v.strip() if isinstance(v, str) else v

    @field_validator("audio_url", mode="before")
    @classmethod
    def strip_audio_url(cls, v):
        if isinstance(v, str):
            v = v.strip()
            return v if v else None
        return v

class SongCreate(SongBase):
    categories: List[str] = []
    languages: List[str] = []

class SongUpdate(BaseModel):
    title: Optional[str] = Field(None, min_length=1, max_length=MAX_SONG_TITLE)
    lyrics: Optional[str] = Field(None, min_length=1, max_length=MAX_LYRICS)
    transliteration: Optional[str] = None
    audio_url: Optional[str] = Field(None, max_length=MAX_YOUTUBE_URL)
    categories: Optional[List[str]] = None
    languages: Optional[List[str]] = None

    @field_validator("title", mode="before")
    @classmethod
    def strip_title(cls, v):
        if isinstance(v, str):
            v = v.strip()
            return v if v else None
        return v

    @field_validator("audio_url", mode="before")
    @classmethod
    def strip_audio_url(cls, v):
        if isinstance(v, str):
            v = v.strip()
            return v if v else None
        return v

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
        if not isinstance(data, dict):
            cats = []
            if hasattr(data, "categories") and data.categories:
                cats = [c.name for c in data.categories]
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
                "updated_at": data.updated_at,
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
