"""
app/repositories/college_repository.py
College database operations.
"""
from typing import Optional, List
from sqlalchemy.orm import Session
from sqlalchemy import select, func

from app.repositories.base import BaseRepository
from app.models.college import College


class CollegeRepository(BaseRepository[College]):
    def __init__(self, db: Session):
        super().__init__(College, db)

    def get_by_id(self, college_id: str) -> Optional[College]:
        return self.db.execute(
            select(College).where(College.college_id == college_id)
        ).scalar_one_or_none()

    def get_by_name(self, college_name: str) -> Optional[College]:
        return self.db.execute(
            select(College).where(College.college_name == college_name)
        ).scalar_one_or_none()

    def get_all_colleges(
        self, skip: int = 0, limit: int = 10,
        search: Optional[str] = None, verified_only: bool = False
    ) -> List[College]:
        query = select(College)
        if search:
            query = query.where(
                College.college_name.ilike(f"%{search}%")
            )
        if verified_only:
            query = query.where(College.is_verified == True)
        query = query.order_by(College.college_name).offset(skip).limit(limit)
        return list(self.db.execute(query).scalars().all())

    def count_colleges(self, search: Optional[str] = None) -> int:
        query = select(func.count()).select_from(College)
        if search:
            query = query.where(College.college_name.ilike(f"%{search}%"))
        return self.db.execute(query).scalar() or 0
