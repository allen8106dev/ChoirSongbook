from fastapi import APIRouter, Depends, HTTPException, status, File, UploadFile, Query
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session
from typing import List
from app import schemas, crud, auth
from app.database import get_db
from app.storage import get_storage_provider
from app.pdf_generator import generate_songbook_pdf

router = APIRouter(prefix="/songs", tags=["Songs"])

@router.get("", response_model=List[schemas.SongResponse])
def read_songs(db: Session = Depends(get_db)):
    """
    Get all songs in the songbook (auto-sorted alphabetically and numbered).
    """
    return crud.get_songs(db)

@router.get("/pdf", response_class=StreamingResponse)
def export_songbook_pdf(
    search: str = None,
    categories: List[str] = Query(None),
    languages: List[str] = Query(None),
    filter_mode: str = Query("any"),
    db: Session = Depends(get_db)
):
    """
    Export the songbook as a professionally styled printable PDF (context-aware of search/category/language filters).
    """
    if filter_mode not in {"any", "all"}:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="filter_mode must be either 'any' or 'all'."
        )

    songs = crud.get_songs(db)

    def matches_selected_values(selected_values: List[str], song_values: List[str]) -> bool:
        if not selected_values:
            return True
        if filter_mode == "all":
            return all(value in song_values for value in selected_values)
        return any(value in song_values for value in selected_values)
    
    # Apply search, language, category filters
    filtered_songs = []
    for song in songs:
        # 1. Search Query Filter
        if search:
            query = search.strip().lower()
            matches_title = query in song.title.lower()
            matches_lyrics = query in song.lyrics.lower()
            matches_trans = query in (song.transliteration or "").lower()
            matches_lang = any(query in l.name.lower() for l in song.languages)
            matches_cat = any(query in c.name.lower() for c in song.categories)
            
            if not (matches_title or matches_lyrics or matches_trans or matches_lang or matches_cat):
                continue
                
        # 2. Languages Filter
        song_lang_names = [l.name for l in song.languages]
        if not matches_selected_values(languages or [], song_lang_names):
            continue

        # 3. Categories Filter
        song_cat_names = [c.name for c in song.categories]
        if not matches_selected_values(categories or [], song_cat_names):
            continue
                
        filtered_songs.append(song)
        
    if not filtered_songs:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No songs match the active filter criteria."
        )
        
    pdf_buffer = generate_songbook_pdf(filtered_songs)
    return StreamingResponse(
        pdf_buffer,
        media_type="application/pdf",
        headers={"Content-Disposition": "inline; filename=choir_songbook.pdf"}
    )


@router.get("/{id_or_number}", response_model=schemas.SongResponse)
def read_song(id_or_number: str, db: Session = Depends(get_db)):

    """
    Retrieve a song by its unique UUID ID or its sequential alphabetical song number.
    """
    song = None
    if id_or_number.isdigit():
        song = crud.get_song_by_number(db, int(id_or_number))
    else:
        song = crud.get_song(db, id_or_number)
        
    if not song:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Song not found with identifier '{id_or_number}'."
        )
    return song

@router.post("", response_model=schemas.SongResponse, status_code=status.HTTP_201_CREATED)
def create_song(
    song_in: schemas.SongCreate, 
    db: Session = Depends(get_db),
    current_user: dict = Depends(auth.require_admin)
):
    """
    Add a new song to the songbook (restricted to Admin/Developer).
    Automatically recalculates all song numbers alphabetically.
    """
    return crud.create_song(db, song_in)

@router.put("/{id}", response_model=schemas.SongResponse)
def update_song(
    id: str,
    song_in: schemas.SongUpdate,
    db: Session = Depends(get_db),
    current_user: dict = Depends(auth.require_admin)
):
    """
    Update an existing song (restricted to Admin/Developer).
    Automatically recalculates all song numbers alphabetically if the title changes.
    """
    db_song = crud.get_song(db, id)
    if not db_song:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Song not found with ID '{id}'."
        )

    return crud.update_song(db, db_song, song_in)

@router.delete("/{id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_song(
    id: str,
    db: Session = Depends(get_db),
    current_user: dict = Depends(auth.require_admin)
):
    """
    Delete a song from the songbook (restricted to Admin/Developer).
    Automatically recalculates all song numbers alphabetically.
    """
    success = crud.delete_song(db, id)
    if not success:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Song not found with ID '{id}'."
        )
    return

@router.post("/{id}/audio", response_model=schemas.SongResponse)
def upload_song_audio(
    id: str,
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: dict = Depends(auth.require_admin)
):
    """
    Upload reference audio MP3 for a song (restricted to Admin/Developer).
    Cleans up old reference file if present.
    """
    db_song = crud.get_song(db, id)
    if not db_song:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Song not found with ID '{id}'."
        )
        
    # Validation: restrict to MP3 files
    if not file.filename.lower().endswith(".mp3"):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Only MP3 reference tracks are permitted."
        )
        
    # Get active storage provider
    storage_provider = get_storage_provider()
    
    # If the song already has an audio_url, delete the old file to clean up disk/cloud storage
    if db_song.audio_url:
        storage_provider.delete_file(db_song.audio_url)
        
    # Save the new file
    audio_path = storage_provider.save_file(file)
    
    # Update song database record
    update_schema = schemas.SongUpdate(audio_url=audio_path)
    return crud.update_song(db, db_song, update_schema)

