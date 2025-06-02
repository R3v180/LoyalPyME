# LoyalPyME Camarero: ¡Tu Experiencia Gastronómica, Digitalizada y Eficiente! 🧑‍🍳📱✨

**Última Actualización:** 3 de Junio de 2025 (Refleja creación de pedidos con modificadores robusta, KDS y servicio de camarero (entrega de ítems) funcionales. Detalla el próximo flujo de "Pedir Cuenta", "Marcar como Pagado" y "Liberar Mesa".)

Bienvenido a la experiencia moderna de pedir y disfrutar en tu establecimiento favorito con **LoyalPyME Camarero**. Diseñado para agilizar el servicio, personalizar tu pedido y mejorar la comunicación, todo directamente desde tu móvil o gestionado eficientemente por el personal del restaurante.

---

## 🚀 **I. El Viaje del Cliente Final: Control y Comodidad en Tu Mano**

Este flujo describe la experiencia del cliente desde su llegada hasta la finalización y pago de su pedido, incluyendo las interacciones con el personal de cocina/barra (KDS) y de sala (Camarero).

### 1. 📲 **Llegada y Escaneo Mágico del QR de Mesa**

    * **Bienvenida:** Al llegar, el cliente encuentra un código QR único en su mesa, provisto por el establecimiento. Este QR contiene el `tableIdentifier` único de esa mesa.
    * **Escaneo Instantáneo:** Usando la cámara de su smartphone (o una app de lectura de QR), el cliente escanea el código. El QR lo redirige a una URL del tipo `https://[tuDominio.com]/m/[businessSlug]/[tableIdentifier]`.
    * **Estado:** Funcionalidad base de generación de QR (implícita, ya que el admin gestiona mesas) y redirección.

### 2. 🧾 **Explora la Carta Digital Interactiva (`PublicMenuViewPage.tsx`)**

    * **Acceso Inmediato:** Al acceder a la URL, se carga la carta digital del negocio (`businessSlug`), contextualizada para la mesa (`tableIdentifier`).
    * **Verificación de Pedido Activo (Fundamental):**
        * Al cargar la página, el sistema revisa `localStorage` buscando una entrada con la clave `activeOrderInfo_BUSINESSSLUG_TABLEIDENTIFIER`.
        * **Si existe un pedido activo (`activeOrderIdForTable`, `activeOrderNumberForTable`):**
            * La UI muestra un mensaje destacado: "Tienes el pedido #{{orderNumber}} en curso para esta mesa."
            * **Opciones Clave:**
                * "Ver Estado del Pedido": Enlaza directamente a `/order-status/:activeOrderId` (pasando `orderNumber`, `businessSlug`, `tableIdentifier` en el `state` de la ruta).
                * **"[PENDIENTE - ALTA/MEDIA PRIORIDAD]" Añadir más Ítems a este Pedido:** (Ver Tarea B1.3 en `DEVELOPMENT_PLAN.md`). Permitiría al cliente reabrir la carta para añadir más productos al pedido activo.
                * **"[PENDIENTE - BAJA PRIORIDAD]" Empezar un Nuevo Pedido Separado (para la misma mesa, si la política del negocio lo permite):** Implicaría una lógica más compleja para gestionar múltiples pedidos activos en una misma mesa o forzar la finalización del anterior.
            * El carrito para "nuevo pedido" y la opción de enviar un nuevo pedido están ocultos o deshabilitados para evitar confusión.
        * **Si NO existe pedido activo:** La página funciona en modo "crear nuevo pedido", con el carrito vacío.
    * **Navegación y Detalle del Ítem (`MenuItemCard.tsx`):**
        * Categorías del menú presentadas en componentes tipo acordeón (`CategoryAccordion.tsx`) con imágenes y descripciones (i18n).
        * Cada ítem se muestra en una tarjeta (`MenuItemCard.tsx`) con su imagen, nombre (i18n), descripción (i18n), precio base, lista de alérgenos (iconos/texto) y etiquetas (ej. "VEGANO", "PICANTE").
    * **Estado:** Funcionalidad de detección de pedido activo y visualización de carta completada y estable.

### 3. 🎨 **Personaliza tu Plato (`MenuItemCard.tsx`, `ModifierGroupInteractiveRenderer.tsx`)**

    * Al seleccionar un ítem, se abre un modal o sección para la configuración de modificadores.
    * **Selección de Modificadores (`ModifierGroupInteractiveRenderer.tsx`):**
        * Se presentan los `ModifierGroup`s asociados al ítem.
        * Cada grupo muestra sus `ModifierOption`s según el `uiType` (RADIO para selección única, CHECKBOX para múltiple).
        * **Validación en Tiempo Real Frontend:** Se aplican las reglas `minSelections`, `maxSelections`, y `isRequired` de cada grupo. La UI impide selecciones inválidas.
        * **Cálculo de Precio Dinámico:** El precio del ítem se actualiza instantáneamente en la UI a medida que el cliente selecciona/deselecciona opciones con `priceAdjustment`.
    * **Cantidad del Ítem:** El cliente puede ajustar la cantidad del ítem configurado (por defecto 1).
    * **Notas Específicas del Ítem:** Un campo de texto opcional para que el cliente añada instrucciones especiales para ese ítem (ej. "sin sal", "muy hecho").
    * **Estado:** Funcionalidad de personalización de ítems con modificadores, incluyendo la validación frontend y el cálculo dinámico de precios, **completada, robusta y validada tras la solución del bug de modificadores.**

### 4. 🛒 **Tu Carrito de Pedido (`ShoppingCartModal.tsx` en `PublicMenuViewPage.tsx`)**

    * **Acumulación de Ítems:**
        * Los ítems configurados (con sus modificadores, cantidad, precio calculado y notas) se añaden al estado local `currentOrderItems`.
        * Este estado se persiste en `localStorage` (clave `loyalpyme_public_cart_BUSINESSSLUG_TABLEIDENTIFIER`) si no hay un pedido activo ya enviado para la mesa. Se limpia al enviar un nuevo pedido o si se detecta un pedido activo.
    * **Modal del Carrito:**
        * Se accede mediante un botón/icono persistente que muestra el número de ítems y/o el total actual.
        * Lista detallada de `currentOrderItems`: nombre, cantidad, precio unitario (con modificadores), precio total por línea de ítem, modificadores seleccionados, notas del ítem.
        * **Acciones en el Carrito:**
            * Modificar cantidad de un ítem (con recalculo automático de totales).
            * Eliminar un ítem.
            * Añadir/editar notas generales para todo el pedido (`orderNotes`, persistidas en `localStorage`).
            * Vaciar completamente el carrito.
        * Muestra el subtotal, impuestos (futuro), y total final del pedido.
    * **Estado:** Funcionalidad completada y estable.

### 5. ⭐ **Opcional: Identifícate para Beneficios LCo (Integración con LoyalPyME Core)**

    * **Contexto:** Si el `Business` tiene el módulo LCo activo.
    * **Flujo:**
        * No es estrictamente necesario para realizar un pedido LC.
        * Si el cliente está navegando y tiene una sesión LCo activa (ya logueado en el dominio principal o a través de un login en la `PublicMenuViewPage`), su `customerId` (UUID del `User` LCo) puede asociarse al pedido.
        * La `PublicMenuViewPage` puede obtener el `customerId` del `localStorage` o de un contexto de autenticación.
    * **Impacto:** Al enviar el pedido (paso 6), si se incluye el `customerId`, el backend podrá asociar el `Order` LC con el cliente LCo.
    * **Estado:** La asociación básica de `customerId` al `Order` si el cliente está logueado está completada. La acumulación automática de puntos LCo tras el pago del pedido LC y el canje de recompensas LCo en el flujo LC son funcionalidades futuras de integración (ver `DEVELOPMENT_PLAN.md` Tarea D7).

### 6. ➡️ **Envía tu Pedido (`handleSubmitOrder` en `PublicMenuViewPage.tsx`)**

    * Desde el `ShoppingCartModal`, el cliente pulsa "Enviar Pedido".
    * **Payload:** Se construye un `CreateOrderPayloadDto` que incluye:
        * `items`: Array de `CreateOrderItemDto`, cada uno con `menuItemId`, `quantity`, `notes?` (del ítem), y `selectedModifierOptions: [{modifierOptionId}]`.
        * `orderNotes?`: Notas generales del pedido.
        * `tableIdentifier`: Obtenido de los params de la URL.
        * `customerId?`: Si el cliente está logueado con LCo.
    * **Endpoint:** Se realiza una petición `POST` a `/public/order/:businessSlug`.
    * **Backend (`createPublicOrderHandler` en `order.controller.ts` y `createOrder` en `order.service.ts`):**
        * `plainToInstance` transforma el `req.body` JSON en una instancia de `CreateOrderDto`, asegurando que los `selectedModifierOptions` anidados se conviertan en arrays de `SelectedOrderModifierOptionDto` gracias a los decoradores `@Type` y `@ValidateNested` en `order.dto.ts`.
        * Se realizan validaciones exhaustivas: activación del negocio y módulo, disponibilidad de `MenuItem`s y `ModifierOption`s, pertenencia al negocio, cumplimiento de reglas de selección de modificadores (`minSelections`, `maxSelections`, `isRequired`). **Esta validación ahora funciona correctamente tras la solución del bug de modificadores.**
        * Se recalcula `priceAtPurchase` (precio unitario del ítem + suma de `priceAdjustment` de modificadores) y `totalItemPrice` para cada `OrderItem`. Se calcula el `totalAmount`/`finalAmount` del `Order`.
        * Se crea transaccionalmente en la BD: `Order` (con `tableId` resuelto, `customerLCoId?`, `orderNotes`, `orderNumber` único autogenerado, `status: RECEIVED`, `source: CUSTOMER_APP`), `OrderItem`s (con snapshots i18n de nombre/descripción, `kdsDestination`, `status: PENDING_KDS`), y `OrderItemModifierOption`s (con snapshots i18n de nombre/precio de opción).
        * Se devuelve el objeto `Order` completo recién creado.
    * **Frontend Post-Envío:**
        * Notificación Mantine de éxito (mostrando `orderNumber` o `id` del pedido).
        * Se guarda `{ orderId, orderNumber, businessSlug, tableIdentifier, savedAt }` como `activeOrderInfo` en `localStorage` (clave `activeOrderInfo_BUSINESSSLUG_TABLEIDENTIFIER`).
        * Se limpian `currentOrderItems` y `orderNotes` del `localStorage` (claves `loyalpyme_public_cart_...` y `loyalpyme_public_order_notes_...`).
        * Se redirige al cliente a `/order-status/:orderId` (pasando `orderNumber`, `businessSlug`, `tableIdentifier` en el `state` de la ruta).
    * **Estado:** Funcionalidad completada, robusta y validada.

### 7. ⏳ **Página de Estado del Pedido (`OrderStatusPage.tsx`)**

    * **Acceso:** Vía `/order-status/:orderId`. Lee `orderId` de URL y `orderNumber`, `businessSlug`, `tableIdentifier` del `state` de navegación (pasados por `PublicMenuViewPage.tsx`).
    * **Visualización:**
        * Muestra `orderNumber`, `tableIdentifier`, estado general del `Order` (`orderStatus`), notas generales.
        * Lista de `OrderItem`s: `itemNameSnapshot_es/en`, `quantity`, y estado individual (`OrderItemStatus`). Se debe asegurar que los estados `SERVED` y `COMPLETED` (del pedido general) se reflejen correctamente.
    * **Polling Automático:** Refresca datos llamando a `GET /public/order/:orderId/status` cada ~10 segundos.
    * **Lógica de Pedido Finalizado:**
        * Si `orderStatus` es `PAID` o `CANCELLED` (obtenido del backend):
            * El polling se detiene.
            * Se muestra un mensaje apropiado (ej. "Pedido Pagado ¡Gracias!", "Pedido Cancelado").
            * El botón "Actualizar" (si existe) cambia a "Empezar Nuevo Pedido en esta Mesa".
            * Al pulsar "Empezar Nuevo Pedido...": se limpian de `localStorage` las claves `activeOrderInfo_...`, `loyalpyme_public_cart_...`, y `loyalpyme_public_order_notes_...` para la mesa/negocio actual, y se redirige a `/m/:businessSlug/:tableIdentifier`.
    * **Botones de Acción (si el pedido NO es `PAID` o `CANCELLED`):**
        * "Actualizar Estado Manualmente": Llama a `GET /public/order/:orderId/status`.
        * "Volver al Menú": Enlaza a `/m/:businessSlug/:tableIdentifier`. `PublicMenuViewPage` detectará `activeOrderInfo` y mostrará el aviso de pedido en curso.
        * **"[PENDIENTE - CRÍTICO]" Botón "Pedir la Cuenta":** (Ver Tarea B1.1 en `DEVELOPMENT_PLAN.md`). Se mostrará si el pedido está `IN_PROGRESS`, `PARTIALLY_READY`, `ALL_ITEMS_READY`, `COMPLETED`.
    * **Estado:** Visualización y finalización básica (`PAID`/`CANCELLED`) completadas y estables. Se adaptará para el nuevo flujo de "Pedir Cuenta" y para mostrar correctamente el estado `COMPLETED` (todos los ítems servidos, antes del pago).

### 8. ➕ **[PENDIENTE - ALTA/MEDIA PRIORIDAD] Añadir Ítems a un Pedido Existente (Cliente)**

    * **Flujo:**
        * Desde `PublicMenuViewPage.tsx`: Si se detecta un `activeOrderInfo` y el pedido NO está `PAID` o `CANCELLED`, la UI debe permitir al cliente navegar la carta y añadir ítems. El carrito se usaría para acumular estos nuevos ítems. El botón de envío sería "Añadir al Pedido #X".
        * Desde `OrderStatusPage.tsx`: Si el pedido NO está `PAID` o `CANCELLED`, un botón "Añadir más Ítems" podría llevar al cliente de vuelta a `PublicMenuViewPage.tsx` en este modo "añadir a pedido".
    * **Backend:** Requerirá que el endpoint `POST /public/order/:existingOrderId/add-items` (o la ruta actual `POST /api/public/order/:orderId/items` que usa `OrderService.addItemsToOrder`) esté completamente operativo para esta funcionalidad, incluyendo el recálculo de totales y la posible transición de `Order.status` (ej. de `COMPLETED` o `PENDING_PAYMENT` de nuevo a `IN_PROGRESS`).
    * _(Tarea B1.3 del `DEVELOPMENT_PLAN.md` actualizado)._

### 9. 🙋 **[PENDIENTE - CRÍTICO] Pedir la Cuenta y Otras Interacciones (Cliente)**

    * Desde `OrderStatusPage.tsx` (si el pedido no está `PAID`/`CANCELLED`):
        * **"Pedir la Cuenta":** Botón que llama a `POST /public/order/:orderId/request-bill`. El backend actualiza `Order.status` a `PENDING_PAYMENT` y/o `Order.isBillRequested = true`. La UI del cliente refleja "Cuenta solicitada".
        * **"[PENDIENTE - BAJA PRIORIDAD MVP]" "Llamar Camarero":** (Tarea B3.1 del `DEVELOPMENT_PLAN.md`) Notifica al personal de sala (requiere sistema de notificación o polling por parte del camarero).
        * **"[PENDIENTE - MEDIA PRIORIDAD]" "Solicitar Cancelación de Ítem":** (Tarea B3.5 del `DEVELOPMENT_PLAN.md`) Si el ítem está `PENDING_KDS` o `PREPARING`. Envía solicitud (`OrderItem.status = CANCELLATION_REQUESTED`).
    * _(Tareas B1.1 del `DEVELOPMENT_PLAN.md` actualizado)._

### 10. 💸 **[PENDIENTE - CRÍTICO] Proceso de Pago y Cierre de Sesión de Mesa**

    * Cliente ha solicitado cuenta, `Order.status` es `PENDING_PAYMENT`.
    * Camarero gestiona el cobro (físicamente).
    * Camarero usa su interfaz para marcar el `Order` como `PAID` (ver Flujo del Personal de Sala).
    * `OrderStatusPage.tsx` del cliente (vía polling) detecta `Order.status = PAID`.
        * Muestra mensaje de agradecimiento.
        * Activa la lógica de "Pedido Finalizado" (limpieza de `localStorage` para `activeOrderInfo` etc., botón para "Empezar Nuevo Pedido").
    * Si el cliente estaba identificado con LCo y el negocio tiene LCo activo:
        * El backend (al marcar `Order.status = PAID` en `OrderService.markOrderAsPaid`) automáticamente calcula y asigna puntos al `User.points`, actualiza `User.totalSpend`, `User.totalVisits`, y crea un `ActivityLog` de tipo `POINTS_EARNED_ORDER_LC`. Se dispara la reevaluación del `Tier`.
    * _(Tareas B1.2 y parte de D7 del `DEVELOPMENT_PLAN.md` actualizado)._

---

## 👨‍🍳 **II. Flujo del Personal de Cocina/Barra (KDS - Kitchen Display System) - [COMPLETADO Y VALIDADO]**

El KDS (`KitchenDisplayPage.tsx`) es el panel de control digital para la preparación eficiente y coordinada de los pedidos. Accesible por roles `KITCHEN_STAFF`, `BAR_STAFF`, `BUSINESS_ADMIN` en `/admin/kds`.

### 1. 🖥️ **Acceso y Visualización de Comandas/Ítems**

    * **Autenticación:** Login estándar de usuario con roles KDS.
    * **Selección de Destino:** `SegmentedControl` para elegir el `kdsDestination` ("COCINA", "BARRA").
    * **Cola de `OrderItem`s:**
        * Obtenidos mediante `GET /api/camarero/kds/items` (filtrado por destino y estados `PENDING_KDS`, `PREPARING`).
        * Ordenados por `Order.createdAt`.
    * **Tarjeta de `OrderItem` Detallada:** Muestra `orderNumber`, `table.identifier`, hora, nombre del ítem (i18n), cantidad, modificadores (i18n), notas, estado actual del ítem.
    * **Refresco Automático:** Polling (cada ~15s), pausado durante actualizaciones. Botón de refresco manual.
    * **Estado:** Funcionalidad completada y validada.

### 2. 🔄 **Gestión del Estado de Preparación de Ítems (`PATCH /api/camarero/kds/items/:orderItemId/status`)**

    * **Botones de Acción en cada Tarjeta de `OrderItem`:**
        * Si `PENDING_KDS`: "Empezar Preparación" (-> `PREPARING`), "Cancelar Ítem" (-> `CANCELLED`).
        * Si `PREPARING`: "Marcar como Listo" (-> `READY`), "Cancelar Ítem" (-> `CANCELLED`).
    * **Feedback:** Estado de carga en botón, notificaciones Mantine.
    * **Actualización de UI:** La lista se refresca; el ítem cambia o desaparece.
    * **Impacto en `Order.status` (Backend):** `kds.service.ts` actualiza `Order.status` (`RECEIVED` -> `IN_PROGRESS` -> `PARTIALLY_READY` -> `ALL_ITEMS_READY`). Lógica validada.
    * **Estado:** Funcionalidad completada y validada.

### 3. ⏱️ **[PENDIENTE - KDS AVANZADO] Gestión de Tiempos y Alertas**

    * _(Como en DEVELOPMENT_PLAN.md Tarea B2.3)_

### 4. 📦 **[PENDIENTE - KDS AVANZADO] Agrupación por Cursos y Sincronización de "Pases"**

    * _(Como en DEVELOPMENT_PLAN.md Tarea B2.3)_

### 5. 🚫 **[PENDIENTE - MEDIA PRIORIDAD] Gestión de Incidencias por KDS**

    * **Rechazar Ítem:** Si un ítem no se puede preparar, KDS lo marca (ej. `REJECTED_KDS`, un nuevo `OrderItemStatus`). Esto debería notificar al camarero y/o cliente.
    * **Gestión de Solicitudes de Cancelación de Cliente:** Si cliente solicita cancelar (`OrderItem.status = CANCELLATION_REQUESTED`):
        * KDS ve la solicitud. Puede "Aceptar Cancelación" (-> `CANCELLED`) o "Rechazar Cancelación" (revierte a `PREPARING` o `PENDING_KDS`).
        * Notifica al cliente del resultado a través de `OrderStatusPage.tsx`.
    * _(Parte de Tarea B3.5 del `DEVELOPMENT_PLAN.md`)_

---

## 🤵 **III. Flujo del Personal de Sala/Camareros (Interfaz de Camarero) - [ENTREGA DE ÍTEMS COMPLETADA, PENDIENTE CICLO DE PAGO]**

Esta sección detalla la funcionalidad actual y pendiente para el rol `WAITER` a través de la `WaiterPickupPage.tsx` y futuras interfaces.

### 1. 🔑 **Acceso y Vista General (Interfaz Camarero)**

    * **Autenticación:** Login estándar para `UserRole.WAITER` (email/password). (Futuro: login rápido con `StaffPin`).
    * **Panel Principal Actual (`WaiterPickupPage.tsx` en `/admin/camarero/pickup-station`):**
        * **"Ítems Listos para Recoger":** Lista de `OrderItem`s que están en estado `READY`, obtenidos de `GET /api/camarero/staff/ready-for-pickup`.
    * **[PENDIENTE] Panel Principal Mejorado (`WaiterDashboardPage.tsx` o similar):**
        * **Notificaciones Activas:**
            * "Ítems/Pases Listos para Recoger" (funcionalidad actual).
            * "Mesas/Pedidos Solicitando Cuenta" (de Tarea B1.1).
            * (Futuro) "Llamadas de Mesa" de clientes.
        * **(Futuro - Tarea B3.2) Vista de Mesas:** Lista/cuadrícula de `Table`s con su estado (`identifier`, estado actual: `AVAILABLE`, `OCCUPIED`, `PENDING_PAYMENT_TABLE`, `NEEDS_CLEANING`).

### 2. 🛎️ **Recepción y Gestión de Notificaciones (Interfaz Camarero)**

    * **Actualización "Ítems Listos":** La lista en `WaiterPickupPage.tsx` se actualiza mediante polling. (Futuro: SSE/WebSockets).
    * **[PENDIENTE] Notificaciones de Solicitud de Cuenta:** Alertas visuales/sonoras para nuevas solicitudes de clientes (de Tarea B1.1).

### 3. 🍽️ **Recogida y Entrega de Pedidos (Interfaz Camarero - `WaiterPickupPage.tsx`) - [COMPLETADO Y VALIDADO]**

    * **Visualización:** El camarero ve la lista de `OrderItem`s (`ReadyPickupItemDto`) que están `READY`, con detalles del pedido, mesa, ítem y modificadores.
    * **Acción "Marcar como Servido":**
        * Botón "Servido" en cada ítem.
        * Al pulsar, llama a `PATCH /api/camarero/staff/order-items/:orderItemId/status` (con `newStatus: SERVED`).
        * El `OrderItem.status` se actualiza a `SERVED`, se registra `servedAt` y `servedById`.
        * El ítem desaparece de la lista de "pendientes de recoger".
    * **Impacto en `Order.status` (Backend):**
        * Cuando todos los `OrderItem`s activos de un `Order` se marcan como `SERVED`, el `Order.status` general del pedido cambia a `COMPLETED`.
        * El cliente ve este estado `COMPLETED` en su `OrderStatusPage.tsx`.
    * **Estado:** Funcionalidad de entrega de ítems y marcado de pedido como `COMPLETED` está operativa.

### 4. 💸 **[PENDIENTE - CRÍTICO] Gestión de Cuentas y Pago (Interfaz Camarero - Tareas B1.1 y B1.2)**

    * **Visualizar Pedidos para Cobro:**
        * En la (futura) vista de mesas o lista de pedidos del camarero, se deben destacar los pedidos con `Order.status = PENDING_PAYMENT`.
    * **Procesar Pago y Marcar como Pagado:**
        * Acción "Registrar Pago" / "Marcar Como Pagada" para un pedido en `PENDING_PAYMENT`.
        * (Opcional) Modal para que el camarero introduzca el método de pago utilizado (`paymentMethodUsed`) y notas del pago.
        * Llamar a `POST /api/camarero/staff/order/:orderId/mark-as-paid` con los detalles.
        * **Backend:** `OrderService.markOrderAsPaid` actualiza `Order.status = PAID`, `paidAt`, `paidByUserId`, `paymentMethodUsed`.
    * **Liberar Mesa:**
        * **Backend:** Después de marcar como `PAID`, el `OrderService` actualiza `Table.status` a `AVAILABLE` (o `NEEDS_CLEANING`).
        * **Frontend (Camarero):** La vista de mesas debe reflejar la mesa como disponible.
    * **Impacto en Cliente:** `OrderStatusPage.tsx` del cliente refleja `PAID`, se limpia `localStorage`.
    * **Impacto en LCo:** Si aplica, se disparará la asignación de puntos.

### 5. ✍️ **[PENDIENTE - MEDIA PRIORIDAD] Toma de Pedidos Manual por el Camarero (Tarea B3.2)**

    * _(Como en DEVELOPMENT_PLAN.md)_

---

## 👑 **IV. Flujo del Administrador del Negocio (LC) - Configuración y Supervisión**

El `BUSINESS_ADMIN` configura y supervisa el Módulo Camarero desde el panel de administración (`/admin/dashboard/camarero/*`).

### 1. ⚙️ **Gestión de Carta Digital [COMPLETADO]**

    * CRUD completo de `MenuCategory`, `MenuItem`, `ModifierGroup`, `ModifierOption` funcional.

### 2. 🪑 **[PENDIENTE - MEDIA PRIORIDAD] Gestión de Mesas (Tarea B3.3)**

    * CRUD para `Table`s (`identifier`, `zone`, `capacity`).
    * Generación de QR para cada mesa.

### 3. 🧑‍💼 **[PENDIENTE - MEDIA PRIORIDAD] Gestión de Personal de LC (Tarea B3.3 y enlace a B3.4)**

    * CRUD para usuarios con roles `WAITER`, `KITCHEN_STAFF`, `BAR_STAFF`.
    * Gestión de `StaffPin`s.
    * (Futuro) Asignación de roles personalizados / permisos granulares.

### 4. 🖥️ **[PENDIENTE - MEDIA PRIORIDAD] Configuración de Destinos KDS (Tarea B3.3)**

    * UI para definir `kdsDestination` válidos.

### 5. 📊 **[PENDIENTE - BAJA PRIORIDAD MVP] Supervisión de Pedidos en Tiempo Real (Admin)**

    * Vista de supervisión de pedidos en curso.

---

✨ **Beneficios para el Negocio con LoyalPyME Camarero (Visión Completa):**

- **Eficiencia Operativa:** Reducción de errores en la toma de comandas, comunicación directa y clara con cocina/barra.
- **Mejora de la Experiencia del Cliente:** Autonomía para pedir, personalización, transparencia en el estado del pedido.
- **Optimización de Tiempos:** Agilización del proceso de pedido y preparación.
- **Incremento Potencial de Ventas:** Facilidad para añadir ítems, sugerencias (futuro), menor tiempo de espera.
- **Recopilación de Datos:** Información valiosa sobre ítems populares, tiempos de preparación, flujo de pedidos para toma de decisiones.
- **Imagen Moderna y Profesional:** Adopción de tecnología para mejorar el servicio.
- **Integración con Fidelización (LCo):** Potencial para convertir cada pedido en una oportunidad de fidelizar (acumulación de puntos, canje de recompensas).

---
