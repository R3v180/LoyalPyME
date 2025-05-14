# LoyalPyME Camarero: ¡Tu Experiencia Gastronómica, Digitalizada y Eficiente! 🧑‍🍳📱✨

Bienvenido a la experiencia moderna de pedir y disfrutar en tu establecimiento favorito con **LoyalPyME Camarero**. Diseñado para agilizar el servicio, personalizar tu pedido y mejorar la comunicación, todo directamente desde tu móvil o gestionado eficientemente por el personal.

---

## 🚀 **I. El Viaje del Cliente Final: Control y Comodidad en Tu Mano**

Aquí te mostramos el flujo completo, desde tu llegada hasta que disfrutas de tu comida, y cómo puedes interactuar con el servicio.

### 1. 📲 **Llegada y Escaneo Mágico del QR de Mesa**

- **Bienvenida:** Al llegar al establecimiento (restaurante, bar, cafetería), encontrarás un código QR estratégicamente ubicado en tu mesa. Este código es único para tu mesa (o zona específica) y es la puerta de entrada a una experiencia de pedido sin complicaciones.
- **Escaneo Instantáneo:** Abre la aplicación de cámara de tu smartphone (o cualquier lector QR) y enfoca el código QR. No necesitas descargar ninguna aplicación adicional específica de LoyalPyME.

  - El QR contiene una URL segura que te redirigirá automáticamente a la carta digital del negocio, ya contextualizada para tu mesa. El formato de la URL será similar a: `https://[tuDominio.com]/m/[businessSlug]/[tableIdentifier]`.
    - `[businessSlug]`: Identificador único legible del negocio (ej: "cafe-central-madrid").
    - `[tableIdentifier]`: Identificador único de la mesa (ej: "mesa-12" o un UUID).

  ```
  Mesa Designada 🍽️
   ______________________
  |                      |
  |   Código QR Aquí     |
  |   [ □□□ □ □□□ ]    |  <-- (Icono de QR estilizado)
  |   [ □ ■ □ ■ □ ]    |
  |   [ □□□ □ □□□ ]    |
  |______________________|
         🤳 (Móvil del cliente escaneando)
  ```

### 2. 🧾 **Explora la Carta Digital Interactiva y Atractiva**

- **Acceso Inmediato:** Serás dirigido a la página `PublicMenuViewPage.tsx`, que muestra la carta digital completa y actualizada del negocio, específicamente cargada para tu sesión de mesa.
- **Navegación Intuitiva:**
  - Visualiza categorías claramente definidas y ordenadas (ej. Entrantes, Platos Principales, Postres, Bebidas, Menús Especiales), a menudo presentadas en formato de acordeón expandible.
  - Cada categoría puede tener una imagen descriptiva y un breve texto introductorio.
- **Detalle del Ítem Enriquecido (`MenuItemCard.tsx`):**

  - Al seleccionar una categoría, se muestran sus ítems de menú.
  - Cada ítem presenta:
    - **Fotografías de alta calidad** 🍔🍕🥗 para tentar al paladar.
    - **Nombres y descripciones** detalladas, con soporte multi-idioma (ej. Español/Inglés) si el negocio los ha configurado (campos `name_es`, `name_en`, `description_es`, `description_en`).
    - **Precios claros** y transparentes.
    - **Información sobre alérgenos** 🥜🥛🌾 (ej. "GLUTEN", "LACTOSE"), visualmente destacados.
    - **Etiquetas descriptivas** (ej. "Vegano 🌱", "Picante 🔥", "Nuevo ✨", "Popular ⭐", "Especialidad de la Casa 🏆") para ayudar en la elección.
    - **Indicación de Modificadores Disponibles:** Si el plato es personalizable, se indica claramente.
    - **(Futuro)** Tiempo de preparación estimado y calorías.

  ```
  Interfaz de la Carta Pública (Móvil del Cliente):
  +-------------------------------------------------+
  | [Logo/Nombre Restaurante]  Mesa: [MESA-INTERIOR-5] |
  |=================================================|
  | [Banner Promocional / Foto Ambiente del Local]  |
  |-------------------------------------------------|
  | 🔍 [Barra de Búsqueda: "Buscar platos..."]       |
  | // (Filtros opcionales: Alérgenos, Tags)         |
  |-------------------------------------------------|
  | ▼ **ENTRANTES**  (Delicias para comenzar) [📷]   |
  |   -------------------------------------------   |
  |   | [🍔]  **Croquetas Caseras**      €8.50  > |
  |   |    (Nuestras famosas croquetas de jamón)  |
  |   -------------------------------------------   |
  |   | [🥗]  **Ensalada César**         €10.00 > |
  |   -------------------------------------------   |
  | ▼ **PLATOS PRINCIPALES**                        |
  |   ... (más ítems) ...                           |
  |-------------------------------------------------|
  | 🛒 Ver Pedido ({{X}} ítems - €TT.TT) | 👤 Iniciar Sesión |
  +-------------------------------------------------+
  ```

### 3. 🎨 **Personaliza tu Plato a la Perfección (`MenuItemCard.tsx`, `ModifierGroupInteractiveRenderer.tsx`)**

- **Selección del Ítem:** Al tocar un ítem, se expande su detalle o se abre un modal para la personalización.
- **Modificadores Inteligentes:**
  - **Grupos Claros:** Los modificadores se presentan en grupos lógicos (ej. "Punto de la carne", "Elige tu guarnición", "Salsas extra"). Cada grupo tiene un nombre descriptivo.
  - **Tipos de Selección (`ModifierUiType`):**
    - **Opción Única (RADIO):** Para selecciones excluyentes (ej. tamaño: Pequeño/Mediano/Grande).
    - **Múltiples Opciones (CHECKBOX):** Para añadir varios extras (ej. toppings, ingredientes adicionales).
  - **Información de Precios:** Los ajustes de precio de cada `ModifierOption` se muestran claramente (ej. `+€1.50` o `-€0.50` si un modificador reduce el precio base).
  - **Precio Dinámico:** El precio total del ítem que estás configurando se actualiza en tiempo real en la UI a medida que seleccionas/deseleccionas modificadores.
  - **Validación Integrada:** El sistema indica visualmente si un grupo es obligatorio (`isRequired`) y valida en tiempo real (o antes de añadir al carrito) si se cumplen las reglas de `minSelections` y `maxSelections` para cada grupo.
- **Cantidad Deseada:** Un `NumberInput` o botones +/- permiten ajustar fácilmente la cantidad del ítem configurado.
- **Notas Específicas del Ítem:** Un campo de texto para que el cliente añada instrucciones particulares para la cocina sobre ese plato específico (ej. "Sin cilantro, por favor", "Carne muy poco hecha").

### 4. 🛒 **Tu Carrito de Pedido: Revisa, Ajusta y Confirma (`ShoppingCartModal.tsx`)**

- **Acceso Constante:** Un icono de carrito 🛒 o una barra de resumen del pedido (sticky en la parte superior o inferior) permanece visible, mostrando el número de ítems y el total acumulado. Al pulsarlo, se abre el modal/panel del carrito.
- **Vista Detallada del Carrito:**
  - **Listado Completo:** Cada `OrderItemFE` (ítem del carrito del frontend) se muestra con:
    - Nombre del producto (i18n).
    - Cantidad actual.
    - Lista de modificadores seleccionados (con sus nombres i18n y ajustes de precio).
    - Notas específicas del ítem (si se añadieron).
    - Precio unitario (con modificadores) y precio total de la línea (precio unitario \* cantidad).
  - **Modificar Cantidad:** Controles (+/- o `NumberInput`) para cambiar la cantidad de un ítem ya en el carrito. El total de la línea y el total general se recalculan. Si la cantidad se reduce a 0, el ítem se elimina.
  - **Eliminar Ítem:** Botón (ej. icono de papelera 🗑️) para quitar un ítem del carrito.
  - **Vaciar Carrito:** Un botón para eliminar todos los ítems del carrito de una vez.
  - **Notas Generales del Pedido:** Un `Textarea` para añadir instrucciones o comentarios que apliquen a todo el pedido (ej. "Alergia general al marisco en la mesa", "Por favor, traer todo junto").
  - **Resumen Económico Claro:**
    - Subtotal (suma de todos los `totalPriceForItem`).
    - (Futuro) Impuestos aplicables.
    - (Futuro) Cargos por servicio (si aplica).
    - (Futuro) Descuentos aplicados (ej. por promociones o beneficios LCo).
    - **Total Final del Pedido.**
- **Persistencia:** El contenido del carrito (`currentOrderItems` y `orderNotes`) se guarda en `localStorage` del navegador, por lo que si el cliente refresca la página o la cierra y vuelve a abrir (dentro de un tiempo razonable y para el mismo `businessSlug` y `tableIdentifier`), su carrito se mantiene.

### 5. ⭐ **Opcional: Identifícate para Beneficios LoyalPyME Core (LCo)**

- **Punto de Interacción:** En la `PublicMenuViewPage` o dentro del `ShoppingCartModal`, se presentan botones o enlaces claros para "Iniciar Sesión" o "Registrarse" en el programa de fidelización LoyalPyME Core del negocio.
- **Flujo de Identificación:**
  - Al seleccionar una de estas opciones, el cliente es dirigido (posiblemente en un modal o una nueva vista ligera) al flujo de login/registro estándar de LCo.
  - Una vez identificado (login o nuevo registro exitoso), el frontend obtiene el `customerId`.
- **Beneficios de Identificarse ANTES de enviar el pedido LC:**
  - El `customerId` se incluirá en el payload del pedido LC.
  - **Acumulación de Puntos LCo:** Cuando el pedido LC se marque como pagado en el sistema, se generarán automáticamente puntos LCo para este cliente, según la configuración `pointsPerEuro` del negocio y el `totalAmount` del pedido. Se creará un registro en su `ActivityLog` LCo.
  - Su actividad (gasto, visita) contribuirá al cálculo de su nivel en LCo.
  - **(Funcionalidad Avanzada Futura - Tarea #29 del DEVELOPMENT_PLAN):** Posibilidad de aplicar beneficios de LCo (ej. descuentos de nivel, canjear recompensas LCo como "producto gratis") directamente al pedido LC actual.
- **Si no se Identifica:** El pedido se procesa de forma anónima (asociado solo a la mesa). No se acumulan puntos LCo.

### 6. ➡️ **Envía tu Pedido a Cocina/Barra (`handleSubmitOrder` en `PublicMenuViewPage.tsx`)**

- Desde el `ShoppingCartModal`, el cliente pulsa el botón "Enviar Pedido".
- **Construcción del Payload (`CreateOrderPayloadDto`):**
  - El frontend recopila todos los `OrderItemFE` del carrito y los transforma en `CreateOrderItemDto` para el backend (incluyendo `menuItemId`, `quantity`, `notes?`, y `selectedModifierOptions` solo con `modifierOptionId`).
  - Se añaden las `orderNotes` generales.
  - Se incluye el `tableIdentifier` obtenido de la URL inicial del QR.
  - Si el cliente se identificó, se incluye su `customerId`.
- **Llamada API:** Se envía una petición `POST` al endpoint público `/public/order/:businessSlug` del backend.
- **Procesamiento Backend (`order.service.ts`):**
  - Validación exhaustiva del negocio (activo, módulo LC activo).
  - Validación de cada ítem y opción de modificador (existencia, disponibilidad, pertenencia al negocio).
  - Validación de reglas de los grupos de modificadores (`minSelections`, `maxSelections`, `isRequired`).
  - **Recálculo de precios** de cada ítem y del total del pedido basándose en los precios actuales en la BD (para evitar manipulación de precios desde el frontend).
  - Creación transaccional de los registros `Order`, `OrderItem`, y `OrderItemModifierOption` en la base de datos.
  - El `Order` se crea con `status: RECEIVED` y se le asigna un `orderNumber` único para el negocio.
  - Se asocia al `Table` y opcionalmente al `User` (cliente LCo).
- **Respuesta del Backend:**
  - Éxito (201 Created): Devuelve el objeto `Order` recién creado (incluyendo `id` y `orderNumber`).
  - Error (400, 404, 500): Devuelve un mensaje de error descriptivo.

### 7. ⏳ **Confirmación y Seguimiento del Estado de tu Pedido (Post-MVP Pedido)**

- **Notificación Inmediata:** Al recibir una respuesta exitosa del backend, el frontend muestra una notificación (ej. "¡Pedido #P-000123 enviado!").
- **Limpieza del Carrito:** Se vacían `currentOrderItems` y `orderNotes` y se cierra el modal del carrito.
- **(Idealmente) Redirección a Página de Confirmación/Estado:**
  - Se redirige al cliente a una nueva página (ej. `/order-confirmation/:orderId` o `/order-status/:orderNumber`) usando el ID o número de pedido devuelto por el backend.
- **Visualización de Estado en la Página de Confirmación/Estado:**
  - Muestra el `orderNumber` y un mensaje de agradecimiento.
  - Lista los ítems del pedido.
  - Para cada `OrderItem`, muestra su estado actual:
    - `RECIBIDO` (Pedido recién enviado)
    - `EN PREPARACIÓN` (Cocina/barra ha comenzado)
    - `LISTO` (El ítem está listo en cocina/barra para ser recogido por el camarero)
    - `ENTREGADO/SERVIDO` (El camarero lo ha llevado a la mesa)
    - `CANCELADO` (Si el ítem/pedido fue cancelado)
  - La actualización de estos estados puede ser mediante polling al backend (endpoint `GET /public/order/:orderId/status`) o, idealmente, en tiempo real usando Server-Sent Events (SSE) o WebSockets.

### 8. 🙋 **Interactúa con el Servicio Durante tu Estancia (Botones en la Vista de Carta/Pedido)**

- **"Llamar Camarero":**
  - **Cliente:** Un botón en la interfaz permite al cliente solicitar la atención de un camarero.
  - Opcionalmente, puede incluir un campo para un mensaje breve o preseleccionar un motivo (ej. "Consulta", "Pedir algo más", "Problema").
  - **Backend:** Un endpoint (`POST /api/camarero/table/:tableIdentifier/call-waiter`) registra la solicitud.
  - **Interfaz Camarero:** Recibe una notificación (visual/sonora) indicando la mesa y el motivo.
- **"Pedir la Cuenta":**
  - **Cliente:** Un botón permite solicitar la cuenta.
  - Aparece un modal/sección para que el cliente indique:
    - **Método de pago preferido:** "Efectivo" o "Tarjeta". (Futuro: "Pagar desde la App").
    - Si es "Efectivo", un campo opcional: **"Pagaré con (ej. €):"** para que el camarero traiga el cambio exacto.
  - **Backend:** Un endpoint (`POST /api/camarero/table/:tableIdentifier/request-bill`) registra la solicitud con las preferencias de pago.
  - **Interfaz Camarero:** Recibe una notificación con la mesa y los detalles de pago indicados por el cliente.

### 9. 💸 **Proceso de Pago y Despedida**

- **Camarero Preparado:** El camarero se acerca a la mesa con la cuenta y el datáfono o el cambio necesario, según la información proporcionada por el cliente.
- **Pago en Local:** Se realiza el pago.
- El camarero marca el pedido como `PAID` en su interfaz (o el sistema lo hace si hay integración con TPV).
- Si el cliente se identificó con LCo, este es el trigger para la asignación de puntos.
- ¡Gracias por tu visita!

---

## 👨‍🍳 **II. Flujo del Personal de Cocina/Barra (KDS - Kitchen/Bar Display System)**

El KDS es el panel de control digital para la preparación eficiente de los pedidos.

### 1. 🖥️ **Acceso y Visualización de Comandas/Ítems Pendientes**

- **Autenticación:** El personal accede al KDS (que puede ser una URL específica en una tablet) mediante un login (rol `KITCHEN_STAFF`, `BAR_STAFF`) o un PIN de staff.
- **Filtrado por Destino:** El KDS se configura o filtra para mostrar solo los `OrderItem`s correspondientes a su `kdsDestination` (ej. "COCINA_PRINCIPAL", "BARRA_BEBIDAS", "POSTRES").
- **Cola de Ítems:** Los `OrderItem`s con estado `PENDING_KDS` (y luego `PREPARING`) aparecen en una o varias columnas, generalmente ordenados por la hora de creación del pedido (`Order.createdAt`).
- **Tarjeta de Ítem Detallada:** Cada `OrderItem` se muestra como una "tarjeta" o "ticket" digital con información crucial:
  - **Número de Pedido** (`Order.orderNumber`) y **Mesa** (`Order.table.identifier`).
  - **Nombre del `MenuItem`** (grande y claro, i18n).
  - **Cantidad** solicitada.
  - Lista clara de **Modificadores Seleccionados** (nombres i18n).
  - **Notas del Ítem** (si el cliente las añadió).
  - **Hora de Entrada** del pedido.
  - **(KDS Avanzado - Tiempos)**:
    - Tiempo de preparación estimado (`MenuItem.preparationTime`).
    - Temporizador que se inicia cuando el ítem pasa a `PREPARING`.
    - Indicador visual de urgencia o retraso.

### 2. 🔄 **Gestión del Estado de Preparación de Ítems**

- **Iniciar Preparación:**
  - El personal de cocina/barra selecciona un `OrderItem` (o varios del mismo pedido) y pulsa un botón como "Empezar Preparación" o "Cocinando".
  - **Acción:** Se llama al endpoint `PATCH /api/camarero/kds/items/:orderItemId/status` con `newStatus: PREPARING`.
  - **Resultado:** El `OrderItem.status` se actualiza en la BD. El ítem en el KDS puede moverse a una columna "En Preparación" o cambiar su estilo visual. El temporizador de preparación comienza.
- **Marcar como Listo:**
  - Una vez que un ítem está completamente preparado, el personal pulsa "Listo" o "Preparado".
  - **Acción:** Se llama al endpoint `PATCH /api/camarero/kds/items/:orderItemId/status` con `newStatus: READY`.
  - **Resultado:** El `OrderItem.status` se actualiza. El ítem en el KDS puede moverse a una columna "Listos para Servir/Recoger" o cambiar de color.
  - Esta acción **debe generar una notificación** para la Interfaz del Camarero indicando que un ítem de una mesa específica está listo.

### 3. ⏱️ **Gestión de Tiempos y Alertas (KDS Avanzado)**

- **Visualización:** El KDS muestra claramente el tiempo de preparación estimado junto a cada ítem.
- **Temporizador Activo:** Para ítems en estado `PREPARING`, un temporizador visible cuenta el tiempo transcurrido.
- **Alertas de Retraso:**
  - **Preventivas:** Si un ítem `PENDING_KDS` lleva mucho tiempo sin ser atendido (supera un umbral configurable), podría destacarse sutilmente.
  - **Críticas:** Si un ítem en `PREPARING` excede su `preparationTime` (o `preparationTime` + un % de margen), la tarjeta del ítem se resalta de forma prominente (ej. borde rojo, parpadeo, alerta sonora opcional) para indicar un retraso.
- **Priorización Visual/Manual:**
  - El KDS podría ordenar automáticamente los ítems más antiguos primero.
  - (Futuro) Opción para que el jefe de cocina marque manualmente un ítem como "URGENTE".

### 4. 📦 **Agrupación de Pedidos y "Pases" (KDS Avanzado)**

- **Agrupación por Pedido/Mesa:** El KDS debe facilitar la visualización de todos los `OrderItem`s que pertenecen al mismo `Order` (misma mesa), incluso si algunos están en `PENDING_KDS` y otros en `PREPARING`.
- **Identificación de "Tiempos" o Cursos:**
  - Utilizando `tags` del `MenuItem` (ej. "ENTRANTE", "PRINCIPAL") o la `MenuCategory`, el KDS podría agrupar visualmente los ítems de un mismo pedido por estos cursos.
- **Coordinación para el "Pase":**
  - Cuando todos los ítems de un mismo curso para una mesa (o todo el pedido, si es pequeño) están marcados como `READY`, el KDS podría generar una alerta de "Pase Completo para Mesa X" para el personal de expedición o camareros.

### 5. 🚫 **Gestión de Incidencias (KDS Avanzado)**

- **Rechazar Ítem:**
  - Si un ítem no se puede preparar (ej. se acabó un ingrediente clave), el personal de KDS debe poder marcar ese `OrderItem` como `REJECTED` (nuevo estado en `OrderItemStatus`).
  - Idealmente, se podría añadir un motivo breve.
  - Esta acción debe generar una notificación inmediata a la Interfaz del Camarero para que pueda informar al cliente y ofrecer alternativas.
- **Gestión de Solicitudes de Cancelación:**
  - Si un `OrderItem` tiene el estado `CANCELLATION_REQUESTED` (solicitado por el cliente), la tarjeta del ítem en el KDS debe mostrar esta solicitud de forma clara.
  - El personal de KDS tendrá botones para:
    - **"Aceptar Cancelación":** Llama a un endpoint que cambia `OrderItem.status` a `CANCELLED`. Solo posible si el ítem no está muy avanzado en preparación.
    - **"Rechazar Cancelación":** Llama a un endpoint que revierte el estado (ej. a `PREPARING` si ya se había empezado) y notifica al camarero/cliente que no se puede cancelar.

---

## 🤵 **III. Flujo del Personal de Sala/Camareros (Interfaz de Camarero - MVP y Futuro)**

La interfaz del camarero es el nexo entre el cliente, la cocina/barra y la gestión del servicio.

### 1. 🔑 **Acceso y Vista General (MVP)**

- **Autenticación:** Login con credenciales de `Staff` (rol `WAITER`) o mediante un `StaffPin` asignado por el `BUSINESS_ADMIN`.
- **Panel Principal (Simplificado para MVP):**
  - Lista de **Notificaciones/Alertas Activas:**
    - Mesas que llaman (`NECESITA_ATENCION`).
    - Mesas que solicitan la cuenta (`CUENTA_SOLICITADA` con detalles de pago).
    - Pedidos/Ítems listos en cocina/barra (`ITEMS_LISTOS`).
  - **(Post-MVP Básico) Vista de Mesas:** Una lista o cuadrícula simple de las mesas gestionadas por el negocio, mostrando su `tableIdentifier` y su estado actual (`Order.status` o un estado de mesa general si se implementa `Table.status`).

### 2. 🛎️ **Recepción y Gestión de Notificaciones (MVP)**

- **Actualización en Tiempo Real (Ideal con WebSockets/SSE):** Las notificaciones aparecen dinámicamente.
- **Detalle de Notificación:** Al pulsar una notificación, se muestra información relevante (ej. "Mesa 5 solicita ayuda: 'Necesito más servilletas'", "Mesa 12 pide la cuenta: Efectivo, paga con 50€", "Hamburguesa para Mesa 3 lista en Cocina").
- **Acciones sobre Notificaciones:**
  - "Marcar como Atendido/Visto" para quitar la alerta de llamada de cliente.
  - "Ir a Mesa" para ver detalles del pedido/mesa.

### 3. 🍽️ **Recogida y Entrega de Pedidos (MVP)**

- Cuando el KDS marca un `OrderItem` como `READY`, la interfaz del camarero recibe una notificación.
- El camarero recoge el/los ítem(s) del pase de cocina/barra.
- **Marcar como Servido:**
  - El camarero, desde su interfaz (al ver la notificación o la lista de ítems listos), pulsa "Marcar como Servido" para el `OrderItem` correspondiente.
  - **Acción:** Se llama al endpoint `PATCH /api/camarero/staff/order-items/:orderItemId/status` con `newStatus: SERVED`.
  - **Resultado:** El `OrderItem.status` se actualiza. Esto podría actualizar la vista de estado del cliente.

### 4. ✍️ **Toma de Pedidos Manual por el Camarero (Post-MVP Básico, pero Importante)**

- **Acceso:** Desde la vista de una mesa o una opción "Nuevo Pedido".
- **Selección de Mesa:** El camarero debe poder indicar para qué mesa es el pedido.
- **Interfaz de Pedido:**
  - Acceso rápido a la carta digital completa del negocio.
  - Funcionalidad para buscar ítems.
  - Selección de ítems, cantidades y modificadores (similar a la UI del cliente).
  - **Añadir Ítems "Fuera de Carta":**
    - Un botón "Añadir Ítem Manual" o "Varios".
    - Campos para introducir: Nombre del Ítem, Precio, Cantidad, Notas, Destino KDS (opcional).
    - Estos ítems se añaden al `Order` con `itemNameSnapshot` y `itemPriceSnapshot` definidos manualmente, sin un `menuItemId` real o usando uno genérico.
- **Envío al KDS:** El pedido completo se envía a los KDS correspondientes, igual que un pedido hecho por el cliente.

### 5. 💰 **Gestión de Cuentas y Cierre de Mesa (Flujo más completo Post-MVP)**

- **Visualizar Cuenta de Mesa:** Ver todos los ítems consumidos y el total.
- **Procesar Pago:**
  - Si el cliente indicó método de pago:
    - Tarjeta: Usa el datáfono del local.
    - Efectivo: Maneja el efectivo y el cambio (la información de "paga con" ayuda aquí).
  - Si no indicó: Pregunta al cliente.
- **Marcar Pedido como Pagado:**
  - En su interfaz, el camarero marca el `Order` como `PAID` (o un estado similar).
  - **Trigger para LCo:** Este cambio de estado es el que podría activar la lógica de asignación de puntos para el cliente LCo si estaba identificado en el pedido.
- **Cerrar Mesa:** Marcar la mesa como `LIBRE` o `NECESITA_LIMPIEZA`.

### 6. 🤝 **Atender Solicitudes del Cliente**

- **Llamadas de Mesa:** Al recibir la notificación, el camarero se dirige a la mesa. Después de resolver la necesidad del cliente, marca la notificación como "resuelta" en su interfaz.
- **Solicitudes de Cancelación (si se implementa la comunicación desde KDS):** Si KDS rechaza una cancelación porque ya se empezó a preparar, el camarero es notificado para informar al cliente.

---

## 👑 **IV. Flujo del Administrador del Negocio (LC) - Configuración y Supervisión**

El `BUSINESS_ADMIN` es responsable de configurar y mantener el módulo Camarero.

### 1. 🛠️ **Gestión Completa de la Carta Digital (Ya Implementado)**

    *   Uso de la interfaz en `/admin/dashboard/camarero/menu-editor` para:
        *   CRUD de `MenuCategory` (nombres ES/EN, descripciones ES/EN, imagen, posición, estado activo/inactivo).
        *   CRUD de `MenuItem` dentro de categorías (nombres ES/EN, descripciones ES/EN, precio, imagen, alérgenos, tags, disponibilidad, posición, tiempo de preparación, calorías, SKU, destino KDS).
        *   CRUD de `ModifierGroup` asociados a ítems (nombre ES/EN, tipo de UI, min/max selecciones, posición, requerido).
        *   CRUD de `ModifierOption` dentro de grupos (nombre ES/EN, ajuste de precio, posición, por defecto, disponible).

### 2. 🗺️ **Gestión de Mesas (Tareas #12 y #13 del DEVELOPMENT_PLAN)**

    *   **Panel de Gestión de Mesas:** Nueva sección en el dashboard de admin.
    *   **Zonas del Local (Opcional):** Posibilidad de definir zonas (ej. "Terraza", "Salón Interior", "Barra") para organizar las mesas.
    *   **CRUD de Mesas:**
        *   Crear nuevas mesas.
        *   Asignar un **identificador único y legible** a cada mesa (`tableIdentifier`, ej. "M05", "Terraza-T2", "Barra-P1"). Este identificador será parte de la URL del QR.
        *   Especificar la capacidad de la mesa (nº de asientos).
        *   Asignar a una zona (si se implementan zonas).
        *   Editar y eliminar mesas.
    *   **Generación de QRs de Mesa:**
        *   Para cada mesa, el sistema debe permitir generar un código QR.
        *   Este QR codificará la URL pública: `https://[tuDominio.com]/m/[businessSlug]/[tableIdentifierDeLaMesa]`.
        *   Opción para descargar los QRs (individualmente o en lote) para su impresión y colocación en las mesas físicas.
    *   **Visualización del Estado de Mesas (Opcional en Admin):** El admin podría tener una vista simplificada del estado de las mesas, similar a la del camarero, para supervisión.

### 3. 👥 **Gestión de Personal (Tareas #12 y #13 del DEVELOPMENT_PLAN)**

    *   **Panel de Gestión de Personal LC:** Nueva sección en el dashboard de admin.
    *   **CRUD de Usuarios de Staff:**
        *   Crear cuentas para camareros, personal de cocina, personal de barra.
        *   Asignarles un nombre, un email (opcional para login, si se usa PIN), y un rol (`WAITER`, `KITCHEN_STAFF`, `BAR_STAFF` - estos roles deben estar en el enum `UserRole` de Prisma).
        *   Estos usuarios estarán asociados al `businessId` del admin.
    *   **Gestión de PINs de Staff (`StaffPin`):**
        *   Posibilidad de asignar un PIN numérico corto y único (dentro del negocio) a cada miembro del staff para un login rápido en dispositivos compartidos como KDS o terminales de camarero.
    *   **Asignación a Destinos KDS (Opcional):** Si un negocio tiene múltiples KDS (ej. cocina principal, pastelería), el admin podría asignar a qué KDS tiene acceso cada usuario de `KITCHEN_STAFF`.

### 4. ⚙️ **Configuración Específica del Módulo Camarero (Panel Admin)**

    *   **Definición de Destinos KDS (`kdsDestination`):**
        *   Una sección donde el admin pueda definir los nombres de los diferentes puestos de preparación que usarán KDS (ej. "Cocina", "Barra", "Postres", "Sushi Bar").
        *   Estos nombres se usarán al crear/editar `MenuItem`s para asignarles su destino.
    *   **(Futuro)** Configuración de umbrales de tiempo para las alertas de retraso en KDS.
    *   **(Futuro)** Habilitar/deshabilitar y configurar opciones de pago en la app del cliente.
    *   **(Futuro)** Configurar flujos de "pase" o coordinación entre KDS.

### 5. 📊 **Monitorización y Reportes de LC (Funcionalidad Avanzada Post-MVP)**

    *   Visualización de pedidos en tiempo real (más enfocado a gestión que a operación KDS).
    *   Informes de ventas por ítem, categoría, modificador.
    *   Análisis de tiempos de preparación por ítem/categoría.
    *   Ventas por mesa, por periodo, (si se asignan camareros a mesas) por camarero.
    *   Informe de cancelaciones, ítems rechazados.
    *   (Si se implementa feedback) Resumen de valoraciones de clientes.

---

✨ **Beneficios para el Negocio con LoyalPyME Camarero:**

- **Mayor Eficiencia Operativa:** Reducción de tiempos de espera, menos errores en la toma de comandas, mejor flujo de trabajo entre sala y cocina/barra.
- **Mejora de la Experiencia del Cliente:** Autonomía para pedir, personalización, servicio más ágil y moderno.
- **Aumento Potencial del Ticket Medio:** Facilidad para explorar la carta y modificadores puede incentivar más consumo.
- **Optimización de Personal:** Los camareros pueden enfocarse más en la atención cualitativa y menos en la toma de pedidos básica.
- **Datos Valiosos:** Información sobre qué se pide más, tiempos, etc., para tomar decisiones informadas.
- **Integración con Fidelización (LCo):** Capacidad de convertir cada interacción de servicio en una oportunidad para fidelizar.

---
