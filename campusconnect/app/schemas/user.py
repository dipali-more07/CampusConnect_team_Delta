"""
app/schemas/user.py
User and UserProfile Pydantic schemas.
"""
from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime
from app.core.constants import UserRole, Gender


class UserResponse(BaseModel):
    """User info returned in API responses. NEVER includes password_hash."""
    user_id: str
    email: str
    role: UserRole
    is_active: bool
    is_email_verified: bool
    created_at: datetime
    last_login: Optional[datetime] = None
    model_config = {"from_attributes": True}


class UpdateProfileRequest(BaseModel):
    full_name: Optional[str] = Field(None, max_length=255)
    phone: Optional[str] = Field(None, max_length=20)
    gender: Optional[Gender] = None
    department: Optional[str] = Field(None, max_length=255)
    course: Optional[str] = Field(None, max_length=255)
    year_of_study: Optional[int] = Field(None, ge=1, le=10)
    bio: Optional[str] = Field(None, max_length=1000)
    college_id: Optional[str] = None


class UserProfileResponse(BaseModel):
    profile_id: str
    user_id: str
    full_name: Optional[str] = None
    phone: Optional[str] = None
    gender: Optional[Gender] = None
    department: Optional[str] = None
    course: Optional[str] = None
    year_of_study: Optional[int] = None
    bio: Optional[str] = None
    profile_picture: Optional[str] = None
    college_id: Optional[str] = None
    created_at: datetime
    updated_at: datetime
    model_config = {"from_attributes": True}


class UserWithProfileResponse(UserResponse):
    profile: Optional[UserProfileResponse] = None
    model_config = {"from_attributes": True}


from pydantic import EmailStr

class CreateOrganizerRequest(BaseModel):
    email: EmailStr
    password: str = Field(..., min_length=8)
    full_name: str = Field(..., min_length=3, max_length=255)
    phone: str = Field(..., min_length=10, max_length=20)
    department: Optional[str] = Field(None, max_length=255)
    college_id: str
