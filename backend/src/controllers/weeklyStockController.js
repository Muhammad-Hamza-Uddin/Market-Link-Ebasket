const mongoose = require('mongoose');
const WeeklyStockTemplate = require('../models/WeeklyStockTemplate');
const Product = require('../models/Product');
const Market = require('../models/Market');
const AppError = require('../utils/AppError');
const asyncHandler = require('../utils/asyncHandler');
const Favorite = require('../models/Favorite');
const { createNotification } = require('../utils/notifications');

const validateOwnership = async (farmerId, market, entries, overrides = []) => {
  if (!mongoose.isValidObjectId(market)) throw new AppError('A valid market is required', 400);
  if (!(await Market.exists({ _id: market, isActive: true }))) throw new AppError('Market is unavailable', 400);
  if (!Array.isArray(entries) || !entries.length) throw new AppError('At least one template entry is required', 400);
  const ids = entries.map((entry) => entry.product);
  if (ids.some((id) => !mongoose.isValidObjectId(id))) throw new AppError('Every template entry needs a valid product', 400);
  if (new Set(ids.map(String)).size !== ids.length) throw new AppError('A product can appear only once in a template', 400);
  entries.forEach((entry) => {
    if (!Number.isFinite(Number(entry.defaultQuantity)) || Number(entry.defaultQuantity) < 0) throw new AppError('Default quantity must be zero or greater', 400);
    if (!Number.isFinite(Number(entry.defaultPrice)) || Number(entry.defaultPrice) < 0) throw new AppError('Default price must be zero or greater', 400);
  });
  const count = await Product.countDocuments({ _id: { $in: ids }, farmer: farmerId, market });
  if (count !== ids.length) throw new AppError('Template products must belong to you and the selected market', 403);
  if (!Array.isArray(overrides)) throw new AppError('Overrides must be an array', 400);
  overrides.forEach((override) => {
    if (!ids.map(String).includes(String(override.product))) throw new AppError('Override products must belong to the template', 400);
    if (Number.isNaN(new Date(override.date).getTime())) throw new AppError('Override date must be valid', 400);
    if (!Number.isFinite(Number(override.quantity)) || Number(override.quantity) < 0) throw new AppError('Override quantity must be zero or greater', 400);
    if (override.price !== undefined && (!Number.isFinite(Number(override.price)) || Number(override.price) < 0)) throw new AppError('Override price must be zero or greater', 400);
  });
};

const list = asyncHandler(async (req, res) => {
  const templates = await WeeklyStockTemplate.find({ farmer: req.user._id })
    .populate('market', 'name marketDays')
    .populate('entries.product', 'name imageUrl quantity price unit')
    .sort({ dayOfWeek: 1, name: 1 });
  res.json({ success: true, data: { templates } });
});

const create = asyncHandler(async (req, res) => {
  await validateOwnership(req.user._id, req.body.market, req.body.entries, req.body.overrides || []);
  const template = await WeeklyStockTemplate.create({ ...req.body, farmer: req.user._id });
  res.status(201).json({ success: true, data: { template } });
});

const update = asyncHandler(async (req, res) => {
  const template = await WeeklyStockTemplate.findOne({ _id: req.params.id, farmer: req.user._id });
  if (!template) throw new AppError('Weekly stock template not found', 404);
  const market = req.body.market || template.market;
  const entries = req.body.entries || template.entries;
  const overrides = req.body.overrides || template.overrides;
  await validateOwnership(req.user._id, market, entries, overrides);
  ['name', 'market', 'enabled', 'dayOfWeek', 'entries', 'overrides'].forEach((field) => {
    if (req.body[field] !== undefined) template[field] = req.body[field];
  });
  await template.save();
  res.json({ success: true, data: { template } });
});

const remove = asyncHandler(async (req, res) => {
  const deleted = await WeeklyStockTemplate.findOneAndDelete({ _id: req.params.id, farmer: req.user._id });
  if (!deleted) throw new AppError('Weekly stock template not found', 404);
  res.json({ success: true, message: 'Weekly stock template deleted' });
});

// Copies template values into independent Product inventory for one date. Orders
// only decrement Product.quantity; recurring template values are never mutated.
const apply = asyncHandler(async (req, res) => {
  const template = await WeeklyStockTemplate.findOne({ _id: req.params.id, farmer: req.user._id, enabled: true });
  if (!template) throw new AppError('Enabled weekly stock template not found', 404);
  const date = new Date(req.body.date);
  if (Number.isNaN(date.getTime())) throw new AppError('A valid date is required', 400);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  if (date < today) throw new AppError('Weekly stock cannot be applied to a past date', 400);
  const weekday = date.toLocaleDateString('en-US', { weekday: 'long', timeZone: 'Asia/Karachi' }).toLowerCase();
  if (weekday !== template.dayOfWeek) throw new AppError(`Template can only be applied to ${template.dayOfWeek}`, 400);
  const dateKey = date.toISOString().slice(0, 10);
  const operations = template.entries.filter((entry) => entry.active).map(async (entry) => {
    const override = template.overrides.find((item) => item.product.equals(entry.product) && item.date.toISOString().slice(0, 10) === dateKey);
    const product = await Product.findOne({ _id: entry.product, farmer: req.user._id, market: template.market });
    if (!product) throw new AppError('A template product is unavailable or no longer belongs to you', 403);
    const wasOutOfStock = product.quantity === 0;
    product.quantity = override?.quantity ?? entry.defaultQuantity;
    product.price = override?.price ?? entry.defaultPrice;
    product.availableDate = date;
    product.isAvailable = true;
    await product.save();
    if (wasOutOfStock && product.quantity > 0) {
      const subscribers = await Favorite.find({ targetType: 'product', target: product._id, restockAlert: true });
      await Promise.all(subscribers.map((favorite) => createNotification({
        user: favorite.user,
        type: 'restock',
        title: `${product.name} is back in stock`,
        message: `${product.name} is available to pre-order again.`,
        relatedProduct: product._id,
        eventKey: `restock:${product._id}:weekly:${dateKey}`,
      })));
    }
  });
  await Promise.all(operations);
  res.json({ success: true, message: 'Weekly stock copied to live inventory' });
});

module.exports = { list, create, update, remove, apply };