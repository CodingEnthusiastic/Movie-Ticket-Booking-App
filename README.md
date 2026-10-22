# 🎬 Yozigo Cinema: Movie Ticket Booking Web App

A full-stack movie ticket booking web application built for **Yozigo Full-Stack Intern Task**.  
Features atomic seat holding, zero double booking, real-time WebSocket seat synchronization, and comprehensive automated concurrency tests.

---

## 📋 Table of Contents
1. [Tech Stack & Architecture Decisions](#-tech-stack--architecture-decisions)
2. [Flows Completed (Flows 1 to 10)](#-flows-completed-flows-1-to-10)
3. [Test Credentials (Seed Script)](#-test-credentials-from-seed-script)
4. [Database Design & Schema Diagram](#-database-design--schema-diagram)
5. [How We Stopped Double Booking](#-how-we-stopped-double-booking)
6. [Local Setup Instructions](#-local-setup-instructions)
7. [Running Tests (Including Double Booking Concurrency Test)](#-running-tests)
8. [Docker Compose Setup](#-docker-compose-setup)
9. [Screen Recording Guide](#-screen-recording-guide)

---

## 🧠 Tech Stack & Architecture Decisions

### 1. Frontend: React + TypeScript (Vite + Tailwind CSS + Lucide Icons)
- **Why React with TypeScript:** Type safety across all API responses, seat states, and booking models ensures zero runtime reference crashes.
- **Why Tailwind CSS & Lucide:** Clean, modern cinema UI with dark theme aesthetics, custom seat status legends, and screen curvature markers without bloated external UI libraries.

### 2. Backend: Node.js + Express + TypeScript
- **Why Node.js & Express:** Lightweight, modular REST architecture with clean separation of concerns (`routes`, `controllers`, `middleware`, `db`).
- **Why WebSockets (Socket.IO):** Bi-directional, sub-50ms seat state synchronization across multiple browsers using show-specific rooms (`show-${showId}`).

### 3. Database: SQLite (via `better-sqlite3` in WAL Mode)
- **Why SQL over NoSQL (MongoDB):** The prompt explicitly specifies: *"Any SQL database: PostgreSQL (preferred), MySQL or SQLite. No NoSQL for the main data."*
- **Zero-Friction Evaluation:** SQLite runs in-process with zero external server dependencies, meaning any evaluator can run `npm run seed && npm run dev` in 5 seconds without setting up Postgres or MongoDB servers.
- **ACID Transactions:** With WAL (Write-Ahead Logging) mode and `db.transaction()`, SQLite guarantees strict ACID isolation for concurrent writes.

---

## ✅ Flows Completed (Flows 1 to 10)

| Flow | Status | Description |
|---|---|---|
| **Flow 1: Sign up and log in** | ✅ Completed | Name, email, password (≥ 8 chars). Passwords hashed with bcrypt. Clear errors without leaking whether email or password was wrong. Protected routes on frontend and backend. |
| **Flow 2: Browse movies and shows** | ✅ Completed | Home page lists movies with title, poster, language, duration, and ratings (U, UA, A). Shows grouped by date; shows already started are excluded. Displays free seats count (e.g. `76/80 Free`). |
| **Flow 3: See the seat map** | ✅ Completed | 8 x 10 seat grid (rows A to H, seats 1 to 10 = 80 seats). "Screen This Way" marker. States: Available, Selected, Held by other, Booked. Booked and held seats cannot be clicked. |
| **Flow 4: Select and hold seats** | ✅ Completed | Select 1 to 6 seats (7th seat shows warning). Shows seat codes (e.g. "C4, C5") and total price. Clicking "Continue" holds seats for 5 minutes with live countdown timer. If seat is taken, user is notified which seat and map refreshes. |
| **Flow 5: Pay and confirm booking** | ✅ Completed | Fake payment step with "Payment success" and "Payment failure" buttons. Success marks seats booked and issues receipt with Booking ID. Failure keeps hold for remainder of 5 mins for retry. Double booking impossible at DB level. |
| **Flow 6: My bookings** | ✅ Completed | Lists customer bookings: upcoming first, then past ones. Strict user tenant isolation: user can never see another user's bookings. |
| **Flow 7: Admin: Add movies & shows** | ✅ Completed | Admin role (seeded). Add, edit, delete movies. Add shows with **SCREEN OVERLAP CHECK** (shows error if another movie is screening during that time window). Cannot delete show with bookings. |
| **Bonus Flow 8: Cancel a booking** | ✅ Completed | Customer can cancel upcoming booking up to 2 hours before showtime. Releasing seats immediately back to available. Cancellation within 2 hours or past shows is rejected. |
| **Bonus Flow 9: Admin: See bookings per show** | ✅ Completed | For each show, admin sees seats booked out of 80, percentage full bar, and total revenue collected. Admin can open show to see customer booking list and visual seat map. |
| **Bonus Flow 10: Live seat updates** | ✅ Completed | Socket.IO WebSockets push seat holds, bookings, and cancellations to all open browsers viewing that show within milliseconds without page reload. |

---

## 🔑 Test Credentials (From Seed Script)

The seed script creates two test personas:

| Role | Email | Password | What to Test |
|---|---|---|---|
| **Cinema Admin (Staff)** | `admin@cinema.com` | `admin123456` | Add/Edit/Delete Movies, Schedule Shows with overlap collision detection, View occupancy stats & booking lists. |
| **Customer** | `customer@cinema.com` | `password123` | Pick seats, test 5-minute hold timer, test Payment Success & Payment Failure, view and cancel bookings. |

> **Evaluator Tip:** The Login modal includes **One-Click Quick Fill buttons** for both Admin and Customer!

---

## 🗄 Database Design & Schema Diagram
<img width="1536" height="1024" alt="image" src="https://github.com/user-attachments/assets/bde5ee31-cf86-463f-98dd-4cfbb35b0812" />


---

## 🛡 How We Stopped Double Booking

Double booking is prevented at the database and transaction layer:

1. **Database Schema Constraint:**  
   `UNIQUE(show_id, seat_number)` guarantees at the database engine level that no seat can have duplicate records for the same show.
2. **ACID Transaction Locking:**  
   Holding or booking seats runs inside `db.transaction()`:
   - Evaluates expired holds first.
   - Inspects the requested seats: if any seat is `booked` or currently held by another user (`held_until > now`), the transaction aborts and throws `SEAT_TAKEN`.
   - The first transaction writes `status = 'held'` (or `'booked'`).
   - The second transaction reading the updated row sees the seat is no longer available and is rejected with HTTP `409 Conflict`.
3. **Automated Concurrency Proof:**  
   See `backend/src/__tests__/double-booking.test.ts`. It fires two simultaneous asynchronous requests for the exact same seat via `Promise.all()` and asserts that exactly ONE succeeds (200) and the other fails (409).

---

## 🚀 Local Setup Instructions

### Prerequisites
- Node.js (v18 or higher; tested on v22)
- npm (v9 or higher)

### Step 1: Install Dependencies
From the repository root:
```bash
npm run install:all
```
*(Or navigate to `backend` and `frontend` folders individually and run `npm install`).*

### Step 2: Seed the Database
```bash
npm run seed
```
This initializes the database schema, seeds the Admin, Customer, 4 Movies, and 6 Shows with 480 pre-generated seats.

### Step 3: Start the Backend & Frontend
In terminal 1 (Backend API & WebSockets on port 5000):
```bash
npm run dev:backend
```

In terminal 2 (Frontend React App on port 5173):
```bash
npm run dev:frontend
```

Open your browser at: **`http://localhost:5173`**

---

## 🧪 Running Tests

Run the automated backend test suite (includes authentication tests, show overlap collision tests, and the double-booking concurrency test):
```bash
npm test
```
Or inside the `backend` folder:
```bash
cd backend
npm test
```

Expected output:
```
PASS src/__tests__/shows.test.ts
PASS src/__tests__/auth.test.ts
PASS src/__tests__/double-booking.test.ts

Test Suites: 3 passed, 3 total
Tests:       13 passed, 13 total
```

---

## 🐳 Docker Compose Setup

Run the entire application in isolated containers with one command:
```bash
docker compose up --build
```
- Frontend will be available at `http://localhost:3000`
- Backend API will be available at `http://localhost:5000`

---

## 🎥 Screen Recording Guide (For Submission)

To record your 3–5 minute video demonstration:
1. **Flow 1 & 2:** Open browser, browse movies and showtimes grouped by date with available seat counts.
2. **Flow 3 & 4:** Open a show, click seats (attempt 7th seat to demonstrate the 6-seat limit). Click Continue to start the 5-minute hold timer.
3. **Flow 10 Live WebSocket Sync:** Open a second Incognito browser window side-by-side. Hold a seat in window 1, watch window 2 update in real time without refreshing!
4. **Flow 5 Payment:** Test "Payment failure" (seats remain held so user can retry). Then click "Payment success" to confirm booking and view the digital ticket receipt.
5. **Flow 6 & 8:** Go to "My Bookings". Cancel a booking that is > 2 hours away and observe the seats becoming available again immediately.
6. **Flow 7 & 9 Admin:** Log in as `admin@cinema.com`. Try scheduling an overlapping show to demonstrate error handling. Inspect show occupancy and view the customer bookings list and visual seat map.
