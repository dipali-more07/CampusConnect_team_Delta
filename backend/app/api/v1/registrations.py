 
from typing import Optional
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
    event_title = reg.event.title if (hasattr(reg, "event") and reg.event) else None
    participant_name = reg.user.full_name if (hasattr(reg, "user") and reg.user) else None
    participant_email = reg.user.email if (hasattr(reg, "user") and reg.user) else None

    team_name = None
    if hasattr(reg, "team") and reg.team:
        team_name = reg.team.team_name

    event_obj = None
    if hasattr(reg, "event") and reg.event:
        event_obj = {
            "event_id": reg.event.event_id,
            "event_name": reg.event.title,
            "title": reg.event.title,
            "category": reg.event.category,
            "event_type": reg.event.event_type,
            "venue": reg.event.venue,
            "start_datetime": reg.event.start_datetime.isoformat() if reg.event.start_datetime else None,
            "end_datetime": reg.event.end_datetime.isoformat() if reg.event.end_datetime else None,
            "poster": reg.event.poster,
            "status": reg.event.status,
            "fees": float(reg.event.fees) if reg.event.fees is not None else None,
        }

    return {
        "registration_id": reg.registration_id,
        "event_id": reg.event_id,
        "user_id": reg.user_id,                          # NOTE: maps to participant_id in DB
        "participant_id": reg.participant_id,
        "event_name": event_title,
        "event_title": event_title,
        "title": event_title,
        "user_name": participant_name,
        "participant_name": participant_name,
        "user_email": participant_email,
        "participant_email": participant_email,
        "registration_status": reg.registration_status,  # confirmed / waitlisted / cancelled
        "payment_status": reg.payment_status,            # free / pending / completed
        "registered_at": reg.registered_at.isoformat(),  # ISO 8601 date string
        "registration_type": reg.registration_type,      # "individual" or "team"
        "team_id": reg.team_id,                          # None for individual registrations
        "team_name": team_name,                          # Team Name for team registrations
        "event": event_obj,
    }



@router.post("", status_code=201, summary="Register for an event")
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


@router.get("/user", summary="Get user event registrations")
@router.get("/user-registrations", summary="Get user event registrations (alias)")
@router.get("/my-registrations", summary="Get user event registrations (alias)")
@router.get("/my", summary="Get user event registrations (legacy alias)")
def get_user_registrations(
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
        message="User registrations fetched successfully",
        data=[_reg_to_dict(r) for r in regs],
        total=total, page=page, size=size
    )


# Backward compatibility alias
my_registrations = get_user_registrations


@router.get("/events", summary="Get registrations via query param")
def get_registrations_events_query(
    event_id: Optional[str] = Query(default=None),
    page: int = Query(default=1, ge=1),
    size: int = Query(default=10, ge=1, le=100),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    service = RegistrationService(db)
    if event_id:
        regs, total = service.get_event_registrations(event_id, page=page, size=size)
    else:
        regs, total = service.get_user_registrations(current_user.user_id, page=page, size=size)
    return paginated_response(
        message="Registrations",
        data=[_reg_to_dict(r) for r in regs],
        total=total, page=page, size=size
    )


@router.get("/events/{event_id}", summary="Get registrations for an event (alias)")
@router.get("/event/{event_id}", summary="Get registrations for an event")
def event_registrations(
    event_id: str,
    page: int = Query(default=1, ge=1),
    size: int = Query(default=100, ge=1, le=500),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    service = RegistrationService(db)
    regs, total = service.get_event_registrations(event_id, page=page, size=size)
    return paginated_response(
        message="Event registrations",
        data=[_reg_to_dict(r) for r in regs],
        total=total, page=page, size=size
    )


@router.patch("/{registration_id}/cancel", summary="Cancel registration")
@router.post("/{registration_id}/cancel", summary="Cancel registration (POST alias)")
@router.delete("/{registration_id}", summary="Cancel registration (DELETE alias)")
def cancel_registration(
    registration_id: str,
    current_user: User = Depends(get_current_user),  # Must be logged in
    db: Session = Depends(get_db),
):
    service = RegistrationService(db)
    reg = service.cancel_registration(registration_id, current_user)
    return success_response(message="Registration cancelled", data=_reg_to_dict(reg))


@router.post("/event/{event_id}/cancel", summary="Cancel registration by event ID")
@router.delete("/event/{event_id}", summary="Cancel registration by event ID (DELETE alias)")
def cancel_event_registration(
    event_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    service = RegistrationService(db)
    reg = service.cancel_registration(event_id, current_user)
    return success_response(message="Registration cancelled", data=_reg_to_dict(reg))


@router.get("/{registration_id}/qrcode", summary="Get ticket QR code for registration")
def get_registration_qrcode(
    registration_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    from fastapi import Response
    from app.services.qr_service import qr_service
    from app.core.exceptions import NotFoundException

    service = RegistrationService(db)
    reg = service.reg_repo.get_by_id(registration_id)
    if not reg:
        raise NotFoundException(f"Registration {registration_id} not found")

    qr_bytes = qr_service.generate_registration_qr(registration_id)
    return Response(content=qr_bytes, media_type="image/png")


