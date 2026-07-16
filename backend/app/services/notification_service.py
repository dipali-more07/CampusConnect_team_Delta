"""
app/services/notification_service.py
Notification management business logic.
"""
from typing import List, Optional
from sqlalchemy.orm import Session

from app.repositories.notification_repository import NotificationRepository
from app.core.exceptions import NotFoundException, ForbiddenException
from app.core.constants import NotificationType, UserRole
from app.models.notification import Notification
from app.models.user import User


class NotificationService:
    def __init__(self, db: Session):
        self.db = db
        self.notif_repo = NotificationRepository(db)

    def create_notification(
        self,
        user_id: str,
        title: str,
        message: str,
        notification_type: NotificationType = NotificationType.SYSTEM,
    ) -> Notification:
        notification = Notification(
            user_id=user_id,
            title=title,
            message=message,
            notification_type=notification_type,
        )
        self.notif_repo.create(notification)
        self.db.commit()
        self.db.refresh(notification)
        return notification

    def broadcast_notification(
        self,
        title: str,
        message: str,
        notification_type: NotificationType = NotificationType.SYSTEM,
    ) -> None:
        """Send a notification to all active users in the database."""
        from sqlalchemy import select
        # Get all active user IDs
        user_ids = self.db.execute(
            select(User.user_id).where(User.is_active == True)
        ).scalars().all()

        for u_id in user_ids:
            notification = Notification(
                user_id=u_id,
                title=title,
                message=message,
                notification_type=notification_type,
            )
            self.notif_repo.create(notification)
        
        self.db.commit()

    def get_user_notifications(
        self,
        user_id: str,
        page: int = 1,
        size: int = 20,
        unread_only: bool = False,
    ) -> tuple[List[Notification], int]:
        skip = (page - 1) * size
        notifications = self.notif_repo.get_by_user(
            user_id, skip=skip, limit=size, unread_only=unread_only
        )
        total = self.notif_repo.count_by_user(user_id)
        unread_count = self.notif_repo.count_unread(user_id)
        return notifications, total

    def mark_as_read(
        self, notification_id: str, current_user: User
    ) -> Notification:
        notification = self.notif_repo.get_by_id(notification_id)
        if not notification:
            raise NotFoundException(f"Notification {notification_id} not found")

        if notification.user_id != current_user.user_id:
            raise ForbiddenException("You can only read your own notifications")

        notification.is_read = True
        self.db.commit()
        self.db.refresh(notification)
        return notification

    def mark_all_as_read(self, current_user: User) -> None:
        self.notif_repo.mark_all_read(current_user.user_id)
        self.db.commit()

    def delete_notification(
        self, notification_id: str, current_user: User
    ) -> None:
        notification = self.notif_repo.get_by_id(notification_id)
        if not notification:
            raise NotFoundException(f"Notification {notification_id} not found")

        if notification.user_id != current_user.user_id and current_user.role != UserRole.ADMIN:
            raise ForbiddenException("You can only delete your own notifications")

        self.notif_repo.delete(notification)
        self.db.commit()

    def get_unread_count(self, user_id: str) -> int:
        return self.notif_repo.count_unread(user_id)
