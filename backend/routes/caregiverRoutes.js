const express = require('express');
const router = express.Router();
const {
  getCaregivers,
  getCaregiverById,
} = require('../controllers/caregiverController');
const { getCaregiverReviews } = require('../controllers/reviewController');

// Public directory access
router.get('/', getCaregivers);
router.get('/:id', getCaregiverById);
router.get('/:id/reviews', getCaregiverReviews);

module.exports = router;
