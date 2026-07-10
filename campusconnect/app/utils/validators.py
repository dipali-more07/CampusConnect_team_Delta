"""
app/utils/validators.py
========================
Custom validation functions used across the project.
"""
import re
from typing import Optional


def is_valid_phone(phone: str) -> bool:
    """
    Validate phone number format.
    Accepts: +91-9876543210, 9876543210, +1-202-555-0100
    """
    # Remove spaces, dashes, and parentheses
    cleaned = re.sub(r"[\s\-()]", "", phone)
    # Must be digits, optionally starting with +
    pattern = r"^\+?[1-9]\d{6,14}$"
    return bool(re.match(pattern, cleaned))


def is_valid_file_extension(
    filename: str, allowed_extensions: list[str]
) -> bool:
    """
    Validate file extension against an allowed list.

    Example:
        is_valid_file_extension("photo.jpg", ["jpg", "png"]) -> True
        is_valid_file_extension("script.exe", ["jpg", "png"]) -> False
    """
    if "." not in filename:
        return False
    ext = filename.rsplit(".", 1)[-1].lower()
    return ext in [e.lower() for e in allowed_extensions]


def sanitize_filename(filename: str) -> str:
    """
    Remove dangerous characters from a filename.
    Prevents path traversal attacks like '../../../etc/passwd'
    """
    # Keep only alphanumeric, dots, underscores, and hyphens
    name = re.sub(r"[^\w.\-]", "_", filename)
    # Remove multiple dots (prevents 'file..exe' tricks)
    name = re.sub(r"\.{2,}", ".", name)
    return name
