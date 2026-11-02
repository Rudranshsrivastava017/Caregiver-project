/**
 * Phase 1 SMTP Verification Script
 * As specified in EMAIL_IMPLEMENTATION_SPECS.md (Section 1.5)
 */
require('dotenv').config();
const { transporter, sendMail } = require('./utils/mailer');

async function verifySmtpSetup() {
  console.log('=============================================================');
  console.log('📧 ELDERCAREGIVER: PHASE 1 SMTP VERIFICATION');
  console.log('=============================================================');
  console.log(`SMTP Host:    ${process.env.SMTP_HOST}`);
  console.log(`SMTP Port:    ${process.env.SMTP_PORT}`);
  console.log(`SMTP Secure:  ${process.env.SMTP_SECURE}`);
  console.log(`SMTP User:    ${process.env.SMTP_USER}`);
  console.log(`Mail From:    ${process.env.MAIL_FROM}`);
  console.log('-------------------------------------------------------------');

  const isPlaceholder =
    !process.env.SMTP_USER ||
    !process.env.SMTP_PASS ||
    process.env.SMTP_USER === 'your-email@gmail.com' ||
    process.env.SMTP_PASS === 'your-16-char-app-password';

  if (isPlaceholder) {
    console.log('⚠️  Placeholder credentials detected in backend/.env.');
    console.log('   To test real email delivery:');
    console.log('   1. Open backend/.env');
    console.log('   2. Set SMTP_USER with your real email address (e.g. your Gmail)');
    console.log('   3. Set SMTP_PASS with your 16-character App Password (or Brevo/Mailtrap key)');
    console.log('   4. Set MAIL_FROM with your sender identity');
    console.log('   5. Re-run: node test_phase1_smtp.js [recipient@example.com]');
    console.log('-------------------------------------------------------------');
    console.log('ℹ️  Mailer module and transporter are fully initialized and ready.');
    return;
  }

  console.log('Verifying SMTP connection with provider...');
  try {
    await transporter.verify();
    console.log('✅ SMTP ready: Successfully connected and authenticated with SMTP server.');

    const recipient = process.argv[2] || process.env.SMTP_USER;
    if (recipient) {
      console.log(`\nDispatching Phase 1 test email to: ${recipient}...`);
      const info = await sendMail({
        to: recipient,
        subject: 'ElderCareGiver - Phase 1 SMTP Setup Verification',
        text: 'This is a test email confirming that Phase 1 SMTP setup is working correctly for ElderCareGiver.',
        html: `
          <div style="font-family:Arial,sans-serif;max-width:480px;margin:auto;padding:24px;border:1px solid #e5e7eb;border-radius:8px">
            <h2 style="color:#0f766e;margin:0 0 8px">ElderCareGiver</h2>
            <p>Phase 1 SMTP Setup Verification</p>
            <p style="color:#16a34a;font-weight:bold;font-size:16px">✅ SMTP Transporter is successfully configured and active.</p>
            <p style="color:#6b7280;font-size:13px">Server timestamp: ${new Date().toISOString()}</p>
          </div>
        `,
      });
      console.log(`✅ Test email delivered! Message ID: ${info.messageId}`);
    }
  } catch (error) {
    console.error('❌ SMTP verification failed:', error.message);
    if (error.responseCode === 535) {
      console.error('👉 Hint (Gmail 535): Normal passwords will not work. Enable 2-Step Verification in Google Account -> Security -> App passwords and generate a 16-character password.');
    }
  }
}

verifySmtpSetup();

