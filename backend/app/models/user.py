"""
app/models/user.py
==================
User and UserProfile database models (tables).

WHY TWO TABLES:
  User table = authentication data (email, password, role)
  UserProfile table = personal info (name, phone, department)

  This separation means:
  - Auth data is clean and small (faster auth queries)
  - Profile data can grow without affecting auth performance
  - 3NF (Third Normal Form) - no data redundancy

UUID PRIMARY KEYS:
  We use UUID (like 'a1b2c3d4-...') instead of integers (1, 2, 3).
  WHY: Integers are predictable - a hacker can guess IDs.
       UUIDs are random - impossible to guess other users' IDs.
"""
from app.models.college import College
from app.models.registration import EventRegistration
from app.models.token import PasswordResetToken
from app.models.token import RefreshToken
from app.models.certificate import Certificate
from app.models.notification import Notification
import uuid
from datetime import datetime
from typing import Optional, List
from sqlalchemy import String, Boolean, DateTime, ForeignKey, Text, Enum as SAEnum
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.dialects.postgresql import UUID

from app.database.base import Base
from app.core.constants import UserRole, Gender


class User(Base):
    """
    The main Users table - stores authentication information.
    Every person using the system has a record here.
    """
    __tablename__ = "users"

    # UUID primary key - auto-generated, unique, unpredictable
    user_id: Mapped[str] = mapped_column(
        UUID(as_uuid=False),
        primary_key=True,
        default=lambda: str(uuid.uuid4()),
        index=True,
    )
    email: Mapped[str] = mapped_column(
        String(255),
        unique=True,
        nullable=False,
        index=True,
    )
    # NEVER store plain passwords. Store the bcrypt hash.
    password_hash: Mapped[str] = mapped_column(String(255), nullable=False)
    role: Mapped[str] = mapped_column(
        SAEnum(UserRole, name="userrole"),
        nullable=False,
        default=UserRole.PARTICIPANT,
    )
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    is_email_verified: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    verification_code: Mapped[Optional[str]] = mapped_column(String(6), nullable=True)
    verification_code_expires_at: Mapped[Optional[datetime]] = mapped_column(DateTime, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at: Mapped[datetime] = mapped_column(
        DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False
    )
    last_login: Mapped[Optional[datetime]] = mapped_column(DateTime, nullable=True)

    # Direct profile columns from ER Diagram
    full_name: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    mobile: Mapped[Optional[str]] = mapped_column(String(20), nullable=True)
    college_name: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    department: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    course: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    profile_image: Mapped[Optional[str]] = mapped_column(String(500), nullable=True)
    gender: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)

    # RELATIONSHIPS
    profile: Mapped[Optional["UserProfile"]] = relationship(
        "UserProfile", back_populates="user", uselist=False, cascade="all, delete-orphan"
    )
    registrations: Mapped[List["EventRegistration"]] = relationship(
        "EventRegistration", back_populates="user", cascade="all, delete-orphan"
    )
    notifications: Mapped[List["Notification"]] = relationship(
        "Notification", back_populates="user", cascade="all, delete-orphan"
    )
    certificates: Mapped[List["Certificate"]] = relationship(
        "Certificate", back_populates="user", cascade="all, delete-orphan"
    )
    refresh_tokens: Mapped[List["RefreshToken"]] = relationship(
        "RefreshToken", back_populates="user", cascade="all, delete-orphan"
    )
    password_reset_tokens: Mapped[List["PasswordResetToken"]] = relationship(
        "PasswordResetToken", back_populates="user", cascade="all, delete-orphan"
    )

    def __repr__(self) -> str:
        return f"<User {self.email} ({self.role})>"


class UserProfile(Base):
    """
    The UserProfile table - stores personal information.
    Every User has one UserProfile.
    """
    __tablename__ = "user_profiles"

    profile_id: Mapped[str] = mapped_column(
        UUID(as_uuid=False), primary_key=True, default=lambda: str(uuid.uuid4())
    )
    user_id: Mapped[str] = mapped_column(
        UUID(as_uuid=False),
        ForeignKey("users.user_id", ondelete="CASCADE"),
        unique=True,
        nullable=False,
        index=True,
    )
    college_id: Mapped[Optional[str]] = mapped_column(
        UUID(as_uuid=False),
        ForeignKey("colleges.college_id", ondelete="SET NULL"),
        nullable=True,
    )
    full_name: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    phone: Mapped[Optional[str]] = mapped_column(String(20), nullable=True)
    gender: Mapped[Optional[str]] = mapped_column(SAEnum(Gender, name="gender"), nullable=True)
    department: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    course: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    year_of_study: Mapped[Optional[int]] = mapped_column(nullable=True)
    bio: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    profile_picture: Mapped[Optional[str]] = mapped_column(String(500), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    updated_at: Mapped[datetime] = mapped_column(
        DateTime, default=datetime.utcnow, onupdate=datetime.utcnow
    )

    user: Mapped["User"] = relationship("User", back_populates="profile")
    college: Mapped[Optional["College"]] = relationship("College", back_populates="students")

    def __repr__(self) -> str:
        return f"<UserProfile {self.full_name}>"
