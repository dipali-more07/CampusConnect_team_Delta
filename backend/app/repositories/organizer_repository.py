"""
app/repositories/organizer_repository.py
Organizer database operations.
"""
from typing import Optional, List
from sqlalchemy.orm import Session
from sqlalchemy import select, func

from app.repositories.base import BaseRepository
from app.models.organizer import Organizer


class OrganizerRepository(BaseRepository[Organizer]):
    def __init__(self, db: Session):
        super().__init__(Organizer, db)

    def get_by_id(self, organizer_id: str) -> Optional[Organizer]:
        return self.db.execute(
            select(Organizer).where(Organizer.organizer_id == organizer_id)
        ).scalar_one_or_none()

    def get_by_user_id(self, user_id: str) -> Optional[Organizer]:
        """Check if a user is already an organizer."""
        return self.db.execute(
            select(Organizer).where(Organizer.user_id == user_id)
        ).scalar_one_or_none()

    def get_all_organizers(
        self, skip: int = 0, limit: int = 10
    ) -> List[Organizer]:
        query = select(Organizer).offset(skip).limit(limit)
        return list(self.db.execute(query).scalars().all())

    def count_organizers(self) -> int:
        return self.db.execute(
            select(func.count()).select_from(Organizer)
        ).scalar() or 0
