# LoyalPyME 🇪🇸

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg?style=flat-square)](https://opensource.org/licenses/MIT)
[![GitHub repo size](https://img.shields.io/github/repo-size/R3v180/LoyalPyME?style=flat-square)](https://github.com/R3v180/LoyalPyME)
[![GitHub contributors](https://img.shields.io/github/contributors/R3v180/LoyalPyME?style=flat-square)](https://github.com/R3v180/LoyalPyME/graphs/contributors)
[![GitHub last commit](https://img.shields.io/github/last-commit/R3v180/LoyalPyME?style=flat-square)](https://github.com/R3v180/LoyalPyME/commits/main)
[![GitHub issues](https://img.shields.io/github/issues/R3v180/LoyalPyME?style=flat-square)](https://github.com/R3v180/LoyalPyME/issues)
[![GitHub pull requests](https://img.shields.io/github/issues-pr/R3v180/LoyalPyME?style=flat-square)](https://github.com/R3v180/LoyalPyME/pulls)

---

🇬🇧 [Read in English](README.md) | 🇪🇸 **Estás leyendo la versión en Español.**

---

# LoyalPyME 🇪🇸 (v1.13.0)

**LoyalPyME** es una plataforma web integral y modular (Frontend React + Backend Node.js) diseñada para Pequeñas y Medianas Empresas (PyMEs). Actualmente incluye:

- **LoyalPyME Core:** Un sistema robusto para la gestión de programas de fidelización de clientes digitales (puntos, niveles, recompensas, QR).
- **Próximamente: LoyalPyME Camarero:** Un módulo avanzado para la digitalización y optimización del servicio en hostelería (carta digital, comandas desde mesa, KDS, interfaz de camarero).

La plataforma está diseñada para ser mantenible, escalable y adaptable a las necesidades del negocio.

## Visión y Propósito ✨

LoyalPyME busca ser el aliado tecnológico de las PyMEs, proporcionando herramientas digitales integradas.
Con **LoyalPyME Core**, las empresas fomentan la recurrencia y construyen relaciones sólidas con sus clientes.
Con el futuro **LoyalPyME Camarero**, los negocios de hostelería optimizarán su servicio, reducirán costes y mejorarán la experiencia del cliente final.
La plataforma se adapta a diversos sectores, con un enfoque inicial en retail, servicios (para LCo) y hostelería (para LC).

_(Consulta [PROJECT_STATUS.md](./PROJECT_STATUS.md) para ver las decisiones de diseño clave y la [DEVELOPMENT_PLAN.md](./DEVELOPMENT_PLAN.md) para la visión a largo plazo y el estado de los módulos)._

|                                   Panel de Admin (Escritorio)                                   |                                      Panel de Admin (Móvil)                                      |
| :---------------------------------------------------------------------------------------------: | :----------------------------------------------------------------------------------------------: |
| <img src="images/SC_LoyalPyME.png" alt="Panel Admin LoyalPyME - Vista Escritorio" width="100%"> | <img src="images/SC_LoyalPyME_PHONE.png" alt="Panel Admin LoyalPyME - Vista Móvil" width="100%"> |

_(Nota: Las capturas podrían necesitar actualizarse para reflejar los módulos y el panel Super Admin)._

## Características Principales Implementadas (Plataforma Base y LoyalPyME Core) ✅

- **Gestión Multi-Módulo (Base):**
  - Panel Super Admin para la gestión global de negocios clientes.
  - Activación/Desactivación de módulos (ej: LoyalPyME Core, LoyalPyME Camarero) por negocio.
  - Control de acceso a funcionalidades basado en los módulos activos para cada negocio.
- **LoyalPyME Core (Módulo de Fidelización):**
  - **Autenticación Completa:** Registro Negocio/Admin, Registro Cliente, Login (JWT), Reset Contraseña.
  - **Gestión Clientes (Admin LCo):** CRUD, Filtros, Búsqueda, Ordenación, Acciones Individuales/Masivas, Notas.
  - **Gestión Niveles/Tiers (Admin LCo):** CRUD Niveles, CRUD Beneficios por Nivel, Configuración Global del Sistema de Tiers.
  - **Gestión Recompensas (Admin LCo):** CRUD Recompensas (Puntos), Subida/Recorte 1:1 Imagen (Cloudinary), Soporte Multi-idioma (ES/EN) para nombre y descripción.
  - **Flujo Puntos/QR (LCo):** Generación QR (Admin), Validación QR (Cliente - Manual/Escáner Móvil `html5-qrcode`).
  - **Lógica Tiers Automática (LCo):** Cálculo y asignación/descenso basado en configuración (Backend + Cron).
  - **Panel Cliente (LCo):** Pestañas (Resumen, Recompensas, Actividad), Info Usuario (Puntos, Nivel, Beneficios), Barra Progreso (con Preview Siguiente Nivel), Lista Recompensas/Regalos (con imágenes), Canje Puntos/Regalos, Escáner QR.
  - **Historial de Actividad (Cliente LCo):** Visualización paginada de puntos ganados y canjes.
- **Otros (Plataforma):** Internacionalización (ES/EN), Documentación API (Swagger), Logo Estático, Layout Cabecera Restringido.

## Estado Actual y Próximos Pasos 🗺️

El proyecto ha completado la **Fase 1 (Núcleo Funcional LCo)** y la **implementación base de la gestión multi-módulo y el Panel Super Admin**. La versión actual es **v1.13.0**.

- El desarrollo se centra ahora en el **Módulo "LoyalPyME Camarero"** para hostelería.
- Consulta **[PROJECT_STATUS.md](./PROJECT_STATUS.md)** para ver los **hitos completados en detalle** y los **próximos pasos inmediatos**.
- Consulta **[DEVELOPMENT_PLAN.md](./DEVELOPMENT_PLAN.md)** para ver el **backlog completo** de tareas y las **ideas futuras** detalladas.

## Tecnologías Utilizadas 🛠️

**Frontend:** React, TypeScript, Vite, Mantine UI (v7+), Axios, React Router DOM (v6+), `html5-qrcode`, `react-image-crop`, `i18next`, Zustand (o similar para gestión de estado global si es necesario en el futuro)...
**Backend:** Node.js, Express, TypeScript, Prisma, PostgreSQL, JWT, bcryptjs, Cloudinary, Multer, Vitest, Supertest, Swagger, `node-cron`...

_(Lista detallada y actualizada en [PROJECT_STATUS.md](./PROJECT_STATUS.md))_

## Inicio Rápido (Desarrollo Local) 🚀

1.  Clonar repositorio.
2.  **Backend:** `cd backend && yarn install`, configurar `.env` completo (ver `.env.example`), `npx prisma migrate reset` (borra y recrea la BD), `npx prisma db seed` (para datos demo), `npx ts-node ./scripts/create-superadmin.ts` (para crear el superadmin), ejecutar con `npx tsc --watch` y `npx nodemon dist/index.js`.
3.  **Frontend:** `cd ../frontend && yarn install`, ejecutar con `yarn dev --host`.
4.  **Acceso:**
    - App Clientes/Admin Negocio: `https://localhost:5173`
    - Panel Super Admin: `https://localhost:5173/superadmin` (login con credenciales de `create-superadmin.ts`)
    - Negocio Demo (seed): `admin@demo.com` / `password`
    - Cliente Demo (seed): `cliente@demo.com` / `password`

**¡Importante!** Consulta la **[SETUP_GUIDE.md](./SETUP_GUIDE.md)** para obtener instrucciones **detalladas** y la **[TROUBLESHOOTING_GUIDE.md](./TROUBLESHOOTING_GUIDE.md)** para problemas comunes.

---

## Contribuciones 🤝

¡Contribuciones bienvenidas! Flujo estándar: Fork -> Branch -> Commit -> Push -> Pull Request. Revisa [DEVELOPMENT_PLAN.md](./DEVELOPMENT_PLAN.md) para ver tareas pendientes o proponer nuevas ideas.

## Licencia 📜

Licencia: **MIT**. Ver [`LICENSE`](./LICENSE).
Copyright (c) 2024-2025 Olivier Hottelet

## Contacto 📧

- **Olivier Hottelet**
- olivierhottelet1980@gmail.com
