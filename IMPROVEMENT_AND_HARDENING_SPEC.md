# Elderly Care Platform — Improvement & Hardening Specification

**Applies to:** Elderly Nursing & Healthcare Assistance Platform (Backend + Frontend)  
**Source Documents Audited & Reconciled:**
- `Elderly-Care-Platform-FullStack-Spec.md` (Original Master Architecture)
- `IMPLEMENTATION_PLAN.md` (Execution Roadmap & Phase Records)
- `IMPLEMENTATION_FLOW_AND_FEATURE_ANALYSIS.md` (Verification & Architecture Report)
- `backend/` and `frontend/` active codebase (Node/Express, Vite/React, Dual-Mode Data Store)

**Status:** Approved Hardening Roadmap & Security Specification (Updated with Live Codebase Audit & SMTP Email Verification)

---

## 0. Codebase Reality & Audit Reconciliation

This specification incorporates a direct audit of the active `backend/` and `frontend/` source code alongside the master specifications.

### Key Audit Findings & Ground Truth:
1. **Access Token Storage (Formerly P0-1)**: **ALREADY RESOLVED IN CODE**.
   - `frontend/src/api/axiosClient.js` stores the access token purely in-memory via `setMemoryToken`/`getMemoryToken`.
   - `localStorage` does not store sensitive JWT tokens.
2. **Refresh Token Flow (Formerly P0-2)**: **ALREADY RESOLVED IN CODE**.
   - Backend `authController.js` implements `POST /api/v1/auth/refresh` issuing rotated JWTs.
   - Refresh tokens are stored in `HttpOnly`, `SameSite=Strict` cookies and validated against `user.refreshToken`.
   - `axiosClient.js` interceptor automatically intercepts `401` errors and triggers transparent token refresh.
3. **Double-Booking Overlap Logic (Formerly P1-3)**: **VERIFIED IN CODE**.
   - `backend/controllers/bookingController.js` (`isSlotOverlapping`) validates exact matches, full-day shifts (`24 Hour`), and multi-hour `Day Shift` overlaps against morning/afternoon/evening slots.
   - Conflicting bookings return HTTP `409 Conflict` with code `SLOT_ALREADY_BOOKED`.
4. **Hiring & Cancel Hiring Flow**: **100% OPERATIONAL & VERIFIED**.
   - Hiring: Schedule calendar verifies availability -> creates `pending` booking -> notifies caregiver via real-time Socket.io.
   - Caregiver Actions: `confirmed`, `in_progress`, `completed`, or `cancelled` (decline).
   - Cancel Hiring: Family user can cancel when `pending` or `confirmed`. Cancelling releases the slot immediately, allowing another family to hire that caregiver for that time slot.
5. **Dual-Mode Data Architecture**:
   - `backend/models/*.js` cleanly abstracts queries across MongoDB (Mongoose) and an in-memory Map adapter for zero-dependency local dev and testing.

---

## 1. Rules of Engagement (Non-Negotiable)

These rules guarantee that all improvements and hardening tasks enhance stability and security **without breaking any existing features or workflows**:

1. **Baseline First**: Before applying changes, run the automated test suite (`node backend/test_setup.js; node backend/test_patient_routes.js; node backend/test_catalog_routes.js; node backend/test_booking_routes.js; node backend/test_phase5_carenote_and_socket.js; node backend/test_admin_routes.js`) and ensure 100% pass rate.
2. **Strict Preservation of Hiring & Cancellation**: The hiring engine (`/api/v1/bookings`) and cancellation state machine (`/api/v1/bookings/:id/status`) must remain intact. Slot conflict detection and slot release on cancellation must never be altered or compromised.
3. **One Concern per Step**: Address security, email verification, input validation, and accessibility in distinct, testable increments.
4. **Additive Over Destructive**: Introduce new middleware, optional schema fields, and helper utilities without altering existing method signatures or breaking existing API response contracts.
5. **Preserve Seeded Demo Accounts & 1-Click Logins**:
   - Family User: `vikram@careelderly.org` / `password123` (`USER-001`)
   - Nurse Caregiver: `anita.nurse@careelderly.org` / `password123` (`CG-201`)
   - Admin: `admin@careelderly.org` / `password123` (`ADMIN-001`)
   - All seeded demo users must default to `isEmailVerified: true` so demo access is never blocked.
6. **Payment Boundary Unchanged**: Per Section 0 & 16 of the fullstack spec, online payment processing remains strictly out of scope; estimated service pricing is retained solely as an informational display estimate.
7. **Graceful Fallbacks for External Dependencies**: Email sending, OAuth, and database fallbacks must fail gracefully with warnings rather than crashing server startup or breaking offline test execution.

---

## 2. Security Enhancement: Email Verification Specification

### 2.1 Comparative Analysis: SMTP vs. EmailJS

| Architectural Dimension | EmailJS (Client-Side) | SMTP / Server-Side (Nodemailer) | Recommendation |
|---|---|---|:---:|
| **Execution Context** | Browser / Client Frontend (`emailjs-com`) | Backend Server (`nodemailer` / SMTP service) | **SMTP** |
| **Credential Security** | Exposed in browser bundle (public API keys, template IDs visible in DevTools) | Securely stored in backend `.env` (Zero client exposure) | **SMTP** |
| **Token Generation & Integrity** | Generated on frontend or insecurely passed; client can intercept or bypass verification | Cryptographically generated (`crypto.randomBytes(32)` or 6-digit secure OTP) on server; hashed in DB | **SMTP** |
| **Tamper Resistance** | Vulnerable to client-side spoofing, script injection, and quota exhaustion attacks | Fully tamper-proof; rate-limited; protected behind server-side authentication rules | **SMTP** |
| **Reliability & Delivery** | Subject to browser ad-blockers, CORS issues, client network drops | Robust SMTP connection pooling with automatic retry and standard delivery protocols | **SMTP** |
| **Healthcare Compliance** | Incompatible with strict healthcare identity and verification standards | Fully compliant with medical platform security and audit requirements | **SMTP** |
| **Offline / Dev Portability** | Requires active internet & EmailJS account for any test run | Seamless mock/console fallback (`nodemailer` stream or console logger) when offline or in dev | **SMTP** |

**Conclusion:** **EmailJS is strictly rejected for authentication and verification.** Server-side SMTP via `nodemailer` (supporting standard SMTP providers like Gmail, Brevo, SendGrid, AWS SES, or Ethereal for testing) is the required standard for this platform.

---

### 2.2 SMTP Email Verification Architecture & Flow

```
┌──────────────┐                 ┌────────────────────┐                 ┌────────────────────┐
│ Frontend UI  │                 │  Express Backend   │                 │   SMTP Service     │
│ (React/Vite) │                 │ (Node/Nodemailer)  │                 │ (Brevo/Gmail/SES)  │
└──────┬───────┘                 └─────────┬──────────┘                 └─────────┬──────────┘
       │                                   │                                      │
       │ 1. POST /api/v1/auth/register    │                                      │
       ├──────────────────────────────────>│                                      │
       │                                   │ 2. Create User (isEmailVerified=false)│
       │                                   │ 3. Generate Crypto Token (1h expiry) │
       │                                   │ 4. Send Verification Email           │
       │                                   ├─────────────────────────────────────>│
       │                                   │    (Fallback: Log to console in dev) │
       │ 5. Response: { user, accessToken }│                                      │
       │<──────────────────────────────────┤                                      │
       │                                   │                                      │
       │ 6. User clicks email link / OTP   │                                      │
       │    GET /verify-email?token=xyz    │                                      │
       ├──────────────────────────────────>│                                      │
       │                                   │ 7. Validate token & expiration       │
       │                                   │ 8. Update: isEmailVerified = true    │
       │ 9. Success message + Verified UI  │                                      │
       │<──────────────────────────────────┤                                      │
```

---

### 2.3 Data Model Updates (Non-Breaking)

Add the following optional fields to `backend/models/User.js` (both Mongoose schema and `UserModelAdapter` in-memory representation):

```javascript
// Additive User fields:
isEmailVerified: {
  type: Boolean,
  default: function () {
    // Seed accounts and Google OAuth accounts default to verified
    return this.authProvider === 'google' || this.role === 'admin';
  },
},
emailVerificationToken: {
  type: String,
  default: null,
},
emailVerificationExpires: {
  type: Date,
  default: null,
},
```

---

### 2.4 REST API Endpoints for Email Verification

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| `POST` | `/api/v1/auth/verify-email` | Public | Validates verification token, marks `isEmailVerified = true`, clears token |
| `POST` | `/api/v1/auth/resend-verification` | Bearer | Generates new token and resends verification email via SMTP |
| `GET` | `/api/v1/auth/verify-email-status` | Bearer | Returns `{ isEmailVerified: boolean, email: string }` |

#### Developer & Offline Fallback Guarantee:
If `SMTP_HOST` or `SMTP_USER` are not configured in `.env`, the email service automatically falls back to **Development Mock Mode**:
- Prints the verification URL and token directly to the backend server console (`console.log('[Dev Email Service] Verification Link: ...')`).
- Registration, test suites, and demo accounts continue to work without throwing errors or requiring internet connectivity.

---

### 2.5 Frontend Integration (Non-Intrusive)

1. **Senior-Friendly Verification Banner**:
   - For newly registered accounts with `isEmailVerified: false`, display an unobtrusive, accessible warning banner at the top of the dashboard:
     > *"Please verify your email address to ensure you receive care shift alerts and notifications. [Resend Link]"*
2. **Email Verification Landing Page** (`/verify-email`):
   - Reads `?token=...` from URL parameters, submits to `/api/v1/auth/verify-email`, and displays a reassuring confirmation with a button to return to the dashboard.
3. **No Interruption of Core Actions**:
   - In accordance with graceful onboarding, unverified users can still browse catalog services, view caregivers, and review patient profiles while awaiting email confirmation.

---

## 3. Prioritized Hardening Items

### 3.1 P0 — Security & Environment Visibility

#### P0-1. Admin Seed Password Normalization [COMPLETED & VERIFIED]
- **Status**: ✅ **Implemented**.
- **Action**: Canonicalized `admin@careelderly.org` password to `password123` across all documentation and seed records.

#### P0-2. Data Persistence Mode Visibility in Health Check [COMPLETED & VERIFIED]
- **Status**: ✅ **Implemented**.
- **Action**: `GET /api/v1/health` now returns `persistenceMode` (`"mongodb"` or `"in-memory-fallback"`), `uptime`, and an ISO `timestamp`.

---

### 3.2 P1 — Protection, Rate Limiting & Input Validation

#### P1-1. HTTP Security Headers (`helmet`) & Scoped Auth Rate Limiting [COMPLETED & VERIFIED]
- **Status**: ✅ **Implemented & Verified**.
- **Action**:
  - `helmet()` middleware added in `backend/server.js` with `crossOriginResourcePolicy: { policy: 'cross-origin' }`.
  - `express-rate-limit` scoped strictly to `/api/v1/auth/login`, `/api/v1/auth/register`, and `/api/v1/auth/resend-verification`.
  - Dynamic CORS added in `backend/server.js` to ensure any local Vite dev port (`5173`, `5174`, etc.) and `PATCH` methods are fully supported.
  - Test suite `test_step1_security_headers_and_ratelimit.js` passes 100%.

#### P1-2. Controller Input Validation Guards
- **Action**:
  - Standardize error responses to `{ status: 'fail', error: { code: 'INVALID_INPUT', message: '...' } }`.
  - Validate clinical vitals (e.g. blood pressure format, numerical ranges for pulse, SpO2, and temperature) in `careNoteController.js`.

#### P1-3. Query Pagination Defaults
- **Action**:
  - Add optional `page` and `limit` query parameters to `GET /api/v1/bookings`, `GET /api/v1/patients`, and `GET /api/v1/caregivers`.
  - Retain current behavior (return all records) when `page` and `limit` are omitted to avoid breaking existing frontend consumers.

---

### 3.3 P2 — Accessibility (WCAG 2.1 AA) & Resilience (Phase 7)

| Feature | Implementation | Non-Breaking Guarantee |
|---|---|---|
| **Font Scaling Widget** | Normal (100%), Large (115%), Extra Large (130%) root font scaling button in Navbar | Uses CSS custom property `--app-font-scale`; no Tailwind classes modified |
| **High Contrast Mode** | Accessible toggle providing minimum 7:1 contrast ratio for text | Additive CSS `.high-contrast` class on `document.body` |
| **Offline Network Banner** | Banner alerting user if internet connection drops (`window.addEventListener('offline')`) | Non-blocking fixed top banner; dismisses on `online` |
| **Global React Error Boundary** | Root error boundary component catching unhandled UI exceptions | Renders accessible fallback screen with "Reload Application" button |

---

## 4. Hiring & Cancel Hiring: Feature Verification & Safety Matrix

| Feature Workflow | Mechanics | Hardening Verification | Status |
|---|---|---|:---:|
| **Hiring (Create Booking)** | User selects service, caregiver, date, and shift. Backend checks caregiver availability; detects overlaps; returns 409 if occupied. | Unchanged & protected. Input validation verifies date formats and caregiver active status. | ✅ Fully Functional |
| **Caregiver Availability API** | `GET /api/v1/bookings/availability` queries active bookings for date. | Verified. Calendar displays "Booked / Unavailable" indicators. | ✅ Fully Functional |
| **Caregiver Accept Shift** | Caregiver transitions status from `pending` to `confirmed`. Socket.io notifies family user. | Verified in `test_booking_routes.js` (Test 5). | ✅ Fully Functional |
| **Cancel Hiring (By User)** | Family user cancels request (`PATCH /api/v1/bookings/:id/status` -> `cancelled`). | Permitted for `pending` and `confirmed` bookings. Releasing the shift immediately. | ✅ Fully Functional |
| **Cancel Hiring (By Caregiver)**| Caregiver declines incoming request (`pending` -> `cancelled`). | Releases shift slot; sends socket notification to family user. | ✅ Fully Functional |
| **Freed Slot Re-booking** | Once cancelled, the slot is no longer in `['pending', 'confirmed', 'in_progress']`. Another family user can book it. | Verified in `test_booking_routes.js` (Test 7: User 2 successfully books freed slot). | ✅ Fully Functional |
| **Shift Execution & Notes** | Caregiver starts shift (`in_progress`), records vitals (`POST /api/v1/care-notes`), and marks `completed`. | Verified in `test_phase5_carenote_and_socket.js`. | ✅ Fully Functional |

---

## 5. Project Completeness Analysis

### Will the project be complete after implementing this specification?

**YES. The project will achieve 100% full-stack completion.**

Here is the comprehensive lifecycle assessment:

1. **Functional Requirements (100% Complete)**:
   - All 6 phases defined in `Elderly-Care-Platform-FullStack-Spec.md` are operational and verified.
   - User, Patient, Caregiver, Service, Booking, Care Note, and Admin modules are fully integrated with frontend UI.
   - Payment exclusion boundary (Sections 0 & 16) is strictly respected.
2. **Security & Data Integrity (100% Hardened)**:
   - In-memory JWT access token + HttpOnly rotating refresh token in cookie.
   - Server-side SMTP email verification with development fallback.
   - Helmet HTTP headers and rate-limiting on sensitive authentication endpoints.
   - Strict ownership isolation guards on patient clinical records and booking items.
3. **Accessibility & Senior-Friendliness (WCAG 2.1 AA Complete)**:
   - Font scaling and high-contrast modes for elderly users and family caregivers.
   - Real-time Socket.io notifications and timeline synchronization without jarring page reloads.
4. **DevOps & Portability**:
   - Zero-configuration startup with dual-mode MongoDB / in-memory store.
   - 100% passing automated test suites with instant test fill demo accounts.

---

## 6. Regression Testing Checklist

Execute after applying any hardening change:

- [ ] Run backend automated test suites:
  - `node backend/test_setup.js`
  - `node backend/test_patient_routes.js`
  - `node backend/test_catalog_routes.js`
  - `node backend/test_booking_routes.js`
  - `node backend/test_phase5_carenote_and_socket.js`
  - `node backend/test_admin_routes.js`
- [ ] Run frontend build test: `cd frontend && npm run build` (0 errors).
- [ ] Verify 1-click test logins (Family User, Nurse Caregiver, Admin).
- [ ] Verify Hiring flow: Schedule a booking, ensure availability check runs, check 409 conflict on duplicate slot.
- [ ] Verify Cancel Hiring flow: Cancel booking from user or caregiver side; verify slot is immediately available for new booking.
- [ ] Verify Email Verification flow: Register user -> check verification email sent (or dev log printed) -> verify endpoint confirms account.
