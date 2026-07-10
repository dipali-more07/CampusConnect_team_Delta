"""
app/models/certificate.py
Certificate database model.
"""
import uuid
from datetime import datetime
from typing import Optional, TYPE_CHECKING
from sqlalchemy import String, DateTime, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.dialects.postgresql import UUID

from app.database.base import Base

if TYPE_CHECKING:
    from app.models.event import Event
    from app.models.registration import EventRegistration
    from app.models.user import User


class Certificate(Base):
    __tablename__ = "certificates"

    certificate_id: Mapped[str] = mapped_column(
        UUID(as_uuid=False), primary_key=True, default=lambda: str(uuid.uuid4()), index=True
    )
    event_id: Mapped[str] = mapped_column(
        UUID(as_uuid=False),
        ForeignKey("events.event_id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    registration_id: Mapped[str] = mapped_column(
        UUID(as_uuid=False),
        ForeignKey("registrations.registration_id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    participant_id: Mapped[str] = mapped_column(
        UUID(as_uuid=False),
        ForeignKey("users.user_id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )

    # Backward compatibility helper for repository/service layers
    @property
    def user_id(self) -> str:
        return self.participant_id

    @user_id.setter
    def user_id(self, value: str) -> None:
        self.participant_id = value

    certificate_number: Mapped[str] = mapped_column(String(100), unique=True, nullable=False, index=True)
    pdf_path: Mapped[Optional[str]] = mapped_column(String(500), nullable=True)

    # ER Diagram columns
    certificate_type: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    certificate_url: Mapped[Optional[str]] = mapped_column(String(500), nullable=True)
    generated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    issue_date: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

    event: Mapped["Event"] = relationship("Event", back_populates="certificates")
    registration: Mapped["EventRegistration"] = relationship("EventRegistration")
    user: Mapped["User"] = relationship("User", foreign_keys=[participant_id], back_populates="certificates")

    def __repr__(self) -> str:
        return f"<Certificate {self.certificate_number}>"
