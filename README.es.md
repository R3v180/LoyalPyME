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

**LoyalPyME** es una plataforma web integral full-stack (Frontend React + Backend Node.js) diseñada para facilitar a las Pequeñas y Medianas Empresas (PyMEs) la gestión de un programa de fidelización de clientes digital potente, robusto, mantenible y escalable[cite: 2].

## Visión y Propósito ✨

En un mercado competitivo, la lealtad del cliente es crucial[cite: 2]. LoyalPyME nace para ser el aliado tecnológico de las PyMEs, proporcionando las herramientas para:

- **Fomentar Compras Recurrentes:** Implementando sistemas atractivos de puntos, niveles y recompensas[cite: 2].
- **Construir Relaciones Sólidas:** Reconociendo y premiando la fidelidad del cliente[cite: 2].
- **Simplificar la Gestión:** Ofreciendo un panel de administración intuitivo y rico en funcionalidades[cite: 2].
- **Mejorar la Experiencia del Cliente:** Proporcionando un portal digital claro y accesible para los clientes finales[cite: 2].

Nuestro objetivo es permitir a cualquier PyME (minorista, hostelería, servicios, etc.) digitalizar y optimizar su estrategia de retención de clientes, evolucionando la plataforma hacia capacidades integradas de comunicación, CRM, personalización por negocio, presencia móvil y, potentially, ecosistemas de fidelización compartidos[cite: 2].

|                                   Panel de Admin (Escritorio)                                   |                                      Panel de Admin (Móvil)                                      |
| :---------------------------------------------------------------------------------------------: | :----------------------------------------------------------------------------------------------: |
| <img src="images/SC_LoyalPyME.png" alt="Panel Admin LoyalPyME - Vista Escritorio" width="100%"> | <img src="images/SC_LoyalPyME_PHONE.png" alt="Panel Admin LoyalPyME - Vista Móvil" width="100%"> |

_(Nota: Las capturas podrían necesitar actualizarse)_ [cite: 2]

## Estado del Proyecto y Hoja de Ruta 🗺️

Actualmente, el proyecto ha **completado la Fase 1 (Núcleo Funcional y Pulido)**[cite: 2].

**La Fase 2 (Funcionalidades Iniciales y Mejoras) está EN PROGRESO:**

- ✅ **Internacionalización (i18n)** del frontend completada (Español e Inglés)[cite: 2].
- ✅ **Documentación API Swagger** implementada (disponible en `/api-docs` en el backend)[cite: 1].
- ✅ **Mejoras UX Panel Cliente** realizadas:
  - Visualización integrada de beneficios del nivel actual.
  - Barra de progreso visual hacia el siguiente nivel (o indicador de nivel máximo).
  - Preview integrada de beneficios del siguiente nivel.
  - Solución al retraso en la actualización del nivel tras validar QR.
- ⏳ **Pruebas Automatizadas Backend** iniciadas (setup y cobertura básica unitaria/integración)[cite: 2].
- ⏳ **Pruebas Automatizadas Frontend** pendientes[cite: 2].

**Próximos Pasos:**

1.  **(Funcional - Fase 2):** Implementar Personalización del Negocio (Logo, Theming).
2.  **(Técnico):** Continuar ampliando la cobertura de **Pruebas Automatizadas** (Backend y Frontend)[cite: 2].
3.  **(Funcional - Fase 2):** Empezar con las funcionalidades restantes de la fase (ej: Fidelización Avanzada, Comunicación Básica, Historial de Puntos).

Para una hoja de ruta más detallada, consulta [`PROJECT_STATE_AND_ROADMAP.md`](PROJECT_STATE_AND_ROADMAP.md)[cite: 2].

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
- `vite-plugin-mkcert` (Para HTTPS Dev)

**Backend:**

- Node.js, Express, TypeScript
- Prisma (ORM) & PostgreSQL (Base de Datos)
- JWT (Autenticación) & bcryptjs (Hashing)
- dotenv (Variables Entorno)
- node-cron (Tareas Programadas)
- uuid (IDs Únicos)
- cors, `date-fns`
- `vitest`, `supertest` (Testing)
- `swagger-jsdoc`, `swagger-ui-express` (Docs API)

## Instalación y Configuración Local ⚙️

Para poner el proyecto en marcha en tu entorno de desarrollo:

### Prerrequisitos

- Node.js (v18 o v20 recomendado) [cite: 2]
- yarn (v1.x recomendado) [cite: 2]
- Servidor de base de datos PostgreSQL accesible y ejecutándose localmente[cite: 2].
- (Opcional) NVM o similar[cite: 2].

### Configuración Backend

1.  Clona repo y `cd LoyalPyME/backend` [cite: 2]
2.  `yarn install` [cite: 2]
3.  Copia `backend/.env.example` a `backend/.env` [cite: 2]
4.  **Configura `.env`:** Rellena `DATABASE_URL` y `JWT_SECRET`[cite: 2].
5.  Ejecuta migraciones: `npx prisma migrate dev` [cite: 2]
6.  Genera cliente Prisma: **`npx prisma generate`** (¡Importante!) [cite: 2]
7.  **Datos Iniciales:** Elige **Opción A (Seed):** `npx prisma db seed` (si está implementado) u **Opción B (Manual):** Registra desde `/register-business` en el frontend[cite: 2].

### Configuración Frontend

1.  Navega a `frontend` (`cd ../frontend`) [cite: 2]
2.  Instala dependencias: `yarn install` [cite: 2]

## Ejecutando el Proyecto ▶️

1.  Asegúrate de que PostgreSQL está **en ejecución**[cite: 2].
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
    - **Método `yarn dev` (NO RECOMENDADO):** Inestable en el entorno actual[cite: 2].
    - _(Backend corre en puerto 3000 o el configurado)_ [cite: 2]

3.  **Inicia Frontend** (desde `frontend/`):
    ```bash
    # Usa --host para acceso por red y HTTPS
    yarn dev --host
    ```
    _(Frontend corre en puerto 5173)_ [cite: 2]

Accede vía `https://localhost:5173` (PC) o la URL de red (Móvil)[cite: 2].

#### **Acceso desde Móvil (Red Local)**

1.  Encuentra IP Local del PC (`ipconfig` / `ifconfig`)[cite: 2].
2.  Asegura Servidores Corriendo (Backend y Frontend)[cite: 2].
3.  Verifica Firewall PC (Permitir TCP entrante en 5173 y 3000 para red Privada)[cite: 2].
4.  Verifica Config Vite (`server: { host: true, https: true, proxy: { ... } }`)[cite: 2].
5.  Accede en Móvil: `https://<TU_IP_PC>:5173`. Acepta advertencia de seguridad[cite: 2].

---

## Contribuciones 🤝

¡Contribuciones bienvenidas! Flujo: Fork -> Branch -> Commit -> Push -> Pull Request[cite: 2].

## Licencia 📜

Licencia: **GNU Affero General Public License v3.0 (AGPL-3.0)**. Ver [`LICENSE`](LICENSE)[cite: 2].
Copyright (c) 2024-2025 Olivier Hottelet [cite: 2]

## Contacto 📧

- **Olivier Hottelet**
- olivierhottelet1980@gmail.com
