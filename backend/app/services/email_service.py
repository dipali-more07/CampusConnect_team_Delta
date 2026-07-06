"""
app/services/email_service.py
==============================
Email sending service.

WHY ABSTRACT EMAIL:
  If we hardcode 'send email via Gmail SMTP' everywhere, switching
  to SendGrid later means changing 100 files.
  By having one EmailService class, we only change ONE file.

IN DEVELOPMENT:
  We just log emails to console (no actual emails sent).
  This prevents spam during development/testing.
"""
import logging
from typing import Optional
from app.core.config import settings

logger = logging.getLogger(__name__)


class EmailService:
    """
    Handles all email sending in the application.
    Currently logs to console. In production, configure SMTP/SendGrid.
    """

    async def send_verification_email(self, email: str, token: str) -> bool:
        """
        Send email verification link to newly registered user.
        Link format: /auth/verify-email?token=<token>
        """
        verification_url = f"{settings.APP_URL}/api/v1/auth/verify-email?token={token}"
        logger.info(
            f"[EMAIL] Verification email to {email}\n"
            f"Subject: Verify your CampusConnect account\n"
            f"Link: {verification_url}"
        )
        # TODO in production: Use fastapi-mail or SMTP to send actual email
        # For now, log to console for development
        return True

    async def send_password_reset_email(self, email: str, token: str) -> bool:
        """
        Send password reset link to user's email.
        Link format: /reset-password?token=<token>
        """
        reset_url = f"{settings.APP_URL}/reset-password?token={token}"
        logger.info(
            f"[EMAIL] Password reset email to {email}\n"
            f"Subject: Reset your CampusConnect password\n"
            f"Link: {reset_url}\n"
            f"This link expires in 1 hour."
        )
        return True

    async def send_registration_confirmation(
        self, email: str, event_title: str, event_date: str
    ) -> bool:
        """Send event registration confirmation email."""
        logger.info(
            f"[EMAIL] Registration confirmation to {email}\n"
            f"Subject: Registration confirmed for {event_title}\n"
            f"Event Date: {event_date}"
        )
        return True

    async def send_certificate_notification(
        self, email: str, event_title: str, certificate_number: str
    ) -> bool:
        """Notify user that their certificate is ready."""
        logger.info(
            f"[EMAIL] Certificate notification to {email}\n"
            f"Subject: Your certificate for {event_title} is ready\n"
            f"Certificate Number: {certificate_number}"
        )
        return True


# Single instance used across the app (singleton)
email_service = EmailService()
