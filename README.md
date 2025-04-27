# LoyalPyME

[![GitHub repo size](https://img.shields.io/github/repo-size/R3v180/LoyalPyME?style=flat-square)](https://github.com/R3v180/LoyalPyME)
[![GitHub contributors](https://img.shields.io/github/contributors/R3v180/LoyalPyME?style=flat-square)](https://github.com/R3v180/LoyalPyME/graphs/contributors)
[![GitHub last commit](https://img.shields.io/github/last-commit/R3v180/LoyalPyME?style=flat-square)](https://github.com/R3v180/LoyalPyME/commits/main)
[![GitHub issues](https://img.shields.io/github/issues/R3v180/LoyalPyME?style=flat-square)](https://github.com/R3v180/LoyalPyME/issues)
[![GitHub pull requests](https://img.shields.io/github/issues-pr/R3v180/LoyalPyME?style=flat-square)](https://github.com/R3v180/LoyalPyME/pulls)
[![License: AGPL v3](https://img.shields.io/badge/License-AGPL%20v3-blue.svg?style=flat-square)](https://www.gnu.org/licenses/agpl-3.0)

---

🇬🇧 **You are reading the English version.** | 🇪🇸 [Leer en Español](README.es.md) ---

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

---

---

---

# LoyalPyME 🇪🇸

**LoyalPyME** es una plataforma web integral diseñada para empoderar a Pequeñas y Medianas Empresas (PyMEs) con un programa de fidelización de clientes digital, potente y fácil de gestionar.

## Visión y Propósito

En un mercado competitivo, la lealtad del cliente es un activo invaluable. LoyalPyME nace para proporcionar a las PyMEs las herramientas necesarias para:

- **Fomentar la Repetición de Compra:** Implementando sistemas de puntos, niveles y recompensas atractivas.
- **Construir Relaciones Sólidas:** Reconociendo y premiando la lealtad de sus clientes.
- **Simplificar la Gestión:** Ofreciendo un panel de administración intuitivo y eficiente.
- **Mejorar la Experiencia del Cliente:** Proporcionando un portal digital accesible y transparente.

Nuestro objetivo es ser el aliado tecnológico que permita a cualquier PyME, independientemente de su sector (retail, hostelería, servicios, etc.), digitalizar y optimizar su estrategia de retención de clientes, sentando las bases para el crecimiento a largo plazo.

![Captura del Dashboard de Administración de LoyalPyME](images/SC_LoyalPyME.png)

## Fases de Evolución Funcional

El desarrollo de LoyalPyME sigue una hoja de ruta por fases, priorizando la entrega de un núcleo de fidelización funcional y escalando hacia capacidades avanzadas y comunitarias.

**Fase 1: Núcleo de Fidelización Web (Operativa y Casi Completa)**

- **Gestión de Recompensas:** Creación, edición, eliminación y gestión del estado (activo/inactivo). **(Funcional)**
- **Sistema de Puntos Transaccional:** Generación QR para asignación de puntos. **(Funcional)** Validación QR por cliente para sumar puntos. **(Funcional)**
- **Sistema de Niveles (Tiers):** Definición, gestión de beneficios, configuración global (backend). **(Funcional)**
- **Panel Cliente Esencial:** Visualización perfil (puntos, nivel), visualización recompensas/regalos, canjeo de ambos. **(Funcional)**
- **Gestión de Clientes (Admin):**

  - Listado de clientes con datos clave (puntos, nivel, etc.), ordenación. **(Funcional)**

  * Búsqueda básica por nombre/email. **(Funcional)**
  * Paginación (Lógica básica BE/FE presente). **(Funcional)**
  * Acciones Individuales: Ajuste Puntos, Cambio Nivel, Asignar Regalo, Favorito, Activar/Desactivar. **(Funcional)**
  * Modal Ver Detalles: Muestra información detallada y notas de admin. **(Funcional)**
  * Notas Admin: Funcionalidad completa Ver/Editar/Guardar. **(Funcional)**
  * Acciones Masivas: Selección múltiple, Activar/Desactivar, Eliminar (con confirmación), Ajustar Puntos (con modal input). **(Funcional)**

- **_Tareas Restantes para Fase 1:_**
  - Implementar **Filtros Completos** en Gestión Clientes Admin (UI + conexión BE para filtrar por Estado Activo, Favorito, etc.).
  - **Optimizar/Mejorar Búsqueda y Paginación** (Revisar rendimiento backend, mejorar UI paginación si es necesario).
  - **Limpieza General** (Revisar TODOs, eliminar logs de depuración, centralizar tipos, revisar consistencia).

**Fases Futuras (Hacia un Ecosistema Completo):**

- **Fase 2 (Expansión Web):** Reglas de puntos y recompensas más complejas, herramientas básicas de comunicación directa (email, publicaciones en portal), segmentación avanzada de clientes, potencialmente otras acciones masivas.
- **Fase 3 (Plataforma Móvil):** Aplicaciones nativas para clientes y personal, notificaciones push, check-in basado en ubicación, tarjeta de fidelización digital en la app.
- **Fase 4 (Inteligencia y CRM Ligero):** Módulos de análisis e informes sobre comportamiento y valor del cliente, funcionalidades de CRM ligero (historial completo más allá de notas?), automatización de marketing.
- **Fase 5 (Ecosistemas Conectados y Potencial Social):** Programas de fidelización compartidos entre grupos de negocios, módulo de eventos, chat Cliente-Negocio y potencial chat comunitario/social, expansión a otros sectores y geografías.

## Tecnologías Utilizadas

**Frontend:**

- React & TypeScript
- Vite
- Mantine UI (v7+) & Mantine Hooks
- `@mantine/form` & `zod` (para validación)
- `@mantine/notifications` (para feedback UI)
- `@mantine/modals` (para modales confirmación/input)
- Axios (para peticiones API)
- React Router DOM (v6+)
- qrcode.react, react-qr-reader (para QR)

**Backend:**

- Node.js, Express, TypeScript
- Prisma (ORM), PostgreSQL (Base de Datos)
- JWT (para autenticación) & bcryptjs (para hashing)
- dotenv (para variables entorno)
- node-cron (para tareas programadas)
- uuid (para IDs únicos)
- cors
- `ts-node`, `ts-node-dev` (instalados para desarrollo)

## Instalación y Configuración Local

Para poner el proyecto en marcha en tu entorno de desarrollo:

### Prerrequisitos

- Node.js (v18+ recomendado, usando v20.9.0)
- yarn (v1.22.19 usada)
- Servidor de base de datos PostgreSQL accesible

### Configuración del Backend

1.  Clona repo y `cd LoyalPyME/backend`
2.  `yarn install`
3.  Crea `.env` con `DATABASE_URL`, `JWT_SECRET`
4.  `npx prisma migrate dev`
5.  `npx prisma generate` (si es necesario)
6.  (Opcional) `npx ts-node scripts/hash-customer-password.ts` (editar antes)

### Configuración del Frontend

1.  `cd ../frontend`
2.  `yarn install`

## Ejecutar el Proyecto

1.  Asegúrate de que PostgreSQL está corriendo.
2.  **Inicia el backend** desde `backend` (en una terminal):

    ```bash
    # Método recomendado (estable):
    yarn build && node dist/index.js

    # Alternativa (actualmente inestable por problemas con ts-node):
    # yarn dev
    ```

    El backend se ejecutará en `http://localhost:3000`.

3.  **Inicia el frontend** desde `frontend` (en otra terminal):
    ```bash
    yarn dev
    ```
    El frontend se ejecutará en `http://localhost:5173`.

Accede a `http://localhost:5173`.

## Contribuciones

¡Damos la bienvenida y animamos a las contribuciones a LoyalPyME! Si encuentras un error, tienes una idea para una nueva funcionalidad o quieres mejorar el código, por favor:

1.  Haz un fork de este repositorio.
2.  Clona tu fork localmente.
3.  Crea una nueva rama para tu trabajo (`git checkout -b feature/nombre-funcionalidad` o `fix/descripcion-bug`).
4.  Realiza tus cambios y asegúrate de que pasen las comprobaciones de linting (si hay).
5.  Escribe mensajes de commit claros y descriptivos.
6.  Empuja tu rama a tu fork en GitHub.
7.  Abre una Pull Request (PR) desde tu rama hacia la rama `main` de este repositorio.
8.  Describe los cambios propuestos en detalle en la PR.

## Licencia

Este proyecto está licenciado bajo los términos de la **Licencia Pública General Affero de GNU v3.0 (AGPL-3.0)**.

Puedes encontrar el texto completo de la licencia en el archivo [`LICENSE`](LICENSE) en la raíz de este repositorio.

La AGPL v3 es una licencia copyleft que garantiza que el código fuente del software, incluyendo cualquier modificación, esté disponible para los usuarios, especialmente cuando el software se utiliza para ofrecer a un servicio a través de una red. Esto promueve la colaboración y asegura que las mejoras realizadas permanezcan dentro del ecosistema del proyecto.

Copyright (c) 2024 Olivier Hottelet

## Contacto

Para cualquier pregunta o consulta sobre el proyecto, puedes contactar a:

- **Olivier Hottelet**
- olivierhottelet1980@gmail.com
