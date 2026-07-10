"""
app/models/result.py
Result database model.
"""
import uuid
from datetime import datetime
from typing import Optional, TYPE_CHECKING
from sqlalchemy import Integer, Float, DateTime, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.dialects.postgresql import UUID

from app.database.base import Base

if TYPE_CHECKING:
    from app.models.event import Event
    from app.models.team import Team
    from app.models.user import User


class Result(Base):
    __tablename__ = "results"

    result_id: Mapped[str] = mapped_column(
        UUID(as_uuid=False), primary_key=True, default=lambda: str(uuid.uuid4()), index=True
    )
    event_id: Mapped[str] = mapped_column(
        UUID(as_uuid=False),
        ForeignKey("events.event_id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    team_id: Mapped[Optional[str]] = mapped_column(
        UUID(as_uuid=False),
        ForeignKey("teams.team_id", ondelete="SET NULL"),
        nullable=True,
        index=True,
    )
    participant_id: Mapped[Optional[str]] = mapped_column(
        UUID(as_uuid=False),
        ForeignKey("users.user_id", ondelete="SET NULL"),
        nullable=True,
        index=True,
    )
    rank: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    score: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

    event: Mapped["Event"] = relationship("Event")
    team: Mapped[Optional["Team"]] = relationship("Team")
    participant: Mapped[Optional["User"]] = relationship("User")

    def __repr__(self) -> str:
        return f"<Result {self.result_id} - Rank {self.rank}>"
