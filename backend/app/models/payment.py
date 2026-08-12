"""
app/models/payment.py
Payment database model.
"""
import uuid
from datetime import datetime
from typing import Optional, TYPE_CHECKING
from sqlalchemy import String, DateTime, ForeignKey, Numeric
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.dialects.postgresql import UUID

from app.database.base import Base

if TYPE_CHECKING:
    from app.models.event import Event
    from app.models.registration import EventRegistration


class Payment(Base):
    __tablename__ = "payments"

    payment_id: Mapped[str] = mapped_column(
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
    amount: Mapped[float] = mapped_column(Numeric(10, 2), nullable=False)
    payment_gateway: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    payment_method: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    transaction_id: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    payment_status: Mapped[str] = mapped_column(String(50), nullable=False)
    payment_date: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

    event: Mapped["Event"] = relationship("Event")
    registration: Mapped["EventRegistration"] = relationship("EventRegistration")

    def __repr__(self) -> str:
        return f"<Payment {self.payment_id} - {self.payment_status}>"
