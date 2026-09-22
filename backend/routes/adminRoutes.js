const express = require('express');
const router = express.Router();
const {
  getPendingCaregivers,
  verifyCaregiver,
  rejectCaregiver,
  getAdminAnalytics,
} = require('../controllers/adminController');
const { protect } = require('../middlewares/authMiddleware');
const { roleGuard } = require('../middlewares/roleMiddleware');

// All admin routes require valid authentication and role: admin
router.use(protect);
router.use(roleGuard(['admin']));

// Caregiver verification review and decisions
router.get('/caregivers/pending', getPendingCaregivers);
router.patch('/caregivers/:id/verify', verifyCaregiver);
router.patch('/caregivers/:id/reject', rejectCaregiver);

// Platform oversight and operational analytics
router.get('/analytics', getAdminAnalytics);

module.exports = router;
