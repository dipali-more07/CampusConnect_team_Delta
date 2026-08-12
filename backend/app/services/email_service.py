"""
app/services/email_service.py
==============================
Email sending service using fastapi-mail.

FALLBACK PATTERN:
  If settings.MAIL_USERNAME or settings.MAIL_PASSWORD is not configured,
  the service falls back to console logging to facilitate local development.
"""
import logging
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from typing import Optional, List
from app.core.config import settings

logger = logging.getLogger(__name__)

try:
    from fastapi_mail import ConnectionConfig, FastMail, MessageSchema, MessageType
    HAS_FASTAPI_MAIL = True
    mail_config = ConnectionConfig(
        MAIL_USERNAME=settings.MAIL_USERNAME,
        MAIL_PASSWORD=settings.MAIL_PASSWORD,
        MAIL_FROM=settings.MAIL_FROM,
        MAIL_PORT=settings.MAIL_PORT,
        MAIL_SERVER=settings.MAIL_SERVER,
        MAIL_STARTTLS=settings.MAIL_STARTTLS,
        MAIL_SSL_TLS=settings.MAIL_SSL_TLS,
        USE_CREDENTIALS=bool(settings.MAIL_USERNAME and settings.MAIL_PASSWORD),
        VALIDATE_CERTS=True,
    )
except ImportError:
    HAS_FASTAPI_MAIL = False
    mail_config = None


class EmailService:
    """
    Handles all email sending in the application.
    Integrates with fastapi-mail for real SMTP sending when configured.
    """

def build_email_template(
    title: str,
    subtitle: str,
    content_html: str,
    cta_text: Optional[str] = None,
    cta_url: Optional[str] = None,
    code_box: Optional[str] = None,
    footer_text: Optional[str] = None
) -> str:
    """
    Generate a stunning, premium HTML email template with modern typography,
    gradient accents, glassmorphic styling, and clean call-to-action buttons.
    """
    button_html = ""
    if cta_text and cta_url:
        button_html = f"""
        <div style="text-align: center; margin: 32px 0;">
            <a href="{cta_url}" target="_blank" style="background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 50%, #d946ef 100%); color: #ffffff; text-decoration: none; font-size: 16px; font-weight: 700; padding: 16px 36px; border-radius: 12px; display: inline-block; box-shadow: 0 10px 25px rgba(99, 102, 241, 0.35); letter-spacing: 0.5px;">
                {cta_text} &rarr;
            </a>
        </div>
        """

    code_box_html = ""
    if code_box:
        code_box_html = f"""
        <div style="background: #f8fafc; border: 2px dashed #cbd5e1; border-radius: 12px; padding: 20px; text-align: center; margin: 24px 0;">
            <span style="font-size: 12px; color: #64748b; text-transform: uppercase; letter-spacing: 1.5px; font-weight: 700; display: block; margin-bottom: 8px;">VERIFICATION / RESET CODE</span>
            <code style="font-size: 28px; font-weight: 800; color: #4f46e5; letter-spacing: 4px; font-family: 'Courier New', monospace;">{code_box}</code>
        </div>
        """

    footer_str = footer_text or "If you did not request this email, please ignore it or contact platform support."

    return f"""<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>{title}</title>
</head>
<body style="margin: 0; padding: 0; background-color: #f1f5f9; font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; -webkit-font-smoothing: antialiased;">
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color: #f1f5f9; padding: 40px 16px;">
        <tr>
            <td align="center">
                <table role="presentation" width="100%" style="max-width: 600px; background-color: #ffffff; border-radius: 20px; overflow: hidden; box-shadow: 0 20px 40px rgba(15, 23, 42, 0.08); border: 1px solid #e2e8f0;">
                    <!-- HEADER GRADIENT -->
                    <tr>
                        <td style="background: linear-gradient(135deg, #0f172a 0%, #1e1b4b 50%, #312e81 100%); padding: 36px 32px; text-align: center;">
                            <div style="display: inline-block; background: rgba(255, 255, 255, 0.1); backdrop-filter: blur(10px); padding: 8px 18px; border-radius: 30px; border: 1px solid rgba(255, 255, 255, 0.2); margin-bottom: 12px;">
                                <span style="color: #818cf8; font-size: 18px; vertical-align: middle;">✦</span>
                                <span style="color: #ffffff; font-weight: 800; font-size: 16px; letter-spacing: 1px; vertical-align: middle; margin-left: 6px;">CampusConnect</span>
                            </div>
                            <h1 style="color: #ffffff; font-size: 24px; font-weight: 800; margin: 12px 0 6px 0; letter-spacing: -0.5px;">{title}</h1>
                            <p style="color: #94a3b8; font-size: 14px; margin: 0; font-weight: 500;">{subtitle}</p>
                        </td>
                    </tr>
                    
                    <!-- BODY CONTENT -->
                    <tr>
                        <td style="padding: 36px 32px; background-color: #ffffff;">
                            <div style="font-size: 15px; line-height: 1.7; color: #334155;">
                                {content_html}
                            </div>
                            
                            {code_box_html}
                            {button_html}
                            
                            <hr style="border: 0; border-top: 1px solid #f1f5f9; margin: 32px 0 24px 0;">
                            
                            <p style="font-size: 13px; color: #64748b; line-height: 1.5; margin: 0;">
                                💡 <strong>Tip:</strong> {footer_str}
                            </p>
                        </td>
                    </tr>
                    
                    <!-- FOOTER -->
                    <tr>
                        <td style="background-color: #f8fafc; padding: 24px 32px; text-align: center; border-top: 1px solid #f1f5f9;">
                            <p style="font-size: 12px; color: #94a3b8; margin: 0 0 6px 0;">CampusConnect • Academic & Event Operations Platform</p>
                            <p style="font-size: 11px; color: #cbd5e1; margin: 0;">© 2026 CampusConnect. All rights reserved.</p>
                        </td>
                    </tr>
                </table>
            </td>
        </tr>
    </table>
</body>
</html>"""


class EmailService:
    """
    Handles all email sending in the application.
    Integrates with fastapi-mail for real SMTP sending when configured.
    """

    def _should_mock(self) -> bool:
        """
        Check if SMTP credentials are missing or if MOCK_EMAIL is configured to True.
        """
        return settings.MOCK_EMAIL or not settings.MAIL_USERNAME or not settings.MAIL_PASSWORD

    async def _send(self, email: str, subject: str, body: str, html_body: Optional[str] = None) -> bool:
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

        if HAS_FASTAPI_MAIL and mail_config:
            try:
                message = MessageSchema(
                    subject=subject,
                    recipients=[email],
                    body=html_body or body,
                    subtype=MessageType.html if html_body else MessageType.plain,
                )
                fm = FastMail(mail_config)
                await fm.send_message(message)
                logger.info(f"✅ Email successfully sent to {email} with subject: '{subject}'")
                return True
            except Exception as e:
                logger.warning(f"fastapi_mail failed, attempting standard smtplib fallback: {e}")

        # Standard Library smtplib fallback (Built-in Python)
        try:
            msg = MIMEMultipart("alternative")
            msg["Subject"] = subject
            msg["From"] = settings.MAIL_FROM or settings.MAIL_USERNAME
            msg["To"] = email

            msg.attach(MIMEText(body, "plain"))
            if html_body:
                msg.attach(MIMEText(html_body, "html"))

            server_host = settings.MAIL_SERVER or "smtp.gmail.com"
            server_port = settings.MAIL_PORT or 587

            if settings.MAIL_SSL_TLS:
                with smtplib.SMTP_SSL(server_host, server_port, timeout=10) as server:
                    if settings.MAIL_USERNAME and settings.MAIL_PASSWORD:
                        server.login(settings.MAIL_USERNAME, settings.MAIL_PASSWORD)
                    server.sendmail(msg["From"], [email], msg.as_string())
            else:
                with smtplib.SMTP(server_host, server_port, timeout=10) as server:
                    if settings.MAIL_STARTTLS:
                        server.starttls()
                    if settings.MAIL_USERNAME and settings.MAIL_PASSWORD:
                        server.login(settings.MAIL_USERNAME, settings.MAIL_PASSWORD)
                    server.sendmail(msg["From"], [email], msg.as_string())

            logger.info(f"✅ Email successfully sent via smtplib to {email} with subject: '{subject}'")
            return True
        except Exception as e:
            logger.error(f"❌ Failed to send email to {email} (Subject: '{subject}'): {e}", exc_info=True)
            return False

    async def send_verification_email(self, email: str, token: str) -> bool:
        """
        Send email verification link to newly registered user.
        """
        verification_url = f"{settings.APP_URL}/api/v1/auth/verify-email?token={token}"
        subject = "✨ Verify your CampusConnect account"
        content_html = """
        <p style="font-size: 16px; font-weight: 600; color: #0f172a; margin-top: 0;">Welcome to CampusConnect!</p>
        <p>We are thrilled to have you join our academic & event platform. Please verify your email address to unlock full access to events, hackathons, and certifications.</p>
        """
        html_body = build_email_template(
            title="Verify Your Account",
            subtitle="CampusConnect Registration",
            content_html=content_html,
            cta_text="Verify Email Address",
            cta_url=verification_url,
            footer_text=f"Direct link: <a href='{verification_url}' style='color: #6366f1;'>{verification_url}</a>"
        )
        return await self._send(email, subject, verification_url, html_body=html_body)

    async def send_verification_otp(self, email: str, otp: str) -> bool:
        """
        Send a 6-digit OTP verification code to the user.
        """
        subject = "🔑 Your CampusConnect Verification Code"
        content_html = """
        <p style="font-size: 16px; font-weight: 600; color: #0f172a; margin-top: 0;">Welcome to CampusConnect!</p>
        <p>Use the 6-digit verification code below to verify your email address and activate your account.</p>
        """
        html_body = build_email_template(
            title="Email Verification Code",
            subtitle="CampusConnect Authentication",
            content_html=content_html,
            code_box=otp,
            footer_text="This verification code will expire shortly. Do not share it with anyone."
        )
        plain_body = f"Welcome to CampusConnect!\nYour verification code is: {otp}"
        return await self._send(email, subject, plain_body, html_body=html_body)

    async def send_password_reset_email(self, email: str, token: str, base_url: Optional[str] = None) -> bool:
        """
        Send password reset link to user's email.
        Ensures HTTPS for live server domains and protects against URL/Host injection.
        """
        from app.utils.validators import validate_and_sanitize_frontend_url

        app_url = validate_and_sanitize_frontend_url(base_url or settings.APP_URL)

        reset_url = f"{app_url}/reset-password?token={token}"

        subject = "🔐 Reset your CampusConnect password"
        content_html = f"""
        <p style="font-size: 16px; font-weight: 600; color: #0f172a; margin-top: 0;">Hello,</p>
        <p>We received a request to reset the password for your <strong>CampusConnect</strong> account associated with <code>{email}</code>.</p>
        <p>Click the button below to set a new password. This link is valid for <strong>1 hour</strong>.</p>
        """
        html_body = build_email_template(
            title="Reset Your Password",
            subtitle="CampusConnect Security Center",
            content_html=content_html,
            cta_text="Reset Password",
            cta_url=reset_url,
            code_box=token,
            footer_text=f"If the button above does not open, copy and paste this link into your browser:<br><a href='{reset_url}' style='color: #6366f1; word-break: break-all;'>{reset_url}</a>"
        )
        plain_body = (
            f"You requested to reset your password for your CampusConnect account.\n\n"
            f"Please click the link below to set a new password:\n"
            f"{reset_url}\n\n"
            f"Token: {token}\n"
            f"This link will expire in 1 hour."
        )
        return await self._send(email, subject, plain_body, html_body=html_body)

    async def send_registration_confirmation(
        self, email: str, event_title: str, event_date: str
    ) -> bool:
        """Send event registration confirmation email."""
        subject = f"🎉 Registration Confirmed: {event_title}"
        content_html = f"""
        <p style="font-size: 16px; font-weight: 600; color: #0f172a; margin-top: 0;">Great news!</p>
        <p>Your registration for <strong>{event_title}</strong> has been successfully confirmed.</p>
        <div style="background: #f8fafc; border-left: 4px solid #6366f1; padding: 16px; margin: 20px 0; border-radius: 6px;">
            <p style="margin: 0; font-size: 14px; color: #475569;"><strong>Event:</strong> {event_title}</p>
            <p style="margin: 6px 0 0 0; font-size: 14px; color: #475569;"><strong>Date & Time:</strong> {event_date}</p>
        </div>
        <p>Get ready to participate and show your skills!</p>
        """
        html_body = build_email_template(
            title="Registration Confirmed!",
            subtitle="CampusConnect Event Desk",
            content_html=content_html,
            footer_text="View your registered events and pass on your CampusConnect dashboard."
        )
        plain_body = f"Registration confirmed for {event_title}\nDate: {event_date}"
        return await self._send(email, subject, plain_body, html_body=html_body)

    async def send_certificate_notification(
        self, email: str, event_title: str, certificate_number: str
    ) -> bool:
        """Notify user that their certificate is ready."""
        subject = f"🏆 Certificate Ready: {event_title}"
        content_html = f"""
        <p style="font-size: 16px; font-weight: 600; color: #0f172a; margin-top: 0;">Congratulations!</p>
        <p>Your official participation certificate for <strong>{event_title}</strong> is now ready for download.</p>
        <div style="background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 12px; padding: 20px; text-align: center; margin: 20px 0;">
            <span style="font-size: 12px; color: #166534; font-weight: 700; text-transform: uppercase; letter-spacing: 1px;">CERTIFICATE ID</span>
            <code style="font-size: 22px; font-weight: 800; color: #15803d; display: block; margin-top: 6px;">{certificate_number}</code>
        </div>
        <p>You can view and download your verified PDF certificate directly from your CampusConnect profile.</p>
        """
        html_body = build_email_template(
            title="Certificate Issued!",
            subtitle="CampusConnect Certifications",
            content_html=content_html,
            footer_text="Your certificate includes a unique verification code for credential validation."
        )
        plain_body = f"Your certificate for {event_title} is ready. Number: {certificate_number}"
        return await self._send(email, subject, plain_body, html_body=html_body)

    async def send_account_suspension_email(self, email: str, user_name: Optional[str] = None) -> bool:
        """Send email notification when an account is suspended/deactivated."""
        name_str = f"Dear {user_name}," if user_name else "Hello,"
        subject = "⚠️ Account Notice - CampusConnect"
        content_html = f"""
        <p style="font-size: 16px; font-weight: 600; color: #0f172a; margin-top: 0;">{name_str}</p>
        <p>Your CampusConnect account (<code>{email}</code>) has been deactivated by a platform administrator.</p>
        <p>If you believe this was done in error or require support, please contact your institution administrator.</p>
        """
        html_body = build_email_template(
            title="Account Suspended",
            subtitle="CampusConnect Administration",
            content_html=content_html,
            footer_text="Your account history remains preserved. Contact support for assistance."
        )
        plain_body = f"{name_str}\nYour account ({email}) has been suspended."
        return await self._send(email, subject, plain_body, html_body=html_body)

    async def send_account_activation_email(self, email: str, user_name: Optional[str] = None) -> bool:
        """Send email notification when an account is reactivated."""
        name_str = f"Dear {user_name}," if user_name else "Hello,"
        subject = "✅ Account Reactivated - CampusConnect"
        content_html = f"""
        <p style="font-size: 16px; font-weight: 600; color: #0f172a; margin-top: 0;">{name_str}</p>
        <p>Good news! Your CampusConnect account (<code>{email}</code>) has been reactivated.</p>
        <p>You can now log in and access all platform features, events, and certificates again.</p>
        """
        html_body = build_email_template(
            title="Welcome Back!",
            subtitle="CampusConnect Account Status",
            content_html=content_html,
            footer_text="You can now sign in using your existing credentials."
        )
        plain_body = f"{name_str}\nYour account ({email}) has been reactivated."
        return await self._send(email, subject, plain_body, html_body=html_body)


# Single instance used across the app (singleton)
email_service = EmailService()
