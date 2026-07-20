"""
app/services/attendance_service.py
===================================
Attendance management - QR scanning and check-in/out logic.

ATTENDANCE SYSTEM MODES:

  MODE A: Student scans Event QR Code (PRIMARY FLOW / RECOMMENDED)
    - Organizer/Admin creates the Event QR code:
      GET /api/v1/events/{event_id}/qrcode
    - Student scans this QR code using their camera.
    - App calls: POST /api/v1/attendance/self-check-in
    - System finds the student's registration for this event and marks them PRESENT.

  MODE B: Organizer scans Student's Registration QR Code (TICKET FLOW)
    - Student displays their individual registration QR code (from ticket/certificate).
    - Organizer scans it using camera.
    - App calls: POST /api/v1/attendance/check-in
    - System marks that specific registration as PRESENT.

PREVENTING DUPLICATE SCANS:
  Each registration can only check in ONCE.
  If scanned again (by student or organizer), a BadRequestException is raised.
  This prevents students from sharing ticket QR codes or scanning event QR codes multiple times.
"""

from datetime import datetime, timedelta
from typing import List, Optional
from sqlalchemy.orm import Session

from app.repositories.attendance_repository import AttendanceRepository
from app.repositories.registration_repository import RegistrationRepository
from app.core.exceptions import (
    NotFoundException, BadRequestException, ForbiddenException
)
from app.core.constants import AttendanceStatus, RegistrationStatus, UserRole
from app.models.attendance import Attendance
from app.models.user import User


class AttendanceService:
    def __init__(self, db: Session):
        self.db = db
        self.attendance_repo = AttendanceRepository(db)
        self.reg_repo = RegistrationRepository(db)

    def check_in(
        self, registration_id: str, event_id: str, scanned_by_user: User
    ) -> Attendance:
        """
        Check in a student by scanning their registration QR code.

        Validates:
          1. Registration exists
          2. Registration belongs to the claimed event
          3. Registration is confirmed (not cancelled/waitlisted)
          4. Student hasn't already checked in (duplicate scan prevention)
        """
        # Validate registration exists
        registration = self.reg_repo.get_by_id(registration_id)
        if not registration:
            raise NotFoundException(f"Registration {registration_id} not found")

        # Validate it's for the correct event
        if registration.event_id != event_id:
            raise BadRequestException("QR code does not belong to this event")

        # Check registration is confirmed
        if registration.registration_status != RegistrationStatus.CONFIRMED:
            raise BadRequestException(
                f"Cannot check in: registration status is '{registration.registration_status}'"
            )

        # Check for duplicate scan
        existing_attendance = self.attendance_repo.get_by_registration_id(registration_id)
        if existing_attendance and existing_attendance.attendance_status == AttendanceStatus.PRESENT:
            raise BadRequestException("Student has already been checked in. Duplicate scan prevented.")

        # Create or update attendance record
        if existing_attendance:
            existing_attendance.check_in_time = datetime.utcnow()
            existing_attendance.attendance_status = AttendanceStatus.PRESENT
            existing_attendance.scanned_by = scanned_by_user.user_id
            self.db.commit()
            self.db.refresh(existing_attendance)
            return existing_attendance
        else:
            attendance = Attendance(
                registration_id=registration_id,
                user_id=registration.participant_id,
                event_id=event_id,
                check_in_time=datetime.utcnow(),
                attendance_status=AttendanceStatus.PRESENT,
                scanned_by=scanned_by_user.user_id,
            )
            self.attendance_repo.create(attendance)
            # Also update registration status to ATTENDED
            registration.registration_status = RegistrationStatus.ATTENDED
            self.db.commit()
            self.db.refresh(attendance)
            return attendance



    def get_event_attendance(
        self, event_id: str, page: int = 1, size: int = 100
    ) -> tuple[List[Attendance], int]:
        """Get paginated attendance list for an event."""
        skip = (page - 1) * size
        records = self.attendance_repo.get_by_event(event_id, skip=skip, limit=size)
        total = self.attendance_repo.count_by_event(event_id)
        return records, total

    def self_check_in(self, event_id: str, participant: User) -> Attendance:
        """
        Allows a participant (student) to self-check-in to an event by scanning the organizer's QR code.
        """
        # Find the participant's registration for this event
        registration = self.reg_repo.get_by_event_and_user(event_id, participant.user_id)
        if not registration:
            raise BadRequestException("You are not registered for this event")

        # Check registration is confirmed or already attended
        if registration.registration_status not in [RegistrationStatus.CONFIRMED, RegistrationStatus.ATTENDED]:
            raise BadRequestException(
                f"Cannot check in: registration status is '{registration.registration_status}'"
            )

        # Check for duplicate scan
        existing_attendance = self.attendance_repo.get_by_registration_id(registration.registration_id)
        if existing_attendance and existing_attendance.attendance_status == AttendanceStatus.PRESENT:
            raise BadRequestException("You have already checked in to this event")

        # Create or update attendance record
        if existing_attendance:
            existing_attendance.check_in_time = datetime.utcnow() + timedelta(hours=5, minutes=30)
            existing_attendance.attendance_status = AttendanceStatus.PRESENT
            existing_attendance.scanned_by = participant.user_id
            existing_attendance.attendance_method = "self"
            self.db.commit()
            self.db.refresh(existing_attendance)
            return existing_attendance
        else:
            attendance = Attendance(
                registration_id=registration.registration_id,
                user_id=participant.user_id,
                event_id=event_id,
                check_in_time=datetime.utcnow() + timedelta(hours=5, minutes=30),
                attendance_status=AttendanceStatus.PRESENT,
                scanned_by=participant.user_id,
                attendance_method="self",
            )
            self.attendance_repo.create(attendance)
            registration.registration_status = RegistrationStatus.ATTENDED
            self.db.commit()
            self.db.refresh(attendance)
            return attendance

    def get_user_attendance(
        self, user_id: str, page: int = 1, size: int = 100
    ) -> tuple[List[Attendance], int]:
        """Get paginated list of attendance records for a student."""
        skip = (page - 1) * size
        records = self.attendance_repo.get_by_user(user_id, skip=skip, limit=size)
        total = self.attendance_repo.count_by_user(user_id)
        return records, total

    def get_user_attendance_analytics(self, user_id: str) -> dict:
        """
        Generate attendance stats, category distribution, and monthly breakdown
        for a student's dashboard charts.
        """
        from sqlalchemy import select, func, and_, extract
        from app.models.registration import EventRegistration
        from app.models.event import Event
        from app.core.constants import RegistrationStatus, AttendanceStatus

        # 1. Total registrations (excluding cancelled)
        total_registered = self.db.execute(
            select(func.count())
            .select_from(EventRegistration)
            .where(
                and_(
                    EventRegistration.participant_id == user_id,
                    EventRegistration.registration_status != RegistrationStatus.CANCELLED
                )
            )
        ).scalar() or 0

        # 2. Total attended (status present)
        total_present = self.db.execute(
            select(func.count())
            .select_from(Attendance)
            .where(
                and_(
                    Attendance.user_id == user_id,
                    Attendance.attendance_status == AttendanceStatus.PRESENT
                )
            )
        ).scalar() or 0

        # 3. Total absent (status absent)
        total_absent = self.db.execute(
            select(func.count())
            .select_from(Attendance)
            .where(
                and_(
                    Attendance.user_id == user_id,
                    Attendance.attendance_status == AttendanceStatus.ABSENT
                )
            )
        ).scalar() or 0

        # Calculated rates
        attendance_percentage = (total_present / total_registered * 100) if total_registered > 0 else 0.0

        # 4. Category distribution (Registered vs Attended by category)
        # 4.1 Count registrations per category
        reg_by_cat_res = self.db.execute(
            select(Event.category, func.count(EventRegistration.registration_id))
            .join(EventRegistration, Event.event_id == EventRegistration.event_id)
            .where(
                and_(
                    EventRegistration.participant_id == user_id,
                    EventRegistration.registration_status != RegistrationStatus.CANCELLED
                )
            )
            .group_by(Event.category)
        ).all()

        reg_by_cat = {row[0]: row[1] for row in reg_by_cat_res if row[0]}

        # 4.2 Count attended per category
        att_by_cat_res = self.db.execute(
            select(Event.category, func.count(Attendance.attendance_id))
            .join(Attendance, Event.event_id == Attendance.event_id)
            .where(
                and_(
                    Attendance.user_id == user_id,
                    Attendance.attendance_status == AttendanceStatus.PRESENT
                )
            )
            .group_by(Event.category)
        ).all()

        att_by_cat = {row[0]: row[1] for row in att_by_cat_res if row[0]}

        # Build list of unique categories
        categories = list(set(list(reg_by_cat.keys()) + list(att_by_cat.keys())))
        category_breakdown = [
            {
                "category": cat.value if hasattr(cat, "value") else str(cat),
                "registered": reg_by_cat.get(cat, 0),
                "attended": att_by_cat.get(cat, 0)
            }
            for cat in categories
        ]

        # 5. Monthly breakdown for current year
        current_year = datetime.utcnow().year
        monthly_att_res = self.db.execute(
            select(
                extract("month", Attendance.check_in_time).label("month"),
                func.count(Attendance.attendance_id).label("count")
            )
            .where(
                and_(
                    Attendance.user_id == user_id,
                    Attendance.attendance_status == AttendanceStatus.PRESENT,
                    extract("year", Attendance.check_in_time) == current_year
                )
            )
            .group_by(extract("month", Attendance.check_in_time))
        ).all()

        monthly_counts = {int(row[0]): row[1] for row in monthly_att_res if row[0]}

        # Generate all 12 months with names
        month_names = [
            "Jan", "Feb", "Mar", "Apr", "May", "Jun",
            "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"
        ]
        monthly_breakdown = [
            {
                "month": month_names[m - 1],
                "attended": monthly_counts.get(m, 0)
            }
            for m in range(1, 13)
        ]

        return {
            "total_registered": total_registered,
            "total_present": total_present,
            "total_absent": total_absent,
            "attendance_percentage": round(attendance_percentage, 2),
            "category_breakdown": category_breakdown,
            "monthly_breakdown": monthly_breakdown
        }



