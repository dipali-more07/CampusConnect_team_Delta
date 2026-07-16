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
    return {
        "payment_id": payment.payment_id,
        "event_id": payment.event_id,
        "registration_id": payment.registration_id,
        "amount": float(payment.amount),
        "payment_gateway": payment.payment_gateway,
        "payment_method": payment.payment_method,
        "transaction_id": payment.transaction_id,
        "payment_status": payment.payment_status,
        "payment_date": payment.payment_date.isoformat(),
    }


@router.post("/", status_code=201, summary="Initiate a payment")
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


@router.post("/{payment_id}/refund", summary="Refund a payment (Organizer/Admin)")
async def refund_payment(
    payment_id: str,
    current_user: User = Depends(require_organizer),
    db: Session = Depends(get_db),
):
    """
    Refund a completed payment. Only accessible by event organizers or admins.
    """
    service = PaymentService(db)
    payment = await service.refund_payment(payment_id, current_user)
    return success_response(
        message="Payment refunded successfully",
        data=_payment_to_dict(payment),
    )


@router.get("/my", summary="Get my payments")
def get_my_payments(
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
        message="Your payments retrieved successfully",
        data=[_payment_to_dict(p) for p in payments],
        total=total,
        page=page,
        size=size,
    )


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
