"""
app/schemas/analytics.py
Analytics response schemas.
"""
from pydantic import BaseModel
from typing import List, Optional


class PlatformStats(BaseModel):
    total_users: int
    total_organizers: int
    total_events: int
    upcoming_events: int
    completed_events: int
    cancelled_events: int
    total_registrations: int
    total_attendance: int
    total_certificates: int
    total_colleges: int
    total_clubs: int


class EventStats(BaseModel):
    event_id: str
    event_title: str
    total_registrations: int
    confirmed_registrations: int
    cancelled_registrations: int
    waitlisted: int
    total_attendance: int
    attendance_percentage: float
    certificates_generated: int


class MonthlyStats(BaseModel):
    month: str
    events_created: int
    registrations: int
    attendance: int


class PopularEvent(BaseModel):
    event_id: str
    title: str
    registrations: int
    attendance: int
    category: str
