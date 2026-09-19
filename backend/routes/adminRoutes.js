const express = require('express');
const router = express.Router();
const { getPendingCaregivers, verifyCaregiver } = require('../controllers/adminController');
const { protect } = require('../middlewares/authMiddleware');
const { roleGuard } = require('../middlewares/roleMiddleware');

// All admin routes require valid authentication and role: admin
router.use(protect);
router.use(roleGuard(['admin']));

router.get('/caregivers/pending', getPendingCaregivers);
router.patch('/caregivers/:id/verify', verifyCaregiver);

module.exports = router;
