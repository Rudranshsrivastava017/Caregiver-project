const express = require('express');
const { sendOtp, verifyOtp } = require('../services/otpService');
const { UserModelAdapter } = require('../models/User');

const router = express.Router();
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const ROLES = ['family', 'nurse'];

const sendOtpHandler = async (req, res) => {
  try {
    const email = String(req.body.email || '').trim().toLowerCase();
    const role = req.body.role;

    if (!EMAIL_RE.test(email) || !ROLES.includes(role)) {
      return res.status(400).json({ message: 'Valid email and role are required.' });
    }

    const existingUser = await UserModelAdapter.findByEmail(email);
    if (existingUser) {
      return res.status(409).json({ message: 'This email is already registered. Please log in.' });
    }

    const result = await sendOtp(email, role);
    return res.status(200).json({
      message: 'OTP sent to your email.',
      simulated: !!result?.simulated,
    });
  } catch (err) {
    console.error('[OTP send error]:', err.message || err);
    return res.status(err.status || 500).json({
      message: err.status
        ? err.message
        : (process.env.NODE_ENV !== 'production'
            ? `Could not send OTP: ${err.message}`
            : 'Could not send OTP. Try again.'),
    });
  }
};

const verifyOtpHandler = async (req, res) => {
  try {
    const email = String(req.body.email || '').trim().toLowerCase();
    const { role, otp } = req.body;

    if (!EMAIL_RE.test(email) || !ROLES.includes(role) || !/^\d{6}$/.test(String(otp))) {
      return res.status(400).json({ message: 'Valid email, role and 6-digit OTP are required.' });
    }

    const verificationToken = await verifyOtp(email, role, otp);
    return res.status(200).json({ message: 'Email verified.', verificationToken });
  } catch (err) {
    console.error('[OTP verify error]:', err.message || err);
    return res.status(err.status || 500).json({ message: err.message || 'Verification failed.' });
  }
};

router.post('/send', sendOtpHandler);
router.post('/verify', verifyOtpHandler);

module.exports = router;
module.exports.sendOtpHandler = sendOtpHandler;
module.exports.verifyOtpHandler = verifyOtpHandler;
