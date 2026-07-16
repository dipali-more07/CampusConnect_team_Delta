"""
app/schemas/event.py
=====================
Pydantic schemas for Event API requests and responses.

FIELD ALIASES (Why some fields have two names):
  This API was built to be flexible for different frontend naming styles.
  Some fields accept BOTH names — either works:

  1. "event_name"  OR  "title"                  → The event's title/name
  2. "reg_deadline" OR  "registration_deadline"  → When registration closes
  3. "capacity"    OR  "max_participants"         → Maximum number of seats

  WHY: Frontend may use "event_name" from an older version, while the
  database column is "title". The @model_validator auto-maps them so
  the backend always has both values set correctly.

IMPORTANT: Do NOT remove these aliases — the frontend depends on sending
  either name and both working.
"""
from pydantic import BaseModel, Field, field_validator, model_validator
from typing import Optional
from datetime import datetime, date
from app.core.constants import EventStatus, ApprovalStatus, EventType, EventCategory, ParticipationType


class CreateEventRequest(BaseModel):
    """
    Data required to create a new event.

    FIELD GUIDE:
      event_name / title  → Event title (one of these is required)
      description         → Full description of the event (max 5000 chars)
      category            → EventCategory enum: TECHNICAL, CULTURAL, SPORTS, etc.
      event_type          → ONLINE or OFFLINE
      venue               → Location (for offline events)
      start_datetime      → When the event starts (must be in the future)
      end_datetime        → When the event ends (must be after start_datetime)
      max_participants    → Max seats (also accepts "capacity")
      participation_type  → INDIVIDUAL or TEAM
      reg_date_time       → When registration opens (optional)
      reg_deadline        → When registration closes (optional)
      fees                → Registration fee in rupees (0 = free)
      event_date          → Event date (if different from start_datetime)
    """
    # Accept either event_name or title (aliased to each other)
    event_name: Optional[str] = Field(None, min_length=3, max_length=300)
    title: Optional[str] = Field(None, min_length=3, max_length=300)
    description: Optional[str] = Field(None, max_length=5000)
    category: EventCategory = EventCategory.OTHER
    event_type: EventType = EventType.OFFLINE
    venue: Optional[str] = Field(None, max_length=500)
    start_datetime: datetime
    end_datetime: datetime
    # Accept either max_participants or capacity (aliased to each other)
    max_participants: Optional[int] = Field(None, ge=1)
    capacity: Optional[int] = Field(None, ge=1)
    participation_type: ParticipationType = ParticipationType.INDIVIDUAL
    reg_date_time: Optional[datetime] = None
    fees: Optional[float] = Field(None, ge=0.0)
    # Accept either reg_deadline or registration_deadline (aliased to each other)
    reg_deadline: Optional[datetime] = None
    registration_deadline: Optional[datetime] = None
    event_date: Optional[date] = None

    @model_validator(mode="before")
    @classmethod
    def align_compatible_fields(cls, data):
        """
        Auto-sync alias fields so the backend always has both names set.

        Example: if frontend sends {"event_name": "Hackathon"},
        this automatically sets {"event_name": "Hackathon", "title": "Hackathon"}
        so neither the old nor new field name causes any issues.
        """
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
        """Ensure at least one of event_name or title is provided."""
        if not self.title or not self.event_name:
            raise ValueError("event_name or title must be provided")
        return self

    @field_validator("end_datetime")
    @classmethod
    def end_must_be_after_start(cls, v: datetime, info) -> datetime:
        """Validate that end_datetime is strictly after start_datetime."""
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
