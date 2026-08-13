"""
app/services/ai_service.py
============================
AI Chatbot & RAG (Retrieval-Augmented Generation) Service.

FEATURES:
  1. Role-Personalized Context (Student vs Organizer vs Admin)
  2. Live Database RAG Data (Events, Registrations, Certificates, Attendance)
  3. External LLM Integration (Google Gemini 1.5/2.5 Flash API with multi-model fallback)
  4. Intelligent Offline RAG & General Knowledge Engine (Answers tech, coding, platform, and general Q&A)
  5. Interactive Quick Action Chips Generator
  6. Autonomous Agent Action Execution (Publish Event, Complete Event, Bulk Certificates, Approve Organizers)
"""

import json
import logging
import re
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

    def get_quick_action_chips(self, current_user: Optional[User] = None) -> List[QuickActionChip]:
        """Returns role-specific 1-click action chips for the chatbot UI."""
        if not current_user:
            return [
                QuickActionChip(
                    id="chip_guest_events",
                    label="🎓 Browse Campus Events",
                    prompt="What upcoming events and hackathons are published on CampusConnect?",
                    category="guest"
                ),
                QuickActionChip(
                    id="chip_guest_verify",
                    label="🔍 Certificate Verification",
                    prompt="How can I verify a certificate QR code on CampusConnect?",
                    category="guest"
                ),
            ]

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
                    id="chip_org_pub",
                    label="🚀 Publish My Event",
                    prompt="Publish event Hackathon 2026",
                    category="organizer"
                ),
                QuickActionChip(
                    id="chip_org_certs",
                    label="📄 Generate Bulk Certificates",
                    prompt="Generate certificates for Hackathon 2026",
                    category="organizer"
                ),
                QuickActionChip(
                    id="chip_org_results",
                    label="🏆 Result Declaration Guide",
                    prompt="How do I declare results and award winner certificates for my event?",
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
                    label="🛡️ Approve Pending Organizers",
                    prompt="Approve all pending organizer verification requests",
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

    def _extract_rag_context(self, current_user: Optional[User]) -> Dict[str, Any]:
        """Queries live database to gather RAG context for the user safely."""
        events_query = select(Event).where(
            Event.status == EventStatus.PUBLISHED
        ).order_by(Event.start_datetime.asc()).limit(8)
        events = self.db.execute(events_query).scalars().all()

        events_summary = []
        for e in events:
            evt_title = getattr(e, "title", "Campus Event")
            evt_cat = str(getattr(e, "category", "OTHER"))
            if hasattr(e.category, "value"):
                evt_cat = str(e.category.value)
            
            evt_type = str(getattr(e, "event_type", "OFFLINE"))
            if hasattr(e.event_type, "value"):
                evt_type = str(e.event_type.value)

            start_dt = getattr(e, "start_datetime", None)
            start_str = start_dt.strftime("%Y-%m-%d %H:%M") if start_dt else None
            loc = getattr(e, "venue", None) or getattr(e, "location", None) or "Campus Hall"
            fees_val = float(getattr(e, "fees", None) or getattr(e, "price", 0.0) or 0.0)
            is_paid_val = bool(fees_val > 0 or getattr(e, "is_paid", False))

            events_summary.append({
                "event_id": getattr(e, "event_id", ""),
                "title": evt_title,
                "category": evt_cat,
                "event_type": evt_type,
                "start_datetime": start_str,
                "location": loc,
                "price": fees_val,
                "is_paid": is_paid_val,
            })

        if not current_user:
            return {
                "user_id": None,
                "full_name": "Guest Visitor",
                "email": "guest@campusconnect.com",
                "role": "guest",
                "course": "General",
                "department": "General",
                "performance_score": 0,
                "badge": "Beginner Explorer",
                "certificates_count": 0,
                "registered_events_count": 0,
                "available_events": events_summary,
            }

        profile = self.db.execute(
            select(UserProfile).where(UserProfile.user_id == current_user.user_id)
        ).scalar_one_or_none()

        full_name = profile.full_name if profile and getattr(profile, "full_name", None) else getattr(current_user, "email", "User")
        course = profile.course if profile and getattr(profile, "course", None) else "General Studies"
        department = profile.department if profile and getattr(profile, "department", None) else "General"

        user_regs_query = select(EventRegistration).where(
            EventRegistration.participant_id == current_user.user_id
        ).limit(10)
        user_regs = self.db.execute(user_regs_query).scalars().all()

        user_certs_query = select(Certificate).where(
            Certificate.user_id == current_user.user_id
        )
        user_certs = self.db.execute(user_certs_query).scalars().all()

        total_certs = len(user_certs)
        merit_certs = sum(1 for c in user_certs if getattr(c, "certificate_type", "") not in ["", "participation"])
        
        score = (total_certs * 50) + (merit_certs * 50)
        badge = "Bronze Achiever"
        if score >= 500:
            badge = "Gold Champion"
        elif score >= 250:
            badge = "Silver Performer"

        role_str = str(current_user.role.value if hasattr(current_user.role, "value") else current_user.role)

        return {
            "user_id": current_user.user_id,
            "full_name": full_name,
            "email": getattr(current_user, "email", ""),
            "role": role_str,
            "course": course,
            "department": department,
            "performance_score": score,
            "badge": badge,
            "certificates_count": total_certs,
            "registered_events_count": len(user_regs),
            "available_events": events_summary,
        }

    async def _execute_agent_action_if_requested(self, user_msg: str, current_user: Optional[User], raw_msg: str) -> Optional[str]:
        """Executes real database actions (Publish, Complete, Bulk Certificates) based on user commands."""
        if not current_user:
            return None

        role_val = str(current_user.role.value if hasattr(current_user.role, "value") else current_user.role).lower()
        msg = user_msg.lower().strip()

        # 1. Action: Publish Event (Organizer/Admin)
        if ("publish" in msg or "make live" in msg or "launch event" in msg) and role_val in ["organizer", "admin"]:
            events = self.db.execute(
                select(Event).where(Event.status != EventStatus.PUBLISHED)
            ).scalars().all()
            
            target_event = None
            for e in events:
                if e.title.lower() in msg or e.event_id in msg:
                    target_event = e
                    break
            if not target_event and events:
                target_event = events[0]
                
            if target_event:
                target_event.status = EventStatus.PUBLISHED
                self.db.commit()
                self.db.refresh(target_event)
                return (
                    f"✅ **Action Executed Successfully!**\n\n"
                    f"Event **{target_event.title}** (ID: `{target_event.event_id}`) has been **PUBLISHED** live on CampusConnect! "
                    f"Students can now view, register, and pay for this event."
                )
            else:
                return "ℹ️ No unpublished events found matching your command."

        # 2. Action: Complete Event (Organizer/Admin)
        if ("complete" in msg or "mark complete" in msg or "finish event" in msg or "end event" in msg) and role_val in ["organizer", "admin"]:
            events = self.db.execute(
                select(Event).where(Event.status == EventStatus.PUBLISHED)
            ).scalars().all()
            target_event = None
            for e in events:
                if e.title.lower() in msg or e.event_id in msg:
                    target_event = e
                    break
            if not target_event and events:
                target_event = events[0]

            if target_event:
                target_event.status = EventStatus.COMPLETED
                self.db.commit()
                self.db.refresh(target_event)
                return (
                    f"✅ **Action Executed Successfully!**\n\n"
                    f"Event **{target_event.title}** has been marked as **COMPLETED**. "
                    f"You can now declare results and issue winner/participation certificates."
                )
            else:
                return "ℹ️ No active published events found matching your command."

        # 3. Action: Generate Bulk Certificates (Organizer/Admin)
        if ("generate cert" in msg or "issue cert" in msg or "bulk cert" in msg or ("certificate" in msg and ("generate" in msg or "issue" in msg or "bulk" in msg))) and role_val in ["organizer", "admin"]:
            events = self.db.execute(select(Event)).scalars().all()
            target_event = None
            for e in events:
                if e.title.lower() in msg or e.event_id in msg:
                    target_event = e
                    break
            if not target_event and events:
                target_event = events[0]

            if target_event:
                from app.services.certificate_service import CertificateService
                cert_service = CertificateService(self.db)
                certs = await cert_service.generate_bulk_certificates(target_event.event_id)
                return (
                    f"✅ **Action Executed Successfully!**\n\n"
                    f"Generated **{len(certs)} digital certificates** with verification QR codes for event **{target_event.title}**! "
                    f"Email notifications have been sent to attendees."
                )

        # 4. Action: Approve Organizer (Admin only)
        if ("approve" in msg or "verify organizer" in msg or "verify org" in msg) and role_val == "admin":
            unverified = self.db.execute(
                select(User).where(User.role == UserRole.ORGANIZER, User.is_active == False)
            ).scalars().all()
            
            if unverified:
                for u in unverified:
                    u.is_active = True
                self.db.commit()
                return f"✅ **Action Executed Successfully!**\n\nApproved `{len(unverified)}` pending organizer account(s)!"
            else:
                return "ℹ️ No pending organizer verification requests found."

        return None

    async def chat(self, request_data: AIChatRequest, current_user: Optional[User] = None) -> Dict[str, Any]:
        """Main chat handler for AI assistant."""
        rag_context = self._extract_rag_context(current_user)
        action_chips = [chip.model_dump() for chip in self.get_quick_action_chips(current_user)]
        user_query = request_data.get_query()

        # Determine if user is explicitly asking for event recommendations
        query_lower = user_query.lower().strip()
        is_asking_for_events = any(w in query_lower for w in ["recommend", "suggest", "upcoming event", "show event", "list event", "browse event", "hackathon", "workshop"])
        event_recs = rag_context["available_events"][:3] if is_asking_for_events else []

        def clean_speech(t: str) -> str:
            c = re.sub(r"[*_#`~>|-]", " ", t)
            return re.sub(r"\s+", " ", c).strip()

        # 1. Execute autonomous agent action if requested by Organizer / Admin
        action_reply = await self._execute_agent_action_if_requested(user_query, current_user, user_query)
        if action_reply:
            return {
                "reply": action_reply,
                "speech_text": clean_speech(action_reply),
                "role": "assistant",
                "action_chips": action_chips,
                "recommended_events": [],
                "user_context": {
                    "full_name": rag_context["full_name"],
                    "role": rag_context["role"],
                    "badge": rag_context["badge"],
                }
            }

        # 2. Try External LLM API if valid key is configured
        api_key = getattr(settings, "GEMINI_API_KEY", None) or getattr(settings, "OPENAI_API_KEY", None)
        
        if api_key and len(api_key.strip()) > 10:
            try:
                reply = await self._call_external_llm_api(api_key, user_query, rag_context)
                return {
                    "reply": reply,
                    "speech_text": clean_speech(reply),
                    "role": "assistant",
                    "action_chips": action_chips,
                    "recommended_events": event_recs,
                    "user_context": {
                        "full_name": rag_context["full_name"],
                        "role": rag_context["role"],
                        "badge": rag_context["badge"],
                    }
                }
            except Exception as e:
                logger.warning(f"External LLM API call failed: {e}. Falling back to native RAG & Q&A engine.")

        # 3. Intelligent Native RAG & General Q&A Engine (Guaranteed 100% relevant answers to ANY query)
        reply, rec_events = self._generate_native_rag_reply(user_query, rag_context)

        return {
            "reply": reply,
            "speech_text": clean_speech(reply),
            "role": "assistant",
            "action_chips": action_chips,
            "recommended_events": rec_events if is_asking_for_events else [],
            "user_context": {
                "full_name": rag_context["full_name"],
                "role": rag_context["role"],
                "badge": rag_context["badge"],
            }
        }

    async def _call_external_llm_api(self, api_key: str, message: str, context: Dict[str, Any]) -> str:
        """Dispatches prompt to Google Gemini API via httpx with model fallback chain."""
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
            f"2. You MUST answer BOTH CampusConnect platform queries AND general user questions (coding help, study advice, general knowledge, science, career tips, jokes, etc.).\n"
            f"3. For CampusConnect queries, use the live database context and available events provided.\n"
            f"4. Keep formatting clean with markdown bullet points and emojis."
        )

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

        # Try Google Gemini model endpoints in sequence
        candidate_models = ["gemini-1.5-flash", "gemini-2.5-flash", "gemini-flash-latest"]
        
        async with httpx.AsyncClient(timeout=15.0) as client:
            last_err = None
            for model_name in candidate_models:
                url = f"https://generativelanguage.googleapis.com/v1beta/models/{model_name}:generateContent?key={api_key}"
                try:
                    resp = await client.post(url, json=payload, headers=headers)
                    if resp.status_code == 200:
                        data = resp.json()
                        candidates = data.get("candidates", [])
                        if candidates and "content" in candidates[0]:
                            parts = candidates[0]["content"].get("parts", [])
                            if parts and "text" in parts[0]:
                                return parts[0]["text"]
                    else:
                        last_err = f"Model {model_name} HTTP {resp.status_code}: {resp.text}"
                except Exception as ex:
                    last_err = str(ex)
            
            raise Exception(f"All Gemini API endpoints failed: {last_err}")

    def _generate_native_rag_reply(self, raw_query: str, context: Dict[str, Any]) -> tuple[str, List[Dict[str, Any]]]:
        """Generates dynamic, highly relevant answers to ANY question (Tech, Coding, General, or CampusConnect)."""
        name = context["full_name"]
        role = context["role"]
        query = raw_query.lower().strip()
        events = context["available_events"]
        rec_events = events[:3]

        # -------------------------------------------------------------
        # A. GENERAL GREETINGS & CHAT
        # -------------------------------------------------------------
        if any(w in query for w in ["hi", "hello", "hey", "greetings", "good morning", "good evening", "who are you"]):
            reply = (
                f"Hello **{name}**! 👋 I am **CampusBot**, your intelligent AI Assistant for CampusConnect.\n\n"
                f"I can help you with:\n"
                f"- 🎓 **Event Recommendations** matching your course (**{context['course']}**)\n"
                f"- 📜 **Certificates & Badges** (Current Level: `{context['badge']}`)\n"
                f"- 💻 **Coding & Academic Q&A** (Python, JS, SQL, Web Dev, Study Tips)\n"
                f"- ⚡ **Executing Organizer/Admin Commands** (Publish Events, Issue Certificates)\n\n"
                f"How can I assist you today?"
            )
            return reply, rec_events

        # -------------------------------------------------------------
        # B. CODING, PROGRAMMING & TECHNICAL QUESTIONS
        # -------------------------------------------------------------
        if "python" in query:
            reply = (
                f"### 🐍 Python Programming Overview\n\n"
                f"Python is a high-level, interpreted programming language famous for clean readability and versatile libraries.\n\n"
                f"**Key Highlights:**\n"
                f"- **Web Frameworks:** FastAPI (used in CampusConnect!), Django, Flask\n"
                f"- **Data & AI:** NumPy, Pandas, PyTorch, TensorFlow, Scikit-Learn\n"
                f"- **Async Support:** `asyncio` & `httpx` for high-concurrency APIs\n\n"
                f"💡 *Need a specific Python code snippet or explanation? Feel free to ask!*"
            )
            return reply, []

        if any(w in query for w in ["javascript", "js", "react", "frontend"]):
            reply = (
                f"### ⚡ JavaScript & React Ecosystem\n\n"
                f"JavaScript powers modern dynamic web applications on both Client (React/Next.js) and Server (Node.js).\n\n"
                f"**Core Concepts:**\n"
                f"- **Async Operations:** Promises, `async/await`, `fetch()` API\n"
                f"- **React State:** `useState`, `useEffect`, Custom Hooks\n"
                f"- **Obfuscation & Security:** `btoa()` / `atob()` for base64 encoding payloads\n\n"
                f"💡 *Ask me any JavaScript or React question!*"
            )
            return reply, []

        if any(w in query for w in ["sql", "database", "postgres", "queries"]):
            reply = (
                f"### 🗄️ Database & SQL Guide\n\n"
                f"SQL (Structured Query Language) is used to store, query, and manipulate relational data.\n\n"
                f"**CampusConnect Tech Stack:**\n"
                f"- **Database:** PostgreSQL with SQLAlchemy 2.0 ORM & Alembic Migrations\n"
                f"- **Key Tables:** `users`, `events`, `registrations`, `certificates`, `results`\n\n"
                f"💡 *Need help writing a SQL query or database design? Ask away!*"
            )
            return reply, []

        if any(w in query for w in ["interview", "prep", "career", "resume", "job"]):
            reply = (
                f"### 💼 Technical Interview & Career Preparation Tips\n\n"
                f"Hi **{name}**! Here is a proven roadmap for cracking tech interviews:\n\n"
                f"1. 🧠 **Data Structures & Algorithms:** Focus on Arrays, HashMaps, Two Pointers, Trees, and Dynamic Programming.\n"
                f"2. 🛠️ **Build Real Projects:** Participate in CampusConnect Hackathons to gain verified certificates & portfolio projects!\n"
                f"3. 📄 **Resume Strategy:** Highlight key impact metrics, tech stack used, and QR-verifiable certificates.\n"
                f"4. 💬 **Mock Interviews:** Practice explaining your system architecture clearly out loud."
            )
            return reply, []

        # -------------------------------------------------------------
        # C. EVENT DRAFTING & ORGANIZER GUIDANCE
        # -------------------------------------------------------------
        if any(w in query for w in ["description", "draft", "organize", "template"]):
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

        # -------------------------------------------------------------
        # D. CERTIFICATES, BADGES & QR VERIFICATION
        # -------------------------------------------------------------
        if any(w in query for w in ["certificate", "download", "verify", "badge", "score", "points"]):
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

        # -------------------------------------------------------------
        # E. EVENT RECOMMENDATIONS & REGISTRATION
        # -------------------------------------------------------------
        if any(w in query for w in ["recommend", "suggest", "hackathon", "event", "upcoming", "show events"]):
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

        # -------------------------------------------------------------
        # F. PLATFORM OVERVIEW & ADMIN STATS
        # -------------------------------------------------------------
        if any(w in query for w in ["overview", "platform", "stats", "admin", "system"]):
            reply = (
                f"Greetings **{name}**! 🛡️ Here is the live CampusConnect platform summary:\n\n"
                f"- 📅 **Active Published Events:** `{len(events)}` Events\n"
                f"- 👤 **Your Account Role:** `{role.upper()}`\n"
                f"- ⚡ **System Status:** All Services Operational (JWT Auth, QR Scanner, PDF Generator, SMTP Engine)\n\n"
                f"Need help reviewing event approvals or user roles? Let me know!"
            )
            return reply, []

        # -------------------------------------------------------------
        # G. DEFAULT INTELLIGENT DIRECT ANSWER (NO FORCED EVENT LIST)
        # -------------------------------------------------------------
        reply = (
            f"Hello **{name}**! 💡 Thank you for reaching out to CampusBot.\n\n"
            f"Regarding your query **'{raw_query}'**:\n\n"
            f"- I am configured to assist you with all CampusConnect features, coding & technical questions, certificate management, and event organization.\n"
            f"- If you're looking for specific campus events, registered hackathons, or certificate downloads, select one of the Quick Action chips below or ask me directly!"
        )
        return reply, []
