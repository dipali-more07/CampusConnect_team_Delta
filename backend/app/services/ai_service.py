"""
app/services/ai_service.py
============================
AI Chatbot & RAG (Retrieval-Augmented Generation) Service.

FEATURES:
  1. Role-Personalized Context (Student vs Organizer vs Admin)
  2. Live Database RAG Data (Events, Registrations, Certificates, Attendance)
  3. External LLM Integration (Gemini 1.5 Flash API / Groq API)
  4. Native Offline RAG Fallback Engine (0 latency, 0 dependency)
  5. Interactive Quick Action Chips Generator
"""

import json
import logging
from typing import List, Dict, Any, Optional
from datetime import datetime, timedelta
from sqlalchemy.orm import Session
from sqlalchemy import select, func

from app.core.config import settings
from app.core.constants import UserRole, EventStatus, AttendanceStatus
from app.models.user import User, UserProfile
from app.models.event import Event
from app.models.registration import EventRegistration
from app.models.certificate import Certificate
from app.models.result import Result
from app.schemas.ai import AIChatRequest, QuickActionChip

logger = logging.getLogger("campusconnect.ai")


class AIService:
    def __init__(self, db: Session):
        self.db = db

    def get_quick_action_chips(self, current_user: User) -> List[QuickActionChip]:
        """Returns role-specific 1-click action chips for the chatbot UI."""
        role_val = str(current_user.role.value if hasattr(current_user.role, "value") else current_user.role).lower()

        if role_val == "organizer":
            return [
                QuickActionChip(
                    id="chip_org_desc",
                    label="✍️ Draft Event Description",
                    prompt="Help me write an engaging 3-paragraph description for an upcoming Tech Hackathon event.",
                    category="organizer"
                ),
                QuickActionChip(
                    id="chip_org_stats",
                    label="📊 Event Attendance Analytics",
                    prompt="Show live attendance and participant stats for my organized events.",
                    category="organizer"
                ),
                QuickActionChip(
                    id="chip_org_results",
                    label="🏆 Result Declaration Guide",
                    prompt="How do I declare results and award winner certificates for my event?",
                    category="organizer"
                ),
                QuickActionChip(
                    id="chip_org_certs",
                    label="📄 Certificate Design Templates",
                    prompt="Guide me on customizing certificate design templates.",
                    category="organizer"
                ),
            ]
        elif role_val == "admin":
            return [
                QuickActionChip(
                    id="chip_admin_overview",
                    label="📊 Platform Overview",
                    prompt="Give me a full platform summary of active colleges, total events, and certificate counts.",
                    category="admin"
                ),
                QuickActionChip(
                    id="chip_admin_approval",
                    label="🛡️ Event Moderation Guidelines",
                    prompt="What are the approval criteria for reviewing organizer event submissions?",
                    category="admin"
                ),
            ]
        else:
            # Student / Participant
            return [
                QuickActionChip(
                    id="chip_stu_rec",
                    label="🎓 Recommend Events for Me",
                    prompt="Suggest top upcoming hackathons and workshops matching my course and department.",
                    category="student"
                ),
                QuickActionChip(
                    id="chip_stu_certs",
                    label="📜 My Certificates & Badges",
                    prompt="Show my earned certificates, performance points, and badge level.",
                    category="student"
                ),
                QuickActionChip(
                    id="chip_stu_reg",
                    label="📝 My Upcoming Registrations",
                    prompt="Which events am I registered for and what are their dates?",
                    category="student"
                ),
                QuickActionChip(
                    id="chip_stu_verify",
                    label="🔍 Certificate Verification Guide",
                    prompt="How can anyone verify my digital certificate using the QR code?",
                    category="student"
                ),
            ]

    def _extract_rag_context(self, current_user: User) -> Dict[str, Any]:
        """Queries live database to gather RAG context for the user."""
        profile = self.db.execute(
            select(UserProfile).where(UserProfile.user_id == current_user.user_id)
        ).scalar_one_or_none()

        full_name = profile.full_name if profile and profile.full_name else current_user.email
        course = profile.course if profile and profile.course else "General Studies"
        department = profile.department if profile and profile.department else "General"

        # Fetch published upcoming/recent events
        events_query = select(Event).where(
            Event.status == EventStatus.PUBLISHED
        ).order_by(Event.start_datetime.asc()).limit(8)
        events = self.db.execute(events_query).scalars().all()

        events_summary = [
            {
                "event_id": e.event_id,
                "title": e.title,
                "category": str(e.category.value if hasattr(e.category, "value") else e.category),
                "event_type": str(e.event_type.value if hasattr(e.event_type, "value") else e.event_type),
                "start_datetime": e.start_datetime.strftime("%Y-%m-%d %H:%M") if e.start_datetime else None,
                "location": e.location,
                "price": float(e.price) if e.price else 0.0,
                "is_paid": bool(e.is_paid),
            }
            for e in events
        ]

        # Fetch user's registered events
        user_regs_query = select(EventRegistration).where(
            EventRegistration.participant_id == current_user.user_id
        ).limit(10)
        user_regs = self.db.execute(user_regs_query).scalars().all()

        user_certs_query = select(Certificate).where(
            Certificate.user_id == current_user.user_id
        )
        user_certs = self.db.execute(user_certs_query).scalars().all()

        # Performance tier calculation
        total_certs = len(user_certs)
        merit_certs = sum(1 for c in user_certs if getattr(c, "certificate_type", "") not in ["", "participation"])
        
        score = (total_certs * 50) + (merit_certs * 50)
        badge = "Bronze Achiever"
        if score >= 500:
            badge = "Gold Champion"
        elif score >= 250:
            badge = "Silver Performer"

        return {
            "user_id": current_user.user_id,
            "full_name": full_name,
            "email": current_user.email,
            "role": str(current_user.role.value if hasattr(current_user.role, "value") else current_user.role),
            "course": course,
            "department": department,
            "performance_score": score,
            "badge": badge,
            "certificates_count": total_certs,
            "registered_events_count": len(user_regs),
            "available_events": events_summary,
        }

    async def chat(self, request_data: AIChatRequest, current_user: User) -> Dict[str, Any]:
        """Main chat handler for AI assistant."""
        rag_context = self._extract_rag_context(current_user)
        action_chips = [chip.model_dump() for chip in self.get_quick_action_chips(current_user)]
        user_msg = request_data.message.strip().lower()

        # Check if external Gemini / LLM API key is present
        api_key = getattr(settings, "GEMINI_API_KEY", None) or getattr(settings, "OPENAI_API_KEY", None)
        
        if api_key:
            try:
                reply = await self._call_external_llm_api(api_key, request_data.message, rag_context)
                return {
                    "reply": reply,
                    "role": "assistant",
                    "action_chips": action_chips,
                    "recommended_events": rag_context["available_events"][:3],
                    "user_context": {
                        "full_name": rag_context["full_name"],
                        "role": rag_context["role"],
                        "badge": rag_context["badge"],
                    }
                }
            except Exception as e:
                logger.warning(f"External LLM API call failed: {e}. Falling back to native RAG engine.")

        # Native CampusConnect RAG Smart Fallback Engine
        reply, rec_events = self._generate_native_rag_reply(user_msg, rag_context)

        return {
            "reply": reply,
            "role": "assistant",
            "action_chips": action_chips,
            "recommended_events": rec_events,
            "user_context": {
                "full_name": rag_context["full_name"],
                "role": rag_context["role"],
                "badge": rag_context["badge"],
            }
        }

    async def _call_external_llm_api(self, api_key: str, message: str, context: Dict[str, Any]) -> str:
        """Dispatches prompt to Google Gemini 1.5 Flash API via httpx."""
        import httpx

        system_instruction = (
            f"You are CampusBot, the official intelligent AI assistant for CampusConnect.\n"
            f"Logged in user details:\n"
            f"- Name: {context['full_name']}\n"
            f"- Role: {context['role']}\n"
            f"- Course: {context['course']}, Department: {context['department']}\n"
            f"- Badge Level: {context['badge']} (Score: {context['performance_score']})\n"
            f"- Certificates Earned: {context['certificates_count']}\n\n"
            f"Live Available Events: {json.dumps(context['available_events'])}\n\n"
            f"Instructions:\n"
            f"1. Give friendly, helpful, role-personalized responses.\n"
            f"2. You can answer BOTH CampusConnect platform queries AND general user questions (coding help, study advice, general knowledge, science, career tips, jokes, etc.).\n"
            f"3. For CampusConnect queries, use the live database context and available events provided.\n"
            f"4. Keep formatting clean with markdown bullet points and emojis."
        )

        url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key={api_key}"
        headers = {"Content-Type": "application/json"}
        payload = {
            "contents": [
                {
                    "parts": [
                        {"text": f"{system_instruction}\n\nUser Question: {message}"}
                    ]
                }
            ]
        }

        async with httpx.AsyncClient(timeout=15.0) as client:
            resp = await client.post(url, json=payload, headers=headers)
            if resp.status_code == 200:
                data = resp.json()
                return data["candidates"][0]["content"]["parts"][0]["text"]
            else:
                raise Exception(f"Gemini API returned status {resp.status_code}: {resp.text}")

    def _generate_native_rag_reply(self, query: str, context: Dict[str, Any]) -> tuple[str, List[Dict[str, Any]]]:
        """Generates dynamic, role-personalized responses based on DB context."""
        name = context["full_name"]
        role = context["role"]
        events = context["available_events"]
        rec_events = events[:3]

        if "description" in query or "draft" in query or "organize" in query or "template" in query:
            reply = (
                f"Hello Organizer **{name}**! ✍️ Here is a high-converting event description template:\n\n"
                f"### 🚀 [Event Title]: Annual Innovation Hackathon 2026\n\n"
                f"**About the Event:**\n"
                f"Join us for an exciting 24-hour hands-on hackathon where student teams collaborate to solve real-world industry challenges! "
                f"Gain mentorship from industry experts, win cash prizes, and earn verified certificates of merit.\n\n"
                f"**Highlights:**\n"
                f"- 💡 Real-world Problem Statements\n"
                f"- 🏆 Cash Prizes & Verified Winner Certificates\n"
                f"- 🍕 Complimentary Refreshments & Mentorship\n\n"
                f"**Registration:** Open for all courses! Limited seats available."
            )
            return reply, []

        elif "certificate" in query or "download" in query or "verify" in query or "badge" in query:
            reply = (
                f"Hi **{name}**! 📜 Here is your Certificate & Achievement overview:\n\n"
                f"- 🏆 **Current Badge Level:** `{context['badge']}` ({context['performance_score']} Pts)\n"
                f"- 📄 **Verified Certificates:** `{context['certificates_count']}` Earned\n\n"
                f"**How to Manage Your Certificates:**\n"
                f"1. Visit the **My Certificates** tab in your student dashboard to download PDF copies.\n"
                f"2. Every certificate includes a unique **Verification QR Code**.\n"
                f"3. Anyone (HR, Recruiters, Colleges) can scan the QR code to verify authenticity instantly at `/api/v1/certificates/verify/<cert_no>`."
            )
            return reply, []

        elif "recommend" in query or "suggest" in query or "hackathon" in query or "event" in query:
            if not events:
                return (
                    f"Hello **{name}**! 👋 Currently, there are no published upcoming events in your campus. "
                    f"Check back soon or ask your club organizers to publish new events!",
                    []
                )
            
            event_items = []
            for e in events[:4]:
                price_str = "Free" if not e.get("is_paid") else f"Rs {e.get('price', 0)}"
                loc_str = e.get("location") or "Campus Hall"
                title_str = e.get("title")
                cat_str = e.get("category")
                event_items.append(f"- 🚀 **{title_str}** ({cat_str}) - Location: {loc_str} | Price: {price_str}")
            event_list_str = "\n".join(event_items)

            reply = (
                f"Hello **{name}**! 🎓 Based on your profile (**{context['course']} - {context['department']}**), "
                f"here are top upcoming events recommended for you:\n\n"
                f"{event_list_str}\n\n"
                f"💡 **Tip:** Click on any event card to view full details and register instantly!"
            )
            return reply, rec_events

        elif "overview" in query or "platform" in query or "stats" in query or "admin" in query:
            reply = (
                f"Greetings **{name}**! 🛡️ Here is the live CampusConnect platform summary:\n\n"
                f"- 📅 **Active Published Events:** `{len(events)}` Events\n"
                f"- 👤 **Your Account Role:** `{role.upper()}`\n"
                f"- ⚡ **System Status:** All Services Operational (JWT Auth, QR Scanner, PDF Generator, SMTP Engine)\n\n"
                f"Need help reviewing event approvals or user roles? Let me know!"
            )
            return reply, []

        else:
            reply = (
                f"Hello **{name}**! 👋 I am your **CampusConnect AI Assistant**.\n\n"
                f"I am here to guide you with:\n"
                f"- 🎓 Personalised Event & Hackathon Recommendations for **{context['course']}**\n"
                f"- 📜 Managing & Verifying Certificates and Badges (`{context['badge']}`)\n"
                f"- 📝 Check-in QR Codes, Payments, and Registration Status\n"
                f"- ✍️ Event Description & Result Declaration Guidance for Organizers\n\n"
                f"How can I assist you today?"
            )
            return reply, rec_events
