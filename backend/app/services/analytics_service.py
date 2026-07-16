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
from app.models.event import Event
from app.models.registration import EventRegistration
from app.models.attendance import Attendance
from app.models.certificate import Certificate
from app.core.constants import EventStatus, AttendanceStatus, RegistrationStatus, UserRole
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
            total_organizers=self.db.execute(
                select(func.count()).select_from(User).where(User.role == UserRole.ORGANIZER)
            ).scalar() or 0,
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

    def get_department_participation(self) -> List[dict]:
        """Group event registrations by participant department."""
        results = self.db.execute(
            select(User.department, func.count(EventRegistration.registration_id).label("count"))
            .join(EventRegistration, User.user_id == EventRegistration.participant_id)
            .where(User.department != None)
            .group_by(User.department)
            .order_by(func.count(EventRegistration.registration_id).desc())
        ).all()
        return [{"department": row.department, "count": row.count} for row in results]

    def get_upcoming_events_chart(self) -> List[dict]:
        """Get upcoming events with title and confirmation registration count."""
        now = datetime.utcnow()
        results = self.db.execute(
            select(
                Event.event_id,
                Event.title,
                Event.category,
                func.count(EventRegistration.registration_id).label("count")
            )
            .outerjoin(EventRegistration, Event.event_id == EventRegistration.event_id)
            .where(Event.start_datetime > now)
            .group_by(Event.event_id, Event.title, Event.category)
            .order_by(Event.start_datetime.asc())
            .limit(10)
        ).all()
        return [
            {
                "event_id": row.event_id,
                "title": row.title,
                "category": row.category,
                "registrations": row.count
            }
            for row in results
        ]

    def get_recent_activity(self) -> List[dict]:
        """Fetch unified log of recent platform activities."""
        recent_regs = self.db.execute(
            select(EventRegistration, Event.title, User.email)
            .join(Event, EventRegistration.event_id == Event.event_id)
            .join(User, EventRegistration.participant_id == User.user_id)
            .order_by(EventRegistration.registered_at.desc())
            .limit(10)
        ).all()

        activities = []
        for reg, event_title, email in recent_regs:
            activities.append({
                "activity_id": f"reg_{reg.registration_id}",
                "timestamp": reg.registered_at.isoformat(),
                "type": "registration",
                "message": f"User {email} registered for '{event_title}'",
                "user": email,
                "detail": event_title
            })

        activities.sort(key=lambda x: x["timestamp"], reverse=True)
        return activities[:15]

    def get_live_attendance(self) -> List[dict]:
        """Active/ongoing event present vs absent counts."""
        now = datetime.utcnow()
        active_events = self.db.execute(
            select(Event.event_id, Event.title)
            .where(and_(Event.start_datetime <= now, Event.end_datetime >= now))
        ).all()

        live_stats = []
        for event_id, title in active_events:
            present = self.db.execute(
                select(func.count()).select_from(Attendance)
                .join(EventRegistration, Attendance.registration_id == EventRegistration.registration_id)
                .where(and_(
                    EventRegistration.event_id == event_id,
                    Attendance.attendance_status == AttendanceStatus.PRESENT
                ))
            ).scalar() or 0
            
            total_regs = self.db.execute(
                select(func.count()).select_from(EventRegistration)
                .where(and_(
                    EventRegistration.event_id == event_id,
                    EventRegistration.registration_status == RegistrationStatus.CONFIRMED
                ))
            ).scalar() or 0
            
            absent = max(0, total_regs - present)
            live_stats.append({
                "event_id": event_id,
                "title": title,
                "present": present,
                "absent": absent,
                "total": total_regs
            })

        return live_stats

    def get_department_attendance(self) -> List[dict]:
        """Group present attendance records by user department."""
        results = self.db.execute(
            select(User.department, func.count(Attendance.attendance_id).label("count"))
            .join(EventRegistration, User.user_id == EventRegistration.participant_id)
            .join(Attendance, EventRegistration.registration_id == Attendance.registration_id)
            .where(and_(
                Attendance.attendance_status == AttendanceStatus.PRESENT,
                User.department != None
            ))
            .group_by(User.department)
            .order_by(func.count(Attendance.attendance_id).desc())
        ).all()
        return [{"department": row.department, "present_count": row.count} for row in results]

    def get_hourly_attendance(self) -> List[dict]:
        """Get peak check-in times by hour of the day."""
        results = self.db.execute(
            select(
                extract("hour", Attendance.check_in_time).label("hour"),
                func.count(Attendance.attendance_id).label("count")
            )
            .where(Attendance.check_in_time != None)
            .group_by(extract("hour", Attendance.check_in_time))
            .order_by(extract("hour", Attendance.check_in_time))
        ).all()
        return [{"hour": f"{int(row.hour):02d}:00", "count": row.count} for row in results]

    def get_engagement_radar(self) -> dict:
        """Returns dimensional radar metrics of active students."""
        total_users = self.db.execute(select(func.count()).select_from(User)).scalar() or 0
        total_regs = self.db.execute(select(func.count()).select_from(EventRegistration)).scalar() or 0
        total_present = self.db.execute(
            select(func.count()).select_from(Attendance).where(Attendance.attendance_status == AttendanceStatus.PRESENT)
        ).scalar() or 0
        total_certs = self.db.execute(select(func.count()).select_from(Certificate)).scalar() or 0
        
        reg_rate = min(100.0, (total_regs / total_users * 20.0)) if total_users > 0 else 50.0
        att_rate = (total_present / total_regs * 100.0) if total_regs > 0 else 70.0
        cert_rate = (total_certs / total_present * 100.0) if total_present > 0 else 90.0
        
        return {
            "registration_rate": round(reg_rate, 2),
            "attendance_rate": round(att_rate, 2),
            "certificate_rate": round(cert_rate, 2),
            "feedback_rating": 85.0,
            "category_diversity": 65.0
        }

    def get_categories_breakdown(self) -> List[dict]:
        """Get event and registration counts grouped by category."""
        results = self.db.execute(
            select(
                Event.category,
                func.count(Event.event_id).label("event_count"),
                func.count(EventRegistration.registration_id).label("reg_count")
            )
            .outerjoin(EventRegistration, Event.event_id == EventRegistration.event_id)
            .group_by(Event.category)
            .order_by(func.count(Event.event_id).desc())
        ).all()
        return [
            {
                "category": row.category,
                "events_count": row.event_count,
                "registrations_count": row.reg_count
            }
            for row in results
        ]

    def get_department_distribution(self) -> List[dict]:
        """Distribution of user counts by department."""
        results = self.db.execute(
            select(User.department, func.count(User.user_id).label("count"))
            .where(User.department != None)
            .group_by(User.department)
            .order_by(func.count(User.user_id).desc())
        ).all()
        return [{"department": row.department, "count": row.count} for row in results]

    def get_growth_stats(self) -> List[dict]:
        """
        Get daily event and registration counts for the last 30 days.
        Used to render growth line charts on dashboards.
        """
        from datetime import timedelta
        # Calculate start date (30 days ago) in Indian Standard Time (IST)
        start_date = datetime.utcnow() + timedelta(hours=5, minutes=30) - timedelta(days=30)
        start_date = start_date.replace(hour=0, minute=0, second=0, microsecond=0)
        
        events = self.db.execute(
            select(Event.created_at)
            .where(Event.created_at >= start_date)
        ).scalars().all()

        registrations = self.db.execute(
            select(EventRegistration.registered_at)
            .where(EventRegistration.registered_at >= start_date)
        ).scalars().all()

        # Group by date string (YYYY-MM-DD)
        daily_stats = {}
        
        # Initialize the last 30 days with 0 counts
        for i in range(31):
            day = (start_date + timedelta(days=i)).strftime("%Y-%m-%d")
            daily_stats[day] = {"date": day, "events": 0, "registrations": 0}

        for created_at in events:
            if created_at:
                day = created_at.strftime("%Y-%m-%d")
                if day in daily_stats:
                    daily_stats[day]["events"] += 1

        for registered_at in registrations:
            if registered_at:
                day = registered_at.strftime("%Y-%m-%d")
                if day in daily_stats:
                    daily_stats[day]["registrations"] += 1

        return sorted(daily_stats.values(), key=lambda x: x["date"])
