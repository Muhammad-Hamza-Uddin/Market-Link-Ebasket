const express = require('express');
const cors = require('cors');
const path = require('path');
const authRoutes = require('./routes/authRoutes');
const marketRoutes = require('./routes/marketRoutes');
const farmerRoutes = require('./routes/farmerRoutes');
const productRoutes = require('./routes/productRoutes');
const orderRoutes = require('./routes/orderRoutes');
const adminRoutes = require('./routes/adminRoutes');
const favoriteRoutes = require('./routes/favoriteRoutes');
const reviewRoutes = require('./routes/reviewRoutes');
const notificationRoutes = require('./routes/notificationRoutes');
const announcementRoutes = require('./routes/announcementRoutes');
const weeklyStockRoutes = require('./routes/weeklyStockRoutes');
const aiRoutes = require('./routes/aiRoutes');
const categoryRoutes = require('./routes/categoryRoutes');
const notFound = require('./middleware/notFound');
const errorHandler = require('./middleware/errorHandler');

const app = express();

const allowedOrigins = (process.env.CLIENT_URL || 'http://localhost:5173')
  .split(',')
  .map((origin) => origin.trim());

app.use(
  cors({
    origin(origin, callback) {
      // Requests from Postman and server-to-server clients have no Origin header.
      if (!origin || allowedOrigins.includes(origin)) {
        return callback(null, true);
      }

      return callback(new Error('This origin is not allowed by CORS'));
    },
    credentials: true,
  })
);

app.use(express.json({ limit: '10kb' }));
app.use('/uploads', express.static(path.resolve(__dirname, '../uploads'), { maxAge: '7d', immutable: true }));

app.get('/api/v1/health', (req, res) => {
  res.status(200).json({ success: true, message: 'MarketLink API is running' });
});

app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/markets', marketRoutes);
app.use('/api/v1/farmers', farmerRoutes);
app.use('/api/v1/products', productRoutes);
app.use('/api/v1/orders', orderRoutes);
app.use('/api/v1/admin', adminRoutes);
app.use('/api/v1/favorites', favoriteRoutes);
app.use('/api/v1/reviews', reviewRoutes);
app.use('/api/v1/notifications', notificationRoutes);
app.use('/api/v1/announcements', announcementRoutes);
app.use('/api/v1/weekly-stock', weeklyStockRoutes);
app.use('/api/v1/ai', aiRoutes);
app.use('/api/v1/categories', categoryRoutes);

app.use(notFound);
app.use(errorHandler);

module.exports = app;
