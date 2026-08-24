 
from typing import Optional, List
from fastapi import APIRouter, Depends, Query, UploadFile, File
from sqlalchemy.orm import Session

from app.database.base import get_db
from app.database.deps import get_current_user, get_current_user_optional, require_organizer, require_admin
from app.services.event_service import EventService
from app.services.file_service import file_service
from app.schemas.event import CreateEventRequest, UpdateEventRequest, ApproveEventRequest
from app.core.responses import success_response, paginated_response
from app.models.user import User
from app.core.constants import EventStatus, ApprovalStatus

router = APIRouter()


def _has_event_started(event) -> bool:
    if not event or not event.start_datetime:
        return True
    from datetime import datetime, timedelta
    now_utc = datetime.utcnow()
    now_ist = datetime.utcnow() + timedelta(hours=5, minutes=30)
    return (now_utc >= event.start_datetime) or (now_ist >= event.start_datetime)


def _event_to_dict(event, db: Optional[Session] = None) -> dict:
    # Combine status + approval_status into a single human-readable status string
    status_val = event.status.value if hasattr(event.status, "value") else event.status
    if event.status == EventStatus.DRAFT:
        if event.approval_status == ApprovalStatus.APPROVED:
            status_val = "approved"    # Admin approved but organizer hasn't published yet
        elif event.approval_status == ApprovalStatus.REJECTED:
            status_val = "rejected"   # Admin rejected the event

    # Get organizer name from user full_name, fallback to user profile full_name
    organizer_name = None
    if event.organizer:
        organizer_name = event.organizer.full_name
        if not organizer_name and event.organizer.profile:
            organizer_name = event.organizer.profile.full_name

    # Calculate total registrations count
    reg_count = 0
    if db is not None:
        from app.models.registration import EventRegistration
        from sqlalchemy import select, func
        reg_count = db.scalar(
            select(func.count()).select_from(EventRegistration).where(EventRegistration.event_id == event.event_id)
        ) or 0
    elif hasattr(event, "registrations") and event.registrations is not None:
        try:
            reg_count = len(event.registrations)
        except Exception:
            reg_count = 0

    qr_code_val = event.qr_code
    if not _has_event_started(event):
        qr_code_val = None
    elif qr_code_val:
        qr_code_val = qr_code_val.replace("\\", "/")
        if not qr_code_val.startswith("/") and not qr_code_val.startswith("http"):
            qr_code_val = f"/{qr_code_val}"
    else:
        qr_code_val = None

    return {
        "event_id": event.event_id,
        "organizer_id": event.organizer_id,
        "organizer_name": organizer_name,
        "event_name": event.title,      # Alias for title (kept for backward compatibility)
        "title": event.title,
        "description": event.description,
        "category": event.category,
        "event_type": event.event_type,
        "venue": event.venue,
        "start_datetime": event.start_datetime.isoformat(),
        "end_datetime": event.end_datetime.isoformat(),
        "max_participants": event.max_participants,
        "capacity": event.capacity,
        # Convert enum to string (e.g., ParticipationType.TEAM → "team")
        "participation_type": event.participation_type.value if hasattr(event.participation_type, "value") else event.participation_type,
        "reg_date_time": event.reg_date_time.isoformat() if event.reg_date_time else None,
        "fees": float(event.fees) if event.fees is not None else None,   # Always float, never Decimal
        "reg_deadline": event.registration_deadline.isoformat() if event.registration_deadline else None,
        "registration_deadline": event.registration_deadline.isoformat() if event.registration_deadline else None,
        "event_date": event.event_date.isoformat() if event.event_date else None,
        "poster": event.poster,           # File path / URL to the event poster image
        "status": status_val,             # Combined status (see logic above)
        "approval_status": event.approval_status,
        "rejection_reason": getattr(event, "rejection_reason", None),
        "remarks": getattr(event, "rejection_reason", None),
        "note": getattr(event, "rejection_reason", None),
        "qr_code": qr_code_val,          # Clean relative QR code URL path
        "total_registrations": reg_count,
        "registration_count": reg_count,
        "created_at": event.created_at.isoformat(),
    }


@router.post("", status_code=201, summary="Create event (Organizer/Admin)")
def create_event(
    data: CreateEventRequest,
    current_user: User = Depends(require_organizer),
    db: Session = Depends(get_db),
):
    service = EventService(db)
    event = service.create_event(data, current_user)
    return success_response(message="Event created as draft. Submit for admin approval.", data=_event_to_dict(event, db), status_code=201)


@router.get("", summary="List events (with filters and pagination)")
def list_events(
    page: int = Query(default=1, ge=1),
    size: int = Query(default=10, ge=1, le=100),
    search: str = Query(default=None, description="Search by title"),
    category: str = Query(default=None),
    status: str = Query(default=None),
    organizer_id: str = Query(default=None),
    current_user: Optional[User] = Depends(get_current_user_optional),
    db: Session = Depends(get_db),
):
    service = EventService(db)
    events, total = service.get_all_events(
        page=page, size=size, search=search,
        category=category, status=status, organizer_id=organizer_id,
        current_user=current_user
    )
    return paginated_response(
        message="Events fetched",
        data=[_event_to_dict(e, db) for e in events],
        total=total, page=page, size=size
    )


@router.get("/upcoming", summary="Get upcoming events")
def get_upcoming_events(
    limit: int = Query(default=10, ge=1, le=50),
    db: Session = Depends(get_db),
):
    service = EventService(db)
    events = service.get_upcoming_events(limit=limit)
    return success_response(message="Upcoming events", data=[_event_to_dict(e, db) for e in events])


@router.get("/trending", summary="Get trending events (most registrations)")
def get_trending_events(
    limit: int = Query(default=10, ge=1, le=50),
    db: Session = Depends(get_db),
):
    service = EventService(db)
    events = service.get_trending_events(limit=limit)
    return success_response(message="Trending events", data=[_event_to_dict(e, db) for e in events])


@router.get("/pending-approval", summary="Events waiting for admin approval (Admin only)")
def get_pending_approval(
    admin: User = Depends(require_admin),
    db: Session = Depends(get_db),
):
    from app.repositories.event_repository import EventRepository
    repo = EventRepository(db)
    events = repo.get_pending_approval()
    return success_response(message="Pending events", data=[_event_to_dict(e, db) for e in events])


@router.get("/{event_id}", summary="Get event by ID")
def get_event(event_id: str, db: Session = Depends(get_db)):
    service = EventService(db)
    event = service.get_event(event_id)
    return success_response(message="Event fetched", data=_event_to_dict(event, db))


@router.patch("/{event_id}", summary="Update event (Organizer who owns it, or Admin)")
@router.put("/{event_id}", summary="Update event (Organizer who owns it, or Admin)")
def update_event(
    event_id: str,
    data: UpdateEventRequest,
    current_user: User = Depends(require_organizer),
    db: Session = Depends(get_db),
):
    service = EventService(db)
    event = service.update_event(event_id, data, current_user)
    return success_response(message="Event updated", data=_event_to_dict(event, db))


@router.delete("/{event_id}", summary="Delete event (Draft only)")
def delete_event(
    event_id: str,
    current_user: User = Depends(require_organizer),
    db: Session = Depends(get_db),
):
    service = EventService(db)
    service.delete_event(event_id, current_user)
    return success_response(message="Event deleted")


@router.post("/{event_id}/publish", summary="Publish event (must be admin-approved)")
def publish_event(
    event_id: str,
    current_user: User = Depends(require_organizer),
    db: Session = Depends(get_db),
):
    service = EventService(db)
    event = service.publish_event(event_id, current_user)
    return success_response(message="Event published! Students can now register.", data=_event_to_dict(event, db))


@router.post("/{event_id}/cancel", summary="Cancel event")
def cancel_event(
    event_id: str,
    current_user: User = Depends(require_organizer),
    db: Session = Depends(get_db),
):
    service = EventService(db)
    event = service.cancel_event(event_id, current_user)
    return success_response(message="Event cancelled", data=_event_to_dict(event, db))


@router.post("/{event_id}/complete", summary="Mark event as completed (Admin only)")
def complete_event(
    event_id: str,
    admin: User = Depends(require_admin),
    db: Session = Depends(get_db),
):
    service = EventService(db)
    event = service.mark_event_completed(event_id)
    return success_response(message="Event marked as completed", data=_event_to_dict(event, db))


@router.post("/{event_id}/approve", summary="Approve or reject event (Admin only)")
@router.patch("/{event_id}/approve", summary="Approve or reject event (Admin only)")
@router.put("/{event_id}/approve", summary="Approve or reject event (Admin only)")
def approve_event(
    event_id: str,
    data: ApproveEventRequest,
    admin: User = Depends(require_admin),
    db: Session = Depends(get_db),
):
    service = EventService(db)
    event = service.approve_event(event_id, data, admin)
    return success_response(
        message=f"Event {data.approval_status.value} successfully",
        data=_event_to_dict(event, db)
    )


@router.post("/{event_id}/poster", summary="Upload event poster")
def upload_poster(
    event_id: str,
    file: UploadFile = File(...),
    current_user: User = Depends(require_organizer),
    db: Session = Depends(get_db),
):
    poster_path = file_service.save_poster(file)
    service = EventService(db)
    event = service.get_event(event_id)
    service._check_event_ownership(event, current_user)
    event.poster = poster_path
    db.commit()
    return success_response(message="Poster uploaded", data={"poster": poster_path})


@router.get("/{event_id}/qrcode", summary="Get check-in QR code for an event (Organizer/Admin only)")
@router.post("/{event_id}/qrcode", summary="Get check-in QR code for an event (Organizer/Admin only)")
def get_event_qrcode(
    event_id: str,
    current_user: User = Depends(require_organizer),
    db: Session = Depends(get_db),
):
    from fastapi import Response
    from datetime import datetime, timedelta
    from app.services.qr_service import qr_service
    from app.core.exceptions import NotFoundException, BadRequestException

    service = EventService(db)
    event = service.event_repo.get_by_id(event_id)
    if not event:
        raise NotFoundException(f"Event {event_id} not found")

    now_utc = datetime.utcnow()
    now_ist = datetime.utcnow() + timedelta(hours=5, minutes=30)

    has_started = False
    if event.start_datetime:
        has_started = (now_utc >= event.start_datetime) or (now_ist >= event.start_datetime)
    elif event.status in [EventStatus.PUBLISHED, EventStatus.COMPLETED]:
        has_started = True

    if not has_started:
        raise BadRequestException("Event check-in QR code can only be generated after the event has started")

    qr_data = f"campusconnect://checkin?event_id={event_id}"
    qr_bytes = qr_service._create_qr_code(qr_data)

    if not event.qr_code:
        event.qr_code = qr_service.generate_event_qr(event_id)
        db.commit()

    return Response(content=qr_bytes, media_type="image/png")


@router.post("/{event_id}/register", summary="Register for event")
async def register_for_event_in_events(
    event_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    from app.services.registration_service import RegistrationService
    from app.schemas.registration import RegisterForEventRequest
    from app.api.v1.registrations import _reg_to_dict

    service = RegistrationService(db)
    req = RegisterForEventRequest(event_id=event_id, registration_type="individual")
    registration = await service.register_for_event(req, current_user)
    return success_response(
        message="Registration successful",
        data=_reg_to_dict(registration),
        status_code=201
    )


@router.post("/{event_id}/cancel-registration", summary="Cancel event registration")
@router.delete("/{event_id}/register", summary="Cancel event registration (DELETE alias)")
@router.delete("/{event_id}/registration", summary="Cancel event registration (DELETE alias)")
def cancel_event_registration_in_events(
    event_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    from app.services.registration_service import RegistrationService
    from app.api.v1.registrations import _reg_to_dict

    service = RegistrationService(db)
    reg = service.cancel_registration(event_id, current_user)
    return success_response(message="Registration cancelled", data=_reg_to_dict(reg))

