const Market = require('../models/Market');
const User = require('../models/User');
const Order = require('../models/Order');
const Product = require('../models/Product');
const Review = require('../models/Review');
const Category = require('../models/Category');
const Notification = require('../models/Notification');
const Favorite = require('../models/Favorite');
const fs = require('fs/promises');
const path = require('path');
const AppError = require('../utils/AppError');
const asyncHandler = require('../utils/asyncHandler');
const { ensureDefaultCategories } = require('../utils/categoryMasterData');

const marketFields = [
  'name',
  'address',
  'location',
  'marketDays',
  'openingTime',
  'closingTime',
  'description',
  'isActive',
];

const pick = (source, fields) =>
  fields.reduce((result, field) => {
    if (source[field] !== undefined) result[field] = source[field];
    return result;
  }, {});

const removeStoredMarketImage = async (imageUrl) => {
  if (!String(imageUrl || '').startsWith('/uploads/markets/')) return;
  const filePath = path.resolve(__dirname, '../../uploads/markets', path.basename(imageUrl));
  await fs.unlink(filePath).catch((error) => {
    if (error.code !== 'ENOENT') throw error;
  });
};

const listFarmers = asyncHandler(async (req, res) => {
  const filter = { role: 'farmer' };
  if (req.query.status) filter.accountStatus = req.query.status;

  const farmers = await User.find(filter)
    .select('+registrationNumber')
    .populate('preferredMarket', 'name address')
    .sort({ createdAt: -1 });

  const safeFarmers = farmers.map((farmer) => {
    const item = farmer.toObject();
    const registrationNumber = item.registrationNumber || '';
    delete item.registrationNumber;
    item.registrationNumberMasked = registrationNumber ? `••••${registrationNumber.slice(-4)}` : null;
    item.registrationNumberProvided = Boolean(registrationNumber);
    return item;
  });

  res.status(200).json({
    success: true,
    count: safeFarmers.length,
    data: { farmers: safeFarmers },
  });
});

const listCustomers = asyncHandler(async (req, res) => {
  const filter = { role: 'customer' };
  if (req.query.status) filter.accountStatus = req.query.status;
  if (req.query.search) {
    const escaped = req.query.search.trim().replace(/[.*+?^${}()|[\\]\\\\]/g, '\\\\$&');
    const search = new RegExp(escaped, 'i');
    filter.$or = [{ name: search }, { email: search }, { phone: search }, { address: search }];
  }
  const customers = await User.find(filter)
    .select('-password -tokenVersion')
    .populate('preferredMarket', 'name address')
    .sort({ createdAt: -1 });
  const customersWithCounts = await Promise.all(customers.map(async (customer) => ({
    ...customer.toObject(),
    ordersCount: await Order.countDocuments({ customer: customer._id }),
  })));
  res.status(200).json({ success: true, count: customersWithCounts.length, data: { customers: customersWithCounts } });
});

const createCustomer = asyncHandler(async (req, res) => {
  const { name, email, password, phone, address, preferredMarket } = req.body;
  if (!password || password.length < 6) throw new AppError('A customer password of at least 6 characters is required', 400);
  if (preferredMarket) {
    const market = await Market.findOne({ _id: preferredMarket, isActive: true }).select('_id');
    if (!market) throw new AppError('Preferred market is not available', 400);
  }
  const customer = await User.create({ name, email, password, phone, address, preferredMarket, preferredMarkets: preferredMarket ? [preferredMarket] : [], role: 'customer', accountStatus: 'active' });
  const safeCustomer = await User.findById(customer._id).select('-password -tokenVersion').populate(['preferredMarket', 'preferredMarkets']);
  res.status(201).json({ success: true, message: 'Customer created', data: { customer: safeCustomer } });
});

const updateCustomer = asyncHandler(async (req, res) => {
  const allowed = ['name', 'email', 'phone', 'address', 'preferredMarket'];
  const updates = pick(req.body, allowed);
  if (updates.preferredMarket === '') updates.preferredMarket = null;
  if (updates.preferredMarket) {
    const market = await Market.findOne({ _id: updates.preferredMarket, isActive: true }).select('_id');
    if (!market) throw new AppError('Preferred market is not available', 400);
  }
  if (updates.preferredMarket !== undefined) updates.preferredMarkets = updates.preferredMarket ? [updates.preferredMarket] : [];
  if (updates.email) updates.email = updates.email.trim().toLowerCase();
  const customer = await User.findOneAndUpdate({ _id: req.params.id, role: 'customer' }, updates, { new: true, runValidators: true })
    .select('-password -tokenVersion')
    .populate([
      { path: 'preferredMarket', select: 'name address' },
      { path: 'preferredMarkets', select: 'name address' },
    ]);
  if (!customer) throw new AppError('Customer not found', 404);
  res.status(200).json({ success: true, message: 'Customer updated', data: { customer } });
});

const deleteCustomer = asyncHandler(async (req, res) => {
  const customer = await User.findOne({ _id: req.params.id, role: 'customer' }).select('_id');
  if (!customer) throw new AppError('Customer not found', 404);
  if (await Order.exists({ customer: customer._id })) {
    throw new AppError('Customer has order history. Suspend the account instead of deleting it.', 409);
  }
  await Favorite.deleteMany({ user: customer._id });
  await User.deleteOne({ _id: customer._id, role: 'customer' });
  res.status(200).json({ success: true, message: 'Customer deleted' });
});

const updateCustomerStatus = asyncHandler(async (req, res) => {
  if (!['active', 'suspended'].includes(req.body.status)) throw new AppError('Status must be active or suspended', 400);
  const customer = await User.findOneAndUpdate(
    { _id: req.params.id, role: 'customer' },
    { $set: { accountStatus: req.body.status }, ...(req.body.status === 'suspended' ? { $inc: { tokenVersion: 1 } } : {}) },
    { new: true, runValidators: true }
  ).select('-password -tokenVersion');
  if (!customer) throw new AppError('Customer not found', 404);
  res.status(200).json({ success: true, message: 'Customer status updated', data: { customer } });
});

const archiveProduct = asyncHandler(async (req, res) => {
  const product = await Product.findByIdAndUpdate(req.params.id, { isAvailable: false }, { new: true });
  if (!product) throw new AppError('Product not found', 404);
  res.status(200).json({ success: true, message: 'Product archived by admin' });
});

const listProducts = asyncHandler(async (req, res) => {
  const products = await Product.find()
    .populate('farmer', 'name farmName email')
    .populate('market', 'name address')
    .sort({ createdAt: -1 });
  res.json({ success: true, count: products.length, data: { products } });
});

const updateProductStatus = asyncHandler(async (req, res) => {
  if (typeof req.body.isAvailable !== 'boolean') throw new AppError('Product availability must be true or false', 400);
  const product = await Product.findByIdAndUpdate(req.params.id, { isAvailable: req.body.isAvailable }, { new: true, runValidators: true })
    .populate('farmer', 'name farmName email').populate('market', 'name address');
  if (!product) throw new AppError('Product not found', 404);
  res.json({ success: true, message: req.body.isAvailable ? 'Product listing restored' : 'Product listing removed', data: { product } });
});

const listReviews = asyncHandler(async (req, res) => {
  const reviews = await Review.find()
    .populate('customer', 'name email')
    .populate('farmer', 'name farmName')
    .populate('product', 'name')
    .sort({ createdAt: -1 });
  res.json({ success: true, count: reviews.length, data: { reviews } });
});

const removeReview = asyncHandler(async (req, res) => {
  const review = await Review.findByIdAndUpdate(req.params.id, { status: 'removed' }, { new: true });
  if (!review) throw new AppError('Review not found', 404);
  res.status(200).json({ success: true, message: 'Review removed by admin' });
});

const updateFarmer = asyncHandler(async (req, res) => {
  const updates = pick(req.body, ['name', 'email', 'farmName', 'imageUrl', 'phone', 'address', 'location', 'operatingDays', 'pickupStartTime', 'pickupEndTime', 'coordinates']);
  if (updates.email) updates.email = updates.email.trim().toLowerCase();
  const farmer = await User.findOneAndUpdate({ _id: req.params.id, role: 'farmer' }, updates, { new: true, runValidators: true })
    .populate('preferredMarket', 'name address');
  if (!farmer) throw new AppError('Farmer not found', 404);
  res.status(200).json({ success: true, message: 'Farmer details updated', data: { farmer } });
});

const updateFarmerStatus = asyncHandler(async (req, res) => {
  const allowedStatuses = ['pending', 'active', 'suspended'];

  if (!allowedStatuses.includes(req.body.status)) {
    throw new AppError('Status must be pending, active, or suspended', 400);
  }

  const update = { $set: { accountStatus: req.body.status } };
  if (req.body.status === 'suspended') update.$inc = { tokenVersion: 1 };
  const farmer = await User.findOneAndUpdate(
    { _id: req.params.id, role: 'farmer' },
    update,
    { new: true, runValidators: true }
  );

  if (!farmer) throw new AppError('Farmer not found', 404);

  res.status(200).json({
    success: true,
    message: `Farmer status changed to ${farmer.accountStatus}`,
    data: { farmer },
  });
});

const createMarket = asyncHandler(async (req, res) => {
  const market = await Market.create(pick(req.body, marketFields));

  res.status(201).json({
    success: true,
    message: 'Market created successfully',
    data: { market },
  });
});

const listOrders = asyncHandler(async (req, res) => {
  const orders = await Order.find()
    .populate('customer', 'name email phone')
    .populate('farmer', 'name farmName phone')
    .populate('market', 'name address')
    .sort({ createdAt: -1 });

  res.status(200).json({ success: true, count: orders.length, data: { orders } });
});

const getReport = asyncHandler(async (req, res) => {
  const [orderStats] = await Order.aggregate([
    { $group: { _id: null, orderCount: { $sum: 1 }, revenue: { $sum: { $cond: [{ $eq: ['$status', 'completed'] }, '$totalAmount', 0] } } } },
  ]);
  const [farmerCount, customerCount, marketCount, activeProductCount] = await Promise.all([
    User.countDocuments({ role: 'farmer' }),
    User.countDocuments({ role: 'customer', accountStatus: 'active' }),
    Market.countDocuments({ isActive: true }),
    Product.countDocuments({ isAvailable: true }),
  ]);
  const pendingFarmerCount = await User.countDocuments({ role: 'farmer', accountStatus: 'pending' });
  const recentOrders = await Order.find().sort({ createdAt: -1 }).limit(5)
    .populate('customer', 'name')
    .populate('market', 'name')
    .select('customer market totalAmount status createdAt');
  const bestSelling = await Order.aggregate([
    { $match: { status: { $ne: 'cancelled' } } },
    { $unwind: '$items' },
    { $group: { _id: '$items.product', name: { $first: '$items.name' }, units: { $sum: '$items.quantity' } } },
    { $sort: { units: -1 } },
    { $limit: 5 },
  ]);
  const [marketRevenueRows, activeFarmerRows] = await Promise.all([
    Order.aggregate([
      { $match: { status: { $ne: 'cancelled' } } },
      { $group: { _id: '$market', orderCount: { $sum: 1 }, revenue: { $sum: { $cond: [{ $eq: ['$status', 'completed'] }, '$totalAmount', 0] } } } },
      { $sort: { revenue: -1, orderCount: -1 } },
    ]),
    Order.aggregate([
      { $match: { status: { $ne: 'cancelled' } } },
      { $group: { _id: '$farmer', orderCount: { $sum: 1 }, completedOrders: { $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] } }, revenue: { $sum: { $cond: [{ $eq: ['$status', 'completed'] }, '$totalAmount', 0] } }, units: { $sum: { $sum: '$items.quantity' } } } },
      { $sort: { orderCount: -1, revenue: -1 } },
      { $limit: 10 },
    ]),
  ]);
  const [reportMarkets, reportFarmers] = await Promise.all([
    Market.find({ _id: { $in: marketRevenueRows.map((item) => item._id) } }).select('name address').lean(),
    User.find({ _id: { $in: activeFarmerRows.map((item) => item._id) } }).select('name farmName').lean(),
  ]);
  const marketMap = new Map(reportMarkets.map((market) => [String(market._id), market]));
  const farmerMap = new Map(reportFarmers.map((farmer) => [String(farmer._id), farmer]));
  const marketRevenue = marketRevenueRows.map((item) => ({ ...item, market: marketMap.get(String(item._id)) }));
  const activeFarmers = activeFarmerRows.map((item) => ({ ...item, farmer: farmerMap.get(String(item._id)) }));

  res.status(200).json({
    success: true,
    data: { report: { orderCount: orderStats?.orderCount || 0, revenue: orderStats?.revenue || 0, farmerCount, customerCount, marketCount, activeProductCount, pendingFarmerCount, bestSelling, recentOrders, marketRevenue, activeFarmers } },
  });
});

const listCategories = asyncHandler(async (req, res) => {
  await ensureDefaultCategories();
  const categories = await Category.find().sort({ sortOrder: 1, name: 1 });
  res.json({ success: true, count: categories.length, data: { categories } });
});

const broadcastNotification = asyncHandler(async (req, res) => {
  const title = String(req.body.title || '').trim();
  const message = String(req.body.message || '').trim();
  const audience = req.body.audience || 'all';
  if (!title || !message) throw new AppError('Notification title and message are required', 400);
  if (!['all', 'customer', 'farmer', 'admin'].includes(audience)) throw new AppError('Invalid notification audience', 400);
  const recipients = await User.find({ accountStatus: 'active', ...(audience === 'all' ? {} : { role: audience }) }).select('_id');
  const batchKey = `broadcast:${Date.now()}`;
  if (recipients.length) await Notification.insertMany(recipients.map((recipient) => ({ user: recipient._id, type: 'announcement', title, message, eventKey: `${batchKey}:${recipient._id}` })));
  res.status(201).json({ success: true, message: `Notification sent to ${recipients.length} users`, data: { recipientCount: recipients.length } });
});

const deleteMarket = asyncHandler(async (req, res) => {
  const market = await Market.findByIdAndUpdate(req.params.id, { isActive: false }, { new: true });
  if (!market) throw new AppError('Market not found', 404);
  res.status(200).json({ success: true, message: 'Market archived successfully' });
});

const updateMarket = asyncHandler(async (req, res) => {
  const updates = pick(req.body, marketFields);
  const market = await Market.findByIdAndUpdate(req.params.id, updates, {
    new: true,
    runValidators: true,
  });

  if (!market) throw new AppError('Market not found', 404);

  res.status(200).json({
    success: true,
    message: 'Market updated successfully',
    data: { market },
  });
});

const uploadMarketImage = asyncHandler(async (req, res) => {
  if (!req.file) throw new AppError('Choose a market image to upload', 400);
  const market = await Market.findById(req.params.id);
  if (!market) throw new AppError('Market not found', 404);
  const previousImage = market.imageUrl;
  market.imageUrl = `/uploads/markets/${req.file.filename}`;
  await market.save();
  await removeStoredMarketImage(previousImage);
  res.status(200).json({ success: true, message: 'Market image uploaded successfully', data: { market } });
});

const deleteMarketImage = asyncHandler(async (req, res) => {
  const market = await Market.findById(req.params.id);
  if (!market) throw new AppError('Market not found', 404);
  const previousImage = market.imageUrl;
  market.imageUrl = undefined;
  await market.save();
  await removeStoredMarketImage(previousImage);
  res.status(200).json({ success: true, message: 'Market image removed', data: { market } });
});

module.exports = {
  listFarmers,
  listCustomers,
  createCustomer,
  updateCustomer,
  deleteCustomer,
  updateCustomerStatus,
  archiveProduct,
  listProducts,
  updateProductStatus,
  removeReview,
  listReviews,
  updateFarmer,
  updateFarmerStatus,
  createMarket,
  updateMarket,
  uploadMarketImage,
  deleteMarketImage,
  deleteMarket,
  listOrders,
  getReport,
  listCategories,
  broadcastNotification,
};

