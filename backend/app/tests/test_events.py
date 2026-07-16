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

    def test_list_events_filters_unapproved_for_participants(self, client, db, organizer_user, participant_token):
        from app.models.event import Event
        from app.core.constants import ParticipationType, ApprovalStatus, EventStatus
        
        # 1. Create an approved event
        approved_event = Event(
            organizer_id=organizer_user.user_id,
            title="Approved Event",
            start_datetime=datetime.utcnow() + timedelta(days=10),
            end_datetime=datetime.utcnow() + timedelta(days=11),
            max_participants=50,
            status=EventStatus.PUBLISHED,
            approval_status=ApprovalStatus.APPROVED,
            participation_type=ParticipationType.INDIVIDUAL,
        )
        # 2. Create a pending event
        pending_event = Event(
            organizer_id=organizer_user.user_id,
            title="Pending Event",
            start_datetime=datetime.utcnow() + timedelta(days=10),
            end_datetime=datetime.utcnow() + timedelta(days=11),
            max_participants=50,
            status=EventStatus.DRAFT,
            approval_status=ApprovalStatus.PENDING,
            participation_type=ParticipationType.INDIVIDUAL,
        )
        
        db.add(approved_event)
        db.add(pending_event)
        db.commit()

        # Public list should only show approved event
        res_public = client.get("/api/v1/events/")
        assert res_public.status_code == 200
        data_public = res_public.json()["data"]
        titles_public = [e["title"] for e in data_public]
        assert "Approved Event" in titles_public
        assert "Pending Event" not in titles_public

        # Participant list should only show approved event
        res_part = client.get("/api/v1/events/", headers=auth_headers(participant_token))
        assert res_part.status_code == 200
        data_part = res_part.json()["data"]
        titles_part = [e["title"] for e in data_part]
        assert "Approved Event" in titles_part
        assert "Pending Event" not in titles_part


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

    def test_organizer_create_event_with_new_fields_success(self, client, organizer_token):
        response = client.post(
            "/api/v1/events/",
            json={
                "event_name": "Ultimate coding event",
                "capacity": 50,
                "venue": "Lab 4",
                "category": "technical",
                "participation_type": "both",
                "description": "An event with team and individual participation options",
                "reg_date_time": make_future_date(2),
                "fees": 120.50,
                "reg_deadline": make_future_date(5),
                "event_date": (datetime.utcnow() + timedelta(days=10)).date().isoformat(),
                "start_datetime": make_future_date(10),
                "end_datetime": make_future_date(11),
            },
            headers=auth_headers(organizer_token)
        )
        assert response.status_code == 201
        data = response.json()
        assert data["success"] is True
        
        event = data["data"]
        assert event["event_name"] == "Ultimate coding event"
        assert event["title"] == "Ultimate coding event"
        assert event["capacity"] == 50
        assert event["venue"] == "Lab 4"
        assert event["category"] == "technical"
        assert event["participation_type"] == "both"
        assert event["description"] == "An event with team and individual participation options"
        assert event["fees"] == 120.50
        assert event["reg_date_time"] is not None
        assert event["reg_deadline"] is not None
        assert event["event_date"] is not None

    def test_admin_approve_event_put_patch_methods_success(self, client, db, organizer_user, admin_token):
        # 1. Create a draft event
        from app.models.event import Event
        from app.core.constants import EventStatus, ApprovalStatus
        event = Event(
            organizer_id=organizer_user.user_id,
            title="Temp test event for approve",
            start_datetime=datetime.utcnow() + timedelta(days=10),
            end_datetime=datetime.utcnow() + timedelta(days=11),
            status=EventStatus.DRAFT,
            approval_status=ApprovalStatus.PENDING,
        )
        db.add(event)
        db.commit()
        db.refresh(event)

        # 2. Approve via PUT method
        response = client.put(
            f"/api/v1/events/{event.event_id}/approve",
            json={"approval_status": "approved"},
            headers=auth_headers(admin_token)
        )
        assert response.status_code == 200
        assert response.json()["data"]["approval_status"] == "approved"

        # Reset to pending
        event.approval_status = ApprovalStatus.PENDING
        db.commit()

        # 3. Approve via PATCH method
        response = client.patch(
            f"/api/v1/events/{event.event_id}/approve",
            json={"approval_status": "approved"},
            headers=auth_headers(admin_token)
        )
        assert response.status_code == 200
        assert response.json()["data"]["approval_status"] == "approved"

    def test_organizer_edit_published_event_success(self, client, db, organizer_user, organizer_token):
        # 1. Create a published event
        from app.models.event import Event
        from app.core.constants import EventStatus, ApprovalStatus
        event = Event(
            organizer_id=organizer_user.user_id,
            title="Original Title",
            start_datetime=datetime.utcnow() + timedelta(days=10),
            end_datetime=datetime.utcnow() + timedelta(days=11),
            status=EventStatus.PUBLISHED,
            approval_status=ApprovalStatus.APPROVED,
            capacity=100,
        )
        db.add(event)
        db.commit()
        db.refresh(event)

        # 2. Edit event via PUT method
        response = client.put(
            f"/api/v1/events/{event.event_id}",
            json={"event_name": "Updated Title via PUT", "capacity": 150},
            headers=auth_headers(organizer_token)
        )
        assert response.status_code == 200
        data = response.json()["data"]
        assert data["event_name"] == "Updated Title via PUT"
        assert data["capacity"] == 150

        # 3. Edit event via PATCH method
        response = client.patch(
            f"/api/v1/events/{event.event_id}",
            json={"event_name": "Updated Title via PATCH"},
            headers=auth_headers(organizer_token)
        )
        assert response.status_code == 200
        data = response.json()["data"]
        assert data["event_name"] == "Updated Title via PATCH"
