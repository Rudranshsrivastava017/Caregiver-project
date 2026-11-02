const rateLimit = require('express-rate-limit');

/**
 * Scoped rate limiter strictly for sensitive authentication endpoints:
 * - Prevents credential stuffing on /login
 * - Prevents spam account generation on /register
 * - Prevents email flooding on /resend-verification
 */
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: process.env.NODE_ENV === 'production' ? 30 : 100, // 30 in production, 100 in dev
  standardHeaders: true, // Returns standard RateLimit-* headers
  legacyHeaders: false, // Disables X-RateLimit-* legacy headers
  message: {
    status: 'fail',
    error: {
      code: 'TOO_MANY_REQUESTS',
      message: 'Too many authentication requests from this IP address. Please try again after 15 minutes.',
    },
  },
  skip: (req) => {
    return process.env.NODE_ENV === 'test';
  },
});

/**
 * IP Rate limiter strictly for Pre-Registration OTP endpoints
 * - Limits request floods to 20 requests per 15 minutes per IP as required by Section 6.1
 */
const otpLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: process.env.NODE_ENV === 'test' ? 1000 : 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: 'Too many requests. Please try again later.' },
  skip: (req) => process.env.NODE_ENV === 'test' && !req.headers['x-test-ratelimit'],
});

module.exports = {
  authLimiter,
  otpLimiter,
};
