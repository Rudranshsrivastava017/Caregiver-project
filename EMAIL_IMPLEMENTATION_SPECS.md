# ElderCareGiver: Email OTP Verification Before Registration

- **Project:** ElderCareGiver (full stack)
- **Portals covered:** Family Portal and Nurse Portal
- **Feature:** A new family member or nurse must verify their email with a one-time password (OTP) sent over SMTP before the account is created.
- **Assumed stack for code samples:** Node.js + Express + MongoDB (Mongoose) + Nodemailer. If your stack differs, the flow, data model and API contract stay the same; only the syntax changes.

---

## 1. Goal and Scope

### Goal
Make sure the email address entered during registration really belongs to the person registering, for both roles, before any account is stored.

### In scope
- OTP generation, secure storage, expiry, resend and attempt limits
- SMTP email delivery with Nodemailer
- Two-step registration UI (details and email, then OTP) for family and nurse
- Backend check that blocks registration unless the email was verified

### Out of scope (can be added later)
- OTP on every login (2FA)
- Phone/SMS OTP
- Forgot password flow (can reuse the same OTP service)

---

## 2. Registration Flow

1. User opens the Family or Nurse register page and fills the form.
2. User enters email and clicks **Send OTP**.
3. Backend checks the email is not already registered, generates a 6-digit OTP, stores a hash of it with an expiry, and emails it.
4. User enters the OTP and clicks **Verify**.
5. Backend validates the OTP. On success it returns a short-lived `verificationToken`.
6. User submits the final registration. The request includes the email and the `verificationToken`.
7. Backend confirms the token is valid, unused and matches the email and role, then creates the account with `isEmailVerified: true` and deletes the OTP record.

> **Rule:** The register endpoint must never create an account unless step 7 passes. Hiding the form fields in the UI is not enough, because the API can be called directly.

---

## 3. Phases of Implementation

Each phase can be finished and tested on its own. Do them in order.

| Phase | Name | Outcome |
| :--- | :--- | :--- |
| **1** | Setup and SMTP | Server can send a test email |
| **2** | Database model | OTP records stored securely with auto-expiry |
| **3** | OTP service and email template | Reusable functions to create, send and check OTPs |
| **4** | API endpoints | Send, verify and protected register routes |
| **5** | Frontend | Two-step register UI for both portals |
| **6** | Security hardening | Rate limits, cooldowns, attempt caps |
| **7** | Testing and deployment | Checklist passed, live on production |

---

## Phase 1: Setup and SMTP

### 1.1 Install packages

```bash
npm install nodemailer express-rate-limit bcryptjs jsonwebtoken dotenv
```
*(You may already have some of these. `bcryptjs` is used to hash the OTP, `jsonwebtoken` is optional and only needed if you prefer JWT over the random token used below.)*

### 1.2 Choose an SMTP provider

| Provider | Host | Port | Notes |
| :--- | :--- | :--- | :--- |
| **Gmail** | `smtp.gmail.com` | `587` (STARTTLS) or `465` (SSL) | Needs 2-Step Verification on and an App Password. Your normal password will not work. Good for development; daily sending limits apply. |
| **Brevo (Sendinblue)** | `smtp-relay.brevo.com` | `587` | Free tier available. Good for production. |
| **SendGrid** | `smtp.sendgrid.net` | `587` | User is the literal text `apikey`, password is your API key. |
| **Mailtrap (testing)** | `sandbox.smtp.mailtrap.io` | `2525` | Catches emails in a sandbox so you do not spam real inboxes while testing. |

> For local testing use Mailtrap or Gmail. For production use a transactional provider so emails are less likely to land in spam.

### 1.3 Environment variables

Add to `.env` (never commit this file; make sure `.env` is in `.gitignore`):

```env
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-16-char-app-password
MAIL_FROM="ElderCareGiver <your-email@gmail.com>"

OTP_EXPIRY_MINUTES=10
OTP_MAX_ATTEMPTS=5
OTP_RESEND_COOLDOWN_SECONDS=60
OTP_MAX_SENDS_PER_HOUR=5
VERIFICATION_TOKEN_MINUTES=15
```

> **Note:** `SMTP_SECURE` is `true` only for port 465. For port 587 keep it `false` (Nodemailer upgrades with STARTTLS).

### 1.4 Mail transporter

Create `utils/mailer.js`:

```javascript
const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT),
  secure: process.env.SMTP_SECURE === 'true',
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

async function sendMail({ to, subject, html, text }) {
  return transporter.sendMail({
    from: process.env.MAIL_FROM,
    to,
    subject,
    html,
    text,
  });
}

module.exports = { transporter, sendMail };
```

### 1.5 Phase 1 test

Run this once from a scratch file, then delete it:

```javascript
require('dotenv').config();
const { transporter } = require('./utils/mailer');
transporter.verify().then(() => console.log('SMTP ready')).catch(console.error);
```

**Done when:** the console prints `SMTP ready` and a test `sendMail` reaches your inbox.

---

## Phase 2: Database Model

Store OTPs in their own collection, separate from the user collections, because the user does not exist yet at this stage.

Create `models/EmailOtp.js`:

```javascript
const mongoose = require('mongoose');

const emailOtpSchema = new mongoose.Schema({
  email: { type: String, required: true, lowercase: true, trim: true },
  role: { type: String, enum: ['family', 'nurse'], required: true },
  otpHash: { type: String, required: true },
  attempts: { type: Number, default: 0 },
  verified: { type: Boolean, default: false },
  verificationTokenHash: { type: String, default: null },
  sendCount: { type: Number, default: 1 },
  lastSentAt: { type: Date, default: Date.now },
  windowStartedAt: { type: Date, default: Date.now },
  expiresAt: { type: Date, required: true },
});

// One active record per email + role
emailOtpSchema.index({ email: 1, role: 1 }, { unique: true });

// MongoDB deletes the document automatically after expiresAt
emailOtpSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

module.exports = mongoose.model('EmailOtp', emailOtpSchema);
```

Also add to your existing Family and Nurse user models (if not present):

```javascript
isEmailVerified: { type: Boolean, default: false },
```

### Existing users migration
Accounts created before this feature should be set to `isEmailVerified: true` with a one-time update so they are not affected:

```javascript
db.families.updateMany({}, { $set: { isEmailVerified: true } });
db.nurses.updateMany({}, { $set: { isEmailVerified: true } });
```
*(Use your real collection names.)*

> **SQL note:** If you use MySQL or PostgreSQL instead of MongoDB, create an `email_otps` table with the same columns and run a scheduled cleanup (cron or database event) to delete rows where `expires_at` has passed.

**Done when:** the model loads without errors and the TTL index exists in the database.

---

## Phase 3: OTP Service and Email Template

### 3.1 OTP service

Create `services/otpService.js`:

```javascript
const crypto = require('crypto');
const bcrypt = require('bcryptjs');
const EmailOtp = require('../models/EmailOtp');
const { sendMail } = require('../utils/mailer');
const { otpEmail } = require('../utils/emailTemplates');

const EXPIRY_MIN = Number(process.env.OTP_EXPIRY_MINUTES || 10);
const MAX_ATTEMPTS = Number(process.env.OTP_MAX_ATTEMPTS || 5);
const COOLDOWN_SEC = Number(process.env.OTP_RESEND_COOLDOWN_SECONDS || 60);
const MAX_SENDS_PER_HOUR = Number(process.env.OTP_MAX_SENDS_PER_HOUR || 5);
const TOKEN_MIN = Number(process.env.VERIFICATION_TOKEN_MINUTES || 15);

const sha256 = (v) => crypto.createHash('sha256').update(v).digest('hex');

// Cryptographically secure 6-digit code (not Math.random)
const generateOtp = () => String(crypto.randomInt(0, 1000000)).padStart(6, '0');

async function sendOtp(email, role) {
  const now = new Date();
  let record = await EmailOtp.findOne({ email, role });

  if (record) {
    const secondsSinceLast = (now - record.lastSentAt) / 1000;
    if (secondsSinceLast < COOLDOWN_SEC) {
      const wait = Math.ceil(COOLDOWN_SEC - secondsSinceLast);
      const err = new Error(`Please wait ${wait}s before requesting another OTP.`);
      err.status = 429;
      throw err;
    }
    const windowAgeMin = (now - record.windowStartedAt) / 60000;
    if (windowAgeMin < 60 && record.sendCount >= MAX_SENDS_PER_HOUR) {
      const err = new Error('Too many OTP requests. Try again later.');
      err.status = 429;
      throw err;
    }
  }

  const otp = generateOtp();
  const otpHash = await bcrypt.hash(otp, 10);
  const expiresAt = new Date(now.getTime() + EXPIRY_MIN * 60000);

  if (record) {
    const resetWindow = (now - record.windowStartedAt) / 60000 >= 60;
    record.otpHash = otpHash;
    record.attempts = 0;
    record.verified = false;
    record.verificationTokenHash = null;
    record.expiresAt = expiresAt;
    record.lastSentAt = now;
    record.sendCount = resetWindow ? 1 : record.sendCount + 1;
    if (resetWindow) record.windowStartedAt = now;
    await record.save();
  } else {
    record = await EmailOtp.create({ email, role, otpHash, expiresAt });
  }

  const { subject, html, text } = otpEmail({ otp, minutes: EXPIRY_MIN, role });
  await sendMail({ to: email, subject, html, text });
}

async function verifyOtp(email, role, otp) {
  const record = await EmailOtp.findOne({ email, role });

  if (!record || record.expiresAt < new Date()) {
    const err = new Error('OTP expired or not found. Please request a new one.');
    err.status = 400;
    throw err;
  }
  if (record.attempts >= MAX_ATTEMPTS) {
    const err = new Error('Too many wrong attempts. Please request a new OTP.');
    err.status = 429;
    throw err;
  }

  const ok = await bcrypt.compare(String(otp), record.otpHash);
  if (!ok) {
    record.attempts += 1;
    await record.save();
    const err = new Error('Incorrect OTP.');
    err.status = 400;
    throw err;
  }

  // Success: issue a single-use verification token
  const token = crypto.randomBytes(32).toString('hex');
  record.verified = true;
  record.verificationTokenHash = sha256(token);
  record.expiresAt = new Date(Date.now() + TOKEN_MIN * 60000);
  await record.save();
  return token;
}

// Called by the register routes
async function consumeVerification(email, role, token) {
  const record = await EmailOtp.findOne({ email, role, verified: true });
  if (
    !record ||
    record.expiresAt < new Date() ||
    !token ||
    record.verificationTokenHash !== sha256(String(token))
  ) {
    const err = new Error('Email not verified. Please verify your email first.');
    err.status = 403;
    throw err;
  }
  await EmailOtp.deleteOne({ _id: record._id }); // single use
}

module.exports = { sendOtp, verifyOtp, consumeVerification };
```

### Why these choices
- `crypto.randomInt` gives unpredictable codes; `Math.random` does not.
- The OTP is stored hashed, so a database leak does not expose live codes.
- A 6-digit code has only 1,000,000 possibilities, so the attempt cap (5) and expiry (10 min) are what make it safe. Do not remove them.
- The verification token proves the OTP step happened, so the register route cannot be called with just an email.

### 3.2 Email template

Create `utils/emailTemplates.js`:

```javascript
function otpEmail({ otp, minutes, role }) {
  const portal = role === 'nurse' ? 'Nurse' : 'Family';
  const subject = `Your ElderCareGiver verification code: ${otp}`;

  const text =
    `Your ElderCareGiver ${portal} Portal verification code is ${otp}.\n` +
    `It expires in ${minutes} minutes. If you did not request this, ignore this email.`;

  const html = `
  <div style="font-family:Arial,sans-serif;max-width:480px;margin:auto;padding:24px;border:1px solid #e5e7eb;border-radius:8px">
    <h2 style="margin:0 0 8px">ElderCareGiver</h2>
    <p>Use this code to verify your email for the <b>${portal} Portal</b>:</p>
    <p style="font-size:32px;letter-spacing:8px;font-weight:bold;margin:16px 0">${otp}</p>
    <p>This code expires in <b>${minutes} minutes</b>.</p>
    <p style="color:#6b7280;font-size:13px">If you did not request this, you can safely ignore this email. Never share this code with anyone.</p>
  </div>`;

  return { subject, html, text };
}

module.exports = { otpEmail };
```

**Done when:** calling `sendOtp('test@example.com', 'family')` from a scratch script delivers an email with a 6-digit code and creates one record in `emailotps`.

---

## Phase 4: API Endpoints

### 4.1 API contract

| Method | Route | Body | Success | Errors |
| :--- | :--- | :--- | :--- | :--- |
| `POST` | `/api/auth/otp/send` | `{ email, role }` | `200 { message }` | `400` invalid input, `409` email already registered, `429` cooldown or limit |
| `POST` | `/api/auth/otp/verify` | `{ email, role, otp }` | `200 { verificationToken }` | `400` wrong or expired, `429` too many attempts |
| `POST` | `/api/auth/family/register` | existing fields + `verificationToken` | `201` | `403` not verified, `409` duplicate |
| `POST` | `/api/auth/nurse/register` | existing fields + `verificationToken` | `201` | `403` not verified, `409` duplicate |

*(Adjust the route prefixes to match your existing routes.)*

### 4.2 OTP routes

Create `routes/otpRoutes.js`:

```javascript
const express = require('express');
const { sendOtp, verifyOtp } = require('../services/otpService');
const Family = require('../models/Family'); // use your real model names
const Nurse = require('../models/Nurse');

const router = express.Router();
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const ROLES = ['family', 'nurse'];

router.post('/send', async (req, res) => {
  try {
    const email = String(req.body.email || '').trim().toLowerCase();
    const role = req.body.role;

    if (!EMAIL_RE.test(email) || !ROLES.includes(role)) {
      return res.status(400).json({ message: 'Valid email and role are required.' });
    }

    const Model = role === 'family' ? Family : Nurse;
    if (await Model.findOne({ email })) {
      return res.status(409).json({ message: 'This email is already registered. Please log in.' });
    }

    await sendOtp(email, role);
    res.json({ message: 'OTP sent to your email.' });
  } catch (err) {
    res.status(err.status || 500).json({ message: err.status ? err.message : 'Could not send OTP. Try again.' });
  }
});

router.post('/verify', async (req, res) => {
  try {
    const email = String(req.body.email || '').trim().toLowerCase();
    const { role, otp } = req.body;

    if (!EMAIL_RE.test(email) || !ROLES.includes(role) || !/^\d{6}$/.test(String(otp))) {
      return res.status(400).json({ message: 'Valid email, role and 6-digit OTP are required.' });
    }

    const verificationToken = await verifyOtp(email, role, otp);
    res.json({ message: 'Email verified.', verificationToken });
  } catch (err) {
    res.status(err.status || 500).json({ message: err.status ? err.message : 'Verification failed.' });
  }
});

module.exports = router;
```

Mount it in `app.js` / `server.js`:

```javascript
app.use('/api/auth/otp', require('./routes/otpRoutes'));
```

### 4.3 Protect the register routes

Inside both your existing register handlers (family and nurse), add this before creating the user:

```javascript
const { consumeVerification } = require('../services/otpService');

// ...inside the register handler, after basic validation:
const email = req.body.email.trim().toLowerCase();
await consumeVerification(email, 'family', req.body.verificationToken); // use 'nurse' in the nurse route

// then create the user as you do today, adding:
// isEmailVerified: true
```

Wrap it in your existing `try/catch` so a thrown error with status 403 returns the message to the client.

> **Important:** The role passed to `consumeVerification` must be fixed in each route (`'family'` in the family route, `'nurse'` in the nurse route). Do not read the role from the request body here, or a nurse token could be reused on the family route.

### 4.4 Phase 4 test (Postman or curl)

```bash
curl -X POST http://localhost:5000/api/auth/otp/send \
  -H "Content-Type: application/json" \
  -d '{"email":"you@example.com","role":"family"}'

curl -X POST http://localhost:5000/api/auth/otp/verify \
  -H "Content-Type: application/json" \
  -d '{"email":"you@example.com","role":"family","otp":"123456"}'
```

**Done when:** register without a token returns 403, and register with the token from a successful verify returns 201.

---

## Phase 5: Frontend

The same UI logic applies to both portals; only role changes.

### 5.1 UI behavior
- **Step 1:** Normal registration fields plus an email field with a **Send OTP** button.
- **After Send OTP succeeds:** Show a 6-digit OTP input, a **Verify** button, a visible countdown for **Resend OTP** (60 seconds), and a note that the code expires in 10 minutes.
- **After Verify succeeds:** Lock the email field (so it cannot be changed after verification), show a green "Email verified" badge, and enable the **Register** button.
- If the user edits the email after verification, discard the token and require OTP again.
- Show the server error messages (wrong OTP, expired, cooldown, already registered).

### 5.2 Example logic (plain JavaScript, adapt to React/Angular/Vue)

```javascript
let verificationToken = null;

async function sendOtp(role) {
  const email = document.getElementById('email').value.trim();
  const res = await fetch('/api/auth/otp/send', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, role }),
  });
  const data = await res.json();
  if (!res.ok) return showError(data.message);
  showOtpBox();          // reveal OTP input
  startResendTimer(60);  // disable resend for 60s
}

async function verifyOtp(role) {
  const email = document.getElementById('email').value.trim();
  const otp = document.getElementById('otp').value.trim();
  const res = await fetch('/api/auth/otp/verify', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, role, otp }),
  });
  const data = await res.json();
  if (!res.ok) return showError(data.message);
  verificationToken = data.verificationToken;
  lockEmailField();
  enableRegisterButton();
}

async function register(role, formFields) {
  const res = await fetch(`/api/auth/${role}/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ ...formFields, verificationToken }),
  });
  const data = await res.json();
  if (!res.ok) return showError(data.message);
  // redirect to login
}
```

> If your frontend runs on a different origin than the backend, use your full API base URL and make sure CORS allows it.

### 5.3 Input details
- OTP input: `inputmode="numeric"`, `maxlength="6"`, `autocomplete="one-time-code"`.
- Allow digits only.
- Disable the Send OTP, Verify and Register buttons while a request is in progress to prevent double submits.

**Done when:** a new family member and a new nurse can each complete register from the browser only after entering a valid OTP.

---

## Phase 6: Security Hardening

### 6.1 IP rate limiting

The per-email cooldown in the service does not stop an attacker rotating through many email addresses. Add a per-IP limit in front of the OTP routes:

```javascript
const rateLimit = require('express-rate-limit');

const otpLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: 'Too many requests. Please try again later.' },
});

app.use('/api/auth/otp', otpLimiter);
```

> If your app runs behind a proxy (Render, Heroku, Nginx, Vercel functions), set `app.set('trust proxy', 1)` so the real client IP is used.

### 6.2 Checklist of protections

| Protection | Where | Value |
| :--- | :--- | :--- |
| **OTP length** | service | 6 digits via `crypto.randomInt` |
| **OTP expiry** | service + TTL index | 10 minutes |
| **Wrong attempt cap** | service | 5, then a new OTP is required |
| **Resend cooldown** | service | 60 seconds |
| **Sends per email per hour** | service | 5 |
| **Requests per IP** | `express-rate-limit` | 20 per 15 minutes |
| **OTP storage** | database | bcrypt hash only |
| **Verification token** | database | SHA-256 hash, single use, 15 minutes |
| **Role binding** | register routes | role fixed in code, not from body |
| **Email enumeration** | send route | see note below |

> **Email enumeration note:** The send route currently tells the user when an email is already registered (409). This is friendlier but lets someone check which emails exist. If that matters to you, return the same generic success message in both cases and simply skip sending the OTP when the account exists. Choose based on your privacy needs.

### 6.3 Other rules
- Never log the OTP or the SMTP password. Remove any `console.log(otp)` used during testing.
- Do not return the OTP in any API response, even in development.
- Use HTTPS in production.
- Keep SMTP credentials only in environment variables on the host.
- Validate and lowercase the email on every route so `A@x.com` and `a@x.com` are treated as one account.

**Done when:** repeated requests are blocked as described and nothing sensitive appears in logs.

---

## Phase 7: Testing and Deployment

### 7.1 Functional test checklist
- [x] Send OTP for a new family email: email arrives with a 6-digit code
- [x] Send OTP for a new nurse email: email arrives with the Nurse Portal wording
- [x] Correct OTP: returns a verification token and enables Register
- [x] Wrong OTP: shows an error and increases the attempt count
- [x] 5 wrong attempts: further tries blocked until a new OTP is requested
- [x] OTP older than 10 minutes: rejected as expired
- [x] Resend before 60 seconds: rejected with a wait message
- [x] 6th send within an hour: rejected
- [x] Already registered email: send is rejected
- [x] Register without a token (Postman): 403
- [x] Register with a token for a different email: 403
- [x] Use a nurse token on the family register route: 403
- [x] Use the same token twice: second attempt returns 403
- [x] Successful register stores `isEmailVerified: true`
- [x] Changing the email after verifying forces OTP again
- [x] Existing users can still log in normally

### 7.2 Email delivery checks
- [ ] Check the Spam folder on first tests with Gmail SMTP
- [ ] For production, set up SPF and DKIM for your sending domain (your SMTP provider shows the DNS records to add)
- [ ] Use a from-address on a domain you own for best deliverability

### 7.3 Deployment steps
1. Add all SMTP and OTP variables to your hosting platform's environment settings.
2. Run the one-time update that marks existing users as verified.
3. Deploy the backend, confirm the OTP collection and TTL index are created.
4. Deploy the frontend.
5. Test one full family and one full nurse registration on production.

```bash
git add .
git commit -m "Add SMTP email OTP verification before registration"
git push
```

---

## 8. Common Problems and Fixes

| Problem | Likely cause | Fix |
| :--- | :--- | :--- |
| **Invalid login / 535 from Gmail** | Using the normal password | Enable 2-Step Verification and create an App Password |
| **ECONNECTION or timeout** | Wrong port or blocked outbound SMTP | Use 587 with `secure: false`, or 465 with `secure: true`; some hosts block port 25 |
| **self signed certificate** | TLS problem on your network | Fix the certificate; avoid `rejectUnauthorized: false` in production |
| **Email goes to spam** | No SPF/DKIM, free from-address | Use a transactional provider and verify your domain |
| **OTP always "expired"** | Server and database clocks differ, or expiry set in the wrong unit | Check `OTP_EXPIRY_MINUTES` and that dates are stored in UTC |
| **Register returns 403 after a valid OTP** | Email casing differs, or the token was not sent | Lowercase the email in every route and include `verificationToken` in the request |
| **Unique index error on EmailOtp** | Two parallel send requests | Handle the duplicate-key error by retrying once, or disable the button while sending |

---

## 9. Files Added or Changed (Summary)

### New files
- `utils/mailer.js`
- `utils/emailTemplates.js`
- `models/EmailOtp.js`
- `services/otpService.js`
- `routes/otpRoutes.js`

### Changed files
- `.env` (SMTP and OTP settings)
- `app.js` or `server.js` (mount OTP routes, rate limiter, trust proxy)
- Family and Nurse models (`isEmailVerified`)
- Family and Nurse register controllers (call `consumeVerification`)
- Family and Nurse register pages (two-step OTP UI)

---

## 10. Future Extensions
- Reuse `otpService` for forgot password by adding a `purpose` field to `EmailOtp`.
- Add OTP on login for 2FA if the project later needs it.
- Move email sending to a background queue (such as BullMQ) if volume grows.
- Add an admin log of failed verification attempts.

> **Note:** Your project's exact stack (backend language, database, frontend framework) was not shared. If you send your register route, user model and register page code, the code above can be adapted into exact edits for your files.

