const express = require('express');
const router = express.Router();
const {
  getPatients,
  getPatientById,
  createPatient,
  updatePatient,
  deletePatient,
} = require('../controllers/patientController');
const { protect } = require('../middlewares/authMiddleware');
const { roleGuard } = require('../middlewares/roleMiddleware');

// All patient endpoints require an authenticated session
router.use(protect);

router
  .route('/')
  .get(getPatients)
  .post(roleGuard(['user', 'admin']), createPatient);

router
  .route('/:id')
  .get(getPatientById)
  .patch(roleGuard(['user', 'admin']), updatePatient)
  .delete(roleGuard(['user', 'admin']), deletePatient);

module.exports = router;
