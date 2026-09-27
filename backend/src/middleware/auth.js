const jwt = require('jsonwebtoken');
const User = require('../models/User');
const AppError = require('../utils/AppError');
const asyncHandler = require('../utils/asyncHandler');

const protect = asyncHandler(async (req, res, next) => {
  const authorization = req.headers.authorization;

  if (!authorization || !authorization.startsWith('Bearer ')) {
    throw new AppError('Authentication required. Please provide a Bearer token.', 401);
  }

  const token = authorization.split(' ')[1];

  let decoded;
  try {
    decoded = jwt.verify(token, process.env.JWT_SECRET);
  } catch (error) {
    throw new AppError('Invalid or expired token', 401);
  }

  const user = await User.findById(decoded.id).select('+tokenVersion');

  if (!user || user.tokenVersion !== decoded.tokenVersion) {
    throw new AppError('This login session is no longer valid', 401);
  }

  if (user.accountStatus === 'suspended') {
    throw new AppError('This account has been suspended', 403);
  }

  req.user = user;
  next();
});

protect.optional = asyncHandler(async (req, res, next) => {
  const authorization = req.headers.authorization;
  if (!authorization || !authorization.startsWith('Bearer ')) return next();
  let decoded;
  try {
    decoded = jwt.verify(authorization.split(' ')[1], process.env.JWT_SECRET);
  } catch (error) {
    throw new AppError('Invalid or expired token', 401);
  }
  const user = await User.findById(decoded.id).select('+tokenVersion');
  if (!user || user.tokenVersion !== decoded.tokenVersion || user.accountStatus === 'suspended') return next();
  req.user = user;
  next();
});

module.exports = protect;

