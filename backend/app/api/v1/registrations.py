 
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.database.base import get_db
from app.database.deps import get_current_user, require_organizer, require_admin
from app.services.registration_service import RegistrationService
from app.schemas.registration import RegisterForEventRequest
from app.core.responses import success_response, paginated_response
from app.models.user import User

router = APIRouter()


def _reg_to_dict(reg) -> dict:
    
    return {
        "registration_id": reg.registration_id,
        "event_id": reg.event_id,
        "user_id": reg.user_id,                          # NOTE: maps to participant_id in DB
        "registration_status": reg.registration_status,  # confirmed / waitlisted / cancelled
        "payment_status": reg.payment_status,            # free / pending / completed
        "registered_at": reg.registered_at.isoformat(),  # ISO 8601 date string
        "registration_type": reg.registration_type,      # "individual" or "team"
        "team_id": reg.team_id,                          # None for individual registrations
        "event_name": reg.event.title if reg.event else None,
        "title": reg.event.title if reg.event else None,
    }



@router.post("/", status_code=201, summary="Register for an event")
async def register_for_event(
    data: RegisterForEventRequest,
    current_user: User = Depends(get_current_user),  # Must be logged in
    db: Session = Depends(get_db),
):
    
    service = RegistrationService(db)
    registration = await service.register_for_event(data, current_user)
    return success_response(
        message="Registration successful",
        data=_reg_to_dict(registration),
        status_code=201
    )


@router.get("/my", summary="My event registrations")
def my_registrations(
    page: int = Query(default=1, ge=1),                 # Page number, minimum 1
    size: int = Query(default=10, ge=1, le=100),        # Items per page, max 100
    current_user: User = Depends(get_current_user),     # Must be logged in
    db: Session = Depends(get_db),
):
    """
    Get a paginated list of all registrations for the currently logged-in user.

    USE CASE:
      A student wants to see all events they've signed up for, with their status.
    """
    service = RegistrationService(db)
    regs, total = service.get_user_registrations(current_user.user_id, page=page, size=size)
    return paginated_response(
        message="Your registrations",
        data=[_reg_to_dict(r) for r in regs],
        total=total, page=page, size=size
    )


@router.get("/event/{event_id}", summary="Get registrations for an event (Organizer/Admin)")
def event_registrations(
    event_id: str,
    page: int = Query(default=1, ge=1),
    size: int = Query(default=100, ge=1, le=500),
    current_user: User = Depends(require_organizer),    # Only organizers and admins can see this
    db: Session = Depends(get_db),
):
    """
    Get all registrations for a specific event.
    Only accessible by organizers and admins.

    USE CASE:
      An organizer wants to see who registered for their event to prepare for attendance.
    """
    service = RegistrationService(db)
    regs, total = service.get_event_registrations(event_id, page=page, size=size)
    return paginated_response(
        message="Event registrations",
        data=[_reg_to_dict(r) for r in regs],
        total=total, page=page, size=size
    )


@router.patch("/{registration_id}/cancel", summary="Cancel registration")
def cancel_registration(
    registration_id: str,
    current_user: User = Depends(get_current_user),  # Must be logged in
    db: Session = Depends(get_db),
):
    
    service = RegistrationService(db)
    reg = service.cancel_registration(registration_id, current_user)
    return success_response(message="Registration cancelled", data=_reg_to_dict(reg))

