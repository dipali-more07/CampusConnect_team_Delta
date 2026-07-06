"""
app/models/club.py
Club database model.
"""
import uuid
from datetime import datetime
from typing import Optional, List
from sqlalchemy import String, DateTime, ForeignKey, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.dialects.postgresql import UUID

from app.database.base import Base


class Club(Base):
    __tablename__ = "clubs"

    club_id: Mapped[str] = mapped_column(
        UUID(as_uuid=False), primary_key=True, default=lambda: str(uuid.uuid4()), index=True
    )
    college_id: Mapped[str] = mapped_column(
        UUID(as_uuid=False),
        ForeignKey("colleges.college_id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    club_name: Mapped[str] = mapped_column(String(255), nullable=False)
    description: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    faculty_incharge: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

    college: Mapped["College"] = relationship("College", back_populates="clubs")
    organizers: Mapped[List["Organizer"]] = relationship("Organizer", back_populates="club", cascade="all, delete-orphan")
    events: Mapped[List["Event"]] = relationship("Event", back_populates="club")

    def __repr__(self) -> str:
        return f"<Club {self.club_name}>"
