 
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


def _detailed_attendance_to_dict(att) -> dict:
    return {
        "attendance_id": att.attendance_id,
        "registration_id": att.registration_id,
        "event_id": att.event_id,
        "event_title": att.event.title if att.event else None,
        "event_date": att.event.start_datetime.isoformat() if att.event else None,
        "check_in_time": att.check_in_time.isoformat() if att.check_in_time else None,
        "check_out_time": att.check_out_time.isoformat() if att.check_out_time else None,
        "attendance_status": att.attendance_status,
    }


@router.get("/my", summary="Get current logged-in user's attendance records")
def get_my_attendance(
    page: int = Query(default=1, ge=1),
    size: int = Query(default=20, ge=1, le=100),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    service = AttendanceService(db)
    records, total = service.get_user_attendance(current_user.user_id, page=page, size=size)
    return paginated_response(
        message="Attendance history fetched successfully",
        data=[_detailed_attendance_to_dict(r) for r in records],
        total=total, page=page, size=size
    )


@router.get("/my/analytics", summary="Get current logged-in user's attendance analytics")
def get_my_attendance_analytics(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    service = AttendanceService(db)
    analytics = service.get_user_attendance_analytics(current_user.user_id)
    return success_response(
        message="Attendance analytics fetched successfully",
        data=analytics
    )


@router.get("/student/{student_id}", summary="Get student's attendance records (Organizer/Admin only)")
def get_student_attendance(
    student_id: str,
    page: int = Query(default=1, ge=1),
    size: int = Query(default=20, ge=1, le=100),
    current_user: User = Depends(require_organizer),
    db: Session = Depends(get_db),
):
    service = AttendanceService(db)
    records, total = service.get_user_attendance(student_id, page=page, size=size)
    return paginated_response(
        message="Student attendance history fetched successfully",
        data=[_detailed_attendance_to_dict(r) for r in records],
        total=total, page=page, size=size
    )


@router.get("/student/{student_id}/analytics", summary="Get student's attendance analytics (Organizer/Admin only)")
def get_student_attendance_analytics(
    student_id: str,
    current_user: User = Depends(require_organizer),
    db: Session = Depends(get_db),
):
    service = AttendanceService(db)
    analytics = service.get_user_attendance_analytics(student_id)
    return success_response(
        message="Student attendance analytics fetched successfully",
        data=analytics
    )




