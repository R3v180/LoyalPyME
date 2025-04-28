# LoyalPyME - Estado del Proyecto y Hoja de Ruta 🧭

**Versión:** 1.3.0 (Roadmap Detallado Post-Fase 1 Core)
**Fecha de Última Actualización:** 28 de Abril de 2025

---

## 1. Resumen del Proyecto 🎯

LoyalPyME es una **plataforma web integral (Frontend + Backend)** diseñada para que las **Pequeñas y Medianas Empresas (PyMEs)** puedan gestionar de forma eficaz y sencilla sus propios programas de fidelización digital.

- **Propósito Central:** Dotar a las PyMEs de una herramienta completa para crear, operar y gestionar programas de fidelización (puntos, niveles, recompensas), fidelizando clientes y ofreciéndoles beneficios tangibles por su lealtad a través de una experiencia digital simple.
- **Objetivo Técnico:** Ser una solución **robusta, mantenible y escalable**.
- **Visión de Evolución:** Expandirse más allá del núcleo de fidelización para incluir herramientas de **comunicación**, **CRM ligero**, **análisis**, una **app móvil nativa**, y potencialmente **ecosistemas compartidos** y **funcionalidades sociales**. _(Visión sujeta a refinamiento)_.

---

## 2. Tecnologías Utilizadas 🛠️

- **Frontend:** `React`, `TypeScript`, `Vite`, `Mantine UI` (v7+), `@mantine/hooks`, `@mantine/form`, `zod`, `@mantine/notifications`, `@mantine/modals`, `axios`, `react-router-dom` (v6+), `qrcode.react`, `html5-qrcode`, (`vite-plugin-mkcert` para dev HTTPS).
- **Backend:** `Node.js`, `Express`, `TypeScript`, `Prisma`, `PostgreSQL`, `jsonwebtoken`, `bcryptjs`, `dotenv`, `node-cron`, `uuid`, `cors`, `date-fns`.
- **Entornos:** FE en `localhost:5173` (o IP local vía `https://` con `--host`), BE en `localhost:3000`.

---

## 3. Autenticación y Acceso 🔑

- Basado en **JWT**. Token y datos básicos usuario en `localStorage`.
- `axiosInstance` (FE) con `baseURL: '/api'` añade token automáticamente. Llamadas públicas usan `axios` base y URL completa o rutas relativas a `/public` vía proxy.
- Middleware `authenticateToken` (BE) aplicado individualmente a rutas `/api/*` protegidas. Middleware `checkRole` para control fino.
- Rutas `/api/auth/*` y `/public/*` son públicas (no requieren token).

---

## 4. Estado Actual (Hitos Completados) ✅

Finalizada Fase 1 (Núcleo Operativo) y Refactorización Mayor. Implementadas Mejoras Clave y Corregidos Bugs Críticos.

- **Plataforma Base:** Frontend + Backend operativos y refactorizados.
- **Autenticación:** Flujo completo (Registro Negocio/Cliente, Login, Recuperación Pass) funcional.
- **Registro Cliente:** Mejorado con desplegable de negocios disponibles (vía API pública).
- **Sistema Niveles:** CRUD Admin Tiers, Configuración negocio, Lógica cálculo/CRON backend completa, Gestión Beneficios básica.
- **Gestión Recompensas:** CRUD Admin completo.
- **Flujo Puntos/QR:** Generación QR Admin, Validación QR Cliente (asigna puntos, actualiza métricas, trigger nivel), **Escáner QR funcional en móvil** (HTTPS + `html5-qrcode`).
- **Paneles Usuario:** Panel Cliente (Info, Canjes), Panel Admin (Layout, Overview **con Stat Cards + Tendencias**).
- **Gestión Clientes Admin:** Listado (Paginado, Ordenable, Búsqueda básica), Acciones Individuales (Detalles, Notas, Puntos, Nivel, Fav, Status, Regalo), Acciones Masivas (Status, Delete, Puntos).
- **Entorno Dev:** Configurado y probado para **testing en móvil** vía IP local (Vite host+proxy, Firewall).

---

## 5. Hoja de Ruta y Tareas Pendientes 🗺️

### ⏳ Fase 1: Pulido y Mejoras Finales (Pendientes)

- **Funcionalidad Admin Clientes:**
  - **Implementar Filtros Completos (UI + Backend):** Añadir controles (checkbox/select) en `AdminCustomerManagementPage` para filtrar por Estado (Activo/Inactivo), Favorito (Sí/No) y Nivel (Dropdown con Tiers existentes). Conectar con hook `useAdminCustomers` y modificar endpoint/servicio backend (`getCustomersForBusiness`) para aceptar y aplicar estos filtros en la consulta Prisma. _(Pendiente FE+BE)_
  - **Optimizar/Evaluar Búsqueda y Paginación:** Analizar rendimiento actual con volumen de datos simulado. Considerar añadir índices `@@index` en `schema.prisma` para campos de búsqueda/ordenación comunes (`name`, `email`, `points`, `createdAt`, `isActive`, `isFavorite`). Evaluar si la paginación actual necesita pasar a ser server-side o si la UI (`Pagination` de Mantine) requiere mejoras. _(Pendiente Análisis/Implementación)_
- **Calidad y Mantenimiento:**
  - **Introducir Pruebas Automatizadas:** **(Alta Prioridad)** Empezar a escribir tests para asegurar estabilidad y evitar regresiones.
    - _Backend:_ Tests unitarios para lógica crítica (ej: `admin-stats.service`, `tier-logic.service`, `auth.service`) usando Jest/Vitest. Tests de integración para endpoints API clave (ej: login, stats, qr validation) usando Supertest.
    - _Frontend:_ Tests unitarios para hooks con lógica compleja. Tests de componente para UI crítica (`StatCard`, `QrValidationSection`?) usando Vitest/React Testing Library. (Opcional) Tests E2E para flujos principales (login, scan QR) usando Cypress/Playwright. _(Pendiente)_
  - **Limpieza General:** Revisión exhaustiva para eliminar `console.log`, código comentado obsoleto, TODOs resueltos. Centralizar tipos/interfaces compartidos (ej: `Customer`, `Reward`, `Tier`, `UserData`) en `frontend/src/types/`. Mejorar consistencia general del código. _(Pendiente)_
  - ⚙️ **Solucionar `yarn dev` Backend:** Diagnosticar y arreglar el problema con `ts-node-dev` para habilitar hot-reloading eficiente en backend. _(Pendiente - Prioridad DX)_
- **💡 Mejoras Sugeridas (A considerar Post-Fase 1 o si hay tiempo):**
  - _Cliente FE:_ Progreso a siguiente Nivel (gamificación), Listado claro Beneficios (valor percibido), Historial Actividad (transparencia), UI Recompensas/Regalos (claridad), Validar QR desde archivo (conveniencia).
  - _Admin FE:_ Feed Actividad Dashboard (pulso app), Filtros/Búsqueda Avanzada Clientes (segmentación), Mejorar Modal Detalles Cliente (eficiencia), Exportar CSV (utilidad externa), Stats Uso Recompensas/Niveles (insights), Ayudas Config. Tiers (usabilidad), Notificaciones/Carga consistentes (UX), Modales Confirmación (seguridad), Cierre Menú Móvil Admin (UX móvil).
  - _Backend:_ Validación Entrada API robusta (seguridad), Errores HTTP específicos (DX/debug), Revisión Transacciones (integridad), Índices DB (rendimiento), Optimizar `select`s (rendimiento), Logging estructurado (monitorización/debug), Config `.env` validada (seguridad), Rate Limiting (seguridad), Audit Log (trazabilidad).

### 🚀 Hoja de Ruta Futura (Fases de Expansión - Tentativa)

- **Fase 2 (Internacionalización y Expansión Funcional):**
  - **Internacionalización (i18n - ¡Próxima Tarea!):**
    - Instalar y configurar `i18next` con `react-i18next` en el frontend.
    - Crear archivos de traducción (`es.json`, `en.json`) en `public/locales/`.
    - Refactorizar **todos** los componentes/páginas con texto visible para usar el hook `useTranslation` y la función `t()`.
    - Añadir UI (ej: en Header) para permitir al usuario cambiar de idioma.
  - **Fidelización Avanzada:** Implementar lógica para recompensas tipo `% descuento`. Explorar reglas de bonus (ej: puntos extra por cumpleaños, doble puntos en días específicos).
  - **Comunicación Básica:** Herramienta admin para redactar y enviar emails simples (plantillas básicas?) a clientes filtrados (ej: por nivel). Sección simple de "Anuncios" en el portal cliente gestionada por el admin.
  - **Segmentación y CRM Ligero:** Permitir al admin crear y guardar segmentos de clientes basados en criterios (puntos, nivel, fechas, actividad). Aplicar acciones masivas a segmentos. Añadir gráficos básicos al dashboard admin (ej: evolución nº clientes, distribución por nivel). Implementar `AuditLog` en backend si no se hizo.
- **Fase 3 (App Móvil y Análisis Avanzado):**
  - **App Móvil Nativa (React Native?):** Desarrollo app enfocada en cliente (login, perfil, escanear QR, ver/canjear recompensas/regalos, notificaciones push). Evaluar versión simplificada para staff/admin (check-in rápido).
  - **Análisis Avanzado / CRM Extendido:** Módulo de reportes en panel admin (valor cliente, efectividad recompensas, cohortes). Historial de interacciones más completo. Sistema de etiquetado de clientes. Explorar automatizaciones simples (email bienvenida/inactividad).
- **Fase 4 (Ecosistemas, Social y Módulos Avanzados - Largo Plazo):**
  - **Ecosistemas Compartidos:** Definir modelo de negocio/técnico para que varias PyMEs compartan o interconecten programas. APIs y paneles para gestionar asociaciones.
  - **Funcionalidades Sociales:** Explorar mapa de actividad (anonimizada/opcional), calendario de eventos del negocio, posible chat cliente-negocio (evaluar WebSockets vs servicio externo). Enfocar en privacidad y valor real para usuario/negocio.
  - **💡 Módulo Gestión Eventos/Listas:** (Integrado o app separada) Funcionalidad para crear eventos, gestionar listas de invitados, enviar invitaciones digitales con QR, check-in mediante escáner, estadísticas de asistencia.

---

## 6. Estructura del Código (Actualizada) 📁

- **Backend (`backend/src/`):** `index.ts`, `prisma/`, `middleware/`, `utils/`, `routes/` (auth, businesses, customer, admin, points, rewards, tiers, protected), Módulos (`auth/`, `businesses/`, `customer/`, `admin/` (incl. `admin-stats.service/controller`), `points/`, `rewards/`, `tiers/`).
- **Frontend (`frontend/src/`):** `main.tsx`, `App.tsx`, `i18n.ts` (próximo), `routes/index.tsx`, `services/` (axiosInstance, adminService, businessService), `theme.ts`, `hooks/`, `pages/` (Públicas, Cliente, Admin), `components/` (layout, PrivateRoute, admin (incl. `StatCard`), customer), `types/`.

---

## 7. Flujo de Trabajo Acordado 🤝

1.  Proporcionar este archivo actualizado y `TROUBLESHOOTING_GUIDE.md` (si aplica/se crea) al inicio.
2.  Continuar con las tareas **Pendientes** (Sección 5). **Próxima Tarea: Internacionalización (i18n).**
3.  Para modificar archivos: pasar código completo actual (salvo cambios rápidos seguidos).
4.  Asistente devuelve código 100% completo y limpio, un archivo por mensaje.
5.  Flujo Backend: Forzar recompilación limpia si hay dudas (`rm -rf dist && yarn build && node ...`).
6.  Flujo Frontend: Usar `yarn dev --host` para pruebas en red local/móvil.

---

## 8. Información Adicional ℹ️

- Backend usa `.env` (`DATABASE_URL`, `JWT_SECRET`). Recomendado `.env.example`.
- Frontend usa `@mantine/modals` (requiere `ModalsProvider`), `html5-qrcode`.
- Licencia: **AGPL v3.0**.

---

## 9. Próximo Paso 👉

Comenzar con la **Fase 2 - Internacionalización (i18n)**, instalando las librerías `i18next` y relacionadas en el frontend.
