"""
app/services/file_service.py
=============================
File upload and storage service.

WHY ABSTRACT FILE STORAGE:
  In development: Save files to local disk
  In production: Save files to AWS S3 / Google Cloud Storage

  By having a FileService, we only change ONE place to switch storage.

SECURITY:
  - Validate file type (only allow jpg, png, pdf - not .exe, .py)
  - Validate file size (max 10MB)
  - Generate random filename to prevent overwrites
  - Save in organized subdirectories
"""
import os
import uuid
import shutil
from typing import Optional
from pathlib import Path
from fastapi import UploadFile

from app.core.config import settings
from app.core.exceptions import BadRequestException

# Allowed file types per upload category
ALLOWED_IMAGE_TYPES = {"image/jpeg", "image/png", "image/webp", "image/gif"}
ALLOWED_PDF_TYPES = {"application/pdf"}
ALLOWED_IMAGE_EXTENSIONS = {"jpg", "jpeg", "png", "webp", "gif"}


class FileService:
    """Handles file upload, validation, and storage."""

    def __init__(self):
        # Create upload directories if they don't exist
        self.base_dir = Path(settings.UPLOAD_DIR)
        self._create_dirs()

    def _create_dirs(self) -> None:
        """Create upload subdirectories."""
        for subdir in ["posters", "profiles", "certificates", "qrcodes"]:
            (self.base_dir / subdir).mkdir(parents=True, exist_ok=True)

    def _validate_file_size(self, file: UploadFile) -> None:
        """Raise error if file is too large."""
        max_bytes = settings.MAX_FILE_SIZE_MB * 1024 * 1024
        # Read the file to check size, then reset position
        file.file.seek(0, 2)  # Seek to end
        size = file.file.tell()
        file.file.seek(0)     # Reset to beginning
        if size > max_bytes:
            raise BadRequestException(
                f"File too large. Maximum size is {settings.MAX_FILE_SIZE_MB}MB"
            )

    def _validate_image(self, file: UploadFile) -> None:
        """Validate that file is an allowed image type."""
        if file.content_type not in ALLOWED_IMAGE_TYPES:
            raise BadRequestException(
                f"Invalid file type '{file.content_type}'. "
                f"Allowed: {', '.join(ALLOWED_IMAGE_TYPES)}"
            )
        self._validate_file_size(file)

    def _generate_filename(self, original_filename: str, subdir: str) -> str:
        """
        Generate a unique filename.

        WHY UNIQUE NAMES:
          If two users upload 'profile.jpg', one would overwrite the other.
          By adding a UUID prefix, every file has a unique name.

        Example: 'profile.jpg' -> 'uploads/profiles/a1b2c3d4-profile.jpg'
        """
        ext = original_filename.rsplit(".", 1)[-1].lower() if "." in original_filename else "bin"
        unique_name = f"{uuid.uuid4()}.{ext}"
        return str(self.base_dir / subdir / unique_name)

    def save_poster(self, file: UploadFile) -> str:
        """Save an event poster image. Returns the file path."""
        self._validate_image(file)
        file_path = self._generate_filename(file.filename or "poster.jpg", "posters")
        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
        return file_path

    def save_profile_picture(self, file: UploadFile) -> str:
        """Save a profile picture. Returns the file path."""
        self._validate_image(file)
        file_path = self._generate_filename(file.filename or "profile.jpg", "profiles")
        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
        return file_path

    def save_file(self, file_path: str, content: bytes) -> str:
        """Save raw bytes to a file path. Used by certificate and QR services."""
        with open(file_path, "wb") as f:
            f.write(content)
        return file_path

    def delete_file(self, file_path: str) -> None:
        """Delete a file if it exists."""
        if file_path and os.path.exists(file_path):
            os.remove(file_path)

    def get_file_url(self, file_path: str) -> Optional[str]:
        """Convert file path to a URL that the frontend can use."""
        if not file_path:
            return None
        # In production, this would return an S3 URL or CDN URL
        # For now, return a local URL path
        return f"{settings.APP_URL}/static/{file_path}"


# Single instance
file_service = FileService()
