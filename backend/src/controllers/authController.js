const mongoose = require('mongoose');
const fs = require('fs/promises');
const path = require('path');
const User = require('../models/User');
const Market = require('../models/Market');
const AppError = require('../utils/AppError');
const asyncHandler = require('../utils/asyncHandler');
const generateToken = require('../utils/generateToken');
const { notifyAdmins } = require('../utils/notifications');

const sendAuthResponse = (res, statusCode, message, user) => {
  const token = generateToken(user);

  res.status(statusCode).json({
    success: true,
    message,
    token,
    data: { user },
  });
};

const removeStoredFarmerImage = async (imageUrl) => {
  if (!String(imageUrl || '').startsWith('/uploads/farmers/')) return;
  const filePath = path.resolve(__dirname, '../../uploads/farmers', path.basename(imageUrl));
  await fs.unlink(filePath).catch((error) => {
    if (error.code !== 'ENOENT') throw error;
  });
};

const register = asyncHandler(async (req, res) => {
  const { name, email, password, phone, address, preferredMarket } = req.body;
  let validPreferredMarket;
  if (preferredMarket) {
    if (!mongoose.isValidObjectId(preferredMarket)) throw new AppError('Preferred market is invalid', 400);
    validPreferredMarket = await Market.findOne({ _id: preferredMarket, isActive: true }).select('_id');
    if (!validPreferredMarket) throw new AppError('Preferred market is not available', 400);
  }

  const user = await User.create({
    name,
    email,
    password,
    phone,
    address,
    preferredMarket: validPreferredMarket?._id,
    preferredMarkets: validPreferredMarket ? [validPreferredMarket._id] : [],
    role: 'customer',
    accountStatus: 'active',
  });
  await user.populate('preferredMarkets', 'name address location marketDays openingTime closingTime');
  sendAuthResponse(res, 201, 'Customer registered successfully', user);
});

const registerFarmer = asyncHandler(async (req, res) => {
  const { name, email, password, phone, address, farmName, location, registrationNumber } = req.body;

  const user = await User.create({
    name,
    email,
    password,
    phone,
    address,
    farmName,
    location,
    registrationNumber,
    role: 'farmer',
    accountStatus: 'pending',
  });
  await notifyAdmins({
    type: 'farmer_registered',
    title: 'New farmer registration',
    message: `${user.farmName || user.name} is awaiting approval.`,
    eventKey: `farmer-registration:${user._id}`,
  });

  sendAuthResponse(
    res,
    201,
    'Farmer registered successfully and is awaiting approval',
    user
  );
});

const login = asyncHandler(async (req, res) => {
  const email = req.body.email.trim().toLowerCase();
  const user = await User.findOne({ email }).select('+password +tokenVersion');

  if (!user || !(await user.comparePassword(req.body.password))) {
    throw new AppError('Invalid email or password', 401);
  }

  if (user.accountStatus === 'suspended') {
    throw new AppError('This account has been suspended', 403);
  }

  await user.populate([
    { path: 'preferredMarket', select: 'name address location marketDays openingTime closingTime' },
    { path: 'preferredMarkets', select: 'name address location marketDays openingTime closingTime' },
  ]);

  sendAuthResponse(res, 200, 'Login successful', user);
});

const getMe = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id).populate([
    { path: 'preferredMarket', select: 'name address location marketDays openingTime closingTime' },
    { path: 'preferredMarkets', select: 'name address location marketDays openingTime closingTime' },
  ]);
  res.status(200).json({
    success: true,
    data: { user },
  });
});

const updateMe = asyncHandler(async (req, res) => {
  const allowed = ['name', 'phone', 'address', 'farmName', 'imageUrl', 'location', 'operatingDays', 'pickupStartTime', 'pickupEndTime', 'orderCutoffTime', 'pickupSlotMinutes', 'coordinates', 'preferredMarket', 'preferredMarkets', 'markets', 'bio'];
  const timePattern = /^([01]\d|2[0-3]):[0-5]\d$/;
  ['pickupStartTime', 'pickupEndTime', 'orderCutoffTime'].forEach((field) => {
    if (req.body[field] !== undefined && !timePattern.test(req.body[field])) throw new AppError(`${field} must use HH:MM format`, 400);
  });
  const pickupStart = req.body.pickupStartTime ?? req.user.pickupStartTime;
  const pickupEnd = req.body.pickupEndTime ?? req.user.pickupEndTime;
  if (pickupStart && pickupEnd && pickupStart >= pickupEnd) throw new AppError('Pickup end time must be after pickup start time', 400);
  if (req.body.pickupSlotMinutes !== undefined && (!Number.isInteger(Number(req.body.pickupSlotMinutes)) || Number(req.body.pickupSlotMinutes) < 15 || Number(req.body.pickupSlotMinutes) > 240)) {
    throw new AppError('Pickup slot minutes must be an integer from 15 to 240', 400);
  }
  if (req.body.preferredMarket === '' || req.body.preferredMarket === null) {
    req.body.preferredMarket = null;
  } else if (req.body.preferredMarket !== undefined) {
    if (req.user.role !== 'customer' || !mongoose.isValidObjectId(req.body.preferredMarket)) throw new AppError('Preferred market is invalid', 400);
    const market = await Market.findOne({ _id: req.body.preferredMarket, isActive: true }).select('_id');
    if (!market) throw new AppError('Preferred market is not available', 400);
  }
  if (req.body.preferredMarkets !== undefined) {
    if (req.user.role !== 'customer' || !Array.isArray(req.body.preferredMarkets)) throw new AppError('Preferred markets must be a list', 400);
    const uniqueIds = [...new Set(req.body.preferredMarkets.map(String))];
    if (uniqueIds.length > 10 || uniqueIds.some((id) => !mongoose.isValidObjectId(id))) throw new AppError('Choose up to 10 valid preferred markets', 400);
    const activeCount = await Market.countDocuments({ _id: { $in: uniqueIds }, isActive: true });
    if (activeCount !== uniqueIds.length) throw new AppError('One or more preferred markets are not available', 400);
    req.body.preferredMarkets = uniqueIds;
    req.body.preferredMarket = uniqueIds[0] || null;
  } else if (req.body.preferredMarket !== undefined && req.user.role === 'customer') {
    req.body.preferredMarkets = req.body.preferredMarket ? [req.body.preferredMarket] : [];
  }
  const updates = {};
  for (const field of allowed) {
    if (req.body[field] !== undefined) updates[field] = req.body[field];
  }
  const user = await User.findByIdAndUpdate(req.user._id, { $set: updates }, { new: true, runValidators: true }).populate([
    { path: 'preferredMarket', select: 'name address location marketDays openingTime closingTime' },
    { path: 'preferredMarkets', select: 'name address location marketDays openingTime closingTime' },
  ]);
  res.status(200).json({ success: true, message: 'Profile updated successfully', data: { user } });
});

const uploadProfileImage = asyncHandler(async (req, res) => {
  if (req.user.role !== 'farmer') throw new AppError('Only farmer accounts can upload a stall image', 403);
  if (!req.file) throw new AppError('Choose an image to upload', 400);

  const previousImage = req.user.imageUrl;
  const imageUrl = `/uploads/farmers/${req.file.filename}`;
  const user = await User.findByIdAndUpdate(req.user._id, { imageUrl }, { new: true, runValidators: true });
  await removeStoredFarmerImage(previousImage);

  res.status(200).json({ success: true, message: 'Profile image uploaded successfully', data: { user } });
});

const deleteProfileImage = asyncHandler(async (req, res) => {
  if (req.user.role !== 'farmer') throw new AppError('Only farmer accounts can remove a stall image', 403);
  const previousImage = req.user.imageUrl;
  const user = await User.findByIdAndUpdate(req.user._id, { $unset: { imageUrl: 1 } }, { new: true });
  await removeStoredFarmerImage(previousImage);

  res.status(200).json({ success: true, message: 'Profile image removed', data: { user } });
});

const logout = asyncHandler(async (req, res) => {
  // Invalidate all JWTs previously issued to this account.
  req.user.tokenVersion += 1;
  await req.user.save({ validateBeforeSave: false });

  res.status(200).json({
    success: true,
    message: 'Logged out successfully',
  });
});

module.exports = { register, registerFarmer, login, getMe, updateMe, uploadProfileImage, deleteProfileImage, logout };

