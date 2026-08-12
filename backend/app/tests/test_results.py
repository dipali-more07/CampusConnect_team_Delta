"""
app/tests/test_results.py
Tests for Result management APIs.
"""
import pytest
from app.tests.conftest import auth_headers
from app.core.constants import UserRole
from app.core.security import hash_password
from app.models.user import User, UserProfile
from app.models.event import Event
from app.models.registration import EventRegistration
from app.models.team import Team
from datetime import datetime, timedelta

@pytest.fixture
def test_event(db, organizer_user):
    """Create a default event hosted by organizer."""
    event = Event(
        organizer_id=organizer_user.user_id,
        title="Test Championship",
        description="Epic tournament",
        start_datetime=datetime.utcnow() - timedelta(days=2),
        end_datetime=datetime.utcnow() - timedelta(days=1),
        status="completed",
        approval_status="approved",
    )
    db.add(event)
    db.commit()
    db.refresh(event)
    return event

@pytest.fixture
def test_registration(db, test_event, participant_user):
    """Register the test participant for the test event."""
    reg = EventRegistration(
        event_id=test_event.event_id,
        participant_id=participant_user.user_id,
        registration_status="confirmed",
        payment_status="free",
    )
    db.add(reg)
    db.commit()
    db.refresh(reg)
    return reg

@pytest.fixture
def test_team(db, test_event, participant_user):
    """Create a team registered for the event."""
    team = Team(
        event_id=test_event.event_id,
        leader_id=participant_user.user_id,
        team_name="Dream Team"
    )
    db.add(team)
    db.commit()
    db.refresh(team)
    return team


class TestResults:
    def test_declare_result_success(self, client, test_event, participant_user, test_registration, organizer_token):
        response = client.post(
            "/api/v1/results/declare",
            json={
                "event_id": test_event.event_id,
                "participant_id": participant_user.user_id,
                "rank": 1,
                "score": 95.5
            },
            headers=auth_headers(organizer_token)
        )
        assert response.status_code == 201
        data = response.json()
        assert data["success"] is True
        assert data["data"]["rank"] == 1
        assert data["data"]["score"] == 95.5
        assert data["data"]["participant_name"] == "Test Student"

    def test_declare_team_result_success(self, client, test_event, test_team, organizer_token):
        response = client.post(
            "/api/v1/results/declare",
            json={
                "event_id": test_event.event_id,
                "team_id": test_team.team_id,
                "rank": 2,
                "score": 88.0
            },
            headers=auth_headers(organizer_token)
        )
        assert response.status_code == 201
        data = response.json()
        assert data["success"] is True
        assert data["data"]["rank"] == 2
        assert data["data"]["score"] == 88.0
        assert data["data"]["team_name"] == "Dream Team"

    def test_declare_result_unauthorized_returns_403(self, client, test_event, participant_user, test_registration, participant_token):
        response = client.post(
            "/api/v1/results/declare",
            json={
                "event_id": test_event.event_id,
                "participant_id": participant_user.user_id,
                "rank": 1,
                "score": 95.5
            },
            headers=auth_headers(participant_token)
        )
        assert response.status_code == 403

    def test_declare_result_not_registered_returns_400(self, client, test_event, organizer_user, organizer_token):
        # organizer_user is not registered for test_event
        response = client.post(
            "/api/v1/results/declare",
            json={
                "event_id": test_event.event_id,
                "participant_id": organizer_user.user_id,
                "rank": 1,
                "score": 95.5
            },
            headers=auth_headers(organizer_token)
        )
        assert response.status_code == 400

    def test_get_event_results_success(self, client, test_event, participant_user, test_registration, organizer_token):
        # First declare result
        client.post(
            "/api/v1/results/declare",
            json={
                "event_id": test_event.event_id,
                "participant_id": participant_user.user_id,
                "rank": 1,
                "score": 95.5
            },
            headers=auth_headers(organizer_token)
        )
        
        # Public route to get results
        response = client.get(f"/api/v1/results/event/{test_event.event_id}")
        assert response.status_code == 200
        data = response.json()
        assert data["success"] is True
        assert len(data["data"]) == 1
        assert data["data"][0]["rank"] == 1
        assert data["data"][0]["participant_name"] == "Test Student"

    def test_delete_result_success(self, client, test_event, participant_user, test_registration, organizer_token):
        # Declare result
        res = client.post(
            "/api/v1/results/declare",
            json={
                "event_id": test_event.event_id,
                "participant_id": participant_user.user_id,
                "rank": 1,
                "score": 95.5
            },
            headers=auth_headers(organizer_token)
        )
        result_id = res.json()["data"]["result_id"]

        # Delete result
        response = client.delete(
            f"/api/v1/results/{result_id}",
            headers=auth_headers(organizer_token)
        )
        assert response.status_code == 200
        assert response.json()["success"] is True

        # Verify deleted
        get_res = client.get(f"/api/v1/results/event/{test_event.event_id}")
        assert len(get_res.json()["data"]) == 0
