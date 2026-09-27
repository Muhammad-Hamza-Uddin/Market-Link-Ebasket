# Architecture and flows

## Scope

MarketLink connects customers with approved local farmers for pre-orders collected at configured community markets. Payment occurs at pickup. Delivery, online payment, email/SMS delivery and a production AI service are outside the current scope.

```mermaid
flowchart LR
  B[React + Vite] -->|JSON + JWT| A[Express REST API]
  A --> M[(MongoDB / Mongoose)]
  B --> O[OpenStreetMap]
  B --> G[Google directions]
```

The browser stores only the JWT, cached session display data, UI theme and temporary cart. MongoDB is authoritative for business data.

## Use cases and context

```mermaid
flowchart TB
  C[Customer] --> CB[Browse, favorite, pre-order, track, review]
  F[Farmer] --> FP[Profile, products, weekly stock, fulfill orders]
  A[Admin] --> AU[Approvals, markets, moderation, reports, announcements]
  CB --> DB[(MongoDB)]
  FP --> DB
  AU --> DB
```

## Checkout flow

```mermaid
sequenceDiagram
  participant C as Customer UI
  participant API as Express API
  participant DB as MongoDB
  C->>API: POST /orders
  API->>DB: Load products, farmer and market
  API->>API: Validate stall, day, slot and cutoff
  loop each item
    API->>DB: Decrement where quantity >= requested
  end
  API->>DB: Create pending order and notifications
  API-->>C: Server-priced order
```

Decisions:
- Categories use stable slugs: `vegetables`, `fruits`, `dairy`, `baked-goods`.
- A basket has one farmer and market because availability/cutoff rules are farmer-specific.
- Applying a weekly template copies values to `Product`; orders never mutate templates.
- Revenue means completed-order revenue.
- Deploy with `TZ=Asia/Karachi` so cutoff interpretation matches the business timezone.
