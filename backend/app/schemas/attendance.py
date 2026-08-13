
from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime


class CheckInRequest(BaseModel):
    event_id: str
    registration_id: Optional[str] = None






class AttendanceResponse(BaseModel):
    attendance_id: str
    registration_id: str
    event_id: Optional[str] = None
    event_title: Optional[str] = None
    venue: Optional[str] = None
    check_in_time: Optional[datetime] = None
    check_out_time: Optional[datetime] = None
    attendance_status: str
    scanned_by: Optional[str] = None
    model_config = {"from_attributes": True}

