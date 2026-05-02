const express = require('express');
const router  = express.Router();
const { protect, adminOnly } = require('../middleware/authMiddleware');
const {
  submitClaim,
  getMyClaims,
  getAllClaims,
  updateStatus,
} = require('../controllers/warrantyController');

// Customer routes (auth required)
router.post('/',          protect, submitClaim);    // POST   /api/warranty
router.get('/my',         protect, getMyClaims);    // GET    /api/warranty/my

// Admin routes
router.get('/',           protect, adminOnly, getAllClaims);          // GET   /api/warranty
router.patch('/:id/status', protect, adminOnly, updateStatus);       // PATCH /api/warranty/:id/status

module.exports = router;
