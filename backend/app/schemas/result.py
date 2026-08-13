"""
app/schemas/result.py
Result Pydantic schemas.
"""
from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime


class DeclareResultRequest(BaseModel):
    event_id: str = Field(..., description="Event identifier UUID")
    team_id: Optional[str] = Field(None, description="Team identifier UUID (for team events)")
    participant_id: Optional[str] = Field(None, description="Participant identifier UUID (for individual events)")
    rank: Optional[int] = Field(None, ge=1, description="Rank / standing of the participant or team")
    score: Optional[float] = Field(None, description="Score achieved")


class ResultResponse(BaseModel):
    result_id: str
    event_id: str
    team_id: Optional[str] = None
    participant_id: Optional[str] = None
    rank: Optional[int] = None
    score: Optional[float] = None
    created_at: datetime
    
    # Optional helper fields for frontend
    team_name: Optional[str] = None
    participant_name: Optional[str] = None

    model_config = {"from_attributes": True}
