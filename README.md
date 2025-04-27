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

## Used Technologies

**Frontend:**

- React & TypeScript
- Vite
- Mantine UI (v7+) & Mantine Hooks
- `@mantine/form` & `zod` (for form validation)
- `@mantine/notifications` (for UI feedback)
- `@mantine/modals` (for confirmation/input modals)
- Axios (for API requests)
- React Router DOM (v6+)
- qrcode.react, react-qr-reader (for QR code functionality)

**Backend:**

- Node.js, Express, TypeScript
- Prisma (ORM), PostgreSQL (Database)
- JWT (for authentication) & bcryptjs (for hashing)
- dotenv (for environment variables)
- node-cron (for scheduled tasks)
- uuid (for unique IDs)
- cors
- `ts-node`, `ts-node-dev` (installed for development)

## Installation and Local Setup

To get the project up and running in your development environment:

### Prerequisites

- Node.js (v18+ recommended, currently using v20.9.0)
- yarn (v1.22.19 used)
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
3.  Create a `.env` file in the root of the `backend/` folder with the following variables:
    ```env
    DATABASE_URL="postgresql://your_user:your_password@host:port/your_db?schema=public"
    JWT_SECRET="a_long_and_secure_random_string"
    # PORT=3000 (Optional, defaults to 3000)
    ```
4.  Run Prisma migrations to set up the database schema:
    ```bash
    npx prisma migrate dev
    ```
5.  Generate Prisma Client (usually done by migrate, but can run manually):
    ```bash
    npx prisma generate
    ```
6.  (Optional) Run the script to hash a password for a manually created test customer:
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

## Running the Project

1.  Ensure your PostgreSQL server is running.
2.  **Start the backend** from the `backend` folder (in one terminal):

    ```bash
    # Recommended method (stable):
    yarn build && node dist/index.js

    # Alternative (currently unstable due to ts-node issues):
    # yarn dev
    ```

    The backend will run on `http://localhost:3000`.

3.  **Start the frontend** from the `frontend` folder (in another terminal):
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
