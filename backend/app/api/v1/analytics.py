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


@router.get("/department-participation", summary="Department participation stats")
def department_participation(
    current_user: User = Depends(require_organizer),
    db: Session = Depends(get_db),
):
    service = AnalyticsService(db)
    data = service.get_department_participation()
    return success_response(message="Department participation stats", data=data)


@router.get("/upcoming-events-chart", summary="Upcoming events chart stats")
def upcoming_events_chart(
    current_user: User = Depends(require_organizer),
    db: Session = Depends(get_db),
):
    service = AnalyticsService(db)
    data = service.get_upcoming_events_chart()
    return success_response(message="Upcoming events chart stats", data=data)


@router.get("/recent-activity", summary="Recent platform activity log")
def recent_activity(
    current_user: User = Depends(require_organizer),
    db: Session = Depends(get_db),
):
    service = AnalyticsService(db)
    data = service.get_recent_activity()
    return success_response(message="Recent activity log", data=data)


@router.get("/live-attendance", summary="Live attendance for ongoing events")
def live_attendance(
    current_user: User = Depends(require_organizer),
    db: Session = Depends(get_db),
):
    service = AnalyticsService(db)
    data = service.get_live_attendance()
    return success_response(message="Live attendance stats", data=data)


@router.get("/department-attendance", summary="Present check-ins by department")
def department_attendance(
    current_user: User = Depends(require_organizer),
    db: Session = Depends(get_db),
):
    service = AnalyticsService(db)
    data = service.get_department_attendance()
    return success_response(message="Department attendance stats", data=data)


@router.get("/hourly-attendance", summary="Peak check-in hour distribution")
def hourly_attendance(
    current_user: User = Depends(require_organizer),
    db: Session = Depends(get_db),
):
    service = AnalyticsService(db)
    data = service.get_hourly_attendance()
    return success_response(message="Hourly attendance stats", data=data)


@router.get("/engagement-radar", summary="Student engagement radar metrics")
def engagement_radar(
    current_user: User = Depends(require_organizer),
    db: Session = Depends(get_db),
):
    service = AnalyticsService(db)
    data = service.get_engagement_radar()
    return success_response(message="Engagement radar stats", data=data)


@router.get("/categories-breakdown", summary="Event counts by category")
def categories_breakdown(
    db: Session = Depends(get_db),
):
    service = AnalyticsService(db)
    data = service.get_categories_breakdown()
    return success_response(message="Event categories breakdown", data=data)


@router.get("/department-distribution", summary="User department distribution")
def department_distribution(
    current_user: User = Depends(require_organizer),
    db: Session = Depends(get_db),
):
    service = AnalyticsService(db)
    data = service.get_department_distribution()
    return success_response(message="Department user distribution", data=data)


@router.get("/growth", summary="Event and Registration growth stats (last 30 days)")
def growth_stats(
    current_user: User = Depends(require_organizer),
    db: Session = Depends(get_db),
):
    """
    Returns daily count of events created and registrations made in the last 30 days.
    Used for dashboard analytics (line charts/growth comparison).
    """
    service = AnalyticsService(db)
    data = service.get_growth_stats()
    return success_response(message="Growth statistics fetched", data=data)
