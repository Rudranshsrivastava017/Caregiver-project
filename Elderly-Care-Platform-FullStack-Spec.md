     # Elderly Nursing & Healthcare Assistance Platform
## Full-Stack Project Specification (Payment Integration Excluded)

---

## 0. Revision Note

This document extends the original **frontend-only** specification into a complete **full-stack** spec: backend architecture, database schema, REST API contracts, authentication implementation, real-time updates, file storage, and deployment.

**Changes from the original spec:**
- All payment-related functionality has been removed. Booking now ends at "Confirm Booking" — there is no checkout/payment step, and no `paymentStatus` field.
- `totalPrice` is retained purely as a **display estimate** for the user, not tied to any transaction.
- A "Future Enhancements" note (Section 16) explains how payment could be bolted on later if you change your mind — but nothing here assumes or half-builds it.

**Assumed backend stack:** Node.js + Express + PostgreSQL (via Prisma ORM). If you'd rather use a different backend language/framework, the database schema and API contracts below still apply — only the folder structure and ORM-specific syntax would differ.

---

## 1. Project Overview

**Project Name:** Elderly Nursing & Healthcare Assistance Platform

**Purpose:** A full-stack web service connecting senior citizens and their families with verified healthcare professionals (nurses, caregivers, physiotherapists, attendants) who provide in-home medical and non-medical assistance.

**Core Goals:**
- Improve accessibility to trusted, verified caregivers
- Ensure safety through identity-verified login (JWT + legal ID validation, enforced server-side)
- Maintain continuity of care through structured bookings and care notes
- Provide a simple, senior-friendly, and family-friendly interface
- Persist all data reliably with proper relational integrity (no more mock data)

**Project Scope:** Full-stack — frontend (React/Next.js), backend REST API (Node/Express), relational database (PostgreSQL), file storage, and real-time updates. **No payment processing.**

---

## 2. Tech Stack

### 2.1 Frontend (unchanged from original spec)

| Layer | Technology |
|---|---|
| Markup / Styling | HTML5, CSS3, JavaScript (ES6+) |
| Framework | React.js with Next.js (App Router) |
| UI Styling | Tailwind CSS |
| State Management | React Context API / Redux Toolkit |
| Forms & Validation | React Hook Form + Zod |
| HTTP Client | Axios (interceptors for JWT attach/refresh) |
| Auth | JWT, access token in memory, refresh token in HttpOnly cookie |
| Icons | Lucide-react |
| Notifications | Sonner (toasts) + Socket.io client (real-time) |

### 2.2 Backend (new)

| Layer | Technology |
|---|---|
| Runtime | Node.js (LTS) |
| Framework | Express.js |
| Language | TypeScript (recommended) |
| ORM | Prisma |
| Database | PostgreSQL |
| Auth | JWT (`jsonwebtoken`) + `bcrypt` for password hashing |
| Validation | Zod (shared schemas with frontend where possible) |
| File Uploads | `multer` → AWS S3 or Cloudinary |
| Real-time | Socket.io |
| Rate Limiting / Security | `express-rate-limit`, `helmet`, `cors` |
| Logging | `pino` or `winston` |
| API Docs | Swagger / OpenAPI (`swagger-jsdoc` + `swagger-ui-express`) |
| Testing | Jest + Supertest |

### 2.3 Infra / DevOps

| Layer | Technology |
|---|---|
| Frontend hosting | Vercel |
| Backend hosting | Render / Railway / Fly.io (or AWS EC2 + PM2 for more control) |
| Database hosting | Supabase, Neon, or AWS RDS (PostgreSQL) |
| File storage | AWS S3 or Cloudinary |
| CI/CD | GitHub Actions (lint → test → build → deploy) |
| Containerization | Docker (optional but recommended for backend parity across environments) |

---

## 3. User Roles

| Role | Description |
|---|---|
| **Family/User** | Registers, manages elderly/patient profiles, books services |
| **Patient (Elderly)** | Profile managed by a family member; receives care |
| **Caregiver** | Verified professional who accepts and delivers service |
| **Admin** | Verifies caregiver legal IDs/credentials. Minimal frontend — a small protected route set (e.g. `/admin/verifications`) rather than a full dashboard, since verification volume is low. All admin actions are enforced server-side regardless of what the frontend shows. |

---

## 4. System Architecture

```
┌───────────────────┐        HTTPS/REST        ┌──────────────────────┐
│   Next.js Client   │ ───────────────────────▶ │   Express API Server │
│ (React, Tailwind)  │ ◀─────────────────────── │  (Node.js/TypeScript)│
└───────────────────┘        JSON responses     └──────────┬───────────┘
        │  ▲                                                │
        │  │ WebSocket (Socket.io)                          │ Prisma ORM
        ▼  │                                                ▼
┌───────────────────┐                              ┌──────────────────┐
│  Socket.io Server  │                              │   PostgreSQL DB   │
│ (booking/status,   │                              │  (Users, Patients, │
│  care note events) │                              │  Caregivers, etc.)│
└───────────────────┘                              └──────────────────┘
                                                              │
                                                              ▼
                                                   ┌──────────────────────┐
                                                   │ File Storage (S3 /   │
                                                   │ Cloudinary) — ID docs,│
                                                   │ certifications, photos│
                                                   └──────────────────────┘
```

- Frontend never talks to the database directly — everything goes through the Express API.
- Socket.io runs alongside the Express server (same process or a dedicated service) and pushes booking status / care note updates without the client polling.
- File storage is decoupled from the API server so uploaded documents survive redeploys.

---

## 5. End-to-End Flow (Frontend ⇄ Backend)

```
1. Landing Page
2. Register / Login
   └── POST /api/auth/register → backend hashes password (bcrypt), stores user
       └── Caregiver: verificationStatus = "pending" until admin approves
   └── POST /api/auth/login → backend validates credentials → issues access + refresh JWT
3. Dashboard (role-based, gated by decoded JWT `role` + `verificationStatus`)
4. Create Patient Profile → POST /api/patients
5. Select Service → GET /api/services
6. Choose Caregiver & Schedule → GET /api/caregivers?filters...
7. Send Booking Request → POST /api/bookings (status: pending) — no payment step
8. Caregiver Accepts → PATCH /api/bookings/:id/status → Socket.io emits update to family user
9. Service Delivery → caregiver logs care notes → POST /api/bookings/:id/care-notes
10. Completion → PATCH /api/bookings/:id/status (completed) → family user views history, rates caregiver
```

---

## 6. Authentication & Authorization (Full Implementation)

### 6.1 Signup
- `POST /api/auth/register`
- Backend hashes password with `bcrypt` (never store plaintext)
- Family user: created with `role: user`
- Caregiver: created with `role: caregiver`, `verificationStatus: pending` — cannot log into caregiver-only routes until an admin approves
- Legal ID and certification files are uploaded via a separate `multipart/form-data` request (or pre-signed S3 URL flow) and their resulting URLs are attached to the user record

### 6.2 Login
- `POST /api/auth/login` validates credentials against the hashed password
- On success, backend issues:
  - **Access token** (JWT, short-lived — e.g. 15 min), returned in the response body, kept in memory on the client
  - **Refresh token** (longer-lived — e.g. 7 days), set as an `HttpOnly`, `Secure`, `SameSite=Strict` cookie, and also stored server-side (in a `RefreshToken` table) so it can be revoked
- Passwords are never returned in any API response

### 6.3 Token Refresh
- `POST /api/auth/refresh` reads the refresh cookie, validates it against the DB record (not revoked, not expired), issues a new access token
- Axios interceptor on the frontend calls this automatically on a 401
- On refresh failure → clear session, force logout

### 6.4 Logout
- `POST /api/auth/logout` revokes the refresh token server-side (marks it `revoked: true`) and clears the cookie

### 6.5 Route Protection (Backend)
- `authGuard` middleware: verifies JWT signature + expiry on every protected route
- `roleGuard(['caregiver'])` middleware: checks decoded `role` claim
- `verificationGuard` middleware: for caregiver-only routes, checks `verificationStatus === 'approved'` from the DB (not just the JWT claim, since verification status can change after the token was issued)
- **Frontend route guarding is a UX convenience only** — every rule above is re-enforced on the backend, since client-side checks can be bypassed

### 6.6 Admin Verification
- `GET /api/admin/caregivers/pending` — list caregivers awaiting review
- `PATCH /api/admin/caregivers/:id/verify` — body `{ decision: "approved" | "rejected", reason? }`
- Restricted to `role: admin` via `roleGuard`

### 6.7 Sample JWT Payload (unchanged)
```json
{
  "sub": "user_8241",
  "role": "caregiver",
  "verificationStatus": "approved",
  "iat": 1755123456,
  "exp": 1755127056
}
```

---

## 7. Database Schema (PostgreSQL via Prisma)

```prisma
// schema.prisma

generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

enum Role {
  user
  caregiver
  admin
}

enum VerificationStatus {
  pending
  approved
  rejected
}

enum MobilityStatus {
  independent
  assisted
  bedridden
}

enum CaregiverSpecialization {
  nurse
  physiotherapist
  attendant
  general_caregiver
}

enum ServiceCategory {
  medical
  non_medical
  rehabilitation
}

enum BookingStatus {
  pending
  confirmed
  in_progress
  completed
  cancelled
}

model User {
  id                 String    @id @default(uuid())
  fullName           String
  email              String    @unique
  phone              String
  passwordHash       String
  role               Role
  legalIdNumber      String?
  legalIdDocumentUrl String?
  verificationStatus VerificationStatus?
  profilePhotoUrl    String?
  createdAt          DateTime  @default(now())

  patients        Patient[]      @relation("FamilyPatients")
  caregiverProfile Caregiver?
  bookings        Booking[]      @relation("UserBookings")
  refreshTokens   RefreshToken[]
}

model Patient {
  id                    String   @id @default(uuid())
  linkedUserId          String
  linkedUser            User     @relation("FamilyPatients", fields: [linkedUserId], references: [id])
  fullName              String
  age                   Int
  gender                String
  medicalHistory        String?
  mobilityStatus        MobilityStatus
  emergencyContactName  String
  emergencyContactPhone String
  address               String
  photoUrl              String?

  bookings  Booking[]
  careNotes CareNote[]
}

model Caregiver {
  id                   String   @id @default(uuid())
  linkedUserId         String   @unique
  linkedUser           User     @relation(fields: [linkedUserId], references: [id])
  specialization       CaregiverSpecialization
  qualification        String
  yearsExperience      Int
  certificationDocsUrl String[]
  availability         Json      // [{ day, startTime, endTime }]
  rating               Float     @default(0)
  reviewsCount         Int       @default(0)
  serviceAreas         String[]
  verified             Boolean   @default(false)

  bookings  Booking[]
  careNotes CareNote[]
}

model Service {
  id                    String   @id @default(uuid())
  serviceName           String
  description           String
  durationOptions       String[]
  price                 Float
  requiredQualification String
  category              ServiceCategory

  bookings Booking[]
}

model Booking {
  id            String        @id @default(uuid())
  userId        String
  user          User          @relation("UserBookings", fields: [userId], references: [id])
  patientId     String
  patient       Patient       @relation(fields: [patientId], references: [id])
  caregiverId   String
  caregiver     Caregiver     @relation(fields: [caregiverId], references: [id])
  serviceId     String
  service       Service       @relation(fields: [serviceId], references: [id])
  scheduledDate DateTime
  scheduledTime String
  duration      String
  status        BookingStatus @default(pending)
  totalPrice    Float         // display estimate only — no payment tied to this
  createdAt     DateTime      @default(now())

  careNotes CareNote[]
}

model CareNote {
  id             String    @id @default(uuid())
  bookingId      String
  booking        Booking   @relation(fields: [bookingId], references: [id])
  caregiverId    String
  caregiver      Caregiver @relation(fields: [caregiverId], references: [id])
  patientId      String
  patient        Patient   @relation(fields: [patientId], references: [id])
  vitals         Json?
  tasksPerformed String[]
  observations   String?
  timestamp      DateTime  @default(now())
  attachmentUrls String[]
}

model RefreshToken {
  id        String   @id @default(uuid())
  token     String   @unique
  userId    String
  user      User     @relation(fields: [userId], references: [id])
  expiresAt DateTime
  revoked   Boolean  @default(false)
  createdAt DateTime @default(now())
}
```

**Note:** No `paymentStatus` field exists anywhere in this schema — consistent with payment being out of scope.

**Indexing recommendations:** index `Booking.status`, `Booking.userId`, `Booking.caregiverId`, and `User.email` (already unique) for fast dashboard/list queries.

---

## 8. REST API Specification

### 8.1 Auth
| Method | Endpoint | Auth | Description |
|---|---|---|---|
| POST | `/api/auth/register` | Public | Create user or caregiver account |
| POST | `/api/auth/upload-documents` | Bearer (self) | Upload legal ID / certification files for the caller |
| POST | `/api/auth/login` | Public | Validate credentials, issue tokens |
| POST | `/api/auth/refresh` | Refresh cookie | Issue new access token |
| POST | `/api/auth/logout` | Bearer | Revoke refresh token |

### 8.2 Users
| Method | Endpoint | Auth | Description |
|---|---|---|---|
| GET | `/api/users/me` | Bearer | Get own profile |
| PATCH | `/api/users/me` | Bearer | Update own profile |

### 8.3 Patients
| Method | Endpoint | Auth | Description |
|---|---|---|---|
| GET | `/api/patients` | Bearer (user) | List patients linked to the caller |
| POST | `/api/patients` | Bearer (user) | Create a patient profile |
| GET | `/api/patients/:id` | Bearer (owner) | Get one patient |
| PATCH | `/api/patients/:id` | Bearer (owner) | Update patient |
| DELETE | `/api/patients/:id` | Bearer (owner) | Remove patient profile |

### 8.4 Services
| Method | Endpoint | Auth | Description |
|---|---|---|---|
| GET | `/api/services` | Public | List service catalog |
| GET | `/api/services/:id` | Public | Service detail |

### 8.5 Caregivers
| Method | Endpoint | Auth | Description |
|---|---|---|---|
| GET | `/api/caregivers?service=&location=&rating=` | Public | Filtered caregiver listing |
| GET | `/api/caregivers/:id` | Public | Caregiver profile |

### 8.6 Bookings
| Method | Endpoint | Auth | Description |
|---|---|---|---|
| POST | `/api/bookings` | Bearer (user) | Create booking (status: pending) — **no payment step** |
| GET | `/api/bookings` | Bearer | List caller's bookings (as user or caregiver) |
| GET | `/api/bookings/:id` | Bearer (participant) | Booking detail |
| PATCH | `/api/bookings/:id/status` | Bearer (caregiver, or user for cancel) | Transition status: `confirmed` / `in_progress` / `completed` / `cancelled` |

### 8.7 Care Notes
| Method | Endpoint | Auth | Description |
|---|---|---|---|
| POST | `/api/bookings/:id/care-notes` | Bearer (assigned caregiver) | Log a care note |
| GET | `/api/bookings/:id/care-notes` | Bearer (participant) | Timeline of care notes for a booking |

### 8.8 Admin
| Method | Endpoint | Auth | Description |
|---|---|---|---|
| GET | `/api/admin/caregivers/pending` | Bearer (admin) | List pending caregiver verifications |
| PATCH | `/api/admin/caregivers/:id/verify` | Bearer (admin) | Approve or reject |

All endpoints return standard JSON error shapes (`{ "error": { "code", "message" } }`) and standard HTTP status codes (400/401/403/404/409/500).

---

## 9. Real-Time Updates (Socket.io)

| Event | Direction | Payload | Purpose |
|---|---|---|---|
| `booking:statusUpdated` | Server → Client | `{ bookingId, status }` | Push status changes to the family user/caregiver instantly |
| `caregiver:newRequest` | Server → Caregiver | `{ bookingId, summary }` | Notify caregiver of an incoming request |
| `careNote:added` | Server → Client | `{ bookingId, noteId }` | Notify family user a new care note was logged |

Clients join a room per `userId` on connect (authenticated via the access token during the socket handshake) so events are only delivered to relevant participants.

---

## 10. File Storage & Uploads

| Data | Where it's stored | Notes |
|---|---|---|
| Legal ID scans | S3 / Cloudinary (private bucket) | Never served publicly — signed URLs only, viewable by the user and admin |
| Certification docs | S3 / Cloudinary (private bucket) | Same as above |
| Profile photos | S3 / Cloudinary (public bucket or signed URL) | |
| Care note attachments | S3 / Cloudinary | Linked to `CareNote.attachmentUrls` |

Uploads go through `multer` on the backend (memory storage) and are streamed to the storage provider — files are never written to the API server's local disk, which keeps it stateless and safe to redeploy/scale horizontally.

---

## 11. Backend Project Structure

```
/server
  /src
    /config        → db.ts, env.ts, storage.ts
    /routes        → auth.routes.ts, patients.routes.ts, services.routes.ts,
                      caregivers.routes.ts, bookings.routes.ts, careNotes.routes.ts,
                      admin.routes.ts
    /controllers   → auth.controller.ts, patients.controller.ts, ...
    /middleware    → authGuard.ts, roleGuard.ts, verificationGuard.ts,
                      errorHandler.ts, upload.ts, rateLimiter.ts
    /services      → tokenService.ts, notificationService.ts, storageService.ts
    /sockets       → index.ts (Socket.io setup + auth handshake)
    /prisma        → schema.prisma, /migrations
    /utils         → validators (Zod schemas), helpers
  server.ts
  package.json
  .env.example
```

---

## 12. Frontend Project Structure (adapted from original)

Routes and components carry over unchanged from the original frontend spec, with the sole removal of anything payment-related (there was no dedicated payment page in the original route list — the change is confined to the booking confirmation copy and the data model).

```
/                                 → Landing Page
/register                         → Role-based signup
/login                             → Login
/dashboard                         → Role-based dashboard
/patients, /patients/new, /patients/[id]
/services, /services/[id]
/caregivers, /caregivers/[id]
/booking/new                       → Schedule + confirm booking (no payment step)
/bookings, /bookings/[id]
/caregiver/requests
/caregiver/verification-pending
/profile
```

```
/components
  /auth        → LoginForm, RegisterForm, AuthGuard
  /layout      → Navbar, Footer, Sidebar, DashboardLayout
  /patients    → PatientCard, PatientForm, PatientList
  /services    → ServiceCard, ServiceList, ServiceFilter
  /caregivers  → CaregiverCard, CaregiverProfile, CaregiverFilter
  /booking     → BookingForm, ScheduleCalendar, BookingSummary
  /status      → StatusTracker, StatusBadge, NotificationToast
  /careNotes   → CareNoteForm, CareNoteTimeline
  /common      → Button, Input, Modal, Loader, ProtectedRoute
```

---

## 13. Non-Functional Requirements

| Requirement | Detail |
|---|---|
| Security | bcrypt password hashing; short-lived JWT access tokens + rotating refresh tokens; `helmet` for HTTP headers; `express-rate-limit` on auth endpoints; strict CORS allow-list; no sensitive data in localStorage |
| Performance | DB indexes on frequently filtered columns (`status`, foreign keys); pagination on list endpoints; Next.js SSR/ISR for public pages; connection pooling (Prisma) |
| Accessibility | WCAG 2.1 AA across all screens |
| Responsiveness | Fully responsive, mobile-first |
| Scalability | Stateless API (no local file/session storage) so it can run behind a load balancer with multiple instances |
| Reliability | Input validation (Zod) on both client and server; centralized error-handling middleware; structured logging (`pino`) |
| Error Handling | Toast notifications on the frontend; consistent JSON error shape from the backend |

---

## 14. Environment Variables

```
DATABASE_URL=postgresql://user:password@host:5432/elderly_care
JWT_ACCESS_SECRET=
JWT_REFRESH_SECRET=
JWT_ACCESS_EXPIRY=15m
JWT_REFRESH_EXPIRY=7d
CLIENT_URL=https://yourapp.com
PORT=5000

# File storage (pick one)
AWS_ACCESS_KEY_ID=
AWS_SECRET_ACCESS_KEY=
AWS_S3_BUCKET=
# — or —
CLOUDINARY_CLOUD_NAME=
CLOUDINARY_API_KEY=
CLOUDINARY_API_SECRET=
```

---

## 15. Deployment & DevOps

| Piece | Recommendation |
|---|---|
| Frontend | Deploy Next.js to **Vercel** |
| Backend | **Render** or **Railway** for simplicity, or AWS EC2 + PM2 for more control |
| Database | **Supabase** or **Neon** (managed Postgres) for easy setup, or AWS RDS for production scale |
| File Storage | AWS S3 or Cloudinary |
| CI/CD | GitHub Actions: lint → test → build on every PR; auto-deploy on merge to `main` |
| Containerization | Optional `Dockerfile` for the backend so local dev matches production exactly |

---

## 16. Explicitly Out of Scope

- **Payment processing** — no Stripe/Razorpay/gateway integration, no checkout screen, no `paymentStatus` tracking. Bookings are confirmed directly after the summary review. `totalPrice` is shown to the user as an estimate for informational purposes only.
  - *If you ever want to add this later:* it would slot in as an isolated module — a `Payment` table linked to `Booking`, plus a payment-provider webhook handler — without requiring changes to the rest of this schema.

---

## 17. Suggested Build Roadmap

| Phase | Focus |
|---|---|
| 1 | Auth: register/login/refresh, RBAC middleware, caregiver verification gating |
| 2 | Patient profile CRUD |
| 3 | Service catalog + caregiver listing/filtering |
| 4 | Booking flow (create → accept/decline → status transitions) — no payment |
| 5 | Real-time notifications (Socket.io) + care notes |
| 6 | Admin verification workflow |
| 7 | Accessibility pass, responsive QA, deployment |

---

*End of Full-Stack Specification Document.*
