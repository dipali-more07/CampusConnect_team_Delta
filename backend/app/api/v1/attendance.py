"""
app/api/v1/attendance.py
=========================
Attendance management endpoints.

HOW ATTENDANCE WORKS:
  1. Organizer/Admin generates and displays the Event QR code.
     - API: GET /api/v1/events/{event_id}/qrcode
  2. Student scans the Event QR code using their mobile app.
     - The QR code contains: event_id (or a deep link containing event_id)
  3. The mobile app calls the check-in endpoint:
     - Endpoint: POST /api/v1/attendance/check-in
     - Payload: {"event_id": "<event_id>"}
     - Student's attendance is automatically recorded as PRESENT for that event.
"""
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.database.base import get_db
from app.database.deps import get_current_user, require_organizer
from app.services.attendance_service import AttendanceService
from app.schemas.attendance import CheckInRequest
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


@router.post("/check-in", summary="Check in a student (Student scans Organizer's Event QR)")
def check_in(
    data: CheckInRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Allows a participant (student) to check-in to an event.
    The student scans the organizer's event QR code (which contains the event_id)
    and checks themselves in.
    """
    service = AttendanceService(db)
    attendance = service.self_check_in(
        event_id=data.event_id,
        participant=current_user,
    )
    return success_response(message="Checked in successfully", data=_attendance_to_dict(attendance))




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




