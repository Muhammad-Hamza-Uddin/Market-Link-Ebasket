const express = require('express');
const { getMarkets, getMarket } = require('../controllers/marketController');

const router = express.Router();

router.get('/', getMarkets);
router.get('/:id', getMarket);

module.exports = router;

