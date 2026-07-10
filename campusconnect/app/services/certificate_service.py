"""
app/services/certificate_service.py
Certificate generation and management.

HOW CERTIFICATES WORK:
  1. After an event is completed, organizer clicks 'Generate Certificates'
  2. System finds all students who attended
  3. For each student:
     a. Generate unique certificate number (CC-2024-A3B2C1D0)
     b. Create PDF with student name, event name, date
     c. Embed QR code in PDF that links to verification URL
     d. Save PDF to disk
     e. Create Certificate record in DB
     f. Send email notification to student
  4. Student can download their certificate
  5. Anyone can verify a certificate using the certificate number

FRAUD PREVENTION:
  Each certificate has a unique number and QR code.
  The QR links to our verification endpoint.
  If someone fakes a certificate, the number won't exist in our DB.
"""
import io
from datetime import datetime
from typing import List, Optional
from pathlib import Path
from sqlalchemy.orm import Session

from app.repositories.certificate_repository import CertificateRepository
from app.repositories.attendance_repository import AttendanceRepository
from app.repositories.registration_repository import RegistrationRepository
from app.repositories.event_repository import EventRepository
from app.repositories.user_repository import UserRepository, UserProfileRepository
from app.core.exceptions import NotFoundException, BadRequestException, ConflictException
from app.core.constants import AttendanceStatus
from app.core.config import settings
from app.models.certificate import Certificate
from app.models.user import User
from app.utils.helpers import generate_certificate_number
from app.services.qr_service import qr_service
from app.services.email_service import email_service


class CertificateService:
    def __init__(self, db: Session):
        self.db = db
        self.cert_repo = CertificateRepository(db)
        self.attendance_repo = AttendanceRepository(db)
        self.reg_repo = RegistrationRepository(db)
        self.event_repo = EventRepository(db)
        self.user_repo = UserRepository(db)
        self.profile_repo = UserProfileRepository(db)

        # Ensure certificate directory exists
        Path(settings.UPLOAD_DIR, "certificates").mkdir(parents=True, exist_ok=True)

    def _generate_pdf(self, user_name: str, event_title: str, event_date: str, certificate_number: str) -> bytes:
        """
        Generate a certificate PDF using ReportLab.

        The PDF contains:
          - CampusConnect header
          - Student name
          - Event name and date
          - Certificate number
          - QR code for verification
        """
        try:
            from reportlab.lib.pagesizes import A4, landscape
            from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
            from reportlab.lib.units import inch
            from reportlab.lib import colors
            from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Image, Table, TableStyle
            from reportlab.lib.enums import TA_CENTER
        except ImportError:
            # If reportlab is not installed, return a simple placeholder
            return b"PDF generation requires reportlab package"

        buffer = io.BytesIO()
        doc = SimpleDocTemplate(
            buffer,
            pagesize=landscape(A4),
            rightMargin=72, leftMargin=72,
            topMargin=72, bottomMargin=72,
        )

        styles = getSampleStyleSheet()
        elements = []

        # Title
        title_style = ParagraphStyle(
            name="Title",
            fontSize=36,
            textColor=colors.HexColor("#1a237e"),
            alignment=TA_CENTER,
            spaceAfter=20,
            fontName="Helvetica-Bold",
        )
        elements.append(Paragraph("Certificate of Participation", title_style))
        elements.append(Spacer(1, 20))

        # Subtitle
        subtitle_style = ParagraphStyle(
            name="Subtitle",
            fontSize=16,
            textColor=colors.grey,
            alignment=TA_CENTER,
            spaceAfter=30,
        )
        elements.append(Paragraph("This is to certify that", subtitle_style))

        # Student Name
        name_style = ParagraphStyle(
            name="Name",
            fontSize=28,
            textColor=colors.HexColor("#0d47a1"),
            alignment=TA_CENTER,
            spaceAfter=20,
            fontName="Helvetica-Bold",
        )
        elements.append(Paragraph(user_name, name_style))
        elements.append(Spacer(1, 10))

        # Participation text
        body_style = ParagraphStyle(
            name="Body",
            fontSize=14,
            textColor=colors.black,
            alignment=TA_CENTER,
            spaceAfter=10,
        )
        elements.append(Paragraph("has successfully participated in", body_style))
        elements.append(Paragraph(f"<b>{event_title}</b>", name_style))
        elements.append(Paragraph(f"held on {event_date}", body_style))
        elements.append(Spacer(1, 30))

        # Certificate Number
        cert_num_style = ParagraphStyle(
            name="CertNum",
            fontSize=10,
            textColor=colors.grey,
            alignment=TA_CENTER,
        )
        elements.append(Paragraph(f"Certificate No: {certificate_number}", cert_num_style))
        elements.append(Spacer(1, 10))

        # Add QR code for verification
        qr_bytes = qr_service.generate_certificate_qr(certificate_number)
        qr_img = io.BytesIO(qr_bytes)
        qr_image = Image(qr_img, width=1*inch, height=1*inch)
        elements.append(qr_image)

        small_style = ParagraphStyle(
            name="Small",
            fontSize=8,
            textColor=colors.grey,
            alignment=TA_CENTER,
        )
        elements.append(Paragraph("Scan QR to verify this certificate", small_style))

        doc.build(elements)
        return buffer.getvalue()

    async def generate_certificate(
        self, event_id: str, user_id: str
    ) -> Certificate:
        """
        Generate a certificate for one user for one event.

        Validates:
          1. Event exists
          2. User attended the event
          3. Certificate doesn't already exist
        """
        # Check event exists
        event = self.event_repo.get_by_id(event_id)
        if not event:
            raise NotFoundException(f"Event {event_id} not found")

        # Check user attended
        registration = self.reg_repo.get_by_event_and_user(event_id, user_id)
        if not registration:
            raise BadRequestException("User was not registered for this event")

        attendance = self.attendance_repo.get_by_registration_id(registration.registration_id)
        if not attendance or attendance.attendance_status != AttendanceStatus.PRESENT:
            raise BadRequestException("User did not attend this event")

        # Check certificate doesn't already exist
        existing = self.cert_repo.get_by_event_and_user(event_id, user_id)
        if existing:
            raise ConflictException("Certificate already exists for this user and event")

        # Get user info for the certificate
        user = self.user_repo.get_by_id(user_id)
        profile = self.profile_repo.get_by_user_id(user_id)
        user_name = (profile.full_name if profile and profile.full_name else user.email) if user else "Participant"

        # Generate certificate number
        cert_number = generate_certificate_number()

        # Generate PDF
        pdf_bytes = self._generate_pdf(
            user_name=user_name,
            event_title=event.title,
            event_date=event.start_datetime.strftime("%B %d, %Y"),
            certificate_number=cert_number,
        )

        # Save PDF
        pdf_path = str(Path(settings.UPLOAD_DIR) / "certificates" / f"{cert_number}.pdf")
        with open(pdf_path, "wb") as f:
            f.write(pdf_bytes)

        # Save Certificate record
        certificate = Certificate(
            event_id=event_id,
            user_id=user_id,
            certificate_number=cert_number,
            pdf_path=pdf_path,
        )
        self.cert_repo.create(certificate)
        self.db.commit()
        self.db.refresh(certificate)

        # Notify user
        await email_service.send_certificate_notification(
            user.email if user else "",
            event.title,
            cert_number,
        )

        return certificate

    async def generate_bulk_certificates(self, event_id: str) -> List[Certificate]:
        """Generate certificates for ALL attendees of an event at once."""
        event = self.event_repo.get_by_id(event_id)
        if not event:
            raise NotFoundException(f"Event {event_id} not found")

        # Get all attendees
        attendances = self.attendance_repo.get_by_event(event_id, skip=0, limit=10000)

        generated = []
        for attendance in attendances:
            if attendance.attendance_status == AttendanceStatus.PRESENT:
                registration = self.reg_repo.get_by_id(attendance.registration_id)
                if registration:
                    try:
                        cert = await self.generate_certificate(event_id, registration.user_id)
                        generated.append(cert)
                    except ConflictException:
                        # Skip if certificate already exists
                        pass

        return generated

    def verify_certificate(self, certificate_number: str) -> Optional[Certificate]:
        """Verify a certificate by its number."""
        return self.cert_repo.get_by_certificate_number(certificate_number)

    def get_user_certificates(
        self, user_id: str, page: int = 1, size: int = 10
    ) -> tuple[List[Certificate], int]:
        skip = (page - 1) * size
        certs = self.cert_repo.get_by_user(user_id, skip=skip, limit=size)
        total = self.cert_repo.count_by_user(user_id)
        return certs, total
