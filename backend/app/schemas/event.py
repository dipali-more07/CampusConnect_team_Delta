"""
app/schemas/event.py
Event Pydantic schemas.
"""
from pydantic import BaseModel, Field, field_validator, model_validator
from typing import Optional
from datetime import datetime, date
from app.core.constants import EventStatus, ApprovalStatus, EventType, EventCategory, ParticipationType


class CreateEventRequest(BaseModel):
    event_name: Optional[str] = Field(None, min_length=3, max_length=300)
    title: Optional[str] = Field(None, min_length=3, max_length=300)
    description: Optional[str] = Field(None, max_length=5000)
    category: EventCategory = EventCategory.OTHER
    event_type: EventType = EventType.OFFLINE
    venue: Optional[str] = Field(None, max_length=500)
    start_datetime: datetime
    end_datetime: datetime
    max_participants: Optional[int] = Field(None, ge=1)
    capacity: Optional[int] = Field(None, ge=1)
    participation_type: ParticipationType = ParticipationType.INDIVIDUAL
    reg_date_time: Optional[datetime] = None
    fees: Optional[float] = Field(None, ge=0.0)
    reg_deadline: Optional[datetime] = None
    registration_deadline: Optional[datetime] = None
    event_date: Optional[date] = None

    @model_validator(mode="before")
    @classmethod
    def align_compatible_fields(cls, data):
        if isinstance(data, dict):
            # map event_name <-> title
            if "event_name" in data and "title" not in data:
                data["title"] = data["event_name"]
            elif "title" in data and "event_name" not in data:
                data["event_name"] = data["title"]
            
            # map reg_deadline <-> registration_deadline
            if "reg_deadline" in data and "registration_deadline" not in data:
                data["registration_deadline"] = data["reg_deadline"]
            elif "registration_deadline" in data and "reg_deadline" not in data:
                data["reg_deadline"] = data["registration_deadline"]

            # map capacity <-> max_participants
            if "capacity" in data and "max_participants" not in data:
                data["max_participants"] = data["capacity"]
            elif "max_participants" in data and "capacity" not in data:
                data["capacity"] = data["max_participants"]
        return data

    @model_validator(mode="after")
    def validate_required_fields(self):
        if not self.title or not self.event_name:
            raise ValueError("event_name or title must be provided")
        return self

    @field_validator("end_datetime")
    @classmethod
    def end_must_be_after_start(cls, v: datetime, info) -> datetime:
        if "start_datetime" in info.data and v <= info.data["start_datetime"]:
            raise ValueError("end_datetime must be after start_datetime")
        return v


class UpdateEventRequest(BaseModel):
    event_name: Optional[str] = Field(None, min_length=3, max_length=300)
    title: Optional[str] = Field(None, min_length=3, max_length=300)
    description: Optional[str] = Field(None, max_length=5000)
    category: Optional[EventCategory] = None
    event_type: Optional[EventType] = None
    venue: Optional[str] = Field(None, max_length=500)
    start_datetime: Optional[datetime] = None
    end_datetime: Optional[datetime] = None
    max_participants: Optional[int] = Field(None, ge=1)
    capacity: Optional[int] = Field(None, ge=1)
    participation_type: Optional[ParticipationType] = None
    reg_date_time: Optional[datetime] = None
    fees: Optional[float] = Field(None, ge=0.0)
    reg_deadline: Optional[datetime] = None
    registration_deadline: Optional[datetime] = None
    event_date: Optional[date] = None

    @model_validator(mode="before")
    @classmethod
    def align_compatible_fields(cls, data):
        if isinstance(data, dict):
            # map event_name <-> title
            if "event_name" in data and "title" not in data:
                data["title"] = data["event_name"]
            elif "title" in data and "event_name" not in data:
                data["event_name"] = data["title"]
            
            # map reg_deadline <-> registration_deadline
            if "reg_deadline" in data and "registration_deadline" not in data:
                data["registration_deadline"] = data["reg_deadline"]
            elif "registration_deadline" in data and "reg_deadline" not in data:
                data["reg_deadline"] = data["registration_deadline"]

            # map capacity <-> max_participants
            if "capacity" in data and "max_participants" not in data:
                data["max_participants"] = data["capacity"]
            elif "max_participants" in data and "capacity" not in data:
                data["capacity"] = data["max_participants"]
        return data


class ApproveEventRequest(BaseModel):
    approval_status: ApprovalStatus
    rejection_reason: Optional[str] = Field(None, max_length=1000)


class EventResponse(BaseModel):
    event_id: str
    organizer_id: str
    event_name: str
    title: str
    description: Optional[str] = None
    category: str
    event_type: str
    venue: Optional[str] = None
    start_datetime: datetime
    end_datetime: datetime
    max_participants: Optional[int] = None
    capacity: Optional[int] = None
    participation_type: str
    reg_date_time: Optional[datetime] = None
    fees: Optional[float] = None
    reg_deadline: Optional[datetime] = None
    registration_deadline: Optional[datetime] = None
    event_date: Optional[date] = None
    poster: Optional[str] = None
    status: str
    approval_status: str
    qr_code: Optional[str] = None
    created_at: datetime
    updated_at: datetime
    model_config = {"from_attributes": True}


class EventListResponse(BaseModel):
    event_id: str
    event_name: str
    title: str
    category: str
    event_type: str
    venue: Optional[str] = None
    start_datetime: datetime
    status: str
    poster: Optional[str] = None
    max_participants: Optional[int] = None
    capacity: Optional[int] = None
    participation_type: str
    fees: Optional[float] = None
    event_date: Optional[date] = None
    model_config = {"from_attributes": True}
