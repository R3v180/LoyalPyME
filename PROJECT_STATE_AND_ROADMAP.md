# LoyalPyME - Estado del Proyecto y Hoja de Ruta 🧭

**Versión:** 1.8.0 (Customer Dashboard UX Enhancements Implemented)
**Fecha de Última Actualización:** 30 de Abril de 2025

---

## 1. Resumen del Proyecto 🎯

LoyalPyME es una **plataforma web integral (Frontend + Backend)** diseñada para que las **Pequeñas y Medianas Empresas (PyMEs)** puedan gestionar de forma eficaz y sencilla sus propios programas de fidelización digital.

- **Propósito Central:** Dotar a las PyMEs de una herramienta completa para crear, operar y gestionar programas de fidelización (puntos, niveles, recompensas), fidelizando clientes y ofreciéndoles beneficios tangibles por su lealtad a través de una experiencia digital simple. [cite: 3]
- **Objetivo Técnico:** Ser una solución **robusta, mantenible y escalable**. [cite: 4]
- **Visión de Evolución:** Expandirse más allá del núcleo de fidelización para incluir **personalización visual por negocio**, herramientas de **comunicación**, **CRM ligero**, **análisis**, una **app móvil nativa**, y potentially **ecosistemas compartidos** y **funcionalidades sociales**. [cite: 5] _(Visión sujeta a refinamiento)_.

---

## 2. Tecnologías Utilizadas 🛠️

- **Frontend:** `React`, `TypeScript`, `Vite`, `Mantine UI` (v7+), `@mantine/hooks`, `@mantine/form`, `zod`, `@mantine/notifications`, `@mantine/modals`, `axios`, `react-router-dom` (v6+), `qrcode.react`, `html5-qrcode`, `i18next`, `react-i18next`, `i18next-http-backend`, `i18next-browser-languagedetector`, `react-country-flag`, (`vite-plugin-mkcert` para dev HTTPS). [cite: 6]
- **Backend:** `Node.js`, `Express`, `TypeScript`, `Prisma`, `PostgreSQL`, `jsonwebtoken`, `bcryptjs`, `dotenv`, `node-cron`, `uuid`, `cors`, `date-fns`, `vitest`, `@vitest/coverage-v8`, `supertest`, `swagger-jsdoc`, `swagger-ui-express`. [cite: 7]
- **Entornos:** FE en `localhost:5173` (o IP local vía `https://` con `--host`), BE en `localhost:3000`. [cite: 8]

---

## 3. Autenticación y Acceso 🔑

- Basado en **JWT**. Token y datos básicos usuario en `localStorage`. [cite: 9]
- `axiosInstance` (FE) con `baseURL: '/api'` añade token automáticamente. Llamadas públicas usan `axios` base o `axiosInstance` según contexto. [cite: 10]
- Middleware `authenticateToken` (BE) aplicado individualmente a rutas `/api/*` protegidas (incluye datos de usuario, métricas de tier y beneficios del tier activo). Middleware `checkRole` para control fino. [cite: 11, 32]
- Rutas `/api/auth/*` y `/public/*` son públicas. [cite: 12]
- Documentación interactiva de la API disponible en `/api-docs` en el servidor backend.

---

## 4. Estado Actual (Hitos Completados) ✅

**Fase 1 (Núcleo Operativo): COMPLETADA.**
**Fase 1 Pulido:** Completado (Filtros, Opt. Básica, Limpieza, Workaround DX).
**Fase 2 (Funcionalidades Iniciales):**

- Internacionalización (i18n): **COMPLETADA.**
- Documentación API (Swagger): **IMPLEMENTADA.**
- Testing Backend (Setup Inicial + Cobertura Básica): **EN PROGRESO (18 Unit + 34 Integration OK).** [cite: 22, 23]
- **Mejoras UX Dashboard Cliente:** **IMPLEMENTADO**
  - **Mostrar Beneficios del Nivel Actual:** Integrado en tarjeta de perfil.
  - **Mostrar Progreso Visual al Siguiente Nivel:** Barra de progreso funcional implementada y visible (o mensaje/barra 100% si nivel máximo).
  - **Mostrar Preview Beneficios Siguiente Nivel:** Integrado en tarjeta de perfil (lado a lado con beneficios actuales en escritorio).
  - **Solución Retraso Actualización Nivel:** Backend devuelve datos actualizados tras validar QR; frontend usa `setUserData` para reflejo inmediato.
  - **Claves i18n Añadidas:** Textos para barra de progreso, nivel máximo, títulos de beneficios, etc.

**(Detalle completo de funcionalidades base completadas en Fase 1/Pulido):**

- Plataforma Base: Frontend + Backend operativos y refactorizados.
- Autenticación: Flujo completo funcional y refactorizado. [cite: 14]
- Registro Cliente: Mejorado con desplegable de negocios.
- Sistema Niveles: CRUD Admin Tiers, Configuración negocio, Lógica cálculo/CRON backend completa, Gestión Beneficios básica. [cite: 15] _(Código limpio/refactorizado)_ [cite: 16]
- Gestión Recompensas: CRUD Admin completo. _(Código limpio)_
- Flujo Puntos/QR: Generación QR Admin, Validación QR Cliente, Escáner QR funcional (`html5-qrcode`). [cite: 17] _(Código limpio)_
- Paneles Usuario: Panel Cliente (Info, Canjes), Panel Admin (Layout, Overview). [cite: 18] _(Código limpio)_
- Gestión Clientes Admin: Listado (Paginado, Ordenable, Búsqueda, Filtros Completos), Acciones Individuales, Modal Detalles (Notas Editables), Acciones Masivas. [cite: 19] _(Código limpio)_
- Entorno Dev: Configurado para testing móvil. Workaround Backend DX aplicado. [cite: 20]

---

## 5. Hoja de Ruta y Tareas Pendientes (Re-priorizado) 🗺️

### ⏳ Fase 2: Personalización y Expansión Funcional (EN PROGRESO)

**PRIORIDAD ALTA:**

1.  **Personalización Negocio - Logo:** **(PENDIENTE)**
    - _Objetivo:_ Permitir a cada negocio tener su logo visible.
    - _Tareas:_ Backend (Schema, Storage?, API), Frontend (Mostrar logo).
2.  **Personalización Negocio - Theming Básico (Opción 2 - CSS Vars/Classes):** **(PENDIENTE)**
    - _Objetivo:_ Permitir apariencias visuales distintas por tipo de negocio.
    - _Tareas:_ Backend (Schema, API), Frontend (CSS Vars/Clases, Lógica carga).
3.  **Mejora UX Cliente - Historial de Actividad:** **(PENDIENTE - Requiere Backend)**
    - _Objetivo:_ Mostrar historial de puntos/canjes al cliente.
    - _Tareas:_ Backend (Nuevos Endpoints), Frontend (Componente historial). [cite: 35]
4.  **Mejora UX Recompensas - Espaciado/Diseño Tarjetas:** **(PENDIENTE - Siguiente visual)**
    - _Objetivo:_ Mejorar legibilidad y preparar para imágenes.
    - _Tareas:_ Frontend (Ajustar `SimpleGrid`/`Card` en `RewardList.tsx`).
5.  **(Técnico) Pruebas Backend - Cobertura Crítica:** **(PENDIENTE - Baja prioridad en esta conversación)**
    - _Tareas:_ Unit tests (points.service, etc.), Integration tests (profile, public-list, completar existentes). [cite: 29]
6.  **(Técnico) Pruebas Frontend - Cobertura Básica:** **(PENDIENTE - Baja prioridad en esta conversación)**
    - _Tareas:_ Hook tests (useUserProfileData, useLayoutUserData), Component tests (simples). [cite: 30]

**PRIORIDAD MEDIA:**

7.  **Fidelización Avanzada:** Recompensas % descuento, reglas de bonus. [cite: 31] _(Pendiente)_
8.  **Comunicación Básica:** Emails Admin -> Cliente, Anuncios. [cite: 31] _(Pendiente)_
9.  **(Técnico) Pruebas Backend - Completar Cobertura:** Unit/Integration restantes. _(Pendiente - Baja prioridad)_
10. **(Técnico) Pruebas Frontend - Completar Cobertura:** Hooks, Componentes (Forms, Modals, etc.), Layouts, Páginas. _(Pendiente - Baja prioridad)_
11. **Mejora UX Cliente - Detalle Beneficios:** Refinar visualización en `UserInfoDisplay.tsx`. _(Opcional)_

**PRIORIDAD BAJA / FUTURO:**

12. **Segmentación y CRM Ligero:** Segmentos guardados, gráficos básicos, Audit Log. [cite: 32] _(Pendiente)_
13. **Mejoras Técnicas Pendientes:** Validación Robusta (Zod BE?), Deployment, Logging/Monitoring Avanzado (Sentry?), Optimización DB (Índices?), Tipado Centralizado (paquete `common`?). [cite: 33] _(Pendientes otras)_
14. **Frontend - E2E Tests:** (Opcional). _(Pendiente)_
15. **Fase 3+ (App Móvil, Análisis Avanzado):** _(Pendiente)_ [cite: 34]
16. **Fase 4+ (Ecosistemas, Social, Módulos - Largo Plazo):** _(Pendiente)_ [cite: 35]

---

## 6. Estructura del Código (Actualizada) 📁

- **Backend (`backend/src/`):** `index.ts` (incluye config Swagger), `prisma/`, `middleware/`, `utils/`, `routes/`, Módulos (`auth/`, `businesses/`, `customer/`, `admin/`, `points/`, `rewards/`, `tiers/`). `tests/` (integration). `__tests__` (unit). [cite: 36]
- **Frontend (`frontend/src/`):** `main.tsx`, `App.tsx`, `i18n.ts`, `routes/index.tsx`, `services/`, `theme.ts`, `hooks/`, `pages/` (Públicas, Cliente, Admin), `components/` (layout, PrivateRoute, admin, customer), `types/`. `public/locales/`. `src/test/setup.ts`. [cite: 37]

---

## 7. Flujo de Trabajo Acordado 🤝

1.  Revisar `PROJECT_STATE_AND_ROADMAP.md` actualizado. [cite: 38]
2.  Continuar con las tareas **Pendientes** priorizadas (Sección 5). **Próxima Tarea Propuesta:** Mejorar espaciado/diseño de tarjetas de recompensa (`RewardList.tsx`).
3.  Para modificar archivos: usar contexto reciente o solicitar si ha pasado tiempo.
4.  Asistente devuelve código 100% completo y limpio, un archivo por mensaje, indicando nombre/ruta y versión (excepto para JSON). [cite: 40]
5.  Flujo Backend Dev: Usar dos terminales (`tsc --watch` y `nodemon dist/index.js`). [cite: 41]
6.  Flujo Frontend Dev: `yarn dev --host`. [cite: 41]

---

## 8. Información Adicional ℹ️

- Backend usa `.env`. [cite: 42]
- Frontend usa `@mantine/*`, `html5-qrcode`, `react-i18next`, `react-country-flag`. [cite: 42]
- Licencia: **AGPL v3.0**. [cite: 43]

---

## 9. Próximo Paso 👉

Continuar con las mejoras visuales: **Ajustar espaciado/diseño de las tarjetas de recompensa** en `RewardList.tsx`.
