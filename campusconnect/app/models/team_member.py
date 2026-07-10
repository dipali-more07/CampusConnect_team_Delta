"""
app/models/team_member.py
TeamMember database model.
"""
import uuid
from typing import Optional, TYPE_CHECKING
from sqlalchemy import Integer, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.dialects.postgresql import UUID

from app.database.base import Base

if TYPE_CHECKING:
    from app.models.team import Team
    from app.models.user import User


class TeamMember(Base):
    __tablename__ = "team_members"

    team_member_id: Mapped[str] = mapped_column(
        UUID(as_uuid=False), primary_key=True, default=lambda: str(uuid.uuid4()), index=True
    )
    team_id: Mapped[str] = mapped_column(
        UUID(as_uuid=False),
        ForeignKey("teams.team_id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    total_team_members: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    participant_id: Mapped[str] = mapped_column(
        UUID(as_uuid=False),
        ForeignKey("users.user_id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )

    team: Mapped["Team"] = relationship("Team", back_populates="members")
    participant: Mapped["User"] = relationship("User", foreign_keys=[participant_id])

    def __repr__(self) -> str:
        return f"<TeamMember {self.team_member_id}>"
