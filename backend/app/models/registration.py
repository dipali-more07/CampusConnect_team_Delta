"""
app/models/registration.py
EventRegistration database model.
"""
import uuid
from datetime import datetime
from typing import Optional
from sqlalchemy import String, DateTime, ForeignKey, UniqueConstraint, Enum as SAEnum
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.dialects.postgresql import UUID

from app.database.base import Base
from app.core.constants import RegistrationStatus, PaymentStatus


class EventRegistration(Base):
    __tablename__ = "registrations"
    __table_args__ = (
        UniqueConstraint("event_id", "participant_id", name="uq_event_participant_registration"),
    )

    registration_id: Mapped[str] = mapped_column(
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

    # Backward compatibility helper for repository/service layers
    @property
    def user_id(self) -> str:
        return self.participant_id

    @user_id.setter
    def user_id(self, value: str) -> None:
        self.participant_id = value

    registration_status: Mapped[str] = mapped_column(
        SAEnum(RegistrationStatus, name="registrationstatus"),
        nullable=False,
        default=RegistrationStatus.CONFIRMED,
    )
    payment_status: Mapped[str] = mapped_column(
        SAEnum(PaymentStatus, name="paymentstatus"),
        nullable=False,
        default=PaymentStatus.FREE,
    )
    registered_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

    # ER Diagram columns
    registration_type: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    qr_code: Mapped[Optional[str]] = mapped_column(String(500), nullable=True)

    event: Mapped["Event"] = relationship("Event", back_populates="registrations")
    user: Mapped["User"] = relationship("User", foreign_keys=[participant_id], back_populates="registrations")
    attendance: Mapped[Optional["Attendance"]] = relationship(
        "Attendance", back_populates="registration", uselist=False, cascade="all, delete-orphan"
    )

    def __repr__(self) -> str:
        return f"<Registration {self.registration_id} - {self.registration_status}>"
