"""
app/api/v1/clubs.py
Club management endpoints.
"""
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.database.base import get_db
from app.database.deps import require_admin, require_organizer, get_current_user
from app.services.club_service import ClubService
from app.schemas.club import CreateClubRequest, UpdateClubRequest
from app.core.responses import success_response, paginated_response
from app.models.user import User

router = APIRouter()


@router.post("/", status_code=201, summary="Create club (Admin only)")
def create_club(
    data: CreateClubRequest,
    admin: User = Depends(require_admin),
    db: Session = Depends(get_db),
):
    service = ClubService(db)
    club = service.create_club(data)
    return success_response(message="Club created", data={"club_id": club.club_id, "club_name": club.club_name}, status_code=201)


@router.get("/", summary="List all clubs")
def list_clubs(
    page: int = Query(default=1, ge=1),
    size: int = Query(default=10, ge=1, le=100),
    search: str = Query(default=None),
    college_id: str = Query(default=None),
    db: Session = Depends(get_db),
):
    service = ClubService(db)
    if college_id:
        clubs = service.get_clubs_by_college(college_id, page=page, size=size)
        total = len(clubs)
    else:
        clubs, total = service.get_all_clubs(page=page, size=size, search=search)
    data = [{"club_id": c.club_id, "club_name": c.club_name, "college_id": c.college_id, "faculty_incharge": c.faculty_incharge} for c in clubs]
    return paginated_response(message="Clubs fetched", data=data, total=total, page=page, size=size)


@router.get("/{club_id}", summary="Get club by ID")
def get_club(club_id: str, db: Session = Depends(get_db)):
    service = ClubService(db)
    club = service.get_club(club_id)
    return success_response(message="Club fetched", data={"club_id": club.club_id, "club_name": club.club_name, "description": club.description, "faculty_incharge": club.faculty_incharge, "college_id": club.college_id})


@router.patch("/{club_id}", summary="Update club (Admin only)")
def update_club(
    club_id: str,
    data: UpdateClubRequest,
    admin: User = Depends(require_admin),
    db: Session = Depends(get_db),
):
    service = ClubService(db)
    club = service.update_club(club_id, data)
    return success_response(message="Club updated", data={"club_id": club.club_id})


@router.delete("/{club_id}", summary="Delete club (Admin only)")
def delete_club(
    club_id: str,
    admin: User = Depends(require_admin),
    db: Session = Depends(get_db),
):
    service = ClubService(db)
    service.delete_club(club_id)
    return success_response(message="Club deleted")
