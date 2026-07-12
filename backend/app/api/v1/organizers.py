"""
app/api/v1/organizers.py
Organizer management endpoints.
"""
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.database.base import get_db
from app.database.deps import require_admin, get_current_user
from app.services.organizer_service import OrganizerService
from app.schemas.organizer import AssignOrganizerRequest, UpdateOrganizerRequest
from app.core.responses import success_response, paginated_response
from app.models.user import User

router = APIRouter()


@router.post("/", status_code=201, summary="Assign organizer (Admin only)")
def assign_organizer(
    data: AssignOrganizerRequest,
    admin: User = Depends(require_admin),
    db: Session = Depends(get_db),
):
    service = OrganizerService(db)
    organizer = service.assign_organizer(data)
    return success_response(
        message="Organizer assigned successfully",
        data={"organizer_id": organizer.organizer_id, "designation": organizer.designation},
        status_code=201
    )


@router.get("/", summary="List all organizers (Admin only)")
def list_organizers(
    page: int = Query(default=1, ge=1),
    size: int = Query(default=10, ge=1, le=100),
    admin: User = Depends(require_admin),
    db: Session = Depends(get_db),
):
    service = OrganizerService(db)
    organizers, total = service.get_all_organizers(page=page, size=size)
    data = [
        {
            "organizer_id": o.organizer_id,
            "user_id": o.user_id,
            "designation": o.designation,
            "permissions": o.permissions
        } for o in organizers
    ]
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
        data={
            "organizer_id": org.organizer_id,
            "designation": org.designation,
            "permissions": org.permissions
        }
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
        data={"organizer_id": org.organizer_id, "user_id": org.user_id, "designation": org.designation}
    )


@router.patch("/{organizer_id}", summary="Update organizer (Admin only)")
def update_organizer(
    organizer_id: str,
    data: UpdateOrganizerRequest,
    admin: User = Depends(require_admin),
    db: Session = Depends(get_db),
):
    service = OrganizerService(db)
    org = service.update_organizer(organizer_id, data)
    return success_response(message="Organizer updated")


@router.delete("/{organizer_id}", summary="Remove organizer (Admin only)")
def remove_organizer(
    organizer_id: str,
    admin: User = Depends(require_admin),
    db: Session = Depends(get_db),
):
    service = OrganizerService(db)
    service.remove_organizer(organizer_id)
    return success_response(message="Organizer removed. User role reverted to participant.")
