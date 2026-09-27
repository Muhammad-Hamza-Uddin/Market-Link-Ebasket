# MarketLink API Contract

Base URL: `http://localhost:5000/api/v1`

Successful responses use `success: true` and place resources inside `data`. Errors use `{ "success": false, "message": "Explanation" }`. Protected routes require `Authorization: Bearer <token>`.

## Authentication and profiles

| Method | Route | Access |
|---|---|---|
| POST | `/auth/register` | Public customer registration; name, email, password, phone, address |
| POST | `/auth/register/farmer` | Public farmer registration; also farmName and location |
| POST | `/auth/login` | Public |
| GET | `/auth/me` | Authenticated |
| PATCH | `/auth/me` | Authenticated profile/stall update |
| POST | `/auth/logout` | Authenticated |

Farmer profile updates may include `farmName`, `location`, `operatingDays`, `pickupStartTime`, `pickupEndTime`, and `coordinates`.

## Farmers, markets, and products

| Method | Route | Access |
|---|---|---|
| GET | `/farmers?search=green` | Public |
| GET | `/farmers/:id` | Public |
| GET | `/markets` | Public |
| GET | `/markets/:id` | Public |
| GET | `/products` | Public |
| GET | `/products/:id` | Public |
| GET | `/products/mine` | Approved farmer |
| POST | `/products` | Approved farmer |
| PATCH | `/products/:id` | Owning approved farmer |
| DELETE | `/products/:id` | Owning approved farmer; archives listing |

Market filters include `search`, `day`, and a geospatial `longitude`, `latitude`, `radiusKm` query. Locations use `{ "type": "Point", "coordinates": [longitude, latitude] }`.

## Orders and pickup

| Method | Route | Access |
|---|---|---|
| POST | `/orders` | Customer |
| GET | `/orders/my-orders` | Customer |
| GET | `/orders/farmer` | Approved farmer |
| GET | `/orders/:id` | Order customer, farmer, or admin |
| PATCH | `/orders/:id` | Customer; pending only; modifies pickup date/slot/notes |
| PATCH | `/orders/:id/cancel` | Customer; pending only |
| PATCH | `/orders/:id/status` | Assigned farmer |

Create a pre-order:

```json
{
  "items": [{ "product": "PRODUCT_ID", "quantity": 3 }],
  "pickupDate": "<next-valid-market-date>",
  "pickupSlot": "09:00 AM – 10:00 AM",
  "notes": "Morning pickup"
}
```

The backend calculates prices and totals. Status flow is `pending → confirmed → ready → completed`; pending or confirmed orders can be cancelled by the responsible party.

## Favorites

| Method | Route | Access |
|---|---|---|
| GET | `/favorites` | Customer |
| POST | `/favorites` | Customer |
| DELETE | `/favorites/:targetType/:target` | Customer |

POST body: `{ "targetType": "product", "target": "PRODUCT_ID" }` or use `farmer` as the type.

## Reviews

| Method | Route | Access |
|---|---|---|
| GET | `/reviews/product/:productId` | Public active reviews |
| GET | `/reviews/farmer/:farmerId` | Public active reviews |
| GET | `/reviews/mine` | Approved farmer |
| POST | `/reviews` | Customer with a completed order for the product |
| PATCH | `/reviews/:id/response` | Owning farmer |
| DELETE | `/reviews/:id` | Admin; soft-removes review |

POST body: `{ "product": "PRODUCT_ID", "rating": 5, "comment": "Fresh and well packed" }`.

## Administration

All routes below require an admin token.

| Method | Route | Purpose |
|---|---|---|
| GET | `/admin/farmers?status=pending` | List farmers |
| PATCH | `/admin/farmers/:id/status` | Approve, suspend, or return to pending |
| GET | `/admin/customers` | List customers |
| PATCH | `/admin/customers/:id/status` | Activate or suspend customer |
| GET | `/admin/orders` | Order oversight |
| GET | `/admin/reports` | Revenue, order, customer, farmer, product, and best-selling aggregates |
| POST | `/admin/markets` | Create market |
| PATCH | `/admin/markets/:id` | Update/deactivate market |
| PATCH | `/admin/products/:id/archive` | Archive product |
| DELETE | `/admin/reviews/:id` | Remove review from public display |
