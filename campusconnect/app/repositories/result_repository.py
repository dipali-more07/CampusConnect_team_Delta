"""
app/repositories/result_repository.py
Result database operations.
"""
from typing import List, Optional
from sqlalchemy.orm import Session
from sqlalchemy import select

from app.repositories.base import BaseRepository
from app.models.result import Result


class ResultRepository(BaseRepository[Result]):
    def __init__(self, db: Session):
        super().__init__(Result, db)

    def get_by_event_id(self, event_id: str) -> List[Result]:
        """Fetch all results for a specific event sorted by rank."""
        return list(
            self.db.execute(
                select(Result)
                .where(Result.event_id == event_id)
                .order_by(Result.rank.asc(), Result.score.desc())
            )
            .scalars()
            .all()
        )

    def get_by_id(self, result_id: str) -> Optional[Result]:
        """Fetch a specific result by ID."""
        return self.db.execute(
            select(Result).where(Result.result_id == result_id)
        ).scalar_one_or_none()
