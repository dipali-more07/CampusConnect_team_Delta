"""
app/services/registration_service.py
=====================================
Event registration business logic.

WHAT IS A SERVICE?
  Services are the "brain" of the application. This file handles all the
  rules and logic for registering students to events.

  RULE: Never put business logic in routers (api/v1/*.py files).
        Routers call services, services call repositories.

KEY BUSINESS RULES (enforced in this file):
  1. A user can only register ONCE per event (no duplicate registrations)
  2. Cannot register after the registration deadline has passed
  3. If the event is full → put user on WAITLIST (don't reject them)
  4. Cannot register for a non-PUBLISHED event (must be published, not draft)
  5. Only the user themselves can cancel their own registration (or admin)
  6. When someone cancels → first waitlisted person is auto-promoted to CONFIRMED

TEAM REGISTRATION RULES:
  - All team members must already have accounts on CampusConnect
  - Team leader submits a list of teammate emails
  - Each member gets their own individual registration record (linked by team_id)
  - If capacity is insufficient → entire team goes on WAITLIST
"""
from app.schemas.registration import RegisterForEventRequest
from typing import List, Optional
from datetime import datetime
from sqlalchemy.orm import Session

from app.repositories.registration_repository import RegistrationRepository
from app.repositories.event_repository import EventRepository
from app.repositories.notification_repository import NotificationRepository
from app.core.exceptions import (
    ConflictException, BadRequestException, NotFoundException, ForbiddenException
)
from app.core.constants import RegistrationStatus, EventStatus, NotificationType, ParticipationType, PaymentStatus
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
        self, data: "RegisterForEventRequest", current_user: User
    ) -> EventRegistration:
        """
        Register a student or a team for an event.

        Business Rules Checked:
          1. Event exists and is published
          2. Registration deadline not passed
          3. User not already registered (either individually or in a team)
          4. Event not at capacity
        """
        # Rule 1: Event must exist and be published
        event = self.event_repo.get_by_id(data.event_id)
        if not event:
            raise NotFoundException(f"Event {data.event_id} not found")

        if event.status != EventStatus.PUBLISHED:
            raise BadRequestException("This event is not accepting registrations")

        registration_type = data.registration_type or "individual"

        # Check event participation type compatibility
        if event.participation_type == ParticipationType.INDIVIDUAL and registration_type != "individual":
            raise BadRequestException("This event only allows individual registrations")
        elif event.participation_type == ParticipationType.TEAM and registration_type != "team":
            raise BadRequestException("This event only allows team registrations")

        # Rule 2: Registration deadline
        if event.registration_deadline and datetime.utcnow() > event.registration_deadline:
            raise BadRequestException("Registration deadline has passed")

        if registration_type == "individual":
            # Rule 3: Check for duplicate registration
            existing = self.reg_repo.get_by_event_and_user(data.event_id, current_user.user_id)
            if existing:
                if existing.registration_status == RegistrationStatus.CANCELLED:
                    # Allow re-registration after cancellation
                    existing.registration_status = RegistrationStatus.CONFIRMED
                    self.db.commit()
                    self.db.refresh(existing)
                    return existing
                raise ConflictException("You are already registered for this event")

            # --- CHECK CAPACITY ---
            # max_participants = 0 or None means unlimited seats
            status = RegistrationStatus.CONFIRMED
            if event.max_participants:
                confirmed_count = self.reg_repo.count_confirmed_registrations(data.event_id)
                if confirmed_count >= event.max_participants:
                    # Event is full! Put user on waiting list instead of rejecting them
                    # When someone cancels, _promote_from_waitlist() will auto-upgrade them
                    status = RegistrationStatus.WAITLISTED

            # --- CREATE REGISTRATION RECORD ---
            registration = EventRegistration(
                event_id=data.event_id,
                participant_id=current_user.user_id,
                registration_status=status,
                registration_type="individual",
                # Payment status: FREE if event has no fees, PENDING if fees > 0
                payment_status=PaymentStatus.PENDING if (event.fees and event.fees > 0) else PaymentStatus.FREE,
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
            try:
                await email_service.send_registration_confirmation(
                    current_user.email,
                    event.title,
                    event.start_datetime.strftime("%B %d, %Y at %H:%M"),
                )
            except Exception:
                pass

            return registration

        elif registration_type == "team":
            if not data.team_name:
                raise BadRequestException("Team name is required for team registration")

            # Look up teammate users by email
            teammates = []
            if data.team_members:
                from app.models.user import User as UserModel
                from sqlalchemy import select
                for email in data.team_members:
                    teammate = self.db.execute(
                        select(UserModel).where(UserModel.email == email)
                    ).scalar_one_or_none()
                    if not teammate:
                        raise BadRequestException(f"Teammate with email {email} is not registered.")
                    teammates.append(teammate)

            all_members = [current_user] + teammates

            # Check if any member is already registered for this event
            for member in all_members:
                existing = self.reg_repo.get_by_event_and_user(data.event_id, member.user_id)
                if existing and existing.registration_status != RegistrationStatus.CANCELLED:
                    raise ConflictException(f"Participant {member.email} is already registered for this event")

            # Check capacity
            status = RegistrationStatus.CONFIRMED
            if event.max_participants:
                confirmed_count = self.reg_repo.count_confirmed_registrations(data.event_id)
                if confirmed_count + len(all_members) > event.max_participants:
                    status = RegistrationStatus.WAITLISTED

            # Create Team
            from app.models.team import Team
            team = Team(
                event_id=data.event_id,
                leader_id=current_user.user_id,
                team_name=data.team_name,
                team_members=", ".join(data.team_members) if data.team_members else ""
            )
            self.db.add(team)
            self.db.flush()

            # Create TeamMembers and registrations
            from app.models.team_member import TeamMember
            leader_registration = None
            for member in all_members:
                team_member = TeamMember(
                    team_id=team.team_id,
                    participant_id=member.user_id,
                    total_team_members=len(all_members)
                )
                self.db.add(team_member)

                # Create registration for each member
                reg = EventRegistration(
                    event_id=data.event_id,
                    participant_id=member.user_id,
                    registration_status=status,
                    registration_type="team",
                    team_id=team.team_id,
                    payment_status=PaymentStatus.PENDING if (event.fees and event.fees > 0) else PaymentStatus.FREE,
                )
                self.reg_repo.create(reg)
                if member.user_id == current_user.user_id:
                    leader_registration = reg

                # Create in-app notification
                from app.models.notification import Notification
                notification = Notification(
                    user_id=member.user_id,
                    title="Team Registration Confirmed" if status == RegistrationStatus.CONFIRMED else "Added to Waitlist",
                    message=f"Your registration in team '{data.team_name}' for '{event.title}' has been {status.value}.",
                    notification_type=NotificationType.REGISTRATION,
                )
                self.notif_repo.create(notification)

                # Send confirmation email
                try:
                    await email_service.send_registration_confirmation(
                        member.email,
                        event.title,
                        event.start_datetime.strftime("%B %d, %Y at %H:%M"),
                    )
                except Exception:
                    pass

            self.db.commit()
            self.db.refresh(leader_registration)
            return leader_registration

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
        """
        Automatically promote the first waitlisted person to CONFIRMED
        when a seat becomes available (i.e., someone cancelled).

        HOW IT WORKS:
          - Query for waitlisted registrations for this event
          - Order by registered_at ASC (first come, first served = FIFO queue)
          - Take only the first one (limit 1)
          - Change their status to CONFIRMED

        This is called automatically inside cancel_registration().
        """
        from sqlalchemy import select, and_
        from app.models.registration import EventRegistration

        # Find the earliest waitlisted registration for this event
        waitlisted = self.db.execute(
            select(EventRegistration)
            .where(
                and_(
                    EventRegistration.event_id == event_id,
                    EventRegistration.registration_status == RegistrationStatus.WAITLISTED,
                )
            )
            .order_by(EventRegistration.registered_at.asc())  # First waitlisted = first promoted
            .limit(1)
        ).scalar_one_or_none()

        if waitlisted:
            # Promote them! They now have a confirmed spot.
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
