# LoyalPyME - Estado del Proyecto y Decisiones Clave

**Versión:** 1.14.0 (Inicio Desarrollo Módulo Camarero - Backend Carta Digital Base)
**Fecha de Última Actualización:** 10 de Mayo de 2025

---

## 1. Resumen General del Proyecto LoyalPyME 🎯

- **Concepto:** Plataforma web full-stack (React/Node.js) para que las PyMEs gestionen programas de fidelización digital (LoyalPyME Core) y, opcionalmente, la operativa de servicio en hostelería (LoyalPyME Camarero). Los módulos pueden activarse por negocio.
- **Componentes:** Backend (Node/Express/Prisma/Postgres/Cloudinary), Frontend (React/Vite/Mantine/TS).
- **Áreas Principales:**
  - **Panel Super Admin:** Gestión de negocios y activación de módulos de la plataforma.
  - **Panel de Administración (Business Admin):** Gestión de las funcionalidades del módulo o módulos activos para su negocio (ej: clientes, recompensas, tiers para LCo; carta digital, mesas para LC).
  - **Portal de Cliente (Customer Final - LCo):** Dashboard con puntos, recompensas, historial de actividad (si LCo está activo).
  - **Interfaces Módulo Camarero (LC):** Carta digital para clientes, app para camareros, KDS (si LC está activo).
- **Propósito:** Herramienta digital completa, modular y adaptable para fidelización, optimización de servicio en hostelería, recurrencia y mejora de la relación cliente-negocio.

_(Para una descripción más detallada de la visión a largo plazo, consulta el [README](./README.es.md) y para el plan de desarrollo, [DEVELOPMENT_PLAN.md](./DEVELOPMENT_PLAN.md))_

---

## 2. Estado Actual Detallado (Hitos Completados - v1.14.0) ✅

- **Fase 1 (Núcleo Operativo LCo + Pulido Inicial):**

  - Funcionalidades base de LoyalPyME Core (LCo) estables: Autenticación completa (Cliente, Business Admin), CRUDs Admin LCo (Recompensas con i18n, Tiers, Clientes con filtros/acciones/notas), Flujo Puntos/QR, Lógica Tiers (BE+Cron), Historial Actividad Cliente.
  - Mejoras UI/UX previas, Internacionalización Frontend base, Documentación API Swagger base.

- **Fase 2 (Fundamentos Multi-Módulo y Panel Super Admin):**

  - Implementación del Panel Super Admin y Gestión de Módulos (activación/desactivación LCo/LC por negocio).
  - Control de Acceso por Módulo en Backend y Frontend para LCo.
  - Script de Seed mejorado con negocio demo y módulos pre-activados.

- **Fase 3 (Desarrollo Módulo "LoyalPyME Camarero" - LC):**
  - **LC - Diseño y Estructura Base de Base de Datos (Backend):**
    - Definidos y migrados los modelos Prisma para: `TableStatus`, `Table`, `MenuCategory`, `MenuItem`, `ModifierGroup`, `ModifierOption`, `OrderStatus`, `OrderItemStatus`, `Order`, `OrderItem`, `OrderItemModifierOption`, y `StaffPin`.
    - Actualizado `UserRole` enum con roles para personal de LC.
    - Actualizados modelos `Business` y `User` con las relaciones inversas necesarias.
  - **LC - Backend: API para Gestión de Carta Digital (Categorías, Ítems y Modificadores - Admin):**
    - Implementados servicios y controladores para operaciones CRUD en `MenuCategory`, `MenuItem`, `ModifierGroup` y `ModifierOption`.
    - Definidas rutas en `camarero-admin.routes.ts` montadas bajo `/api/camarero/admin/`.
    - Rutas protegidas por `authenticateToken`, `checkRole(['BUSINESS_ADMIN'])`, y `checkModuleActive('CAMARERO')`.
  - **LC - Frontend: Página Base para Gestión de Menú (Admin):**
    - Creada página placeholder `MenuManagementPage.tsx` en `/admin/dashboard/camarero/menu-editor`.
    - Añadida ruta y enlaces condicionales en `AdminNavbar` y `AdminOverview`.
    - Añadidas claves i18n iniciales.

---

## 3. Key Concepts & Design Decisions 🔑

- **Arquitectura Modular:**
  - La plataforma soporta múltiples módulos (ej: LoyalPyME Core, LoyalPyME Camarero) activables por negocio.
  - Un rol `SUPER_ADMIN` gestiona los negocios y sus módulos activos.
  - El acceso a funcionalidades (API y UI) está condicionado por la activación del módulo correspondiente.
- **Flags de Módulos:**
  - El modelo `Business` contiene los campos booleanos `isLoyaltyCoreActive` e `isCamareroActive`.
  - El middleware `checkModuleActive` en el backend protege las rutas API.
  - El frontend lee estos flags para renderizar condicionalmente la UI.
- **Usuario Super Admin:**
  - Rol `SUPER_ADMIN` sin asociación a un `businessId` específico, con acceso a un panel `/superadmin`.
- **Estructura de Datos Módulo Camarero (LC):**
  - **Mesas (`Table`):** Identificador, QR opcional, estado (`TableStatus`), zona, capacidad.
  - **Carta Digital (`MenuCategory`, `MenuItem`):** Jerárquica, con i18n, imágenes, precios, disponibilidad, alérgenos, tags, orden.
  - **Modificadores (`ModifierGroup`, `ModifierOption`):** Para personalización de ítems, con tipos de UI (radio/checkbox), reglas de selección, y ajustes de precio.
  - **Pedidos (`Order`, `OrderItem`):** Asociados a mesas/clientes/camareros. Contienen ítems con precios y modificadores seleccionados. Estados (`OrderStatus`, `OrderItemStatus`) para seguir el flujo.
  - **Personal (`StaffPin`, `UserRole`):** Empleados son `User`s con roles específicos (WAITER, etc.) y pueden usar PINs.
- **LoyalPyME Core (LCo) - Conceptos de Fidelización:**
  - **Separación Puntos vs. Nivel:** Nivel por actividad (`business.tierCalculationBasis`), Puntos (`User.points`) como moneda canjeable.
  - **Orden de Niveles:** Numérico ascendente (`level`).
  - **Actualización Nivel:** Automática (QR/Cron) o Manual por Admin.
  - **Layout Panel Cliente:** Basado en Tabs.
  - **Historial Actividad:** Modelo `ActivityLog` para registro de transacciones de puntos y canjes.
  - **Internacionalización Recompensas:** Campos de nombre y descripción en ES/EN.
- **Almacenamiento Imágenes:** Cloudinary.

---

## 4. Lecciones Aprendidas & Troubleshooting Clave 💡

- **Ejecución de Scripts de Seed con `ts-node` y Prisma CLI:** Configurar `"prisma": { "seed": "..." }` en `package.json` es crucial para que `npx prisma db seed` ejecute scripts TypeScript. Simplificar el comando de seed (sin `--compiler-options` explícitas) suele funcionar mejor.
- **Regeneración del Cliente Prisma:** Esencial ejecutar `npx prisma generate` después de cada `migrate dev` o `migrate reset` para evitar errores de tipado con nuevos campos del schema.
- **Errores de Migración con Datos Existentes (P3018):** En desarrollo, `npx prisma migrate reset` es la solución más simple para errores de FK tras cambios estructurales.
- **Tipado y Middlewares (Backend):** El objeto `req.user` debe construirse cuidadosamente en `auth.middleware.ts` para incluir todos los datos necesarios (como flags de módulos) y manejar correctamente campos opcionales para diferentes roles.
- **Flujo de Datos en Frontend (Hooks y LocalStorage):** Asegurar que los hooks (ej: `useLayoutUserData`) obtengan y expongan la estructura de datos completa esperada por los componentes (ej: con flags de módulos) desde la API (`/api/profile`) y `localStorage`.
- **Importación de Módulos en Node.js (TypeScript):** No incluir la extensión `.ts` en las sentencias `import` de archivos locales.

_(Para una guía más exhaustiva de otros problemas específicos, consulta [TROUBLESHOOTING_GUIDE.md](./TROUBLESHOOTING_GUIDE.md))_

---

## 5. Próximos Pasos Inmediatos / Prioridades ⏳📌

1.  **(Prioridad Principal) Desarrollo Módulo "LoyalPyME Camarero" (LC):**
    - **Objetivo:** Continuar con la implementación del MVP del módulo Camarero.
    - **Tareas Inmediatas (LC):**
      1.  **Frontend LC (Gestión Carta - Categorías):** Implementar `MenuCategoryManager.tsx` (CRUD UI).
      2.  **Frontend LC (Gestión Carta - Ítems):** UI para `MenuItem`s.
      3.  **Frontend LC (Gestión Carta - Modificadores):** UI para `ModifierGroup`s y `ModifierOption`s.
      4.  **Backend y Frontend LC (Visualización Carta Cliente).**
      5.  **Backend y Frontend LC (Flujo de Pedido Cliente).**
      6.  **Backend y Frontend LC (KDS Básico).**
      7.  **Backend y Frontend LC (Interfaz Camarero Básica).**
2.  **(Paralelo/Continuo) Testing:** Escribir tests de integración para los nuevos endpoints del backend de LC.

_(Para ver la hoja de ruta completa y el backlog, consulta [DEVELOPMENT_PLAN.md](./DEVELOPMENT_PLAN.md))_

---

## 6. Información Adicional ℹ️

- Licencia: **MIT**.

---
