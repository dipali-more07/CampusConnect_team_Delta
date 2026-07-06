"""
app/schemas/club.py
Club Pydantic schemas.
"""
from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime


class CreateClubRequest(BaseModel):
    college_id: str
    club_name: str = Field(..., min_length=2, max_length=255)
    description: Optional[str] = Field(None, max_length=2000)
    faculty_incharge: Optional[str] = Field(None, max_length=255)


class UpdateClubRequest(BaseModel):
    club_name: Optional[str] = Field(None, min_length=2, max_length=255)
    description: Optional[str] = Field(None, max_length=2000)
    faculty_incharge: Optional[str] = Field(None, max_length=255)


class ClubResponse(BaseModel):
    club_id: str
    college_id: str
    club_name: str
    description: Optional[str] = None
    faculty_incharge: Optional[str] = None
    created_at: datetime
    model_config = {"from_attributes": True}
