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

- **Fomentar Compras Recurrentes:** Implementando sistemas atractivos de puntos, niveles y recompensas.
- **Construir Relaciones Sólidas:** Reconociendo y premiando la fidelidad del cliente.
- **Simplificar la Gestión:** Ofreciendo un panel de administración intuitivo y rico en funcionalidades.
- **Mejorar la Experiencia del Cliente:** Proporcionando un portal digital claro y accesible para los clientes finales.

Nuestro objetivo es permitir a cualquier PyME (minorista, hostelería, servicios, etc.) digitalizar y optimizar su estrategia de retención de clientes, evolucionando la plataforma hacia capacidades integradas de comunicación, CRM, presencia móvil y, potencialmente, ecosistemas de fidelización compartidos.

|                                   Panel de Admin (Escritorio)                                   |                                      Panel de Admin (Móvil)                                      |
| :---------------------------------------------------------------------------------------------: | :----------------------------------------------------------------------------------------------: |
| <img src="images/SC_LoyalPyME.png" alt="Panel Admin LoyalPyME - Vista Escritorio" width="100%"> | <img src="images/SC_LoyalPyME_PHONE.png" alt="Panel Admin LoyalPyME - Vista Móvil" width="100%"> |

_(Nota: Las capturas podrían necesitar actualizarse)_

## Estado del Proyecto y Hoja de Ruta 🗺️

Actualmente, el proyecto ha **completado la Fase 1 (Núcleo Funcional)**, incluyendo la gestión de negocios, usuarios, autenticación, niveles, recompensas, puntos, códigos QR (con escáner móvil funcional), paneles de administración y cliente, y gestión completa de clientes por parte del admin (listado, detalles, acciones individuales y masivas, filtros).

Además, se ha realizado una **limpieza y refactorización general del código** tanto en frontend como en backend para mejorar la mantenibilidad.

**Próximos Pasos Inmediatos:**

1.  **(Técnico - Alta Prioridad):** Implementar **Pruebas Automatizadas**.
2.  **(Funcional - Fase 2):** Comenzar con la **Internacionalización (i18n)**.

Para una hoja de ruta más detallada, consulta [`PROJECT_STATE_AND_ROADMAP.md`](PROJECT_STATE_AND_ROADMAP.md).

## Tecnologías Utilizadas 🛠️

**Frontend:**

- React & TypeScript
- Vite (Herramienta Construcción)
- Mantine UI (v7+) & Mantine Hooks
- `@mantine/form` & `zod` (Validación Formularios)
- `@mantine/notifications` (Feedback UI)
- `@mantine/modals` (Modales)
- Axios (Peticiones API)
- React Router DOM (v6+)
- `qrcode.react`, `html5-qrcode` (Funcionalidad QR)
- `vite-plugin-mkcert` (Para HTTPS Dev)

**Backend:**

- Node.js, Express, TypeScript
- Prisma (ORM)
- PostgreSQL (Base de Datos)
- JWT (Autenticación) & bcryptjs (Hashing)
- dotenv (Variables Entorno)
- node-cron (Tareas Programadas - Lógica Niveles)
- uuid (IDs Únicos)
- cors, `date-fns`
- `ts-node`, `ts-node-dev` (Dependencias Desarrollo - _Uso limitado por inestabilidad_)

## Instalación y Configuración Local ⚙️

Para poner el proyecto en marcha en tu entorno de desarrollo:

### Prerrequisitos

- Node.js (v18 o v20 recomendado)
- yarn (v1.x recomendado)
- Servidor de base de datos PostgreSQL accesible y ejecutándose localmente.
- (Opcional pero recomendado para gestionar versiones de Node) NVM o similar.

### Configuración Backend

1.  Clona repo y `cd LoyalPyME/backend`
2.  `yarn install`
3.  Copia `backend/.env.example` a `backend/.env` (`cp .env.example .env`)
4.  **Configura `.env`:** Rellena `DATABASE_URL` con tus datos locales y genera un `JWT_SECRET` seguro y aleatorio. **No subas `.env` a Git**.
5.  Ejecuta migraciones: `npx prisma migrate dev`
6.  Genera cliente Prisma: `npx prisma generate`
7.  **Datos Iniciales (IMPORTANTE):**
    - **Opción A: Seed (Recomendado si está implementado):** Ejecuta `npx prisma db seed`. Revisa `prisma/seed.ts` para las credenciales de ejemplo.
    - **Opción B: Registro Manual:** Si no hay seed, tras arrancar la app, ve a la ruta `/register-business` en el frontend y crea tu primer negocio y usuario administrador.
      _(Confirma qué opción aplica a la versión actual)._
8.  (Opcional) `npx ts-node scripts/hash-customer-password.ts` para clientes específicos (si es necesario).

### Configuración Frontend

1.  Navega a `frontend` (`cd ../frontend`)
2.  Instala dependencias: `yarn install`

## Ejecutando el Proyecto ▶️

1.  Asegúrate de que PostgreSQL está **en ejecución**.
2.  **Inicia Backend** (desde `backend/`):

    - **Método Estable (Recomendado para Desarrollo y Producción):**
      ```bash
      # Compila TS a JS
      yarn build
      # Ejecuta el JS compilado
      node dist/index.js
      ```
      _(Necesitarás repetir `yarn build && node dist/index.js` tras cada cambio en el backend)._
    - **Método con Hot-Reload (Solo Desarrollo - Requiere 2 Terminales):**

      ```bash
      # En Terminal 1 (compila y vigila cambios en src/):
      npx tsc --watch

      # En Terminal 2 (ejecuta y vigila cambios en dist/):
      npx nodemon dist/index.js
      ```

      _(Este método es el recomendado para desarrollo activo ya que reinicia automáticamente el servidor al guardar cambios en archivos `.ts`)._

    - **Método `yarn dev` (NO RECOMENDADO ACTUALMENTE):**
      Debido a inestabilidades con `ts-node-dev`, el comando `yarn dev` original no funciona de forma fiable en el entorno actual. Usar el método de dos terminales.
      _(Backend corre en puerto 3000 o el configurado en `.env`)_

3.  **Inicia Frontend** (desde `frontend/`):
    ```bash
    # Usa --host para acceso por red y HTTPS (requiere mkcert configurado)
    yarn dev --host
    ```
    _(Frontend corre en puerto 5173. Revisa la URL `Network:` en la consola para acceso desde otros dispositivos en la red local)._

Accede vía `https://localhost:5173` (en PC, acepta advertencia seguridad) o la URL `Network:` (en Móvil, acepta advertencia seguridad).

#### **Acceso desde Móvil (Red Local)**

Para probar el frontend en un dispositivo móvil en la misma red:

1.  **Encuentra IP Local del PC:** Usa `ipconfig` (Win) o `ip addr show` / `ifconfig` (Mac/Linux). (ej: `192.168.X.Y`).
2.  **Asegura Servidores Corriendo:** Backend (con el método de **dos terminales** o `node dist/index.js`) y Frontend (`yarn dev --host`).
3.  **Verifica Firewall PC:** Permite conexiones **TCP** entrantes en puertos **5173** (Vite) y **3000** (Backend) para tu perfil de red **Privado**.
4.  **Verifica Config Vite:** Asegura que `frontend/vite.config.ts` incluye `server: { host: true, https: true, proxy: { ... } }`.
5.  **Accede en Móvil:** Abre navegador en móvil y navega a `https://<TU_IP_PC>:5173`. **Acepta la advertencia de seguridad**.

---

## Contribuciones 🤝

¡Contribuciones bienvenidas! Flujo: Fork -> Branch -> Commit -> Push -> Pull Request.

## Licencia 📜

Licencia: **GNU Affero General Public License v3.0 (AGPL-3.0)**. Ver [`LICENSE`](LICENSE).

Copyright (c) 2024-2025 Olivier Hottelet

## Contacto 📧

- **Olivier Hottelet**
- olivierhottelet1980@gmail.com
