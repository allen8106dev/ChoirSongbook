from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from app import schemas, crud, auth, models
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


@router.get("/{organization_id}/public", response_model=schemas.OrganizationPublicResponse)
def read_public_organization(
    organization_id: str,
    db: Session = Depends(get_db)
):
    """
    Public organization metadata for shared songbook links.
    """
    organization = crud.get_organization(db, organization_id)
    if not organization:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Organization not found."
        )
    return {
        "id": organization.id,
        "name": organization.name,
        "song_count": db.query(models.Song).filter(models.Song.organization_id == organization.id).count(),
    }


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
    existing = crud.get_owned_organization(db, current_user["email"])
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="This account already created an organization."
        )
    organization = crud.create_organization(db, organization_in.name, current_user["email"])
    return auth.serialize_organization(db, organization)


@router.delete("/{organization_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_organization(
    organization_id: str,
    payload: schemas.OrganizationDeleteConfirm,
    db: Session = Depends(get_db),
    current_user: dict = Depends(auth.require_developer)
):
    """
    Developer-only organization deletion. Requires exact organization name confirmation.
    """
    organization = crud.get_organization(db, organization_id)
    if not organization:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Organization not found."
        )
    if payload.confirm_name.strip() != organization.name:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Confirmation name does not match the organization name."
        )
    db.delete(organization)
    db.commit()
    return
