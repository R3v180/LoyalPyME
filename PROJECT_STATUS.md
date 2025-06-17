# LoyalPyME - Estado del Proyecto y Decisiones Clave

**Versión Actual:** 1.21.0 (LC: Ciclo Completo de Pedido (Creación, Servicio, Pago) y Adición de Ítems a Pedido Existente COMPLETADOS Y VALIDADOS)
**Fecha de Última Actualización:** 17 de Junio de 2025

---

## 1. Resumen General del Proyecto LoyalPyME 🎯

- **Concepto:** LoyalPyME es una plataforma web integral, diseñada como una solución Software as a Service (SaaS) modular, orientada a Pequeñas y Medianas Empresas (PyMEs). Su arquitectura full-stack se basa en tecnologías modernas:
  - **Frontend:** React con TypeScript, utilizando Vite como herramienta de construcción y Mantine UI para la biblioteca de componentes, asegurando una experiencia de usuario responsive y moderna. La navegación se gestiona con React Router DOM y la internacionalización (i18n) con `i18next`.
  - **Backend:** Node.js con Express.js y TypeScript, interactuando con una base de datos PostgreSQL a través del ORM Prisma. La autenticación se maneja con JSON Web Tokens (JWT).
    La plataforma ofrece dos módulos principales que los negocios pueden activar según sus necesidades:
  - **LoyalPyME Core (LCo):** Un sistema de fidelización digital robusto y completo. **[Funcionalmente Completo para MVP]**.
    - **Características Clave LCo:** Gestión integral de clientes (con roles), sistema de acumulación de puntos (configurable por negocio), niveles de fidelización (tiers) con beneficios personalizables (multiplicadores de puntos, acceso a recompensas exclusivas, beneficios textuales), catálogo de recompensas canjeables (con soporte i18n para nombres/descripciones e imágenes individuales), generación de códigos QR únicos para la asignación de puntos en transacciones físicas, y un panel de cliente interactivo donde pueden visualizar su progreso, saldo de puntos, recompensas disponibles, regalos asignados por el administrador, y el historial de su actividad en el programa.
  - **LoyalPyME Camarero (LC):** Un módulo avanzado, **[FLUJO DE PEDIDO PRINCIPAL COMPLETADO. Próximo paso: Funcionalidades avanzadas de gestión de cuenta (Dividir Cuenta)]**, diseñado para digitalizar y optimizar la operativa de servicio en el sector de la hostelería (restaurantes, bares, cafeterías).
    - **Funcionalidades Clave LC Implementadas y Validadas:**
      1.  **Gestión Completa de Carta Digital (Admin):** Interfaz administrativa para crear, editar y organizar la carta, ítems y modificadores complejos.
      2.  **Visualización de Carta y Toma de Pedidos por Cliente (con Modificadores):** Interfaz interactiva para explorar la carta, personalizar ítems con modificadores, con cálculo de precio dinámico y validación de reglas.
      3.  **Backend Robusto para Creación de Pedidos:** El backend procesa y valida correctamente los pedidos públicos, incluyendo modificadores y precios. El bug crítico de modificadores ha sido **SOLUCIONADO.**
      4.  **Gestión de Pedido Activo por Cliente:** La `PublicMenuViewPage` detecta pedidos activos y adapta la UI, permitiendo **añadir nuevos ítems a un pedido existente**.
      5.  **Visualización del Estado del Pedido por Cliente:** La `OrderStatusPage` muestra el estado del pedido y de cada ítem en tiempo real (con polling).
      6.  **Ciclo KDS (Cocina/Barra):** API e Interfaz de KDS funcionales para que el personal vea y actualice el estado de preparación de los ítems (`PENDING_KDS` -> `PREPARING` -> `READY`).
      7.  **Ciclo de Servicio del Camarero:** API e Interfaz para que el camarero vea los ítems listos para recoger (`READY`) y los marque como `SERVED`.
      8.  **Ciclo Financiero Completo:** API e Interfaces para que el cliente **pida la cuenta** (cambiando el pedido a `PENDING_PAYMENT`) y para que el camarero **marque el pedido como `PAID`**, lo cual **libera la mesa** y **asigna los puntos de fidelidad LCo** correspondientes.
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

---

## 2. Estado Actual Detallado (Hitos Completados y En Progreso - v1.21.0) 📝

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

- **Fase 3 (Desarrollo Módulo "LoyalPyME Camarero" - LC): [FLUJO PRINCIPAL COMPLETO]**
  - **LC - Fundamentos Backend (Modelos BD y API Gestión Carta): [COMPLETADO Y VALIDADO]**
    - Modelos Prisma detallados y migrados para `Table`, `MenuCategory`, `MenuItem`, `ModifierGroup`, `ModifierOption`, `Order`, `OrderItem`, `OrderItemModifierOption`, `StaffPin`. Enums `OrderStatus`, `OrderItemStatus`, etc. definidos.
    - API CRUD Admin Carta (`/api/camarero/admin/*`) completa y protegida para `MenuCategory`, `MenuItem` (con `ModifierGroup`s), y `ModifierOption`s.
  - **LC - Frontend: UI Admin para Gestión de Carta Digital: [COMPLETADO Y VALIDADO]**
    - Página `/admin/dashboard/camarero/menu-editor` (`MenuManagementPage.tsx`) y componentes asociados (`MenuCategoryManager.tsx`, `MenuItemManager.tsx`, `MenuItemFormModal.tsx`, `ModifierGroupsManagementModal.tsx`, `ModifierOptionsManagementModal.tsx`) funcionales para CRUD completo de la carta, incluyendo subida de imágenes.
    - Hooks de datos y tipos para gestión de menú implementados. Botón "Previsualizar Carta Pública".
  - **LC - Backend y Frontend: Visualización de Carta Pública y Flujo de Pedido por Cliente (con Modificadores): [COMPLETADO Y VALIDADO]**
    - **Backend (API Pública de Menú - `/public/menu/business/:businessSlug`):** Funcional, sirve la carta completa y activa para el cliente.
    - **Frontend (Visualización de Carta - `/m/:businessSlug/:tableIdentifier?` - `PublicMenuViewPage.tsx`):**
      - Muestra interactiva de la carta, personalización de ítems con modificadores y cálculo de precio dinámico **validado y funcionando correctamente**.
      - Funcionalidad "Añadir al Carrito" y persistencia del carrito no enviado en `localStorage` operativa.
    - **Frontend (Modal del Carrito y Envío - `ShoppingCartModal.tsx`):** Funcional para revisión, modificación de cantidades, notas y envío.
    - **Backend (Creación de Pedido - `POST /public/order/:businessSlug`):**
      - **SOLUCIONADO BUG CRÍTICO:** El servicio (`OrderService`) ahora procesa y valida correctamente los `selectedModifierOptions`.
      - Recálculo de precios en backend y creación transaccional de `Order`, `OrderItem`s, y `OrderItemModifierOption`s funcionando como se espera.
    - **Frontend (Post-Envío Pedido en `PublicMenuViewPage.tsx`):** Guardado de `activeOrderInfo` en `localStorage` y redirección a `OrderStatusPage` operativos.
  - **LC - Cliente: Visualización del Estado del Pedido: [COMPLETADO Y VALIDADO]**
    - **Backend (`public/order.service.ts`):** Endpoint `GET /public/order/:orderId/status` (`PublicOrderStatusInfo`) funcional.
    - **Frontend (`PublicMenuViewPage.tsx` - Detección Pedido Activo):** Funcionalidad de detección, UI condicional y **adición de ítems a pedido existente** operativa.
    - **Frontend (`OrderStatusPage.tsx`):** Muestra información del pedido y estado de ítems con polling. Lógica de "Pedido Finalizado" (`PAID` o `CANCELLED`) para limpiar `localStorage` y permitir nuevo pedido está implementada. Botón "Volver al Menú" funcional.
  - **LC - KDS Backend (API y Lógica de Estados): [COMPLETADO Y VALIDADO]**
    - Endpoints `GET /api/camarero/kds/items` y `PATCH /api/camarero/kds/items/:orderItemId/status` funcionales y protegidos.
    - Lógica de `Order.status` en `kds.service.ts` (actualización a `IN_PROGRESS`, `PARTIALLY_READY`, `ALL_ITEMS_READY`) basada en estados de `OrderItem`s **validada**.
  - **LC - KDS Frontend (Visualización y Acciones): [COMPLETADO Y VALIDADO]**
    - `KitchenDisplayPage.tsx` funcional: selección de destino KDS, visualización de ítems, polling, y acciones de cambio de estado (`PENDING_KDS` -> `PREPARING` -> `READY`; `CANCELLED`) con notificaciones.
  - **LC - Camarero Backend (Servicio y Entrega de Ítems): [COMPLETADO Y VALIDADO]**
    - Endpoints `GET /api/camarero/staff/ready-for-pickup` y `PATCH /api/camarero/staff/order-items/:orderItemId/status` (para marcar como `SERVED`) implementados y funcionales.
    - Lógica en `waiter.service.ts` para actualizar `OrderItem.status` a `SERVED` y `Order.status` a `COMPLETED` (si todos los ítems están servidos) **validada**.
  - **LC - Camarero Frontend (Recogida y Servicio de Ítems): [COMPLETADO Y VALIDADO]**
    - Página `WaiterPickupPage.tsx` (`/admin/camarero/pickup-station`) funcional: visualización de ítems `READY` y acción "Marcar como Servido" con actualización de la lista y notificaciones.
  - **LC - Flujo Financiero Completo del Pedido: [COMPLETADO Y VALIDADO]**
    - **Pedir la Cuenta:** Funcionalidad implementada en el backend y frontend (`OrderStatusPage`) para que el cliente solicite la cuenta, cambiando `Order.status` a `PENDING_PAYMENT`.
    - **Marcar Como Pagado:** Funcionalidad implementada en el backend y frontend (`WaiterOrderManagementPage`) para que el camarero marque el pedido como `PAID`, lo cual libera la mesa asociada en el `TableManager` y dispara la lógica de asignación de puntos de LCo.

---

## 3. Key Concepts & Design Decisions 🔑

- **Arquitectura Modular y Activación por Negocio:** La plataforma está diseñada para ser multi-tenant, donde cada `Business` es una entidad independiente. La modularidad se logra a nivel de base de datos con flags booleanos en el modelo `Business` (ej. `isLoyaltyCoreActive`, `isCamareroActive`). En el backend, un middleware personalizado (`checkModuleActive`) protege rutas de API específicas, denegando el acceso si el negocio del usuario autenticado no tiene el módulo correspondiente activo. En el frontend, la UI se adapta dinámicamente: componentes como `AdminNavbar` y los dashboards de cliente y administrador leen estas flags del perfil del usuario y renderizan condicionalmente los menús, botones y secciones relevantes para los módulos activos.

- **Estructura de Datos Detallada para Módulo Camarero (LC):** La base de datos, gestionada por Prisma, se ha diseñado para ser robusta y escalable. `Order` es la entidad central que agrupa los `OrderItem`s. Crucialmente, cada `OrderItem` almacena un _snapshot_ del precio y nombre del producto en el momento del pedido (`priceAtTimeOfOrder`, `itemNameSnapshot_es`), garantizando la integridad de los datos históricos aunque el producto cambie en el menú. Los modificadores se enlazan a través de `OrderItemModifierOption`, que conecta un `OrderItem` con una `ModifierOption` específica. El modelo `Table` se asocia a un `Order` para gestionar la ocupación y liberación del espacio físico.

- **Flujo de Pedido LC - Cliente (Detallado):** El proceso completo desde que un cliente se sienta en la mesa hasta que envía su pedido está meticulosamente orquestado:

  1.  **Acceso y Carga:** El cliente escanea un QR o accede a una URL (`/m/:slug/:table`). La página `PublicMenuViewPage` se inicializa y el hook `usePublicMenuData` se dispara para obtener la carta digital del negocio.
  2.  **Configuración de Ítem:** Al seleccionar un producto, se activa el hook `useMenuItemConfigurator`, que presenta una UI para seleccionar modificadores. Este hook valida en tiempo real las reglas del grupo (mínimos/máximos, obligatorios) y recalcula el precio final del ítem dinámicamente, proporcionando feedback instantáneo al usuario.
  3.  **Gestión del Carrito:** Los ítems, ya sean simples o configurados, se añaden al carrito, cuyo estado es gestionado por el hook `usePublicOrderCart`. Este hook genera un ID único para cada configuración de ítem (`cartItemId`) para poder agruparlos correctamente y persiste el estado del carrito en el `localStorage` del navegador, permitiendo al cliente cerrar la pestaña y no perder su selección.
  4.  **Detección de Pedido Activo:** Simultáneamente, el hook `useActiveOrderState` comprueba el `localStorage` para ver si ya existe un `activeOrderId` para esa mesa. Si lo encuentra, adapta la UI para informar al cliente que puede añadir más ítems a su pedido en curso.
  5.  **Envío y Orquestación:** Al enviar el pedido, se invoca la función `handleOrderSubmission` del servicio `publicOrderApiService`. Esta función orquesta toda la lógica: construye el payload (DTO), determina si debe llamar a la API de "crear nuevo pedido" o "añadir a pedido existente", y maneja la respuesta.
  6.  **Recepción y Validación en Backend:** El controlador de Express recibe la petición, utiliza `plainToInstance` para transformar el JSON en una instancia de clase DTO anidada, y luego `validate` para asegurar que todos los datos (incluyendo cada modificador) son correctos antes de pasar la petición al servicio de backend (`OrderCreationService` o `OrderModificationService`) para su procesamiento en la base de datos.

- **Flujo KDS (LC - Detallado):** La comunicación entre el cliente y la cocina es asíncrona. Cuando se crea un `OrderItem`, su estado inicial es `PENDING_KDS`. La interfaz del KDS (`KitchenDisplayPage.tsx`) realiza un polling al endpoint `/api/camarero/kds/items` para mostrar los ítems pendientes. El personal de cocina interactúa con la UI para cambiar el estado a `PREPARING` y luego a `READY`, actualizando la base de datos a través de la API. El `kds.service.ts` contiene la lógica para, por ejemplo, actualizar el estado general del `Order` a `PARTIALLY_READY` o `ALL_ITEMS_READY` basado en el estado de sus ítems.

- **Flujo Camarero (LC - Servicio y Pago Detallado):**

  1.  **Recogida:** La interfaz del camarero (`WaiterPickupPage.tsx`) hace polling al endpoint `/api/camarero/staff/ready-for-pickup` para mostrar solo los ítems en estado `READY`. Al entregarlos, el camarero los marca como `SERVED`. Cuando todos los ítems de un pedido están servidos, el `waiter.service.ts` cambia el estado del `Order` a `COMPLETED`.
  2.  **Pago:** El cliente, desde `OrderStatusPage.tsx`, puede "Pedir la Cuenta", lo que cambia el estado del `Order` a `PENDING_PAYMENT`. Los camareros ven estos pedidos en su interfaz de gestión. Usando esta interfaz, seleccionan el pedido y lo marcan como `PAID`. Esta acción, manejada por `order-payment.service.ts`, actualiza el estado del pedido, libera la `Table` asociada, y crucialmente, invoca al `loyaltyPointsService` para asignar los puntos LCo si el cliente estaba identificado.

- **Internacionalización (i18n):** La estrategia es dual. La UI estática se traduce usando `react-i18next` con archivos de recursos `translation.json`. El contenido dinámico de la base de datos (como nombres de ítems o recompensas) se gestiona con campos duplicados en el schema (ej. `name_es`, `name_en`). El frontend selecciona el campo apropiado basándose en el idioma activo.

- **Almacenamiento de Imágenes:** El componente `ImageUploadCropper` permite al administrador seleccionar y recortar una imagen. Al confirmar, la imagen recortada (como un `Blob`) se envía a la API de subida (`/api/uploads/image`). El backend usa `Multer` para procesar el `multipart/form-data`, y el `uploads.service.ts` utiliza el SDK de Cloudinary para subir la imagen a la nube, devolviendo la URL segura, que luego se guarda en la base de datos en el campo `imageUrl` de la entidad correspondiente (ej. `Reward`, `MenuCategory`).

- **Arquitectura de Backend (Refactorizada):** Se ha adoptado una estructura más limpia y escalable. El archivo principal `index.ts` ahora se encarga únicamente de la configuración del servidor Express y los middlewares globales. La configuración de Swagger, que es muy extensa, se ha aislado en su propio archivo (`config/swagger.config.ts`). Más importante, todo el montaje de rutas se ha centralizado en `routes/index.ts`, que exporta un `apiRouter` y un `publicRouter`. Esto desacopla la definición de rutas de la inicialización del servidor.

- **Hooks Personalizados (Frontend):** La arquitectura del frontend se basa en gran medida en hooks personalizados para encapsular la lógica de estado y los efectos secundarios. Hooks como `useAdminCustomersData`, `usePublicMenuData`, `usePublicOrderCart`, `useActiveOrderState` y `useMenuItemConfigurator` actúan como "cerebros" para sus respectivos dominios de funcionalidad, haciendo que los componentes de la página (`PublicMenuViewPage`, `AdminCustomerManagementPage`, etc.) sean más limpios, declarativos y centrados en la presentación.

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
- ⭐ **[NUEVA LECCIÓN APRENDIDA] Sincronización de Documentación:** Se ha identificado como un punto crítico mantener los archivos `.md` (especialmente `PROJECT_STATUS.md` y `DEVELOPMENT_PLAN.md`) sincronizados con el código para evitar confusiones y retrabajo. Actualizar la documentación es ahora un paso obligatorio al finalizar un bloque de funcionalidades.

---

## 5. Próximos Pasos Inmediatos / Prioridades ⏳📌

Con el ciclo completo de pedido finalizado (creación, servicio y pago), el siguiente bloque se enfoca en funcionalidades avanzadas para mejorar la gestión y la flexibilidad del servicio.

1.  ⭐ **LC - Dividir la Cuenta (Split Bill): [CRÍTICO - SIGUIENTE BLOQUE FUNDAMENTAL]**

    - **Objetivo:** Implementar la capacidad para que un camarero divida la cuenta de un pedido pendiente de pago, ya sea por ítems o en partes iguales.
    - **Backend:**
      1.  **Diseño de Datos:** Se deberá decidir cómo representar los pagos parciales. Una opción es un nuevo modelo `PartialPayment` relacionado con `Order`, que contenga el `amount`, `method` y `status`.
      2.  **Lógica de Servicio:** Crear un nuevo servicio (`SplitBillService`?) que maneje la lógica de división, cree los registros de pago parcial y actualice el estado del pedido principal (ej. a `PARTIALLY_PAID`) hasta que esté completamente saldado.
      3.  **Endpoints API:** Diseñar y crear nuevas rutas en `/api/camarero/staff/order/:orderId/split-bill` para iniciar el proceso y registrar los pagos parciales.
    - **Frontend (Camarero):**
      1.  **Diseño de UI/UX:** Crear una nueva interfaz o modal para la división de cuentas. Deberá mostrar los ítems del pedido y permitir al camarero asignarlos a diferentes "cestas" o "personas", o simplemente dividir el total.
      2.  **Integración:** Conectar la nueva UI con los nuevos endpoints del backend, manejando los estados de carga y error.

2.  ⭐ **LC - Gestión de Personal (PINs y Permisos): [ALTA PRIORIDAD - Después de Split Bill]**

    - **Objetivo:** Crear un sistema para que el `BUSINESS_ADMIN` pueda gestionar a su personal (camareros, cocina), asignarles roles (`WAITER`, `KITCHEN_STAFF`) y un PIN de 4 dígitos para un inicio de sesión rápido en las interfaces de servicio (KDS, TPV de camarero).

3.  ⭐ **LC - Mejoras en la Interfaz de Camarero (TPV): [MEDIA PRIORIDAD]**
    - **Objetivo:** Unificar y mejorar las vistas del camarero. Pasar de páginas separadas (`pickup-station`, `order-management`) a un TPV (Terminal Punto de Venta) más cohesivo que incluya un plano de mesas (`TableManager`), listado de pedidos por estado, y acceso a las nuevas funcionalidades como "Dividir Cuenta".

---

## 6. Información Adicional ℹ️

- **Licencia:** Software Propietario. Copyright (c) 2024-2025 Olivier Hottelet. Todos los derechos reservados. Consulta [LICENSE.md](./LICENSE.md) para más detalles.
- **Flujos de Trabajo Detallados:** Para una comprensión profunda de cómo operan los módulos y su integración, consultar:
  - `LOYALPYME_CORE_WORKFLOW.md`
  - `LOYALPYME_CAMARERO_WORKFLOW.md` (requerirá una actualización significativa después de implementar el ciclo completo de pedido y pago)
  - `MODULE_INTEGRATION_WORKFLOW.md`
