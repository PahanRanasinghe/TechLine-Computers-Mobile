const express = require('express');
const router  = express.Router();
const { protect, adminOnly } = require('../middleware/authMiddleware');
const { getStats } = require('../controllers/adminController');

router.get('/stats', protect, adminOnly, getStats); // GET /api/admin/stats

module.exports = router;
