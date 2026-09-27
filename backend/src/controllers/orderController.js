const mongoose = require('mongoose');
const Order = require('../models/Order');
const Product = require('../models/Product');
const User = require('../models/User');
const Market = require('../models/Market');
const AppError = require('../utils/AppError');
const asyncHandler = require('../utils/asyncHandler');
const { createNotification } = require('../utils/notifications');

const orderPopulate = [
  { path: 'customer', select: 'name email phone' },
  { path: 'farmer', select: 'name farmName phone operatingDays pickupStartTime pickupEndTime orderCutoffTime pickupSlotMinutes' },
  { path: 'market', select: 'name address location marketDays openingTime closingTime' },
];

const restoreStock = async (items) => {
  await Promise.all(
    items.map((item) =>
      Product.findByIdAndUpdate(item.product, { $inc: { quantity: item.quantity } })
    )
  );
};

const normalizeItems = (items) => {
  if (!Array.isArray(items) || items.length === 0) {
    throw new AppError('At least one order item is required', 400);
  }

  const quantities = new Map();

  for (const item of items) {
    const quantity = Number(item.quantity);

    if (!mongoose.isValidObjectId(item.product) || !Number.isFinite(quantity) || quantity <= 0) {
      throw new AppError('Each item requires a valid product and positive quantity', 400);
    }

    const productId = item.product.toString();
    quantities.set(productId, (quantities.get(productId) || 0) + quantity);
  }

  return quantities;
};

const validatePickupDate = (value) => {
  const pickupDate = new Date(value);
  if (Number.isNaN(pickupDate.getTime())) {
    throw new AppError('A valid pickup date is required', 400);
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  if (pickupDate < today) throw new AppError('Pickup date cannot be in the past', 400);

  return pickupDate;
};

const minutesFromTime = (value) => {
  const normalized = String(value || '').trim().toUpperCase();
  const match = normalized.match(/^(\d{1,2}):(\d{2})(?:\s*(AM|PM))?$/);
  if (!match) return null;
  let hours = Number(match[1]);
  const minutes = Number(match[2]);
  if (minutes > 59 || hours > (match[3] ? 12 : 23)) return null;
  if (match[3]) {
    if (hours === 12) hours = 0;
    if (match[3] === 'PM') hours += 12;
  }
  return hours * 60 + minutes;
};

const parseSlot = (slot) => {
  const parts = String(slot || '').split(/\s*[–-]\s*/);
  if (parts.length !== 2) return null;
  const start = minutesFromTime(parts[0]);
  const end = minutesFromTime(parts[1]);
  return start !== null && end !== null && end > start ? { start, end } : null;
};

const validatePickupRules = async ({ pickupDate, pickupSlot, farmer, marketId }) => {
  const market = await Market.findOne({ _id: marketId, isActive: true });
  if (!market) throw new AppError('The pickup market is unavailable', 400);
  const weekday = pickupDate.toLocaleDateString('en-US', { weekday: 'long', timeZone: 'Asia/Karachi' }).toLowerCase();
  if (!market.marketDays.includes(weekday)) throw new AppError(`${market.name} is not open on ${weekday}`, 400);
  const farmerDays = (farmer.operatingDays || []).map((day) => day.toLowerCase());
  if (farmerDays.length && !farmerDays.includes(weekday)) throw new AppError('The farmer is not available on the selected day', 400);

  const slot = parseSlot(pickupSlot);
  if (!slot) throw new AppError('Choose a valid pickup time window', 400);
  const availableStart = Math.max(minutesFromTime(farmer.pickupStartTime) ?? 0, minutesFromTime(market.openingTime) ?? 0);
  const availableEnd = Math.min(minutesFromTime(farmer.pickupEndTime) ?? 24 * 60, minutesFromTime(market.closingTime) ?? 24 * 60);
  if (slot.start < availableStart || slot.end > availableEnd) throw new AppError('Pickup slot is outside farmer or market operating hours', 400);

  const cutoff = minutesFromTime(farmer.orderCutoffTime || '18:00');
  const cutoffAt = new Date(pickupDate);
  cutoffAt.setHours(0, cutoff || 0, 0, 0);
  if (new Date() >= cutoffAt) throw new AppError('The order cutoff for this pickup has passed', 409);
  return market;
};

const createOrder = asyncHandler(async (req, res) => {
  const quantities = normalizeItems(req.body.items);
  const pickupDate = validatePickupDate(req.body.pickupDate);
  const productIds = [...quantities.keys()];

  const products = await Product.find({
    _id: { $in: productIds },
    isAvailable: true,
  });

  if (products.length !== productIds.length) {
    throw new AppError('One or more products are unavailable', 400);
  }

  const farmerId = products[0].farmer.toString();
  const marketId = products[0].market.toString();

  if (
    products.some(
      (product) =>
        product.farmer.toString() !== farmerId || product.market.toString() !== marketId
    )
  ) {
    throw new AppError('All items in an order must use the same farmer and market', 400);
  }

  const farmer = await User.findOne({
    _id: farmerId,
    role: 'farmer',
    accountStatus: 'active',
  });
  if (!farmer) throw new AppError('This farmer is not currently accepting orders', 400);
  await validatePickupRules({ pickupDate, pickupSlot: req.body.pickupSlot, farmer, marketId });

  const orderItems = products.map((product) => {
    const quantity = quantities.get(product._id.toString());
    return {
      product: product._id,
      name: product.name,
      quantity,
      unit: product.unit,
      unitPrice: product.price,
      subtotal: Number((product.price * quantity).toFixed(2)),
    };
  });

  const reducedItems = [];

  try {
    for (const item of orderItems) {
      const updated = await Product.findOneAndUpdate(
        { _id: item.product, isAvailable: true, quantity: { $gte: item.quantity } },
        { $inc: { quantity: -item.quantity } },
        { new: true }
      );

      if (!updated) {
        throw new AppError(`${item.name} does not have enough stock`, 409);
      }

      reducedItems.push(item);
    }

    const totalAmount = Number(
      orderItems.reduce((total, item) => total + item.subtotal, 0).toFixed(2)
    );

    const order = await Order.create({
      customer: req.user._id,
      farmer: farmerId,
      market: marketId,
      items: orderItems,
      totalAmount,
      pickupDate,
      pickupSlot: req.body.pickupSlot,
      notes: req.body.notes,
    });
    await Promise.all([
      createNotification({
        user: req.user._id, type: 'order_placed', title: 'Pre-order placed',
        message: `Your order for Rs. ${totalAmount} was sent to ${farmer.farmName || farmer.name}.`,
        relatedOrder: order._id, eventKey: `order:${order._id}:placed:customer`,
      }),
      createNotification({
        user: farmer._id, type: 'new_order', title: 'New order received',
        message: `${req.user.name} placed a new order for Rs. ${totalAmount}.`,
        relatedOrder: order._id, eventKey: `order:${order._id}:placed:farmer`,
      }),
    ]);

    await order.populate(orderPopulate);

    res.status(201).json({
      success: true,
      message: 'Pre-order placed successfully',
      data: { order },
    });
  } catch (error) {
    if (reducedItems.length > 0) await restoreStock(reducedItems);
    throw error;
  }
});

const getMyOrders = asyncHandler(async (req, res) => {
  const orders = await Order.find({ customer: req.user._id })
    .populate(orderPopulate)
    .sort({ createdAt: -1 });

  res.status(200).json({
    success: true,
    count: orders.length,
    data: { orders },
  });
});

const getFarmerOrders = asyncHandler(async (req, res) => {
  const filter = { farmer: req.user._id };
  if (req.query.status) filter.status = req.query.status;

  const orders = await Order.find(filter).populate(orderPopulate).sort({ createdAt: -1 });

  res.status(200).json({
    success: true,
    count: orders.length,
    data: { orders },
  });
});

const getFarmerDashboard = asyncHandler(async (req, res) => {
  const farmer = req.user._id;
  const [totals] = await Order.aggregate([
    { $match: { farmer } },
    { $group: {
      _id: null,
      totalOrders: { $sum: 1 },
      pendingOrders: { $sum: { $cond: [{ $eq: ['$status', 'pending'] }, 1, 0] } },
      revenue: { $sum: { $cond: [{ $eq: ['$status', 'completed'] }, '$totalAmount', 0] } },
    } },
  ]);
  const bestSelling = await Order.aggregate([
    { $match: { farmer, status: { $in: ['confirmed', 'ready', 'completed'] } } },
    { $unwind: '$items' },
    { $group: { _id: '$items.product', name: { $first: '$items.name' }, units: { $sum: '$items.quantity' } } },
    { $sort: { units: -1 } },
    { $limit: 5 },
  ]);
  const [inventory, lowStock] = await Promise.all([
    Product.countDocuments({ farmer, isAvailable: true }),
    Product.find({ farmer, isAvailable: true, quantity: { $lte: 5 } }).select('name quantity unit').sort({ quantity: 1 }),
  ]);
  res.json({
    success: true,
    data: { dashboard: { totalOrders: totals?.totalOrders || 0, pendingOrders: totals?.pendingOrders || 0, revenue: totals?.revenue || 0, inventory, lowStock, bestSelling } },
  });
});

const getOrder = asyncHandler(async (req, res) => {
  const order = await Order.findById(req.params.id).populate(orderPopulate);
  if (!order) throw new AppError('Order not found', 404);

  const userId = req.user._id.toString();
  const canView =
    req.user.role === 'admin' ||
    order.customer._id.toString() === userId ||
    order.farmer._id.toString() === userId;

  if (!canView) throw new AppError('You do not have permission to view this order', 403);

  res.status(200).json({ success: true, data: { order } });
});

const cancelMyOrder = asyncHandler(async (req, res) => {
  const current = await Order.findOne({ _id: req.params.id, customer: req.user._id });
  if (!current) throw new AppError('Order not found', 404);
  const farmer = await User.findById(current.farmer);
  const pickupDate = new Date(current.pickupDate);
  const cutoff = minutesFromTime(farmer?.orderCutoffTime || '18:00');
  const cutoffAt = new Date(pickupDate);
  cutoffAt.setHours(0, cutoff || 0, 0, 0);
  if (new Date() >= cutoffAt) throw new AppError('This order can no longer be cancelled because the cutoff has passed', 409);
  const order = await Order.findOneAndUpdate(
    { _id: req.params.id, customer: req.user._id, status: 'pending', stockRestoredAt: null },
    { status: 'cancelled', cancelledBy: 'customer', cancellationReason: req.body.reason || '', stockRestoredAt: new Date() },
    { new: true }
  );
  if (!order) throw new AppError('Order not found', 404);
  await restoreStock(order.items);
  await createNotification({
    user: order.farmer, type: 'order_cancelled', title: 'Customer cancelled an order',
    message: `${req.user.name} cancelled order ${order._id}. Reserved stock was restored.`,
    relatedOrder: order._id, eventKey: `order:${order._id}:cancelled:farmer`,
  });

  res.status(200).json({
    success: true,
    message: 'Order cancelled and stock restored',
    data: { order },
  });
});

const modifyMyOrder = asyncHandler(async (req, res) => {
  const order = await Order.findOne({ _id: req.params.id, customer: req.user._id });
  if (!order) throw new AppError('Order not found', 404);
  if (order.status !== 'pending') throw new AppError('Only pending orders can be modified', 400);

  if (req.body.pickupDate !== undefined) order.pickupDate = validatePickupDate(req.body.pickupDate);
  if (req.body.pickupSlot !== undefined) order.pickupSlot = req.body.pickupSlot;
  const farmer = await User.findById(order.farmer);
  await validatePickupRules({ pickupDate: order.pickupDate, pickupSlot: order.pickupSlot, farmer, marketId: order.market });
  if (req.body.notes !== undefined) order.notes = req.body.notes;
  await order.save();
  await order.populate(orderPopulate);
  res.status(200).json({ success: true, message: 'Order updated successfully', data: { order } });
});

const updateOrderStatus = asyncHandler(async (req, res) => {
  const order = await Order.findOne({ _id: req.params.id, farmer: req.user._id });
  if (!order) throw new AppError('Order not found or not assigned to you', 404);

  const transitions = {
    pending: ['confirmed', 'cancelled'],
    confirmed: ['ready', 'cancelled'],
    ready: ['completed'],
    completed: [],
    cancelled: [],
  };
  const nextStatus = req.body.status;

  if (!transitions[order.status].includes(nextStatus)) {
    throw new AppError(`Order cannot change from ${order.status} to ${nextStatus}`, 400);
  }

  const update = { status: nextStatus };
  if (nextStatus === 'cancelled') {
    update.cancelledBy = 'farmer';
    update.cancellationReason = req.body.reason || '';
    update.stockRestoredAt = new Date();
  }
  const saved = await Order.findOneAndUpdate(
    { _id: order._id, farmer: req.user._id, status: order.status, ...(nextStatus === 'cancelled' ? { stockRestoredAt: null } : {}) },
    update,
    { new: true }
  );
  if (!saved) throw new AppError('Order changed before this request; refresh and try again', 409);
  if (nextStatus === 'cancelled') await restoreStock(saved.items);
  const notificationType = { confirmed: 'order_confirmed', ready: 'order_ready', cancelled: 'order_cancelled' }[nextStatus];
  if (notificationType) await createNotification({
    user: saved.customer, type: notificationType,
    title: nextStatus === 'confirmed' ? 'Order confirmed' : nextStatus === 'ready' ? 'Order ready for pickup' : 'Order cancelled',
    message: nextStatus === 'ready' ? 'Your order is packed and ready at the selected market.' : `Your order is now ${nextStatus}.`,
    relatedOrder: saved._id, eventKey: `order:${saved._id}:${nextStatus}:customer`,
  });

  res.status(200).json({
    success: true,
    message: `Order status changed to ${nextStatus}`,
    data: { order: saved },
  });
});

module.exports = {
  createOrder,
  getMyOrders,
  getFarmerOrders,
  getFarmerDashboard,
  getOrder,
  cancelMyOrder,
  modifyMyOrder,
  updateOrderStatus,
};

