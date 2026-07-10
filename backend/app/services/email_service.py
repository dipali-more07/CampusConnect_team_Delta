"""
app/services/email_service.py
==============================
Email sending service using fastapi-mail.

FALLBACK PATTERN:
  If settings.MAIL_USERNAME or settings.MAIL_PASSWORD is not configured,
  the service falls back to console logging to facilitate local development.
"""
import logging
from typing import Optional, List
# pyrefly: ignore [missing-import]
from fastapi_mail import ConnectionConfig, FastMail, MessageSchema, MessageType
from app.core.config import settings

logger = logging.getLogger(__name__)

# Connection Configuration for fastapi-mail
# fastapi-mail parses configurations automatically.
# We build this configuration globally.
mail_config = ConnectionConfig(
    MAIL_USERNAME=settings.MAIL_USERNAME,
    MAIL_PASSWORD=settings.MAIL_PASSWORD,
    MAIL_FROM=settings.MAIL_FROM,
    MAIL_PORT=settings.MAIL_PORT,
    MAIL_SERVER=settings.MAIL_SERVER,
    MAIL_STARTTLS=settings.MAIL_STARTTLS,
    MAIL_SSL_TLS=settings.MAIL_SSL_TLS,
    USE_CREDENTIALS=True,
    VALIDATE_CERTS=True,
)


class EmailService:
    """
    Handles all email sending in the application.
    Integrates with fastapi-mail for real SMTP sending when configured.
    """

    def _should_mock(self) -> bool:
        """
        Check if SMTP credentials are missing, indicating we should mock sending.
        """
        return not settings.MAIL_USERNAME or not settings.MAIL_PASSWORD

    async def _send(self, email: str, subject: str, body: str) -> bool:
        """
        Helper method to dispatch emails or fallback to logging.
        """
        if self._should_mock():
            logger.info(
                f"[MOCK EMAIL] To: {email}\n"
                f"Subject: {subject}\n"
                f"Body: {body}\n"
                f"--- Mock email end ---"
            )
            return True

        try:
            message = MessageSchema(
                subject=subject,
                recipients=[email],
                body=body,
                subtype=MessageType.plain,
            )
            fm = FastMail(mail_config)
            await fm.send_message(message)
            logger.info(f"✅  email successfully sent to {email} with subject: '{subject}'")
            return True
        except Exception as e:
            logger.error(f"❌ Failed to send email to {email} (Subject: '{subject}'): {e}", exc_info=True)
            # Return False but don't crash the server request
            return False

    async def send_verification_email(self, email: str, token: str) -> bool:
        """
        Send email verification link to newly registered user.
        Link format: /auth/verify-email?token=<token>
        """
        verification_url = f"{settings.APP_URL}/api/v1/auth/verify-email?token={token}"
        subject = "Verify your CampusConnect account"
        body = (
            f"Welcome to CampusConnect!\n\n"
            f"Please verify your account by clicking the link below:\n"
            f"{verification_url}\n\n"
            f"If you did not sign up for this account, you can ignore this email."
        )
        return await self._send(email, subject, body)

    async def send_verification_otp(self, email: str, otp: str) -> bool:
        """
        Send a 6-digit OTP verification code to the user.
        """
        subject = "Verify your CampusConnect account"
        body = (
            f"Welcome to CampusConnect!\n\n"
            f"Your verification code is: {otp}\n\n"
            f"Please enter this code on the application to verify your email.\n"
            f"If you did not sign up for this account, you can safely ignore this email."
        )
        return await self._send(email, subject, body)

    async def send_password_reset_email(self, email: str, token: str) -> bool:
        """
        Send password reset link to user's email.
        Link format: /reset-password?token=<token>
        """
        reset_url = f"{settings.APP_URL}/reset-password?token={token}"
        subject = "Reset your CampusConnect password"
        body = (
            f"You requested to reset your password for your CampusConnect account.\n\n"
            f"Please click the link below to set a new password:\n"
            f"{reset_url}\n\n"
            f"This link will expire in 1 hour.\n"
            f"If you did not request a password reset, you can safely ignore this email."
        )
        return await self._send(email, subject, body)

    async def send_registration_confirmation(
        self, email: str, event_title: str, event_date: str
    ) -> bool:
        """Send event registration confirmation email."""
        subject = f"Registration confirmed for {event_title}"
        body = (
            f"Congratulations!\n\n"
            f"Your registration for the event '{event_title}' has been successfully confirmed.\n"
            f"Event Date: {event_date}\n\n"
            f"We look forward to seeing you there!"
        )
        return await self._send(email, subject, body)

    async def send_certificate_notification(
        self, email: str, event_title: str, certificate_number: str
    ) -> bool:
        """Notify user that their certificate is ready."""
        subject = f"Your certificate for {event_title} is ready"
        body = (
            f"Great news!\n\n"
            f"Your participation certificate for the event '{event_title}' has been generated.\n"
            f"Certificate Number: {certificate_number}\n\n"
            f"You can view and download your certificate from your profile on CampusConnect."
        )
        return await self._send(email, subject, body)


# Single instance used across the app (singleton)
email_service = EmailService()
