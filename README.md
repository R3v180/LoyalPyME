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

<div style="display: flex; justify-content: center; align-items: flex-start; gap: 15px;">
  <img src="images/SC_LoyalPyME.png" alt="LoyalPyME Admin Dashboard - Desktop View" style="width: 55%; max-width: 450px; height: auto;">
  <img src="images/SC_LoyalPyME_PHONE.png" alt="LoyalPyME Admin Dashboard - Mobile View" style="width: 35%; max-width: 220px; height: auto;">
</div>
_(Note: Screenshot might need updating to reflect the latest UI)_

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
- Vite
- Mantine UI (v7+) & Mantine Hooks
- `@mantine/form` & `zod` (for form validation)
- `@mantine/notifications` (for UI feedback)
- `@mantine/modals` (for confirmation/input modals)
- Axios (for API requests)
- React Router DOM (v6+)
- `qrcode.react`, `react-qr-reader` (for QR code functionality)

**Backend:**

- Node.js, Express, TypeScript
- Prisma (ORM), PostgreSQL (Database)
- JWT (for authentication) & bcryptjs (for hashing)
- dotenv (for environment variables)
- node-cron (for scheduled tasks)
- uuid (for unique IDs)
- cors
- `ts-node`, `ts-node-dev` (installed for development)

## Installation and Local Setup ⚙️

To get the project up and running in your development environment:

### Prerequisites

- Node.js (v18+ recommended, check project specifics)
- yarn (v1.x recommended, check project specifics)
- Accessible PostgreSQL database server

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
3.  Create a `.env` file in the `backend/` root with:
    ```env
    DATABASE_URL="postgresql://your_user:your_password@host:port/your_db?schema=public"
    JWT_SECRET="your_strong_random_jwt_secret_here"
    # PORT=3000 (Optional, defaults to 3000)
    ```
4.  Run Prisma migrations:
    ```bash
    npx prisma migrate dev
    ```
5.  Generate Prisma Client:
    ```bash
    npx prisma generate
    ```
6.  (Optional) Hash password for a test customer:
    ```bash
    # Edit the script first if needed!
    npx ts-node scripts/hash-customer-password.ts
    ```

### Frontend Setup

1.  Navigate to the `frontend` folder:
    ```bash
    cd ../frontend
    ```
2.  Install dependencies:
    ```bash
    yarn install
    ```

## Running the Project ▶️

1.  Ensure your PostgreSQL server is running.
2.  **Start the backend** (from `backend` folder):

    ```bash
    # Recommended (stable):
    yarn build && node dist/index.js

    # Alternative (currently unstable due to ts-node issues):
    # yarn dev
    ```

    Backend runs on `http://localhost:3000` (or configured port).

3.  **Start the frontend** (from `frontend` folder):
    ```bash
    yarn dev
    ```
    Frontend runs on `http://localhost:5173`.

Access the application via `http://localhost:5173`.

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
