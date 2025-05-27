# LoyalPyME - Estado del Proyecto y Decisiones Clave

**Versión Actual:** 1.19.0 (LC: KDS Backend validado, KDS Frontend con visualización y acciones de estado implementadas)
**Fecha de Última Actualización:** 28 de Mayo de 2025

---

## 1. Resumen General del Proyecto LoyalPyME 🎯

- **Concepto:** LoyalPyME es una plataforma web integral, diseñada como una solución Software as a Service (SaaS) modular, orientada a Pequeñas y Medianas Empresas (PyMEs). Su arquitectura full-stack se basa en tecnologías modernas:
  - **Frontend:** React con TypeScript, utilizando Vite como herramienta de construcción y Mantine UI para la biblioteca de componentes, asegurando una experiencia de usuario responsive y moderna. La navegación se gestiona con React Router DOM y la internacionalización (i18n) con `i18next`.
  - **Backend:** Node.js con Express.js y TypeScript, interactuando con una base de datos PostgreSQL a través del ORM Prisma. La autenticación se maneja con JSON Web Tokens (JWT).
    La plataforma ofrece dos módulos principales que los negocios pueden activar según sus necesidades:
  - **LoyalPyME Core (LCo):** Un sistema de fidelización digital robusto y completo. **[Funcionalmente Completo para MVP]**.
    - **Características Clave LCo:** Gestión integral de clientes (con roles), sistema de acumulación de puntos (configurable por negocio), niveles de fidelización (tiers) con beneficios personalizables (multiplicadores de puntos, acceso a recompensas exclusivas, beneficios textuales), catálogo de recompensas canjeables (con soporte i18n para nombres/descripciones e imágenes individuales), generación de códigos QR únicos para la asignación de puntos en transacciones físicas, y un panel de cliente interactivo donde pueden visualizar su progreso, saldo de puntos, recompensas disponibles, regalos asignados por el administrador, y el historial de su actividad en el programa.
  - **LoyalPyME Camarero (LC):** Un módulo avanzado, **[En Desarrollo Activo - KDS Funcional con Acciones]**, diseñado para digitalizar y optimizar la operativa de servicio en el sector de la hostelería (restaurantes, bares, cafeterías).
    - **Funcionalidades Clave LC Implementadas:**
      1.  **Gestión Completa de Carta Digital (Admin):** Interfaz administrativa para crear, editar y organizar categorías del menú (con imágenes), ítems del menú (con detalles como i18n para nombre/descripción, precio, imagen, lista de alérgenos, etiquetas personalizables, tiempo de preparación estimado, calorías, SKU, y destino KDS), y grupos de modificadores con opciones configurables (tipo de UI radio/checkbox, selecciones mínimas/máximas, obligatoriedad, ajustes de precio).
      2.  **Visualización de Carta y Toma de Pedidos por Cliente:** Acceso a través de URL específica (ej. `/m/:businessSlug/:tableIdentifier?`), idealmente mediante escaneo de QR en mesa. Interfaz interactiva y responsive para explorar la carta, personalizar ítems con modificadores (con cálculo de precio dinámico en tiempo real), añadir a un carrito de compra local persistente (`localStorage`), revisar el pedido, añadir notas generales y enviar la comanda directamente al sistema.
      3.  **Gestión de Pedido Activo por Cliente:** La `PublicMenuViewPage` detecta si ya existe un pedido activo para esa mesa/navegador (información guardada en `localStorage`) y adapta la UI para mostrar el número de pedido en curso y un enlace a su estado, o permitir añadir más ítems (funcionalidad de "Añadir a Pedido Existente" planeada).
      4.  **Visualización del Estado del Pedido por Cliente:** La página `OrderStatusPage` muestra el estado general del pedido y el estado individual de cada ítem (ej. "En preparación", "Listo para servir"), actualizándose automáticamente mediante polling. Gestiona la lógica de "pedido finalizado" (cuando el estado es `PAID` o `CANCELLED`) para limpiar el `localStorage` y permitir al cliente iniciar un nuevo pedido.
      5.  **API KDS (Backend): [COMPLETADA Y VALIDADA]** Endpoints robustos (`/api/camarero/kds/*`) para que las pantallas de cocina/barra (KDS) obtengan los `OrderItem`s filtrados por destino (ej. "COCINA", "BARRA") y estado de preparación. Permite actualizar el `OrderItemStatus` (ej. de `PENDING_KDS` a `PREPARING`, luego a `READY`, o a `CANCELLED`). Crucialmente, la lógica en `kds.service.ts` que actualiza el `Order.status` general del pedido (ej. a `IN_PROGRESS`, `PARTIALLY_READY`, `ALL_ITEMS_READY`) basada en los cambios de estado de sus ítems ha sido **validada y funciona correctamente.**
      6.  **Interfaz KDS (Frontend - MVP): [FUNCIONALIDAD BASE COMPLETADA]** La página `/admin/kds` (`KitchenDisplayPage.tsx`) permite al personal de cocina/barra autenticado:
          - Seleccionar su destino KDS (ej. "COCINA", "BARRA").
          - Visualizar una lista de los ítems de pedidos activos (`PENDING_KDS`, `PREPARING`) para ese destino, mostrando detalles como nombre, cantidad, modificadores seleccionados, notas, número de pedido, mesa y hora.
          - Actualizar el estado de cada `OrderItem` mediante botones de acción ("Empezar Preparación", "Marcar como Listo", "Cancelar Ítem").
          - La lista se refresca mediante polling.
- **Componentes Tecnológicos Clave Detallados:**
  - **Backend:** Node.js (runtime JavaScript), Express.js (framework web), TypeScript (tipado estático), Prisma ORM (interacción con base de datos PostgreSQL, versión 6+), PostgreSQL (base de datos relacional), JSON Web Tokens (JWT) (para autenticación stateless basada en tokens), `bcryptjs` (hashing de contraseñas), Cloudinary SDK (almacenamiento y gestión de imágenes en la nube), Multer (middleware para manejo de subidas de archivos multipart/form-data), Swagger/OpenAPI (`swagger-jsdoc`, `swagger-ui-express`) (para documentación interactiva de la API), `node-cron` (para ejecución de tareas programadas, como la lógica de actualización de tiers en LCo).
  - **Frontend:** React (biblioteca para construir interfaces de usuario, versión 19+ con Hooks), TypeScript (tipado estático), Vite (herramienta de construcción y servidor de desarrollo rápido, versión 5+), Mantine UI (biblioteca de componentes React, versión 7+), Axios (cliente HTTP para peticiones a la API), React Router DOM (gestión de rutas en la aplicación de página única, versión 6+), `i18next` y `react-i18next` (para internacionalización completa ES/EN con archivos JSON de traducción), `html5-qrcode` (para la funcionalidad de escaneo de QR por el cliente en LCo), `react-image-crop` (para la funcionalidad de recorte de imágenes en los paneles de administración).
  - **Testing:** Vitest (framework de testing unitario y de integración para backend y frontend, compatible con el ecosistema Vite).
- **Licencia:** Software Propietario. Copyright (c) 2024-2025 Olivier Hottelet. Todos los derechos reservados. (Ver `LICENSE.md`).
- **Áreas Funcionales Principales de la Plataforma (Detallado):**
  - **Panel Super Admin (`/superadmin`):** Interfaz exclusiva para el rol `SUPER_ADMIN`. Permite la administración global de todas las instancias de negocios clientes registradas en la plataforma. Funcionalidades: listar negocios, ver su estado general (`isActive`), y activar/desactivar individualmente los módulos principales (LoyalPyME Core - `isLoyaltyCoreActive`, LoyalPyME Camarero - `isCamareroActive`) para cada negocio.
  - **Panel de Administración del Negocio (`/admin/dashboard/*`):** Interfaz para el rol `BUSINESS_ADMIN` de cada negocio. Las funcionalidades visibles y accesibles se adaptan según los módulos activados para su negocio.
    - **LCo (si `isLoyaltyCoreActive`):** Gestión completa de clientes del programa de fidelización (listado, filtros, búsqueda, ver detalles, editar notas, ajustar puntos, cambiar nivel manualmente, asignar recompensas como regalo, activar/desactivar cuentas), gestión de recompensas (CRUD con i18n e imágenes), gestión de niveles/tiers (CRUD de tiers y sus beneficios asociados), configuración global del programa de fidelización (base y periodo de cálculo de tiers, políticas de descenso), generación de QR de puntos para transacciones.
    - **LC (si `isCamareroActive` - `/admin/dashboard/camarero/*`):** Gestión completa de la carta digital (CRUD de categorías, ítems, grupos de modificadores y opciones de modificadores, con soporte i18n, imágenes, precios, etc.). (Futuro: gestión de mesas, personal, PINs, configuración de destinos KDS, asignación de permisos granulares a staff).
  - **Interfaz KDS (Módulo LC - `/admin/kds`):** **[NUEVO]** Interfaz para roles de staff de cocina/barra (`KITCHEN_STAFF`, `BAR_STAFF`) y `BUSINESS_ADMIN`. Permite visualizar los `OrderItem`s pendientes y en preparación para un `kdsDestination` específico, y cambiar su estado de preparación.
  - **Portal de Cliente Final (LCo - `/customer/dashboard`):** Dashboard personalizado para el rol `CUSTOMER_FINAL`. Muestra saldo de puntos, nivel actual y progreso al siguiente, catálogo de recompensas canjeables y regalos pendientes (con imágenes y descripciones i18n), historial detallado de actividad de puntos (paginado), y funcionalidad para validar QR de puntos (escaneo o manual). Si el módulo LC está activo para el negocio, incluye una tarjeta de acceso directo a la carta digital del negocio.
  - **Interfaces Públicas del Módulo Camarero (LC):**
    - **Carta Digital Pública (`/m/:businessSlug/:tableIdentifier?`):** Página accesible sin login. Muestra la carta del negocio (identificado por `businessSlug`) de forma interactiva. Permite al cliente seleccionar ítems, personalizarlos con modificadores (cálculo de precio dinámico), añadir a un carrito local (`localStorage` asociado a `businessSlug` y `tableIdentifier`), revisar el pedido, añadir notas generales y enviar la comanda. Detecta si ya hay un pedido activo para esa mesa/navegador y adapta la UI (mostrando estado o permitiendo añadir a pedido - esta última funcionalidad de añadir está pendiente).
    - **Visualización Estado del Pedido Cliente (`/order-status/:orderId`):** Página accesible sin login (conociendo el `orderId`). Muestra el estado general del pedido (`Order.status`) y el estado individual de cada `OrderItem` (`OrderItem.status`), con actualizaciones automáticas por polling. Gestiona la lógica de "pedido finalizado" (`PAID` o `CANCELLED`) para limpiar el `localStorage` relevante y permitir al cliente iniciar un nuevo pedido desde la carta.
- **Propósito y Visión:** Convertirse en la herramienta digital de referencia, modular y altamente adaptable, que impulse la fidelización de clientes (LCo) y optimice drásticamente la operativa de servicio en PyMEs (LC), con un foco especial en el sector hostelero. El objetivo es mejorar la recurrencia de clientes, aumentar el ticket promedio, facilitar la gestión del negocio y enriquecer la relación cliente-negocio a través de experiencias digitales eficientes y gratificantes.

_(Para una descripción más detallada de la visión a largo plazo, consulta el [README.md](./README.md). Para la hoja de ruta y el backlog de funcionalidades, revisa [DEVELOPMENT_PLAN.md](./DEVELOPMENT_PLAN.md). Para los flujos de trabajo detallados de cada módulo, consulta `LOYALPYME_CORE_WORKFLOW.md`, `LOYALPYME_CAMARERO_WORKFLOW.md`, y `MODULE_INTEGRATION_WORKFLOW.md`)._

---

## 2. Estado Actual Detallado (Hitos Completados y En Progreso - v1.19.0) 📝

- **Fase 1 (Núcleo Operativo LCo + Pulido Inicial): [COMPLETADO]**

  - **Autenticación Completa:** Flujos de registro de negocios (con primer `BUSINESS_ADMIN`), registro de `CUSTOMER_FINAL` (asociados a un negocio), login robusto con JWT (expiración configurada, refresh tokens no implementados aún), y funcionalidad completa de reseteo de contraseña (token por email/consola, expiración de token).
  - **Panel de Administración LCo - CRUDs Completos:**
    - **Gestión de Recompensas:** Creación, edición (incluyendo subida de imágenes a Cloudinary con recorte 1:1 y previsualización), activación/desactivación y eliminación. Soporte multi-idioma (ES/EN) para `name` y `description` persistido en campos i18n (`name_es`, `name_en`, etc.).
    - **Gestión de Niveles (Tiers):** CRUD para niveles, definición de umbrales (`minValue` basados en la métrica configurada), y asignación de `TierBenefit` específicos por nivel (tipos: multiplicador de puntos, acceso a recompensa exclusiva, beneficio personalizado con texto descriptivo).
    - **Configuración Global del Sistema de Tiers:** Habilitación/deshabilitación del sistema, selección de la base de cálculo (`TierCalculationBasis`: gasto, visitas, o puntos históricos), periodo de cálculo (`tierCalculationPeriodMonths`: 0 para histórico total o N meses móviles), política de descenso (`TierDowngradePolicy`: nunca, revisión periódica, o por inactividad), y periodo de inactividad (`inactivityPeriodMonths`).
    - **Gestión Avanzada de Clientes:** Listado paginado de clientes con búsqueda por nombre/email, filtros por estado (Activo/Inactivo), Favorito, y Nivel actual. Funcionalidades CRUD para clientes, incluyendo: añadir/editar notas internas de administrador, ajuste manual de puntos (con campo de motivo, genera `ActivityLog`), cambio manual de nivel (actualiza `tierAchievedAt`), asignación de recompensas del catálogo como regalo (crea `GrantedReward` en estado `PENDING`), activación/desactivación de cuentas de cliente, y marcado/desmarcado como favorito. Implementadas acciones masivas sobre clientes seleccionados (activar/desactivar, eliminar con validaciones, ajustar puntos).
  - **Flujo Completo de Puntos y QR en LCo:**
    - **Generación de QR (Admin):** El `BUSINESS_ADMIN` introduce importe de venta y número de ticket/referencia. El backend genera un `QrCode` con token UUID único, `amount`, `ticketNumber`, `expiresAt` (configurable), y estado `PENDING`.
    - **Validación de QR (Cliente):** El `CUSTOMER_FINAL`, desde su dashboard, valida el QR introduciendo el token manualmente o escaneando el código con la cámara del móvil (usando `html5-qrcode`). El backend valida el token (existencia, no usado, no expirado, pertenencia al negocio del cliente), calcula los puntos (considerando `Business.pointsPerEuro` y multiplicadores de nivel del cliente), actualiza el saldo de puntos del cliente, `totalSpend`, `totalVisits`, `lastActivityAt`, marca el `QrCode` como `COMPLETED` (con `userId` y `pointsEarned`), y registra la transacción en `ActivityLog`.
  - **Lógica de Tiers Automática (Backend LCo):** Tarea programada (`node-cron`, configurable vía `TIER_UPDATE_CRON_SCHEDULE`) que se ejecuta periódicamente para:
    - Recalcular el nivel de los clientes basado en la `TierCalculationBasis` y `tierCalculationPeriodMonths` configuradas por el negocio.
    - Aplicar descensos de nivel según la `TierDowngradePolicy` (si es `PERIODIC_REVIEW` o `AFTER_INACTIVITY` y se cumplen las condiciones).
  - **Panel de Cliente Completo LCo (`CustomerDashboardPage.tsx`):** Interfaz de usuario con múltiples pestañas:
    - **Resumen:** Vista general con puntos actuales, nivel actual (nombre y beneficios), barra de progreso visual hacia el siguiente nivel (con indicación de métrica faltante y previsualización de beneficios del siguiente nivel en popover), listado de regalos (`GrantedReward` `PENDING`) y algunas recompensas destacadas (con botones de canje directo si aplican), y la sección para validar QR. Tarjeta de acceso a la carta del Módulo Camarero si está activo.
    - **Recompensas:** Catálogo completo y visual (`RewardList.tsx`) de todas las recompensas `isActive: true` canjeables por puntos (mostrando coste, imagen, descripción i18n), así como los regalos `PENDING` otorgados. Funcionalidad de canje (descuenta puntos y crea `ActivityLog` para recompensas por puntos; actualiza estado de `GrantedReward` y crea `ActivityLog` para regalos).
    - **Actividad:** Historial paginado y cronológico de todas las transacciones (`ActivityLog`) de puntos y canjes, con descripciones claras y fechas.
  - **Mejoras UI/UX Iniciales:** Aplicadas en toda la plataforma para mejorar la consistencia y usabilidad.
  - **Internacionalización (i18n) Frontend:** Implementación base con `i18next` y archivos de traducción JSON (`es/translation.json`, `en/translation.json`) para la mayoría de los textos visibles en la UI.
  - **Documentación API Backend (Swagger/OpenAPI):** Generada y accesible en el endpoint `/api-docs` para los servicios LCo y algunos de plataforma.

- **Fase 2 (Fundamentos Multi-Módulo y Panel Super Admin): [COMPLETADO]**

  - **Implementación del Panel Super Admin (`/superadmin`):** Interfaz funcional para el rol `SUPER_ADMIN`. Permite listar todos los negocios registrados, ver su estado general (`isActive`) y el estado de activación de sus módulos (`isLoyaltyCoreActive`, `isCamareroActive`). Permite al Super Admin activar/desactivar estos flags para cada negocio mediante switches.
  - **Middleware `checkModuleActive` (Backend):** Implementado y funcional. Verifica si un módulo requerido (ej. `LOYALTY_CORE`, `CAMARERO`) está activo para el negocio del usuario autenticado antes de permitir el acceso a un endpoint específico de ese módulo.
  - **Lógica Condicional en UI Frontend:** Componentes como `AdminNavbar` y `CustomerDashboardPage` adaptan la interfaz y las opciones disponibles (ej. enlaces de navegación, secciones visibles) según los módulos (`isLoyaltyCoreActive`, `isCamareroActive`) activos para el negocio del usuario, obtenidos del perfil del usuario.
  - **Payload de Perfil de Usuario Enriquecido (`/api/profile`):** El endpoint que devuelve el perfil del usuario autenticado ahora incluye `isActive` (del negocio), `isLoyaltyCoreActive`, `isCamareroActive`, además de `businessSlug`, `businessName`, y `businessLogoUrl` del negocio asociado para roles `BUSINESS_ADMIN` y `CUSTOMER_FINAL`, permitiendo al frontend personalizar la experiencia y el acceso a funcionalidades.
  - **Script de Seed (`prisma/seed.ts`): [ACTUALIZADO - FUNCIONAL v7]** El script ha sido corregido y mejorado. Ahora puebla la base de datos (`npx prisma db seed` tras `npx prisma migrate reset`) con un conjunto de datos de demostración exhaustivos y consistentes para ambos módulos (LCo y LC). Esto incluye: un negocio demo preconfigurado (Restaurante Demo LoyalPyME) con módulos LC y LCo activos, un usuario administrador, varios clientes de prueba (con diferente historial), tiers, recompensas, una carta digital completa (categorías, ítems con precios, imágenes placeholder, alérgenos, tags, modificadores con opciones y ajustes de precio), mesas, y personal de LC con roles y PINs. También crea pedidos de ejemplo con `OrderItem`s destinados a diferentes KDS. Se resolvieron problemas previos de TypeScript y ejecución, y se asegura la correcta persistencia de `priceAtPurchase` y `totalItemPrice` en `OrderItem`.

- **Fase 3 (Desarrollo Módulo "LoyalPyME Camarero" - LC): [EN PROGRESO AVANZADO - KDS MVP COMPLETADO]**
  - **LC - Fundamentos Backend (Modelos BD y API Gestión Carta): [COMPLETADO]**
    - **Modelos Prisma Detallados:**
      - `Table`: `identifier` (para QR), `zone`, `capacity`.
      - `MenuCategory`: `name_es/en`, `description_es/en`, `imageUrl`, `position`, `isActive`.
      - `MenuItem`: `name_es/en`, `description_es/en`, `price` (Decimal), `imageUrl`, `allergens` (array de strings), `tags` (array de strings), `isAvailable`, `position`, `preparationTime` (Int?), `calories` (Int?), `sku` (String?), `kdsDestination` (String, ej. "COCINA", "BARRA", "POSTRES"), `categoryId`, `businessId`.
      - `ModifierGroup`: `menuItemId`, `name_es/en`, `uiType` (Enum `ModifierUiType.RADIO | CHECKBOX`), `minSelections`, `maxSelections`, `isRequired`, `position`.
      - `ModifierOption`: `groupId`, `name_es/en`, `priceAdjustment` (Decimal), `position`, `isDefault`, `isAvailable`.
      - `Order`: `businessId`, `tableId?`, `customerLCoId?`, `waiterId?`, `orderNumber` (String único generado, ej. P-000001), `status` (Enum `OrderStatus`), `totalAmount` (Decimal), `discountAmount?`, `finalAmount`, `orderNotes?`, `source` (Enum `OrderSource.CUSTOMER_APP | WAITER_APP | POS`), `orderType` (Enum `OrderType.DINE_IN | TAKE_AWAY | DELIVERY`), `createdAt`, `updatedAt`, `confirmedAt?`, `billedAt?`, `paidAt?`.
      - `OrderItem`: `orderId`, `menuItemId`, `quantity`, `priceAtPurchase` (Decimal, snapshot del precio unitario con modificadores), `totalItemPrice` (Decimal, `priceAtPurchase * quantity`), `itemNotes?`, `status` (Enum `OrderItemStatus`), `kdsDestination` (snapshot), `itemNameSnapshot_es/en`, `itemDescriptionSnapshot_es/en`, `preparedAt?`, `servedAt?`.
      - `OrderItemModifierOption`: Tabla de unión `OrderItem` <> `ModifierOption`, con `optionNameSnapshot_es/en` y `optionPriceAdjustmentSnapshot` (Decimal).
      - `StaffPin`: `userId` (para `WAITER`, `KITCHEN_STAFF`, `BAR_STAFF`), `pinHash`, `description`, `isActive`.
      - Enums `UserRole` extendido, `OrderStatus`, `OrderItemStatus`, `OrderType`, `OrderSource` definidos y migrados.
    - **API CRUD Admin Carta (`/api/camarero/admin/*`):** Endpoints RESTful completos y protegidos (autenticación, rol `BUSINESS_ADMIN`, módulo LC activo) para gestionar `MenuCategory`, `MenuItem` (incluyendo sus `ModifierGroup`s), y `ModifierOption`s.
  - **LC - Frontend: UI Admin para Gestión de Carta Digital: [COMPLETADO]**
    - Página `/admin/dashboard/camarero/menu-editor` (`MenuManagementPage.tsx`) orquestando los componentes de gestión.
    - Componentes:
      - `MenuCategoryManager.tsx`: CRUD de categorías, incluyendo subida y recorte (aspecto 1:1) de imágenes a Cloudinary.
      - `MenuItemManager.tsx`: Listado de ítems por categoría seleccionada.
      - `MenuItemFormModal.tsx`: Modal CRUD completo para ítems, soportando todos los campos (i18n, precio, imagen con recorte 1:1, alérgenos, tags, disponibilidad, posición, tiempo preparación, calorías, SKU, destino KDS). Permite acceder a la gestión de grupos de modificadores.
      - `ModifierGroupsManagementModal.tsx`: Modal para CRUD de `ModifierGroup`s asociados a un ítem.
      - `ModifierOptionsManagementModal.tsx`: Modal para CRUD de `ModifierOption`s dentro de un grupo.
    - Hooks de datos (`useAdminMenuCategories`, `useAdminMenuItems`, `useAdminModifierGroups`, `useAdminModifierOptions`) y tipos (`frontend/src/types/menu.types.ts`) implementados y funcionales.
    - Botón "Previsualizar Carta Pública" en `MenuManagementPage.tsx` para administradores (usa `businessSlug` del `userData` del perfil).
  - **LC - Backend y Frontend: Visualización de Carta Pública y Flujo de Pedido por Cliente: [COMPLETADO]**
    - **Backend (API Pública de Menú - `/public/menu/business/:businessSlug`):** Endpoint público que sirve la carta digital completa del negocio (solo categorías e ítems activos/disponibles), ordenada por `position`, con todos los campos i18n, y con la estructura anidada de modificadores y opciones (solo activos/disponibles).
    - **Frontend (Visualización de Carta - `/m/:businessSlug/:tableIdentifier?` - `PublicMenuViewPage.tsx`):**
      - Muestra interactiva de la carta con `CategoryAccordion.tsx` (acordeones por categoría con imagen y descripción).
      - `MenuItemCard.tsx` para cada ítem, mostrando imagen, nombre (i18n), descripción (i18n), precio, alérgenos y tags.
      - `ModifierGroupInteractiveRenderer.tsx` para presentar los grupos de modificadores (Radio/Checkbox) permitiendo al cliente personalizar su selección con actualización dinámica del precio del ítem en la tarjeta y validación de reglas (`minSelections`, `maxSelections`, `isRequired`).
      - Funcionalidad "Añadir al Carrito": Los ítems configurados (con cantidad y notas opcionales) se añaden a un estado de carrito local (`currentOrderItems`).
      - Persistencia del Carrito: El `currentOrderItems` y las `orderNotes` generales del pedido se guardan en `localStorage` (asociado a `businessSlug` y `tableIdentifier`) para mantener el pedido entre sesiones o refrescos de página, siempre que no haya un pedido activo ya enviado para esa mesa.
    - **Frontend (Modal del Carrito y Envío - `ShoppingCartModal.tsx` en `PublicMenuViewPage.tsx`):**
      - Barra superior sticky (si hay ítems en el carrito) muestra resumen (total ítems, precio total) y botón para abrir el modal del carrito.
      - Modal del carrito: Lista detallada de ítems, permite modificar cantidad (con recalculo de total), eliminar ítems, añadir/editar notas generales del pedido, y vaciar completamente el carrito.
      - Envío del pedido al backend.
    - **Backend (Creación de Pedido - `POST /public/order/:businessSlug`):**
      - API recibe `CreateOrderPayloadDto` (con `items: [{menuItemId, quantity, notes?, selectedModifierOptions: [{modifierOptionId}] }]`, `orderNotes?`, `tableIdentifier?`, `customerId?` LCo).
      - Validación exhaustiva en backend: existencia y activación del negocio, activación del módulo Camarero, existencia y disponibilidad (`isAvailable`) de `MenuItem`s y `ModifierOption`s, pertenencia al negocio, cumplimiento de reglas de selección de modificadores (`minSelections`, `maxSelections`, `isRequired`).
      - **Recálculo de Precios en Backend (Seguridad):** Se recalcula `priceAtPurchase` (precio unitario del ítem + suma de `priceAdjustment` de modificadores seleccionados) y `totalItemPrice` (`priceAtPurchase * quantity`) para cada `OrderItem`, y `totalAmount`/`finalAmount` para el `Order`.
      - Creación transaccional de registros en BD: `Order` (con `tableId?` resuelto de `tableIdentifier`, `customerLCoId?`, `orderNotes?`, `orderNumber` único generado, `status: RECEIVED`, `source: CUSTOMER_APP`, `orderType: DINE_IN` por defecto), `OrderItem`s (con snapshots de nombre, descripción, destino KDS, etc.), y `OrderItemModifierOption`s (con snapshots de nombre y precio de opción).
      - Devuelve el objeto `Order` creado (con `id` y `orderNumber`).
    - **Frontend (Post-Envío Pedido en `PublicMenuViewPage.tsx`):**
      - Notificaciones de éxito (mostrando `orderNumber` o `id` del pedido) o error.
      - Limpieza del carrito de "nuevo pedido" (`currentOrderItems`, `orderNotes`) del `localStorage`.
      - **Guarda `activeOrderInfo = {orderId, orderNumber, savedAt}` en `localStorage`** (clave compuesta con `businessSlug` y `tableIdentifier`) para rastrear el pedido activo del cliente en esa mesa/navegador.
      - **Redirige** al cliente a la nueva página `/order-status/:orderId`, pasando `orderNumber`, `businessSlug`, y `tableIdentifier` en el `state` de la ruta para uso en la página de estado.
    - **Frontend (Acceso Cliente Logueado LCo):** Tarjeta "Ver la Carta y Pedir" en `SummaryTab.tsx` del `CustomerDashboardPage.tsx` si LC está activo para el negocio y el `businessSlug` está disponible en `userData`.
  - ⭐ **LC - KDS Backend (API y Lógica de Estados): [ACTUALIZADO - COMPLETADO Y VALIDADO]**
    - **Backend (`kds.service.ts` v1.1.1, `kds.controller.ts`, `camarero-kds.routes.ts`):**
    - Endpoint `GET /api/camarero/kds/items?destination=...[&status=...]`: Funcional. Devuelve `OrderItem`s (con `KdsOrderItemData`) filtrados por `kdsDestination` y opcionalmente por `OrderItemStatus`. Protegido por roles (`KITCHEN_STAFF`, `BAR_STAFF`, `BUSINESS_ADMIN`). Los ítems se ordenan por antigüedad del pedido.
    - Endpoint `PATCH /api/camarero/kds/items/:orderItemId/status`: Funcional. Permite actualizar el `OrderItemStatus` de un ítem (ej. a `PREPARING`, `READY`, `CANCELLED`). Registra `preparedAt`. Protegido por roles.
    - **Lógica de `Order.status` VALIDADA:** El servicio `kds.service.ts` actualiza correctamente el `Order.status` general (a `IN_PROGRESS`, `PARTIALLY_READY`, `ALL_ITEMS_READY`, etc.) en función de los estados agregados de todos los `OrderItem`s del pedido. Esta lógica ha sido probada y confirmada.
  - ⭐ **LC - Cliente: Visualización del Estado del Pedido: [COMPLETADO]**
    - **Backend (`public/order.service.ts`):** Endpoint `GET /public/order/:orderId/status` (`PublicOrderStatusInfo`) funcional y probado.
    - **Frontend (`PublicMenuViewPage.tsx` - Detección Pedido Activo):** Al cargar, verifica `localStorage` para `activeOrderInfoKey`. Si existe un pedido activo, muestra un aviso destacado con el número de pedido y un botón "Ver Estado" que enlaza a `OrderStatusPage`. El carrito para nuevos pedidos se oculta/deshabilita.
    - **Frontend (`OrderStatusPage.tsx`):**
    - Página creada y funcional. Lee `orderId` de la URL y datos (`orderNumber`, `businessSlug`, `tableIdentifier`) del `state` de navegación.
    - Obtiene y muestra la información del pedido (`Order.status` general, `orderNumber`, `createdAt`, `tableIdentifier`, `orderNotes`) y el estado de sus ítems (`itemNameSnapshot`, `quantity`, `OrderItemStatus` individual) llamando al endpoint `GET /public/order/:orderId/status`.
    - Implementa **polling básico** (cada 10 segundos) para actualizar automáticamente la información del estado, deteniéndose si el pedido es `PAID` o `CANCELLED`.
    - **Lógica de "Pedido Finalizado":** Si el `Order.status` (obtenido del backend) es `PAID` o `CANCELLED`, el polling se detiene. El botón "Actualizar Estado" cambia a "Empezar Nuevo Pedido en esta Mesa". Al pulsar este botón, se limpian las entradas relevantes de `localStorage` (`activeOrderInfoKey`, `cartStorageKey`, `notesStorageKey` para la mesa/negocio actual) y se redirige a la página del menú (`/m/:businessSlug/:tableIdentifier`).
    - Botón "Volver al Menú": Funcional, navega de vuelta a la carta.
    - Traducciones (i18n) implementadas para la página.
  - ⭐ **LC - KDS Frontend (Visualización y Acciones): [ACTUALIZADO - FUNCIONALIDAD BASE COMPLETADA]**
    - **Preparación Frontend General:**
      - `frontend/src/types/customer.ts` (v1.1.1): `UserRole` enum incluye `KITCHEN_STAFF`, `BAR_STAFF`.
      - `frontend/src/pages/LoginPage.tsx` (v1.6.4): Redirige correctamente a usuarios con rol `KITCHEN_STAFF` o `BAR_STAFF` a la ruta `/admin/kds`.
      - `frontend/src/components/PrivateRoute.tsx` (v1.1.0): Componente actualizado para reconocer y permitir el acceso a los nuevos roles de staff KDS.
      - `frontend/src/routes/index.tsx` (v1.1.0): Ruta `/admin/kds` configurada correctamente dentro de `MainLayout` y protegida para los roles KDS.
    - **Servicio KDS Frontend (`frontend/src/services/kdsService.ts` v1.0.2):** Creado e implementado. Define interfaces `KdsListItem` y `FullOrderItemKdsResponse` basadas en las respuestas reales de la API backend. Utiliza correctamente la `baseURL` de `axiosInstance`. Provee funciones `getItemsForKds` y `updateOrderItemKdsStatus`.
    - **Página KDS (`frontend/src/pages/admin/camarero/KitchenDisplayPage.tsx` v1.1.0):**
      - **Visualización de Ítems:** Muestra `OrderItem`s (obtenidos vía `getItemsForKds`) filtrados por `kdsDestination` ("COCINA" o "BARRA") y por estados `PENDING_KDS` y `PREPARING`. Cada ítem en la lista muestra: nombre i18n, cantidad, modificadores seleccionados (i18n), notas del ítem, número de pedido, identificador de mesa, hora de creación del pedido, y el estado actual del `OrderItem`.
      - **Selector de Destino KDS:** Componente `SegmentedControl` funcional para cambiar entre "COCINA" y "BARRA", recargando los ítems correspondientes.
      - **Polling:** La lista de ítems se refresca automáticamente cada `POLLING_INTERVAL_MS` (15 segundos). El polling se pausa si una acción de actualización de estado está en curso.
      - **Acciones de Cambio de Estado:**
        - Botones condicionales en cada tarjeta de ítem:
          - "Empezar Preparación": Si `OrderItem.status` es `PENDING_KDS`. Llama a `handleUpdateStatus` con `OrderItemStatus.PREPARING`.
          - "Marcar como Listo": Si `OrderItem.status` es `PREPARING`. Llama a `handleUpdateStatus` con `OrderItemStatus.READY`.
          - "Cancelar Ítem": Si `OrderItem.status` es `PENDING_KDS` o `PREPARING`. Llama a `handleUpdateStatus` con `OrderItemStatus.CANCELLED`.
        - **Lógica de `handleUpdateStatus`:**
          - Establece `updatingItemId` para mostrar feedback de carga en el botón presionado y deshabilitar otros botones temporalmente.
          - Llama a `updateOrderItemKdsStatus` del `kdsService`.
          - Muestra notificaciones (Mantine `notifications`) de éxito o error.
          - Tras una actualización exitosa, refresca la lista de ítems llamando a `fetchKdsItems(false)`.
      - **Traducciones (i18n):** Textos de la interfaz y notificaciones internacionalizados.

---

## 3. Key Concepts & Design Decisions 🔑

- **Arquitectura Modular y Activación por Negocio:**
  - La plataforma soporta módulos discretos (`LOYALTY_CORE`, `CAMARERO`) que pueden ser activados o desactivados para cada `Business` por un `SUPER_ADMIN` desde `/superadmin`.
  - El payload del perfil de usuario (`req.user`) incluye los flags `isLoyaltyCoreActive` e `isCamareroActive` del negocio asociado.
  - El acceso a funcionalidades (APIs backend y componentes UI frontend) está condicionado por la activación del módulo correspondiente y el rol del usuario.
  - Middleware `checkModuleActive(moduleCode)` en backend verifica la activación del módulo para el `businessId` del `req.user` antes de permitir acceso a endpoints específicos del módulo.
  - El frontend (ej. `AdminNavbar`, `CustomerDashboardPage`) usa estos flags para renderizar condicionalmente opciones y funcionalidades.
- **Estructura de Datos Detallada para Módulo Camarero (LC) (Resumen Clave):**
  - **Carta Digital:** Jerarquía `MenuCategory` -> `MenuItem`, ambos con campos i18n (`name_es/en`, `description_es/en`), `imageUrl`, `position` (orden), y estados (`isActive` para `MenuCategory`, `isAvailable` para `MenuItem`). `MenuItem` incluye `price` (Decimal), `allergens` (string[]), `tags` (string[]), `preparationTime` (Int?), `calories` (Int?), `sku` (String?, único por negocio), `kdsDestination` (String, para enrutar a puestos KDS).
  - **Modificadores:** `MenuItem` tiene `ModifierGroup[]`. `ModifierGroup` con `name_es/en`, `uiType` (Enum `ModifierUiType.RADIO | CHECKBOX`), reglas (`minSelections`, `maxSelections`, `isRequired`), `position`. `ModifierGroup` tiene `ModifierOption[]`. `ModifierOption` con `name_es/en`, `priceAdjustment` (Decimal), `position`, `isDefault`, `isAvailable`.
  - **Pedidos (`Order`):** Campos clave: `orderNumber` (generado), `status` (Enum `OrderStatus`: `RECEIVED`, `IN_PROGRESS`, `PARTIALLY_READY`, `ALL_ITEMS_READY`, `COMPLETED`, `PAID`, `CANCELLED`, etc.), `totalAmount`, `finalAmount`. Enlaces opcionales a `Table` (`tableId`) y `User` LCo (`customerLCoId`).
  - **Ítems del Pedido (`OrderItem`):** Enlazado a `Order` y `MenuItem`. Campos clave: `quantity`, `priceAtPurchase` (snapshot del precio unitario con modificadores), `totalItemPrice` (calculado), `status` (Enum `OrderItemStatus`: `PENDING_KDS`, `PREPARING`, `READY`, `SERVED`, `CANCELLED`, `CANCELLATION_REQUESTED`), `kdsDestination` (snapshot), `itemNameSnapshot_es/en`, `preparedAt?`, `servedAt?`.
  - **Modificadores del Ítem del Pedido (`OrderItemModifierOption`):** Tabla de unión `OrderItem` <> `ModifierOption`, con snapshots de nombre y precio de la opción.
  - **Mesas (`Table`):** `identifier` (string legible único por negocio, usado en QR y URL), `zone?`, `capacity?`.
  - **Personal y Autenticación KDS/Camarero:**
    - Usuarios `User` con roles `WAITER`, `KITCHEN_STAFF`, `BAR_STAFF`.
    - Autenticación para KDS (y futura interfaz de camarero) actualmente mediante login estándar de usuario (email/password).
    - `StaffPin` model existe para futura implementación de login rápido con PIN.
    - **[DECISIÓN PENDIENTE DETALLADA]** Definir si el acceso al KDS será por login de usuario con rol KDS_STAFF, o por autenticación de dispositivo KDS dedicado (con token/PIN de dispositivo) para mayor seguridad y configuración fija de destino. El plan actual soporta login de usuario, la alternativa se evaluará para mejoras.
- **Flujo de Pedido LC - Cliente (Resumen Clave):**
  - **Acceso Primario:** Escaneo de QR en mesa (`/m/:businessSlug/:tableIdentifier`).
  - **Detección de Pedido Activo (`PublicMenuViewPage.tsx`):** Revisa `localStorage` (clave `loyalpyme_active_order_info_{slug}_{tableId?}`). Si existe, muestra aviso "Pedido #X en curso" con botón "Ver Estado", deshabilitando creación de nuevo pedido. (Botón "Añadir Ítems a Pedido Activo" es PENDIENTE).
  - **Creación de Nuevo Pedido:** Anónimo por defecto. Login/Registro LCo opcional para asociar `customerId` al `Order`. Frontend envía `CreateOrderPayloadDto`. Backend valida todo (disponibilidad, reglas modificadores) y recalcula precios. Creación transaccional.
  - **Persistencia de Carrito no Enviado:** `localStorage` para `currentOrderItems` y `orderNotes` (limpiado si se detecta pedido activo o al enviar).
  - **Visualización de Estado del Pedido (`OrderStatusPage.tsx`):** Polling. Limpia `localStorage` del pedido activo cuando `Order.status` es `PAID` o `CANCELLED` y el usuario opta por "Empezar Nuevo Pedido".
- **Flujo KDS (LC - Actual):**
  - **Acceso:** Roles `KITCHEN_STAFF`, `BAR_STAFF`, `BUSINESS_ADMIN` acceden a `/admin/kds`.
  - **Selección de Destino:** `KitchenDisplayPage.tsx` usa `SegmentedControl` para "COCINA"/"BARRA".
  - **Visualización y Acción:** El KDS muestra `OrderItem`s (`PENDING_KDS`, `PREPARING`). El personal cambia estado (`PREPARING`, `READY`, `CANCELLED`). El backend (`kds.service.ts`) actualiza `OrderItem.status` y `Order.status`.
- **Internacionalización (i18n):**
  - **Frontend:** `i18next` con archivos JSON por idioma (`es/translation.json`, `en/translation.json`) para todos los textos de la UI. `useTranslation` hook y componente `Trans`.
  - **Backend:** Modelos de datos de la carta (Categorías, Ítems, Modificadores) almacenan campos de texto en múltiples idiomas (ej. `name_es`, `name_en`, `description_es`, `description_en`). API pública de menú devuelve todos los campos de idioma para que el frontend elija. Snapshots en `OrderItem` (`itemNameSnapshot_es/en`, `itemDescriptionSnapshot_es/en`) y `OrderItemModifierOption` (`optionNameSnapshot_es/en`) guardan los nombres en el/los idioma(s) principal(es) en el momento del pedido para consistencia histórica.
- **Almacenamiento de Imágenes:** Cloudinary. Subida desde el frontend (previo recorte con `react-image-crop`) a través de un endpoint backend (`/api/uploads/image` o específico como `/api/admin/upload/reward-image`) que usa Multer para procesar `multipart/form-data` y el SDK de Cloudinary para subir a una carpeta específica (ej. `loyalpyme/rewards_development`). Se devuelve la URL segura de la imagen.
- **Arquitectura de Servicios y Controladores (Backend):** Patrón MVC-like. Controladores manejan peticiones HTTP (req/res), validación de entrada básica, y llaman a servicios. Servicios contienen la lógica de negocio principal, interactúan con Prisma para operaciones de base de datos, y pueden llamar a otros servicios o helpers.
- **Hooks Personalizados (Frontend):** Para encapsular lógica compleja de obtención de datos, gestión de estado local relacionado con API, y mutaciones. Ejemplos: `useAdminMenuCategories`, `useUserProfileData`, `useAdminMenuItems`, `useAdminModifierGroups`, `useAdminModifierOptions`, `useCustomerActivity`, `useCustomerRewardsData`, `useAdminOverviewStats`.

---

## 4. Lecciones Aprendidas & Troubleshooting Clave 💡

- **Configuración de Seed y Prisma CLI:** La sección `"prisma": { "seed": "ts-node prisma/seed.ts" }` en `package.json` y la ejecución de `npx prisma generate` después de `migrate dev/reset` son cruciales para el correcto funcionamiento con TypeScript.
- **Sincronización de Tipos Prisma y TypeScript (VS Code):** Reiniciar el servidor TypeScript de VS Code es a menudo necesario tras `prisma generate` para que el editor reconozca los cambios en los tipos de modelos, evitando errores de tipo falsos.
- **Errores P2002 (Unique Constraint Failed) en `seed.ts`**: Indican ejecución sin `prisma migrate reset` previo o datos duplicados. El `seed.ts` v7 ahora usa `upsert` donde es apropiado para mitigar esto durante el desarrollo.
- **Gestión de Estado Complejo en Frontend (LC - `PublicMenuViewPage.tsx`):** Múltiples estados interdependientes (`configuringItem`, `currentOrderItems`, `activeOrderIdForTable`, etc.) requieren una gestión cuidadosa de su ciclo de vida, persistencia en `localStorage` (con claves dinámicas por `businessSlug` y `tableIdentifier`), y limpieza selectiva para evitar conflictos y asegurar una UX coherente entre "nuevo pedido", "pedido activo" y "añadir a pedido".
- **Recálculo de Precios y Validación en Backend (LC - Pedidos):** Es fundamental que el backend siempre revalide la disponibilidad y precios de ítems/modificadores y recalcule el total del pedido al crearlo, independientemente de los precios calculados en el frontend, por seguridad y consistencia.
- **Errores de Tipo y Lógica en Backend (Transacciones, Creación Anidada Prisma):** Las transacciones Prisma (`prisma.$transaction`) son esenciales para operaciones complejas (ej. creación de `Order` con sus `OrderItem`s y `OrderItemModifierOption`s). Entender las diferencias entre tipos de input para creación directa vs. anidada (ej. `OrderItemCreateWithoutOrderInput`) es clave.
- **Internacionalización (i18n) Frontend:** La depuración de `missingKey` requiere verificar la ruta completa de la clave en los archivos JSON, la correcta carga del namespace (usar `debug: true` en `i18n.ts`), y limpieza de caché. El manejo de pluralización y contextos de i18next debe considerarse para mensajes complejos.
- **Manejo de Archivos (Multer/Cloudinary):** Configuración correcta de Multer (`storage`, `fileFilter`, `limits`) y un flujo robusto de subida a Cloudinary (manejo de buffers/streams, gestión de errores de API de Cloudinary, URLs seguras) es vital. El recorte en cliente con `react-image-crop` y `canvasPreview` antes de la subida ayuda a optimizar y estandarizar imágenes.
- **Testing (KDS):** La validación de la lógica de transición de estados en `kds.service.ts` mediante pruebas con Postman y datos del seed fue un paso crítico para asegurar la fiabilidad del backend KDS antes de construir el frontend. Subraya la necesidad de expandir los tests unitarios (`Vitest`) para esta lógica.
- **Sincronización Estado KDS Frontend y Polling:** Detener el polling en `KitchenDisplayPage.tsx` mientras una acción de actualización de estado está en curso (`updatingItemId`) evita cargas innecesarias y posibles conflictos de datos si el polling trae información justo antes de que la respuesta de la actualización llegue.
- **Gestión de Dependencias en Hooks `useEffect` y `useCallback`:** Es crucial revisar y optimizar las listas de dependencias para evitar re-ejecuciones innecesarias o bucles infinitos, especialmente en hooks que realizan llamadas API o interactúan con estado complejo.

_(Para una guía más exhaustiva de problemas específicos y soluciones detalladas, consulta [TROUBLESHOOTING_GUIDE.md](./TROUBLESHOOTING_GUIDE.md))_

---

## 5. Próximos Pasos Inmediatos / Prioridades (Foco en Módulo Camarero - LC) ⏳📌

1.  ⭐ **LC - Interfaz Camarero (MVP): Notificaciones y Marcar como Servido (Tareas B1.1 y B1.2 del `DEVELOPMENT_PLAN.md` actualizado): [CRÍTICO - SIGUIENTE BLOQUE FUNDAMENTAL]**

    - **Objetivo Principal:** Permitir al personal de sala (camareros) ser notificados de los `OrderItem`s que el KDS ha marcado como `READY`, y que estos puedan marcar dichos ítems como `SERVED` al cliente. Esto debe actualizar el estado del `OrderItem` y, cuando todos los ítems de un pedido estén servidos, actualizar el `Order.status` general a `COMPLETED`.
    - **Backend (B1.1):**
      1.  **API Endpoint `GET /api/camarero/staff/ready-for-pickup`:**
          - Proteger con rol `WAITER` (y `BUSINESS_ADMIN`).
          - Servicio buscará `OrderItem`s con `status: READY` que no estén `SERVED` ni `CANCELLED`, pertenecientes al `businessId` del camarero.
          - Devolverá un DTO `ReadyPickupItemDto` con: `orderItemId`, `orderId`, `orderNumber`, `orderCreatedAt`, `tableIdentifier` (del `Order.table.identifier`), `itemNameSnapshot_es/en`, `quantity`, lista de `selectedModifiers` (con `optionNameSnapshot_es/en`), `itemNotes`. Ordenar por `Order.createdAt`.
      2.  **API Endpoint `PATCH /api/camarero/staff/order-items/:orderItemId/status`:**
          - Proteger con rol `WAITER` (y `BUSINESS_ADMIN`).
          - Body esperado: `{ "newStatus": "SERVED" }` (o podría ser una ruta dedicada como `/api/camarero/staff/order-items/:orderItemId/mark-served`).
          - Servicio verificará que el `OrderItem` existe, pertenece al negocio, y está en estado `READY`.
          - Actualizará `OrderItem.status` a `SERVED` y registrará `OrderItem.servedAt = new Date()`.
          - **Lógica Crítica:** Re-evaluará el `Order` asociado. Si todos los `OrderItem`s activos (`status` no `CANCELLED`) del pedido están ahora `SERVED`, el servicio actualizará `Order.status` a `COMPLETED`.
    - **Frontend (B1.2 - `WaiterPickupPage.tsx` o similar):**
      1.  **Acceso:** Nueva ruta (ej. `/admin/dashboard/camarero/pickup-station`) protegida para rol `WAITER` (y `BUSINESS_ADMIN`), accesible desde `AdminNavbar`.
      2.  **Visualización:** Llamará a `GET /api/camarero/staff/ready-for-pickup`. Mostrará una lista de "tarjetas de recogida" con la información del `ReadyPickupItemDto`.
      3.  **Acción "Marcar como Servido":** Botón en cada tarjeta. Al pulsar, llamará a `PATCH /api/camarero/staff/order-items/:orderItemId/status` con `SERVED`. Mostrará feedback (loader, notificación).
      4.  **Actualización:** Implementar polling o botón de refresco para la lista de ítems listos. Tras marcar un ítem como servido, este debería desaparecer de la lista.

2.  ⭐ **LC - Cliente: Visualización Ítems Servidos y Pedido Completado (Tarea B2.1 del `DEVELOPMENT_PLAN.md` actualizado): [ALTA - PARALELO/SIGUIENTE A B1]**

    - **Objetivo:** Asegurar que la `OrderStatusPage.tsx` del cliente refleje correctamente los ítems marcados como `SERVED` por el camarero y el estado `COMPLETED` del pedido general.
    - **Frontend (`OrderStatusPage.tsx`):**
      - Adaptar la visualización de `OrderItem`s para diferenciar claramente los que están `SERVED` (ej. icono, estilo).
      - Verificar que cuando el `Order.status` (del backend) sea `COMPLETED`, la página lo muestre adecuadamente (ej. mensaje "Todos los ítems servidos. Esperando pago."). El polling debe continuar si el pedido no es `PAID` o `CANCELLED`.

3.  ⭐ **LC - Cliente/Backend: Añadir Ítems a Pedido Existente (Tarea B2.2 del `DEVELOPMENT_PLAN.md` actualizado): [ALTA/MEDIA - DESPUÉS DE B1 Y B2.1]**

    - **Backend:** Implementar y probar endpoint `POST /public/order/:existingOrderId/add-items` con validaciones robustas (estado del pedido existente, disponibilidad de ítems/modificadores, recálculo de totales, actualización del `Order.status` si pasa de `COMPLETED` a `IN_PROGRESS`).
    - **Frontend (`PublicMenuViewPage.tsx`):** Implementar la UI para permitir al cliente añadir ítems a un pedido activo no finalizado, incluyendo un "carrito de adición" y el envío al nuevo endpoint.

4.  **(Paralelo/Continuo) Testing y Fundamentos Técnicos (Tareas C del `DEVELOPMENT_PLAN.md` actualizado):**
    - Escribir tests unitarios (Vitest) para la lógica de los nuevos servicios de Camarero (obtener ítems listos, marcar servido, actualizar `Order.status` a `COMPLETED`).
    - Escribir tests de integración (Supertest) para los nuevos endpoints API de Camarero.
    - Continuar con la aplicación de validación Zod a los DTOs y payloads de las APIs LC (KDS, Pedidos Públicos, y nuevos de Camarero).
    - Planificar la seguridad de los endpoints de camarero (considerar uso de `StaffPin`s para autenticación rápida en dispositivos compartidos si se opta por esa vía).

_(Para ver la hoja de ruta completa, el backlog detallado, la nueva tarea de permisos granulares y las funcionalidades futuras, consulta el `DEVELOPMENT_PLAN.md` actualizado)._

---

## 6. Información Adicional ℹ️

- **Licencia:** Software Propietario. Copyright (c) 2024-2025 Olivier Hottelet. Todos los derechos reservados. Consulta [LICENSE.md](./LICENSE.md) para más detalles.
- **Flujos de Trabajo Detallados:** Para una comprensión profunda de cómo operan los módulos y su integración, consultar:
  - `LOYALPYME_CORE_WORKFLOW.md`
  - `LOYALPYME_CAMARERO_WORKFLOW.md` (requerirá actualización después de implementar la interfaz de camarero)
  - `MODULE_INTEGRATION_WORKFLOW.md`

---
