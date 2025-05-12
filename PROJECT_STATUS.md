# LoyalPyME - Estado del Proyecto y Decisiones Clave

**Versión:** 1.15.0 (Módulo Camarero - UI Gestión Carta Admin Completa, Transición a Licencia Propietaria)
**Fecha de Última Actualización:** [PON LA FECHA ACTUAL AQUÍ, ej: 11 de Mayo de 2025]

---

## 1. Resumen General del Proyecto LoyalPyME 🎯

- **Concepto:** Plataforma web full-stack (React/Node.js) para que las PyMEs gestionen programas de fidelización digital (LoyalPyME Core) y, opcionalmente, la operativa de servicio en hostelería (LoyalPyME Camarero). Los módulos pueden activarse por negocio.
- **Componentes:** Backend (Node/Express/Prisma/Postgres/Cloudinary), Frontend (React/Vite/Mantine/TS).
- **Licencia:** Software Propietario. Copyright (c) 2024-2025 Olivier Hottelet. Todos los derechos reservados.
- **Áreas Principales:**
  - **Panel Super Admin:** Gestión de negocios y activación de módulos de la plataforma.
  - **Panel de Administración (Business Admin):** Gestión de las funcionalidades del módulo o módulos activos para su negocio (ej: clientes, recompensas, tiers para LCo; carta digital, mesas para LC).
  - **Portal de Cliente (Customer Final - LCo):** Dashboard con puntos, recompensas, historial de actividad (si LCo está activo).
  - **Interfaces Módulo Camarero (LC):** Carta digital para clientes, app para camareros, KDS (si LC está activo).
- **Propósito:** Herramienta digital completa, modular y adaptable para fidelización, optimización de servicio en hostelería, recurrencia y mejora de la relación cliente-negocio.

_(Para una descripción más detallada de la visión a largo plazo, consulta el [README](./README.es.md) y para el plan de desarrollo, [DEVELOPMENT_PLAN.md](./DEVELOPMENT_PLAN.md))_

---

## 2. Estado Actual Detallado (Hitos Completados - v1.15.0) ✅

- **Fase 1 (Núcleo Operativo LCo + Pulido Inicial):**

  - Funcionalidades base de LoyalPyME Core (LCo) estables: Autenticación completa, CRUDs Admin LCo (Recompensas i18n, Tiers, Clientes con filtros/acciones), Flujo Puntos/QR, Lógica Tiers, Historial Actividad Cliente.
  - Mejoras UI/UX previas, Internacionalización Frontend base, Documentación API Swagger base.

- **Fase 2 (Fundamentos Multi-Módulo y Panel Super Admin):**

  - Implementación del Panel Super Admin y Gestión de Módulos (activación/desactivación LCo/LC por negocio).
  - Control de Acceso por Módulo en Backend y Frontend para LCo.
  - Script de Seed mejorado.

- **Fase 3 (Desarrollo Módulo "LoyalPyME Camarero" - LC):**
  - **LC - Diseño y Estructura Base de Base de Datos (Backend):**
    - Modelos Prisma definidos y migrados para operativa de hostelería (Mesas, Carta, Modificadores, Pedidos, Personal).
  - **LC - Backend: API para Gestión de Carta Digital (Admin):**
    - Endpoints CRUD implementados para `MenuCategory`, `MenuItem`, `ModifierGroup` y `ModifierOption`.
    - Rutas protegidas por rol (`BUSINESS_ADMIN`) y activación del módulo LC.
  - **LC - Frontend: Interfaz de Usuario para Gestión de Carta Digital (Admin):**
    - Implementada página `MenuManagementPage.tsx` en `/admin/dashboard/camarero/menu-editor`.
    - Componente `MenuCategoryManager.tsx` para CRUD completo de categorías (incluye subida/recorte de imágenes).
    - Componente `MenuItemManager.tsx` (anidado) para CRUD completo de ítems dentro de una categoría (incluye subida/recorte de imágenes y campos detallados).
    - Componente `ModifierGroupsManagementModal.tsx` (accesible desde la edición de un ítem) para CRUD de `ModifierGroup`s asociados al ítem.
    - Componente `ModifierOptionsManagementModal.tsx` (accesible desde la gestión de un grupo) para CRUD de `ModifierOption`s dentro de un grupo.
    - Internacionalización básica de la interfaz de gestión de menú.

---

## 3. Key Concepts & Design Decisions 🔑

- **Arquitectura Modular:**
  - La plataforma soporta múltiples módulos activables por negocio.
  - Rol `SUPER_ADMIN` gestiona negocios y sus módulos activos.
  - Acceso a funcionalidades (API y UI) condicionado por activación del módulo.
- **Flags de Módulos:**
  - Modelo `Business` con `isLoyaltyCoreActive` e `isCamareroActive`.
  - Middleware `checkModuleActive` en backend; UI condicional en frontend.
- **Estructura de Datos Módulo Camarero (LC):**
  - **Carta Digital:** Jerárquica (`MenuCategory`, `MenuItem`), con i18n, imágenes, precios, disponibilidad, alérgenos, tags, orden.
  - **Modificadores:** `ModifierGroup` (asociado a `MenuItem`) y `ModifierOption` (dentro de un grupo), con tipos de UI, reglas de selección, ajustes de precio.
  - (Otros modelos como `Table`, `Order`, `StaffPin` definidos pero aún no completamente integrados en UI/lógica de negocio avanzada).
- **LoyalPyME Core (LCo) - Conceptos de Fidelización:**
  - Separación Puntos vs. Nivel. Actualización Nivel (Automática/Manual). Historial Actividad. i18n Recompensas.
- **Almacenamiento Imágenes:** Cloudinary.

---

## 4. Lecciones Aprendidas & Troubleshooting Clave 💡

- **Ejecución Scripts Seed con `ts-node` y Prisma CLI:** Configuración `package.json` ("prisma": { "seed": "..." }) es crucial.
- **Regeneración Cliente Prisma:** Esencial `npx prisma generate` tras `migrate dev/reset`.
- **Tipado y Middlewares (Backend):** `req.user` debe incluir flags de módulos y manejar campos opcionales por rol.
- **Flujo de Datos Frontend (Hooks y LocalStorage):** Asegurar estructura de datos completa (con flags de módulos) desde API (`/api/profile`) y `localStorage`.
- **Manejo de Modales Anidados (Frontend):** La gestión del estado `opened` y el paso de datos entre modales anidados (ej. Ítem -> Grupos -> Opciones) requiere una estructura clara de props y callbacks.
- **Validación de Formularios con Zod y Mantine:** Uso de `z.coerce` para campos numéricos y manejo de errores/estado `dirty`.

_(Para una guía más exhaustiva, consulta [TROUBLESHOOTING_GUIDE.md](./TROUBLESHOOTING_GUIDE.md))_

---

## 5. Próximos Pasos Inmediatos / Prioridades ⏳📌

1.  **(Prioridad Principal) Continuación Desarrollo Módulo "LoyalPyME Camarero" (LC):**
    - **Objetivo:** Avanzar hacia un MVP funcional del módulo Camarero.
    - **Tareas Inmediatas (LC):**
      1.  **Visualización de Carta Digital por el Cliente Final (Frontend y Backend):**
          - API Pública Backend para obtener datos de la carta (solo ítems/categorías activas).
          - Página Frontend (`/m/:businessSlug/:tableQrValue` o similar) para mostrar la carta.
      2.  **Flujo de Pedido Básico por el Cliente Final (Frontend y Backend).**
      3.  **KDS (Kitchen Display System) Básico (Frontend y Backend).**
      4.  **Interfaz Camarero Básica (MVP) (Frontend y Backend).**
      5.  Gestión de Personal y Mesas (Backend y luego Frontend Admin).
2.  **(Paralelo/Continuo) Testing:** Escribir tests para las nuevas funcionalidades.
3.  **Refinamiento UI/UX:** Mejoras visuales y de usabilidad en la gestión de menú (ej. reordenación drag-and-drop).

_(Para ver la hoja de ruta completa y el backlog, consulta [DEVELOPMENT_PLAN.md](./DEVELOPMENT_PLAN.md))_

---

## 6. Información Adicional ℹ️

- **Licencia:** Software Propietario. Copyright (c) 2024-2025 Olivier Hottelet. Todos los derechos reservados.
  Consulta [LICENSE.md](./LICENSE.md) para más detalles.

---
