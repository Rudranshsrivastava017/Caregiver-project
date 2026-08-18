const jwt = require('jsonwebtoken');

const generateAccessToken = (user) => {
  const payload = {
    sub: user.userId || user._id,
    role: user.role,
    name: user.fullName,
    email: user.email,
    verificationStatus: user.verificationStatus,
    legalIdVerified: user.legalIdVerified,
  };

  return jwt.sign(payload, process.env.JWT_ACCESS_SECRET || 'fallback_access_secret', {
    expiresIn: process.env.JWT_ACCESS_EXPIRES_IN || '15m',
  });
};

const generateRefreshToken = (user) => {
  const payload = {
    sub: user.userId || user._id,
  };

  return jwt.sign(payload, process.env.JWT_REFRESH_SECRET || 'fallback_refresh_secret', {
    expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d',
  });
};

const verifyAccessToken = (token) => {
  return jwt.verify(token, process.env.JWT_ACCESS_SECRET || 'fallback_access_secret');
};

const verifyRefreshToken = (token) => {
  return jwt.verify(token, process.env.JWT_REFRESH_SECRET || 'fallback_refresh_secret');
};

const getRefreshCookieOptions = () => {
  const isProduction = process.env.NODE_ENV === 'production';
  return {
    httpOnly: true,
    secure: isProduction,
    sameSite: 'lax',
    path: '/api/v1/auth',
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
  };
};

module.exports = {
  generateAccessToken,
  generateRefreshToken,
  verifyAccessToken,
  verifyRefreshToken,
  getRefreshCookieOptions,
};
