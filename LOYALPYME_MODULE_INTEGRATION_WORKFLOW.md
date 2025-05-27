# LoyalPyME: Fidelización y Servicio, ¡Una Alianza Estratégica para tu Negocio! 🤝🌟🍽️

**Última Actualización:** 27 de Mayo de 2025 (Refina el flujo de identificación del cliente, el disparador de acumulación de puntos y las funcionalidades avanzadas).

Cuando un negocio decide activar tanto el módulo de fidelización **LoyalPyME Core (LCo)** para la gestión de la lealtad de sus clientes, como el módulo de operativa de servicio **LoyalPyME Camarero (LC)** para digitalizar la experiencia en el local, se desbloquea un potencial extraordinario. La integración fluida y pensada entre ambos módulos crea una experiencia de cliente superior, cohesiva y gratificante, al mismo tiempo que proporciona al negocio herramientas más potentes para la gestión, el análisis y el crecimiento.

Este documento detalla los puntos de contacto, las sinergias y los flujos de trabajo específicos que surgen cuando LCo y LC operan conjuntamente.

---

## ✨ **I. La Experiencia del Cliente Potenciada: Pedidos que Suman, Beneficios que Impactan**

Para un cliente que interactúa con un establecimiento que ha activado y sincronizado LoyalPyME Core y LoyalPyME Camarero, el recorrido se enriquece, ofreciendo conveniencia operativa y recompensas por su lealtad de manera integrada.

### 1. 📲 **Acceso a la Carta LC con Identidad LCo (Opcional pero Clave para Beneficios)**

- **Punto de Entrada Principal (LC):**
  - El cliente escanea el código QR en su mesa, lo que lo dirige a la carta digital pública del Módulo Camarero (`/m/:businessSlug/:tableIdentifier`), como se detalla en `LOYALPYME_CAMARERO_WORKFLOW.md`.
  - Desde aquí, puede visualizar el menú completo, personalizar ítems y prepararse para hacer un pedido (ya sea uno nuevo o añadir a uno existente si la lógica está implementada).
- **Integración Visible de LCo:**
  - En puntos estratégicos de la interfaz de la carta LC (ej. en el encabezado, cerca del resumen del carrito/pedido activo, o como un paso antes de finalizar el pedido/adición), se le presentan al cliente opciones claras y atractivas para conectar con su perfil de LoyalPyME Core:
    - **Botón/Enlace "Iniciar Sesión":** Si el cliente ya posee una cuenta LoyalPyME asociada a ESE negocio específico.
    - **Botón/Enlace "Registrarse":** Si es un nuevo cliente para el programa de fidelización del negocio y desea crear una cuenta para empezar a acumular puntos y beneficios.
  - **Mensajes Incentivadores:** Se pueden mostrar mensajes contextuales para fomentar la identificación, por ejemplo:
    - "¿Ya eres miembro? ¡Inicia sesión para ganar **{{puntosEstimados}} puntos** con este pedido!" (Los puntos estimados podrían calcularse en base al carrito actual).
    - "Regístrate gratis y podrías obtener un **[Beneficio de Bienvenida LCo configurado por el negocio]** en tu próximo pedido o al alcanzar tu primer nivel."

Interfaz de Carta/Carrito LC con Promoción LCo (Ejemplo Conceptual):
+------------------------------------------------+
| ... (Ítems del menú, categorías, carrito) ... |
| O (Aviso de pedido activo #P-XXXXX) |
|------------------------------------------------|
| [ Icono Programa Fidelidad / Logo LCo ] |
| ¡Tu Lealtad Vale Oro en [Nombre Negocio]! |
| |
| Inicia sesión con tu cuenta LoyalPyME o |
| regístrate ahora para: |
| ✓ Ganar puntos con cada pedido pagado. |
| ✓ Acceder a descuentos de nivel. |
| ✓ Canjear recompensas exclusivas. |
| |
| [ 👤 Iniciar Sesión ] [ ✨ Registrarse ] |
+------------------------------------------------+

### 2. 💳 **Proceso de Identificación LCo Durante el Flujo de Pedido LC**

- **Flujo de Login/Registro No Intrusivo:**
- Al seleccionar "Iniciar Sesión" o "Registrarse" desde la interfaz de LC, idealmente se presenta un **modal o una vista superpuesta** con los formularios estándar de login/registro de LCo. Esto evita sacar completamente al cliente del contexto de su pedido en LC.
- Los campos requeridos son los habituales: email/contraseña para login; email, contraseña, confirmación, nombre (opcional), teléfono, tipo/número de documento para registro (el `businessId` ya estaría preseleccionado o inferido del `businessSlug` de la URL).
- **Sincronización de Sesión y Datos del Cliente:**
- Tras una autenticación o registro exitoso a través de este flujo integrado:
  - El frontend (específicamente la lógica de `PublicMenuViewPage.tsx` o un contexto/estado de usuario global) almacena de forma segura el `customerId` y el token JWT del usuario LCo en `localStorage` (o el medio de persistencia de sesión elegido).
  - Se puede hacer una llamada a `/api/profile` para obtener los datos completos del usuario LCo (incluyendo puntos actuales, nivel, etc.) si no se devolvieron directamente en la respuesta de login/registro.
  - Se devuelve al cliente al punto exacto donde estaba en el flujo de pedido LC (ej. su carrito con los ítems que ya había añadido, o la vista de la carta si estaba explorando).
- El cliente ahora navega y finaliza su pedido LC (o añade ítems a uno existente) como un usuario LCo identificado. La UI podría reflejar esto (ej. "Hola, [NombreCliente]").

### 3. 🛍️ **Envío de Pedido LC (Nuevo o Adición) y Asociación Automática al Cliente LCo**

- El cliente configura su pedido o los ítems a añadir en la interfaz de LC y procede al envío.
- **Payload del Pedido LC Enriquecido con `customerId`:**
- Si el cliente se identificó con LCo (paso 2), el `customerId` obtenido se incluye en el objeto `CreateOrderPayloadDto` (para pedidos nuevos) o en el payload del endpoint de adición de ítems (para `POST /public/order/:existingOrderId/add-items`).
- **Procesamiento Backend (Servicios de LC y LCo):**
- El servicio `public/order.service.ts` del Módulo Camarero, al crear el registro `Order` o al añadir `OrderItem`s a un `Order` existente, asocia el `customerId` proporcionado al campo `Order.customerLCoId`.
- Este enlace `Order.customerLCoId` es la clave para todas las operaciones de integración posteriores.

### 4. 💯 **Acumulación Automática de Puntos LCo por Consumo en LC (Post-Pago)**

- **Evento Disparador (Trigger Clave):** La acumulación de puntos LCo se produce cuando un `Order` del Módulo Camarero, que tiene un `customerLCoId` asociado, cambia su `OrderStatus` a **`PAID`**.
- Este cambio a `PAID` es realizado típicamente por:
  - Un camarero desde su interfaz de gestión de mesas/pedidos (después de cobrar al cliente).
  - (Futuro) Un sistema de TPV integrado que se comunica con LoyalPyME.
  - (Futuro Muy Avanzado) El propio cliente si se implementa pago online dentro de la app LC y el pago es exitoso.
- **Lógica de Backend para la Integración (Idealmente en un "listener de eventos de Order" o dentro del servicio que actualiza `Order.status` a `PAID`):**

1.  **Detección del Evento:** Cuando un `Order` LC cambia su estado a `PAID`.
2.  **Verificación de Cliente LCo:** El sistema comprueba si el `Order.customerLCoId` no es nulo.
3.  **Cálculo de Puntos:**
    - Si hay `customerLCoId`, se obtiene el `finalAmount` del `Order` LC que se acaba de pagar. (Si un cliente paga varios `Order`s de una mesa, esta lógica se aplicaría a cada `Order` individualmente si cada uno tiene `customerLCoId`).
    - Se consulta la configuración del `Business` (LCo) para obtener el ratio `pointsPerEuro` (o una configuración específica para "puntos por gasto en LC" si se implementa).
    - Se calculan los puntos LCo a otorgar (ej. `Math.floor(finalAmount * pointsPerEuro)`). Se considera si se deben aplicar multiplicadores de puntos por nivel de LCo.
4.  **Actualización de Datos en LCo (Transaccional con la actualización del `Order` a `PAID` si es posible, o como un efecto secundario robusto):**
    - Se crea un nuevo registro en la tabla `ActivityLog` de LCo para el `customerLCoId`:
      - `type: ActivityType.POINTS_EARNED_ORDER_LC` (valor del enum `ActivityType`).
      - `pointsChanged`: los puntos calculados (positivos).
      - `description`: ej. "Puntos por pedido #P-000123 en [Nombre del Restaurante]".
      - `relatedOrderId`: el `id` del `Order` del Módulo Camarero que originó estos puntos, para trazabilidad.
    - Se actualiza el saldo de `points` del `User` (LCo).
    - Se actualiza `lastActivityAt` del `User`.
    - Se incrementa `totalSpend` (con `finalAmount` del pedido LC) y `totalVisits` (se cuenta como una visita si es un nuevo día o según la lógica de visitas del negocio) del `User` (LCo).
    - Se dispara la lógica `updateUserTier` (del servicio de tiers LCo) para recalcular el nivel del cliente en LCo basado en su nuevo `totalSpend`/`totalVisits`/`pointsEarned`.

- **Notificación al Cliente (Idealmente a través de LCo):**
- El cliente podría recibir una notificación (push si hay app, email, o un mensaje destacado en su próximo login a su dashboard LCo) indicando los puntos ganados por su reciente pedido.

### 5. 🌟 **Aplicación de Beneficios de Nivel LCo y Canje de Recompensas LCo en Pedidos LC (Funcionalidades Avanzadas - Post-MVP de Integración - Tarea D7 en `DEVELOPMENT_PLAN.md`)**

- **Visualización de Beneficios LCo en la Interfaz LC (`PublicMenuViewPage.tsx`):**
- Si el cliente está identificado con LCo y su `User.currentTier` tiene beneficios activos aplicables a LC:
  - La interfaz de la carta o el carrito LC podría mostrar sutilmente estos beneficios (ej. "¡Nivel Oro! Disfruta de un 10% de descuento en este pedido." o "Puedes canjear tu 'Bebida Gratis' aquí.").
- **Aplicación de Descuentos de Nivel LCo (Beneficio de Tier):**
- **Configuración:** En LCo, un `TierBenefit` de tipo `PERCENTAGE_DISCOUNT` o `FIXED_AMOUNT_DISCOUNT` debe poder marcarse como "Aplicable en Módulo Camarero".
- **Lógica en LC (al calcular el total del carrito/pedido):**
  - Si el cliente está identificado y su nivel LCo tiene un descuento aplicable, este se calcula sobre el subtotal del pedido LC (antes de otros descuentos o impuestos).
  - El `discountAmount` en el `Order` LC se actualiza, y el `finalAmount` se recalcula.
  - Esto debe ser visible para el cliente en el carrito y en el `OrderConfirmationPage`/`OrderStatusPage`.
- **Canje de Recompensas LCo (ej. "Producto Gratis", "Descuento de X€") en el Flujo LC:**
- **Configuración:** En LCo, una `Reward` debe poder marcarse como "Canjeable en Módulo Camarero". Si es un "Producto Gratis", se debe poder mapear a un `MenuItem.id` específico del catálogo LC (o a una categoría/tag).
- **Interfaz Cliente LC (`ShoppingCartModal.tsx` o similar):**
  - Podría haber una sección "Aplicar Mis Recompensas/Beneficios LoyalPyME".
  - Se listan las recompensas LCo del cliente que son "canjeables en LC" y para las cuales tiene suficientes puntos (si aplica) o que son beneficios de nivel.
- **Al seleccionar una recompensa LCo (ej. "Café Gratis"):**
  - Si la recompensa LCo se mapea a un `MenuItem.id` de LC:
    - El `MenuItem` correspondiente se añade al carrito LC con precio €0.00.
    - O, si el ítem ya está en el carrito, se aplica un descuento de línea que anule su precio.
  - Si es un descuento monetario ("Descuento de 5€ en el total"):
    - Se aplica al `Order.discountAmount` y se actualiza el `Order.finalAmount`.
- **Sincronización Backend (al enviar el pedido LC o la adición):**
  - La información de la recompensa LCo canjeada (ej. `appliedLcoRewardId`) se incluye en el payload del `Order` LC.
  - El backend del Módulo Camarero (ej. en `public/order.service.ts`), al procesar el pedido:
    - Se comunica con el backend de LCo (o un servicio compartido/lógica de eventos) para:
      - Marcar la `Reward` LCo como `REDEEMED` (descontando `pointsCost` del `User` si era por puntos, o actualizando el estado de un `GrantedReward` si era un regalo).
      - Crear el `ActivityLog` correspondiente en LCo (ej. `ActivityType.REWARD_REDEEMED_IN_LC_ORDER`, descripción: "Recompensa 'Café Gratis' canjeada en pedido #P-XXXXXX").
  - El campo `Order.appliedLcoRewardDiscountAmount` podría registrar el valor del descuento aplicado por esta recompensa.

### 6. 📜 **Historial de Actividad Unificado y Detallado (Visión Cliente en Dashboard LCo)**

- El `ActivityLog` del cliente en su dashboard LCo (`CustomerDashboardPage.tsx` -> `ActivityTab.tsx`) debe ser la fuente central de verdad para todas sus interacciones de lealtad:
- **Entradas Tradicionales de LCo:** `POINTS_EARNED_QR`, `POINTS_REDEEMED_REWARD` (canje desde dashboard LCo), `GIFT_REDEEMED` (canje de regalo desde dashboard LCo), `POINTS_ADJUSTED_ADMIN`.
- **Nuevas Entradas Específicas de la Integración LC+LCo:**
  - `POINTS_EARNED_ORDER_LC`: Detallando "Puntos ganados por pedido #P-XXXXXX en [Nombre Restaurante]: +YY Puntos". El `relatedOrderId` enlaza al `Order.id` de LC.
  - `REWARD_REDEEMED_IN_LC_ORDER` (o un tipo similar): Detallando "Recompensa '[Nombre Recompensa LCo]' canjeada en pedido #P-XXXXXX de [Nombre Restaurante]". El `relatedOrderId` y `relatedRewardId` son clave.

---

## ⚙️ **II. La Visión del Negocio (`BUSINESS_ADMIN`): Gestión Integrada, Datos Enriquecidos y Sinergias**

Para el `BUSINESS_ADMIN`, la activación conjunta de LCo y LC, con una integración bien definida, ofrece una gestión más eficiente y oportunidades estratégicas.

### 1. 🔗 **Configuración de la Integración LCo <-> LC (Panel Admin)**

- **Ubicación:** Una nueva sección en el panel de admin "Configuración de Módulos" o sub-secciones dentro de las configuraciones de LCo y LC.
- **Parámetros Configurables:**
- **Habilitar/Deshabilitar Acumulación de Puntos LCo desde Pedidos LC:** Un interruptor maestro.
- **Ratio de Puntos Específico para Pedidos LC:**
  - Opción: "Usar el mismo ratio que los QR de LCo (`Business.pointsPerEuro` global)".
  - Opción: "Definir un ratio diferente para pedidos del Módulo Camarero" (ej. para incentivar más el auto-servicio). Campo para introducir este ratio específico.
- **Estado del Pedido LC que Otorga Puntos LCo:** Configurar qué `OrderStatus` de LC (debe ser **`PAID`**) dispara la asignación de puntos LCo.
- **(Avanzado) Configuración de Canje de Recompensas/Beneficios LCo en LC:**
  - Switch global para habilitar/deshabilitar esta funcionalidad.
  - **Mapeo de Recompensas LCo:** Interfaz para marcar qué `Reward`s de LCo son "Canjeables en Módulo Camarero".
    - Para recompensas tipo "Producto Gratis", permitir seleccionar el `MenuItem.id` (o categoría/tag) de LC al que corresponde.
  - **Configuración de Beneficios de Nivel LCo:** Permitir marcar qué `TierBenefit`s (ej. descuentos porcentuales) son "Aplicables en Módulo Camarero" y si se aplican automáticamente o requieren una acción del cliente en la UI de LC.

### 2. 📊 **Visión 360º del Cliente y Reportes Combinados**

- **Perfil de Cliente Unificado en Admin LCo (`AdminCustomerManagementPage`):**
- Al visualizar un cliente en la gestión de clientes de LCo, el admin verá, además de su información de fidelización (puntos, nivel, historial LCo), una pestaña o sección de "Actividad en Módulo Camarero":
  - Número total de pedidos realizados vía LC.
  - Gasto total a través de LC.
  - Fecha del último pedido LC.
  - (Opcional) Lista de los últimos N pedidos LC con enlace a sus detalles (si existe un panel de gestión de pedidos LC para el admin donde pueda ver `Order`s individuales).
- **Sincronización de Métricas Clave:**
- El `User.totalSpend` y `User.totalVisits` en LCo se actualizan automáticamente no solo por los QR de LCo, sino también por los `Order`s de LC que son marcados como `PAID` y están asociados a ese cliente.
- **Reportes de LCo Enriquecidos:**
- Los informes de LCo (ej. clientes más valiosos, actividad de puntos, efectividad de recompensas) podrán segmentarse o filtrar por el origen de la actividad (QR de LCo vs. Pedido LC).
- Análisis del impacto de los pedidos LC en la progresión de niveles LCo y en el canje de recompensas.
- **Reportes de LC con Perspectiva LCo:**
- Los informes del Módulo Camarero (ej. ventas por ítem, ticket medio por mesa/periodo) podrían incluir información sobre:
  - Porcentaje de ventas generadas por clientes LCo identificados.
  - Distribución de ventas por nivel LCo de los clientes.
  - Impacto de los descuentos de nivel LCo o recompensas LCo canjeadas en los totales de los pedidos LC.

### 3. 📢 **Estrategias de Marketing y Promoción Cruzada Mejoradas**

- **Incentivos Dirigidos Basados en Comportamiento Combinado:**
- Crear Recompensas LCo específicas como "Doble Puntos en tu primer pedido usando el QR de mesa en el local" o "Descuento exclusivo en [Plato Estrella de LC] si pides desde la app en el local y eres Nivel X de LCo".
- Ofrecer Beneficios de Nivel LCo que sean especialmente atractivos cuando se usan con el Módulo Camarero (ej. "Postre gratis en pedidos LC para miembros Oro y Platino").
- **Promoción de LCo dentro de la Experiencia LC:**
- El admin puede configurar mensajes o banners personalizables que aparecen en la `PublicMenuViewPage` (LC) para incentivar el registro o login en LCo, destacando los beneficios inmediatos (como ganar puntos con el pedido actual una vez pagado).
- **Campañas de Marketing y Comunicación Segmentadas:**
- Utilizar los datos de ambos módulos para segmentar clientes de forma más precisa y enviar comunicaciones más efectivas (ej. email a clientes LCo de alto valor que no han usado el Módulo Camarero recientemente, ofreciéndoles un incentivo para probarlo).
- Notificar a clientes sobre nuevos ítems en la carta LC que podrían gustarles basados en su historial de pedidos (si se almacena y analiza).

### 4. ⚙️ **Operativa y Sincronización de Estados Clave (Flujo Backend)**

- **Fiabilidad del Estado `PAID` en `Order` LC:** Es fundamental que el mecanismo para marcar un `Order` LC como pagado (ya sea por el camarero, TPV, o pago online futuro) sea robusto y preciso. Este estado es el principal disparador para la concesión de puntos LCo y otras lógicas de negocio.
- **Gestión de Canjes LCo en Pedidos LC (Transaccionalidad):** Si se implementa el canje de recompensas/beneficios LCo directamente en el flujo de LC, la comunicación entre el backend de LC y LCo para marcar la recompensa LCo como canjeada (o un beneficio como aplicado) y ajustar puntos/estados en LCo debe ser **transaccional o, como mínimo, idempotente y con mecanismos de reintento/compensación** para evitar inconsistencias (ej. que se aplique un descuento en LC pero no se registre el canje en LCo, o viceversa).
- **Consistencia de Datos del Cliente:** Si un cliente actualiza sus datos personales en LCo (ej. email, nombre), y ese cliente también está asociado a `Order`s en LC (a través de `Order.customerLCoId`), se debe considerar cómo mantener la consistencia de la información de identificación del cliente a través de los módulos. Los pedidos LC realizados de forma anónima (sin `customerLCoId`) no tendrían este problema de sincronización de datos de perfil.

---

**La Sinergia Estratégica:**

La integración de **LoyalPyME Camarero (LC)** con **LoyalPyME Core (LCo)** no es solo una suma de funcionalidades, sino una multiplicación de valor. LC moderniza y agiliza la experiencia de servicio en el local, capturando datos de consumo y comportamiento valiosos. LCo toma estos datos y los transforma en programas de lealtad personalizados y efectivos que incentivan la recurrencia y aumentan el valor del cliente.

Esta combinación permite a los negocios:

- **Mejorar la satisfacción del cliente** con un servicio más rápido, personalizado, y con opciones de recompensa integradas.
- **Aumentar la frecuencia de visitas y el gasto promedio** mediante incentivos de lealtad contextuales y beneficios aplicables directamente en el punto de servicio.
- **Obtener una comprensión 360º del cliente** al unificar datos de servicio (qué, cuándo y cómo piden en el local) con datos de lealtad (su nivel, puntos, recompensas, actividad general).
- **Optimizar la operativa del personal** al reducir la carga de trabajo manual en la toma de pedidos, cobros, y aplicación de promociones de lealtad.
- **Diferenciarse de la competencia** ofreciendo una experiencia digital integrada, moderna y que premia la fidelidad de forma transparente y atractiva.

La clave del éxito de esta integración reside en una comunicación fluida, lógica y robusta entre los datos y procesos de ambos módulos, tanto a nivel de arquitectura backend (servicios, eventos, colas de mensajes si fuera necesario para desacoplar) como en la presentación de una experiencia de usuario cohesiva y sin fricciones en el frontend.
