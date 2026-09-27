# MarketLink Backend

MarketLink connects customers with local farmers and farmers markets. This JavaScript REST API provides authentication, farmer approval, market locations, weekly inventory, product search, and pickup pre-orders.

## Stack

- Node.js and Express
- MongoDB and Mongoose
- JWT authentication
- bcryptjs password hashing

## Setup

1. Install Node.js 18+ and MongoDB.
2. Run `npm install`.
3. Copy `.env.example` to `.env` and replace `JWT_SECRET` with a long random value.
4. Make sure MongoDB is running.
5. Run `npm run seed` to add repeatable demo data.
6. Run `npm run dev` to start the API.

The API base URL is `http://localhost:5000/api/v1`. Test it with `GET /api/v1/health`.

## Demo users

Unless overridden using the `SEED_*` environment variables:

| Role | Email | Password |
|---|---|---|
| Admin | `admin@marketlink.test` | `Admin123!` |
| Farmer | `farmer@marketlink.test` | `Farmer123!` |
| Customer | `customer@marketlink.test` | `Customer123!` |

These defaults are only for local competition demonstrations. Change them before a public deployment.

## Environment variables

| Variable | Purpose | Example |
|---|---|---|
| `PORT` | Express port | `5000` |
| `NODE_ENV` | Runtime environment | `development` |
| `MONGO_URI` | MongoDB connection | `mongodb://127.0.0.1:27017/marketlink` |
| `JWT_SECRET` | Private JWT signing key | Long random string |
| `JWT_EXPIRES_IN` | Token lifetime | `7d` |
| `CLIENT_URL` | Comma-separated allowed frontend origins | `http://localhost:5173` |
| `SEED_*_EMAIL` | Demo account emails | See `.env.example` |
| `SEED_*_PASSWORD` | Demo account passwords | See `.env.example` |

Never commit the real `.env` file.

## Authentication

Registration and login return a JWT. Send it to protected routes as `Authorization: Bearer YOUR_TOKEN`. Logout increments the user's token version, invalidating older tokens. Passwords are excluded from normal queries and JSON responses.

## Important business rules

- New farmers begin with `pending` status; only an admin can approve them.
- Only active farmers can publish inventory or manage orders.
- A pre-order contains products from one farmer at one market.
- Prices and totals are calculated by the backend.
- Stock is reduced during ordering and restored when a pending order is cancelled.
- Market GeoJSON coordinates are always `[longitude, latitude]`.
- Product deletion archives the listing so historical orders remain understandable.

See [API.md](./API.md) for the complete frontend contract and example bodies.

## Commands

```bash
npm run dev
npm start
npm run seed
npm run check
```

## Project structure

```text
src/
├── config/       MongoDB connection
├── controllers/  Business and HTTP logic
├── middleware/   Authentication, roles, validation, and errors
├── models/       User, Market, Product, and Order schemas
├── routes/       Versioned REST routes
├── seed/         Repeatable demonstration data
├── utils/        Shared helpers
├── app.js        Express configuration
└── server.js     Application startup
```

