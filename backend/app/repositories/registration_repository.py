"""
app/repositories/registration_repository.py
Event Registration database operations.
"""
from typing import Optional, List
from sqlalchemy.orm import Session
from sqlalchemy import select, func, and_

from app.repositories.base import BaseRepository
from app.models.registration import EventRegistration
from app.core.constants import RegistrationStatus


class RegistrationRepository(BaseRepository[EventRegistration]):
    def __init__(self, db: Session):
        super().__init__(EventRegistration, db)

    def get_by_id(self, registration_id: str) -> Optional[EventRegistration]:
        return self.db.execute(
            select(EventRegistration).where(
                EventRegistration.registration_id == registration_id
            )
        ).scalar_one_or_none()

    def get_by_event_and_user(
        self, event_id: str, user_id: str
    ) -> Optional[EventRegistration]:
        """Check if a user is already registered for an event."""
        return self.db.execute(
            select(EventRegistration).where(
                and_(
                    EventRegistration.event_id == event_id,
                    EventRegistration.user_id == user_id,
                )
            )
        ).scalar_one_or_none()

    def get_by_event(
        self, event_id: str, skip: int = 0, limit: int = 100
    ) -> List[EventRegistration]:
        """Get all registrations for an event."""
        query = (
            select(EventRegistration)
            .where(EventRegistration.event_id == event_id)
            .offset(skip)
            .limit(limit)
        )
        return list(self.db.execute(query).scalars().all())

    def get_by_user(
        self, user_id: str, skip: int = 0, limit: int = 10
    ) -> List[EventRegistration]:
        """Get all events a user has registered for."""
        query = (
            select(EventRegistration)
            .where(EventRegistration.user_id == user_id)
            .order_by(EventRegistration.registered_at.desc())
            .offset(skip)
            .limit(limit)
        )
        return list(self.db.execute(query).scalars().all())

    def count_confirmed_registrations(self, event_id: str) -> int:
        """Count how many confirmed registrations an event has."""
        return self.db.execute(
            select(func.count())
            .select_from(EventRegistration)
            .where(
                and_(
                    EventRegistration.event_id == event_id,
                    EventRegistration.registration_status == RegistrationStatus.CONFIRMED,
                )
            )
        ).scalar() or 0

    def count_by_user(self, user_id: str) -> int:
        return self.db.execute(
            select(func.count()).select_from(EventRegistration)
            .where(EventRegistration.user_id == user_id)
        ).scalar() or 0
