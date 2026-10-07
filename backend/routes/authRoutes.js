const express = require('express');
const router = express.Router();
const {
  register,
  login,
  googleLogin,
  refreshToken,
  logout,
  getMe,
  verifyEmail,
  resendVerification,
  getVerificationStatus,
} = require('../controllers/authController');
const { protect } = require('../middlewares/authMiddleware');
const { authLimiter } = require('../middlewares/rateLimiter');

router.post('/register', authLimiter, register);
router.post('/login', authLimiter, login);
router.post('/google', googleLogin);
router.post('/refresh', refreshToken);
router.post('/logout', logout);
router.get('/me', protect, getMe);

// Email Verification routes
router.post('/verify-email', verifyEmail);
router.post('/resend-verification', protect, authLimiter, resendVerification);
router.get('/verify-email-status', protect, getVerificationStatus);

module.exports = router;
