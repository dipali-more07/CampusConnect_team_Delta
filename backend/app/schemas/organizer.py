"""
app/schemas/organizer.py
Organizer Pydantic schemas.
"""
from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime


class AssignOrganizerRequest(BaseModel):
    user_id: str
    designation: Optional[str] = Field(None, max_length=255)
    permissions: Optional[List[str]] = Field(default=["create_event", "manage_attendance"])


class UpdateOrganizerRequest(BaseModel):
    designation: Optional[str] = Field(None, max_length=255)
    permissions: Optional[List[str]] = None
    full_name: Optional[str] = None
    phone: Optional[str] = None
    bio: Optional[str] = None
    department: Optional[str] = None
    course: Optional[str] = None
    college_id: Optional[str] = None
    college_name: Optional[str] = None


class OrganizerResponse(BaseModel):
    organizer_id: str
    user_id: str
    full_name: Optional[str] = None
    email: Optional[str] = None
    phone: Optional[str] = None
    bio: Optional[str] = None
    department: Optional[str] = None
    course: Optional[str] = None
    college_id: Optional[str] = None
    college_name: Optional[str] = None
    designation: Optional[str] = None
    permissions: Optional[List[str]] = None
    created_at: Optional[datetime] = None
    model_config = {"from_attributes": True}
