"""
app/services/analytics_service.py
Analytics and reporting service.

WHY ANALYTICS:
  - Admins need to see platform health (total users, events, etc.)
  - Organizers need to know how their events performed
  - Attendance percentages help improve future events
  - Monthly data helps with planning and reporting

NOTE: These queries aggregate data from multiple tables.
      They are read-only (no writes to DB).
"""
from typing import List
from sqlalchemy.orm import Session
from sqlalchemy import select, func, extract, and_
from datetime import datetime

from app.models.user import User
from app.models.college import College
from app.models.club import Club
from app.models.organizer import Organizer
from app.models.event import Event
from app.models.registration import EventRegistration
from app.models.attendance import Attendance
from app.models.certificate import Certificate
from app.core.constants import EventStatus, AttendanceStatus, RegistrationStatus
from app.schemas.analytics import PlatformStats, EventStats, MonthlyStats, PopularEvent


class AnalyticsService:
    def __init__(self, db: Session):
        self.db = db

    def get_platform_stats(self) -> PlatformStats:
        """Get overall platform statistics for admin dashboard."""

        def count(model) -> int:
            return self.db.execute(select(func.count()).select_from(model)).scalar() or 0

        def count_events_by_status(status: EventStatus) -> int:
            return self.db.execute(
                select(func.count()).select_from(Event).where(Event.status == status)
            ).scalar() or 0

        return PlatformStats(
            total_users=count(User),
            total_organizers=count(Organizer),
            total_events=count(Event),
            upcoming_events=count_events_by_status(EventStatus.PUBLISHED),
            completed_events=count_events_by_status(EventStatus.COMPLETED),
            cancelled_events=count_events_by_status(EventStatus.CANCELLED),
            total_registrations=count(EventRegistration),
            total_attendance=self.db.execute(
                select(func.count()).select_from(Attendance)
                .where(Attendance.attendance_status == AttendanceStatus.PRESENT)
            ).scalar() or 0,
            total_certificates=count(Certificate),
            total_colleges=count(College),
            total_clubs=count(Club),
        )

    def get_event_stats(self, event_id: str) -> EventStats:
        """Get detailed statistics for a single event."""
        event = self.db.execute(
            select(Event).where(Event.event_id == event_id)
        ).scalar_one_or_none()

        if not event:
            from app.core.exceptions import NotFoundException
            raise NotFoundException(f"Event {event_id} not found")

        def count_reg_by_status(status: RegistrationStatus) -> int:
            return self.db.execute(
                select(func.count()).select_from(EventRegistration)
                .where(and_(
                    EventRegistration.event_id == event_id,
                    EventRegistration.registration_status == status,
                ))
            ).scalar() or 0

        total_regs = self.db.execute(
            select(func.count()).select_from(EventRegistration)
            .where(EventRegistration.event_id == event_id)
        ).scalar() or 0

        total_attendance = self.db.execute(
            select(func.count()).select_from(Attendance)
            .join(EventRegistration, Attendance.registration_id == EventRegistration.registration_id)
            .where(and_(
                EventRegistration.event_id == event_id,
                Attendance.attendance_status == AttendanceStatus.PRESENT,
            ))
        ).scalar() or 0

        confirmed = count_reg_by_status(RegistrationStatus.CONFIRMED)
        attendance_pct = (total_attendance / confirmed * 100) if confirmed > 0 else 0.0

        certs = self.db.execute(
            select(func.count()).select_from(Certificate)
            .where(Certificate.event_id == event_id)
        ).scalar() or 0

        return EventStats(
            event_id=event_id,
            event_title=event.title,
            total_registrations=total_regs,
            confirmed_registrations=confirmed,
            cancelled_registrations=count_reg_by_status(RegistrationStatus.CANCELLED),
            waitlisted=count_reg_by_status(RegistrationStatus.WAITLISTED),
            total_attendance=total_attendance,
            attendance_percentage=round(attendance_pct, 2),
            certificates_generated=certs,
        )

    def get_monthly_stats(self, year: int) -> List[MonthlyStats]:
        """Get monthly statistics for the given year (for charts)."""
        stats = []
        for month in range(1, 13):
            events_created = self.db.execute(
                select(func.count()).select_from(Event)
                .where(and_(
                    extract("year", Event.created_at) == year,
                    extract("month", Event.created_at) == month,
                ))
            ).scalar() or 0

            registrations = self.db.execute(
                select(func.count()).select_from(EventRegistration)
                .where(and_(
                    extract("year", EventRegistration.registered_at) == year,
                    extract("month", EventRegistration.registered_at) == month,
                ))
            ).scalar() or 0

            attendance = self.db.execute(
                select(func.count()).select_from(Attendance)
                .where(and_(
                    extract("year", Attendance.check_in_time) == year,
                    extract("month", Attendance.check_in_time) == month,
                    Attendance.attendance_status == AttendanceStatus.PRESENT,
                ))
            ).scalar() or 0

            stats.append(MonthlyStats(
                month=f"{year}-{month:02d}",
                events_created=events_created,
                registrations=registrations,
                attendance=attendance,
            ))
        return stats

    def get_popular_events(self, limit: int = 10) -> List[PopularEvent]:
        """Get most popular events by registration count."""
        results = self.db.execute(
            select(
                Event.event_id,
                Event.title,
                Event.category,
                func.count(EventRegistration.registration_id).label("registrations"),
            )
            .outerjoin(EventRegistration, Event.event_id == EventRegistration.event_id)
            .group_by(Event.event_id, Event.title, Event.category)
            .order_by(func.count(EventRegistration.registration_id).desc())
            .limit(limit)
        ).all()

        popular = []
        for row in results:
            attendance = self.db.execute(
                select(func.count()).select_from(Attendance)
                .join(EventRegistration, Attendance.registration_id == EventRegistration.registration_id)
                .where(and_(
                    EventRegistration.event_id == row.event_id,
                    Attendance.attendance_status == AttendanceStatus.PRESENT,
                ))
            ).scalar() or 0

            popular.append(PopularEvent(
                event_id=row.event_id,
                title=row.title,
                registrations=row.registrations,
                attendance=attendance,
                category=row.category,
            ))
        return popular
