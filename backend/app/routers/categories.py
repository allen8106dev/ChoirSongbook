from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from app import schemas, crud, auth
from app.database import get_db

router = APIRouter(prefix="/categories", tags=["Categories"])

@router.get("", response_model=List[schemas.CategoryResponse])
def read_categories(db: Session = Depends(get_db)):
    """
    Get all song categories.
    """
    return crud.get_categories(db)

@router.post("", response_model=schemas.CategoryResponse, status_code=status.HTTP_201_CREATED)
def create_category(
    category_in: schemas.CategoryCreate,
    db: Session = Depends(get_db),
    current_user: dict = Depends(auth.require_admin)
):
    """
    Create a new song category (restricted to Admin/Developer).
    """
    existing = crud.get_category_by_name(db, category_in.name)
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Category '{category_in.name}' already exists."
        )
    return crud.get_or_create_category(db, category_in.name)

@router.put("/{old_name}", response_model=schemas.CategoryResponse)
def rename_category(
    old_name: str,
    new_name_schema: schemas.CategoryCreate,
    db: Session = Depends(get_db),
    current_user: dict = Depends(auth.require_developer)
):
    """
    Rename a category globally across all songs (restricted to Developer).
    """
    # Check if category exists
    category = crud.get_category_by_name(db, old_name)
    if not category:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Category '{old_name}' not found."
        )
        
    # Check if new name is already taken
    existing_new = crud.get_category_by_name(db, new_name_schema.name)
    if existing_new and existing_new.id != category.id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Category '{new_name_schema.name}' already exists."
        )
        
    updated = crud.rename_category(db, old_name, new_name_schema.name)
    return updated

@router.delete("/{name}", status_code=status.HTTP_204_NO_CONTENT)
def delete_category(
    name: str,
    db: Session = Depends(get_db),
    current_user: dict = Depends(auth.require_developer)
):
    """
    Delete a category globally from all songs (restricted to Developer).
    """
    success = crud.delete_category(db, name)
    if not success:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Category '{name}' not found."
        )
    return
