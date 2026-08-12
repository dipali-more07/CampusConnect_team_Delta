"""
app/api/v1/feedback.py
API Endpoints for Event Feedback.
"""
from typing import Optional
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.database.base import get_db
from app.database.deps import get_current_user, require_admin
from app.services.feedback_service import FeedbackService
from app.schemas.feedback import SubmitFeedbackRequest
from app.core.responses import success_response, paginated_response
from app.models.user import User

router = APIRouter()


def _feedback_to_dict(feedback) -> dict:
    participant_name = None
    if hasattr(feedback, "participant") and feedback.participant:
        participant_name = feedback.participant.full_name
        if not participant_name and hasattr(feedback.participant, "profile") and feedback.participant.profile:
            participant_name = feedback.participant.profile.full_name

    return {
        "feedback_id": feedback.feedback_id,
        "event_id": feedback.event_id,
        "event_title": feedback.event.title if hasattr(feedback, "event") and feedback.event else None,
        "participant_id": feedback.participant_id,
        "participant_name": participant_name,
        "rating": feedback.rating,
        "review": feedback.review,
        "created_at": feedback.created_at.isoformat() if feedback.created_at else None,
    }


@router.post("", status_code=201, summary="Submit event feedback (Attendees only)")
def submit_feedback(
    data: SubmitFeedbackRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Submit feedback for an event.
    Only students who registered AND attended (PRESENT) can submit feedback.
    """
    service = FeedbackService(db)
    feedback = service.submit_feedback(current_user, data)
    return success_response(
        message="Feedback submitted successfully",
        data=_feedback_to_dict(feedback),
        status_code=201
    )


@router.get("/my", summary="My submitted feedback")
def get_my_feedback(
    page: int = Query(default=1, ge=1),
    size: int = Query(default=10, ge=1, le=100),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Get all event feedbacks submitted by logged-in participant."""
    service = FeedbackService(db)
    feedbacks, total = service.get_my_feedback(current_user, page=page, size=size)
    return paginated_response(
        message="Your submitted feedback",
        data=[_feedback_to_dict(f) for f in feedbacks],
        total=total,
        page=page,
        size=size
    )


@router.get("/event/{event_id}", summary="Get feedback and rating stats for an event")
def get_event_feedback(
    event_id: str,
    page: int = Query(default=1, ge=1),
    size: int = Query(default=10, ge=1, le=100),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Get all feedback and summary rating analytics for an event.
    Accessible by Organizers, Admins, and Participants.
    """
    service = FeedbackService(db)
    res = service.get_event_feedback(event_id, current_user, page=page, size=size)
    
    return success_response(
        message="Event feedback and rating statistics fetched",
        data={
            "summary": res["summary"],
            "feedbacks": [_feedback_to_dict(f) for f in res["feedbacks"]],
            "pagination": {
                "total": res["total"],
                "page": res["page"],
                "size": res["size"],
                "total_pages": (res["total"] + res["size"] - 1) // res["size"] if res["size"] > 0 else 0
            }
        }
    )


@router.get("/all", summary="List all feedback across platform (Admin only)")
def get_all_feedback(
    page: int = Query(default=1, ge=1),
    size: int = Query(default=10, ge=1, le=100),
    admin: User = Depends(require_admin),
    db: Session = Depends(get_db),
):
    """Admin endpoint to list all platform feedback."""
    service = FeedbackService(db)
    feedbacks, total = service.get_all_feedback(admin, page=page, size=size)
    return paginated_response(
        message="All platform feedback",
        data=[_feedback_to_dict(f) for f in feedbacks],
        total=total,
        page=page,
        size=size
    )


@router.delete("/{feedback_id}", summary="Delete feedback (Owner or Admin)")
def delete_feedback(
    feedback_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Delete a feedback entry."""
    service = FeedbackService(db)
    service.delete_feedback(feedback_id, current_user)
    return success_response(message="Feedback deleted successfully")
