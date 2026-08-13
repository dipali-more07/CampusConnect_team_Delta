"""
app/services/result_service.py
Result management business logic.
"""
from typing import List, Optional
from sqlalchemy.orm import Session
from sqlalchemy import select

from app.models.result import Result
from app.models.event import Event
from app.models.team import Team
from app.models.user import User
from app.models.registration import EventRegistration
from app.repositories.result_repository import ResultRepository
from app.repositories.event_repository import EventRepository
from app.core.exceptions import NotFoundException, ForbiddenException, BadRequestException
from app.core.constants import UserRole
from app.schemas.result import DeclareResultRequest


class ResultService:
    def __init__(self, db: Session):
        self.db = db
        self.result_repo = ResultRepository(db)
        self.event_repo = EventRepository(db)

    def declare_result(self, data: DeclareResultRequest, current_user: User) -> Result:
        """Declare/publish a result for an event."""
        # 1. Fetch event
        event = self.event_repo.get_by_id(data.event_id)
        if not event:
            raise NotFoundException(f"Event with ID '{data.event_id}' not found")

        # Check event has completed
        from datetime import datetime, timedelta
        from app.core.constants import EventStatus

        status_val = str(event.status.value if hasattr(event.status, "value") else event.status).upper()
        now = datetime.now()
        now_utc = datetime.utcnow()

        is_ended = False
        if not event.end_datetime:
            is_ended = True
        else:
            is_ended = (
                event.end_datetime <= now or
                event.end_datetime <= now_utc or
                event.end_datetime <= (now_utc + timedelta(hours=6))
            )

        if status_val != EventStatus.COMPLETED.value.upper() and not is_ended:
            raise BadRequestException("Results can only be declared after the event has completed")

        if status_val != EventStatus.COMPLETED.value.upper():
            event.status = EventStatus.COMPLETED
            self.db.commit()
            self.db.refresh(event)

        # 2. Check if user is organizer of the event or admin
        if current_user.role != UserRole.ADMIN and event.organizer_id != current_user.user_id:
            raise ForbiddenException("Only the event organizer or an admin can declare results")

        # 3. Validate participant or team ID
        if not data.participant_id and not data.team_id:
            raise BadRequestException("Either participant_id or team_id must be provided")

        if data.participant_id:
            # Verify participant exists
            participant = self.db.execute(
                select(User).where(User.user_id == data.participant_id)
            ).scalar_one_or_none()
            if not participant:
                raise NotFoundException(f"Participant with ID '{data.participant_id}' not found")

            # Check registration
            registration = self.db.execute(
                select(EventRegistration).where(
                    EventRegistration.event_id == data.event_id,
                    EventRegistration.participant_id == data.participant_id
                )
            ).scalar_one_or_none()
            if not registration:
                raise BadRequestException(f"Participant is not registered for this event")

        if data.team_id:
            # Verify team exists
            team = self.db.execute(
                select(Team).where(Team.team_id == data.team_id)
            ).scalar_one_or_none()
            if not team:
                raise NotFoundException(f"Team with ID '{data.team_id}' not found")
            if team.event_id != data.event_id:
                raise BadRequestException("Team is not registered for this event")

        # 4. Check if a result already exists for this participant or team
        if data.participant_id:
            existing = self.db.execute(
                select(Result).where(
                    Result.event_id == data.event_id,
                    Result.participant_id == data.participant_id
                )
            ).scalar_one_or_none()
            if existing:
                existing.rank = data.rank
                existing.score = data.score
                self.db.commit()
                self.db.refresh(existing)
                self._update_certificates_for_result(data.event_id, data.participant_id, data.team_id, data.rank)
                return existing
        elif data.team_id:
            existing = self.db.execute(
                select(Result).where(
                    Result.event_id == data.event_id,
                    Result.team_id == data.team_id
                )
            ).scalar_one_or_none()
            if existing:
                existing.rank = data.rank
                existing.score = data.score
                self.db.commit()
                self.db.refresh(existing)
                self._update_certificates_for_result(data.event_id, data.participant_id, data.team_id, data.rank)
                return existing

        # Create new Result
        result = Result(
            event_id=data.event_id,
            team_id=data.team_id,
            participant_id=data.participant_id,
            rank=data.rank,
            score=data.score
        )
        self.result_repo.create(result)
        self.db.commit()
        self.db.refresh(result)
        self._update_certificates_for_result(data.event_id, data.participant_id, data.team_id, data.rank)
        return result

    def _update_certificates_for_result(self, event_id: str, participant_id: Optional[str], team_id: Optional[str], rank: Optional[int]):
        if not rank:
            return

        cert_type = "participation"
        if rank == 1:
            cert_type = "winner_1st"
        elif rank == 2:
            cert_type = "runner_up_2nd"
        elif rank == 3:
            cert_type = "runner_up_3rd"
        else:
            cert_type = f"merit_{rank}"

        user_ids = []
        if participant_id:
            user_ids.append(participant_id)
        elif team_id:
            try:
                from app.models.team import Team
                from app.models.team_member import TeamMember
                team_obj = self.db.execute(
                    select(Team).where(Team.team_id == team_id)
                ).scalar_one_or_none()
                if team_obj and team_obj.leader_id:
                    user_ids.append(team_obj.leader_id)
                members = self.db.execute(
                    select(TeamMember.user_id).where(TeamMember.team_id == team_id)
                ).scalars().all()
                user_ids.extend(members)
            except Exception:
                pass

        from app.models.certificate import Certificate
        from app.repositories.certificate_repository import CertificateRepository
        cert_repo = CertificateRepository(self.db)

        for uid in user_ids:
            cert = cert_repo.get_by_event_and_user(event_id, uid)
            if cert:
                cert.certificate_type = cert_type
                self.db.commit()

    def get_event_results(self, event_id: str) -> List[Result]:
        """Get sorted results for a specific event."""
        event = self.event_repo.get_by_id(event_id)
        if not event:
            raise NotFoundException(f"Event with ID '{event_id}' not found")
            
        results = self.result_repo.get_by_event_id(event_id)
        
        # Populate helper fields: team_name or participant_name
        for r in results:
            if r.team_id:
                team = self.db.execute(
                    select(Team).where(Team.team_id == r.team_id)
                ).scalar_one_or_none()
                if team:
                    r.team_name = team.team_name
            if r.participant_id:
                user = self.db.execute(
                    select(User).where(User.user_id == r.participant_id)
                ).scalar_one_or_none()
                if user:
                    r.participant_name = user.full_name or (user.profile.full_name if user.profile else None)
                    
        return results

    def delete_result(self, result_id: str, current_user: User) -> None:
        """Delete a result declaration."""
        result = self.result_repo.get_by_id(result_id)
        if not result:
            raise NotFoundException(f"Result with ID '{result_id}' not found")

        event = self.event_repo.get_by_id(result.event_id)
        if current_user.role != UserRole.ADMIN and (not event or event.organizer_id != current_user.user_id):
            raise ForbiddenException("Only the event organizer or an admin can delete results")

        self.result_repo.delete(result)
        self.db.commit()
