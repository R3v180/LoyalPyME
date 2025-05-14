# LoyalPyME Core: ¡Fidelidad que Premia tu Pasión por el Negocio! 💖🏆✨

Con **LoyalPyME Core**, transforma a tus clientes habituales en embajadores de tu marca. Ofrece un programa de lealtad digital, moderno y fácil de gestionar que incentiva la recurrencia, aumenta el ticket medio y te permite conocer mejor a quienes eligen tu negocio día a día.

---

## 👑 **I. El Viaje del Cliente VIP: Acumulando Beneficios y Sintiendo el Reconocimiento**

La experiencia del cliente con el programa de fidelización de LoyalPyME Core está diseñada para ser intuitiva, atractiva y gratificante.

### 1. ✍️ **Registro Sencillo y Vinculación al Negocio**

- **Múltiples Puntos de Entrada al Registro:**
  - **Desde la Plataforma General:** Si un cliente descubre LoyalPyME, puede registrarse y buscar/seleccionar el negocio específico al que desea unirse (si el negocio está listado públicamente en la plataforma).
  - **Invitación Directa del Negocio:** El negocio puede promocionar su programa de fidelización con un enlace directo o un código QR específico que lleve al cliente a una página de registro ya pre-seleccionada para ese negocio.
  - **(Integración con LC)** Durante el proceso de pedido en el Módulo Camarero, se le puede ofrecer la opción de registrarse para asociar su consumo y ganar puntos.
- **Proceso de Creación de Cuenta:**
  - El cliente completa un formulario simple con:
    - Email (será su identificador único).
    - Contraseña segura.
    - Nombre (opcional, pero recomendado para personalización).
    - Número de teléfono (para contacto y posibles futuras funcionalidades como notificaciones SMS).
    - Tipo y Número de Documento (DNI/NIE/Pasaporte, para evitar duplicados y para la gestión del negocio).
  - Si no vino de un enlace directo, selecciona el `Business` al que se une.
  - El rol asignado será `CUSTOMER_FINAL`.
- **Confirmación y Bienvenida:** Tras el registro, recibe una confirmación (y opcionalmente un email de bienvenida del negocio).

  ```
  Interfaz de Registro de Cliente (Ejemplo):
  +-------------------------------------------+
  | **Únete a [Nombre del Negocio] y Gana!**   |
  | O **Crea tu Cuenta LoyalPyME**            |
  |-------------------------------------------|
  | Email:         [ tu@email.com         ]  * |
  | Contraseña:    [ ••••••••••           ]  * |
  | Confirmar Cont.:[ ••••••••••           ]  * |
  | Nombre:        [ Tu Nombre Completo     ]    |
  | Teléfono:      [ +34 6XX XXX XXX      ]  * |
  | Documento:                                |
  |   Tipo: [ DNI/NIE/Pasaporte ▼ ]         * |
  |   Nº:   [ XXXXXXXXXL             ]  * |
  | Negocio (si aplica): [ [Negocio X] ▼ ]   * |
  |-------------------------------------------|
  |         [ Crear Mi Cuenta ]               |
  |                                           |
  |   ¿Ya tienes cuenta? [ Iniciar Sesión ]   |
  +-------------------------------------------+
  ```

### 2. 🚀 **Acceso a su Panel de Cliente Personalizado (`CustomerDashboardPage.tsx`)**

- **Login Seguro:** El cliente inicia sesión con su email y contraseña.
- **Dashboard Intuitivo:** Accede a su panel personal, que es el centro de control de su actividad y beneficios en el programa de fidelización del negocio.

  - **Pestañas Claras:**
    - **Resumen:** Vista general de su estado.
    - **Recompensas:** Catálogo de recompensas y regalos.
    - **Mi Actividad:** Historial detallado de transacciones.
    - **(Futuro) Ofertas y Noticias:** Comunicaciones del negocio.
    - **(Futuro) Mi Perfil:** Gestión de sus datos personales.

  ```
  Dashboard del Cliente - Pestaña Resumen (Ejemplo):
  +----------------------------------------------------+
  | Hola, [Nombre Cliente]! 👋  [Logo/Nombre Negocio]  |
  |----------------------------------------------------|
  | [Resumen] [Recompensas] [Actividad] [...]          |
  |====================================================|
  | **Puntos Actuales:**                               |
  |          # XXXX Puntos ✨                         |
  |----------------------------------------------------|
  | **Nivel Actual:** **[Nombre del Nivel]** 🏅          |
  |   [ Ver Beneficios de mi Nivel ]                   |
  |----------------------------------------------------|
  | **Progreso al Próximo Nivel: [Nombre Próximo Nivel]** |
  |   [|||||||||||||           ]  XX% Completado      |
  |   (Te faltan YY [métricas] para alcanzarlo)        |
  |   [ Ver Beneficios del Próximo Nivel ] (Popover)   |
  |----------------------------------------------------|
  | **Recompensas y Regalos Destacados:**              |
  |   [ Grid con algunas recompensas/regalos ]         |
  |   [ Ver Todas las Recompensas y Regalos ]          |
  |----------------------------------------------------|
  | **Validar Código QR / Ticket:**                    |
  |   [____________________] [Validar] [📷 Escanear]   |
  |----------------------------------------------------|
  | (Opcional) **Tarjeta de Acceso al Módulo Camarero** |
  |   [ Botón para ir a /m/{slugDelNegocio} ]          |
  +----------------------------------------------------+
  ```

### 3. 💰 **Acumulación de Puntos (`QrValidationSection.tsx`)**

- **Proceso en el Punto de Venta Físico (para negocios sin LC o para compras no hechas vía LC):**
  - Tras realizar una compra o consumir un servicio, el `BUSINESS_ADMIN` o personal autorizado del negocio genera un **código QR único** (o un token alfanumérico) desde su panel de LoyalPyME.
  - Este QR/token está asociado al **importe de la transacción** y a un **número de ticket/factura** para referencia.
- **Validación por el Cliente en su Dashboard LCo:**
  - El cliente accede a la sección "Validar QR" en su panel.
  - **Opción 1: Escaneo con Cámara:** Si accede desde un dispositivo móvil con cámara, puede usar la función "Escanear QR" para capturar el código directamente.
  - **Opción 2: Introducción Manual:** Puede teclear el token alfanumérico del QR o del ticket en el campo provisto.
- **Resultado:**
  - El sistema valida el token (que no haya sido usado, que no haya expirado, que pertenezca al negocio correcto).
  - Si es válido, se calculan los puntos a otorgar (basado en `Business.pointsPerEuro` y el importe del QR).
  - Los puntos se suman al saldo del cliente.
  - Se registra una entrada en su `ActivityLog` (ej. "Puntos Ganados (QR) - Ticket #12345: +50 Puntos").
  - Esta transacción (gasto y visita) contribuye al cálculo para subir de nivel.
- **(Integración con LC)** Si el cliente está logueado y realiza un pedido a través del Módulo Camarero que es posteriormente marcado como pagado, los puntos se pueden sumar automáticamente (ver `MODULE_INTEGRATION_WORKFLOW.md`).

### 4. 📈 **Ascenso de Nivel y Desbloqueo de Beneficios (`UserInfoDisplay.tsx`, `TierBenefitsDisplay.tsx`)**

- **Sistema de Niveles Progresivo:** Los negocios configuran múltiples niveles de lealtad (ej. Bronce, Plata, Oro, Platino), cada uno requiriendo alcanzar un umbral mayor de la métrica definida (gasto, visitas, o puntos acumulados históricamente).
- **Cálculo de Nivel:**
  - El sistema recalcula periódicamente (o tras cada actividad relevante) el nivel del cliente basado en la configuración del negocio:
    - `TierCalculationBasis`: SPEND, VISITS, POINTS_EARNED.
    - `TierCalculationPeriodMonths`: 0 para métricas de por vida, o un número de meses para un periodo móvil.
  - Cuando el cliente alcanza el `minValue` de un nuevo nivel, su `currentTierId` se actualiza.
- **Visualización del Progreso:**
  - El cliente ve claramente en su dashboard su nivel actual y una barra de progreso hacia el siguiente nivel, indicando cuánto le falta.
  - Puede ver los beneficios asociados a su nivel actual y los del siguiente nivel (como incentivo).
- **Beneficios Exclusivos por Nivel (`TierBenefitData`):**
  - **Multiplicador de Puntos:** (ej. "Nivel Oro: Gana Puntos x1.5").
  - **Acceso a Recompensas Exclusivas:** Recompensas que solo están visibles o canjeables para clientes de cierto nivel.
  - **Beneficios Personalizados:** Textos descriptivos de otras ventajas (ej. "Envío Gratis", "Regalo de Cumpleaños", "Acceso Preferente a Eventos").
- **Política de Descenso:** Según la configure el negocio (`TierDowngradePolicy`), el cliente podría bajar de nivel si no mantiene la actividad requerida o tras una revisión periódica.

### 5. 🎁 **Canje de Recompensas y Regalos (`RewardsTab.tsx`, `RewardList.tsx`)**

- **Catálogo de Recompensas:**
  - En la pestaña "Recompensas" del dashboard, el cliente visualiza todas las recompensas `isActive: true` que el negocio ha configurado para ser canjeadas con puntos.
  - Cada recompensa muestra su nombre (i18n), descripción (i18n), imagen y el `pointsCost` necesario.
- **Regalos Otorgados:**
  - En la misma sección (o una subsección), el cliente ve los `GrantedReward` con estado `PENDING` que el administrador del negocio le ha asignado directamente (sin coste de puntos).
  - Se muestra quién lo asignó (si es admin) y la fecha de asignación.
- **Proceso de Canje:**
  - **Recompensas por Puntos:** Si el cliente tiene suficientes puntos, el botón "Canjear Recompensa" está activo. Al pulsarlo:
    - Se descuentan los `pointsCost` del saldo del cliente.
    - Se crea un registro en `ActivityLog` (ej. "Recompensa Canjeada - Café Gratis: -50 Puntos").
    - El negocio define cómo se materializa el canje (ej. mostrar un código al personal, envío automático de un cupón digital, etc.).
  - **Regalos:** El cliente pulsa "Canjear Regalo".
    - El `GrantedReward` cambia su estado a `REDEEMED` y se registra `redeemedAt`.
    - Se crea un registro en `ActivityLog` (ej. "Regalo Canjeado - Descuento Bienvenida").
- **Notificaciones:** Se informa al cliente del éxito del canje.

### 6. 📜 **Consulta de Historial de Actividad (`ActivityTab.tsx`)**

- El cliente puede ver un listado paginado y cronológico de todas las transacciones de puntos y canjes:
  - `POINTS_EARNED_QR`: Puntos sumados por validar un QR (con descripción del ticket).
  - `POINTS_REDEEMED_REWARD`: Puntos restados por canjear una recompensa (con nombre de la recompensa).
  - `GIFT_REDEEMED`: Regalo canjeado (con nombre de la recompensa/regalo).
  - `POINTS_ADJUSTED_ADMIN`: Ajustes manuales de puntos hechos por el admin (con motivo si lo hay).
  - **(Futuro)** `POINTS_EARNED_ORDER_LC`: Puntos ganados por pedidos en el Módulo Camarero.

### 7. 👤 **Gestión de Perfil (Futuro - `ProfileTab.tsx`)**

- Visualizar y editar sus datos personales (nombre, teléfono, email).
- Cambiar contraseña.
- (Opcional) Subir una foto de perfil.
- Gestionar preferencias de comunicación.

---

## 🛠️ **II. La Visión del Negocio: Administrando la Lealtad con Estrategia y Facilidad (`BUSINESS_ADMIN`)**

El panel de administración de LoyalPyME Core proporciona al `BUSINESS_ADMIN` todas las herramientas para diseñar, implementar y gestionar su programa de fidelización.

### 1. ⚙️ **Configuración General del Sistema de Tiers (`TierSettingsPage.tsx`)**

- **Habilitación del Sistema:** Activar o desactivar completamente el sistema de niveles. Si está desactivado, los clientes no progresan por niveles ni obtienen beneficios de tier.
- **Base de Cálculo de Nivel (`TierCalculationBasis`):**
  - `SPEND`: El nivel se determina por el gasto total acumulado del cliente (suma de los `amount` de los `QrCode` validados).
  - `VISITS`: El nivel se determina por el número total de visitas (cada `QrCode` validado cuenta como una visita).
  - `POINTS_EARNED`: El nivel se determina por el total histórico de puntos ganados por el cliente (sin contar los gastados).
- **Periodo de Cálculo de Nivel (`tierCalculationPeriodMonths`):**
  - Número de meses hacia atrás desde la fecha actual para considerar las métricas (gasto, visitas, puntos).
  - Si es `0` o `null`, se consideran las métricas de toda la vida del cliente en el programa.
- **Política de Descenso de Nivel (`TierDowngradePolicy`):**
  - `NEVER`: Los clientes nunca bajan de nivel una vez alcanzado.
  - `PERIODIC_REVIEW`: El sistema revisa periódicamente (ej. en un cron job `processTierUpdatesAndDowngrades`) si los clientes aún cumplen los requisitos de su nivel actual según el `tierCalculationBasis` y `tierCalculationPeriodMonths`. Si no, bajan al nivel que les corresponda (o a ninguno).
  - `AFTER_INACTIVITY`: Los clientes bajan a ningún nivel (o al nivel base) si no tienen actividad (`QrCode` validado o, futuramente, pedido LC) durante un periodo específico.
- **Periodo de Inactividad para Descenso (`inactivityPeriodMonths`):**
  - Número de meses de inactividad para aplicar la política `AFTER_INACTIVITY`.

### 2. 🌟 **Gestión de Niveles de Fidelización (Tiers) (`TierManagementPage.tsx`)**

- **Creación de Niveles (`CreateTierModal.tsx`):**
  - **Nombre del Nivel:** Identificador del nivel (ej. "Bronce", "Miembro VIP").
  - **Nivel (Orden):** Un número entero (`level`, ej. 0, 1, 2...) que determina el orden jerárquico. Niveles más altos suelen requerir más. El nivel 0 puede ser el base sin requisitos.
  - **Valor Mínimo (`minValue`):** El umbral de la métrica (definida en `TierCalculationBasis`) que el cliente debe alcanzar para pertenecer a este nivel.
  - **Descripción (Opcional):** Texto interno para el admin.
  - **Resumen de Beneficios (Opcional - `benefitsDescription`):** Un texto corto que se muestra al cliente para resumir las ventajas del nivel.
  - **Estado Activo (`isActive`):** Solo los niveles activos son considerados para la asignación a clientes y visibles para ellos.
- **Edición y Listado de Niveles (`EditTierModal.tsx`, `TierTable.tsx`):** Modificar cualquiera de los campos anteriores. Ver todos los niveles definidos.
- **Eliminación de Niveles:** Se puede eliminar un nivel si no tiene clientes actualmente asignados a él.
- **Gestión de Beneficios por Nivel (`TierBenefitsModal.tsx`, `AddTierBenefitForm.tsx`):**
  - Para cada `Tier` creado, se pueden añadir múltiples `TierBenefit`.
  - **Tipo de Beneficio (`BenefitType`):**
    - `POINTS_MULTIPLIER`: Ej. "1.5" (el cliente gana 1.5 veces los puntos normales).
    - `EXCLUSIVE_REWARD_ACCESS`: El `value` sería el ID de una `Reward` específica que solo los miembros de este tier pueden ver/canjear.
    - `CUSTOM_BENEFIT`: Un texto descriptivo para cualquier otro beneficio (ej. "Acceso prioritario a rebajas", "Bebida de cortesía al mes").
  - **Valor del Beneficio (`value`):** El valor asociado al tipo (el multiplicador, el ID de la recompensa, el texto del beneficio).
  - **Descripción del Beneficio (Opcional):** Más detalles sobre el beneficio.
  - **Estado Activo del Beneficio:** Un beneficio puede estar temporalmente inactivo sin eliminarlo del tier.

### 3. 🎁 **Gestión de Recompensas Canjeables (`AdminRewardsManagement.tsx`, `RewardForm.tsx`)**

- **Creación de Recompensas:**
  - **Nombre (ES y EN):** Para internacionalización.
  - **Descripción (ES y EN, Opcional):** Detalles sobre la recompensa.
  - **Coste en Puntos (`pointsCost`):** Cuántos puntos necesita el cliente para canjearla.
  - **Imagen:** Subida de imagen (Cloudinary) para hacerla visualmente atractiva.
  - **Estado Activo (`isActive`):** Solo las recompensas activas son visibles y canjeables por los clientes.
- **Listado, Edición y Eliminación:** Gestionar el catálogo de recompensas. Una recompensa no se puede eliminar si ha sido otorgada como regalo (`GrantedReward`) y está pendiente, o si hay registros de canje asociados (dependiendo de las restricciones de BD).

### 4. 👥 **Administración Avanzada de Clientes (`AdminCustomerManagementPage.tsx` y Modales Asociados)**

- **Listado y Filtros:**
  - Ver una tabla paginada de todos los clientes (`CUSTOMER_FINAL`) del negocio.
  - Buscar por nombre o email.
  - Filtrar por estado (Activo/Inactivo), si es Favorito, o por Nivel actual.
  - Ordenar por diversas columnas (nombre, puntos, fecha de registro, etc.).
- **Acciones sobre Clientes Individuales:**
  - **Ver Detalles (`CustomerDetailsModal.tsx`):** Acceder a una vista completa del perfil del cliente, incluyendo puntos, nivel, fecha de consecución del nivel, historial de actividad reciente (opcional), y notas administrativas.
  - **Editar Notas Administrativas:** Añadir/modificar comentarios internos sobre un cliente, visibles solo para los administradores.
  - **Ajustar Puntos Manualmente (`AdjustPointsModal.tsx`):** Sumar o restar puntos al saldo de un cliente, con un campo opcional para indicar el motivo (ej. "Bonificación por cumpleaños", "Corrección de error"). Esta acción genera un `ActivityLog`.
  - **Cambiar Nivel Manualmente (`ChangeTierModal.tsx`):** Forzar la asignación de un cliente a un nivel específico, o quitarle el nivel (volver a básico). Esto sobrescribe el cálculo automático para esa instancia. `tierAchievedAt` se actualiza.
  - **Asignar Recompensa como Regalo (`AssignRewardModal.tsx`):** Otorgar una recompensa del catálogo al cliente sin que este gaste puntos. Se crea un registro `GrantedReward` con estado `PENDING`.
  - **Marcar/Desmarcar como Favorito:** Para destacar clientes importantes.
  - **Activar/Desactivar Cuenta de Cliente:** Un cliente inactivo no puede loguearse ni acumular/canjear puntos.
- **Acciones Masivas sobre Clientes Seleccionados:**
  - Activar/Desactivar múltiples clientes a la vez.
  - Eliminar múltiples clientes (con precaución y validaciones si tienen datos asociados).
  - Ajustar puntos (sumar/restar la misma cantidad) a un grupo de clientes, con un motivo general.

### 5. 🎟️ **Generación de QR de Puntos para Transacciones (`AdminGenerateQr.tsx`)**

- **Interfaz Simple:** El admin introduce:
  - **Importe de la Venta (€):** El valor de la compra que el cliente acaba de realizar.
  - **Número de Ticket/Referencia:** Un identificador único para esa transacción (para evitar duplicados y para auditoría).
- **Generación:** El sistema crea un registro `QrCode` en la BD con:
  - Un `token` UUID único.
  - El `businessId`.
  - El `amount` y `ticketNumber` introducidos.
  - Una `expiresAt` (ej. 30 minutos) para limitar su validez.
  - Estado inicial `PENDING`.
- **Visualización:** Se muestra el código QR (generado a partir del `token`) en pantalla para que el cliente lo escanee, o se muestra el `token` alfanumérico para que el cliente lo introduzca manualmente.

### 6. 📊 **Visualización de Estadísticas del Programa de Fidelización (`AdminOverview.tsx`)**

- **Panel Resumen:**
  - Total de clientes activos.
  - Nuevos clientes registrados en los últimos 7 días (y comparación con los 7 días anteriores).
  - Total de puntos emitidos (vía QR) en los últimos 7 días (y comparación).
  - Total de recompensas canjeadas (por puntos y regalos) en los últimos 7 días (y comparación).
- **(Futuro)** Gráficos de evolución, distribución de clientes por nivel, recompensas más populares, etc.

---

**LoyalPyME Core** es la base para construir relaciones a largo plazo, entender el comportamiento de tus clientes y recompensar su preferencia de una manera medible y efectiva.

---
