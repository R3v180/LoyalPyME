# LoyalPyME - Estado del Proyecto y Hoja de Ruta 🧭

**Versión:** 1.4.0 (Post-Cleanup & Refactoring)
**Fecha de Última Actualización:** 29 de Abril de 2025

---

## 1. Resumen del Proyecto 🎯

LoyalPyME es una **plataforma web integral (Frontend + Backend)** diseñada para que las **Pequeñas y Medianas Empresas (PyMEs)** puedan gestionar de forma eficaz y sencilla sus propios programas de fidelización digital.

- **Propósito Central:** Dotar a las PyMEs de una herramienta completa para crear, operar y gestionar programas de fidelización (puntos, niveles, recompensas), fidelizando clientes y ofreciéndoles beneficios tangibles por su lealtad a través de una experiencia digital simple.
- **Objetivo Técnico:** Ser una solución **robusta, mantenible y escalable**.
- **Visión de Evolución:** Expandirse más allá del núcleo de fidelización para incluir herramientas de **comunicación**, **CRM ligero**, **análisis**, una **app móvil nativa**, y potencialmente **ecosistemas compartidos** y **funcionalidades sociales**. _(Visión sujeta a refinamiento)_.

---

## 2. Tecnologías Utilizadas 🛠️

_(Sin cambios respecto a v1.3.0 - sección se mantiene igual)_

- **Frontend:** `React`, `TypeScript`, `Vite`, `Mantine UI` (v7+), `@mantine/hooks`, `@mantine/form`, `zod`, `@mantine/notifications`, `@mantine/modals`, `axios`, `react-router-dom` (v6+), `qrcode.react`, `html5-qrcode`, (`vite-plugin-mkcert` para dev HTTPS).
- **Backend:** `Node.js`, `Express`, `TypeScript`, `Prisma`, `PostgreSQL`, `jsonwebtoken`, `bcryptjs`, `dotenv`, `node-cron`, `uuid`, `cors`, `date-fns`.
- **Entornos:** FE en `localhost:5173` (o IP local vía `https://` con `--host`), BE en `localhost:3000`.

---

## 3. Autenticación y Acceso 🔑

_(Sin cambios respecto a v1.3.0 - sección se mantiene igual)_

- Basado en **JWT**. Token y datos básicos usuario en `localStorage`.
- `axiosInstance` (FE) con `baseURL: '/api'` añade token automáticamente. Llamadas públicas usan `axios` base y URL completa o rutas relativas a `/public` vía proxy.
- Middleware `authenticateToken` (BE) aplicado individualmente a rutas `/api/*` protegidas. Middleware `checkRole` para control fino.
- Rutas `/api/auth/*` y `/public/*` son públicas (no requieren token).

---

## 4. Estado Actual (Hitos Completados) ✅

**¡Fase 1 (Núcleo Operativo) COMPLETADA (excepto Pruebas)!** Se realizó limpieza de código y refactorización.

- **Plataforma Base:** Frontend + Backend operativos y refactorizados.
- **Autenticación:** Flujo completo (Registro Negocio/Cliente, Login, Recuperación Pass) funcional. _(Servicios/Controladores refactorizados)_
- **Registro Cliente:** Mejorado con desplegable de negocios disponibles.
- **Sistema Niveles:** CRUD Admin Tiers, Configuración negocio, Lógica cálculo/CRON backend completa, Gestión Beneficios básica. _(Código limpio/refactorizado)_

* **Gestión Recompensas:** CRUD Admin completo. _(Código limpio)_
* **Flujo Puntos/QR:** Generación QR Admin, Validación QR Cliente (asigna puntos, actualiza métricas, trigger nivel), Escáner QR funcional en móvil (usando `html5-qrcode`). _(Código limpio, hook `useQrScanner` extraído)_
* **Paneles Usuario:** Panel Cliente (Info, Canjes), Panel Admin (Layout, Overview con Stat Cards + Tendencias). _(Código limpio, hooks `useAdminOverviewStats`, `useAdminRewards`, `useLayoutUserData` refactorizados/limpios)_
* **Gestión Clientes Admin:** Listado (Paginado, Ordenable, Búsqueda, **Filtros: DONE**), Acciones Individuales, Modal Detalles (Notas Editables), Acciones Masivas. _(Código limpio, Servicios/Controladores refactorizados, hook `useAdminCustomersData` limpio)_
* **Entorno Dev:** Configurado para testing móvil. **Workaround Backend DX aplicado** (Dos terminales).

---

## 5. Hoja de Ruta y Tareas Pendientes 🗺️

### ✅ Fase 1: Pulido y Mejoras Finales (COMPLETADA - Excepto Tests)

- **Funcionalidad Admin Clientes:**
  - ~~Implementar Filtros Completos (UI + Backend)~~ **DONE**
  - ~~Optimizar/Evaluar Búsqueda y Paginación~~ **DONE (Básico)** _(Optimización profunda pendiente si es necesario)_
- **Calidad y Mantenimiento:**
  - **Introducir Pruebas Automatizadas:** **(Alta Prioridad - PENDIENTE)**
    - _Backend:_ Tests unitarios (Jest/Vitest), Tests de integración (Supertest).
    - _Frontend:_ Tests unitarios (Vitest/RTL), Tests de componente (Vitest/RTL), (Opcional) Tests E2E (Cypress/Playwright).
  - ~~Limpieza General (Logs, Comments, Encoding, Refactors)~~ **DONE**
  - ~~⚙️ Solucionar `yarn dev` Backend~~ **Workaround Aplicado (Dos Terminales)** _(Fix real de `ts-node` sigue pendiente/descartado por ahora)_
- **💡 Mejoras Sugeridas Fase 1 (Postpuestas/Opcionales):**
  - _(Mantenidas de la versión anterior, a reevaluar)_

### 🚀 Hoja de Ruta Futura (Fases de Expansión - Próximos Pasos)

- **Fase 2 (Internacionalización y Expansión Funcional):**
  - **Internacionalización (i18n - ¡Próxima Tarea Prioritaria Funcional!):**
    - Instalar y configurar `i18next` / `react-i18next`.
    - Crear archivos de traducción (`es.json`, `en.json`).
    - Refactorizar componentes/páginas con texto para usar `useTranslation`.
    * Añadir UI para cambio de idioma. _(PENDIENTE)_
  - **Fidelización Avanzada:** Recompensas % descuento, reglas de bonus. _(PENDIENTE)_
  - **Comunicación Básica:** Emails Admin -> Cliente, Anuncios. _(PENDIENTE)_
  - **Segmentación y CRM Ligero:** Segmentos guardados, gráficos básicos, Audit Log. _(PENDIENTE)_
  - **Mejoras Técnicas Pendientes:** Validación Robusta (Zod BE?), Documentación API (Swagger?), Deployment, Logging/Monitoring Avanzado (Sentry?), Optimización DB (Índices?), Tipado Centralizado (paquete `common`?). _(PENDIENTE)_
- **Fase 3 (App Móvil y Análisis Avanzado):** _(PENDIENTE)_
- **Fase 4+ (Ecosistemas, Social, Módulos - Largo Plazo):** _(PENDIENTE)_

---

## 6. Estructura del Código (Actualizada) 📁

- **Backend (`backend/src/`):** `index.ts`, `prisma/`, `middleware/`, `utils/`, `routes/` (auth, businesses, customer, admin, points, rewards, tiers, protected), Módulos (`auth/` (auth, registration, password-reset), `businesses/`, `customer/`, `admin/` (admin-stats, admin-customer-list, admin-customer-individual, admin-customer-bulk), `points/`, `rewards/`, `tiers/` (tiers, tier-benefit, tier-config, tier-logic, tier-logic.helpers)).
- **Frontend (`frontend/src/`):** `main.tsx`, `App.tsx`, `routes/index.tsx`, `services/` (axiosInstance, adminService, businessService), `theme.ts`, `hooks/` (useAdminCustomersData, useCustomerProfile, useCustomerRewardsData, useLayoutUserData, useAdminOverviewStats, useAdminRewards, useQrScanner), `pages/` (Públicas, Cliente, Admin (incl. `tiers/`)), `components/` (layout, PrivateRoute, admin (incl. `tiers/`), customer, AddRewardForm, GenerateQrCode), `types/`.

---

## 7. Flujo de Trabajo Acordado 🤝

1.  Proporcionar `PROJECT_STATE_AND_ROADMAP.md` actualizado al inicio.
2.  Continuar con las tareas **Pendientes** (Sección 5). **Próxima Tarea Recomendada: Pruebas Automatizadas (Técnica) o Internacionalización (Funcional).**
3.  Para modificar archivos: pasar código completo actual.
4.  Asistente devuelve código 100% completo y limpio, un archivo por mensaje (si hay cambios).
5.  **Flujo Backend Dev:** Usar **dos terminales**: `npx tsc --watch` y `npx nodemon dist/index.js`.
6.  Flujo Frontend Dev: `yarn dev --host` para pruebas en red local/móvil.

---

## 8. Información Adicional ℹ️

_(Sin cambios respecto a v1.3.0 - sección se mantiene igual)_

- Backend usa `.env` (`DATABASE_URL`, `JWT_SECRET`). Recomendado `.env.example`.
- Frontend usa `@mantine/*`, `html5-qrcode`.
- Licencia: **AGPL v3.0**.

---

## 9. Próximo Paso 👉

Decidir si abordar **Pruebas Automatizadas** o **Internacionalización (i18n)**.
