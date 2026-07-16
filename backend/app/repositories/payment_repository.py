"""
app/repositories/payment_repository.py
Payment database operations.
"""
from typing import Optional, List
from sqlalchemy.orm import Session
from sqlalchemy import select, func, and_

from app.repositories.base import BaseRepository
from app.models.payment import Payment
from app.models.registration import EventRegistration


class PaymentRepository(BaseRepository[Payment]):
    def __init__(self, db: Session):
        super().__init__(Payment, db)

    def get_by_id(self, payment_id: str) -> Optional[Payment]:
        """Fetch payment details by payment ID."""
        return self.db.execute(
            select(Payment).where(Payment.payment_id == payment_id)
        ).scalar_one_or_none()

    def get_by_registration_id(self, registration_id: str) -> Optional[Payment]:
        """Fetch a payment by the associated registration ID."""
        return self.db.execute(
            select(Payment).where(Payment.registration_id == registration_id)
        ).scalar_one_or_none()

    def get_by_event(
        self, event_id: str, skip: int = 0, limit: int = 100
    ) -> List[Payment]:
        """Get all payments for a specific event."""
        query = (
            select(Payment)
            .where(Payment.event_id == event_id)
            .order_by(Payment.payment_date.desc())
            .offset(skip)
            .limit(limit)
        )
        return list(self.db.execute(query).scalars().all())

    def count_by_event(self, event_id: str) -> int:
        """Count total payments for a specific event."""
        return self.db.execute(
            select(func.count()).select_from(Payment).where(Payment.event_id == event_id)
        ).scalar() or 0

    def get_by_user(
        self, user_id: str, skip: int = 0, limit: int = 10
    ) -> List[Payment]:
        """Get all payments made by a user."""
        query = (
            select(Payment)
            .join(EventRegistration, Payment.registration_id == EventRegistration.registration_id)
            .where(EventRegistration.participant_id == user_id)
            .order_by(Payment.payment_date.desc())
            .offset(skip)
            .limit(limit)
        )
        return list(self.db.execute(query).scalars().all())

    def count_by_user(self, user_id: str) -> int:
        """Count total payments made by a user."""
        return self.db.execute(
            select(func.count())
            .select_from(Payment)
            .join(EventRegistration, Payment.registration_id == EventRegistration.registration_id)
            .where(EventRegistration.participant_id == user_id)
        ).scalar() or 0
