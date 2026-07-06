"""
app/schemas/organizer.py
Organizer Pydantic schemas.
"""
from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime


class AssignOrganizerRequest(BaseModel):
    user_id: str
    club_id: str
    designation: Optional[str] = Field(None, max_length=255)
    permissions: Optional[List[str]] = Field(default=["create_event", "manage_attendance"])


class UpdateOrganizerRequest(BaseModel):
    designation: Optional[str] = Field(None, max_length=255)
    permissions: Optional[List[str]] = None


class OrganizerResponse(BaseModel):
    organizer_id: str
    user_id: str
    club_id: str
    designation: Optional[str] = None
    permissions: Optional[List[str]] = None
    created_at: datetime
    model_config = {"from_attributes": True}
