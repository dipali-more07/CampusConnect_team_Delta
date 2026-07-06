"""
app/schemas/college.py
College Pydantic schemas.
"""
from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime


class CreateCollegeRequest(BaseModel):
    college_name: str = Field(..., min_length=2, max_length=255)
    city: Optional[str] = Field(None, max_length=100)
    state: Optional[str] = Field(None, max_length=100)
    website: Optional[str] = Field(None, max_length=500)


class UpdateCollegeRequest(BaseModel):
    college_name: Optional[str] = Field(None, min_length=2, max_length=255)
    city: Optional[str] = Field(None, max_length=100)
    state: Optional[str] = Field(None, max_length=100)
    website: Optional[str] = Field(None, max_length=500)
    is_verified: Optional[bool] = None


class CollegeResponse(BaseModel):
    college_id: str
    college_name: str
    city: Optional[str] = None
    state: Optional[str] = None
    website: Optional[str] = None
    logo: Optional[str] = None
    is_verified: bool
    created_at: datetime
    model_config = {"from_attributes": True}
