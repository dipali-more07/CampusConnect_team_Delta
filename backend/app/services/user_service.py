"""
app/services/user_service.py
=============================
User profile management business logic.

WHAT IS A SERVICE?
  Services are the "brain" of the application.
  They contain all the business rules and logic.

  RULE: Never put business logic in routers (api/v1/*.py files).
        Routers just call services.

WHAT THIS FILE HANDLES:
  - Updating user profiles (with syncing to the users table)
  - Listing users, organizers, participants
  - Creating organizer and student accounts (admin only)
  - Activating / deactivating user accounts

DATA MODEL NOTE:
  We have TWO tables that store user data:
    1. users          → Core auth info: email, password_hash, role, is_active
    2. user_profiles  → Extended info: bio, department, course, year_of_study, etc.

  Some fields are "denormalized" — meaning they exist in BOTH tables:
    (full_name, mobile/phone, department, course, college_name, gender)
  This is done for quick lookups. When updating, we MUST sync BOTH tables.
"""
from typing import Optional, List
from sqlalchemy.orm import Session

from app.repositories.user_repository import UserRepository, UserProfileRepository
from app.core.exceptions import NotFoundException, ForbiddenException, ConflictException
from app.core.constants import UserRole
from app.models.user import User, UserProfile
from app.schemas.user import UpdateProfileRequest, CreateOrganizerRequest, CreateStudentRequest
from app.core.security import hash_password
from app.repositories.college_repository import CollegeRepository
import uuid


class UserService:
    """
    All user-related business logic lives here.
    This class is instantiated in each API endpoint with the database session.
    """

    def __init__(self, db: Session):
        # We use repositories to talk to the database (no raw SQL here)
        self.db = db
        self.user_repo = UserRepository(db)
        self.profile_repo = UserProfileRepository(db)

    def get_user_with_profile(self, user_id: str) -> User:
        """
        Fetch a user by their ID. Raises 404 if not found.

        The 'with_profile' part means SQLAlchemy will also load the
        related UserProfile object in the same query (eager loading).
        """
        user = self.user_repo.get_by_id(user_id)
        if not user:
            raise NotFoundException(f"User with ID {user_id} not found")
        return user

    def update_profile(
        self, user_id: str, data: UpdateProfileRequest
    ) -> UserProfile:
        """
        Update a user's profile information.

        HOW PARTIAL UPDATE WORKS:
          data.model_dump(exclude_none=True) gives us only the fields
          the client actually sent. We loop through them and set each one.

        SYNCING TO USERS TABLE:
          Some fields (full_name, phone, department, course, gender) are
          stored in BOTH user_profiles and users tables.
          We update both to keep them in sync.

        COLLEGE HANDLING:
          college_id can be a UUID or a college name string.
          We resolve it to a real college, then save the UUID in user_profiles
          and the college name (text) in the users table.
        """
        # Get the existing profile, or create one if it doesn't exist yet
        profile = self.profile_repo.get_by_user_id(user_id)
        if not profile:
            # First time the user is updating their profile — create a blank one
            profile = UserProfile(user_id=user_id)
            self.profile_repo.create(profile)

        # Convert the request data to a dict, skipping fields that are None
        # (None means "don't change this field")
        update_data = data.model_dump(exclude_none=True)

        # --- SPECIAL HANDLING FOR college_id ---
        # college_id needs special logic: it could be a UUID or a name string
        if "college_id" in update_data:
            val = update_data["college_id"]
            if val:
                from app.repositories.college_repository import CollegeRepository
                import uuid
                college_repo = CollegeRepository(self.db)
                college = None
                is_uuid = False

                # Try to detect if the value is a UUID or a plain college name
                try:
                    uuid.UUID(val)
                    is_uuid = True
                except ValueError:
                    pass  # Not a UUID, treat as college name

                if is_uuid:
                    college = college_repo.get_by_id(val)
                if not college:
                    # Try searching by name
                    college = college_repo.get_by_name(val)
                if not college and not is_uuid:
                    # College doesn't exist yet, create an unverified one
                    from app.models.college import College
                    college = College(
                        college_name=val,
                        is_verified=False
                    )
                    college_repo.create(college)
                    self.db.flush()  # Assign college_id before using it

                if college:
                    # Save UUID in profile (foreign key to colleges table)
                    profile.college_id = college.college_id
                    # Also sync the college name (plain text) to the users table
                    user = self.user_repo.get_by_id(user_id)
                    if user:
                        user.college_name = college.college_name
                else:
                    raise NotFoundException(f"College with ID or name '{val}' not found")
            else:
                # Value is empty string or None — clear the college
                profile.college_id = None
                user = self.user_repo.get_by_id(user_id)
                if user:
                    user.college_name = None

            # Remove college_id from update_data so we don't accidentally
            # try to assign the string "college_id" directly to a UUID column
            del update_data["college_id"]

        # --- UPDATE ALL OTHER FIELDS ---
        # Load the User record to sync denormalized fields
        user = self.user_repo.get_by_id(user_id)

        for field, value in update_data.items():
            # Update the profile field
            setattr(profile, field, value)

            # Sync matching fields to the users table (denormalization sync)
            if user:
                if field == "full_name":
                    user.full_name = value
                elif field == "phone":
                    user.mobile = value       # NOTE: profile uses 'phone', users uses 'mobile'
                elif field == "department":
                    user.department = value
                elif field == "course":
                    user.course = value
                elif field == "gender":
                    # Enum might be a Gender object or a plain string — handle both
                    user.gender = value.value if hasattr(value, "value") else value

        # Save everything in one transaction
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
        """
        Get a paginated list of users. Admin only.

        PAGINATION MATH:
          skip = (page - 1) * size
          Page 1: skip 0, take 10
          Page 2: skip 10, take 10
          etc.
        """
        skip = (page - 1) * size
        users = self.user_repo.get_all_users(skip=skip, limit=size, search=search, role=role)
        total = self.user_repo.count_users(search=search, role=role)
        return users, total

    def deactivate_user(self, user_id: str, admin_user: User) -> User:
        """
        Deactivate a user account (soft delete — data is kept, just blocked).

        RULES:
          - Only admins can deactivate users
          - Admins cannot deactivate themselves
        """
        if admin_user.role != UserRole.ADMIN:
            raise ForbiddenException("Only admins can deactivate users")

        user = self.user_repo.get_by_id(user_id)
        if not user:
            raise NotFoundException(f"User {user_id} not found")

        # Safety check: admin can't lock themselves out
        if user.user_id == admin_user.user_id:
            raise ForbiddenException("You cannot deactivate your own admin account")

        user.is_active = False
        self.db.commit()
        return user

    def activate_user(self, user_id: str) -> User:
        """
        Re-activate a previously deactivated user.
        Sets is_active = True so they can log in again.
        """
        user = self.user_repo.get_by_id(user_id)
        if not user:
            raise NotFoundException(f"User {user_id} not found")
        user.is_active = True
        self.db.commit()
        return user

    def delete_user(self, user_id: str, admin_user: User) -> None:
        """
        Completely delete a user from the database. Admin only.
        """
        if admin_user.role != UserRole.ADMIN:
            raise ForbiddenException("Only admins can delete users")

        user = self.user_repo.get_by_id(user_id)
        if not user:
            raise NotFoundException(f"User {user_id} not found")

        if user.user_id == admin_user.user_id:
            raise ForbiddenException("You cannot delete your own admin account")

        self.user_repo.delete(user)
        self.db.commit()

    def create_organizer(self, data: CreateOrganizerRequest) -> User:
        """
        Create a new organizer account. Admin only.

        WHAT GETS CREATED:
          1. User record (role = ORGANIZER)
          2. UserProfile record (linked to User by user_id)
          3. Organizer record (with default permissions)

        All 3 are saved in a single database transaction.
        If any step fails, nothing is saved (atomic operation).
        """
        # 1. Make sure the email isn't already registered
        existing_user = self.user_repo.get_by_email(data.email)
        if existing_user:
            raise ConflictException(f"User with email '{data.email}' already exists")

        # 2. Resolve college (by UUID or by name)
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
            # Auto-create an unverified college record if name is provided
            from app.models.college import College
            college = College(
                college_name=data.college_id,
                is_verified=False
            )
            college_repo.create(college)
            self.db.flush()

        if not college:
            raise NotFoundException(f"College '{data.college_id}' not found")

        # 3. Hash the password — NEVER store plain text passwords
        pwd_hash = hash_password(data.password)

        # 4. Create User record
        user = User(
            email=data.email,
            password_hash=pwd_hash,
            role=UserRole.ORGANIZER,
            is_active=True,
            is_email_verified=True,     # Admin-created users skip email verification
            full_name=data.full_name,
            mobile=data.phone,
            college_name=college.college_name,
            department=data.department,
            gender=data.gender.value if data.gender else None,
        )
        self.user_repo.create(user)
        self.db.flush()                 # Generate user_id before creating profile

        # 5. Create UserProfile linked to this User
        profile = UserProfile(
            user_id=user.user_id,
            college_id=college.college_id,
            full_name=data.full_name,
            phone=data.phone,
            department=data.department,
            gender=data.gender,
        )
        self.profile_repo.create(profile)

        # 6. Create the Organizer record (gives organizer-specific permissions)
        from app.models.organizer import Organizer
        organizer = Organizer(
            user_id=user.user_id,
            designation="Organizer",
            permissions=["create_event", "manage_attendance"]
        )
        self.db.add(organizer)

        # 7. Commit all 3 records at once (atomic transaction)
        self.db.commit()
        self.db.refresh(user)
        return user

    def create_student(self, data: CreateStudentRequest) -> User:
        """
        Create a new student (participant) account. Admin/Organizer only.

        Similar to create_organizer, but:
          - role = PARTICIPANT
          - No Organizer record created
          - year_of_study field is also set
        """
        # 1. Check for duplicate email
        existing_user = self.user_repo.get_by_email(data.email)
        if existing_user:
            raise ConflictException(f"User with email '{data.email}' already exists")

        # 2. Resolve college (by UUID or by name)
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
            from app.models.college import College
            college = College(
                college_name=data.college_id,
                is_verified=False
            )
            college_repo.create(college)
            self.db.flush()

        if not college:
            raise NotFoundException(f"College '{data.college_id}' not found")

        # 3. Hash the password
        pwd_hash = hash_password(data.password)

        # 4. Create User record
        user = User(
            email=data.email,
            password_hash=pwd_hash,
            role=UserRole.PARTICIPANT,
            is_active=True,
            is_email_verified=True,     # Pre-created by admin — auto verified
            full_name=data.full_name,
            mobile=data.phone,
            college_name=college.college_name,
            department=data.department,
            course=data.course,
            gender=data.gender.value if data.gender else None,
        )
        self.user_repo.create(user)
        self.db.flush()

        # 5. Create UserProfile linked to this User
        profile = UserProfile(
            user_id=user.user_id,
            college_id=college.college_id,
            full_name=data.full_name,
            phone=data.phone,
            department=data.department,
            course=data.course,
            gender=data.gender,
            year_of_study=data.year_of_study,  # Stored only in profile, not in users table
        )
        self.profile_repo.create(profile)

        # 6. Save everything
        self.db.commit()
        self.db.refresh(user)
        return user

    def get_appearance_preferences(self, user_id: str) -> dict:
        """Get the user's appearance preferences from their profile."""
        profile = self.profile_repo.get_by_user_id(user_id)
        if not profile:
            raise NotFoundException(f"Profile for user {user_id} not found")
        return {
            "theme_mode": profile.theme_mode or "light",
            "accent_color": profile.accent_color or "#6366f1",
            "font_size": profile.font_size or "medium"
        }

    def update_appearance_preferences(self, user_id: str, data: any) -> dict:
        """Update the user's appearance preferences on their profile."""
        profile = self.profile_repo.get_by_user_id(user_id)
        if not profile:
            raise NotFoundException(f"Profile for user {user_id} not found")
        
        profile.theme_mode = data.theme_mode
        profile.accent_color = data.accent_color
        profile.font_size = data.font_size
        
        self.db.commit()
        self.db.refresh(profile)
        return {
            "theme_mode": profile.theme_mode,
            "accent_color": profile.accent_color,
            "font_size": profile.font_size
        }
