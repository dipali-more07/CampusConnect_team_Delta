"""
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
from app.utils.helpers import get_user_performance_stats
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


@router.get(
    "/profile",
    summary="Get user profile",
    description="Retrieve the current logged-in user's profile information.",
)
@router.get(
    "/me",
    summary="Get user profile (legacy alias)",
    description="Legacy alias for /profile. Retrieve current user's profile information.",
)
def get_user_profile(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    profile = current_user.profile
    return success_response(
        message="User profile fetched successfully",
        data={
            "user_id": current_user.user_id,
            "email": current_user.email,
            "role": current_user.role,
            "profile_id": profile.profile_id if profile else None,
            "full_name": profile.full_name if profile else current_user.full_name,
            "phone": profile.phone if profile else current_user.mobile,
            "gender": profile.gender.value if (profile and hasattr(profile.gender, "value")) else (profile.gender if profile else None),
            "department": profile.department if profile else None,
            "course": profile.course if profile else None,
            "year_of_study": profile.year_of_study if profile else None,
            "bio": profile.bio if profile else None,
            "profile_picture": profile.profile_picture if profile else current_user.profile_image,
            "college_id": profile.college_id if profile else None,
        },
    )


@router.patch(
    "/profile",
    summary="Update user profile",
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





@router.get(
    "/profile/appearance",
    summary="Get user appearance preferences",
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
    summary="Update user appearance preferences",
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
    include_inactive: bool = Query(default=True),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),  # Must be logged in
):
    """
    Get a list of all organizer users (both active and suspended).

    RESPONSE FIELDS per organizer:
      user_id, email, full_name, mobile, college_name, department, profile_image, is_active, is_suspended, status
    """
    from app.models.user import User
    from app.core.constants import UserRole
    from sqlalchemy import select

    query = select(User).where(User.role == UserRole.ORGANIZER)
    if not include_inactive:
        query = query.where(User.is_active == True)
    organizers = db.execute(query).scalars().all()

    from app.utils.helpers import get_user_performance_stats

    data = []
    for u in organizers:
        stats = get_user_performance_stats(db, u.user_id)
        data.append({
            "user_id": u.user_id,
            "email": u.email,
            # Use fallback chain: user table → profile table → email prefix
            "full_name": u.full_name or (u.profile.full_name if u.profile else None) or u.email.split("@")[0],
            "mobile": u.mobile or (u.profile.phone if u.profile else None),
            "college_name": u.college_name or (u.profile.college.college_name if u.profile and u.profile.college else None),
            "department": u.department or (u.profile.department if u.profile else None),
            "profile_image": u.profile_image or (u.profile.profile_picture if u.profile else None),
            "is_active": u.is_active,
            "is_suspended": not u.is_active,
            "status": "active" if u.is_active else "suspended",
            "events_attended": stats["events_attended"],
            "certificates_count": stats["certificates_count"],
            "certificates": stats["certificates"],
            "attendance_percentage": stats["attendance_percentage"],
        })
    return success_response(message="Organizers fetched successfully", data=data)


@router.get(
    "/participants",
    summary="List all participants",
)
def list_participants(
    include_inactive: bool = Query(default=True),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),  # Must be logged in
):
    """
    Get a list of all participant (student) users (both active and suspended).

    RESPONSE FIELDS per participant:
      user_id, email, full_name, mobile, college_name, department, profile_image, is_active, is_suspended, status, events_attended, certificates_count, attendance_percentage
    """
    from app.models.user import User
    from app.core.constants import UserRole
    from app.utils.helpers import get_user_performance_stats
    from sqlalchemy import select

    query = select(User).where(User.role == UserRole.PARTICIPANT)
    if not include_inactive:
        query = query.where(User.is_active == True)
    participants = db.execute(query).scalars().all()

    data = []
    for u in participants:
        stats = get_user_performance_stats(db, u.user_id)
        yr_val = u.profile.year_of_study if (u.profile and u.profile.year_of_study) else None
        yr_str = f"{yr_val}st" if yr_val == 1 else (f"{yr_val}nd" if yr_val == 2 else (f"{yr_val}rd" if yr_val == 3 else (f"{yr_val}th" if yr_val else None)))
        data.append({
            "user_id": u.user_id,
            "email": u.email,
            "full_name": u.full_name or (u.profile.full_name if u.profile else None) or u.email.split("@")[0],
            "mobile": u.mobile or (u.profile.phone if u.profile else None),
            "college_name": u.college_name or (u.profile.college.college_name if u.profile and u.profile.college else None),
            "department": u.department or (u.profile.department if u.profile else None),
            "course": u.course or (u.profile.course if u.profile else None),
            "year": yr_str or yr_val,
            "year_of_study": yr_val,
            "academic_year": yr_str or yr_val,
            "profile_image": u.profile_image or (u.profile.profile_picture if u.profile else None),
            "is_active": u.is_active,
            "is_suspended": not u.is_active,
            "status": "active" if u.is_active else "suspended",
            "events_attended": stats["events_attended"],
            "certificates_count": stats["certificates_count"],
            "certificates": stats["certificates"],
            "attendance_percentage": stats["attendance_percentage"],
        })
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
    include_inactive: bool = Query(default=True),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Get a list of all student (participant) users.
    This is an alias for /participants — both return the same data.
    """
    # Delegates to list_participants since students = participants
    return list_participants(include_inactive=include_inactive, db=db, current_user=current_user)


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
    from app.utils.helpers import get_user_performance_stats
    service = UserService(db)
    users, total = service.get_all_users(page=page, size=size, search=search, role=role)

    users_data = []
    for u in users:
        stats = get_user_performance_stats(db, u.user_id)
        yr_val = u.profile.year_of_study if (u.profile and u.profile.year_of_study) else None
        yr_str = f"{yr_val}st" if yr_val == 1 else (f"{yr_val}nd" if yr_val == 2 else (f"{yr_val}rd" if yr_val == 3 else (f"{yr_val}th" if yr_val else None)))
        users_data.append({
            "user_id": u.user_id,
            "email": u.email,
            "full_name": u.full_name or (u.profile.full_name if u.profile else None) or u.email.split("@")[0],
            "department": u.department or (u.profile.department if u.profile else None),
            "course": u.course or (u.profile.course if u.profile else None),
            "year": yr_str or yr_val,
            "year_of_study": yr_val,
            "academic_year": yr_str or yr_val,
            "role": u.role,
            "is_active": u.is_active,
            "is_suspended": not u.is_active,
            "status": "active" if u.is_active else "suspended",
            "created_at": u.created_at.isoformat(),
            "events_attended": stats["events_attended"],
            "certificates_count": stats["certificates_count"],
            "certificates": stats["certificates"],
            "attendance_percentage": stats["attendance_percentage"],
        })
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
    stats = get_user_performance_stats(db, user.user_id)
    return success_response(
        message="User fetched",
        data={
            "user_id": user.user_id,
            "email": user.email,
            "role": user.role,
            "is_active": user.is_active,
            "is_suspended": not user.is_active,
            "status": "active" if user.is_active else "suspended",
            "events_attended": stats["events_attended"],
            "certificates_count": stats["certificates_count"],
            "certificates": stats["certificates"],
            "attendance_percentage": stats["attendance_percentage"],
        },
    )


@router.patch("/{user_id}/deactivate", summary="Deactivate user (Admin only)")
async def deactivate_user(
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
    user = await service.deactivate_user(user_id, admin)
    return success_response(message=f"User {user.email} deactivated")


@router.patch("/{user_id}/activate", summary="Activate user (Admin only)")
async def activate_user(
    user_id: str,
    admin: User = Depends(require_admin),  # Only admins can do this
    db: Session = Depends(get_db),
):
    """
    Re-activate a previously deactivated user account.
    Sets is_active = True so the user can log in again.
    """
    service = UserService(db)
    user = await service.activate_user(user_id)
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
