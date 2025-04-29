# LoyalPyME 🇬🇧

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

_(Note: Screenshots might need updating)_

## Project Status & Roadmap 🗺️

Currently, the project has **completed Phase 1 (Core Functionality)**, including business/user management, authentication, tiers, rewards, points, QR codes (with functional mobile scanning), admin/customer dashboards, and comprehensive admin customer management (list, details, individual/bulk actions, filters).

Additionally, a **general code cleanup and refactoring** has been performed on both the frontend and backend to improve maintainability.

**Immediate Next Steps:**

1.  **(Technical - High Priority):** Implement **Automated Tests**.
2.  **(Functional - Phase 2):** Begin implementing **Internationalization (i18n)**.

For a more detailed roadmap, please refer to [`PROJECT_STATE_AND_ROADMAP.md`](PROJECT_STATE_AND_ROADMAP.md).

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
- `qrcode.react`, `html5-qrcode` (QR Functionality)
- `vite-plugin-mkcert` (For HTTPS Dev)

**Backend:**

- Node.js, Express, TypeScript
- Prisma (ORM)
- PostgreSQL (Database)
- JWT (Authentication) & bcryptjs (Hashing)
- dotenv (Environment Variables)
- node-cron (Scheduled Tasks - Tier Logic)
- uuid (Unique IDs)
- cors, `date-fns`
- `ts-node`, `ts-node-dev` (Development Dependencies - _Limited use due to instability_)

## Installation and Local Setup ⚙️

To get the project up and running in your development environment:

### Prerequisites

- Node.js (v18 or v20 recommended)
- yarn (v1.x recommended)
- Accessible PostgreSQL database server running locally.
- (Optional but recommended for managing Node versions) NVM or similar.

### Backend Setup

1.  Clone repo & `cd LoyalPyME/backend`
2.  `yarn install`
3.  Copy `backend/.env.example` to `backend/.env` (`cp .env.example .env`)
4.  **Configure `.env`:** Fill in your local `DATABASE_URL` details and generate a strong, random `JWT_SECRET`. **Do not commit `.env`**.
5.  Run migrations: `npx prisma migrate dev`
6.  Generate Prisma client: `npx prisma generate`
7.  **Initial Data (IMPORTANT):**
    - **Option A: Seed (Recommended if implemented):** Run `npx prisma db seed`. Check `prisma/seed.ts` for example credentials.
    - **Option B: Manual Registration:** If no seed exists, after starting the app, navigate to the `/register-business` route in the frontend and create your first business and admin user.
      _(Confirm which option applies to the current version)._
8.  (Optional) `npx ts-node scripts/hash-customer-password.ts` for specific test users (if needed).

### Frontend Setup

1.  Navigate to `frontend` folder (`cd ../frontend`)
2.  Install dependencies: `yarn install`

## Running the Project ▶️

1.  Ensure your PostgreSQL server is **running**.
2.  **Start the Backend** (from `backend/` folder):

    - **Stable Method (Recommended for Development & Production):**
      ```bash
      # Compile TS to JS
      yarn build
      # Run the compiled JS
      node dist/index.js
      ```
      _(You will need to repeat `yarn build && node dist/index.js` after each backend code change)._
    - **Hot-Reload Method (Development Only - Requires 2 Terminals):**

      ```bash
      # In Terminal 1 (compile and watch src/):
      npx tsc --watch

      # In Terminal 2 (run and watch dist/):
      npx nodemon dist/index.js
      ```

      _(This is the recommended method for active development as it automatically restarts the server when `.ts` files are saved)._

    - **`yarn dev` Method (CURRENTLY NOT RECOMMENDED):**
      Due to instabilities with `ts-node-dev`, the original `yarn dev` command does not work reliably in the current setup. Please use the two-terminal method.
      _(Backend runs on port 3000 or as configured in `.env`)_

3.  **Start the Frontend** (from `frontend/` folder):
    ```bash
    # Use --host for network access and HTTPS (requires mkcert setup)
    yarn dev --host
    ```
    _(Frontend runs on port 5173. Check the `Network:` URL in the console for access from other devices on the local network)._

Access via `https://localhost:5173` (on PC, accept security warning) or the `Network:` URL (on Mobile, accept security warning).

#### **Accessing from Mobile (Local Network)**

To test the frontend on a mobile device on the same network:

1.  **Find PC's Local IP:** Use `ipconfig` (Win) or `ip addr show` / `ifconfig` (Mac/Linux). (e.g., `192.168.X.Y`).
2.  **Ensure Servers Running:** Backend (using the **two-terminal** method or `node dist/index.js`) and Frontend (`yarn dev --host`).
3.  **Check PC Firewall:** Allow incoming **TCP** connections on ports **5173** (Vite) and **3000** (Backend) for your **Private** network profile.
4.  **Check Vite Config:** Ensure `frontend/vite.config.ts` includes `server: { host: true, https: true, proxy: { ... } }`.
5.  **Access on Mobile:** Open browser on mobile and navigate to `https://<YOUR_PC_IP>:5173`. **Accept the security warning**.

---

## Contributions 🤝

Contributions welcome! Fork -> Branch -> Commit -> Push -> Pull Request.

## License 📜

Licensed under **AGPL-3.0**. See [`LICENSE`](LICENSE) file.

Copyright (c) 2024-2025 Olivier Hottelet

## Contact 📧

- **Olivier Hottelet**
- olivierhottelet1980@gmail.com
