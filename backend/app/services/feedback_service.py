"""
app/services/feedback_service.py
Service logic for Event Feedback processing and statistics.
"""
from typing import List, Tuple
from sqlalchemy.orm import Session

from app.repositories.feedback_repository import FeedbackRepository
from app.repositories.event_repository import EventRepository
from app.repositories.attendance_repository import AttendanceRepository
from app.repositories.registration_repository import RegistrationRepository
from app.repositories.user_repository import UserRepository
from app.core.exceptions import NotFoundException, BadRequestException, ForbiddenException
from app.core.constants import AttendanceStatus, UserRole
from app.models.feedback import Feedback
from app.models.user import User
from app.schemas.feedback import SubmitFeedbackRequest, UpdateFeedbackRequest


class FeedbackService:
    def __init__(self, db: Session):
        self.db = db
        self.feedback_repo = FeedbackRepository(db)
        self.event_repo = EventRepository(db)
        self.attendance_repo = AttendanceRepository(db)
        self.reg_repo = RegistrationRepository(db)
        self.user_repo = UserRepository(db)

    def submit_feedback(self, current_user: User, data: SubmitFeedbackRequest) -> Feedback:
        """
        Submit feedback for an event.
        STRICT REQUIREMENT: Only participants who registered AND marked attendance (PRESENT) can submit feedback.
        """
        event = self.event_repo.get_by_id(data.event_id)
        if not event:
            raise NotFoundException(f"Event {data.event_id} not found")

        # Verify registration
        registration = self.reg_repo.get_by_event_and_user(data.event_id, current_user.user_id)
        if not registration:
            raise BadRequestException("You must be registered for this event to submit feedback")

        # Verify attendance: student MUST have attended the event (AttendanceStatus == PRESENT)
        attendance = self.attendance_repo.get_by_registration_id(registration.registration_id)
        if not attendance or attendance.attendance_status != AttendanceStatus.PRESENT:
            raise BadRequestException("Only participants who attended this event can submit feedback")

        # Check if feedback already exists for this participant and event
        existing_feedback = self.feedback_repo.get_by_event_and_participant(data.event_id, current_user.user_id)
        if existing_feedback:
            # Update existing feedback
            existing_feedback.rating = data.rating
            existing_feedback.review = data.review
            self.db.commit()
            self.db.refresh(existing_feedback)
            return existing_feedback

        # Create new feedback
        feedback = Feedback(
            event_id=data.event_id,
            participant_id=current_user.user_id,
            rating=data.rating,
            review=data.review,
        )
        self.feedback_repo.create(feedback)
        self.db.commit()
        self.db.refresh(feedback)

        # Notify Event Organizer and Admins
        try:
            from app.models.notification import Notification
            from app.core.constants import NotificationType, UserRole
            from sqlalchemy import select

            student_name = current_user.full_name or "A participant"
            review_snippet = data.review[:80] + "..." if len(data.review) > 80 else data.review
            notif_title = f"New Feedback for {event.title}"
            notif_msg = f"{student_name} gave {data.rating}★ rating: '{review_snippet}'"

            # 1. Notify Event Organizer
            if event.organizer_id:
                notif_org = Notification(
                    user_id=event.organizer_id,
                    title=notif_title,
                    message=notif_msg,
                    notification_type=NotificationType.SYSTEM,
                )
                self.db.add(notif_org)

            # 2. Notify Platform Admins
            admin_ids = self.db.execute(
                select(User.user_id).where(User.role == UserRole.ADMIN, User.is_active == True)
            ).scalars().all()

            for admin_id in admin_ids:
                if admin_id != event.organizer_id:
                    notif_admin = Notification(
                        user_id=admin_id,
                        title=f"New Feedback: {event.title}",
                        message=notif_msg,
                        notification_type=NotificationType.SYSTEM,
                    )
                    self.db.add(notif_admin)

            self.db.commit()
        except Exception:
            pass

        return feedback

    def get_my_feedback(self, current_user: User, page: int = 1, size: int = 10) -> Tuple[List[Feedback], int]:
        """Get all feedback submitted by the logged-in participant."""
        skip = (page - 1) * size
        feedbacks = self.feedback_repo.get_by_participant(current_user.user_id, skip=skip, limit=size)
        total = self.feedback_repo.count_by_participant(current_user.user_id)
        return feedbacks, total

    def get_event_feedback(self, event_id: str, current_user: User, page: int = 1, size: int = 10) -> dict:
        """
        Get all feedback and summary metrics for a specific event.
        Accessible by Organizers (event owner), Admins, and Participants.
        """
        event = self.event_repo.get_by_id(event_id)
        if not event:
            raise NotFoundException(f"Event {event_id} not found")

        skip = (page - 1) * size
        feedbacks = self.feedback_repo.get_by_event(event_id, skip=skip, limit=size)
        total = self.feedback_repo.count_by_event(event_id)
        summary = self.feedback_repo.get_event_summary(event_id)
        summary["event_id"] = event_id
        summary["event_title"] = event.title

        return {
            "summary": summary,
            "feedbacks": feedbacks,
            "total": total,
            "page": page,
            "size": size,
        }

    def get_all_feedback(self, current_user: User, page: int = 1, size: int = 10) -> Tuple[List[Feedback], int]:
        """Admin endpoint to list all feedback platform-wide."""
        if current_user.role != UserRole.ADMIN:
            raise ForbiddenException("Admin access required")

        skip = (page - 1) * size
        feedbacks = self.feedback_repo.get_all_paged(skip=skip, limit=size)
        total = self.feedback_repo.count_all()
        return feedbacks, total

    def delete_feedback(self, feedback_id: str, current_user: User) -> None:
        """Delete feedback. Participant can delete own feedback, Admin can delete any."""
        feedback = self.feedback_repo.get_by_id(feedback_id)
        if not feedback:
            raise NotFoundException(f"Feedback {feedback_id} not found")

        if current_user.role != UserRole.ADMIN and feedback.participant_id != current_user.user_id:
            raise ForbiddenException("You can only delete your own feedback")

        self.feedback_repo.delete(feedback)
        self.db.commit()
