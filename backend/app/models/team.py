"""
app/models/team.py
Team database model.
"""
import uuid
from datetime import datetime
from typing import Optional, List, TYPE_CHECKING
from sqlalchemy import String, DateTime, ForeignKey, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.dialects.postgresql import UUID

from app.database.base import Base

if TYPE_CHECKING:
    from app.models.event import Event
    from app.models.user import User
    from app.models.team_member import TeamMember


class Team(Base):
    __tablename__ = "teams"

    team_id: Mapped[str] = mapped_column(
        UUID(as_uuid=False), primary_key=True, default=lambda: str(uuid.uuid4()), index=True
    )
    event_id: Mapped[str] = mapped_column(
        UUID(as_uuid=False),
        ForeignKey("events.event_id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    leader_id: Mapped[str] = mapped_column(
        UUID(as_uuid=False),
        ForeignKey("users.user_id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    team_name: Mapped[str] = mapped_column(String(255), nullable=False)
    team_members: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    updated_at: Mapped[datetime] = mapped_column(
        DateTime, default=datetime.utcnow, onupdate=datetime.utcnow
    )

    event: Mapped["Event"] = relationship("Event")
    leader: Mapped["User"] = relationship("User", foreign_keys=[leader_id])
    members: Mapped[List["TeamMember"]] = relationship("TeamMember", back_populates="team", cascade="all, delete-orphan")

    def __repr__(self) -> str:
        return f"<Team {self.team_name}>"
