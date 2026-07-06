"""
app/models/organizer.py
Organizer database model.
"""
import uuid
from datetime import datetime
from typing import Optional, List
from sqlalchemy import String, DateTime, ForeignKey, JSON
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.dialects.postgresql import UUID

from app.database.base import Base


class Organizer(Base):
    __tablename__ = "organizers"

    organizer_id: Mapped[str] = mapped_column(
        UUID(as_uuid=False), primary_key=True, default=lambda: str(uuid.uuid4()), index=True
    )
    user_id: Mapped[str] = mapped_column(
        UUID(as_uuid=False),
        ForeignKey("users.user_id", ondelete="CASCADE"),
        nullable=False,
        unique=True,
        index=True,
    )
    club_id: Mapped[str] = mapped_column(
        UUID(as_uuid=False),
        ForeignKey("clubs.club_id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    designation: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    permissions: Mapped[Optional[list]] = mapped_column(JSON, nullable=True, default=list)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

    user: Mapped["User"] = relationship("User")
    club: Mapped["Club"] = relationship("Club", back_populates="organizers")
    events: Mapped[List["Event"]] = relationship("Event", back_populates="organizer")

    def __repr__(self) -> str:
        return f"<Organizer {self.organizer_id} - {self.designation}>"
