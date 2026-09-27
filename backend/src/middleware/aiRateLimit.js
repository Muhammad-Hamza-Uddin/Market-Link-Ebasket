const AppError = require('../utils/AppError');

const WINDOW_MS = 60 * 1000;
const MAX_REQUESTS = 10;
const buckets = new Map();

const aiRateLimit = (req, res, next) => {
  const key = String(req.user?._id || req.ip);
  const now = Date.now();
  const bucket = buckets.get(key);

  if (!bucket || now - bucket.startedAt >= WINDOW_MS) {
    buckets.set(key, { startedAt: now, count: 1 });
    return next();
  }

  if (bucket.count >= MAX_REQUESTS) {
    return next(new AppError('AI request limit reached. Please try again in a minute.', 429));
  }

  bucket.count += 1;
  return next();
};

module.exports = aiRateLimit;