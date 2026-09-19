const express = require('express');
const router = express.Router();
const {
  getServices,
  getServiceById,
  createService,
} = require('../controllers/serviceController');
const { protect } = require('../middlewares/authMiddleware');
const { roleGuard } = require('../middlewares/roleMiddleware');

// Public catalog access
router.get('/', getServices);
router.get('/:id', getServiceById);

// Admin-protected service creation
router.post('/', protect, roleGuard(['admin']), createService);

module.exports = router;
