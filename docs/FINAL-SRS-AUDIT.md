# MarketLink final SRS audit

This audit records repository behavior after the targeted completion pass. `COMPLETE` means the implementation is present and passed the applicable static/build check. It does not imply a live MongoDB integration test unless explicitly stated.

| Requirement | Status | Implementation | Files | Test result |
|---|---|---|---|---|
| Existing repository preserved and audited | COMPLETE | Traced frontend context/API calls through routes, controllers, models, and response normalization; retained the existing React/Express architecture and visual system. | `frontend/src`, `backend/src`, `docs` | Static audit completed |
| Farmer product edit | COMPLETE | Edit action opens a pre-populated, scrollable modal and sends only editable fields through the existing `PATCH /products/:id`; ownership remains server-authoritative. | `FarmerDashboard.jsx`, `ProductForm.jsx`, `StoreContext.jsx`, `productController.js` | API syntax and web build passed |
| Reusable create/edit product form | COMPLETE | One validated component supports create and edit modes, active-market selection, availability, dates, images, and shared field rules. | `ProductForm.jsx`, `FarmerDashboard.jsx` | Web build passed |
| Product empty/archive UX | COMPLETE | Zero products show an action card; archive requires confirmation and explains that order history remains. | `FarmerDashboard.jsx`, `StoreContext.jsx` | Web build passed |
| Product server validation | COMPLETE | Server validates category, unit, active market, non-negative price/quantity, date, availability type, description length, ID, and ownership. | `productController.js`, `Product.js` | API syntax passed |
| Separate farmer product state | COMPLETE | Public customer catalogue and `GET /products/mine` results are stored separately; farmer pages explicitly refresh owned products. | `StoreContext.jsx`, `FarmerDashboard.jsx`, `WeeklyStock.jsx` | Web build passed |
| Weekly Stock loading/error/empty states | COMPLETE | Visible loading, retryable error, no-template, and no-products states replace silent/blank rendering. | `WeeklyStock.jsx`, `styles.css` | Web build passed |
| Multi-product weekly templates | COMPLETE | Templates contain an editable entries array with product, quantity, price, unit, active flag, add, and remove controls. | `WeeklyStock.jsx`, `WeeklyStockTemplate.js`, `weeklyStockController.js` | API syntax and web build passed |
| Weekly template edit/enable/apply/delete | COMPLETE | Saved templates use the existing PATCH/apply/delete endpoints and share the create/edit form. | `WeeklyStock.jsx`, `weeklyStockRoutes.js` | API syntax and web build passed |
| Weekly apply-date UX | COMPLETE | The UI suggests the next matching weekday and rejects missing, invalid, past, or mismatched dates; the server repeats validation. | `WeeklyStock.jsx`, `weeklyStockController.js` | API syntax and web build passed |
| Per-date weekly overrides | COMPLETE | Quantity/price overrides are persisted per product/date and applied without mutating recurring defaults. | `WeeklyStock.jsx`, `WeeklyStockTemplate.js`, `weeklyStockController.js` | API syntax and web build passed |
| Weekly apply to live inventory | COMPLETE | Apply copies active entry values into `Product`; farmer products/templates refresh; weekly restocks use deduplicated notifications. Orders continue to decrement `Product.quantity` only. | `weeklyStockController.js`, `StoreContext.jsx`, `orderController.js` | API syntax and web build passed |
| Farmer dashboard tabs and metrics | COMPLETE | Every tab has content or an explanatory state. Metrics, last-seven-day volume, revenue, product mix, orders, and reviews derive from API-loaded records; hardcoded chart values were removed. | `FarmerDashboard.jsx`, `StoreContext.jsx` | Web build passed |
| Farmer profile persistence | COMPLETE | Stall/owner/location, weekdays, pickup start/end, cutoff, slot length, and coordinates save to the farmer profile with client/server validation. | `FarmerDashboard.jsx`, `authController.js`, `User.js` | API syntax and web build passed |
| Pickup slots and cutoff | COMPLETE | Checkout and order editing derive slots from farmer and market hours; backend validates date, market/farmer day, time window, and cutoff. | `Checkout.jsx`, `Orders.jsx`, `normalize.js`, `orderController.js` | API syntax and web build passed |
| Order ownership/state machine | COMPLETE | Customer/farmer queries are owner-scoped; transitions are controlled; terminal states stay terminal; conditional updates prevent double restoration. | `orderController.js`, `orderRoutes.js`, `Order.js` | API syntax passed; no live DB concurrency test |
| Product filters | COMPLETE | Search, backend category slugs, maximum price, market, market day, and sorting are available. | `Products.jsx`, `productController.js` | Web build passed |
| Review-backed ratings | COMPLETE | Products and farmers use aggregate rating/count data and show “No ratings yet” when empty. | `reviewController.js`, `farmerController.js`, `ProductCard.jsx`, `Farmers.jsx`, `Home.jsx` | API syntax and web build passed |
| Persistent notifications | COMPLETE | Order placed/new/confirmed/ready/cancelled and restock notifications persist with unread/read/read-all support; event keys deduplicate repeat events. | `Notification.js`, `notifications.js`, `orderController.js`, `weeklyStockController.js`, `Navbar.jsx` | API syntax and web build passed |
| Announcements | COMPLETE | Admin create/edit/archive/reactivate/schedule/expiry/audience flows are present; active listing filters schedule/expiry and now resolves authenticated audience. | `AdminAnnouncements.jsx`, `announcementController.js`, `announcementRoutes.js` | API syntax and web build passed |
| Favorites/restock alerts | COMPLETE | Product/farmer favorites persist; restock opt-in is stored; favorite upsert no longer risks a duplicate on a changed alert value. | `favoriteController.js`, `Favorite.js`, `Favorites.jsx` | API syntax and web build passed |
| Write-API authorization/security | COMPLETE | Role middleware plus owner-scoped controller filters cover products, orders, reviews, profiles, templates, favorites, announcements, and admin operations. | `backend/src/middleware`, `backend/src/controllers`, `backend/src/routes` | Static security audit and API syntax passed |
| Responsive polish | PARTIAL | Added scroll-safe inventory tables, mobile modal sizing, stacked weekly forms/cards, wrapping actions, and mobile override inputs. | `styles.css`, `FarmerDashboard.jsx`, `WeeklyStock.jsx` | Web build passed; remote shared browser could not reach the sandbox server, so viewport rendering was not fully executed |
| Demo data | COMPLETE | Seeds include exactly 50 active products across five categories, two active markets, two active farmers, all order statuses, a completed-order review, product/farmer favorites, a multi-entry weekly template, announcements, and pending/suspended moderation records. | `backend/src/seed/seed.js` | Executed against an isolated MongoDB; 50 products verified |
| Automated DB integration tests | COMPLETE (expanded suite) | Added a self-contained in-memory MongoDB suite for seed volume, filters, authentication, authorization, favorites, review response, concurrent checkout/stock restoration, weekly stock, notifications, and AI language enforcement. | `backend/scripts/integrationTest.js`, package scripts | 16/16 passed |
| Password reset | NOT IMPLEMENTED | No email/token reset provider or flow is configured. | — | Not applicable |
| Live AI service | COMPLETE | Added an authenticated OpenRouter endpoint using live catalogue/market context, bounded history, timeout/error handling, per-user rate limiting, and an English/Roman-English-only output guard. | `AIChat.jsx`, `aiController.js`, `aiRoutes.js`, `aiRateLimit.js` | Mocked upstream integration passed |

## Verification executed

- `npm install`
- `npm run install:all`
- `npm run check:api`
- `npm run build:web`
- `npm run test:integration` — 16/16 checks passed against isolated MongoDB
- Local Vite server returned HTTP 200 from the sandbox.
- Shared-browser rendering was attempted, but the remote browser proxy could not connect back to the sandbox-hosted Vite server.

## Remaining limitations

- Core and high-risk database flows are automated, including concurrent checkout; full browser E2E and every edge case remain candidates for further expansion.
- Responsive CSS was implemented at the requested breakpoints, but the remote browser network restriction prevented full visual checks at 360, 390, 768, 1024, and 1440 px.
- React Router was upgraded to 7.18.4 and both production dependency audits now report zero known vulnerabilities.