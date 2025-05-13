LoyalPyME: ¡Fidelización y Servicio, Perfectamente Unidos! 🤝🌟🍽️

Cuando un negocio decide activar tanto LoyalPyME Core (LCo) para la fidelización, como LoyalPyME Camarero (LC) para la operativa de servicio, la experiencia para el cliente y la gestión para el administrador se vuelven aún más potentes y fluidas. Descubre cómo estos dos módulos trabajan juntos.
🔗 El Cliente Conectado: Pedidos que Suman, Beneficios que se Sienten

Para un cliente que interactúa con un negocio que tiene ambos módulos activos, la experiencia es la siguiente:

1.  📱 Acceso a la Carta LC con Opciones LCo Integradas

    El cliente escanea el QR de la mesa y accede a la carta digital del Módulo Camarero (LC) como de costumbre (/m/:businessSlug/:tableIdentifier).

    ¡La Novedad! Dentro de la interfaz de la carta o al revisar el carrito, se le presentan opciones para:

        Iniciar Sesión: Si ya tiene una cuenta LoyalPyME con ese negocio.

        Registrarse: Si es nuevo y quiere empezar a acumular beneficios.



    Interfaz de Carta/Carrito (LC) con Integración LCo:
    +------------------------------------------------+
    | ... (Ítems del pedido, total) ... |
    |------------------------------------------------|
    | ⭐ **¿Ya eres parte de nuestro club?** |
    | [ Iniciar Sesión ] para ganar puntos |
    | y disfrutar de beneficios exclusivos. |
    | |
    | ¿Nuevo por aquí? [ Regístrate Ahora ] |
    +------------------------------------------------+

    IGNORE_WHEN_COPYING_START

    Use code with caution.
    IGNORE_WHEN_COPYING_END

2.  👤 Identificación para Beneficios (Login/Registro)

    Flujo Sencillo: Al pulsar "Iniciar Sesión" o "Registrarse", se le puede presentar un modal o ser redirigido brevemente a las páginas de login/registro estándar de LCo.

    Retorno Automático: Una vez completado el login/registro, se le devuelve a la carta o al carrito del Módulo Camarero, ahora con su sesión LCo activa.

    El customerId se almacena en el frontend para ser enviado con el pedido.

3.  🛒 Pedido LC y Acumulación Automática de Puntos LCo

    El cliente finaliza su pedido en el Módulo Camarero (LC) como se describe en LOYALPYME_CAMARERO_WORKFLOW.md.

    Al Enviar el Pedido:

        Si el cliente se identificó (paso 2), el customerId se incluye en el payload del pedido (POST /public/order/:businessSlug).

        El backend asocia este pedido LC con el cliente LCo.

    Acumulación de Puntos (Lógica Backend Post-MVP LC):

        Una vez que el pedido LC se marca como pagado (esta funcionalidad de "pago" es parte de las funcionalidades avanzadas de LC o se gestiona externamente por el negocio en el MVP):

            El sistema automáticamente calcula los puntos LCo que el cliente ha ganado, basándose en el totalAmount del pedido LC y la configuración de pointsPerEuro del negocio.

            Se crea un registro en el ActivityLog del cliente (LCo) indicando "Puntos Ganados (Pedido Camarero #XXX)".

            El saldo de puntos del cliente en LCo se actualiza.

            Se considera esta interacción para el cálculo de su nivel LCo (gasto, visita).

4.  🌟 Uso de Beneficios LCo en Pedidos LC (Funcionalidad Avanzada Futura)

    Descuentos de Nivel: Si el cliente tiene un nivel LCo que otorga un descuento (ej. "10% de Descuento Nivel Oro"), este descuento podría aplicarse automáticamente al total del pedido LC antes del pago.

    Canje de Recompensas LCo como Ítems del Pedido LC:

        El cliente podría tener la opción en el carrito LC de "Usar mis recompensas LCo".

        Se le mostrarían sus recompensas LCo canjeables (ej. "Café Gratis", "Postre de la Casa").

        Si selecciona una, esa recompensa se añade al pedido LC (potencialmente con precio €0.00) y se marca como canjeada en LCo (descontando puntos si es una recompensa por puntos, o marcando como usado un regalo).

        Esto requiere una coordinación más profunda entre los DTOs de pedido y los modelos de recompensa.

5.  📜 Historial Unificado (Visión Cliente)

    En el dashboard de LCo del cliente (/customer/dashboard), en la pestaña "Mi Actividad", el cliente vería:

        Puntos ganados por pedidos realizados a través del Módulo Camarero.

        Recompensas LCo canjeadas, incluso si se aplicaron en un pedido LC.

⚙️ La Visión del Negocio: Gestión Integrada

Para el BUSINESS_ADMIN, tener ambos módulos activos y comunicándose ofrece:

1. 🔗 Configuración de la Integración

   Puntos por Pedido LC: En la configuración de LCo, definir claramente si los pedidos del Módulo Camarero generan puntos y bajo qué reglas (similar al pointsPerEuro actual, pero específico para pedidos LC si se desea diferenciar).

   Visibilidad de Recompensas LCo en LC: (Futuro) Configurar qué recompensas de LCo pueden ser "canjeadas" o aplicadas directamente en el flujo de pedido de LC.

2. 📊 Visión 360º del Cliente

   Al ver los detalles de un cliente en el panel de admin de LCo, el BUSINESS_ADMIN podría ver no solo su actividad de puntos tradicional, sino también un resumen o enlace a sus pedidos realizados a través del Módulo Camarero.

   Las métricas de gasto y visitas de LCo se nutren automáticamente de la actividad en LC.

3. 📢 Marketing y Promociones Cruzadas

   Crear recompensas LCo que incentiven el uso del Módulo Camarero (ej. "Puntos extra en tu primer pedido desde la mesa").

   Comunicar beneficios de LCo dentro de la interfaz de LC para fomentar el registro/login.

La Sinergia Clave:

LoyalPyME Camarero (LC) facilita la transacción y mejora la experiencia en el local, mientras que LoyalPyME Core (LCo) incentiva la recurrencia y premia la lealtad generada por esas transacciones. Juntos, crean un ciclo virtuoso que beneficia tanto al cliente como al negocio.
