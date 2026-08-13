"""
app/services/organizer_service.py
Organizer business logic.
"""
from typing import List
from sqlalchemy.orm import Session

from app.repositories.organizer_repository import OrganizerRepository
from app.repositories.user_repository import UserRepository
from app.core.exceptions import NotFoundException, ConflictException
from app.core.constants import UserRole
from app.models.organizer import Organizer
from app.schemas.organizer import AssignOrganizerRequest, UpdateOrganizerRequest


class OrganizerService:
    def __init__(self, db: Session):
        self.db = db
        self.organizer_repo = OrganizerRepository(db)
        self.user_repo = UserRepository(db)

    def assign_organizer(self, data: AssignOrganizerRequest) -> Organizer:
        user = self.user_repo.get_by_id(data.user_id)
        if not user:
            raise NotFoundException(f"User {data.user_id} not found")

        existing = self.organizer_repo.get_by_user_id(data.user_id)
        if existing:
            raise ConflictException("User is already an organizer")

        user.role = UserRole.ORGANIZER

        organizer = Organizer(
            user_id=data.user_id,
            designation=data.designation,
            permissions=data.permissions or ["create_event", "manage_attendance"],
        )
        self.organizer_repo.create(organizer)
        self.db.commit()
        self.db.refresh(organizer)
        return organizer

    def get_organizer(self, identifier: str) -> Organizer:
        org = self.organizer_repo.get_by_id(identifier)
        if not org:
            org = self.organizer_repo.get_by_user_id(identifier)
        if not org:
            raise NotFoundException(f"Organizer with ID or User ID '{identifier}' not found")
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
        self, identifier: str, data: UpdateOrganizerRequest
    ) -> Organizer:
        organizer = self.get_organizer(identifier)
        update_data = data.model_dump(exclude_none=True)

        if "designation" in update_data:
            organizer.designation = update_data.pop("designation")
        if "permissions" in update_data:
            organizer.permissions = update_data.pop("permissions")

        # Update profile fields (bio, full_name, phone, etc.) on UserProfile if provided
        if update_data:
            from app.services.user_service import UserService
            from app.schemas.user import UpdateProfileRequest
            user_service = UserService(self.db)
            profile_req = UpdateProfileRequest(**update_data)
            user_service.update_profile(organizer.user_id, profile_req)

        self.db.commit()
        self.db.refresh(organizer)
        return organizer

    def remove_organizer(self, identifier: str) -> None:
        org = self.organizer_repo.get_by_id(identifier)
        if not org:
            org = self.organizer_repo.get_by_user_id(identifier)

        if org:
            user = self.user_repo.get_by_id(org.user_id)
            if user:
                user.role = UserRole.PARTICIPANT
            self.organizer_repo.delete(org)
            self.db.commit()
            return

        # Fallback: Check if user exists by user_id
        user = self.user_repo.get_by_id(identifier)
        if user:
            user.role = UserRole.PARTICIPANT
            self.db.commit()
            return

        raise NotFoundException(f"Organizer or User with ID '{identifier}' not found")
