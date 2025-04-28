# LoyalPyME

[![GitHub repo size](https://img.shields.io/github/repo-size/R3v180/LoyalPyME?style=flat-square)](https://github.com/R3v180/LoyalPyME)
[![GitHub contributors](https://img.shields.io/github/contributors/R3v180/LoyalPyME?style=flat-square)](https://github.com/R3v180/LoyalPyME/graphs/contributors)
[![GitHub last commit](https://img.shields.io/github/last-commit/R3v180/LoyalPyME?style=flat-square)](https://github.com/R3v180/LoyalPyME/commits/main)
[![GitHub issues](https://img.shields.io/github/issues/R3v180/LoyalPyME?style=flat-square)](https://github.com/R3v180/LoyalPyME/issues)
[![GitHub pull requests](https://img.shields.io/github/issues-pr/R3v180/LoyalPyME?style=flat-square)](https://github.com/R3v180/LoyalPyME/pulls)
[![License: AGPL v3](https://img.shields.io/badge/License-AGPL%20v3-blue.svg?style=flat-square)](https://www.gnu.org/licenses/agpl-3.0)

---

🇬🇧 **You are reading the English version.** | 🇪🇸 [Leer en Español](README.es.md)

---

# LoyalPyME 🇬🇧

**LoyalPyME** is a comprehensive, full-stack web platform (React Frontend + Node.js Backend) designed to empower Small and Medium-sized Enterprises (SMEs) with a robust, maintainable, and scalable digital customer loyalty program.

## Vision and Purpose ✨

In today's competitive market, customer loyalty is crucial. LoyalPyME aims to be the technological ally for SMEs, providing the tools to:

- **Foster Repeat Business:** Implement engaging points, tiers, and rewards systems.
- **Build Stronger Relationships:** Recognize and reward customer loyalty effectively.
- **Simplify Program Management:** Offer an intuitive and feature-rich administration panel.
- **Enhance Customer Experience:** Provide a clear, accessible digital portal for end customers.

Our goal is to enable any SME (retail, hospitality, services, etc.) to digitize and optimize its customer retention strategy, evolving the platform towards integrated communication, CRM capabilities, a mobile presence, and potentially shared loyalty ecosystems.

|                                    Admin Dashboard (Desktop)                                    |                                       Admin Dashboard (Mobile)                                       |
| :---------------------------------------------------------------------------------------------: | :--------------------------------------------------------------------------------------------------: |
| <img src="images/SC_LoyalPyME.png" alt="LoyalPyME Admin Dashboard - Desktop View" width="100%"> | <img src="images/SC_LoyalPyME_PHONE.png" alt="LoyalPyME Admin Dashboard - Mobile View" width="100%"> |

_(Note: Screenshots might need updating to reflect the latest UI)_

## Project Status & Roadmap 🗺️

LoyalPyME's development follows a phased approach, prioritizing the delivery of a functional loyalty core and scaling towards advanced and community capabilities.

**Phase 1: Loyalty Core (Web) - (Operational & Near Completion)**

- **Centralized Rewards Management:** Creation, editing, deletion, and status management (active/inactive) of redeemable rewards. **(Functional)**
- **Transactional Points System:** Generation of unique QR codes per transaction for point assignment. **(Functional)** Validation of QR codes by the end customer to earn points. **(Functional)**
- **Configurable Tier System:** Definition of tiers with thresholds, management of associated benefits, configuration of global system logic and downgrade policies (via backend). **(Functional)**
- **Essential Customer Portal:** User profile visualization (points, tier), visualization of available rewards and gifts, redemption of both categories. **(Functional)**
- **Admin Customer Management:**

  - Listing of registered customers with key data (points, tier, registration date, status), sorting. **(Functional)**

  * Basic search by name/email. **(Functional)**
  * Pagination (Basic UI/Backend logic present). **(Functional)**
  * Individual Actions: Manual adjustment of points, manual tier change, assignment of rewards as gifts, marking/unmarking as "Favorite", Activate/Deactivate customer. **(Functional)**
  * View Details Modal: Displays detailed customer information including admin notes. **(Functional)**
  * Admin Notes: Ability to view, edit, and save internal notes per customer. **(Functional)**
  * Bulk Actions: Select multiple customers, Bulk Activate/Deactivate, Bulk Delete (with confirmation), Bulk Adjust Points (with input modal). **(Functional)**

- **_Remaining Tasks for Phase 1:_**
  - Implement full UI and backend connection for **Filters** in Admin customer management (e.g., by Active status, Favorite status, Tier).
  - **Optimize/Enhance Search & Pagination** (Review backend query performance, potentially improve frontend UI components).
  - **General Cleanup** (Address TODOs, remove debug logs, centralize types, code consistency review).

**Future Phases (Towards a Complete Ecosystem):**

- **Phase 2 (Web Expansion):** More complex points and rewards rules, basic direct communication tools (email, portal publications), advanced customer segmentation, potentially other bulk actions.
- **Phase 3 (Mobile Platform):** Native mobile applications for customers and staff, push notifications, location-based check-in, digital loyalty card in the app.
- **Phase 4 (Business Intelligence & Lightweight CRM):** Analytics and reporting modules on customer behavior and value, lightweight CRM functionalities (full history beyond notes?), marketing automation.
- **Phase 5 (Connected Ecosystems & Social Potential):** Shared loyalty programs among groups of businesses, events module, Customer-Business chat, and potential community/social chat (e.g., anonymous activity map in specific sectors like nightlife), expansion to other sectors and geographies.

## Used Technologies 🛠️

**Frontend:**

- React & TypeScript
- Vite (Build Tool)
- Mantine UI (v7+) & Mantine Hooks
- `@mantine/form` & `zod` (Form Validation)
- `@mantine/notifications` (UI Feedback)
- `@mantine/modals` (Modals)
- Axios (API Requests)
- React Router DOM (v6+)
- `qrcode.react`, `html5-qrcode` (QR Functionality) _(Updated library)_
- `vite-plugin-mkcert` _(Added for HTTPS Dev)_

**Backend:**

- Node.js, Express, TypeScript
- Prisma (ORM)
- PostgreSQL (Database)
- JWT (Authentication) & bcryptjs (Hashing)
- dotenv (Environment Variables)
- node-cron (Scheduled Tasks - Tier Logic)
- uuid (Unique IDs)
- cors
- `ts-node`, `ts-node-dev` (Development Dependencies)

## Installation and Local Setup ⚙️

To get the project up and running in your development environment:

### Prerequisites

- Node.js (v18+ recommended)
- yarn (v1.x recommended)
- Accessible PostgreSQL database server running locally.

### Backend Setup

1.  Clone repo & `cd LoyalPyME/backend`
2.  `yarn install`
3.  Copy `backend/.env.example` to `backend/.env` (`cp .env.example .env`)
4.  **Configure `.env`:** Fill in your local `DATABASE_URL` details and generate a strong, random `JWT_SECRET`. **Do not commit `.env`**.
5.  Run migrations: `npx prisma migrate dev`
6.  Generate client: `npx prisma generate`
7.  **Initial Data:** Use **Option A (Seed)** `npx prisma db seed` (if `prisma/seed.ts` is implemented, using credentials like `admin@loyalpyme.test`/`password123` - **Confirm/Implement this!**) OR **Option B (Manual)** register via `/register-business` page after startup. _(Maintainer: Finalize and update this step)._
8.  (Optional) `npx ts-node scripts/hash-customer-password.ts` for specific test users.

### Frontend Setup

1.  Navigate to `frontend` folder (`cd ../frontend`)
2.  Install dependencies (including `vite-plugin-mkcert` if you added HTTPS):
    ```bash
    yarn install
    # If you haven't added mkcert yet:
    # yarn add -D vite-plugin-mkcert
    ```

## Running the Project ▶️

1.  Ensure your PostgreSQL server is **running**.
2.  **Start the Backend** (from `backend` folder):
    ```bash
    # Recommended (stable):
    yarn build && node dist/index.js
    # Alternative (unstable):
    # yarn dev
    ```
    _(Backend runs on port 3000 or as configured)_
3.  **Start the Frontend** (from `frontend` folder):
    ```bash
    # Use --host for network access and HTTPS (if configured in vite.config.ts)
    yarn dev --host
    ```
    _(Frontend runs on port 5173. Check terminal for `Network:` URL)_

Access the application via `https://localhost:5173` (on PC, accept security warning) or the `Network:` URL (on Mobile, accept security warning). Log in using credentials from the Initial Data step.

#### **Accessing from Mobile (Local Network)**

To test the frontend on a mobile device connected to the same WiFi/Hotspot as your PC:

1.  **Find PC's Local IP:** Use `ipconfig` (Win) or `ip addr show` / `ifconfig` (Mac/Linux). Find the IPv4 address of the active network connection (e.g., `192.168.X.Y`).
2.  **Ensure Servers Running:** Backend (`node dist/index.js`) and Frontend (`yarn dev --host`) must be running.
3.  **Check PC Firewall:** Allow incoming **TCP** connections on ports **5173** (Vite Frontend) and **3000** (Node Backend) for your **Private** network profile.
4.  **Check Vite Config:** Ensure `frontend/vite.config.ts` includes `server: { host: true, https: true, proxy: { ... } }` as configured previously.
5.  **Check Frontend Service URLs:** Ensure `axiosInstance` uses `baseURL: '/api'` and `businessService` uses `/public/...` (relative paths).
6.  **Access on Mobile:** Open browser on mobile and navigate to `https://<YOUR_PC_IP>:5173` (e.g., `https://192.168.X.Y:5173`). **Accept the browser's security warning** about the self-signed certificate. The application should now load and API calls should work via the Vite proxy.

---

## Contributions 🤝

Contributions welcome! Fork -> Branch -> Commit -> Push -> Pull Request.

## License 📜

Licensed under **AGPL-3.0**. See [`LICENSE`](LICENSE) file.

Copyright (c) 2024-2025 Olivier Hottelet

## Contact 📧

- **Olivier Hottelet**
- olivierhottelet1980@gmail.com
