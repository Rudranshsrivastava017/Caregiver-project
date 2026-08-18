# Elderly Nursing & Healthcare Assistance Platform
## Frontend Project Specification Document

---

## 1. Project Overview

**Project Name:** Elderly Nursing & Healthcare Assistance Platform

**Purpose:** A web-based service portal connecting senior citizens and their families with verified healthcare professionals (nurses, caregivers, physiotherapists, attendants) who provide in-home medical and non-medical assistance.

**Core Goals:**
- Improve accessibility to trusted, verified caregivers
- Ensure safety through identity-verified login (JWT + legal ID validation)
- Maintain continuity of care through structured bookings and care notes
- Provide a simple, senior-friendly, and family-friendly interface

**Project Scope:** This is a **frontend-focused** project. Backend/API behavior is described only where it affects frontend architecture (auth flow, data contracts, state management).

---

## 2. Tech Stack

| Layer | Technology |
|---|---|
| Markup / Styling | HTML5, CSS3, JavaScript (ES6+) |
| Framework | React.js (with Next.js for routing, SSR/SEO, and file-based pages) |
| UI Styling | Tailwind CSS (utility-first, responsive) with optional Bootstrap components for quick prototyping |
| State Management | React Context API / Redux Toolkit (for auth state, booking flow) |
| Forms & Validation | React Hook Form + Yup/Zod |
| HTTP Client | Axios (with interceptors for JWT token attachment/refresh) |
| Auth | JWT (JSON Web Token) based authentication, stored in HttpOnly cookies or secure storage |
| Icons/UI Kit | Lucide-react / Heroicons |
| Notifications | React Toastify / Sonner (for booking status updates) |
| Routing | Next.js App Router (or React Router if plain React SPA) |

---

## 3. User Roles

| Role | Description |
|---|---|
| **Family/User** | Registers, manages elderly/patient profiles, books services |
| **Patient (Elderly)** | Profile managed by a family member; receives care |
| **Caregiver** | Verified professional (nurse/attendant/physiotherapist) who accepts and delivers service |
| **Admin (backend-facing, minimal frontend)** | Verifies caregiver legal IDs/credentials before allowing platform access |

---

## 4. End-to-End Webpage Flow

```
1. Landing Page
   └── Learn about platform, services, testimonials, CTA (Register/Login)

2. Register / Login
   └── Role selection: Family User / Caregiver
   └── Caregiver signup requires legal ID + certification upload (verified before activation)
   └── JWT issued only after valid credential + (for caregivers) admin-approved legal ID
   └── Login form → JWT token generated → stored securely → redirect to Dashboard

3. Dashboard (Role-based)
   ├── Family User Dashboard
   │     └── "Add Elderly/Patient Profile" button
   └── Caregiver Dashboard
         └── View incoming service requests

4. Create Elderly/Patient Profile
   └── Form: Name, Age, Gender, Medical History, Emergency Contact, Address, Photo

5. Select Required Care Service
   └── Browse service catalog (Nursing, Physiotherapy, Attendant Care, etc.)
   └── View service details: description, duration, price, required qualification

6. Choose Caregiver & Schedule
   └── Filter caregivers by service type, rating, availability, location
   └── View caregiver profile (verified badge, experience, qualification)
   └── Pick date/time slot (calendar/time-picker UI)

7. Send Service Request (Booking)
   └── Review summary → Confirm & Pay (if applicable) → Booking created (status: Pending)

8. Caregiver Accepts Request
   └── Caregiver sees request in their dashboard → Accept/Decline
   └── On Accept → Booking status: Confirmed → Notification sent to user

9. Service Delivery Begins
   └── Status: In Progress
   └── Caregiver logs Care Notes (vitals, tasks performed, observations)

10. User Receives Updates & Completion Status
    └── Real-time/near-real-time status updates: Pending → Confirmed → In Progress → Completed
    └── User can view Care Notes history, rate caregiver, download service summary
```

### Simplified Flow Diagram (textual)

```
[Landing Page] → [Register/Login] → [JWT Auth Check]
        → [Dashboard] → [Create Patient Profile]
        → [Select Service] → [Choose Caregiver + Schedule]
        → [Send Request] → [Caregiver Accepts]
        → [Service In Progress] → [Care Notes Logged]
        → [Service Completed] → [Feedback + Notification]
```

---

## 5. Authentication & Authorization (JWT)

### 5.1 Principle
No user (family user OR caregiver) can access protected routes without a valid JWT. Caregivers additionally cannot even complete registration without submitting a **legal/government ID** and professional certification, which must pass verification before their account is activated.

### 5.2 Auth Flow

1. **Signup**
   - Family User: Name, Email, Phone, Password, (optional) Legal ID for identity trust
   - Caregiver: Name, Email, Phone, Password, **Legal ID (mandatory)**, Certification/License Upload, Qualification, Experience
   - Caregiver account status = `pending_verification` until admin approves the legal ID/certification

2. **Login**
   - Credentials validated on backend → JWT (access token, short-lived) + Refresh Token issued
   - Access token stored in memory/HttpOnly cookie (avoid localStorage for security)
   - Refresh token stored in HttpOnly, Secure, SameSite cookie

3. **Route Protection (Frontend)**
   - Protected routes (Dashboard, Booking, Profile, Care Notes) wrapped in an `AuthGuard` / `withAuth` HOC or Next.js Middleware
   - Middleware checks JWT validity on every protected route request
   - If token invalid/expired → redirect to `/login`
   - If caregiver `verificationStatus !== "approved"` → redirect to a "Pending Verification" screen (cannot access caregiver dashboard/requests)

4. **Token Refresh**
   - Axios interceptor auto-refreshes access token using refresh token before it expires
   - On refresh failure → force logout

5. **Role-Based Access Control (RBAC)**
   - JWT payload includes `role` (`user`, `caregiver`, `admin`) and `verified` flag
   - Frontend renders UI conditionally based on decoded role/claims (never trust client-side role alone — backend must also enforce, but frontend restricts navigation/UI accordingly)

### 5.3 Sample JWT Payload
```json
{
  "sub": "user_8241",
  "role": "caregiver",
  "name": "Anita Sharma",
  "legalIdVerified": true,
  "verificationStatus": "approved",
  "iat": 1755123456,
  "exp": 1755127056
}
```

---

## 6. Data Requirements (Frontend Data Models)

These represent the shape of data the frontend expects from/sends to the API — useful for building forms, types (TypeScript interfaces), and mock data during UI development.

### 6.1 Users
| Field | Type | Notes |
|---|---|---|
| userId | string (UUID) | Primary identifier |
| fullName | string | |
| email | string | Unique, used for login |
| phone | string | |
| passwordHash | string | Never exposed to frontend |
| role | enum: `user`, `caregiver`, `admin` | |
| legalIdNumber | string | Government ID number |
| legalIdDocumentUrl | string | Uploaded ID scan (caregivers mandatory) |
| verificationStatus | enum: `pending`, `approved`, `rejected` | Caregiver only |
| profilePhotoUrl | string | |
| createdAt | datetime | |

### 6.2 Patients (Elderly Profiles)
| Field | Type | Notes |
|---|---|---|
| patientId | string (UUID) | |
| linkedUserId | string | Family user who owns this profile |
| fullName | string | |
| age | number | |
| gender | enum | |
| medicalHistory | text | Chronic conditions, allergies, medications |
| mobilityStatus | enum: `independent`, `assisted`, `bedridden` | |
| emergencyContactName | string | |
| emergencyContactPhone | string | |
| address | string | |
| photoUrl | string | |

### 6.3 Caregivers
| Field | Type | Notes |
|---|---|---|
| caregiverId | string (UUID) | |
| linkedUserId | string | FK to Users |
| specialization | enum: `nurse`, `physiotherapist`, `attendant`, `general_caregiver` | |
| qualification | string | e.g., GNM, B.Sc Nursing, DPT |
| yearsExperience | number | |
| certificationDocsUrl | string[] | |
| availability | array of `{day, startTime, endTime}` | |
| rating | number (avg) | |
| reviewsCount | number | |
| serviceAreas | string[] | Pincodes/localities served |
| verified | boolean | |

### 6.4 Services
| Field | Type | Notes |
|---|---|---|
| serviceId | string (UUID) | |
| serviceName | string | |
| description | text | |
| durationOptions | array | e.g., `["1 hr", "4 hr", "12 hr", "24 hr"]` |
| price | number | Per selected duration/unit |
| requiredQualification | string | Qualification a caregiver must hold to offer this service |
| category | enum: `medical`, `non_medical`, `rehabilitation` | |

### 6.5 Bookings
| Field | Type | Notes |
|---|---|---|
| bookingId | string (UUID) | |
| userId | string | Requesting family user |
| patientId | string | Elderly profile receiving care |
| caregiverId | string | Assigned caregiver |
| serviceId | string | Selected service |
| scheduledDate | date | |
| scheduledTime | time | |
| duration | string | |
| status | enum: `pending`, `confirmed`, `in_progress`, `completed`, `cancelled` | |
| totalPrice | number | |
| paymentStatus | enum: `unpaid`, `paid`, `refunded` | |
| createdAt | datetime | |

### 6.6 Care Notes
| Field | Type | Notes |
|---|---|---|
| noteId | string (UUID) | |
| bookingId | string | Linked booking/session |
| caregiverId | string | Author |
| patientId | string | Subject |
| vitals | object | e.g., `{bp, pulse, temperature, sugarLevel}` |
| tasksPerformed | string[] | e.g., `["medication given", "physiotherapy session"]` |
| observations | text | Free-text notes |
| timestamp | datetime | |
| attachmentUrls | string[] | Optional photos/reports |

---

## 7. Sample Service Data

```json
[
  {
    "serviceId": "SVC001",
    "serviceName": "Elderly Home Nursing Care",
    "description": "Skilled nursing support for medication management, wound care, and vital monitoring at home.",
    "durationOptions": ["4 hr", "12 hr", "24 hr"],
    "price": 800,
    "requiredQualification": "B.Sc Nursing / GNM",
    "category": "medical"
  },
  {
    "serviceId": "SVC002",
    "serviceName": "Physiotherapy Session",
    "description": "In-home physiotherapy for mobility recovery, joint pain, and post-surgery rehabilitation.",
    "durationOptions": ["1 hr"],
    "price": 600,
    "requiredQualification": "Doctor of Physiotherapy (DPT/BPT)",
    "category": "rehabilitation"
  },
  {
    "serviceId": "SVC003",
    "serviceName": "General Attendant Care",
    "description": "Non-medical assistance including mobility support, feeding, bathing, and companionship.",
    "durationOptions": ["8 hr", "12 hr", "24 hr"],
    "price": 500,
    "requiredQualification": "Certified Home Attendant Training",
    "category": "non_medical"
  }
]
```

---

## 8. Page/Route Structure (Next.js)

```
/                         → Landing Page
/register                 → Role-based signup (User / Caregiver)
/login                    → Login page
/dashboard                → Role-based dashboard (redirect logic via middleware)
/patients                 → List of elderly profiles (Family User)
/patients/new             → Create patient profile
/patients/[id]            → Patient profile detail
/services                 → Browse service catalog
/services/[id]            → Service detail + "Book Now"
/caregivers                → Caregiver listing/filter
/caregivers/[id]          → Caregiver profile
/booking/new              → Schedule + confirm booking
/bookings                 → My bookings (status tracker)
/bookings/[id]            → Booking detail + care notes timeline
/caregiver/requests       → Incoming requests (Caregiver role)
/caregiver/verification-pending → Shown if legal ID not yet approved
/profile                  → Account settings
```

---

## 9. Key UI/UX Principles (Senior-Friendly Design)

- Large, legible fonts and high-contrast color palette (Tailwind: soft blues/greens, avoid low-contrast grays)
- Minimal steps per screen; clear back/next navigation
- Iconography paired with text labels (avoid icon-only actions)
- Status badges for bookings (color-coded: yellow = pending, blue = confirmed, green = completed)
- Mobile-first responsive layout (many family members will book via phone)
- Accessible components (ARIA labels, keyboard navigation, screen-reader support)
- Trust signals throughout: "Verified Caregiver" badge, ID-verified checkmark, ratings/reviews

---

## 10. Non-Functional Requirements

| Requirement | Detail |
|---|---|
| Security | JWT with short-lived access tokens + refresh rotation; no sensitive data in localStorage |
| Performance | Next.js SSR/ISR for landing/service pages; lazy-loaded dashboard components |
| Accessibility | WCAG 2.1 AA compliance for elderly/family users |
| Responsiveness | Fully responsive across mobile, tablet, desktop |
| Scalability | Component-driven architecture (reusable Card, Modal, Form components) |
| Error Handling | Toast notifications for failed requests, form validation errors inline |

---

## 11. Suggested Component Breakdown (React)

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

*End of Specification Document.*
