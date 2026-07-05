"""
app/repositories/certificate_repository.py
Certificate database operations.
"""
from typing import Optional, List
from sqlalchemy.orm import Session
from sqlalchemy import select, func, and_

from app.repositories.base import BaseRepository
from app.models.certificate import Certificate


class CertificateRepository(BaseRepository[Certificate]):
    def __init__(self, db: Session):
        super().__init__(Certificate, db)

    def get_by_id(self, certificate_id: str) -> Optional[Certificate]:
        return self.db.execute(
            select(Certificate).where(Certificate.certificate_id == certificate_id)
        ).scalar_one_or_none()

    def get_by_certificate_number(
        self, certificate_number: str
    ) -> Optional[Certificate]:
        """Used for certificate verification."""
        return self.db.execute(
            select(Certificate).where(
                Certificate.certificate_number == certificate_number
            )
        ).scalar_one_or_none()

    def get_by_event_and_user(
        self, event_id: str, user_id: str
    ) -> Optional[Certificate]:
        """Check if a user already has a certificate for an event."""
        return self.db.execute(
            select(Certificate).where(
                and_(
                    Certificate.event_id == event_id,
                    Certificate.user_id == user_id,
                )
            )
        ).scalar_one_or_none()

    def get_by_event(
        self, event_id: str, skip: int = 0, limit: int = 100
    ) -> List[Certificate]:
        query = (
            select(Certificate)
            .where(Certificate.event_id == event_id)
            .offset(skip)
            .limit(limit)
        )
        return list(self.db.execute(query).scalars().all())

    def get_by_user(
        self, user_id: str, skip: int = 0, limit: int = 10
    ) -> List[Certificate]:
        query = (
            select(Certificate)
            .where(Certificate.user_id == user_id)
            .order_by(Certificate.generated_at.desc())
            .offset(skip)
            .limit(limit)
        )
        return list(self.db.execute(query).scalars().all())

    def count_by_user(self, user_id: str) -> int:
        return self.db.execute(
            select(func.count()).select_from(Certificate)
            .where(Certificate.user_id == user_id)
        ).scalar() or 0

    def count_by_event(self, event_id: str) -> int:
        return self.db.execute(
            select(func.count()).select_from(Certificate)
            .where(Certificate.event_id == event_id)
        ).scalar() or 0
