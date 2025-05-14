# LoyalPyME - Plan de Desarrollo y Futuras Funcionalidades

**Última Actualización:** 14 de Mayo de 2025 (Refleja flujos detallados para LC y prioridades actualizadas)

Este documento detalla las tareas pendientes inmediatas, el alcance definido para las próximas versiones operativas (con énfasis en el Módulo Camarero - LC), la deuda técnica y las ideas para la evolución futura. Se busca un máximo detalle para guiar el desarrollo.

---

## A. TRABAJO RECIENTEMENTE COMPLETADO / CORRECCIONES ✅

1.  ⭐ **[COMPLETADO - MVP Base Plataforma]** Panel Super Admin y Gestión de Negocios/Módulos (`backend`, `frontend`)

    - **Detalles Alcanzados:**
      - Backend: Modelo `Business` con flags `isActive`, `isLoyaltyCoreActive`, `isCamareroActive`. API Endpoints para Super Admin (`/api/superadmin/*`) para listar negocios y activar/desactivar su estado general y sus módulos específicos. Lógica para que el perfil de usuario (`/api/profile`) incluya el `slug` y `name` del negocio asociado para roles `BUSINESS_ADMIN` y `CUSTOMER_FINAL`.
      - Frontend: Página `/superadmin` con tabla de negocios, switches para gestionar estado y activación de módulos. Lógica de datos y UI implementada.
      - Middleware `checkModuleActive` en backend y lógica condicional en UI frontend (ej. `AdminNavbar`, `CustomerDashboardPage`) para respetar la activación de módulos y mostrar/ocultar funcionalidades pertinentes.

2.  ⭐ **[COMPLETADO - Módulo Camarero - Gestión de Carta]** LC - Backend (Modelos BD y API) y Frontend (UI Admin) para Gestión Completa de Carta Digital.

    - **Detalles Alcanzados (Backend):**
      - **BD:** Modelos Prisma (`Table`, `MenuCategory`, `MenuItem`, `ModifierGroup`, `ModifierOption`, `Order`, `OrderItem`, `OrderItemModifierOption`, `StaffPin`) implementados y migrados. Enum `UserRole` extendido (`WAITER`, `KITCHEN_STAFF`, `BAR_STAFF`). Enum `ModifierUiType` (`RADIO`, `CHECKBOX`). Enum `OrderStatus` (`RECEIVED`, etc.). Campos i18n (`name_es`, `description_es`, etc.) en modelos de carta. Campos detallados en `MenuItem` (precio, imagen, alérgenos, tags, disponibilidad, posición, tiempo prep., calorías, SKU, destino KDS).
      - **API Gestión Carta (Admin):** Endpoints CRUD backend (`/api/camarero/admin/*`) para `MenuCategory`, `MenuItem`, `ModifierGroup`, y `ModifierOption`, protegidos por rol `BUSINESS_ADMIN` y activación del módulo LC.
    - **Detalles Alcanzados (Frontend - Admin):**
      - Página `/admin/dashboard/camarero/menu-editor` (`MenuManagementPage.tsx`).
      - Componente `MenuCategoryManager.tsx`: CRUD de categorías, incluyendo subida/recorte de imágenes (Cloudinary).
      - Componente `MenuItemManager.tsx`: Listado de ítems por categoría.
      - Modal `MenuItemFormModal.tsx`: Formulario CRUD completo para ítems.
      - Modal `ModifierGroupsManagementModal.tsx`: CRUD de grupos de modificadores asociados a un ítem.
      - Modal `ModifierOptionsManagementModal.tsx`: CRUD de opciones dentro de un grupo.
      - Hooks de datos (`useAdminMenuCategories`, etc.) y tipos (`menu.types.ts`).
      - Botón "Previsualizar Carta Pública" en `MenuManagementPage.tsx` para admins (usa `businessSlug` del `userData`).

3.  ⭐ **[COMPLETADO - Módulo Camarero - Vista Cliente y Pedido Básico]** LC - Backend y Frontend: Visualización de Carta y Flujo de Pedido Inicial por Cliente Final.

    - **Detalles Alcanzados (Backend - Vista Carta):** Endpoint público `/public/menu/business/:businessSlug` devuelve carta completa, activa, i18n, con modificadores.
    - **Detalles Alcanzados (Frontend - Vista Carta):** Página `/m/:businessSlug/:tableIdentifier?` (`PublicMenuViewPage.tsx`) muestra la carta (acordeones, `MenuItemCard.tsx` con detalles, `ModifierGroupInteractiveRenderer.tsx` para visualización y personalización).
    - **Detalles Alcanzados (Backend - Creación Pedido):** API `POST /public/order/:businessSlug` recibe `CreateOrderPayloadDto`, valida ítems/modificadores/reglas, calcula precio, crea `Order` (con `tableId` y `customerId` opcionales, `orderNotes`, `orderNumber`, `status: RECEIVED`), `OrderItem`, `OrderItemModifierOption` transaccionalmente. Devuelve el objeto `Order` creado.
    - **Detalles Alcanzados (Frontend - Flujo Pedido):**
      - Selección de cantidad, personalización de modificadores con precio dinámico.
      - Añadir a carrito local (`currentOrderItems` en `PublicMenuViewPage.tsx`).
      - Persistencia del carrito y notas generales del pedido en `localStorage` (por `businessSlug` y `tableIdentifier`).
      - Barra superior sticky muestra resumen del carrito y abre modal.
      - Modal del Carrito (`ShoppingCartModal.tsx`): Lista ítems, permite modificar cantidad, eliminar ítems, añadir notas generales, vaciar carrito.
      - Envío del pedido al backend y manejo de notificaciones de éxito (con `orderNumber`) o error. Limpieza del carrito tras éxito.
    - **Detalles Alcanzados (Frontend - Acceso Cliente Logueado):** Tarjeta "Ver la Carta y Pedir" en `SummaryTab.tsx` del `CustomerDashboardPage.tsx` si LC está activo y `businessSlug` disponible en `userData`.

4.  **[COMPLETADO - Varios LCo y Plataforma]** Fixes y Features Menores Anteriores (Tipo `TierData`, Popover Móvil, Error Build Backend, Botones Canje Resumen Cliente).

---

## B. PRIORIDADES ACTUALES: Módulo "LoyalPyME Camarero" (LC) - Hacia un MVP Operativo 🚀

El objetivo es alcanzar un estado donde el ciclo completo de pedido (cliente -> KDS -> camarero -> cliente) sea funcional y robusto.

### **BLOQUE 1: KDS (Kitchen Display System) - FUNDAMENTAL**

**B1.1. ⭐ [CRÍTICO] LC - KDS Backend: API para Gestión de Estados de `OrderItem`**
_ **Dependencia:** Completado el Flujo de Pedido Básico del Cliente (A9).
_ **Objetivo:** Permitir que las pantallas de KDS (cocina, barra, etc.) obtengan los ítems de pedido que les corresponden y puedan actualizar su estado de preparación.
_ **Sub-Tareas Detalladas (Backend):** 1. **Actualizar Modelo Prisma `OrderItem`:**
_ Añadir enum `OrderItemStatus`: `PENDING_KDS` (default), `PREPARING`, `READY` (listo en cocina/barra), `SERVED` (entregado al cliente por camarero), `CANCELLED`.
_ Añadir campo `status: OrderItemStatus @default(PENDING_KDS)` al modelo `OrderItem`.
_ Asegurar que `kdsDestination: String?` se está guardando correctamente en `OrderItem` (copiado desde `MenuItem.kdsDestination`).
_ Considerar añadir `preparedAt: DateTime?`, `servedAt: DateTime?` a `OrderItem` para métricas de tiempo.
_ (Reflexión) El `Order` general también tiene un `status` (`OrderStatus`). Este debe reflejar el estado general (ej. `RECEIVED`, `IN_PROGRESS`, `PARTIALLY_READY`, `ALL_ITEMS_READY`, `COMPLETED`, `PAID`, `CANCELLED`). La actualización del `OrderStatus` general podría ser un efecto secundario de los cambios en `OrderItemStatus`. 2. **API Endpoint `GET /api/camarero/kds/items` (Protegido por rol `KITCHEN_STAFF`/`BAR_STAFF` o token KDS):**
_ Query param `destination: String` (ej. "COCINA", "BARRA") para filtrar por `OrderItem.kdsDestination`.
_ Query param opcional `status: OrderItemStatus` (o lista de estados) para filtrar. Por defecto, debería devolver ítems en `PENDING_KDS` y `PREPARING`.
_ Devolver un array de `OrderItem`s incluyendo:
_ `id` (del OrderItem), `quantity`, `status` actual, `notes` (del ítem).
_ Información anidada del `MenuItem`: `name_es`, `name_en`.
_ Información anidada de `SelectedModifiers`: `modifierOption.name_es`, `modifierOption.name_en`.
_ Información anidada del `Order`: `id` (del Order), `orderNumber`, `createdAt` (del Order), `table.identifier` (si `tableId` no es null).
_ Ordenar por `Order.createdAt` (ascendente, los más antiguos primero). 3. **API Endpoint `PATCH /api/camarero/kds/items/:orderItemId/status` (Protegido):**
_ Body: `{ newStatus: OrderItemStatus }`.
_ Validar que `orderItemId` existe y pertenece al negocio del staff.
_ Validar que la transición de estado es permitida (ej. de `PENDING_KDS` a `PREPARING`, no directamente a `SERVED`).
_ Actualizar `OrderItem.status` y, si aplica, `OrderItem.preparedAt`.
_ (Lógica Secundaria) Si todos los `OrderItem`s de un `Order` pasan a `READY`, actualizar `Order.status` a `ALL_ITEMS_READY`. Si algunos están `READY` y otros `PREPARING`/`PENDING_KDS`, podría ser `PARTIALLY_READY`.
_ Devolver el `OrderItem` actualizado. 4. **(Opcional MVP, Recomendado Post-MVP) WebSockets/Server-Sent Events (SSE) para KDS:**
_ Implementar un canal para que el backend notifique a los KDS conectados (por `businessId` y `kdsDestination`) cuando:
_ Llega un nuevo `OrderItem` para su destino.
_ (Avanzado) Un cliente solicita cancelar un ítem.
_ Esto evita la necesidad de polling constante desde el frontend del KDS. \* **Consideraciones de Seguridad:** ¿Cómo se autenticarán las pantallas KDS? ¿Login de staff, token de dispositivo?

**B1.2. ⭐ [CRÍTICO] LC - KDS Frontend: Interfaz Visual y Funcional Básica**
_ **Dependencia:** KDS Backend API (B1.1).
_ **Objetivo:** Una aplicación/vista web simple, clara y usable en tablets para cocina/barra.
_ **Sub-Tareas Detalladas (Frontend):** 1. **Autenticación/Selección de Destino:**
_ Si el KDS es una app genérica, debe permitir seleccionar el `kdsDestination` al inicio (ej. "Soy KDS Cocina", "Soy KDS Barra").
_ Login si se requiere autenticación de staff. 2. **Layout Principal:**
_ Columnas (ej. "PENDIENTE", "EN PREPARACIÓN") o una lista unificada con filtros/ordenación por estado. 3. **Tarjeta de `OrderItem` (`KdsOrderItemCard.tsx`):**
_ Mostrar claramente: `orderNumber`, `table.identifier`, hora del pedido.
_ `menuItem.name` (i18n), `quantity`.
_ Lista de modificadores seleccionados.
_ Notas del ítem (si las hay).
_ Estado actual del ítem. 4. **Interacción con Tarjetas:**
_ Botones para cambiar estado (ej. "Empezar", "Listo"), que llamen al `PATCH /api/camarero/kds/items/:orderItemId/status`.
_ La tarjeta debería actualizar su apariencia o moverse de columna según el nuevo estado. 5. **Carga y Actualización de Datos:**
_ Llamada inicial a `GET /api/camarero/kds/items` al cargar.
_ Polling periódico para refrescar si no se usan WebSockets/SSE.
_ Si se usan WebSockets/SSE, lógica para recibir y mostrar nuevos ítems o actualizaciones de estado. 6. **Alertas Visuales/Sonoras (Mínimas):**
_ Una indicación clara (ej. un sonido suave, un banner) cuando llegan nuevos ítems a `PENDING_KDS`.
_ **Consideraciones de Usabilidad:** Interfaz táctil, fuentes grandes, alto contraste, mínima distracción.

### **BLOQUE 2: VISUALIZACIÓN Y GESTIÓN BÁSICA POR CAMARERO Y CLIENTE**

**B2.1. ⭐ [ALTA] LC - Cliente: Visualización del Estado del Pedido**
_ **Dependencia:** KDS puede actualizar `OrderItem.status`.
_ **Objetivo:** Permitir al cliente ver el progreso de su pedido después de enviarlo.
_ **Sub-Tareas Detalladas:** 1. **Backend - Endpoint Público de Estado:**
_ `GET /public/order/:orderId/status` (o por `orderNumber`). El `orderId` se puede obtener de la respuesta del `POST /public/order` y guardarse en `localStorage` del cliente junto con el `orderNumber` para esta sesión.
_ Devolver el `Order.status` general y un array de sus `OrderItem`s con su `id`, `menuItem.name_es/en`, `quantity`, y `status` (`OrderItemStatus`).
_ **(Opcional MVP) SSE/WebSockets:** Para enviar actualizaciones de estado en tiempo real a la vista del cliente. 2. **Frontend - Página de Confirmación/Estado del Pedido (`OrderConfirmationPage.tsx` o similar):**
_ Mostrar el `orderNumber` y mensaje de "Pedido Recibido".
_ Listar los ítems del pedido.
_ Para cada ítem, mostrar su `status` actual (ej. "Recibido", "En Cocina", "Listo en Barra").
_ Lógica para llamar al endpoint de estado (polling si no hay SSE) o suscribirse a SSE para actualizar los estados. \* Botón "Volver al Menú" (a `/m/:businessSlug`).

**B2.KDS1. ⭐ [ALTA] LC - KDS Avanzado: Visualización de Tiempos y Alertas de Retraso (Fase 1)**
_ **Dependencia:** KDS Básico (B1.1, B1.2).
_ **Objetivo:** Proporcionar a cocina/barra información visual sobre los tiempos de preparación.
_ **Sub-Tareas Detalladas (KDS Frontend):** 1. **Mostrar Tiempo Estimado:** En cada `KdsOrderItemCard.tsx`, mostrar el `preparationTime` (que viene del `MenuItem`). 2. **Temporizador Visual:** Cuando un ítem pasa a `PREPARING`, iniciar un temporizador visible en su tarjeta que muestre el tiempo transcurrido. 3. **Alerta Visual de Retraso Simple:**
_ Si `tiempo_transcurrido > preparationTime`, cambiar el color del borde de la tarjeta o mostrar un icono de alerta (ej. reloj de arena amarillo).
_ Si `tiempo_transcurrido > preparationTime _ 1.X`(ej. 1.2 para +20%), cambiar a un color más urgente (ej. rojo) o un icono más llamativo.
        4.  **(Opcional MVP) Sonido de Alerta de Retraso:** Un sonido discreto si un ítem lleva mucho tiempo en`PREPARING`o`PENDING_KDS`.

**B2.2. ⭐ [ALTA] LC - Interfaz Camarero (MVP): Notificaciones y Marcar como Servido**
_ **Dependencia:** KDS puede marcar ítems como `READY`.
_ **Objetivo:** Que el camarero sepa qué ítems están listos y pueda marcarlos como entregados.
_ **Sub-Tareas Detalladas:** 1. **Backend - API para Camarero (Protegido por rol `WAITER` y/o PIN):**
_ **(Opcional) Login de Camarero:** Endpoint para autenticar camarero con email/pass o `StaffPin`.
_ `GET /api/camarero/staff/notifications/ready-items`: Devuelve `OrderItem`s que están en estado `READY` y aún no `SERVED`, para el `businessId` del camarero. Incluir `orderNumber`, `table.identifier`, `menuItem.name_es/en`, `quantity`.
_ `PATCH /api/camarero/staff/order-items/:orderItemId/status`: Permite al camarero cambiar el `status` de un `OrderItem` a `SERVED`. Actualizar `OrderItem.servedAt`.
_ (Lógica Secundaria) Si todos los `OrderItem`s de un `Order` están `SERVED`, actualizar `Order.status` a `COMPLETED` (o un estado similar). 2. **Frontend - Interfaz Camarero (Vista simple, puede ser parte del panel admin o PWA):**
_ **Lista de "Ítems Listos para Servir":** Tarjetas o lista mostrando la información de los ítems `READY`.
_ Botón "Marcar como Servido" en cada ítem/grupo de ítems del mismo pedido.
_ Actualización de esta lista (polling o SSE si se implementó para KDS). \* **(Post-MVP) Sonido de notificación para nuevos ítems listos.**

### **BLOQUE 3: FUNCIONALIDADES ADICIONALES Y MEJORAS OPERATIVAS**

**B3.1. [MEDIA] LC - Cliente: Interacciones Adicionales con la Mesa**
_ **Objetivo:** Permitir al cliente solicitar asistencia o la cuenta.
_ **Sub-Tareas Detalladas:** 1. **Botón "Llamar Camarero" (UI Cliente - `PublicMenuViewPage.tsx` o `OrderConfirmationPage.tsx`):**
_ Al pulsar, abre un modal/confirmación opcional para añadir un motivo breve.
_ **Backend:** Endpoint `POST /api/camarero/table/:tableId/call` (o por `tableIdentifier`). Registra la llamada (ej. en `Table.needsAttention = true` o una tabla `TableNotification`).
_ **Interfaz Camarero:** Recibe notificación (SSE o polling) "Mesa X Llama" con el motivo. 2. **Botón "Pedir la Cuenta" (UI Cliente):**
_ Al pulsar, abre modal para que el cliente indique:
_ Método de pago preferido: (Radio) "Efectivo" / "Tarjeta".
_ Si Efectivo: Input opcional "Pagaré con (ej. €50)".
_ **Backend:** Endpoint `POST /api/camarero/table/:tableId/request-bill`. Guarda la preferencia de pago y el importe si se indicó.
_ **Interfaz Camarero:** Recibe notificación "Mesa X Pide Cuenta (Prefiere: {Método}, Paga con: {Importe})"

**B3.2. [MEDIA] LC - Interfaz Camarero: Toma de Pedidos Manual y Gestión de Mesas Básica**
_ **Objetivo:** Capacidades operativas esenciales para el camarero.
_ **Sub-Tareas Detalladas (Interfaz Camarero Frontend/Backend):** 1. **Visualización de Mesas:**
_ Lista/cuadrícula de mesas del negocio (obtenidas de `Table`).
_ Mostrar estado básico de la mesa (ej. "Libre", "Ocupada con Pedido Activo", "Cuenta Solicitada") derivado del estado de los `Order`s asociados. 2. **Toma de Pedidos Manual:**
_ Seleccionar una mesa.
_ Acceder a una UI de la carta similar a la del cliente.
_ Añadir ítems, configurar modificadores, cantidad, notas.
_ **"Ítem Fuera de Carta":** Opción para añadir un ítem con nombre y precio manuales (se guarda en `OrderItem` con `menuItemId: null` pero con `itemNameSnapshot` y `itemPriceSnapshot` rellenados). \* Enviar el pedido al KDS (asociado a la mesa y al camarero que lo tomó, si hay login de camarero). 3. **(Post-MVP) Gestión de Estado de Mesa:** Marcar mesa como "Necesita Limpieza".

**B3.3. [MEDIA] LC - Admin: Gestión de Personal y Mesas (Tareas #12, #13 del Plan Original)**
_ **Objetivo:** Permitir al `BUSINESS_ADMIN` configurar los elementos básicos para la operativa de LC.
_ **Sub-Tareas Detalladas (Backend API y Frontend UI Admin):** 1. **Gestión de Personal (`Staff`):**
_ CRUD para usuarios con roles `WAITER`, `KITCHEN_STAFF`, `BAR_STAFF`.
_ Asignación de `StaffPin`s para login rápido. 2. **Gestión de Mesas (`Table`):**
_ CRUD para mesas: nombre/identificador, capacidad, zona (opcional).
_ **Generación de QR para Mesas:** Funcionalidad para generar la URL `/m/:businessSlug/:tableIdentifier` y mostrar el QR para imprimir. 3. **Configuración de Destinos KDS:** UI para que el admin defina los `kdsDestination` (ej. "Cocina Principal", "Barra"). Estos se usarán al crear/editar `MenuItem`s.

**B3.4. [MEDIA] LC - Cliente/KDS: Solicitud de Cancelación de Pedido (con confirmación KDS)**
_ **Objetivo:** Permitir al cliente intentar cancelar un pedido/ítem si no se ha empezado a preparar.
_ **Sub-Tareas Detalladas:** 1. **Frontend (Cliente - Vista de Estado del Pedido):**
_ Si `OrderItem.status` es `PENDING_KDS`, mostrar botón "Solicitar Cancelar Ítem".
_ Al pulsar, llamar a API `POST /public/order/items/:orderItemId/request-cancellation`. 2. **Backend:**
_ Endpoint para `request-cancellation`: Cambia `OrderItem.status` a `CANCELLATION_REQUESTED`. Notifica al KDS (vía SSE idealmente).
_ Endpoint `PATCH /api/camarero/kds/items/:orderItemId/resolve-cancellation`: Body `{ resolution: 'ACCEPT' | 'REJECT' }`. Actualiza `OrderItem.status` a `CANCELLED` o revierte a `PENDING_KDS`/`PREPARING`. Notifica al cliente (SSE). 3. **Frontend (KDS):**
_ Mostrar alerta/indicación para ítems con `CANCELLATION_REQUESTED`.
_ Botones "Aceptar Cancelación" / "Rechazar Cancelación". 4. **Frontend (Cliente):** Actualizar vista de estado para reflejar si la cancelación fue aceptada/rechazada.

---

## C. FUNDAMENTOS TÉCNICOS ESENCIALES LC (Paralelo y Continuo - Tarea #14 Plan Original)

- **C1. [CRÍTICA] Testing Backend:** Unitario e Integración para todos los nuevos endpoints de KDS, estado de pedido, notificaciones de camarero, gestión de personal/mesas.
- **C2. [CRÍTICA] Validación Robusta Backend (Zod):** Aplicar Zod a todas las entradas de las nuevas APIs de LC (payloads, params, query).
- **C3. [ALTA] Seguridad LC:** Revisión formal de autenticación (tokens API para KDS? PINs para staff?) y autorización (roles `KITCHEN_STAFF`, `WAITER` etc.) para todas las nuevas interfaces y APIs de LC.
- **C4. [ALTA] Logging y Monitoring Básico LC:** Asegurar que los flujos críticos (creación de pedidos, cambios de estado en KDS, notificaciones a camarero, acciones de admin LC) generan logs detallados y útiles.
- **C5. [MEDIA] Internacionalización (i18n) Completa:** Asegurar que todas las nuevas interfaces (KDS, Camarero, Cliente-Estado Pedido, Admin LC) estén completamente traducidas. (Tarea #34 Plan Original).

---

## D. FUNCIONALIDADES LOYALPYME CORE (LCo) Y MEJORAS PLATAFORMA - (Prioridad Re-evaluada Post-LC MVP)

_(Se mantienen las tareas #15 a #20, y #30, #31 del plan original. Su desarrollo se retomará después de alcanzar un MVP funcional del Módulo Camarero o si surgen oportunidades de integración temprana)._

- **D1. [MEDIA] LC - Integración Completa con Fidelización LCo (Tarea #29 Plan Original):**
  - **Objetivo Detallado:**
    1.  **Acumulación Automática de Puntos:** Cuando un `Order` LC (asociado a un `customerId` LCo) se marca como `PAID`, el sistema LCo automáticamente otorga puntos basados en el `finalAmount` y la configuración de `pointsPerEuro` (o una específica para LC).
    2.  **Registro en `ActivityLog` LCo:** Se crea una entrada `POINTS_EARNED_ORDER_LC`.
    3.  `totalSpend` y `totalVisits` del cliente LCo se actualizan.
    4.  Se recalcula el `Tier` del cliente LCo.
    5.  **(Avanzado)** Canje de Recompensas LCo (ej. "Producto Gratis") directamente desde el flujo de pedido LC.
    6.  **(Avanzado)** Aplicación de Beneficios de Nivel LCo (ej. descuentos) al total del pedido LC.
  - **Dependencias:** Funcionalidad de marcar pedidos LC como `PAID`. Definición clara de cómo se configuran los puntos por pedidos LC.

---

## E. DEUDA TÉCNICA Y MEJORAS CONTINUAS (Transversales) 🛠️

_(Se mantienen las tareas #21, #22, #23, #25, #26, #27, #28, #32, #33 del plan original. Su priorización dependerá de la capacidad y necesidad)._

- **E1. [EN PROGRESO - LC] Validación Robusta Backend con Zod (Tarea #24 Plan Original):** Continuar aplicando a todos los módulos.

---

## F. VISIÓN FUTURA / MÓDULOS ADICIONALES (Post-LC MVP y Mejoras LCo) 🚀

_(Se mantienen las tareas #33 a #39 del plan original, ahora numeradas como F1 a F7)._

- **F1. LC - Funcionalidades Muy Avanzadas:** Pago Online integrado en la app del cliente, División de Cuentas avanzada, Sistema de Reservas, Gestión de Inventario Básico, Informes Avanzados LC.
- **F2.** Módulo Pedidos Online / Take Away / Delivery (como extensión natural de LC).
- **F3.** App Móvil Dedicada (PWA y/o Nativa) para Cliente LCo y/o Personal de LC.
- **F4.** E2E Tests Automatizados (Cypress/Playwright).
- **F5.** Monetización Avanzada y Planes de Suscripción Detallados para los negocios.
- **F6.** Personalización y CRM Avanzado (Transversal).
- **F7.** Gamificación Avanzada (LCo).

---
