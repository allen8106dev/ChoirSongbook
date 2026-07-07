import os
from pydantic_settings import BaseSettings, SettingsConfigDict
from typing import Optional

class Settings(BaseSettings):
    PROJECT_NAME: str = "Choir Songbook Backend"
    DEBUG: bool = True
    API_V1_STR: str = "/api"
    
    # JWT security
    JWT_SECRET: str
    JWT_ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 1440
    
    # Database
    DATABASE_URL: str
    
    # Google Sign-In
    GOOGLE_CLIENT_ID: str
    
    # Storage
    STORAGE_PROVIDER: str = "local"
    UPLOAD_DIR: str = "uploads"
    
    # Supabase
    SUPABASE_URL: Optional[str] = ""
    SUPABASE_KEY: Optional[str] = ""
    SUPABASE_BUCKET: Optional[str] = "song-audio"
    
    # Primary developer email (always has developer access)
    DEVELOPER_EMAIL: str = "allen8106.dev@gmail.com"
    
    # Allowed CORS Origins (comma-separated list, e.g. "https://domain1.com,https://domain2.com")
    ALLOWED_ORIGINS: str = "*"

    
    model_config = SettingsConfigDict(
        env_file=os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), ".env"),
        env_file_encoding="utf-8",
        extra="ignore"
    )


settings = Settings()
