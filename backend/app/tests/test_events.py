"""
app/tests/test_events.py
Event endpoints tests.
"""
import pytest
from datetime import datetime, timedelta
from app.tests.conftest import auth_headers


def make_future_date(days: int = 30) -> str:
    return (datetime.utcnow() + timedelta(days=days)).isoformat()


class TestEventListing:
    def test_list_events_public_accessible(self, client):
        response = client.get("/api/v1/events/")
        assert response.status_code == 200
        data = response.json()
        assert data["success"] is True

    def test_list_events_with_pagination(self, client):
        response = client.get("/api/v1/events/?page=1&size=5")
        assert response.status_code == 200


class TestEventCreation:
    def test_create_event_requires_auth(self, client):
        response = client.post("/api/v1/events/", json={})
        assert response.status_code == 401

    def test_participant_cannot_create_event(self, client, participant_token):
        response = client.post(
            "/api/v1/events/",
            json={
                "title": "Test Event",
                "start_datetime": make_future_date(10),
                "end_datetime": make_future_date(11),
            },
            headers=auth_headers(participant_token)
        )
        assert response.status_code == 403
