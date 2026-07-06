"""
app/models/feedback.py
Feedback database model.
"""
import uuid
from datetime import datetime
from sqlalchemy import Integer, DateTime, ForeignKey, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.dialects.postgresql import UUID

from app.database.base import Base


class Feedback(Base):
    __tablename__ = "feedback"

    feedback_id: Mapped[str] = mapped_column(
        UUID(as_uuid=False), primary_key=True, default=lambda: str(uuid.uuid4()), index=True
    )
    event_id: Mapped[str] = mapped_column(
        UUID(as_uuid=False),
        ForeignKey("events.event_id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    participant_id: Mapped[str] = mapped_column(
        UUID(as_uuid=False),
        ForeignKey("users.user_id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    rating: Mapped[int] = mapped_column(Integer, nullable=False)
    review: Mapped[str] = mapped_column(Text, nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

    event: Mapped["Event"] = relationship("Event")
    participant: Mapped["User"] = relationship("User")

    def __repr__(self) -> str:
        return f"<Feedback {self.feedback_id} - Rating {self.rating}>"
