# 🌱 MarketLink — eGreen Basket Farmers Market Platform

[![Node.js](https://img.shields.io/badge/Node.js-v18+-339933?style=flat&logo=node.js&logoColor=white)](https://nodejs.org/)
[![Express.js](https://img.shields.io/badge/Express.js-v4.19-000000?style=flat&logo=express&logoColor=white)](https://expressjs.com/)
[![React](https://img.shields.io/badge/React-v18-61DAFB?style=flat&logo=react&logoColor=black)](https://react.dev/)
[![Vite](https://img.shields.io/badge/Vite-v5-646CFF?style=flat&logo=vite&logoColor=white)](https://vitejs.dev/)
[![MongoDB](https://img.shields.io/badge/MongoDB-Mongoose-47A248?style=flat&logo=mongodb&logoColor=white)](https://www.mongodb.com/)
[![JWT](https://img.shields.io/badge/Auth-JWT_Tokens-000000?style=flat&logo=jsonwebtokens&logoColor=white)](https://jwt.io/)
[![License](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)

**MarketLink (eGreen Basket)** is a production-grade, SRS-compliant full-stack MERN (MongoDB, Express, React, Node.js) web application designed to connect local farmers directly with urban consumers. It enables customers to browse farm-fresh produce, pre-order for scheduled market days, select pickup windows, and collect their baskets directly from farmer stalls using a transparent **Pay-at-Pickup** model.

---

## 📑 Table of Contents

- [Key Features & Role-Based Capabilities](#-key-features--role-based-capabilities)
- [System Architecture & Tech Stack](#-system-architecture--tech-stack)
- [Project Directory Structure](#-project-directory-structure)
- [Prerequisites](#-prerequisites)
- [Step-by-Step Installation & Setup](#-step-by-step-installation--setup)
- [Environment Variables Configuration](#-environment-variables-configuration)
- [Demo Credentials](#-demo-credentials)
- [Core Business Rules & Workflow](#-core-business-rules--workflow)
- [REST API Endpoints Overview](#-rest-api-endpoints-overview)
- [Automated Testing & Build Verification](#-automated-testing--build-verification)
- [Documentation Index](#-documentation-index)

---

## ✨ Key Features & Role-Based Capabilities

### 🛒 1. Customer Experience
- **Interactive Storefront:** Search and filter fresh produce by category (Vegetables, Fruits, Dairy, Herbs, Honey), price range, and in-stock availability.
- **Farmer & Market Discovery:** Explore verified local farmers, view their stalls, bio, operating days, and find physical market locations with embedded **OpenStreetMap** geolocation.
- **Cart & Scheduled Checkout:** Select a specific pickup date and time window corresponding to the farmer's stall schedule.
- **Real-Time Order Tracking:** View order timelines, unique pickup tokens, and modify pickup notes/windows while orders remain `pending`.
- **Favorites & Reviews:** Save favorite products/farmers and submit verified ratings and reviews after collecting completed orders.

### 👨‍🌾 2. Farmer Portal
- **Stall & Profile Management:** Configure farm details, bio, stall operating days, pickup time windows, and order cutoff times.
- **Inventory & Stock Control:** Create, edit, and archive products with unit types (`kg`, `dozen`, `bunch`, `piece`), prices, and quantity management.
- **Live Order Fulfillment Queue:** Manage incoming customer pre-orders through real-time status transitions: `pending` ➔ `confirmed` ➔ `ready_for_pickup` ➔ `completed` (or `cancelled`).
- **Feedback Management:** View customer reviews and publish direct farmer replies.

### 🛡️ 3. Admin Governance & Oversight
- **Farmer Moderation:** Review incoming farmer registrations and approve or suspend farmer accounts.
- **Market Location Setup:** Create and update physical farmers market locations with GPS coordinates, operating days, and schedules.
- **Platform Announcements:** Broadcast site-wide alerts and announcements for seasonal events or schedule changes.
- **Analytics & Review Moderation:** Access aggregate revenue reports, platform metrics, order oversight, and moderate inappropriate reviews.

### 🤖 4. AI Shopping & Inquiries Assistant
- **Role-Aware Smart Assistant:** Offers dynamic suggested questions tailored to Customer, Farmer, Admin, and Guest modes.
- **SRS-Compliant Intelligence:** Answers queries regarding real-time catalog stock, market timings, farmer availability, and pickup policies in **English** and **Roman Urdu**.
- **Resilient Fallback Engine:** Features seamless integration with OpenRouter (GPT-4o-mini) and an offline local knowledge engine that pulls live database answers during demonstrations.

---

## 🛠 System Architecture & Tech Stack

```
┌─────────────────────────────────────────────────────────────┐
│                    React + Vite Frontend                    │
│     (State: Context API | Styling: CSS3 + Framer Motion)     │
└──────────────────────────────┬──────────────────────────────┘
                               │  REST API / JSON (Axios)
                               ▼
┌─────────────────────────────────────────────────────────────┐
│                     Express & Node.js API                   │
│   (JWT Auth | Role RBAC | Rate Limiting | Error Handlers)   │
└──────────────┬───────────────────────────────┬──────────────┘
               │                               │
               ▼                               ▼
┌─────────────────────────────┐ ┌─────────────────────────────┐
│      MongoDB Database       │ │   OpenRouter AI Service     │
│ (Mongoose ODM / Validation) │ │   (GPT-4o-mini / Local)     │
└─────────────────────────────┘ └─────────────────────────────┘
```

| Layer | Technologies |
| :--- | :--- |
| **Frontend** | React 18, Vite 5, React Router v6, Framer Motion, Lucide Icons, Axios |
| **Backend** | Node.js, Express.js, Mongoose, JSON Web Tokens (JWT), Bcrypt.js, CORS |
| **Database** | MongoDB (Local Community Server or MongoDB Atlas) |
| **Maps & AI** | OpenStreetMap (Leaflet embed), OpenRouter API (GPT-4o-mini) |

---

## 📂 Project Directory Structure

```text
marketlink-mern-farmers-market/
├── backend/
│   ├── scripts/               # Syntax checkers and integration test suites
│   ├── src/
│   │   ├── config/            # Database connection setup
│   │   ├── controllers/       # Route controllers (auth, products, orders, ai, etc.)
│   │   ├── middleware/        # JWT auth, role guards, rate limiters, error handler
│   │   ├── models/            # Mongoose schemas (User, Product, Market, Order, etc.)
│   │   ├── routes/            # Express route definitions
│   │   ├── seed/              # Database seed script with sample data
│   │   ├── utils/             # AppError and asyncHandler utilities
│   │   └── app.js             # Express app setup and middleware configuration
│   ├── server.js              # Server entrypoint
│   ├── .env.example           # Backend environment template
│   └── package.json           # Backend dependencies and scripts
│
├── frontend/
│   ├── public/                # Static brand assets and logo images
│   ├── src/
│   │   ├── api/               # Axios client configuration and response normalizers
│   │   ├── components/        # Reusable UI components (Navbar, AIChat, Footer, etc.)
│   │   ├── context/           # Global StoreContext state provider
│   │   ├── pages/             # Route pages (Home, Products, Checkout, Dashboards)
│   │   ├── styles.css         # Core application design and responsive rules
│   │   ├── App.jsx            # Main route switchboard
│   │   └── main.jsx           # React DOM entrypoint
│   ├── index.html             # HTML root template
│   ├── .env.example           # Frontend environment template
│   └── package.json           # Frontend dependencies and scripts
│
├── docs/                      # Architectural and academic SRS documentation
│   ├── ARCHITECTURE.md        # Architectural diagrams and data flow
│   ├── DATABASE.md            # Schema designs and ER diagrams
│   ├── SRS-TRACEABILITY.md    # Requirements traceability matrix
│   └── TEST-PLAN.md           # Test cases and verification scenarios
│
├── package.json               # Root monorepo management scripts
└── README.md                  # Project documentation
```

---

## 📦 Prerequisites

Before running the application, ensure you have the following installed:

- **Node.js**: `v18.0.0` or higher ([Download Node.js](https://nodejs.org/))
- **npm**: `v9.0.0` or higher
- **MongoDB**: Local MongoDB Community Server running on port `27017` ([Download MongoDB](https://www.mongodb.com/try/download/community)) or a free [MongoDB Atlas](https://www.mongodb.com/atlas) connection URI.

---

## 🚀 Step-by-Step Installation & Setup

### Method 1: Root Monorepo Commands (Recommended)

1. **Clone the repository and enter the directory:**
   ```bash
   git clone <repository-url>
   cd marketlink-mern-farmers-market
   ```

2. **Install all dependencies for both frontend and backend:**
   ```bash
   npm run install:all
   ```

3. **Configure Environment Files:**
   - Copy `backend/.env.example` to `backend/.env`
   - Copy `frontend/.env.example` to `frontend/.env`

   *Windows PowerShell:*
   ```powershell
   Copy-Item backend/.env.example backend/.env
   Copy-Item frontend/.env.example frontend/.env
   ```
   *macOS / Linux:*
   ```bash
   cp backend/.env.example backend/.env
   cp frontend/.env.example frontend/.env
   ```

4. **Seed the database with sample markets, farmers, and products:**
   ```bash
   npm run seed
   ```

5. **Start both backend and frontend servers in separate terminals:**
   - **Terminal 1 (Backend API):**
     ```bash
     npm run dev:api
     ```
   - **Terminal 2 (Frontend Client):**
     ```bash
     npm run dev:web
     ```

---

### Method 2: Standard Two-Terminal Setup

#### Terminal 1: Backend API

```bash
cd backend
npm install
npm run seed
npm run dev
```
> The API server will start on **`http://localhost:5000`** (Base API: `http://localhost:5000/api/v1`).

#### Terminal 2: Frontend Client

```bash
cd frontend
npm install
npm run dev
```
> The Vite development server will start on **`http://localhost:5173`**. Open this URL in your browser.

---

## ⚙️ Environment Variables Configuration

### Backend (`backend/.env`)

| Variable | Default Value | Description |
| :--- | :--- | :--- |
| `PORT` | `5000` | Port on which the Express server listens |
| `NODE_ENV` | `development` | Runtime environment (`development` / `production`) |
| `MONGO_URI` | `mongodb://127.0.0.1:27017/marketlink` | MongoDB connection connection string |
| `JWT_SECRET` | `replace_this_with_a_long_random_secret` | Secret key used for signing JWT authentication tokens |
| `JWT_EXPIRES_IN` | `7d` | Token validity duration |
| `CLIENT_URL` | `http://localhost:5173` | Allowed frontend origin for CORS |
| `OPENROUTER_API_KEY` | *(Optional)* | OpenRouter API Key for GPT-4o-mini AI assistant |
| `OPENROUTER_MODEL` | `openai/gpt-4o-mini` | LLM model identifier |
| `OPENROUTER_SITE_URL` | `http://localhost:5173` | Application URL sent in AI request headers |

### Frontend (`frontend/.env`)

| Variable | Default Value | Description |
| :--- | :--- | :--- |
| `VITE_API_URL` | `http://localhost:5000/api/v1` | Base REST API URL consumed by Axios |

---

## 🔑 Demo Credentials

Running `npm run seed` populates the database with pre-configured accounts representing each system role:

| Role | Email Address | Password | Permissions & Scope |
| :--- | :--- | :--- | :--- |
| 🛡️ **Admin** | `admin@marketlink.test` | `Admin123!` | Farmer approval, market management, platform announcements, review moderation, reports |
| 👨‍🌾 **Approved Farmer 1** | `farmer@marketlink.test` | `Farmer123!` | Green Valley Farm (Malir), inventory control, order queue, pickup slot settings |
| 👨‍🌾 **Approved Farmer 2** | `farmer.gulshan@marketlink.test` | `Farmer123!` | Gulshan Orchard Stall, seasonal fruit inventory, review response |
| 🛒 **Customer** | `customer@marketlink.test` | `Customer123!` | Ayesha Khan (Karachi), cart, checkout, pickup slot booking, order history, reviews |

---

## 📋 Core Business Rules & Workflow

1. **Pay-at-Pickup Model:** MarketLink does not require credit card or third-party payment gateway integration. Customers reserve their orders online and complete payment in cash or direct transfer upon collecting items at the market stall.
2. **Single-Farmer / Single-Market Rule:** To ensure seamless pickup logistics, each order checkout must contain products from the **same farmer and market location**.
3. **Inventory Reservation & Restoration:** Stock quantities are deducted automatically upon customer order placement. If an order is cancelled while in `pending` status, stock is restored to the live inventory.
4. **Verified Buyer Reviews:** Customers are only permitted to review a product if they have a completed order containing that product (`completed` status). Each user is restricted to one review per product.
5. **Farmer Approval Lifecycle:** Newly registered farmers receive a `pending` status and cannot publish listings until approved by an Administrator.

---

## 📡 REST API Endpoints Overview

All backend endpoints are prefixed with `/api/v1`.

### Authentication & Users
- `POST /api/v1/auth/register` — Register a new Customer or Farmer account
- `POST /api/v1/auth/login` — Authenticate user and receive JWT cookie/token
- `GET /api/v1/auth/me` — Retrieve profile of the currently logged-in user
- `PUT /api/v1/auth/profile` — Update account profile details and preferences

### Products & Categories
- `GET /api/v1/products` — Retrieve in-stock products (supports search, category, and price filters)
- `GET /api/v1/products/:id` — Get detailed product information, farmer info, and verified reviews
- `POST /api/v1/products` — Create a new product listing *(Farmer only)*
- `PUT /api/v1/products/:id` — Update existing product listing *(Farmer only)*
- `DELETE /api/v1/products/:id` — Archive / delete product listing *(Farmer/Admin)*

### Markets & Farmers
- `GET /api/v1/markets` — List all active farmers markets with schedules and coordinates
- `GET /api/v1/farmers` — List all approved farmers and their stall profiles
- `GET /api/v1/farmers/:id` — Get farmer public profile, stall schedule, and listed products

### Orders & Checkout
- `POST /api/v1/orders` — Create pre-order, reserve stock, and assign pickup token *(Customer)*
- `GET /api/v1/orders` — Retrieve user's order history *(Customer / Farmer)*
- `GET /api/v1/orders/:id` — Get detailed order summary and pickup details
- `PUT /api/v1/orders/:id/status` — Advance order status *(Farmer)*
- `PUT /api/v1/orders/:id/modify` — Modify pickup time window or notes *(Customer — pending only)*
- `PUT /api/v1/orders/:id/cancel` — Cancel order and restore reserved stock *(Customer / Farmer)*

### Reviews & Favorites
- `POST /api/v1/reviews` — Submit verified product review after order completion *(Customer)*
- `POST /api/v1/reviews/:id/response` — Add farmer response to a review *(Farmer)*
- `GET /api/v1/favorites` — Retrieve authenticated user's favorite products and farmers
- `POST /api/v1/favorites/toggle` — Add or remove product/farmer from favorites

### AI Shopping Assistant
- `POST /api/v1/ai/chat` — Role-based intelligent shopping inquiry endpoint

### Admin Dashboard & Moderation
- `GET /api/v1/admin/farmers` — Retrieve pending and active farmer applications
- `PUT /api/v1/admin/farmers/:id/status` — Approve or suspend farmer account
- `GET /api/v1/admin/reports` — Platform summary metrics, order volume, and active user stats
- `POST /api/v1/admin/announcements` — Broadcast a platform-wide announcement banner

---

## 🧪 Automated Testing & Build Verification

The codebase includes automated syntax checks and integration tests for testing the API and database logic:

```bash
# 1. Run backend syntax validation across all JS files
npm run check:api

# 2. Execute backend integration test suite (Isolated MongoDB connection)
npm run test:integration

# 3. Build the frontend for production
npm run build:web
```

---

## 📚 Documentation Index

For in-depth architectural specifications and evaluation documentation, refer to the following:

- 📑 [SRS Requirements Traceability Matrix](docs/SRS-TRACEABILITY.md)
- 🏗️ [System Architecture & Data Flows](docs/ARCHITECTURE.md)
- 🗄️ [Database Schema & ER Diagrams](docs/DATABASE.md)
- 📋 [Comprehensive Test Plan](docs/TEST-PLAN.md)
- 📖 [Backend REST API Specification](backend/API.md)
- ✅ [SRS Submission & Evaluation Checklist](SRS-IMPLEMENTATION-CHECKLIST.md)

---

## 👥 Authors & Acknowledgments

- **Project Name:** MarketLink (eGreen Basket)
- **Architecture:** Full-Stack MERN Architecture
- **Version:** 1.0.0 (Production Release)
