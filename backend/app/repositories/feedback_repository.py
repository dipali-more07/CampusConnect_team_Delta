"""
app/repositories/feedback_repository.py
Repository operations for Feedback model.
"""
from typing import List, Optional
from sqlalchemy.orm import Session
from sqlalchemy import select, func

from app.repositories.base import BaseRepository
from app.models.feedback import Feedback


class FeedbackRepository(BaseRepository[Feedback]):
    def __init__(self, db: Session):
        super().__init__(Feedback, db)

    def get_by_event_and_participant(self, event_id: str, participant_id: str) -> Optional[Feedback]:
        stmt = select(Feedback).where(
            Feedback.event_id == event_id,
            Feedback.participant_id == participant_id
        )
        return self.db.execute(stmt).scalar_one_or_none()

    def get_by_event(self, event_id: str, skip: int = 0, limit: int = 10) -> List[Feedback]:
        stmt = (
            select(Feedback)
            .where(Feedback.event_id == event_id)
            .order_by(Feedback.created_at.desc())
            .offset(skip)
            .limit(limit)
        )
        return list(self.db.execute(stmt).scalars().all())

    def count_by_event(self, event_id: str) -> int:
        stmt = select(func.count(Feedback.feedback_id)).where(Feedback.event_id == event_id)
        return self.db.execute(stmt).scalar() or 0

    def get_by_participant(self, participant_id: str, skip: int = 0, limit: int = 10) -> List[Feedback]:
        stmt = (
            select(Feedback)
            .where(Feedback.participant_id == participant_id)
            .order_by(Feedback.created_at.desc())
            .offset(skip)
            .limit(limit)
        )
        return list(self.db.execute(stmt).scalars().all())

    def count_by_participant(self, participant_id: str) -> int:
        stmt = select(func.count(Feedback.feedback_id)).where(Feedback.participant_id == participant_id)
        return self.db.execute(stmt).scalar() or 0

    def get_all_paged(self, skip: int = 0, limit: int = 10) -> List[Feedback]:
        stmt = (
            select(Feedback)
            .order_by(Feedback.created_at.desc())
            .offset(skip)
            .limit(limit)
        )
        return list(self.db.execute(stmt).scalars().all())

    def count_all(self) -> int:
        stmt = select(func.count(Feedback.feedback_id))
        return self.db.execute(stmt).scalar() or 0

    def get_event_summary(self, event_id: str) -> dict:
        """
        Calculates total feedback count, average rating, and breakdown by star ratings (1..5).
        """
        total = self.count_by_event(event_id)
        if total == 0:
            return {
                "total_feedbacks": 0,
                "average_rating": 0.0,
                "rating_breakdown": {"5": 0, "4": 0, "3": 0, "2": 0, "1": 0}
            }

        avg_stmt = select(func.avg(Feedback.rating)).where(Feedback.event_id == event_id)
        avg_rating = self.db.execute(avg_stmt).scalar() or 0.0

        # Rating breakdown (count of 5-star, 4-star, etc.)
        counts_stmt = (
            select(Feedback.rating, func.count(Feedback.feedback_id))
            .where(Feedback.event_id == event_id)
            .group_by(Feedback.rating)
        )
        counts = dict(self.db.execute(counts_stmt).all())

        breakdown = {
            "5": counts.get(5, 0),
            "4": counts.get(4, 0),
            "3": counts.get(3, 0),
            "2": counts.get(2, 0),
            "1": counts.get(1, 0),
        }

        return {
            "total_feedbacks": total,
            "average_rating": round(float(avg_rating), 2),
            "rating_breakdown": breakdown
        }
