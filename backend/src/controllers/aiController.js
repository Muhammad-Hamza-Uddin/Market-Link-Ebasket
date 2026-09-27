const Product = require('../models/Product');
const Market = require('../models/Market');
const User = require('../models/User');
const AppError = require('../utils/AppError');
const asyncHandler = require('../utils/asyncHandler');

const OPENROUTER_URL = 'https://openrouter.ai/api/v1/chat/completions';
const NON_LATIN_SCRIPT = /[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF\u0900-\u097F]/;

const cleanHistory = (history) => {
  if (!Array.isArray(history)) return [];
  return history
    .slice(-8)
    .filter((item) => ['user', 'assistant'].includes(item?.role) && typeof item?.content === 'string')
    .map((item) => ({ role: item.role, content: item.content.trim().slice(0, 1000) }))
    .filter((item) => item.content);
};

// Local fallback assistant for offline demonstration or when API key is not configured
const generateLocalAnswer = (query, role, products, markets, farmers) => {
  const q = query.toLowerCase();

  // 1. Market timings and locations
  if (q.includes('timing') || q.includes('time') || q.includes('market') || q.includes('schedule') || q.includes('when') || q.includes('location')) {
    if (!markets.length) return 'Currently there are no active markets listed.';
    const marketDetails = markets
      .map((m) => `• **${m.name}** (${m.address}): Open on ${m.marketDays.join(', ')} from ${m.openingTime} to ${m.closingTime}.`)
      .join('\n');
    return `Here are the active farmers market locations and timings:\n\n${marketDetails}\n\nYou can view them on the interactive OpenStreetMap on the **Markets** page.`;
  }

  // 2. Pickup windows and how ordering works
  if (q.includes('pickup') || q.includes('window') || q.includes('slot') || q.includes('how to order') || q.includes('pay') || q.includes('order')) {
    return `### Pickup Windows & Ordering:\n1. **Browse & Add to Cart:** Pick fresh items from verified local farmers.\n2. **Checkout & Slot Selection:** Choose your pickup date and specific pickup time window (aligned with the farmer's operating hours).\n3. **Pay at Pickup:** Pay in cash or direct payment when you collect your pre-packed fresh basket at the market stall.\n4. **Order Timeline:** Track your order status in real-time under **Orders**.`;
  }

  // 3. Farmer availability & stalls
  if (q.includes('farmer') || q.includes('grower') || q.includes('stall') || q.includes('vendor') || q.includes('who')) {
    if (!farmers.length) return 'Currently no verified farmers are active.';
    const farmerList = farmers
      .map((f) => `• **${f.farmName || f.name}** (${f.location || 'Local Farm'}): Active days: ${(f.operatingDays || []).join(', ') || 'Market days'}. Pickup window: ${f.pickupStartTime || '09:00'} - ${f.pickupEndTime || '18:00'}.`)
      .join('\n');
    return `Here are our verified active farmers and their availability:\n\n${farmerList}\n\nYou can visit the **Farmers** page to see their full profile and individual stall items.`;
  }

  // 4. Products and in-stock items
  if (q.includes('product') || q.includes('item') || q.includes('stock') || q.includes('fruit') || q.includes('vegetable') || q.includes('available') || q.includes('price') || q.includes('honey') || q.includes('organic')) {
    if (!products.length) return 'No in-stock products are currently available.';
    const topProducts = products.slice(0, 8)
      .map((p) => `• **${p.name}** (${p.category}): Rs. ${p.price}/${p.unit} — Stock: ${p.quantity} (${p.farmer?.farmName || p.farmer?.name || 'Local Farmer'} @ ${p.market?.name || 'Market'})`)
      .join('\n');
    return `Here are some fresh items currently in stock across our markets:\n\n${topProducts}\n\nVisit the **Products** page to search, filter by category/price, and add items to your cart!`;
  }

  // 5. Role-specific Farmer & Admin help
  if (role === 'farmer') {
    return `Hello Farmer! Here is what you can do:\n• **Update Stock:** Go to **Weekly Stock** or **Farmer Dashboard** to add or edit inventory.\n• **Pickup Slots:** Set your stall operating days and pickup time windows in **Farmer Dashboard**.\n• **Manage Orders:** View incoming customer orders and mark them as packed or completed in your order queue.`;
  }

  if (role === 'admin') {
    return `Hello Admin! From your **Admin Dashboard**, you can:\n• Approve or suspend farmer applications.\n• Create and update market locations & schedules.\n• Broadcast platform-wide announcements.\n• Monitor order revenue, platform statistics, and moderate reviews.`;
  }

  // Default general guidance
  return `Hi! I am your MarketLink AI Assistant. You can ask me about:\n• **Market Timings & Locations** (e.g. "What are the market timings?")\n• **Farmer Availability** (e.g. "Which farmers are active this weekend?")\n• **Pickup Windows & Order Rules** (e.g. "How do pickup slots work?")\n• **Product Stock & Prices** (e.g. "What organic vegetables are available?")`;
};

const chat = asyncHandler(async (req, res) => {
  const message = String(req.body.message || '').trim();
  if (!message) throw new AppError('Please enter a message', 400);
  if (message.length > 1000) throw new AppError('Message cannot exceed 1000 characters', 400);

  const userRole = req.user?.role || 'guest';
  const userName = req.user?.name || 'Guest User';

  // Fetch real-time products, markets, and verified farmers
  const [products, markets, farmers] = await Promise.all([
    Product.find({ isAvailable: true, quantity: { $gt: 0 } })
      .select('name category price unit quantity farmer market')
      .populate('farmer', 'name farmName location')
      .populate('market', 'name address')
      .sort({ availableDate: 1 })
      .limit(30)
      .lean(),
    Market.find({ isActive: true })
      .select('name address marketDays openingTime closingTime')
      .sort({ name: 1 })
      .limit(10)
      .lean(),
    User.find({ role: 'farmer', accountStatus: 'active' })
      .select('name farmName location operatingDays pickupStartTime pickupEndTime orderCutoffTime pickupSlotMinutes')
      .sort({ farmName: 1 })
      .limit(15)
      .lean(),
  ]);

  // If no OpenAI / OpenRouter key is provided in .env, use high-quality local knowledge-base fallback
  if (!process.env.OPENROUTER_API_KEY) {
    const localAnswer = generateLocalAnswer(message, userRole, products, markets, farmers);
    return res.status(200).json({
      success: true,
      data: {
        answer: localAnswer,
        model: 'marketlink-local-rule-engine',
      },
    });
  }

  const catalogueContext = products
    .map((p) => `• ${p.name} (${p.category}): Rs. ${p.price}/${p.unit}, Stock: ${p.quantity}, Farmer: ${p.farmer?.farmName || p.farmer?.name || 'Unknown'}, Market: ${p.market?.name || 'Local Market'}`)
    .join('\n');

  const marketContext = markets
    .map((m) => `• ${m.name} (${m.address}): Days: ${m.marketDays.join(', ')}, Timings: ${m.openingTime} to ${m.closingTime}`)
    .join('\n');

  const farmerContext = farmers
    .map((f) => `• ${f.farmName || f.name} (${f.location || 'Local'}): Days: ${(f.operatingDays || []).join(', ') || 'All market days'}, Pickup Hours: ${f.pickupStartTime || '09:00'} - ${f.pickupEndTime || '18:00'}, Cutoff: ${f.orderCutoffTime || '18:00'}`)
    .join('\n');

  const systemPrompt = `You are MarketLink's intelligent AI Assistant for a local farmers-market pre-order and pickup platform.
Current User Context: Logged in as [${userRole.toUpperCase()}] named "${userName}".

Your core responsibilities per project SRS:
1. Help customers find specific items across markets and farmers (matching categories, stock, prices).
2. Answer common questions such as market timings, market locations, Farmer availability/stalls, pickup windows, and product details.
3. Tailor assistance according to the user's role:
   - For CUSTOMER / GUEST: Guide them to search products, markets, farmers, how pickup slots work, and pay-at-pickup rules.
   - For FARMER: Guide them on stock updates, pickup windows, order fulfillment, and stall management.
   - For ADMIN: Guide them on farmer approvals, announcements, and market schedule management.

Language & Format Rules:
- Answer ONLY in clear English or friendly Roman English/Roman Urdu written in the Latin alphabet.
- Match user style: use plain English for English queries and friendly Roman English for Roman English queries.
- NEVER output non-Latin scripts (no Arabic/Urdu script, no Hindi/Devanagari).
- Format responses cleanly with concise bullet points or markdown headings.
- Never invent unavailable products, prices, or fake policies. Use the live context below.

=== LIVE SYSTEM DATA ===
ACTIVE MARKETS & TIMINGS:
${marketContext || 'No active markets currently listed.'}

VERIFIED ACTIVE FARMERS & PICKUP WINDOWS:
${farmerContext || 'No active farmers currently listed.'}

AVAILABLE IN-STOCK PRODUCTS:
${catalogueContext || 'No in-stock products currently available.'}`;

  let upstream;
  try {
    upstream = await fetch(OPENROUTER_URL, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
        'Content-Type': 'application/json',
        ...(process.env.OPENROUTER_SITE_URL ? { 'HTTP-Referer': process.env.OPENROUTER_SITE_URL } : {}),
        'X-Title': 'MarketLink',
      },
      body: JSON.stringify({
        model: process.env.OPENROUTER_MODEL || 'openai/gpt-4o-mini',
        temperature: 0.3,
        max_tokens: 450,
        messages: [
          { role: 'system', content: systemPrompt },
          ...cleanHistory(req.body.history),
          { role: 'user', content: message },
        ],
      }),
      signal: AbortSignal.timeout(20000),
    });
  } catch (error) {
    // If upstream times out or fails, gracefully return local answer rather than an ugly crash
    const fallbackAnswer = generateLocalAnswer(message, userRole, products, markets, farmers);
    return res.status(200).json({
      success: true,
      data: { answer: fallbackAnswer, model: 'marketlink-local-fallback' },
    });
  }

  const payload = await upstream.json().catch(() => null);
  if (!upstream.ok) {
    const fallbackAnswer = generateLocalAnswer(message, userRole, products, markets, farmers);
    return res.status(200).json({
      success: true,
      data: { answer: fallbackAnswer, model: 'marketlink-local-fallback' },
    });
  }

  let answer = String(payload?.choices?.[0]?.message?.content || '').trim();
  if (!answer) {
    answer = generateLocalAnswer(message, userRole, products, markets, farmers);
  }
  if (NON_LATIN_SCRIPT.test(answer)) {
    answer = 'Sorry, I can only answer in English or Roman English. Please ask your question again in English or Roman English.';
  }

  res.status(200).json({
    success: true,
    data: {
      answer,
      model: payload?.model || process.env.OPENROUTER_MODEL || 'openai/gpt-4o-mini',
    },
  });
});

module.exports = { chat };