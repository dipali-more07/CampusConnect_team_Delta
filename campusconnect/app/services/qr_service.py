"""
app/services/qr_service.py
===========================
QR code generation and storage service.

HOW QR CODES WORK IN THIS SYSTEM:

  1. When an event is published, the organizer generates a QR code for the event.
     This QR code contains the event_id.

  2. When a student registers, they get a personal QR code containing their registration_id.

  3. At the event:
     - The organizer opens a scanner
     - Student shows their QR code
     - Scanner reads the registration_id
     - System marks attendance

SECURITY:
  QR codes are not secret by themselves. Security comes from:
  - Validating that registration exists in DB
  - Checking that registration is confirmed (not cancelled)
  - Preventing duplicate scans (each registration can only be scanned once)
"""
import io
import os
import uuid
from pathlib import Path
import qrcode
from qrcode.image.pure import PyPNGImage
from typing import Optional

from app.core.config import settings


class QRService:
    """Generates and manages QR codes for events and registrations."""

    def __init__(self):
        self.qr_dir = Path(settings.UPLOAD_DIR) / "qrcodes"
        self.qr_dir.mkdir(parents=True, exist_ok=True)

    def _create_qr_code(self, data: str) -> bytes:
        """
        Create a QR code image from data string.

        The QR code stores the data as text. When scanned,
        the scanner app reads this text and sends it to our API.

        Returns: PNG image as bytes
        """
        qr = qrcode.QRCode(
            version=1,                              # Controls size (1-40)
            error_correction=qrcode.constants.ERROR_CORRECT_M,  # Can recover 15% of damaged data
            box_size=10,                            # Pixels per box
            border=4,                               # White border boxes
        )
        qr.add_data(data)
        qr.make(fit=True)  # Auto-size the QR code

        # Create the image
        img = qr.make_image(fill_color="black", back_color="white")
        img_bytes = io.BytesIO()
        img.save(img_bytes, format="PNG")
        return img_bytes.getvalue()

    def generate_event_qr(self, event_id: str) -> str:
        """
        Generate a QR code for an event.

        The QR contains: event verification URL
        When scanned: opens the event page

        Returns: File path where QR image is saved
        """
        # The data embedded in the QR code
        qr_data = f"{settings.APP_URL}/api/v1/events/{event_id}/verify"
        qr_bytes = self._create_qr_code(qr_data)

        # Save to file
        filename = f"event_{event_id}.png"
        file_path = str(self.qr_dir / filename)
        with open(file_path, "wb") as f:
            f.write(qr_bytes)

        return file_path

    def generate_registration_qr(self, registration_id: str) -> bytes:
        """
        Generate a QR code for a student's event registration.

        The QR contains: registration_id
        When scanned: organizer app sends this ID to check-in endpoint

        Returns: QR code as bytes (saved in the certificate PDF, not as file)
        """
        # The data embedded in the QR - just the registration ID
        # Organizer app reads this and calls: POST /attendance/check-in with this ID
        qr_data = registration_id
        return self._create_qr_code(qr_data)

    def generate_certificate_qr(self, certificate_number: str) -> bytes:
        """
        Generate a QR code embedded inside a certificate PDF.

        The QR contains: certificate verification URL
        When scanned: opens verification page showing if cert is real

        Returns: QR code as bytes to embed in PDF
        """
        verification_url = f"{settings.APP_URL}/verify-certificate/{certificate_number}"
        return self._create_qr_code(verification_url)

    def delete_qr(self, file_path: str) -> None:
        """Delete a QR code file."""
        if file_path and os.path.exists(file_path):
            os.remove(file_path)


# Single instance
qr_service = QRService()
