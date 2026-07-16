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
