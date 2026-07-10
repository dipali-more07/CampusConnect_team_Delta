import asyncio
from app.services.email_service import email_service
from app.core.config import settings

async def main():
    print("---------------------------------------------")
    print("🚀 CampusConnect SMTP Email Service Tester")
    print("---------------------------------------------")
    print(f"MAIL_SERVER:   {settings.MAIL_SERVER}")
    print(f"MAIL_PORT:     {settings.MAIL_PORT}")
    print(f"MAIL_FROM:     {settings.MAIL_FROM}")
    print(f"MAIL_USERNAME: {settings.MAIL_USERNAME}")
    print("---------------------------------------------")
    
    if not settings.MAIL_USERNAME or not settings.MAIL_PASSWORD:
        print("⚠️  Warning: SMTP credentials are not set in your .env file!")
        print("The email service is running in mock mode and will log to console.")
    else:
        print("Connecting to SMTP server and attempting to send test OTP email...")

    # Send test verification OTP to your own email address
    test_email = settings.MAIL_USERNAME if settings.MAIL_USERNAME else "test@example.com"
    success = await email_service.send_verification_otp(
        email=test_email, 
        otp="987654"
    )
    
    if success:
        if not settings.MAIL_USERNAME:
            print("\n📝 [Mock Mode] Success: Email logged to terminal console output.")
        else:
            print(f"\n📧 [Real Mode] Success: Verification OTP sent to {test_email}!")
            print("Please check your inbox (and spam folder) for the test email.")
    else:
        print("\n❌ Error: Failed to send the test email. Please check credentials.")

if __name__ == "__main__":
    asyncio.run(main())
