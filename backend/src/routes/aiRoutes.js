const express = require('express');
const { chat } = require('../controllers/aiController');
const protect = require('../middleware/auth');
const aiRateLimit = require('../middleware/aiRateLimit');

const router = express.Router();

// protect.optional allows both logged-in users (with role context) and guest visitors to chat
router.post('/chat', protect.optional, aiRateLimit, chat);

module.exports = router;