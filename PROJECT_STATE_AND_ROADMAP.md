# LoyalPyME - Estado del Proyecto y Hoja de Ruta 🧭

**Versión:** 1.6.1 (Backend Testing Setup & Frontend i18n Completed)
**Fecha de Última Actualización:** 29 de Abril de 2025

---

## 1. Resumen del Proyecto 🎯

LoyalPyME es una **plataforma web integral (Frontend + Backend)** diseñada para que las **Pequeñas y Medianas Empresas (PyMEs)** puedan gestionar de forma eficaz y sencilla sus propios programas de fidelización digital.

- **Propósito Central:** Dotar a las PyMEs de una herramienta completa para crear, operar y gestionar programas de fidelización (puntos, niveles, recompensas), fidelizando clientes y ofreciéndoles beneficios tangibles por su lealtad a través de una experiencia digital simple.
- **Objetivo Técnico:** Ser una solución **robusta, mantenible y escalable**.
- **Visión de Evolución:** Expandirse más allá del núcleo de fidelización para incluir herramientas de **comunicación**, **CRM ligero**, **análisis**, una **app móvil nativa**, y potencialmente **ecosistemas compartidos** y **funcionalidades sociales**. _(Visión sujeta a refinamiento)_.

---

## 2. Tecnologías Utilizadas 🛠️

- **Frontend:** `React`, `TypeScript`, `Vite`, `Mantine UI` (v7+), `@mantine/hooks`, `@mantine/form`, `zod`, `@mantine/notifications`, `@mantine/modals`, `axios`, `react-router-dom` (v6+), `qrcode.react`, `html5-qrcode`, `i18next`, `react-i18next`, `i18next-http-backend`, `i18next-browser-languagedetector`, `react-country-flag`, (`vite-plugin-mkcert` para dev HTTPS).
- **Backend:** `Node.js`, `Express`, `TypeScript`, `Prisma`, `PostgreSQL`, `jsonwebtoken`, `bcryptjs`, `dotenv`, `node-cron`, `uuid`, `cors`, `date-fns`, `vitest`, `@vitest/coverage-v8`, `supertest`.
- **Entornos:** FE en `localhost:5173` (o IP local vía `https://` con `--host`), BE en `localhost:3000`.

---

## 3. Autenticación y Acceso 🔑

- Basado en **JWT**. Token y datos básicos usuario en `localStorage`.
- `axiosInstance` (FE) con `baseURL: '/api'` añade token automáticamente. Llamadas públicas usan `axios` base o `axiosInstance` según contexto.
- Middleware `authenticateToken` (BE) aplicado individualmente a rutas `/api/*` protegidas. Middleware `checkRole` para control fino.
- Rutas `/api/auth/*` y `/public/*` son públicas.

---

## 4. Estado Actual (Hitos Completados) ✅

**Fase 1 (Núcleo Operativo) COMPLETADA.**
**Fase 1 Pulido:** Completado (Filtros, Opt. Básica, Limpieza, Workaround DX).
**Fase 2 (Funcionalidades Iniciales):** Internacionalización (i18n) completada. Testing backend iniciado.

- **Plataforma Base:** Frontend + Backend operativos y refactorizados.
- **Autenticación:** Flujo completo funcional y refactorizado.
- **Registro Cliente:** Mejorado con desplegable de negocios.
- **Sistema Niveles:** CRUD Admin Tiers, Configuración negocio, Lógica cálculo/CRON backend completa, Gestión Beneficios básica. _(Código limpio/refactorizado)_
- **Gestión Recompensas:** CRUD Admin completo. _(Código limpio)_
- **Flujo Puntos/QR:** Generación QR Admin, Validación QR Cliente, Escáner QR funcional (`html5-qrcode`). _(Código limpio)_
- **Paneles Usuario:** Panel Cliente (Info, Canjes), Panel Admin (Layout, Overview). _(Código limpio)_
- **Gestión Clientes Admin:** Listado (Paginado, Ordenable, Búsqueda, Filtros Completos), Acciones Individuales, Modal Detalles (Notas Editables), Acciones Masivas. _(Código limpio)_
- **Entorno Dev:** Configurado para testing móvil. Workaround Backend DX aplicado.
- **Testing Backend (Setup Inicial):**
  - Añadidas dependencias: `vitest`, `supertest`.
  - Configurados scripts `test`.
  - Creados tests unitarios iniciales (Auth helpers, Tier logic helpers). **(18 tests OK)**
  - Creados tests de integración iniciales (Auth, Points, Rewards, Tiers). **(34 tests OK)**
  - Refactorizados servicios/controladores para testabilidad (DI).
- **Internacionalización (i18n) Frontend:** **¡COMPLETADA!**
  - Añadidas dependencias (`i18next`, `react-i18next`, plugins).
  - Creado y configurado `i18n.ts`.
  * Integrado en `main.tsx` con `React.Suspense`.
  * Creados archivos `es/translation.json` y `en/translation.json` con claves para toda la UI.
  * Refactorizadas **todas** las páginas y componentes relevantes para usar `useTranslation`.
  * Implementado selector de idioma con banderas en `AppHeader`.
  * Refactorizado layout para mostrar cabecera en páginas públicas (`PublicLayout`).

---

## 5. Hoja de Ruta y Tareas Pendientes 🗺️

### ✅ Fase 1: Pulido y Mejoras Finales (COMPLETADA)

### ✅ Fase 2 (Internacionalización y Expansión Funcional): Parcialmente Completada

- **Internacionalización (i18n):** ~~Implementación completa.~~ **HECHO**
- **Introducir Pruebas Automatizadas:** **EN PROGRESO (Backend Básico OK)**
  - _Backend:_ Tests unitarios y de integración. _(Pendiente: Mayor cobertura, casos complejos, errores específicos)_.
  - _Frontend:_ Tests unitarios, de componente, E2E. **(Pendiente)**
- **Fidelización Avanzada:** Recompensas % descuento, reglas de bonus. _(Pendiente)_
- **Comunicación Básica:** Emails Admin -> Cliente, Anuncios. _(Pendiente)_
- **Segmentación y CRM Ligero:** Segmentos guardados, gráficos básicos, Audit Log. _(Pendiente)_
- **Mejoras Técnicas Pendientes:** Validación Robusta (Zod BE?), Documentación API (Swagger?), Deployment, Logging/Monitoring Avanzado (Sentry?), Optimización DB (Índices?), Tipado Centralizado (paquete `common`?). _(Pendiente)_
- **💡 Mejoras UX Cliente Pendientes:**
  - **Mostrar Beneficios del Nivel Actual en Dashboard Cliente.** _(Pendiente - REQUERIDO AHORA)_
  - Mostrar progreso visual al siguiente nivel (gamificación). _(Opcional)_
  - Mejorar claridad/UI de sección Recompensas/Regalos. _(Opcional)_
  - Historial de actividad de puntos/canjes. _(Opcional)_

### ⏳ Fases Futuras (3+)

- **Fase 3 (App Móvil y Análisis Avanzado):** _(Pendiente)_
- **Fase 4+ (Ecosistemas, Social, Módulos - Largo Plazo):** _(Pendiente)_

---

## 6. Estructura del Código (Actualizada) 📁

- **Backend (`backend/src/`):** `index.ts`, `prisma/`, `middleware/`, `utils/`, `routes/`, Módulos (`auth/` (auth, registration, password-reset), `businesses/`, `customer/`, `admin/` (admin-stats, admin-customer-list, admin-customer-individual, admin-customer-bulk), `points/`, `rewards/`, `tiers/` (tiers, tier-benefit, tier-config, tier-logic, tier-logic.helpers)). **`tests/`** (integration). **`__tests__`** dentro de algunos módulos.
- **Frontend (`frontend/src/`):** `main.tsx`, `App.tsx`, `i18n.ts`, `routes/index.tsx`, `services/`, `theme.ts`, `hooks/`, `pages/` (Públicas, Cliente, Admin), `components/` (layout (incl. **PublicLayout**), PrivateRoute, admin, customer), `types/`. **`public/locales/`** (es, en).

---

## 7. Flujo de Trabajo Acordado 🤝

1.  Proporcionar `PROJECT_STATE_AND_ROADMAP.md` actualizado.
2.  Continuar con las tareas **Pendientes** (Sección 5). **Próxima Tarea Recomendada:** Implementar **Mostrar Beneficios del Nivel Actual en Dashboard Cliente** O añadir más cobertura de tests Backend/Frontend O empezar siguiente funcionalidad (ej: Fidelización Avanzada).
3.  Para modificar archivos: pasar código completo actual.
4.  Asistente devuelve código 100% completo y limpio, un archivo por mensaje (JSON sin comentarios).
5.  Flujo Backend Dev: Usar dos terminales (`tsc --watch` y `nodemon dist/index.js`) + opcional `yarn test:watch`.
6.  Flujo Frontend Dev: `yarn dev --host`.

---

## 8. Información Adicional ℹ️

- Backend usa `.env`.
- Frontend usa `@mantine/*`, `html5-qrcode`, `react-i18next`, `react-country-flag`.
- Licencia: **AGPL v3.0**.

---

## 9. Próximo Paso 👉

Decidir si implementar **Mostrar Beneficios del Nivel Actual en Dashboard Cliente**, continuar mejorando las **pruebas del backend/empezar las del frontend** o si iniciar la siguiente **funcionalidad de la Fase 2** (ej: Fidelización Avanzada).
