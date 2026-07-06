"""
app/schemas/registration.py
Event Registration Pydantic schemas.
"""
from pydantic import BaseModel
from datetime import datetime


class RegisterForEventRequest(BaseModel):
    event_id: str


class RegistrationResponse(BaseModel):
    registration_id: str
    event_id: str
    user_id: str
    registration_status: str
    payment_status: str
    registered_at: datetime
    model_config = {"from_attributes": True}
