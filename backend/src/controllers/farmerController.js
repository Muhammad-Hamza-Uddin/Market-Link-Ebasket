const User = require('../models/User');
const AppError = require('../utils/AppError');
const asyncHandler = require('../utils/asyncHandler');
const Product = require('../models/Product');
const Review = require('../models/Review');
const Order = require('../models/Order');

const publicFields = 'name farmName imageUrl email phone location bio operatingDays pickupStartTime pickupEndTime orderCutoffTime pickupSlotMinutes coordinates markets preferredMarket accountStatus createdAt';

const getFarmers = asyncHandler(async (req, res) => {
  const filter = { role: 'farmer', accountStatus: 'active' };

  if (req.query.search) {
    const escaped = req.query.search.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const search = new RegExp(escaped, 'i');
    filter.$or = [{ name: search }, { farmName: search }, { location: search }];
  }

  const farmers = await User.find(filter).select(publicFields).populate('markets preferredMarket', 'name address marketDays openingTime closingTime location').sort({ farmName: 1 }).lean();
  const ids = farmers.map((farmer) => farmer._id);
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

  const [reviewStats, productStats, weeklyOrders] = await Promise.all([
    Review.aggregate([{ $match: { farmer: { $in: ids }, status: 'active' } }, { $group: { _id: '$farmer', rating: { $avg: '$rating' }, reviewsCount: { $sum: 1 } } }]),
    Product.aggregate([{ $match: { farmer: { $in: ids }, isAvailable: true } }, { $group: { _id: '$farmer', productsCount: { $sum: 1 } } }]),
    Order.countDocuments({ createdAt: { $gte: sevenDaysAgo }, status: { $ne: 'cancelled' } }),
  ]);
  const reviewMap = new Map(reviewStats.map((item) => [String(item._id), item]));
  const productMap = new Map(productStats.map((item) => [String(item._id), item.productsCount]));
  const enriched = farmers.map((farmer) => ({ ...farmer, rating: reviewMap.get(String(farmer._id))?.rating || 0, reviewsCount: reviewMap.get(String(farmer._id))?.reviewsCount || 0, productsCount: productMap.get(String(farmer._id)) || 0 }));

  res.status(200).json({
    success: true,
    count: enriched.length,
    data: {
      farmers: enriched,
      stats: { activeFarmers: enriched.length, weeklyOrders },
    },
  });
});

const getFarmer = asyncHandler(async (req, res) => {
  const farmer = await User.findOne({
    _id: req.params.id,
    role: 'farmer',
    accountStatus: 'active',
  }).select(publicFields).populate('markets preferredMarket', 'name address marketDays openingTime closingTime location').lean();

  if (!farmer) throw new AppError('Farmer not found', 404);

  const [stats] = await Review.aggregate([{ $match: { farmer: farmer._id, status: 'active' } }, { $group: { _id: null, rating: { $avg: '$rating' }, reviewsCount: { $sum: 1 } } }]);
  const productsCount = await Product.countDocuments({ farmer: farmer._id, isAvailable: true });
  res.status(200).json({ success: true, data: { farmer: { ...farmer, rating: stats?.rating || 0, reviewsCount: stats?.reviewsCount || 0, productsCount } } });
});

module.exports = { getFarmers, getFarmer };

