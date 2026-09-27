const AppError = require('../utils/AppError');

const approvedFarmer = (req, res, next) => {
  if (req.user.role !== 'farmer' || req.user.accountStatus !== 'active') {
    return next(new AppError('Your farmer account must be approved first', 403));
  }

  next();
};

module.exports = approvedFarmer;

