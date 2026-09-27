const Category = require('../models/Category');

const DEFAULT_CATEGORIES = [
  { name: 'Fresh Vegetables', slug: 'vegetables', icon: 'vegetables', sortOrder: 10 },
  { name: 'Fresh Fruits', slug: 'fruits', icon: 'fruits', sortOrder: 20 },
  { name: 'Dairy', slug: 'dairy', icon: 'dairy', sortOrder: 30 },
  { name: 'Baked Goods', slug: 'baked-goods', icon: 'bakery', sortOrder: 40 },
  { name: 'Other', slug: 'other', icon: 'basket', sortOrder: 50 },
];

async function ensureDefaultCategories() {
  if (await Category.exists({})) return;
  await Category.insertMany(DEFAULT_CATEGORIES, { ordered: false }).catch((error) => {
    if (error.code !== 11000) throw error;
  });
}

module.exports = { DEFAULT_CATEGORIES, ensureDefaultCategories };
