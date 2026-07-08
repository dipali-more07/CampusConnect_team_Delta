"""
app/services/event_service.py
Event management business logic.

EVENT LIFECYCLE:
  Created (DRAFT) -> Admin Approves -> PUBLISHED -> Students Register
  -> Event Happens -> COMPLETED -> Certificates Generated

  OR:
  Created (DRAFT) -> Admin Rejects -> Organizer edits -> Resubmits
  OR:
  Published -> Organizer CANCELS -> CANCELLED
"""
from datetime import datetime
from typing import Optional, List
from sqlalchemy.orm import Session

from app.repositories.event_repository import EventRepository
from app.core.exceptions import NotFoundException, ForbiddenException, BadRequestException, ConflictException
from app.core.constants import EventStatus, ApprovalStatus, UserRole
from app.models.event import Event
from app.models.user import User
from app.schemas.event import CreateEventRequest, UpdateEventRequest, ApproveEventRequest
from app.services.qr_service import qr_service


class EventService:
    def __init__(self, db: Session):
        self.db = db
        self.event_repo = EventRepository(db)

    def _check_event_ownership(self, event: Event, user: User) -> None:
        """Verify the user owns this event (or is admin)."""
        if user.role == UserRole.ADMIN:
            return  # Admins can manage all events
        if event.organizer_id != user.user_id:
            raise ForbiddenException("You can only manage your own events")

    def create_event(
        self, data: CreateEventRequest, current_user: User
    ) -> Event:
        """Create a new event (organizer or admin)."""
        if current_user.role not in [UserRole.ORGANIZER, UserRole.ADMIN]:
            raise ForbiddenException("You must be an organizer to perform this action")

        # Validate dates
        if data.start_datetime <= datetime.utcnow():
            raise BadRequestException("Event start time must be in the future")

        event = Event(
            organizer_id=current_user.user_id,
            title=data.title,
            description=data.description,
            category=data.category,
            event_type=data.event_type,
            venue=data.venue,
            start_datetime=data.start_datetime,
            end_datetime=data.end_datetime,
            max_participants=data.max_participants,
            registration_deadline=data.registration_deadline,
            status=EventStatus.DRAFT,
            approval_status=ApprovalStatus.PENDING,
        )
        self.event_repo.create(event)
        self.db.commit()
        self.db.refresh(event)
        return event

    def get_event(self, event_id: str) -> Event:
        event = self.event_repo.get_by_id(event_id)
        if not event:
            raise NotFoundException(f"Event {event_id} not found")
        return event

    def get_all_events(
        self,
        page: int = 1,
        size: int = 10,
        search: Optional[str] = None,
        category: Optional[str] = None,
        status: Optional[str] = None,
        organizer_id: Optional[str] = None,
    ) -> tuple[List[Event], int]:
        skip = (page - 1) * size
        events = self.event_repo.get_all_events(
            skip=skip, limit=size, search=search, category=category,
            status=status, organizer_id=organizer_id,
        )
        total = self.event_repo.count_events(
            search=search, category=category, status=status, organizer_id=organizer_id
        )
        return events, total

    def update_event(
        self, event_id: str, data: UpdateEventRequest, current_user: User
    ) -> Event:
        """Update event details (only organizer who owns it, or admin)."""
        event = self.get_event(event_id)
        self._check_event_ownership(event, current_user)

        # Can only edit events in DRAFT status
        if event.status == EventStatus.PUBLISHED:
            raise BadRequestException("Cannot edit a published event. Cancel it first.")

        update_data = data.model_dump(exclude_none=True)
        for field, value in update_data.items():
            setattr(event, field, value)

        self.db.commit()
        self.db.refresh(event)
        return event

    def publish_event(self, event_id: str, current_user: User) -> Event:
        """Publish a draft event (must be admin-approved first)."""
        event = self.get_event(event_id)
        self._check_event_ownership(event, current_user)

        if event.approval_status != ApprovalStatus.APPROVED:
            raise BadRequestException(
                "Event must be approved by an admin before publishing"
            )

        if event.status != EventStatus.DRAFT:
            raise BadRequestException(f"Cannot publish event with status '{event.status}'")

        # Generate QR code for the event
        qr_path = qr_service.generate_event_qr(event_id)

        event.status = EventStatus.PUBLISHED
        event.qr_code = qr_path
        self.db.commit()
        self.db.refresh(event)
        return event

    def cancel_event(self, event_id: str, current_user: User) -> Event:
        """Cancel an event."""
        event = self.get_event(event_id)
        self._check_event_ownership(event, current_user)

        if event.status == EventStatus.COMPLETED:
            raise BadRequestException("Cannot cancel a completed event")

        event.status = EventStatus.CANCELLED
        self.db.commit()
        self.db.refresh(event)
        return event

    def approve_event(
        self, event_id: str, data: ApproveEventRequest, admin_user: User
    ) -> Event:
        """Admin approves or rejects an event."""
        event = self.get_event(event_id)
        event.approval_status = data.approval_status
        if data.rejection_reason:
            event.rejection_reason = data.rejection_reason
        self.db.commit()
        self.db.refresh(event)
        return event

    def delete_event(self, event_id: str, current_user: User) -> None:
        """Delete a draft event."""
        event = self.get_event(event_id)
        self._check_event_ownership(event, current_user)

        if event.status != EventStatus.DRAFT:
            raise BadRequestException("Only draft events can be deleted")

        self.event_repo.delete(event)
        self.db.commit()

    def get_upcoming_events(self, limit: int = 10) -> List[Event]:
        return self.event_repo.get_upcoming_events(limit=limit)

    def get_trending_events(self, limit: int = 10) -> List[Event]:
        return self.event_repo.get_trending_events(limit=limit)

    def get_organizer_events(
        self, organizer_id: str, page: int = 1, size: int = 10
    ) -> List[Event]:
        skip = (page - 1) * size
        return self.event_repo.get_events_by_organizer(organizer_id, skip=skip, limit=size)

    def mark_event_completed(self, event_id: str) -> Event:
        """Mark event as completed after it ends."""
        event = self.get_event(event_id)
        event.status = EventStatus.COMPLETED
        self.db.commit()
        self.db.refresh(event)
        return event
