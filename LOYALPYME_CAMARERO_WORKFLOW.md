# LoyalPyME Camarero: ¡Tu Experiencia Gastronómica, Digitalizada y Eficiente! 🧑‍🍳📱✨

**Última Actualización:** 26 de Junio de 2025 (Refleja el canje de recompensas LCo integrado en el carrito de pedido como funcionalidad completada y validada.)

Bienvenido a la experiencia moderna de pedir y disfrutar en tu establecimiento favorito con **LoyalPyME Camarero**. Diseñado para agilizar el servicio, personalizar tu pedido, mejorar la comunicación y ahora, ¡canjear tus recompensas de fidelidad directamente en tu pedido!

---

## 🚀 I. El Viaje del Cliente Final: Control y Comodidad en Tu Mano

Este flujo describe la experiencia del cliente desde su llegada hasta la finalización y pago de su pedido, incluyendo las interacciones con el personal de cocina/barra (KDS) y de sala (Camarero).

### [cite_start]1. 📲 Llegada y Escaneo Mágico del QR de Mesa [cite: 10]

- **Bienvenida:** Al llegar, el cliente encuentra un código QR único en su mesa, provisto por el establecimiento. [cite_start]Este QR contiene el `tableIdentifier` único de esa mesa. [cite: 10]
- **Escaneo Instantáneo:** Usando la cámara de su smartphone (o una app de lectura de QR), el cliente escanea el código. [cite_start]El QR lo redirige a una URL del tipo `https://[tuDominio.com]/m/[businessSlug]/[tableIdentifier]`. [cite: 10]
- [cite_start]**Estado: [COMPLETADO]** [cite: 10]

### [cite_start]2. 🧾 Explora la Carta Digital Interactiva (`PublicMenuViewPage.tsx`) [cite: 10]

- [cite_start]**Acceso Inmediato:** Al acceder a la URL, se carga la carta digital del negocio (`businessSlug`), contextualizada para la mesa (`tableIdentifier`). [cite: 11]
- [cite_start]**Verificación de Pedido Activo (Fundamental):** [cite: 10]
  - [cite_start]Al cargar la página, el sistema revisa `localStorage` buscando una entrada con la clave `activeOrderInfo_BUSINESSSLUG_TABLEIDENTIFIER`. [cite: 10]
  - [cite_start]**Si existe un pedido activo (`activeOrderIdForTable`, `activeOrderNumberForTable`):** [cite: 10]
    - [cite_start]La UI muestra un mensaje destacado: "Tienes el pedido #{{orderNumber}} en curso para esta mesa." [cite: 10]
    - [cite_start]**Opciones Clave:** [cite: 11]
      - [cite_start]"Ver Estado del Pedido": Enlaza directamente a `/order-status/:activeOrderId`. [cite: 11]
      - [cite_start]**"[COMPLETADO Y VALIDADO]" Añadir más Ítems a este Pedido:** La carta se mantiene interactiva, permitiendo al cliente añadir nuevos productos al pedido en curso. [cite: 11]
  - [cite_start]**Si NO existe pedido activo:** La página funciona en modo "crear nuevo pedido", con el carrito vacío. [cite: 11]
- [cite_start]**Navegación y Detalle del Ítem (`MenuItemCard.tsx`):** [cite: 11]
  - [cite_start]Categorías del menú presentadas en componentes tipo acordeón (`CategoryAccordion.tsx`). [cite: 11]
  - [cite_start]Cada ítem se muestra en una tarjeta (`MenuItemCard.tsx`) con su imagen, nombre (i18n), descripción (i18n), precio base, lista de alérgenos y etiquetas. [cite: 11]
- [cite_start]**Estado: [COMPLETADO Y VALIDADO]** [cite: 11]

### [cite_start]3. 🎨 Personaliza tu Plato (`MenuItemCard.tsx`, `ModifierGroupInteractiveRenderer.tsx`) [cite: 11]

- [cite_start]Al seleccionar un ítem, se abre un modal o sección para la configuración de modificadores. [cite: 11]
- [cite_start]**Selección de Modificadores:** [cite: 11]
  - [cite_start]Se presentan los `ModifierGroup`s asociados al ítem. [cite: 11]
  - [cite_start]Cada grupo muestra sus `ModifierOption`s según el `uiType` (RADIO para selección única, CHECKBOX para múltiple). [cite: 11]
  - [cite_start]**Validación en Tiempo Real Frontend:** Se aplican las reglas `minSelections`, `maxSelections`, y `isRequired`. [cite: 11]
  - [cite_start]**Cálculo de Precio Dinámico:** El precio del ítem se actualiza instantáneamente en la UI. [cite: 12]
- [cite_start]**Cantidad y Notas:** El cliente puede ajustar la cantidad del ítem y añadir instrucciones especiales. [cite: 12]
- [cite_start]**Estado: [COMPLETADO Y VALIDADO]** [cite: 12]

### [cite_start]4. 🛒 Tu Carrito de Pedido (`ShoppingCartModal.tsx` en `PublicMenuViewPage.tsx`) [cite: 12]

- [cite_start]**Acumulación de Ítems:** Los ítems configurados se añaden al estado local `currentOrderItems` y se persisten en `localStorage`. [cite: 12]
- [cite_start]**Modal del Carrito:** Permite la revisión detallada del pedido, modificación de cantidades, eliminación de ítems y edición de notas generales (`orderNotes`). [cite: 12]
- **[NUEVO Y VALIDADO] Canje de Recompensas y Descuentos LCo:**
  - Para los clientes que han iniciado sesión en el programa de fidelización (LCo), el modal del carrito ahora muestra una sección de "Mis Recompensas".
  - Desde aquí, el cliente puede ver las recompensas que se puede permitir con sus puntos y aplicarlas directamente:
    - **Canjear Productos Gratis:** Al hacer clic, el producto asociado a la recompensa se añade al carrito con precio 0€ y una insignia distintiva. Su cantidad no puede ser modificada.
    - **Aplicar Descuentos:** Al seleccionar una recompensa de descuento (ej. 10% o 5€ menos), el total del pedido se recalcula instantáneamente para reflejar el beneficio. Solo se puede aplicar un descuento de este tipo por pedido.
- **Estado: [COMPLETADO Y VALIDADO]**

### [cite_start]5. ⭐ Opcional: Identifícate para Beneficios LCo (Integración con LoyalPyME Core) [cite: 12]

- [cite_start]**Contexto:** Si el `Business` tiene el módulo LCo activo. [cite: 12]
- **Flujo:** Si el cliente está logueado en su cuenta de LoyalPyME, su `customerId` se obtiene y se asocia al pedido al enviarlo. [cite_start]Este paso es **crucial** para poder ver y canjear las recompensas en el carrito de compra. [cite: 12]
- [cite_start]**Impacto:** Al pagar el pedido, el backend asociará los puntos de fidelidad a esta cuenta de cliente. [cite: 12]
- [cite_start]**Estado: [COMPLETADO Y VALIDADO]** [cite: 12]

### [cite_start]6. ➡️ Envía tu Pedido o Añade a uno Existente [cite: 12]

- [cite_start]Desde el `ShoppingCartModal`, el cliente pulsa "Enviar Pedido" o "Añadir al Pedido". [cite: 12]
- **Payload:** Se construye un DTO que incluye el array de `items`, `orderNotes?`, `tableIdentifier`, y `customerId?`.
  - **[NUEVO]** El payload ahora puede incluir `redeemedRewardId` en cada ítem (si se canjeó como producto gratis) y/o un `appliedLcoRewardId` global (si se aplicó un descuento al total).
- [cite_start]**Endpoint:** La lógica del frontend (`handleOrderSubmission`) decide si llamar a `POST /public/order/:businessSlug` (para crear) o a `POST /public/order/:orderId/items` (para añadir). [cite: 13]
- [cite_start]**Backend:** Valida exhaustivamente la petición (disponibilidad, reglas de modificadores, **validez de las recompensas**), recalcula precios, **debita los puntos del cliente** y crea/actualiza los registros en la base de datos de forma **transaccional y atómica**. [cite: 13]
- [cite_start]**Frontend Post-Envío:** Muestra notificación de éxito, guarda `activeOrderInfo` en `localStorage` (si es nuevo), limpia el carrito y redirige a `/order-status/:orderId`. [cite: 13]
- [cite_start]**Estado: [COMPLETADO Y VALIDADO]** [cite: 13]

### [cite_start]7. ⏳ Página de Estado del Pedido (`OrderStatusPage.tsx`) [cite: 13]

- [cite_start]**Acceso y Visualización:** Muestra `orderNumber`, `tableIdentifier`, estado general del `Order` y estado individual de cada `OrderItem`. [cite: 13]
- [cite_start]**Polling Automático:** Refresca datos llamando a `GET /public/order/:orderId/status` cada ~10 segundos. [cite: 13]
- [cite_start]**Lógica de Pedido Finalizado:** Si `orderStatus` es `PAID` o `CANCELLED`, detiene el polling, muestra un mensaje final y permite iniciar un nuevo pedido (limpiando `localStorage`). [cite: 13]
- [cite_start]**Botones de Acción:** [cite: 13]
  - [cite_start]"Volver al Menú": Enlaza de vuelta a la carta para poder añadir más ítems al pedido activo. [cite: 13]
  - **"[COMPLETADO Y VALIDADO]" Botón "Pedir la Cuenta":** Se muestra si el pedido está en un estado apropiado. [cite_start]Al pulsarlo, llama a `POST /public/order/:orderId/request-bill`, y la UI refleja "Cuenta solicitada..." al actualizarse el estado a `PENDING_PAYMENT`. [cite: 13]
- [cite_start]**Estado: [COMPLETADO Y VALIDADO]** [cite: 14]

---

## 👨‍🍳 II. [cite_start]Flujo del Personal de Cocina/Barra (KDS - Kitchen Display System) - [COMPLETADO Y VALIDADO] [cite: 14]

[cite_start]El KDS (`KitchenDisplayPage.tsx`) es el panel de control digital para la preparación eficiente y coordinada de los pedidos. [cite: 14]

### [cite_start]1. 🖥️ Acceso y Visualización de Comandas/Ítems [cite: 14]

- [cite_start]El personal se autentica, selecciona su destino KDS ("COCINA", "BARRA") y ve una cola de `OrderItem`s pendientes o en preparación, ordenados cronológicamente. [cite: 14]
- [cite_start]**Estado: [COMPLETADO Y VALIDADO]** [cite: 14]

### [cite_start]2. 🔄 Gestión del Estado de Preparación de Ítems (`PATCH /api/camarero/kds/items/:orderItemId/status`) [cite: 14]

- [cite_start]A través de botones de acción, el personal cambia el estado de los ítems de `PENDING_KDS` -> `PREPARING` -> `READY`, o los cancela. [cite: 14]
- [cite_start]El backend actualiza el estado general del `Order` (`IN_PROGRESS`, `ALL_ITEMS_READY`, etc.) en consecuencia. [cite: 14]
- [cite_start]**Estado: [COMPLETADO Y VALIDADO]** [cite: 14]

---

## 🤵 III. [cite_start]Flujo del Personal de Sala/Camareros (Interfaz de Camarero) [cite: 14]

[cite_start]Esta sección detalla la funcionalidad para el rol `WAITER` a través de las interfaces de servicio. [cite: 14]

### [cite_start]1. 🔑 Acceso y Vista General (Interfaz Camarero) [cite: 14]

- [cite_start]**Autenticación:** Login estándar para `UserRole.WAITER` (email/password). [cite: 14]
- [cite_start]**Panel Principal:** Actualmente compuesto por `WaiterPickupPage.tsx` y `WaiterOrderManagementPage.tsx`. [cite: 14]

### [cite_start]2. 🍽️ Recogida y Entrega de Pedidos (`WaiterPickupPage.tsx`) [cite: 14]

- [cite_start]El camarero ve una lista de `OrderItem`s que están en estado `READY`. [cite: 14]
- Al entregar un ítem, lo marca como "Servido" (`SERVED`). [cite_start]El ítem desaparece de la lista. [cite: 15]
- [cite_start]Cuando todos los ítems de un pedido están servidos, el `Order.status` general cambia a `COMPLETED`. [cite: 15]
- [cite_start]**Estado: [COMPLETADO Y VALIDADO]** [cite: 15]

### [cite_start]3. 💸 Gestión de Cuentas y Pago (`WaiterOrderManagementPage.tsx`) [cite: 15]

- [cite_start]**Visualizar Pedidos para Cobro:** En la lista de pedidos, se destacan aquellos con `Order.status = PENDING_PAYMENT`. [cite: 15]
- [cite_start]**Procesar Pago y Marcar como Pagado:** [cite: 15]
  - [cite_start]El camarero tiene una acción "Marcar Como Pagada" para un pedido `PENDING_PAYMENT`. [cite: 15]
  - [cite_start]Al usarla, se llama a `POST /api/camarero/staff/order/:orderId/mark-as-paid`. [cite: 15]
  - [cite_start]El backend (`OrderService.markOrderAsPaid`) actualiza `Order.status = PAID`, registra `paidAt` y el `paidByUserId`. [cite: 15]
- [cite_start]**Liberar Mesa e Integración LCo:** [cite: 15]
  - **Backend:** Automáticamente, tras marcar como `PAID`, el servicio actualiza el `Table.status` a `AVAILABLE`. [cite_start]Si el pedido tenía un `customerLCoId` y el módulo LCo está activo, se dispara la asignación de puntos. [cite: 15]
  - [cite_start]**Frontend:** La UI del camarero y del cliente reflejan el cambio de estado. [cite: 15]
- [cite_start]**Estado: [COMPLETADO Y VALIDADO]** [cite: 15]

---

## 👑 IV. [cite_start]Flujo del Administrador del Negocio (LC) - Configuración y Supervisión [cite: 15]

### [cite_start]1. ⚙️ Gestión de Carta Digital [cite: 15]

- [cite_start]CRUD completo de `MenuCategory`, `MenuItem`, `ModifierGroup`, `ModifierOption` funcional. [cite: 15]
- [cite_start]**Estado: [COMPLETADO Y VALIDADO]** [cite: 15]

### [cite_start]2. 🪑 Gestión de Mesas y Personal [cite: 16]

- [cite_start]Funcionalidades básicas para la gestión de mesas y personal están implementadas, permitiendo el flujo actual. [cite: 16]
- [cite_start]**Estado: [FUNCIONALIDAD BASE COMPLETADA]** [cite: 16]

---

✨ **Beneficios para el Negocio con LoyalPyME Camarero (Visión Actual):**

- [cite_start]**Eficiencia Operativa:** Reducción de errores en la toma de comandas, comunicación directa y clara con cocina/barra. [cite: 16]
- **Mejora de la Experiencia del Cliente:** Autonomía para pedir, personalizar, seguir el estado del pedido y **canjear sus recompensas al instante**.
- **Aumento del Engagement y la Conversión:** Al mostrar las recompensas directamente en el carrito, se incentiva al cliente a completar el pedido y a utilizar sus puntos, aumentando la satisfacción y la percepción de valor.
- [cite_start]**Optimización de Tiempos:** Agilización del proceso de pedido, preparación, servicio y pago. [cite: 16]
- [cite_start]**Incremento Potencial de Ventas:** Facilidad para añadir ítems a un pedido existente. [cite: 16]
- **Recopilación de Datos:** Información valiosa sobre ítems populares, tiempos de preparación, y ahora también, sobre las **recompensas más canjeadas**.
- [cite_start]**Imagen Moderna y Profesional:** Adopción de tecnología para mejorar el servicio. [cite: 16]
- [cite_start]**Integración con Fidelización (LCo):** Cada pedido pagado se convierte automáticamente en una oportunidad para fidelizar. [cite: 16]
