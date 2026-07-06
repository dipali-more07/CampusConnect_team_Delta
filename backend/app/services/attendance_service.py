"""
app/services/attendance_service.py
Attendance management - QR scanning and check-in/out logic.

HOW QR CHECK-IN WORKS:
  1. Student opens their registration QR code (from app/email)
  2. Organizer scans the QR code using scanner app
  3. Scanner app sends: POST /attendance/check-in with registration_id
  4. This service validates the registration and marks attendance

PREVENTING DUPLICATE SCANS:
  Each registration can only be checked in ONCE.
  If someone tries to scan the same QR again, we return an error.
  This prevents students from sharing QR codes.
"""
from datetime import datetime
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

    def check_out(
        self, registration_id: str, scanned_by_user: User
    ) -> Attendance:
        """Check out a student when they leave the event."""
        attendance = self.attendance_repo.get_by_registration_id(registration_id)
        if not attendance:
            raise NotFoundException("No check-in record found. Student hasn't checked in yet.")

        if attendance.attendance_status != AttendanceStatus.PRESENT:
            raise BadRequestException("Student is not currently checked in")

        if attendance.check_out_time:
            raise BadRequestException("Student has already checked out")

        attendance.check_out_time = datetime.utcnow()
        attendance.attendance_status = AttendanceStatus.PARTIAL
        self.db.commit()
        self.db.refresh(attendance)
        return attendance

    def get_event_attendance(
        self, event_id: str, page: int = 1, size: int = 100
    ) -> tuple[List[Attendance], int]:
        skip = (page - 1) * size
        records = self.attendance_repo.get_by_event(event_id, skip=skip, limit=size)
        total = self.attendance_repo.count_present_for_event(event_id)
        return records, total
