# API Flow & Sequence Diagrams — CampusConnect Enterprise

## 1. Authentication & Role Authorization Flow
```
User                 FastAPI Router             AuthService             Database
 │                         │                         │                      │
 ├─1. Register Request ───>│                         │                      │
 │                         ├─2. Check Email exists ────────────────────────>│ (Email lookup)
 │                         ├─3. Hash password (Bcrypt)─>│                   │
 │                         ├─4. Create User/Profile ───────────────────────>│ (Insert transaction)
 │                         ├─5. Send Welcome Email ─>│                      │
 │<─6. Success + JWT Token─┤                         │                      │
```

## 2. Event Lifecycle & Registration Flow
```
Student              FastAPI Router          RegistrationService        Database
 │                         │                         │                      │
 ├─1. Register for Event ─>│                         │                      │
 │                         ├─2. Verify JWT & Role ──>│                      │
 │                         ├─3. Check Event Capacity & Deadline ───────────>│ (Verify Capacity)
 │                         ├─4. Check Duplicate Registration ──────────────>│ (Ensure Unique)
 │                         ├─5. Create Registration & Issue Pass Code ─────>│ (Save transaction)
 │<─6. 201 Created (Pass) ─┤                         │                      │
```

## 3. Venue Attendance Check-In Flow
```
Organizer            FastAPI Router          AttendanceService          Database
 │                         │                         │                      │
 ├─1. Mark Attendance ────>│                         │                      │
 │    (registration_id)    ├─2. Verify Organizer Permissions ──────────────>│ (Verify Role)
 │                         ├─3. Check Duplicate Scan ──────────────────────>│ (Check past check-in)
 │                         ├─4. Set Status = "PRESENT" ────────────────────>│ (Save attendance row)
 │                         ├─5. Award +50 Merit Points to Student ─────────>│ (Update Profile)
 │<─6. 200 OK Checked In ──┤                         │                      │
```

## 4. Automated Certificate Generation & Email Dispatch
```
Organizer            FastAPI Router          CertificateService         ReportLab / DB
 │                         │                         │                      │
 ├─1. Complete Event ─────>│                         │                      │
 │                         ├─2. Update Event Status to "COMPLETED" ────────>│ (Set Completed)
 │                         ├─3. Fetch all "PRESENT" registered students ───>│ (Query Attendees)
 │                         ├─4. Generate Vector PDF Certificates ──────────>│ (ReportLab Canvas)
 │                         ├─5. Save Certificate records & URLs ───────────>│ (Batch Insert)
 │                         ├─6. Dispatch PDF via SMTP Email ───────────────>│ (Background Task)
 │<─7. 200 OK Complete ────┤                         │                      │
```

## 5. Camy AI Multilingual Voice & Fallback Chain Flow
```
User                 FastAPI Router             AIService            Gemini / Groq / RAG
 │                         │                         │                      │
 ├─1. Chat / Voice Query ─>│                         │                      │
 │                         ├─2. Sanitize Input & Check Jailbreak Guard ─────│
 │                         ├─3. Detect Query Language (HI / EN / MR) ───────│
 │                         ├─4. Call Tier 1 (Gemini 3.5 Flash) ────────────>│
 │                         │    (If Error/Timeout → Fallback to Groq) ─────>│
 │                         │    (If Offline → Fallback to Native RAG) ─────>│
 │                         ├─5. Synthesize Multilingual Voice Config ───────│
 │<─6. Text + Voice Payload┤                         │                      │
```
