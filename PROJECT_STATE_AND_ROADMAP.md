# LoyalPyME - Estado del Proyecto y Hoja de Ruta 🧭

**Versión:** 1.6.2 (Revisión Post-Swagger y Planificación UX)
**Fecha de Última Actualización:** 30 de Abril de 2025

---

## 1. Resumen del Proyecto 🎯

LoyalPyME es una **plataforma web integral (Frontend + Backend)** diseñada para que las **Pequeñas y Medianas Empresas (PyMEs)** puedan gestionar de forma eficaz y sencilla sus propios programas de fidelización digital.

- **Propósito Central:** Dotar a las PyMEs de una herramienta completa para crear, operar y gestionar programas de fidelización (puntos, niveles, recompensas), fidelizando clientes y ofreciéndoles beneficios tangibles por su lealtad a través de una experiencia digital simple.
- **Objetivo Técnico:** Ser una solución **robusta, mantenible y escalable**.
- **Visión de Evolución:** Expandirse más allá del núcleo de fidelización para incluir **personalización visual por negocio**, herramientas de **comunicación**, **CRM ligero**, **análisis**, una **app móvil nativa**, y potencialmente **ecosistemas compartidos** y **funcionalidades sociales**. _(Visión sujeta a refinamiento)_.

---

## 2. Tecnologías Utilizadas 🛠️

- **Frontend:** `React`, `TypeScript`, `Vite`, `Mantine UI` (v7+), `@mantine/hooks`, `@mantine/form`, `zod`, `@mantine/notifications`, `@mantine/modals`, `axios`, `react-router-dom` (v6+), `qrcode.react`, `html5-qrcode`, `i18next`, `react-i18next`, `i18next-http-backend`, `i18next-browser-languagedetector`, `react-country-flag`, (`vite-plugin-mkcert` para dev HTTPS).
- **Backend:** `Node.js`, `Express`, `TypeScript`, `Prisma`, `PostgreSQL`, `jsonwebtoken`, `bcryptjs`, `dotenv`, `node-cron`, `uuid`, `cors`, `date-fns`, `vitest`, `@vitest/coverage-v8`, `supertest`, `swagger-jsdoc`, `swagger-ui-express`.
- **Entornos:** FE en `localhost:5173` (o IP local vía `https://` con `--host`), BE en `localhost:3000`.

---

## 3. Autenticación y Acceso 🔑

- Basado en **JWT**. Token y datos básicos usuario en `localStorage`.
- `axiosInstance` (FE) con `baseURL: '/api'` añade token automáticamente. Llamadas públicas usan `axios` base o `axiosInstance` según contexto.
- Middleware `authenticateToken` (BE) aplicado individualmente a rutas `/api/*` protegidas (incluye datos de usuario y beneficios del tier activo). Middleware `checkRole` para control fino.
- Rutas `/api/auth/*` y `/public/*` son públicas.
- Documentación interactiva de la API disponible en `/api-docs` en el servidor backend.

---

## 4. Estado Actual (Hitos Completados) ✅

**Fase 1 (Núcleo Operativo): COMPLETADA.**
**Fase 1 Pulido:** Completado (Filtros, Opt. Básica, Limpieza, Workaround DX).
**Fase 2 (Funcionalidades Iniciales):**

- Internacionalización (i18n): **COMPLETADA.**
- Documentación API (Swagger): **IMPLEMENTADA.**
- Testing Backend (Setup Inicial + Cobertura Básica): **EN PROGRESO (18 Unit + 34 Integration OK).**
- **Mostrar Beneficios del Nivel Actual en Dashboard Cliente:** **IMPLEMENTADO** (Backend modificado para incluir beneficios, Tipos FE actualizados, Componente FE creado y mostrado).

_**(Detalle de funcionalidades base completadas omitido por brevedad, ver versión anterior si es necesario)**_

---

## 5. Hoja de Ruta y Tareas Pendientes (Re-priorizado) 🗺️

### ⏳ Fase 2: Mejoras UX, Personalización y Expansión Funcional (EN PROGRESO)

**PRIORIDAD MÁXIMA:**

1.  **Mejora UX Cliente - Barra de Progreso Visual:** **(PENDIENTE)**
    - _Objetivo:_ Mostrar barra de progreso hacia el siguiente nivel en `CustomerDashboardPage`.
    - _Tareas:_
      - Backend: Modificar `auth.middleware.ts` para incluir `totalSpend`/`totalVisits`. Crear endpoint `GET /api/customer/business-config` para obtener `tierCalculationBasis`.
      - Frontend: Crear hook `useCustomerTierData` para obtener todos los tiers y la config del negocio. Implementar lógica de cálculo y componente `Progress` en `CustomerDashboardPage`.
2.  **(Técnico) Pruebas Backend - Cobertura Crítica:** **(PENDIENTE - Baja prioridad en esta conversación)**
    - _Objetivo:_ Asegurar robustez de lógica clave.
    - _Tareas:_ Tests unitarios para `points.service`, `registration.service`, `password-reset.service`. Tests de integración básicos para endpoints críticos (`profile`, `public-list`, etc.). Completar tests existentes (`points`, `rewards`, `tiers` - CRUD básico).

**PRIORIDAD ALTA:**

3.  **Mejora UX Cliente - Avance Beneficios Siguiente Nivel:** **(PENDIENTE)**
    - _Objetivo:_ Mostrar preview de beneficios del siguiente nivel en `CustomerDashboardPage`.
    - _Tareas:_ Usar datos del hook `useCustomerTierData` (creado en Tarea 1). Implementar UI en `CustomerDashboardPage`.
4.  **Personalización Negocio - Logo:** **(PENDIENTE)**
    - _Objetivo:_ Permitir a cada negocio tener su logo visible.
    - _Tareas:_
      - Backend: Añadir `logoUrl` a `Business` (Prisma). Crear endpoint subida logo (requiere storage). Modificar API para devolver `logoUrl`.
      - Frontend: Mostrar logo en `AppHeader` / `CustomerDashboardPage`.
5.  **Personalización Negocio - Theming Básico (Opción 2):** **(PENDIENTE)**
    - _Objetivo:_ Permitir apariencias visuales distintas por tipo de negocio (bar, tienda...).
    - _Tareas:_
      - Backend: Añadir `themeTemplate` a `Business` (Prisma). Modificar API.
      - Frontend: Definir variables CSS para plantillas. Añadir lógica para aplicar clase CSS (ej: `theme-bar`) al `body`. Ajustar CSS/`theme.ts`.
6.  **(Técnico) Pruebas Frontend - Cobertura Básica:** **(PENDIENTE - Baja prioridad en esta conversación)**
    - _Objetivo:_ Asegurar funcionamiento de hooks y componentes base.
    - _Tareas:_ Tests unitarios para hooks (`useUserProfileData`, `useLayoutUserData`). Tests RTL para componentes simples (`GenerateQrCode`, `UserInfoDisplay`, `TierBenefitsDisplay`).

**PRIORIDAD MEDIA:**

7.  **Mejora UX Cliente - Historial de Actividad:** **(PENDIENTE)**
    - _Objetivo:_ Mostrar historial de puntos/canjes al cliente.
    - _Tareas:_
      - Backend: Crear nuevos endpoints para obtener historial (consultando `QrCode`, `GrantedReward`, etc.).
      - Frontend: Implementar vista de historial en `CustomerDashboardPage`.
8.  **Fidelización Avanzada:** Recompensas % descuento, reglas de bonus. _(Pendiente)_
9.  **Comunicación Básica:** Emails Admin -> Cliente, Anuncios. _(Pendiente)_
10. **(Técnico) Pruebas Backend - Completar Cobertura:** Tests unitarios e integración restantes (admin, tiers, benefits, config, errores). _(Pendiente - Baja prioridad en esta conversación)_
11. **(Técnico) Pruebas Frontend - Completar Cobertura:** Hooks restantes, Componentes (Formularios, Tablas, Modales, Complejos), Layouts, Páginas (render básico). _(Pendiente - Baja prioridad en esta conversación)_
12. **Mejora UX Cliente - Detalle Beneficios:** Refinar visualización en `TierBenefitsDisplay.tsx`. _(Opcional)_
13. **Mejora UX Cliente - Claridad Recompensas/Regalos:** Mejorar UI sección en `CustomerDashboardPage`. _(Opcional)_

**PRIORIDAD BAJA / FUTURO:**

14. **Segmentación y CRM Ligero:** Segmentos guardados, gráficos básicos, Audit Log. _(Pendiente)_
15. **Mejoras Técnicas Pendientes:** Validación Robusta (Zod BE?), ~~Documentación API (Swagger?)~~ **HECHO**, Deployment, Logging/Monitoring Avanzado (Sentry?), Optimización DB (Índices?), Tipado Centralizado (paquete `common`?). _(Pendientes otras)_
16. **Frontend - E2E Tests:** (Opcional). _(Pendiente)_
17. **Fase 3+ (App Móvil, Análisis Avanzado):** _(Pendiente)_
18. **Fase 4+ (Ecosistemas, Social, Módulos - Largo Plazo):** _(Pendiente)_

---

## 6. Estructura del Código (Actualizada) 📁

- **Backend (`backend/src/`):** `index.ts` (incluye configuración y definiciones Swagger), `prisma/`, `middleware/`, `utils/`, `routes/`, Módulos (`auth/` (auth, registration, password-reset), `businesses/`, `customer/`, `admin/` (admin-stats, admin-customer-list, admin-customer-individual, admin-customer-bulk), `points/`, `rewards/`, `tiers/` (tiers, tier-benefit, tier-config, tier-logic, tier-logic.helpers)). **`tests/`** (integration). **`__tests__`** dentro de algunos módulos.
- **Frontend (`frontend/src/`):** `main.tsx`, `App.tsx`, `i18n.ts`, `routes/index.tsx`, `services/`, `theme.ts`, `hooks/`, `pages/` (Públicas, Cliente, Admin), `components/` (layout (incl. **PublicLayout**), PrivateRoute, admin, customer (incl. **TierBenefitsDisplay**)), `types/`. **`public/locales/`** (es, en). **`src/test/setup.ts`**.

---

## 7. Flujo de Trabajo Acordado 🤝

1.  Revisar `PROJECT_STATE_AND_ROADMAP.md` actualizado.
2.  Continuar con las tareas **Pendientes** priorizadas (Sección 5). **Próxima Tarea Propuesta:** Empezar **Mejora UX Cliente - Barra de Progreso Visual**.
3.  Para modificar archivos: pasar código completo actual.
4.  Asistente devuelve código 100% completo y limpio, **un archivo por mensaje**, indicando nombre/ruta y versión.
5.  Flujo Backend Dev: Usar dos terminales (`tsc --watch` y `nodemon dist/index.js`) + opcional `yarn test:watch`.
6.  Flujo Frontend Dev: `yarn dev --host`.

---

## 8. Información Adicional ℹ️

- Backend usa `.env`.
- Frontend usa `@mantine/*`, `html5-qrcode`, `react-i18next`, `react-country-flag`.
- Licencia: **AGPL v3.0**.

---

## 9. Próximo Paso 👉

Iniciar la implementación de la **Barra de Progreso Visual** (Tarea #1 en Prioridad Máxima). Empezaremos por las modificaciones necesarias en el backend.
