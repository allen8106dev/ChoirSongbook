from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from app import schemas, crud, auth
from app.database import get_db

router = APIRouter(prefix="/organizations", tags=["Organizations"])


@router.get("", response_model=List[schemas.OrganizationResponse])
def read_organizations(
    db: Session = Depends(get_db),
    current_user: dict = Depends(auth.get_current_user)
):
    """
    Return organizations the current user administers. Developers can see every organization.
    """
    if not current_user.get("email") or current_user["email"] == "guest@choir.org":
        return []
    return auth.get_user_organization_payloads(current_user["email"], db)


@router.post("", response_model=schemas.OrganizationResponse, status_code=status.HTTP_201_CREATED)
def create_organization(
    organization_in: schemas.OrganizationCreate,
    db: Session = Depends(get_db),
    current_user: dict = Depends(auth.get_current_user)
):
    """
    Create an organization owned by the signed-in user and make them its first admin.
    """
    if not current_user.get("email") or current_user["email"] == "guest@choir.org":
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Sign in with Google before creating an organization."
        )
    organization = crud.create_organization(db, organization_in.name, current_user["email"])
    return auth.serialize_organization(db, organization)
