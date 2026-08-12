import re
import base64
from pydantic import BaseModel, EmailStr, Field, field_validator
from app.core.constants import UserRole, Gender
from typing import Optional


def decode_btoa_email(v: any) -> any:
    """Dynamically decodes plain text or base64 (btoa) encoded email."""
    if not isinstance(v, str):
        return v

    v_clean = v.strip()
    if "@" in v_clean:
        return v_clean

    try:
        padding_needed = (4 - len(v_clean) % 4) % 4
        padded_v = v_clean + ("=" * padding_needed)

        for decoder in (base64.b64decode, base64.urlsafe_b64decode):
            try:
                decoded_bytes = decoder(padded_v)
                decoded_str = decoded_bytes.decode("utf-8", errors="ignore").strip()
                if "@" in decoded_str:
                    return decoded_str
            except Exception:
                pass
    except Exception:
        pass

    return v_clean


def decode_btoa_password(v: any) -> any:
    """Dynamically decodes plain text or base64 (btoa) encoded password."""
    if not isinstance(v, str):
        return v

    v_clean = v.strip()
    if not v_clean:
        return v_clean

    try:
        padding_needed = (4 - len(v_clean) % 4) % 4
        padded_v = v_clean + ("=" * padding_needed)

        for decoder in (base64.b64decode, base64.urlsafe_b64decode):
            try:
                decoded_bytes = decoder(padded_v)
                decoded_str = decoded_bytes.decode("utf-8").strip()
                if decoded_str and all(ord(c) >= 32 for c in decoded_str):
                    encoded_again = base64.b64encode(decoded_str.encode("utf-8")).decode("utf-8").rstrip("=")
                    if encoded_again == v_clean.rstrip("="):
                        return decoded_str
            except Exception:
                pass
    except Exception:
        pass

    return v_clean


class RegisterRequest(BaseModel):
    """Data needed to create a new account."""
    email: EmailStr = Field(..., description="Valid email address")
    password: str = Field(..., min_length=8, description="Password (min 8 chars)")
    confirm_password: str = Field(..., description="Must match password")
    full_name: str = Field(..., min_length=1, max_length=255, description="User's full name")
    phone: str = Field(..., min_length=10, max_length=20, description="Mobile / phone number")
    course: str = Field(..., min_length=1, max_length=255, description="Course / degree program")
    department: Optional[str] = Field(None, max_length=255, description="Department (e.g. CSE, IT)")
    college_id: str = Field(..., description="College identifier UUID")
    gender: Optional[Gender] = Field(None, description="Gender (male, female, other, prefer_not_to_say)")
    year_of_study: Optional[int] = Field(None, ge=1, le=5, description="Year of study (1-5)")

    @field_validator("email", mode="before")
    @classmethod
    def validate_btoa_email(cls, v: any) -> any:
        return decode_btoa_email(v)

    @field_validator("password", "confirm_password", mode="before")
    @classmethod
    def validate_btoa_passwords(cls, v: any) -> any:
        return decode_btoa_password(v)

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

    @field_validator("phone")
    @classmethod
    def validate_phone_number(cls, v: str) -> str:
        from app.utils.validators import is_valid_phone
        if not is_valid_phone(v):
            raise ValueError("Invalid phone number format")
        return v

    @field_validator("password")
    @classmethod
    def validate_password_strength(cls, v: str) -> str:
        """Enforce strong password rules."""
        if isinstance(v, str) and len(v) == 64 and all(c in "0123456789abcdefABCDEF" for c in v):
            return v
        if not re.search(r"[A-Z]", v):
            raise ValueError("Password must contain at least one uppercase letter")
        if not re.search(r"[a-z]", v):
            raise ValueError("Password must contain at least one lowercase letter")
        if not re.search(r"\d", v):
            raise ValueError("Password must contain at least one number")
        if not re.search(r'[!@#$%^&*(),.?":{}|<>]', v):
            raise ValueError("Password must contain at least one special character")
        return v

    @field_validator("confirm_password")
    @classmethod
    def passwords_must_match(cls, v: str, info) -> str:
        if "password" in info.data and v != info.data["password"]:
            raise ValueError("Passwords do not match")
        return v


class LoginRequest(BaseModel):
    email: EmailStr
    password: str

    @field_validator("email", mode="before")
    @classmethod
    def validate_btoa_email(cls, v: any) -> any:
        return decode_btoa_email(v)

    @field_validator("password", mode="before")
    @classmethod
    def validate_btoa_password(cls, v: any) -> any:
        return decode_btoa_password(v)


class TokenResponse(BaseModel):
    """Response after successful login."""
    access_token: str
    refresh_token: str
    token_type: str = "bearer"
    expires_in: int  # seconds


class RefreshTokenRequest(BaseModel):
    refresh_token: str


class ForgotPasswordRequest(BaseModel):
    email: EmailStr

    @field_validator("email", mode="before")
    @classmethod
    def validate_btoa_email(cls, v: any) -> any:
        return decode_btoa_email(v)


class ResetPasswordRequest(BaseModel):
    token: str
    new_password: str = Field(..., min_length=8)
    confirm_password: str

    @field_validator("new_password", "confirm_password", mode="before")
    @classmethod
    def validate_btoa_passwords(cls, v: any) -> any:
        return decode_btoa_password(v)

    @field_validator("new_password")
    @classmethod
    def validate_password_strength(cls, v: str) -> str:
        if isinstance(v, str) and len(v) == 64 and all(c in "0123456789abcdefABCDEF" for c in v):
            return v
        if not re.search(r"[A-Z]", v):
            raise ValueError("Password must contain at least one uppercase letter")
        if not re.search(r"[a-z]", v):
            raise ValueError("Password must contain at least one lowercase letter")
        if not re.search(r"\d", v):
            raise ValueError("Password must contain at least one number")
        return v

    @field_validator("confirm_password")
    @classmethod
    def passwords_must_match(cls, v: str, info) -> str:
        if "new_password" in info.data and v != info.data["new_password"]:
            raise ValueError("Passwords do not match")
        return v


class ChangePasswordRequest(BaseModel):
    current_password: str
    new_password: str = Field(..., min_length=8)
    confirm_password: str

    @field_validator("current_password", "new_password", "confirm_password", mode="before")
    @classmethod
    def validate_btoa_passwords(cls, v: any) -> any:
        return decode_btoa_password(v)

    @field_validator("new_password")
    @classmethod
    def validate_password_strength(cls, v: str) -> str:
        if isinstance(v, str) and len(v) == 64 and all(c in "0123456789abcdefABCDEF" for c in v):
            return v
        if not re.search(r"[A-Z]", v):
            raise ValueError("Password must have uppercase")
        if not re.search(r"[a-z]", v):
            raise ValueError("Password must have lowercase")
        if not re.search(r"\d", v):
            raise ValueError("Password must have a number")
        return v

    @field_validator("confirm_password")
    @classmethod
    def passwords_must_match(cls, v: str, info) -> str:
        if "new_password" in info.data and v != info.data["new_password"]:
            raise ValueError("Passwords do not match")
        return v


class VerifyEmailRequest(BaseModel):
    email: EmailStr
    code: str = Field(..., min_length=6, max_length=6, description="6-digit verification code")

    @field_validator("email", mode="before")
    @classmethod
    def validate_btoa_email(cls, v: any) -> any:
        return decode_btoa_email(v)


class ResendCodeRequest(BaseModel):
    email: EmailStr

    @field_validator("email", mode="before")
    @classmethod
    def validate_btoa_email(cls, v: any) -> any:
        return decode_btoa_email(v)
