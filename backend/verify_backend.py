import os
import sys

# Ensure backend directory is in python path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from app.main import app
from app.database import Base, get_db
from app import models

# Use a clean test-specific SQLite database
TEST_DB_FILE = "./test_choir_songbook.db"
TEST_DATABASE_URL = f"sqlite:///{TEST_DB_FILE}"

# Remove existing test DB if it exists
if os.path.exists(TEST_DB_FILE):
    os.remove(TEST_DB_FILE)

# Setup test database engine
engine = create_engine(TEST_DATABASE_URL, connect_args={"check_same_thread": False})
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Dependency override
def override_get_db():
    db = TestingSessionLocal()
    try:
        yield db
    finally:
        db.close()

app.dependency_overrides[get_db] = override_get_db

# Create test tables
Base.metadata.create_all(bind=engine)

client = TestClient(app)

def run_tests():
    print("==============================================")
    print("STARTING BACKEND & DATABASE INTEGRATION TESTS")
    print("==============================================")
    
    # --- 1. Health Check ---
    print("\n1. Testing health check...")
    response = client.get("/api/health")
    assert response.status_code == 200
    assert response.json()["status"] == "ok"
    print("   [PASS] Health check OK.")
    
    # --- 2. Auth Simulation ---
    print("\n2. Testing authentication simulation...")
    # Test developer login
    dev_email = "allen@example.com"
    response = client.post("/api/auth/simulate", json={"email": dev_email})
    assert response.status_code == 200
    dev_token = response.json()["access_token"]
    assert response.json()["user"]["role"] == "developer"
    print("   [PASS] Developer simulated login succeeded.")
    
    # Test viewer login
    viewer_email = "member@choir.org"
    response = client.post("/api/auth/simulate", json={"email": viewer_email})
    assert response.status_code == 200
    viewer_token = response.json()["access_token"]
    assert response.json()["user"]["role"] == "viewer"
    print("   [PASS] Viewer simulated login succeeded.")
    
    # Headers helper
    dev_headers = {"Authorization": f"Bearer {dev_token}"}
    viewer_headers = {"Authorization": f"Bearer {viewer_token}"}
    
    # --- 3. Authorization Guards ---
    print("\n3. Testing role permissions and guards...")
    # Try adding admin email as viewer -> should fail 403
    response = client.post("/api/admin/emails", json={"email": "newadmin@choir.org"}, headers=viewer_headers)
    assert response.status_code == 403
    print("   [PASS] Viewer block verified (403 Forbidden).")
    
    # Add admin email as developer -> should succeed
    response = client.post("/api/admin/emails", json={"email": "newadmin@choir.org"}, headers=dev_headers)
    assert response.status_code == 201
    print("   [PASS] Developer admin configuration allowed.")
    
    # Verify new email now receives 'admin' role
    response = client.post("/api/auth/simulate", json={"email": "newadmin@choir.org"})
    admin_token = response.json()["access_token"]
    assert response.json()["user"]["role"] == "admin"
    admin_headers = {"Authorization": f"Bearer {admin_token}"}
    print("   [PASS] Role propagation verified (new user is now 'admin').")
    
    # --- 4. Songs CRUD & Alphabetical Re-Numbering ---
    print("\n4. Testing Song CRUD and automatic re-numbering...")
    
    # Try adding song as viewer -> should fail 403
    response = client.post("/api/songs", json={
        "title": "Silent Night",
        "lyrics": "Lyrics content",
        "languages": ["English"],
        "categories": ["Christmas"]
    }, headers=viewer_headers)
    assert response.status_code == 403
    print("   [PASS] Viewer song creation blocked.")
    
    # Add song 'Amazing Grace' as Admin -> should succeed
    response = client.post("/api/songs", json={
        "title": "Amazing Grace",
        "lyrics": "Amazing grace how sweet the sound...",
        "languages": ["English"],
        "categories": ["Praise"]
    }, headers=admin_headers)
    assert response.status_code == 201
    song_ag = response.json()
    assert song_ag["title"] == "Amazing Grace"
    assert song_ag["number"] == 1
    print("   [PASS] First song 'Amazing Grace' created as #1.")
    
    # Add song '10,000 Reasons' as Admin -> should sort before 'Amazing Grace'
    response = client.post("/api/songs", json={
        "title": "10,000 Reasons (Bless The Lord)",
        "lyrics": "Bless the Lord, O my soul...",
        "languages": ["English"],
        "categories": ["Worship"]
    }, headers=admin_headers)
    assert response.status_code == 201
    song_tr = response.json()
    assert song_tr["title"] == "10,000 Reasons (Bless The Lord)"
    # Recalculation should make this #1
    assert song_tr["number"] == 1
    print("   [PASS] Second song '10,000 Reasons' created and sorted as #1.")
    
    # Verify 'Amazing Grace' is now re-numbered to #2
    response = client.get(f"/api/songs/{song_ag['id']}")
    assert response.json()["number"] == 2
    print("   [PASS] 'Amazing Grace' automatically shifted to #2.")
    
    # Add song 'Cornerstone' as Admin -> should sort as #3
    response = client.post("/api/songs", json={
        "title": "Cornerstone",
        "lyrics": "My hope is built on nothing less...",
        "languages": ["English"],
        "categories": ["Worship"]
    }, headers=admin_headers)
    assert response.status_code == 201
    song_cs = response.json()
    assert song_cs["number"] == 3
    print("   [PASS] Third song 'Cornerstone' created and sorted as #3.")
    
    # --- 5. Retrieve by ID and Sequential Number ---
    print("\n5. Testing song retrieval methods...")
    # Fetch by sequential number '2' -> should return Amazing Grace
    response = client.get("/api/songs/2")
    assert response.status_code == 200
    assert response.json()["title"] == "Amazing Grace"
    print("   [PASS] Song fetched successfully by short sequential number '2'.")
    
    # --- 6. Update song (Recalculate numbering if title shifts) ---
    print("\n6. Testing song updates and title-shift renumbering...")
    # Update 'Cornerstone' to 'Abba Father' -> should sort between '10,000 Reasons' and 'Amazing Grace'
    response = client.put(f"/api/songs/{song_cs['id']}", json={
        "title": "Abba Father"
    }, headers=admin_headers)
    assert response.status_code == 200
    assert response.json()["number"] == 2
    
    # Confirm 'Amazing Grace' has been pushed to #3
    response = client.get(f"/api/songs/{song_ag['id']}")
    assert response.json()["number"] == 3
    print("   [PASS] Title update triggered correct numbering shift: 10,000 Reasons (#1), Abba Father (#2), Amazing Grace (#3).")
    
    # --- 7. Delete Song (Triggers renumbering) ---
    print("\n7. Testing song deletion and numbering compaction...")
    # Delete 'Abba Father'
    response = client.delete(f"/api/songs/{song_cs['id']}", headers=admin_headers)
    assert response.status_code == 204

    
    # 'Amazing Grace' should compact back to #2
    response = client.get(f"/api/songs/{song_ag['id']}")
    assert response.json()["number"] == 2
    print("   [PASS] Song deleted, 'Amazing Grace' compacted back to #2.")
    
    # --- 8. Tags management (Category global updates) ---
    print("\n8. Testing global category tag modifications...")
    # Rename category 'Praise' to 'Thanksgiving'
    response = client.put("/api/categories/Praise", json={"name": "Thanksgiving"}, headers=dev_headers)
    assert response.status_code == 200
    
    # Check if 'Amazing Grace' (previously marked 'Praise') is now marked 'Thanksgiving'
    response = client.get(f"/api/songs/{song_ag['id']}")
    assert "Thanksgiving" in response.json()["categories"]
    assert "Praise" not in response.json()["categories"]
    print("   [PASS] Global category rename propagated to song records.")
    
    # Delete category 'Thanksgiving'
    response = client.delete("/api/categories/Thanksgiving", headers=dev_headers)
    assert response.status_code == 204
    
    # Check if category tag was removed from 'Amazing Grace'
    response = client.get(f"/api/songs/{song_ag['id']}")
    assert "Thanksgiving" not in response.json()["categories"]
    print("   [PASS] Global category deletion cleaned tag off song records.")
    
    # --- 9. Audio Upload and Validation ---
    print("\n9. Testing audio file upload and validation...")
    # Try uploading non-mp3 text file -> should fail with 400
    files_txt = {"file": ("test_file.txt", b"dummy content", "text/plain")}
    response = client.post(f"/api/songs/{song_ag['id']}/audio", files=files_txt, headers=admin_headers)
    assert response.status_code == 400
    assert "Only MP3" in response.json()["detail"]
    print("   [PASS] Non-MP3 file upload blocked.")
    
    # Upload mock mp3 file -> should succeed
    files_mp3 = {"file": ("reference_track.mp3", b"ID3\x03\x00\x00\x00\x00\x00\x00dummy_audio_bytes", "audio/mpeg")}
    response = client.post(f"/api/songs/{song_ag['id']}/audio", files=files_mp3, headers=admin_headers)
    assert response.status_code == 200
    uploaded_song = response.json()
    assert uploaded_song["audio_url"] is not None
    assert uploaded_song["audio_url"].startswith("/uploads/")
    assert uploaded_song["audio_url"].endswith(".mp3")
    print("   [PASS] MP3 file upload successfully processed.")
    
    # Verify file exists on local disk
    local_filename = uploaded_song["audio_url"].replace("/uploads/", "")
    local_file_path = os.path.join("./uploads", local_filename)
    assert os.path.exists(local_file_path)
    print("   [PASS] Uploaded file verified physically on local storage.")
    
    # Clean up uploaded test file
    if os.path.exists(local_file_path):
        os.remove(local_file_path)
        
    # --- 10. PDF Songbook Generation ---
    print("\n10. Testing PDF Songbook generation...")
    # 1. Total songbook download
    response = client.get("/api/songs/pdf")
    assert response.status_code == 200
    assert response.headers["content-type"] == "application/pdf"
    assert response.content.startswith(b"%PDF-")
    print("   [PASS] Total PDF Songbook generated successfully with correct magic bytes.")
    
    # 2. Filtered songbook download (active categories)
    # At this point, category is empty because we deleted 'Thanksgiving', but we can search for English language
    response = client.get("/api/songs/pdf?languages=English")
    assert response.status_code == 200
    assert response.headers["content-type"] == "application/pdf"
    assert response.content.startswith(b"%PDF-")
    print("   [PASS] Filtered PDF Songbook (languages=English) generated successfully.")
    
    # 3. Filtered songbook download with non-existent criteria -> should fail with 404
    response = client.get("/api/songs/pdf?categories=NonExistentCategoryTag")
    assert response.status_code == 404
    assert "No songs match" in response.json()["detail"]
    print("   [PASS] Filtered PDF Songbook returns 404 if criteria does not match any song.")

    
    # Clean up test database file by disposing engine connections first
    engine.dispose()
    if os.path.exists(TEST_DB_FILE):
        os.remove(TEST_DB_FILE)

        
    print("\n==============================================")
    print("ALL TESTS PASSED SUCCESSFULLY! (100% SUCCESS)")
    print("==============================================")


if __name__ == "__main__":
    run_tests()
