from datetime import datetime, timedelta
from typing import Optional, Dict, List
from fastapi import Depends, Header, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from jose import JWTError, jwt
from sqlalchemy.orm import Session
from google.oauth2 import id_token
from google.auth.transport import requests as google_requests

from app.config import settings
from app.database import get_db
from app import models
from app import crud

# Use standard OAuth2 Bearer token scheme
oauth2_scheme = OAuth2PasswordBearer(tokenUrl=f"{settings.API_V1_STR}/auth/login", auto_error=False)

def create_access_token(subject: str, expires_delta: Optional[timedelta] = None) -> str:
    """
    Generate JWT access token for a given user email (subject).
    """
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    
    to_encode = {"exp": expire, "sub": str(subject)}
    encoded_jwt = jwt.encode(to_encode, settings.JWT_SECRET, algorithm=settings.JWT_ALGORITHM)
    return encoded_jwt

def verify_google_id_token(token: str) -> Optional[Dict]:
    """
    Verify Google ID Token against Google Auth API.
    Returns token payload (dict) if valid, None otherwise.
    """
    try:
        # Verify token using Google's verification library
        idinfo = id_token.verify_oauth2_token(
            token, 
            google_requests.Request(), 
            settings.GOOGLE_CLIENT_ID
        )
        # Check issuer
        if idinfo["iss"] not in ["accounts.google.com", "https://accounts.google.com"]:
            return None
        return idinfo
    except Exception as e:
        print(f"Google Token Verification Error: {e}")
        return None

def resolve_user_role(email: str, db: Session) -> str:
    """
    Resolves the access role for a given email address.
    """
    email_clean = email.strip().lower()
    
    # Primary developer email bypass
    if email_clean == settings.DEVELOPER_EMAIL.strip().lower():
        return "developer"
        
    # Query organization admin memberships
    db_admin = db.query(models.OrganizationAdmin).filter(models.OrganizationAdmin.email == email_clean).first()
    if db_admin:
        return "admin"
        
    return "viewer"

def get_current_user(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)) -> Dict:
    """
    Dependency to validate JWT access token and retrieve current user context.
    """
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    
    if not token:
        # Fallback to guest viewer if no token is provided
        return {"email": "guest@choir.org", "role": "viewer", "name": "Guest Viewer"}
        
    try:
        payload = jwt.decode(token, settings.JWT_SECRET, algorithms=[settings.JWT_ALGORITHM])
        email: str = payload.get("sub")
        if email is None:
            raise credentials_exception
    except JWTError:
        raise credentials_exception
        
    # Resolve current role dynamically based on current configuration/database state
    role = resolve_user_role(email, db)
    
    return {"email": email, "role": role, "name": email.split("@")[0].capitalize()}

def is_developer(email: str) -> bool:
    return email.strip().lower() == settings.DEVELOPER_EMAIL.strip().lower()

def serialize_organization(db: Session, organization: models.Organization) -> Dict:
    return {
        "id": organization.id,
        "name": organization.name,
        "owner_email": organization.owner_email,
        "created_at": organization.created_at,
        "admins": crud.get_org_admins(db, organization.id),
        "song_count": db.query(models.Song).filter(models.Song.organization_id == organization.id).count(),
    }

def get_user_organization_payloads(email: str, db: Session) -> List[Dict]:
    if is_developer(email):
        organizations = crud.get_all_organizations(db)
    else:
        organizations = crud.get_user_organizations(db, email)
    return [serialize_organization(db, org) for org in organizations]

def require_admin(current_user: Dict = Depends(get_current_user)) -> Dict:
    """
    Enforces that the authenticated user is at least an Admin (Admin or Developer).
    """
    if current_user["role"] not in ["admin", "developer"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Operation restricted to Admin or Developer accounts."
        )
    return current_user

def get_active_organization(
    x_organization_id: Optional[str] = Header(default=None, alias="X-Organization-ID"),
    db: Session = Depends(get_db)
) -> models.Organization:
    """
    Resolve the organization for this request.
    Missing header falls back to the migrated default church organization for compatibility.
    """
    if x_organization_id:
        organization = crud.get_organization(db, x_organization_id)
    else:
        organization = crud.get_or_create_default_organization(db)
        
    if not organization:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Organization not found."
        )
    return organization

def require_org_admin(
    current_user: Dict = Depends(get_current_user),
    organization: models.Organization = Depends(get_active_organization),
    db: Session = Depends(get_db)
) -> Dict:
    """
    Enforces admin access for the active organization. Developers bypass membership.
    """
    if current_user["role"] == "developer" or crud.is_org_admin(db, current_user["email"], organization.id):
        return {**current_user, "organization_id": organization.id}
    raise HTTPException(
        status_code=status.HTTP_403_FORBIDDEN,
        detail="Operation restricted to admins for this organization."
    )

def require_developer(current_user: Dict = Depends(get_current_user)) -> Dict:
    """
    Enforces that the authenticated user is a Developer.
    """
    if current_user["role"] != "developer":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Operation restricted to Developer accounts."
        )
    return current_user
