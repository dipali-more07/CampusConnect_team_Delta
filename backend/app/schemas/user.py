"""
app/schemas/user.py
====================
Pydantic schemas (data models) for user-related API requests and responses.

WHAT ARE SCHEMAS?
  Schemas define the SHAPE of data going in and out of the API.
  - Request schemas: validate data SENT BY the client (frontend)
  - Response schemas: define data SENT BACK to the client

PYDANTIC DOES AUTOMATIC VALIDATION:
  If a required field is missing, or a value is the wrong type,
  FastAPI will automatically return a 422 Unprocessable Entity error
  with a clear message — no manual validation code needed!

IMPORTANT: Do NOT change field names here — the frontend uses these exact names.
"""
from pydantic import BaseModel, Field, field_validator
from typing import Optional
from datetime import datetime
from app.core.constants import UserRole, Gender


class UserResponse(BaseModel):
    """
    Basic user info returned in API responses.

    SECURITY NOTE: This NEVER includes password_hash.
    We only expose safe, public-facing fields.
    """
    user_id: str
    email: str
    role: UserRole                      # "admin", "organizer", or "participant"
    is_active: bool                     # False if the user is deactivated
    is_email_verified: bool             # False until they verify via OTP
    created_at: datetime
    last_login: Optional[datetime] = None  # None if they've never logged in

    # This tells Pydantic to read data from SQLAlchemy model attributes (ORM mode)
    model_config = {"from_attributes": True}


class UpdateProfileRequest(BaseModel):
    """
    Data the frontend sends when a user wants to update their profile.

    ALL FIELDS ARE OPTIONAL — this is a partial update (PATCH).
    Only fields that are provided will be updated; others stay unchanged.

    FIELD GUIDE:
      full_name    → User's display name
      phone        → Contact phone number
      gender       → Enum: "male", "female", "other", "prefer_not_to_say"
      department   → Academic department (e.g., "CSE", "Mechanical")
      course       → Degree program (e.g., "B.Tech", "MBA")
      year_of_study → Current academic year (1 to 10)
      bio          → Short user bio / about text (max 1000 chars)
      college_id   → Can be a UUID or a college name string
    """
    full_name: Optional[str] = Field(None, max_length=255)
    phone: Optional[str] = Field(None, max_length=20)
    gender: Optional[Gender] = None                             # Enum from constants.py
    
    @field_validator("gender", mode="before")
    @classmethod
    def validate_gender(cls, v: any) -> Optional[Gender]:
        if not v:
            return None
        if isinstance(v, Gender):
            return v
        if isinstance(v, str):
            v_clean = v.strip().lower()
            if v_clean in ["male", "m"]:
                return Gender.MALE
            if v_clean in ["female", "f"]:
                return Gender.FEMALE
            if v_clean in ["other", "o"]:
                return Gender.OTHER
            if v_clean in ["prefer_not_to_say", "prefer not to say", "none"]:
                return Gender.PREFER_NOT_TO_SAY
            try:
                return Gender(v_clean)
            except ValueError:
                pass
        raise ValueError("Invalid gender value. Must be 'male' or 'female'")

    department: Optional[str] = Field(None, max_length=255)
    course: Optional[str] = Field(None, max_length=255)
    year_of_study: Optional[int] = Field(None, ge=1, le=10)    # 1 to 10
    bio: Optional[str] = Field(None, max_length=1000)
    college_id: Optional[str] = None                            # UUID or name


class UserProfileResponse(BaseModel):
    """
    Detailed profile information returned in responses.
    Used when frontend needs to show the full profile page.

    This maps to the user_profiles table in the database.
    """
    profile_id: str
    user_id: str                            # Links back to the users table
    full_name: Optional[str] = None
    phone: Optional[str] = None
    gender: Optional[Gender] = None
    department: Optional[str] = None
    course: Optional[str] = None
    year_of_study: Optional[int] = None
    bio: Optional[str] = None
    profile_picture: Optional[str] = None  # File path or URL
    college_id: Optional[str] = None
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class UserWithProfileResponse(UserResponse):
    """
    Extended user response that includes the nested profile object.
    Inherits all fields from UserResponse and adds the profile.
    """
    profile: Optional[UserProfileResponse] = None
    model_config = {"from_attributes": True}


from pydantic import EmailStr


class CreateOrganizerRequest(BaseModel):
    """
    Data needed when an admin creates a new organizer account.

    NOTE: Unlike self-registration, organizers created this way:
      - Are auto-verified (no OTP email needed)
      - Get role = "organizer" automatically

    FIELD GUIDE:
      email      → Must be unique (not already registered)
      password   → Min 8 characters (hashed before saving)
      full_name  → Display name (min 3 chars)
      phone      → Contact number (min 10, max 20 chars)
      department → Optional: their department
      college_id → UUID or college name string
      gender     → Optional: "male", "female", "other", "prefer_not_to_say"
    """
    email: EmailStr                                              # Validated email format
    password: str = Field(..., min_length=8)
    full_name: str = Field(..., min_length=3, max_length=255)
    phone: str = Field(..., min_length=10, max_length=20)
    department: Optional[str] = Field(None, max_length=255)
    college_id: str                                             # Required
    gender: Optional[Gender] = None

    @field_validator("gender", mode="before")
    @classmethod
    def validate_gender(cls, v: any) -> Optional[Gender]:
        if not v:
            return None
        if isinstance(v, Gender):
            return v
        if isinstance(v, str):
            v_clean = v.strip().lower()
            if v_clean in ["male", "m"]:
                return Gender.MALE
            if v_clean in ["female", "f"]:
                return Gender.FEMALE
            if v_clean in ["other", "o"]:
                return Gender.OTHER
            if v_clean in ["prefer_not_to_say", "prefer not to say", "none"]:
                return Gender.PREFER_NOT_TO_SAY
            try:
                return Gender(v_clean)
            except ValueError:
                pass
        raise ValueError("Invalid gender value. Must be 'male' or 'female'")


class CreateStudentRequest(BaseModel):
    """
    Data needed when an admin or organizer creates a new student account.

    DIFFERENCE FROM REGISTER:
      - Phone is optional here (admin may not have it)
      - Student is auto-verified (is_email_verified = True)
      - year_of_study can be provided (1 to 10)

    FIELD GUIDE:
      email        → Must be unique
      password     → Min 8 characters
      full_name    → Display name (min 3 chars)
      phone        → Optional contact number
      department   → Optional academic department
      course       → Optional degree program
      college_id   → UUID or college name string
      gender       → Optional: "male", "female", "other", "prefer_not_to_say"
      year_of_study → Optional: 1 to 10
    """
    email: EmailStr
    password: str = Field(..., min_length=8)
    full_name: str = Field(..., min_length=3, max_length=255)
    phone: Optional[str] = Field(None, min_length=10, max_length=20)   # Optional
    department: Optional[str] = Field(None, max_length=255)
    course: Optional[str] = Field(None, max_length=255)
    college_id: str
    gender: Optional[Gender] = None

    @field_validator("gender", mode="before")
    @classmethod
    def validate_gender(cls, v: any) -> Optional[Gender]:
        if not v:
            return None
        if isinstance(v, Gender):
            return v
        if isinstance(v, str):
            v_clean = v.strip().lower()
            if v_clean in ["male", "m"]:
                return Gender.MALE
            if v_clean in ["female", "f"]:
                return Gender.FEMALE
            if v_clean in ["other", "o"]:
                return Gender.OTHER
            if v_clean in ["prefer_not_to_say", "prefer not to say", "none"]:
                return Gender.PREFER_NOT_TO_SAY
            try:
                return Gender(v_clean)
            except ValueError:
                pass
        raise ValueError("Invalid gender value. Must be 'male' or 'female'")

    year_of_study: Optional[int] = Field(None, ge=1, le=10)


class AppearancePreferencesRequest(BaseModel):
    theme_mode: str = Field(..., description="Theme mode: light or dark")
    accent_color: str = Field(..., description="Selected accent color hex code (e.g. #6366f1)")
    font_size: str = Field(..., description="Font size choice: sm, medium, or lg")


class AppearancePreferencesResponse(BaseModel):
    theme_mode: str
    accent_color: str
    font_size: str

    model_config = {"from_attributes": True}
