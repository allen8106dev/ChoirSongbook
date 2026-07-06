import os
import shutil
import uuid
from fastapi import UploadFile
from app.config import settings

class StorageProvider:
    def save_file(self, file: UploadFile) -> str:
        """
        Saves file and returns the accessible URL path.
        """
        raise NotImplementedError()

    def delete_file(self, file_path: str) -> None:
        """
        Deletes the file from storage.
        """
        raise NotImplementedError()

class LocalStorageProvider(StorageProvider):
    def __init__(self, upload_dir: str = settings.UPLOAD_DIR):
        self.upload_dir = upload_dir
        # Ensure uploads folder exists
        if not os.path.exists(self.upload_dir):
            os.makedirs(self.upload_dir)

    def save_file(self, file: UploadFile) -> str:
        # Create a secure unique file name
        file_extension = os.path.splitext(file.filename)[1]
        unique_filename = f"song_{uuid.uuid4().hex}{file_extension}"
        dest_path = os.path.join(self.upload_dir, unique_filename)
        
        # Save file bytes
        with open(dest_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
            
        # Return relative URL path
        return f"/uploads/{unique_filename}"

    def delete_file(self, file_path: str) -> None:
        if file_path.startswith("/uploads/"):
            filename = file_path.replace("/uploads/", "")
            target_path = os.path.join(self.upload_dir, filename)
            if os.path.exists(target_path):
                os.remove(target_path)

class SupabaseStorageProvider(StorageProvider):
    def __init__(self):
        # We check credentials dynamically. If missing, we fallback to Local
        self.enabled = bool(settings.SUPABASE_URL and settings.SUPABASE_KEY)
        if self.enabled:
            try:
                from supabase import create_client
                self.client = create_client(settings.SUPABASE_URL, settings.SUPABASE_KEY)
            except ImportError:
                print("Supabase package is not installed. Run 'pip install supabase'. Falling back to local.")
                self.enabled = False

    def save_file(self, file: UploadFile) -> str:
        if not self.enabled:
            # Fallback to local storage provider
            return LocalStorageProvider().save_file(file)
            
        file_extension = os.path.splitext(file.filename)[1]
        unique_filename = f"song_{uuid.uuid4().hex}{file_extension}"
        
        # Read file bytes
        file_bytes = file.file.read()
        
        # Upload to Supabase bucket
        # Expects bucket settings.SUPABASE_BUCKET to exist and be public
        res = self.client.storage.from_(settings.SUPABASE_BUCKET).upload(
            path=unique_filename,
            file=file_bytes,
            file_options={"content-type": file.content_type}
        )
        
        # Get public URL
        url = self.client.storage.from_(settings.SUPABASE_BUCKET).get_public_url(unique_filename)
        return url

    def delete_file(self, file_path: str) -> None:
        if not self.enabled:
            return LocalStorageProvider().delete_file(file_path)
            
        # Extract filename from URL
        # Supabase URLs end with bucketname/filename
        filename = file_path.split("/")[-1]
        try:
            self.client.storage.from_(settings.SUPABASE_BUCKET).remove([filename])
        except Exception as e:
            print(f"Supabase delete file error: {e}")

# Helper factory to resolve the active storage provider
def get_storage_provider() -> StorageProvider:
    if settings.STORAGE_PROVIDER.lower() == "supabase":
        return SupabaseStorageProvider()
    return LocalStorageProvider()
