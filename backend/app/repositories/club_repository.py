"""
app/repositories/club_repository.py
Club database operations.
"""
from typing import Optional, List
from sqlalchemy.orm import Session
from sqlalchemy import select, func

from app.repositories.base import BaseRepository
from app.models.club import Club


class ClubRepository(BaseRepository[Club]):
    def __init__(self, db: Session):
        super().__init__(Club, db)

    def get_by_id(self, club_id: str) -> Optional[Club]:
        return self.db.execute(
            select(Club).where(Club.club_id == club_id)
        ).scalar_one_or_none()

    def get_by_college(
        self, college_id: str, skip: int = 0, limit: int = 10
    ) -> List[Club]:
        """Get all clubs belonging to a specific college."""
        query = (
            select(Club)
            .where(Club.college_id == college_id)
            .offset(skip)
            .limit(limit)
        )
        return list(self.db.execute(query).scalars().all())

    def get_all_clubs(
        self, skip: int = 0, limit: int = 10, search: Optional[str] = None
    ) -> List[Club]:
        query = select(Club)
        if search:
            query = query.where(Club.club_name.ilike(f"%{search}%"))
        query = query.offset(skip).limit(limit)
        return list(self.db.execute(query).scalars().all())

    def count_clubs(self, search: Optional[str] = None) -> int:
        query = select(func.count()).select_from(Club)
        if search:
            query = query.where(Club.club_name.ilike(f"%{search}%"))
        return self.db.execute(query).scalar() or 0
