# Listly

A peer-to-peer marketplace where users can buy and sell items from one another. Listly supports item listings with categories, buyer/seller roles, offers, messaging, transactions, and reviews — with Stripe integration for payments.

---

## Project Structure

```
Listly/
├── README.md
├── docs/                     # Diagrams, screenshots, and reference materials
├── db/                       # Database schema and seed script
│   ├── listly_schema.sql     # Full MySQL schema
│   └── seed.js               # Script to populate the DB with fake data
├── backend/                  # Node.js + Express API server
│   ├── db.js                 # MySQL connection
│   ├── server.js             # Express app and routes
│   ├── middleware/           # Auth and admin middleware
│   ├── routes/               # Route handlers
│   ├── .env                  # Your local environment variables (never commit this)
│   ├── .env.example          # Template for environment variables
│   └── package.json
├── frontend/                 # React app (Vite)
│   ├── src/
│   │   ├── pages/            # All page components
│   │   ├── components/       # Shared components (Navbar, modals, etc.)
│   │   └── context/          # Auth context
│   ├── index.html
│   └── package.json
├── reports/                  # Report writeups and documentation
│   └── report_writeup.md
└── roles/                    # Team member contributions
    └── contributions.md
```

---

## Prerequisites

Make sure you have the following installed before setting up:

- [Node.js](https://nodejs.org/) v20.19 or higher
- [MySQL Server 8.0](https://dev.mysql.com/downloads/mysql/)
- [MySQL Workbench](https://dev.mysql.com/downloads/workbench/) (optional but recommended)

---

## Setup Instructions

### 1. Clone the repo

```bash
git clone https://github.com/lumberger22/listly.git
cd listly
```

### 2. Set up the database

Open MySQL Workbench (or use the command line) and run:

```sql
CREATE DATABASE listly;
```

Then run the schema file to create all tables. In Workbench:

- Select the `listly` database in the left panel (click it so it goes bold)
- Go to **File → Open SQL Script** → open `db/listly_schema.sql`
- Hit the ⚡ Execute button

Or via command line:

```bash
mysql -u root -p listly < db/listly_schema.sql
```

### 3. Set up the backend

```bash
cd backend
npm install
cp .env.example .env
```

Open `.env` and fill in your MySQL credentials:

```
DB_HOST=localhost
DB_USER=root
DB_PASS=your_mysql_password
DB_NAME=listly
JWT_SECRET=your_secret_here
```

Start the backend:

```bash
node server.js
```

You should see:

```
Listly backend running on port 3001
Connected to Listly MySQL database
```

### 4. Set up the frontend

```bash
cd frontend
npm install
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) in your browser.

---

## Seeding the Database (Optional)

The repo includes a seed script that populates the database with realistic fake data so you can explore the app without manually creating accounts and listings.

**Run from the project root (make sure the backend `.env` is configured first):**

```bash
node db/seed.js
```

The script will clear all existing data and insert fresh seed data each time it runs.

### What it creates

- **1 admin account** — full access to User Management and Listing Management pages
- **5 regular user accounts** — each account has both buyer and seller access
- **15 listings** — spread across Electronics, Furniture, Clothing, Books, Sports, Home & Garden, Musical Instruments, Tools, and Collectibles
- **4 offers** — with statuses: pending, accepted, and countered
- **2 completed transactions** — one shipped by mail, one in-person pickup
- **2 reviews** — written by buyers after completed transactions
- **3 conversations** with message threads between users

### Test accounts

All accounts use the password `password123`.

| Username | Email | Role |
| --- | --- | --- |
| `admin` | admin@listly.com | Admin |
| `alex_sells` | alex@example.com | User |
| `brianna_b` | brianna@example.com | User |
| `carlos_c` | carlos@example.com | User |
| `diana_d` | diana@example.com | User |
| `evan_e` | evan@example.com | User |

---

## Running the App

Every time you work on the project you need two terminals running:

**Terminal 1 — Backend:**

```bash
cd backend
node server.js
```

**Terminal 2 — Frontend:**

```bash
cd frontend
npm run dev
```

---

## Tech Stack

| Layer    | Technology              |
| -------- | ----------------------- |
| Frontend | React, JavaScript, Vite |
| Backend  | Node.js, Express        |
| Database | MySQL 8.0               |
| Payments | Stripe (planned)        |

---

## Database Tables

The schema includes the following tables:

- **User** — base account info (includes `is_admin` flag)
- **Buyer** — buyer-specific data (linked to User)
- **Seller** — seller-specific data (linked to User)
- **Item_Listing** — listings posted by sellers
- **Transaction** — completed purchases
- **Payment** — payment details per transaction
- **Delivery_Method** — in-person or mail delivery info
- **Conversation** — messaging threads between users
- **Message** — individual messages within a conversation
- **Review** — buyer reviews of sellers after a transaction
- **Offer** — buyer offers on listings

---

## Notes

- Never commit your `.env` file — it contains your database password
- Each team member runs their own local MySQL database
- When the schema changes, re-run `db/listly_schema.sql` in Workbench to update your local tables
- The `.env.example` file shows which environment variables are needed without exposing any credentials
