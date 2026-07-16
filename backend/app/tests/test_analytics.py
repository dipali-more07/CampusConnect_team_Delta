import pytest
from app.tests.conftest import auth_headers

class TestAnalyticsAndExtras:
    def test_analytics_endpoints_organizer_access_success(self, client, organizer_token):
        endpoints = [
            "/api/v1/analytics/department-participation",
            "/api/v1/analytics/upcoming-events-chart",
            "/api/v1/analytics/recent-activity",
            "/api/v1/analytics/live-attendance",
            "/api/v1/analytics/department-attendance",
            "/api/v1/analytics/hourly-attendance",
            "/api/v1/analytics/engagement-radar",
            "/api/v1/analytics/department-distribution",
            "/api/v1/analytics/growth"
        ]
        for url in endpoints:
            response = client.get(url, headers=auth_headers(organizer_token))
            assert response.status_code == 200
            data = response.json()
            assert data["success"] is True

    def test_categories_breakdown_public_access_success(self, client):
        response = client.get("/api/v1/analytics/categories-breakdown")
        assert response.status_code == 200
        data = response.json()
        assert data["success"] is True
        assert isinstance(data["data"], list)

    def test_certificates_templates_organizer_access_success(self, client, organizer_token):
        # 1. Get templates
        get_res = client.get("/api/v1/certificates/templates", headers=auth_headers(organizer_token))
        assert get_res.status_code == 200
        assert get_res.json()["success"] is True
        assert len(get_res.json()["data"]) >= 1

        # 2. Design template
        post_res = client.post(
            "/api/v1/certificates/templates",
            json={
                "name": "Custom Template",
                "background_image": "/assets/custom.png",
                "font_color": "#ff0000",
                "title_font_size": 38,
                "body_font_size": 15,
                "is_active": True
            },
            headers=auth_headers(organizer_token)
        )
        assert post_res.status_code == 200
        assert post_res.json()["success"] is True
        assert "template_id" in post_res.json()["data"]

    def test_event_qrcode_generation_organizer_access_success(self, client, organizer_token, db, organizer_user):
        from app.models.event import Event
        from app.core.constants import ParticipationType
        from datetime import datetime, timedelta
        
        event = Event(
            organizer_id=organizer_user.user_id,
            title="Test Event for QR",
            description="Details",
            start_datetime=datetime.utcnow() + timedelta(days=5),
            end_datetime=datetime.utcnow() + timedelta(days=6),
            max_participants=50,
            status="published",
            approval_status="approved",
            participation_type=ParticipationType.INDIVIDUAL,
        )
        db.add(event)
        db.commit()
        db.refresh(event)

        response = client.get(
            f"/api/v1/events/{event.event_id}/qrcode",
            headers=auth_headers(organizer_token)
        )
        assert response.status_code == 200
        assert response.headers["content-type"] == "image/png"

    def test_student_self_check_in_success(self, client, participant_token, participant_user, db, organizer_user):
        from app.models.event import Event
        from app.models.registration import EventRegistration
        from app.core.constants import ParticipationType, RegistrationStatus
        from datetime import datetime, timedelta

        event = Event(
            organizer_id=organizer_user.user_id,
            title="Test Self CheckIn Event",
            description="Details",
            start_datetime=datetime.utcnow() + timedelta(days=5),
            end_datetime=datetime.utcnow() + timedelta(days=6),
            max_participants=50,
            status="published",
            approval_status="approved",
            participation_type=ParticipationType.INDIVIDUAL,
        )
        db.add(event)
        db.commit()
        db.refresh(event)

        # Register the participant first
        reg = EventRegistration(
            event_id=event.event_id,
            participant_id=participant_user.user_id,
            registration_type="individual",
            registration_status=RegistrationStatus.CONFIRMED
        )
        db.add(reg)
        db.commit()

        # Perform self check-in via the main check-in route
        response = client.post(
            "/api/v1/attendance/check-in",
            json={"event_id": event.event_id},
            headers=auth_headers(participant_token)
        )

        assert response.status_code == 200
        data = response.json()
        assert data["success"] is True
        assert data["data"]["attendance_status"] == "present"
        assert data["data"]["scanned_by"] == participant_user.user_id
