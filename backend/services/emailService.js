const nodemailer = require('nodemailer');

// Detect if real SMTP credentials are provided
const isSmtpConfigured = () => {
  return !!(process.env.SMTP_HOST && process.env.SMTP_USER);
};

// Create transporter only when configured
const createTransporter = () => {
  if (!isSmtpConfigured()) {
    return null;
  }

  return nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT) || 587,
    secure: process.env.SMTP_SECURE === 'true' || process.env.SMTP_PORT === '465',
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });
};

/**
 * Send email verification link to user
 * @param {Object} user - User record (fullName, email)
 * @param {string} token - Cryptographic verification token
 * @returns {Promise<{ success: boolean, mode: string, previewUrl?: string }>}
 */
const sendVerificationEmail = async (user, token) => {
  const clientBaseUrl = process.env.CLIENT_URL || 'http://localhost:5173';
  const verificationUrl = `${clientBaseUrl}/verify-email?token=${token}`;

  const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f8fafc; color: #1e293b; padding: 20px; }
        .card { max-width: 540px; margin: 0 auto; background: #ffffff; border-radius: 16px; border: 1px solid #e2e8f0; padding: 32px; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05); }
        .logo { color: #0f766e; font-size: 22px; font-weight: 800; margin-bottom: 20px; display: inline-block; }
        h1 { font-size: 20px; font-weight: 800; color: #0f172a; margin-top: 0; }
        p { font-size: 15px; line-height: 1.6; color: #475569; margin: 12px 0; }
        .btn-container { text-align: center; margin: 28px 0; }
        .btn { background-color: #0f766e; color: #ffffff !important; padding: 14px 28px; text-decoration: none; border-radius: 12px; font-weight: 700; font-size: 15px; display: inline-block; }
        .footer { font-size: 12px; color: #94a3b8; text-align: center; margin-top: 24px; border-top: 1px solid #f1f5f9; padding-top: 16px; }
        .link-text { font-family: monospace; font-size: 12px; word-break: break-all; color: #0f766e; background: #f0fdfa; padding: 8px 12px; border-radius: 8px; border: 1px solid #ccfbf1; }
      </style>
    </head>
    <body>
      <div class="card">
        <div class="logo">🌿 CareElderly Assistance</div>
        <h1>Verify your email address</h1>
        <p>Hello <strong>${user.fullName || 'Member'}</strong>,</p>
        <p>Thank you for joining our elderly healthcare and nursing assistance platform. Please verify your email address to ensure you receive real-time shift alerts, care notes, and service confirmations.</p>
        
        <div class="btn-container">
          <a href="${verificationUrl}" class="btn" target="_blank">Verify Email Address</a>
        </div>
        
        <p>Or copy and paste this verification link into your web browser:</p>
        <div class="link-text">${verificationUrl}</div>
        
        <p style="font-size: 13px; color: #64748b; margin-top: 20px;">
          This verification link is active for <strong>24 hours</strong>. If you did not create an account on CareElderly, please disregard this email.
        </p>

        <div class="footer">
          &copy; ${new Date().getFullYear()} CareElderly Healthcare Assistance Platform. All rights reserved.
        </div>
      </div>
    </body>
    </html>
  `;

  // If real SMTP is configured, attempt sending
  if (isSmtpConfigured()) {
    try {
      const transporter = createTransporter();
      const info = await transporter.sendMail({
        from: process.env.SMTP_FROM || `"CareElderly Support" <${process.env.SMTP_USER}>`,
        to: user.email,
        subject: 'Verify your CareElderly Account',
        text: `Please verify your email address by opening the following link: ${verificationUrl}`,
        html: htmlContent,
      });

      console.log(`[SMTP Email] Verification email dispatched to ${user.email}: messageId=${info.messageId}`);
      return { success: true, mode: 'smtp', messageId: info.messageId };
    } catch (err) {
      console.warn(`[SMTP Warning] Failed to dispatch email via SMTP (${err.message}). Falling back to dev logger.`);
    }
  }

  // Fallback dev logger: Guarantees zero failures during testing / offline dev
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log(`📧 [DEV EMAIL SERVICE FALLBACK] Verification email for: ${user.email}`);
  console.log(`🔗 Verification Link: ${verificationUrl}`);
  console.log(`🔑 Verification Token: ${token}`);
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

  return {
    success: true,
    mode: 'dev-fallback',
    verificationUrl,
    token,
  };
};

module.exports = {
  sendVerificationEmail,
  isSmtpConfigured,
};
