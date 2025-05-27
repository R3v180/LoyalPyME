# LoyalPyME Camarero: ¡Tu Experiencia Gastronómica, Digitalizada y Eficiente! 🧑‍🍳📱✨

**Última Actualización:** 27 de Mayo de 2025 (Refina el flujo del cliente con pedidos activos, adición de ítems y gestión de estados de pedido/cuenta; detalla sincronización de KDS).

Bienvenido a la experiencia moderna de pedir y disfrutar en tu establecimiento favorito con **LoyalPyME Camarero**. Diseñado para agilizar el servicio, personalizar tu pedido y mejorar la comunicación, todo directamente desde tu móvil o gestionado eficientemente por el personal.

---

## 🚀 **I. El Viaje del Cliente Final: Control y Comodidad en Tu Mano**

Aquí te mostramos el flujo completo, desde tu llegada hasta que disfrutas de tu comida, y cómo puedes interactuar con el servicio, incluyendo la gestión de pedidos continuos.

### 1. 📲 **Llegada y Escaneo Mágico del QR de Mesa**

- **Bienvenida:** Al llegar al establecimiento, encontrarás un código QR único en tu mesa (`tableIdentifier`).
- **Escaneo Instantáneo:** Usando la cámara de tu smartphone, el QR te redirige a `https://[tuDominio.com]/m/[businessSlug]/[tableIdentifier]`.

Mesa Designada 🍽️

| |
| Código QR Aquí |
| [ □□□ □ □□□ ] |
| [ □ ■ □ ■ □ ] |
| [ □□□ □ □□□ ] |
|****\*\*****\_\_****\*\*****|
🤳 (Móvil del cliente escaneando)

### 2. 🧾 **Explora la Carta Digital Interactiva (`PublicMenuViewPage.tsx`)**

- **Acceso Inmediato:** Carga la carta del negocio.
- **Verificación de Pedido Activo (NUEVA LÓGICA):**
- Al cargar la página, el sistema revisa el `localStorage` del navegador del cliente para una entrada `activeOrderInfo_BUSINESSSLUG_TABLEIDENTIFIER`.
- **Si existe un pedido activo (`activeOrderIdForTable`):**
  - La interfaz muestra un aviso destacado: "Tienes el pedido #{{orderNumber}} en curso para esta mesa."
  - Se ofrecen opciones como:
    - **"Ver Estado del Pedido"**: Enlaza a `/order-status/:activeOrderId`.
    - **"Añadir más Ítems a este Pedido"**: Permite seguir navegando la carta para añadir nuevos productos al pedido existente (ver Flujo 8.A).
    - **"Empezar un Nuevo Pedido Separado"**: Limpia la referencia al pedido activo del `localStorage` y permite al cliente crear un `Order` completamente nuevo (útil si diferentes personas en la mesa pagan por separado).
  - El "carrito de nuevo pedido" (ver punto 4) está oculto o deshabilitado inicialmente.
- **Si NO existe un pedido activo:**
  - La página funciona en modo "crear nuevo pedido" como se describe a continuación.
- **Navegación Intuitiva y Detalle del Ítem (`MenuItemCard.tsx`):**
- Categorías en acordeón, ítems con fotos, descripciones i18n, precios, alérgenos, tags.
- Indicación de modificadores disponibles.
  IGNORE_WHEN_COPYING_START
  content_copy
  download
  Use code with caution.
  IGNORE_WHEN_COPYING_END

Interfaz Carta (si hay pedido activo):
+-------------------------------------------------+
| [Logo] Mesa: [MESA-5] Pedido Activo: #P-00123 |
|=================================================|
| [ Ver Estado ] [ ➕ Añadir a Pedido ] [ ✨ Nuevo Pedido ] |
|-------------------------------------------------|
| ▼ ENTRANTES (Delicias para comenzar) [📷] |
| ... (ítems de la carta) ... |
+-------------------------------------------------+

### 3. 🎨 **Personaliza tu Plato (`MenuItemCard.tsx`, `ModifierGroupInteractiveRenderer.tsx`)**

- Selección de ítems, modificadores (RADIO/CHECKBOX) con precios dinámicos y validación de reglas (`minSelections`, `maxSelections`, `isRequired`).
- Ajuste de cantidad y notas específicas del ítem.
- Si hay un pedido activo y se está en modo "Añadir a Pedido Existente", estos ítems se preparan para un "carrito de adición". Si no, van al carrito de "nuevo pedido".

### 4. 🛒 **Tu Carrito de Pedido (Nuevo o de Adición) (`ShoppingCartModal.tsx` o similar)**

- **Si es un Nuevo Pedido (no hay `activeOrderIdForTable`):**
  - El carrito (`currentOrderItems` y `orderNotes` en `localStorage`) funciona como se describió anteriormente (revisar, ajustar cantidad, eliminar, notas generales, total).
- **Si se está Añadiendo a un Pedido Existente:**
  - Se usa un "carrito de adición" temporal (estado en `PublicMenuViewPage.tsx`, no necesariamente `localStorage` para este flujo secundario).
  - El modal muestra solo los ítems que se están por añadir, con su subtotal.
  - Botón "Confirmar Adición al Pedido #{{activeOrderNumber}}".

### 5. ⭐ **Opcional: Identifícate para Beneficios LCo**

- _Sin cambios funcionales, pero el `customerId` se asociará al `Order` (nuevo o existente al que se añaden ítems)._

### 6. ➡️ **Envía tu Pedido o Adición**

- **A. Si es un Nuevo Pedido (`handleSubmitOrder` en `PublicMenuViewPage.tsx`):**
- Payload `CreateOrderPayloadDto` con `items`, `orderNotes`, `tableIdentifier`, `customerId?`.
- `POST /public/order/:businessSlug` crea un nuevo `Order` (estado `RECEIVED`) e `OrderItem`s.
- **Respuesta Backend:** Devuelve el `Order` creado (con `id` y `orderNumber`).
- **Frontend Post-Envío:**
  - Notificación de éxito.
  - **Guarda `{ orderId, orderNumber, savedAt }` como `activeOrderInfo` en `localStorage`** para `businessSlug` y `tableIdentifier`.
  - Limpia `currentOrderItems` y `orderNotes` del `localStorage`.
  - Redirige a `/order-status/:orderId` pasando datos en el `state`.
- **B. Si es una Adición a un Pedido Existente (NUEVO FLUJO):**
- Desde el "carrito de adición".
- Payload `AddItemsToOrderDto` con `items: [CreateOrderItemDto]`.
- **NUEVO Backend Endpoint:** `POST /public/order/:existingOrderId/add-items`.
  - Valida que `existingOrderId` puede recibir adiciones (no `PAID`, `CANCELLED`).
  - Crea nuevos `OrderItem`s (estado `PENDING_KDS`) para ese `Order`.
  - Recalcula totales del `Order`. Notifica al KDS.
- **Frontend Post-Adición:**
  - Notificación "Ítems añadidos al pedido #{{orderNumber}}".
  - Limpia el "carrito de adición".
  - Puede redirigir a `OrderStatusPage` o simplemente actualizar la vista.

### 7. ⏳ **Página de Estado del Pedido (`OrderStatusPage.tsx`)**

- Accedida vía `/order-status/:orderId`.
- Muestra `orderNumber`, estado general del `Order` (`orderStatus`), y lista de `OrderItem`s con su estado individual (`OrderItemStatus`).
- **Polling Automático:** Refresca datos llamando a `GET /public/order/:orderId/status` cada ~10 segundos.
- **Lógica de Pedido Finalizado:**
- Si `orderStatus` es `PAID` o `CANCELLED`:
  - El polling se detiene.
  - Se muestra mensaje "Pedido finalizado".
  - El botón "Actualizar" cambia a "Empezar Nuevo Pedido en esta Mesa".
  - Al pulsar "Empezar Nuevo Pedido":
    - Se limpia `activeOrderInfo_...`, `loyalpyme_public_cart_...`, y `loyalpyme_public_order_notes_...` de `localStorage` para la mesa/negocio actual.
    - Redirige a `/m/:businessSlug/:tableIdentifier`.
- **Botones de Acción en `OrderStatusPage` (si el pedido NO es final):**
- **"Actualizar Estado Manualmente"**: Llama a `GET /public/order/:orderId/status`.
- **"Volver al Menú / Añadir más Ítems"**: Enlaza a `/m/:businessSlug/:tableIdentifier` (que detectará el `activeOrderInfo` y permitirá "Añadir a este Pedido").
- **(Futuro - B3.1, B3.4)** "Llamar Camarero", "Pedir Cuenta", "Solicitar Cancelación de Ítem".

### 8. 🙋 **Interacciones Adicionales Durante la Estancia**

- **(Futuro - B3.1) "Llamar Camarero":** Desde `PublicMenuViewPage` o `OrderStatusPage`. Notifica al camarero.
- **(Futuro - B3.1) "Pedir la Cuenta":** Desde `PublicMenuViewPage` o `OrderStatusPage`. Notifica al camarero con preferencias de pago.
- **(Futuro - B3.4) "Solicitar Cancelación de Ítem":** Desde `OrderStatusPage` si el ítem está `PENDING_KDS`. Envía solicitud al KDS para aprobación.

### 9. 💸 **Proceso de Pago y Cierre de Sesión de Mesa**

- El cliente solicita la cuenta o el camarero la presenta.
- Se realiza el pago (gestionado por el camarero/TPV).
- El camarero (o sistema TPV) marca el/los `Order`(s) de la mesa como `PAID`.
- **Cuando el cliente vuelve a `OrderStatusPage` o esta se actualiza, ve el estado `PAID`, el polling se detiene, y se le ofrece empezar un nuevo pedido (lo que limpia el `localStorage` para esa sesión de mesa).**
- Si el cliente se identificó con LCo, el estado `PAID` del `Order` dispara la asignación de puntos.

---

## 👨‍🍳 **II. Flujo del Personal de Cocina/Barra (KDS - Kitchen/Bar Display System)**

El KDS es el panel de control digital para la preparación eficiente y coordinada de los pedidos.

### 1. 🖥️ **Acceso y Visualización de Comandas/Ítems Pendientes**

- Autenticación de personal (`KITCHEN_STAFF`, `BAR_STAFF`).
- Filtrado por `kdsDestination`.
- **Cola de `OrderItem`s:** Ítems en `PENDING_KDS` y `PREPARING` ordenados por `Order.createdAt`.
- **Tarjeta de `OrderItem` Detallada:**
- `orderNumber`, `table.identifier`.
- `menuItem.name` (i18n), `quantity`, modificadores, notas del ítem.
- Hora de entrada.
- **(KDS Avanzado)** Tiempo de preparación estimado (`MenuItem.preparationTime`), temporizador de preparación.

### 2. 🔄 **Gestión del Estado de Preparación de Ítems (`PATCH /api/camarero/kds/items/:orderItemId/status`)**

- **Iniciar Preparación:** Cambia `OrderItem.status` a `PREPARING`. Inicia temporizador.
- **Impacto en `Order.status`:** Si el `Order` estaba `RECEIVED`, pasa a `IN_PROGRESS`.
- **Marcar como Listo:** Cambia `OrderItem.status` a `READY`.
- **Impacto en `Order.status`:** Puede pasar a `PARTIALLY_READY` o `ALL_ITEMS_READY` según otros ítems.
- **Notificación:** Debe notificar a la Interfaz del Camarero (idealmente por "pase", ver punto 4).

### 3. ⏱️ **Gestión de Tiempos y Alertas (KDS Avanzado - B2.KDS1)**

- Muestra tiempo estimado y temporizador real.
- Alertas visuales/sonoras de retraso si se excede `preparationTime`.

### 4. 📦 **Agrupación por Cursos y Sincronización de "Pases" (KDS Avanzado - B2.KDS1)**

- **Objetivo:** Asegurar que los platos de una misma mesa se sirvan de forma coordinada por cursos (ej. todos los entrantes juntos, luego todos los principales).
- **Configuración:** `MenuItem`s deben tener un campo `course: String?` (ej. "ENTRANTE", "PRINCIPAL") o usar `tags` para este propósito.
- **Visualización en KDS:** Agrupar ítems de un mismo `Order` (o de la misma `Table` si hay múltiples pedidos) por `course`.
- **Lógica de "Pase":**
- El KDS (o el jefe de cocina) puede "lanzar" la preparación de un curso completo para una mesa.
- Cuando todos los `OrderItem`s de un curso específico para una mesa están en `READY`, el KDS genera una notificación de "Pase Listo" (ej. "Pase Entrantes Mesa 5 LISTO") para la interfaz del camarero o una pantalla de expedición.
- Esto evita que el camarero recoja ítems sueltos y mejora la experiencia del cliente.

### 5. 🚫 **Gestión de Incidencias (KDS Avanzado)**

- **Rechazar Ítem:** Si no se puede preparar, KDS marca `OrderItem` como `REJECTED` (nuevo estado), notifica al camarero.
- **Gestión de Solicitudes de Cancelación (B3.4):**
- KDS ve `OrderItem.status = CANCELLATION_REQUESTED`.
- KDS puede "Aceptar" (cambia a `CANCELLED`) o "Rechazar" (revierte a `PENDING_KDS`/`PREPARING`). Notifica al cliente.

---

## 🤵 **III. Flujo del Personal de Sala/Camareros (Interfaz de Camarero)**

La interfaz del camarero es clave para la eficiencia y la atención al cliente.

### 1. 🔑 **Acceso y Vista General**

- Autenticación (`WAITER` rol, PIN).
- **Panel Principal:**
- **Notificaciones Activas:**
  - Llamadas de mesa (con motivo).
  - Solicitudes de cuenta (con preferencias de pago).
  - **NUEVO:** "Pases Listos" del KDS (ej. "Entrantes Mesa 5 Listos").
- **Vista de Mesas:** Lista/cuadrícula de `Table`s con su estado (`identifier`, "Libre", "Ocupada", "Pedido Activo", "Cuenta Solicitada", "Necesita Limpieza").

### 2. 🛎️ **Recepción y Gestión de Notificaciones**

- Actualización en tiempo real (SSE/WebSockets ideal).
- Detalles y acciones sobre notificaciones.

### 3. 🍽️ **Recogida y Entrega de Pedidos ("Pases")**

- Al recibir notificación de "Pase Listo" del KDS, el camarero recoge los ítems correspondientes.
- **Marcar Ítems como Servidos:**
- El camarero, desde su interfaz, marca los `OrderItem`s del pase como `SERVED` (llama a `PATCH /api/camarero/staff/order-items/:orderItemId/status`).
- **Impacto en `Order.status`:** Si todos los ítems de un `Order` pasan a `SERVED`, el `Order.status` cambia a `COMPLETED`. Esto NO significa que la cuenta esté cerrada, solo que esa tanda de pedido se entregó.

### 4. ✍️ **Toma de Pedidos Manual por el Camarero**

- Seleccionar mesa. Acceder a la carta.
- Añadir ítems (incluyendo "Fuera de Carta" con precio manual).
- Enviar al KDS. El `Order` se asocia a la mesa y al camarero.
- **Consideración:** Si los clientes de esa mesa también están pidiendo desde sus móviles, el camarero podría estar creando un `Order` adicional para la misma mesa. Su interfaz debería permitirle ver todos los `Order`s activos de la mesa.

### 5. 💰 **Gestión de Cuentas y Pago (Flujo Clave)**

- **Visualizar Cuenta de Mesa:** El camarero puede ver todos los `Order`s activos y sus `OrderItem`s para una `TableIdentifier`, o los ítems de un `Order` específico si un cliente paga individualmente.
- **Procesar Pago:**
- Si un cliente paga su `Order` individual: El camarero marca ese `Order` como `PAID`.
- Si un cliente paga toda la mesa: El camarero consolida (si hay varios `Order`s) y marca todos los `Order`s relevantes como `PAID`.
- El estado `PAID` es el trigger para la asignación de puntos LCo y para que `OrderStatusPage` considere el pedido como finalizado.
- **Cerrar/Liberar Mesa:** Después del pago y partida de los clientes, el camarero marca la mesa como `LIBRE` o `NECESITA_LIMPIEZA`.

### 6. 🤝 **Atender Solicitudes del Cliente y Gestión de Mesa**

- **Llamadas de Mesa:** Atender y marcar como resuelta.
- **Transferencia de Ítems / Invitaciones (B3.5 - Gestión Avanzada Cuentas Fase 1):**
  - Si un cliente desea pagar un ítem que pidió otro cliente de la misma mesa, el camarero (desde su interfaz) debe poder "mover" ese `OrderItem` (o su valor) de un `Order` a otro dentro de la misma `Table`, antes de que se genere la factura final para alguno de ellos. Esto requiere que el camarero pueda ver los `Order`s individuales de la mesa.

---

## 👑 **IV. Flujo del Administrador del Negocio (LC) - Configuración y Supervisión**

_Las funcionalidades de Gestión de Carta, Mesas, Personal y Destinos KDS se mantienen como en la versión anterior del workflow._

### Nuevo Punto: Visualización de Pedidos y Estados (Supervisión)

- El `BUSINESS_ADMIN` podría tener una vista en su panel para ver los pedidos en curso, sus estados generales y los estados de los ítems, similar a una vista maestra del KDS o de la actividad de los camareros, pero sin las funciones operativas directas. Útil para supervisión y análisis en tiempo real.

---

✨ **Beneficios para el Negocio con LoyalPyME Camarero:**

- _Sin cambios._

---

IGNORE_WHEN_COPYING_START
content_copy
download
Use code with caution.
IGNORE_WHEN_COPYING_END

Resumen de los Cambios y Adiciones en este Workflow:

I. Viaje del Cliente Final:

Punto 2: Detallada la verificación de activeOrderInfo en localStorage al cargar PublicMenuViewPage y cómo afecta la UI.

Punto 4: Distinción entre carrito de "nuevo pedido" y "carrito de adición" (futuro).

Punto 6.B: Añadido el flujo para "Añadir a Pedido Existente" con el nuevo endpoint.

Punto 7: Refinada la lógica de "Pedido Finalizado" en OrderStatusPage para basarse en PAID o CANCELLED para la limpieza de localStorage y cambio de botones. Detallados los botones de acción.

Punto 9: Clarificado cómo el estado PAID afecta a OrderStatusPage.

II. Flujo del KDS:

Punto 2: Clarificado el impacto de los cambios de OrderItem.status en el Order.status general.

Punto 4: Detallada la funcionalidad de "Agrupación por Cursos y Sincronización de Pases" como una mejora clave para la calidad del servicio.

III. Flujo del Personal de Sala/Camareros:

Punto 1 y 3: Las notificaciones al camarero ahora pueden ser "Pases Listos" en lugar de ítems individuales.

Punto 5: Detallada la gestión de cuentas cuando hay múltiples Orders por mesa. El estado COMPLETED del Order no es el cierre final; PAID sí lo es.

Punto 6: Añadida la capacidad del camarero para transferir ítems entre sub-cuentas de una mesa.

IV. Flujo del Administrador:

Añadida una nota sobre una posible vista de supervisión de pedidos para el admin.

Este documento ahora debería reflejar de manera mucho más completa y detallada la operativa que estamos buscando, incluyendo los puntos que has ido planteando.

Por favor, revísalo. Si estás de acuerdo, podemos pasar a actualizar el PROJECT_STATUS.md para que coincida con los avances y los detalles refinados en este workflow y en el DEVELOPMENT_PLAN.md.
