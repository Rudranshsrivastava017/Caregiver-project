const express = require('express');
const router = express.Router();
const {
  createBooking,
  checkCaregiverAvailability,
  getBookings,
  getBookingById,
  updateBookingStatus,
} = require('../controllers/bookingController');
const { protect } = require('../middlewares/authMiddleware');
const { roleGuard } = require('../middlewares/roleMiddleware');

// All booking routes require a valid session
router.use(protect);

// Check caregiver availability for a specific date (before booking)
router.get('/availability', checkCaregiverAvailability);

// Bookings collection
router
  .route('/')
  .get(getBookings)
  .post(roleGuard(['user', 'admin']), createBooking);

// Single booking item & status transitions
router.route('/:id').get(getBookingById);
router.route('/:id/status').patch(updateBookingStatus);

module.exports = router;
