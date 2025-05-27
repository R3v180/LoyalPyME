# LoyalPyME - Plan de Desarrollo y Futuras Funcionalidades

**Última Actualización:** 27 de Mayo de 2025 (Refleja progreso en KDS Backend y Visualización Estado Pedido Cliente, y refina prioridades y flujos LC)

Este documento detalla las tareas pendientes inmediatas, el alcance definido para las próximas versiones operativas (con énfasis en el Módulo Camarero - LC), la deuda técnica y las ideas para la evolución futura. Se busca un máximo detalle para guiar el desarrollo.

---

## A. TRABAJO RECIENTEMENTE COMPLETADO / EN PROGRESO / CORRECCIONES ✅

1.  ⭐ **[COMPLETADO - MVP Base Plataforma]** Panel Super Admin y Gestión de Negocios/Módulos (`backend`, `frontend`)

    - **Detalles Alcanzados:**
      - Backend: Modelo `Business` con flags `isActive`, `isLoyaltyCoreActive`, `isCamareroActive`. API Endpoints para Super Admin (`/api/superadmin/*`) para listar negocios y activar/desactivar su estado general y sus módulos específicos. Lógica para que el perfil de usuario (`/api/profile`) incluya el `slug` y `name` del negocio asociado para roles `BUSINESS_ADMIN` y `CUSTOMER_FINAL`.
      - Frontend: Página `/superadmin` con tabla de negocios, switches para gestionar estado y activación de módulos. Lógica de datos y UI implementada.
      - Middleware `checkModuleActive` en backend y lógica condicional en UI frontend (ej. `AdminNavbar`, `CustomerDashboardPage`) para respetar la activación de módulos y mostrar/ocultar funcionalidades pertinentes.

2.  ⭐ **[COMPLETADO - Módulo Camarero - Gestión de Carta]** LC - Backend (Modelos BD y API) y Frontend (UI Admin) para Gestión Completa de Carta Digital.

    - **Detalles Alcanzados (Backend):**
      - **BD:** Modelos Prisma (`Table`, `MenuCategory`, `MenuItem`, `ModifierGroup`, `ModifierOption`, `Order`, `OrderItem`, `OrderItemModifierOption`, `StaffPin`) implementados y migrados. Enum `UserRole` extendido (`WAITER`, `KITCHEN_STAFF`, `BAR_STAFF`). Enum `ModifierUiType` (`RADIO`, `CHECKBOX`). Enum `OrderStatus` (`RECEIVED`, etc.). Campos i18n (`name_es`, `description_es`, etc.) en modelos de carta. Campos detallados en `MenuItem` (precio, imagen, alérgenos, tags, disponibilidad, posición, tiempo prep., calorías, SKU, destino KDS).
      - **API Gestión Carta (Admin):** Endpoints CRUD backend (`/api/camarero/admin/*`) para `MenuCategory`, `MenuItem`, `ModifierGroup`, y `ModifierOption`, protegidos por rol `BUSINESS_ADMIN` y activación del módulo LC.
    - **Detalles Alcanzados (Frontend - Admin):**
      - Página `/admin/dashboard/camarero/menu-editor` (`MenuManagementPage.tsx`).
      - Componente `MenuCategoryManager.tsx`: CRUD de categorías, incluyendo subida/recorte de imágenes (Cloudinary).
      - Componente `MenuItemManager.tsx`: Listado de ítems por categoría.
      - Modal `MenuItemFormModal.tsx`: Formulario CRUD completo para ítems.
      - Modal `ModifierGroupsManagementModal.tsx`: CRUD de grupos de modificadores asociados a un ítem.
      - Modal `ModifierOptionsManagementModal.tsx`: CRUD de opciones dentro de un grupo.
      - Hooks de datos (`useAdminMenuCategories`, etc.) y tipos (`menu.types.ts`).
      - Botón "Previsualizar Carta Pública" en `MenuManagementPage.tsx` para admins (usa `businessSlug` del `userData`).

3.  ⭐ **[COMPLETADO - Módulo Camarero - Vista Cliente y Pedido Básico]** LC - Backend y Frontend: Visualización de Carta y Flujo de Pedido Inicial por Cliente Final.

    - **Detalles Alcanzados (Backend - Vista Carta):** Endpoint público `/public/menu/business/:businessSlug` devuelve carta completa, activa, i18n, con modificadores.
    - **Detalles Alcanzados (Frontend - Vista Carta):** Página `/m/:businessSlug/:tableIdentifier?` (`PublicMenuViewPage.tsx`) muestra la carta (acordeones, `MenuItemCard.tsx` con detalles, `ModifierGroupInteractiveRenderer.tsx` para visualización y personalización).
    - **Detalles Alcanzados (Backend - Creación Pedido):** API `POST /public/order/:businessSlug` recibe `CreateOrderPayloadDto`, valida ítems/modificadores/reglas, calcula precio, crea `Order` (con `tableId` y `customerId` opcionales, `orderNotes`, `orderNumber`, `status: RECEIVED`), `OrderItem`, `OrderItemModifierOption` transaccionalmente. Devuelve el objeto `Order` creado.
    - **Detalles Alcanzados (Frontend - Flujo Pedido):**
      - Selección de cantidad, personalización de modificadores con precio dinámico.
      - Añadir a carrito local (`currentOrderItems` en `PublicMenuViewPage.tsx`).
      - Persistencia del carrito y notas generales del pedido en `localStorage` (por `businessSlug` y `tableIdentifier`).
      - Barra superior sticky muestra resumen del carrito y abre modal.
      - Modal del Carrito (`ShoppingCartModal.tsx`): Lista ítems, permite modificar cantidad, eliminar ítems, añadir notas generales, vaciar carrito.
      - Envío del pedido al backend y manejo de notificaciones de éxito (con `orderNumber` o `id` del pedido) o error. Limpieza del carrito tras éxito.
    - **Detalles Alcanzados (Frontend - Acceso Cliente Logueado):** Tarjeta "Ver la Carta y Pedir" en `SummaryTab.tsx` del `CustomerDashboardPage.tsx` si LC está activo y `businessSlug` disponible en `userData`.
    - **Adición:** Frontend (`PublicMenuViewPage.tsx`) ahora guarda el `orderId` y `orderNumber` del pedido activo en `localStorage` (`loyalpyme_active_order_info_...`) después de un envío exitoso.

4.  ⭐ **[EN PROGRESO - Módulo Camarero - KDS y Estado Pedido Cliente]**

    - **B1.1. KDS Backend (API Base):**
      - **Backend (`kds.service.ts`, `kds.controller.ts`, `camarero-kds.routes.ts`):** Implementados endpoints:
        - `GET /api/camarero/kds/items?destination=...[&status=...]`: Para que el KDS obtenga `OrderItem`s filtrados por destino y opcionalmente por estado. Devuelve información detallada del ítem, modificadores, y pedido asociado. Ordena por antigüedad del pedido.
        - `PATCH /api/camarero/kds/items/:orderItemId/status`: Permite al KDS actualizar el `OrderItemStatus` de un ítem. Incluye lógica para actualizar `preparedAt`.
      - **Estado Actual de `Order.status` (EN DEPURACIÓN ACTIVA):** La lógica en `kds.service.ts` para actualizar el estado general del `Order` (ej. a `IN_PROGRESS`, `PARTIALLY_READY`) basada en los cambios de `OrderItem.status` **está implementada pero aún presenta inconsistencias (ej. no siempre pasa de `RECEIVED` a `IN_PROGRESS` cuando un ítem se marca como `PREPARING`). Requiere depuración y refinamiento.**
    - **B2.1. Cliente: Visualización del Estado del Pedido (Parcialmente Completado):**
      - **Backend (`public/order.service.ts`, `public/order.controller.ts`, `public-order.routes.ts`):** Implementado endpoint público `GET /public/order/:orderId/status`. **COMPLETADO Y PROBADO.** Devuelve `Order.status` general, `orderNumber`, y una lista de `items` con su `itemNameSnapshot`, `quantity`, y `OrderItemStatus` individual.
      - **Frontend (`PublicMenuViewPage.tsx`):** Redirige a `/order-status/:orderId` después del envío exitoso del pedido, pasando `orderNumber`, `businessSlug` y `tableIdentifier` en el `state` de la ruta.
      - **Frontend (`OrderStatusPage.tsx`):**
        - **COMPLETADO:** Página creada. Lee `orderId` de la URL. Obtiene y muestra el estado del pedido y sus ítems llamando al endpoint `GET /public/order/:orderId/status`. Implementa polling básico (cada 10s) para actualizar automáticamente la información.
        - **Lógica de "Pedido Finalizado" REFINADA:** Si el `Order.status` (obtenido del backend) es `PAID` o `CANCELLED`, el polling se detiene. Se muestra un botón "Empezar Nuevo Pedido" que, al pulsarlo, limpia las entradas relevantes de `localStorage` (`loyalpyme_active_order_info_...`, `loyalpyme_public_cart_...`, `loyalpyme_public_order_notes_...`) y redirige a la página del menú para permitir un nuevo pedido.
        - **Botón "Volver al Menú"**: Funcional, lleva de vuelta a la carta.
      - **Frontend (`PublicMenuViewPage.tsx` - Detección Pedido Activo):**
        - **COMPLETADO:** Al cargar, verifica `localStorage` para `activeOrderInfoKey`. Si existe un pedido activo, muestra un aviso con el número de pedido y un botón "Ver Estado" que enlaza a `OrderStatusPage`. El carrito para nuevos pedidos se oculta/deshabilita.

5.  **[COMPLETADO - Varios LCo y Plataforma]** Fixes y Features Menores Anteriores (Tipo `TierData`, Popover Móvil, Error Build Backend, Botones Canje Resumen Cliente).
    - **Adición:** Resueltos problemas con `seed.ts` (errores de TypeScript y ejecución). El script `seed.ts` (versión V6) ahora funciona correctamente después de `npx prisma migrate reset` y puebla la base de datos con datos de demo consistentes, incluyendo `OrderItem.totalItemPrice`.

---

## B. PRIORIDADES ACTUALES: Módulo "LoyalPyME Camarero" (LC) - Hacia un MVP Operativo 🚀

El objetivo es alcanzar un estado donde el ciclo completo de pedido (cliente -> KDS -> camarero -> cliente) sea funcional y robusto, y la información de estado sea consistente.

### **BLOQUE 1: KDS (Kitchen Display System) Y ESTADO DE PEDIDOS - FUNDAMENTAL**

**B1.1. ⭐ [CRÍTICO - EN DEPURACIÓN] LC - KDS Backend: API para Gestión de Estados de `OrderItem` y Lógica de `Order.status`**
_ **Dependencia:** Flujo de Pedido Cliente (A3), Endpoint Público Estado Pedido (A4.B2.1).
_ **Objetivo:** 1. Permitir que las pantallas de KDS (cocina, barra, etc.) obtengan los ítems de pedido que les corresponden y puedan actualizar su estado de preparación. (API Base Completada) 2. **ASEGURAR QUE LA ACTUALIZACIÓN DE `OrderItem.status` DESDE EL KDS SE REFLEJE CORRECTA Y CONSISTENTEMENTE EN EL `Order.status` GENERAL.** (Actualmente en depuración activa).
\_ **Sub-Tareas Detalladas (Backend):** 1. **Modelos Prisma `OrderItem` y `Order`:**
_ Revisados y actualizados. `OrderItemStatus` (`PENDING_KDS` (default), `PREPARING`, `READY`, `SERVED`, `CANCELLED`, `CANCELLATION_REQUESTED`) y `OrderStatus` (`RECEIVED`, `IN_PROGRESS`, `PARTIALLY_READY`, `ALL_ITEMS_READY`, `COMPLETED`, `PAID`, `CANCELLED`, etc.) definidos. Campos `kdsDestination`, `preparedAt`, `servedAt`, `totalItemPrice` en `OrderItem` existen. 2. **API Endpoint `GET /api/camarero/kds/items` (Protegido por rol `KITCHEN_STAFF`/`BAR_STAFF` o token KDS):**
_ Funcional. Devuelve `OrderItem`s filtrados y con información anidada. 3. **API Endpoint `PATCH /api/camarero/kds/items/:orderItemId/status` (Protegido):**
_ Funcional para actualizar `OrderItem.status` y `preparedAt`/`servedAt`.
_ **Lógica Secundaria (NECESITA REVISIÓN EXHAUSTIVA Y CORRECCIÓN):** La lógica dentro de este servicio (`kds.service.ts`) para determinar y actualizar el `Order.status` general (a `IN_PROGRESS`, `PARTIALLY_READY`, `ALL_ITEMS_READY`, `COMPLETED`) basada en los estados de _todos_ los `OrderItem`s del pedido asociado **no está funcionando correctamente**. Por ejemplo, si un `OrderItem` pasa a `PREPARING` o `READY`, el `Order.status` general a veces permanece incorrectamente en `RECEIVED`. Esto debe ser la **máxima prioridad de corrección en el backend.** 4. **(Opcional MVP, Recomendado Post-MVP) WebSockets/Server-Sent Events (SSE) para KDS:**
_ Implementar un canal para que el backend notifique a los KDS conectados (por `businessId` y `kdsDestination`) cuando:
_ Llega un nuevo `OrderItem` para su destino.
_ (Avanzado) Un cliente solicita cancelar un ítem.
_ Esto evita la necesidad de polling constante desde el frontend del KDS. \* **Consideraciones de Seguridad KDS:** ¿Cómo se autenticarán las pantallas KDS? ¿Login de staff, token de dispositivo dedicado? (A definir).

**B1.2. ⭐ [CRÍTICO - PENDIENTE] LC - KDS Frontend: Interfaz Visual y Funcional Básica**
_ **Dependencia:** KDS Backend API (B1.1) funcional y con lógica de `Order.status` **corregida y estable**.
_ **Objetivo:** Una aplicación/vista web simple, clara y usable en tablets para cocina/barra.
\_ **Sub-Tareas Detalladas (Frontend):** 1. **Autenticación/Selección de Destino:**
_ Si el KDS es una app genérica, debe permitir seleccionar el `kdsDestination` al inicio (ej. "Soy KDS Cocina", "Soy KDS Barra").
_ Login si se requiere autenticación de staff. 2. **Layout Principal:**
_ Columnas (ej. "PENDIENTE", "EN PREPARACIÓN", "LISTO") o una lista unificada con filtros/ordenación por estado. 3. **Tarjeta de `OrderItem` (`KdsOrderItemCard.tsx`):**
_ Mostrar claramente: `orderNumber`, `table.identifier` (si aplica), hora del pedido.
_ `menuItem.name` (i18n), `quantity`.
_ Lista de modificadores seleccionados (nombres i18n).
_ Notas del ítem (si las hay).
_ Estado actual del ítem. 4. **Interacción con Tarjetas:**
_ Botones para cambiar estado (ej. "Empezar Preparación", "Marcar como Listo"), que llamen al `PATCH /api/camarero/kds/items/:orderItemId/status`.
_ La tarjeta debería actualizar su apariencia o moverse de columna según el nuevo estado. 5. **Carga y Actualización de Datos:**
_ Llamada inicial a `GET /api/camarero/kds/items` al cargar.
_ Polling periódico para refrescar si no se usan WebSockets/SSE.
_ Si se usan WebSockets/SSE, lógica para recibir y mostrar nuevos ítems o actualizaciones de estado. 6. **Alertas Visuales/Sonoras (Mínimas):**
_ Una indicación clara (ej. un sonido suave, un banner) cuando llegan nuevos ítems a `PENDING_KDS`. \* **Consideraciones de Usabilidad:** Interfaz táctil, fuentes grandes, alto contraste, mínima distracción.

### **BLOQUE 2: VISUALIZACIÓN Y GESTIÓN BÁSICA POR CAMARERO Y CLIENTE**

**B2.1. ⭐ [ALTA - EN PROGRESO] LC - Cliente: Visualización del Estado del Pedido y Flujo Continuo**
_ **Dependencia:** Lógica de `Order.status` en backend (B1.1) funcionando correctamente.
_ **Objetivo:** Permitir al cliente ver el progreso de su pedido, y poder añadir más ítems a un pedido activo o iniciar un nuevo pedido de forma intuitiva.
_ **Sub-Tareas Detalladas (Backend):** 1. **Endpoint Público de Estado `GET /public/order/:orderId/status`**: **COMPLETADO Y PROBADO.** 2. **(PRIORIDAD MEDIA/ALTA - PENDIENTE) Endpoint para "Añadir Ítems a Pedido Existente":**
* Diseñar e implementar `POST /public/order/:existingOrderId/add-items`.
* Recibe `existingOrderId` y un array de `OrderItemDto`s.
* **Validaciones Cruciales:**
* Verificar que `existingOrderId` existe y pertenece al `businessSlug` implícito en la ruta (si se decide añadir `/:businessSlug/` a este endpoint también por consistencia y seguridad).
* Verificar que el `Order` existente **NO** está en un estado final (`PAID`, `CANCELLED`). Permitir adiciones si está `RECEIVED`, `IN_PROGRESS`, `PARTIALLY_READY`, `ALL_ITEMS_READY`, o incluso `COMPLETED` (si la política del local es que "completado" significa "servido pero cuenta abierta").
* Para cada nuevo `OrderItemDto`:
* Validar `menuItemId` (existencia, disponibilidad en el negocio, `isAvailable`).
* Validar modificadores seleccionados (reglas de grupo, disponibilidad de opciones).
* Calcular `priceAtPurchase` (precio unitario con modificadores) y `totalItemPrice`.
* Crear los nuevos registros `OrderItem` y `OrderItemModifierOption` asociados al `existingOrderId`. Los nuevos `OrderItem`s deben tener `status: PENDING_KDS` y su `kdsDestination`.
* Recalcular y actualizar `totalAmount` y `finalAmount` del `Order` existente.
* **Notificar al KDS**: Asegurar que estos nuevos ítems lleguen al KDS correspondiente (esto puede implicar WebSockets/SSE si ya están implementados, o simplemente aparecerán en el siguiente polling del KDS). \* Devolver el `Order` actualizado o una confirmación.
_ **Sub-Tareas Detalladas (Frontend):** 1. **Página de Confirmación/Estado del Pedido (`OrderStatusPage.tsx`):**
_ **COMPLETADO:** Muestra `orderNumber`, lista ítems y sus estados individuales. Implementa polling.
_ **COMPLETADO:** Lógica para `isOrderFinal` (basada en `Order.status` == `PAID` o `CANCELLED`). Si es final, el polling se detiene, se limpia `localStorage` relevante al pulsar "Empezar Nuevo Pedido".
_ **PENDIENTE:** Botón "Añadir más Ítems a este Pedido" (si el pedido no es final). Debe llevar a `PublicMenuViewPage` en un modo especial. 2. **Gestión de Pedido Activo y "Añadir a Pedido" en `PublicMenuViewPage.tsx`:**
_ **COMPLETADO:** Detecta `activeOrderInfoKey` en `localStorage`. Si existe, muestra aviso "Pedido #X en curso" con botón "Ver Estado".
_ **PENDIENTE (Próxima Prioridad Frontend, depende del backend de "Añadir Ítems"):**
_ Si hay un `activeOrderIdForTable` y el usuario elige "Añadir Ítems":
_ La UI de la carta permite seleccionar nuevos ítems.
_ Estos ítems se acumulan en un estado/carrito temporal (distinto del carrito de "nuevo pedido").
_ Un botón "Confirmar Adición al Pedido #X" envía estos ítems al endpoint `POST /public/order/:activeOrderIdForTable/add-items`.
_ Tras el éxito, se limpia el carrito de adición y se actualiza la vista (quizás redirigiendo a `OrderStatusPage` o refrescando datos).
* Asegurar que el botón "Empezar Nuevo Pedido Separado" (si hay pedido activo) limpia correctamente *todas\* las claves de `localStorage` relevantes (`activeOrderInfo`, `cart`, `notes`) para la mesa/negocio actual antes de recargar la página en modo "nuevo pedido".

**B2.KDS1. ⭐ [ALTA - PENDIENTE] LC - KDS Avanzado: Visualización de Tiempos, Alertas y Sincronización de Pases/Cursos**
_ **Dependencia:** KDS Básico (B1.1, B1.2).
_ **Objetivo:** Proporcionar a cocina/barra información visual sobre tiempos y ayudar a sincronizar la preparación de ítems por cursos para una mesa.
\_ **Sub-Tareas Detalladas (KDS Frontend):** 1. **Visualización de Tiempos y Alertas de Retraso (Fase 1):**
_ Mostrar `preparationTime` del `MenuItem` en cada `KdsOrderItemCard.tsx`.
_ Cuando un ítem pasa a `PREPARING`, iniciar un temporizador visible.
_ Alerta visual si `tiempo_transcurrido > preparationTime` (y más urgente si `> preparationTime _ 1.X`).
        *   (Opcional MVP) Sonido de alerta de retraso.
    2.  **Agrupación por Cursos y Sincronización de "Pase":**
        *   **Backend/Modelo:** Asegurar que `MenuItem`tenga un campo`course: String?`o se usen`tags`predefinidos (ej. "ENTRANTE", "PRINCIPAL", "POSTRE"). El`kds.service.ts`(en`getItemsForKds`) debe incluir esta información.
        *   **KDS Frontend:**
            *   Agrupar visualmente los `OrderItem`s de un mismo `Order`(o de la misma mesa si se gestionan múltiples pedidos) por este "curso".
            *   Implementar lógica para que el KDS (o el jefe de cocina a través del KDS) pueda "lanzar" la preparación de los ítems del siguiente curso una vez que el anterior esté casi listo o servido.
            *   El KDS podría generar una alerta/notificación de "Pase Completo para Mesa X, Curso Y" cuando todos los ítems de ese curso y mesa estén`READY`.

**B2.2. ⭐ [ALTA - PENDIENTE] LC - Interfaz Camarero (MVP): Notificaciones y Marcar como Servido**
_ **Dependencia:** KDS puede marcar ítems/pases como `READY` (B1.1, B1.2, B2.KDS1).
_ **Objetivo:** Que el camarero sepa qué ítems/pases están listos y pueda marcarlos como entregados al cliente.
\_ **Sub-Tareas Detalladas:** 1. **Backend - API para Camarero (Protegido por rol `WAITER` y/o PIN):**
_ **(Opcional) Login de Camarero:** Endpoint para autenticar camarero con email/pass o `StaffPin`.
_ `GET /api/camarero/staff/notifications/ready-for-pickup`: Devuelve `OrderItem`s (o agrupaciones por "pase") que están en estado `READY` (o `ALL_ITEMS_READY` a nivel de `Order` para un curso) y aún no `SERVED`, para el `businessId` del camarero. Incluir `orderNumber`, `table.identifier`, `menuItem.name_es/en`, `quantity`.
_ `PATCH /api/camarero/staff/order-items/:orderItemId/status`: Permite al camarero cambiar el `status` de un `OrderItem` a `SERVED`. Actualizar `OrderItem.servedAt`.
_ **(Lógica Secundaria Importante):** Si todos los `OrderItem`s de un `Order` están `SERVED`, el `Order.status` general debe actualizarse a `COMPLETED`. (Esta lógica podría estar aquí o ser un efecto secundario de la actualización del último `OrderItem`). 2. **Frontend - Interfaz Camarero (Vista simple, puede ser PWA o parte del panel admin):**
_ **Lista de "Ítems/Pases Listos para Servir":** Tarjetas o lista mostrando la información.
_ Botón "Marcar como Servido" en cada ítem/pase.
_ Actualización de esta lista (polling o SSE).
_ (Post-MVP) Sonido de notificación para nuevos ítems/pases listos.

### **BLOQUE 3: FUNCIONALIDADES ADICIONALES Y MEJORAS OPERATIVAS (Post-MVP Pedido-KDS-Camarero Básico)**

**B3.1. [MEDIA] LC - Cliente: Interacciones Adicionales con la Mesa**
_ **Objetivo:** Permitir al cliente solicitar asistencia o la cuenta desde `OrderStatusPage` o `PublicMenuViewPage`.
_ **Sub-Tareas Detalladas:** 1. **Botón "Llamar Camarero":**
_ UI Cliente: Modal opcional para motivo breve.
_ Backend: Endpoint `POST /api/camarero/table/:tableIdOrIdentifier/call` (o similar). Registra la llamada (ej. en `Table.needsAttention = true` o una tabla `TableNotification`). El `tableIdOrIdentifier` debe resolverse al `Table.id` del schema.
_ Interfaz Camarero: Recibe notificación "Mesa X Llama" (idealmente con SSE). 2. **Botón "Pedir la Cuenta":**
_ UI Cliente: Modal para que el cliente indique método de pago preferido (Efectivo/Tarjeta) y, si es efectivo, con cuánto pagará.
_ Backend: Endpoint `POST /api/camarero/table/:tableIdOrIdentifier/request-bill`. Guarda las preferencias.
_ Interfaz Camarero: Recibe notificación "Mesa X Pide Cuenta (Prefiere: {Método}, Paga con: {Importe})".

**B3.2. [MEDIA] LC - Interfaz Camarero: Toma de Pedidos Manual y Gestión de Mesas Básica**
_ **Objetivo:** Capacidades operativas esenciales para el camarero.
_ **Sub-Tareas Detalladas (Interfaz Camarero Frontend/Backend):** 1. **Visualización de Mesas:**
_ Lista/cuadrícula de mesas del negocio (obtenidas de `Table`).
_ Mostrar estado básico de la mesa (ej. "Libre", "Ocupada", "Pedido Activo", "Cuenta Solicitada", "Necesita Limpieza") derivado del estado de los `Order`s asociados o un campo `Table.status`. 2. **Toma de Pedidos Manual:**
_ Seleccionar una mesa.
_ Acceder a una UI de la carta similar a la del cliente.
_ Añadir ítems, configurar modificadores, cantidad, notas.
_ **"Ítem Fuera de Carta":** Opción para añadir un ítem con nombre y precio manuales (se guarda en `OrderItem` con `menuItemId: null` pero con `itemNameSnapshot` y `priceAtPurchase` rellenados). \* Enviar el pedido al KDS (asociado a la mesa y al camarero que lo tomó). 3. **(Post-MVP) Gestión de Estado de Mesa:** Marcar mesa como "Necesita Limpieza", "Reservada".

**B3.3. [MEDIA] LC - Admin: Gestión de Personal y Mesas (Tareas #12, #13 del Plan Original)**
_ **Objetivo:** Permitir al `BUSINESS_ADMIN` configurar los elementos básicos para la operativa de LC.
_ **Sub-Tareas Detalladas (Backend API y Frontend UI Admin):** 1. **Gestión de Personal (`Staff`):**
_ CRUD para usuarios con roles `WAITER`, `KITCHEN_STAFF`, `BAR_STAFF` (asociados al `Business`).
_ Asignación y gestión de `StaffPin`s para login rápido en KDS/Terminales de Camarero. 2. **Gestión de Mesas (`Table`):**
_ CRUD para mesas: `identifier` (único y legible), `zone` (opcional, ej. "Terraza"), `capacity`.
_ **Generación de QR para Mesas:** Funcionalidad para generar la URL `/m/:businessSlug/:tableIdentifier` y mostrar el QR para imprimir. 3. **Configuración de Destinos KDS:** UI para que el admin defina los `kdsDestination` (ej. "Cocina Principal", "Barra", "Postres"). Estos se usarán al crear/editar `MenuItem`s.

**B3.4. [MEDIA] LC - Cliente/KDS: Solicitud de Cancelación de Pedido (con confirmación KDS)**
_ **Objetivo:** Permitir al cliente intentar cancelar un pedido/ítem si no se ha empezado a preparar.
_ **Sub-Tareas Detalladas:** 1. **Frontend (Cliente - `OrderStatusPage`):**
_ Si `OrderItem.status` es `PENDING_KDS` (o `PREPARING` temprano), mostrar botón "Solicitar Cancelar Ítem".
_ Al pulsar, llamar a API `POST /public/order/items/:orderItemId/request-cancellation`. 2. **Backend:**
_ Endpoint para `request-cancellation`: Cambia `OrderItem.status` a `CANCELLATION_REQUESTED`. Notifica al KDS (vía SSE idealmente).
_ Endpoint `PATCH /api/camarero/kds/items/:orderItemId/resolve-cancellation` (Protegido por rol KDS/Staff): Body `{ resolution: 'ACCEPT' | 'REJECT' }`. Actualiza `OrderItem.status` a `CANCELLED` o revierte a `PENDING_KDS`/`PREPARING`. Notifica al cliente (SSE). 3. **Frontend (KDS):**
_ Mostrar alerta/indicación para ítems con `CANCELLATION_REQUESTED`.
_ Botones "Aceptar Cancelación" / "Rechazar Cancelación". 4. **Frontend (Cliente):** Actualizar vista de estado para reflejar si la cancelación fue aceptada/rechazada.

**B3.5. [BAJA/MEDIA - NUEVA TAREA] LC - Gestión Avanzada de Cuentas por Mesa (Fase 1 - Camarero)**
_ **Objetivo:** Permitir al camarero, desde su interfaz, realizar operaciones básicas de gestión de cuentas para una mesa que tiene múltiples `Order`s individuales (de diferentes clientes en la misma mesa).
_ **Sub-Tareas (Conceptual - Interfaz Camarero):** 1. **Visualización Consolidada por Mesa:** Ver todos los `Order`s y sus `OrderItem`s asociados a una `TableIdentifier`. 2. **Transferencia de Ítems (Manual por Camarero):** Funcionalidad para mover un `OrderItem` de un `Order` (sub-cuenta de un cliente) a otro `Order` (sub-cuenta de otro cliente en la misma mesa), antes de que el ítem o pedido origen esté pagado. 3. **División de Cuenta (Manual por Camarero):** Herramientas para marcar qué ítems se pagan juntos o cómo se divide el total entre varios pagos. 4. **Pago Individual de `Order`s:** Permitir al camarero procesar el pago para un `Order` específico (sub-cuenta) de un cliente en la mesa, marcando ese `Order` como `PAID`. 5. **Pago Consolidado de Mesa:** Opción para que un cliente pague todos los `Order`s no pagados de una mesa.
\_ **Nota:** Esto sienta las bases para funcionalidades de división de cuenta más automatizadas o iniciadas por el cliente en el futuro.

---

## C. FUNDAMENTOS TÉCNICOS ESENCIALES LC (Paralelo y Continuo)

- **C1. [CRÍTICA - EN PROGRESO] Testing Backend:** Unitario e Integración para todos los nuevos endpoints KDS, estado de pedido, notificaciones de camarero, gestión de personal/mesas. **Priorizar tests para la lógica de `Order.status` en `kds.service.ts`.**
- **C2. [CRÍTICA - PENDIENTE] Validación Robusta Backend (Zod):** Aplicar Zod a todas las entradas de las nuevas APIs de LC (payloads, params, query), especialmente para `POST /public/order`, `POST /public/order/:existingOrderId/add-items`, y los endpoints KDS.
- **C3. [ALTA - PENDIENTE] Seguridad LC:** Revisión formal de autenticación (tokens API para KDS? PINs para staff?) y autorización (roles `KITCHEN_STAFF`, `WAITER`, `BAR_STAFF` etc.) para todas las nuevas interfaces y APIs de LC.
- **C4. [ALTA - EN PROGRESO] Logging y Monitoring Básico LC:** Asegurar que los flujos críticos (creación de pedidos, cambios de estado en KDS y `Order`, adición de ítems, notificaciones a camarero, acciones de admin LC) generan logs detallados y útiles.
- **C5. [MEDIA - PENDIENTE] Internacionalización (i18n) Completa:** Asegurar que todas las nuevas interfaces (KDS, Camarero, Cliente-Estado Pedido, Admin LC) estén completamente traducidas.

---

## D. FUNCIONALIDADES LOYALPYME CORE (LCo) Y MEJORAS PLATAFORMA - (Prioridad Re-evaluada Post-LC MVP)

_(El contenido de estas tareas se mantiene de la versión del DEVELOPMENT_PLAN.md del 14 de Mayo. Su desarrollo se retomará después de alcanzar un MVP funcional del Módulo Camarero o si surgen oportunidades de integración temprana)._

- **D1. [MEDIA] LCo - Mejoras UX Panel Cliente (Mantenimiento Tarea #15 Plan Original):**
  - Revisar responsividad y usabilidad en móviles.
  - Mejorar feedback visual en acciones (canjes, validación QR).
  - Posibilidad de que el cliente actualice sus datos de perfil (nombre, teléfono).
- **D2. [BAJA] LCo - Gestión de Notificaciones al Cliente (Mantenimiento Tarea #16 Plan Original):**
  - Backend para plantillas de email (ej. bienvenida, subida de nivel, recompensa asignada).
  - (Post-MVP LCo) Integración con servicio de envío de email.
  - (Post-MVP LCo) Preferencias de notificación para el cliente.
- **D3. [BAJA] LCo - Estadísticas Avanzadas para Admin (Mantenimiento Tarea #17 Plan Original):**
  - Gráficos de evolución (clientes, puntos, canjes).
  - Distribución de clientes por nivel.
  - Recompensas más populares, actividad de clientes top.
- **D4. [MEDIA] Plataforma - Mejoras UI/UX Panel Admin General (Mantenimiento Tarea #18 Plan Original):**
  - Unificar estilos entre LCo y LC Admin.
  - Componentes reutilizables para tablas, formularios, modales.
  - Mejorar la gestión de subida de imágenes (progreso, previsualización más robusta).
- **D5. [BAJA] Plataforma - Documentación API Swagger/OpenAPI más Detallada (Mantenimiento Tarea #19 Plan Original):**
  - Completar descripciones, ejemplos de DTOs para todos los endpoints.
- **D6. [BAJA] Plataforma - Configuración Adicional del Negocio (Mantenimiento Tarea #20 Plan Original):**
  - UI para que el admin edite datos básicos de su negocio (logo, colores de marca, datos de contacto públicos).
- **D7. [MEDIA] LC - Integración Completa con Fidelización LCo (Mantenimiento Tarea #29 Plan Original - ahora D1.1):**
  - **Objetivo Detallado:**
    1.  **Acumulación Automática de Puntos:** Cuando un `Order` LC (asociado a un `customerId` LCo) se marca como `PAID`, el sistema LCo automáticamente otorga puntos basados en el `finalAmount` y la configuración de `pointsPerEuro` (o una específica para LC). Se debe definir claramente qué `OrderStatus` de LC dispara esto.
    2.  **Registro en `ActivityLog` LCo:** Se crea una entrada `POINTS_EARNED_ORDER_LC`.
    3.  `totalSpend` y `totalVisits` del cliente LCo se actualizan.
    4.  Se recalcula el `Tier` del cliente LCo.
    5.  **(Avanzado)** Canje de Recompensas LCo (ej. "Producto Gratis") directamente desde el flujo de pedido LC.
        - El cliente identificado con LCo podría ver sus recompensas canjeables en el carrito de LC.
        - La selección de una recompensa LCo la aplicaría al pedido LC (ej. añadir ítem gratis, aplicar descuento).
        - Requiere lógica para marcar la recompensa LCo como canjeada y registrar en `ActivityLog`.
    6.  **(Avanzado)** Aplicación de Beneficios de Nivel LCo (ej. descuentos porcentuales) al total del pedido LC.
        - Si el `Tier` del cliente LCo tiene un descuento aplicable, este se refleja en el total del pedido LC.
  - **Dependencias:** Funcionalidad de marcar pedidos LC como `PAID`. Definición clara de cómo se configuran los puntos por pedidos LC. Lógica de Tiers LCo robusta.
- **D8. [BAJA] Plataforma - Onboarding y Ayuda (Mantenimiento Tarea #30 Plan Original):**
  - Tooltips, guías rápidas, sección de FAQ.
- **D9. [BAJA] Plataforma - Optimización y Rendimiento (Mantenimiento Tarea #31 Plan Original):**
  - Revisión de consultas Prisma, lazy loading en frontend, optimización de imágenes.

---

## E. DEUDA TÉCNICA Y MEJORAS CONTINUAS (Transversales) 🛠️

_(El contenido de estas tareas se mantiene de la versión del DEVELOPMENT_PLAN.md del 14 de Mayo. Su priorización dependerá de la capacidad y necesidad)._

- **E1. [ALTA] Refactorización y Reorganización de Código:**
  - **Backend:** Revisar la estructura de carpetas de servicios/controladores a medida que crecen los módulos. Extraer lógica común a helpers.
  - **Frontend:** Organizar componentes en una estructura más granular (ej. `features/`, `components/common/`). Mejorar la gestión de estado global si es necesario (Context API, Zustand, etc.).
- **E2. [MEDIA] Mejorar la Gestión de Errores (Backend y Frontend):**
  - Backend: Códigos de error HTTP más específicos y consistentes. Mensajes de error más descriptivos para el cliente.
  - Frontend: Componente de `ErrorBoundary` global. Mejor presentación de errores al usuario.
- **E3. [MEDIA] Actualización de Dependencias:** Revisar y actualizar dependencias periódicamente.
- **E4. [EN PROGRESO - LC] Validación Robusta Backend con Zod (Mantenimiento Tarea #24 Plan Original):** Continuar aplicando a todos los módulos, especialmente a las nuevas APIs de LC.
- **E5. [BAJA] Optimización de Consultas a Base de Datos:** Analizar consultas lentas con `prisma.$setLogging` o herramientas de BD.
- **E6. [MEDIA] Documentación Interna del Código:** Mejorar comentarios JSDoc/TSDoc.
- **E7. [ALTA] Variables de Entorno y Configuración:** Centralizar y documentar todas las variables de entorno.
- **E8. [MEDIA] Accesibilidad (a11y) Frontend:** Revisiones periódicas y uso de herramientas para mejorar la accesibilidad.
- **E9. [BAJA] CI/CD (Integración Continua / Despliegue Continuo):** Configurar pipelines básicos (ej. GitHub Actions) para linting, testing y build automático. (Mantenimiento Tarea #32 Plan Original)

---

## F. VISIÓN FUTURA / MÓDULOS ADICIONALES (Post-LC MVP y Mejoras LCo) 🚀

_(El contenido de estas tareas se mantiene de la versión del DEVELOPMENT_PLAN.md del 14 de Mayo, pero B3.5 sienta bases para F1)._

- **F1. LC - Funcionalidades Muy Avanzadas (Mantenimiento Tarea #33 Plan Original):**
  - **Pago Online Integrado:** Permitir a los clientes pagar su cuenta directamente desde la app/vista web (`OrderStatusPage` o similar) mediante integración con pasarelas de pago (Stripe, etc.).
  - **División de Cuentas Avanzada (Iniciada por Cliente):** Funcionalidad para que los clientes en una misma mesa puedan dividir la cuenta digitalmente, ya sea por ítems o por importes.
  - **Sistema de Reservas (`Reservation` model):** Gestión de reservas de mesas, disponibilidad, confirmaciones.
  - **Gestión de Inventario Básico para LC:** Control de stock simple para ingredientes clave o productos, con alertas de bajo stock.
  - **Informes Avanzados LC:** Análisis detallados de ventas, rendimiento de ítems, tiempos de preparación, rotación de mesas, etc.
- **F2. Módulo Pedidos Online / Take Away / Delivery (Mantenimiento Tarea #35 Plan Original):**
  - Extensión natural de LC, permitiendo a los clientes pedir desde fuera del local para recoger o para envío.
  - Gestión de zonas de delivery, costes, tiempos estimados, estado de preparación/envío.
- **F3. App Móvil Dedicada (PWA y/o Nativa) (Mantenimiento Tarea #36 Plan Original):**
  - Para Cliente LCo (mejor UX, notificaciones push).
  - (Opcional) Para Personal de LC (Camareros, KDS en móvil/tablet optimizado).
- **F4. E2E Tests Automatizados (Cypress/Playwright) (Mantenimiento Tarea #37 Plan Original):**
  - Pruebas de extremo a extremo para los flujos de usuario críticos.
- **F5. Monetización Avanzada y Planes de Suscripción Detallados (Mantenimiento Tarea #38 Plan Original):**
  - Diferentes niveles de servicio para los negocios (ej. LCo Básico vs Pro, LC con más funcionalidades).
  - Gestión de suscripciones y facturación para los negocios clientes.
- **F6. Personalización y CRM Avanzado (Transversal) (Mantenimiento Tarea #39 Plan Original):**
  - Segmentación de clientes más profunda.
  - Campañas de marketing dirigidas (email, notificaciones in-app).
  - Historial de cliente más detallado y unificado.
- **F7. Gamificación Avanzada (LCo) (Mantenimiento Tarea #34 Plan Original):**
  - Insignias, retos, rankings, bonificaciones especiales por rachas o logros.
- **F8. (NUEVO - VISION A LARGO PLAZO) Módulo TPV Integrado:**
  - Un sistema de Terminal Punto de Venta (TPV) que se integre directamente con LC y LCo.
  - Gestionaría el cierre de mesas, múltiples métodos de pago, impresión de tickets/facturas simplificadas, arqueo de caja básico.
  - Esto completaría la oferta para hostelería, especialmente para negocios nuevos que no tengan un TPV existente.
- **F9. (NUEVO - VISION A MUY LARGO PLAZO) Módulo Contabilidad/Integraciones Contables:**
  - Inicialmente, exportación de datos de ventas para software de contabilidad.
  - Posteriormente, posibles integraciones directas con sistemas contables populares.

---
