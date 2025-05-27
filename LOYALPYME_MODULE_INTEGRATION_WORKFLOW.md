# LoyalPyME: Fidelización y Servicio, ¡Una Alianza Estratégica para tu Negocio! 🤝🌟🍽️

**Última Actualización:** 28 de Mayo de 2025 (Refleja el rol del camarero en el ciclo de pedido LC y su impacto en el futuro trigger de integración con LCo)

Cuando un negocio decide activar tanto el módulo de fidelización **LoyalPyME Core (LCo)** para la gestión de la lealtad de sus clientes, como el módulo de operativa de servicio **LoyalPyME Camarero (LC)** para digitalizar la experiencia en el local, se desbloquea un potencial extraordinario. La integración fluida y pensada entre ambos módulos crea una experiencia de cliente superior, cohesiva y gratificante, al mismo tiempo que proporciona al negocio herramientas más potentes para la gestión, el análisis y el crecimiento.

Este documento detalla los puntos de contacto, las sinergias y los flujos de trabajo específicos que surgen cuando LCo y LC operan conjuntamente, considerando el ciclo completo del pedido en LC, incluyendo la intervención del personal (KDS y Camarero).

---

## ✨ **I. La Experiencia del Cliente Potenciada: Pedidos que Suman, Beneficios que Impactan**

Para un cliente que interactúa con un establecimiento que ha activado y sincronizado LoyalPyME Core y LoyalPyME Camarero, el recorrido se enriquece, ofreciendo conveniencia operativa y recompensas por su lealtad de manera integrada.

### 1. 📲 **Acceso a la Carta LC con Identidad LCo (Opcional pero Clave para Beneficios Futuros)**

    *   **Punto de Entrada Principal (LC):** El cliente escanea el QR de mesa (`/m/:businessSlug/:tableIdentifier`), explora la carta, personaliza ítems y prepara su pedido. Este flujo es gestionado por `PublicMenuViewPage.tsx`.
    *   **Integración Visible de LCo (Opcional, configurable por el negocio):**
        *   En la interfaz de la carta LC, se pueden presentar opciones para "Iniciar Sesión" (si ya tiene cuenta LCo en ese negocio) o "Registrarse" (para crear una nueva cuenta LCo).
        *   **Objetivo:** Asociar un `customerId` de LCo al `Order` que se cree en LC.
        *   **Incentivo:** Mensajes como "¿Ya eres miembro? ¡Inicia sesión para que este pedido sume a tus beneficios!" o "Regístrate y este pedido podría ayudarte a alcanzar tu primer nivel."
    *   _(La UI para esta promoción de LCo en LC es una mejora futura; la funcionalidad de asociar `customerId` al `Order` si el cliente se loguea por otros medios (ej. desde dashboard LCo y luego va a la carta) ya está implementada en el backend de creación de `Order` LC)._

### 2. 💳 **Proceso de Identificación LCo Durante el Flujo de Pedido LC**

    *   **Flujo de Login/Registro (Idealmente No Intrusivo):** Si se implementa el punto anterior, al seleccionar "Iniciar Sesión" o "Registrarse" desde LC, se usarían modales o vistas superpuestas para los formularios de LCo, manteniendo al cliente en el contexto del pedido.
    *   **Sincronización de Sesión:** Tras una autenticación/registro exitoso, el frontend (ej. `PublicMenuViewPage.tsx` o un contexto global) almacena el `customerId` y token JWT de LCo.
    *   El cliente finaliza su pedido LC (o añade ítems) como un usuario LCo identificado.
    *   _(La lógica de login/registro de LCo es funcional. Su integración visual directa en el flujo de pedido LC es una mejora de UX futura)._

### 3. 🛍️ **Envío de Pedido LC (Nuevo o Adición) y Asociación al Cliente LCo**

    *   El cliente configura su pedido en la interfaz LC y procede al envío.
    *   **Payload del Pedido LC:** Si el cliente se identificó con LCo, el `customerId` se incluye en el `CreateOrderPayloadDto` (o en el DTO de "Añadir Ítems").
    *   **Procesamiento Backend (LC):** El servicio `public/order.service.ts` asocia este `customerId` al campo `Order.customerLCoId`. Este enlace es fundamental para la integración.
    *   _(Esta asociación ya está implementada en el backend de creación de `Order` LC)._

### 4. 💯 **[FUTURO - POST-MVP LC COMPLETO] Acumulación Automática de Puntos LCo por Consumo en LC (Post-Pago)**

    *   **Evento Disparador Clave:** La acumulación de puntos LCo se producirá cuando un `Order` del Módulo Camarero, que tiene un `customerLCoId` asociado, cambie su `OrderStatus` a **`PAID`**.
    *   **¿Quién marca el pedido como `PAID`?**
        1.  **Camarero (Flujo Actual en Desarrollo):** Desde su interfaz de gestión de mesas/pedidos (aún por implementar), el camarero, después de que el cliente haya pagado físicamente (efectivo, tarjeta externa), marcará el/los `Order`(s) correspondientes como `PAID`.
        2.  **(Futuro) Sistema de TPV Integrado:** Si se desarrolla un TPV LoyalPyME o se integra con uno existente, el cierre y pago de la cuenta en el TPV actualizaría el `Order.status` a `PAID`.
        3.  **(Futuro Muy Avanzado) Pago Online por Cliente:** Si se implementa pago online directamente en la app/vista web del cliente LC, un pago exitoso a través de la pasarela cambiaría el `Order.status` a `PAID`.
    *   **Lógica de Backend para la Integración LCo-LC (a implementar cuando el estado `PAID` sea gestionable):**
        1.  **Detección del Evento:** Un listener de eventos de cambio de estado en `Order` o una lógica dentro del servicio que actualiza el `Order.status` a `PAID`.
        2.  **Verificación:** Comprobar que `Order.customerLCoId` no es nulo.
        3.  **Cálculo de Puntos:**
            *   Obtener `Order.finalAmount`.
            *   Consultar `Business.pointsPerEuro` (o `Business.pointsPerEuroCamarero` si se diferencia).
            *   Aplicar multiplicadores de puntos del `Tier` actual del cliente LCo (obtenido de `User.currentTier.benefits`).
            *   Calcular puntos LCo (`Math.floor(...)`).
        4.  **Actualización de Datos en LCo (Transaccional o como efecto secundario robusto):**
            *   Crear registro en `ActivityLog` (LCo): `type: POINTS_EARNED_ORDER_LC`, `pointsChanged: +XX`, `description: "Puntos por pedido LC #P-XXXXXX"`, `relatedOrderId: order.id`.
            *   Actualizar `User.points` (LCo).
            *   Actualizar `User.lastActivityAt` (LCo).
            *   Incrementar `User.totalSpend` y `User.totalVisits` (LCo).
            *   Disparar `updateUserTier(customerLCoId)` para recalcular el nivel del cliente en LCo.
    *   **Notificación al Cliente (LCo):** Email o notificación push (si hay app) informando los puntos ganados.

### 5. 🌟 **[FUTURO - POST-MVP LC COMPLETO E INTEGRACIÓN BÁSICA LCo] Aplicación de Beneficios de Nivel LCo y Canje de Recompensas LCo en Pedidos LC**

    *   Esta es una funcionalidad avanzada que se construirá sobre la acumulación de puntos.
    *   **Visualización de Beneficios LCo en Interfaz LC (`PublicMenuViewPage.tsx`):**
        *   Si el cliente está identificado con LCo, la UI de LC podría mostrar sutilmente los beneficios de su nivel aplicables a pedidos LC (ej. "¡Nivel Oro! Disfruta de un 10% de descuento.").
    *   **Aplicación de Descuentos de Nivel LCo:**
        *   **Configuración LCo:** `TierBenefit` de tipo `PERCENTAGE_DISCOUNT` o `FIXED_AMOUNT_DISCOUNT` marcado como "Aplicable en Módulo Camarero".
        *   **Lógica LC (Backend/Frontend):** Al calcular el total del pedido LC, si el cliente tiene un descuento de nivel aplicable, éste se resta del `Order.totalAmount`, actualizando `Order.discountAmount` y `Order.finalAmount`. Visible en carrito y confirmación.
    *   **Canje de Recompensas LCo (ej. "Producto Gratis", "Descuento X€") en Flujo LC:**
        *   **Configuración LCo:** `Reward` marcada como "Canjeable en Módulo Camarero". Mapeo de "Producto Gratis" a `MenuItem.id` de LC.
        *   **Interfaz Cliente LC (`ShoppingCartModal.tsx`):** Sección "Aplicar Recompensas LoyalPyME" para que el cliente seleccione una recompensa LCo canjeable.
        *   **Lógica LC:** Si es producto gratis, se añade al carrito LC con precio 0. Si es descuento, se aplica al total.
        *   **Sincronización Backend:** El pedido LC enviado incluye `appliedLcoRewardId`. El backend de LC se comunica con LCo para marcar la `Reward` como `REDEEMED` y crear el `ActivityLog` en LCo.
    *   _(Tarea D7 en `DEVELOPMENT_PLAN.md`)._

### 6. 📜 **[PARCIALMENTE IMPLEMENTADO - SE COMPLETARÁ CON INTEGRACIÓN] Historial de Actividad Unificado (Visión Cliente en Dashboard LCo)**

    *   El `ActivityLog` del cliente en su dashboard LCo (`ActivityTab.tsx`) será la fuente central.
    *   **Actualmente Muestra:** `POINTS_EARNED_QR`, `POINTS_REDEEMED_REWARD` (canje desde dashboard LCo), `GIFT_REDEEMED`, `POINTS_ADJUSTED_ADMIN`.
    *   **Futuras Entradas de Integración LC+LCo:**
        *   `POINTS_EARNED_ORDER_LC`: Detallando puntos ganados por pedidos LC.
        *   `REWARD_REDEEMED_IN_LC_ORDER`: Detallando recompensas LCo canjeadas en pedidos LC.

---

## ⚙️ **II. La Visión del Negocio (`BUSINESS_ADMIN`): Gestión Integrada, Datos Enriquecidos y Sinergias**

### 1. 🔗 **[PENDIENTE] Configuración de la Integración LCo <-> LC (Panel Admin)**

    *   **Ubicación:** Nueva sección en el panel de admin "Configuración de Módulos" o sub-secciones en LCo/LC.
    *   **Parámetros Configurables por el `BUSINESS_ADMIN`:**
        *   **Acumulación de Puntos:**
            *   Interruptor: "Habilitar/Deshabilitar Acumulación de Puntos LCo desde Pedidos LC".
            *   Campo (opcional): "Ratio de Puntos Específico para Pedidos LC" (si es diferente de `Business.pointsPerEuro` global).
            *   (Informativo, no editable por admin) "Estado del Pedido LC que Otorga Puntos": Se fijará a `PAID`.
        *   **Canje de Recompensas/Beneficios LCo en LC (Avanzado):**
            *   Interruptor: "Habilitar/Deshabilitar Canje de Recompensas/Beneficios LCo en el Módulo Camarero".
            *   **Mapeo de Recompensas LCo:** UI para que el admin marque qué `Reward`s de LCo son "Canjeables en Módulo Camarero". Si la recompensa es tipo "Producto Gratis", permitir seleccionar el `MenuItem.id` (o categoría/tag) de LC al que corresponde.
            *   **Configuración de Beneficios de Nivel LCo:** UI para que el admin marque qué `TierBenefit`s (ej. descuentos porcentuales) son "Aplicables en Módulo Camarero" y si se aplican automáticamente o requieren una acción del cliente en la UI de LC.

### 2. 📊 **[PENDIENTE - POST-MVP LC COMPLETO E INTEGRACIÓN] Visión 360º del Cliente y Reportes Combinados**

    *   **Perfil de Cliente Unificado (Admin LCo - `AdminCustomerManagementPage`):**
        *   Al ver un cliente LCo, mostrar una nueva pestaña/sección "Actividad en Módulo Camarero":
            *   Resumen: Nº total de pedidos LC, gasto total LC, fecha último pedido LC.
            *   (Opcional) Lista de los N últimos pedidos LC con enlace a sus detalles (si se implementa un panel de admin para ver `Order`s individuales de LC).
    *   **Sincronización de Métricas Clave LCo:** `User.totalSpend` y `User.totalVisits` (LCo) se actualizarán no solo por QR LCo, sino también por `Order`s LC pagados y asociados al cliente.
    *   **Reportes de LCo Enriquecidos:**
        *   Posibilidad de segmentar/filtrar informes LCo (clientes valiosos, actividad de puntos) por origen de la actividad (QR LCo vs. Pedido LC).
        *   Análisis del impacto de LC en la progresión de niveles LCo.
    *   **Reportes de LC con Perspectiva LCo:**
        *   Informes de LC (ventas por ítem, ticket medio) podrían incluir: % de ventas de clientes LCo, distribución de ventas por nivel LCo, impacto de descuentos/recompensas LCo en totales LC.

### 3. 📢 **[PENDIENTE - POST-MVP LC COMPLETO E INTEGRACIÓN] Estrategias de Marketing y Promoción Cruzada Mejoradas**

    *   **Incentivos Dirigidos:** Crear Recompensas LCo específicas (ej. "Doble Puntos en tu primer pedido LC") o Beneficios de Nivel LCo atractivos para usar con LC.
    *   **Promoción de LCo dentro de la Experiencia LC:** Mensajes/banners configurables por el admin en `PublicMenuViewPage` para incentivar registro/login en LCo.
    *   **Campañas Segmentadas:** Usar datos combinados LCo+LC para enviar comunicaciones más efectivas.

### 4. ⚙️ **Operativa y Sincronización de Estados Clave (Flujo Backend - Consideraciones Importantes)**

    *   **Estado `PAID` en `Order` LC (CRUCIAL):** El mecanismo para marcar un `Order` LC como `PAID` (sea por camarero, TPV futuro, o pago online futuro) debe ser extremadamente robusto y preciso, ya que es el disparador principal para la integración con LCo.
        *   **Actualmente:** Esta funcionalidad depende de la implementación de la interfaz de camarero (Bloque B1 del `DEVELOPMENT_PLAN.md`).
    *   **Transaccionalidad en Canjes LCo en Pedidos LC:** Si se implementa el canje de recompensas/beneficios LCo en el flujo LC, la comunicación entre los servicios de LC y LCo para marcar la recompensa como canjeada y ajustar datos en LCo debe ser transaccional o, como mínimo, idempotente con mecanismos de reintento/compensación para asegurar la consistencia de datos entre módulos.
    *   **Consistencia de Datos del Cliente:** Si un cliente actualiza sus datos personales en LCo (a través de la futura `ProfileTab.tsx`), y ese cliente está asociado a `Order`s en LC, se debe considerar cómo se refleja esta información si se visualizan datos históricos de pedidos LC (los snapshots en `Order` y `OrderItem` son clave para esto).

---

**La Sinergia Estratégica:**

La integración de **LoyalPyME Camarero (LC)** con **LoyalPyME Core (LCo)** no es solo una suma de funcionalidades, sino una **multiplicación de valor** para el negocio y sus clientes. LC moderniza y agiliza la experiencia de servicio en el local, capturando datos de consumo y comportamiento detallados. LCo utiliza estos datos (y los datos de otras interacciones de fidelización) para construir programas de lealtad personalizados y efectivos que incentivan la recurrencia, aumentan el valor de vida del cliente y fortalecen la relación.

Esta combinación permitirá a los negocios:

- **Mejorar la satisfacción del cliente:** Con un servicio más rápido, personalizado, autónomo y con opciones de recompensa integradas y visibles.
- **Aumentar la frecuencia de visitas y el gasto promedio:** Mediante incentivos de lealtad contextuales (ej. "Gana puntos con este pedido") y la aplicación directa de beneficios en el punto de servicio.
- **Obtener una comprensión 360º del cliente:** Al unificar datos de servicio en el local (qué, cuándo y cómo piden) con datos de su actividad en el programa de fidelización (nivel, puntos, recompensas canjeadas, interacciones con QR).
- **Optimizar la operativa del personal:** El flujo digital reduce la carga de trabajo manual en la toma de pedidos (cliente), comunicación con cocina/barra (KDS), y (futuramente) aplicación de promociones de lealtad o cobros.
- **Diferenciarse de la competencia:** Ofreciendo una experiencia digital integrada, moderna, eficiente y que premia la fidelidad de forma transparente y atractiva.

El éxito de esta integración reside en una **comunicación lógica, robusta y potencialmente transaccional** entre los datos y procesos de ambos módulos. Esto implica una arquitectura backend bien diseñada (servicios cohesivos, posible uso de eventos o colas de mensajes para desacoplar procesos críticos como la asignación de puntos post-pago) y una presentación de una experiencia de usuario cohesiva y sin fricciones en el frontend.
