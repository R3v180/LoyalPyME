# LoyalPyME - Estado del Proyecto y Decisiones Clave

**Versión Actual:** 1.18.0 (LC: KDS API Base y Visualización Estado Pedido Cliente Implementados; Lógica Order.status en depuración; Flujo Pedido Activo Cliente definido)
**Fecha de Última Actualización:** 27 de Mayo de 2025

---

## 1. Resumen General del Proyecto LoyalPyME 🎯

- **Concepto:** Plataforma web integral y modular desarrollada con un stack full-stack (React/TypeScript en Frontend, Node.js/Express/TypeScript en Backend con Prisma y PostgreSQL). Diseñada para PyMEs, ofrece dos módulos principales activables por negocio:
  - **LoyalPyME Core (LCo):** Sistema robusto para la gestión de programas de fidelización de clientes digitales (puntos, niveles, recompensas, generación/validación de QR para puntos, panel de cliente interactivo). **[Funcionalmente Completo para MVP]**
  - **LoyalPyME Camarero (LC):** Módulo avanzado, **[En Desarrollo Activo]**, enfocado en la digitalización y optimización de la operativa de servicio en hostelería. Permite:
    - Gestión completa de carta digital por el administrador.
    - Visualización de carta y toma de comandas por el cliente (QR de mesa).
    - Visualización del estado del pedido por el cliente.
    - (En desarrollo) API para KDS (Kitchen Display System).
- **Componentes Tecnológicos Clave:**
  - **Backend:** Node.js, Express.js, TypeScript, Prisma ORM (PostgreSQL), JWT (autenticación), Cloudinary (imágenes), Multer (uploads), Swagger/OpenAPI (docs API), `node-cron` (tareas programadas, ej. lógica de tiers LCo).
  - **Frontend:** React (Hooks), TypeScript, Vite (bundler), Mantine UI (componentes), Axios (HTTP), React Router DOM (rutas), `i18next` (i18n ES/EN), `html5-qrcode` (escaneo QR cliente LCo), `react-image-crop` (recorte imágenes admin).
  - **Testing:** Vitest (pruebas unitarias/integración backend y frontend).
- **Licencia:** Software Propietario. Copyright (c) 2024-2025 Olivier Hottelet. Todos los derechos reservados.
- **Áreas Funcionales Principales de la Plataforma:**
  - **Panel Super Admin (`/superadmin`):** Administración global de negocios clientes (activación/desactivación de estado general y módulos LCo/LC).
  - **Panel de Administración del Negocio (`/admin/dashboard/*`):**
    - **LCo:** Gestión de clientes, recompensas, niveles (tiers), configuración del programa de fidelización, generación de QR de puntos.
    - **LC:** Gestión de la carta digital (categorías, ítems, grupos de modificadores, opciones de modificadores). Futuro: gestión de mesas, personal, configuración KDS.
  - **Portal de Cliente Final (LCo - `/customer/dashboard`):** Dashboard para clientes LCo (puntos, nivel, recompensas, actividad, validación QR). Incluye acceso a la carta LC si está activa.
  - **Interfaces del Módulo Camarero (LC):**
    - **Carta Digital Pública (`/m/:businessSlug/:tableIdentifier?`):** Visualización de menú y toma de pedidos por cliente. Detecta pedidos activos vía `localStorage` para la mesa/navegador y adapta la UI.
    - **Visualización Estado del Pedido Cliente (`/order-status/:orderId`):** Muestra estado detallado del pedido y sus ítems, con actualizaciones por polling. Gestiona la finalización del pedido y limpieza de `localStorage` para permitir nuevos pedidos.
    - **API KDS (Backend - `/api/camarero/kds/*`):** [EN DESARROLLO] Endpoints para obtener ítems de pedidos por destino KDS y para actualizar el estado de preparación de los `OrderItem`s.
    - **(Futuro) Interfaz Frontend KDS:** Pantallas para cocina/barra.
    - **(Futuro) Interfaz de Camarero:** Aplicación/vista para personal de sala.
- **Propósito y Visión:** Ser la herramienta digital integral, modular y adaptable que potencie la fidelización de clientes y optimice la operativa de servicio en PyMEs, especialmente en el sector hostelero, mejorando la recurrencia y la relación cliente-negocio.

_(Para una descripción más detallada de la visión a largo plazo, consulta el [README.md](./README.md). Para la hoja de ruta y el backlog de funcionalidades, revisa [DEVELOPMENT_PLAN.md](./DEVELOPMENT_PLAN.md). Para los flujos de trabajo detallados de cada módulo, consulta `LOYALPYME_CORE_WORKFLOW.md`, `LOYALPYME_CAMARERO_WORKFLOW.md`, y `MODULE_INTEGRATION_WORKFLOW.md`)._

---

## 2. Estado Actual Detallado (Hitos Completados y En Progreso - v1.18.0) 📝

- **Fase 1 (Núcleo Operativo LCo + Pulido Inicial): [COMPLETADO]**

  - Funcionalidades base de LoyalPyME Core (LCo) estables y probadas:
    - Autenticación completa (registro de negocios con su primer administrador, registro de clientes finales asociados a un negocio, login robusto con JWT, funcionalidad completa de reseteo de contraseña).
    - CRUDs completos en el Panel de Administración LCo:
      - Gestión de Recompensas: Creación, edición (incluyendo subida y recorte de imágenes a Cloudinary con aspecto 1:1), activación/desactivación y eliminación. Soporte multi-idioma (ES/EN) para nombre y descripción (`name_es`, `name_en`, etc.).
      - Gestión de Niveles (Tiers): CRUD para niveles, definición de umbrales (`minValue`) y beneficios específicos por nivel (`TierBenefit`: multiplicador de puntos, acceso a recompensa exclusiva, beneficio personalizado).
      - Configuración Global del Sistema de Tiers: Habilitación, base de cálculo (`TierCalculationBasis`), periodo de cálculo (`tierCalculationPeriodMonths`), política de descenso (`TierDowngradePolicy`, `inactivityPeriodMonths`).
      - Gestión Avanzada de Clientes: Listado paginado con búsqueda (nombre/email), filtros (estado, favorito, nivel) y ordenación. CRUD de clientes, incluyendo notas internas, ajuste manual de puntos (con motivo), cambio manual de nivel, asignación de recompensas como regalo, activación/desactivación de cuentas y marcado como favorito. Implementadas acciones masivas (activar/desactivar, eliminar, ajustar puntos).
    - Flujo completo de Puntos y QR en LCo: Generación de códigos QR únicos por el `BUSINESS_ADMIN` (asociados a importe y ticket). Validación de estos QR por el `CUSTOMER_FINAL` en su dashboard (introducción manual o escaneo con cámara vía `html5-qrcode`).
    - Lógica de Tiers Automática (Backend LCo): Tarea programada (`node-cron`) que calcula y actualiza el nivel de los clientes según la configuración del negocio y las políticas de descenso.
    - Panel de Cliente Completo LCo (`CustomerDashboardPage.tsx`): Resumen (puntos, nivel, progreso, regalos/recompensas), pestaña de Recompensas (catálogo completo, canje), pestaña de Actividad (historial paginado).
  - Mejoras UI/UX iniciales en toda la plataforma.
  - Internacionalización (i18n) Frontend base (ES/EN) con `i18next` y archivos de traducción JSON.
  - Documentación API Backend generada con Swagger/OpenAPI (endpoint `/api-docs`) para los servicios LCo.

- **Fase 2 (Fundamentos Multi-Módulo y Panel Super Admin): [COMPLETADO]**

  - Implementación del Panel Super Admin (`/superadmin`): Interfaz para `SUPER_ADMIN` que permite listar todos los negocios registrados, ver su estado general (`isActive`) y el estado de activación de sus módulos (`isLoyaltyCoreActive`, `isCamareroActive`). Permite al Super Admin activar/desactivar estos flags.
  - Middleware `checkModuleActive` en backend: Verifica si un módulo requerido está activo para el negocio del usuario antes de permitir el acceso a un endpoint.
  - Lógica condicional en UI frontend (ej. `AdminNavbar`, `CustomerDashboardPage`): Adapta la interfaz y las opciones disponibles según los módulos activos para el negocio del usuario.
  - Payload de perfil de usuario (`/api/profile`) enriquecido: Devuelve `isActive`, `isLoyaltyCoreActive`, `isCamareroActive` del negocio asociado, además de `businessSlug`, `businessName`, `businessLogoUrl` para roles `BUSINESS_ADMIN` y `CUSTOMER_FINAL`.
  - Script de Seed (`prisma/seed.ts`): **CORREGIDO Y FUNCIONAL (v6)**. Puebla la base de datos con datos de demostración exhaustivos para LCo y LC, incluyendo un negocio demo, administrador, clientes, tiers, recompensas, carta digital completa con categorías, ítems y modificadores, mesas, personal de LC con PINs, y pedidos de ejemplo con ítems destinados a diferentes KDS. Resueltos problemas previos de TypeScript y ejecución. Asegura la correcta persistencia de `priceAtPurchase` y `totalItemPrice` en `OrderItem`.

- **Fase 3 (Desarrollo Módulo "LoyalPyME Camarero" - LC): [EN PROGRESO AVANZADO]**
  - **LC - Fundamentos Backend (Modelos BD y API Gestión Carta): [COMPLETADO]**
    - **Modelos Prisma:** Definidos y migrados para `Table`, `MenuCategory`, `MenuItem`, `ModifierGroup`, `ModifierOption`, `Order`, `OrderItem` (con `priceAtPurchase`, `totalItemPrice`, `kdsDestination`, `status`, `preparedAt`, `servedAt`), `OrderItemModifierOption` (con snapshots de nombre y precio del modificador), `StaffPin`. Enum `UserRole` extendido (`WAITER`, `KITCHEN_STAFF`, `BAR_STAFF`). Enums `ModifierUiType`, `OrderStatus`, `OrderItemStatus`, `OrderType`.
    - **API CRUD Admin Carta (`/api/camarero/admin/*`):** Endpoints RESTful completos para que el `BUSINESS_ADMIN` gestione `MenuCategory`, `MenuItem`, `ModifierGroup`, y `ModifierOption`. Protegidos por autenticación, rol y activación del módulo LC.
  - **LC - Frontend: UI Admin para Gestión de Carta Digital: [COMPLETADO]**
    - Página `/admin/dashboard/camarero/menu-editor` (`MenuManagementPage.tsx`).
    - Componentes: `MenuCategoryManager.tsx` (CRUD categorías, subida/recorte de imagen), `MenuItemManager.tsx` (CRUD ítems por categoría, subida/recorte de imagen), `ModifierGroupsManagementModal.tsx` (CRUD grupos de modificadores por ítem), `ModifierOptionsManagementModal.tsx` (CRUD opciones por grupo).
    - Hooks de datos (`useAdminMenuCategories`, `useAdminMenuItems`, etc.) y tipos (`menu.types.ts`) implementados.
    - Botón "Previsualizar Carta Pública" funcional para administradores.
  - **LC - Backend y Frontend: Visualización de Carta Pública y Flujo de Pedido por Cliente: [COMPLETADO]**
    - **Backend (`/public/menu/:businessSlug`):** Endpoint público que sirve la carta digital completa, activa, ordenada y con datos i18n.
    - **Frontend (`/m/:businessSlug/:tableIdentifier?` - `PublicMenuViewPage.tsx`):**
      - Muestra interactiva de la carta con acordeones, tarjetas de ítem detalladas, y renderizador interactivo para modificadores (`ModifierGroupInteractiveRenderer.tsx`).
      - Cálculo de precio dinámico al configurar modificadores.
      - Carrito de compra local (`currentOrderItems`) con persistencia en `localStorage` (asociado a `businessSlug` y `tableIdentifier`).
      - Modal del carrito (`ShoppingCartModal.tsx`) para revisar, modificar cantidades, eliminar ítems, añadir notas generales y vaciar carrito.
    - **Backend (`POST /public/order/:businessSlug`):**
      - API recibe `CreateOrderPayloadDto`.
      - Validación exhaustiva de negocio, ítems (existencia, disponibilidad, pertenencia), modificadores (reglas de grupo `minSelections`/`maxSelections`/`isRequired`).
      - **Recálculo de precios en backend:** `priceAtPurchase` (precio unitario con modificadores) y `totalItemPrice` para cada `OrderItem`, y `totalAmount`/`finalAmount` para el `Order`.
      - Creación transaccional de `Order` (con `tableId` y `customerId` LCo opcionales, `orderNotes`, `orderNumber` único, `status: RECEIVED`, `source`, `orderType`), `OrderItem`, y `OrderItemModifierOption`.
      - Devuelve el objeto `Order` creado.
    - **Frontend (Post-Envío Pedido):**
      - Notificaciones de éxito (mostrando `orderNumber` y/o `id` del pedido) o error.
      * Limpieza del carrito de "nuevo pedido" (`currentOrderItems`, `orderNotes` en `localStorage`).
      * **Guarda `activeOrderInfo = {orderId, orderNumber, savedAt}` en `localStorage`** (asociado a `businessSlug` y `tableIdentifier`) para rastrear el pedido activo del cliente en esa mesa/navegador.
      * **Redirige** al cliente a la nueva página `/order-status/:orderId`, pasando `orderNumber`, `businessSlug`, y `tableIdentifier` en el `state` de la ruta.
  - ⭐ **LC - KDS Backend (API Base) y Lógica de Estados: [EN PROGRESO - REQUIERE DEPURACIÓN]** (Tarea B1.1 del `DEVELOPMENT_PLAN.md`)
    - **Backend (`kds.service.ts`, `kds.controller.ts`, `camarero-kds.routes.ts`):**
      - Implementados endpoints `GET /api/camarero/kds/items` (con filtros `destination` y `status`) y `PATCH /api/camarero/kds/items/:orderItemId/status`.
      - Permiten al KDS obtener ítems y actualizar el `OrderItemStatus` (ej. de `PENDING_KDS` a `PREPARING`, a `READY`). La API también actualiza `preparedAt`.
      - **Problema Activo Crítico:** La lógica secundaria en `kds.service.ts` para actualizar el `Order.status` general (ej. a `IN_PROGRESS`, `PARTIALLY_READY`, `ALL_ITEMS_READY`) basada en los cambios de `OrderItem.status` **aún no funciona consistentemente**. El `Order.status` a menudo permanece en `RECEIVED` aunque los ítems progresen. **Esta es la prioridad actual de depuración en el backend.**
  - ⭐ **LC - Cliente: Visualización del Estado del Pedido: [EN PROGRESO - FUNCIONALIDAD BASE COMPLETADA]** (Tarea B2.1 del `DEVELOPMENT_PLAN.md`)
    - **Backend (`public/order.service.ts`, etc.):** Endpoint `GET /public/order/:orderId/status` **COMPLETADO Y PROBADO**. Devuelve el estado general del `Order` (`orderStatus`), `orderNumber`, `createdAt`, `tableIdentifier`, `orderNotes`, y una lista de `items` con su `id`, `itemNameSnapshot`, `quantity`, y `OrderItemStatus` individual.
    - **Frontend (`PublicMenuViewPage.tsx` - Detección Pedido Activo):**
      - **COMPLETADO:** Al cargar, verifica `localStorage` para `activeOrderInfoKey`. Si existe un pedido activo, muestra un aviso destacado con el número de pedido y un botón "Ver Estado" que enlaza a `OrderStatusPage`. El carrito para nuevos pedidos se oculta/deshabilita.
    - **Frontend (`OrderStatusPage.tsx`):**
      - **COMPLETADO:** Página creada. Lee `orderId` de la URL y datos del `state` de navegación (`orderNumber`, `businessSlug`, `tableIdentifier`).
      - **COMPLETADO:** Obtiene y muestra la información del pedido y el estado de sus ítems llamando al endpoint `GET /public/order/:orderId/status`.
      - **COMPLETADO:** Implementa **polling básico** (cada 10s) para actualizar automáticamente la información del estado.
      - **Lógica de "Pedido Finalizado" REFINADA:** Si el `Order.status` (obtenido del backend) es `PAID` o `CANCELLED`, el polling se detiene. El botón "Actualizar Estado" cambia a "Empezar Nuevo Pedido en esta Mesa".
      - **COMPLETADO:** El botón "Empezar Nuevo Pedido" limpia las entradas relevantes de `localStorage` (`activeOrderInfoKey`, `cartStorageKey`, `notesStorageKey` para la mesa/negocio actual) y redirige a la página del menú.
      - **Botón "Volver al Menú"**: Funcional, lleva de vuelta a la carta usando `businessSlug` y `tableIdentifier` del estado de navegación.
      - **Traducciones**: Implementadas para esta página.

---

## 3. Key Concepts & Design Decisions 🔑

- **Arquitectura Modular y Activación por Negocio:**
  - La plataforma soporta módulos discretos (`LOYALTY_CORE`, `CAMARERO`) que pueden ser activados o desactivados para cada `Business` por un `SUPER_ADMIN`.
  - El acceso a funcionalidades (API y UI) está condicionado por la activación del módulo correspondiente (`isLoyaltyCoreActive`, `isCamareroActive` en `Business` y propagado a `req.user`).
  - Middleware `checkModuleActive` en backend; lógica de renderizado condicional en frontend.
- **Estructura de Datos Detallada para Módulo Camarero (LC):**
  - **Carta Digital:** Jerarquía `MenuCategory` -> `MenuItem`. Ambos con campos i18n (`name_es/en`, `description_es/en`), `imageUrl`, `position` para orden, y estado `isActive` (para `MenuCategory`) / `isAvailable` (para `MenuItem`). `MenuItem` incluye `price`, `allergens` (array de strings validados por enum `AllergenType` en el futuro), `tags` (array de strings validados por enum `MenuItemTag` en el futuro), `preparationTime` (minutos), `calories`, `sku` (único por negocio), `kdsDestination` (string para identificar puesto de cocina/barra).
  - **Modificadores:** `MenuItem` tiene `ModifierGroup[]`. Cada `ModifierGroup` tiene `name_es/en`, `uiType` (enum `ModifierUiType`: `RADIO`, `CHECKBOX`), reglas (`minSelections`, `maxSelections`, `isRequired`), `position`. Cada `ModifierGroup` tiene `ModifierOption[]`. Cada `ModifierOption` tiene `name_es/en`, `priceAdjustment` (Decimal), `position`, `isDefault`, `isAvailable`.
  - **Pedidos (`Order`):** Contiene `businessId`, `tableId?` (de `Table`), `customerLCoId?` (de `User` LCo), `waiterId?` (de `User` con rol `WAITER`), `orderNumber` (único por negocio, ej. "P-000001"), `status` (enum `OrderStatus`: `RECEIVED`, `IN_PROGRESS`, `PARTIALLY_READY`, `ALL_ITEMS_READY`, `COMPLETED`, `PAID`, `CANCELLED`, etc.), `totalAmount` (calculado por backend), `discountAmount?`, `finalAmount`, `notes?` (generales del pedido), `source?` (ej. `CUSTOMER_APP`, `WAITER_APP`), `orderType` (enum `OrderType`).
  - **Ítems del Pedido (`OrderItem`):** Enlazado a `Order` y `MenuItem`. Contiene `quantity`, `priceAtPurchase` (precio del `MenuItem` + suma de `priceAdjustment` de modificadores seleccionados, snapshot al momento del pedido), `totalItemPrice` (calculado: `priceAtPurchase * quantity`), `notes?` (del ítem), `kdsDestination` (snapshot del `MenuItem`), `status` (enum `OrderItemStatus`: `PENDING_KDS`, `PREPARING`, `READY`, `SERVED`, `CANCELLED`, `CANCELLATION_REQUESTED`), `itemNameSnapshot`, `itemDescriptionSnapshot`, `preparedAt`, `servedAt`.
  - **Modificadores del Ítem del Pedido (`OrderItemModifierOption`):** Tabla de unión entre `OrderItem` y `ModifierOption`. Incluye `optionNameSnapshot` y `optionPriceAdjustmentSnapshot`.
  - **Mesas (`Table`):** `businessId`, `identifier` (string legible y único por negocio, ej. "MESA-05", usado en QR y URL), `capacity?`, `zone?`.
  - **Personal (`StaffPin` y Roles `UserRole`):** `User` con roles `WAITER`, `KITCHEN_STAFF`, `BAR_STAFF`. `StaffPin` para login rápido de personal (PIN hasheado).
- **Flujo de Pedido LC - Cliente:**
  - **Acceso Primario:** Escaneo de QR en mesa que lleva a `/m/:businessSlug/:tableIdentifier`.
  - **Detección de Pedido Activo:** `PublicMenuViewPage` revisa `localStorage` (clave `loyalpyme_active_order_info_...`). Si existe, muestra un aviso del pedido en curso y enlace a `OrderStatusPage`, deshabilitando la creación de un nuevo pedido hasta que el activo se finalice o el usuario elija "Empezar Nuevo Pedido Separado" (funcionalidad futura para este botón).
  - **Creación de Nuevo Pedido (si no hay pedido activo):**
    - Pedido anónimo por defecto.
    - Login/Registro LCo opcional: para ganar puntos, `customerId` se asocia al `Order`.
    - DTO de Pedido Frontend (`CreateOrderPayloadDto`): Envía `items: [{menuItemId, quantity, notes?, selectedModifierOptions: [{modifierOptionId}] }]`, `orderNotes?`, `tableIdentifier?`, `customerId?`.
    - Validación y Creación en Backend: El backend revalida todo (disponibilidad, reglas de modificadores) y recalcula precios (`priceAtPurchase`, `totalItemPrice`, `totalAmount`). Creación transaccional.
    - Persistencia del Carrito de "Nuevo Pedido": Frontend usa `localStorage` para guardar el carrito no enviado, permitiendo al cliente continuar después (estas claves se limpian si se detecta un pedido activo o al enviar).
  - **Visualización de Estado del Pedido (`OrderStatusPage`):** Polling para actualizaciones. Limpia `localStorage` del pedido activo cuando este alcanza estado `PAID` o `CANCELLED` y el usuario opta por iniciar uno nuevo.
- **Internacionalización (i18n):**
  - **Frontend:** `i18next` con archivos JSON (`es/translation.json`, `en/translation.json`) para todos los textos de la UI.
  - **Backend:** Los modelos de datos de la carta (Categorías, Ítems, Modificadores) almacenan campos de texto en múltiples idiomas (ej. `name_es`, `name_en`). API pública de menú devuelve todos los campos de idioma. Snapshots en `OrderItem` y `OrderItemModifierOption` guardan los nombres en el idioma principal (ej. `_es`) en el momento del pedido.
- **Almacenamiento de Imágenes:** Cloudinary, con subida gestionada por el backend y recorte en el frontend para administradores.
- **Arquitectura de Servicios y Controladores (Backend):** Lógica de negocio encapsulada en servicios; controladores manejan HTTP req/res y validación básica.
- **Hooks Personalizados (Frontend):** Para encapsular lógica de obtención, gestión de estado y mutación de datos (ej. `useAdminMenuCategories`, `useUserProfileData`, `useAdminMenuItems`).

---

## 4. Lecciones Aprendidas & Troubleshooting Clave 💡

- **Configuración de Seed y Prisma CLI:** La sección `"prisma": { "seed": "ts-node prisma/seed.ts" }` en `package.json` (o la configuración directa del comando `seed` en `package.json`) es vital para que `npx prisma db seed` funcione con TypeScript. **Siempre ejecutar `npx prisma generate` después de `npx prisma migrate dev` o `npx prisma migrate reset`** para sincronizar el Cliente Prisma con el schema.
- **Sincronización de Tipos Prisma y TypeScript (VS Code):** Después de `npx prisma generate`, es frecuentemente necesario **reiniciar el servidor TypeScript de VS Code** (Ctrl+Shift+P > "TypeScript: Restart TS server") para que el editor reconozca correctamente los nuevos campos o cambios en los tipos de los modelos. Sin esto, pueden aparecer errores de tipo falsos que no son errores de compilación reales de `tsc`.
- **Errores P2002 (Unique Constraint Failed) en `seed.ts`**: Usualmente indican que el script se está ejecutando sin un `npx prisma migrate reset` previo, intentando insertar datos que ya existen y violan una restricción `@@unique`.
- **Gestión de Estado Complejo en Frontend (LC - `PublicMenuViewPage.tsx`):**
  - El estado `configuringItem` para personalizar ítems, el estado `currentOrderItems` para el carrito de nuevo pedido, y ahora los estados `activeOrderIdForTable`/`activeOrderNumberForTable` requieren una gestión cuidadosa de su ciclo de vida, persistencia en `localStorage` y limpieza para evitar conflictos y asegurar una UX coherente.
  - Evitar bucles de renderizado (`Maximum update depth exceeded`) separando la lógica de cálculo de la actualización de estado y controlando las dependencias de `useEffect` y `useCallback`.
- **Errores de Tipo y Lógica en Backend (Transacciones, Creación Anidada):**
  - Las transacciones Prisma (`prisma.$transaction`) son esenciales para operaciones complejas.
  - Los tipos de input para creación anidada (ej. `OrderItemCreateWithoutOrderInput`) pueden ser más restrictivos que los de actualización directa (`OrderItemUpdateInput`). Si un campo es requerido en el schema pero no permitido en el input de creación anidada, debe establecerse en un paso posterior o la lógica de la aplicación debe asegurar que se calcule/complete de otra forma.
- **Internacionalización (i18n) Frontend:**
  - La depuración de `missingKey` requiere verificar la ruta completa de la clave en los archivos JSON, la correcta carga del namespace (usar `debug: true` en `i18n.ts`), y la limpieza de caché del navegador y del servidor de desarrollo Vite.
- **Manejo de Archivos (Multer/Cloudinary):** Configuración correcta de Multer (storage, fileFilter, limits) y el flujo de subida a Cloudinary (manejo de buffers/streams, gestión de errores).
- **Testing:** La complejidad creciente subraya la necesidad de tests unitarios (especialmente para lógica de servicios como `kds.service.ts` y `tier-logic.service.ts`) y tests de integración para los flujos API.

_(Para una guía más exhaustiva de problemas específicos, consulta [TROUBLESHOOTING_GUIDE.md](./TROUBLESHOOTING_GUIDE.md))_

---

## 5. Próximos Pasos Inmediatos / Prioridades (Foco en Módulo Camarero - LC) ⏳📌

1.  ⭐ **LC - KDS Backend: Depurar y Finalizar Lógica de Actualización de `Order.status` (Tarea B1.1 del `DEVELOPMENT_PLAN.md`): [CRÍTICO - BLOQUEANTE ACTUAL]**

    - **Objetivo:** Asegurar que el `Order.status` general (ej. `IN_PROGRESS`, `PARTIALLY_READY`, `ALL_ITEMS_READY`, `COMPLETED`) se actualice de forma correcta, consistente y predecible en `kds.service.ts` cuando los `OrderItemStatus` cambian.
    - **Acciones:** Utilizar logs detallados para analizar el flujo de condiciones dentro de `updateOrderItemStatus`. Probar exhaustivamente todas las transiciones de estado de ítems y verificar el impacto en el estado del pedido general. Asegurar que el estado `RECEIVED` transiciona correctamente a `IN_PROGRESS` al primer cambio de un ítem.

2.  ⭐ **LC - KDS Frontend: Interfaz Visual y Funcional Básica (Tarea B1.2 del `DEVELOPMENT_PLAN.md`): [CRÍTICO - SIGUIENTE UNA VEZ B1.1 ESTÉ ESTABLE]**

    - **Objetivo:** Desarrollar la interfaz de usuario básica para que el personal de cocina/barra pueda visualizar los ítems de los pedidos entrantes y actualizar su estado de preparación.
    - **Acciones Inmediatas (Post-B1.1):**
      1.  Crear la estructura de la página/componente KDS (ej. `KitchenDisplayPage.tsx`).
      2.  Implementar la lógica para llamar a `GET /api/camarero/kds/items` (con selector de `kdsDestination`) y mostrar los `OrderItem`s en tarjetas o columnas.
      3.  Implementar la funcionalidad en cada tarjeta de ítem para llamar a `PATCH /api/camarero/kds/items/:orderItemId/status` y actualizar la UI correspondientemente.
      4.  Implementar polling para refrescar la lista de ítems.

3.  ⭐ **LC - Cliente/Backend: Añadir Ítems a Pedido Existente (Extensión Tarea B2.1 del `DEVELOPMENT_PLAN.md`): [ALTA]**

    - **Backend:**
      1.  Implementar el servicio `addItemsToExistingOrder` en `public/order.service.ts`.
      2.  Implementar el controlador `addItemsToOrderHandler` en `public/order.controller.ts`.
      3.  Añadir la ruta `POST /public/order/:existingOrderId/add-items` en `public-order.routes.ts`.
    - **Frontend (`PublicMenuViewPage.tsx`):**
      1.  Modificar la UI para que, si hay un `activeOrderIdForTable`, permita seleccionar ítems para "Añadir al Pedido Activo".
      2.  Gestionar un estado temporal para estos ítems adicionales.
      3.  Implementar la lógica para enviar estos ítems al nuevo endpoint del backend.

4.  **(Paralelo/Continuo) Testing y Fundamentos Técnicos (Tareas C del `DEVELOPMENT_PLAN.md`):**
    - Escribir tests unitarios y de integración para la lógica de `Order.status` en `kds.service.ts` una vez que esté depurada y estable.
    - Comenzar a aplicar validación con Zod a los DTOs y payloads de los endpoints públicos (`/public/order/*`) y de KDS (`/api/camarero/kds/*`).

_(Para ver la hoja de ruta completa, el backlog detallado y las funcionalidades futuras, consulta el `DEVELOPMENT_PLAN.md` actualizado)._

---

## 6. Información Adicional ℹ️

- **Licencia:** Software Propietario. Copyright (c) 2024-2025 Olivier Hottelet. Todos los derechos reservados. Consulta [LICENSE.md](./LICENSE.md) para más detalles.
- **Flujos de Trabajo Detallados:** Para una comprensión profunda de cómo operan los módulos y su integración, consultar:
  - `LOYALPYME_CORE_WORKFLOW.md`
  - `LOYALPYME_CAMARERO_WORKFLOW.md`
  - `MODULE_INTEGRATION_WORKFLOW.md`

---
