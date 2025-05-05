# LoyalPyME 🇬🇧

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg?style=flat-square)](https://opensource.org/licenses/MIT)
[![GitHub repo size](https://img.shields.io/github/repo-size/R3v180/LoyalPyME?style=flat-square)](https://github.com/R3v180/LoyalPyME)
[![GitHub contributors](https://img.shields.io/github/contributors/R3v180/LoyalPyME?style=flat-square)](https://github.com/R3v180/LoyalPyME/graphs/contributors)
[![GitHub last commit](https://img.shields.io/github/last-commit/R3v180/LoyalPyME?style=flat-square)](https://github.com/R3v180/LoyalPyME/commits/main)
[![GitHub issues](https://img.shields.io/github/issues/R3v180/LoyalPyME?style=flat-square)](https://github.com/R3v180/LoyalPyME/issues)
[![GitHub pull requests](https://img.shields.io/github/issues-pr/R3v180/LoyalPyME?style=flat-square)](https://github.com/R3v180/LoyalPyME/pulls)

---

🇬🇧 **You are reading the English version.** | 🇪🇸 [Leer en Español](README.es.md)

---

# LoyalPyME 🇬🇧 (v1.12.0)

**LoyalPyME** is a comprehensive, full-stack web platform (React Frontend + Node.js Backend) designed to empower Small and Medium-sized Enterprises (SMEs) with a robust, maintainable, and scalable digital customer loyalty program.

## Vision and Purpose ✨

LoyalPyME aims to be the technological ally for SMEs, providing integrated digital tools to foster repeat business, build stronger customer relationships, and enhance the end-customer experience, adaptable across various sectors (hospitality, retail, services).

_(See [PROJECT_STATUS.md](./PROJECT_STATUS.md) for key design decisions and [DEVELOPMENT_PLAN.md](./DEVELOPMENT_PLAN.md) for the long-term vision)._

|                                    Admin Dashboard (Desktop)                                    |                                       Admin Dashboard (Mobile)                                       |
| :---------------------------------------------------------------------------------------------: | :--------------------------------------------------------------------------------------------------: |
| <img src="images/SC_LoyalPyME.png" alt="LoyalPyME Admin Dashboard - Desktop View" width="100%"> | <img src="images/SC_LoyalPyME_PHONE.png" alt="LoyalPyME Admin Dashboard - Mobile View" width="100%"> |

_(Note: Screenshots might need updating)._

## Key Implemented Features ✅

- **Full Authentication:** Business/Admin Registration, Customer Registration, Login (JWT), Password Reset.
- **Customer Management (Admin):** CRUD, Filters, Search, Sorting, Individual/Bulk Actions, Notes.
- **Tier & Benefit Management (Admin):** Tier CRUD, Benefit CRUD per Tier, Global Tier System Settings.
- **Reward Management (Admin):** Reward CRUD (Points-based), Image Upload (from file), 1:1 Image Cropping, Cloudinary Storage, **Multi-language support (ES/EN)** for name/description.
- **Points & QR Flow:** QR Code Generation (Admin), QR Validation (Customer - Manual or Mobile Scanner via `html5-qrcode`, with graceful error handling).
- **Automatic Tier Logic:** Tier Calculation/Assignment/Downgrade based on business settings (Backend + Cron Job).
- **Customer Dashboard:** Tab-based Interface (Summary, Rewards, Activity), User Info Display (Points, Tier, Benefits), Progress Bar (with Next Tier Preview triggered by hover/icon click), Reward/Gift List (with images), Points/Gift Redemption (from Summary & Rewards tabs), Functional QR Scanner.
- **Customer Activity History:** Paginated timeline view of points earned, rewards redeemed, and gifts redeemed.
- **Other:** Frontend Internationalization (i18n - ES/EN), API Documentation (Swagger), Static Logo, Constrained Header Layout.

## Project Status & Roadmap 🗺️

The project has completed **Phase 1 (Core Functionality)** and is **significantly progressing through Phase 2 (Initial Features & Enhancements)** - Current version: **v1.12.0**.

- See **[PROJECT_STATUS.md](./PROJECT_STATUS.md)** for **detailed completed milestones** and **immediate next steps**.
- See **[DEVELOPMENT_PLAN.md](./DEVELOPMENT_PLAN.md)** for the **full backlog** of pending tasks and detailed **future ideas**.

## Used Technologies 🛠️

**Frontend:** React, TypeScript, Vite, Mantine UI (v7+), Axios, React Router DOM (v6+), `html5-qrcode`, `react-image-crop`, `i18next`...
**Backend:** Node.js, Express, TypeScript, Prisma, PostgreSQL, JWT, bcryptjs, Cloudinary, Multer, Vitest, Supertest, Swagger...

_(Detailed list in [PROJECT_STATUS.md](./PROJECT_STATUS.md))_

## Quick Start (Local Development) 🚀

1.  Clone repository.
2.  **Backend:** `cd backend && yarn install`, configure `.env` completely, `npx prisma migrate dev`, `npx prisma generate`, (optional `db seed` or register admin via app), run with `npx tsc --watch` & `npx nodemon dist/index.js`.
3.  **Frontend:** `cd ../frontend && yarn install`, run with `yarn dev --host`.
4.  Access: `https://localhost:5173`.

**Important!** Refer to the **[SETUP_GUIDE.md](./SETUP_GUIDE.md)** for the **complete, detailed** installation, configuration, running, and mobile access instructions. For common issues, check the [TROUBLESHOOTING_GUIDE.md](./TROUBLESHOOTING_GUIDE.md).

---

## Contributions 🤝

Contributions welcome! Standard flow: Fork -> Branch -> Commit -> Push -> Pull Request. Check [DEVELOPMENT_PLAN.md](./DEVELOPMENT_PLAN.md) for pending tasks or to propose new ideas.

## License 📜

Licensed under **MIT**. See [`LICENSE`](./LICENSE) file.
Copyright (c) 2024-2025 Olivier Hottelet

## Contact 📧

- **Olivier Hottelet**
- olivierhottelet1980@gmail.com
