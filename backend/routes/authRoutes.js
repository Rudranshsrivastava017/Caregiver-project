const express = require('express');
const router = express.Router();
const {
  register,
  login,
  googleLogin,
  refreshToken,
  logout,
  getMe,
} = require('../controllers/authController');
const { protect } = require('../middlewares/authMiddleware');

router.post('/register', register);
router.post('/login', login);
router.post('/google', googleLogin);
router.post('/refresh', refreshToken);
router.post('/logout', logout);
router.get('/me', protect, getMe);

module.exports = router;
