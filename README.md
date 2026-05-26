# High-Concurrency Patient-Advocate Matching Engine

An enterprise-grade, distributed full-stack application engineered to safely allocate limited healthcare resources (medical advocates) to patients at scale. The system uses pre-computed similarity scores across a large dataset and enforces data integrity during high-volume, simultaneous booking spikes via a distributed Redis mutex lock.

---

## 🚀 Live Deployments & Housekeeping

| Component | Hosting Platform | URL / Endpoint |
| --- | --- | --- |
| **Frontend UI** | Netlify | [Live Dashboard](https://sol-patient-matching-dash.netlify.app/) |
| **Backend API** | Render (Web Service) | `https://sol-patient-matching-engine.onrender.com` |
| **Database** | Neon Postgres | Serverless cloud instance (Heavily indexed) |
| **Distributed Lock** | Upstash Redis | Serverless REST-native instance (Zero-retention) |

---

## 💡 The Problem & The Solution

### The Layperson Analogy

Imagine a highly anticipated concert ticket launch. The exact millisecond tickets go on sale, thousands of fans slam the "Buy" button for the exact same front-row seat. Without a safeguard, the system might accidentally sell that single seat to multiple people at once. In computer science, this is known as a **race condition**.

In this application, we aren't selling concert tickets; we are matching patients with specialized medical advocates. When multiple patients try to secure the same top-tier advocate at the exact same instant, the system must guarantee that only one booking succeeds while the others are safely deflected, preventing double-bookings.

### The Engineering Solution

To solve this, the application implements a **Distributed Mutex (Mutual Exclusion) Lock** using Redis. Before the backend writes an appointment to the core PostgreSQL database, it must acquire a temporary "digital conch" for that specific advocate using an atomic `SET NX PX` command.

* **Thread A (Wins):** Secures the lock, writes the appointment safely to PostgreSQL, and deletes the lock upon completion.
* **Thread B through Z (Blocked):** Hits the lock, gets rejected instantly without straining the primary database, and returns a clean `409 Conflict` status back to the user interface.

---

## 🛠️ System Architecture & Tech Stack

```text
[ React/Vite Frontend ] 
         │  (HTTP REST)
         ▼
[ NestJS Backend Gateway ]  ──(SET NX PX / HTTP REST)──► [ Upstash Redis Mutex ]
         │                                                      │
         │ (TypeORM / TCP)                                      │ (Blocks Collisions)
         ▼                                                      ▼
[ Neon PostgreSQL (1.5M Rows) ] ◄───────────────────────────────┘

```

* **Frontend:** React, Vite, Tailwind CSS, Lucide Icons, and Framer Motion for high-fidelity micro-burst animations.
* **Backend:** NestJS (Node.js framework), TypeScript, and TypeORM. Engineered with **environment-aware scaling** using `node:cluster` to dynamically optimize worker processes based on available cloud CPU cores (`WEB_CONCURRENCY`).
* **Caching & Concurrency Layer:** Upstash Redis SDK (Serverless REST-native configuration), protecting client data via a strict zero-retention privacy policy.
* **Relational Data Layer:** Neon PostgreSQL managing a 1.5-million-row database containing heavily indexed patient records, advocate configurations, and pre-computed matching matrices.

---

## 📊 Performance Benchmarks & Evolution

This system was originally developed and performance-tuned inside a bare-metal sandbox environment before migrating to a distributed cloud layout:

* **HPC Stress-Testing:** Validated on the **ASU Sol High-Performance Computing (HPC) cluster** utilizing an 8-core user-space daemon configuration.
* **The k6 Simulation:** Hit the system with an aggressive load test of over **200,000 requests at a peak rate of 5,000+ requests per second**.
* **The Metric:** Achieved a **0.00% database corruption rate**, mathematically proving the lock's integrity under extreme concurrency.
* **Cloud Portability:** Successfully scaled down to run efficiently within a free-tier cloud container (512MB RAM ceiling) by using dynamic clustering and a REST-based serverless Redis architecture.

---

## 📂 Repository Structure (Monorepo)

The project is structured as a unified monorepo on the `master` branch:

```text
/sol-patient-matching-engine
│
├── /src                      # NestJS Backend Source Code
│   ├── /matches              # Core matching and locking service logic
│   ├── /redis                # Upstash global connection module
│   └── main.ts               # Cluster master/worker bootstrap logic
│
├── /matching-dashboard       # React/Vite Frontend Subdirectory
│   ├── /src
│   │   ├── /assets           # Infographics and static media
│   │   ├── /components       # Interactive simulation widgets
│   │   └── App.tsx           # Primary dashboard UI and stress-test trigger
│   ├── /public/_redirects    # Netlify SPA routing rewrite configuration
│   └── package.json          # Frontend configuration and framer-motion setup
│
├── package.json              # Backend configuration and build scripts
└── README.md                 # Project documentation

```

---

## 🔑 Environment Variables Quick-Reference

### Backend (Render Environment)

* `DATABASE_URL`: Connection string for the Neon PostgreSQL instance.
* `UPSTASH_REDIS_REST_URL`: The REST endpoint provided by the Upstash console.
* `UPSTASH_REDIS_REST_TOKEN`: The secure authorization token for your serverless Redis instance.
* `WEB_CONCURRENCY`: Controlled automatically by Render (set to `1` on free tiers to prevent memory overflow).

### Frontend (Netlify Environment)

* `VITE_API_BASE_URL`: Pointing directly to your live production API (`https://sol-patient-matching-engine.onrender.com`). Falls back to `http://localhost:3000` during local debugging.

---

## 🛠️ Local Maintenance Commands

If returning to this project after a hiatus, use these commands to spin up the local developer environment:

### Running the Backend

From the root directory:

```bash
# Install backend dependencies
npm install

# Run backend in development/watch mode
npm run start:dev

# Build for production
npm run build

```

### Running the Frontend

From the `/matching-dashboard` subdirectory:

```bash
cd matching-dashboard

# Install frontend dependencies
npm install

# Launch Vite development server
npm run dev

# Build static assets for production
npm run build

```
