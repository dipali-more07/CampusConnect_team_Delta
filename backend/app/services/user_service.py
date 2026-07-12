"""
app/services/user_service.py
User profile management business logic.
"""
from typing import Optional, List
from sqlalchemy.orm import Session

from app.repositories.user_repository import UserRepository, UserProfileRepository
from app.core.exceptions import NotFoundException, ForbiddenException, ConflictException
from app.core.constants import UserRole
from app.models.user import User, UserProfile
from app.schemas.user import UpdateProfileRequest, CreateOrganizerRequest
from app.core.security import hash_password
from app.repositories.college_repository import CollegeRepository
import uuid


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
        
        # If college_id is provided, resolve it to college object
        if "college_id" in update_data:
            val = update_data["college_id"]
            if val:
                from app.repositories.college_repository import CollegeRepository
                import uuid
                college_repo = CollegeRepository(self.db)
                college = None
                is_uuid = False
                try:
                    uuid.UUID(val)
                    is_uuid = True
                except ValueError:
                    pass

                if is_uuid:
                    college = college_repo.get_by_id(val)
                if not college:
                    college = college_repo.get_by_name(val)
                if not college and not is_uuid:
                    from app.models.college import College
                    college = College(
                        college_name=val,
                        is_verified=False
                    )
                    college_repo.create(college)
                    self.db.flush()
                
                if college:
                    profile.college_id = college.college_id
                    # Also update denormalized college_name in User table
                    user = self.user_repo.get_by_id(user_id)
                    if user:
                        user.college_name = college.college_name
                else:
                    raise NotFoundException(f"College with ID or name '{val}' not found")
            else:
                profile.college_id = None
                user = self.user_repo.get_by_id(user_id)
                if user:
                    user.college_name = None
            
            # Remove from update_data so we don't try to assign string to UUID column directly
            del update_data["college_id"]

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

    def create_organizer(self, data: CreateOrganizerRequest) -> User:
        """Create a new organizer user. Admin only."""
        # 1. Check duplicate email
        existing_user = self.user_repo.get_by_email(data.email)
        if existing_user:
            raise ConflictException(f"User with email '{data.email}' already exists")

        # 2. Resolve college
        college_repo = CollegeRepository(self.db)
        is_uuid = False
        try:
            uuid.UUID(data.college_id)
            is_uuid = True
        except ValueError:
            pass

        college = None
        if is_uuid:
            college = college_repo.get_by_id(data.college_id)
        if not college:
            college = college_repo.get_by_name(data.college_id)
        
        if not college and not is_uuid:
            # Create a new unverified college if it doesn't exist yet
            from app.models.college import College
            college = College(
                college_name=data.college_id,
                is_verified=False
            )
            college_repo.create(college)
            self.db.flush()

        if not college:
            raise NotFoundException(f"College '{data.college_id}' not found")

        # 3. Hash password
        pwd_hash = hash_password(data.password)

        # 4. Create User
        user = User(
            email=data.email,
            password_hash=pwd_hash,
            role=UserRole.ORGANIZER,
            is_active=True,
            is_email_verified=True,  # Organizer pre-created by admin is auto-verified
            full_name=data.full_name,
            mobile=data.phone,
            college_name=college.college_name,
            department=data.department,
        )
        self.user_repo.create(user)
        self.db.flush()

        # 5. Create Profile
        profile = UserProfile(
            user_id=user.user_id,
            college_id=college.college_id,
            full_name=data.full_name,
            phone=data.phone,
            department=data.department,
        )
        self.profile_repo.create(profile)

        # 6. Create Organizer record
        from app.models.organizer import Organizer
        organizer = Organizer(
            user_id=user.user_id,
            designation="Organizer",
            permissions=["create_event", "manage_attendance"]
        )
        self.db.add(organizer)

        self.db.commit()
        self.db.refresh(user)
        return user
