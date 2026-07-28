 
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.database.base import get_db
from app.database.deps import require_admin, get_current_user, require_organizer
from app.services.organizer_service import OrganizerService
from app.schemas.organizer import AssignOrganizerRequest, UpdateOrganizerRequest
from app.core.responses import success_response, paginated_response
from app.models.user import User

router = APIRouter()


def _organizer_to_dict(org) -> dict:
    user = org.user if hasattr(org, "user") else None
    profile = user.profile if (user and hasattr(user, "profile")) else None

    full_name = profile.full_name if profile and profile.full_name else (user.full_name if user else None)
    phone = profile.phone if profile and profile.phone else (user.mobile if user else None)
    bio = profile.bio if profile else None
    department = profile.department if profile and profile.department else (user.department if user else None)
    course = profile.course if profile and profile.course else (user.course if user else None)
    college_id = profile.college_id if profile else None
    college_name = user.college_name if user and user.college_name else (profile.college.college_name if (profile and hasattr(profile, "college") and profile.college) else None)
    email = user.email if user else None

    return {
        "organizer_id": org.organizer_id,
        "user_id": org.user_id,
        "full_name": full_name,
        "email": email,
        "phone": phone,
        "bio": bio,
        "department": department,
        "course": course,
        "college_id": college_id,
        "college_name": college_name,
        "designation": org.designation,
        "permissions": org.permissions,
        "created_at": org.created_at.isoformat() if hasattr(org, "created_at") and org.created_at else None,
    }


@router.post("", status_code=201, summary="Assign organizer (Admin only)")
def assign_organizer(
    data: AssignOrganizerRequest,
    admin: User = Depends(require_admin),
    db: Session = Depends(get_db),
):
    service = OrganizerService(db)
    organizer = service.assign_organizer(data)
    return success_response(
        message="Organizer assigned successfully",
        data=_organizer_to_dict(organizer),
        status_code=201
    )


@router.get("", summary="List all organizers (Admin only)")
def list_organizers(
    page: int = Query(default=1, ge=1),
    size: int = Query(default=10, ge=1, le=100),
    admin: User = Depends(require_admin),
    db: Session = Depends(get_db),
):
    service = OrganizerService(db)
    organizers, total = service.get_all_organizers(page=page, size=size)
    data = [_organizer_to_dict(o) for o in organizers]
    return paginated_response(message="Organizers fetched", data=data, total=total, page=page, size=size)


@router.get("/me", summary="Get my organizer profile")
def get_my_organizer_profile(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    service = OrganizerService(db)
    org = service.get_organizer_by_user(current_user.user_id)
    return success_response(
        message="Organizer profile fetched",
        data=_organizer_to_dict(org)
    )


@router.patch("/me", summary="Update my organizer profile")
@router.put("/me", summary="Update my organizer profile")
def update_my_organizer_profile(
    data: UpdateOrganizerRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    service = OrganizerService(db)
    org = service.get_organizer_by_user(current_user.user_id)
    updated_org = service.update_organizer(org.organizer_id, data)
    return success_response(
        message="Organizer profile updated successfully",
        data=_organizer_to_dict(updated_org)
    )


@router.get("/{organizer_id}", summary="Get organizer by ID (Admin only)")
def get_organizer(
    organizer_id: str,
    admin: User = Depends(require_admin),
    db: Session = Depends(get_db)
):
    service = OrganizerService(db)
    org = service.get_organizer(organizer_id)
    return success_response(
        message="Organizer fetched",
        data=_organizer_to_dict(org)
    )


@router.patch("/{organizer_id}", summary="Update organizer (Organizer or Admin)")
@router.put("/{organizer_id}", summary="Update organizer (Organizer or Admin)")
def update_organizer(
    organizer_id: str,
    data: UpdateOrganizerRequest,
    current_user: User = Depends(require_organizer),
    db: Session = Depends(get_db),
):
    service = OrganizerService(db)
    org = service.update_organizer(organizer_id, data)
    return success_response(
        message="Organizer updated successfully",
        data=_organizer_to_dict(org)
    )


@router.delete("/{organizer_id}", summary="Remove organizer (Admin only)")
def remove_organizer(
    organizer_id: str,
    admin: User = Depends(require_admin),
    db: Session = Depends(get_db),
):
    service = OrganizerService(db)
    service.remove_organizer(organizer_id)
    return success_response(message="Organizer removed. User role reverted to participant.")

