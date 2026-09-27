const fs = require('fs');
const path = require('path');
const multer = require('multer');
const AppError = require('../utils/AppError');

const uploadDirectory = path.resolve(__dirname, '../../uploads/products');
fs.mkdirSync(uploadDirectory, { recursive: true });

const extensions = { 'image/jpeg': '.jpg', 'image/png': '.png', 'image/webp': '.webp' };
const storage = multer.diskStorage({
  destination: uploadDirectory,
  filename(req, file, callback) {
    callback(null, `${req.params.id}-${Date.now()}${extensions[file.mimetype]}`);
  },
});

module.exports = multer({
  storage,
  limits: { fileSize: 3 * 1024 * 1024, files: 1 },
  fileFilter(req, file, callback) {
    if (!extensions[file.mimetype]) return callback(new AppError('Upload a JPG, PNG, or WebP product image', 400));
    callback(null, true);
  },
});
