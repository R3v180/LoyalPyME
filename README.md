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

![Screenshot of the LoyalPyME Admin Dashboard](images/SC_LoyalPyME.png)
_(Note: Screenshot might need updating to reflect the latest UI)_

## Project Status & Roadmap 🗺️

LoyalPyME's development follows a phased approach, ensuring a solid foundation before expanding functionality.

---

### ✅ Phase 1: Operational Core & Refactoring (Completed)

The foundational phase, focused on building the core loyalty engine and undertaking significant refactoring for maintainability and scalability, is complete.

**Key Achievements:**

- **Full-Stack Platform:** Operational Frontend (React/TS/Mantine) and Backend (Node/Express/TS/Prisma/PostgreSQL).
- **Major Refactoring:** Successfully refactored both frontend (hooks, components) and backend (services, controllers per module) for improved structure and separation of concerns.
- **Secure Authentication:** JWT-based system with registration (Admin/Customer), login, password recovery, and role-based access control (`BUSINESS_ADMIN`, `CUSTOMER_FINAL`).
- **Tier System (Backend Complete):** Admin CRUD for Tiers, business-level configuration, automated tier calculation based on metrics (spend, visits, points), and a CRON job for periodic updates/downgrades.
- **Reward Management:** Full Admin CRUD (Create, Read, Update, Delete, Toggle Active) for rewards.
- **Core Points Flow:**
  - Admin QR Code Generation (FE+BE).
  - Customer QR Code Validation (FE+BE) triggering point assignment, metric updates, and tier logic updates.
- **User Panels:**
  - **Customer Dashboard:** View points, current tier level & name; view available rewards & assigned gifts; redeem rewards (points) and gifts.
  - **Admin Panel:** Basic layout (Header, Sidebar), simple Overview page.
- **Admin Customer Management:**
  - Paginated and sortable customer list.
  - Basic search (name/email).
  - **Individual Actions:** View Details (incl. notes), Edit Admin Notes, Adjust Points, Change Tier (manual), Mark/Unmark Favorite, Activate/Deactivate, Assign Reward as Gift.
  - **Bulk Actions:** Multi-select, Bulk Activate/Deactivate, Bulk Delete (with confirmation), Bulk Adjust Points (via modal).

---

### ⏳ Phase 1: Polishing & Enhancements (Current Focus / Pending)

This phase focuses on refining the existing core functionality and addressing key improvements identified.

- **Customer Admin Functionality:**
  - Implement comprehensive **Filtering UI & Backend Logic** (by Active status, Favorite status, Tier).
  - **Optimize/Enhance Search & Pagination** (Analyze/improve DB performance, enhance UI/UX).
- 💡 **Customer Experience Enhancements (Frontend):**
  - Display **Progress Towards Next Tier** (visual/numeric).
  - Clearly list **Benefits for Current & Next Tier**.
  - (Optional) Add basic **Activity History** (points gained/spent).
  - (Optional) Refine UI for Reward/Gift cards for better clarity.
- 💡 **Backend Enhancements:**
  - Strengthen API **Input Validation** (Controllers/Middleware).
  - Implement more **Specific HTTP Error Codes** (404, 409, etc.).
  - Review critical **Database Transactions** for atomicity.
  - Add proactive **Database Indexing**.
  - Ensure consistent use of Prisma `select` for **Query Optimization**.
  - Enhance **Logging** (structured, contextual).
  - Improve **Configuration Management** (`.env` validation).
  - (Optional) Implement basic **Rate Limiting**.
  - (Optional) Introduce basic **Audit Logging**.
- 💡 **Admin Experience Enhancements (Frontend):**
  - Enrich **Admin Dashboard** (Key Metrics, Activity Feed).
  - Implement advanced **Customer Search/Filtering** (Phone, Document, Tier).
  - Improve **Customer Details Modal** (e.g., inline actions).
  - Add basic **CSV Export** for customer list.
  - Display **Reward/Tier Usage Statistics**.
  - Add descriptive help/tooltips on the **Tier Settings Page**.
  - Ensure consistent **Notifications & Loading States**.
  - Use **Confirmation Modals** for critical/destructive actions.
- **Quality & Maintenance:**
  - Perform **General Code Cleanup** (remove dead code, TODOs, `console.log`; centralize types).
  - **Introduce Automated Testing:** Start implementing Unit, Integration, and E2E tests (**High Priority** for stability).
  - ⚙️ Resolve persistent issue with `yarn dev` (`ts-node-dev`).

---

### 🚀 Future Roadmap (Evolution Plan)

_(High-level, subject to refinement)_

- **Phase 2 (Functional Expansion - Post-Phase 1):**
  - Advanced Loyalty Rules (e.g., discounts, more reward types).
  - Basic Web Communication Tools (e.g., segmented emails, portal announcements).
  - Advanced Customer Segmentation & Lightweight CRM features.
  - Backend Audit Log implementation.
- **Phase 3 (Mobile App & Advanced Analytics):**
  - Native Mobile App for Customers (view status, scan QR, redeem, notifications). Potential Admin companion app.
  - Enhanced CRM functionalities and Advanced Analytics/Reporting.
- **Phase 4 (Ecosystems & Social Potential - Long Term):**
  - Shared Loyalty Programs / Cross-Business Redemptions.
  - Social Features (sector-specific: activity maps, events, chat).

---

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
- `qrcode.react`, `react-qr-reader` (QR Functionality)

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

- Node.js (v18+ recommended, check project specifics)
- yarn (v1.x recommended, check project specifics)
- Accessible PostgreSQL database server running locally.

### Backend Setup

1.  Clone the repository and navigate to the `backend` folder:
    ```bash
    git clone [https://github.com/R3v180/LoyalPyME.git](https://github.com/R3v180/LoyalPyME.git)
    cd LoyalPyME/backend
    ```
2.  Install dependencies:
    ```bash
    yarn install
    ```
3.  **Create your local environment file:** Locate the `backend/.env.example` file provided in the repository. Copy it to a new file named `backend/.env`:
    ```bash
    cp .env.example .env
    ```
    _(See `backend/.env.example` for variable details and examples)._
4.  **Configure your `.env` file:** Open the newly created `backend/.env` file and:
    - Replace the `DATABASE_URL` placeholders (`DB_USER`, `DB_PASSWORD`, `DB_HOST`, `DB_PORT`, `DB_NAME`) with your **actual local PostgreSQL connection details**. _(Example: `postgresql://postgres:YOUR_DB_PASSWORD@localhost:5432/loyalpymedb?schema=public` - Adjust user/password/db name with your local details!)_
    - Replace the `JWT_SECRET` placeholder with a **strong, unique, random string** (at least 32 characters long). You can generate one using `openssl rand -hex 32` in your terminal or a reliable online generator. **Do not use the placeholder value!**
    - Optionally, set the `PORT` if you need the backend to run on a port other than 3000.
    - **Important:** Ensure your `.env` file is listed in your root `.gitignore` file to prevent accidentally committing secrets.
5.  **Set up the database schema:** Run Prisma migrations:
    ```bash
    npx prisma migrate dev
    ```
    _(This will create the database if it doesn't exist and apply all schema changes.)_
6.  **Generate Prisma Client:** (Usually done by `migrate dev`, but safe to run explicitly)
    ```bash
    npx prisma generate
    ```
7.  **Initial Data & Test Credentials (IMPORTANT - Action Required):**
    To log in and test the application, you need initial data like a business and an admin user. The preferred method needs to be finalized for this project. **Choose ONE option below and follow its steps:**

    - **[ ] Option A: Database Seeding (Recommended - Needs Setup/Confirmation)**

      - Run the seed command: `npx prisma db seed`
      - This command _should_ populate the database with essential initial data (e.g., a default business, an admin user, potentially default tiers).
      - **Test Credentials (Example - Confirm/Change in `prisma/seed.ts`!):** `admin@loyalpyme.test` / `password123`
      - _(Note: This requires a functional `prisma/seed.ts` script. If it doesn't exist or work, use Option B)._

    - **[ ] Option B: Manual Registration (If no seed script)**
      - After starting both backend and frontend (see "Running the Project"), open your browser to `http://localhost:5173/register-business`.
      - Use the form to register your first business and administrator account. Use these credentials to log in.

    _(Project Maintainer: Please confirm the intended setup flow (A or B), implement the seed script if choosing A, update the example credentials, and remove the non-applicable option from these instructions.)_

8.  **(Optional) Specific Test Customer Setup:**
    - For specific scenarios requiring a pre-defined customer, you might need to create one manually in your database (using pgAdmin or similar) and then use the provided script to hash their password:
      ```bash
      # Edit 'scripts/hash-customer-password.ts' with the correct email/password first!
      npx ts-node scripts/hash-customer-password.ts
      ```

### Frontend Setup

1.  Navigate to the `frontend` folder (from the project root):
    ```bash
    cd frontend
    ```
    _(If you were in `backend`, use `cd ../frontend`)_
2.  Install dependencies:
    ```bash
    yarn install
    ```

## Running the Project ▶️

1.  Ensure your PostgreSQL server is **running**.
2.  **Start the backend** (from the `backend` folder):

    ```bash
    # Recommended (stable, reflects production build):
    yarn build && node dist/index.js

    # Alternative for development (currently may have issues):
    # yarn dev
    ```

    _Note: `yarn dev` might not work reliably due to issues with `ts-node-dev`. Using `build && start` is the current stable method._
    Backend runs on `http://localhost:3000` (or the `PORT` specified in `.env`).

3.  **Start the frontend** (from the `frontend` folder, in a separate terminal):
    ```bash
    yarn dev
    ```
    Frontend runs on `http://localhost:5173`.

Access the application via `http://localhost:5173` in your browser. Log in using the credentials created or provided during the "Initial Data & Test Credentials" step.

## Contributions 🤝

Contributions are welcome! Please follow standard fork, branch, commit, and Pull Request procedures. Detail your changes clearly in the PR description.

1.  Fork the repository.
2.  Create a feature/fix branch.
3.  Commit your changes.
4.  Push to your fork.
5.  Open a Pull Request to the `main` branch of this repository.

## License 📜

This project is licensed under the **GNU Affero General Public License v3.0 (AGPL-3.0)**.

See the [`LICENSE`](LICENSE) file for details. The AGPL v3 promotes collaboration by requiring network-accessible modifications to also be open source.

Copyright (c) 2024-2025 Olivier Hottelet

## Contact 📧

- **Olivier Hottelet**
- olivierhottelet1980@gmail.com
