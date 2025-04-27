# LoyalPyME - Estado del Proyecto y Hoja de Ruta 🧭

**Versión:** 1.1.0 (Post-Refactor & Roadmap Expansion)
**Fecha de Última Actualización:** 27 de Abril de 2025

---

## 1. Resumen del Proyecto 🎯

LoyalPyME es una **plataforma web integral (Frontend + Backend)** diseñada para que las **Pequeñas y Medianas Empresas (PyMEs)** puedan gestionar de forma eficaz y sencilla sus programas de fidelización digital.

- **Propósito Central:** Dotar a las PyMEs de una herramienta completa para crear, operar y gestionar programas de fidelización (puntos, niveles, recompensas), fidelizando clientes y ofreciéndoles beneficios tangibles por su lealtad a través de una experiencia digital simple.
- **Objetivo Técnico:** Ser una solución **robusta, mantenible y escalable**.
- **Visión de Evolución:** Expandirse más allá del núcleo de fidelización para incluir:
  - Herramientas de **comunicación** directa (email, publicaciones, chat).
  - Capacidades de **CRM ligero** y análisis avanzado.
  - Una **aplicación móvil nativa**.
  - Potencialmente: Ecosistemas de **fidelización compartida** y **funcionalidades sociales** (mapas de actividad, eventos) para sectores específicos (ej: ocio). _(Visión sujeta a refinamiento)_.

---

## 2. Tecnologías Utilizadas 🛠️

- **Frontend:**
  - `React`, `TypeScript`, `Vite`
  - `Mantine UI` (v7+) & Mantine Hooks (`@mantine/hooks`)
  - Gestión de Formularios: `@mantine/form`, `zod`
  - Notificaciones/Modales: `@mantine/notifications`, `@mantine/modals`
  - Peticiones API: `axios` (con instancia interceptora)
  - Routing: `react-router-dom` (v6+)
  - QR: `qrcode.react`, `react-qr-reader`
  - _Entorno Ejecución:_ `localhost:5173` (dev)
- **Backend:**
  - `Node.js`, `Express`, `TypeScript`
  - ORM & Base de Datos: `Prisma`, `PostgreSQL`
  - Autenticación: `jsonwebtoken` (JWT), `bcryptjs` (hashing)
  - Variables de Entorno: `dotenv`
  - Tareas Programadas: `node-cron`
  - Otros: `uuid`, `cors`
  - _Entorno Ejecución:_ `localhost:3000` (dev)
  - _Nota:_ `ts-node`, `ts-node-dev` instalados, pero `yarn dev` presenta problemas actualmente (ver Flujo de Trabajo).

---

## 3. Autenticación y Acceso 🔑

- **Método:** Basado en **JWT (JSON Web Tokens)**.
- **Almacenamiento FE:** Token y datos básicos de usuario en `localStorage`.
- **Peticiones API Protegida:** `axiosInstance` (baseURL: `/api`) añade automáticamente cabecera `Authorization: Bearer <token>`.
- **Validación BE:** Middleware `authenticateToken` valida el token en rutas `/api/*` y adjunta `req.user`.
- **Control de Roles:** Enum `UserRole` y middleware `checkRole` protegen endpoints específicos (ej: solo `BUSINESS_ADMIN`).
- **Rutas Públicas:** Endpoints bajo `/auth/*` (login, register, etc.) se acceden sin token usando `axios` base.
- **Credenciales:** Se utilizan credenciales de prueba en entorno de desarrollo.

---

## 4. Estado Actual (Hitos Completados - Fase 1 Núcleo Operativo) ✅

Se ha completado exitosamente una fase intensiva de **desarrollo del núcleo funcional** y una **refactorización significativa** tanto en frontend como en backend, estableciendo una base sólida y mantenible.

### Refactorización Completada:

- **Backend:** Servicios y Controladores reorganizados por responsabilidad modular (`auth`, `customer` (lógica admin separada), `tiers` (config, crud, benefits, logic), `rewards`, `points`). Validaciones centralizadas en `utils`.
- **Frontend:** Componentes principales refactorizados extrayendo lógica a Hooks (`useLayoutUserData`, `useAdminCustomers`, `useUserProfileData`, `useCustomerRewardsData`) y componentes reutilizables (`AppHeader`, `AdminNavbar`, `CustomerTable`, `UserInfoDisplay`, `RewardList`, `QrValidationSection`, etc.).

### Funcionalidades Verificadas:

- **Autenticación:** Registro (Admin/Cliente), Login (JWT), Recuperación de Contraseña.
- **Sistema de Niveles (Tiers):**
  - Gestión Admin (CRUD completo FE+BE).
  - Configuración Global por Negocio (FE+BE).
  - Lógica Backend (Cálculo automático, CRON para descensos).
  - Gestión de Beneficios por Nivel (CRUD básico FE+BE).
- **Gestión de Recompensas:** CRUD completo para Admin (FE+BE).
- **Flujo de Puntos QR:** Generación QR (Admin FE+BE), Validación QR (Cliente FE+BE) con asignación de puntos, actualización de métricas de usuario y disparo de lógica de Tiers.
- **Paneles Principales:**
  - **Panel Cliente:** Información básica (puntos, nivel), lista y canje de Recompensas y Regalos (`GrantedReward`).
  - **Panel Admin:** Layout general (Header, Sidebar), Logout, Dashboard Overview simple.
- **Gestión de Clientes (Admin):**
  - Listado paginado y ordenable.
  - Búsqueda básica por nombre/email.
  - **Acciones Individuales (FE+BE):**
    - Ver Detalles (Modal con datos completos).
    - Ver/Editar/Guardar Notas de Admin.
    - Ajustar Puntos (Modal).
    - Cambiar Nivel Manualmente (Modal).
    - Marcar/Desmarcar Favorito.
    - Activar/Desactivar Cliente.
    - Asignar Recompensa como Regalo (Modal).
  - **Acciones Masivas (FE+BE):**
    - Selección múltiple de filas.
    - Activar/Desactivar seleccionados.
    - Eliminar seleccionados (con Modal de Confirmación).
    - Ajustar Puntos a seleccionados (con Modal).

### Flujo de Trabajo Backend (Temporal):

- Se utiliza `yarn build && node dist/index.js` para ejecutar cambios debido a problemas persistentes con `yarn dev` (`ts-node-dev`).

---

## 5. Hoja de Ruta y Tareas Pendientes 🗺️

Tras completar el núcleo y la refactorización, el foco se centra en pulir la Fase 1 y planificar la expansión futura.

### ⏳ Fase 1: Pulido y Mejoras (Foco Actual / Pendiente)

- **Funcionalidad Admin Clientes:**
  - Implementar **UI y Lógica Backend para Filtros Completos** (Activo, Favorito, Nivel). _(Pendiente FE+BE)_
  - **Optimizar/Evaluar Búsqueda y Paginación** (Rendimiento DB/Índices?, UI/UX Paginación). _(Pendiente Análisis/Implementación)_
- **💡 Mejoras Experiencia Cliente (Frontend - Sugerencias):**
  - Mostrar **Progreso hacia el Siguiente Nivel** (visual/numérico). _(Idea Pendiente)_
  - Listar claramente los **Beneficios del Nivel** actual y anticipar los del siguiente. _(Idea Pendiente)_
  - (Opcional) Añadir un **Historial Básico de Actividad** (puntos ganados/gastados). _(Idea Pendiente - Req. BE)_
  - (Opcional) Refinar UI de tarjetas de **Recompensas/Regalos** para mayor claridad. _(Idea Pendiente)_
- **💡 Mejoras Backend (Sugerencias):**
  - Reforzar **Validación de Entrada** en API (controllers/middleware, ej: `express-validator` o Zod BE). _(Idea Pendiente)_
  - Usar **Errores HTTP más Específicos** (404, 409, etc.). _(Idea Pendiente)_
  - Revisar uso de **Transacciones Prisma** en operaciones críticas. _(Idea Pendiente - Revisión)_
  - Añadir **Indexación Proactiva** a la Base de Datos (relacionado con optimización paginación). _(Idea Pendiente)_
  - Optimizar Consultas y uso de `select` para minimizar payloads. _(Idea Pendiente - Revisión)_
  - Mejorar **Logging** (estructurado, contextual, ej: Winston/Pino). _(Idea Pendiente)_
  - Reforzar **Gestión de Configuración** (`.env` validation). _(Idea Pendiente)_
  - (Opcional) Implementar **Rate Limiting** básico en endpoints sensibles. _(Idea Pendiente)_
  - (Opcional) Introducir **Registro de Auditoría (`AuditLog`)** básico. _(Idea Pendiente)_
- **💡 Mejoras Experiencia Admin (Frontend - Sugerencias):**
  - Enriquecer **Dashboard Admin** (`AdminOverview`) con Métricas Clave y/o Feed de Actividad. _(Idea Pendiente - Req. BE)_
  - Implementar **Búsqueda/Filtrado de Clientes más avanzado** (Teléfono, Documento, Nivel). _(Idea Pendiente - Req. BE)_
  - Mejorar **Modal de Detalles del Cliente** (ej: acciones rápidas inline). _(Idea Pendiente)_
  - Añadir **Exportación CSV** básica para clientes. _(Idea Pendiente)_
  - Mostrar **Estadísticas de Uso** de Recompensas y Niveles. _(Idea Pendiente - Req. BE)_
  - Añadir más **descripciones/ayudas** en Configuración de Tiers. _(Idea Pendiente)_
  - Revisar consistencia de **Notificaciones y Estados de Carga**. _(Idea Pendiente - Revisión)_
  - Usar **Modales de Confirmación** para acciones críticas/destructivas. _(Idea Pendiente)_
- **Calidad y Mantenimiento:**
  - Realizar **Limpieza General** del código (eliminar código muerto/comentado, TODOs resueltos, `console.log`, centralizar tipos/interfaces en `src/types/`). _(Pendiente)_
  - **Introducir Pruebas Automatizadas (Unitarias, Integración, E2E):** Fundamental para asegurar estabilidad y facilitar crecimiento futuro. _(Pendiente - Alta Prioridad)_
  - ⚙️ Solucionar problema persistente con `yarn dev` (`ts-node-dev`). _(Pendiente - Prioridad DX)_

### 🚀 Hoja de Ruta Futura (Fases de Expansión - Tentativa)

_(Objetivo Fase 2+: 3-6 semanas adicionales tras finalizar Fase 1)_

- **Fase 2 (Expansión Funcional):**
  - **Núcleo Fidelización:** Reglas avanzadas (ej: descuentos %), más tipos de recompensas.
  - **Comunicación y Marketing:** Herramientas web básicas (email segmentado, publicaciones en portal).
  - **Segmentación y CRM Ligero:** Segmentación avanzada de clientes, acciones masivas complejas, inicio de análisis básico (valor cliente, frecuencia).
  - **(Backend)** Implementar Audit Log si no se hizo antes.
- **Fase 3 (App Móvil y Análisis Avanzado):**
  - **Aplicación Móvil Nativa:** Desarrollo app Clientes (ver estado, escanear QR, canjear, notificaciones push). Posible versión Admin.
  - **Análisis y CRM Avanzado:** Funcionalidades CRM más completas, reportes avanzados.
- **Fase 4 (Ecosistemas y Social - Largo Plazo):**
  - **Ecosistemas Compartidos:** Programas de fidelización entre negocios.
  - **Funcionalidades Sociales:** Mapa de actividad, eventos, chat cliente-negocio, etc. (enfocado sectorialmente).

---

## 6. Estructura del Código (Actualizada) 📁

- **Backend (`backend/src/`):** `index.ts`, `prisma/`, `middleware/`, `utils/`, `routes/` (auth, customer, admin, points, rewards, tiers, protected), Módulos (`auth/`, `customer/`, `admin/`, `points/`, `rewards/`, `tiers/`).
- **Frontend (`frontend/src/`):** `main.tsx`, `App.tsx`, `routes/index.tsx`, `services/axiosInstance.ts`, `theme.ts`, `hooks/` (useAdminCustomers, useCustomerRewardsData, etc.), `pages/` (Públicas, Cliente, Admin), `components/` (layout, PrivateRoute, admin, customer). _(Estructura detallada en el código)_.

---

## 7. Flujo de Trabajo Acordado 🤝

1.  Proporcionar este archivo actualizado y `TROUBLESHOOTING_GUIDE.md` (si aplica) al inicio de la sesión.
2.  Continuar con la implementación de las tareas restantes de la **Fase 1 (Pulido y Mejoras)** listadas en la Sección 5.
3.  **IMPORTANTE:** Para modificar archivos existentes, **primero pasar el código completo actual del archivo**.
4.  El asistente devolverá siempre el código **100% completo y limpio** del archivo modificado, con cabecera `// filename:` y `// Version:` actualizada. Un archivo por mensaje.
5.  **Flujo Backend (Temporal):** Usar `yarn build && node dist/index.js` para probar cambios hasta resolver problema `yarn dev`.

---

## 8. Información Adicional ℹ️

- Backend usa `.env` para `DATABASE_URL`, `JWT_SECRET`.
- Frontend usa `@mantine/modals`, requiere `ModalsProvider` en `main.tsx`.
- Licencia del Proyecto: **AGPL v3.0**.

---

## 9. Próximo Paso 👉

Elegir la siguiente tarea de la lista actualizada de **"Fase 1 - Pulido y Mejoras"** (Sección 5) para comenzar la implementación (ej: Filtros Clientes, Pruebas, Limpieza, etc.).
