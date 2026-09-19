const express = require('express');
const router = express.Router();
const {
  getCaregivers,
  getCaregiverById,
} = require('../controllers/caregiverController');

// Public directory access
router.get('/', getCaregivers);
router.get('/:id', getCaregiverById);

module.exports = router;
