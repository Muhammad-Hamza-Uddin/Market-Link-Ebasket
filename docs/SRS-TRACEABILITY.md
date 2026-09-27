# MarketLink SRS traceability

Status values describe actual repository behavior.

| Requirement | Status | Implementation | Primary files |
|---|---|---|---|
| Customer auth/profile | COMPLETE | JWT/bcrypt, server profile, suspension enforcement | `authController.js`, `Profile.jsx` |
| Farmer registration/approval | COMPLETE | Pending registration and admin approval/suspension | `adminController.js`, `PendingApproval.jsx` |
| Markets/maps/directions | COMPLETE | Database GeoJSON, OSM display, Google directions | `Market.js`, `Markets.jsx` |
| Product search/filters | COMPLETE | Category slugs, text, price, market and market-day filters | `productController.js`, `Products.jsx` |
| Product/farmer ratings | COMPLETE | Review-backed averages/counts; unrated entities show no ratings | `reviewController.js`, `farmerController.js` |
| Cart/pre-order | COMPLETE | One farmer/market, server pricing, conditional stock decrement | `StoreContext.jsx`, `orderController.js` |
| Pickup windows/cutoff | COMPLETE | Dynamic UI slots and backend day/hour/cutoff validation | `Checkout.jsx`, `orderController.js` |
| Order transitions/cancellation | COMPLETE | Controlled state machine and guarded one-time stock restoration | `Order.js`, `orderController.js` |
| Modify/reorder/review | COMPLETE | Pending edits, live-product reorder, completed-purchase review | `Orders.jsx`, `reviewController.js` |
| Favorites/restock alerts | COMPLETE | Persistent favorites, opt-in alert and deduplicated event | `Favorite.js`, `Favorites.jsx` |
| Weekly stock | COMPLETE | Multi-product templates, edit/enable/delete, safe apply-date suggestions, per-date overrides, explicit states, and copy to independent live stock | `WeeklyStockTemplate.js`, `weeklyStockController.js`, `WeeklyStock.jsx` |
| Farmer dashboard | COMPLETE | Live orders, completed revenue, seven-day order volume, inventory, reviews, product mix, explanatory empty states, and reusable product create/edit form | `FarmerDashboard.jsx`, `ProductForm.jsx` |
| Notifications | COMPLETE | Persistent inbox, unread/read-all and order/farmer/restock events | `Notification.js`, `Navbar.jsx` |
| Announcements | COMPLETE | Audience, scheduling, expiry, archive/reactivate | `Announcement.js`, `AdminAnnouncements.jsx` |
| Admin dashboard | COMPLETE | Database-backed users, markets, orders, revenue and moderation | `adminController.js`, `AdminDashboard.jsx` |
| Security/ownership | COMPLETE | Role checks, owner filters, server validation, hidden passwords | backend middleware/controllers |
| Stock concurrency | COMPLETE | Conditional `$gte` decrements prevent oversell; compensation handles later item failure | `orderController.js` |
| Password reset | NOT IMPLEMENTED | Misleading control removed; no email provider configured | `Login.jsx` |
| AI assistant | COMPLETE | Authenticated OpenRouter integration with live product/market context, per-user rate limiting, bounded history, timeout/error handling, and English/Roman-English-only output guard | `AIChat.jsx`, `aiController.js`, `aiRoutes.js` |
| Email/SMS | NOT IMPLEMENTED | Optional; app uses persistent in-app notifications | notification subsystem |
| Automated integration tests | COMPLETE (expanded suite) | An isolated MongoDB-backed suite verifies seed volume, filters, authentication, authorization, favorites, verified review response, concurrent checkout/stock restoration, weekly stock CRUD/apply, notifications, AI access, and language enforcement | `backend/scripts/integrationTest.js` |
