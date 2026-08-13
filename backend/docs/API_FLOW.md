# API Flow & Sequence Diagrams — CampusConnect

## 1. Authentication Flow
```
User                 FastAPI Router             AuthService             Database
 │                         │                         │                      │
 ├─1. Register Request ───>│                         │                      │
 │                         ├─2. Check Email exists ────────────────────────>│ (Email lookup)
 │                         │                         │                      │ (Unique check)
 │                         ├─3. Hash password ──────>│                      │
 │                         ├─4. Create User/Profile ───────────────────────>│ (Insert transaction)
 │                         ├─5. Send email ─────────>│                      │
 │<─6. Success Response ───┤                         │                      │
```

## 2. Event Registration & Waitlist Flow
```
Student              FastAPI Router          RegistrationService        Database
 │                         │                         │                      │
 ├─1. Register for Event ─>│                         │                      │
 │                         ├─2. Check event details ───────────────────────>│ (Get Event Status/Cap)
 │                         ├─3. Check duplicates ──────────────────────────>│ (Get User Registration)
 │                         ├─4. Compute Registration status                 │
 │                         │    (Confirmed OR Waitlisted)                   │
 │                         ├─5. Create Registration & Notif ───────────────>│ (Save transaction)
 │<─6. Registration status─┤                         │                      │
```

## 3. QR Code Attendance Check-In Flow
```
Organizer            FastAPI Router          AttendanceService          Database
 │                         │                         │                      │
 ├─1. Scan Student QR ────>│                         │                      │
 │    (registration_id)    ├─2. Verify registration ───────────────────────>│ (Load registration)
 │                         ├─3. Check-in student ───>│                      │
 │                         │    (Ensure not duplicate scan)                 │
 │                         ├─4. Save attendance ───────────────────────────>│ (Save attendance row)
 │                         │    (Set reg_status to "attended")              │
 │<─5. Checked In Success ─┤                         │                      │
```

## 4. Certificate Generation & Verification Flow
```
Organizer            FastAPI Router          CertificateService         Database
 │                         │                         │                      │
 ├─1. Trigger Bulk Cert ──>│                         │                      │
 │                         ├─2. Fetch attendees ───────────────────────────>│ (Load "present" users)
 │                         ├─3. Generate PDF cert ──>│                      │
 │                         │    (Embed verification QR code)                │
 │                         ├─4. Save Certificate row ──────────────────────>│ (Save to certificates)
 │<─5. Done Response ──────┤                         │                      │
```
