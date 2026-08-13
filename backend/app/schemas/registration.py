"""
app/schemas/registration.py
Event Registration Pydantic schemas.
"""
from pydantic import BaseModel
from datetime import datetime
from typing import Optional, List


class RegisterForEventRequest(BaseModel):
    event_id: str
    registration_type: Optional[str] = "individual"  # "individual" or "team"
    team_name: Optional[str] = None
    team_members: Optional[List[str]] = None  # List of teammate emails


class RegistrationResponse(BaseModel):
    registration_id: str
    event_id: str
    user_id: str
    registration_status: str
    payment_status: str
    registered_at: datetime
    registration_type: Optional[str] = None
    team_id: Optional[str] = None
    event_name: Optional[str] = None
    title: Optional[str] = None
    model_config = {"from_attributes": True}
