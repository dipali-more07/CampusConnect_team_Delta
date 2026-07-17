"""
app/tests/test_certificates.py
Tests for Certificate endpoints and queries.
"""
import pytest
from datetime import datetime, timedelta
from app.tests.conftest import auth_headers
from app.core.constants import ParticipationType, RegistrationStatus, AttendanceStatus
from app.models.event import Event
from app.models.registration import EventRegistration
from app.models.attendance import Attendance


@pytest.fixture
def published_event(db, organizer_user):
    """Create a published event for certificate testing."""
    event = Event(
        organizer=organizer_user,
        organizer_id=organizer_user.user_id,
        title="Python Deep Dive Masterclass",
        description="Learn Python from scratch",
        start_datetime=datetime.utcnow() + timedelta(days=1),
        end_datetime=datetime.utcnow() + timedelta(days=2),
        max_participants=10,
        status="published",
        approval_status="approved",
        participation_type=ParticipationType.INDIVIDUAL,
    )
    db.add(event)
    db.commit()
    db.refresh(event)
    return event


class TestCertificateWorkflow:
    def test_certificate_flow_and_retrieval(
        self, client, db, organizer_user, organizer_token, participant_user, participant_token, published_event
    ):
        # 1. Register the participant
        reg = EventRegistration(
            event_id=published_event.event_id,
            participant_id=participant_user.user_id,
            registration_type="individual",
            registration_status=RegistrationStatus.CONFIRMED,
        )
        db.add(reg)
        db.commit()
        db.refresh(reg)

        # 2. Mark participant as PRESENT
        attendance = Attendance(
            registration_id=reg.registration_id,
            user_id=participant_user.user_id,
            event_id=published_event.event_id,
            attendance_status=AttendanceStatus.PRESENT,
        )
        db.add(attendance)
        db.commit()

        # 3. Generate certificate using organizer token
        response = client.post(
            "/api/v1/certificates/generate",
            json={
                "event_id": published_event.event_id,
                "user_id": participant_user.user_id,
            },
            headers=auth_headers(organizer_token),
        )
        assert response.status_code == 201
        data = response.json()
        assert data["success"] is True
        assert data["data"]["event_name"] == "Python Deep Dive Masterclass"
        assert data["data"]["title"] == "Python Deep Dive Masterclass"
        assert data["data"]["pdf_path"] is not None

        # 4. Get 'my' certificates with participant token
        resp_my = client.get(
            "/api/v1/certificates/my",
            headers=auth_headers(participant_token),
        )
        assert resp_my.status_code == 200
        data_my = resp_my.json()
        assert data_my["success"] is True
        assert len(data_my["data"]) == 1
        
        cert = data_my["data"][0]
        assert cert["event_name"] == "Python Deep Dive Masterclass"
        assert cert["title"] == "Python Deep Dive Masterclass"
        assert cert["event_date"] is not None
        assert cert["certificate_number"] is not None
        assert cert["pdf_path"] is not None
