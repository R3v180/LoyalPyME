# LoyalPyME 🇪🇸

[![GitHub repo size](https://img.shields.io/github/repo-size/R3v180/LoyalPyME?style=flat-square)](https://github.com/R3v180/LoyalPyME)
[![GitHub contributors](https://img.shields.io/github/contributors/R3v180/LoyalPyME?style=flat-square)](https://github.com/R3v180/LoyalPyME/graphs/contributors)
[![GitHub last commit](https://img.shields.io/github/last-commit/R3v180/LoyalPyME?style=flat-square)](https://github.com/R3v180/LoyalPyME/commits/main)
[![GitHub issues](https://img.shields.io/github/issues/R3v180/LoyalPyME?style=flat-square)](https://github.com/R3v180/LoyalPyME/issues)
[![GitHub pull requests](https://img.shields.io/github/issues-pr/R3v180/LoyalPyME?style=flat-square)](https://github.com/R3v180/LoyalPyME/pulls)
[![License: AGPL v3](https://img.shields.io/badge/License-AGPL%20v3-blue.svg?style=flat-square)](https://www.gnu.org/licenses/agpl-3.0)

---

🇬🇧 [Read in English](README.md) | 🇪🇸 **Estás leyendo la versión en Español.**

---

# LoyalPyME 🇪🇸

**LoyalPyME** es una plataforma web integral full-stack (Frontend React + Backend Node.js) diseñada para facilitar a las Pequeñas y Medianas Empresas (PyMEs) la gestión de un programa de fidelización de clientes digital potente, robusto, mantenible y escalable.

## Visión y Propósito ✨

En un mercado competitivo, la lealtad del cliente es crucial. LoyalPyME nace para ser el aliado tecnológico de las PyMEs, proporcionando las herramientas para:

- **Fomentar Compras Recurrentes:** Implementando sistemas atractivos de puntos, niveles y recompensas (¡ahora con imágenes!).
- **Construir Relaciones Sólidas:** Reconociendo y premiando la fidelidad del cliente.
- **Simplificar la Gestión:** Ofreciendo un panel de administración intuitivo (ahora con gestión de imágenes para recompensas).
- **Mejorar la Experiencia del Cliente:** Proporcionando un portal digital claro y accesible (ahora mostrando imágenes de recompensas).

Nuestro objetivo es permitir a cualquier PyME (minorista, hostelería, servicios, etc.) digitalizar y optimizar su estrategia de retención de clientes, evolucionando la plataforma hacia capacidades integradas de comunicación, CRM, personalización por negocio, presencia móvil y, potentially, ecosistemas de fidelización compartidos.

|                                   Panel de Admin (Escritorio)                                   |                                      Panel de Admin (Móvil)                                      |
| :---------------------------------------------------------------------------------------------: | :----------------------------------------------------------------------------------------------: |
| <img src="images/SC_LoyalPyME.png" alt="Panel Admin LoyalPyME - Vista Escritorio" width="100%"> | <img src="images/SC_LoyalPyME_PHONE.png" alt="Panel Admin LoyalPyME - Vista Móvil" width="100%"> |

_(Nota: Las capturas podrían necesitar actualizarse para mostrar las nuevas funcionalidades como las imágenes)_

## Estado del Proyecto y Hoja de Ruta 🗺️

Actualmente, el proyecto ha **completado la Fase 1 (Núcleo Funcional y Pulido)**.

**La Fase 2 (Funcionalidades Iniciales y Mejoras) está EN PROGRESO:**

- ✅ **Internacionalización (i18n)** del frontend completada (Español e Inglés).
- ✅ **Documentación API Swagger** implementada (`/api-docs`).
- ✅ **Mejoras UX Panel Cliente** realizadas (Beneficios nivel, barra progreso, preview siguiente nivel).
- ✅ **Imágenes en Recompensas** implementado:
  - El administrador puede subir y recortar (1:1) imágenes para las recompensas.
  - Las imágenes se almacenan en Cloudinary.
  - Los clientes ven las imágenes en la lista de recompensas y en el resumen del dashboard.
- ⏳ **Pruebas Automatizadas Backend** iniciadas (cobertura básica).
- ⏳ **Pruebas Automatizadas Frontend** pendientes.

**Próximos Pasos:**

1.  **(Técnico):** Arreglar tipo `TierData` y Fix Popover Móvil.
2.  **(Funcional - Fase 2):** Implementar Personalización del Negocio (Logo, Theming).
3.  **(Visual - Fase 2):** Refinar diseño de `RewardList`.
4.  **(Técnico):** Continuar ampliando la cobertura de **Pruebas Automatizadas**.
5.  **(Funcional - Fase 2):** Empezar con funcionalidades como Historial de Actividad, Fidelización Avanzada, Comunicación Básica.

Para una hoja de ruta más detallada, consulta [`PROJECT_STATE_AND_ROADMAP.md`](PROJECT_STATE_AND_ROADMAP.md).

## Tecnologías Utilizadas 🛠️

**Frontend:**

- React & TypeScript
- Vite (Herramienta Construcción)
- Mantine UI (v7+) & Mantine Hooks
- `@mantine/form` & `zod` (Validación Formularios)
- `@mantine/notifications` & `@mantine/modals`
- Axios (Peticiones API)
- React Router DOM (v6+)
- `qrcode.react`, `html5-qrcode` (Funcionalidad QR)
- `i18next`, `react-i18next` (Internacionalización)
- `i18next-http-backend`, `i18next-browser-languagedetector`
- `react-country-flag` (Selector Idioma)
- **`react-image-crop`** (Recorte de Imágenes)
- `vite-plugin-mkcert` (Para HTTPS Dev)

**Backend:**

- Node.js, Express, TypeScript
- Prisma (ORM) & PostgreSQL (Base de Datos)
- JWT (Autenticación) & bcryptjs (Hashing)
- dotenv (Variables Entorno)
- node-cron (Tareas Programadas)
- uuid (IDs Únicos)
- cors, `date-fns`
- **`cloudinary`** (Almacenamiento Imágenes)
- **`multer`** (Manejo Subida Archivos)
- **`streamifier`** (Helper Streams)
- `vitest`, `supertest` (Testing)
- `swagger-jsdoc`, `swagger-ui-express` (Docs API)

## Instalación y Configuración Local ⚙️

Para poner el proyecto en marcha en tu entorno de desarrollo:

### Prerrequisitos

- Node.js (v18 o v20 recomendado)
- yarn (v1.x recomendado)
- Servidor de base de datos PostgreSQL accesible y ejecutándose localmente.
- (Opcional) NVM o similar.

### Configuración Backend

1.  Clona repo y `cd LoyalPyME/backend`
2.  `yarn install`
3.  Copia `backend/.env.example` a `backend/.env`
4.  **Configura `.env`:** Rellena `DATABASE_URL`, `JWT_SECRET`, y las **credenciales de Cloudinary** (`CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET`).
5.  Ejecuta migraciones: `npx prisma migrate dev`
6.  Genera cliente Prisma: **`npx prisma generate`** (¡Importante!)
7.  **Datos Iniciales:** Elige **Opción A (Seed):** `npx prisma db seed` (si está implementado) u **Opción B (Manual):** Registra desde `/register-business` en el frontend.

### Configuración Frontend

1.  Navega a `frontend` (`cd ../frontend`)
2.  Instala dependencias: `yarn install`

## Ejecutando el Proyecto ▶️

1.  Asegúrate de que PostgreSQL está **en ejecución**.
2.  **Inicia Backend** (desde `backend/`):

    - **Método Recomendado (Desarrollo con Hot-Reload - Requiere 2 Terminales):**
      ```bash
      # Terminal 1: Compilación continua
      npx tsc --watch
      # Terminal 2: Ejecución y reinicio automático
      npx nodemon dist/index.js
      ```
    - **Método Alternativo (Estable, sin Hot-Reload):**
      ```bash
      yarn build && node dist/index.js
      # (Repetir tras cada cambio)
      ```
    - **Método `yarn dev` (NO RECOMENDADO):** Inestable en el entorno actual.
    - _(Backend corre en puerto 3000 o el configurado)_

3.  **Inicia Frontend** (desde `frontend/`):
    ```bash
    # Usa --host para acceso por red y HTTPS
    yarn dev --host
    ```
    _(Frontend corre en puerto 5173)_

Accede vía `https://localhost:5173` (PC) o la URL de red (Móvil).

#### **Acceso desde Móvil (Red Local)**

1.  Encuentra IP Local del PC (`ipconfig` / `ifconfig`).
2.  Asegura Servidores Corriendo (Backend y Frontend).
3.  Verifica Firewall PC (Permitir TCP entrante en 5173 y 3000 para red Privada).
4.  Verifica Config Vite (`server: { host: true, https: true, proxy: { ... } }`).
5.  Accede en Móvil: `https://<TU_IP_PC>:5173`. Acepta advertencia de seguridad.

---

## Contribuciones 🤝

¡Contribuciones bienvenidas! Flujo: Fork -> Branch -> Commit -> Push -> Pull Request.

## Licencia 📜

Licencia: **GNU Affero General Public License v3.0 (AGPL-3.0)**. Ver [`LICENSE`](LICENSE).
Copyright (c) 2024-2025 Olivier Hottelet

## Contacto 📧

- **Olivier Hottelet**
- olivierhottelet1980@gmail.com
