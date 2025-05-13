# LoyalPyME - Estado del Proyecto y Decisiones Clave

**Versión:** 1.16.0 (Módulo Camarero - Visualización Carta Cliente y Flujo Pedido Backend/Frontend Inicial)
**Fecha de Última Actualización:** 13 de Mayo de 2025

---

## 1. Resumen General del Proyecto LoyalPyME 🎯

- **Concepto:** Plataforma web full-stack (React/Node.js) para que las PyMEs gestionen programas de fidelización digital (LoyalPyME Core) y, opcionalmente, la operativa de servicio en hostelería (LoyalPyME Camarero). Los módulos pueden activarse por negocio.
- **Componentes:** Backend (Node/Express/Prisma/Postgres/Cloudinary), Frontend (React/Vite/Mantine/TS).
- **Licencia:** Software Propietario. Copyright (c) 2024-2025 Olivier Hottelet. Todos los derechos reservados.
- **Áreas Principales:**
  - **Panel Super Admin:** Gestión de negocios y activación de módulos de la plataforma.
  - **Panel de Administración (Business Admin):** Gestión de las funcionalidades del módulo o módulos activos para su negocio (ej: clientes, recompensas, tiers para LCo; carta digital, mesas para LC).
  - **Portal de Cliente (Customer Final - LCo):** Dashboard con puntos, recompensas, historial de actividad (si LCo está activo).
  - **Interfaces Módulo Camarero (LC):** Carta digital para clientes (visualización y pedido), app para camareros, KDS (si LC está activo).
- **Propósito:** Herramienta digital completa, modular y adaptable para fidelización, optimización de servicio en hostelería, recurrencia y mejora de la relación cliente-negocio.

_(Para una descripción más detallada de la visión a largo plazo, consulta el [README](./README.md) y para el plan de desarrollo, [DEVELOPMENT_PLAN.md](./DEVELOPMENT_PLAN.md))_

---

## 2. Estado Actual Detallado (Hitos Completados - v1.16.0) ✅

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
  - ⭐ **LC - Backend: API Pública para Visualización de Carta por Cliente Final:**
    - Endpoint `/public/menu/business/:businessSlug` que devuelve la carta completa (categorías, ítems, modificadores) activa y disponible, con campos i18n.
  - ⭐ **LC - Frontend: Página Pública para Visualización de Carta por Cliente Final:**
    - Ruta `/m/:businessSlug/:tableIdentifier?` implementada.
    - Consume la API pública y muestra la carta con categorías en acordeón, detalles de ítems (imagen, i18n, precio, etc.) y visualización de grupos/opciones de modificadores.
  - ⭐ **LC - Backend: API Pública para Creación de Pedidos por Cliente Final:**
    - Endpoint `POST /public/order/:businessSlug` para recibir pedidos.
    - Realiza validación de ítems, modificadores, reglas de selección y cálculo de precios.
    - Crea registros `Order`, `OrderItem`, `OrderItemModifierOption` de forma transaccional. Estado inicial `RECEIVED`.
  - ⭐ **LC - Frontend: Inicio del Flujo de Pedido por Cliente Final:**
    - UI en la vista de carta para seleccionar cantidad de ítems.
    - UI interactiva para seleccionar modificadores (Radio/Checkbox) con actualización de precio en tiempo real.
    - Validación de reglas de modificadores antes de añadir al carrito.
    - Lógica para añadir ítems (simples o configurados) a un estado de carrito local.
    - Visualización preliminar del total del carrito.

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
  - **Modificadores:** `ModifierGroup` (asociado a `MenuItem`) y `ModifierOption` (dentro de un grupo), con tipos de UI (`RADIO`, `CHECKBOX`), reglas de selección (`minSelections`, `maxSelections`, `isRequired`), ajustes de precio.
  - **Pedidos:** Modelo `Order` (con `OrderStatus`), `OrderItem` (con `unitPrice`, `totalItemPrice`, `kdsDestination`), y `OrderItemModifierOption` (relacionando el ítem del pedido con la opción de modificador seleccionada).
  - (Otros modelos como `Table`, `StaffPin` definidos).
- **LoyalPyME Core (LCo) - Conceptos de Fidelización:**
  - Separación Puntos vs. Nivel. Actualización Nivel (Automática/Manual). Historial Actividad. i18n Recompensas.
- **Almacenamiento Imágenes:** Cloudinary.
- **Flujo de Pedido LC (Cliente):**
  - **DTO de Pedido:** El frontend envía un DTO `CreateOrderPayloadDto` con `items: OrderItemDto[]`. Cada `OrderItemDto` incluye `menuItemId`, `quantity`, `notes?`, y `selectedModifierOptions?: SelectedModifierOptionDto[]`.
  - **Cálculo de Precios:** El backend recalcula todos los precios al momento de la creación del pedido basándose en los precios actuales en la BD para ítems y modificadores.
  - **Snapshots:** El backend guarda snapshots de nombres de ítems y modificadores en el pedido para referencia histórica (funcionalidad parcial o planificada).

---

## 4. Lecciones Aprendidas & Troubleshooting Clave 💡

- **Ejecución Scripts Seed con `ts-node` y Prisma CLI:** Configuración `package.json` ("prisma": { "seed": "..." }) es crucial.
- **Regeneración Cliente Prisma:** Esencial `npx prisma generate` tras `migrate dev/reset`.
- **Tipado y Middlewares (Backend):** `req.user` debe incluir flags de módulos y manejar campos opcionales por rol.
- **Flujo de Datos Frontend (Hooks y LocalStorage):** Asegurar estructura de datos completa (con flags de módulos) desde API (`/api/profile`) y `localStorage`.
- **Manejo de Modales Anidados (Frontend):** La gestión del estado `opened` y el paso de datos entre modales anidados (ej. Ítem -> Grupos -> Opciones) requiere una estructura clara de props y callbacks.
- **Validación de Formularios con Zod y Mantine:** Uso de `z.coerce` para campos numéricos y manejo de errores/estado `dirty`.
- **Refactorización de Componentes React:** Dividir componentes grandes (como `PublicMenuViewPage`) en subcomponentes más pequeños y manejables mejora la legibilidad y facilita la gestión del estado y la lógica.
- **Errores de Tipo en Prisma `CreateInput`:** Las relaciones opcionales en Prisma (`tableId?` en `Order`) a veces requieren una construcción más explícita del objeto `data` en lugar de usar propagación condicional directa para evitar errores de tipo.

_(Para una guía más exhaustiva, consulta [TROUBLESHOOTING_GUIDE.md](./TROUBLESHOOTING_GUIDE.md))_

---

## 5. Próximos Pasos Inmediatos / Prioridades ⏳📌

1.  **(Prioridad Principal) Continuación Desarrollo Módulo "LoyalPyME Camarero" (LC):**
    - **Objetivo:** Avanzar hacia un MVP funcional del módulo Camarero, enfocándose en completar el flujo de pedido del cliente.
    - **Tareas Inmediatas (LC - Flujo de Pedido Frontend Tarea #9):**
      1.  **Desarrollar UI Componente "Carrito de Pedido" Detallado:**
          - Listar ítems con detalles (nombre, cantidad, modificadores seleccionados, precio por línea, subtotal).
          - Permitir modificar cantidad de un ítem en el carrito.
          - Permitir eliminar un ítem del carrito.
      2.  **Permitir añadir notas generales** al pedido.
      3.  **Implementar botón "Enviar Pedido"** que construya el DTO y llame a la API `POST /public/order/:businessSlug`.
      4.  **Manejar feedback al usuario** sobre el estado del envío del pedido (éxito, errores).
    - **Tareas Siguientes (LC - Post Flujo Pedido Cliente):**
      1.  KDS (Kitchen Display System) Básico (Frontend y Backend - Tarea #10).
      2.  Interfaz Camarero Básica (MVP) (Frontend y Backend - Tarea #11).
      3.  Gestión de Personal y Mesas (Backend y luego Frontend Admin - Tareas #12, #13).
2.  **(Paralelo/Continuo) Testing y Fundamentos Técnicos (Tarea #14):**
    - Escribir tests para los nuevos endpoints y funcionalidades (especialmente `/public/menu` y `/public/order`).
    - Continuar con la validación robusta backend (Zod).
3.  **Refinamiento UI/UX:** Mejoras visuales y de usabilidad en la carta pública y el flujo de pedido.

_(Para ver la hoja de ruta completa y el backlog, consulta [DEVELOPMENT_PLAN.md](./DEVELOPMENT_PLAN.md))_

---

## 6. Información Adicional ℹ️

- **Licencia:** Software Propietario. Copyright (c) 2024-2025 Olivier Hottelet. Todos los derechos reservados.
  Consulta [LICENSE.md](./LICENSE.md) para más detalles.

---
