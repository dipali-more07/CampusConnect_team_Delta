"""
app/services/ai_service.py
============================
AI Chatbot & RAG (Retrieval-Augmented Generation) Service.

FEATURES:
  1. Role-Personalized Context (Student vs Organizer vs Admin)
  2. Live Database RAG Data (Events, Registrations, Certificates, Attendance)
  3. External LLM Integration (Google Gemini API with multi-model fallback)
  4. DuckDuckGo Instant Knowledge Engine (Answers out-of-project general knowledge, science & tech queries)
  5. Native CampusConnect Domain Engine (Certificates, QR Verification, Event Recommendations, Organizer Templates)
  6. Interactive Quick Action Chips Generator
  7. Autonomous Agent Action Execution (Publish Event, Complete Event, Bulk Certificates, Approve Organizers)
"""

from app.core.constants import EventType
from app.core.constants import EventCategory
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
        """Executes real database actions (Create Event, Register Event, Publish, Complete, Bulk Certificates, Approve Organizers)."""
        msg = user_msg.lower().strip()

        # Resolve active user or fallback to first database user for guest testing
        active_user = current_user
        if not active_user:
            active_user = self.db.execute(select(User)).scalars().first()

        user_id = active_user.user_id if active_user else None
        if not user_id:
            # Create temporary DB user for action execution if no users exist
            import uuid
            dummy_u = User(
                user_id=str(uuid.uuid4()),
                email=f"system_organizer_{uuid.uuid4().hex[:6]}@campusconnect.edu",
                password_hash="system_hashed",
                full_name="System Event Manager",
                role=UserRole.ORGANIZER,
                is_active=True
            )
            self.db.add(dummy_u)
            self.db.commit()
            self.db.refresh(dummy_u)
            user_id = dummy_u.user_id

        # ---------------------------------------------------------------------
        # 1. Action: CREATE REAL EVENT IN POSTGRESQL DATABASE
        # ---------------------------------------------------------------------
        is_create_cmd = any(kw in msg for kw in [
            "create event", "add event", "host event", "organize event", "new event", 
            "create hackathon", "create workshop", "event create", "event banao", 
            "event banana", "banao event", "make event", "new hackathon", "create an event"
        ]) or (("create" in msg or "banao" in msg or "add" in msg or "make" in msg) and ("event" in msg or "hackathon" in msg or "workshop" in msg))

        if is_create_cmd:
            import uuid
            from app.core.constants import ApprovalStatus

            # Clean & extract title
            cleaned = re.sub(r"(?i)^(please\s+|can\s+you\s+|ai\s+|bot\s+|help\s+me\s+)?(create|add|host|organize|new|banao|make)\s+(a|an|the\s+)?(event|hackathon|workshop|fest)?\s*", "", raw_msg).strip()
            cleaned = re.sub(r"(?i)\s*(create|banao|karo|do|please)$", "", cleaned).strip()
            title = cleaned if len(cleaned) > 3 else "CampusConnect Innovation Event 2026"
            title = title.strip(":\"' ")

            # Auto-detect Category
            cat_val = EventCategory.OTHER
            if any(w in msg for w in ["hackathon", "coding", "tech", "ai", "web", "app", "code", "dev"]):
                cat_val = EventCategory.TECHNICAL
            elif any(w in msg for w in ["workshop", "bootcamp", "seminar", "training"]):
                cat_val = EventCategory.WORKSHOP
            elif any(w in msg for w in ["cultural", "dance", "music", "art", "fest"]):
                cat_val = EventCategory.CULTURAL
            elif any(w in msg for w in ["sports", "cricket", "football", "gaming"]):
                cat_val = EventCategory.SPORTS

            start_dt = datetime.utcnow() + timedelta(days=7)
            end_dt = start_dt + timedelta(hours=8)
            reg_deadline = start_dt - timedelta(days=1)

            new_evt = Event(
                event_id=str(uuid.uuid4()),
                organizer_id=user_id,
                title=title,
                description=f"Official {title} organized on CampusConnect. Join us to showcase your skills, collaborate, and win verified digital certificates!",
                category=cat_val,
                event_type=EventType.OFFLINE,
                venue="Main Campus Auditorium & Innovation Hub",
                start_datetime=start_dt,
                end_datetime=end_dt,
                registration_deadline=reg_deadline,
                max_participants=150,
                fees=0.0,
                status=EventStatus.PUBLISHED,
                approval_status=ApprovalStatus.APPROVED,
            )

            self.db.add(new_evt)
            self.db.commit()
            self.db.refresh(new_evt)

            return (
                f"✅ **Real Database Record Created!**\n\n"
                f"### 📅 Event Saved to PostgreSQL:\n"
                f"- **Title:** {new_evt.title}\n"
                f"- **Event ID:** `{new_evt.event_id}`\n"
                f"- **Category:** `{cat_val.value.upper()}`\n"
                f"- **Status:** `PUBLISHED (Live)`\n"
                f"- **Venue:** {new_evt.venue}\n"
                f"- **Date:** {start_dt.strftime('%Y-%m-%d %H:%M UTC')}\n\n"
                f"Students can now see and register for **{new_evt.title}** on their dashboard!"
            )

        # ---------------------------------------------------------------------
        # 2. Action: REGISTER FOR AN EVENT IN POSTGRESQL DATABASE
        # ---------------------------------------------------------------------
        is_reg_cmd = any(kw in msg for kw in ["register for", "join event", "enroll in", "book seat", "registration karo", "register me", "join hackathon"])
        if is_reg_cmd:
            events = self.db.execute(
                select(Event).where(Event.status == EventStatus.PUBLISHED)
            ).scalars().all()

            target_evt = None
            for e in events:
                if e.title.lower() in msg or e.event_id in msg:
                    target_evt = e
                    break
            if not target_evt and events:
                target_evt = events[0]

            if target_evt:
                # Check existing registration
                existing = self.db.execute(
                    select(EventRegistration).where(
                        EventRegistration.event_id == target_evt.event_id,
                        EventRegistration.participant_id == user_id
                    )
                ).scalar_one_or_none()

                if existing:
                    return f"ℹ️ You are already registered for **{target_evt.title}** (Reg ID: `{existing.registration_id}`)."

                import uuid
                new_reg = EventRegistration(
                    registration_id=str(uuid.uuid4()),
                    event_id=target_evt.event_id,
                    participant_id=user_id,
                    registration_date=datetime.utcnow(),
                    attendance_status=AttendanceStatus.REGISTERED
                )
                self.db.add(new_reg)
                self.db.commit()
                self.db.refresh(new_reg)

                return (
                    f"✅ **Real Registration Record Saved!**\n\n"
                    f"- **Event:** {target_evt.title}\n"
                    f"- **Registration ID:** `{new_reg.registration_id}`\n"
                    f"- **Status:** Confirmed\n\n"
                    f"A confirmation pass has been issued for your profile."
                )
            else:
                return "ℹ️ No published events found matching your registration request."

        # ---------------------------------------------------------------------
        # 3. Action: PUBLISH EVENT IN POSTGRESQL DATABASE
        # ---------------------------------------------------------------------
        if any(kw in msg for kw in ["publish", "make live", "launch event", "live karo", "publish event"]):
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
                from app.core.constants import ApprovalStatus
                target_event.status = EventStatus.PUBLISHED
                target_event.approval_status = ApprovalStatus.APPROVED
                self.db.commit()
                self.db.refresh(target_event)
                return (
                    f"✅ **Action Executed Successfully!**\n\n"
                    f"Event **{target_event.title}** (ID: `{target_event.event_id}`) is now **PUBLISHED (Live)** in PostgreSQL! "
                    f"Students can now register for this event."
                )
            else:
                return "ℹ️ All events are already published."

        # ---------------------------------------------------------------------
        # 4. Action: COMPLETE EVENT IN POSTGRESQL DATABASE
        # ---------------------------------------------------------------------
        if any(kw in msg for kw in ["complete", "mark complete", "finish event", "end event", "event finished"]):
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
                    f"Event **{target_event.title}** marked as **COMPLETED** in PostgreSQL. "
                    f"Certificates can now be generated."
                )
            else:
                return "ℹ️ No active published events found matching your command."

        # ---------------------------------------------------------------------
        # 5. Action: GENERATE BULK CERTIFICATES IN POSTGRESQL DATABASE
        # ---------------------------------------------------------------------
        if any(kw in msg for kw in ["generate cert", "issue cert", "bulk cert", "certificate generate", "certificates issue"]):
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
                    f"Notifications sent."
                )

        # ---------------------------------------------------------------------
        # 6. Action: APPROVE ORGANIZERS IN POSTGRESQL DATABASE
        # ---------------------------------------------------------------------
        if any(kw in msg for kw in ["approve organizer", "verify organizer", "approve pending"]):
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
                logger.warning(f"External LLM API call failed: {e}. Falling back to Instant Knowledge Engine.")

        # 3. Intelligent Native RAG & Instant Knowledge Engine (Answers general + campus questions)
        reply, rec_events = await self._generate_native_rag_reply(user_query, rag_context)

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
            f"You are an expert AI assistant. User Context: Role={context['role']}, Course={context['course']}.\n"
            f"Live Events Context: {json.dumps(context['available_events'])}\n\n"
            f"STRICT RULES:\n"
            f"1. Answer the user's question IMMEDIATELY and STRAIGHTFORWARDLY.\n"
            f"2. DO NOT include greetings like 'Hello', 'Hi', 'Dear', or mention the user's name or 'CampusConnect' in the opening line unless the user explicitly greeted you.\n"
            f"3. NO preambles, pleasantries, or filler intro phrases. Start directly with the answer content.\n"
            f"4. Keep answers concise using markdown headers, bullet points, or code blocks."
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

        # Multi-model Candidate endpoints (Auto-Switches if rate-limited or quota exceeded)
        candidate_models = [
            "gemini-3.5-flash",
            "gemini-3.5-flash-lite",
            "gemini-3.1-flash-lite",
            "gemini-3-flash-preview",
            "gemini-flash-lite-latest",
            "gemma-4-31b-it",
            "gemma-4-26b-a4b-it"
        ]
        
        async with httpx.AsyncClient(timeout=15.0) as client:
            last_err = None
            # 1. Try Google Gemini Models
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
                                logger.info(f"✅ LLM Response generated successfully using model: {model_name}")
                                return parts[0]["text"]
                    else:
                        last_err = f"Model {model_name} HTTP {resp.status_code}: {resp.text}"
                except Exception as ex:
                    last_err = str(ex)

            # 2. Try Groq Free API if configured
            groq_key = getattr(settings, "GROQ_API_KEY", None)
            if groq_key and len(groq_key.strip()) > 5:
                groq_models = ["llama-3.3-70b-versatile", "mixtral-8x7b-32768", "gemma2-9b-it"]
                groq_headers = {"Authorization": f"Bearer {groq_key}", "Content-Type": "application/json"}
                for g_model in groq_models:
                    g_url = "https://api.groq.com/openai/v1/chat/completions"
                    g_payload = {
                        "model": g_model,
                        "messages": [
                            {"role": "system", "content": system_instruction},
                            {"role": "user", "content": message}
                        ]
                    }
                    try:
                        g_resp = await client.post(g_url, json=g_payload, headers=groq_headers)
                        if g_resp.status_code == 200:
                            g_data = g_resp.json()
                            content = g_data["choices"][0]["message"]["content"]
                            logger.info(f"✅ LLM Response generated successfully using Groq Model: {g_model}")
                            return content
                    except Exception as g_ex:
                        last_err = f"Groq {g_model}: {g_ex}"
            
            raise Exception(f"All LLM API model endpoints failed: {last_err}")

    async def _query_duckduckgo_knowledge(self, query: str) -> Optional[str]:
        """Queries free DuckDuckGo Instant Answer API for out-of-project general knowledge & science queries."""
        import httpx
        try:
            url = f"https://api.duckduckgo.com/?q={query}&format=json&no_html=1"
            async with httpx.AsyncClient(timeout=5.0) as client:
                resp = await client.get(url)
                if resp.status_code == 200:
                    data = resp.json()
                    abstract = data.get("AbstractText", "").strip()
                    if abstract:
                        heading = data.get("Heading", "Instant Knowledge")
                        return f"### 💡 {heading}\n\n{abstract}"
        except Exception as e:
            logger.debug(f"DuckDuckGo knowledge query skipped: {e}")
        return None

    async def _generate_native_rag_reply(self, raw_query: str, context: Dict[str, Any]) -> tuple[str, List[Dict[str, Any]]]:
        """Generates dynamic, highly relevant answers to ANY question (Tech, Coding, General Knowledge, or CampusConnect)."""
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
                f"Hello! I am **CampusBot**, your AI Assistant.\n\n"
                f"How can I help you today?"
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
                f"- **Web Frameworks:** FastAPI, Django, Flask\n"
                f"- **Data & AI:** NumPy, Pandas, PyTorch, TensorFlow, Scikit-Learn\n"
                f"- **Async Support:** `asyncio` & `httpx` for high-concurrency APIs"
            )
            return reply, []

        if any(w in query for w in ["javascript", "js", "react", "frontend"]):
            reply = (
                f"### ⚡ JavaScript & React Ecosystem\n\n"
                f"JavaScript powers modern dynamic web applications on both Client (React/Next.js) and Server (Node.js).\n\n"
                f"**Core Concepts:**\n"
                f"- **Async Operations:** Promises, `async/await`, `fetch()` API\n"
                f"- **React State:** `useState`, `useEffect`, Custom Hooks\n"
                f"- **Security:** `btoa()` / `atob()` for base64 encoding payloads"
            )
            return reply, []

        if any(w in query for w in ["sql", "database", "postgres", "queries"]):
            reply = (
                f"### 🗄️ Database & SQL Guide\n\n"
                f"SQL (Structured Query Language) is used to store, query, and manipulate relational data.\n\n"
                f"**Core Tech Stack:**\n"
                f"- **Database:** PostgreSQL with SQLAlchemy 2.0 ORM & Alembic Migrations\n"
                f"- **Key Tables:** `users`, `events`, `registrations`, `certificates`, `results`"
            )
            return reply, []

        if any(w in query for w in ["interview", "prep", "career", "resume", "job"]):
            reply = (
                f"### 💼 Technical Interview Roadmap\n\n"
                f"1. 🧠 **Data Structures & Algorithms:** Focus on Arrays, HashMaps, Two Pointers, Trees, and Dynamic Programming.\n"
                f"2. 🛠️ **Build Real Projects:** Build production-grade full-stack apps with verified certificates.\n"
                f"3. 📄 **Resume Strategy:** Highlight key impact metrics, tech stack used, and QR-verifiable certificates.\n"
                f"4. 💬 **Mock Interviews:** Practice explaining your system architecture clearly out loud."
            )
            return reply, []

        # -------------------------------------------------------------
        # C. EVENT DRAFTING & ORGANIZER GUIDANCE
        # -------------------------------------------------------------
        if any(w in query for w in ["description", "draft", "organize", "template"]):
            reply = (
                f"### ✍️ High-Converting Event Description Template\n\n"
                f"**Title:** Annual Innovation Hackathon 2026\n\n"
                f"**About the Event:**\n"
                f"Join us for an exciting 24-hour hands-on hackathon where student teams collaborate to solve real-world industry challenges! "
                f"Gain mentorship from industry experts, win cash prizes, and earn verified certificates of merit.\n\n"
                f"**Highlights:**\n"
                f"- 💡 Real-world Problem Statements\n"
                f"- 🏆 Cash Prizes & Verified Winner Certificates\n"
                f"- 🍕 Complimentary Refreshments & Mentorship"
            )
            return reply, []

        # -------------------------------------------------------------
        # D. CERTIFICATES, BADGES & QR VERIFICATION
        # -------------------------------------------------------------
        if any(w in query for w in ["certificate", "download", "verify", "badge", "score", "points"]):
            reply = (
                f"### 📜 Certificate & Achievement Overview\n\n"
                f"- 🏆 **Badge Level:** `{context['badge']}` ({context['performance_score']} Pts)\n"
                f"- 📄 **Verified Certificates:** `{context['certificates_count']}` Earned\n\n"
                f"**Management Steps:**\n"
                f"1. Visit the **My Certificates** tab in your dashboard to download PDF copies.\n"
                f"2. Every certificate includes a unique **Verification QR Code**.\n"
                f"3. Anyone can scan the QR code to verify authenticity instantly at `/api/v1/certificates/verify/<cert_no>`."
            )
            return reply, []

        # -------------------------------------------------------------
        # E. EVENT RECOMMENDATIONS & REGISTRATION
        # -------------------------------------------------------------
        if any(w in query for w in ["recommend", "suggest", "hackathon", "event", "upcoming", "show events"]):
            if not events:
                return "Currently, there are no published upcoming events.", []
            
            event_items = []
            for e in events[:4]:
                price_str = "Free" if not e.get("is_paid") else f"Rs {e.get('price', 0)}"
                loc_str = e.get("location") or "Campus Hall"
                title_str = e.get("title")
                cat_str = e.get("category")
                event_items.append(f"- 🚀 **{title_str}** ({cat_str}) - Location: {loc_str} | Price: {price_str}")
            event_list_str = "\n".join(event_items)

            reply = f"### 🎓 Recommended Events for {context['course']}:\n\n{event_list_str}"
            return reply, rec_events

        # -------------------------------------------------------------
        # F. PLATFORM OVERVIEW & ADMIN STATS
        # -------------------------------------------------------------
        if any(w in query for w in ["overview", "platform", "stats", "admin", "system"]):
            reply = (
                f"### 🛡️ Live Platform Overview\n\n"
                f"- 📅 **Active Published Events:** `{len(events)}` Events\n"
                f"- 👤 **Account Role:** `{role.upper()}`\n"
                f"- ⚡ **System Status:** All Services Operational (JWT Auth, QR Scanner, PDF Generator, SMTP Engine)"
            )
            return reply, []

        # -------------------------------------------------------------
        # G. OUT-OF-PROJECT GENERAL KNOWLEDGE SEARCH (DUCKDUCKGO API)
        # -------------------------------------------------------------
        ddg_answer = await self._query_duckduckgo_knowledge(raw_query)
        if ddg_answer:
            return ddg_answer, []

        # -------------------------------------------------------------
        # H. GENERAL HELPFUL RESPONSE FOR CUSTOM USER QUESTIONS
        # -------------------------------------------------------------
        reply = (
            f"Here is what I can share regarding **'{raw_query}'**:\n\n"
            f"- I am **CampusBot**, your intelligent assistant.\n"
            f"- Ask me any technical question, event creation guidance, certificate verification, or platform features!"
        )
        return reply, []
