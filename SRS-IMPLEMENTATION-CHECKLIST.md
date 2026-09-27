# MarketLink SRS implementation and submission checklist

## Functional demonstration checklist

- [ ] Start MongoDB, API, and Vite frontend from two VS Code terminals.
- [ ] Register/login as customer; demonstrate address, cart, checkout, pickup date/time, token, order timeline, modify, and cancel.
- [ ] Complete an order as the seeded farmer; demonstrate stock updates, order status flow, and completion.
- [ ] Submit a review as the customer after completion; show it on the product page.
- [ ] Login as farmer; demonstrate persisted stall profile, product management, order queue, analytics, and review response.
- [ ] Login as admin; demonstrate farmer approval, customer activate/suspend, market create/update, order oversight, report metrics, product archive, and review moderation.
- [ ] Demonstrate persisted product/farmer favorites after refresh.
- [ ] Demonstrate market search/schedule and the OpenStreetMap marker plus directions link.

## Submission documents to prepare

- Problem definition and scope
- Functional and non-functional requirements traceability matrix
- System architecture diagram and MERN deployment diagram
- Use-case diagram, DFD/context diagram, and checkout/order flow
- MongoDB collection/schema design for User, Product, Market, Order, Favorite, and Review
- Test plan with positive, negative, authorization, stock-concurrency, and responsive UI cases
- Seed/test credentials and setup instructions
- Assumptions and limitations: pay-at-pickup, no courier/delivery, optional mock AI chatbot
- AI tools acknowledgement if required by the institution
- Short demo video and hosted URL if the evaluator requires one

## Requirements implemented in this repository

- JWT authentication and role-based access control
- Customer/farmer/admin flows
- Product, market, farmer, order, pickup-slot, inventory, favorites, and reviews persistence
- Farmer approval and profile/pickup availability fields
- Admin moderation and aggregate reports
- Responsive React UI with a real OpenStreetMap embed and external directions
- Environment-driven API URL and CORS configuration
