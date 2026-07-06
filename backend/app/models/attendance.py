"""
app/models/attendance.py
Attendance database model.
"""
from anyio import Event
from app.models.user import User
from app.models.registration import EventRegistration
import uuid
from datetime import datetime
from typing import Optional
from sqlalchemy import String, DateTime, ForeignKey, Enum as SAEnum
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.dialects.postgresql import UUID

from app.database.base import Base
from app.core.constants import AttendanceStatus


class Attendance(Base):
    __tablename__ = "attendance"

    attendance_id: Mapped[str] = mapped_column(
        UUID(as_uuid=False), primary_key=True, default=lambda: str(uuid.uuid4()), index=True
    )
    registration_id: Mapped[str] = mapped_column(
        UUID(as_uuid=False),
        ForeignKey("registrations.registration_id", ondelete="CASCADE"),
        nullable=False,
        unique=True,
        index=True,
    )
    user_id: Mapped[str] = mapped_column(
        UUID(as_uuid=False),
        ForeignKey("users.user_id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    event_id: Mapped[str] = mapped_column(
        UUID(as_uuid=False),
        ForeignKey("events.event_id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    check_in_time: Mapped[Optional[datetime]] = mapped_column(DateTime, nullable=True)
    check_out_time: Mapped[Optional[datetime]] = mapped_column(DateTime, nullable=True)
    attendance_status: Mapped[str] = mapped_column(
        SAEnum(AttendanceStatus, name="attendancestatus"),
        nullable=False,
        default=AttendanceStatus.ABSENT,
    )
    scanned_by: Mapped[Optional[str]] = mapped_column(
        UUID(as_uuid=False),
        ForeignKey("users.user_id", ondelete="SET NULL"),
        nullable=True,
    )

    # ER Diagram columns
    qrcode_url: Mapped[Optional[str]] = mapped_column(String(500), nullable=True)
    attendance_method: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)

    registration: Mapped["EventRegistration"] = relationship("EventRegistration", back_populates="attendance")
    user: Mapped["User"] = relationship("User", foreign_keys=[user_id])
    event: Mapped["Event"] = relationship("Event")

    def __repr__(self) -> str:
        return f"<Attendance {self.attendance_id} - {self.attendance_status}>"
