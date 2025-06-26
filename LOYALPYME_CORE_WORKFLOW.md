# LoyalPyME: Fidelización y Servicio, ¡Una Alianza Estratégica para tu Negocio! 🤝🌟🍽️

**Última Actualización:** 26 de Junio de 2025 (Refleja el canje integrado de recompensas en el carrito de LC como una funcionalidad completada y validada).

Cuando un negocio decide activar tanto el módulo de fidelización **LoyalPyME Core (LCo)** para la gestión de la lealtad de sus clientes, como el módulo de operativa de servicio **LoyalPyME Camarero (LC)** para digitalizar la experiencia en el local, se desbloquea un potencial extraordinario. La integración fluida y pensada entre ambos módulos crea una experiencia de cliente superior, cohesiva y gratificante, al mismo tiempo que proporciona al negocio herramientas más potentes para la gestión, el análisis y el crecimiento.

Este documento detalla los puntos de contacto, las sinergias y los flujos de trabajo específicos que surgen cuando LCo y LC operan conjuntamente.

---

## ✨ I. La Experiencia del Cliente Potenciada: Pedidos que Suman, Beneficios que Impactan

Para un cliente que interactúa con un establecimiento que ha activado y sincronizado LoyalPyME Core y LoyalPyME Camarero, el recorrido se enriquece, ofreciendo conveniencia operativa y recompensas por su lealtad de manera integrada.

### 1. 📲 Acceso a la Carta LC con Identidad LCo (Opcional pero Clave)

- **Punto de Entrada Principal (LC):** El cliente escanea el QR de mesa (`/m/:businessSlug/:tableIdentifier`), explora la carta, personaliza ítems y prepara su pedido. Este flujo es gestionado por `PublicMenuViewPage.tsx`.
- **Integración Visible de LCo:** En la interfaz de la carta LC, se presentan opciones para "Iniciar Sesión" (si ya tiene cuenta LCo) o "Registrarse" (para crear una).
- **Objetivo:** Asociar un `customerId` de LCo al `Order` que se cree en LC para habilitar el canje de recompensas y la acumulación de puntos.

### 2. 💳 Proceso de Identificación LCo Durante el Flujo de Pedido LC

- **Flujo de Login/Registro:** Al seleccionar "Iniciar Sesión" o "Registrarse" desde LC, se usan modales para los formularios de LCo, manteniendo al cliente en el contexto del pedido.
- **Sincronización de Sesión:** Tras una autenticación/registro exitoso, el frontend almacena el `customerId` y token JWT de LCo.

### 3. 🛍️ Envío de Pedido LC (Nuevo o Adición) y Asociación al Cliente LCo

- El cliente configura su pedido en la interfaz LC y procede al envío.
- **Payload del Pedido LC:** Si el cliente se identificó con LCo, el `customerId` se incluye en el `CreateOrderPayloadDto`. **Adicionalmente, el payload ahora incluye `redeemedRewardId` en los ítems canjeados y/o un `appliedLcoRewardId` global para descuentos sobre el total.**
- **Procesamiento Backend (LC):** El servicio `order-creation.service.ts` asocia el `customerId` al campo `Order.customerLCoId` y procesa las recompensas aplicadas.

### 4. 💯 [COMPLETADO Y VALIDADO] Acumulación Automática de Puntos LCo por Consumo en LC (Post-Pago)

- **Evento Disparador Clave:** La acumulación de puntos LCo se produce cuando un `Order` del Módulo Camarero, que tiene un `customerLCoId` asociado, cambia su `OrderStatus` a **`PAID`**.
- **¿Quién marca el pedido como `PAID`?** El **Camarero**, desde su interfaz de gestión de pedidos (`WaiterOrderManagementPage`), después de que el cliente haya pagado físicamente.
- **Lógica de Backend para la Integración LCo-LC:**
  1.  **Detección del Evento:** El `order-payment.service.ts` detecta el cambio de estado a `PAID`.
  2.  **Verificación:** Comprueba que `Order.customerLCoId` no es nulo.
  3.  **Cálculo de Puntos:** Obtiene `Order.finalAmount` y `Business.pointsPerEuro`, y aplica posibles multiplicadores de puntos del `Tier` del cliente.
  4.  **Actualización de Datos en LCo:** De forma robusta, crea un registro en `ActivityLog` (LCo) de tipo `POINTS_EARNED_ORDER_LC`, actualiza los puntos (`User.points`), el gasto total y las visitas del cliente, y dispara la reevaluación de su nivel de fidelización.
  - **Notificación al Cliente (Futuro):** Se planea enviar un email o notificación push informando los puntos ganados.

### 5. 🌟 [COMPLETADO Y VALIDADO] Canje de Recompensas LCo en el Carrito de Pedido LC

- Esta es una funcionalidad clave ya implementada que se construye sobre la identificación del cliente.
- **Visualización y Canje en Carrito (`ShoppingCartModal.tsx`):**
  - Si el cliente está identificado con LCo, el modal del carrito muestra una sección **"Mis Recompensas"** con las ofertas que puede permitirse con sus puntos.
  - **Recompensas de Producto Gratis:** El cliente puede seleccionar una recompensa de tipo "Producto Gratis" (ej. "Café Gratis"). Al hacerlo, ese `MenuItem` se añade al carrito con precio 0 y una marca distintiva de "recompensa".
  - **Recompensas de Descuento:** El cliente puede aplicar una recompensa de tipo "Descuento" (ej. "5€ de descuento"). Al hacerlo, el total del pedido se recalcula instantáneamente para reflejar el descuento. Solo un descuento de este tipo puede estar activo a la vez.
- **Sincronización Transaccional en Backend:**
  - **Payload Enriquecido:** El pedido enviado desde el frontend incluye los `redeemedRewardId` de los ítems gratis y/o el `appliedLcoRewardId` del descuento global.
  - **Validación Atómica:** El backend (`order-creation.service.ts`) recibe el pedido y, dentro de una única transacción, realiza todas las validaciones:
    1.  Verifica que el cliente tiene suficientes puntos.
    2.  Verifica que la recompensa es válida y aplicable.
    3.  Debita los puntos correspondientes de la cuenta del cliente (`User.points`).
    4.  Crea el `Order` y sus `OrderItem`s, aplicando los descuentos y precios correctos.
    5.  Genera un registro en `ActivityLog` para el canje de la recompensa.
  - Esta naturaleza transaccional asegura que no se canjee una recompensa sin crear el pedido correctamente, o viceversa, manteniendo la integridad de los datos.

### 6. 📜 [COMPLETADO] Historial de Actividad Unificado (Visión Cliente en Dashboard LCo)

- El `ActivityLog` del cliente en su dashboard LCo (`ActivityTab.tsx`) es la fuente central de información.
- **Entradas de Integración LC+LCo:**
  - `POINTS_EARNED_ORDER_LC`: Detalla los puntos ganados por pedidos en el Módulo Camarero.
  - `REWARD_REDEEMED_IN_LC_ORDER`: Detalla las recompensas LCo canjeadas directamente en los pedidos LC.
  - `POINTS_REDEEMED_REWARD`: Se mantiene para canjes realizados desde el propio dashboard de cliente.

---

## ⚙️ II. La Visión del Negocio (`BUSINESS_ADMIN`): Gestión Integrada, Datos Enriquecidos y Sinergias

### 1. 🔗 [PARCIALMENTE COMPLETADO] Configuración de la Integración LCo <-> LC (Panel Admin)

- **Ubicación:** Sección de "Recompensas" y "Gestión de Carta" en el panel de admin.
- **Parámetros Configurables por el `BUSINESS_ADMIN`:**
  - **Acumulación de Puntos:**
    - Interruptor: "Habilitar/Deshabilitar Acumulación de Puntos LCo desde Pedidos LC" (Funcionalidad Futura).
    - Campo `pointsPerEuro` en la configuración del negocio (Ya implementado).
  - **[COMPLETADO] Mapeo de Recompensas LCo:** La integración se configura al crear la recompensa. En el `RewardForm.tsx`, si el admin elige el tipo "Producto Gratis", se le presenta un selector con todos los `MenuItem` de su carta (obtenidos de la API de LC), permitiéndole vincular la recompensa directamente a un producto.

### 2. 📊 [PENDIENTE] Visión 360º del Cliente y Reportes Combinados

- **Perfil de Cliente Unificado (Admin LCo - `AdminCustomerManagementPage`):**
  - Al ver un cliente LCo, mostrar una nueva pestaña/sección "Actividad en Módulo Camarero":
    - Resumen: Nº total de pedidos LC, gasto total LC, fecha último pedido LC.
    - (Opcional) Lista de los N últimos pedidos LC con enlace a sus detalles.
- **Sincronización de Métricas Clave LCo:** `User.totalSpend` y `User.totalVisits` (LCo) se actualizan no solo por QR LCo, sino también por `Order`s LC pagados y asociados al cliente.
- **Reportes Combinados:** Posibilidad de segmentar y analizar el impacto de LC en la progresión de niveles de LCo y el impacto de las recompensas LCo en las ventas de LC.

### 3. 📢 [PENDIENTE] Estrategias de Marketing y Promoción Cruzada Mejoradas

- **Incentivos Dirigidos:** Crear Recompensas LCo específicas (ej. "Doble Puntos en tu primer pedido LC") o Beneficios de Nivel LCo atractivos para usar con LC.
- **Promoción de LCo dentro de la Experiencia LC:** Mensajes/banners configurables por el admin en `PublicMenuViewPage` para incentivar registro/login en LCo.

### 4. ⚙️ Operativa y Sincronización de Estados Clave (Flujo Backend - Consideraciones Importantes)

- **Estado `PAID` en `Order` LC (CRUCIAL):** El mecanismo para marcar un `Order` LC como `PAID` por el camarero es robusto y es el disparador principal para la asignación de puntos LCo.
- **[COMPLETADO] Transaccionalidad en Canjes LCo en Pedidos LC:** La lógica de canje de recompensas y débito de puntos durante la creación de un pedido LC ya está implementada de forma transaccional en `order-creation.service.ts` para asegurar la consistencia de datos entre los módulos.
- **Consistencia de Datos del Cliente:** Si un cliente actualiza sus datos en LCo, los snapshots en `Order` y `OrderItem` aseguran que los datos históricos de pedidos LC se mantienen intactos.

---

**La Sinergia Estratégica:**

La integración de **LoyalPyME Camarero (LC)** con **LoyalPyME Core (LCo)** no es solo una suma de funcionalidades, sino una **multiplicación de valor**. LC moderniza y agiliza la experiencia de servicio, capturando datos de consumo detallados. LCo utiliza estos datos para construir programas de lealtad que incentivan la recurrencia, aumentan el valor de vida del cliente y fortalecen la relación.
