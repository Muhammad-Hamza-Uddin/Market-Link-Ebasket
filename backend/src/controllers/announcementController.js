const Announcement = require('../models/Announcement');
const AppError = require('../utils/AppError');
const asyncHandler = require('../utils/asyncHandler');

const activeFilter = (role) => ({
  active: true,
  audience: { $in: ['all', role || 'customer'] },
  publishAt: { $lte: new Date() },
  $or: [{ expiresAt: null }, { expiresAt: { $exists: false } }, { expiresAt: { $gt: new Date() } }],
});

const validateSchedule = (publishAt, expiresAt) => {
  const publish = publishAt ? new Date(publishAt) : new Date();
  const expiry = expiresAt ? new Date(expiresAt) : null;
  if (Number.isNaN(publish.getTime()) || (expiry && Number.isNaN(expiry.getTime()))) throw new AppError('Announcement dates must be valid', 400);
  if (expiry && expiry <= publish) throw new AppError('Announcement expiry must be after its publish date', 400);
};

const listActive = asyncHandler(async (req, res) => {
  const role = req.user?.role || 'customer';
  const announcements = await Announcement.find(activeFilter(role)).sort({ publishAt: -1 });
  res.json({ success: true, data: { announcements } });
});

const listAll = asyncHandler(async (req, res) => {
  const announcements = await Announcement.find().sort({ createdAt: -1 });
  res.json({ success: true, data: { announcements } });
});

const create = asyncHandler(async (req, res) => {
  const { title, message, audience, active, publishAt, expiresAt } = req.body;
  if (!title?.trim() || !message?.trim()) throw new AppError('Title and message are required', 400);
  validateSchedule(publishAt, expiresAt);
  const announcement = await Announcement.create({
    title: title.trim(), message: message.trim(), audience, active, publishAt, expiresAt, createdBy: req.user._id,
  });
  res.status(201).json({ success: true, data: { announcement } });
});

const update = asyncHandler(async (req, res) => {
  const allowed = ['title', 'message', 'audience', 'active', 'publishAt', 'expiresAt'];
  const changes = {};
  allowed.forEach((field) => { if (req.body[field] !== undefined) changes[field] = req.body[field]; });
  const current = await Announcement.findById(req.params.id);
  if (!current) throw new AppError('Announcement not found', 404);
  validateSchedule(changes.publishAt ?? current.publishAt, changes.expiresAt === null ? null : (changes.expiresAt ?? current.expiresAt));
  const announcement = await Announcement.findByIdAndUpdate(req.params.id, changes, { new: true, runValidators: true });
  res.json({ success: true, data: { announcement } });
});

module.exports = { listActive, listAll, create, update };