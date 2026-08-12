"""
app/tests/test_feedback.py
Unit & integration tests for Event Feedback endpoints.
"""
import pytest
from datetime import datetime, timedelta

from app.tests.conftest import auth_headers
from app.core.constants import ParticipationType, RegistrationStatus, AttendanceStatus
from app.models.event import Event
from app.models.registration import EventRegistration
from app.models.attendance import Attendance


@pytest.fixture
def test_event(db, organizer_user):
    event = Event(
        organizer_id=organizer_user.user_id,
        title="AI & ML Workshop",
        description="Comprehensive AI Workshop",
        start_datetime=datetime.utcnow() - timedelta(days=1),
        end_datetime=datetime.utcnow() - timedelta(hours=20),
        max_participants=50,
        status="completed",
        approval_status="approved",
        participation_type=ParticipationType.INDIVIDUAL,
    )
    db.add(event)
    db.commit()
    db.refresh(event)
    return event


class TestEventFeedback:
    def test_submit_feedback_unregistered_fails(self, client, participant_token, test_event):
        response = client.post(
            "/api/v1/feedback",
            json={
                "event_id": test_event.event_id,
                "rating": 5,
                "review": "Awesome event!"
            },
            headers=auth_headers(participant_token)
        )
        assert response.status_code == 400
        assert "must be registered" in response.json()["message"]

    def test_submit_feedback_without_attendance_fails(self, client, db, participant_user, participant_token, test_event):
        # 1. Register participant
        reg = EventRegistration(
            event_id=test_event.event_id,
            participant_id=participant_user.user_id,
            registration_type="individual",
            registration_status=RegistrationStatus.CONFIRMED,
        )
        db.add(reg)
        db.commit()

        # 2. Submit feedback WITHOUT attendance marked
        response = client.post(
            "/api/v1/feedback",
            json={
                "event_id": test_event.event_id,
                "rating": 4,
                "review": "Nice event structure!"
            },
            headers=auth_headers(participant_token)
        )
        assert response.status_code == 400
        assert "attended this event" in response.json()["message"].lower()

    def test_submit_feedback_with_attendance_success(self, client, db, participant_user, participant_token, test_event):
        # 1. Register participant
        reg = EventRegistration(
            event_id=test_event.event_id,
            participant_id=participant_user.user_id,
            registration_type="individual",
            registration_status=RegistrationStatus.CONFIRMED,
        )
        db.add(reg)
        db.commit()

        # 2. Mark attendance as PRESENT
        att = Attendance(
            registration_id=reg.registration_id,
            user_id=participant_user.user_id,
            event_id=test_event.event_id,
            attendance_status=AttendanceStatus.PRESENT,
            check_in_time=datetime.utcnow()
        )
        db.add(att)
        db.commit()

        # 3. Submit feedback with attendance marked
        response = client.post(
            "/api/v1/feedback",
            json={
                "event_id": test_event.event_id,
                "rating": 5,
                "review": "Outstanding workshop! Learned a lot about Machine Learning."
            },
            headers=auth_headers(participant_token)
        )
        assert response.status_code == 201
        data = response.json()
        assert data["success"] is True
        assert data["data"]["rating"] == 5
        assert data["data"]["review"] == "Outstanding workshop! Learned a lot about Machine Learning."

        # 4. Update feedback (submit again)
        response_update = client.post(
            "/api/v1/feedback",
            json={
                "event_id": test_event.event_id,
                "rating": 4,
                "review": "Updated review: Great sessions, speaker was articulate."
            },
            headers=auth_headers(participant_token)
        )
        assert response_update.status_code == 201
        assert response_update.json()["data"]["rating"] == 4

    def test_get_event_feedback_summary_and_list(self, client, db, organizer_token, participant_user, participant_token, test_event):
        # 1. Setup registration + attendance + feedback
        reg = EventRegistration(
            event_id=test_event.event_id,
            participant_id=participant_user.user_id,
            registration_type="individual",
            registration_status=RegistrationStatus.CONFIRMED,
        )
        db.add(reg)
        db.commit()

        att = Attendance(
            registration_id=reg.registration_id,
            user_id=participant_user.user_id,
            event_id=test_event.event_id,
            attendance_status=AttendanceStatus.PRESENT,
        )
        db.add(att)
        db.commit()

        client.post(
            "/api/v1/feedback",
            json={
                "event_id": test_event.event_id,
                "rating": 5,
                "review": "5 Star Event!"
            },
            headers=auth_headers(participant_token)
        )

        # 2. Organizer queries feedback for event
        resp_event_feedback = client.get(
            f"/api/v1/feedback/event/{test_event.event_id}",
            headers=auth_headers(organizer_token)
        )
        assert resp_event_feedback.status_code == 200
        data = resp_event_feedback.json()["data"]
        assert data["summary"]["total_feedbacks"] == 1
        assert data["summary"]["average_rating"] == 5.0
        assert data["summary"]["rating_breakdown"]["5"] == 1
        assert len(data["feedbacks"]) == 1

    def test_get_my_feedback(self, client, db, participant_user, participant_token, test_event):
        # Register + Attend + Submit feedback
        reg = EventRegistration(
            event_id=test_event.event_id,
            participant_id=participant_user.user_id,
            registration_type="individual",
            registration_status=RegistrationStatus.CONFIRMED,
        )
        db.add(reg)
        db.commit()

        att = Attendance(
            registration_id=reg.registration_id,
            user_id=participant_user.user_id,
            event_id=test_event.event_id,
            attendance_status=AttendanceStatus.PRESENT,
        )
        db.add(att)
        db.commit()

        client.post(
            "/api/v1/feedback",
            json={
                "event_id": test_event.event_id,
                "rating": 5,
                "review": "Direct My Feedback test"
            },
            headers=auth_headers(participant_token)
        )

        resp_my = client.get(
            "/api/v1/feedback/my",
            headers=auth_headers(participant_token)
        )
        assert resp_my.status_code == 200
        data = resp_my.json()
        assert data["success"] is True
        assert len(data["data"]) == 1
        assert data["data"][0]["rating"] == 5
