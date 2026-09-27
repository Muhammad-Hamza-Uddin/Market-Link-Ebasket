const express = require('express');
const { listProductReviews, listFarmerReviews, listMyReviews, createReview, respondToReview, removeReview } = require('../controllers/reviewController');
const protect = require('../middleware/auth');
const authorize = require('../middleware/authorize');

const router = express.Router();
router.get('/product/:productId', listProductReviews);
router.get('/farmer/:farmerId', listFarmerReviews);
router.get('/mine', protect, authorize('farmer'), listMyReviews);
router.post('/', protect, authorize('customer'), createReview);
router.patch('/:id/response', protect, authorize('farmer'), respondToReview);
router.delete('/:id', protect, authorize('admin'), removeReview);
module.exports = router;
