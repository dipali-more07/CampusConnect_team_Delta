"""
app/api/v1/payments.py
Payment API endpoints.
"""
from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.orm import Session

from app.database.base import get_db
from app.database.deps import get_current_user, require_organizer
from app.services.payment_service import PaymentService
from app.schemas.payment import PaymentCreate, PaymentConfirm
from app.core.responses import success_response, paginated_response
from app.models.user import User

router = APIRouter()


def _payment_to_dict(payment) -> dict:
    event_title = payment.event.title if (hasattr(payment, "event") and payment.event) else None
    
    participant_id = None
    participant_name = None
    participant_email = None
    if hasattr(payment, "registration") and payment.registration:
        participant_id = payment.registration.participant_id
        if hasattr(payment.registration, "user") and payment.registration.user:
            participant_name = payment.registration.user.full_name
            participant_email = payment.registration.user.email

    event_obj = None
    if hasattr(payment, "event") and payment.event:
        event_obj = {
            "event_id": payment.event.event_id,
            "event_name": payment.event.title,
            "title": payment.event.title,
            "category": payment.event.category,
            "venue": payment.event.venue,
            "poster": payment.event.poster,
        }

    return {
        "payment_id": payment.payment_id,
        "event_id": payment.event_id,
        "registration_id": payment.registration_id,
        "user_id": participant_id,
        "participant_id": participant_id,
        "event_name": event_title,
        "event_title": event_title,
        "title": event_title,
        "user_name": participant_name,
        "participant_name": participant_name,
        "user_email": participant_email,
        "participant_email": participant_email,
        "amount": float(payment.amount),
        "payment_gateway": payment.payment_gateway,
        "payment_method": payment.payment_method,
        "transaction_id": payment.transaction_id,
        "payment_status": payment.payment_status,
        "payment_date": payment.payment_date.isoformat(),
        "event": event_obj,
    }


@router.post("", status_code=201, summary="Initiate a payment")
async def initiate_payment(
    data: PaymentCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Initiate a payment for an event registration.
    Sets the registration status to pending.
    """
    service = PaymentService(db)
    payment = await service.initiate_payment(data, current_user)
    return success_response(
        message="Payment initiated successfully",
        data=_payment_to_dict(payment),
        status_code=201,
    )


@router.post("/{payment_id}/confirm", summary="Confirm a payment")
async def confirm_payment(
    payment_id: str,
    data: PaymentConfirm,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Confirm/complete a payment using transaction ID.
    Sets payment and registration status to completed.
    """
    service = PaymentService(db)
    payment = await service.confirm_payment(payment_id, data, current_user)
    return success_response(
        message="Payment confirmed successfully",
        data=_payment_to_dict(payment),
    )


@router.post("/{payment_id}/fail", summary="Mark a payment as failed")
async def fail_payment(
    payment_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Mark an active/pending payment as failed.
    """
    service = PaymentService(db)
    payment = await service.fail_payment(payment_id, current_user)
    return success_response(
        message="Payment marked as failed",
        data=_payment_to_dict(payment),
    )





@router.get("/user", summary="Get user payments")
@router.get("/user-payments", summary="Get user payments (alias)")
@router.get("/my", summary="Get user payments (legacy alias)")
def get_user_payments(
    page: int = Query(default=1, ge=1),
    size: int = Query(default=10, ge=1, le=100),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Retrieve all payments made by the current user.
    """
    service = PaymentService(db)
    payments, total = service.get_my_payments(current_user, page=page, size=size)
    return paginated_response(
        message="User payments retrieved successfully",
        data=[_payment_to_dict(p) for p in payments],
        total=total,
        page=page,
        size=size,
    )


# Backward compatibility alias
get_my_payments = get_user_payments


@router.get("/event/{event_id}", summary="Get event payments (Organizer/Admin)")
def get_event_payments(
    event_id: str,
    page: int = Query(default=1, ge=1),
    size: int = Query(default=100, ge=1, le=500),
    current_user: User = Depends(require_organizer),
    db: Session = Depends(get_db),
):
    """
    Retrieve all payments made for a specific event. Only accessible by organizers/admins.
    """
    service = PaymentService(db)
    payments, total = service.get_event_payments(event_id, current_user, page=page, size=size)
    return paginated_response(
        message="Event payments retrieved successfully",
        data=[_payment_to_dict(p) for p in payments],
        total=total,
        page=page,
        size=size,
    )


@router.get("/{payment_id}", summary="Get payment details")
def get_payment_details(
    payment_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Retrieve details of a single payment.
    Requires ownership of the payment registration, organizing roles for the event, or admin.
    """
    service = PaymentService(db)
    payment = service.get_payment_by_id(payment_id, current_user)
    return success_response(
        message="Payment details retrieved successfully",
        data=_payment_to_dict(payment),
    )
