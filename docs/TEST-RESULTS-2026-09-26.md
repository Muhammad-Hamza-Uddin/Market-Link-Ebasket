# MarketLink test results — 2026-09-26

## Outcome

- Backend syntax: **PASS** — 49 JavaScript files.
- Frontend production build: **PASS** — 1,989 modules transformed after React Router 7 migration.
- Database/API integration suite: **PASS** — 16/16.
- Seed data: **PASS** — exactly 50 active products, split evenly across two approved farmers and five categories.
- Public catalogue filters: **PASS** — vegetables, fruits, dairy, baked goods, and other.
- Authentication/authorization: **PASS** — customer/farmer/admin login, wrong password, suspended account, role guards, and admin reports.
- Favorites/reviews/notifications: **PASS** — favorite lifecycle, restock alert, verified review response, notification list, and read-all.
- Inventory safety: **PASS** — two simultaneous orders against stock 5 produced one success and one conflict; stock never became negative and cancellation restored it.
- Weekly stock: **PASS** — create, update, apply, inventory update, and delete.
- AI integration: **PASS with mocked OpenRouter upstream** — authentication, Roman-English response, and non-Latin-script output guard.
- Backend and frontend production dependency audits: **PASS** — 0 known vulnerabilities.
- Shared-browser rendering: **BLOCKED BY TEST ENVIRONMENT** — the remote browser could not connect to the sandbox-local Vite URL. The production bundle built successfully.

## Changes made

1. Expanded the idempotent seed catalogue to 50 realistic products.
2. Added the `other` category consistently to backend validation and frontend filters.
3. Added an authenticated OpenRouter assistant using live product and market context.
4. Restricted AI output to English or Roman English/Roman Urdu written with Latin characters.
5. Added per-user AI rate limiting, bounded history, timeout/error handling, and environment-only API-key configuration.
6. Expanded the MongoDB-backed suite to 16 checks covering the highest-risk application flows.
7. Upgraded React Router to 7.18.4 and cleared the previous moderate dependency advisories.

## Remaining work

### High priority

1. **Real-browser E2E and responsive QA** — verify 360, 390, 768, 1024, and 1440 px, keyboard navigation, focus handling, modal overflow, and checkout UX in an environment where the browser can reach the app.
2. **Broader order-state edge cases** — add every permitted/forbidden farmer transition and mixed-stall/date/cutoff case. Concurrent oversell prevention and cancellation restoration are covered.

### Medium priority

3. **Additional moderation edge cases** — add admin review removal and all announcement scheduling boundaries.
4. **Password reset** — intentionally left unimplemented per project direction.

### Optional / product decisions

5. **Email or SMS notifications** — not implemented; the current product uses in-app notifications.
6. **Alternate AI model evaluation** — OpenRouter is implemented and the model can be changed using `OPENROUTER_MODEL`.

## Commands

```bash
npm run check:api
npm run build:web
npm run test:integration
```
