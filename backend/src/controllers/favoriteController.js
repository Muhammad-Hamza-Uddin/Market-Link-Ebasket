const mongoose = require('mongoose');
const Favorite = require('../models/Favorite');
const Product = require('../models/Product');
const User = require('../models/User');
const AppError = require('../utils/AppError');
const asyncHandler = require('../utils/asyncHandler');

const listFavorites = asyncHandler(async (req, res) => {
  const favorites = await Favorite.find({ user: req.user._id }).sort({ createdAt: -1 });
  const products = await Product.find({ _id: { $in: favorites.filter((f) => f.targetType === 'product').map((f) => f.target) } })
    .populate('farmer', 'name farmName location')
    .populate('market', 'name address location marketDays openingTime closingTime');
  const farmers = await User.find({ _id: { $in: favorites.filter((f) => f.targetType === 'farmer').map((f) => f.target) } })
    .select('name farmName imageUrl location accountStatus createdAt');
  const productAlertMap = new Map(favorites.filter((f) => f.targetType === 'product').map((f) => [String(f.target), f.restockAlert]));
  const productsWithAlerts = products.map((product) => ({ ...product.toObject(), restockAlert: Boolean(productAlertMap.get(String(product._id))) }));

  res.status(200).json({ success: true, data: { favorites: { products: productsWithAlerts, farmers } } });
});

const addFavorite = asyncHandler(async (req, res) => {
  const { targetType, target, restockAlert = false } = req.body;
  if (!['product', 'farmer'].includes(targetType) || !mongoose.isValidObjectId(target)) {
    throw new AppError('targetType must be product or farmer and target must be valid', 400);
  }
  const exists = targetType === 'product' ? await Product.exists({ _id: target }) : await User.exists({ _id: target, role: 'farmer' });
  if (!exists) throw new AppError('Favorite target not found', 404);
  const favorite = await Favorite.findOneAndUpdate(
    { user: req.user._id, targetType, target },
    { $setOnInsert: { user: req.user._id, targetType, target, ...(targetType === 'product' ? { restockAlert: Boolean(restockAlert) } : {}) } },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );
  res.status(201).json({ success: true, data: { favorite } });
});

const updateRestockAlert = asyncHandler(async (req, res) => {
  if (!mongoose.isValidObjectId(req.params.target)) throw new AppError('Invalid product identifier', 400);
  const favorite = await Favorite.findOneAndUpdate(
    { user: req.user._id, targetType: 'product', target: req.params.target },
    { restockAlert: Boolean(req.body.enabled) },
    { new: true }
  );
  if (!favorite) throw new AppError('Favorite product not found', 404);
  res.json({ success: true, data: { favorite } });
});

const removeFavorite = asyncHandler(async (req, res) => {
  const { targetType, target } = req.params;
  await Favorite.findOneAndDelete({ user: req.user._id, targetType, target });
  res.status(200).json({ success: true, message: 'Favorite removed' });
});

module.exports = { listFavorites, addFavorite, removeFavorite, updateRestockAlert };
