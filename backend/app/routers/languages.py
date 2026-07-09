from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from app import schemas, crud, auth
from app.database import get_db

router = APIRouter(prefix="/languages", tags=["Languages"])

@router.get("", response_model=List[schemas.LanguageResponse])
def read_languages(
    db: Session = Depends(get_db),
    organization = Depends(auth.get_active_organization)
):
    """
    Get all song languages.
    """
    return crud.get_languages(db, organization.id)

@router.post("", response_model=schemas.LanguageResponse, status_code=status.HTTP_201_CREATED)
def create_language(
    language_in: schemas.LanguageCreate,
    db: Session = Depends(get_db),
    current_user: dict = Depends(auth.require_org_admin)
):
    """
    Create a new song language (restricted to Admin/Developer).
    """
    existing = crud.get_language_by_name(db, language_in.name, current_user["organization_id"])
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Language '{language_in.name}' already exists."
        )
    return crud.get_or_create_language(db, language_in.name, current_user["organization_id"])

@router.put("/{old_name}", response_model=schemas.LanguageResponse)
def rename_language(
    old_name: str,
    new_name_schema: schemas.LanguageCreate,
    db: Session = Depends(get_db),
    current_user: dict = Depends(auth.require_org_admin)
):
    """
    Rename a language globally across all songs (restricted to Developer).
    """
    # Check if language exists
    language = crud.get_language_by_name(db, old_name, current_user["organization_id"])
    if not language:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Language '{old_name}' not found."
        )
        
    # Check if new name is already taken
    existing_new = crud.get_language_by_name(db, new_name_schema.name, current_user["organization_id"])
    if existing_new and existing_new.id != language.id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Language '{new_name_schema.name}' already exists."
        )
        
    updated = crud.rename_language(db, old_name, new_name_schema.name, current_user["organization_id"])
    return updated

@router.delete("/{name}", status_code=status.HTTP_204_NO_CONTENT)
def delete_language(
    name: str,
    db: Session = Depends(get_db),
    current_user: dict = Depends(auth.require_org_admin)
):
    """
    Delete a language globally from all songs (restricted to Developer).
    """
    success = crud.delete_language(db, name, current_user["organization_id"])
    if not success:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Language '{name}' not found."
        )
    return
