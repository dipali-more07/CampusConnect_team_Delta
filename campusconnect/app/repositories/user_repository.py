"""
app/repositories/user_repository.py
=====================================
User and UserProfile database operations.

REPOSITORY RULES:
  - Only database queries go here
  - NO business logic (that goes in services)
  - NO commit() calls (services handle transactions)
  - Return model objects or None, never raise HTTP exceptions
"""
from typing import Optional, List
from sqlalchemy.orm import Session
from sqlalchemy import select, or_, func

from app.repositories.base import BaseRepository
from app.models.user import User, UserProfile


class UserRepository(BaseRepository[User]):
    def __init__(self, db: Session):
        super().__init__(User, db)

    def get_by_id(self, user_id: str) -> Optional[User]:
        """Get user by UUID."""
        return self.db.execute(
            select(User).where(User.user_id == user_id)
        ).scalar_one_or_none()

    def get_by_email(self, email: str) -> Optional[User]:
        """Get user by email. Used during login to find the user."""
        return self.db.execute(
            select(User).where(User.email == email)
        ).scalar_one_or_none()

    def email_exists(self, email: str) -> bool:
        """Check if email is already registered."""
        result = self.db.execute(
            select(func.count()).select_from(User).where(User.email == email)
        ).scalar()
        return (result or 0) > 0

    def get_all_users(self, skip: int = 0, limit: int = 10, search: Optional[str] = None, role: Optional[str] = None) -> List[User]:
        """Get paginated list of users with optional search and role filter."""
        query = select(User)
        if search:
            query = query.where(User.email.ilike(f"%{search}%"))
        if role:
            query = query.where(User.role == role)
        query = query.order_by(User.created_at.desc()).offset(skip).limit(limit)
        return list(self.db.execute(query).scalars().all())

    def count_users(self, search: Optional[str] = None, role: Optional[str] = None) -> int:
        query = select(func.count()).select_from(User)
        if search:
            query = query.where(User.email.ilike(f"%{search}%"))
        if role:
            query = query.where(User.role == role)
        return self.db.execute(query).scalar() or 0

    def update_last_login(self, user: User) -> None:
        """Update last_login timestamp when user logs in."""
        from datetime import datetime
        user.last_login = datetime.utcnow()
        self.db.flush()


class UserProfileRepository(BaseRepository[UserProfile]):
    def __init__(self, db: Session):
        super().__init__(UserProfile, db)

    def get_by_user_id(self, user_id: str) -> Optional[UserProfile]:
        """Get a user's profile by their user_id."""
        return self.db.execute(
            select(UserProfile).where(UserProfile.user_id == user_id)
        ).scalar_one_or_none()

    def get_by_id(self, profile_id: str) -> Optional[UserProfile]:
        return self.db.execute(
            select(UserProfile).where(UserProfile.profile_id == profile_id)
        ).scalar_one_or_none()
