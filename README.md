# LoyalPyME

[![GitHub repo size](https://img.shields.io/github/repo-size/R3v180/LoyalPyME?style=flat-square)](https://github.com/R3v180/LoyalPyME)
[![GitHub contributors](https://img.shields.io/github/contributors/R3v180/LoyalPyME?style=flat-square)](https://github.com/R3v180/LoyalPyME/graphs/contributors)
[![GitHub last commit](https://img.shields.io/github/last-commit/R3v180/LoyalPyME?style=flat-square)](https://github.com/R3v180/LoyalPyME/commits/main)
[![GitHub issues](https://img.shields.io/github/issues/R3v180/LoyalPyME?style=flat-square)](https://github.com/R3v180/LoyalPyME/issues)
[![GitHub pull requests](https://img.shields.io/github/issues-pr/R3v180/LoyalPyME?style=flat-square)](https://github.com/R3v180/LoyalPyME/pulls)
[![License: AGPL v3](https://img.shields.io/badge/License-AGPL%20v3-blue.svg?style=flat-square)](https://www.gnu.org/licenses/agpl-3.0)

---

🇬🇧 **Read in English** | 🇪🇸 **Leer en Español**

---

# LoyalPyME 🇬🇧

**LoyalPyME** is a comprehensive web platform designed to empower Small and Medium-sized Enterprises (SMEs) with a powerful and easy-to-manage digital customer loyalty program.

## Vision and Purpose

In a competitive market, customer loyalty is an invaluable asset. LoyalPyME is born to provide SMEs with the necessary tools to:

- **Foster Repeat Purchases:** Implementing attractive points, tiers, and rewards systems.
- **Build Strong Relationships:** Recognizing and rewarding customer loyalty.
- **Simplify Management:** Offering an intuitive and efficient administration panel.
- **Enhance Customer Experience:** Providing an accessible and transparent digital portal.

Our goal is to be the technological ally that enables any SME, regardless of its sector (retail, hospitality, services, etc.), to digitize and optimize its customer retention strategy, laying the groundwork for long-term growth.

![Screenshot of the LoyalPyME Admin Dashboard](images/SC_LoyalPyME.png)

## Functional Evolution Phases

LoyalPyME's development follows a phased roadmap, prioritizing the delivery of a functional loyalty core and scaling towards advanced and community capabilities.

**Phase 1: Solid Loyalty Core (WEB) - (Primarily Operational)**

- **Centralized Rewards Management:** Creation, editing, deletion, and status management (active/inactive) of redeemable rewards for points. **(Functional)**
- **Transactional Points System:** Generation of unique QR codes per transaction (amount, ticket) for point assignment. **(Functional)** Validation of QR codes by the end customer through their web portal to earn points. **(Functional)**
- **Configurable Tier System:** Definition of tiers with thresholds (points, spending, visits) and management of associated benefits per tier. Configuration of the global tier system logic and downgrade policies. **(Functional)**
- **Essential Customer Portal:** User profile visualization (points, tier) and transaction history. Visualization of available rewards and gifts directly assigned by the business. Redemption of both categories. **(Functional)**
- **Basic Customer Management (Admin):** Listing of registered customers for the business, with key data (points, tier, registration date, status). Manual adjustment of points, manual tier change, assignment of rewards as gifts, and marking/unmarking as "Favorite" for individual customers. **(Functional)**
- _Upcoming in Phase 1:_ Full implementation of filters (e.g., Favorite, Active status), search by name/email, and real pagination in the Admin customer management. Development of a "View Details" customer modal (possibly including internal notes for Admin). Activate/Deactivate customer action.

**Future Phases (Towards a Complete Ecosystem):**

- **Phase 2 (Web Expansion):** More complex points and rewards rules, basic direct communication tools (email, portal publications), advanced customer segmentation, bulk actions in the Admin panel.
- **Phase 3 (Mobile Platform):** Native mobile applications for customers and staff, push notifications, location-based check-in, digital loyalty card in the app.
- **Phase 4 (Business Intelligence & Lightweight CRM):** Analytics and reporting modules on customer behavior and value, lightweight CRM functionalities (notes, full history), marketing automation.
- **Phase 5 (Connected Ecosystems & Social Potential):** Shared loyalty programs among groups of businesses, events module, Customer-Business chat, and potential community/social chat (e.g., anonymous activity map in specific sectors like nightlife), expansion to other sectors and geographies.

## Used Technologies

**Frontend:**

- React & TypeScript
- Vite
- Mantine UI (v7+)
- Axios
- React Router DOM (v6+)
- qrcode.react, react-qr-reader
- Zod, Mantine Form, @mantine/notifications

**Backend:**

- Node.js, Express, TypeScript
- Prisma, PostgreSQL
- JWT for authentication
- bcryptjs
- dotenv
- node-cron (for scheduled tasks, e.g., tier calculation)
- uuid, date-fns
- cors

## Installation and Local Setup

To get the project up and running in your development environment:

### Prerequisites

- Node.js (v18+ recommended)
- yarn
- Accessible PostgreSQL database server

### Backend Setup

1.  Clone the repository and navigate to the `backend` folder:
    ```bash
    git clone https://github.com/R3v180/LoyalPyME.git
    cd LoyalPyME/backend
    ```
2.  Install dependencies:
    ```bash
    yarn install
    ```
3.  Create a `.env` file in the root of the `backend/` folder with the following variables:
    ```env
    DATABASE_URL="postgresql://your_user:your_password@host:port/your_db?schema=public"
    JWT_SECRET="a_long_and_secure_random_string"
    # Other variables if needed
    ```
4.  Run Prisma migrations to set up the database schema:
    ```bash
    npx prisma migrate dev
    ```
5.  (Optional) You can generate a test customer user by running the script:
    ```bash
    npx ts-node scripts/hash-customer-password.ts
    ```
    _(Edit `scripts/hash-customer-customer.ts` before running to configure the desired email and password)._

### Frontend Setup

1.  Navigate to the `frontend` folder:
    ```bash
    cd ../frontend
    ```
2.  Install dependencies:
    ```bash
    yarn install
    ```

## Running the Project

1.  Ensure your PostgreSQL server is running.
2.  Start the backend from the `backend` folder (in one terminal):
    ```bash
    # For development with hot-reloading (may be unstable):
    yarn dev
    # Or for a more robust execution after building:
    yarn build && node dist/index.js
    ```
    The backend will run on `http://localhost:3000`.
3.  Start the frontend from the `frontend` folder (in another terminal):
    ```bash
    yarn dev
    ```
    The frontend will run on `http://localhost:5173`.

Access the application through `http://localhost:5173` in your browser.

## Contributions

We welcome and encourage contributions to LoyalPyME! If you find a bug, have an idea for a new feature, or want to improve the code, please:

1.  Fork this repository.
2.  Clone your fork locally.
3.  Create a new branch for your work (`git checkout -b feature/feature-name` or `fix/bug-description`).
4.  Make your changes and ensure they pass any linting checks (if available).
5.  Write clear and descriptive commit messages.
6.  Push your branch to your fork on GitHub.
7.  Open a Pull Request (PR) from your branch to the `main` branch of this repository.
8.  Describe your proposed changes in detail in the PR.

## License

This project is licensed under the terms of the **GNU Affero General Public License v3.0 (AGPL-3.0)**.

You can find the full license text in the [`LICENSE`](LICENSE) file at the root of this repository.

The AGPL v3 is a copyleft license that ensures the software's source code, including any modifications, is available to users, especially when the software is used to offer a service over a network. This promotes collaboration and ensures that improvements made remain within the project's ecosystem.

Copyright (c) 2024 Olivier Hottelet

## Contact

For any questions or inquiries about the project, you can contact:

- **Olivier Hottelet**
- olivierhottelet1980@gmail.com

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

**Fase 1: Núcleo de Fidelización Web (Operativa Principalmente)**

- **Gestión de Recompensas:** Creación, edición, eliminación y gestión del estado (activo/inactivo) de recompensas canjeables por puntos. **(Funcional)**
- **Sistema de Puntos Transaccional:** Generación de códigos QR únicos por transacción (importe, ticket) para asignación de puntos. **(Funcional)** Validación de códigos QR por el cliente final a través de su portal web para sumar puntos. **(Funcional)**
- **Sistema de Niveles (Tiers):** Definición de niveles con umbrales (puntos, gasto, visitas) y gestión de beneficios por nivel. Configuración de la lógica de cálculo y descenso de nivel. **(Funcional)**
- **Panel Cliente Esencial:** Visualización del perfil de usuario (puntos, nivel) e historial de transacciones. Visualización de recompensas disponibles y regalos asignados directamente por el negocio. Canjeo de ambas categorías. **(Funcional)**
- **Gestión de Clientes (Admin):** Listado de clientes registrados en el negocio, con datos clave (puntos, nivel, fecha registro, estado). Ajuste manual de puntos, cambio manual de nivel, asignación de recompensas como regalo, y marcar/desmarcar como "Favorito" para clientes individuales. **(Funcional)**
- _Próximo en Fase 1:_ Implementación completa de filtros (ej: Favoritos, Activos), búsqueda por nombre/email y paginación real en la gestión de clientes Admin. Desarrollo del modal "Ver Detalles" de cliente (posiblemente incluyendo notas internas para Admin). Acción Activar/Desactivar cliente.

**Fases Futuras (Hacia un Ecosistema Completo):**

- **Fase 2 (Expansión Web):** Reglas de puntos y recompensas más complejas, herramientas básicas de comunicación directa (email, publicaciones en portal), segmentación avanzada de clientes, acciones masivas en panel Admin.
- **Fase 3 (Plataforma Móvil):** Aplicaciones nativas para clientes y personal, notificaciones push, check-in basado en localización, tarjeta de fidelización digital en app.
- **Fase 4 (Inteligencia y CRM Ligero):** Módulos de análisis e informes sobre comportamiento y valor del cliente, funcionalidades de CRM ligero (notas, historial completo), automatización de marketing.
- **Fase 5 (Ecosistemas Conectados y Potencial Social):** Programas de fidelización compartidos entre grupos de negocios, módulo de eventos, chat Cliente-Negocio y potencial chat comunitario/social (ej: mapa de actividad anónima en sectores específicos como el ocio nocturno), expansión a otros sectores y geografías.

## Tecnologías Utilizadas

**Frontend:**

- React & TypeScript
- Vite
- Mantine UI (v7+)
- Axios
- React Router DOM (v6+)
- qrcode.react, react-qr-reader
- Zod, Mantine Form, @mantine/notifications

**Backend:**

- Node.js, Express, TypeScript
- Prisma, PostgreSQL
- JWT para autenticación
- bcryptjs
- dotenv
- node-cron (para tareas programadas, ej. cálculo de tiers)
- uuid, date-fns
- cors

## Instalación y Configuración Local

Para poner el proyecto en marcha en tu entorno de desarrollo:

### Prerrequisitos

- Node.js (v18+ recomendado)
- yarn
- Servidor de base de datos PostgreSQL accesible

### Configuración del Backend

1.  Clona el repositorio y navega a la carpeta `backend`:
    ```bash
    git clone https://github.com/R3v180/LoyalPyME.git
    cd LoyalPyME/backend
    ```
2.  Install dependencies:
    ```bash
    yarn install
    ```
3.  Crea un archivo `.env` en la raíz de la carpeta `backend/` con las siguientes variables:
    ```env
    DATABASE_URL="postgresql://your_user:your_password@host:port/your_db?schema=public"
    JWT_SECRET="a_long_and_secure_random_string"
    # Other variables if needed
    ```
4.  Run Prisma migrations to set up the database schema:
    ```bash
    npx prisma migrate dev
    ```
5.  (Optional) You can generate a test customer user by running the script:
    ```bash
    npx ts-node scripts/hash-customer-password.ts
    ```
    _(Edit `scripts/hash-customer-customer.ts` before running to configure the desired email and password)._

### Frontend Setup

1.  Navigate to the `frontend` folder:
    ```bash
    cd ../frontend
    ```
2.  Install dependencies:
    ```bash
    yarn install
    ```

## Running the Project

1.  Ensure your PostgreSQL server is running.
2.  Start the backend from the `backend` folder (in one terminal):
    ```bash
    # For development with hot-reloading (may be unstable):
    yarn dev
    # Or for a more robust execution after building:
    yarn build && node dist/index.js
    ```
    The backend will run on `http://localhost:3000`.
3.  Start the frontend from the `frontend` folder (in another terminal):
    ```bash
    yarn dev
    ```
    The frontend will run on `http://localhost:5173`.

Access the application through `http://localhost:5173` in your browser.

## Contributions

We welcome and encourage contributions to LoyalPyME! If you find a bug, have an idea for a new feature, or want to improve the code, please:

1.  Fork this repository.
2.  Clone your fork locally.
3.  Create a new branch for your work (`git checkout -b feature/feature-name` or `fix/bug-description`).
4.  Make your changes and ensure they pass any linting checks (if available).
5.  Write clear and descriptive commit messages.
6.  Push your branch to your fork on GitHub.
7.  Open a Pull Request (PR) from your branch to the `main` branch of this repository.
8.  Describe your proposed changes in detail in the PR.

## License

This project is licensed under the terms of the **GNU Affero General Public License v3.0 (AGPL-3.0)**.

You can find the full license text in the [`LICENSE`](LICENSE) file at the root of this repository.

The AGPL v3 is a copyleft license that ensures the software's source code, including any modifications, is available to users, especially when the software is used to offer a service over a network. This promotes collaboration and ensures that improvements made remain within the project's ecosystem.

Copyright (c) 2024 Olivier Hottelet

## Contact

For any questions or inquiries about the project, you can contact:

- **Olivier Hottelet**
- olivierhottelet1980@gmail.com

---
