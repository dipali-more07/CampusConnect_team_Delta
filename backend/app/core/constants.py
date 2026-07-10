"""
app/core/constants.py
======================
All enums and constants used across the project.

WHY: Instead of writing raw strings like "admin", "organizer" everywhere,
     we use Python Enums. This prevents typos and makes the code easier to
     understand, refactor, and maintain.

EXAMPLE: UserRole.ADMIN is better than the string "admin" because:
         - Python will catch typos at runtime
         - Your IDE gives autocomplete
         - You can find all usages easily
"""

from enum import Enum


# ---------------------------------------------------------------
# USER ROLES
# ---------------------------------------------------------------
class UserRole(str, Enum):
    """
    The three types of users in the system.
    'str, Enum' means each value IS a string (stored in DB as string).
    """
    ADMIN = "admin"           # Platform administrator - can do everything
    ORGANIZER = "organizer"   # Club/event organizer - manages events
    PARTICIPANT = "participant"  # Regular student - registers for events


# ---------------------------------------------------------------
# EVENT STATUS
# ---------------------------------------------------------------
class EventStatus(str, Enum):
    """Lifecycle states of an event."""
    DRAFT = "draft"           # Created but not visible to students yet
    PUBLISHED = "published"   # Visible to students, registrations open
    CANCELLED = "cancelled"   # Event cancelled
    COMPLETED = "completed"   # Event is over
    UPCOMING = "upcoming"     # Published and in the future (computed)


# ---------------------------------------------------------------
# EVENT APPROVAL STATUS
# ---------------------------------------------------------------
class ApprovalStatus(str, Enum):
    """Admin approval for events (admin must approve before publishing)."""
    PENDING = "pending"       # Waiting for admin review
    APPROVED = "approved"     # Admin approved - can be published
    REJECTED = "rejected"     # Admin rejected with reason


# ---------------------------------------------------------------
# EVENT TYPE
# ---------------------------------------------------------------
class EventType(str, Enum):
    """Whether the event is in-person or online."""
    ONLINE = "online"
    OFFLINE = "offline"
    HYBRID = "hybrid"


# ---------------------------------------------------------------
# EVENT CATEGORY
# ---------------------------------------------------------------
class EventCategory(str, Enum):
    """Type/domain of the event."""
    TECHNICAL = "technical"
    CULTURAL = "cultural"
    SPORTS = "sports"
    ACADEMIC = "academic"
    WORKSHOP = "workshop"
    SEMINAR = "seminar"
    HACKATHON = "hackathon"
    COMPETITION = "competition"
    OTHER = "other"


# ---------------------------------------------------------------
# REGISTRATION STATUS
# ---------------------------------------------------------------
class RegistrationStatus(str, Enum):
    """Status of a student's event registration."""
    CONFIRMED = "confirmed"   # Registration confirmed
    CANCELLED = "cancelled"   # Student cancelled
    WAITLISTED = "waitlisted" # Event full, student on waiting list
    ATTENDED = "attended"     # Student actually showed up


# ---------------------------------------------------------------
# PAYMENT STATUS
# ---------------------------------------------------------------
class PaymentStatus(str, Enum):
    """Payment status for paid events."""
    FREE = "free"             # No payment needed
    PENDING = "pending"       # Payment initiated but not confirmed
    COMPLETED = "completed"   # Payment successful
    FAILED = "failed"         # Payment failed
    REFUNDED = "refunded"     # Payment was refunded


# ---------------------------------------------------------------
# ATTENDANCE STATUS
# ---------------------------------------------------------------
class AttendanceStatus(str, Enum):
    """Whether the student was present."""
    PRESENT = "present"
    ABSENT = "absent"
    PARTIAL = "partial"       # Came but left early


# ---------------------------------------------------------------
# NOTIFICATION TYPE
# ---------------------------------------------------------------
class NotificationType(str, Enum):
    """Category of notifications sent to users."""
    EVENT = "event"               # About an event
    REGISTRATION = "registration" # About registration
    CERTIFICATE = "certificate"   # About certificate
    SYSTEM = "system"             # System announcements
    REMINDER = "reminder"         # Event reminders


# ---------------------------------------------------------------
# PARTICIPATION TYPE
# ---------------------------------------------------------------
class ParticipationType(str, Enum):
    """How users can participate in the event."""
    TEAM = "team"
    INDIVIDUAL = "individual"
    BOTH = "both"


# ---------------------------------------------------------------
# GENDER
# ---------------------------------------------------------------
class Gender(str, Enum):
    """User gender options."""
    MALE = "male"
    FEMALE = "female"
    OTHER = "other"
    PREFER_NOT_TO_SAY = "prefer_not_to_say"
