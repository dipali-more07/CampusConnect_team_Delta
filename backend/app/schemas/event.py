"""
app/schemas/event.py
Event Pydantic schemas.
"""
from pydantic import BaseModel, Field, field_validator
from typing import Optional
from datetime import datetime
from app.core.constants import EventStatus, ApprovalStatus, EventType, EventCategory


class CreateEventRequest(BaseModel):
    title: str = Field(..., min_length=3, max_length=300)
    description: Optional[str] = Field(None, max_length=5000)
    category: EventCategory = EventCategory.OTHER
    event_type: EventType = EventType.OFFLINE
    venue: Optional[str] = Field(None, max_length=500)
    start_datetime: datetime
    end_datetime: datetime
    max_participants: Optional[int] = Field(None, ge=1)
    registration_deadline: Optional[datetime] = None

    @field_validator("end_datetime")
    @classmethod
    def end_must_be_after_start(cls, v: datetime, info) -> datetime:
        if "start_datetime" in info.data and v <= info.data["start_datetime"]:
            raise ValueError("end_datetime must be after start_datetime")
        return v


class UpdateEventRequest(BaseModel):
    title: Optional[str] = Field(None, min_length=3, max_length=300)
    description: Optional[str] = Field(None, max_length=5000)
    category: Optional[EventCategory] = None
    event_type: Optional[EventType] = None
    venue: Optional[str] = Field(None, max_length=500)
    start_datetime: Optional[datetime] = None
    end_datetime: Optional[datetime] = None
    max_participants: Optional[int] = Field(None, ge=1)
    registration_deadline: Optional[datetime] = None


class ApproveEventRequest(BaseModel):
    approval_status: ApprovalStatus
    rejection_reason: Optional[str] = Field(None, max_length=1000)


class EventResponse(BaseModel):
    event_id: str
    organizer_id: str
    club_id: Optional[str] = None
    title: str
    description: Optional[str] = None
    category: str
    event_type: str
    venue: Optional[str] = None
    start_datetime: datetime
    end_datetime: datetime
    max_participants: Optional[int] = None
    registration_deadline: Optional[datetime] = None
    poster: Optional[str] = None
    status: str
    approval_status: str
    qr_code: Optional[str] = None
    created_at: datetime
    updated_at: datetime
    model_config = {"from_attributes": True}


class EventListResponse(BaseModel):
    event_id: str
    title: str
    category: str
    event_type: str
    venue: Optional[str] = None
    start_datetime: datetime
    status: str
    poster: Optional[str] = None
    max_participants: Optional[int] = None
    model_config = {"from_attributes": True}
