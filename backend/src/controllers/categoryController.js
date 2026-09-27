const Category = require('../models/Category');
const Product = require('../models/Product');
const AppError = require('../utils/AppError');
const asyncHandler = require('../utils/asyncHandler');
const { ensureDefaultCategories } = require('../utils/categoryMasterData');

const slugify = (value) => String(value || '').trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

const listActive = asyncHandler(async (req, res) => {
  await ensureDefaultCategories();
  const categories = await Category.find({ isActive: true }).sort({ sortOrder: 1, name: 1 });
  res.json({ success: true, count: categories.length, data: { categories } });
});

const listAll = asyncHandler(async (req, res) => {
  await ensureDefaultCategories();
  const categories = await Category.find().sort({ sortOrder: 1, name: 1 });
  res.json({ success: true, count: categories.length, data: { categories } });
});

const create = asyncHandler(async (req, res) => {
  const name = String(req.body.name || '').trim();
  const slug = slugify(req.body.slug || name);
  if (!name || !slug) throw new AppError('Category name is required', 400);
  const category = await Category.create({ name, slug, icon: req.body.icon || 'basket', sortOrder: Number(req.body.sortOrder || 0), isActive: req.body.isActive !== false });
  res.status(201).json({ success: true, message: 'Category created', data: { category } });
});

const update = asyncHandler(async (req, res) => {
  const category = await Category.findById(req.params.id);
  if (!category) throw new AppError('Category not found', 404);
  if (req.body.name !== undefined) category.name = String(req.body.name).trim();
  if (req.body.slug !== undefined) category.slug = slugify(req.body.slug);
  if (req.body.icon !== undefined) category.icon = req.body.icon;
  if (req.body.sortOrder !== undefined) category.sortOrder = Number(req.body.sortOrder);
  if (req.body.isActive !== undefined) category.isActive = Boolean(req.body.isActive);
  await category.save();
  res.json({ success: true, message: 'Category updated', data: { category } });
});

const archive = asyncHandler(async (req, res) => {
  const category = await Category.findById(req.params.id);
  if (!category) throw new AppError('Category not found', 404);
  category.isActive = false;
  await category.save();
  const affectedProducts = await Product.countDocuments({ category: category.slug, isAvailable: true });
  res.json({ success: true, message: affectedProducts ? `Category archived; ${affectedProducts} existing listings were preserved` : 'Category archived', data: { category } });
});

module.exports = { listActive, listAll, create, update, archive };
