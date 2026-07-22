 
from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session
from typing import List

from app.database.base import get_db
from app.database.deps import get_current_user
from app.services.result_service import ResultService
from app.schemas.result import DeclareResultRequest, ResultResponse
from app.core.responses import success_response
from app.models.user import User

router = APIRouter()


@router.post(
    "/declare",
    status_code=status.HTTP_201_CREATED,
    summary="Declare a result",
    description="Declare or update a result for an event. Only the event organizer or an admin can declare results.",
    response_model=None
)
def declare_result(
    data: DeclareResultRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    service = ResultService(db)
    result = service.declare_result(data, current_user)
    
    # Map to schema-like dictionary to include team_name and participant_name
    team_name = None
    participant_name = None
    if result.team:
        team_name = result.team.team_name
    if result.participant:
        participant_name = result.participant.full_name or (result.participant.profile.full_name if result.participant.profile else None)


    return success_response(
        message="Result declared successfully",
        data={
            "result_id": result.result_id,
            "event_id": result.event_id,
            "team_id": result.team_id,
            "participant_id": result.participant_id,
            "rank": result.rank,
            "score": result.score,
            "created_at": result.created_at.isoformat(),
            "team_name": team_name,
            "participant_name": participant_name
        },
        status_code=201
    )


@router.get(
    "/event/{event_id}",
    summary="Get results for an event",
    description="Get all results declared for a specific event, sorted by rank.",
    response_model=None
)
def get_event_results(
    event_id: str,
    db: Session = Depends(get_db)
):
    service = ResultService(db)
    results = service.get_event_results(event_id)
    
    data = []
    for r in results:
        data.append({
            "result_id": r.result_id,
            "event_id": r.event_id,
            "team_id": r.team_id,
            "participant_id": r.participant_id,
            "rank": r.rank,
            "score": r.score,
            "created_at": r.created_at.isoformat(),
            "team_name": getattr(r, "team_name", None),
            "participant_name": getattr(r, "participant_name", None)
        })
        
    return success_response(
        message="Results fetched successfully",
        data=data
    )


@router.delete(
    "/{result_id}",
    summary="Delete a result",
    description="Delete a declared result. Only the event organizer or an admin can delete results.",
)
def delete_result(
    result_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    service = ResultService(db)
    service.delete_result(result_id, current_user)
    return success_response(message="Result deleted successfully")
