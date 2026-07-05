"""
app/services/club_service.py
Club business logic.
"""
from typing import Optional, List
from sqlalchemy.orm import Session

from app.repositories.club_repository import ClubRepository
from app.repositories.college_repository import CollegeRepository
from app.core.exceptions import NotFoundException
from app.models.club import Club
from app.schemas.club import CreateClubRequest, UpdateClubRequest


class ClubService:
    def __init__(self, db: Session):
        self.db = db
        self.club_repo = ClubRepository(db)
        self.college_repo = CollegeRepository(db)

    def create_club(self, data: CreateClubRequest) -> Club:
        # Validate college exists
        college = self.college_repo.get_by_id(data.college_id)
        if not college:
            raise NotFoundException(f"College {data.college_id} not found")

        club = Club(
            college_id=data.college_id,
            club_name=data.club_name,
            description=data.description,
            faculty_incharge=data.faculty_incharge,
        )
        self.club_repo.create(club)
        self.db.commit()
        self.db.refresh(club)
        return club

    def get_club(self, club_id: str) -> Club:
        club = self.club_repo.get_by_id(club_id)
        if not club:
            raise NotFoundException(f"Club {club_id} not found")
        return club

    def get_all_clubs(
        self, page: int = 1, size: int = 10, search: Optional[str] = None
    ) -> tuple[List[Club], int]:
        skip = (page - 1) * size
        clubs = self.club_repo.get_all_clubs(skip=skip, limit=size, search=search)
        total = self.club_repo.count_clubs(search=search)
        return clubs, total

    def get_clubs_by_college(
        self, college_id: str, page: int = 1, size: int = 10
    ) -> List[Club]:
        skip = (page - 1) * size
        return self.club_repo.get_by_college(college_id, skip=skip, limit=size)

    def update_club(self, club_id: str, data: UpdateClubRequest) -> Club:
        club = self.club_repo.get_by_id(club_id)
        if not club:
            raise NotFoundException(f"Club {club_id} not found")
        update_data = data.model_dump(exclude_none=True)
        for field, value in update_data.items():
            setattr(club, field, value)
        self.db.commit()
        self.db.refresh(club)
        return club

    def delete_club(self, club_id: str) -> None:
        club = self.club_repo.get_by_id(club_id)
        if not club:
            raise NotFoundException(f"Club {club_id} not found")
        self.club_repo.delete(club)
        self.db.commit()
