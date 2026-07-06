"""
app/api/v1/search.py
Global search endpoints.
"""
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from sqlalchemy import select, or_

from app.database.base import get_db
from app.database.deps import get_current_user
from app.models.user import User, UserProfile
from app.models.event import Event
from app.models.college import College
from app.models.organizer import Organizer
from app.core.constants import EventStatus
from app.core.responses import success_response

router = APIRouter()


@router.get("/", summary="Global search across events, users, colleges")
def global_search(
    q: str = Query(..., min_length=2, description="Search query (min 2 characters)"),
    search_type: str = Query(
        default="all",
        description="What to search: 'all', 'events', 'users', 'colleges', 'organizers'"
    ),
    limit: int = Query(default=10, ge=1, le=50),
    db: Session = Depends(get_db),
):
    """
    Search across the platform.
    Frontend can call: GET /search?q=machine+learning&type=events
    """
    results = {}

    if search_type in ["all", "events"]:
        events = db.execute(
            select(Event)
            .where(
                or_(
                    Event.title.ilike(f"%{q}%"),
                    Event.description.ilike(f"%{q}%"),
                )
            )
            .where(Event.status == EventStatus.PUBLISHED)
            .limit(limit)
        ).scalars().all()

        results["events"] = [
            {
                "event_id": e.event_id,
                "title": e.title,
                "category": e.category,
                "start_datetime": e.start_datetime.isoformat(),
                "venue": e.venue,
            }
            for e in events
        ]

    if search_type in ["all", "colleges"]:
        colleges = db.execute(
            select(College)
            .where(
                or_(
                    College.college_name.ilike(f"%{q}%"),
                    College.city.ilike(f"%{q}%"),
                    College.state.ilike(f"%{q}%"),
                )
            )
            .limit(limit)
        ).scalars().all()

        results["colleges"] = [
            {
                "college_id": c.college_id,
                "college_name": c.college_name,
                "city": c.city,
                "state": c.state,
            }
            for c in colleges
        ]

    if search_type in ["all", "users"]:
        profiles = db.execute(
            select(UserProfile)
            .where(UserProfile.full_name.ilike(f"%{q}%"))
            .limit(limit)
        ).scalars().all()

        results["users"] = [
            {
                "user_id": p.user_id,
                "full_name": p.full_name,
                "department": p.department,
            }
            for p in profiles
        ]

    return success_response(
        message=f"Search results for '{q}'",
        data=results
    )
