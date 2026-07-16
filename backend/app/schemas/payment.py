"""
app/schemas/payment.py
Payment Pydantic schemas.
"""
from pydantic import BaseModel, Field
from datetime import datetime
from typing import Optional


class PaymentCreate(BaseModel):
    registration_id: str = Field(..., description="The ID of the registration to pay for")
    payment_gateway: Optional[str] = Field("razorpay", description="Payment gateway used (e.g. razorpay, stripe)")
    payment_method: Optional[str] = Field("upi", description="Payment method used (e.g. upi, card, netbanking)")


class PaymentConfirm(BaseModel):
    transaction_id: Optional[str] = Field(None, description="Transaction ID from the payment gateway (fallback)")
    razorpay_payment_id: Optional[str] = Field(None, description="Razorpay payment transaction ID")
    razorpay_order_id: Optional[str] = Field(None, description="Razorpay order ID")
    razorpay_signature: Optional[str] = Field(None, description="Razorpay payment signature")


class PaymentResponse(BaseModel):
    payment_id: str
    event_id: str
    registration_id: str
    amount: float
    payment_gateway: Optional[str] = None
    payment_method: Optional[str] = None
    transaction_id: Optional[str] = None
    payment_status: str
    payment_date: datetime

    model_config = {"from_attributes": True}
