"""
app/repositories/event_repository.py
Event database operations.
"""
from typing import Optional, List
from datetime import datetime
from sqlalchemy.orm import Session
from sqlalchemy import select, func, or_, and_

from app.repositories.base import BaseRepository
from app.models.event import Event
from app.core.constants import EventStatus, ApprovalStatus


class EventRepository(BaseRepository[Event]):
    def __init__(self, db: Session):
        super().__init__(Event, db)

    def get_by_id(self, event_id: str) -> Optional[Event]:
        return self.db.execute(
            select(Event).where(Event.event_id == event_id)
        ).scalar_one_or_none()

    def get_all_events(
        self,
        skip: int = 0,
        limit: int = 10,
        search: Optional[str] = None,
        category: Optional[str] = None,
        status: Optional[str] = None,
        organizer_id: Optional[str] = None,
        college_id: Optional[str] = None,
    ) -> List[Event]:
        """Get events with rich filtering. Used for event discovery."""
        query = select(Event)

        if search:
            # Search in title and description
            query = query.where(
                or_(
                    Event.title.ilike(f"%{search}%"),
                    Event.description.ilike(f"%{search}%"),
                )
            )
        if category:
            query = query.where(Event.category == category)
        if status:
            query = query.where(Event.status == status)
        if organizer_id:
            query = query.where(Event.organizer_id == organizer_id)

        query = query.order_by(Event.start_datetime.desc()).offset(skip).limit(limit)
        return list(self.db.execute(query).scalars().all())

    def count_events(
        self,
        search: Optional[str] = None,
        category: Optional[str] = None,
        status: Optional[str] = None,
        organizer_id: Optional[str] = None,
    ) -> int:
        query = select(func.count()).select_from(Event)
        if search:
            query = query.where(
                or_(Event.title.ilike(f"%{search}%"), Event.description.ilike(f"%{search}%"))
            )
        if category:
            query = query.where(Event.category == category)
        if status:
            query = query.where(Event.status == status)
        if organizer_id:
            query = query.where(Event.organizer_id == organizer_id)
        return self.db.execute(query).scalar() or 0

    def get_upcoming_events(self, limit: int = 10) -> List[Event]:
        """Get published events that haven't started yet."""
        now = datetime.utcnow()
        query = (
            select(Event)
            .where(
                and_(
                    Event.status == EventStatus.PUBLISHED,
                    Event.start_datetime > now,
                )
            )
            .order_by(Event.start_datetime.asc())
            .limit(limit)
        )
        return list(self.db.execute(query).scalars().all())

    def get_trending_events(self, limit: int = 10) -> List[Event]:
        """Get published events ordered by registration count (trending)."""
        from app.models.registration import EventRegistration
        from sqlalchemy import desc
        query = (
            select(Event, func.count(EventRegistration.registration_id).label("reg_count"))
            .outerjoin(EventRegistration, Event.event_id == EventRegistration.event_id)
            .where(Event.status == EventStatus.PUBLISHED)
            .group_by(Event.event_id)
            .order_by(desc("reg_count"))
            .limit(limit)
        )
        rows = self.db.execute(query).all()
        return [row[0] for row in rows]  # Return only Event objects

    def get_events_by_organizer(
        self, organizer_id: str, skip: int = 0, limit: int = 10
    ) -> List[Event]:
        query = (
            select(Event)
            .where(Event.organizer_id == organizer_id)
            .order_by(Event.created_at.desc())
            .offset(skip)
            .limit(limit)
        )
        return list(self.db.execute(query).scalars().all())

    def get_pending_approval(self) -> List[Event]:
        """Get events waiting for admin approval."""
        query = select(Event).where(
            Event.approval_status == ApprovalStatus.PENDING
        )
        return list(self.db.execute(query).scalars().all())
