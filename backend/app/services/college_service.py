"""
app/services/college_service.py
College business logic.
"""
from typing import Optional, List
from sqlalchemy.orm import Session

from app.repositories.college_repository import CollegeRepository
from app.core.exceptions import NotFoundException, ConflictException
from app.models.college import College
from app.schemas.college import CreateCollegeRequest, UpdateCollegeRequest


class CollegeService:
    def __init__(self, db: Session):
        self.db = db
        self.college_repo = CollegeRepository(db)

    def create_college(self, data: CreateCollegeRequest) -> College:
        """Create a new college (Admin only)."""
        # Check name uniqueness
        existing = self.college_repo.get_by_name(data.college_name)
        if existing:
            raise ConflictException(f"College '{data.college_name}' already exists")

        college = College(
            college_name=data.college_name,
            city=data.city,
            state=data.state,
            website=data.website,
        )
        self.college_repo.create(college)
        self.db.commit()
        self.db.refresh(college)
        return college

    def get_college(self, college_id: str) -> College:
        college = self.college_repo.get_by_id(college_id)
        if not college:
            raise NotFoundException(f"College with ID {college_id} not found")
        return college

    def get_all_colleges(
        self,
        page: int = 1,
        size: int = 10,
        search: Optional[str] = None,
        verified_only: bool = False,
    ) -> tuple[List[College], int]:
        skip = (page - 1) * size
        colleges = self.college_repo.get_all_colleges(
            skip=skip, limit=size, search=search, verified_only=verified_only
        )
        total = self.college_repo.count_colleges(search=search)
        return colleges, total

    def update_college(self, college_id: str, data: UpdateCollegeRequest) -> College:
        college = self.college_repo.get_by_id(college_id)
        if not college:
            raise NotFoundException(f"College {college_id} not found")

        update_data = data.model_dump(exclude_none=True)
        for field, value in update_data.items():
            setattr(college, field, value)

        self.db.commit()
        self.db.refresh(college)
        return college

    def delete_college(self, college_id: str) -> None:
        college = self.college_repo.get_by_id(college_id)
        if not college:
            raise NotFoundException(f"College {college_id} not found")
        self.college_repo.delete(college)
        self.db.commit()

    def update_logo(self, college_id: str, logo_path: str) -> College:
        college = self.get_college(college_id)
        college.logo = logo_path
        self.db.commit()
        self.db.refresh(college)
        return college
