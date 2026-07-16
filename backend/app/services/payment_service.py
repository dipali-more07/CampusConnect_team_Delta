"""
app/services/payment_service.py
Payment business logic.
"""
from typing import List, Optional
from datetime import datetime
from sqlalchemy.orm import Session

from app.repositories.payment_repository import PaymentRepository
from app.repositories.registration_repository import RegistrationRepository
from app.repositories.event_repository import EventRepository
from app.repositories.notification_repository import NotificationRepository
from app.models.payment import Payment
from app.models.user import User
from app.models.notification import Notification
from app.schemas.payment import PaymentCreate, PaymentConfirm
from app.core.config import settings
import razorpay
import logging

logger = logging.getLogger(__name__)
from app.core.constants import RegistrationStatus, PaymentStatus, NotificationType, UserRole
from app.core.exceptions import (
    ConflictException, BadRequestException, NotFoundException, ForbiddenException
)


class PaymentService:
    def __init__(self, db: Session):
        self.db = db
        self.payment_repo = PaymentRepository(db)
        self.reg_repo = RegistrationRepository(db)
        self.event_repo = EventRepository(db)
        self.notif_repo = NotificationRepository(db)

    def _get_razorpay_client(self) -> Optional[razorpay.Client]:
        if settings.RAZORPAY_KEY_ID and settings.RAZORPAY_KEY_SECRET:
            try:
                return razorpay.Client(auth=(settings.RAZORPAY_KEY_ID, settings.RAZORPAY_KEY_SECRET))
            except Exception as e:
                logger.error(f"Failed to initialize Razorpay Client: {e}")
        return None

    async def initiate_payment(self, data: PaymentCreate, current_user: User) -> Payment:
        """
        Initiate a payment for an event registration.
        """
        # 1. Fetch registration
        reg = self.reg_repo.get_by_id(data.registration_id)
        if not reg:
            raise NotFoundException(f"Registration {data.registration_id} not found")

        # 2. Check ownership
        if reg.participant_id != current_user.user_id and current_user.role != UserRole.ADMIN:
            raise ForbiddenException("You can only pay for your own registrations")

        # 3. Fetch event to verify fees
        event = self.event_repo.get_by_id(reg.event_id)
        if not event:
            raise NotFoundException(f"Event {reg.event_id} not found")

        if not event.fees or event.fees <= 0:
            raise BadRequestException("This event is free, no payment required")

        # 4. Check if a payment already exists
        existing_payment = self.payment_repo.get_by_registration_id(reg.registration_id)
        if existing_payment:
            if existing_payment.payment_status == "completed":
                raise ConflictException("Payment has already been completed")
            # If exists but pending/failed, we update and return it
            existing_payment.payment_gateway = data.payment_gateway
            existing_payment.payment_method = data.payment_method
            existing_payment.payment_status = "pending"
            existing_payment.payment_date = datetime.utcnow()
            
            # Create Razorpay order if configured
            if data.payment_gateway == "razorpay":
                if getattr(settings, "MOCK_PAYMENT", True):
                    import uuid
                    existing_payment.transaction_id = f"order_mock_{uuid.uuid4().hex[:12]}"
                else:
                    client = self._get_razorpay_client()
                    if client:
                        try:
                            order_amount = int(float(event.fees) * 100)
                            order_data = {
                                "amount": order_amount,
                                "currency": "INR",
                                "receipt": f"receipt_{existing_payment.payment_id}",
                            }
                            razorpay_order = client.order.create(data=order_data)
                            existing_payment.transaction_id = razorpay_order["id"]
                        except Exception as e:
                            logger.error(f"Razorpay Order creation failed: {e}")

            reg.payment_status = PaymentStatus.PENDING
            self.db.commit()
            self.db.refresh(existing_payment)
            return existing_payment

        # 5. Create new payment record
        payment = Payment(
            event_id=reg.event_id,
            registration_id=reg.registration_id,
            amount=event.fees,
            payment_gateway=data.payment_gateway,
            payment_method=data.payment_method,
            payment_status="pending",
            payment_date=datetime.utcnow()
        )
        self.payment_repo.create(payment)

        # Create Razorpay order if configured
        if data.payment_gateway == "razorpay":
            if getattr(settings, "MOCK_PAYMENT", True):
                import uuid
                payment.transaction_id = f"order_mock_{uuid.uuid4().hex[:12]}"
            else:
                client = self._get_razorpay_client()
                if client:
                    try:
                        order_amount = int(float(event.fees) * 100)
                        order_data = {
                            "amount": order_amount,
                            "currency": "INR",
                            "receipt": f"receipt_{payment.payment_id}",
                        }
                        razorpay_order = client.order.create(data=order_data)
                        payment.transaction_id = razorpay_order["id"]
                    except Exception as e:
                        logger.error(f"Razorpay Order creation failed: {e}")
        
        # 6. Update registration payment status
        reg.payment_status = PaymentStatus.PENDING
        
        self.db.commit()
        self.db.refresh(payment)
        return payment

    async def confirm_payment(self, payment_id: str, data: PaymentConfirm, current_user: User) -> Payment:
        """
        Confirm/complete a payment with signature verification or a transaction ID.
        """
        payment = self.payment_repo.get_by_id(payment_id)
        if not payment:
            raise NotFoundException(f"Payment {payment_id} not found")

        reg = self.reg_repo.get_by_id(payment.registration_id)
        if not reg:
            raise NotFoundException(f"Registration associated with payment not found")

        # Check ownership
        if reg.participant_id != current_user.user_id and current_user.role != UserRole.ADMIN:
            raise ForbiddenException("You do not have permission to confirm this payment")

        if payment.payment_status == "completed":
            return payment

        final_tx_id = data.transaction_id
        client = self._get_razorpay_client()

        # If Razorpay integration is configured and signature verification params are provided
        if getattr(settings, "MOCK_PAYMENT", True):
            # In mock mode, we bypass signature verification and use dummy or provided values
            import uuid
            final_tx_id = data.razorpay_payment_id or data.transaction_id or f"pay_mock_{uuid.uuid4().hex[:12]}"
        elif client and data.razorpay_payment_id and data.razorpay_signature:
            try:
                # Use razorpay_order_id if provided; fallback to payment's saved transaction_id (which holds order_id)
                order_id = data.razorpay_order_id or payment.transaction_id
                
                client.utility.verify_payment_signature({
                    'razorpay_order_id': order_id,
                    'razorpay_payment_id': data.razorpay_payment_id,
                    'razorpay_signature': data.razorpay_signature
                })
                # If signature verification passes, use razorpay_payment_id as final transaction ID
                final_tx_id = data.razorpay_payment_id
            except Exception as e:
                logger.error(f"Razorpay payment verification failed: {e}")
                raise BadRequestException(f"Payment verification failed: {e}")
        elif not final_tx_id:
            # Fallback to razorpay_payment_id if transaction_id is empty but we're in mock mode
            final_tx_id = data.razorpay_payment_id or "tx_manual_confirm"

        # Update payment
        payment.transaction_id = final_tx_id
        payment.payment_status = "completed"
        payment.payment_date = datetime.utcnow()

        # Update registration
        reg.payment_status = PaymentStatus.COMPLETED

        # Create notification
        event = self.event_repo.get_by_id(payment.event_id)
        event_title = event.title if event else "Event"
        notification = Notification(
            user_id=reg.participant_id,
            title="Payment Successful",
            message=f"Your payment of {payment.amount} for '{event_title}' has been successfully completed. Transaction ID: {final_tx_id}",
            notification_type=NotificationType.REGISTRATION
        )
        self.notif_repo.create(notification)

        self.db.commit()
        self.db.refresh(payment)
        return payment

    async def fail_payment(self, payment_id: str, current_user: User) -> Payment:
        """
        Mark a payment as failed.
        """
        payment = self.payment_repo.get_by_id(payment_id)
        if not payment:
            raise NotFoundException(f"Payment {payment_id} not found")

        reg = self.reg_repo.get_by_id(payment.registration_id)
        if not reg:
            raise NotFoundException(f"Registration associated with payment not found")

        if reg.participant_id != current_user.user_id and current_user.role != UserRole.ADMIN:
            raise ForbiddenException("You do not have permission to modify this payment")

        if payment.payment_status == "completed":
            raise BadRequestException("Cannot fail a payment that is already completed")

        payment.payment_status = "failed"
        reg.payment_status = PaymentStatus.FAILED

        self.db.commit()
        self.db.refresh(payment)
        return payment

    async def refund_payment(self, payment_id: str, current_user: User) -> Payment:
        """
        Refund a payment. Only available to organizers of the event or admins.
        """
        payment = self.payment_repo.get_by_id(payment_id)
        if not payment:
            raise NotFoundException(f"Payment {payment_id} not found")

        event = self.event_repo.get_by_id(payment.event_id)
        if not event:
            raise NotFoundException(f"Event associated with payment not found")

        # Check if organizer or admin
        if current_user.role != UserRole.ADMIN and event.organizer_id != current_user.user_id:
            raise ForbiddenException("Only the event organizer or an admin can refund payments")

        if payment.payment_status != "completed":
            raise BadRequestException("Only completed payments can be refunded")

        # Update status
        payment.payment_status = "refunded"
        
        reg = self.reg_repo.get_by_id(payment.registration_id)
        if reg:
            reg.payment_status = PaymentStatus.REFUNDED

        # Notification to the student
        notification = Notification(
            user_id=reg.participant_id,
            title="Refund Processed",
            message=f"A refund of {payment.amount} has been processed for your registration in '{event.title}'.",
            notification_type=NotificationType.REGISTRATION
        )
        self.notif_repo.create(notification)

        self.db.commit()
        self.db.refresh(payment)
        return payment

    def get_payment_by_id(self, payment_id: str, current_user: User) -> Payment:
        """
        Get payment details by ID (with ownership checks).
        """
        payment = self.payment_repo.get_by_id(payment_id)
        if not payment:
            raise NotFoundException(f"Payment {payment_id} not found")

        # Check permissions: user, organizer or admin
        reg = self.reg_repo.get_by_id(payment.registration_id)
        event = self.event_repo.get_by_id(payment.event_id)
        
        is_owner = reg and reg.participant_id == current_user.user_id
        is_organizer = event and event.organizer_id == current_user.user_id
        is_admin = current_user.role == UserRole.ADMIN

        if not (is_owner or is_organizer or is_admin):
            raise ForbiddenException("You do not have access to this payment's details")

        return payment

    def get_my_payments(
        self, current_user: User, page: int = 1, size: int = 10
    ) -> tuple[List[Payment], int]:
        """
        Get paginated list of payments made by the current user.
        """
        skip = (page - 1) * size
        payments = self.payment_repo.get_by_user(current_user.user_id, skip=skip, limit=size)
        total = self.payment_repo.count_by_user(current_user.user_id)
        return payments, total

    def get_event_payments(
        self, event_id: str, current_user: User, page: int = 1, size: int = 100
    ) -> tuple[List[Payment], int]:
        """
        Get paginated list of payments for an event (Organizer/Admin only).
        """
        event = self.event_repo.get_by_id(event_id)
        if not event:
            raise NotFoundException(f"Event {event_id} not found")

        # Check permissions
        if current_user.role != UserRole.ADMIN and event.organizer_id != current_user.user_id:
            raise ForbiddenException("Only the event organizer or an admin can access event payments")

        skip = (page - 1) * size
        payments = self.payment_repo.get_by_event(event_id, skip=skip, limit=size)
        total = self.payment_repo.count_by_event(event_id)
        return payments, total
