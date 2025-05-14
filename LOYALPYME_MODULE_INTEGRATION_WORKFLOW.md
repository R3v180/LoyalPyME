# LoyalPyME: Fidelización y Servicio, ¡Una Alianza Estratégica para tu Negocio! 🤝🌟🍽️

Cuando un negocio decide activar tanto el módulo de fidelización **LoyalPyME Core (LCo)** para la gestión de la lealtad de sus clientes, como el módulo de operativa de servicio **LoyalPyME Camarero (LC)** para digitalizar la experiencia en el local, se desbloquea un potencial extraordinario. La integración fluida y pensada entre ambos módulos crea una experiencia de cliente superior, cohesiva y gratificante, al mismo tiempo que proporciona al negocio herramientas más potentes para la gestión, el análisis y el crecimiento.

Este documento detalla los puntos de contacto, las sinergias y los flujos de trabajo específicos que surgen cuando LCo y LC operan conjuntamente.

---

## ✨ **I. La Experiencia del Cliente Potenciada: Pedidos que Suman, Beneficios que Impactan**

Para un cliente que interactúa con un establecimiento que ha activado y sincronizado LoyalPyME Core y LoyalPyME Camarero, el recorrido se enriquece, ofreciendo conveniencia operativa y recompensas por su lealtad de manera integrada.

### 1. 📲 **Acceso a la Carta LC con Identidad LCo (Opcional pero Clave para Beneficios)**

- **Punto de Entrada Principal (LC):**
  - El cliente escanea el código QR en su mesa, lo que lo dirige a la carta digital pública del Módulo Camarero (`/m/:businessSlug/:tableIdentifier`), como se detalla en `LOYALPYME_CAMARERO_WORKFLOW.md`.
  - Desde aquí, puede visualizar el menú completo, personalizar ítems y prepararse para hacer un pedido.
- **Integración Visible de LCo:**

  - En puntos estratégicos de la interfaz de la carta LC (ej. en el encabezado, cerca del resumen del carrito, o como un paso antes de finalizar el pedido), se le presentan al cliente opciones claras y atractivas para conectar con su perfil de LoyalPyME Core:
    - **Botón/Enlace "Iniciar Sesión":** Si el cliente ya posee una cuenta LoyalPyME asociada a ESE negocio específico.
    - **Botón/Enlace "Registrarse":** Si es un nuevo cliente para el programa de fidelización del negocio y desea crear una cuenta para empezar a acumular puntos y beneficios.
  - **Mensajes Incentivadores:** Se pueden mostrar mensajes contextuales para fomentar la identificación, por ejemplo:
    - "¿Ya eres miembro? ¡Inicia sesión para ganar **{{puntosEstimados}} puntos** con este pedido!"
    - "Regístrate gratis y obtén un **[Beneficio de Bienvenida LCo]** en tu próximo pedido."

  ```
  Interfaz de Carta/Carrito LC con Promoción LCo (Ejemplo Conceptual):
  +------------------------------------------------+
  | ... (Ítems del menú, categorías, carrito) ...  |
  |------------------------------------------------|
  | [ Icono Programa Fidelidad ]                   |
  | **¡Tu Lealtad Vale Oro en [Nombre Negocio]!**  |
  |                                                |
  |  Inicia sesión con tu cuenta LoyalPyME o       |
  |  regístrate ahora para:                        |
  |    ✓ Ganar puntos con cada pedido.             |
  |    ✓ Acceder a descuentos de nivel.            |
  |    ✓ Canjear recompensas exclusivas.           |
  |                                                |
  |   [ 👤 Iniciar Sesión ]   [ ✨ Registrarse ]    |
  +------------------------------------------------+
  ```

### 2. 💳 **Proceso de Identificación LCo Durante el Flujo de Pedido LC**

- **Flujo de Login/Registro No Intrusivo:**
  - Al seleccionar "Iniciar Sesión" o "Registrarse" desde la interfaz de LC, idealmente se presenta un **modal o una vista superpuesta** con los formularios estándar de login/registro de LCo. Esto evita sacar completamente al cliente del contexto de su pedido en LC.
  - Los campos requeridos son los habituales: email/contraseña para login; email, contraseña, confirmación, nombre (opcional), teléfono, tipo/número de documento para registro (el `businessId` ya estaría preseleccionado o inferido).
- **Sincronización de Sesión:**
  - Tras una autenticación o registro exitoso a través de este flujo integrado:
    - El frontend (específicamente la lógica de `PublicMenuViewPage.tsx` o un servicio de estado de usuario global) almacena de forma segura el `customerId` y el token JWT del usuario LCo.
    - Se devuelve al cliente al punto exacto donde estaba en el flujo de pedido LC (ej. su carrito con los ítems que ya había añadido).
  - El cliente ahora navega y finaliza su pedido LC como un usuario LCo identificado.

### 3. 🛍️ **Envío de Pedido LC y Asociación Automática al Cliente LCo**

- El cliente configura su pedido (ítems, modificadores, cantidades, notas) en la interfaz de LC y procede al envío.
- **Payload del Pedido LC Enriquecido con `customerId`:**
  - Si el cliente se identificó con LCo (paso 2), el `customerId` obtenido se incluye en el objeto `CreateOrderPayloadDto` que el frontend de LC envía al endpoint del backend `POST /public/order/:businessSlug`.
- **Procesamiento Backend (LC y LCo):**
  - El servicio `order.service.ts` del Módulo Camarero, al crear el registro `Order` en la BD, asocia este pedido tanto al `tableIdentifier` como al `customerId` proporcionado.
  - Este enlace `Order.customerId` es la clave para las operaciones de integración posteriores.

### 4. 💯 **Acumulación Automática de Puntos LCo por Consumo en LC (Post-Pago)**

- **Evento Disparador (Trigger):** La acumulación de puntos LCo se produce cuando el pedido LC se considera **completado y pagado**.
  - El estado del `Order` en el Módulo Camarero debe cambiar a un estado final como `PAID` o `COMPLETED_AND_PAID`. Este cambio de estado puede ser realizado por:
    - Un camarero desde su interfaz de gestión de mesas/pedidos.
    - (Futuro) Un sistema de TPV integrado.
    - (Futuro) El propio cliente si se implementa pago online dentro de la app LC.
- **Lógica de Backend para la Integración (Puede residir en `order.service.ts` de LC o en un servicio de "eventos de negocio" que escuche cambios de estado de `Order`):**
  1.  **Detección del Evento:** Cuando un `Order` LC pasa a estado `PAID`.
  2.  **Verificación de Cliente LCo:** El sistema comprueba si el `Order` tiene un `customerId` asociado.
  3.  **Cálculo de Puntos:**
      - Si hay `customerId`, se obtiene el `finalAmount` (o `totalAmount` si no hay descuentos) del `Order` LC.
      - Se consulta la configuración del `Business` (LCo) para obtener el ratio `pointsPerEuro` (o una configuración específica para "puntos por gasto en LC" si existe).
      - Se calculan los puntos LCo a otorgar (ej. `Math.floor(finalAmount * pointsPerEuro)`).
  4.  **Actualización en LCo:**
      - Se crea un nuevo registro en la tabla `ActivityLog` (LCo) para el `customerId`:
        - `type: 'POINTS_EARNED_ORDER_LC'` (un nuevo `ActivityType` específico).
        - `pointsChanged`: los puntos calculados.
        - `description`: ej. "Puntos por pedido en mesa #P-000123".
        - `relatedOrderId_LC` (opcional, pero muy recomendable): el `id` del `Order` del Módulo Camarero que originó estos puntos, para trazabilidad.
      - Se actualiza el saldo de `points` del `User` (LCo).
      - Se actualiza `lastActivityAt` del `User`.
      - Se incrementa `totalSpend` y `totalVisits` del `User` (LCo) con los datos del pedido LC.
      - Se dispara la lógica `updateUserTier` para recalcular el nivel del cliente en LCo.
- **Notificación al Cliente (Idealmente a través de LCo):**
  - El cliente podría recibir una notificación push (si hay app nativa/PWA LCo), un email, o ver un mensaje en su próximo login a su dashboard LCo indicando los puntos ganados por su reciente pedido en el establecimiento.

### 5. 🌟 **Aplicación de Beneficios de Nivel LCo y Canje de Recompensas LCo en Pedidos LC (Funcionalidades Avanzadas - Post-MVP de Integración - Tarea #29 `DEVELOPMENT_PLAN.md`)**

- **Visualización de Beneficios LCo en la Interfaz LC:**
  - Si el cliente está identificado con LCo, la interfaz de la carta o el carrito LC podría mostrar sutilmente los beneficios de su nivel actual que son aplicables (ej. "¡Nivel Oro! Disfruta de un 10% de descuento en este pedido.").
- **Aplicación de Descuentos de Nivel LCo:**
  - **Lógica:** Si el `currentTier` del cliente en LCo tiene un beneficio de tipo `PERCENTAGE_DISCOUNT` o `FIXED_AMOUNT_DISCOUNT` que sea aplicable a pedidos LC:
    - El descuento se calcula sobre el subtotal del pedido LC.
    - El `discountAmount` en el `Order` LC se actualiza, y el `finalAmount` se recalcula.
    - Se podría requerir una "activación" manual del descuento por parte del cliente o aplicarse automáticamente.
- **Canje de Recompensas LCo (tipo "Producto Gratis" o "Descuento Específico") en el Flujo LC:**
  - **Interfaz Cliente LC:** En el carrito, podría haber una sección "Aplicar Mis Recompensas LoyalPyME".
  - Se listan las recompensas LCo activas y disponibles del cliente que sean compatibles con el canje en LC (esto requiere una configuración de "compatibilidad" para las recompensas LCo).
  - **Al seleccionar una recompensa LCo (ej. "Café Gratis"):**
    - Si la recompensa LCo se mapea a un `MenuItem` específico de LC, ese ítem se añade al carrito LC con precio €0.00 o con su precio original y un descuento de línea que lo anule.
    - Si es un descuento monetario ("Descuento de 5€"), se aplica al `discountAmount` del `Order` LC.
  - **Sincronización Backend:**
    - Al enviar el pedido LC, la información de la recompensa LCo canjeada se incluye en el payload.
    - El backend del Módulo Camarero debe comunicarse con el backend de LCo (o un servicio compartido) para:
      - Marcar la recompensa LCo como `REDEEMED` (descontando puntos si es por puntos, o actualizando el estado de un `GrantedReward`).
      - Crear el `ActivityLog` correspondiente en LCo (ej. "Recompensa Canjeada en Pedido LC: Café Gratis").

### 6. 📜 **Historial de Actividad Unificado y Detallado (Visión Cliente en LCo)**

- El `ActivityLog` del cliente en su dashboard LCo (`/customer/dashboard`) debe ser la fuente central de verdad para todas sus interacciones de lealtad:
  - **Entradas Tradicionales de LCo:**
    - `POINTS_EARNED_QR`: Puntos por QR de ticket.
    - `POINTS_REDEEMED_REWARD`: Canje de recompensa LCo desde el dashboard LCo.
    - `GIFT_REDEEMED`: Canje de regalo LCo desde el dashboard LCo.
    - `POINTS_ADJUSTED_ADMIN`: Ajustes manuales.
  - **Nuevas Entradas Específicas de la Integración LC+LCo:**
    - `POINTS_EARNED_ORDER_LC`: Detallando "Puntos ganados por pedido en [Nombre Restaurante] #P-XXXXXX: +YY Puntos".
    - `REWARD_REDEEMED_IN_LC_ORDER`: Detallando "Recompensa '[Nombre Recompensa LCo]' canjeada en pedido de [Nombre Restaurante] #P-XXXXXX".

---

## ⚙️ **II. La Visión del Negocio (`BUSINESS_ADMIN`): Gestión Integrada, Datos Enriquecidos y Sinergias**

Para el `BUSINESS_ADMIN`, la activación conjunta de LCo y LC, con una integración bien definida, ofrece una gestión más eficiente y oportunidades estratégicas.

### 1. 🔗 **Configuración de la Integración LCo <-> LC (Panel Admin)**

- **Ubicación:** Una nueva sección en el panel de admin "Configuración de Integraciones" o sub-secciones dentro de las configuraciones de LCo y LC.
- **Parámetros Configurables:**
  - **Habilitar/Deshabilitar Acumulación de Puntos LCo desde Pedidos LC:** Un interruptor maestro.
  - **Ratio de Puntos Específico para Pedidos LC:**
    - Opción: "Usar el mismo ratio que los QR de LCo (`pointsPerEuro` global)".
    - Opción: "Definir un ratio diferente para pedidos del Módulo Camarero" (ej. para incentivar más el auto-servicio). Campo para introducir este ratio.
  - **Estado del Pedido LC que Otorga Puntos LCo:** Configurar qué `OrderStatus` de LC (ej. `PAID`, `COMPLETED`) dispara la asignación de puntos LCo.
  - **(Avanzado) Configuración de Canje de Recompensas LCo en LC:**
    - Switch global para habilitar/deshabilitar esta funcionalidad.
    - Interfaz para mapear Recompensas LCo específicas a:
      - `MenuItem`s de LC (para "producto gratis").
      - Tipos de descuento aplicables en LC (ej. "% sobre total", "€ fijos sobre total").
    - Definir si ciertos beneficios de Nivel LCo (ej. descuentos porcentuales) se aplican automáticamente a pedidos LC o requieren acción del cliente.

### 2. 📊 **Visión 360º del Cliente y Reportes Combinados**

- **Perfil de Cliente Unificado en Admin LCo:**
  - Al visualizar un cliente en la sección de gestión de clientes de LCo, el admin verá, además de su información de fidelización, un resumen o pestaña de "Actividad en Módulo Camarero":
    - Número total de pedidos realizados vía LC.
    - Gasto total a través de LC.
    - Fecha del último pedido LC.
    - (Opcional) Enlace a una vista más detallada de los pedidos LC de ese cliente (si existe un panel de gestión de pedidos LC para el admin).
- **Sincronización de Métricas:**
  - El `totalSpend` y `totalVisits` de un cliente en LCo se actualizan automáticamente no solo por los QR de LCo, sino también por los pedidos LC pagados y asociados a ese cliente.
- **Reportes de LCo Enriquecidos:**
  - Los informes de LCo (ej. clientes más valiosos, actividad de puntos) podrán segmentarse o filtrar por el origen de la actividad (QR de LCo vs. Pedido LC).
  - Análisis del impacto de los pedidos LC en la progresión de niveles LCo.
- **Reportes de LC con Perspectiva LCo:**
  - Los informes del Módulo Camarero (ej. ventas por ítem, ticket medio) podrían incluir información sobre qué porcentaje de esas ventas fueron de clientes LCo identificados, y de qué nivel LCo.

### 3. 📢 **Estrategias de Marketing y Promoción Cruzada Mejoradas**

- **Incentivos Dirigidos:**
  - Crear Recompensas LCo específicas como "Doble Puntos en tu primer pedido usando el QR de mesa" o "Descuento exclusivo en [Plato Estrella] si pides desde la app en el local".
  - Ofrecer Beneficios de Nivel LCo que sean especialmente atractivos cuando se usan con el Módulo Camarero (ej. "Postre gratis en pedidos LC para miembros Oro").
- **Promoción de LCo dentro de LC:**
  - El admin puede configurar mensajes o banners personalizables que aparecen en la `PublicMenuViewPage` (LC) para incentivar el registro o login en LCo, destacando los beneficios inmediatos (como ganar puntos con el pedido actual).
- **Campañas Combinadas:** Utilizar los datos de ambos módulos para segmentar clientes y enviar comunicaciones más efectivas (ej. email a clientes LCo que no han usado el Módulo Camarero recientemente, ofreciendo un incentivo).

### 4. ⚙️ **Operativa y Sincronización de Estados Clave**

- **Fiabilidad del Estado `PAID` en LC:** Es fundamental que el mecanismo para marcar un `Order` LC como pagado sea robusto, ya que es el principal disparador para la concesión de puntos LCo.
- **Gestión de Canjes LCo en LC:** Si se implementa, la comunicación entre el backend de LC y LCo para marcar una recompensa LCo como canjeada y ajustar puntos/estados debe ser transaccional o idempotente para evitar inconsistencias.
- **Consistencia de Datos del Cliente:** Si un cliente actualiza sus datos en LCo (ej. email), y ese cliente también está asociado a pedidos en LC, se debe considerar cómo mantener la consistencia (aunque los pedidos LC anónimos no tendrían este problema).

---

**La Sinergia Estratégica:**

La integración de **LoyalPyME Camarero (LC)** con **LoyalPyME Core (LCo)** no es solo una suma de funcionalidades, sino una multiplicación de valor. LC moderniza y agiliza la experiencia de servicio en el local, capturando datos de consumo y comportamiento valiosos. LCo toma estos datos y los transforma en programas de lealtad personalizados y efectivos que incentivan la recurrencia.

Esta combinación permite a los negocios:

- **Mejorar la satisfacción del cliente** con un servicio más rápido y opciones de recompensa.
- **Aumentar la frecuencia de visitas y el gasto promedio** mediante incentivos y beneficios.
- **Obtener una comprensión más profunda del cliente** al unificar datos de servicio y lealtad.
- **Optimizar la operativa del personal** al reducir la carga de trabajo manual en la toma de pedidos y cobros.
- **Diferenciarse de la competencia** ofreciendo una experiencia digital integrada y moderna.

La clave reside en una comunicación fluida y lógica entre los datos y procesos de ambos módulos, tanto a nivel de backend como en la experiencia de usuario presentada en el frontend.

---
