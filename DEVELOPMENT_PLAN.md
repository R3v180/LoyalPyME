LoyalPyME - Plan de Desarrollo y Futuras Funcionalidades

Última Actualización: 28 de Mayo de 2025 (Refleja KDS Backend y Frontend funcional con acciones, detalla la implementación de la Interfaz de Camarero MVP, e introduce Sistema de Permisos Granular como tarea futura)

Este documento detalla las tareas pendientes inmediatas, el alcance definido para las próximas versiones operativas (con énfasis en el Módulo Camarero - LC), la deuda técnica y las ideas para la evolución futura. Se busca un máximo detalle para guiar el desarrollo, incluyendo consideraciones de UX, modelos de datos implicados, y flujos de trabajo.

A. TRABAJO RECIENTEMENTE COMPLETADO / EN PROGRESO / CORRECCIONES ✅

⭐ [COMPLETADO - MVP Base Plataforma] Panel Super Admin y Gestión de Negocios/Módulos (backend, frontend)

Detalles Alcanzados:

Backend: Modelo Business en Prisma con flags booleanos isActive, isLoyaltyCoreActive, isCamareroActive. API Endpoints (/api/superadmin/\*) protegidos por rol SUPER_ADMIN para listar todos los negocios y permitir la activación/desactivación de su estado general y de sus módulos específicos. Lógica en el servicio de perfil de usuario (/api/profile - auth.middleware.ts) para incluir el slug, name, logoUrl del negocio asociado, así como los flags de estado de los módulos, para roles BUSINESS_ADMIN y CUSTOMER_FINAL.

Frontend: Página /superadmin (SuperAdminPage.tsx) con tabla de negocios (mostrando ID, nombre, slug, estado general, estado de módulos LCo y LC). Switches interactivos en cada fila para que el SUPER_ADMIN pueda gestionar el estado general del negocio y la activación/desactivación de cada módulo individualmente. Lógica de datos para obtener y enviar actualizaciones implementada.

Integración Módulos: Middleware checkModuleActive(moduleCode) en el backend para proteger rutas específicas de módulos. Lógica condicional en la UI del frontend (ej. AdminNavbar.tsx, CustomerDashboardPage.tsx) para mostrar/ocultar funcionalidades (enlaces de navegación, secciones de página) basándose en los flags isLoyaltyCoreActive e isCamareroActive del negocio del usuario, obtenidos de su perfil.

⭐ [COMPLETADO - Módulo Camarero - Gestión de Carta Digital] LC - Backend (Modelos BD y API) y Frontend (UI Admin) para Gestión Completa de Carta Digital.

Detalles Alcanzados (Backend - Modelos Prisma):

Modelos Principales: Table (identifier, zone), MenuCategory (name_es/en, imageUrl, position, isActive), MenuItem (name_es/en, price, imageUrl, allergens (String[]), tags (String[]), isAvailable, position, preparationTime, calories, sku, kdsDestination), ModifierGroup (name_es/en, uiType (Enum RADIO|CHECKBOX), minSelections, maxSelections, isRequired, position), ModifierOption (name_es/en, priceAdjustment, position, isDefault, isAvailable).

Modelos de Pedido: Order (con orderNumber, status (Enum OrderStatus), totalAmount, finalAmount, orderNotes), OrderItem (con priceAtPurchase, totalItemPrice, kdsDestination, status (Enum OrderItemStatus), itemNameSnapshot_es/en), OrderItemModifierOption (con snapshots de nombre y precio de opción).

Modelos de Staff: StaffPin (asociado a User con pinHash).

Enums: UserRole extendido con WAITER, KITCHEN_STAFF, BAR_STAFF. Enums ModifierUiType, OrderStatus, OrderItemStatus, OrderType, OrderSource.

Internacionalización: Campos de texto relevantes (nombres, descripciones) en modelos de carta con sufijos \_es y \_en.

Relaciones: Definidas correctamente con onDelete/onUpdate según necesidad (ej. MenuCategory a MenuItem con Cascade delete).

Detalles Alcanzados (Backend - API Gestión Carta Admin):

Endpoints CRUD completos (/api/camarero/admin/menu/categories/_, /api/camarero/admin/menu/items/_, /api/camarero/admin/modifier-groups/_, /api/camarero/admin/modifier-options/_) para MenuCategory, MenuItem, ModifierGroup, y ModifierOption.

Protección de endpoints mediante authenticateToken, checkRole([UserRole.BUSINESS_ADMIN]), y checkModuleActive('CAMARERO').

Lógica de servicios para validaciones de unicidad (ej. nombre de categoría/ítem dentro de su contexto, SKU de ítem por negocio).

Detalles Alcanzados (Frontend - Admin UI Gestión Carta):

Página principal en /admin/dashboard/camarero/menu-editor (MenuManagementPage.tsx).

Componente MenuCategoryManager.tsx: CRUD completo para categorías, incluyendo subida de imágenes (con FileInput, react-image-crop para recorte 1:1, canvasPreview para generar blob, y subida a Cloudinary vía backend). Previsualización de imagen.

Componente MenuItemManager.tsx: Listado de ítems por categoría seleccionada. Acceso a la creación de nuevos ítems y edición de existentes.

Modal MenuItemFormModal.tsx: Formulario CRUD completo para ítems, con todos los campos (i18n, precio, imagen con recorte 1:1, MultiSelect para alérgenos/tags, switch disponibilidad, num inputs para posición/tiempo/calorías, text inputs para SKU/KDS). Botón para acceder a la gestión de grupos de modificadores.

Modal ModifierGroupsManagementModal.tsx: CRUD para ModifierGroups asociados a un MenuItem.

Modal ModifierOptionsManagementModal.tsx: CRUD para ModifierOptions dentro de un ModifierGroup.

Hooks de datos (useAdminMenuCategories, useAdminMenuItems, useAdminModifierGroups, useAdminModifierOptions) para encapsular la lógica de API y estado.

Tipos TypeScript definidos en frontend/src/types/menu.types.ts.

Botón "Previsualizar Carta Pública" en MenuManagementPage.tsx que redirige a /m/:businessSlug (obteniendo businessSlug del userData del admin).

⭐ [COMPLETADO - Módulo Camarero - Vista Cliente y Flujo de Pedido Básico] LC - Backend y Frontend: Visualización de Carta, Configuración de Ítems, Carrito y Envío de Pedido por Cliente Final.

Detalles Alcanzados (Backend - Vista Carta Pública):

Endpoint GET /public/menu/business/:businessSlug devuelve la carta completa del negocio (solo elementos activos/disponibles), ordenada y con campos i18n, incluyendo estructura anidada de modificadores y opciones.

Detalles Alcanzados (Frontend - Vista Carta Pública - PublicMenuViewPage.tsx):

Página /m/:businessSlug/:tableIdentifier? muestra la carta.

CategoryAccordion.tsx renderiza categorías como acordeones.

MenuItemCard.tsx muestra cada ítem con sus detalles (imagen, nombre i18n, desc i18n, precio, alérgenos, tags).

ModifierGroupInteractiveRenderer.tsx permite al cliente seleccionar opciones de modificadores (Radio/Checkbox), validando reglas (minSelections, maxSelections, isRequired) y actualizando dinámicamente el precio del ítem.

Carrito de Compra:

Estado local (currentOrderItems en PublicMenuViewPage.tsx) para ítems añadidos.

Persistencia del carrito (currentOrderItems) y notas generales del pedido (orderNotes) en localStorage (claves dinámicas con businessSlug y tableIdentifier). Se limpian si se detecta un pedido activo ya enviado para la mesa o al enviar un nuevo pedido.

Barra superior sticky (si hay ítems en el carrito) muestra total de ítems y precio, y botón para abrir el modal del carrito.

Modal del Carrito (ShoppingCartModal.tsx): Permite revisar ítems, modificar cantidad (con recalculo de total), eliminar ítems, añadir/editar notas generales del pedido, y vaciar carrito.

Detalles Alcanzados (Backend - Creación de Pedido):

API POST /public/order/:businessSlug recibe CreateOrderPayloadDto.

Validación Exhaustiva: Verifica existencia y activación del negocio, activación del módulo Camarero, existencia y disponibilidad (isAvailable) de MenuItems y ModifierOptions, pertenencia al negocio, cumplimiento de reglas de modificadores.

Recálculo de Precios Backend: Recalcula priceAtPurchase y totalItemPrice para cada OrderItem, y totalAmount/finalAmount para el Order.

Creación Transaccional: Crea Order (con tableId resuelto de tableIdentifier, customerLCoId opcional si el cliente está logueado, orderNotes, orderNumber generado, status: RECEIVED, source: CUSTOMER_APP, orderType: DINE_IN), OrderItems (con snapshots i18n, kdsDestination), y OrderItemModifierOptions (con snapshots i18n).

Devuelve el objeto Order creado (con id y orderNumber).

Detalles Alcanzados (Frontend - Post-Envío Pedido en PublicMenuViewPage.tsx):

Notificaciones Mantine de éxito (mostrando orderNumber) o error.

Limpieza de currentOrderItems y orderNotes de localStorage.

Guarda activeOrderInfo = {orderId, orderNumber, savedAt} en localStorage para rastrear el pedido activo del cliente.

Redirige a /order-status/:orderId pasando orderNumber, businessSlug y tableIdentifier en el state de la ruta.

Detalles Alcanzados (Frontend - Acceso Cliente LCo): Tarjeta "Ver la Carta y Pedir" en SummaryTab.tsx del CustomerDashboardPage.tsx que enlaza a /m/:businessSlug si LC está activo y businessSlug disponible en userData.

⭐ [ACTUALIZADO - COMPLETADO - Módulo Camarero - KDS Funcional (Backend API, Lógica de Estados y Frontend con Acciones)]

A4.1. KDS Backend (API y Lógica de Estados): [COMPLETADO Y VALIDADO]

Endpoints API (/api/camarero/kds/\*):

GET /items?destination=...[&status=...]: Devuelve OrderItems filtrados (formato KdsListItem) para el KDS, incluyendo detalles de ítem, modificadores, pedido asociado. Ordena por antigüedad. Protegido por roles KITCHEN_STAFF, BAR_STAFF, BUSINESS_ADMIN.

PATCH /items/:orderItemId/status: Permite al KDS actualizar el OrderItemStatus de un ítem (ej. PENDING_KDS -> PREPARING, PREPARING -> READY, o CANCELLED). Registra OrderItem.preparedAt. Protegido por roles.

Lógica de Estados (kds.service.ts v1.1.1):

La actualización de OrderItem.status desencadena una reevaluación y actualización del Order.status general (RECEIVED -> IN_PROGRESS -> PARTIALLY_READY -> ALL_ITEMS_READY).

Esta lógica ha sido validada mediante pruebas exhaustivas (Postman, datos del seed.ts v7) para asegurar consistencia en diversos escenarios, incluyendo cancelaciones de ítems.

A4.2. Cliente: Visualización del Estado del Pedido: [COMPLETADO]

Backend (GET /public/order/:orderId/status): Endpoint público funcional, devuelve PublicOrderStatusInfo (estado general del Order, orderNumber, createdAt, mesa, notas, y lista de ítems con su itemNameSnapshot, quantity y OrderItemStatus individual).

Frontend (OrderStatusPage.tsx):

Muestra dinámicamente la información del pedido y el estado de sus ítems.

Implementa polling (cada 10s) para refrescar automáticamente los datos.

Lógica de "Pedido Finalizado": Si Order.status es PAID o CANCELLED, el polling se detiene. Botón "Empezar Nuevo Pedido" limpia localStorage (activeOrderInfoKey, cartStorageKey, notesStorageKey para la mesa/negocio) y redirige a la carta.

Frontend (PublicMenuViewPage.tsx - Detección Pedido Activo): Funcional, muestra aviso y enlace a OrderStatusPage si hay un pedido activo en localStorage.

A4.3. KDS Frontend (Visualización y Acciones Básicas): [COMPLETADO]

Configuración Frontend:

Tipos (frontend/src/types/customer.ts v1.1.1): UserRole incluye KITCHEN_STAFF, BAR_STAFF.

Login (frontend/src/pages/LoginPage.tsx v1.6.4): Redirige KDS staff a /admin/kds.

Rutas (frontend/src/routes/index.tsx v1.1.0, frontend/src/components/PrivateRoute.tsx v1.1.0): Ruta /admin/kds funcional y protegida para roles KDS.

Servicio KDS (frontend/src/services/kdsService.ts v1.0.2): Funcional, con tipos e URLs correctas.

Página KDS (frontend/src/pages/admin/camarero/KitchenDisplayPage.tsx v1.1.0):

Visualización: Lista OrderItems (de getItemsForKds) para el destino KDS seleccionado ("COCINA" / "BARRA"). Muestra nombre i18n, cantidad, modificadores i18n, notas, info del pedido (número, mesa, hora), estado actual del ítem.

Polling: Refresco automático de la lista. Se pausa durante actualizaciones de estado.

Acciones de Estado: Botones "Empezar Preparación" (PENDING_KDS -> PREPARING), "Marcar como Listo" (PREPARING -> READY), "Cancelar Ítem" (PENDING_KDS/PREPARING -> CANCELLED). Llaman a updateOrderItemKdsStatus.

Feedback: Notificaciones Mantine de éxito/error. Estado de carga individual para botones. Lista se refresca tras acción.

[COMPLETADO - Varios LCo y Plataforma] Fixes Menores y Mejoras Anteriores.

Script de Seed (prisma/seed.ts v7) funcional y con datos de demo exhaustivos para LCo y LC.

B. PRIORIDADES ACTUALES: Módulo "LoyalPyME Camarero" (LC) - Hacia un MVP Operativo 🚀

El objetivo es alcanzar un estado donde el ciclo completo de pedido (cliente pide -> KDS prepara y marca listo -> camarero recoge y marca servido -> cliente ve pedido completado) sea funcional y robusto.

BLOQUE 1: INTERFAZ DE CAMARERO Y FINALIZACIÓN DEL CICLO DE PEDIDO - FUNDAMENTAL

B1.1. ⭐ [CRÍTICO - PENDIENTE] LC - Backend: API para Interfaz de Camarero

- Dependencia: KDS funcional (A4 - puede marcar ítems como READY).
- Objetivo Detallado: Desarrollar los endpoints y la lógica de servicio necesarios para que la interfaz del camarero (rol WAITER) pueda:

1. Obtener una lista de OrderItems que han sido marcados como READY por el KDS y están pendientes de ser recogidos y servidos.
2. Marcar un OrderItem específico como SERVED, actualizando su estado y registrando la hora de servicio.
3. Desencadenar la actualización del Order.status general a COMPLETED cuando todos los ítems activos de ese pedido hayan sido marcados como SERVED.

- Sub-Tareas Detalladas (Backend):

1. Autenticación y Autorización para Camareros:

- Revisar el flujo de login para usuarios con rol WAITER. Si se planea usar StaffPins para un login rápido en dispositivos de camarero, este es el momento de diseñar la lógica de autenticación basada en PIN (ej. un endpoint POST /api/auth/login-pin que valide el PIN contra StaffPin.pinHash y devuelva un JWT con el userId y rol del camarero asociado).
- Asegurar que los nuevos endpoints estén protegidos por el middleware authenticateToken y checkRole([UserRole.WAITER, UserRole.BUSINESS_ADMIN]).
- Asegurar que el middleware checkModuleActive('CAMARERO') se aplique.

2. Desarrollo API Endpoint GET /api/camarero/staff/ready-for-pickup:

- Controlador (camarero-staff.controller.ts o similar): Manejar la petición, obtener businessId del req.user.
- Servicio (camarero-staff.service.ts):
- Lógica para consultar OrderItems:
- where: order.businessId (del camarero), status: OrderItemStatus.READY, order.status NO debe ser CANCELLED o PAID.
- include: order (para orderNumber, table.identifier, createdAt), menuItem (para snapshots si no se confía solo en itemNameSnapshot), selectedModifiers (con modifierOption para nombres i18n).
- orderBy: order: { createdAt: 'asc' } (para procesar pedidos más antiguos primero), luego opcionalmente por menuItem.course o menuItem.position si se implementa agrupación por pases.
- DTO de Respuesta (ReadyPickupItemDto): Definir claramente la estructura que espera el frontend del camarero. Mínimo: orderItemId, orderId, orderNumber, orderCreatedAt, tableIdentifier (String), itemNameSnapshot_es, itemNameSnapshot_en, quantity, itemNotes?, kdsDestination? (para saber de dónde recoger), y una lista de selectedModifiers con sus nombres i18n y ajustes de precio (aunque para "recoger" el precio del modificador es menos crítico).

3. Desarrollo API Endpoint PATCH /api/camarero/staff/order-items/:orderItemId/status (o /mark-served):

- Controlador: Validar orderItemId (param) y el newStatus (body, que debería ser SERVED).
- Servicio:
- Validar que el OrderItem (con id = orderItemId) existe, pertenece al businessId del camarero.
- Validar que la transición de estado es permitida (ej. desde READY a SERVED).
- Actualizar OrderItem.status = OrderItemStatus.SERVED y OrderItem.servedAt = new Date().
- Lógica Crucial de Actualización de Order.status:
- Después de actualizar el OrderItem, obtener todos los OrderItems (no CANCELLED) del Order asociado.
- Si todos estos ítems están ahora en estado SERVED, actualizar Order.status = OrderStatus.COMPLETED.
- Registrar un ActivityLog de tipo ORDER_COMPLETED_BY_STAFF (opcional, pero útil para auditoría).
- Devolver el OrderItem actualizado o un mensaje de éxito.

4. Testing: Escribir tests unitarios para la lógica de los servicios y tests de integración para los nuevos endpoints.

B1.2. ⭐ [CRÍTICO - PENDIENTE] LC - Frontend: Interfaz de Camarero MVP (Visualización y Marcar Servido)

- Dependencia: Backend API para Camarero (B1.1) completamente funcional y probada.
- Objetivo: Crear una página/vista web simple, clara y usable (especialmente en tablets o móviles) para que el personal de sala (camareros) pueda ver qué ítems de pedidos están listos para ser recogidos de cocina/barra y marcarlos como entregados al cliente.
- Sub-Tareas Detalladas (Frontend):

1. Creación de la Página (WaiterPickupPage.tsx o similar):

- Ruta: Ej. /admin/dashboard/camarero/pickup-station (si se integra al panel admin) o una ruta raíz si es una PWA separada.
- Protección de ruta: Solo accesible para roles WAITER y BUSINESS_ADMIN.
- Layout: Título claro (ej. "Listo para Recoger y Servir - [Nombre del Negocio]").

2. Obtención y Visualización de Datos:

- Hook de datos (useWaiterPickupItems o similar) que llame a GET /api/camarero/staff/ready-for-pickup.
- Estado para loading, error, y la lista de ReadyPickupItemDtos.
- Renderizar cada ítem/pase en un componente ReadyOrderItemCard.tsx:
- Mostrar claramente: Número de Pedido, Mesa (si aplica), Hora del Pedido.
- Nombre del Ítem (i18n), Cantidad.
- Lista de Modificadores seleccionados (nombres i18n).
- Notas del ítem.
- (Opcional) Destino KDS de origen (si el camarero recoge de múltiples puntos).
- Agrupación: Si se reciben múltiples ítems del mismo pedido o para la misma mesa, agruparlos visualmente para facilitar la recogida.

3. Interacción "Marcar como Servido":

- Botón "Entregado" / "Servido" en cada ReadyOrderItemCard.tsx (o por grupo de pase).
- Estado de carga local (updatingItemId) para el botón presionado.
- Al pulsar, llamar a PATCH /api/camarero/staff/order-items/:orderItemId/status (enviando newStatus: "SERVED").
- Manejo de notificaciones Mantine de éxito/error.
- Actualización de UI: Tras un éxito, el ítem/pase debería eliminarse de la lista de "pendientes de recoger". Considerar una animación o un breve mensaje de confirmación en la tarjeta antes de que desaparezca.

4. Refresco de Datos:

- Botón "Refrescar Lista" que re-ejecute la llamada a GET /api/camarero/staff/ready-for-pickup.
- Implementar polling básico (ej. cada 15-30 segundos) si los WebSockets/SSE no están disponibles para el MVP. Pausar polling durante una acción de "marcar servido".

5. Consideraciones de Usabilidad:

- Diseño claro y con buen contraste para entornos de restaurante a menudo con iluminación variable.
- Fuentes grandes y botones fáciles de pulsar en pantallas táctiles.
- Mínimas distracciones, enfocado en la tarea de recogida y servicio.

BLOQUE 2: MEJORAS DE EXPERIENCIA Y FUNCIONALIDAD BÁSICA LC (Post-B1)

B2.1. ⭐ [ALTA - PENDIENTE] LC - Cliente: Visualización Ítems Servidos y Pedido Completado

- Dependencia: Interfaz Camarero MVP (B1) puede marcar ítems como SERVED y pedidos como COMPLETED.
- Objetivo Detallado: Asegurar que la OrderStatusPage.tsx del cliente refleje con precisión y claridad los estados SERVED para los ítems individuales y el estado COMPLETED para el pedido general, proporcionando una visión completa del progreso hasta la entrega.
- Sub-Tareas Detalladas (Frontend - OrderStatusPage.tsx):

1. Adaptación de la Visualización de OrderItems:

- El componente que renderiza cada ítem en OrderStatusPage.tsx debe tener un estilo visual distintivo para los ítems con OrderItem.status === OrderItemStatus.SERVED (ej. un icono de "check" verde, texto atenuado o tachado si se prefiere indicar que ya no está "activo" en preparación).
- Asegurar que el texto del estado del ítem se traduce correctamente (ej. "Entregado").

2. Manejo del Estado Order.status = COMPLETED:

- Cuando el Order.status general obtenido del backend (vía GET /public/order/:orderId/status) sea OrderStatus.COMPLETED:
- Mostrar un mensaje destacado en la OrderStatusPage.tsx, por ejemplo: "¡Tu pedido ha sido completado! Todos los ítems han sido entregados."
- El polling para actualizaciones de estado debe continuar si el pedido aún no está PAID o CANCELLED. Esto permite que el cliente pueda, por ejemplo, usar futuras funcionalidades como "Llamar Camarero" o "Pedir la Cuenta" desde esta página, o si se implementa "Añadir a Pedido Existente" incluso después de COMPLETED (si la política del negocio lo permite).

3. Consistencia y Pruebas: Probar el flujo completo desde el cliente, pasando por KDS, camarero marcando servido, hasta ver el estado COMPLETED y los ítems SERVED en OrderStatusPage.tsx. Verificar la sincronización del polling.

B2.2. ⭐ [ALTA/MEDIA - PENDIENTE] LC - Cliente/Backend: Añadir Ítems a Pedido Existente

- Descripciones y sub-tareas detalladas como en la versión anterior del plan, la prioridad se mantiene.

B2.3. ⭐ [MEDIA - PENDIENTE] LC - KDS Avanzado: Visualización de Tiempos, Alertas y Sincronización de Pases/Cursos

- Descripciones y sub-tareas detalladas como en la versión anterior del plan.

BLOQUE 3: FUNCIONALIDADES ADICIONALES Y MEJORAS OPERATIVAS (Post-MVP Pedido-KDS-Camarero Funcional)

B3.1. [MEDIA - PENDIENTE] LC - Cliente: Interacciones Adicionales con la Mesa

- Descripciones y sub-tareas detalladas como en la versión anterior del plan.

B3.2. [MEDIA - PENDIENTE] LC - Interfaz Camarero: Toma de Pedidos Manual y Gestión de Mesas Básica

- Sub-Tareas Detalladas (Interfaz Camarero Frontend/Backend):

1. Visualización de Mesas:

- Backend: Endpoint GET /api/camarero/staff/tables que devuelva la lista de Tables del negocio con su estado actual (ej. LIBRE, OCUPADA_CON_PEDIDO_ACTIVO, SOLICITUD_CUENTA, NECESITA_LIMPIEZA). Este estado podría derivarse de los Orders asociados o de un campo Table.status explícito.
- Frontend: Página/sección en la interfaz de camarero con una lista o cuadrícula visual de mesas, mostrando su identifier y estado con colores/iconos.

2. Toma de Pedidos Manual:

- Frontend: Al seleccionar una mesa "Libre" u "Ocupada", el camarero accede a una UI de la carta (similar a PublicMenuViewPage.tsx pero adaptada para toma por staff).
- Permitir añadir ítems, configurar modificadores, cantidad, notas por ítem.
- Backend (Opción "Ítem Fuera de Carta"):
- El DTO de creación de pedido (o adición de ítems) desde la interfaz de camarero debe permitir enviar un ítem sin menuItemId pero con itemNameSnapshot y priceAtPurchase definidos manualmente por el camarero.
- El servicio backend guardará estos OrderItems con menuItemId: null pero con los snapshots de nombre y precio. kdsDestination deberá ser especificado o inferido.
- Backend (Envío de Pedido por Camarero):
- Un endpoint similar a POST /public/order/:businessSlug pero protegido para camareros (POST /api/camarero/staff/order o anidado bajo mesa /api/camarero/staff/tables/:tableId/order).
- Debe asociar el Order.waiterId con el id del camarero autenticado.
- El pedido se envía al KDS normalmente.

3. (Post-MVP Toma de Pedidos) Gestión de Estado de Mesa:

- Backend: Endpoints PATCH /api/camarero/staff/tables/:tableId/status para que el camarero actualice un campo Table.status (ej. a NECESITA_LIMPIEZA, RESERVADA).
- Frontend: Botones en la vista de mesas para estas acciones.

B3.3. [MEDIA - PENDIENTE] LC - Admin: Gestión de Personal, Mesas y Destinos KDS

- Sub-Tareas Detalladas (Backend API y Frontend UI Admin - /admin/dashboard/camarero/settings/\* o similar):

1. Gestión de Personal (User con roles WAITER, KITCHEN_STAFF, BAR_STAFF):

- Frontend UI: Nueva sección en el panel de admin para listar, crear, editar y activar/desactivar empleados.
- Backend API: Endpoints CRUD para gestionar estos usuarios (asociados al Business del admin).
- Campos al crear/editar: name, email (para login, único dentro del negocio o globalmente?), password (solo al crear o con opción de reset por admin), role (seleccionable de WAITER, KITCHEN_STAFF, BAR_STAFF), isActive.
- (Futuro - Enlace con B3.4) Opción para asignar un defaultKdsDestination o CustomRole.
- Gestión de StaffPins:
- Frontend UI: Dentro de la edición de un empleado, opción para ver/crear/actualizar/desactivar su PIN. Mostrar PIN actual solo si es la primera vez o tras un reset (por seguridad).
- Backend API: Endpoints CRUD para StaffPin asociados a un User de staff.
- POST /api/camarero/admin/staff/:userId/pin (crea o actualiza PIN). Recibe { pin: "1234", description: "PIN Principal" }. El servicio hashea el PIN antes de guardarlo.
- DELETE /api/camarero/admin/staff/:userId/pin (desactiva o borra PIN).

2. Gestión de Mesas (Table):

- Frontend UI: Sección para CRUD de mesas. Campos: identifier (editable, único por negocio, ej. "MESA-05", "BARRA-1"), zone (texto libre, ej. "Terraza Principal", "Salón Interior"), capacity (numérico).
- Backend API: Endpoints CRUD para Table.
- Frontend UI (Generación QR para Mesas): Para cada mesa listada, un botón "Generar QR". Al pulsar, muestra el QR code correspondiente a la URL /m/:businessSlug/:tableIdentifier (usando el businessSlug del admin y el identifier de la mesa). Opción para descargar el QR como imagen.

3. Configuración de Destinos KDS:

- Frontend UI: Interfaz simple donde el BUSINESS_ADMIN pueda definir una lista de strings que representan los kdsDestination válidos para su negocio (ej. "COCINA", "BARRA", "POSTRES", "PARRILLA").
- Backend:
- Modelo Business podría tener un campo definedKdsDestinations: String[]. Endpoint para actualizar este array.
- Al crear/editar MenuItems (en MenuItemFormModal.tsx), el campo kdsDestination debería ser un Select poblado con estos destinos definidos (o permitir texto libre si no hay ninguno definido, guardando lo que se escriba).

B3.4. [NUEVO - MEDIA/ALTA POST-MVP CAMARERO] LC - Sistema de Permisos Granular para Staff

- Descripción y sub-tareas como en la propuesta anterior. Se enfatiza que esto es una evolución de la gestión de personal básica.

B3.5. [MEDIA - PENDIENTE] LC - Cliente/KDS: Solicitud de Cancelación de Pedido

- Originalmente B3.4. Descripciones y sub-tareas detalladas como en la versión anterior del plan.

B3.6. [BAJA/MEDIA - PENDIENTE] LC - Gestión Avanzada de Cuentas por Mesa (Fase 1 - Camarero)

- Originalmente B3.5. Descripciones y sub-tareas detalladas como en la versión anterior del plan.

C. FUNDAMENTOS TÉCNICOS ESENCIALES LC (Paralelo y Continuo)

C1. [ACTUALIZADO - ALTA] Testing Backend:

Objetivo: Cobertura robusta de toda la lógica de negocio y endpoints de LC.

COMPLETADO: Tests unitarios y de integración para la lógica de Order.status en kds.service.ts.

PENDIENTE (Prioridad Alta):

Tests unitarios para los nuevos servicios de Camarero (ej. waiter.service.ts): lógica de obtener ítems listos, lógica de marcar como servido, lógica de actualización de Order.status a COMPLETED.

Tests de integración (Supertest) para los nuevos endpoints de la API de Camarero (/api/camarero/staff/\*).

PENDIENTE (A medida que se desarrollan): Tests para API de añadir ítems a pedido existente, API de gestión de personal/mesas/PINs, y futura API de permisos.

C2. [CRÍTICA - PENDIENTE] Validación Robusta Backend (Zod):

Objetivo: Implementar validación exhaustiva y schemas bien definidos para todos los datos de entrada (body, params, query) de las APIs de LC.

Acciones Inmediatas:

Definir schemas Zod para CreateOrderPayloadDto (POST /public/order/:businessSlug).

Definir schemas Zod para AddItemsToOrderDto (POST /public/order/:existingOrderId/add-items).

Definir schemas Zod para los payloads y params de los endpoints KDS (/api/camarero/kds/\*).

Definir schemas Zod para los payloads y params de los nuevos endpoints de Camarero (/api/camarero/staff/\*).

Integrar estos schemas en los controladores o en un middleware de validación.

C3. [ALTA - PENDIENTE] Seguridad LC:

Autenticación:

KDS: Evaluar si el login actual de KITCHEN_STAFF/BAR_STAFF es suficiente o si se necesita un sistema de tokens de dispositivo KDS dedicados (registrados por el admin, con kdsDestination fijo) para mayor seguridad y facilidad de configuración en el local.

Camareros: Definir el flujo de login para WAITER. ¿Email/password estándar o implementación del login rápido con StaffPin? Si es PIN, ¿cómo se gestiona la sesión (JWT de corta duración tras validar PIN)?

Autorización:

Revisión exhaustiva de todos los endpoints de LC (/api/camarero/admin/_, /api/camarero/kds/_, /api/camarero/staff/\*) para asegurar que checkRole y checkModuleActive se aplican correctamente.

Asegurar que todas las operaciones que modifican datos (ej. kds.service.ts, waiter.service.ts) verifican que la entidad (ej. OrderItem, Order) pertenece al businessId del usuario autenticado.

Planificar cómo se integrará el futuro sistema de permisos granulares (B3.4) con la autorización actual.

C4. [ALTA - EN PROGRESO] Logging y Monitoring Básico LC:

Objetivo: Logs detallados para depuración y auditoría.

Acciones:

Revisar y asegurar logs en kds.service.ts para cada cambio de estado de OrderItem y Order.

Añadir logs detallados en los nuevos servicios de Camarero (obtención de ítems listos, marcado como servido, actualización a COMPLETED).

Loguear creación/modificación de entidades clave de LC (Personal, Mesas, Pedidos).

Considerar un formato de log estructurado (JSON) para facilitar el análisis futuro con herramientas de monitoring.

C5. [MEDIA - PENDIENTE] Internacionalización (i18n) Completa LC:

Objetivo: Todas las interfaces de usuario del Módulo Camarero deben ser traducibles.

Frontend:

KitchenDisplayPage.tsx: Traducir textos de botones, estados, etiquetas.

Futura WaiterPickupPage.tsx: Traducir todos los textos.

OrderStatusPage.tsx: Ya tiene i18n, verificar completitud.

Paneles de Admin LC (MenuManagementPage.tsx, futura gestión de personal/mesas): Traducir todos los labels, placeholders, notificaciones.

Backend: Asegurar que los mensajes de error devueltos por la API que puedan ser mostrados al usuario (aunque es preferible manejar códigos de error y traducir en frontend) sean genéricos o se provean claves i18n si es necesario.

---

## D. FUNCIONALIDADES LOYALPYME CORE (LCo) Y MEJORAS PLATAFORMA - (Prioridad Re-evaluada Post-LC MVP)

_(Estas funcionalidades se refieren a mejoras en el módulo de fidelización existente y en la plataforma en general. Su desarrollo se retomará después de alcanzar un MVP funcional y estable del Módulo Camarero (LC), o si surgen oportunidades de integración temprana que aporten valor significativo sin desviar el foco principal.)_

- **D1. [MEDIA] LCo - Mejoras UX/UI Panel Cliente (`CustomerDashboardPage.tsx` y componentes asociados)**

  - **Dependencia:** LCo MVP funcional.
  - **Objetivo Detallado:** Refinar la experiencia del cliente final en su panel de fidelización para hacerla más intuitiva, atractiva y fácil de usar, especialmente en dispositivos móviles.
  - **Sub-Tareas Detalladas (Frontend):**
    1.  **Revisión de Responsividad:**
        - Testear y ajustar el layout de `CustomerDashboardPage.tsx` y todas sus pestañas (`SummaryTab`, `RewardsTab`, `ActivityTab`) en múltiples tamaños de pantalla (móvil, tablet, escritorio).
        - Asegurar que todos los elementos interactivos (botones, inputs, selectores) sean fácilmente accesibles y usables en pantallas táctiles.
        - Optimizar la visualización de tablas (ej. `ActivityTab`) en móviles, quizás con scroll horizontal o un diseño de tarjeta alternativo.
    2.  **Feedback Visual Mejorado:**
        - Implementar indicadores de carga más evidentes (ej. skeletons, spinners en botones) durante las acciones de canje de recompensas/regalos y validación de QR.
        - Mejorar las notificaciones de éxito/error para estas acciones, haciéndolas más claras y consistentes.
        - Animaciones sutiles o transiciones para mejorar la percepción de fluidez.
    3.  **Actualización de Datos de Perfil por el Cliente (Nueva Funcionalidad - `ProfileTab.tsx`):**
        - **Frontend (`ProfileTab.tsx`):**
          - Diseñar y desarrollar una nueva pestaña "Mi Perfil" en `CustomerDashboardPage.tsx`.
          - Formulario para que el cliente pueda ver y editar: Nombre, Teléfono. (El email, al ser el identificador principal, podría ser no editable o requerir un proceso de verificación más complejo).
          - Opción para cambiar contraseña (requiere campos: contraseña actual, nueva contraseña, confirmar nueva contraseña).
          - (Opcional) Funcionalidad para subir/cambiar una foto de perfil (requiere integración con Cloudinary similar a la de admin para recompensas).
        - **Backend (API - Nuevos Endpoints en `customer.routes.ts` o `user.routes.ts`):**
          - `PATCH /api/customer/profile` (o `/api/user/profile`): Para actualizar nombre, teléfono. Validar datos (ej. formato teléfono).
          - `POST /api/customer/profile/change-password` (o `/api/user/profile/change-password`): Para cambiar contraseña. Validar contraseña actual antes de permitir el cambio. Hashear nueva contraseña.
          - (Opcional) Endpoint para gestionar la subida de foto de perfil del cliente.
    4.  **Internacionalización (i18n):** Asegurar que todos los nuevos textos y mensajes de error/éxito estén traducidos.

- **D2. [BAJA/MEDIA] LCo - Gestión de Notificaciones al Cliente (Email/Push)**

  - **Dependencia:** Funcionalidades LCo que disparan notificaciones (registro, subida de nivel, recompensa asignada/canjeada).
  - **Objetivo Detallado:** Implementar un sistema para enviar notificaciones relevantes a los clientes (inicialmente por email, futuramente push si hay app móvil) para mejorar el engagement y la comunicación.
  - **Sub-Tareas Detalladas (Backend):**
    1.  **Modelo `NotificationTemplate` (Prisma):**
        - Campos: `id`, `businessId`, `eventName` (Enum: `CUSTOMER_REGISTERED`, `TIER_UPGRADED`, `REWARD_ASSIGNED_GIFT`, `REWARD_REDEEMED_POINTS`, `PASSWORD_RESET_REQUEST` - aunque este último ya tiene su propia lógica), `subject_es`, `subject_en`, `body_html_es`, `body_html_en` (con placeholders tipo `{{customerName}}`, `{{tierName}}`, `{{rewardName}}`, `{{pointsBalance}}`), `isActive`.
    2.  **API de Gestión de Plantillas (Admin LCo):**
        - Endpoints CRUD para que el `BUSINESS_ADMIN` gestione estas plantillas de email.
        - UI en el panel de admin para editar el asunto y cuerpo (quizás con un editor WYSIWYG básico) de las plantillas para cada evento.
    3.  **Lógica de Envío de Notificaciones:**
        - En los servicios LCo correspondientes (ej. `registration.service.ts` tras crear cliente, `tier-logic.service.ts` tras subir de nivel, `points.service.ts` tras canje, `admin-customer-individual.service.ts` tras asignar regalo), disparar el envío de la notificación.
        - Función helper `sendNotification(userId, eventName, contextData)` que:
          - Obtiene el `User` y su `Business`.
          - Busca la `NotificationTemplate` activa para el `eventName` y `businessId`.
          - Reemplaza los placeholders en el `subject` y `body_html` con `contextData`.
          - (Post-MVP LCo) Se integra con un servicio de envío de email (ej. SendGrid, Mailgun, AWS SES) para enviar el correo. Inicialmente, podría loguear el email a consola.
  - **Sub-Tareas Detalladas (Frontend):**
    1.  **(Post-MVP LCo) UI de Preferencias de Notificación (en `ProfileTab.tsx` del cliente):** Switches para que el cliente elija qué tipos de notificaciones por email desea recibir. (Requiere campo `notificationPreferences` en `User` model).

- **D3. [BAJA/MEDIA] LCo - Estadísticas Avanzadas para Admin (`AdminOverview.tsx` y nueva página de reportes)**

  - **Dependencia:** LCo MVP funcional, acumulación de datos de actividad.
  - **Objetivo Detallado:** Proveer al `BUSINESS_ADMIN` de visualizaciones y datos más profundos sobre el rendimiento de su programa de fidelización.
  - **Sub-Tareas Detalladas (Backend - Nuevos Endpoints en `admin-stats.service.ts` y `admin-stats.controller.ts`):**
    1.  **Puntos de Datos Adicionales:**
        - Clientes por nivel (`COUNT(User)` agrupado por `currentTierId`).
        - Recompensas más canjeadas (por puntos y como regalo).
        - Actividad de clientes TOP (ej. top 10 por puntos ganados, gasto, o visitas en un periodo).
        - Tasa de canje de puntos (puntos gastados / puntos ganados).
        - Promedio de puntos por cliente.
        - Frecuencia de validación de QR.
    2.  **Endpoints para Series Temporales:**
        - `GET /api/admin/stats/timeseries/customers?period=...&interval=...` (Nuevos clientes, clientes activos).
        - `GET /api/admin/stats/timeseries/points?period=...&interval=...` (Puntos emitidos, puntos canjeados).
        - `GET /api/admin/stats/timeseries/redemptions?period=...&interval=...` (Canjes de recompensas, canjes de regalos).
  - **Sub-Tareas Detalladas (Frontend - Nueva página `/admin/dashboard/lco-reports` y mejoras en `AdminOverview.tsx`):**
    1.  **Componentes de Gráficos:** Integrar una librería de gráficos (ej. Recharts, Chart.js) para visualizaciones.
    2.  **Nuevos Dashboards/Secciones:**
        - Gráficos de evolución (líneas/barras) para clientes, puntos, canjes a lo largo del tiempo (semana, mes, año).
        - Gráfico de tarta/barras para distribución de clientes por nivel.
        - Tablas con recompensas más populares y clientes TOP.
        - Filtros por periodo de tiempo para los reportes.

- **D4. [MEDIA] Plataforma - Mejoras UI/UX Panel Admin General (LCo y LC)**

  - **Objetivo Detallado:** Unificar la apariencia y mejorar la usabilidad general de todas las secciones del panel de administración.
  - **Sub-Tareas Detalladas (Frontend):**
    1.  **Sistema de Diseño Consistente:**
        - Revisar y asegurar que todos los componentes de Mantine UI (botones, inputs, tablas, modales, notificaciones, alerts) se usen de forma consistente en LCo y LC Admin.
        - Definir y aplicar espaciados, tipografía y paleta de colores de forma coherente.
    2.  **Componentes Reutilizables:**
        - Crear/Identificar componentes comunes (ej. `ActionConfirmModal`, `DataTableWrapper` con paginación y búsqueda, `ImageUploadInput` con recorte) y refactorizar para maximizar su reutilización.
        - Considerar una carpeta `components/common` o `components/shared`.
    3.  **Gestión de Subida de Imágenes Mejorada:**
        - Mostrar barra de progreso durante la subida de la imagen a Cloudinary (si la API de Cloudinary o el backend lo permiten).
        - Mejorar la previsualización de la imagen seleccionada antes y después del recorte.
        - Feedback más claro sobre errores de subida (tamaño, tipo, etc.).
    4.  **Navegación y Layout:**
        - Revisar la estructura de `AdminNavbar.tsx` para asegurar claridad a medida que se añaden más secciones (especialmente para LC).
        - Mejorar el layout de las páginas de gestión (CRUDs) para que sean más intuitivas.

- **D5. [BAJA/MEDIA] Plataforma - Documentación API Swagger/OpenAPI más Detallada**

  - **Objetivo Detallado:** Asegurar que la documentación de la API generada por Swagger sea completa, precisa y fácil de entender para todos los endpoints.
  - **Sub-Tareas Detalladas (Backend):**
    1.  **Revisión de Endpoints Existentes:**
        - Asegurar que cada endpoint (en todos los archivos `*.routes.ts` y `*.controller.ts`) tenga anotaciones JSDoc/TSDoc `@openapi` completas.
        - Descripciones claras para `summary` y `description`.
        - Definición precisa de `parameters` (path, query, header) con `schema`, `required`, `description`.
        - Definición completa de `requestBody` con `content`, `schema` (referenciando a DTOs en `components.schemas`) y ejemplos.
        - Definición de todas las `responses` posibles (200, 201, 400, 401, 403, 404, 409, 500) con `description` y `content` (referenciando DTOs de respuesta).
        - Uso correcto de `tags` para agrupar endpoints.
        - Especificación de `securitySchemes` (Bearer Auth) para endpoints protegidos.
    2.  **Definición de DTOs en `components.schemas`:**
        - Asegurar que todos los DTOs de entrada y salida estén definidos en la sección `components.schemas` de la configuración de Swagger (`index.ts`) y referenciados correctamente en los paths.
        - Proveer ejemplos para cada DTO.
    3.  **Nuevos Endpoints LC:** Documentar los endpoints de API de Camarero (listos para recoger, marcar servido) y futuras APIs (gestión de personal/mesas LC, permisos).

- **D6. [BAJA] Plataforma - Configuración Adicional del Negocio por el Admin**

  - **Objetivo Detallado:** Permitir al `BUSINESS_ADMIN` personalizar algunos aspectos básicos de la apariencia y datos de su negocio.
  - **Sub-Tareas Detalladas (Backend y Frontend):**
    1.  **Backend - Modelo `Business` Extendido:**
        - Añadir campos: `publicContactEmail?`, `publicPhoneNumber?`, `websiteUrl?`, `addressLine1?`, `addressCity?`, `addressPostalCode?`, `addressCountry?`.
    2.  **Backend - API:** Endpoint `PATCH /api/admin/business/settings` para que el `BUSINESS_ADMIN` actualice estos nuevos campos.
    3.  **Frontend - UI Admin:**
        - Nueva página/sección en el panel de admin (ej. `/admin/dashboard/business-settings`).
        - Formulario para editar: Logo del negocio (subida a Cloudinary), Color de Marca Primario (selector de color), Nombre del negocio (ya editable vía `/api/profile` o un endpoint dedicado), y los nuevos campos de contacto/dirección.
        - Esta información (ej. logo, colores) podría usarse para personalizar la `PublicMenuViewPage` de LC o los emails de LCo.

- **D7. [MEDIA - POST LC MVP] LC - Integración Completa con Fidelización LCo**

  - **Dependencia:** Funcionalidad de marcar `Order`s LC como `PAID`. Lógica de Tiers y Puntos LCo robusta.
  - **Objetivo Detallado:** Crear una sinergia completa entre el consumo en el módulo Camarero y el programa de fidelización, automatizando la ganancia de puntos y permitiendo el uso de beneficios LCo en el flujo de LC.
  - **Sub-Tareas Detalladas (Backend y Frontend):**
    1.  **Acumulación Automática de Puntos por Pedidos LC:**
        - **Backend (Trigger):** Cuando un `Order` LC (con `customerLCoId` asociado) cambia su `OrderStatus` a `PAID` (este estado lo establecería un camarero o un futuro TPV/sistema de pago online).
        - **Backend (Lógica de Servicio - `order.service.ts` o un listener de eventos):**
          - Obtener el `finalAmount` del `Order` pagado.
          - Consultar la configuración del `Business` LCo: `pointsPerEuro` (o una nueva configuración `pointsPerEuroCamarero` si se quiere un ratio diferente para LC).
          - Aplicar multiplicadores de puntos del `Tier` actual del cliente LCo.
          - Crear una entrada en `ActivityLog` LCo (`type: POINTS_EARNED_ORDER_LC`, `description: "Puntos por pedido LC #XXXX"`, `relatedOrderId`: ID del `Order` LC).
          - Actualizar `User.points`, `User.totalSpend`, `User.totalVisits` del cliente LCo.
          - Disparar `updateUserTier(customerLCoId)` para recalcular su nivel.
    2.  **Canje de Recompensas LCo en el Flujo de Pedido LC (Avanzado):**
        - **Backend (Configuración Recompensa LCo):** Añadir un flag `isRedeemableInCamareroModule` a `Reward`. Si es un producto gratis, permitir mapear a un `MenuItem.id` específico de LC o a una categoría/tag.
        - **Frontend (Cliente - `ShoppingCartModal.tsx` o checkout LC):**
          - Si el cliente está logueado con LCo, mostrar una sección "Mis Recompensas Canjeables".
          - Listar las `Reward`s del cliente que son `isRedeemableInCamareroModule` y para las que tiene suficientes puntos (o son regalos).
        - **Frontend (Aplicación de Recompensa):**
          - Si es "Producto Gratis": Añadir el `MenuItem` mapeado al carrito LC con precio €0, o aplicar un descuento de línea.
          - Si es "Descuento X€": Aplicar como un descuento al total del pedido LC.
        - **Backend (Procesamiento de Pedido LC con Recompensa LCo):**
          - El payload del pedido LC debe incluir `appliedLcoRewardId`.
          - El servicio de creación de `Order` LC debe:
            - Comunicarse con LCo para marcar la `Reward` como canjeada (descontar puntos, crear `ActivityLog` `REWARD_REDEEMED_IN_LC_ORDER`).
            - Ajustar el `Order.totalAmount` o `OrderItem.totalItemPrice` en LC según la recompensa.
    3.  **Aplicación de Beneficios de Nivel LCo en Pedidos LC (Avanzado):**
        - **Backend (Configuración Beneficio de Tier LCo):** Un `TierBenefit` de tipo `PERCENTAGE_DISCOUNT` o `FIXED_AMOUNT_DISCOUNT` debe poder marcarse como "Aplicable en Módulo Camarero".
        - **Frontend (Cliente - `ShoppingCartModal.tsx` o checkout LC):** Si el cliente está logueado y su nivel LCo tiene un descuento aplicable, mostrarlo y aplicarlo automáticamente al subtotal del pedido LC.
        - **Backend (Procesamiento de Pedido LC):** El servicio de creación de `Order` LC debe verificar el nivel LCo del cliente, aplicar el descuento si corresponde al `Order.discountAmount`, y recalcular `Order.finalAmount`.
    4.  **Visualización en Historial LCo:** Asegurar que las nuevas entradas de `ActivityLog` (`POINTS_EARNED_ORDER_LC`, `REWARD_REDEEMED_IN_LC_ORDER`) se muestren claramente en el `ActivityTab.tsx` del cliente.

- **D8. [BAJA] Plataforma - Onboarding y Ayuda (Guías y Tooltips)**

  - **Objetivo Detallado:** Facilitar la adopción y el uso de la plataforma para nuevos administradores y clientes.
  - **Sub-Tareas Detalladas (Frontend):**
    1.  **Tooltips Contextuales:** Añadir tooltips (Mantine `Tooltip`) a botones, iconos y campos de formulario complejos en los paneles de administración (LCo y LC) y en el dashboard del cliente para explicar su función.
    2.  **Guías Rápidas / Tours Introductorios (Opcional Post-MVP):** Implementar un pequeño tour guiado (ej. usando una librería como Shepherd.js o React Joyride) para las primeras visitas al panel de admin o al dashboard de cliente, destacando las funcionalidades clave.
    3.  **Sección de FAQ / Ayuda:** Crear una página estática simple (o una sección en el panel de admin) con Preguntas Frecuentes y respuestas sobre el uso de LCo y LC.

- **D9. [BAJA/MEDIA] Plataforma - Optimización y Rendimiento General**
  - **Objetivo Detallado:** Asegurar que la plataforma sea rápida, eficiente y escale bien a medida que crece el número de usuarios y datos.
  - **Sub-Tareas Detalladas:**
    1.  **Backend - Optimización de Consultas Prisma:**
        - Usar `prisma.$setLogging(['query'])` en desarrollo para inspeccionar las queries SQL generadas.
        - Analizar consultas lentas (ej. en listados paginados con muchos filtros/joins, cálculos de estadísticas) y optimizarlas (ej. añadiendo índices en la BD, reestructurando queries Prisma, usando `$queryRaw` para queries complejas si es necesario).
        - Evaluar el uso de `select` en Prisma para obtener solo los campos necesarios y reducir la carga de datos.
    2.  **Frontend - Optimización de Renderizado y Carga:**
        - **Lazy Loading de Rutas/Componentes:** Usar `React.lazy` y `Suspense` para cargar componentes de páginas solo cuando sean necesarios, mejorando el tiempo de carga inicial.
        - **Memoización:** Usar `React.memo`, `useMemo`, `useCallback` para prevenir re-renderizados innecesarios de componentes y cálculos costosos.
        - **Optimización de Imágenes:**
          - Asegurar que las imágenes subidas a Cloudinary se sirvan con transformaciones optimizadas (tamaño, formato, calidad) según el contexto donde se muestren.
          - Usar lazy loading para imágenes en listados largos (`loading="lazy"` en `<img>` o componentes de imagen de Mantine).
        - **Bundle Size Analysis:** Usar herramientas (ej. `rollup-plugin-visualizer`) para analizar el tamaño del bundle de producción e identificar dependencias grandes o código innecesario.
    3.  **Gestión de Estado Frontend:** Si la complejidad de la gestión de estado global aumenta significativamente (especialmente con LC), evaluar la adopción de una librería de gestión de estado más robusta que Context API (ej. Zustand, Jotai, Redux Toolkit) si los props drilling o la complejidad del Context se vuelven un problema.

---

## E. DEUDA TÉCNICA Y MEJORAS CONTINUAS (Transversales) 🛠️

_(Estas son tareas transversales que abordan la calidad del código, la mantenibilidad y la robustez general de la plataforma. Se deben abordar de forma continua según la capacidad y la criticidad.)_

- **E1. [ALTA] Refactorización y Reorganización de Código Continuo**

  - **Objetivo Detallado:** Mantener una base de código limpia, organizada, mantenible y escalable.
  - **Sub-Tareas Detalladas (Backend):**
    1.  **Revisión de Estructura de Carpetas:** A medida que los módulos LC y LCo crecen, revisar la organización de `services/`, `controllers/`, `routes/`. Considerar subcarpetas por módulo o por funcionalidad principal dentro de cada módulo (ej. `backend/src/camarero/order-processing/order.service.ts`, `backend/src/camarero/menu-management/menu-item.service.ts`).
    2.  **Extracción de Lógica Común:** Identificar lógica de negocio o utilidades repetidas en múltiples servicios/controladores y extraerlas a `helpers/` o `utils/` compartidos (ej. funciones de paginación, formateo de datos, validaciones complejas reutilizables).
    3.  **Principio de Responsabilidad Única (SRP):** Revisar servicios y controladores para asegurar que no se vuelvan demasiado grandes o manejen demasiadas responsabilidades dispares. Dividirlos si es necesario.
  - **Sub-Tareas Detalladas (Frontend):**
    1.  **Organización de Componentes:** A medida que la UI crece, asegurar una estructura de carpetas granular y lógica para los componentes (ej. `components/common/` para UI genérica, `features/feature-name/components/` para componentes específicos de una funcionalidad, `pages/PageName/components/` para subcomponentes de página).
    2.  **Gestión de Estado Global (Revisión):** Si la complejidad del estado compartido entre componentes (especialmente en LC - KDS, Camarero, Pedido Cliente) se vuelve difícil de manejar con Context API y props drilling, evaluar la adopción de una solución de gestión de estado más avanzada (Zustand, Jotai, Redux Toolkit) para módulos específicos o globalmente.
    3.  **Custom Hooks:** Continuar encapsulando lógica de UI compleja, interacciones con API, y gestión de estado local en custom hooks (`hooks/`) para promover la reutilización y la separación de preocupaciones.
    4.  **Estilos CSS:** Mantener la organización de los archivos CSS Modules. Considerar un sistema de design tokens o variables CSS globales para temas y consistencia si Mantine UI no cubre todas las necesidades.

- **E2. [MEDIA] Mejorar la Gestión y Presentación de Errores (Backend y Frontend)**

  - **Objetivo Detallado:** Proveer un manejo de errores más robusto, consistente y amigable para el usuario, y más informativo para los desarrolladores.
  - **Sub-Tareas Detalladas (Backend):**
    1.  **Códigos de Error HTTP Específicos:** Revisar todos los controladores para asegurar que se devuelven los códigos de estado HTTP más apropiados para cada tipo de error (ej. 400 para validación, 401 no autenticado, 403 prohibido, 404 no encontrado, 409 conflicto, 422 entidad no procesable, 500 error servidor).
    2.  **Mensajes de Error Consistentes y Útiles:**
        - Para errores de validación, devolver mensajes claros que indiquen qué campo falló y por qué.
        - Para errores de negocio (ej. "stock insuficiente", "transición de estado no permitida"), mensajes descriptivos.
        - En producción, los errores 500 no deben exponer detalles internos, pero en desarrollo/logs sí.
    3.  **Clases de Error Personalizadas (Opcional):** Considerar crear clases de error personalizadas (ej. `ValidationError`, `NotFoundError`, `BusinessLogicError`) que extiendan `Error` para un manejo más estructurado en los `catch` y en el manejador de errores global.
  - **Sub-Tareas Detalladas (Frontend):**
    1.  **Componente `ErrorBoundary` Global:** Implementar un `ErrorBoundary` de React a un nivel alto de la aplicación (ej. en `App.tsx` o `MainLayout.tsx`) para capturar errores de renderizado no controlados en componentes hijos y mostrar una UI de fallback amigable en lugar de una pantalla blanca.
    2.  **Presentación de Errores de API:**
        - Asegurar que todas las llamadas API (en hooks y servicios) manejen los errores `catch` de forma robusta.
        - Mostrar notificaciones (Mantine `notifications`) claras y accionables al usuario. Evitar mensajes genéricos como "Error" cuando se dispone de más detalles del backend.
        - Para errores de formulario, mostrar los mensajes de error directamente debajo de los campos correspondientes.
    3.  **Logging de Errores Frontend:** Considerar integrar un servicio de logging de errores en el cliente (ej. Sentry, LogRocket) para capturar y analizar errores que ocurren en los navegadores de los usuarios en producción.

- **E3. [MEDIA] Actualización de Dependencias Periódica y Gestión de Vulnerabilidades**

  - **Objetivo Detallado:** Mantener el software seguro y al día con las últimas versiones estables de las dependencias.
  - **Sub-Tareas Detalladas (Backend y Frontend):**
    1.  **Revisión Periódica (ej. trimestral):**
        - Ejecutar `npm outdated` o `yarn outdated` para identificar dependencias desactualizadas.
        - Investigar los "breaking changes" antes de actualizar versiones mayores.
        - Actualizar dependencias de forma incremental y probar exhaustivamente después de cada actualización importante.
    2.  **Auditoría de Seguridad:**
        - Ejecutar `npm audit` o `yarn audit` regularmente para detectar vulnerabilidades conocidas en las dependencias.
        - Aplicar parches o actualizar según las recomendaciones de la auditoría.
    3.  **Node.js y TypeScript:** Mantenerse al tanto de las versiones LTS de Node.js y las versiones estables de TypeScript, y planificar actualizaciones cuando sea apropiado.

- **E4. [EN PROGRESO - LC] Validación Robusta Backend con Zod (Continuación)**

  - **Objetivo Detallado:** Aplicar validación de esquemas con Zod a todos los DTOs de entrada (body, params, query) en todos los módulos, comenzando con las APIs más críticas de LC.
  - **Sub-Tareas Detalladas (Backend):**
    1.  **Definición de Schemas Zod:** Para cada DTO (ej. `CreateOrderPayloadDto`, `CreateMenuItemDto`, `UpdateRewardDto`, etc.), crear un schema Zod correspondiente que defina los tipos, formatos, obligatoriedad, y reglas de validación específicas (min/max length, enums, etc.).
    2.  **Middleware de Validación Zod:** Crear o usar un middleware genérico que tome un schema Zod y valide `req.body`, `req.params`, o `req.query` contra él. Si la validación falla, el middleware debe responder con un error 400 y los detalles de los errores de Zod.
    3.  **Integración en Controladores/Rutas:** Aplicar este middleware de validación a las rutas correspondientes antes de que lleguen al handler del controlador.
    4.  **Prioridad:** API pública de creación de pedidos LC, API de KDS, API de Camarero, luego APIs de Admin LCo y LC.

- **E5. [BAJA/MEDIA] Optimización de Consultas a Base de Datos (Continuo)**

  - **Objetivo Detallado:** Identificar y mejorar el rendimiento de consultas a la base de datos que puedan ser lentas o ineficientes.
  - **Sub-Tareas Detalladas (Backend):**
    1.  **Análisis con Prisma Client Extensions o Logging:**
        - Utilizar `prisma.$setLogging(['query', 'info', 'warn', 'error'])` en desarrollo para ver todas las queries SQL generadas por Prisma.
        - Considerar Prisma Client Extensions para añadir middleware que mida el tiempo de ejecución de las queries.
    2.  **Herramientas de Base de Datos:** Usar `EXPLAIN ANALYZE` en PostgreSQL para entender el plan de ejecución de queries lentas identificadas.
    3.  **Optimización:**
        - **Índices:** Añadir índices en la BD (`@index` o `@@index` en `schema.prisma`) a columnas frecuentemente usadas en cláusulas `WHERE`, `ORDER BY`, o en `JOINs` (relaciones).
        - **Selección de Campos (`select`):** En queries `findMany` o `findUnique`, usar `select` para traer solo los campos estrictamente necesarios, especialmente si se incluyen relaciones.
        - **Paginación Eficiente:** Asegurar que la paginación basada en `skip` y `take` sea eficiente (generalmente lo es para PostgreSQL con buenos índices). Evitar cargar todos los datos en memoria para paginar.
        - **Evitar N+1 Queries:** Al cargar relaciones, usar `include` de Prisma para un Eager Loading eficiente en lugar de hacer múltiples queries separadas en un bucle.
        - **Queries Raw (`$queryRaw`):** Para casos muy complejos donde el ORM no genera SQL óptimo, considerar el uso de `$queryRawUnsafe` o `$executeRawUnsafe` con precaución, asegurando la sanitización de entradas.

- **E6. [MEDIA] Documentación Interna del Código (JSDoc/TSDoc)**

  - **Objetivo Detallado:** Mejorar la comprensión y mantenibilidad del código mediante comentarios claros y estandarizados.
  - **Sub-Tareas Detalladas (Backend y Frontend):**
    1.  **Funciones y Métodos Públicos:** Añadir comentarios JSDoc/TSDoc a todas las funciones exportadas, métodos de clase públicos, y funciones complejas. Describir el propósito, parámetros (`@param`), y valor de retorno (`@returns`).
    2.  **Tipos y Interfaces:** Documentar el propósito de tipos e interfaces complejos o DTOs.
    3.  **Lógica Compleja:** Añadir comentarios en línea para explicar secciones de código que sean particularmente complejas o tengan una lógica no obvia.
    4.  **Decisiones de Diseño:** Comentar brevemente las razones detrás de ciertas decisiones de diseño o workarounds si no son autoevidentes.
    5.  **TODOs y FIXMEs:** Usar `// TODO:` para tareas pendientes y `// FIXME:` para problemas conocidos que necesitan corrección, idealmente con una breve explicación o referencia a un issue tracker.

- **E7. [ALTA] Variables de Entorno y Configuración Centralizada**

  - **Objetivo Detallado:** Asegurar que todas las configuraciones sensibles o específicas del entorno se gestionen a través de variables de entorno y estén bien documentadas.
  - **Sub-Tareas Detalladas (Backend y Frontend):**
    1.  **Revisión y Centralización:**
        - **Backend:** Auditar el código para identificar cualquier valor hardcodeado que debería ser una variable de entorno (ej. secretos, API keys, URLs de servicios externos, configuraciones de cron, límites, etc.). Moverlos a `.env`.
        - **Frontend:** Variables como `VITE_API_BASE_URL` ya están en `.env.[mode]`. Revisar si hay otras configuraciones que deban gestionarse de forma similar.
    2.  **Documentación (`.env.example`):**
        - Asegurar que `backend/.env.example` y `frontend/.env.example` (si aplica) estén completos, actualizados, y con comentarios claros que expliquen cada variable y cómo obtener/configurar su valor.
        - Indicar qué variables son obligatorias y cuáles opcionales.
    3.  **Carga y Acceso en la Aplicación:**
        - **Backend:** Usar `dotenv` al inicio de `index.ts`. Acceder a las variables mediante `process.env.VARIABLE_NAME`. Considerar un archivo `config.ts` que exporte un objeto de configuración validado y tipado a partir de `process.env`.
        - **Frontend:** Acceder a variables `VITE_...` mediante `import.meta.env.VITE_VARIABLE_NAME`.

- **E8. [MEDIA] Accesibilidad (a11y) Frontend (Continuo)**

  - **Objetivo Detallado:** Asegurar que la aplicación sea usable por personas con diversas discapacidades.
  - **Sub-Tareas Detalladas (Frontend):**
    1.  **Uso Semántico de HTML:** Utilizar etiquetas HTML apropiadas para su propósito (ej. `<nav>`, `<button>`, `<main>`, `<aside>`, encabezados `<h1>`-`<h6>` en orden lógico).
    2.  **Atributos ARIA:** Añadir atributos ARIA (`aria-label`, `aria-describedby`, `role`, etc.) donde sea necesario para mejorar la semántica para lectores de pantalla, especialmente en componentes personalizados o interacciones complejas. Mantine UI ya maneja bien esto para sus componentes.
    3.  **Navegación por Teclado:** Asegurar que todos los elementos interactivos (botones, enlaces, inputs, selects) sean completamente accesibles y operables usando solo el teclado (orden de tabulación lógico, indicadores de foco visibles).
    4.  **Contraste de Color:** Verificar que el contraste entre el texto y el fondo cumpla con las directrices WCAG AA (Mantine UI suele gestionarlo bien, pero verificar personalizaciones).
    5.  **Texto Alternativo para Imágenes:** Proveer `alt` text descriptivo para todas las imágenes significativas (`<img>`, `MantineImage`). Para imágenes decorativas, usar `alt=""`.
    6.  **Herramientas de Auditoría:** Usar regularmente herramientas de navegador (Lighthouse, Axe DevTools) para identificar y corregir problemas de accesibilidad.
    7.  **Testing con Lectores de Pantalla (Opcional Avanzado):** Realizar pruebas manuales con lectores de pantalla (NVDA, VoiceOver) para flujos de usuario críticos.

- **E9. [BAJA/MEDIA] CI/CD (Integración Continua / Despliegue Continuo) Básico**
  - **Objetivo Detallado:** Automatizar los procesos de linting, testing, build y (eventualmente) despliegue.
  - **Sub-Tareas Detalladas (Infraestructura/DevOps):**
    1.  **Configuración de GitHub Actions (u otra herramienta CI/CD):**
        - **Workflow para Pull Requests/Push a Main:**
          - Checkout del código.
          - Setup de Node.js.
          - Instalación de dependencias (backend y frontend).
          - Ejecución de Linters (ESLint para ambos).
          - Ejecución de Tests Unitarios/Integración (Vitest para backend y frontend).
          - (Opcional) Build de producción (`yarn build` en backend y frontend) para verificar que compila sin errores.
        - Notificar el resultado del workflow (éxito/fallo) en el PR.
    2.  **(Futuro - Despliegue Continuo):**
        - Una vez que los tests pasen en la rama `main` (o una rama de `release`), el workflow podría continuar para:
          - Construir los artefactos de producción.
          - Desplegarlos al entorno de staging/producción (ej. Render, Vercel, VPS con Docker).
          - Ejecutar migraciones de base de datos (`prisma migrate deploy`).
          - Reiniciar el servidor de aplicación.

---

## F. VISIÓN FUTURA / MÓDULOS ADICIONALES (Post-LC MVP y Mejoras LCo) 🚀

_(Estas son ideas y posibles direcciones futuras para LoyalPyME una vez que el Módulo Camarero (LC) y las mejoras clave de LoyalPyME Core (LCo) estén consolidadas. Su viabilidad y priorización se evaluarán en su momento.)_

- **F1. LC - Funcionalidades Muy Avanzadas de Hostelería**

  - **Objetivo:** Expandir significativamente las capacidades del Módulo Camarero para cubrir operaciones más complejas y mejorar aún más la experiencia del cliente y la eficiencia del negocio.
  - **Sub-Funcionalidades Potenciales:**
    1.  **Pago Online Integrado en la Mesa (Cliente):**
        - **Cliente:** Desde `OrderStatusPage.tsx` (o una página de "Pagar Cuenta"), el cliente podría iniciar el pago de su/s `Order`(s).
        - **Integración Pasarela de Pago:** Integración con Stripe, PayPal, u otras pasarelas locales.
        - **Backend:** Endpoints para crear intentos de pago, manejar webhooks de confirmación de pago, y actualizar `Order.status` a `PAID`.
        - **Seguridad:** Cumplimiento PCI DSS (manejado mayormente por la pasarela si se usa integración tipo Elements/Checkout).
    2.  **División de Cuentas Avanzada (Iniciada por Cliente):**
        - **Cliente:** En una mesa con múltiples `Order`s (o un `Order` grande), permitir a los clientes seleccionar qué ítems quieren pagar individualmente o cómo dividir el total de forma equitativa o por importes.
        - **Backend:** Lógica para gestionar sub-pagos, actualizar `Order`s (o crear `Order`s divididos) y conciliar con la pasarela de pago.
    3.  **Sistema de Reservas (`Reservation` model):**
        - **Cliente:** Interfaz para ver disponibilidad de mesas y solicitar una reserva (fecha, hora, número de personas, notas).
        - **Admin/Camarero:** Panel para gestionar reservas (confirmar, rechazar, asignar mesa, ver ocupación).
        - **Backend:** Modelo `Reservation` (con `status`, `timeSlot`, `partySize`, `customerId?`, `tableId?`), lógica de disponibilidad, notificaciones de confirmación.
    4.  **Gestión de Inventario Básico para LC:**
        - **Admin:** Interfaz para definir ingredientes/productos con stock limitado.
        - **Backend:** Modelo `InventoryItem` (asociado a `MenuItem` o `ModifierOption`). Lógica para descontar stock cuando se piden ítems. Alertas de bajo stock.
        - **Cliente:** `MenuItem`s/opciones podrían mostrarse como "agotado" si el stock es cero.
    5.  **Informes Avanzados LC:**
        - **Admin:** Paneles con análisis detallados de ventas por ítem, categoría, periodo. Rendimiento de mesas (rotación, ticket medio). Tiempos promedio de preparación por KDS/ítem. Popularidad de modificadores.

- **F2. Módulo Pedidos Online / Take Away / Delivery (Extensión de LC)**

  - **Objetivo:** Permitir a los clientes realizar pedidos desde fuera del establecimiento para recoger (Take Away) o para envío a domicilio (Delivery).
  - **Sub-Funcionalidades Potenciales:**
    1.  **Interfaz Cliente Web/PWA:** Similar a `PublicMenuViewPage.tsx` pero adaptada para pedidos externos. Selección de tipo de pedido (Take Away / Delivery).
    2.  **Horarios de Recogida/Entrega:** Selector de franjas horarias disponibles.
    3.  **Gestión de Pedidos Take Away:** El pedido llega al KDS. El cliente recibe notificaciones de estado (Recibido, En Preparación, Listo para Recoger).
    4.  **Gestión de Pedidos Delivery:**
        - **Admin:** Configuración de zonas de reparto (polígonos en mapa o códigos postales), costes de envío por zona, pedido mínimo.
        - **Cliente:** Introducción de dirección de entrega, validación de zona.
        - **Backend/KDS/Camarero:** Flujo para asignar repartidor (si es propio) o integrarse con plataformas de delivery. Seguimiento del estado del envío.
    5.  **Pago Online:** Requisito fundamental para este módulo.

- **F3. App Móvil Dedicada (PWA Progresiva y/o Nativa)**

  - **Objetivo:** Mejorar la experiencia de usuario y el engagement mediante una aplicación móvil.
  - **Sub-Funcionalidades Potenciales:**
    1.  **App Cliente (LCo y LC):**
        - Acceso más rápido al dashboard LCo, carta LC.
        - Notificaciones Push (promociones, estado del pedido, recompensas).
        - Uso de funcionalidades nativas (ej. escáner QR más integrado, geolocalización para ofertas).
        - Posibilidad de guardar métodos de pago.
    2.  **App Staff (LC - Opcional):**
        - Versión optimizada para móvil/tablet de la Interfaz de Camarero y/o KDS.
        - Notificaciones push para camareros (nuevos ítems listos, llamadas de mesa).

- **F4. Pruebas Automatizadas E2E (End-to-End)**

  - **Objetivo:** Asegurar la fiabilidad de los flujos de usuario críticos mediante pruebas automatizadas que simulen la interacción real.
  - **Herramientas:** Cypress, Playwright.
  - **Flujos a Cubrir:**
    - LCo: Registro cliente, login, validación QR, canje recompensa.
    - LC (Cliente): Navegación carta, personalización ítem, añadir a carrito, enviar pedido, ver estado.
    - LC (Admin): Crear categoría/ítem.
    - LC (KDS): Ver ítem, cambiar estado.
    - LC (Camarero): Ver ítem listo, marcar servido.

- **F5. Monetización Avanzada y Planes de Suscripción Detallados (Plataforma)**

  - **Objetivo:** Implementar un sistema de facturación para los negocios que usan LoyalPyME, con diferentes planes de servicio.
  - **Sub-Funcionalidades Potenciales:**
    1.  **Definición de Planes:** (Ej. Básico, Pro, Premium) con diferentes límites (nº clientes LCo, nº ítems carta LC, nº staff LC) y acceso a funcionalidades avanzadas (estadísticas avanzadas, integraciones, módulos adicionales).
    2.  **Integración Pasarela de Pago (para Negocios):** Stripe Subscriptions, etc.
    3.  **Panel Super Admin:** Gestión de suscripciones de negocios, facturación, trials.
    4.  **Panel Admin Negocio:** Visualización de su plan actual, opciones de upgrade/downgrade.

- **F6. Personalización y CRM Avanzado (Transversal LCo/LC)**

  - **Objetivo:** Proveer herramientas más potentes para que los negocios entiendan y se comuniquen con sus clientes de forma personalizada.
  - **Sub-Funcionalidades Potenciales:**
    1.  **Segmentación de Clientes Avanzada (LCo):**
        - Filtros por comportamiento (ej. clientes que no visitan hace X tiempo, clientes que gastan más de Y, clientes que canjean ciertas recompensas).
        - Creación de segmentos dinámicos.
    2.  **Campañas de Marketing Dirigidas (LCo):**
        - Enviar emails/notificaciones push (si hay app) a segmentos específicos con ofertas personalizadas.
    3.  **Historial de Cliente Unificado 360º:**
        - En el panel de admin, al ver un cliente, mostrar no solo su actividad LCo sino también un resumen de sus pedidos LC (ítems más pedidos, gasto promedio LC, etc.).
    4.  **Motor de Recomendaciones Simple (LC/LCo):** Sugerir ítems en la carta LC basados en pedidos anteriores, o recompensas LCo basadas en preferencias.

- **F7. Gamificación Avanzada (LCo)**

  - **Objetivo:** Aumentar el engagement del cliente con el programa de fidelización mediante mecánicas de juego.
  - **Sub-Funcionalidades Potenciales:**
    - **Insignias/Badges:** Por logros (ej. "Visitante Frecuente", "Experto en Cafés", "Nivel Oro Alcanzado").
    - **Retos/Challenges:** (Ej. "Pide 3 cafés esta semana y gana 50 puntos extra").
    - **Rankings (Opcional, con cuidado de privacidad):** Top clientes por puntos (si se opta por hacerlo público o interno para el admin).
    - **Bonificaciones Especiales:** Por rachas de visitas, cumpleaños, eventos especiales.

- **F8. (VISIÓN A LARGO PLAZO) Módulo TPV (Terminal Punto de Venta) Integrado**

  - **Objetivo:** Ofrecer una solución TPV completa dentro de LoyalPyME, especialmente para negocios de hostelería que no tengan un sistema existente o busquen una solución unificada.
  - **Sub-Funcionalidades Potenciales:**
    1.  **Interfaz TPV (Tablet/Escritorio):**
        - Toma de pedidos (similar a interfaz camarero, pero con más opciones de pago/gestión).
        - Gestión de mesas (abrir, cerrar, transferir, dividir cuenta).
        - Procesamiento de pagos (múltiples métodos: efectivo, tarjeta - integración con datafonos, pago online LC).
        - Impresión de tickets/facturas simplificadas (integración con impresoras térmicas).
    2.  **Gestión de Caja:** Apertura, cierres (arqueo básico), registro de entradas/salidas de efectivo.
    3.  **Integración Profunda con LC y LCo:**
        - Los pedidos de LC se reflejan automáticamente en el TPV.
        - El pago en TPV marca el `Order` LC como `PAID` y dispara la asignación de puntos LCo.
        - Canje de recompensas/beneficios LCo directamente desde la interfaz del TPV.

- **F9. (VISIÓN A MUY LARGO PLAZO) Módulo Contabilidad / Integraciones Contables**
  - **Objetivo:** Facilitar la gestión contable para los negocios.
  - **Sub-Funcionalidades Potenciales:**
    1.  **Exportación de Datos:** Exportar informes de ventas, gastos (si se gestionan), etc., en formatos compatibles con software de contabilidad (CSV, Excel).
    2.  **Integraciones Directas (Avanzado):** Conexión con sistemas contables populares (ej. QuickBooks, Xero, Holded) para sincronizar datos de ventas automáticamente.

---
