# Practical test plan

Do not mark a case passed without running it against a configured MongoDB.

## Repository checks
1. `npm run check:api`
2. `npm run build:web`
3. Match every frontend API call to an Express route.

## Functional cases
- **Auth:** registration, duplicate email, wrong password, suspended JWT invalidation, farmer approval.
- **Customer:** category/price/market/day filters; one-stall cart; checkout; invalid day/slot/cutoff; insufficient stock; modify/cancel; favorite/alert; reorder; completed-order review.
- **Farmer:** owned product CRUD; negative value rejection; weekly template apply; confirm/ready/complete/cancel transitions; cutoff; review response; live metrics.
- **Admin:** approvals/suspensions; market CRUD with verified coordinates; product/review moderation; reports; announcement scheduling/archive.
- **Security:** unauthenticated calls, wrong role, cross-customer order access, cross-farmer writes, invalid IDs/quantities/statuses.
- **Concurrency:** with stock 5, submit quantity 4 and 3 concurrently; one must fail and stock must never become negative.
- **Responsive/accessibility:** verify 360, 390, 768, 1024 and 1440 px; keyboard menus/modals; labels; focus; overflow; semantic controls.
