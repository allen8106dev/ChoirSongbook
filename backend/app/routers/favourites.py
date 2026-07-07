from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database import get_db
from app.auth import get_current_user
from app.models import Favourite, Song

router = APIRouter(prefix="/favourites", tags=["favourites"])


@router.get("")
def get_favourites(
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Return list of song IDs favourited by the current user."""
    email = current_user["email"]
    rows = db.query(Favourite).filter(Favourite.user_email == email).all()
    return [row.song_id for row in rows]


@router.post("/{song_id}")
def add_favourite(
    song_id: str,
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Add a song to the current user's favourites (idempotent)."""
    email = current_user["email"]

    # Verify song exists
    song = db.query(Song).filter(Song.id == song_id).first()
    if not song:
        raise HTTPException(status_code=404, detail="Song not found")

    # Already favourited?
    existing = db.query(Favourite).filter(
        Favourite.user_email == email,
        Favourite.song_id == song_id,
    ).first()
    if existing:
        return {"status": "already_favourited", "song_id": song_id}

    fav = Favourite(user_email=email, song_id=song_id)
    db.add(fav)
    db.commit()
    return {"status": "added", "song_id": song_id}


@router.delete("/{song_id}")
def remove_favourite(
    song_id: str,
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Remove a song from the current user's favourites."""
    email = current_user["email"]
    fav = db.query(Favourite).filter(
        Favourite.user_email == email,
        Favourite.song_id == song_id,
    ).first()
    if fav:
        db.delete(fav)
        db.commit()
    return {"status": "removed", "song_id": song_id}
