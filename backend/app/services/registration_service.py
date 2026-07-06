"""
app/services/registration_service.py
Event registration business logic.

KEY BUSINESS RULES:
  1. A user can only register ONCE per event (duplicate prevention)
  2. Cannot register after the registration deadline
  3. Cannot register if event is full (goes to waitlist)
  4. Cannot register for a cancelled event
  5. Only the user themselves can cancel their registration
"""
from typing import List, Optional
from datetime import datetime
from sqlalchemy.orm import Session

from app.repositories.registration_repository import RegistrationRepository
from app.repositories.event_repository import EventRepository
from app.repositories.notification_repository import NotificationRepository
from app.core.exceptions import (
    ConflictException, BadRequestException, NotFoundException, ForbiddenException
)
from app.core.constants import RegistrationStatus, EventStatus, NotificationType
from app.models.registration import EventRegistration
from app.models.user import User
from app.services.email_service import email_service


class RegistrationService:
    def __init__(self, db: Session):
        self.db = db
        self.reg_repo = RegistrationRepository(db)
        self.event_repo = EventRepository(db)
        self.notif_repo = NotificationRepository(db)

    async def register_for_event(
        self, event_id: str, current_user: User
    ) -> EventRegistration:
        """
        Register a student for an event.

        Business Rules Checked:
          1. Event exists and is published
          2. Registration deadline not passed
          3. User not already registered
          4. Event not at capacity (if max_participants set)
        """
        # Rule 1: Event must exist and be published
        event = self.event_repo.get_by_id(event_id)
        if not event:
            raise NotFoundException(f"Event {event_id} not found")

        if event.status != EventStatus.PUBLISHED:
            raise BadRequestException("This event is not accepting registrations")

        # Rule 2: Registration deadline
        if event.registration_deadline and datetime.utcnow() > event.registration_deadline:
            raise BadRequestException("Registration deadline has passed")

        # Rule 3: Check for duplicate registration
        existing = self.reg_repo.get_by_event_and_user(event_id, current_user.user_id)
        if existing:
            if existing.registration_status == RegistrationStatus.CANCELLED:
                # Allow re-registration after cancellation
                existing.registration_status = RegistrationStatus.CONFIRMED
                self.db.commit()
                self.db.refresh(existing)
                return existing
            raise ConflictException("You are already registered for this event")

        # Rule 4: Check capacity
        status = RegistrationStatus.CONFIRMED
        if event.max_participants:
            confirmed_count = self.reg_repo.count_confirmed_registrations(event_id)
            if confirmed_count >= event.max_participants:
                # Put on waiting list instead of rejecting
                status = RegistrationStatus.WAITLISTED

        # Create registration record
        registration = EventRegistration(
            event_id=event_id,
            user_id=current_user.user_id,
            registration_status=status,
        )
        self.reg_repo.create(registration)

        # Create in-app notification
        from app.models.notification import Notification
        notification = Notification(
            user_id=current_user.user_id,
            title="Registration Confirmed" if status == RegistrationStatus.CONFIRMED else "Added to Waitlist",
            message=f"Your registration for '{event.title}' has been {status.value}.",
            notification_type=NotificationType.REGISTRATION,
        )
        self.notif_repo.create(notification)

        self.db.commit()
        self.db.refresh(registration)

        # Send confirmation email
        await email_service.send_registration_confirmation(
            current_user.email,
            event.title,
            event.start_datetime.strftime("%B %d, %Y at %H:%M"),
        )

        return registration

    def cancel_registration(
        self, registration_id: str, current_user: User
    ) -> EventRegistration:
        """Cancel a registration. Only the registered user can cancel."""
        registration = self.reg_repo.get_by_id(registration_id)
        if not registration:
            raise NotFoundException(f"Registration {registration_id} not found")

        # Only the owner can cancel (or admin)
        from app.core.constants import UserRole
        if registration.user_id != current_user.user_id and current_user.role != UserRole.ADMIN:
            raise ForbiddenException("You can only cancel your own registrations")

        if registration.registration_status == RegistrationStatus.CANCELLED:
            raise BadRequestException("Registration is already cancelled")

        registration.registration_status = RegistrationStatus.CANCELLED

        # Promote next person from waitlist if capacity freed up
        self._promote_from_waitlist(registration.event_id)

        self.db.commit()
        self.db.refresh(registration)
        return registration

    def _promote_from_waitlist(self, event_id: str) -> None:
        """When someone cancels, promote the first waitlisted person to confirmed."""
        from sqlalchemy import select, and_
        from app.models.registration import EventRegistration
        waitlisted = self.db.execute(
            select(EventRegistration)
            .where(
                and_(
                    EventRegistration.event_id == event_id,
                    EventRegistration.registration_status == RegistrationStatus.WAITLISTED,
                )
            )
            .order_by(EventRegistration.registered_at.asc())
            .limit(1)
        ).scalar_one_or_none()

        if waitlisted:
            waitlisted.registration_status = RegistrationStatus.CONFIRMED

    def get_user_registrations(
        self, user_id: str, page: int = 1, size: int = 10
    ) -> tuple[List[EventRegistration], int]:
        skip = (page - 1) * size
        regs = self.reg_repo.get_by_user(user_id, skip=skip, limit=size)
        total = self.reg_repo.count_by_user(user_id)
        return regs, total

    def get_event_registrations(
        self, event_id: str, page: int = 1, size: int = 100
    ) -> tuple[List[EventRegistration], int]:
        skip = (page - 1) * size
        regs = self.reg_repo.get_by_event(event_id, skip=skip, limit=size)
        total = self.reg_repo.count_confirmed_registrations(event_id)
        return regs, total
