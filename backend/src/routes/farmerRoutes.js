const express = require('express');
const { getFarmers, getFarmer } = require('../controllers/farmerController');

const router = express.Router();

router.get('/', getFarmers);
router.get('/:id', getFarmer);

module.exports = router;

