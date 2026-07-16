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

    def _generate_pdf(self, user_name: str, event_title: str, event_date: str, certificate_number: str, certificate_title: str = "Certificate of Participation") -> bytes:
        """
        Generate a certificate PDF using ReportLab.

        The PDF contains:
          - Organisation name and customized title
          - Student name
          - Event name and date
          - Certificate number & verification QR code
          - Custom signatures table
        """
        try:
            from reportlab.lib.pagesizes import A4, landscape
            from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
            from reportlab.lib.units import inch
            from reportlab.lib import colors
            from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Image, Table, TableStyle
            from reportlab.lib.enums import TA_CENTER
        except ImportError:
            return b"PDF generation requires reportlab package"

        # Load active template from configuration JSON
        import json
        import os
        template = {}
        if os.path.exists("uploads/certificate_templates.json"):
            try:
                with open("uploads/certificate_templates.json", "r") as f:
                    templates = json.load(f)
                    template = next((t for t in templates if t.get("is_active")), {})
            except Exception:
                pass

        org_name = template.get("organisation_name", "STATE UNIVERSITY").upper()
        font_color = template.get("font_color", "#1a237e")
        accent_color = template.get("accent_color", "#6366f1")
        title_font_size = template.get("title_font_size", 36)
        body_font_size = template.get("body_font_size", 14)
        show_logo = template.get("show_logo", True)
        show_signatures = template.get("show_signatures", True)

        buffer = io.BytesIO()
        doc = SimpleDocTemplate(
            buffer,
            pagesize=landscape(A4),
            rightMargin=72, leftMargin=72,
            topMargin=72, bottomMargin=72,
        )

        styles = getSampleStyleSheet()
        elements = []

        # Organisation style
        org_style = ParagraphStyle(
            name="OrgName",
            fontSize=12,
            textColor=colors.HexColor(accent_color),
            alignment=TA_CENTER,
            spaceAfter=15,
            fontName="Helvetica-Bold",
        )
        
        # Add logo indicator & Organisation name
        if show_logo:
            elements.append(Paragraph(f"🎓  {org_name}  🎓", org_style))
        else:
            elements.append(Paragraph(org_name, org_style))
        elements.append(Spacer(1, 10))

        # Title style
        title_style = ParagraphStyle(
            name="Title",
            fontSize=title_font_size,
            textColor=colors.HexColor(font_color),
            alignment=TA_CENTER,
            spaceAfter=15,
            fontName="Helvetica-Bold",
        )
        
        # Determine the final certificate title heading
        final_title = certificate_title
        if certificate_title == "Certificate of Participation" and template.get("certificate_title"):
            final_title = template.get("certificate_title")

        elements.append(Paragraph(final_title, title_style))
        elements.append(Spacer(1, 15))

        # Subtitle
        subtitle_style = ParagraphStyle(
            name="Subtitle",
            fontSize=16,
            textColor=colors.grey,
            alignment=TA_CENTER,
            spaceAfter=25,
        )
        elements.append(Paragraph("This is to certify that", subtitle_style))

        # Student Name
        name_style = ParagraphStyle(
            name="Name",
            fontSize=28,
            textColor=colors.HexColor(font_color),
            alignment=TA_CENTER,
            spaceAfter=15,
            fontName="Helvetica-Bold",
        )
        elements.append(Paragraph(user_name, name_style))
        elements.append(Spacer(1, 10))

        # Participation text
        body_style = ParagraphStyle(
            name="Body",
            fontSize=body_font_size,
            textColor=colors.black,
            alignment=TA_CENTER,
            spaceAfter=10,
        )
        elements.append(Paragraph("has successfully participated in", body_style))
        elements.append(Paragraph(f"<b>{event_title}</b>", name_style))
        elements.append(Paragraph(f"held on {event_date}", body_style))
        elements.append(Spacer(1, 20))

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

        # Add signatures table at the bottom if enabled
        if show_signatures:
            elements.append(Spacer(1, 20))
            sig_data = [
                [
                    Paragraph("___________________<br/><b>Event Organizer</b>", body_style),
                    Paragraph("___________________<br/><b>Principal / Dean</b>", body_style)
                ]
            ]
            sig_table = Table(sig_data, colWidths=[3*inch, 3*inch])
            sig_table.setStyle(TableStyle([
                ('ALIGN', (0,0), (-1,-1), 'CENTER'),
                ('VALIGN', (0,0), (-1,-1), 'MIDDLE'),
            ]))
            elements.append(sig_table)

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

        # Determine the student's rank from Results (individual or team)
        from app.models.result import Result
        from sqlalchemy import select

        result = self.db.execute(
            select(Result).where(
                Result.event_id == event_id,
                Result.participant_id == user_id
            )
        ).scalar_one_or_none()

        if not result and registration.team_id:
            result = self.db.execute(
                select(Result).where(
                    Result.event_id == event_id,
                    Result.team_id == registration.team_id
                )
            ).scalar_one_or_none()

        cert_title = "Certificate of Participation"
        cert_type = "participation"

        if result and result.rank:
            if result.rank == 1:
                cert_title = "Certificate of Winner (1st Place)"
                cert_type = "winner_1st"
            elif result.rank == 2:
                cert_title = "Certificate of Runner-Up (2nd Place)"
                cert_type = "runner_up_2nd"
            elif result.rank == 3:
                cert_title = "Certificate of Second Runner-Up (3rd Place)"
                cert_type = "runner_up_3rd"
            else:
                cert_title = f"Certificate of Merit (Rank {result.rank})"
                cert_type = f"merit_{result.rank}"

        # Generate certificate number
        cert_number = generate_certificate_number()

        # Generate PDF with customized title
        pdf_bytes = self._generate_pdf(
            user_name=user_name,
            event_title=event.title,
            event_date=event.start_datetime.strftime("%B %d, %Y"),
            certificate_number=cert_number,
            certificate_title=cert_title,
        )

        # Save PDF
        pdf_path = str(Path(settings.UPLOAD_DIR) / "certificates" / f"{cert_number}.pdf")
        with open(pdf_path, "wb") as f:
            f.write(pdf_bytes)

        # Save Certificate record (including its rank/participation type)
        certificate = Certificate(
            event_id=event_id,
            user_id=user_id,
            registration_id=registration.registration_id,  # Set foreign key
            certificate_number=cert_number,
            pdf_path=pdf_path,
            certificate_type=cert_type,
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
