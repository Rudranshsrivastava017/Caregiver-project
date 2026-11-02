require('dotenv').config();
const nodemailer = require('nodemailer');

const createTransporter = () => {
  const host = process.env.SMTP_HOST || 'smtp.gmail.com';
  const port = Number(process.env.SMTP_PORT) || 587;
  const secure = process.env.SMTP_SECURE === 'true' || port === 465;
  const user = (process.env.SMTP_USER || '').trim();
  const rawPass = process.env.SMTP_PASS || '';
  const pass = rawPass.replace(/\s+/g, '');

  const transportOptions = {
    host,
    port,
    secure,
    connectionTimeout: 8000,
    greetingTimeout: 8000,
    socketTimeout: 10000,
  };

  // Only attach auth if both user and pass exist to avoid "Missing credentials for PLAIN"
  if (user && pass) {
    transportOptions.auth = { user, pass };
  }

  return nodemailer.createTransport(transportOptions);
};

// Dynamic proxy so tests and callers always use the latest environment variables
const transporter = new Proxy({}, {
  get: (target, prop) => {
    const instance = createTransporter();
    const val = instance[prop];
    return typeof val === 'function' ? val.bind(instance) : val;
  },
});

async function sendMail({ to, subject, html, text }) {
  if (process.env.NODE_ENV === 'test') {
    return { messageId: `test-${Date.now()}`, simulated: true };
  }

  const user = (process.env.SMTP_USER || '').trim();
  const from = process.env.MAIL_FROM || `"ElderCareGiver" <${user || 'no-reply@careelderly.org'}>`;

  // If no SMTP user or using default placeholder credentials
  const isPlaceholder =
    !user ||
    !process.env.SMTP_PASS ||
    user === 'your-email@gmail.com' ||
    process.env.SMTP_PASS === 'your-16-char-app-password';

  if (isPlaceholder && process.env.NODE_ENV !== 'production') {
    console.warn(`[Mailer Dev Mode] Placeholder credentials detected. Simulating dispatch to ${to}`);
    return { messageId: `simulated-${Date.now()}`, simulated: true };
  }

  try {
    const activeTransporter = createTransporter();
    return await activeTransporter.sendMail({
      from,
      to,
      subject,
      html,
      text,
    });
  } catch (err) {
    // If not in production, gracefully fall back to dev simulation so developers and users
    // are not blocked by invalid App Passwords, local port blocking, or offline development
    if (process.env.NODE_ENV !== 'production') {
      console.warn(`[Mailer Dev Fallback] SMTP dispatch to ${to} failed (${err.message}). Operating in dev simulation mode.`);
      return { messageId: `simulated-${Date.now()}`, simulated: true, originalError: err.message };
    }
    throw err;
  }
}

module.exports = { transporter, sendMail, createTransporter };



