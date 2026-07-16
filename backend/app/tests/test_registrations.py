"""
app/tests/test_registrations.py
Event registration tests.
"""
import pytest
from datetime import datetime, timedelta
from app.tests.conftest import auth_headers
from app.core.constants import UserRole, ParticipationType
from app.core.security import hash_password
from app.models.user import User, UserProfile
from app.models.event import Event


@pytest.fixture
def test_event(db, admin_user):
    """Create a published event for testing."""
    event = Event(
        organizer_id=admin_user.user_id,
        title="Hackathon 2026",
        description="Coding Hackathon",
        start_datetime=datetime.utcnow() + timedelta(days=10),
        end_datetime=datetime.utcnow() + timedelta(days=11),
        max_participants=10,
        status="published",
        approval_status="approved",
        participation_type=ParticipationType.BOTH,
    )
    db.add(event)
    db.commit()
    db.refresh(event)
    return event


@pytest.fixture
def registered_teammate(db):
    """Create another registered user for team testing."""
    user = User(
        email="teammate@test.com",
        password_hash=hash_password("Student@123456"),
        role=UserRole.PARTICIPANT,
        is_active=True,
        is_email_verified=True,
    )
    db.add(user)
    db.flush()
    profile = UserProfile(user_id=user.user_id, full_name="Teammate One")
    db.add(profile)
    db.commit()
    return user


class TestEventRegistration:
    def test_individual_registration_success(self, client, participant_user, participant_token, test_event):
        response = client.post(
            "/api/v1/registrations/",
            json={
                "event_id": test_event.event_id,
                "registration_type": "individual",
            },
            headers=auth_headers(participant_token)
        )
        assert response.status_code == 201
        data = response.json()
        assert data["success"] is True
        assert data["data"]["registration_type"] == "individual"
        assert data["data"]["event_name"] == test_event.title
        assert data["data"]["title"] == test_event.title


    def test_team_registration_success(self, client, participant_user, participant_token, registered_teammate, test_event):
        response = client.post(
            "/api/v1/registrations/",
            json={
                "event_id": test_event.event_id,
                "registration_type": "team",
                "team_name": "Delta Coders",
                "team_members": ["teammate@test.com"]
            },
            headers=auth_headers(participant_token)
        )
        assert response.status_code == 201
        data = response.json()
        assert data["success"] is True
        assert data["data"]["registration_type"] == "team"
        assert data["data"]["team_id"] is not None
        assert data["data"]["event_name"] == test_event.title
        assert data["data"]["title"] == test_event.title


    def test_team_registration_fails_unregistered_member(self, client, participant_user, participant_token, test_event):
        response = client.post(
            "/api/v1/registrations/",
            json={
                "event_id": test_event.event_id,
                "registration_type": "team",
                "team_name": "Delta Coders",
                "team_members": ["unregistered@test.com"]
            },
            headers=auth_headers(participant_token)
        )
        assert response.status_code == 400
        data = response.json()
        assert data["success"] is False
        assert "not registered" in data["message"]
