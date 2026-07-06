"""
app/api/v1/events.py
Event management endpoints.
"""
from fastapi import APIRouter, Depends, Query, UploadFile, File
from sqlalchemy.orm import Session

from app.database.base import get_db
from app.database.deps import get_current_user, require_organizer, require_admin
from app.services.event_service import EventService
from app.services.file_service import file_service
from app.schemas.event import CreateEventRequest, UpdateEventRequest, ApproveEventRequest
from app.core.responses import success_response, paginated_response
from app.models.user import User

router = APIRouter()


def _event_to_dict(event) -> dict:
    """Convert event model to a dict for API responses."""
    return {
        "event_id": event.event_id,
        "organizer_id": event.organizer_id,
        "club_id": event.club_id,
        "title": event.title,
        "description": event.description,
        "category": event.category,
        "event_type": event.event_type,
        "venue": event.venue,
        "start_datetime": event.start_datetime.isoformat(),
        "end_datetime": event.end_datetime.isoformat(),
        "max_participants": event.max_participants,
        "registration_deadline": event.registration_deadline.isoformat() if event.registration_deadline else None,
        "poster": event.poster,
        "status": event.status,
        "approval_status": event.approval_status,
        "qr_code": event.qr_code,
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
    db: Session = Depends(get_db),
):
    service = EventService(db)
    events, total = service.get_all_events(
        page=page, size=size, search=search,
        category=category, status=status, organizer_id=organizer_id
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
