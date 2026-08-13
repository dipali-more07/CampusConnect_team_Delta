"""
app/utils/helpers.py
====================
Miscellaneous helper functions.
"""
import uuid
import secrets
from datetime import datetime, timedelta, timezone
from typing import Optional


def utc_now() -> datetime:
    """Returns current UTC datetime (naive object for DB compatibility)."""
    return datetime.now(timezone.utc).replace(tzinfo=None)


def generate_uuid() -> str:
    """Generate a new UUID4 string."""
    return str(uuid.uuid4())


def generate_certificate_number() -> str:
    """
    Generate a unique, human-readable certificate number.
    Format: CC-YYYY-XXXXXXXX
    Example: CC-2024-A3F2B1C9
    """
    year = utc_now().year
    unique_part = secrets.token_hex(4).upper()  # 8 random hex characters
    return f"CC-{year}-{unique_part}"


def generate_reset_token() -> str:
    """
    Generate a secure random token for password reset emails.
    """
    return secrets.token_urlsafe(32)  # 32 bytes = 43 characters


def get_reset_token_expiry() -> datetime:
    """Password reset tokens expire after 1 hour."""
    return utc_now() + timedelta(hours=1)


def get_refresh_token_expiry(days: int = 7) -> datetime:
    """Refresh tokens expire after N days."""
    return utc_now() + timedelta(days=days)


def format_datetime(dt: Optional[datetime]) -> Optional[str]:
    """Format datetime as ISO 8601 string for API responses."""
    if dt is None:
        return None
    return dt.isoformat()


def get_user_performance_stats(db, user_id: str) -> dict:
    """
    Computes performance statistics for a user:
    - events_attended (total events where attendance_status == PRESENT)
    - certificates_count / certificates (total certificates issued)
    - attendance_percentage (attended / non-cancelled registered events * 100)
    """
    from sqlalchemy import select, func, and_
    from app.models.registration import EventRegistration
    from app.models.attendance import Attendance
    from app.models.certificate import Certificate
    from app.core.constants import RegistrationStatus, AttendanceStatus

    total_registered = db.execute(
        select(func.count())
        .select_from(EventRegistration)
        .where(
            and_(
                EventRegistration.participant_id == user_id,
                EventRegistration.registration_status != RegistrationStatus.CANCELLED
            )
        )
    ).scalar() or 0

    events_attended = db.execute(
        select(func.count())
        .select_from(Attendance)
        .where(
            and_(
                Attendance.user_id == user_id,
                Attendance.attendance_status == AttendanceStatus.PRESENT
            )
        )
    ).scalar() or 0

    certificates_count = db.execute(
        select(func.count())
        .select_from(Certificate)
        .where(Certificate.participant_id == user_id)
    ).scalar() or 0

    attendance_percentage = round((events_attended / total_registered * 100), 2) if total_registered > 0 else 0.0

    return {
        "events_attended": events_attended,
        "certificates_count": certificates_count,
        "certificates": certificates_count,
        "attendance_percentage": attendance_percentage,
    }
