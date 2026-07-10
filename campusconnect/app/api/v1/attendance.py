"""
app/api/v1/attendance.py
Attendance management endpoints.
"""
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.database.base import get_db
from app.database.deps import get_current_user, require_organizer
from app.services.attendance_service import AttendanceService
from app.schemas.attendance import CheckInRequest, CheckOutRequest
from app.core.responses import success_response, paginated_response
from app.models.user import User

router = APIRouter()


def _attendance_to_dict(att) -> dict:
    return {
        "attendance_id": att.attendance_id,
        "registration_id": att.registration_id,
        "check_in_time": att.check_in_time.isoformat() if att.check_in_time else None,
        "check_out_time": att.check_out_time.isoformat() if att.check_out_time else None,
        "attendance_status": att.attendance_status,
        "scanned_by": att.scanned_by,
    }


@router.post("/check-in", summary="Check in a student (Organizer scans QR)")
def check_in(
    data: CheckInRequest,
    current_user: User = Depends(require_organizer),
    db: Session = Depends(get_db),
):
    """
    Mark a student as present.
    The organizer scans the student's QR code.
    QR contains the registration_id.
    Prevents duplicate scans.
    """
    service = AttendanceService(db)
    attendance = service.check_in(
        registration_id=data.registration_id,
        event_id=data.event_id,
        scanned_by_user=current_user,
    )
    return success_response(message="Student checked in successfully", data=_attendance_to_dict(attendance))


@router.post("/check-out", summary="Check out a student")
def check_out(
    data: CheckOutRequest,
    current_user: User = Depends(require_organizer),
    db: Session = Depends(get_db),
):
    service = AttendanceService(db)
    attendance = service.check_out(
        registration_id=data.registration_id,
        scanned_by_user=current_user,
    )
    return success_response(message="Student checked out", data=_attendance_to_dict(attendance))


@router.get("/event/{event_id}", summary="Get attendance for an event")
def event_attendance(
    event_id: str,
    page: int = Query(default=1, ge=1),
    size: int = Query(default=100, ge=1, le=500),
    current_user: User = Depends(require_organizer),
    db: Session = Depends(get_db),
):
    service = AttendanceService(db)
    records, total = service.get_event_attendance(event_id, page=page, size=size)
    return paginated_response(
        message="Attendance records",
        data=[_attendance_to_dict(r) for r in records],
        total=total, page=page, size=size
    )

