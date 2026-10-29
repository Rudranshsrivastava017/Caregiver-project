const express = require('express');
const router = express.Router();
const {
  createBookingReview,
  getCaregiverReviews,
  getBookingReview,
} = require('../controllers/reviewController');
const { protect } = require('../middlewares/authMiddleware');

// Submit review for a completed booking
router.post('/', protect, createBookingReview);
router.post('/booking/:id', protect, createBookingReview);

// Get reviews for a caregiver
router.get('/caregiver/:caregiverId', getCaregiverReviews);

// Get review for a booking
router.get('/booking/:bookingId', protect, getBookingReview);

module.exports = router;
