"""
app/schemas/feedback.py
Pydantic schemas for event feedback requests and responses.
"""
from typing import Optional, Dict
from pydantic import BaseModel, Field
from datetime import datetime


class SubmitFeedbackRequest(BaseModel):
    event_id: str = Field(..., description="ID of the event")
    rating: int = Field(..., ge=1, le=5, description="Rating between 1 and 5")
    review: str = Field(..., min_length=1, max_length=2000, description="Feedback text or review comment")


class UpdateFeedbackRequest(BaseModel):
    rating: Optional[int] = Field(None, ge=1, le=5, description="Rating between 1 and 5")
    review: Optional[str] = Field(None, min_length=1, max_length=2000)


class FeedbackResponse(BaseModel):
    feedback_id: str
    event_id: str
    event_title: Optional[str] = None
    participant_id: str
    participant_name: Optional[str] = None
    rating: int
    review: str
    created_at: datetime

    class Config:
        from_attributes = True


class EventFeedbackSummary(BaseModel):
    event_id: str
    event_title: Optional[str] = None
    total_feedbacks: int
    average_rating: float
    rating_breakdown: Dict[str, int]
