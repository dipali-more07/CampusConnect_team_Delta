"""
app/utils/helpers.py
====================
Miscellaneous helper functions.
"""
import uuid
import secrets
from datetime import datetime, timedelta
from typing import Optional


def generate_uuid() -> str:
    """Generate a new UUID4 string."""
    return str(uuid.uuid4())


def generate_certificate_number() -> str:
    """
    Generate a unique, human-readable certificate number.

    Format: CC-YYYY-XXXXXXXX
    Example: CC-2024-A3F2B1C9

    WHY: Instead of just using UUID (hard to read/type), we create
         a shorter, readable number that users can easily share
         for certificate verification.
    """
    year = datetime.utcnow().year
    unique_part = secrets.token_hex(4).upper()  # 8 random hex characters
    return f"CC-{year}-{unique_part}"


def generate_reset_token() -> str:
    """
    Generate a secure random token for password reset emails.

    Uses secrets.token_urlsafe which is cryptographically secure.
    The token is safe to use in URLs (no special characters).
    """
    return secrets.token_urlsafe(32)  # 32 bytes = 43 characters


def get_reset_token_expiry() -> datetime:
    """Password reset tokens expire after 1 hour."""
    return datetime.utcnow() + timedelta(hours=1)


def get_refresh_token_expiry(days: int = 7) -> datetime:
    """Refresh tokens expire after N days."""
    return datetime.utcnow() + timedelta(days=days)


def format_datetime(dt: Optional[datetime]) -> Optional[str]:
    """Format datetime as ISO 8601 string for API responses."""
    if dt is None:
        return None
    return dt.isoformat()
