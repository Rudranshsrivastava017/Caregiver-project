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
  const normalizedEmail = String(email || '').trim().toLowerCase();
  const now = new Date();
  let record = await EmailOtp.findOne({ email: normalizedEmail, role });

  if (record) {
    const lastSentAt = record.lastSentAt ? new Date(record.lastSentAt) : new Date(0);
    const secondsSinceLast = (now - lastSentAt) / 1000;
    if (secondsSinceLast < COOLDOWN_SEC) {
      const wait = Math.ceil(COOLDOWN_SEC - secondsSinceLast);
      const err = new Error(`Please wait ${wait}s before requesting another OTP.`);
      err.status = 429;
      throw err;
    }
    const windowStartedAt = record.windowStartedAt ? new Date(record.windowStartedAt) : now;
    const windowAgeMin = (now - windowStartedAt) / 60000;
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
    const windowStartedAt = record.windowStartedAt ? new Date(record.windowStartedAt) : now;
    const resetWindow = (now - windowStartedAt) / 60000 >= 60;
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
    record = await EmailOtp.create({ email: normalizedEmail, role, otpHash, expiresAt });
  }

  const { subject, html, text } = otpEmail({ otp, minutes: EXPIRY_MIN, role });
  const mailResult = await sendMail({ to: normalizedEmail, subject, html, text });

  if (process.env.NODE_ENV !== 'production') {
    console.log(`\n======================================================`);
    console.log(`🔑 [DEV MODE OTP] Recipient: ${normalizedEmail}`);
    console.log(`🔑 [DEV MODE OTP] Verification Code: ${otp}`);
    console.log(`🔑 [DEV MODE OTP] Role: ${role} | Valid for: ${EXPIRY_MIN} minutes`);
    if (mailResult?.simulated) {
      console.log(`⚠️  [DEV MODE OTP] Email delivery fell back to dev simulation (${mailResult.originalError || 'Dev Mode'}).`);
      console.log(`   To receive real emails in your inbox, update backend/.env with a valid Google App Password.`);
    } else {
      console.log(`✅ [DEV MODE OTP] Real email was successfully dispatched to your inbox!`);
    }
    console.log(`======================================================\n`);
  }

  return { success: true, simulated: !!mailResult?.simulated };
}

async function verifyOtp(email, role, otp) {
  const normalizedEmail = String(email || '').trim().toLowerCase();
  const record = await EmailOtp.findOne({ email: normalizedEmail, role });

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
  const normalizedEmail = String(email || '').trim().toLowerCase();
  const record = await EmailOtp.findOne({ email: normalizedEmail, role, verified: true });
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

