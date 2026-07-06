"""
app/schemas/notification.py
Notification Pydantic schemas.
"""
from pydantic import BaseModel, Field
from datetime import datetime
from app.core.constants import NotificationType


class CreateNotificationRequest(BaseModel):
    user_id: str
    title: str = Field(..., max_length=255)
    message: str
    notification_type: NotificationType = NotificationType.SYSTEM


class NotificationResponse(BaseModel):
    notification_id: str
    user_id: str
    title: str
    message: str
    notification_type: str
    is_read: bool
    created_at: datetime
    model_config = {"from_attributes": True}
