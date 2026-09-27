const express = require('express');
const { listFavorites, addFavorite, removeFavorite, updateRestockAlert } = require('../controllers/favoriteController');
const protect = require('../middleware/auth');
const authorize = require('../middleware/authorize');

const router = express.Router();
router.use(protect, authorize('customer'));
router.get('/', listFavorites);
router.post('/', addFavorite);
router.patch('/product/:target/restock-alert', updateRestockAlert);
router.delete('/:targetType/:target', removeFavorite);
module.exports = router;
