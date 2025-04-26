# LoyalPyME - Estado del Proyecto y Hoja de Ruta

**Fecha de Última Actualización:** 26 de Mayo de 2024

---

## 1. Resumen del Proyecto

**LoyalPyME** es una plataforma web integral (Frontend + Backend) para gestionar programas de fidelización digital para Pequeñas y Medianas Empresas (PyMEs). Su objetivo es ser una solución robusta, mantenible y escalable que permita a los negocios retener clientes y a los clientes disfrutar de beneficios por su lealtad.

**Propósito:** Proporcionar a las PyMEs una herramienta web completa para crear, gestionar y operar un programa de fidelización digital (puntos, niveles, recompensas), y ofrecer a los clientes finales una experiencia digital simple para participar en estos programas.

**Visión de Evolución (Fases Futuras):** LoyalPyME está diseñado para expandirse más allá del núcleo de fidelización, incluyendo herramientas de comunicación (email, publicaciones, chat), análisis avanzado (CRM ligero), una aplicación móvil nativa, y potencialmente la creación de ecosistemas de fidelización compartidos y funcionalidades sociales (mapa de actividad anónima, eventos) para sectores específicos como el ocio.

**Funcionalidad Principal (Fase 1 - Núcleo Operativo Actual):**

- **Negocios (Admins):** Definir niveles (tiers), recompensas; gestionar clientes (ver lista, ajustar puntos, cambiar nivel, marcar favorito, asignar regalos); generar códigos QR para transacciones de puntos.
- **Clientes Finales:** Registrarse; acumular puntos (validando QR); ver su estado (puntos, nivel, beneficios); ver recompensas disponibles (normales y regaladas); canjear recompensas/regalos.

## 2. Tecnologías

- **Frontend:** React, TypeScript, Vite, Mantine UI (v7+), Axios, React Router DOM v6, qrcode.react, react-qr-reader, Zod (para validación de formularios), @mantine/notifications. Corre en localhost:5173.
- **Backend:** Node.js, Express, TypeScript, Prisma, PostgreSQL, JWT para autenticación, bcryptjs, dotenv, node-cron, uuid, cors. Corre en localhost:3000.

## 3. Autenticación y Acceso

- Basada en JWT. Token y datos de usuario (`id`, `role`, `businessId`, `email`, `name`, `points`, `currentTier`) almacenados en localStorage tras login/registro.
- `axiosInstance` (frontend) añade `Authorization: Bearer <token>` a las solicitudes a `/api/*`.
- Middleware `authenticateToken` (backend) valida el token recibido y adjunta `req.user` al objeto Request.
- Roles (`UserRole` enum: `BUSINESS_ADMIN`, `CUSTOMER_FINAL`) y middleware `checkRole` protegen rutas específicas en el backend.
- Rutas Públicas (`/auth/*`) son accesibles sin token y usan `axios` base con la URL completa del backend (`http://localhost:3000/auth/...`).
- Se usan credenciales de prueba para testing (ej. cliente@cafeelsol.com, admin@nombrenegocio.com).

## 4. Estado Actual (Funcionalidades Completadas y Refactorización Backend)

Se han completado y verificado las siguientes funcionalidades, incluyendo la refactorización del backend a un estado funcional para estas características:

- **Registro:** Clientes finales y Negocios (con su administrador inicial). **(Funcional)**
- **Login:** Inicio de sesión para usuarios Admin y Cliente final. **(Funcional)**
- **Recuperación de Contraseña:** Envío (simulado/log en consola) y reseteo de contraseña usando token. **(Funcional)**
- **Sistema de Tiers (Backend Completo):** Incluye la definición de tiers (nombre, nivel, valor mínimo, estado), gestión de beneficios por tier (tipo, valor, descripción, estado), configuración global del sistema de tiers por negocio (habilitar/deshabilitar, base y periodo de cálculo, política de descenso, periodo de inactividad), y un cron job para el procesamiento periódico de tiers. **(Funcional)**
- **Gestión de Recompensas (Admin):** Permite al administrador crear, ver, editar, eliminar y gestionar el estado (activo/inactivo) de las recompensas canjeables por puntos. **(Funcional)**
- **Generación QR (Admin):** El administrador puede generar datos únicos (token) y visualmente un código QR asociado a un importe y número de ticket para que los clientes sumen puntos. **(Funcional)**
- **Validación QR (Cliente):** Los clientes pueden escanear (vía input o cámara) un código QR generado por el negocio. El sistema valida el QR, asigna los puntos correspondientes (considerando multiplicadores de tier), actualiza métricas del cliente (visitas, gasto, puntos totales) y activa el proceso de actualización de su nivel (tier). **(Funcional)**
- **Canjeo de Recompensas (Cliente):**
  - Canjeo de recompensas normales por puntos (verifica puntos suficientes). **(Funcional)**
  - Canjeo de recompensas asignadas como "regalo" (sin coste de puntos). **(Funcional)**
- **Visualización de Recompensas/Regalos (Cliente):** El panel del cliente muestra una lista combinada de recompensas canjeables por puntos y regalos pendientes de canjear. **(Funcional)**
- **Panel Cliente (`CustomerDashboardPage`):** Muestra información básica del usuario (nombre, email), sus puntos actuales y su nivel de fidelización actual. Integra las secciones de validación de QR y visualización/canjeo de recompensas/regalos. **(Funcional)**
- **Panel Admin (`MainLayout` + Rutas Hijas Protegidas):** Provee la estructura básica de layout con cabecera (información de usuario, logout) y una barra lateral de navegación condicional visible solo para administradores en rutas `/admin/dashboard/*`. Las rutas protegidas bajo `/api/*` requieren autenticación JWT y las rutas `/admin/*` requieren rol `BUSINESS_ADMIN` (middleware `checkRole` aplicado en la definición de rutas). **(Funcional)**
- **Gestión Clientes Admin (`AdminCustomerManagementPage`):** Muestra una tabla con la lista de clientes registrados en el negocio del administrador, incluyendo su nombre, email, puntos, nivel actual, fecha de registro, estado activo y estado de favorito. Permite ordenar la lista por varias columnas. Incluye acciones individuales para ajustar puntos, cambiar nivel, asignar una recompensa (regalo) y marcar/desmarcar como favorito para cada cliente. **(Funcional)**
- **Refactorización Backend:** Se ha completado una revisión y refactorización significativa del código backend. Servicios y controladores han sido divididos por responsabilidad (ej. `auth`, `customer`, `tiers` separados). Validaciones comunes movidas a `utils/validation.ts`. La lógica de administrador sobre clientes (`admin-customer.service.ts`, `customer/admin-customer.controller.ts`) fue separada de la lógica general de cliente. La gestión de Tiers fue dividida en controladores y servicios específicos (config, CRUD, beneficios, lógica de cálculo). Archivos `tiers.controller.ts` y `AdminDashboardPage.tsx` identificados como obsoletos y eliminados. La lógica backend para filtros, búsqueda y paginación básica en la gestión de clientes está implementada a nivel de servicio. **(Funcional)**

---

## 5. Hoja de Ruta y Tareas Pendientes

Estamos en la Fase 1, con la base funcional operativa. Los próximos pasos se centran en completar la Fase 1, puliendo la experiencia del administrador y cliente web, y preparando el terreno para futuras expansiones.

**Fase 1: Completando el Núcleo (Refactorización Frontend + Implementación de Características)**

- **Refactorización del Frontend (Prioridad Actual):** Mejorar la estructura, legibilidad y mantenibilidad del código frontend, extrayendo lógica y UI compleja en componentes o hooks más pequeños. **Objetivo: Completar en ~1 semana de trabajo dedicado.**

  - `frontend/src/components/layout/MainLayout.tsx`: Analizar y posiblemente extraer la lógica de carga de datos del usuario y la estructura de navegación/header. (Pendiente Análisis/Refactor)
  - `frontend/src/pages/admin/AdminCustomerManagementPage.tsx`: Analizar y extraer la lógica de gestión de datos (carga, paginación, ordenación, filtros, manejo de modales) en un hook personalizado. Posible extracción de la tabla de clientes en un componente dedicado. (Pendiente Análisis/Refactor)
  - `frontend/src/pages/CustomerDashboardPage.tsx`: (Prioridad Alta) Analizar y refactorizar para extraer hooks de carga y manejo de datos (usuario, recompensas, regalos) y componentes UI para las diferentes secciones (info usuario, validación QR, lista de recompensas/regalos). (Pendiente Análisis/Refactor)
  - `frontend/src/pages/admin/AdminRewardsManagement.tsx`: Analizar y considerar extracción de lógica de datos y la tabla de recompensas. (Pendiente Análisis/Refactor)
  - `frontend/src/pages/admin/tiers/TierManagementPage.tsx`: Analizar y considerar extracción de lógica de datos y la tabla de tiers. (Pendiente Análisis/Refactor)

- **Implementación de Funcionalidades (Fase 1 Restante):**
  - Implementar **Filtros en `AdminCustomerManagementPage`**: Añadir elementos de UI (checkboxes, selects, etc.) en el frontend para permitir al administrador filtrar la lista de clientes por estado Activo y estado de Favorito (y posibles otros criterios básicos). Conectar el estado de estos filtros a la función `fetchCustomers` para enviar los parámetros de filtro (`isFavorite`, `isActive`) al backend. (Pendiente FE)
  - Implementar **Búsqueda y Paginación Reales** en `AdminCustomerManagementPage`: La lógica backend ya es funcional (`getCustomersForBusiness` acepta `search`, `page`, `limit`, `sortBy`, `sortDir`). Asegurar que la UI de búsqueda (`searchTerm`) y paginación (`activePage`) en el frontend se comunica correctamente con el backend enviando los parámetros y maneja los resultados paginados. (Pendiente FE, Verificación/Ajuste BE si necesario)
  - Implementar **Modal "Ver Detalles" / Notas Admin** para clientes: Crear un nuevo endpoint en el backend (ej. `GET /api/admin/customers/:customerId`) para obtener todos los detalles de un cliente (incluyendo campos existentes y un posible nuevo campo `notes`). Crear un componente modal en el frontend para mostrar esta información y un campo editable para que el administrador pueda añadir o modificar notas internas. Implementar la lógica backend y frontend para guardar estas notas. (Pendiente BE+FE)
  - Implementar **Acciones Masivas** en `AdminCustomerManagementPage`: Modificar la UI de la tabla para permitir seleccionar varios clientes (ej. con checkboxes en cada fila). Crear nuevos endpoints en el backend (ej. `POST /api/admin/customers/bulk-assign-reward`, `PATCH /api/admin/customers/bulk-status`) que acepten una lista de IDs de cliente y los datos de la acción. Implementar la lógica frontend para recopilar los IDs seleccionados y llamar a estos nuevos endpoints. (Pendiente BE+FE)
  - Implementar **Acción Activar/Desactivar Cliente Individual**: Crear un nuevo endpoint específico en el backend (ej. `PATCH /api/admin/customers/:customerId/status`) para cambiar el estado `isActive` de un cliente. Integrar un botón o switch en la UI de la tabla de clientes (`AdminCustomerManagementPage.tsx`). (Pendiente BE+FE)
  - **Limpieza General:** Eliminar código comentado, `TODO`s antiguos, logs de depuración excesivos y asegurar la consistencia del código y los mensajes de error/notificación. (Continua a lo largo del desarrollo)

**Fase 2+: Hoja de Ruta Futura (Expansión y Potencial) - Objetivo: 3-6 semanas adicionales después de Fase 1**

- Expansión de reglas de fidelización y tipos de recompensa (ej: descuentos %).
- Herramientas de comunicación y marketing web (email básico, publicaciones en portal).
- Segmentación avanzada y acciones masivas complejas.
- Comenzar análisis básico de clientes.

**Fase 3+ (Largo Plazo):**

- Desarrollo de la aplicación móvil nativa.
- Análisis avanzado y funcionalidades de CRM ligero.
- Implementación de funcionalidades de ecosistema y potencial social (chat, mapa actividad, etc.).

## 6. Estructura del Código (Actualizada)

- **Backend (`backend/src/`):**

  - Punto de entrada: `index.ts`
  - Configuración DB: `prisma/`
  - Middleware: `middleware/auth.middleware.ts`, `middleware/role.middleware.ts`
  - Utilidades: `utils/validation.ts`
  - Rutas: `routes/admin.routes.ts`, `routes/auth.routes.ts`, `routes/customer.routes.ts`, `routes/points.routes.ts`, `routes/protected.routes.ts`, `routes/rewards.routes.ts`, `routes/tiers.routes.ts`
  - Módulos (Servicios y Controladores):
    - `auth/`: `auth.service.ts`, `password-reset.service.ts`, `registration.service.ts`, `auth.controller.ts`, `auth.dto.ts`
    - `customer/`: `customer.controller.ts`, `customer.service.ts` (Lógica de Cliente Final)
    - `admin/`: `admin-customer.service.ts`, `customer/admin-customer.controller.ts` (Lógica Admin Clientes - _Nota: Archivo de controlador ubicado actualmente dentro de `customer/`_)
    - `points/`: `points.controller.ts`, `points.service.ts`
    - `rewards/`: `rewards.controller.ts`, `rewards.service.ts`
    - `tiers/`: `tier-benefit.controller.ts`, `tier-benefit.service.ts`, `tier-config.controller.ts`, `tier-config.service.ts`, `tier-crud.controller.ts`, `tier-logic.service.ts`, `tiers.service.ts`
  - Scripts: `scripts/hash-customer-password.ts`

- **Frontend (`frontend/src/`):**
  - Punto de entrada: `main.tsx`
  - Aplicación principal y rutas: `App.tsx`, `routes/index.tsx`
  - Configuración Mantine: `theme.ts`
  - Servicios: `services/axiosInstance.ts` (Configurado para `/api`)
  - Páginas:
    - Públicas: `pages/LoginPage.tsx`, `pages/RegisterPage.tsx`, `pages/RegisterBusinessPage.tsx`, `pages/ForgotPasswordPage.tsx`, `pages/ResetPasswordPage.tsx`
    - Cliente: `pages/CustomerDashboardPage.tsx`
    - Admin: `pages/admin/AdminOverview.tsx`, `pages/admin/AdminRewardsManagement.tsx`, `pages/admin/AdminGenerateQr.tsx`, `pages/admin/AdminCustomerManagementPage.tsx`
    - Admin Tiers: `pages/admin/tiers/TierManagementPage.tsx`, `pages/admin/tiers/TierSettingsPage.tsx`
  - Componentes:
    - Generales: `components/PrivateRoute.tsx`, `components/AddRewardForm.tsx`, `components/GenerateQrCode.tsx`
    - Layout: `components/layout/MainLayout.tsx`
    - Admin específicos: `components/admin/AdjustPointsModal.tsx`, `components/admin/AssignRewardModal.tsx`, `components/admin/ChangeTierModal.tsx`
    - Admin Tiers específicos: `components/admin/tiers/CreateTierModal.tsx`, `components/admin/tiers/DeleteTierModal.tsx`, `components/admin/tiers/EditTierModal.tsx`, `components/admin/tiers/TierBenefitsModal.tsx`, `components/admin/tiers/TierForm.tsx`, `components/admin/tiers/TierTable.tsx`
    - Cliente específicos: `components/customer/QrValidationSection.tsx`, `components/customer/RewardList.tsx`, `components/customer/UserInfoDisplay.tsx`

## 7. Flujo de Trabajo Acordado

- Al iniciar una nueva conversación, proporcionar el contenido de este archivo (`PROJECT_STATE_AND_ROADMAP.md`) y el `TROUBLESHOOTING_GUIDE.md` (si es relevante), seguido de un prompt corto indicando la tarea de la sesión.
- Continuar con la refactorización del frontend (lista en Sección 5), abordando los archivos anotados.
- Después de la refactorización, implementar las tareas restantes de la Fase 1 (lista en Sección 5).
- Analizar archivos o funcionalidades uno por uno, según se indique o se necesite.
- NO generar código nuevo o refactorizado hasta que se pase el archivo original completo sobre el que aplicar un cambio específico acordado.
- Al aplicar cambios, pasar siempre el código 100% completo y limpio del archivo modificado, con cabecera `// filename: path/completo/del/archivo` y `// Version: x.y.z` actualizada. Añadir comentarios solo si son esenciales para la comprensión.
- Mantener este archivo `PROJECT_STATE_AND_ROADMAP.md` y el `TROUBLESHOOTING_GUIDE.md` (si se usa) actualizados con el estado completado y las tareas pendientes después de cada sesión de trabajo significativa.

## 8. Información Adicional

- El backend utiliza un archivo `.env` con las variables `DATABASE_URL` y `JWT_SECRET`. Es crucial no compartir el valor real de `JWT_SECRET`. Se asume que el entorno local tiene estas variables configuradas correctamente.
- El proyecto está licenciado bajo la Licencia Pública General Affero de GNU v3.0 (AGPL v3). El texto completo de la licencia se encuentra en el archivo `LICENSE` en la raíz del repositorio GitHub de Olivier Hottelet (`R3v180`).
