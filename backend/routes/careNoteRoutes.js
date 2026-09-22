const express = require('express');
const router = express.Router();
const {
  createCareNote,
  getCareNotesByBooking,
  getCareNotesByPatient,
} = require('../controllers/careNoteController');
const { protect } = require('../middlewares/authMiddleware');
const { roleGuard } = require('../middlewares/roleMiddleware');

// All Care Note routes require valid authentication
router.use(protect);

// 1. Caregiver logs a care note with vitals
router.post('/', roleGuard(['caregiver', 'admin']), createCareNote);

// 2. View care notes for a booking (family user, assigned caregiver, admin)
router.get('/booking/:bookingId', getCareNotesByBooking);

// 3. View historical care notes for an elderly patient
router.get('/patient/:patientId', getCareNotesByPatient);

module.exports = router;
