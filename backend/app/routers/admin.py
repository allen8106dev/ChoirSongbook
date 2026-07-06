from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from app import schemas, crud, auth
from app.database import get_db

router = APIRouter(prefix="/admin", tags=["Developer Admin Management"])

@router.get("/emails", response_model=List[schemas.AdminEmailResponse])
def read_admin_emails(
    db: Session = Depends(get_db),
    current_user: dict = Depends(auth.require_developer)
):
    """
    Get all approved admin emails (restricted to Developer).
    """
    return crud.get_admin_emails(db)

@router.post("/emails", response_model=schemas.AdminEmailResponse, status_code=status.HTTP_201_CREATED)
def create_admin_email(
    admin_in: schemas.AdminEmailCreate,
    db: Session = Depends(get_db),
    current_user: dict = Depends(auth.require_developer)
):
    """
    Approve a new admin email (restricted to Developer).
    """
    email_clean = admin_in.email.strip().lower()
    
    # Check if primary developer email is being added
    if email_clean == auth.settings.DEVELOPER_EMAIL.strip().lower():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="The primary developer email is approved by default."
        )
        
    return crud.add_admin_email(db, email_clean)

@router.delete("/emails/{email}", status_code=status.HTTP_204_NO_CONTENT)
def delete_admin_email(
    email: str,
    db: Session = Depends(get_db),
    current_user: dict = Depends(auth.require_developer)
):
    """
    Revoke admin privileges for an email (restricted to Developer).
    """
    email_clean = email.strip().lower()
    
    if email_clean == auth.settings.DEVELOPER_EMAIL.strip().lower():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot revoke privileges for the primary developer email."
        )
        
    success = crud.remove_admin_email(db, email_clean)
    if not success:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Email '{email}' is not in the approved admin list."
        )

    return
