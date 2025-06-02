# LoyalPyME - Plan de Desarrollo y Futuras Funcionalidades

**Última Actualización:** 3 de Junio de 2025 (Refleja solución bug modificadores, KDS y Servicio de Camarero (entrega) funcionales. Detalla implementación de "Pedir Cuenta", "Marcar Como Pagado" y "Liberar Mesa" como próximos pasos críticos para LC. Actualiza estado de testing y validación Zod.)

Este documento detalla las tareas pendientes inmediatas, el alcance definido para las próximas versiones operativas (con énfasis en el Módulo Camarero - LC), la deuda técnica y las ideas para la evolución futura. Se busca un máximo detalle para guiar el desarrollo, incluyendo consideraciones de UX, modelos de datos implicados, y flujos de trabajo.

---

## A. TRABAJO RECIENTEMENTE COMPLETADO / EN PROGRESO / CORRECCIONES ✅

⭐ **[COMPLETADO - MVP Base Plataforma] Panel Super Admin y Gestión de Negocios/Módulos (backend, frontend)**

- **Detalles Alcanzados:**
  - **Backend:** Modelo `Business` en Prisma con flags booleanos `isActive`, `isLoyaltyCoreActive`, `isCamareroActive`. API Endpoints (`/api/superadmin/*`) protegidos por rol `SUPER_ADMIN` para listar todos los negocios y permitir la activación/desactivación de su estado general y de sus módulos específicos. Lógica en el servicio de perfil de usuario (`/api/profile` - `auth.middleware.ts`) para incluir el `slug`, `name`, `logoUrl` del negocio asociado, así como los flags de estado de los módulos, para roles `BUSINESS_ADMIN` y `CUSTOMER_FINAL`.
  - **Frontend:** Página `/superadmin` (`SuperAdminPage.tsx`) con tabla de negocios (mostrando ID, nombre, slug, estado general, estado de módulos LCo y LC). Switches interactivos en cada fila para que el `SUPER_ADMIN` pueda gestionar el estado general del negocio y la activación/desactivación de cada módulo individualmente. Lógica de datos para obtener y enviar actualizaciones implementada.
  - **Integración Módulos:** Middleware `checkModuleActive(moduleCode)` en el backend para proteger rutas específicas de módulos. Lógica condicional en la UI del frontend (ej. `AdminNavbar.tsx`, `CustomerDashboardPage.tsx`) para mostrar/ocultar funcionalidades (enlaces de navegación, secciones de página) basándose en los flags `isLoyaltyCoreActive` e `isCamareroActive` del negocio del usuario, obtenidos de su perfil.

⭐ **[COMPLETADO - Módulo Camarero - Gestión de Carta Digital] LC - Backend (Modelos BD y API) y Frontend (UI Admin) para Gestión Completa de Carta Digital.**

- **Detalles Alcanzados (Backend - Modelos Prisma):**
  - **Modelos Principales:** `Table` (`identifier`, `zone`), `MenuCategory` (`name_es/en`, `imageUrl`, `position`, `isActive`), `MenuItem` (`name_es/en`, `price`, `imageUrl`, `allergens` (String[]), `tags` (String[]), `isAvailable`, `position`, `preparationTime`, `calories`, `sku`, `kdsDestination`), `ModifierGroup` (`name_es/en`, `uiType` (Enum `RADIO`|`CHECKBOX`), `minSelections`, `maxSelections`, `isRequired`, `position`, `groupId` en `ModifierOption` como clave foránea).
  - **Modelos de Pedido:** `Order` (con `orderNumber`, `status` (Enum `OrderStatus`), `totalAmount`, `finalAmount`, `orderNotes`), `OrderItem` (con `priceAtPurchase`, `totalItemPrice`, `kdsDestination`, `status` (Enum `OrderItemStatus`), `itemNameSnapshot_es/en`), `OrderItemModifierOption` (con snapshots de nombre y precio de opción).
  - **Modelos de Staff:** `StaffPin` (asociado a `User` con `pinHash`).
  - **Enums:** `UserRole` extendido con `WAITER`, `KITCHEN_STAFF`, `BAR_STAFF`. Enums `ModifierUiType`, `OrderStatus`, `OrderItemStatus`, `OrderType`.
  - **Internacionalización:** Campos de texto relevantes (nombres, descripciones) en modelos de carta con sufijos `_es` y `_en`.
  - **Relaciones:** Definidas correctamente con `onDelete`/`onUpdate` según necesidad.
- **Detalles Alcanzados (Backend - API Gestión Carta Admin):**
  - Endpoints CRUD completos (`/api/camarero/admin/menu/*`) para `MenuCategory`, `MenuItem`, `ModifierGroup`, y `ModifierOption`.
  - Protección de endpoints mediante `authenticateToken`, `checkRole([UserRole.BUSINESS_ADMIN])`, y `checkModuleActive('CAMARERO')`.
  - Lógica de servicios para validaciones de unicidad.
- **Detalles Alcanzados (Frontend - Admin UI Gestión Carta):**
  - Página `/admin/dashboard/camarero/menu-editor` (`MenuManagementPage.tsx`).
  - Componentes `MenuCategoryManager.tsx`, `MenuItemManager.tsx`, `MenuItemFormModal.tsx`, `ModifierGroupsManagementModal.tsx`, `ModifierOptionsManagementModal.tsx` completamente funcionales para CRUD, incluyendo subida de imágenes con recorte a Cloudinary.
  - Hooks de datos y tipos TypeScript implementados.
  - Botón "Previsualizar Carta Pública".

⭐ **[ACTUALIZADO Y COMPLETADO - Módulo Camarero - Vista Cliente y Flujo de Pedido con Modificadores] LC - Backend y Frontend: Visualización de Carta, Configuración de Ítems, Carrito y Envío de Pedido por Cliente Final.**

- **Detalles Alcanzados (Backend - Vista Carta Pública):**
  - Endpoint `GET /public/menu/business/:businessSlug` funcional.
- **Detalles Alcanzados (Frontend - Vista Carta Pública - `PublicMenuViewPage.tsx`):**
  - Visualización interactiva de la carta (`CategoryAccordion.tsx`, `MenuItemCard.tsx`).
  - **Selección de Modificadores (`ModifierGroupInteractiveRenderer.tsx`):** Funcional, con validación de reglas y actualización dinámica de precio.
  - **Carrito de Compra:** Estado local (`currentOrderItems`) y persistencia en `localStorage` funcionales. Modal del carrito (`ShoppingCartModal.tsx`) para revisión y modificación.
- **Detalles Alcanzados (Backend - Creación de Pedido):**
  - API `POST /public/order/:businessSlug` recibe `CreateOrderDto`.
  - **SOLUCIÓN BUG MODIFICADORES:**
    - **Validación Exhaustiva y Procesamiento Correcto:** El backend ahora valida y procesa correctamente los `selectedModifierOptions` enviados.
    - **DTOs del Backend (`order.dto.ts`):** Se han definido y decorado correctamente con `@ValidateNested({ each: true })` y `@Type(() => SelectedOrderModifierOptionDto)` para asegurar la transformación de arrays anidados.
    - **Controller (`order.controller.ts`):** Los handlers de Express utilizan `plainToInstance` para transformar `req.body` en instancias de DTOs tipados antes de pasar al servicio.
    - **Service (`order.service.ts`):** Utiliza `groupId` consistentemente (según `schema.prisma`) para la lógica de modificadores. El `select` de Prisma para opciones de modificadores ahora usa `groupId: true` y Prisma Client ha sido regenerado (`npx prisma generate`).
    - **Resultado:** Los pedidos con modificadores obligatorios y opcionales se crean exitosamente.
  - Recálculo de Precios Backend y Creación Transaccional funcionando como se espera.
- **Detalles Alcanzados (Frontend - Post-Envío Pedido en `PublicMenuViewPage.tsx`):**
  - Notificaciones, limpieza de carrito local, guardado de `activeOrderInfo` en `localStorage` y redirección a `/order-status/:orderId` operativos.
- **Detalles Alcanzados (Frontend - Acceso Cliente LCo):** Tarjeta "Ver la Carta y Pedir" en `CustomerDashboardPage.tsx` funcional.

⭐ **[COMPLETADO - Módulo Camarero - KDS Funcional (Backend API, Lógica de Estados y Frontend con Acciones)]**

- **A4.1. KDS Backend (API y Lógica de Estados): [COMPLETADO Y VALIDADO]**
  - Endpoints API (`/api/camarero/kds/*`): `GET /items` y `PATCH /items/:orderItemId/status` funcionales y protegidos.
  - Lógica de Estados (`kds.service.ts` v1.1.1): Actualización de `OrderItem.status` y `Order.status` general (RECEIVED -> IN_PROGRESS -> PARTIALLY_READY -> ALL_ITEMS_READY) validada.
- **A4.2. Cliente: Visualización del Estado del Pedido: [COMPLETADO]**
  - Backend (`GET /public/order/:orderId/status`) funcional.
  - Frontend (`OrderStatusPage.tsx`): Muestra dinámica de estados, polling, y lógica de "Pedido Finalizado" para `PAID`/`CANCELLED` (limpieza de `localStorage` y redirección).
  - Frontend (`PublicMenuViewPage.tsx`): Detección de pedido activo funcional.
- **A4.3. KDS Frontend (Visualización y Acciones Básicas): [COMPLETADO]**
  - Configuración Frontend (Tipos, Login, Rutas, Servicio KDS) funcional.
  - Página KDS (`KitchenDisplayPage.tsx` v1.1.0): Visualización de ítems por destino, polling, y acciones de cambio de estado (`PENDING_KDS` -> `PREPARING` -> `READY`; `CANCELLED`) con feedback y notificaciones.

⭐ **[NUEVO - COMPLETADO] Módulo Camarero - Ciclo de Servicio de Camarero (Entrega de Ítems)**

- **Backend (API y Lógica de Servicio - `waiter.service.ts`, `waiter.controller.ts`):**
  - Endpoint `GET /api/camarero/staff/ready-for-pickup`: Implementado y funcional. Devuelve `OrderItem`s con estado `READY` para el negocio del camarero, incluyendo información detallada del pedido y del ítem.
  - Endpoint `PATCH /api/camarero/staff/order-items/:orderItemId/status` (con payload `{ "newStatus": "SERVED" }`): Implementado y funcional. Actualiza `OrderItem.status` a `SERVED`, registra `OrderItem.servedAt` y `OrderItem.servedById` (ID del camarero).
  - **Lógica de `Order.status = COMPLETED` VALIDADA:** El servicio `waiter.service.ts` actualiza correctamente `Order.status` a `COMPLETED` cuando todos sus `OrderItem`s activos (no cancelados) son `SERVED`.
- **Frontend (Interfaz de Camarero - `WaiterPickupPage.tsx`):**
  - Página `/admin/camarero/pickup-station` accesible y protegida por rol (`WAITER`/`BUSINESS_ADMIN`).
  - Visualización de ítems listos para recoger (estado `READY`) con detalles del pedido, ítem y modificadores.
  - Acción "Marcar como Servido" funcional: Llama a la API del backend, muestra feedback visual (loader), y tras éxito, el ítem desaparece de la lista.
  - Polling implementado para el refresco automático de la lista de ítems listos.

---

## B. PRIORIDADES ACTUALES: Módulo "LoyalPyME Camarero" (LC) - Completar Ciclo de Pedido 🚀

El objetivo inmediato es completar el ciclo de vida del pedido en el módulo Camarero, implementando las funcionalidades para solicitar la cuenta y procesar el pago, culminando con la liberación de la mesa.

**BLOQUE 1: CIERRE FINANCIERO DEL PEDIDO Y GESTIÓN DE MESAS**

**B1.1. ⭐ [CRÍTICO - PENDIENTE] LC - Pedir la Cuenta (Cliente y/o Camarero)** - **Objetivo Detallado:** Implementar la funcionalidad para que un cliente pueda solicitar la cuenta desde `OrderStatusPage.tsx` y/o un camarero pueda marcarla como solicitada, cambiando el estado del pedido a `PENDING_PAYMENT`. - **Sub-Tareas Detalladas (Backend):** 1. **`schema.prisma` (Modelo `Order`):** - Añadir `isBillRequested: Boolean @default(false)` (para una indicación explícita si es útil para la UI del camarero). - Confirmar que `OrderStatus.PENDING_PAYMENT` está disponible en el enum. 2. **`OrderService`:** - Nuevo método: `async requestBill(orderId: string, { requestedByRole: 'CUSTOMER' | 'WAITER', staffUserId?: string, paymentPreference?: string /*ej. efectivo, tarjeta*/, payAmountInput?: string /*ej. "Paga con 50€"*/ }): Promise<Order>` - Lógica: - Validar `orderId` y pertenencia al negocio si `staffUserId` presente. - Verificar estado actual del `Order` (debe ser apropiado, ej. `COMPLETED`, `ALL_ITEMS_READY`, `IN_PROGRESS`). - Actualizar `Order.status = OrderStatus.PENDING_PAYMENT`. - Establecer `Order.isBillRequested = true`. - (Opcional) Registrar `paymentPreference` y `payAmountInput` en campos nuevos en `Order` si se decide guardar esta información. 3. **Controladores y Rutas:** - Endpoint público para cliente: `POST /public/order/:orderId/request-bill` (DTO en body opcional para preferencias de pago). - Endpoint protegido para camarero: `POST /api/camarero/staff/order/:orderId/request-bill` (DTO en body opcional, `staffUserId` del `req.user`). - **Sub-Tareas Detalladas (Frontend - Cliente `OrderStatusPage.tsx`):** 1. Añadir botón "Pedir la Cuenta" (visible si `Order.status` es `COMPLETED`, `ALL_ITEMS_READY`, `IN_PROGRESS`; y no `PENDING_PAYMENT`, `PAID`, o `CANCELLED`). 2. (Opcional) Modal o inputs para que el cliente indique preferencia de pago o si pagará con un billete de cierto valor (para el cambio). 3. Llamar al endpoint `POST /public/order/:orderId/request-bill` con los datos opcionales. 4. Tras éxito, la UI debe actualizarse (el polling debería reflejar `PENDING_PAYMENT`). Mensaje "Cuenta solicitada. Un camarero se acercará." El botón se deshabilita/oculta. - **Sub-Tareas Detalladas (Frontend - Camarero - Interfaz de Gestión de Pedidos/Mesas):** 1. En la vista de mesas/pedidos, los pedidos en `PENDING_PAYMENT` (o con `isBillRequested = true`) deben destacarse visualmente. 2. (Opcional) Permitir al camarero marcar un pedido como `PENDING_PAYMENT` manualmente si el cliente lo pide verbalmente.

**B1.2. ⭐ [CRÍTICO - PENDIENTE] LC - Marcar Pedido como Pagado y Liberar Mesa (Camarero)** - **Objetivo Detallado:** Permitir al camarero/admin marcar un pedido como `PAID`, registrar detalles opcionales del pago, y que la mesa asociada se marque como disponible, integrando la asignación de puntos LCo si aplica. - **Sub-Tareas Detalladas (Backend):** 1. **`schema.prisma`:** - Modelo `Order`: Confirmar `paidAt: DateTime?`. Añadir `paidByUserId: String?` y la relación `User.ordersPaidByMe: Order[] @relation("OrdersPaidByStaff")`. Añadir `paymentMethodUsed: String?` (ej. "EFECTIVO", "TARJETA_VISA", "BIZUM"). - Modelo `Table`: Añadir `status: String @default("AVAILABLE")` (considerar Enum `TableStatus`: `AVAILABLE`, `OCCUPIED`, `PENDING_PAYMENT_TABLE`, `NEEDS_CLEANING`, `RESERVED`). El nombre `PENDING_PAYMENT_TABLE` es para distinguirlo del estado de la orden. 2. **`OrderService`:** Nuevo método `async markOrderAsPaid(orderId: string, paidByUserId: string, paymentDetails?: { method?: string; notes?: string }): Promise<Order>`. - Lógica: - Validar `orderId`, `paidByUserId` y pertenencia al negocio. - Verificar que el pedido esté en `PENDING_PAYMENT` (o `COMPLETED` si se permite pagar directamente). - Actualizar `Order.status = OrderStatus.PAID`. - Establecer `Order.paidAt = new Date()`, `Order.paidByUserId = paidByUserId`. - Guardar `Order.paymentMethodUsed` y `Order.notes` si se proveen en `paymentDetails`. - **Liberar Mesa:** Si `Order.tableId` existe, obtener la `Table` y actualizar su `Table.status = "AVAILABLE"` (o `NEEDS_CLEANING` según el flujo deseado). - **Integración LCo (Asignación de Puntos):** - Si `Order.customerLCoId` existe y `Business.isLoyaltyCoreActive` es `true`: - Obtener `Order.finalAmount`, `Business.pointsPerEuro`. - Obtener el `User` (cliente) y su `Tier` actual para aplicar multiplicadores de puntos. - Calcular puntos ganados. - Crear registro en `ActivityLog` (type: `POINTS_EARNED_ORDER_LC`, `pointsChanged`, `relatedOrderId`). - Actualizar `User.points`, `User.totalSpend`, `User.totalVisits`. - Llamar a la lógica de `updateUserTier(customerLCoId)` (del `tier-logic.service.ts`). 3. **Controladores y Rutas:** Nuevo endpoint `POST /api/camarero/staff/order/:orderId/mark-as-paid` (protegido para `WAITER`/`BUSINESS_ADMIN`). DTO para `paymentDetails`. - **Sub-Tareas Detalladas (Frontend - Camarero - Interfaz de Gestión de Pedidos/Mesas):** 1. Para pedidos en `PENDING_PAYMENT`: Botón "Marcar Como Pagada" / "Registrar Pago". 2. (Opcional) Modal para confirmar pago, introducir método de pago utilizado, y notas. 3. Llamar al endpoint del backend. 4. Actualizar la UI para reflejar el pedido como `PAID` y la mesa como `AVAILABLE`. - **Sub-Tareas Detalladas (Frontend - Cliente `OrderStatusPage.tsx`):** 1. El polling detectará el cambio a `Order.status = PAID`. 2. Mostrar mensaje "¡Pedido Pagado! Gracias por tu visita." 3. Activar lógica de "Pedido Finalizado" para limpiar `localStorage`.

**B1.3. ⭐ [MEDIA - PENDIENTE] LC - Cliente/Backend: Añadir Ítems a Pedido Existente** - **Objetivo:** Permitir a los clientes añadir más ítems a su pedido activo que aún no ha sido pagado o está en proceso. - **Backend:** - Endpoint: `POST /public/order/:existingOrderId/add-items` (actualmente `POST /api/public/order/:orderId/items` que usa `OrderService.addItemsToOrder`). Confirmar que la ruta es pública y segura para esta acción. - `OrderService.addItemsToOrder`: - Revisar lógica de transición de estados: Si un pedido `COMPLETED` o `PENDING_PAYMENT` recibe nuevos ítems, debería volver a `IN_PROGRESS` (o mantenerse en `PENDING_PAYMENT` pero con el total actualizado y `isBillRequested` a `false` si ya se había pedido la cuenta). - Asegurar recálculo correcto de `Order.totalAmount` y `Order.finalAmount`. - **Frontend (`PublicMenuViewPage.tsx`):** - Si hay `activeOrderInfo` y el pedido NO está `PAID`/`CANCELLED`: - Habilitar la carta para añadir ítems. - El carrito de compra se usa para los nuevos ítems. - El botón de envío cambia a "Añadir a Pedido #X". - Al enviar, llamar al endpoint. Tras éxito, actualizar la `OrderStatusPage` (forzar refresco o confiar en polling) o notificar al usuario.

---

## C. FUNDAMENTOS TÉCNICOS ESENCIALES LC (Paralelo y Continuo)

**C1. [ACTUALIZADO - ALTA] Testing Backend:** - **Objetivo:** Cobertura robusta de toda la lógica de negocio y endpoints de LC. - **COMPLETADO:** Tests unitarios y de integración para la lógica de `Order.status` en `kds.service.ts`. Tests (manuales/Postman) para el flujo de creación de pedido con modificadores. - **PENDIENTE (Prioridad Alta):** - Tests unitarios para `waiter.service.ts` (obtener ítems listos, marcar servido, actualizar `Order.status` a `COMPLETED`). - Tests de integración (Supertest/Vitest) para endpoints de API de Camarero (`/api/camarero/staff/*`). - Tests unitarios y de integración para la nueva lógica de "Pedir Cuenta" y "Marcar Como Pagado" en `OrderService`. - Tests para API `addItemsToOrder`. - **PENDIENTE (A medida que se desarrollan):** Tests para API de gestión de personal/mesas/PINs, y futura API de permisos.

**C2. [CRÍTICA - EN PROGRESO] Validación Robusta Backend (Zod o `class-validator`):** - **Objetivo:** Implementar validación exhaustiva y schemas bien definidos para todos los datos de entrada (body, params, query) de las APIs de LC. - **Acciones Actuales/Inmediatas:** - Se está usando `class-validator` con decoradores en los DTOs (`order.dto.ts`, `camarero.dto.ts`, etc.). - Se está usando `plainToInstance` en handlers de Express para asegurar la transformación basada en estos DTOs. - **PENDIENTE:** - Revisión exhaustiva para asegurar que todos los DTOs de todos los endpoints (especialmente los nuevos para "Pedir Cuenta" y "Marcar Como Pagado") tengan todas las validaciones necesarias (`@IsString`, `@IsNumber`, `@IsOptional`, `@IsArray`, `@ValidateNested`, `@Type`, etc.). - Si se opta por Zod, planificar la migración o integración progresiva.

**C3. [ALTA - PENDIENTE] Seguridad LC:** - **Autenticación:** - **KDS:** Evaluar si el login actual de `KITCHEN_STAFF`/`BAR_STAFF` es suficiente o si se necesita un sistema de tokens de dispositivo KDS dedicados para mayor seguridad. - **Camareros (`WAITER`):** Confirmar que el flujo de login estándar (email/password) es el deseado. Implementar y probar la lógica de autenticación para `StaffPin` si se decide usarla para login rápido. - **Autorización:** - Revisión exhaustiva de todos los endpoints de LC para asegurar que `authenticateToken`, `checkRole`, y `checkModuleActive` se aplican correctamente. - Asegurar que todas las operaciones que modifican datos verifican pertenencia al `businessId` del usuario. - **Planificar** cómo se integrará el futuro sistema de permisos granulares (B3.4 del plan original) con la autorización actual.

**C4. [ALTA - EN PROGRESO] Logging y Monitoring Básico LC:** - **Objetivo:** Logs detallados para depuración y auditoría. - **Acciones:** - Se han añadido logs extensivos (`this.logger`) en `OrderService`, `KdsService`, `WaiterService` para trazar el flujo y los datos. - Añadir logs para los nuevos flujos de "Pedir Cuenta" y "Marcar Como Pagado". - Loguear creación/modificación de entidades clave de LC (Mesas cuando se implemente su gestión). - **Considerar** un formato de log estructurado (JSON) para facilitar análisis futuro.

**C5. [MEDIA - PENDIENTE] Internacionalización (i18n) Completa LC:** - **Objetivo:** Todas las interfaces de usuario del Módulo Camarero deben ser traducibles. - **Frontend:** - `KitchenDisplayPage.tsx`: Traducir textos de botones, estados, etiquetas. - `WaiterPickupPage.tsx`: Traducir todos los textos. - `OrderStatusPage.tsx`: Verificar completitud de traducciones para nuevos estados y acciones. - Paneles de Admin LC (`MenuManagementPage.tsx`, futura gestión de personal/mesas): Traducir todos los labels, placeholders, notificaciones. - **Backend:** Asegurar que los mensajes de error de API sean genéricos o provean claves i18n si es necesario (preferible traducir en frontend).

---

## D. FUNCIONALIDADES LOYALPYME CORE (LCo) Y MEJORAS PLATAFORMA - (Prioridad Re-evaluada Post-LC MVP Cierre de Pedido)

_(Se mantiene el contenido de la versión anterior del plan para esta sección, ya que el foco actual es el Módulo Camarero. Estas tareas se re-priorizarán una vez el flujo completo de LC esté operativo y estable.)_

- **D1. [MEDIA] LCo - Mejoras UX/UI Panel Cliente**
- **D2. [BAJA/MEDIA] LCo - Gestión de Notificaciones al Cliente (Email/Push)**
- **D3. [BAJA/MEDIA] LCo - Estadísticas Avanzadas para Admin**
- **D4. [MEDIA] Plataforma - Mejoras UI/UX Panel Admin General**
- **D5. [BAJA/MEDIA] Plataforma - Documentación API Swagger/OpenAPI más Detallada**
- **D6. [BAJA] Plataforma - Configuración Adicional del Negocio por el Admin**
- **D7. [MEDIA - POST LC MVP] LC - Integración Completa con Fidelización LCo** (Esta tarea se vuelve más relevante una vez el pago esté implementado en LC)
- **D8. [BAJA] Plataforma - Onboarding y Ayuda (Guías y Tooltips)**
- **D9. [BAJA/MEDIA] Plataforma - Optimización y Rendimiento General**

---

## E. DEUDA TÉCNICA Y MEJORAS CONTINUAS (Transversales) 🛠️

_(Se mantiene el contenido de la versión anterior del plan para esta sección, añadiendo lecciones específicas de la reciente depuración.)_

- **E1. [ALTA] Refactorización y Reorganización de Código Continuo**
- **E2. [MEDIA] Mejorar la Gestión y Presentación de Errores (Backend y Frontend)**
- **E3. [MEDIA] Actualización de Dependencias Periódica y Gestión de Vulnerabilidades**
- **E4. [EN PROGRESO - LC] Validación Robusta Backend (`class-validator` y `class-transformer`):**
  - **Confirmado:** El uso correcto de decoradores en DTOs y `plainToInstance` (para handlers Express) o `ValidationPipe` con `transform:true` (para NestJS puro) es esencial para la deserialización de payloads anidados. Esta área ha sido significativamente mejorada.
  - **Pendiente:** Continuar aplicando y revisando validaciones en todos los DTOs.
- **E5. [BAJA/MEDIA] Optimización de Consultas a Base de Datos (Continuo)**
- **E6. [MEDIA] Documentación Interna del Código (JSDoc/TSDoc)**
- **E7. [ALTA] Variables de Entorno y Configuración Centralizada**
- **E8. [MEDIA] Accesibilidad (a11y) Frontend (Continuo)**
- **E9. [BAJA/MEDIA] CI/CD (Integración Continua / Despliegue Continuo) Básico**

---

## F. VISIÓN FUTURA / MÓDULOS ADICIONALES (Post-LC MVP y Mejoras LCo) 🚀

_(Se mantiene el contenido de la versión anterior del plan para esta sección.)_

- **F1. LC - Funcionalidades Muy Avanzadas de Hostelería** (Pago Online, División de Cuentas, Reservas, Inventario Básico, Informes Avanzados)
- **F2. Módulo Pedidos Online / Take Away / Delivery (Extensión de LC)**
- **F3. App Móvil Dedicada (PWA Progresiva y/o Nativa)**
- **F4. Pruebas Automatizadas E2E (End-to-End)**
- **F5. Monetización Avanzada y Planes de Suscripción Detallados (Plataforma)**
- **F6. Personalización y CRM Avanzado (Transversal LCo/LC)**
- **F7. Gamificación Avanzada (LCo)**
- **F8. (VISIÓN A LARGO PLAZO) Módulo TPV (Terminal Punto de Venta) Integrado**
- **F9. (VISIÓN A MUY LARGO PLAZO) Módulo Contabilidad / Integraciones Contables**

---
