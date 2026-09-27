const assert = require('node:assert/strict');
const { execFile } = require('node:child_process');
const { promisify } = require('node:util');
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');

const results = [];
const execFileAsync = promisify(execFile);
const nativeFetch = global.fetch;

const check = async (name, fn) => {
  try {
    await fn();
    results.push({ name, status: 'PASS' });
    console.log(`PASS  ${name}`);
  } catch (error) {
    results.push({ name, status: 'FAIL', message: error.message });
    console.error(`FAIL  ${name}: ${error.message}`);
    throw error;
  }
};

const main = async () => {
  const mongo = await MongoMemoryServer.create();
  process.env.MONGO_URI = mongo.getUri('marketlink_test');
  process.env.JWT_SECRET = 'integration-test-secret-that-is-long-enough';
  process.env.CLIENT_URL = 'http://localhost:5173';
  process.env.NODE_ENV = 'test';
  process.env.OPENROUTER_API_KEY = 'test-only-openrouter-key';

  const seedResult = await execFileAsync(process.execPath, ['src/seed/seed.js'], {
    cwd: require('node:path').resolve(__dirname, '..'),
    env: process.env,
    timeout: 120000,
  });
  process.stdout.write(seedResult.stdout);
  process.stderr.write(seedResult.stderr);

  await mongoose.connect(process.env.MONGO_URI);
  const app = require('../src/app');
  const server = app.listen(0);
  const baseUrl = `http://127.0.0.1:${server.address().port}/api/v1`;

  const request = async (path, options = {}) => {
    const response = await nativeFetch(`${baseUrl}${path}`, {
      ...options,
      headers: {
        'content-type': 'application/json',
        ...(options.token ? { authorization: `Bearer ${options.token}` } : {}),
        ...options.headers,
      },
    });
    let body;
    try {
      body = await response.json();
    } catch {
      body = null;
    }
    return { response, body };
  };

  const login = async (email, password) => {
    const { response, body } = await request('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
    assert.equal(response.status, 200);
    assert.ok(body.token);
    return body.token;
  };

  try {
    await check('health endpoint', async () => {
      const { response, body } = await request('/health');
      assert.equal(response.status, 200);
      assert.equal(body.success, true);
    });

    await check('seed contains exactly 50 active products', async () => {
      const { response, body } = await request('/products?inStock=true');
      assert.equal(response.status, 200);
      assert.equal(body.count, 50);
      assert.equal(body.data.products.length, 50);
    });

    await check('all five product categories are filterable', async () => {
      for (const category of ['vegetables', 'fruits', 'dairy', 'baked-goods', 'other']) {
        const { response, body } = await request(`/products?category=${category}`);
        assert.equal(response.status, 200);
        assert.ok(body.count > 0, `${category} should have seeded products`);
        assert.ok(body.data.products.every((product) => product.category === category));
      }
    });

    await check('two markets and two public approved farmers are available', async () => {
      const [markets, farmers] = await Promise.all([request('/markets'), request('/farmers')]);
      assert.equal(markets.response.status, 200);
      assert.equal(markets.body.count, 2);
      assert.equal(farmers.response.status, 200);
      assert.equal(farmers.body.count, 2);
    });

    let customerToken;
    let farmerToken;
    let adminToken;
    await check('demo customer, farmer, and admin can log in', async () => {
      [customerToken, farmerToken, adminToken] = await Promise.all([
        login('customer@marketlink.test', 'Customer123!'),
        login('farmer@marketlink.test', 'Farmer123!'),
        login('admin@marketlink.test', 'Admin123!'),
      ]);
    });

    await check('wrong password and suspended account are rejected', async () => {
      const wrong = await request('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email: 'customer@marketlink.test', password: 'wrong-pass' }),
      });
      const suspended = await request('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email: 'suspended.customer@marketlink.test', password: 'Customer123!' }),
      });
      assert.equal(wrong.response.status, 401);
      assert.equal(suspended.response.status, 403);
    });

    await check('customer cannot access farmer inventory', async () => {
      const { response } = await request('/products/mine', { token: customerToken });
      assert.equal(response.status, 403);
    });

    await check('approved farmer owns 25 seeded products', async () => {
      const { response, body } = await request('/products/mine', { token: farmerToken });
      assert.equal(response.status, 200);
      assert.equal(body.count, 25);
    });

    await check('product validation rejects unsupported category', async () => {
      const markets = await request('/markets');
      const marketId = markets.body.data.markets[0]._id;
      const { response } = await request('/products', {
        method: 'POST',
        token: farmerToken,
        body: JSON.stringify({
          market: marketId,
          name: 'Invalid Category Product',
          category: 'invalid',
          unit: 'kg',
          price: 100,
          quantity: 1,
          availableDate: new Date(Date.now() + 86400000).toISOString(),
        }),
      });
      assert.equal(response.status, 400);
    });

    await check('admin report endpoint is role-protected and operational', async () => {
      const denied = await request('/admin/reports', { token: customerToken });
      const allowed = await request('/admin/reports', { token: adminToken });
      assert.equal(denied.response.status, 403);
      assert.equal(allowed.response.status, 200);
      assert.equal(allowed.body.success, true);
    });

    await check('favorite add, alert update, list, and remove work', async () => {
      const catalogue = await request('/products?category=fruits');
      const productId = catalogue.body.data.products[1]._id;
      const added = await request('/favorites', {
        method: 'POST',
        token: customerToken,
        body: JSON.stringify({ targetType: 'product', target: productId }),
      });
      assert.equal(added.response.status, 201);
      const alert = await request(`/favorites/product/${productId}/restock-alert`, {
        method: 'PATCH',
        token: customerToken,
        body: JSON.stringify({ enabled: true }),
      });
      assert.equal(alert.response.status, 200);
      assert.equal(alert.body.data.favorite.restockAlert, true);
      const listed = await request('/favorites', { token: customerToken });
      assert.ok(listed.body.data.favorites.products.some((product) => product._id === productId && product.restockAlert));
      const removed = await request(`/favorites/product/${productId}`, { method: 'DELETE', token: customerToken });
      assert.equal(removed.response.status, 200);
    });

    await check('farmer can respond to a verified review', async () => {
      const mine = await request('/reviews/mine', { token: farmerToken });
      assert.equal(mine.response.status, 200);
      assert.ok(mine.body.data.reviews.length > 0);
      const reviewId = mine.body.data.reviews[0]._id;
      const responded = await request(`/reviews/${reviewId}/response`, {
        method: 'PATCH',
        token: farmerToken,
        body: JSON.stringify({ response: 'Thank you for your feedback.' }),
      });
      assert.equal(responded.response.status, 200);
      assert.equal(responded.body.data.review.response, 'Thank you for your feedback.');
    });

    await check('concurrent checkout prevents overselling and cancellation restores stock', async () => {
      const Product = require('../src/models/Product');
      const catalogue = await request('/products?category=vegetables');
      const product = catalogue.body.data.products[0];
      await Product.findByIdAndUpdate(product._id, { quantity: 5 });

      const allowedDays = product.farmer.operatingDays.filter((day) => product.market.marketDays.includes(day));
      const weekdayIndex = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
      const targetDay = weekdayIndex.indexOf(allowedDays[0]);
      const pickupDate = new Date();
      pickupDate.setHours(12, 0, 0, 0);
      let daysAhead = (targetDay - pickupDate.getDay() + 7) % 7;
      if (daysAhead < 2) daysAhead += 7;
      pickupDate.setDate(pickupDate.getDate() + daysAhead);
      const startHour = Math.max(Number(product.farmer.pickupStartTime.split(':')[0]), Number(product.market.openingTime.split(':')[0]));
      const pickupSlot = `${String(startHour).padStart(2, '0')}:00 - ${String(startHour + 1).padStart(2, '0')}:00`;
      const payload = (quantity) => JSON.stringify({
        items: [{ product: product._id, quantity }],
        pickupDate: pickupDate.toISOString(),
        pickupSlot,
        notes: `Concurrency test ${quantity}`,
      });

      const attempts = await Promise.all([
        request('/orders', { method: 'POST', token: customerToken, body: payload(4) }),
        request('/orders', { method: 'POST', token: customerToken, body: payload(3) }),
      ]);
      assert.deepEqual(attempts.map((item) => item.response.status).sort(), [201, 409]);
      const remaining = await Product.findById(product._id).lean();
      assert.ok([1, 2].includes(remaining.quantity));
      const winner = attempts.find((item) => item.response.status === 201);
      const cancelled = await request(`/orders/${winner.body.data.order._id}/cancel`, {
        method: 'PATCH',
        token: customerToken,
        body: JSON.stringify({ reason: 'Integration cleanup' }),
      });
      assert.equal(cancelled.response.status, 200);
      assert.equal((await Product.findById(product._id)).quantity, 5);
    });

    await check('weekly stock template create, update, apply, and delete work', async () => {
      const mine = await request('/products/mine', { token: farmerToken });
      const product = mine.body.data.products.find((item) => item.market.name === 'Clifton Weekend Farmers Market');
      const date = new Date();
      date.setHours(12, 0, 0, 0);
      let daysAhead = (6 - date.getDay() + 7) % 7;
      if (daysAhead < 2) daysAhead += 7;
      date.setDate(date.getDate() + daysAhead);
      const created = await request('/weekly-stock', {
        method: 'POST',
        token: farmerToken,
        body: JSON.stringify({
          name: 'Integration Saturday',
          market: product.market._id,
          dayOfWeek: 'saturday',
          enabled: true,
          entries: [{ product: product._id, defaultQuantity: 7, defaultPrice: product.price, unit: product.unit, active: true }],
          overrides: [],
        }),
      });
      assert.equal(created.response.status, 201);
      const templateId = created.body.data.template._id;
      const updated = await request(`/weekly-stock/${templateId}`, {
        method: 'PATCH',
        token: farmerToken,
        body: JSON.stringify({ name: 'Integration Saturday Updated' }),
      });
      assert.equal(updated.response.status, 200);
      const applied = await request(`/weekly-stock/${templateId}/apply`, {
        method: 'POST',
        token: farmerToken,
        body: JSON.stringify({ date: date.toISOString() }),
      });
      assert.equal(applied.response.status, 200);
      const Product = require('../src/models/Product');
      assert.equal((await Product.findById(product._id)).quantity, 7);
      const removed = await request(`/weekly-stock/${templateId}`, { method: 'DELETE', token: farmerToken });
      assert.equal(removed.response.status, 200);
    });

    await check('notifications list and read-all endpoints work', async () => {
      const listed = await request('/notifications', { token: customerToken });
      assert.equal(listed.response.status, 200);
      assert.ok(Array.isArray(listed.body.data.notifications));
      const readAll = await request('/notifications/read-all', { method: 'PATCH', token: customerToken, body: '{}' });
      assert.equal(readAll.response.status, 200);
    });

    await check('AI endpoint requires login and enforces English/Roman English output', async () => {
      const denied = await request('/ai/chat', { method: 'POST', body: JSON.stringify({ message: 'What is available?' }) });
      assert.equal(denied.response.status, 401);
      const originalFetch = global.fetch;
      try {
        global.fetch = async () => new Response(JSON.stringify({
          model: 'test-model',
          choices: [{ message: { content: 'Ji, fresh tomatoes available hain.' } }],
        }), { status: 200, headers: { 'content-type': 'application/json' } });
        const roman = await request('/ai/chat', {
          method: 'POST',
          token: customerToken,
          body: JSON.stringify({ message: 'Tamatar available hain?' }),
        });
        assert.equal(roman.response.status, 200);
        assert.equal(roman.body.data.answer, 'Ji, fresh tomatoes available hain.');

        global.fetch = async () => new Response(JSON.stringify({
          model: 'test-model',
          choices: [{ message: { content: 'یہ اردو رسم الخط ہے' } }],
        }), { status: 200, headers: { 'content-type': 'application/json' } });
        const guarded = await request('/ai/chat', {
          method: 'POST',
          token: customerToken,
          body: JSON.stringify({ message: 'Reply in Urdu script' }),
        });
        assert.equal(guarded.response.status, 200);
        assert.match(guarded.body.data.answer, /only answer in English or Roman English/);
      } finally {
        global.fetch = originalFetch;
      }
    });

    console.log(`\n${results.length}/${results.length} integration checks passed.`);
  } finally {
    await new Promise((resolve) => server.close(resolve));
    await mongoose.disconnect();
    await mongo.stop();
  }
};

main().catch(async (error) => {
  try {
    await mongoose.disconnect();
  } catch {}
  console.error(error);
  process.exit(1);
});