"""
app/services/organizer_service.py
Organizer management business logic.
"""
from typing import List
from sqlalchemy.orm import Session

from app.repositories.organizer_repository import OrganizerRepository
from app.repositories.user_repository import UserRepository
from app.repositories.club_repository import ClubRepository
from app.core.exceptions import NotFoundException, ConflictException, BadRequestException
from app.core.constants import UserRole
from app.models.organizer import Organizer
from app.models.user import User
from app.schemas.organizer import AssignOrganizerRequest, UpdateOrganizerRequest


class OrganizerService:
    def __init__(self, db: Session):
        self.db = db
        self.organizer_repo = OrganizerRepository(db)
        self.user_repo = UserRepository(db)
        self.club_repo = ClubRepository(db)

    def assign_organizer(self, data: AssignOrganizerRequest) -> Organizer:
        """
        Assign a user as an organizer for a club.

        Steps:
          1. Validate user exists
          2. Validate club exists
          3. Check user isn't already an organizer
          4. Update user role to ORGANIZER
          5. Create Organizer record
        """
        user = self.user_repo.get_by_id(data.user_id)
        if not user:
            raise NotFoundException(f"User {data.user_id} not found")

        club = self.club_repo.get_by_id(data.club_id)
        if not club:
            raise NotFoundException(f"Club {data.club_id} not found")

        # Check if already an organizer
        existing = self.organizer_repo.get_by_user_id(data.user_id)
        if existing:
            raise ConflictException(f"User is already an organizer")

        # Update user role
        user.role = UserRole.ORGANIZER

        # Create organizer record
        organizer = Organizer(
            user_id=data.user_id,
            club_id=data.club_id,
            designation=data.designation,
            permissions=data.permissions or ["create_event", "manage_attendance"],
        )
        self.organizer_repo.create(organizer)
        self.db.commit()
        self.db.refresh(organizer)
        return organizer

    def get_organizer(self, organizer_id: str) -> Organizer:
        org = self.organizer_repo.get_by_id(organizer_id)
        if not org:
            raise NotFoundException(f"Organizer {organizer_id} not found")
        return org

    def get_organizer_by_user(self, user_id: str) -> Organizer:
        org = self.organizer_repo.get_by_user_id(user_id)
        if not org:
            raise NotFoundException("No organizer record found for this user")
        return org

    def get_all_organizers(
        self, page: int = 1, size: int = 10
    ) -> tuple[List[Organizer], int]:
        skip = (page - 1) * size
        organizers = self.organizer_repo.get_all_organizers(skip=skip, limit=size)
        total = self.organizer_repo.count_organizers()
        return organizers, total

    def update_organizer(
        self, organizer_id: str, data: UpdateOrganizerRequest
    ) -> Organizer:
        organizer = self.get_organizer(organizer_id)
        update_data = data.model_dump(exclude_none=True)
        for field, value in update_data.items():
            setattr(organizer, field, value)
        self.db.commit()
        self.db.refresh(organizer)
        return organizer

    def remove_organizer(self, organizer_id: str) -> None:
        """Remove organizer role. Reverts user role back to participant."""
        organizer = self.get_organizer(organizer_id)
        user = self.user_repo.get_by_id(organizer.user_id)
        if user:
            user.role = UserRole.PARTICIPANT
        self.organizer_repo.delete(organizer)
        self.db.commit()
