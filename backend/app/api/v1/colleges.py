"""
app/api/v1/colleges.py
College management endpoints.
"""
from fastapi import APIRouter, Depends, Query, UploadFile, File
from sqlalchemy.orm import Session

from app.database.base import get_db
from app.database.deps import require_admin, get_current_user
from app.services.college_service import CollegeService
from app.services.file_service import file_service
from app.schemas.college import CreateCollegeRequest, UpdateCollegeRequest
from app.core.responses import success_response, paginated_response
from app.models.user import User

router = APIRouter()


@router.post("/", status_code=201, summary="Create college (Admin only)")
def create_college(
    data: CreateCollegeRequest,
    admin: User = Depends(require_admin),
    db: Session = Depends(get_db),
):
    service = CollegeService(db)
    college = service.create_college(data)
    return success_response(message="College created", data={"college_id": college.college_id, "college_name": college.college_name}, status_code=201)


@router.get("/", summary="List all colleges")
def list_colleges(
    page: int = Query(default=1, ge=1),
    size: int = Query(default=10, ge=1, le=100),
    search: str = Query(default=None),
    verified_only: bool = Query(default=False),
    db: Session = Depends(get_db),
):
    service = CollegeService(db)
    colleges, total = service.get_all_colleges(page=page, size=size, search=search, verified_only=verified_only)
    data = [{"college_id": c.college_id, "college_name": c.college_name, "city": c.city, "state": c.state, "is_verified": c.is_verified} for c in colleges]
    return paginated_response(message="Colleges fetched", data=data, total=total, page=page, size=size)


@router.get("/{college_id}", summary="Get college by ID")
def get_college(
    college_id: str,
    db: Session = Depends(get_db),
):
    service = CollegeService(db)
    college = service.get_college(college_id)
    return success_response(message="College fetched", data={"college_id": college.college_id, "college_name": college.college_name, "city": college.city, "state": college.state, "website": college.website, "logo": college.logo, "is_verified": college.is_verified})


@router.patch("/{college_id}", summary="Update college (Admin only)")
def update_college(
    college_id: str,
    data: UpdateCollegeRequest,
    admin: User = Depends(require_admin),
    db: Session = Depends(get_db),
):
    service = CollegeService(db)
    college = service.update_college(college_id, data)
    return success_response(message="College updated", data={"college_id": college.college_id, "college_name": college.college_name})


@router.delete("/{college_id}", summary="Delete college (Admin only)")
def delete_college(
    college_id: str,
    admin: User = Depends(require_admin),
    db: Session = Depends(get_db),
):
    service = CollegeService(db)
    service.delete_college(college_id)
    return success_response(message="College deleted")


@router.post("/{college_id}/logo", summary="Upload college logo (Admin only)")
def upload_logo(
    college_id: str,
    file: UploadFile = File(...),
    admin: User = Depends(require_admin),
    db: Session = Depends(get_db),
):
    logo_path = file_service.save_poster(file)  # reuse image upload logic
    service = CollegeService(db)
    college = service.update_logo(college_id, logo_path)
    return success_response(message="Logo uploaded", data={"logo": logo_path})
