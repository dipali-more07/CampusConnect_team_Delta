"""
app/services/user_service.py
User profile management business logic.
"""
from typing import Optional, List
from sqlalchemy.orm import Session

from app.repositories.user_repository import UserRepository, UserProfileRepository
from app.core.exceptions import NotFoundException, ForbiddenException
from app.core.constants import UserRole
from app.models.user import User, UserProfile
from app.schemas.user import UpdateProfileRequest


class UserService:
    def __init__(self, db: Session):
        self.db = db
        self.user_repo = UserRepository(db)
        self.profile_repo = UserProfileRepository(db)

    def get_user_with_profile(self, user_id: str) -> User:
        """Get a user with their profile loaded."""
        user = self.user_repo.get_by_id(user_id)
        if not user:
            raise NotFoundException(f"User with ID {user_id} not found")
        return user

    def update_profile(
        self, user_id: str, data: UpdateProfileRequest
    ) -> UserProfile:
        """Update a user's profile information."""
        profile = self.profile_repo.get_by_user_id(user_id)
        if not profile:
            # Create profile if it doesn't exist
            profile = UserProfile(user_id=user_id)
            self.profile_repo.create(profile)

        # Update only provided fields (partial update)
        update_data = data.model_dump(exclude_none=True)
        for field, value in update_data.items():
            setattr(profile, field, value)

        self.db.commit()
        self.db.refresh(profile)
        return profile

    def get_all_users(
        self,
        page: int = 1,
        size: int = 10,
        search: Optional[str] = None,
        role: Optional[str] = None,
    ) -> tuple[List[User], int]:
        """Get paginated list of users. Admin only."""
        skip = (page - 1) * size
        users = self.user_repo.get_all_users(skip=skip, limit=size, search=search, role=role)
        total = self.user_repo.count_users(search=search, role=role)
        return users, total

    def deactivate_user(self, user_id: str, admin_user: User) -> User:
        """Deactivate (soft delete) a user account. Admin only."""
        if admin_user.role != UserRole.ADMIN:
            raise ForbiddenException("Only admins can deactivate users")

        user = self.user_repo.get_by_id(user_id)
        if not user:
            raise NotFoundException(f"User {user_id} not found")

        if user.user_id == admin_user.user_id:
            raise ForbiddenException("You cannot deactivate your own admin account")

        user.is_active = False
        self.db.commit()
        return user

    def activate_user(self, user_id: str) -> User:
        """Re-activate a deactivated user account."""
        user = self.user_repo.get_by_id(user_id)
        if not user:
            raise NotFoundException(f"User {user_id} not found")
        user.is_active = True
        self.db.commit()
        return user
