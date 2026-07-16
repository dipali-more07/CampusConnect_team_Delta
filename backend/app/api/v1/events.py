"""
app/api/v1/events.py
=====================
Event management API endpoints.

WHAT THIS FILE DOES:
  Handles everything about events — creating, listing, approving, publishing,
  cancelling, and managing event posters and QR codes.

EVENT LIFECYCLE (how an event goes from creation to completion):
  1. Organizer creates event  → status: DRAFT, approval_status: PENDING
  2. Admin approves it        → approval_status: APPROVED  (or REJECTED)
  3. Organizer publishes it   → status: PUBLISHED  (students can now register!)
  4. Event happens            → Admin marks as COMPLETED
  5. Certificates generated   → Attendees get PDF certificates

  SPECIAL CASE (Admin creates event):
    → approval_status is AUTO set to APPROVED (admin doesn't need to approve their own events)
    → Admin just needs to publish it directly

ENDPOINTS IN THIS FILE:
  POST   /events/                      → Create event (Organizer/Admin)
  GET    /events/                      → List events (with filters, pagination)
  GET    /events/upcoming              → Get upcoming events (public)
  GET    /events/trending              → Get trending events (public)
  GET    /events/pending-approval      → Events waiting for admin approval (Admin only)
  GET    /events/{id}                  → Get a single event by ID (public)
  PATCH  /events/{id}                  → Update event details (Organizer/Admin)
  PUT    /events/{id}                  → Same as PATCH (for compatibility)
  DELETE /events/{id}                  → Delete event (Draft only, Organizer/Admin)
  POST   /events/{id}/publish          → Publish event (must be approved first)
  POST   /events/{id}/cancel           → Cancel event
  POST   /events/{id}/complete         → Mark event as completed (Admin only)
  POST   /events/{id}/approve          → Approve or reject event (Admin only)
  POST   /events/{id}/poster           → Upload event poster image
  GET    /events/{id}/qrcode           → Get check-in QR code (Organizer only)
"""
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


def _event_to_dict(event) -> dict:
    """
    Convert an Event database model object to a plain dictionary for API responses.

    WHY WE NEED THIS:
      FastAPI cannot directly serialize SQLAlchemy model objects to JSON.
      We pick exactly which fields to expose and convert them here.

    STATUS DISPLAY LOGIC:
      The 'status' field shown to the frontend combines EventStatus and ApprovalStatus:
        - Draft + Approved  → shows "approved"  (admin approved, waiting for organizer to publish)
        - Draft + Rejected  → shows "rejected"  (admin rejected it)
        - Otherwise         → shows the actual event status (draft/published/completed/cancelled)

    IMPORTANT: Do NOT rename these fields — the frontend uses them!
      event_id, organizer_id, event_name, title, description, category,
      event_type, venue, start_datetime, end_datetime, max_participants,
      capacity, participation_type, reg_date_time, fees, reg_deadline,
      registration_deadline, event_date, poster, status, approval_status,
      qr_code, created_at

    NOTE: Both 'event_name' and 'title' return the same value (backward compat).
    NOTE: Both 'reg_deadline' and 'registration_deadline' return the same value.
    """
    # Combine status + approval_status into a single human-readable status string
    status_val = event.status.value if hasattr(event.status, "value") else event.status
    if event.status == EventStatus.DRAFT:
        if event.approval_status == ApprovalStatus.APPROVED:
            status_val = "approved"    # Admin approved but organizer hasn't published yet
        elif event.approval_status == ApprovalStatus.REJECTED:
            status_val = "rejected"   # Admin rejected the event

    return {
        "event_id": event.event_id,
        "organizer_id": event.organizer_id,
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
        "qr_code": event.qr_code,        # QR code path (set when event is published)
        "created_at": event.created_at.isoformat(),
    }


@router.post("/", status_code=201, summary="Create event (Organizer/Admin)")
def create_event(
    data: CreateEventRequest,
    current_user: User = Depends(require_organizer),
    db: Session = Depends(get_db),
):
    service = EventService(db)
    event = service.create_event(data, current_user)
    return success_response(message="Event created as draft. Submit for admin approval.", data=_event_to_dict(event), status_code=201)


@router.get("/", summary="List events (with filters and pagination)")
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
        data=[_event_to_dict(e) for e in events],
        total=total, page=page, size=size
    )


@router.get("/upcoming", summary="Get upcoming events")
def get_upcoming_events(
    limit: int = Query(default=10, ge=1, le=50),
    db: Session = Depends(get_db),
):
    service = EventService(db)
    events = service.get_upcoming_events(limit=limit)
    return success_response(message="Upcoming events", data=[_event_to_dict(e) for e in events])


@router.get("/trending", summary="Get trending events (most registrations)")
def get_trending_events(
    limit: int = Query(default=10, ge=1, le=50),
    db: Session = Depends(get_db),
):
    service = EventService(db)
    events = service.get_trending_events(limit=limit)
    return success_response(message="Trending events", data=[_event_to_dict(e) for e in events])


@router.get("/pending-approval", summary="Events waiting for admin approval (Admin only)")
def get_pending_approval(
    admin: User = Depends(require_admin),
    db: Session = Depends(get_db),
):
    from app.repositories.event_repository import EventRepository
    repo = EventRepository(db)
    events = repo.get_pending_approval()
    return success_response(message="Pending events", data=[_event_to_dict(e) for e in events])


@router.get("/{event_id}", summary="Get event by ID")
def get_event(event_id: str, db: Session = Depends(get_db)):
    service = EventService(db)
    event = service.get_event(event_id)
    return success_response(message="Event fetched", data=_event_to_dict(event))


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
    return success_response(message="Event updated", data=_event_to_dict(event))


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
    return success_response(message="Event published! Students can now register.", data=_event_to_dict(event))


@router.post("/{event_id}/cancel", summary="Cancel event")
def cancel_event(
    event_id: str,
    current_user: User = Depends(require_organizer),
    db: Session = Depends(get_db),
):
    service = EventService(db)
    event = service.cancel_event(event_id, current_user)
    return success_response(message="Event cancelled", data=_event_to_dict(event))


@router.post("/{event_id}/complete", summary="Mark event as completed (Admin only)")
def complete_event(
    event_id: str,
    admin: User = Depends(require_admin),
    db: Session = Depends(get_db),
):
    service = EventService(db)
    event = service.mark_event_completed(event_id)
    return success_response(message="Event marked as completed", data=_event_to_dict(event))


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
        data=_event_to_dict(event)
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


@router.get("/{event_id}/qrcode", summary="Get check-in QR code for an event (Organizer only)")
def get_event_qrcode(
    event_id: str,
    current_user: User = Depends(require_organizer),
    db: Session = Depends(get_db),
):
    from fastapi import Response
    from app.services.qr_service import QRService
    from app.core.exceptions import NotFoundException

    service = EventService(db)
    event = service.event_repo.get_by_id(event_id)
    if not event:
        raise NotFoundException(f"Event {event_id} not found")

    qr_service = QRService()
    qr_data = f"campusconnect://checkin?event_id={event_id}"
    qr_bytes = qr_service._create_qr_code(qr_data)
    return Response(content=qr_bytes, media_type="image/png")
