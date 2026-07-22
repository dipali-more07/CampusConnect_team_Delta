import pytest
from datetime import datetime, timedelta
from app.tests.conftest import auth_headers
from app.core.constants import RegistrationStatus, AttendanceStatus, UserRole
from app.models.event import Event
from app.models.registration import EventRegistration
from app.models.attendance import Attendance

@pytest.fixture
def test_event(db, organizer_user):
    event = Event(
        organizer_id=organizer_user.user_id,
        title="AI Workshop",
        description="Learn AI",
        start_datetime=datetime.utcnow() + timedelta(days=2),
        end_datetime=datetime.utcnow() + timedelta(days=3),
        status="published",
        approval_status="approved",
        capacity=50,
        category="workshop",
    )
    db.add(event)
    db.commit()
    db.refresh(event)
    return event

@pytest.fixture
def test_registration(db, test_event, participant_user):
    reg = EventRegistration(
        event_id=test_event.event_id,
        participant_id=participant_user.user_id,
        registration_status=RegistrationStatus.CONFIRMED,
        registration_type="individual",
    )
    db.add(reg)
    db.commit()
    db.refresh(reg)
    return reg

class TestStudentAttendanceHistory:
    def test_get_my_attendance_empty(self, client, participant_token):
        response = client.get("/api/v1/attendance/my", headers=auth_headers(participant_token))
        assert response.status_code == 200
        data = response.json()
        assert data["success"] is True
        assert len(data["data"]) == 0

    def test_get_my_attendance_history_and_analytics(self, client, db, participant_user, participant_token, test_registration):
        # 1. Create a check-in record
        att = Attendance(
            registration_id=test_registration.registration_id,
            user_id=participant_user.user_id,
            event_id=test_registration.event_id,
            check_in_time=datetime.utcnow(),
            attendance_status=AttendanceStatus.PRESENT,
        )
        db.add(att)
        test_registration.registration_status = RegistrationStatus.ATTENDED
        db.commit()

        # 2. Test Get My Attendance List
        response = client.get("/api/v1/attendance/my", headers=auth_headers(participant_token))
        assert response.status_code == 200
        data = response.json()
        assert len(data["data"]) == 1
        record = data["data"][0]
        assert record["event_title"] == "AI Workshop"
        assert record["attendance_status"] == "present"

        # 3. Test Get My Attendance Analytics
        response_analytics = client.get("/api/v1/attendance/my/analytics", headers=auth_headers(participant_token))
        assert response_analytics.status_code == 200
        analytics = response_analytics.json()["data"]
        assert analytics["total_registered"] == 1
        assert analytics["total_present"] == 1
        assert analytics["attendance_percentage"] == 100.0
        assert len(analytics["category_breakdown"]) == 1
        assert analytics["category_breakdown"][0]["category"] == "workshop"

    def test_get_student_attendance_unauthorized(self, client, participant_token, participant_user):
        # Participants cannot query other students' profiles
        response = client.get(
            f"/api/v1/attendance/student/{participant_user.user_id}",
            headers=auth_headers(participant_token)
        )
        assert response.status_code == 403

    def test_get_student_attendance_authorized(self, client, db, organizer_token, participant_user, test_registration):
        # 1. Check in student
        att = Attendance(
            registration_id=test_registration.registration_id,
            user_id=participant_user.user_id,
            event_id=test_registration.event_id,
            check_in_time=datetime.utcnow(),
            attendance_status=AttendanceStatus.PRESENT,
        )
        db.add(att)
        db.commit()

        # 2. Organizer queries history
        response = client.get(
            f"/api/v1/attendance/student/{participant_user.user_id}",
            headers=auth_headers(organizer_token)
        )
        assert response.status_code == 200
        data = response.json()
        assert len(data["data"]) == 1

        # 3. Organizer queries analytics
        response_analytics = client.get(
            f"/api/v1/attendance/student/{participant_user.user_id}/analytics",
            headers=auth_headers(organizer_token)
        )
        assert response_analytics.status_code == 200
        analytics = response_analytics.json()["data"]
        assert analytics["total_present"] == 1
