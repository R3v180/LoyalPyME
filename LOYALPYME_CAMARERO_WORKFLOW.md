# LoyalPyME Camarero: ¡Tu Experiencia Gastronómica, Digitalizada y Eficiente! 🧑‍🍳📱✨

**Última Actualización:** 28 de Mayo de 2025 (Refleja KDS con acciones de estado funcionales y detalla el próximo flujo de camarero para recogida y servicio)

Bienvenido a la experiencia moderna de pedir y disfrutar en tu establecimiento favorito con **LoyalPyME Camarero**. Diseñado para agilizar el servicio, personalizar tu pedido y mejorar la comunicación, todo directamente desde tu móvil o gestionado eficientemente por el personal del restaurante.

---

## 🚀 **I. El Viaje del Cliente Final: Control y Comodidad en Tu Mano**

Este flujo describe la experiencia del cliente desde su llegada hasta la visualización del estado de su pedido, que ahora puede ser actualizado por el personal de cocina/barra.

### 1. 📲 **Llegada y Escaneo Mágico del QR de Mesa**

    *   **Bienvenida:** Al llegar, el cliente encuentra un código QR único en su mesa (`tableIdentifier`).
    *   **Escaneo Instantáneo:** Usando la cámara de su smartphone, el QR lo redirige a `https://[tuDominio.com]/m/[businessSlug]/[tableIdentifier]`.
    *   _(Sin cambios funcionales en este paso, pero es el inicio del flujo LC)._

### 2. 🧾 **Explora la Carta Digital Interactiva (`PublicMenuViewPage.tsx`)**

    *   **Acceso Inmediato:** Carga la carta digital del negocio.
    *   **Verificación de Pedido Activo:**
        *   Al cargar, el sistema revisa `localStorage` para `activeOrderInfo_BUSINESSSLUG_TABLEIDENTIFIER`.
        *   **Si existe un pedido activo (`activeOrderIdForTable`, `activeOrderNumberForTable`):**
            *   La UI muestra: "Tienes el pedido #{{orderNumber}} en curso para esta mesa."
            *   Opciones: "Ver Estado del Pedido" (enlaza a `/order-status/:activeOrderId`), **"Añadir más Ítems a este Pedido" (FUNCIONALIDAD PENDIENTE)**, **"Empezar un Nuevo Pedido Separado" (FUNCIONALIDAD PENDIENTE)**.
            *   El carrito para "nuevo pedido" está oculto/deshabilitado.
        *   **Si NO existe pedido activo:** La página funciona en modo "crear nuevo pedido".
    *   **Navegación y Detalle del Ítem (`MenuItemCard.tsx`):** Categorías en acordeón, ítems con fotos, descripciones i18n, precios, alérgenos, tags.
    *   _(Funcionalidad completada y estable)._

### 3. 🎨 **Personaliza tu Plato (`MenuItemCard.tsx`, `ModifierGroupInteractiveRenderer.tsx`)**

    *   Selección de ítems, configuración de modificadores (RADIO/CHECKBOX) con precios dinámicos y validación de reglas (`minSelections`, `maxSelections`, `isRequired`).
    *   Ajuste de cantidad y notas específicas del ítem.
    *   _(Funcionalidad completada y estable)._

### 4. 🛒 **Tu Carrito de Pedido (`ShoppingCartModal.tsx`)**

    *   Acumulación de ítems en `currentOrderItems` (estado local en `PublicMenuViewPage.tsx`), persistido en `localStorage` (si no hay pedido activo).
    *   Modal para revisar ítems, modificar cantidad, eliminar, añadir notas generales (`orderNotes` persistidas), vaciar carrito. Muestra total dinámico.
    *   _(Funcionalidad completada y estable)._

### 5. ⭐ **Opcional: Identifícate para Beneficios LCo**

    *   Si el cliente inicia sesión con su cuenta LoyalPyME Core, su `customerId` se asociará al `Order` al enviarlo, permitiendo la futura acumulación de puntos y aplicación de beneficios LCo.
    *   _(Integración básica de `customerId` en `Order` completada; acumulación automática de puntos y canje de beneficios en LC son funcionalidades LCo-LC futuras)._

### 6. ➡️ **Envía tu Pedido (`handleSubmitOrder` en `PublicMenuViewPage.tsx`)**

    *   **Payload:** `CreateOrderPayloadDto` (con `items`, `orderNotes`, `tableIdentifier`, `customerId?`).
    *   **Endpoint:** `POST /public/order/:businessSlug`.
    *   **Backend:** Valida, calcula precios, crea `Order` (estado `RECEIVED`), `OrderItem`s (estado `PENDING_KDS`), `OrderItemModifierOption`s. Devuelve el `Order` creado.
    *   **Frontend Post-Envío:**
        *   Notificación de éxito (con `orderNumber`).
        *   Guarda `{ orderId, orderNumber, savedAt }` como `activeOrderInfo` en `localStorage`.
        *   Limpia `currentOrderItems` y `orderNotes` del `localStorage`.
        *   Redirige a `/order-status/:orderId` (pasando `orderNumber`, `businessSlug`, `tableIdentifier` en el `state` de la ruta).
    *   _(Funcionalidad completada y estable)._

### 7. ⏳ **Página de Estado del Pedido (`OrderStatusPage.tsx`)**

    *   **Acceso:** Vía `/order-status/:orderId`. Lee `orderId` de URL y datos del `state`.
    *   **Visualización:** Muestra `orderNumber`, estado general del `Order` (`orderStatus`), identificador de mesa, notas generales, y una lista de `OrderItem`s con su nombre (snapshot), cantidad y estado individual (`OrderItemStatus`).
    *   **Polling Automático:** Refresca datos llamando a `GET /public/order/:orderId/status` cada ~10 segundos.
    *   **Lógica de Pedido Finalizado:**
        *   Si `orderStatus` es `PAID` o `CANCELLED`, el polling se detiene.
        *   Se muestra mensaje "Pedido finalizado".
        *   Botón "Actualizar" cambia a "Empezar Nuevo Pedido en esta Mesa". Al pulsar: limpia `activeOrderInfo_...`, `loyalpyme_public_cart_...`, `loyalpyme_public_order_notes_...` de `localStorage` para la mesa/negocio actual, y redirige a `/m/:businessSlug/:tableIdentifier`.
    *   **Botones de Acción (si el pedido NO es final):**
        *   "Actualizar Estado Manualmente": Llama a `GET /public/order/:orderId/status`.
        *   "Volver al Menú": Enlaza a `/m/:businessSlug/:tableIdentifier`. La `PublicMenuViewPage` detectará el `activeOrderInfo` y mostrará el aviso de pedido en curso. **(Futuro: este botón podría cambiar a "Añadir más Ítems" si se implementa esa funcionalidad).**
    *   _(Funcionalidad completada y estable para visualización y finalización básica. La visualización de ítems `SERVED` y estado `COMPLETED` dependerá del flujo de camarero)._

### 8. ➕ **[PENDIENTE] Añadir Ítems a un Pedido Existente (Cliente)**

    *   **Flujo:** Desde `PublicMenuViewPage.tsx` (si hay un pedido activo no final) o desde `OrderStatusPage.tsx` (si el pedido no es final), el cliente podrá acceder a la carta para añadir nuevos ítems al `activeOrderIdForTable`.
    *   **Backend:** Requerirá el endpoint `POST /public/order/:existingOrderId/add-items`.
    *   _(Tarea B2.2 del `DEVELOPMENT_PLAN.md`)._

### 9. 🙋 **[PENDIENTE] Interacciones Adicionales Durante la Estancia (Cliente)**

    *   Desde `PublicMenuViewPage` o `OrderStatusPage`:
        *   **"Llamar Camarero":** Notifica al personal de sala.
        *   **"Pedir la Cuenta":** Notifica al camarero, opcionalmente con preferencias de pago.
        *   **"Solicitar Cancelación de Ítem":** Si el ítem está `PENDING_KDS` o `PREPARING` (temprano). Envía solicitud al KDS para aprobación.
    *   _(Tareas B3.1 y B3.5 del `DEVELOPMENT_PLAN.md`)._

### 10. 💸 **[PENDIENTE] Proceso de Pago y Cierre de Sesión de Mesa**

    *   Cliente solicita cuenta o camarero la presenta.
    *   Pago gestionado por camarero/TPV (fuera del sistema MVP inicial o mediante futura integración TPV/Pago Online).
    *   Camarero (o sistema TPV) marca el/los `Order`(s) como `PAID`.
    *   `OrderStatusPage` del cliente refleja estado `PAID`, polling se detiene, se ofrece empezar nuevo pedido (limpiando `localStorage`).
    *   Si cliente se identificó con LCo, el estado `PAID` del `Order` dispara asignación de puntos (Integración LCo-LC futura).

---

## 👨‍🍳 **II. Flujo del Personal de Cocina/Barra (KDS - Kitchen Display System) - [FUNCIONALIDAD BASE COMPLETADA CON ACCIONES]**

El KDS (`KitchenDisplayPage.tsx`) es el panel de control digital para la preparación eficiente y coordinada de los pedidos. Accesible por roles `KITCHEN_STAFF`, `BAR_STAFF`, `BUSINESS_ADMIN` en `/admin/kds`.

### 1. 🖥️ **Acceso y Visualización de Comandas/Ítems**

    *   **Autenticación:** Login estándar de usuario.
    *   **Selección de Destino:** `SegmentedControl` para elegir el `kdsDestination` a visualizar (ej. "COCINA", "BARRA").
    *   **Cola de `OrderItem`s:**
        *   Se obtienen mediante `GET /api/camarero/kds/items` filtrando por el `kdsDestination` seleccionado y los estados `PENDING_KDS` y `PREPARING`.
        *   Ordenados por `Order.createdAt` (más antiguos primero).
    *   **Tarjeta de `OrderItem` Detallada:**
        *   Muestra claramente: `orderNumber`, `table.identifier` (si aplica), hora del pedido.
        *   Nombre del ítem (`menuItemNameSnapshot_es/en`), cantidad.
        *   Lista de modificadores seleccionados (nombres i18n).
        *   Notas del ítem (si las hay).
        *   Estado actual del `OrderItem` (ej. "Recibido en cocina", "En preparación") con un `Badge` coloreado.
    *   **Refresco Automático:** La lista se actualiza mediante polling (cada ~15s). El polling se pausa durante una acción de actualización de estado. Botón de refresco manual disponible.

### 2. 🔄 **Gestión del Estado de Preparación de Ítems (`PATCH /api/camarero/kds/items/:orderItemId/status`)**

    *   **Botones de Acción en cada Tarjeta de `OrderItem`:**
        *   **Si `OrderItem.status` es `PENDING_KDS`:**
            *   Botón "Empezar Preparación": Llama al PATCH endpoint para cambiar `OrderItem.status` a `PREPARING`.
            *   Botón "Cancelar Ítem": Llama al PATCH endpoint para cambiar `OrderItem.status` a `CANCELLED`.
        *   **Si `OrderItem.status` es `PREPARING`:**
            *   Botón "Marcar como Listo": Llama al PATCH endpoint para cambiar `OrderItem.status` a `READY`.
            *   Botón "Cancelar Ítem": Llama al PATCH endpoint para cambiar `OrderItem.status` a `CANCELLED`.
            *   (Opcional futuro: Botón "Volver a Pendiente" si se inició por error).
    *   **Feedback:** Estado de carga en el botón presionado. Notificaciones Mantine de éxito/error.
    *   **Actualización de UI:** Tras una acción exitosa, la lista de ítems se refresca (actualmente vía `fetchKdsItems`). El ítem actualizado cambiará su `Badge` de estado o desaparecerá si su nuevo estado ya no coincide con los filtros del KDS (ej. si pasa a `READY` y el KDS solo muestra `PENDING_KDS` y `PREPARING`).
    *   **Impacto en `Order.status` (Backend):** El servicio backend (`kds.service.ts`) actualiza el `Order.status` general (`RECEIVED` -> `IN_PROGRESS` -> `PARTIALLY_READY` -> `ALL_ITEMS_READY`) de forma consistente y validada.

### 3. ⏱️ **[PENDIENTE - KDS AVANZADO] Gestión de Tiempos y Alertas (Tarea B2.KDS1)**

    *   Mostrar `preparationTime` del `MenuItem` en la tarjeta.
    *   Iniciar temporizador visible cuando un ítem pasa a `PREPARING`.
    *   Alertas visuales/sonoras si se excede `preparationTime`.

### 4. 📦 **[PENDIENTE - KDS AVANZADO] Agrupación por Cursos y Sincronización de "Pases" (Tarea B2.KDS1)**

    *   **Objetivo:** Coordinar la preparación y entrega de platos por cursos (entrantes, principales, postres).
    *   **Backend:** `MenuItem` necesita un campo `course` (o usar `tags`). API de KDS debe incluir esta info.
    *   **KDS Frontend:** Agrupar visualmente ítems por curso. Lógica para que el KDS pueda "lanzar" la preparación de un curso y notificar "Pase Listo" a la interfaz de camarero.

### 5. 🚫 **[PENDIENTE - KDS AVANZADO] Gestión de Incidencias**

    *   **Rechazar Ítem:** Si un ítem no se puede preparar, KDS lo marca (ej. `REJECTED`) y notifica al camarero/cliente.
    *   **Gestión de Solicitudes de Cancelación de Cliente (Tarea B3.4):** KDS ve `OrderItem.status = CANCELLATION_REQUESTED`. Puede "Aceptar" (`CANCELLED`) o "Rechazar" (revierte estado). Notifica al cliente.

---

## 🤵 **III. Flujo del Personal de Sala/Camareros (Interfaz de Camarero) - [BLOQUE DE DESARROLLO ACTUAL]**

Esta sección describe la funcionalidad **pendiente de implementar** para el rol `WAITER`.

### 1. 🔑 **[PENDIENTE] Acceso y Vista General (Interfaz Camarero)**

    *   **Autenticación:** Login estándar para `UserRole.WAITER` (email/password) o futuro login rápido con `StaffPin`.
    *   **Panel Principal (`WaiterDashboardPage.tsx` o similar):**
        *   **Notificaciones Activas:**
            *   **"Ítems/Pases Listos para Recoger" del KDS (Prioridad Actual - Tarea B1.1, B1.2):** Lista de `OrderItem`s que están en estado `READY`.
            *   (Futuro) Llamadas de mesa desde cliente (con motivo).
            *   (Futuro) Solicitudes de cuenta desde cliente (con preferencias de pago).
        *   **(Futuro - Gestión de Mesas) Vista de Mesas:** Lista/cuadrícula de `Table`s del negocio con su estado (`identifier`, "Libre", "Ocupada", "Pedido Activo", "Cuenta Solicitada", "Necesita Limpieza").

### 2. 🛎️ **[PENDIENTE] Recepción y Gestión de Notificaciones (Interfaz Camarero)**

    *   **Actualización "Ítems Listos":** La lista de ítems listos para recoger se actualizará mediante polling o un botón de refresco (MVP). (Futuro: SSE/WebSockets para tiempo real).
    *   **(Futuro) Notificaciones de Llamada/Cuenta:** Alertas visuales/sonoras para nuevas solicitudes de clientes.

### 3. 🍽️ **[PENDIENTE - PRIORIDAD ACTUAL] Recogida y Entrega de Pedidos (Interfaz Camarero - Tarea B1.1, B1.2)**

    *   **Visualización:** El camarero ve la lista de `OrderItem`s (`ReadyPickupItemDto`) que están `READY`.
    *   **Acción "Marcar como Servido":**
        *   En cada ítem/pase listo, un botón "Servido".
        *   Al pulsar, llama a `PATCH /api/camarero/staff/order-items/:orderItemId/status` (con `newStatus: SERVED`).
        *   El `OrderItem.status` se actualiza a `SERVED` y se registra `servedAt`.
        *   El ítem desaparece de la lista de "pendientes de recoger".
    *   **Impacto en `Order.status` (Backend):**
        *   Cuando todos los `OrderItem`s activos de un `Order` se marcan como `SERVED`, el `Order.status` general del pedido cambia a `COMPLETED`.
        *   El cliente verá este estado `COMPLETED` en su `OrderStatusPage.tsx`.

### 4. ✍️ **[PENDIENTE - Post-MVP Camarero Básico] Toma de Pedidos Manual por el Camarero (Tarea B3.2)**

    *   Seleccionar mesa (de la Vista de Mesas).
    *   Acceder a una UI de la carta similar a la del cliente.
    *   Añadir ítems, configurar modificadores, cantidad, notas.
    *   Opción para "Ítem Fuera de Carta" con nombre y precio manuales.
    *   Enviar el pedido al KDS (asociado a la mesa, `waiterId`, y con `source: WAITER_APP`).
    *   Considerar cómo se visualizan los pedidos de una mesa si múltiples clientes y/o camareros están añadiendo ítems a la misma.

### 5. 💰 **[PENDIENTE - Post-MVP Camarero Básico / Integración TPV] Gestión de Cuentas y Pago**

    *   **Visualizar Cuenta de Mesa:** Ver todos los `Order`s activos y sus `OrderItem`s para una `TableIdentifier` o un `Order` específico.
    *   **Procesar Pago:**
        *   Marcar un `Order` individual o todos los `Order`s de una mesa como `PAID`.
        *   **Este estado `PAID` es el trigger final para:**
            *   Lógica de "Pedido Finalizado" en `OrderStatusPage.tsx` del cliente (limpieza de `localStorage`).
            *   (Futuro) Acumulación de puntos LCo si el pedido tiene `customerLCoId`.
    *   **(Avanzado - Tarea B3.6) Transferencia de Ítems / División de Cuenta (Manual):** Herramientas para que el camarero mueva ítems entre sub-cuentas de una mesa o marque cómo se divide el pago.
    *   **Cerrar/Liberar Mesa:** Marcar mesa como `LIBRE` o `NECESITA_LIMPIEZA` tras el pago y partida.

---

## 👑 **IV. Flujo del Administrador del Negocio (LC) - Configuración y Supervisión**

El `BUSINESS_ADMIN` configura y supervisa el Módulo Camarero desde el panel de administración (`/admin/dashboard/camarero/*`).

### 1. ⚙️ **Gestión de Carta Digital [COMPLETADO]**

    *   CRUD completo de `MenuCategory`, `MenuItem`, `ModifierGroup`, `ModifierOption` a través de la UI en `/admin/dashboard/camarero/menu-editor`.
    *   Subida de imágenes, configuración i18n, precios, disponibilidad, etc.

### 2. 🪑 **[PENDIENTE] Gestión de Mesas (Tarea B3.3)**

    *   CRUD para `Table`s: `identifier` (ej. "MESA-1", "TERRAZA-A2"), `zone`, `capacity`.
    *   Generación de QR para cada mesa que enlaza a `/m/:businessSlug/:tableIdentifier`.

### 3. 🧑‍💼 **[PENDIENTE] Gestión de Personal de LC (Tarea B3.3 y enlace a B3.4)**

    *   CRUD para usuarios con roles `WAITER`, `KITCHEN_STAFF`, `BAR_STAFF` asociados al negocio.
    *   Gestión de `StaffPin`s para login rápido.
    *   **(Futuro - Tarea B3.4) Asignación de roles personalizados y/o permisos granulares** (ej. qué KDS puede ver/actualizar un `KITCHEN_STAFF` específico).

### 4. 🖥️ **[PENDIENTE] Configuración de Destinos KDS (Tarea B3.3)**

    *   UI para que el admin defina los `kdsDestination` válidos para su negocio (ej. "COCINA", "BARRA", "POSTRES").
    *   Estos destinos se usarán al configurar el campo `kdsDestination` de los `MenuItem`s.

### 5. 📊 **[PENDIENTE - BAJA PRIORIDAD MVP] Supervisión de Pedidos en Tiempo Real (Admin)**

    *   Una vista en el panel de admin para ver los pedidos en curso, sus estados generales y los estados de los ítems, similar a una vista maestra del KDS o de la actividad de los camareros, pero sin las funciones operativas directas. Útil para supervisión y análisis.

---

✨ **Beneficios para el Negocio con LoyalPyME Camarero (Visión Completa):**

- **Eficiencia Operativa:** Reducción de errores en la toma de comandas, comunicación directa y clara con cocina/barra.
- **Mejora de la Experiencia del Cliente:** Autonomía para pedir, personalización, transparencia en el estado del pedido.
- **Optimización de Tiempos:** Agilización del proceso de pedido y preparación.
- **Incremento Potencial de Ventas:** Facilidad para añadir ítems, sugerencias (futuro), menor tiempo de espera.
- **Recopilación de Datos:** Información valiosa sobre ítems populares, tiempos de preparación, flujo de pedidos para toma de decisiones.
- **Imagen Moderna y Profesional:** Adopción de tecnología para mejorar el servicio.
- **Integración con Fidelización (LCo):** Potencial para convertir cada pedido en una oportunidad de fidelizar (acumulación de puntos, canje de recompensas).

---
