const Product = require('../models/Product');
const mongoose = require('mongoose');
const fs = require('fs/promises');
const path = require('path');
const Market = require('../models/Market');
const AppError = require('../utils/AppError');
const asyncHandler = require('../utils/asyncHandler');
const Favorite = require('../models/Favorite');
const { createNotification } = require('../utils/notifications');
const Category = require('../models/Category');
const { ensureDefaultCategories } = require('../utils/categoryMasterData');

const productFields = [
  'market',
  'name',
  'description',
  'category',
  'unit',
  'price',
  'quantity',
  'availableDate',
  'imageUrl',
  'isAvailable',
];

const removeStoredProductImage = async (imageUrl) => {
  if (!imageUrl?.startsWith('/uploads/products/')) return;
  const filename = path.basename(imageUrl);
  await fs.unlink(path.resolve(__dirname, '../../uploads/products', filename)).catch((error) => {
    if (error.code !== 'ENOENT') throw error;
  });
};

const pick = (source, fields) =>
  fields.reduce((result, field) => {
    if (source[field] !== undefined) result[field] = source[field];
    return result;
  }, {});

const ensureActiveMarket = async (marketId) => {
  if (!mongoose.isValidObjectId(marketId)) throw new AppError('A valid active market is required', 400);
  const market = await Market.findOne({ _id: marketId, isActive: true });
  if (!market) throw new AppError('An active market is required', 400);
};

const validateProductInput = async (source, { partial = false } = {}) => {
  if (!partial || source.name !== undefined) {
    if (!String(source.name || '').trim()) throw new AppError('Product name is required', 400);
  }
  if (!partial || source.category !== undefined) {
    await ensureDefaultCategories();
    const category = await Category.findOne({ slug: String(source.category || '').toLowerCase(), isActive: true }).select('_id');
    if (!category) throw new AppError('Choose an active product category', 400);
  }
  if (!partial || source.unit !== undefined) {
    if (!['kg', 'gram', 'piece', 'dozen', 'bunch', 'box', 'litre'].includes(source.unit)) throw new AppError('Invalid product unit', 400);
  }
  ['price', 'quantity'].forEach((field) => {
    if (!partial || source[field] !== undefined) {
      const value = Number(source[field]);
      if (!Number.isFinite(value) || value < 0) throw new AppError(`${field} must be zero or greater`, 400);
    }
  });
  if (!partial || source.availableDate !== undefined) {
    if (!source.availableDate || Number.isNaN(new Date(source.availableDate).getTime())) throw new AppError('A valid available date is required', 400);
  }
  if (source.description !== undefined && String(source.description).length > 500) throw new AppError('Description cannot exceed 500 characters', 400);
  if (source.isAvailable !== undefined && typeof source.isAvailable !== 'boolean') throw new AppError('Availability must be true or false', 400);
};

const getProducts = asyncHandler(async (req, res) => {
  const filter = { isAvailable: true };

  if (req.query.market) filter.market = req.query.market;
  if (req.query.farmer) filter.farmer = req.query.farmer;
  if (req.query.category) filter.category = req.query.category.toLowerCase();
  if (req.query.minPrice || req.query.maxPrice) {
    filter.price = {};
    if (req.query.minPrice) filter.price.$gte = Number(req.query.minPrice);
    if (req.query.maxPrice) filter.price.$lte = Number(req.query.maxPrice);
  }
  if (req.query.marketDay) {
    const marketIds = await Market.find({ isActive: true, marketDays: req.query.marketDay.toLowerCase() }).distinct('_id');
    filter.market = { ...(filter.market ? { $eq: filter.market } : {}), $in: marketIds };
  }
  if (req.query.inStock === 'true') filter.quantity = { $gt: 0 };
  if (req.query.search) filter.$text = { $search: req.query.search };

  const products = await Product.find(filter)
    .populate('farmer', 'name farmName location operatingDays pickupStartTime pickupEndTime orderCutoffTime pickupSlotMinutes coordinates')
    .populate('market', 'name address location marketDays openingTime closingTime')
    .sort(req.query.search ? { score: { $meta: 'textScore' } } : { availableDate: 1 });

  res.status(200).json({
    success: true,
    count: products.length,
    data: { products },
  });
});

const getProduct = asyncHandler(async (req, res) => {
  const product = await Product.findOne({ _id: req.params.id, isAvailable: true })
    .populate('farmer', 'name farmName location operatingDays pickupStartTime pickupEndTime orderCutoffTime pickupSlotMinutes coordinates')
    .populate('market', 'name address location marketDays openingTime closingTime');

  if (!product) throw new AppError('Product not found', 404);

  res.status(200).json({ success: true, data: { product } });
});

const getMyProducts = asyncHandler(async (req, res) => {
  const products = await Product.find({ farmer: req.user._id })
    .populate('market', 'name address')
    .sort({ createdAt: -1 });

  res.status(200).json({
    success: true,
    count: products.length,
    data: { products },
  });
});

const createProduct = asyncHandler(async (req, res) => {
  await ensureActiveMarket(req.body.market);
  await validateProductInput(req.body);

  const data = pick(req.body, productFields);
  data.farmer = req.user._id;
  const product = await Product.create(data);

  res.status(201).json({
    success: true,
    message: 'Product published successfully',
    data: { product },
  });
});

const updateProduct = asyncHandler(async (req, res) => {
  const existing = await Product.findOne({ _id: req.params.id, farmer: req.user._id });
  if (!existing) throw new AppError('Product not found or not owned by you', 404);

  if (req.body.market) await ensureActiveMarket(req.body.market);
  await validateProductInput(req.body, { partial: true });

  const wasOutOfStock = existing.quantity === 0;
  Object.assign(existing, pick(req.body, productFields));
  await existing.save();
  if (wasOutOfStock && existing.quantity > 0) {
    const subscribers = await Favorite.find({ targetType: 'product', target: existing._id, restockAlert: true });
    await Promise.all(subscribers.map((favorite) => createNotification({
      user: favorite.user,
      type: 'restock',
      title: `${existing.name} is back in stock`,
      message: `${existing.name} is available to pre-order again.`,
      relatedProduct: existing._id,
      eventKey: `restock:${existing._id}:${existing.updatedAt.getTime()}`,
    })));
  }

  res.status(200).json({
    success: true,
    message: 'Product updated successfully',
    data: { product: existing },
  });
});

const uploadProductImage = asyncHandler(async (req, res) => {
  if (!req.file) throw new AppError('Choose an image to upload', 400);

  const product = await Product.findOne({ _id: req.params.id, farmer: req.user._id });
  if (!product) {
    await fs.unlink(req.file.path).catch(() => {});
    throw new AppError('Product not found or not owned by you', 404);
  }

  const previousImage = product.imageUrl;
  product.imageUrl = `/uploads/products/${req.file.filename}`;
  await product.save();
  await removeStoredProductImage(previousImage);

  res.status(200).json({
    success: true,
    message: 'Product image uploaded successfully',
    data: { product },
  });
});

const deleteProductImage = asyncHandler(async (req, res) => {
  const product = await Product.findOne({ _id: req.params.id, farmer: req.user._id });
  if (!product) throw new AppError('Product not found or not owned by you', 404);

  const previousImage = product.imageUrl;
  product.imageUrl = '';
  await product.save();
  await removeStoredProductImage(previousImage);

  res.status(200).json({
    success: true,
    message: 'Product image removed successfully',
    data: { product },
  });
});

const archiveProduct = asyncHandler(async (req, res) => {
  const product = await Product.findOneAndUpdate(
    { _id: req.params.id, farmer: req.user._id },
    { isAvailable: false },
    { new: true }
  );

  if (!product) throw new AppError('Product not found or not owned by you', 404);

  res.status(200).json({
    success: true,
    message: 'Product archived successfully',
  });
});

module.exports = {
  getProducts,
  getProduct,
  getMyProducts,
  createProduct,
  updateProduct,
  uploadProductImage,
  deleteProductImage,
  archiveProduct,
};

