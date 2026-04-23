# Listly — Project Overview

This document is the central reference for project materials related to Listly. Add screenshots, diagrams, and other supporting artifacts in [`docs/images/`](./images/) and link them here with relative paths so they render correctly in Git and in your editor preview.

## Repository Materials

- `docs/overview.md` — project overview and linked assets
- `docs/images/` — screenshots, ER diagrams, and architecture images
- `reports/report_writeup.md` — explanation of the reporting features and report-specific screenshots

## Project Summary

Listly is a marketplace web application where users can browse listings, post items for sale, place offers, message other users, complete transactions, leave reviews, and view marketplace reports. The application uses a React frontend and an Express backend connected to a MySQL database.

## Application Structure

### Frontend

The frontend is organized around React routes defined in `frontend/src/App.jsx`. Main user-facing pages include:

- Home / browse listings
- Listing detail
- Create listing
- My listings
- My offers
- Messages
- Profile
- Reports
- Login / register
- Admin users
- Admin listings

### Backend

The backend is started in `backend/server.js` and exposes routes for:

- Authentication
- Listings
- Offers
- Messages
- Reviews
- Transactions
- Reports
- Admin tools

### Reports

The reports page displays two aggregated reports fetched from the backend:

- Seller Performance Summary
- Category Market Overview

These are implemented in `backend/routes/reports.js` and rendered in `frontend/src/pages/Reports.jsx`.

## Screenshot Checklist

Add screenshots for the core flows you want to present in the project submission.

### Main Pages

#### Home Page
![Home page screenshot](./images/home-page.png)

#### Listing Detail Page
![Listing detail screenshot](./images/listing-detail.png)

#### Create Listing Page
![Create listing screenshot](./images/create-listing.png)

#### Messages Page
![Messages page screenshot](./images/messages-page.png)

#### Profile Page
![Profile page screenshot](./images/profile-page.png)

### Reports

#### Reports Page
![Reports page screenshot](./images/reports-page.png)

#### Seller Performance Summary
![Seller performance summary screenshot](./images/seller-performance-summary.png)

#### Category Market Overview
![Category market overview screenshot](./images/category-market-overview.png)

### Admin Views

#### Admin Users Page
![Admin users screenshot](./images/admin-users.png)

#### Admin Listings Page
![Admin listings screenshot](./images/admin-listings.png)

## Diagrams

### ER Diagram
![ER diagram](./images/er-diagram.png)

### System Architecture Diagram
![System architecture diagram](./images/system-architecture.png)

