const express = require('express');
const router = express.Router();
const { chat } = require('../controllers/chatbotController');

// POST /api/chatbot — public, no auth required
router.post('/', chat);

module.exports = router;
