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

Currently, the project has **completed Phase 1 (Core Functionality and Polishing)**, including business/user management, authentication, tiers, rewards, points, QR codes (with functional mobile scanning), admin/customer dashboards, and comprehensive admin customer management (CRUD, filters, bulk actions).
A **general code cleanup and refactoring** has also been performed.
Frontend **Internationalization (i18n) has been completed**, supporting Spanish and English with a language switcher.
**Backend Automated Testing has been initiated** (setup and initial unit/integration tests).

**Next Steps:**

1.  **(Technical):** Continue expanding **Automated Test** coverage (Backend and Frontend).
2.  **(Functional - Phase 2):** Begin implementing the next expansion features (e.g., Advanced Loyalty, Basic Communication).

For a more detailed roadmap, please refer to [`PROJECT_STATE_AND_ROADMAP.md`](PROJECT_STATE_AND_ROADMAP.md).

---

## API Documentation 📖

The backend API is documented using the OpenAPI 3.0 standard. While the backend server is running (see "Running the Project" below), you can access the interactive **Swagger UI** documentation at:

**`/api-docs`**

For example, if the backend is running locally on port 3000, the documentation URL would be `http://localhost:3000/api-docs`.

This interface allows you to:

- Explore all available API endpoints.
- View details about request parameters, request bodies, and response schemas.
- Test the API endpoints directly from your browser (authentication might be required for protected routes).

---

## Used Technologies 🛠️

**Frontend:**

- React & TypeScript
- Vite (Build Tool)
- Mantine UI (v7+) & Mantine Hooks
- `@mantine/form` & `zod` (Form Validation)
- `@mantine/notifications` & `@mantine/modals`
- Axios (API Requests)
- React Router DOM (v6+)
- `qrcode.react`, `html5-qrcode` (QR Functionality)
- `i18next`, `react-i18next` (Internationalization)
- `i18next-http-backend`, `i18next-browser-languagedetector`
- `react-country-flag` (Language Switcher)
- `vite-plugin-mkcert` (For HTTPS Dev)

**Backend:**

- Node.js, Express, TypeScript
- Prisma (ORM) & PostgreSQL (Database)
- JWT (Authentication) & bcryptjs (Hashing)
- dotenv (Environment Variables)
- node-cron (Scheduled Tasks)
- uuid (Unique IDs)
- cors, `date-fns`
- `vitest`, `supertest` (Testing)
- `swagger-jsdoc`, `swagger-ui-express` (API Documentation)

## Installation and Local Setup ⚙️

To get the project up and running in your development environment:

### Prerequisites

- Node.js (v18 or v20 recommended)
- yarn (v1.x recommended)
- Accessible PostgreSQL database server running locally.
- (Optional) NVM or similar.

### Backend Setup

1.  Clone repo & `cd LoyalPyME/backend`
2.  `yarn install`
3.  Copy `backend/.env.example` to `backend/.env`
4.  **Configure `.env`:** Fill in `DATABASE_URL` and `JWT_SECRET`.
5.  Run migrations: `npx prisma migrate dev`
6.  Generate Prisma client: **`npx prisma generate`** (Important!)
7.  **Initial Data:** Choose **Option A (Seed):** `npx prisma db seed` (if implemented) OR **Option B (Manual):** Register via `/register-business` frontend route.

### Frontend Setup

1.  Navigate to `frontend` folder (`cd ../frontend`)
2.  Install dependencies: `yarn install`

## Running the Project ▶️

1.  Ensure your PostgreSQL server is **running**.
2.  **Start the Backend** (from `backend/` folder):

    - **Recommended Method (Development with Hot-Reload - Requires 2 Terminals):**
      ```bash
      # Terminal 1: Continuous compilation
      npx tsc --watch
      # Terminal 2: Execution and auto-restart
      npx nodemon dist/index.js
      ```
    - **Alternative Method (Stable, No Hot-Reload):**
      ```bash
      yarn build && node dist/index.js
      # (Repeat after each change)
      ```
    - **`yarn dev` Method (NOT RECOMMENDED):** Unstable in the current environment.
    - _(Backend runs on port 3000 or as configured)_

3.  **Start the Frontend** (from `frontend/` folder):
    ```bash
    # Use --host for network access and HTTPS
    yarn dev --host
    ```
    _(Frontend runs on port 5173)_

Access via `https://localhost:5173` (PC) or the network URL (Mobile). Remember the **API documentation** is available at `/api-docs` on the backend server URL (e.g., `http://localhost:3000/api-docs`).

#### **Accessing from Mobile (Local Network)**

1.  Find PC's Local IP (`ipconfig` / `ifconfig`).
2.  Ensure Servers Running (Backend and Frontend).
3.  Check PC Firewall (Allow incoming TCP on 5173 and 3000 for Private network).
4.  Check Vite Config (`server: { host: true, https: true, proxy: { ... } }`).
5.  Access on Mobile: `https://<YOUR_PC_IP>:5173`. Accept security warning.

---

## Contributions 🤝

Contributions welcome! Fork -> Branch -> Commit -> Push -> Pull Request.

## License 📜

Licensed under **AGPL-3.0**. See [`LICENSE`](LICENSE) file.
Copyright (c) 2024-2025 Olivier Hottelet

## Contact 📧

- **Olivier Hottelet**
- olivierhottelet1980@gmail.com
