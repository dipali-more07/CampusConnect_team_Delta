"""
app/models/event.py
Event database model.
"""
import uuid
from datetime import datetime
from typing import Optional, List
from sqlalchemy import String, DateTime, Date, Time, Numeric, ForeignKey, Text, Integer, Enum as SAEnum
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.dialects.postgresql import UUID

from app.database.base import Base
from app.core.constants import EventStatus, ApprovalStatus, EventType, EventCategory


class Event(Base):
    __tablename__ = "events"

    event_id: Mapped[str] = mapped_column(
        UUID(as_uuid=False), primary_key=True, default=lambda: str(uuid.uuid4()), index=True
    )
    organizer_id: Mapped[str] = mapped_column(
        UUID(as_uuid=False),
        ForeignKey("users.user_id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    club_id: Mapped[Optional[str]] = mapped_column(
        UUID(as_uuid=False),
        ForeignKey("clubs.club_id", ondelete="SET NULL"),
        nullable=True,
        index=True,
    )
    category_id: Mapped[Optional[str]] = mapped_column(
        UUID(as_uuid=False),
        ForeignKey("event_categories.category_id", ondelete="SET NULL"),
        nullable=True,
        index=True,
    )
    title: Mapped[str] = mapped_column(String(300), nullable=False, index=True)
    description: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    category: Mapped[str] = mapped_column(
        SAEnum(EventCategory, name="eventcategory"), nullable=False, default=EventCategory.OTHER
    )
    event_type: Mapped[str] = mapped_column(
        SAEnum(EventType, name="eventtype"), nullable=False, default=EventType.OFFLINE
    )
    venue: Mapped[Optional[str]] = mapped_column(String(500), nullable=True)
    start_datetime: Mapped[datetime] = mapped_column(DateTime, nullable=False)
    end_datetime: Mapped[datetime] = mapped_column(DateTime, nullable=False)
    max_participants: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    registration_deadline: Mapped[Optional[datetime]] = mapped_column(DateTime, nullable=True)
    poster: Mapped[Optional[str]] = mapped_column(String(500), nullable=True)
    status: Mapped[str] = mapped_column(
        SAEnum(EventStatus, name="eventstatus"), nullable=False, default=EventStatus.DRAFT, index=True
    )
    approval_status: Mapped[str] = mapped_column(
        SAEnum(ApprovalStatus, name="approvalstatus"), nullable=False, default=ApprovalStatus.PENDING
    )
    rejection_reason: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    qr_code: Mapped[Optional[str]] = mapped_column(String(500), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    updated_at: Mapped[datetime] = mapped_column(
        DateTime, default=datetime.utcnow, onupdate=datetime.utcnow
    )

    # ER Diagram columns
    event_date: Mapped[Optional[datetime]] = mapped_column(Date, nullable=True)
    start_time: Mapped[Optional[datetime]] = mapped_column(Time, nullable=True)
    end_time: Mapped[Optional[datetime]] = mapped_column(Time, nullable=True)
    capacity: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    registered_fee: Mapped[Optional[float]] = mapped_column(Numeric(10, 2), nullable=True)
    poster_url: Mapped[Optional[str]] = mapped_column(String(500), nullable=True)
    rulebook_url: Mapped[Optional[str]] = mapped_column(String(500), nullable=True)
    schedule_url: Mapped[Optional[str]] = mapped_column(String(500), nullable=True)
    event_status: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)

    organizer: Mapped["User"] = relationship("User", foreign_keys=[organizer_id])
    club: Mapped[Optional["Club"]] = relationship("Club", back_populates="events")
    event_category: Mapped[Optional["EventCategoryModel"]] = relationship("EventCategoryModel", back_populates="events")
    registrations: Mapped[List["EventRegistration"]] = relationship(
        "EventRegistration", back_populates="event", cascade="all, delete-orphan"
    )
    certificates: Mapped[List["Certificate"]] = relationship(
        "Certificate", back_populates="event", cascade="all, delete-orphan"
    )

    def __repr__(self) -> str:
        return f"<Event {self.title} ({self.status})>"
