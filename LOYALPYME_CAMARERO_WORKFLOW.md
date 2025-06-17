# LoyalPyME Camarero: ¡Tu Experiencia Gastronómica, Digitalizada y Eficiente! 🧑‍🍳📱✨

**Última Actualización:** 17 de Junio de 2025 (Refleja el ciclo de vida completo del pedido, incluyendo creación, adición de ítems, KDS, servicio, solicitud de cuenta y pago final como funcionalidades completadas y validadas.)

Bienvenido a la experiencia moderna de pedir y disfrutar en tu establecimiento favorito con **LoyalPyME Camarero**. Diseñado para agilizar el servicio, personalizar tu pedido y mejorar la comunicación, todo directamente desde tu móvil o gestionado eficientemente por el personal del restaurante.

---

## 🚀 **I. El Viaje del Cliente Final: Control y Comodidad en Tu Mano**

Este flujo describe la experiencia del cliente desde su llegada hasta la finalización y pago de su pedido, incluyendo las interacciones con el personal de cocina/barra (KDS) y de sala (Camarero).

### 1. 📲 **Llegada y Escaneo Mágico del QR de Mesa**

- **Bienvenida:** Al llegar, el cliente encuentra un código QR único en su mesa, provisto por el establecimiento. Este QR contiene el `tableIdentifier` único de esa mesa.
- **Escaneo Instantáneo:** Usando la cámara de su smartphone (o una app de lectura de QR), el cliente escanea el código. El QR lo redirige a una URL del tipo `https://[tuDominio.com]/m/[businessSlug]/[tableIdentifier]`.
- **Estado: [COMPLETADO]**

### 2. 🧾 **Explora la Carta Digital Interactiva (`PublicMenuViewPage.tsx`)**

- **Acceso Inmediato:** Al acceder a la URL, se carga la carta digital del negocio (`businessSlug`), contextualizada para la mesa (`tableIdentifier`).
- **Verificación de Pedido Activo (Fundamental):**
  - Al cargar la página, el sistema revisa `localStorage` buscando una entrada con la clave `activeOrderInfo_BUSINESSSLUG_TABLEIDENTIFIER`.
  - **Si existe un pedido activo (`activeOrderIdForTable`, `activeOrderNumberForTable`):**
    - La UI muestra un mensaje destacado: "Tienes el pedido #{{orderNumber}} en curso para esta mesa."
    - **Opciones Clave:**
      - "Ver Estado del Pedido": Enlaza directamente a `/order-status/:activeOrderId`.
      - **"[COMPLETADO Y VALIDADO]" Añadir más Ítems a este Pedido:** La carta se mantiene interactiva, permitiendo al cliente añadir nuevos productos al pedido en curso. El carrito y el botón de envío se adaptan para esta funcionalidad.
  - **Si NO existe pedido activo:** La página funciona en modo "crear nuevo pedido", con el carrito vacío.
- **Navegación y Detalle del Ítem (`MenuItemCard.tsx`):**
  - Categorías del menú presentadas en componentes tipo acordeón (`CategoryAccordion.tsx`).
  - Cada ítem se muestra en una tarjeta (`MenuItemCard.tsx`) con su imagen, nombre (i18n), descripción (i18n), precio base, lista de alérgenos y etiquetas.
- **Estado: [COMPLETADO Y VALIDADO]**

### 3. 🎨 **Personaliza tu Plato (`MenuItemCard.tsx`, `ModifierGroupInteractiveRenderer.tsx`)**

- Al seleccionar un ítem, se abre un modal o sección para la configuración de modificadores.
- **Selección de Modificadores:**
  - Se presentan los `ModifierGroup`s asociados al ítem.
  - Cada grupo muestra sus `ModifierOption`s según el `uiType` (RADIO para selección única, CHECKBOX para múltiple).
  - **Validación en Tiempo Real Frontend:** Se aplican las reglas `minSelections`, `maxSelections`, y `isRequired`.
  - **Cálculo de Precio Dinámico:** El precio del ítem se actualiza instantáneamente en la UI.
- **Cantidad y Notas:** El cliente puede ajustar la cantidad del ítem y añadir instrucciones especiales.
- **Estado: [COMPLETADO Y VALIDADO]**

### 4. 🛒 **Tu Carrito de Pedido (`ShoppingCartModal.tsx` en `PublicMenuViewPage.tsx`)**

- **Acumulación de Ítems:** Los ítems configurados se añaden al estado local `currentOrderItems` y se persisten en `localStorage`.
- **Modal del Carrito:** Permite la revisión detallada del pedido, modificación de cantidades, eliminación de ítems y edición de notas generales (`orderNotes`).
- **Estado: [COMPLETADO Y VALIDADO]**

### 5. ⭐ **Opcional: Identifícate para Beneficios LCo (Integración con LoyalPyME Core)**

- **Contexto:** Si el `Business` tiene el módulo LCo activo.
- **Flujo:** Si el cliente está logueado, su `customerId` se obtiene del `localStorage` o de un contexto de autenticación y se asocia al pedido al enviarlo.
- **Impacto:** Al pagar el pedido, el backend asociará los puntos de fidelidad a esta cuenta de cliente.
- **Estado: [COMPLETADO Y VALIDADO]**

### 6. ➡️ **Envía tu Pedido o Añade a uno Existente**

- Desde el `ShoppingCartModal`, el cliente pulsa "Enviar Pedido" o "Añadir al Pedido".
- **Payload:** Se construye un DTO que incluye el array de `items`, `orderNotes?`, `tableIdentifier`, y `customerId?`.
- **Endpoint:** La lógica del frontend (`handleOrderSubmission`) decide si llamar a `POST /public/order/:businessSlug` (para crear) o a `POST /public/order/:orderId/items` (para añadir).
- **Backend:** Valida exhaustivamente la petición (disponibilidad, reglas de modificadores), recalcula precios y crea o actualiza los registros en la base de datos de forma transaccional.
- **Frontend Post-Envío:** Muestra notificación de éxito, guarda `activeOrderInfo` en `localStorage` (si es nuevo), limpia el carrito y redirige a `/order-status/:orderId`.
- **Estado: [COMPLETADO Y VALIDADO]**

### 7. ⏳ **Página de Estado del Pedido (`OrderStatusPage.tsx`)**

- **Acceso y Visualización:** Muestra `orderNumber`, `tableIdentifier`, estado general del `Order` y estado individual de cada `OrderItem`.
- **Polling Automático:** Refresca datos llamando a `GET /public/order/:orderId/status` cada ~10 segundos.
- **Lógica de Pedido Finalizado:** Si `orderStatus` es `PAID` o `CANCELLED`, detiene el polling, muestra un mensaje final y permite iniciar un nuevo pedido (limpiando `localStorage`).
- **Botones de Acción:**
  - "Volver al Menú": Enlaza de vuelta a la carta para poder añadir más ítems al pedido activo.
  - **"[COMPLETADO Y VALIDADO]" Botón "Pedir la Cuenta":** Se muestra si el pedido está en un estado apropiado. Al pulsarlo, llama a `POST /public/order/:orderId/request-bill`, y la UI refleja "Cuenta solicitada..." al actualizarse el estado a `PENDING_PAYMENT`.
- **Estado: [COMPLETADO Y VALIDADO]**

---

## 👨‍🍳 **II. Flujo del Personal de Cocina/Barra (KDS - Kitchen Display System) - [COMPLETADO Y VALIDADO]**

El KDS (`KitchenDisplayPage.tsx`) es el panel de control digital para la preparación eficiente y coordinada de los pedidos.

### 1. 🖥️ **Acceso y Visualización de Comandas/Ítems**

- El personal se autentica, selecciona su destino KDS ("COCINA", "BARRA") y ve una cola de `OrderItem`s pendientes o en preparación, ordenados cronológicamente.
- **Estado: [COMPLETADO Y VALIDADO]**

### 2. 🔄 **Gestión del Estado de Preparación de Ítems (`PATCH /api/camarero/kds/items/:orderItemId/status`)**

- A través de botones de acción, el personal cambia el estado de los ítems de `PENDING_KDS` -> `PREPARING` -> `READY`, o los cancela.
- El backend actualiza el estado general del `Order` (`IN_PROGRESS`, `ALL_ITEMS_READY`, etc.) en consecuencia.
- **Estado: [COMPLETADO Y VALIDADO]**

---

## 🤵 **III. Flujo del Personal de Sala/Camareros (Interfaz de Camarero)**

Esta sección detalla la funcionalidad para el rol `WAITER` a través de las interfaces de servicio.

### 1. 🔑 **Acceso y Vista General (Interfaz Camarero)**

- **Autenticación:** Login estándar para `UserRole.WAITER` (email/password).
- **Panel Principal:** Actualmente compuesto por `WaiterPickupPage.tsx` y `WaiterOrderManagementPage.tsx`.

### 2. 🍽️ **Recogida y Entrega de Pedidos (`WaiterPickupPage.tsx`)**

- El camarero ve una lista de `OrderItem`s que están en estado `READY`.
- Al entregar un ítem, lo marca como "Servido" (`SERVED`). El ítem desaparece de la lista.
- Cuando todos los ítems de un pedido están servidos, el `Order.status` general cambia a `COMPLETED`.
- **Estado: [COMPLETADO Y VALIDADO]**

### 3. 💸 **Gestión de Cuentas y Pago (`WaiterOrderManagementPage.tsx`)**

- **Visualizar Pedidos para Cobro:** En la lista de pedidos, se destacan aquellos con `Order.status = PENDING_PAYMENT`.
- **Procesar Pago y Marcar como Pagado:**
  - El camarero tiene una acción "Marcar Como Pagada" para un pedido `PENDING_PAYMENT`.
  - Al usarla, se llama a `POST /api/camarero/staff/order/:orderId/mark-as-paid`.
  - El backend (`OrderService.markOrderAsPaid`) actualiza `Order.status = PAID`, registra `paidAt` y el `paidByUserId`.
- **Liberar Mesa e Integración LCo:**
  - **Backend:** Automáticamente, tras marcar como `PAID`, el servicio actualiza el `Table.status` a `AVAILABLE`. Si el pedido tenía un `customerLCoId` y el módulo LCo está activo, se dispara la asignación de puntos.
  - **Frontend:** La UI del camarero y del cliente reflejan el cambio de estado.
- **Estado: [COMPLETADO Y VALIDADO]**

---

## 👑 **IV. Flujo del Administrador del Negocio (LC) - Configuración y Supervisión**

### 1. ⚙️ **Gestión de Carta Digital**

- CRUD completo de `MenuCategory`, `MenuItem`, `ModifierGroup`, `ModifierOption` funcional.
- **Estado: [COMPLETADO Y VALIDADO]**

### 2. 🪑 **Gestión de Mesas y Personal**

- Funcionalidades básicas para la gestión de mesas y personal están implementadas, permitiendo el flujo actual.
- **Estado: [FUNCIONALIDAD BASE COMPLETADA]**

---

✨ **Beneficios para el Negocio con LoyalPyME Camarero (Visión Actual):**

- **Eficiencia Operativa:** Reducción de errores en la toma de comandas, comunicación directa y clara con cocina/barra.
- **Mejora de la Experiencia del Cliente:** Autonomía para pedir, personalizar, y seguir el estado del pedido.
- **Optimización de Tiempos:** Agilización del proceso de pedido, preparación, servicio y pago.
- **Incremento Potencial de Ventas:** Facilidad para añadir ítems a un pedido existente.
- **Recopilación de Datos:** Información valiosa sobre ítems populares, tiempos de preparación, flujo de pedidos.
- **Imagen Moderna y Profesional:** Adopción de tecnología para mejorar el servicio.
- **Integración con Fidelización (LCo):** Cada pedido pagado se convierte automáticamente en una oportunidad para fidelizar.
