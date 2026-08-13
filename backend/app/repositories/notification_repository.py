"""
app/repositories/notification_repository.py
Notification database operations.
"""
from typing import Optional, List
from sqlalchemy.orm import Session
from sqlalchemy import select, func, and_, update

from app.repositories.base import BaseRepository
from app.models.notification import Notification


class NotificationRepository(BaseRepository[Notification]):
    def __init__(self, db: Session):
        super().__init__(Notification, db)

    def get_by_id(self, notification_id: str) -> Optional[Notification]:
        return self.db.execute(
            select(Notification).where(
                Notification.notification_id == notification_id
            )
        ).scalar_one_or_none()

    def get_by_user(
        self,
        user_id: str,
        skip: int = 0,
        limit: int = 20,
        unread_only: bool = False,
    ) -> List[Notification]:
        query = select(Notification).where(Notification.user_id == user_id)
        if unread_only:
            query = query.where(Notification.is_read == False)
        query = query.order_by(Notification.created_at.desc()).offset(skip).limit(limit)
        return list(self.db.execute(query).scalars().all())

    def count_unread(self, user_id: str) -> int:
        return self.db.execute(
            select(func.count())
            .select_from(Notification)
            .where(and_(Notification.user_id == user_id, Notification.is_read == False))
        ).scalar() or 0

    def mark_all_read(self, user_id: str) -> None:
        """Mark all notifications for a user as read in one query."""
        self.db.execute(
            update(Notification)
            .where(
                and_(Notification.user_id == user_id, Notification.is_read == False)
            )
            .values(is_read=True)
        )
        self.db.flush()

    def count_by_user(self, user_id: str) -> int:
        return self.db.execute(
            select(func.count()).select_from(Notification)
            .where(Notification.user_id == user_id)
        ).scalar() or 0
