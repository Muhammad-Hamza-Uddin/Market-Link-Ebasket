const mongoose = require('mongoose');
const Review = require('../models/Review');
const Product = require('../models/Product');
const Order = require('../models/Order');
const AppError = require('../utils/AppError');
const asyncHandler = require('../utils/asyncHandler');

const refreshRatings = async (productId, farmerId) => {
  const [productStats] = await Review.aggregate([
    { $match: { product: new mongoose.Types.ObjectId(productId), status: 'active' } },
    { $group: { _id: null, averageRating: { $avg: '$rating' }, reviewCount: { $sum: 1 } } },
  ]);
  await Product.findByIdAndUpdate(productId, {
    averageRating: Number((productStats?.averageRating || 0).toFixed(2)),
    reviewCount: productStats?.reviewCount || 0,
  });
  // Farmer values are aggregated at read time to avoid denormalizing User.
  return farmerId;
};

const reviewPopulate = [
  { path: 'customer', select: 'name' },
  { path: 'product', select: 'name imageUrl' },
  { path: 'farmer', select: 'name farmName' },
];

const listProductReviews = asyncHandler(async (req, res) => {
  const reviews = await Review.find({ product: req.params.productId, status: 'active' })
    .populate(reviewPopulate).sort({ createdAt: -1 });
  res.status(200).json({ success: true, data: { reviews } });
});

const listFarmerReviews = asyncHandler(async (req, res) => {
  const reviews = await Review.find({ farmer: req.params.farmerId, status: 'active' })
    .populate(reviewPopulate).sort({ createdAt: -1 });
  res.status(200).json({ success: true, data: { reviews } });
});

const listMyReviews = asyncHandler(async (req, res) => {
  const reviews = await Review.find({ farmer: req.user._id, status: 'active' })
    .populate(reviewPopulate).sort({ createdAt: -1 });
  res.status(200).json({ success: true, data: { reviews } });
});

const createReview = asyncHandler(async (req, res) => {
  const { product, rating, comment } = req.body;
  if (!mongoose.isValidObjectId(product)) throw new AppError('A valid product is required', 400);
  if (!Number.isInteger(Number(rating)) || Number(rating) < 1 || Number(rating) > 5) throw new AppError('Rating must be an integer from 1 to 5', 400);
  if (!comment || !comment.trim()) throw new AppError('Review comment is required', 400);

  const productDoc = await Product.findById(product);
  if (!productDoc) throw new AppError('Product not found', 404);
  const completedOrder = await Order.exists({
    customer: req.user._id,
    status: 'completed',
    items: { $elemMatch: { product: productDoc._id } },
  });
  if (!completedOrder) throw new AppError('You can review a product after completing an order for it', 403);

  const review = await Review.create({ product, farmer: productDoc.farmer, customer: req.user._id, rating: Number(rating), comment: comment.trim() });
  await refreshRatings(productDoc._id, productDoc.farmer);
  await review.populate(reviewPopulate);
  res.status(201).json({ success: true, message: 'Review submitted', data: { review } });
});

const respondToReview = asyncHandler(async (req, res) => {
  const review = await Review.findOne({ _id: req.params.id, farmer: req.user._id, status: 'active' });
  if (!review) throw new AppError('Review not found or not assigned to you', 404);
  if (!req.body.response || !req.body.response.trim()) throw new AppError('Response is required', 400);
  review.response = req.body.response.trim();
  review.respondedAt = new Date();
  await review.save();
  await review.populate(reviewPopulate);
  res.status(200).json({ success: true, message: 'Response saved', data: { review } });
});

const removeReview = asyncHandler(async (req, res) => {
  const review = await Review.findByIdAndUpdate(req.params.id, { status: 'removed' }, { new: true });
  if (!review) throw new AppError('Review not found', 404);
  await refreshRatings(review.product, review.farmer);
  res.status(200).json({ success: true, message: 'Review removed' });
});

module.exports = { listProductReviews, listFarmerReviews, listMyReviews, createReview, respondToReview, removeReview };
