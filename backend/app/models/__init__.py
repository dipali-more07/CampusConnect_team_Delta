"""
app/models/__init__.py
Import all models here so Alembic can discover them for migrations.
"""
from app.models.user import User, UserProfile
from app.models.college import College
from app.models.event import Event
from app.models.registration import EventRegistration
from app.models.attendance import Attendance
from app.models.certificate import Certificate
from app.models.notification import Notification
from app.models.token import PasswordResetToken, RefreshToken
from app.models.event_category import EventCategoryModel
from app.models.team import Team
from app.models.team_member import TeamMember
from app.models.payment import Payment
from app.models.result import Result
from app.models.feedback import Feedback
from app.models.organizer import Organizer

__all__ = [
    "User", "UserProfile",
    "College",
    "Organizer",
    "Event", "EventRegistration",
    "Attendance", "Certificate",
    "Notification", "PasswordResetToken", "RefreshToken",
    "EventCategoryModel", "Team", "TeamMember", "Payment", "Result", "Feedback",
]

