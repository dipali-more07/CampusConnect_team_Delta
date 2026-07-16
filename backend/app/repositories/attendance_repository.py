"""
app/repositories/attendance_repository.py
Attendance database operations.
"""
from typing import Optional, List
from sqlalchemy.orm import Session
from sqlalchemy import select, func, and_

from app.repositories.base import BaseRepository
from app.models.attendance import Attendance
from app.core.constants import AttendanceStatus


class AttendanceRepository(BaseRepository[Attendance]):
    def __init__(self, db: Session):
        super().__init__(Attendance, db)

    def get_by_id(self, attendance_id: str) -> Optional[Attendance]:
        return self.db.execute(
            select(Attendance).where(Attendance.attendance_id == attendance_id)
        ).scalar_one_or_none()

    def get_by_registration_id(
        self, registration_id: str
    ) -> Optional[Attendance]:
        """Get attendance record for a specific registration."""
        return self.db.execute(
            select(Attendance).where(
                Attendance.registration_id == registration_id
            )
        ).scalar_one_or_none()

    def get_by_event(
        self, event_id: str, skip: int = 0, limit: int = 100
    ) -> List[Attendance]:
        """Get all attendance records for an event (via registrations)."""
        from app.models.registration import EventRegistration
        query = (
            select(Attendance)
            .join(EventRegistration, Attendance.registration_id == EventRegistration.registration_id)
            .where(EventRegistration.event_id == event_id)
            .offset(skip)
            .limit(limit)
        )
        return list(self.db.execute(query).scalars().all())

    def count_present_for_event(self, event_id: str) -> int:
        """Count how many people actually attended an event."""
        from app.models.registration import EventRegistration
        return self.db.execute(
            select(func.count())
            .select_from(Attendance)
            .join(EventRegistration, Attendance.registration_id == EventRegistration.registration_id)
            .where(
                and_(
                    EventRegistration.event_id == event_id,
                    Attendance.attendance_status == AttendanceStatus.PRESENT,
                )
            )
        ).scalar() or 0

    def count_by_event(self, event_id: str) -> int:
        """Count all attendance records for an event."""
        from app.models.registration import EventRegistration
        return self.db.execute(
            select(func.count())
            .select_from(Attendance)
            .join(EventRegistration, Attendance.registration_id == EventRegistration.registration_id)
            .where(EventRegistration.event_id == event_id)
        ).scalar() or 0

