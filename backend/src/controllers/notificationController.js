const Notification = require('../models/Notification');
const asyncHandler = require('../utils/asyncHandler');

const listNotifications = asyncHandler(async (req, res) => {
  const limit = Math.min(Math.max(Number(req.query.limit) || 30, 1), 100);
  const [notifications, unreadCount] = await Promise.all([
    Notification.find({ user: req.user._id })
      .populate('relatedOrder', 'status pickupDate')
      .populate('relatedProduct', 'name imageUrl')
      .sort({ createdAt: -1 })
      .limit(limit),
    Notification.countDocuments({ user: req.user._id, read: false }),
  ]);
  res.json({ success: true, data: { notifications, unreadCount } });
});

const markRead = asyncHandler(async (req, res) => {
  const notification = await Notification.findOneAndUpdate(
    { _id: req.params.id, user: req.user._id },
    { read: true },
    { new: true }
  );
  res.json({ success: true, data: { notification } });
});

const markAllRead = asyncHandler(async (req, res) => {
  await Notification.updateMany({ user: req.user._id, read: false }, { read: true });
  res.json({ success: true, message: 'All notifications marked as read' });
});

module.exports = { listNotifications, markRead, markAllRead };