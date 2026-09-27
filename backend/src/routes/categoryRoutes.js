const express = require('express');
const { listActive } = require('../controllers/categoryController');

const router = express.Router();
router.get('/', listActive);

module.exports = router;
