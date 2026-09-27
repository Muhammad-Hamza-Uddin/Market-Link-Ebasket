require('dotenv').config();

const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');
const connectDB = require('../config/db');
const User = require('../models/User');
const Market = require('../models/Market');
const Product = require('../models/Product');
const Order = require('../models/Order');
const Review = require('../models/Review');
const Announcement = require('../models/Announcement');
const WeeklyStockTemplate = require('../models/WeeklyStockTemplate');
const Favorite = require('../models/Favorite');

const findOrCreateUser = async ({ email, password, ...profile }) => {
  let user = await User.findOne({ email });

  if (!user) {
    user = await User.create({ email, password, ...profile });
  }

  return user;
};

const findOrCreateMarket = async (data) => {
  const existing = await Market.findOne({ name: data.name });
  return existing || Market.create(data);
};

const seed = async () => {
  await connectDB();

  const admin = await findOrCreateUser({
    name: 'MarketLink Admin',
    email: process.env.SEED_ADMIN_EMAIL || 'admin@marketlink.test',
    password: process.env.SEED_ADMIN_PASSWORD || 'Admin123!',
    role: 'admin',
    accountStatus: 'active',
  });

  const farmer = await findOrCreateUser({
    name: 'Ahmed Raza',
    email: process.env.SEED_FARMER_EMAIL || 'farmer@marketlink.test',
    password: process.env.SEED_FARMER_PASSWORD || 'Farmer123!',
    phone: '0300-1234567',
    role: 'farmer',
    accountStatus: 'active',
    farmName: 'Green Valley Farm',
    location: 'Malir, Karachi',
  });

  const customer = await findOrCreateUser({
    name: 'Ayesha Khan',
    email: process.env.SEED_CUSTOMER_EMAIL || 'customer@marketlink.test',
    password: process.env.SEED_CUSTOMER_PASSWORD || 'Customer123!',
    phone: '0301-7654321',
    role: 'customer',
    accountStatus: 'active',
  });

  const secondFarmer = await findOrCreateUser({
    name: 'Hina Siddiqui',
    email: 'farmer.gulshan@marketlink.test',
    password: process.env.SEED_FARMER_PASSWORD || 'Farmer123!',
    phone: '0303-5550199',
    role: 'farmer',
    accountStatus: 'active',
    farmName: 'Gulshan Orchard Stall',
    location: 'Gulshan-e-Iqbal, Karachi',
  });

  const cliftonMarket = await findOrCreateMarket({
    name: 'Clifton Weekend Farmers Market',
    address: 'Clifton Block 5, Karachi',
    location: { type: 'Point', coordinates: [67.0271, 24.8138] },
    marketDays: ['saturday', 'sunday'],
    openingTime: '08:00',
    closingTime: '14:00',
    description: 'Fresh produce from local farms every weekend.',
  });

  const gulshanMarket = await findOrCreateMarket({
    name: 'Gulshan Green Market',
    address: 'Gulshan-e-Iqbal, Karachi',
    location: { type: 'Point', coordinates: [67.0971, 24.9207] },
    marketDays: ['friday', 'sunday'],
    openingTime: '09:00',
    closingTime: '15:00',
    description: 'Seasonal fruit, vegetables, dairy, and handmade goods.',
  });
  await User.findByIdAndUpdate(farmer._id, {
    markets: [cliftonMarket._id],
    operatingDays: ['saturday', 'sunday'],
    pickupStartTime: '08:00',
    pickupEndTime: '14:00',
    orderCutoffTime: '18:00',
    pickupSlotMinutes: 60,
    coordinates: { latitude: 24.8138, longitude: 67.0271 },
    address: 'Malir, Karachi',
    bio: 'Seasonal vegetables and fruit grown for Karachi community markets.',
  });
  await User.findByIdAndUpdate(customer._id, { address: 'Gulshan-e-Iqbal, Karachi', preferredMarket: cliftonMarket._id, preferredMarkets: [cliftonMarket._id] });
  await User.findByIdAndUpdate(secondFarmer._id, {
    markets: [gulshanMarket._id],
    operatingDays: ['friday', 'sunday'],
    pickupStartTime: '09:00',
    pickupEndTime: '15:00',
    orderCutoffTime: '18:00',
    pickupSlotMinutes: 60,
    coordinates: { latitude: 24.9207, longitude: 67.0971 },
    address: 'Gulshan-e-Iqbal, Karachi',
    bio: 'Seasonal fruit and orchard produce for Gulshan market pickup.',
  });
  await findOrCreateUser({
    name: 'Sara Bakers',
    email: 'pending.farmer@marketlink.test',
    password: process.env.SEED_FARMER_PASSWORD || 'Farmer123!',
    phone: '0302-5550101',
    address: 'Gulshan-e-Iqbal, Karachi',
    role: 'farmer',
    accountStatus: 'pending',
    farmName: 'Sara Community Bakery',
    location: 'Gulshan Green Market',
    registrationNumber: 'STALL-PENDING-101',
  });
  await findOrCreateUser({
    name: 'Suspended Demo Customer',
    email: 'suspended.customer@marketlink.test',
    password: process.env.SEED_CUSTOMER_PASSWORD || 'Customer123!',
    role: 'customer',
    accountStatus: 'suspended',
    address: 'Karachi',
  });

  const availableDate = new Date();
  availableDate.setDate(availableDate.getDate() + 2);

  // A deterministic 50-item catalogue gives every listing/filter/pagination
  // screen enough realistic data for manual and browser testing.
  const productCatalogue = [
    ['Organic Tomatoes', 'vegetables', 'kg', 250, 20],
    ['Fresh Spinach', 'vegetables', 'bunch', 100, 30],
    ['Red Onions', 'vegetables', 'kg', 180, 24],
    ['Baby Potatoes', 'vegetables', 'kg', 220, 16],
    ['Green Capsicum', 'vegetables', 'kg', 320, 14],
    ['Fresh Coriander', 'vegetables', 'bunch', 70, 35],
    ['Local Cucumbers', 'vegetables', 'kg', 160, 22],
    ['Desi Carrots', 'vegetables', 'kg', 190, 18],
    ['Green Chilies', 'vegetables', 'kg', 300, 12],
    ['Farm Okra', 'vegetables', 'kg', 280, 15],
    ['Sindhri Mangoes', 'fruits', 'kg', 420, 18],
    ['Kinnow Citrus Box', 'fruits', 'box', 650, 8],
    ['Red Apples', 'fruits', 'kg', 520, 13],
    ['Fresh Bananas', 'fruits', 'dozen', 240, 19],
    ['Guava Basket', 'fruits', 'box', 480, 9],
    ['Sweet Melon', 'fruits', 'piece', 350, 11],
    ['Pomegranate Pack', 'fruits', 'box', 750, 7],
    ['Papaya', 'fruits', 'piece', 300, 10],
    ['Dates Gift Box', 'fruits', 'box', 900, 6],
    ['Seasonal Fruit Mix', 'fruits', 'box', 800, 8],
    ['Fresh Farm Milk', 'dairy', 'litre', 280, 12],
    ['Buffalo Milk', 'dairy', 'litre', 320, 10],
    ['Plain Yogurt', 'dairy', 'kg', 300, 15],
    ['Salted Butter', 'dairy', 'gram', 450, 9],
    ['Cottage Cheese', 'dairy', 'gram', 380, 8],
    ['Desi Ghee Jar', 'dairy', 'gram', 1100, 6],
    ['Lassi Bottle', 'dairy', 'litre', 220, 14],
    ['Cream Cheese', 'dairy', 'gram', 500, 7],
    ['Fresh Cream', 'dairy', 'gram', 360, 8],
    ['Mozzarella Ball', 'dairy', 'gram', 620, 6],
    ['Whole Wheat Loaf', 'baked-goods', 'piece', 350, 10],
    ['Sourdough Loaf', 'baked-goods', 'piece', 550, 8],
    ['Multigrain Buns', 'baked-goods', 'dozen', 480, 9],
    ['Cinnamon Rolls', 'baked-goods', 'box', 600, 7],
    ['Date Cake', 'baked-goods', 'piece', 850, 6],
    ['Oat Cookies', 'baked-goods', 'box', 450, 12],
    ['Chicken Patties', 'baked-goods', 'dozen', 900, 5],
    ['Garlic Bread', 'baked-goods', 'piece', 300, 11],
    ['Brownies Box', 'baked-goods', 'box', 700, 7],
    ['Banana Bread', 'baked-goods', 'piece', 650, 8],
    ['Wildflower Honey', 'other', 'gram', 950, 9],
    ['Farm Eggs', 'other', 'dozen', 420, 20],
    ['Mixed Pickle Jar', 'other', 'gram', 380, 12],
    ['Mint Chutney Jar', 'other', 'gram', 250, 14],
    ['Roasted Almonds', 'other', 'gram', 850, 8],
    ['Brown Rice Bag', 'other', 'kg', 400, 16],
    ['Chickpea Pack', 'other', 'kg', 360, 15],
    ['Herbal Tea Mix', 'other', 'box', 550, 10],
    ['Mustard Oil Bottle', 'other', 'litre', 780, 7],
    ['Compost Bag', 'other', 'kg', 300, 13],
  ];

  const imageByCategory = {
    vegetables: 'https://images.unsplash.com/photo-1540420773420-3366772f4999',
    fruits: 'https://images.unsplash.com/photo-1610832958506-aa56368176cf',
    dairy: 'https://images.unsplash.com/photo-1628088062854-d1870b4553da',
    'baked-goods': 'https://images.unsplash.com/photo-1509440159596-0249088772ff',
    other: 'https://images.unsplash.com/photo-1542838132-92c53300491e',
  };

  // Product artwork is served by the frontend public directory. Matching by
  // filename means newly added "Product Name.ext" images are picked up the
  // next time the seed runs without another code change.
  const productImagesDirectory = path.resolve(__dirname, '../../../frontend/public/product-images');
  const productImageFiles = fs.existsSync(productImagesDirectory)
    ? fs.readdirSync(productImagesDirectory).filter((file) => /\.(avif|jpe?g|png|webp)$/i.test(file))
    : [];
  const imageByProductName = new Map(productImageFiles.map((file) => [path.parse(file).name.toLowerCase(), file]));
  const imageAliases = {
    'Organic Tomatoes': 'tomato.webp',
    'Sindhri Mangoes': 'Sindhri Mangoe.jpg',
  };

  const productImageUrl = (name, category) => {
    const file = imageAliases[name] || imageByProductName.get(name.toLowerCase());
    return file ? `/product-images/${encodeURIComponent(file)}` : imageByCategory[category];
  };

  for (let index = 0; index < productCatalogue.length; index += 1) {
    const [name, category, unit, price, quantity] = productCatalogue[index];
    const owner = index % 2 === 0 ? farmer : secondFarmer;
    const market = index % 2 === 0 ? cliftonMarket : gulshanMarket;
    await Product.findOneAndUpdate(
      { farmer: owner._id, name },
      {
        farmer: owner._id,
        market: market._id,
        name,
        description: `${name} prepared for reliable local market pickup.`,
        category,
        unit,
        price,
        quantity,
        availableDate,
        imageUrl: productImageUrl(name, category),
        isAvailable: true,
      },
      { upsert: true, new: true, setDefaultsOnInsert: true, runValidators: true }
    );
  }

  const products = await Product.find({ farmer: farmer._id }).sort({ createdAt: 1 });
  const pickupDate = new Date();
  pickupDate.setDate(pickupDate.getDate() + ((6 - pickupDate.getDay() + 7) % 7 || 7));
  const statuses = ['pending', 'confirmed', 'ready', 'completed', 'cancelled'];
  for (let index = 0; index < statuses.length; index += 1) {
    const status = statuses[index];
    const product = products[index % products.length];
    const marker = `Seed ${status} order`;
    if (!(await Order.exists({ customer: customer._id, notes: marker }))) {
      await Order.create({
        customer: customer._id, farmer: farmer._id, market: cliftonMarket._id,
        items: [{ product: product._id, name: product.name, quantity: 1, unit: product.unit, unitPrice: product.price, subtotal: product.price }],
        totalAmount: product.price, pickupDate, pickupSlot: '09:00 - 10:00', status, notes: marker,
        ...(status === 'cancelled' ? { cancelledBy: 'customer', stockRestoredAt: new Date() } : {}),
      });
    }
  }
  const completed = await Order.findOne({ customer: customer._id, status: 'completed' });
  if (completed) {
    const reviewedProduct = await Product.findById(completed.items[0].product);
    await Review.findOneAndUpdate(
      { product: reviewedProduct._id, customer: customer._id },
      { product: reviewedProduct._id, farmer: farmer._id, customer: customer._id, rating: 4, comment: 'Fresh produce and a smooth market pickup.', status: 'active' },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );
    await Product.findByIdAndUpdate(reviewedProduct._id, { averageRating: 4, reviewCount: 1 });
    await Favorite.findOneAndUpdate(
      { user: customer._id, targetType: 'product', target: reviewedProduct._id },
      { $setOnInsert: { user: customer._id, targetType: 'product', target: reviewedProduct._id, restockAlert: true } },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );
    await Favorite.findOneAndUpdate(
      { user: customer._id, targetType: 'farmer', target: farmer._id },
      { $setOnInsert: { user: customer._id, targetType: 'farmer', target: farmer._id } },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );
  }
  await Announcement.findOneAndUpdate(
    { title: 'Welcome to MarketLink' },
    { title: 'Welcome to MarketLink', message: 'Browse verified local produce and reserve it for market pickup.', audience: 'all', active: true, publishAt: new Date(), createdBy: admin._id },
    { upsert: true, setDefaultsOnInsert: true }
  );
  if (products.length >= 3) {
    await WeeklyStockTemplate.findOneAndUpdate(
      { farmer: farmer._id, market: cliftonMarket._id, dayOfWeek: 'saturday', name: 'Saturday harvest' },
      { farmer: farmer._id, market: cliftonMarket._id, dayOfWeek: 'saturday', name: 'Saturday harvest', enabled: true, entries: products.slice(0, 3).map((product, index) => ({ product: product._id, defaultQuantity: [20, 30, 15][index], defaultPrice: product.price, unit: product.unit, active: true })) },
      { upsert: true, setDefaultsOnInsert: true }
    );
  }

  console.log('Demo data ready');
  console.log(`Admin: ${admin.email}`);
  console.log(`Farmer: ${farmer.email}`);
  console.log(`Customer: ${process.env.SEED_CUSTOMER_EMAIL || 'customer@marketlink.test'}`);
  console.log('Pending farmer: pending.farmer@marketlink.test');
  console.log('Suspended customer: suspended.customer@marketlink.test');
  console.log('Passwords use the SEED_*_PASSWORD values from .env (or documented defaults).');
};

seed()
  .then(() => mongoose.disconnect())
  .catch(async (error) => {
    console.error(`Seeding failed: ${error.message}`);
    await mongoose.disconnect();
    process.exit(1);
  });

