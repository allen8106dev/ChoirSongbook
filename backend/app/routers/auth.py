from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app import schemas, auth
from app.database import get_db

router = APIRouter(prefix="/auth", tags=["Authentication"])

@router.post("/google", response_model=schemas.TokenResponse)
def login_google(payload: schemas.GoogleLoginRequest, db: Session = Depends(get_db)):
    """
    Exchanges a Google OAuth ID Token for a local session JWT.
    """
    id_info = auth.verify_google_id_token(payload.id_token)
    if not id_info:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid Google verification ID token."
        )
        
    email = id_info.get("email")
    name = id_info.get("name", email.split("@")[0].capitalize())
    
    if not email:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Google account does not expose email profile scope."
        )
        
    # Resolve the user's role in the system
    role = auth.resolve_user_role(email, db)
    
    # Create local access JWT token
    access_token = auth.create_access_token(subject=email)
    
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user": {
            "email": email,
            "role": role,
            "name": name
        }
    }

@router.post("/simulate", response_model=schemas.TokenResponse)
def login_simulate(payload: schemas.SimulateLoginRequest, db: Session = Depends(get_db)):
    """
    Simulates a login during development (bypasses Google Sign-In verification).
    Useful for local staging/role toggling.
    """
    email = payload.email.strip().lower()
    name = email.split("@")[0].capitalize()
    
    # Resolve the user's role
    role = auth.resolve_user_role(email, db)
    
    # Create local access token
    access_token = auth.create_access_token(subject=email)
    
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user": {
            "email": email,
            "role": role,
            "name": name
        }
    }
