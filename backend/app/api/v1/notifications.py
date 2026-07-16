"""
app/api/v1/notifications.py
Notification endpoints.
"""
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.database.base import get_db
from app.database.deps import get_current_user, require_admin
from app.services.notification_service import NotificationService
from app.schemas.notification import CreateNotificationRequest
from app.core.responses import success_response, paginated_response
from app.models.user import User

router = APIRouter()


def _notif_to_dict(n) -> dict:
    return {
        "notification_id": n.notification_id,
        "user_id": n.user_id,
        "title": n.title,
        "message": n.message,
        "notification_type": n.notification_type,
        "is_read": n.is_read,
        "created_at": n.created_at.isoformat(),
    }


@router.get("/", summary="Get my notifications")
def get_my_notifications(
    page: int = Query(default=1, ge=1),
    size: int = Query(default=20, ge=1, le=100),
    unread_only: bool = Query(default=False),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    service = NotificationService(db)
    notifications, total = service.get_user_notifications(
        current_user.user_id, page=page, size=size, unread_only=unread_only
    )
    unread_count = service.get_unread_count(current_user.user_id)
    return paginated_response(
        message="Notifications fetched",
        data={"unread_count": unread_count, "notifications": [_notif_to_dict(n) for n in notifications]},
        total=total, page=page, size=size
    )


@router.patch("/{notification_id}/read", summary="Mark notification as read")
def mark_as_read(
    notification_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    service = NotificationService(db)
    notification = service.mark_as_read(notification_id, current_user)
    return success_response(message="Marked as read", data=_notif_to_dict(notification))


@router.patch("/read-all", summary="Mark all notifications as read")
def mark_all_read(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    service = NotificationService(db)
    service.mark_all_as_read(current_user)
    return success_response(message="All notifications marked as read")


@router.delete("/{notification_id}", summary="Delete a notification")
def delete_notification(
    notification_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    service = NotificationService(db)
    service.delete_notification(notification_id, current_user)
    return success_response(message="Notification deleted")


@router.post("/broadcast", status_code=201, summary="Send notification to user or broadcast to everyone (Admin only)")
def broadcast_notification(
    data: CreateNotificationRequest,
    admin: User = Depends(require_admin),
    db: Session = Depends(get_db),
):
    service = NotificationService(db)
    
    if data.user_id:
        # Send to a specific user
        notification = service.create_notification(
            user_id=data.user_id,
            title=data.title,
            message=data.message,
            notification_type=data.notification_type,
        )
        return success_response(
            message="Notification sent to user",
            data=_notif_to_dict(notification),
            status_code=201
        )
    else:
        # Broadcast to all active users
        service.broadcast_notification(
            title=data.title,
            message=data.message,
            notification_type=data.notification_type,
        )
        return success_response(
            message="Broadcast notification sent to all active users",
            data=None,
            status_code=201
        )
