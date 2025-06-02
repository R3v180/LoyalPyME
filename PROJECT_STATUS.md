# LoyalPyME - Estado del Proyecto y Decisiones Clave

**Versión Actual:** 1.20.0 (LC: Creación de Pedidos con Modificadores SOLUCIONADO, Ciclo KDS y Servicio de Camarero (preparación/entrega) Completado y Validado)
**Fecha de Última Actualización:** 3 de Junio de 2025

---

## 1. Resumen General del Proyecto LoyalPyME 🎯

- **Concepto:** LoyalPyME es una plataforma web integral, diseñada como una solución Software as a Service (SaaS) modular, orientada a Pequeñas y Medianas Empresas (PyMEs). Su arquitectura full-stack se basa en tecnologías modernas:
  - **Frontend:** React con TypeScript, utilizando Vite como herramienta de construcción y Mantine UI para la biblioteca de componentes, asegurando una experiencia de usuario responsive y moderna. La navegación se gestiona con React Router DOM y la internacionalización (i18n) con `i18next`.
  - **Backend:** Node.js con Express.js y TypeScript, interactuando con una base de datos PostgreSQL a través del ORM Prisma. La autenticación se maneja con JSON Web Tokens (JWT).
    La plataforma ofrece dos módulos principales que los negocios pueden activar según sus necesidades:
  - **LoyalPyME Core (LCo):** Un sistema de fidelización digital robusto y completo. **[Funcionalmente Completo para MVP]**.
    - **Características Clave LCo:** Gestión integral de clientes (con roles), sistema de acumulación de puntos (configurable por negocio), niveles de fidelización (tiers) con beneficios personalizables (multiplicadores de puntos, acceso a recompensas exclusivas, beneficios textuales), catálogo de recompensas canjeables (con soporte i18n para nombres/descripciones e imágenes individuales), generación de códigos QR únicos para la asignación de puntos en transacciones físicas, y un panel de cliente interactivo donde pueden visualizar su progreso, saldo de puntos, recompensas disponibles, regalos asignados por el administrador, y el historial de su actividad en el programa.
  - **LoyalPyME Camarero (LC):** Un módulo avanzado, **[EN DESARROLLO ACTIVO - Flujo de creación de pedidos, ciclo KDS y ciclo de servicio por camarero (preparación y entrega de ítems) COMPLETADOS Y VALIDADOS. Próximo paso: Flujo de "Pedir Cuenta" y "Marcar Como Pagado"]**, diseñado para digitalizar y optimizar la operativa de servicio en el sector de la hostelería (restaurantes, bares, cafeterías).
    - **Funcionalidades Clave LC Implementadas y Validadas:**
      1.  **Gestión Completa de Carta Digital (Admin):** Interfaz administrativa para crear, editar y organizar categorías del menú (con imágenes), ítems del menú (con detalles como i18n para nombre/descripción, precio, imagen, lista de alérgenos, etiquetas personalizables, tiempo de preparación estimado, calorías, SKU, y destino KDS), y grupos de modificadores con opciones configurables (tipo de UI radio/checkbox, selecciones mínimas/máximas, obligatoriedad, ajustes de precio).
      2.  **Visualización de Carta y Toma de Pedidos por Cliente (con Modificadores):** Acceso a través de URL específica (ej. `/m/:businessSlug/:tableIdentifier?`). Interfaz interactiva para explorar la carta, **personalizar ítems con múltiples grupos de modificadores (obligatorios y opcionales, selección única y múltiple), con cálculo de precio dinámico y validación de reglas frontend precisa**. Se permite añadir a un carrito de compra local persistente (`localStorage`), revisar el pedido, añadir notas generales y enviar la comanda.
      3.  **Backend Robusto para Creación de Pedidos (con Modificadores):** El backend (`OrderService`, `OrderController`, DTOs en `order.dto.ts`, y la transformación con `plainToInstance` en el controller) **procesa correctamente los pedidos públicos, incluyendo la validación exhaustiva de modificadores (disponibilidad, reglas de grupo `min/maxSelections`, `isRequired`), recálculo de precios, y creación transaccional de `Order`, `OrderItem`s y `OrderItemModifierOption`s. El bug crítico de modificadores obligatorios ha sido SOLUCIONADO.**
      4.  **Gestión de Pedido Activo por Cliente:** La `PublicMenuViewPage` detecta si ya existe un pedido activo para esa mesa/navegador (información guardada en `localStorage`) y adapta la UI para mostrar el número de pedido en curso y un enlace a su estado. (Funcionalidad de "Añadir a Pedido Existente" está detallada como próxima tarea).
      5.  **Visualización del Estado del Pedido por Cliente:** La página `OrderStatusPage` muestra el estado general del pedido y el estado individual de cada ítem (ej. "En preparación", "Listo para servir", "Servido"), actualizándose automáticamente mediante polling. Gestiona la lógica de "pedido finalizado" (cuando el estado es `PAID` o `CANCELLED`) para limpiar el `localStorage` y permitir al cliente iniciar un nuevo pedido.
      6.  **API KDS (Backend): [COMPLETADA Y VALIDADA]** Endpoints robustos (`/api/camarero/kds/*`) para que las pantallas de cocina/barra (KDS) obtengan los `OrderItem`s filtrados por destino y estado. Permite actualizar el `OrderItemStatus` (ej. de `PENDING_KDS` a `PREPARING`, luego a `READY`, o a `CANCELLED`). La lógica en `kds.service.ts` que actualiza el `Order.status` general del pedido basada en los cambios de estado de sus ítems ha sido **validada y funciona correctamente.**
      7.  **Interfaz KDS (Frontend - MVP): [FUNCIONALIDAD BASE COMPLETADA]** La página `/admin/kds` (`KitchenDisplayPage.tsx`) permite al personal de cocina/barra autenticado seleccionar su destino KDS, visualizar ítems pendientes/en preparación, y actualizar su estado ("Empezar Preparación", "Marcar como Listo", "Cancelar Ítem") mediante botones de acción, con polling para refresco automático.
      8.  **API Servicio Camarero (Backend - Entrega de Ítems): [COMPLETADA Y VALIDADA]** Endpoints (`/api/camarero/staff/*`) para que los camareros obtengan ítems listos para recoger (`OrderItem.status = READY`) y para marcar ítems como `SERVED`. La lógica en `waiter.service.ts` actualiza `OrderItem.status` a `SERVED`, registra `servedAt`, y **actualiza `Order.status` a `COMPLETED` si todos los ítems activos del pedido están servidos. Esta lógica ha sido validada y funciona correctamente.**
      9.  **Interfaz Camarero (Frontend - MVP Entrega de Ítems): [FUNCIONALIDAD BASE COMPLETADA]** La página `/admin/camarero/pickup-station` (`WaiterPickupPage.tsx`) permite al personal de sala autenticado visualizar los ítems listos para recoger y marcarlos como "Servido", desapareciendo de la lista. Implementa polling para refresco.
- **Componentes Tecnológicos Clave Detallados:**
  - **Backend:** Node.js (runtime JavaScript), Express.js (framework web), TypeScript (tipado estático), Prisma ORM (interacción con base de datos PostgreSQL, versión 6+), PostgreSQL (base de datos relacional), JSON Web Tokens (JWT) (para autenticación stateless basada en tokens), `bcryptjs` (hashing de contraseñas), Cloudinary SDK (almacenamiento y gestión de imágenes en la nube), Multer (middleware para manejo de subidas de archivos multipart/form-data), Swagger/OpenAPI (`swagger-jsdoc`, `swagger-ui-express`) (para documentación interactiva de la API), `node-cron` (para ejecución de tareas programadas), `class-validator` y `class-transformer` (para validación y transformación robusta de DTOs, crucial para el correcto parseo de payloads anidados).
  - **Frontend:** React (biblioteca para construir interfaces de usuario, versión 19+ con Hooks), TypeScript (tipado estático), Vite (herramienta de construcción y servidor de desarrollo rápido, versión 5+), Mantine UI (biblioteca de componentes React, versión 7+), Axios (cliente HTTP para peticiones a la API), React Router DOM (gestión de rutas en la aplicación de página única, versión 6+), `i18next` y `react-i18next` (para internacionalización completa ES/EN con archivos JSON de traducción), `html5-qrcode` (para la funcionalidad de escaneo de QR por el cliente en LCo), `react-image-crop` (para la funcionalidad de recorte de imágenes en los paneles de administración).
  - **Testing:** Vitest (framework de testing unitario y de integración para backend y frontend, compatible con el ecosistema Vite).
- **Licencia:** Software Propietario. Copyright (c) 2024-2025 Olivier Hottelet. Todos los derechos reservados. (Ver `LICENSE.md`).
- **Áreas Funcionales Principales de la Plataforma (Detallado):**
  - **Panel Super Admin (`/superadmin`):** Interfaz exclusiva para el rol `SUPER_ADMIN`. Permite la administración global de todas las instancias de negocios clientes registradas en la plataforma. Funcionalidades: listar negocios, ver su estado general (`isActive`), y activar/desactivar individualmente los módulos principales (LoyalPyME Core - `isLoyaltyCoreActive`, LoyalPyME Camarero - `isCamareroActive`) para cada negocio.
  - **Panel de Administración del Negocio (`/admin/dashboard/*`):** Interfaz para el rol `BUSINESS_ADMIN` de cada negocio. Las funcionalidades visibles y accesibles se adaptan según los módulos activados para su negocio.
    - **LCo (si `isLoyaltyCoreActive`):** Gestión completa de clientes del programa de fidelización (listado, filtros, búsqueda, ver detalles, editar notas, ajustar puntos, cambiar nivel manualmente, asignar recompensas como regalo, activar/desactivar cuentas), gestión de recompensas (CRUD con i18n e imágenes), gestión de niveles/tiers (CRUD de tiers y sus beneficios asociados), configuración global del programa de fidelización (base y periodo de cálculo de tiers, políticas de descenso), generación de QR de puntos para transacciones.
    - **LC (si `isCamareroActive` - `/admin/dashboard/camarero/*`):** Gestión completa de la carta digital (CRUD de categorías, ítems, grupos de modificadores y opciones de modificadores, con soporte i18n, imágenes, precios, etc.). Gestión de Mesas (`TableManager.tsx` para CRUD de mesas). Interfaz de Camarero para recogida de ítems listos (`WaiterPickupPage.tsx`). (Futuro: gestión de personal, PINs, configuración de destinos KDS, asignación de permisos granulares a staff).
  - **Interfaz KDS (Módulo LC - `/admin/kds`):** Interfaz para roles de staff de cocina/barra (`KITCHEN_STAFF`, `BAR_STAFF`) y `BUSINESS_ADMIN`. Permite visualizar los `OrderItem`s pendientes y en preparación para un `kdsDestination` específico, y cambiar su estado de preparación.
  - **Portal de Cliente Final (LCo - `/customer/dashboard`):** Dashboard personalizado para el rol `CUSTOMER_FINAL`. Muestra saldo de puntos, nivel actual y progreso al siguiente, catálogo de recompensas canjeables y regalos pendientes (con imágenes y descripciones i18n), historial detallado de actividad de puntos (paginado), y funcionalidad para validar QR de puntos (escaneo o manual). Si el módulo LC está activo para el negocio, incluye una tarjeta de acceso directo a la carta digital del negocio.
  - **Interfaces Públicas del Módulo Camarero (LC):**
    - **Carta Digital Pública (`/m/:businessSlug/:tableIdentifier?`):** Página accesible sin login. Muestra la carta del negocio de forma interactiva. Permite al cliente seleccionar ítems, personalizarlos con modificadores (cálculo de precio dinámico), añadir a un carrito local, revisar el pedido, añadir notas generales y enviar la comanda. Detecta si ya hay un pedido activo para esa mesa/navegador y adapta la UI.
    - **Visualización Estado del Pedido Cliente (`/order-status/:orderId`):** Página accesible sin login. Muestra el estado general del pedido y el estado individual de cada `OrderItem`, con actualizaciones automáticas por polling. Gestiona la lógica de "pedido finalizado" (`PAID` o `CANCELLED`) para limpiar el `localStorage` y permitir al cliente iniciar un nuevo pedido.
- **Propósito y Visión:** Convertirse en la herramienta digital de referencia, modular y altamente adaptable, que impulse la fidelización de clientes (LCo) y optimice drásticamente la operativa de servicio en PyMEs (LC), con un foco especial en el sector hostelero. El objetivo es mejorar la recurrencia de clientes, aumentar el ticket promedio, facilitar la gestión del negocio y enriquecer la relación cliente-negocio a través de experiencias digitales eficientes y gratificantes.

_(Para una descripción más detallada de la visión a largo plazo, consulta el [README.md](./README.md). Para la hoja de ruta y el backlog de funcionalidades, revisa [DEVELOPMENT_PLAN.md](./DEVELOPMENT_PLAN.md). Para los flujos de trabajo detallados de cada módulo, consulta `LOYALPYME_CORE_WORKFLOW.md`, `LOYALPYME_CAMARERO_WORKFLOW.md`, y `MODULE_INTEGRATION_WORKFLOW.md`)._

---

## 2. Estado Actual Detallado (Hitos Completados y En Progreso - v1.20.0) 📝

- **Fase 1 (Núcleo Operativo LCo + Pulido Inicial): [COMPLETADO]**

  - Autenticación Completa (Registro negocios y clientes, Login JWT, Reseteo de contraseña).
  - Panel de Administración LCo - CRUDs Completos:
    - Gestión de Recompensas (CRUD, i18n, imágenes Cloudinary).
    - Gestión de Niveles (Tiers) y Beneficios (CRUD, umbrales, asignación).
    - Configuración Global del Sistema de Tiers (Base cálculo, periodo, descenso, inactividad).
    - Gestión Avanzada de Clientes (Listado, filtros, búsqueda, detalles, notas admin, ajuste puntos, cambio nivel manual, asignación regalos, activar/desactivar, favoritos, acciones masivas).
  - Flujo Completo de Puntos y QR en LCo (Generación QR por Admin, Validación QR por Cliente, cálculo y asignación de puntos considerando multiplicadores de nivel).
  - Lógica de Tiers Automática (Backend LCo - `node-cron` para recálculo y descenso).
  - Panel de Cliente Completo LCo (`CustomerDashboardPage.tsx` con pestañas Resumen, Recompensas, Actividad).
  - Mejoras UI/UX Iniciales (Consistencia, usabilidad).
  - Internacionalización (i18n) Frontend (Base `i18next` y archivos JSON ES/EN).
  - Documentación API Backend (Swagger/OpenAPI) para servicios LCo.

- **Fase 2 (Fundamentos Multi-Módulo y Panel Super Admin): [COMPLETADO]**

  - Implementación del Panel Super Admin (`/superadmin`) para gestión de negocios y activación de módulos.
  - Middleware `checkModuleActive` (Backend) para proteger endpoints de módulos específicos.
  - Lógica Condicional en UI Frontend (`AdminNavbar`, `CustomerDashboardPage`) basada en módulos activos.
  - Payload de Perfil de Usuario (`/api/profile`) enriquecido con flags de módulos activos y detalles del negocio.
  - Script de Seed (`prisma/seed.ts`) actualizado (v7) y funcional, creando datos demo exhaustivos para LCo y LC (negocio, admin, clientes, tiers, recompensas, carta completa con modificadores, mesas, personal, pedidos de ejemplo con ítems KDS).

- **Fase 3 (Desarrollo Módulo "LoyalPyME Camarero" - LC): [EN PROGRESO AVANZADO - Flujo de Pedido y Servicio (pre-pago) COMPLETADO Y VALIDADO]**
  - **LC - Fundamentos Backend (Modelos BD y API Gestión Carta): [COMPLETADO]**
    - Modelos Prisma detallados y migrados para `Table`, `MenuCategory`, `MenuItem`, `ModifierGroup`, `ModifierOption`, `Order`, `OrderItem`, `OrderItemModifierOption`, `StaffPin`. Enums `OrderStatus`, `OrderItemStatus`, etc. definidos.
    - API CRUD Admin Carta (`/api/camarero/admin/*`) completa y protegida para `MenuCategory`, `MenuItem` (con `ModifierGroup`s), y `ModifierOption`s.
  - **LC - Frontend: UI Admin para Gestión de Carta Digital: [COMPLETADO]**
    - Página `/admin/dashboard/camarero/menu-editor` (`MenuManagementPage.tsx`) y componentes asociados (`MenuCategoryManager.tsx`, `MenuItemManager.tsx`, `MenuItemFormModal.tsx`, `ModifierGroupsManagementModal.tsx`, `ModifierOptionsManagementModal.tsx`) funcionales para CRUD completo de la carta, incluyendo subida de imágenes.
    - Hooks de datos y tipos para gestión de menú implementados. Botón "Previsualizar Carta Pública".
  - **LC - Backend y Frontend: Visualización de Carta Pública y Flujo de Pedido por Cliente (con Modificadores): [ACTUALIZADO - ROBUSTO Y VALIDADO]**
    - **Backend (API Pública de Menú - `/public/menu/business/:businessSlug`):** Funcional, sirve la carta completa y activa para el cliente.
    - **Frontend (Visualización de Carta - `/m/:businessSlug/:tableIdentifier?` - `PublicMenuViewPage.tsx`):**
      - Muestra interactiva de la carta, personalización de ítems con modificadores y cálculo de precio dinámico **validado y funcionando correctamente**.
      - Funcionalidad "Añadir al Carrito" y persistencia del carrito no enviado en `localStorage` operativa.
    - **Frontend (Modal del Carrito y Envío - `ShoppingCartModal.tsx`):** Funcional para revisión, modificación de cantidades, notas y envío.
    - **Backend (Creación de Pedido - `POST /public/order/:businessSlug`):**
      - **SOLUCIONADO BUG CRÍTICO:** El servicio (`OrderService`) ahora procesa y valida correctamente los `selectedModifierOptions` gracias a la corrección en el uso de `groupId` (en lugar de `modifierGroupId`), la implementación de `plainToInstance` en el `OrderController` para la transformación del `req.body` JSON, y la correcta definición de DTOs en `order.dto.ts` con decoradores `@Type`/`@ValidateNested`.
      - Recálculo de precios en backend y creación transaccional de `Order`, `OrderItem`s, y `OrderItemModifierOption`s funcionando como se espera.
    - **Frontend (Post-Envío Pedido en `PublicMenuViewPage.tsx`):** Guardado de `activeOrderInfo` en `localStorage` y redirección a `OrderStatusPage` operativos.
  - **LC - Cliente: Visualización del Estado del Pedido: [COMPLETADO]**
    - **Backend (`public/order.service.ts`):** Endpoint `GET /public/order/:orderId/status` (`PublicOrderStatusInfo`) funcional.
    - **Frontend (`PublicMenuViewPage.tsx` - Detección Pedido Activo):** Funcionalidad de detección y UI condicional operativa.
    - **Frontend (`OrderStatusPage.tsx`):** Muestra información del pedido y estado de ítems con polling. Lógica de "Pedido Finalizado" (`PAID` o `CANCELLED`) para limpiar `localStorage` y permitir nuevo pedido está implementada (se adaptará para `PENDING_PAYMENT`). Botón "Volver al Menú" funcional.
  - **LC - KDS Backend (API y Lógica de Estados): [COMPLETADO Y VALIDADO]**
    - Endpoints `GET /api/camarero/kds/items` y `PATCH /api/camarero/kds/items/:orderItemId/status` funcionales y protegidos.
    - Lógica de `Order.status` en `kds.service.ts` (actualización a `IN_PROGRESS`, `PARTIALLY_READY`, `ALL_ITEMS_READY`) basada en estados de `OrderItem`s **validada**.
  - **LC - KDS Frontend (Visualización y Acciones): [FUNCIONALIDAD BASE COMPLETADA]**
    - `KitchenDisplayPage.tsx` funcional: selección de destino KDS, visualización de ítems, polling, y acciones de cambio de estado (`PENDING_KDS` -> `PREPARING` -> `READY`; `CANCELLED`) con notificaciones.
  - **LC - Camarero Backend (Servicio y Entrega de Ítems): [COMPLETADO Y VALIDADO]**
    - Endpoints `GET /api/camarero/staff/ready-for-pickup` y `PATCH /api/camarero/staff/order-items/:orderItemId/status` (para marcar como `SERVED`) implementados y funcionales.
    - Lógica en `waiter.service.ts` para actualizar `OrderItem.status` a `SERVED` y `Order.status` a `COMPLETED` (si todos los ítems están servidos) **validada**.
  - **LC - Camarero Frontend (Recogida y Servicio de Ítems): [FUNCIONALIDAD BASE COMPLETADA]**
    - Página `WaiterPickupPage.tsx` (`/admin/camarero/pickup-station`) funcional: visualización de ítems `READY` y acción "Marcar como Servido" con actualización de la lista y notificaciones.

---

## 3. Key Concepts & Design Decisions 🔑

- **Arquitectura Modular y Activación por Negocio:** _(Confirmado y funcional)_
- **Estructura de Datos Detallada para Módulo Camarero (LC) (Resumen Clave):** _(Modelos Prisma estables y validados en el flujo actual)_
- **Flujo de Pedido LC - Cliente (Resumen Clave):**
  - **Creación de Nuevo Pedido:** El flujo desde la selección de ítems y modificadores por el cliente, la construcción del payload en el frontend, la recepción y transformación del DTO en el backend (controller usando `plainToInstance` y DTOs con decoradores), y el procesamiento y validación en el servicio (incluyendo la correcta gestión de `groupId` de modificadores) está **ahora robusto y validado.**
- **Flujo KDS (LC - Actual):** _(Confirmado y funcional)_
- **Flujo Camarero (LC - Actual - Entrega):** _(Confirmado y funcional para la entrega de ítems y marcado de pedido como `COMPLETED`)_
- **Internacionalización (i18n):** _(Implementación base funcional)_
- **Almacenamiento de Imágenes:** _(Funcional con Cloudinary)_
- **Arquitectura de Servicios y Controladores (Backend):** _(Se ha clarificado el uso de `plainToInstance` para handlers Express vs. `ValidationPipe` para controladores NestJS puros)_
- **Hooks Personalizados (Frontend):** _(En uso y funcionales)_

---

## 4. Lecciones Aprendidas & Troubleshooting Clave 💡

- **Configuración de Seed y Prisma CLI:** La correcta configuración en `package.json` y el uso de `npx prisma generate` son esenciales.
- **Sincronización de Tipos Prisma y TypeScript (VS Code):** Reiniciar el servidor TS es a veces necesario.
- **Errores P2002 (Unique Constraint Failed) en `seed.ts`**: Mitigado con el uso de `upsert` donde es aplicable.
- **Gestión de Estado Complejo en Frontend (LC - `PublicMenuViewPage.tsx`):** La gestión actual es funcional para el flujo de creación. Se requerirá atención al implementar "Añadir a Pedido".
- **Recálculo de Precios y Validación en Backend (LC - Pedidos):** Implementado y validado.
- **Errores de Tipo y Lógica en Backend (Transacciones, Creación Anidada Prisma):** Transacciones Prisma son clave.
- **Internacionalización (i18n) Frontend:** Depuración de `missingKey` y carga de namespaces.
- **Manejo de Archivos (Multer/Cloudinary):** Flujo robusto.
- **Testing (KDS y Servicio Camarero):** Validación de lógica de estados mediante pruebas manuales y con Postman ha sido efectiva. Se necesita expandir tests automatizados.
- **Sincronización Estado KDS/Camarero Frontend y Polling:** Estrategias de polling implementadas.
- **Gestión de Dependencias en Hooks `useEffect` y `useCallback`:** Práctica continua.
- ⭐ **[CLAVE PARA BUG MODIFICADORES] Deserialización de DTOs Anidados en Backend (Express/NestJS):**
  - **Problema Identificado:** El `req.body` JSON con arrays de objetos anidados (ej. `selectedModifierOptions`) no se transformaba correctamente a instancias de las clases DTO anidadas, llegando como `undefined` o plain objects al `OrderService`.
  - **Solución Aplicada y Validada:**
    1.  Uso de decoradores `@ValidateNested({ each: true })` y `@Type(() => ClaseAnidadaDto)` en las propiedades de array de objetos dentro de los DTOs del backend (`order.dto.ts`).
    2.  Para los handlers de Express (como `createPublicOrderHandler` en `order.controller.ts`): Implementación de transformación manual usando `const dtoInstance = plainToInstance(CreateOrderDto, req.body as Record<string, any>);` antes de pasar `dtoInstance` al servicio. Esto asegura que `class-transformer` instancie correctamente los objetos anidados.
    3.  Para controladores NestJS puros (la clase `OrderController`): Se dependería del `ValidationPipe` global con `transform: true` (cuya configuración en `index.ts` / `main.ts` se verificó).
- ⭐ **[CLAVE PARA BUG MODIFICADORES] Consistencia de Nombres de Campos (Prisma Schema vs. Service Logic):**
  - **Problema Identificado:** Uso inconsistente de nombres de campos entre el `schema.prisma` (ej. `ModifierOption.groupId`) y la lógica del servicio o las consultas Prisma (ej. intento de usar `modifierGroupId` como campo directo de `ModifierOption`).
  - **Solución Aplicada y Validada:** Revisión y corrección en `OrderService` para usar los nombres de campos exactos (`groupId`) definidos en `schema.prisma`, especialmente en los `select` de Prisma y en la lógica de acceso a propiedades. Ejecutar `npx prisma generate` después de cualquier cambio en el schema fue vital.

_(Para una guía más exhaustiva de problemas específicos y soluciones detalladas, consulta [TROUBLESHOOTING_GUIDE.md](./TROUBLESHOOTING_GUIDE.md))_

---

## 5. Próximos Pasos Inmediatos / Prioridades (Foco en Completar Ciclo de Pedido LC) ⏳📌

El ciclo de creación de pedidos, preparación en KDS y servicio por camarero hasta marcar ítems como `SERVED` y el pedido como `COMPLETED` está funcional. El siguiente bloque se centra en el cierre financiero del pedido: solicitud de cuenta y marcado como pagado para liberar la mesa.

1.  ⭐ **LC - Pedir la Cuenta (Cliente y/o Camarero): [CRÍTICO - SIGUIENTE BLOQUE FUNDAMENTAL]**

    - **Objetivo:** Implementar la funcionalidad para que un cliente pueda solicitar la cuenta desde `OrderStatusPage.tsx` y/o un camarero pueda marcarla como solicitada, cambiando el estado del pedido a `PENDING_PAYMENT`.
    - **Backend:**
      1.  **Modificar `schema.prisma`:**
          - Añadir `isBillRequested: Boolean @default(false)` al modelo `Order`. (Opcional si el cambio a `PENDING_PAYMENT` es suficiente).
          - El estado `OrderStatus.PENDING_PAYMENT` ya existe y se usará.
      2.  **`OrderService`:** Nuevo método `requestBill(orderId: string, requestedByRole: 'CUSTOMER' | 'WAITER', waiterId?: string)` (o similar).
          - Lógica:
            - Verificar que el pedido (`orderId`) exista y pertenezca al `businessSlug` (si es llamado por camarero).
            - Validar que el pedido esté en un estado apropiado para solicitar la cuenta (ej. `IN_PROGRESS`, `ALL_ITEMS_READY`, `COMPLETED`). No se puede pedir cuenta de un pedido ya `PAID` o `CANCELLED`.
            - Actualizar `Order.status = OrderStatus.PENDING_PAYMENT`.
            - Si se usa `isBillRequested`, establecer `Order.isBillRequested = true`.
          - (Opcional futuro) Crear una notificación `TableNotification` de tipo `REQUEST_BILL`.
      3.  **`OrderController` / `WaiterController` / Rutas:**
          - Endpoint para cliente: `POST /public/order/:orderId/request-bill`. No requiere autenticación de usuario, pero sí que el `orderId` sea válido.
          - Endpoint para camarero: `POST /api/camarero/staff/order/:orderId/request-bill`. Requiere autenticación de camarero.
    - **Frontend (Cliente - `OrderStatusPage.tsx`):**
      1.  Añadir botón "Pedir la Cuenta" (visible si `Order.status` es `IN_PROGRESS`, `PARTIALLY_READY`, `ALL_ITEMS_READY`, `COMPLETED`).
      2.  Al pulsar, llamar al endpoint `POST /public/order/:orderId/request-bill`.
      3.  Tras éxito, la UI debería reflejar "Esperando el pago" o similar (el polling debería actualizar al estado `PENDING_PAYMENT`). El botón "Pedir la Cuenta" se deshabilita o desaparece.
    - **Frontend (Camarero - Interfaz de Gestión de Pedidos/Mesas - PENDIENTE DE DISEÑO):**
      1.  Listado de pedidos/mesas debe indicar claramente cuáles están en `PENDING_PAYMENT`.
      2.  (Opcional) Permitir al camarero marcar un pedido como `PENDING_PAYMENT` manualmente.

2.  ⭐ **LC - Marcar Pedido como Pagado y Liberar Mesa (Camarero): [CRÍTICO - DESPUÉS DE PEDIR CUENTA]**

    - **Objetivo:** Permitir al camarero marcar un pedido como `PAID`, registrar opcionalmente detalles del pago y que la mesa asociada se marque como disponible.
    - **Backend:**
      1.  **Modificar `schema.prisma`:**
          - Asegurar que `Order.paidAt: DateTime?` existe.
          - Añadir `paidByWaiterId: String?` (si es diferente del `waiterId` que tomó el pedido) y relación al `User` (camarero que cobró). Podría ser `processedByUserId` para ser más general.
          - Añadir `paymentMethodUsed: String?` (ej. "EFECTIVO", "TARJETA_VISA", "BIZUM", etc.) al modelo `Order`.
          - **Modelo `Table`:** Añadir `status: String @default("AVAILABLE")` (considerar un Enum `TableStatus`: `AVAILABLE`, `OCCUPIED`, `RESERVED`, `NEEDS_CLEANING`).
      2.  **`OrderService`:** Nuevo método `markOrderAsPaid(orderId: string, processedByUserId: string, paymentDetails: { method?: string, amount?: number, notes?: string })`.
          - Lógica:
            - Verificar que el pedido exista y esté en `PENDING_PAYMENT`.
            - Actualizar `Order.status = OrderStatus.PAID`.
            - Establecer `Order.paidAt = new Date()`.
            - Establecer `Order.processedByUserId = processedByUserId`.
            - Guardar `Order.paymentMethodUsed` y cualquier otra nota/detalle del pago.
          - **Liberar Mesa:** Si `Order.tableId` existe, actualizar `Table.status` a `AVAILABLE` (o `NEEDS_CLEANING`).
          - (Futuro LCo) Este es el punto donde se podría disparar un evento/lógica para calcular y asignar puntos de fidelidad (`ActivityType.POINTS_EARNED_ORDER_LC`) si el pedido tiene un `customerLCoId`.
      3.  **`WaiterController` / `AdminController` / Rutas:** Nuevo endpoint `POST /api/camarero/staff/order/:orderId/mark-as-paid`.
          - DTO para `paymentDetails`.
    - **Frontend (Camarero - Interfaz de Gestión de Pedidos/Mesas):**
      1.  Para pedidos que están `PENDING_PAYMENT`:
          - Botón/Acción "Marcar Como Pagada" / "Registrar Pago".
          - (Opcional) Modal para confirmar, introducir método de pago, importe (si hay desglose o gestión de caja básica).
      2.  Llamar al endpoint del backend.
      3.  Actualizar la UI para reflejar el pedido como `PAID` y la mesa como disponible.
    - **Frontend (Cliente - `OrderStatusPage.tsx`):**
      1.  El polling debería detectar el cambio a `Order.status = PAID`.
      2.  Mostrar mensaje final de agradecimiento "¡Pedido Pagado! Gracias por tu visita."
      3.  La lógica de "Pedido Finalizado" para limpiar `localStorage` (`activeOrderInfoKey`) y permitir nuevo pedido ya debería activarse.

3.  ⭐ **LC - Cliente/Backend: Añadir Ítems a Pedido Existente (Tarea B2.2 del `DEVELOPMENT_PLAN.md` anterior): [MEDIA PRIORIDAD - DESPUÉS DE COMPLETAR EL CICLO DE PAGO]**

    - **Objetivo:** Permitir a los clientes añadir más ítems a su pedido activo que aún no ha sido pagado.
    - **Backend:**
      - Asegurar que el endpoint `POST /public/order/:existingOrderId/add-items` (o similar como `POST /api/public/order/:orderId/items` que ya existe y se usa en `OrderService.addItemsToOrder`) esté completamente validado y funcional para este propósito.
      - La lógica de `OrderService.addItemsToOrder` ya contempla cambiar el estado de un pedido `COMPLETED` a `IN_PROGRESS` si se añaden nuevos ítems. Debe verificarse que esto funcione con `PENDING_PAYMENT` también (podría volver a `IN_PROGRESS`).
    - **Frontend (`PublicMenuViewPage.tsx`):**
      - Cuando se detecta `activeOrderInfo` y el pedido NO está `PAID` o `CANCELLED`:
        - Habilitar la carta para añadir nuevos ítems.
        - El "carrito" actual se usaría para los nuevos ítems a añadir.
        - El botón de envío llamaría a `addItemsToExistingOrderHandler` con el `orderId` activo y los nuevos ítems.
        - Se debe gestionar la UI para que el cliente entienda que está añadiendo a un pedido existente.
      - Tras añadir, redirigir o actualizar la `OrderStatusPage.tsx`.

4.  **(Paralelo/Continuo) Testing y Fundamentos Técnicos:**
    - Escribir tests unitarios (Vitest) para la nueva lógica en `OrderService` ("Pedir Cuenta", "Marcar Pagado").
    - Escribir tests de integración (Supertest) para los nuevos endpoints API.
    - Revisar y asegurar la correcta implementación de guardas de NestJS para todas las rutas de Camarero y Admin.
    - Completar y revisar todas las traducciones (i18next) para las nuevas interfaces y mensajes.

_(Para ver la hoja de ruta completa, el backlog detallado, la nueva tarea de permisos granulares y las funcionalidades futuras, consulta el `DEVELOPMENT_PLAN.md` actualizado)._

---

## 6. Información Adicional ℹ️

- **Licencia:** Software Propietario. Copyright (c) 2024-2025 Olivier Hottelet. Todos los derechos reservados. Consulta [LICENSE.md](./LICENSE.md) para más detalles.
- **Flujos de Trabajo Detallados:** Para una comprensión profunda de cómo operan los módulos y su integración, consultar:
  - `LOYALPYME_CORE_WORKFLOW.md`
  - `LOYALPYME_CAMARERO_WORKFLOW.md` (requerirá una actualización significativa después de implementar el ciclo completo de pedido y pago)
  - `MODULE_INTEGRATION_WORKFLOW.md`

---
