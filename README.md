# 🌿 CareElderly — Elderly Nursing & Healthcare Assistance Platform

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Node.js Version](https://img.shields.io/badge/Node.js-18%2B%20LTS-339933?logo=node.js&logoColor=white)](https://nodejs.org/)
[![React Version](https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=black)](https://react.dev/)
[![Vite](https://img.shields.io/badge/Vite-8.2-646CFF?logo=vite&logoColor=white)](https://vitejs.dev/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-v4-06B6D4?logo=tailwindcss&logoColor=white)](https://tailwindcss.com/)
[![Socket.io](https://img.shields.io/badge/Socket.io-v4-010101?logo=socket.io&logoColor=white)](https://socket.io/)
[![Express.js](https://img.shields.io/badge/Express.js-4.21-000000?logo=express&logoColor=white)](https://expressjs.com/)
[![Test Suite](https://img.shields.io/badge/Tests-7%20Suites%20Passed-success?logo=checkmarx&logoColor=white)](#-testing--automated-verification)

> A modern, production-grade, full-stack healthcare assistance web platform connecting senior citizens and their families with verified, licensed healthcare professionals (nurses, physiotherapists, attendants) for structured in-home care. Built with real-time clinical care logs, conflict-free shift scheduling, dual-mode data persistence, and an administrative credential verification portal.

---

## 📌 Table of Contents

- [Vision & Core Problem](#-vision--core-problem)
- [Key Features](#-key-features)
- [System Architecture](#-system-architecture)
- [Tech Stack](#-tech-stack)
- [Role-Based Workflows](#-role-based-workflows)
- [Conflict Prevention & Booking Lifecycle](#-conflict-prevention--booking-lifecycle)
- [Quick Start & Installation](#-quick-start--installation)
- [Pre-Seeded Demo Accounts](#-pre-seeded-demo-accounts)
- [REST API Reference](#-rest-api-reference)
- [Testing & Automated Verification](#-testing--automated-verification)
- [Project Structure](#-project-structure)
- [Security & Architecture Hardening](#-security--architecture-hardening)
- [Roadmap & Enhancements](#-roadmap--enhancements)
- [License](#-license)

---

## 💡 Vision & Core Problem

Aging populations often require dedicated post-operative care, palliative assistance, or chronic disease management at home. However, families struggle with:
1. **Lack of Trust & Credential Verification**: Unvetted caregivers posing safety and medical risks.
2. **Fragmented Communication**: Family members having zero visibility into what transpires during care shifts.
3. **Double-Booking & Scheduling Chaos**: Unreliable shifts and conflicting schedules.
4. **Clinical Data Discontinuity**: Missing records of vital signs (blood pressure, blood glucose, SpO2) between doctor visits.

**CareElderly** solves this by establishing a secure, end-to-end operational platform combining identity verification, double-booking prevention, real-time WebSocket notifications, and structured clinical care note logging.

> **Zero-Payment Policy**: In strict accordance with the platform specification, online payment gateway processing is intentionally excluded. Shift prices are calculated and displayed solely as transparent informational cost estimates.

---

## ✨ Key Features

### 👨‍👩‍👧 For Families & Senior Citizens
- **Elderly Patient Profiles**: Manage comprehensive clinical records for relatives including chronic conditions, active medications, blood group, mobility status (*ambulatory*, *walker*, *wheelchair*, *bedridden*), and emergency contacts.
- **Ownership Isolation Guard**: Strict multi-tenant security ensures families can only access and book care for their registered relatives (`403 Forbidden` enforced server-side).
- **Caregiver Directory & Advanced Filtering**: Browse verified medical staff filtered by specialization (*Registered Nurse*, *Physiotherapist*, *Attendant*), locality, minimum ratings (4.5★+), and availability.
- **Smart Shift Scheduling Wizard**: Interactive booking flow checking real-time caregiver calendars to guarantee zero scheduling conflicts.
- **Live Clinical Care Notes Timeline**: Monitor vital signs logged during shifts in real time without refreshing the page.
- **Instant Shift Cancellation**: Free booked slots immediately if plans change, returning the shift to the public availability pool.

### 🩺 For Caregivers (Nurses, Physiotherapists, Attendants)
- **Credentialed Onboarding**: Register with nursing licenses, qualifications, and legal identity documents. New accounts remain in a protected `pending` state until reviewed by an administrator.
- **Real-Time Shift Inbox**: Receive incoming hire requests via WebSocket notifications and accept or decline shifts.
- **Lifecycle Shift Tracker**: Step-by-step state management (`pending` $\to$ `confirmed` $\to$ `in_progress` $\to$ `completed`).
- **Digital Clinical Care Note Logging**: Record objective medical vitals during active shifts:
  - Blood Pressure (e.g., `120/80 mmHg`)
  - Heart Rate / Pulse (`bpm`)
  - Temperature (`°F`)
  - Blood Glucose (`mg/dL`)
  - Oxygen Saturation (`SpO2 %`)
  - Tasks executed & behavioral observations.

### 🛡️ For Platform Administrators
- **Caregiver Credential Inspection Queue**: Review license numbers, uploaded identification documents, and background submissions.
- **1-Click Approvals & Structured Feedback**: Instantly approve caregivers to activate their public directory profile or provide structured rejection reasoning.
- **Executive Operational KPI Dashboard**: Real-time platform metrics aggregating active shifts, verified staff ratio, patient volume, and booking statuses.

---

## 🏛️ System Architecture

```mermaid
flowchart TD
    subgraph Client ["Client Layer (React 19 + Vite)"]
        UI["Web App (Tailwind CSS v4)"]
        AuthCtx["In-Memory Auth Context"]
        SocketCtx["Socket.io Client (Real-Time)"]
    end

    subgraph Server ["Server Layer (Node.js + Express)"]
        Gateway["Express REST API (/api/v1)"]
        SocketGateway["Socket.io Server (Private User Rooms)"]
        Security["Security Layer: Helmet + Rate Limiter + JWT Guards"]
    end

    subgraph Persistence ["Dual-Mode Persistence Layer"]
        Detector{"MongoDB Active?"}
        Mongo[("MongoDB (Mongoose)")]
        MemoryStore[("Atomic In-Memory Store Adapter")]
    end

    subgraph External ["External Services"]
        SMTP["Nodemailer SMTP (Email Verification)"]
        GoogleAuth["Google OAuth 2.0"]
    end

    UI -->|HTTPS REST| Security
    Security --> Gateway
    UI <-->|Bidirectional WebSockets| SocketGateway
    AuthCtx -->|Bearer JWT Header| Gateway
    Gateway --> Detector
    Detector -->|Yes| Mongo
    Detector -->|No / Offline| MemoryStore
    Gateway -->|Transactional Emails| SMTP
    Gateway -->|ID Token Verification| GoogleAuth
```

---

## 🛠️ Tech Stack

### Frontend
- **Framework**: [React 19](https://react.dev/) + [Vite 8](https://vitejs.dev/)
- **Styling**: [Tailwind CSS v4](https://tailwindcss.com/)
- **Icons**: [Lucide React](https://lucide.dev/)
- **State & Context**: React Context API (AuthContext, SocketContext)
- **Forms & Validation**: [React Hook Form](https://react-hook-form.com/) + [Zod](https://zod.dev/)
- **Networking**: [Axios](https://axios-http.com/) (configured with in-memory token attach and automated 401 refresh interceptors)
- **Real-Time Client**: [Socket.io-client](https://socket.io/)
- **Notifications**: [Sonner](https://sonner.emilkowal.ski/) Toasts

### Backend
- **Runtime**: [Node.js](https://nodejs.org/) (LTS)
- **Framework**: [Express.js 4](https://expressjs.com/)
- **Real-Time Engine**: [Socket.io 4](https://socket.io/) (room-isolated per authenticated user)
- **Database & ORM**: [Mongoose 8](https://mongoosejs.com/) (MongoDB) + **Atomic In-Memory Store Adapter**
- **Authentication**: JWT (`jsonwebtoken`) + [bcryptjs](https://github.com/dcodeIO/bcrypt.js) password hashing + Google OAuth
- **Security & Hardening**: [Helmet](https://helmetjs.github.io/), [express-rate-limit](https://express-rate-limit.mintlify.app/), [cookie-parser](https://github.com/expressjs/cookie-parser) (`SameSite=Strict`, `HttpOnly` refresh tokens)
- **Transactional Email**: [Nodemailer](https://nodemailer.com/) (SMTP with zero-config console fallback)

---

## 👥 Role-Based Workflows

```mermaid
journey
    title User Journeys Across Platform Roles
    section Family Member
      Register Account: 5: Family User
      Add Elderly Relative Profile: 5: Family User
      Browse Verified Staff: 4: Family User
      Book Morning Shift: 5: Family User
      Receive Real-Time Updates: 5: Family User
      Review Vitals & Care Notes: 5: Family User
    section Caregiver
      Apply with License Docs: 4: Caregiver
      Wait for Admin Review: 3: Caregiver
      Receive Shift Alert: 5: Caregiver
      Confirm Shift & Start: 5: Caregiver
      Log Clinical Vitals: 5: Caregiver
      Complete Shift: 5: Caregiver
    section Administrator
      Inspect Verification Queue: 5: Admin
      Verify ID & License: 5: Admin
      Approve Caregiver: 5: Admin
      View Operational Analytics: 5: Admin
```

---

## ⏱️ Conflict Prevention & Booking Lifecycle

### Double-Booking Prevention Algorithm
To protect patients and healthcare workers, `backend/controllers/bookingController.js` enforces strict collision checks:
1. Validates the caregiver's existing shifts on the selected date.
2. Checks slot overlap rules:
   - Exact slot collisions (e.g., `Morning` vs `Morning`)
   - `24 Hours` shifts block all morning, afternoon, evening, and night slots.
   - `Day Shift` blocks morning and afternoon slots.
3. If an overlap is detected on any `pending`, `confirmed`, or `in_progress` shift, the API immediately rejects the request with **HTTP `409 Conflict`** (`SLOT_ALREADY_BOOKED`).
4. When a user cancels a shift, the status moves to `cancelled`, and the calendar slot is instantly freed for other families.

```mermaid
stateDiagram-v2
    [*] --> pending: Family creates booking
    pending --> confirmed: Caregiver accepts shift
    pending --> cancelled: Family cancels (Slot Released)
    confirmed --> in_progress: Caregiver begins shift
    confirmed --> cancelled: Either party cancels (Slot Released)
    in_progress --> completed: Shift finishes & Notes logged
    completed --> [*]
    cancelled --> [*]
```

---

## 🚀 Quick Start & Installation

### Prerequisites
- [Node.js](https://nodejs.org/) v18.0.0 or higher
- [npm](https://www.npmjs.com/) v9.0.0 or higher
- *(Optional)* [MongoDB](https://www.mongodb.com/) (If MongoDB is not installed, the platform **automatically runs in zero-config In-Memory mode**!)

### 1. Clone the Repository
```bash
git clone https://github.com/your-username/caregiver-platform.git
cd caregiver-platform
```

### 2. Backend Setup
```bash
cd backend
npm install
```

Create a `.env` file in the `backend/` directory (or copy from `.env.example`):
```env
PORT=5000
NODE_ENV=development
MONGO_URI=mongodb://127.0.0.1:27017/caregiver_db
JWT_ACCESS_SECRET=super_secret_access_key_2026
JWT_ACCESS_EXPIRES_IN=15m
JWT_REFRESH_SECRET=super_secret_refresh_key_2026
JWT_REFRESH_EXPIRES_IN=7d
CLIENT_URL=http://localhost:5173

# Optional: SMTP Configuration (Defaults to dev console logger if omitted)
# SMTP_HOST=smtp.gmail.com
# SMTP_PORT=587
# SMTP_USER=your_email@gmail.com
# SMTP_PASS=your_app_password
```

Start the backend server:
```bash
# Development mode with hot-reloading
npm run dev

# Or standard start
npm start
```
*The server will start at `http://localhost:5000` with pre-seeded demo accounts ready for use.*

### 3. Frontend Setup
In a new terminal window:
```bash
cd frontend
npm install
```

Create a `.env` file in the `frontend/` directory (or copy from `.env.example`):
```env
VITE_API_BASE_URL=http://localhost:5000/api/v1
```

Start the frontend development server:
```bash
npm run dev
```
*Open `http://localhost:5173` in your browser.*

---

## 🔑 Pre-Seeded Demo Accounts

The platform includes pre-seeded demo credentials for instant 1-click testing. On the `/login` page, you can either click the **1-Click Test Login Presets** or manually enter:

| Role | Email | Password | Pre-loaded Data / Capabilities |
|---|---|---|---|
| 👨‍👩‍👧 **Family User** | `vikram@careelderly.org` | `password123` | Linked patient (*Savitri Devi*), existing booking history |
| 🩺 **Nurse Caregiver** | `anita.nurse@careelderly.org` | `password123` | Verified Registered Nurse, assigned shifts, can log vitals |
| 🛡️ **Platform Admin** | `admin@careelderly.org` | `password123` | Full access to `/admin` and `/admin/verifications` queue |
| ⏳ **Pending Caregiver** | `pending.caregiver@careelderly.org` | `password123` | Awaiting admin review (ideal for testing verification flow) |

---

## 📡 REST API Reference

All primary endpoints are prefixed with `/api/v1`.

### 🔐 Authentication (`/api/v1/auth`)
| Method | Endpoint | Access | Description |
|---|---|---|---|
| `POST` | `/auth/register` | Public | Register new Family User or Caregiver |
| `POST` | `/auth/login` | Public | Login with email/password; receives access token & sets HttpOnly cookie |
| `POST` | `/auth/google` | Public | Authenticate via Google OAuth credential |
| `GET` | `/auth/me` | Bearer | Get authenticated user profile |
| `POST` | `/auth/refresh` | Public (Cookie) | Rotate and refresh access token |
| `POST` | `/auth/logout` | Bearer | Clear refresh token cookie & terminate session |
| `GET` | `/auth/verify-email` | Public | Verify email address using cryptographic token |
| `POST` | `/auth/resend-verification` | Bearer | Re-trigger verification email dispatch |

### 👵 Elderly Patients (`/api/v1/patients`)
| Method | Endpoint | Access | Description |
|---|---|---|---|
| `GET` | `/patients` | Bearer (User/Admin) | List caller's registered elderly patients |
| `POST` | `/patients` | Bearer (User/Admin) | Register new patient with medical history & vitals baseline |
| `GET` | `/patients/:id` | Bearer (Owner/Admin) | Get patient clinical profile (`403` if not owner) |
| `PUT` | `/patients/:id` | Bearer (Owner/Admin) | Update medical records or emergency contact |
| `DELETE` | `/patients/:id` | Bearer (Owner/Admin) | Remove patient record |

### 🏥 Healthcare Services & Catalog (`/api/v1/services`)
| Method | Endpoint | Access | Description |
|---|---|---|---|
| `GET` | `/services` | Public | List catalog services (filterable by `category`, `search`) |
| `GET` | `/services/:id` | Public | Retrieve single service details & pricing estimates |
| `POST` | `/services` | Bearer (Admin) | Add new healthcare service to catalog |

### 🩺 Caregiver Directory (`/api/v1/caregivers`)
| Method | Endpoint | Access | Description |
|---|---|---|---|
| `GET` | `/caregivers` | Public | List verified caregivers (`specialization`, `location`, `minRating`) |
| `GET` | `/caregivers/:id` | Public | View caregiver bio, verified licenses, and weekly availability |

### 📅 Shift Bookings (`/api/v1/bookings`)
| Method | Endpoint | Access | Description |
|---|---|---|---|
| `POST` | `/bookings` | Bearer (User) | Create new booking request with 409 conflict detection |
| `GET` | `/bookings` | Bearer | Retrieve bookings for current user or caregiver |
| `GET` | `/bookings/:id` | Bearer (Participant) | View booking details with populated patient & staff records |
| `PUT` | `/bookings/:id/status` | Bearer (Participant) | Transition shift state (`confirmed`, `in_progress`, `completed`, `cancelled`) |
| `GET` | `/bookings/availability` | Public | Query booked shifts for a specific caregiver and date |

### 📋 Clinical Care Notes & Vitals (`/api/v1/care-notes`)
| Method | Endpoint | Access | Description |
|---|---|---|---|
| `POST` | `/care-notes` | Bearer (Caregiver) | Log clinical observations and vitals (BP, HR, SpO2, Temp, Sugar) |
| `GET` | `/care-notes/booking/:bookingId` | Bearer (Participant) | Chronological vitals timeline for a specific care shift |
| `GET` | `/care-notes/patient/:patientId` | Bearer (Owner/Staff) | Full longitudinal clinical history for an elderly patient |

### 🛡️ Administrative Portal (`/api/v1/admin`)
| Method | Endpoint | Access | Description |
|---|---|---|---|
| `GET` | `/admin/caregivers/pending` | Bearer (Admin) | Retrieve queue of caregivers awaiting credential verification |
| `PUT` | `/admin/caregivers/:id/verify` | Bearer (Admin) | Approve caregiver license & activate public profile |
| `PUT` | `/admin/caregivers/:id/reject` | Bearer (Admin) | Reject caregiver submission with structured feedback |
| `GET` | `/admin/analytics` | Bearer (Admin) | Platform operational metrics, shift volumes, and ratios |

---

## 🧪 Testing & Automated Verification

The backend includes a comprehensive, multi-phase automated test suite with **100% test pass rate across 7 test suites (36+ assertions)**.

To execute all test suites sequentially:
```bash
cd backend
npm test
```

### Individual Test Suites
```bash
# 1. Core Domain Architecture & In-Memory Adapter
node backend/test_setup.js

# 2. Patient CRUD & Ownership Security Guard (403 Tests)
node backend/test_patient_routes.js

# 3. Healthcare Catalog & Caregiver Filtering
node backend/test_catalog_routes.js

# 4. Booking Engine & 409 Double-Booking Conflict Prevention
node backend/test_booking_routes.js

# 5. Care Notes Vitals & Socket.io Event Handlers
node backend/test_phase5_carenote_and_socket.js

# 6. Admin Verification Portal & KPI Analytics
node backend/test_admin_routes.js

# 7. Helmet Security Headers & Rate Limiting Hardening
node backend/test_step1_security_headers_and_ratelimit.js
```

### Frontend Build Verification
Verify production bundle compilation with zero errors:
```bash
cd frontend
npm run build
```

---

## 📁 Project Structure

```text
caregiver-platform/
├── backend/
│   ├── config/
│   │   └── db.js                 # Dual-mode DB connector (Mongoose / In-Memory fallback)
│   ├── controllers/
│   │   ├── adminController.js    # Caregiver credential verification & metrics
│   │   ├── authController.js     # Auth, JWT tokens, email verification, Google OAuth
│   │   ├── bookingController.js  # Booking engine, 409 conflict checks, state machine
│   │   ├── careNoteController.js # Clinical vitals logging & history
│   │   ├── caregiverController.js# Verified staff directory & filter queries
│   │   ├── patientController.js  # Patient CRUD with ownership security guard
│   │   └── serviceController.js  # Healthcare service catalog endpoints
│   ├── middlewares/
│   │   ├── authMiddleware.js     # JWT extraction, verification & session attachment
│   │   ├── errorMiddleware.js    # Standardized error responder
│   │   └── roleMiddleware.js     # RBAC (roleGuard & verificationGuard)
│   ├── models/                   # Dual-mode schemas (MongoDB / In-Memory Map adapters)
│   │   ├── Booking.js
│   │   ├── CareNote.js
│   │   ├── Caregiver.js
│   │   ├── Patient.js
│   │   ├── Service.js
│   │   └── User.js
│   ├── routes/                   # Express REST route definitions
│   ├── services/
│   │   └── emailService.js       # Nodemailer SMTP with dev console fallback
│   ├── sockets/
│   │   └── index.js              # Socket.io gateway with user room isolation
│   ├── server.js                 # Server entry point & test fixture seeder
│   └── package.json
│
├── frontend/
│   ├── src/
│   │   ├── api/
│   │   │   └── axiosClient.js    # In-memory JWT attach & 401 refresh interceptors
│   │   ├── components/
│   │   │   ├── auth/             # ProtectedRoute guards & role redirection
│   │   │   ├── booking/          # ScheduleCalendar, BookingSummary, conflict flags
│   │   │   ├── careNotes/        # CareNoteForm modal & CareNoteTimeline
│   │   │   ├── caregivers/       # CaregiverCard, filters, badge indicators
│   │   │   ├── layout/           # Navbar with SOS Hotline banner, Footer
│   │   │   ├── patients/         # PatientCard, PatientForm with mobility tags
│   │   │   ├── services/         # ServiceCard & category filters
│   │   │   └── status/           # Standardized lifecycle StatusBadges
│   │   ├── context/
│   │   │   ├── AuthContext.jsx   # In-memory JWT token state & user session
│   │   │   └── SocketContext.jsx # Real-time event subscription & Sonner toasts
│   │   ├── pages/
│   │   │   ├── AdminDashboardPage.jsx        # Platform metrics & KPIs
│   │   │   ├── BookingDetailPage.jsx        # Shift tracker & live care notes
│   │   │   ├── BookingsPage.jsx             # Active & historical shifts
│   │   │   ├── CaregiverDetailPage.jsx      # Doctor/nurse qualifications & booking
│   │   │   ├── CaregiverPendingPage.jsx     # Waiting state for unverified caregivers
│   │   │   ├── CaregiverVerificationPage.jsx# Admin document review queue
│   │   │   ├── CaregiversPage.jsx           # Staff directory
│   │   │   ├── LandingPage.jsx              # Hero, services, testimonials
│   │   │   ├── LoginPage.jsx                # 1-click demo login presets
│   │   │   ├── NewBookingPage.jsx           # 3-step scheduling wizard
│   │   │   ├── PatientsPage.jsx             # Family patient roster
│   │   │   ├── RegisterPage.jsx             # User & Caregiver registration
│   │   │   └── VerifyEmailPage.jsx          # Token verification landing screen
│   │   ├── routes/
│   │   │   └── AppRoutes.jsx                # Client routing tree
│   │   ├── App.jsx
│   │   └── main.jsx
│   ├── index.html
│   ├── vite.config.js
│   └── package.json
│
└── README.md
```

---

## 🔒 Security & Architecture Hardening

| Protection Layer | Implementation Mechanism | Benefit |
|---|---|---|
| **Token Storage** | Access token stored in-memory (`axiosClient.js`) | Eliminates XSS token exfiltration vulnerabilities |
| **Session Rotation** | Refresh token stored in `HttpOnly`, `SameSite=Strict` cookie | Protects long-lived sessions with automatic silent renewal |
| **Password Security** | `bcryptjs` with salt rounds = 10 | Resistant against rainbow table attacks |
| **HTTP Headers** | `helmet` middleware enabled | Mitigates MIME sniffing, clickjacking, and XSS attacks |
| **Rate Limiting** | `express-rate-limit` scoped to `/auth` endpoints | Prevents brute-force login and credential-stuffing attacks |
| **Tenant Isolation** | `patient.linkedUserId === req.user.userId` | Prevents unauthorized cross-family data access |
| **Conflict Safety** | Atomic overlap query in `bookingController.js` | Prevents double-booking same caregiver across identical shifts |
| **Email Verification** | Server-side cryptographically signed token | Prevents identity spoofing; graceful fallback in dev |

---

## 🗺️ Roadmap & Enhancements

- [x] Phase 1: Authentication & Role-Based Access Control
- [x] Phase 2: Patient Profile Management & Ownership Isolation
- [x] Phase 3: Healthcare Catalog & Verified Caregiver Directory
- [x] Phase 4: Conflict-Free Scheduling & Double-Booking Prevention
- [x] Phase 5: Real-Time WebSocket Notifications & Clinical Care Notes
- [x] Phase 6: Admin Credential Verification Portal & Operational Analytics
- [x] Phase 7: Security Hardening (Helmet, Rate Limiting, SMTP Email Verification)
- [ ] Phase 8: WebRTC In-App Video Consultations between Family & Nurses
- [ ] Phase 9: Multi-Lingual Support (i18n for Regional Indian Languages)
- [ ] Phase 10: Native Mobile Companion App (React Native)

---

## 📄 License

This project is licensed under the [MIT License](LICENSE).

---

<p align="center">
  Built with ❤️ for seniors and their families.
</p>
