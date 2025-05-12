# LoyalPyME 🇬🇧

[![GitHub repo size](https://img.shields.io/github/repo-size/R3v180/LoyalPyME?style=flat-square)](https://github.com/R3v180/LoyalPyME)
[![GitHub contributors](https://img.shields.io/github/contributors/R3v180/LoyalPyME?style=flat-square)](https://github.com/R3v180/LoyalPyME/graphs/contributors)
[![GitHub last commit](https://img.shields.io/github/last-commit/R3v180/LoyalPyME?style=flat-square)](https://github.com/R3v180/LoyalPyME/commits/main)
[![GitHub issues](https://img.shields.io/github/issues/R3v180/LoyalPyME?style=flat-square)](https://github.com/R3v180/LoyalPyME/issues)
[![GitHub pull requests](https://img.shields.io/github/issues-pr/R3v180/LoyalPyME?style=flat-square)](https://github.com/R3v180/LoyalPyME/pulls)

---

🇬🇧 **You are reading the English version.** | 🇪🇸 [Leer en Español](README.es.md)

---

# LoyalPyME 🇬🇧 (v1.15.0)

**LoyalPyME** is a comprehensive and modular full-stack web platform (React Frontend + Node.js Backend) designed for Small and Medium-sized Enterprises (SMEs). The platform consists of different modules that can be activated per business:

- **LoyalPyME Core:** A robust system for managing digital customer loyalty programs (points, tiers, custom rewards, QR codes for earning, customer dashboard, etc.).
- **LoyalPyME Waiter (In Development):** An advanced module focused on digitizing and optimizing service operations in the hospitality sector. It will include features like a digital menu accessible via table QR codes, customer/waiter ordering, Kitchen/Bar Display System (KDS), table management, and a waiter interface.

The platform is engineered to be maintainable, scalable, and adaptable to the specific needs of each business.

## Vision and Purpose ✨

LoyalPyME aims to be the technological ally for SMEs, providing integrated digital tools to enhance their growth and efficiency.
With **LoyalPyME Core**, businesses can foster customer loyalty and recurrence, building stronger, lasting relationships.
With the upcoming **LoyalPyME Waiter** module, hospitality businesses will be able to modernize their operations, reduce errors, streamline service, significantly improve the end-customer experience, and gain valuable operational insights.
The platform is versatile, with applications in retail, various services (for LoyalPyME Core), and a strong focus on hospitality (for LoyalPyME Waiter).

_(See [PROJECT_STATUS.md](./PROJECT_STATUS.md) for detailed status, key design decisions, and completed milestones. For the roadmap and feature backlog, review [DEVELOPMENT_PLAN.md](./DEVELOPMENT_PLAN.md))._

|                                    Admin Dashboard (Desktop)                                    |                                       Admin Dashboard (Mobile)                                       |
| :---------------------------------------------------------------------------------------------: | :--------------------------------------------------------------------------------------------------: |
| <img src="images/SC_LoyalPyME.png" alt="LoyalPyME Admin Dashboard - Desktop View" width="100%"> | <img src="images/SC_LoyalPyME_PHONE.png" alt="LoyalPyME Admin Dashboard - Mobile View" width="100%"> |

_(Note: Screenshots might not reflect the latest features or the Super Admin panel interface. They will be updated progressively)._

## Key Implemented Features ✅

**Base Platform & Multi-Module Management:**

- **Super Admin Panel:** Interface for global administration of client businesses registered on the platform.
- **Module Management per Business:** Ability to activate or deactivate specific modules (like LoyalPyME Core or LoyalPyME Waiter) for each client business.
- **Module-Based Access Control:** Available functionality for each business administrator and their customers/employees depends on the modules active for their business.

**LoyalPyME Core (Loyalty Module - Functional):**

- **Full Authentication:** Business & Admin Registration, Customer Registration, Secure Login with JWT, Password Reset Functionality.
- **Customer Management (LCo Admin):** Advanced listing with search, filters, and sorting. Customer CRUD, including adding internal notes, manual points adjustment, tier changes, activation/deactivation, and favorites. Bulk actions on customers.
- **Tier & Benefit Management (LCo Admin):** Loyalty tier CRUD. Definition of specific benefits per tier. Global configuration of the tier system (calculation basis, downgrade policy, inactivity periods).
- **Reward Management (LCo Admin):** Full CRUD for point-redeemable rewards. Includes image upload and 1:1 cropping (Cloudinary) for each reward. Multi-language support (ES/EN) for reward names and descriptions.
- **Points & QR Flow (LCo):** Admin generation of unique QR codes for customers to earn points (associated with a sale amount and ticket number). QR validation by the End Customer via manual input or mobile camera scanning (using `html5-qrcode`).
- **Automatic Tier Logic (LCo):** Backend system (with Cron Job) that automatically calculates and updates customer tiers based on business configuration (spend, visits, points) and downgrade policies.
- **Customer Dashboard (LCo):** Multi-tab interface for the end customer:
  - **Summary:** Key info, points, current tier, progress bar to next tier (with benefit preview), summary of available gifts/rewards, and QR validation section.
  - **Rewards:** Full list of rewards available for point redemption and granted gifts, with images and redemption option.
  - **Activity:** Paginated history of all point transactions (earned, spent) and gift redemptions.
- **Other (Platform & LCo):**
  - Full frontend internationalization (i18n - ES/EN).
  - Backend API Documentation generated with Swagger and accessible via `/api-docs`.
  - Static logo and constrained header layout for consistent branding.

**LoyalPyME Waiter Module (In Development - Admin Menu Management UI Complete):**

- **Database:** Prisma models defined for Tables (with QR and status), Digital Menu (Categories, Items with i18n, price, image, allergens, tags, availability, etc.), Modifiers (Groups and Options with price adjustments), Orders (with status, items, optional customer/waiter), and Staff (with roles and PINs).
- **Backend API (Business Admin):** CRUD endpoints implemented for managing Menu Categories, Menu Items, and their Modifiers. These APIs are protected and only accessible if the Waiter module is active for the business.
- **Frontend UI (Business Admin - Menu Management):** Complete interface for managing digital menu categories (CRUD, reordering), menu items (CRUD with detailed fields, image upload/crop), modifier groups associated with items (CRUD), and modifier options within groups (CRUD).

## Project Status & Roadmap 🗺️

The project has completed **Phase 1 (LCo Core Functionality)**, the **base implementation of the multi-module architecture and Super Admin Panel**, and a significant part of **Phase 3 (LoyalPyME Waiter Module - Admin Menu Management)**. Current version: **v1.15.0**.

- The primary development focus for the Waiter Module will now shift towards:
  1.  Customer-facing Digital Menu display.
  2.  Customer Ordering Flow.
  3.  Kitchen Display System (KDS).
- See **[PROJECT_STATUS.md](./PROJECT_STATUS.md)** for **detailed completed milestones** and **key design decisions**.
- See **[DEVELOPMENT_PLAN.md](./DEVELOPMENT_PLAN.md)** for the **full backlog** of pending tasks, the detailed roadmap for the Waiter Module, and **future ideas**.

## Used Technologies 🛠️

**Frontend:** React, TypeScript, Vite, Mantine UI (v7+), Axios, React Router DOM (v6+), `html5-qrcode`, `react-image-crop`, `i18next` (for i18n), Zustand (or similar, considered for advanced global state management if needed).
**Backend:** Node.js, Express, TypeScript, Prisma ORM, PostgreSQL, JSON Web Tokens (JWT), bcryptjs (for hashing), Cloudinary (image storage), Multer (upload handling), Vitest (unit/integration testing), Supertest (API testing), Swagger (API documentation), `node-cron` (scheduled tasks).

_(A more detailed and continuously updated list can be found in [PROJECT_STATUS.md](./PROJECT_STATUS.md))._

## Quick Start (Local Development) 🚀

1.  Clone the repository.
2.  **Backend:**
    - `cd backend && yarn install`
    - Configure the `.env` file completely (copy from `.env.example` and fill in).
    - `npx prisma migrate reset` (This will delete and recreate the database).
    - `npx prisma db seed` (This will populate the database with a demo business, admin, customer, and sample LCo/LC data).
    - `npx ts-node ./scripts/create-superadmin.ts` (This will create the global Super Admin user).
    - Run in two terminals:
      1.  `yarn dev:build` (or `npx tsc --watch`)
      2.  `yarn dev:run` (or `npx nodemon dist/index.js`)
3.  **Frontend:**
    - `cd ../frontend && yarn install`
    - Run: `yarn dev` (or `yarn dev --host` for local network access).
4.  **Accessing the Applications:**
    - **Customer / Business Admin App:** `https://localhost:5173`
      - Demo Business Login (LCo & LC): `admin@demo.com` / `password`
      - Demo Customer Login (LCo): `cliente@demo.com` / `password`
    - **Super Admin Panel:** `https://localhost:5173/superadmin`
      - Login: `superadmin@loyalpyme.com` / `superadminpassword` (or credentials configured in the script).
    - **API Documentation:** `http://localhost:3000/api-docs`

**Important!** Refer to the **[SETUP_GUIDE.md](./SETUP_GUIDE.md)** for **complete and detailed** installation, configuration, and running instructions. For common issues, check the [TROUBLESHOOTING_GUIDE.md](./TROUBLESHOOTING_GUIDE.md).

---

## Contributions 🤝

While this project is now transitioning to proprietary software, bug reports or suggestions can still be made via GitHub Issues. Code contributions will be considered on a case-by-case basis and would require a Contributor License Agreement (CLA).

## License 📜

This project is proprietary software.
Copyright (c) 2024-2025 Olivier Hottelet. All rights reserved.

Refer to the [LICENSE.md](./LICENSE.md) file in the root directory for more details.

## Contact 📧

- **Olivier Hottelet**
- olivierhottelet1980@gmail.com
