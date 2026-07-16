"""
app/tests/test_payments.py
Payment service and routing tests.
"""
import pytest
from datetime import datetime, timedelta
from app.tests.conftest import auth_headers
from app.core.constants import UserRole, ParticipationType
from app.models.event import Event
from app.models.registration import EventRegistration


@pytest.fixture
def paid_event(db, organizer_user):
    """Create a published event with fees."""
    event = Event(
        organizer_id=organizer_user.user_id,
        title="Paid Workshop",
        description="Premium workshop",
        start_datetime=datetime.utcnow() + timedelta(days=10),
        end_datetime=datetime.utcnow() + timedelta(days=11),
        max_participants=10,
        status="published",
        approval_status="approved",
        participation_type=ParticipationType.INDIVIDUAL,
        fees=500.00
    )
    db.add(event)
    db.commit()
    db.refresh(event)
    return event


@pytest.fixture
def free_event(db, organizer_user):
    """Create a published event with no fees."""
    event = Event(
        organizer_id=organizer_user.user_id,
        title="Free Seminar",
        description="Free seminar",
        start_datetime=datetime.utcnow() + timedelta(days=10),
        end_datetime=datetime.utcnow() + timedelta(days=11),
        max_participants=10,
        status="published",
        approval_status="approved",
        participation_type=ParticipationType.INDIVIDUAL,
        fees=0.00
    )
    db.add(event)
    db.commit()
    db.refresh(event)
    return event


@pytest.fixture
def paid_registration(db, participant_user, paid_event):
    """Create a registration for a paid event."""
    from app.core.constants import PaymentStatus
    reg = EventRegistration(
        event_id=paid_event.event_id,
        participant_id=participant_user.user_id,
        registration_status="confirmed",
        registration_type="individual",
        payment_status=PaymentStatus.PENDING
    )
    db.add(reg)
    db.commit()
    db.refresh(reg)
    return reg


@pytest.fixture
def free_registration(db, participant_user, free_event):
    """Create a registration for a free event."""
    from app.core.constants import PaymentStatus
    reg = EventRegistration(
        event_id=free_event.event_id,
        participant_id=participant_user.user_id,
        registration_status="confirmed",
        registration_type="individual",
        payment_status=PaymentStatus.FREE
    )
    db.add(reg)
    db.commit()
    db.refresh(reg)
    return reg


class TestPaymentService:
    def test_initiate_payment_for_free_event_fails(self, client, participant_token, free_registration):
        response = client.post(
            "/api/v1/payments/",
            json={
                "registration_id": free_registration.registration_id,
                "payment_gateway": "stripe",
                "payment_method": "card"
            },
            headers=auth_headers(participant_token)
        )
        assert response.status_code == 400
        data = response.json()
        assert data["success"] is False
        assert "free, no payment required" in data["message"]

    def test_initiate_payment_for_paid_event_success(self, client, participant_token, paid_registration):
        response = client.post(
            "/api/v1/payments/",
            json={
                "registration_id": paid_registration.registration_id,
                "payment_gateway": "razorpay",
                "payment_method": "upi"
            },
            headers=auth_headers(participant_token)
        )
        assert response.status_code == 201
        data = response.json()
        assert data["success"] is True
        assert data["data"]["payment_status"] == "pending"
        assert data["data"]["amount"] == 500.0

    def test_confirm_payment_success(self, client, participant_token, paid_registration):
        # First initiate the payment
        init_res = client.post(
            "/api/v1/payments/",
            json={
                "registration_id": paid_registration.registration_id,
                "payment_gateway": "razorpay",
                "payment_method": "upi"
            },
            headers=auth_headers(participant_token)
        )
        payment_id = init_res.json()["data"]["payment_id"]

        # Confirm the payment
        conf_res = client.post(
            f"/api/v1/payments/{payment_id}/confirm",
            json={"transaction_id": "tx_123456"},
            headers=auth_headers(participant_token)
        )
        assert conf_res.status_code == 200
        data = conf_res.json()
        assert data["success"] is True
        assert data["data"]["payment_status"] == "completed"
        assert data["data"]["transaction_id"] == "tx_123456"

    def test_fail_payment_success(self, client, participant_token, paid_registration):
        # Initiate the payment
        init_res = client.post(
            "/api/v1/payments/",
            json={"registration_id": paid_registration.registration_id},
            headers=auth_headers(participant_token)
        )
        payment_id = init_res.json()["data"]["payment_id"]

        # Fail the payment
        fail_res = client.post(
            f"/api/v1/payments/{payment_id}/fail",
            headers=auth_headers(participant_token)
        )
        assert fail_res.status_code == 200
        data = fail_res.json()
        assert data["success"] is True
        assert data["data"]["payment_status"] == "failed"

    def test_refund_payment_by_organizer_success(self, client, participant_token, organizer_token, paid_registration):
        # Initiate and confirm payment first
        init_res = client.post(
            "/api/v1/payments/",
            json={"registration_id": paid_registration.registration_id},
            headers=auth_headers(participant_token)
        )
        payment_id = init_res.json()["data"]["payment_id"]
        
        client.post(
            f"/api/v1/payments/{payment_id}/confirm",
            json={"transaction_id": "tx_refund_test"},
            headers=auth_headers(participant_token)
        )

        # Refund as organizer
        ref_res = client.post(
            f"/api/v1/payments/{payment_id}/refund",
            headers=auth_headers(organizer_token)
        )
        assert ref_res.status_code == 200
        data = ref_res.json()
        assert data["success"] is True
        assert data["data"]["payment_status"] == "refunded"

    def test_refund_payment_by_participant_fails(self, client, participant_token, paid_registration):
        # Initiate and confirm payment first
        init_res = client.post(
            "/api/v1/payments/",
            json={"registration_id": paid_registration.registration_id},
            headers=auth_headers(participant_token)
        )
        payment_id = init_res.json()["data"]["payment_id"]
        
        client.post(
            f"/api/v1/payments/{payment_id}/confirm",
            json={"transaction_id": "tx_refund_test"},
            headers=auth_headers(participant_token)
        )

        # Attempt refund as participant (should fail)
        ref_res = client.post(
            f"/api/v1/payments/{payment_id}/refund",
            headers=auth_headers(participant_token)
        )
        assert ref_res.status_code == 403

    def test_get_my_payments(self, client, participant_token, paid_registration):
        # Initiate payment
        client.post(
            "/api/v1/payments/",
            json={"registration_id": paid_registration.registration_id},
            headers=auth_headers(participant_token)
        )

        response = client.get(
            "/api/v1/payments/my",
            headers=auth_headers(participant_token)
        )
        assert response.status_code == 200
        data = response.json()
        assert data["success"] is True
        assert len(data["data"]) >= 1
        assert data["pagination"]["total"] >= 1

    def test_get_event_payments(self, client, participant_token, organizer_token, paid_event, paid_registration):
        # Initiate payment
        client.post(
            "/api/v1/payments/",
            json={"registration_id": paid_registration.registration_id},
            headers=auth_headers(participant_token)
        )

        response = client.get(
            f"/api/v1/payments/event/{paid_event.event_id}",
            headers=auth_headers(organizer_token)
        )
        assert response.status_code == 200
        data = response.json()
        assert data["success"] is True
        assert len(data["data"]) >= 1
        assert data["pagination"]["total"] >= 1

    def test_confirm_payment_razorpay_signature_verification_success(self, client, monkeypatch, participant_token, paid_registration):
        # 1. Mock Razorpay keys in settings
        monkeypatch.setattr("app.core.config.settings.RAZORPAY_KEY_ID", "rzp_test_key")
        monkeypatch.setattr("app.core.config.settings.RAZORPAY_KEY_SECRET", "rzp_test_secret")
        monkeypatch.setattr("app.core.config.settings.MOCK_PAYMENT", False)

        # 2. Mock razorpay.Client and utility.verify_payment_signature
        class MockUtility:
            def verify_payment_signature(self, params):
                assert params["razorpay_order_id"] == "order_mock123"
                assert params["razorpay_payment_id"] == "pay_mock123"
                assert params["razorpay_signature"] == "sig_mock123"
                return True

        class MockOrder:
            def create(self, data):
                return {"id": "order_mock123"}

        class MockClient:
            def __init__(self, auth):
                self.utility = MockUtility()
                self.order = MockOrder()

        monkeypatch.setattr("razorpay.Client", MockClient)

        # 3. Initiate payment with razorpay gateway
        init_res = client.post(
            "/api/v1/payments/",
            json={
                "registration_id": paid_registration.registration_id,
                "payment_gateway": "razorpay"
            },
            headers=auth_headers(participant_token)
        )
        assert init_res.status_code == 201
        payment_id = init_res.json()["data"]["payment_id"]
        assert init_res.json()["data"]["transaction_id"] == "order_mock123"

        # 4. Confirm with razorpay signature
        conf_res = client.post(
            f"/api/v1/payments/{payment_id}/confirm",
            json={
                "razorpay_order_id": "order_mock123",
                "razorpay_payment_id": "pay_mock123",
                "razorpay_signature": "sig_mock123"
            },
            headers=auth_headers(participant_token)
        )
        assert conf_res.status_code == 200
        data = conf_res.json()
        assert data["success"] is True
        assert data["data"]["payment_status"] == "completed"
        assert data["data"]["transaction_id"] == "pay_mock123"
