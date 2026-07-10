"""
app/api/v1/users.py
User and profile management endpoints.
"""
from fastapi import APIRouter, Depends, Query, UploadFile, File
from sqlalchemy.orm import Session

from app.database.base import get_db
from app.database.deps import get_current_user, require_admin
from app.services.user_service import UserService
from app.services.file_service import file_service
from app.schemas.user import UpdateProfileRequest, CreateOrganizerRequest
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
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    service = UserService(db)
    profile = service.update_profile(current_user.user_id, data)
    return success_response(
        message="Profile updated successfully",
        data={
            "profile_id": profile.profile_id,
            "full_name": profile.full_name,
            "phone": profile.phone,
            "department": profile.department,
            "bio": profile.bio,
        },
    )


@router.post(
    "/profile/picture",
    summary="Upload profile picture",
)
async def upload_profile_picture(
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    # Save the file
    file_path = file_service.save_profile_picture(file)
    # Update profile with new picture path
    service = UserService(db)
    from app.schemas.user import UpdateProfileRequest
    profile = service.update_profile(current_user.user_id, UpdateProfileRequest(profile_picture=file_path))
    return success_response(
        message="Profile picture uploaded successfully",
        data={"profile_picture": file_path},
    )


@router.get(
    "/organizers",
    summary="List all organizers",
)
def list_organizers(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Fetch all users who have the role of ORGANIZER."""
    from app.models.user import User
    from app.core.constants import UserRole
    from sqlalchemy import select

    query = select(User).where(User.role == UserRole.ORGANIZER, User.is_active == True)
    organizers = db.execute(query).scalars().all()

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
        for u in organizers
    ]
    return success_response(message="Organizers fetched successfully", data=data)


@router.get(
    "/",
    summary="List all users (Admin only)",
)
def list_users(
    page: int = Query(default=1, ge=1),
    size: int = Query(default=10, ge=1, le=100),
    search: str = Query(default=None),
    role: str = Query(default=None),
    admin: User = Depends(require_admin),
    db: Session = Depends(get_db),
):
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
    admin: User = Depends(require_admin),
    db: Session = Depends(get_db),
):
    service = UserService(db)
    user = service.get_user_with_profile(user_id)
    return success_response(
        message="User fetched",
        data={"user_id": user.user_id, "email": user.email, "role": user.role, "is_active": user.is_active},
    )


@router.patch("/{user_id}/deactivate", summary="Deactivate user (Admin only)")
def deactivate_user(
    user_id: str,
    admin: User = Depends(require_admin),
    db: Session = Depends(get_db),
):
    service = UserService(db)
    user = service.deactivate_user(user_id, admin)
    return success_response(message=f"User {user.email} deactivated")


@router.patch("/{user_id}/activate", summary="Activate user (Admin only)")
def activate_user(
    user_id: str,
    admin: User = Depends(require_admin),
    db: Session = Depends(get_db),
):
    service = UserService(db)
    user = service.activate_user(user_id)
    return success_response(message=f"User {user.email} activated")


@router.post(
    "/organizer",
    status_code=201,
    summary="Create an organizer user (Admin only)",
    description="Allows administrators to register a new organizer user along with their profile information.",
)
def create_organizer(
    data: CreateOrganizerRequest,
    admin: User = Depends(require_admin),
    db: Session = Depends(get_db),
):
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
