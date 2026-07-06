"""
app/api/v1/analytics.py
Analytics and reporting endpoints.
"""
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from datetime import datetime

from app.database.base import get_db
from app.database.deps import require_admin, require_organizer
from app.services.analytics_service import AnalyticsService
from app.core.responses import success_response
from app.models.user import User

router = APIRouter()


@router.get("/platform", summary="Platform-wide statistics (Admin only)")
def platform_stats(
    admin: User = Depends(require_admin),
    db: Session = Depends(get_db),
):
    """
    Returns aggregate statistics for the entire platform:
    - Total users, organizers, events
    - Registration and attendance counts
    - Certificate statistics
    """
    service = AnalyticsService(db)
    stats = service.get_platform_stats()
    return success_response(message="Platform statistics", data=stats.model_dump())


@router.get("/events/{event_id}", summary="Statistics for a specific event")
def event_stats(
    event_id: str,
    current_user: User = Depends(require_organizer),
    db: Session = Depends(get_db),
):
    """
    Detailed stats for one event:
    - Total/confirmed/cancelled registrations
    - Attendance count and percentage
    - Certificates generated
    """
    service = AnalyticsService(db)
    stats = service.get_event_stats(event_id)
    return success_response(message="Event statistics", data=stats.model_dump())


@router.get("/monthly", summary="Monthly statistics for charts (Admin only)")
def monthly_stats(
    year: int = Query(default=None, description="Year for stats (defaults to current year)"),
    admin: User = Depends(require_admin),
    db: Session = Depends(get_db),
):
    """
    Returns 12 months of data for the given year.
    Used to power bar/line charts in the admin dashboard.
    Format: [{month: '2024-01', events_created: 5, registrations: 50, attendance: 45}]
    """
    if not year:
        year = datetime.utcnow().year
    service = AnalyticsService(db)
    stats = service.get_monthly_stats(year)
    return success_response(
        message=f"Monthly statistics for {year}",
        data=[s.model_dump() for s in stats]
    )


@router.get("/popular-events", summary="Most popular events")
def popular_events(
    limit: int = Query(default=10, ge=1, le=50),
    db: Session = Depends(get_db),
):
    service = AnalyticsService(db)
    events = service.get_popular_events(limit=limit)
    return success_response(
        message="Popular events",
        data=[e.model_dump() for e in events]
    )
