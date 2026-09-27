# MarketLink — eGreen Basket Frontend

React.js + JavaScript frontend based on the supplied MarketLink SRS.

## Included
- Responsive modern landing page
- Product browsing/search/filter
- Product details
- Add to Cart
- Quantity controls and cart totals
- Favorites
- Pre-order/pickup flow
- Order history/status timeline
- Farmers directory
- Markets/map UI placeholder
- Customer login/register UI
- Farmer dashboard UI
- Reviews UI
- Optional AI assistant UI
- About and Contact pages
- Framer Motion animations
- Lucide icons

## Run
```bash
npm install
npm run dev
```

Then open the Vite URL shown in the terminal.

## Important
This is a frontend prototype. Authentication, database, real order persistence, real map API, email/in-app notifications, and a real AI service are intentionally represented by UI/demo state and should be connected during backend integration.

The SRS says online payment is out of scope; the frontend therefore uses a pickup/pre-order flow and displays payment-at-pickup.

## Suggested next integration
Backend stack can follow the SRS option:
MongoDB + Express.js + React + Node.js.

Recommended API modules:
- /auth
- /products
- /farmers
- /markets
- /orders
- /reviews
- /favorites
- /admin
