"""
app/api/v1/users.py
====================
User and profile management endpoints.

WHAT THIS FILE DOES:
  Handles everything about user profiles and user management:
  - Users updating their own profile (name, phone, bio, gender, etc.)
  - Admins listing/managing all users
  - Admins creating new organizer accounts
  - Admins/Organizers creating new student accounts

ENDPOINTS IN THIS FILE:
  PATCH  /users/profile               → Update my profile (any logged-in user)
  POST   /users/profile/picture       → Upload my profile picture
  GET    /users/organizers            → List all organizers
  GET    /users/participants          → List all participants
  POST   /users/students              → Create a student (Admin/Organizer only)
  GET    /users/students              → List all students (same as participants)
  GET    /users/                      → List all users with pagination (Admin only)
  GET    /users/{id}                  → Get a specific user (Admin only)
  PATCH  /users/{id}/deactivate       → Deactivate a user (Admin only)
  PATCH  /users/{id}/activate         → Activate a user (Admin only)
  POST   /users/organizer             → Create an organizer account (Admin only)
"""
from fastapi import APIRouter, Depends, Query, UploadFile, File
from sqlalchemy.orm import Session

from app.database.base import get_db
from app.database.deps import get_current_user, require_admin
from app.services.user_service import UserService
from app.services.file_service import file_service
from app.schemas.user import UpdateProfileRequest, CreateOrganizerRequest, CreateStudentRequest, AppearancePreferencesRequest, AppearancePreferencesResponse
from app.core.responses import success_response, paginated_response
from app.models.user import User

router = APIRouter()


@router.patch(
    "/profile",
    summary="Update my profile",
    description="Update the current user's profile information.",
)
def update_profile(
    data: UpdateProfileRequest,
    current_user: User = Depends(get_current_user),  # Must be logged in
    db: Session = Depends(get_db),
):
    """
    Update the logged-in user's profile.

    THIS IS A PARTIAL UPDATE:
      Only the fields you send will be updated.
      Fields you don't send will keep their existing values.
      Example: if you only send {"bio": "Hello"}, only bio changes.

    WHAT ALSO HAPPENS INTERNALLY:
      - Profile data (in user_profiles table) is updated
      - Related fields on the users table are also synced automatically
        (e.g., updating full_name here also updates users.full_name)

    RESPONSE FIELDS (do NOT change these — frontend uses them):
      - profile_id, full_name, phone, gender, department
      - course, year_of_study, bio, profile_picture, college_id
    """
    service = UserService(db)
    profile = service.update_profile(current_user.user_id, data)
    return success_response(
        message="Profile updated successfully",
        data={
            "profile_id": profile.profile_id,
            "full_name": profile.full_name,
            "phone": profile.phone,
            # Convert gender enum to string value (e.g., Gender.MALE → "male")
            "gender": profile.gender.value if hasattr(profile.gender, "value") else profile.gender,
            "department": profile.department,
            "course": profile.course,
            "year_of_study": profile.year_of_study,
            "bio": profile.bio,
            "profile_picture": profile.profile_picture,
            "college_id": profile.college_id,
        },
    )


@router.post(
    "/profile/picture",
    summary="Upload profile picture",
)
async def upload_profile_picture(
    file: UploadFile = File(...),                       # The image file to upload
    current_user: User = Depends(get_current_user),    # Must be logged in
    db: Session = Depends(get_db),
):
    """
    Upload or replace the user's profile picture.

    HOW IT WORKS:
      1. File is saved to disk (handled by file_service)
      2. The file path is saved in the user's profile
      3. Response includes the new file path/URL

    ACCEPTED FORMATS: image files (jpg, png, etc.) — validated by file_service
    """
    # Step 1: Save the uploaded file to disk and get the file path
    file_path = file_service.save_profile_picture(file)

    # Step 2: Update the profile_picture field in the database
    service = UserService(db)
    from app.schemas.user import UpdateProfileRequest
    profile = service.update_profile(current_user.user_id, UpdateProfileRequest(profile_picture=file_path))

    return success_response(
        message="Profile picture uploaded successfully",
        data={"profile_picture": file_path},  # Frontend uses this URL to display the image
    )


@router.get(
    "/profile/appearance",
    summary="Get my appearance preferences",
    description="Retrieve current user's light/dark mode, accent color, and font size settings.",
    response_model=None
)
def get_appearance(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    service = UserService(db)
    preferences = service.get_appearance_preferences(current_user.user_id)
    return success_response(message="Appearance preferences fetched", data=preferences)


@router.put(
    "/profile/appearance",
    summary="Update my appearance preferences",
    description="Save current user's light/dark mode, accent color, and font size settings.",
    response_model=None
)
def update_appearance(
    data: AppearancePreferencesRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    service = UserService(db)
    preferences = service.update_appearance_preferences(current_user.user_id, data)
    return success_response(message="Appearance preferences updated successfully", data=preferences)


@router.get(
    "/organizers",
    summary="List all organizers",
)
def list_organizers(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),  # Must be logged in
):
    """
    Get a list of all active organizer users.

    USE CASE:
      Admins or participants might want to see who organizes events on the platform.

    RESPONSE FIELDS per organizer:
      user_id, email, full_name, mobile, college_name, department, profile_image
    """
    from app.models.user import User
    from app.core.constants import UserRole
    from sqlalchemy import select

    # Query only users with ORGANIZER role who are still active
    query = select(User).where(User.role == UserRole.ORGANIZER, User.is_active == True)
    organizers = db.execute(query).scalars().all()

    data = [
        {
            "user_id": u.user_id,
            "email": u.email,
            # Use fallback chain: user table → profile table → email prefix
            "full_name": u.full_name or (u.profile.full_name if u.profile else None) or u.email.split("@")[0],
            "mobile": u.mobile or (u.profile.phone if u.profile else None),
            "college_name": u.college_name or (u.profile.college.college_name if u.profile and u.profile.college else None),
            "department": u.department or (u.profile.department if u.profile else None),
            "profile_image": u.profile_image or (u.profile.profile_picture if u.profile else None),
        }
        for u in organizers
    ]
    return success_response(message="Organizers fetched successfully", data=data)


@router.get(
    "/participants",
    summary="List all participants",
)
def list_participants(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),  # Must be logged in
):
    """
    Get a list of all active participant (student) users.

    RESPONSE FIELDS per participant:
      user_id, email, full_name, mobile, college_name, department, profile_image
    """
    from app.models.user import User
    from app.core.constants import UserRole
    from sqlalchemy import select

    # Query only users with PARTICIPANT role who are still active
    query = select(User).where(User.role == UserRole.PARTICIPANT, User.is_active == True)
    participants = db.execute(query).scalars().all()

    data = [
        {
            "user_id": u.user_id,
            "email": u.email,
            "full_name": u.full_name or (u.profile.full_name if u.profile else None) or u.email.split("@")[0],
            "mobile": u.mobile or (u.profile.phone if u.profile else None),
            "college_name": u.college_name or (u.profile.college.college_name if u.profile and u.profile.college else None),
            "department": u.department or (u.profile.department if u.profile else None),
            "profile_image": u.profile_image or (u.profile.profile_picture if u.profile else None),
        }
        for u in participants
    ]
    return success_response(message="Participants fetched successfully", data=data)


@router.post(
    "/students",
    status_code=201,
    summary="Create a student user (Admin/Organizer only)",
    description="Allows administrators or organizers to register a new student participant user.",
)
def create_student(
    data: CreateStudentRequest,
    current_user: User = Depends(get_current_user),  # Must be logged in
    db: Session = Depends(get_db),
):
    """
    Create a new student account. Only admins and organizers can do this.

    DIFFERENCE FROM SELF-REGISTRATION:
      - Self-registration requires email verification (OTP)
      - Admin-created students are auto-verified (is_email_verified = True)
      - This is useful for bulk student enrollment by an organizer

    RESPONSE FIELDS:
      user_id, email, role, is_active, is_email_verified
    """
    from app.core.constants import UserRole

    # Permission check: only admin or organizer can create students
    if current_user.role not in [UserRole.ADMIN, UserRole.ORGANIZER]:
        from app.core.exceptions import ForbiddenException
        raise ForbiddenException("Only admins and organizers can add new students")

    service = UserService(db)
    user = service.create_student(data)
    return success_response(
        message="Student user created successfully",
        data={
            "user_id": user.user_id,
            "email": user.email,
            "role": user.role,
            "is_active": user.is_active,
            "is_email_verified": user.is_email_verified,
        },
        status_code=201,
    )


@router.get(
    "/students",
    summary="List all students (Admin/Organizer only)",
)
def list_students(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Get a list of all student (participant) users.
    This is an alias for /participants — both return the same data.
    """
    # Delegates to list_participants since students = participants
    return list_participants(db=db, current_user=current_user)


@router.get(
    "/",
    summary="List all users (Admin only)",
)
def list_users(
    page: int = Query(default=1, ge=1),
    size: int = Query(default=10, ge=1, le=100),
    search: str = Query(default=None),           # Optional: filter by name/email
    role: str = Query(default=None),             # Optional: filter by role (admin/organizer/participant)
    admin: User = Depends(require_admin),        # Only admins can access this
    db: Session = Depends(get_db),
):
    """
    Get a paginated list of all users. Admin only.

    RESPONSE FIELDS per user:
      user_id, email, role, is_active, created_at

    NOTE: This is an admin panel endpoint — detailed profile info is not included here.
    Use GET /users/{user_id} for full details of a specific user.
    """
    service = UserService(db)
    users, total = service.get_all_users(page=page, size=size, search=search, role=role)
    users_data = [
        {
            "user_id": u.user_id,
            "email": u.email,
            "role": u.role,
            "is_active": u.is_active,
            "created_at": u.created_at.isoformat(),
        }
        for u in users
    ]
    return paginated_response(
        message="Users fetched successfully",
        data=users_data,
        total=total,
        page=page,
        size=size,
    )


@router.get("/{user_id}", summary="Get user by ID (Admin only)")
def get_user(
    user_id: str,
    admin: User = Depends(require_admin),  # Only admins can access this
    db: Session = Depends(get_db),
):
    """
    Get a single user's basic info by their user ID.
    Admin only endpoint.
    """
    service = UserService(db)
    user = service.get_user_with_profile(user_id)
    return success_response(
        message="User fetched",
        data={"user_id": user.user_id, "email": user.email, "role": user.role, "is_active": user.is_active},
    )


@router.patch("/{user_id}/deactivate", summary="Deactivate user (Admin only)")
def deactivate_user(
    user_id: str,
    admin: User = Depends(require_admin),  # Only admins can do this
    db: Session = Depends(get_db),
):
    """
    Soft-delete (deactivate) a user account.

    IMPORTANT:
      - This does NOT delete the user from the database.
      - It sets is_active = False, which blocks the user from logging in.
      - The user's data and history are preserved.
      - Admins cannot deactivate their own account.
    """
    service = UserService(db)
    user = service.deactivate_user(user_id, admin)
    return success_response(message=f"User {user.email} deactivated")


@router.patch("/{user_id}/activate", summary="Activate user (Admin only)")
def activate_user(
    user_id: str,
    admin: User = Depends(require_admin),  # Only admins can do this
    db: Session = Depends(get_db),
):
    """
    Re-activate a previously deactivated user account.
    Sets is_active = True so the user can log in again.
    """
    service = UserService(db)
    user = service.activate_user(user_id)
    return success_response(message=f"User {user.email} activated")


@router.delete("/{user_id}", summary="Delete user (Admin only)")
def delete_user(
    user_id: str,
    admin: User = Depends(require_admin),  # Only admins can do this
    db: Session = Depends(get_db),
):
    """
    Completely delete a user from the database.
    This is a hard delete and will remove all their data.
    """
    service = UserService(db)
    service.delete_user(user_id, admin)
    return success_response(message="User deleted successfully")


@router.post(
    "/organizer",
    status_code=201,
    summary="Create an organizer user (Admin only)",
    description="Allows administrators to register a new organizer user along with their profile information.",
)
def create_organizer(
    data: CreateOrganizerRequest,
    admin: User = Depends(require_admin),  # Only admins can create organizers
    db: Session = Depends(get_db),
):
    """
    Create a new organizer account. Admin only.

    WHAT HAPPENS INTERNALLY:
      1. Check email is not already registered
      2. Resolve the college by ID or name
      3. Hash the password
      4. Create User record (role = ORGANIZER, is_email_verified = True automatically)
      5. Create UserProfile linked to the User
      6. Create Organizer record with default permissions (create_event, manage_attendance)
      7. All 3 records are saved in one transaction

    NOTE: Organizers created this way are auto-verified — no OTP email needed.

    RESPONSE FIELDS:
      user_id, email, role, is_active, is_email_verified
    """
    service = UserService(db)
    user = service.create_organizer(data)
    return success_response(
        message="Organizer user created successfully",
        data={
            "user_id": user.user_id,
            "email": user.email,
            "role": user.role,
            "is_active": user.is_active,
            "is_email_verified": user.is_email_verified,
        },
        status_code=201,
    )
