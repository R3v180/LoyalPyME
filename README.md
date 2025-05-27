# LoyalPyME 🇪🇸 (v1.19.0)

**LoyalPyME** es una plataforma web integral y modular, desarrollada con un stack **Frontend React (TypeScript, Mantine UI, Vite)** y **Backend Node.js (TypeScript, Express, Prisma, PostgreSQL)**, diseñada específicamente para Pequeñas y Medianas Empresas (PyMEs). La plataforma se estructura en módulos activables individualmente por cada negocio cliente, permitiendo una solución a medida y adaptada a sus necesidades operativas y de marketing.

- ⭐ **LoyalPyME Core (LCo) - Módulo de Fidelización [Estable y Funcional]:**
  Un sistema robusto y completo para la gestión de programas de lealtad digitales.

  - **Gestión de Clientes:** Administración detallada de clientes, incluyendo su historial de puntos, nivel de fidelización, y actividad.
  - **Sistema de Puntos:** Configuración de ratio de puntos por gasto, generación de QR para acumulación en punto de venta físico.
  - **Niveles de Fidelización (Tiers):** Creación de múltiples niveles con umbrales personalizables (basados en gasto, visitas, o puntos acumulados) y asignación de beneficios exclusivos por nivel (ej. multiplicadores de puntos, acceso a recompensas especiales).
  - **Catálogo de Recompensas:** Gestión de un catálogo de recompensas canjeables por puntos, con soporte completo para internacionalización (nombres y descripciones en ES/EN) e imágenes individuales por recompensa.
  - **Panel de Cliente Interactivo:** Un dashboard personalizado para que los clientes finales consulten su saldo de puntos, nivel actual y progreso hacia el siguiente, visualicen las recompensas disponibles y regalos asignados, canjeen beneficios, y revisen su historial completo de transacciones de fidelización.

- 🚀 **LoyalPyME Camarero (LC) - Módulo de Hostelería [En Desarrollo Activo - KDS Funcional con Acciones]:**
  Un módulo avanzado enfocado en la digitalización y optimización integral del servicio en el sector hostelero (restaurantes, bares, cafeterías), mejorando la eficiencia operativa y la experiencia del cliente.
  - **Funcionalidad Actual Clave:**
    1.  **Gestión de Carta Digital por el Administrador:** Interfaz administrativa completa y detallada (`/admin/dashboard/camarero/menu-editor`) para crear, editar y organizar:
        - **Categorías del Menú:** Con nombre (ES/EN), descripción (ES/EN), imagen (con recorte), posición y estado de activación.
        - **Ítems del Menú:** Dentro de cada categoría, con nombre (ES/EN), descripción (ES/EN), precio, imagen (con recorte), listado de alérgenos, etiquetas (ej. "Vegano", "Popular"), disponibilidad, posición, tiempo de preparación estimado, calorías, SKU (identificador único de producto) y asignación a un destino KDS específico (ej. "COCINA", "BARRA").
        - **Grupos de Modificadores:** Asociados a cada ítem, con nombre (ES/EN), tipo de interfaz de usuario (`RADIO` para selección única, `CHECKBOX` para múltiple), reglas de selección (mínimo/máximo, obligatorio) y posición.
        - **Opciones de Modificador:** Dentro de cada grupo, con nombre (ES/EN), ajuste de precio (positivo, negativo o cero), posición, si es una opción por defecto y disponibilidad.
    2.  **Visualización de Carta Pública por el Cliente Final:** Acceso mediante URL directa (`/m/:businessSlug/:tableIdentifier?`), idealmente a través de un código QR en la mesa del cliente. Presenta la carta del negocio de forma interactiva, responsive y multilingüe (ES/EN). Los clientes pueden:
        - Navegar por categorías y ver detalles de cada ítem.
        - Personalizar ítems seleccionando opciones de los modificadores, con el precio actualizándose dinámicamente en tiempo real según las selecciones.
    3.  **Flujo de Pedido Completo por el Cliente Final:**
        - **Carrito de Compra Local:** Los ítems configurados se añaden a un carrito de compra que persiste en el `localStorage` del navegador del cliente (específico para ese negocio y mesa), permitiendo continuar el pedido más tarde si no se envía.
        - **Modal de Carrito (`ShoppingCartModal.tsx`):** Permite revisar todos los ítems, modificar cantidades (con recalculo de totales), eliminar ítems, añadir notas generales para todo el pedido, y vaciar el carrito.
        - **Envío de Pedido:** Al confirmar, el frontend construye un `CreateOrderPayloadDto` (incluyendo ítems, notas, identificador de mesa, y `customerId` de LCo si el cliente está logueado) y lo envía al backend (`POST /public/order/:businessSlug`).
        - **Procesamiento Backend:** Validación exhaustiva de la disponibilidad, reglas de modificadores y precios. Creación transaccional de los registros `Order`, `OrderItem` y `OrderItemModifierOption` en la base de datos. El `Order` se guarda con estado inicial `RECEIVED` y un `orderNumber` único.
        - **Feedback al Cliente:** Notificación de éxito (con el `orderNumber`) y redirección a la página de estado del pedido. El carrito local se limpia y se guarda información del pedido activo en `localStorage`.
    4.  **Visualización del Estado del Pedido por el Cliente (`OrderStatusPage.tsx`):**
        - Muestra el estado general del pedido (`Order.status`) y el estado individual de cada `OrderItem` (`OrderItem.status`).
        - Se actualiza automáticamente mediante polling al backend (`GET /public/order/:orderId/status`).
        - Maneja la finalización del pedido (si el estado es `PAID` o `CANCELLED`) limpiando el `localStorage` para permitir nuevos pedidos.
    5.  **Kitchen Display System (KDS) - Backend y Frontend (MVP Funcional):**
        - **API KDS Backend (`/api/camarero/kds/*`): [VALIDADA]**
          - Endpoints para que el personal de KDS obtenga los `OrderItem`s filtrados por destino (ej. "COCINA", "BARRA") y estado de preparación.
          - Endpoint para actualizar el `OrderItemStatus` (ej. `PENDING_KDS` -> `PREPARING`, `PREPARING` -> `READY`, o `CANCELLED`).
          - **Lógica de actualización de `Order.status` general (ej. `IN_PROGRESS`, `PARTIALLY_READY`) completamente funcional y probada.**
        - **Interfaz KDS Frontend (`/admin/kds` - `KitchenDisplayPage.tsx`): [FUNCIONAL]**
          - Permite al personal de cocina/barra (roles `KITCHEN_STAFF`, `BAR_STAFF`) y al `BUSINESS_ADMIN` visualizar los ítems activos.
          - Selector de destino KDS ("COCINA", "BARRA").
          - Listado de ítems con detalles (cantidad, modificadores, notas, info del pedido, estado).
          - **Botones de acción para cambiar el estado de los ítems** (`Empezar Preparación`, `Marcar como Listo`, `Cancelar Ítem`), con feedback visual y notificaciones.
          - Polling para refresco automático de la lista.

La plataforma LoyalPyME está diseñada con un enfoque en la **mantenibilidad** (código limpio, TypeScript, tests), **escalabilidad** (arquitectura de servicios, Prisma con PostgreSQL) y **adaptabilidad** (módulos activables, futura configuración de permisos), buscando ser el socio tecnológico que impulse la eficiencia operativa y el crecimiento sostenible de las PyMEs.

## Visión y Propósito ✨

LoyalPyME aspira a ser el **aliado tecnológico integral de las Pequeñas y Medianas Empresas (PyMEs)**, proporcionando herramientas digitales sofisticadas pero intuitivas y fáciles de usar, integradas en una única plataforma modular que se adapta a las necesidades específicas de cada negocio.

Con **LoyalPyME Core (LCo)**, buscamos empoderar a las empresas para que puedan cultivar relaciones más profundas, significativas y duraderas con sus clientes. El objetivo es fomentar la lealtad y la recurrencia a través de programas de recompensas personalizados, comunicación efectiva y una experiencia de cliente gratificante que los haga sentir valorados.

Con el módulo **LoyalPyME Camarero (LC)**, nuestra visión es transformar y modernizar la operativa en el sector de la hostelería. Queremos que los negocios puedan:

- **Modernizar su servicio:** Ofreciendo una experiencia de pedido digital ágil y sin fricciones directamente desde la mesa del cliente.
- **Reducir errores manuales:** Minimizando las imprecisiones en la toma de comandas y la comunicación con cocina/barra.
- **Agilizar la comunicación interna:** Optimizando el flujo de información entre el personal de sala, la cocina y la barra a través del KDS y (futuramente) la interfaz de camarero.
- **Mejorar significativamente la experiencia del cliente final:** Permitiéndole explorar la carta a su ritmo, personalizar sus pedidos con total control y transparencia, y seguir el estado de su comanda en tiempo real.
- **Obtener datos operativos valiosos:** Recopilando información sobre ventas, popularidad de ítems, y tiempos de preparación para la toma de decisiones estratégicas y la optimización continua del negocio.

La plataforma es inherentemente versátil: **LoyalPyME Core** es aplicable a una amplia gama de sectores empresariales (retail, servicios profesionales, bienestar, etc.) que busquen implementar programas de fidelización. Por su parte, **LoyalPyME Camarero** ofrece una solución especializada, potente y adaptada a las particularidades del sector de la restauración, desde pequeñas cafeterías hasta restaurantes con mayor volumen de operaciones. La sinergia entre ambos módulos permite una experiencia de cliente altamente integrada y datos de negocio enriquecidos.

_(Para un análisis exhaustivo del estado actual del proyecto, incluyendo la versión actual, los hitos completados en detalle, las decisiones de diseño clave y las lecciones aprendidas, consulta nuestro [**PROJECT_STATUS.md**](./PROJECT_STATUS.md). La hoja de ruta completa, el backlog de funcionalidades futuras para ambos módulos, y la visión a largo plazo se encuentran detallados en [**DEVELOPMENT_PLAN.md**](./DEVELOPMENT_PLAN.md))._

_(Para entender en profundidad los flujos de usuario y las interacciones dentro de cada módulo, así como la integración entre LCo y LC, por favor revisa los siguientes documentos de flujo de trabajo:_

- _[LOYALPYME_CORE_WORKFLOW.md](./LOYALPYME_CORE_WORKFLOW.md)_
- _[LOYALPYME_CAMARERO_WORKFLOW.md](./LOYALPYME_CAMARERO_WORKFLOW.md)_
- _[MODULE_INTEGRATION_WORKFLOW.md](./MODULE_INTEGRATION_WORKFLOW.md))_

|                                                                           Panel de Admin (Escritorio)                                                                            |                                                                           Panel de Admin (Móvil)                                                                            |
| :------------------------------------------------------------------------------------------------------------------------------------------------------------------------------: | :-------------------------------------------------------------------------------------------------------------------------------------------------------------------------: |
| <img src="images/SC_LoyalPyME.png" alt="Captura de pantalla del Panel de Administración de LoyalPyME en vista de escritorio, mostrando la gestión de recompensas." width="100%"> | <img src="images/SC_LoyalPyME_PHONE.png" alt="Captura de pantalla del Panel de Administración de LoyalPyME en vista móvil, mostrando la gestión de clientes." width="100%"> |

_(Nota: Las capturas de pantalla actuales corresponden principalmente al Módulo LoyalPyME Core. Se actualizarán progresivamente para incluir las nuevas interfaces del Módulo Camarero (Gestión de Carta, KDS) y el Panel Super Admin a medida que su UI se estabilice)._

## Características Principales Implementadas ✅

**Plataforma Base y Gestión Multi-Módulo:**

- **Panel Super Admin:** Interfaz dedicada (`/superadmin`) para el rol `SUPER_ADMIN`, permitiendo la administración global de los negocios clientes registrados. Funcionalidades: listar negocios, ver su estado general (`isActive`), y **activar/desactivar individualmente los módulos LoyalPyME Core (`isLoyaltyCoreActive`) y LoyalPyME Camarero (`isCamareroActive`)** para cada negocio.
- **Gestión de Módulos por Negocio:** La funcionalidad de cada módulo (LCo, LC) se habilita o deshabilita a nivel de la entidad `Business` en la base de datos. El perfil de usuario (`/api/profile`) que se obtiene tras el login incluye estos flags de activación para el negocio asociado, permitiendo al frontend adaptar la UI dinámicamente.
- **Control de Acceso Basado en Módulos y Roles (RBAC + MBAC):**
  - **RBAC (Role-Based Access Control):** El acceso a las funcionalidades (APIs backend y componentes UI frontend) está condicionado por el rol del usuario (`SUPER_ADMIN`, `BUSINESS_ADMIN`, `CUSTOMER_FINAL`, `KITCHEN_STAFF`, `BAR_STAFF`, y futuro `WAITER`).
  - **MBAC (Module-Based Access Control):** Un middleware backend (`checkModuleActive`) y lógica en frontend verifican que el módulo requerido esté activo para el negocio del usuario antes de permitir el acceso a funcionalidades específicas de dicho módulo.

**LoyalPyME Core (LCo) - Módulo de Fidelización [Estable y Funcional]:**

- **Autenticación Completa y Segura:**
  - Registro de Negocios con su primer `BUSINESS_ADMIN`.
  - Registro de `CUSTOMER_FINAL` asociados a un negocio específico.
  - Login robusto con email/contraseña, utilizando JWT (JSON Web Tokens) para la gestión de sesiones.
  - Funcionalidad completa de Reseteo de Contraseña (solicitud por email, token temporal, cambio de contraseña).
- **Gestión Avanzada de Clientes (Panel Admin LCo):**
  - Listado paginado con búsqueda por nombre/email, filtros (estado activo/inactivo, favorito, nivel de tier) y ordenación por múltiples columnas.
  - Funcionalidades CRUD para clientes, incluyendo: edición de datos básicos, añadir notas internas de administrador, ajuste manual de saldo de puntos (con motivo), cambio manual del nivel de fidelización (tier), asignación de recompensas del catálogo como regalo (sin coste de puntos), activación/desactivación de cuentas de cliente, y marcado/desmarcado de clientes como favoritos.
  - Acciones Masivas sobre clientes seleccionados: activar/desactivar, eliminar (con validaciones de integridad referencial), y ajustar puntos a un grupo.
- **Sistema de Niveles/Tiers Dinámico y Configurable (Panel Admin LCo):**
  - CRUD completo para niveles de fidelización (Tiers).
  - Definición de umbrales (`minValue`) para alcanzar cada nivel.
  - Asignación de beneficios (`TierBenefit`) específicos y personalizables por nivel (tipos implementados: multiplicador de puntos sobre los puntos base ganados, acceso a una recompensa exclusiva del catálogo, beneficio personalizado con texto descriptivo).
  - Configuración global del sistema de tiers: Habilitación/deshabilitación general, base de cálculo de nivel (`TierCalculationBasis`: por gasto acumulado, número de visitas, o total de puntos históricos ganados), periodo de cálculo (`tierCalculationPeriodMonths`: 0 para histórico total o N meses móviles), política de descenso de nivel (`TierDowngradePolicy`: nunca, revisión periódica, o por inactividad tras N meses), y periodo de inactividad para descenso (`inactivityPeriodMonths`).
- **Gestión Integral de Recompensas (Panel Admin LCo):**
  - CRUD completo para recompensas canjeables por puntos.
  - Campos por recompensa: Nombre (ES/EN), Descripción (ES/EN, opcional), Coste en Puntos, Estado (Activa/Inactiva).
  - Subida y recorte de imágenes (Cloudinary, con `react-image-crop` para aspecto 1:1) para cada recompensa.
- **Flujo de Acumulación de Puntos y QR (LCo):**
  - **Generación QR (Admin):** El `BUSINESS_ADMIN` genera códigos QR únicos (basados en token UUID) desde su panel, asociándolos a un importe de venta y un número de ticket/referencia. Estos QR tienen una validez temporal configurable.
  - **Validación QR (Cliente):** El `CUSTOMER_FINAL` accede a su dashboard y valida el QR, ya sea introduciendo el token alfanumérico manualmente o escaneando el código directamente con la cámara de su dispositivo móvil (integración de `html5-qrcode`). El sistema valida el token, calcula los puntos a otorgar (considerando `Business.pointsPerEuro` y multiplicadores de nivel del cliente), actualiza el saldo de puntos, `totalSpend`, `totalVisits` del cliente, y registra la transacción en su historial (`ActivityLog`).
- **Lógica de Tiers y Actualización Automática (LCo - Backend):** Un sistema backend (con tarea programada/Cron Job utilizando `node-cron`, configurable) que se ejecuta periódicamente para recalcular y actualizar automáticamente el nivel de los clientes basado en la configuración del negocio, las métricas acumuladas por el cliente, y las políticas de descenso de nivel definidas.
- **Panel de Cliente Completo (LCo - Frontend - `CustomerDashboardPage.tsx`):**
  - Interfaz de usuario rica y organizada en pestañas para el cliente final:
    - **Resumen (`SummaryTab.tsx`):** Muestra información clave (puntos actuales, nivel actual con nombre y beneficios), una barra de progreso visual hacia el siguiente nivel (indicando la métrica faltante y con un popover para previsualizar los beneficios del próximo nivel), un resumen de regalos pendientes y recompensas destacadas con botones de canje directo, y la sección para validar códigos QR. Si el Módulo Camarero está activo para el negocio, incluye una tarjeta de acceso directo a la carta digital.
    - **Recompensas (`RewardsTab.tsx`):** Listado completo y visual (`RewardList.tsx`) de todas las recompensas activas disponibles para canjear con puntos (mostrando imagen, nombre i18n, descripción i18n, coste en puntos), así como los regalos (`GrantedReward`) otorgados directamente por el administrador que estén pendientes de canje. Permite el canje directo.
    - **Actividad (`ActivityTab.tsx`):** Historial paginado y detallado de todas las transacciones de puntos (ganados por QR, gastados en recompensas, ajustados manualmente por admin) y canjes de regalos, con descripciones claras, fechas y el cambio de puntos asociado.
- **Otros (Plataforma y LCo):**
  - Internacionalización (i18n) completa de la interfaz de usuario frontend (ES/EN) mediante `i18next` y archivos de traducción JSON. Detección de idioma del navegador y persistencia de la preferencia del usuario.
  - Documentación de la API Backend generada con Swagger/OpenAPI y accesible en el endpoint `/api-docs` para la mayoría de los servicios de LCo y plataforma.

**Módulo LoyalPyME Camarero (LC) [En Desarrollo Activo - KDS Funcional con Acciones]:**

- **Modelo de Datos Robusto para Hostelería (Backend - Prisma):**
  - Definición detallada de entidades como `MenuCategory`, `MenuItem` (con `kdsDestination`), `ModifierGroup`, `ModifierOption`, `Order`, `OrderItem` (con `status`, `priceAtPurchase`, `totalItemPrice`, `itemNameSnapshot_es/en`), `Table`, `StaffPin`.
  - Enums específicos: `OrderStatus`, `OrderItemStatus`, `ModifierUiType`, `OrderType`, `OrderSource`.
  - Soporte i18n en modelos de carta (`name_es/en`, `description_es/en`).
- **API de Gestión de Carta por el Administrador (Backend - `/api/camarero/admin/*`):**
  - Endpoints CRUD completos y protegidos para que el `BUSINESS_ADMIN` gestione `MenuCategory`, `MenuItem`, `ModifierGroup` y `ModifierOption`, si el módulo LC está activo.
- **Interfaz de Usuario para Gestión de Carta por el Administrador (Frontend - `/admin/dashboard/camarero/menu-editor`):**
  - `MenuManagementPage.tsx` con componentes dedicados (`MenuCategoryManager.tsx`, `MenuItemManager.tsx`, `MenuItemFormModal.tsx`, `ModifierGroupsManagementModal.tsx`, `ModifierOptionsManagementModal.tsx`) para un CRUD intuitivo de toda la estructura de la carta, incluyendo subida y recorte de imágenes.
  - Botón "Previsualizar Carta Pública" funcional.
- **Visualización de Carta Pública y Flujo de Pedido por Cliente Final (Backend & Frontend):**
  - **Backend (`GET /public/menu/business/:businessSlug`):** API pública que sirve la carta activa y disponible, con i18n y estructura de modificadores.
  - **Frontend (`/m/:businessSlug/:tableIdentifier?` - `PublicMenuViewPage.tsx`):** Página responsive para visualización y personalización de ítems (`MenuItemCard.tsx`, `ModifierGroupInteractiveRenderer.tsx`).
  - **Carrito de Compra Local:** Con persistencia en `localStorage` (asociado a `businessSlug` y `tableIdentifier`), modal de revisión (`ShoppingCartModal.tsx`), y funcionalidades de edición.
  - **Envío y Procesamiento de Pedido (`POST /public/order/:businessSlug`):**
    - Frontend construye `CreateOrderPayloadDto` (con ítems, notas, mesa, `customerId?` LCo).
    - Backend valida exhaustivamente (disponibilidad, reglas de modificadores), recalcula precios, y crea transaccionalmente `Order` (estado `RECEIVED`, `orderNumber`), `OrderItem`s, y `OrderItemModifierOption`s.
    - Frontend recibe confirmación, limpia carrito, guarda info del pedido activo en `localStorage`, y redirige a `OrderStatusPage`.
- **Visualización del Estado del Pedido por el Cliente (`OrderStatusPage.tsx`):**
  - Muestra estado general del `Order` y de cada `OrderItem`.
  - Polling automático (`GET /public/order/:orderId/status`) para actualizaciones.
  - Manejo de estados finales (`PAID`, `CANCELLED`) para limpiar `localStorage` y permitir nuevos pedidos.
- **Kitchen Display System (KDS) - Backend y Frontend (MVP Funcional):**
  - **API KDS Backend (`/api/camarero/kds/*`): [VALIDADA]**
    - Endpoints `GET /items` (filtra por destino y estado) y `PATCH /items/:orderItemId/status`.
    - Lógica de actualización de `Order.status` general basada en `OrderItem.status` **corregida y probada.**
  - **Interfaz KDS Frontend (`/admin/kds` - `KitchenDisplayPage.tsx`): [FUNCIONAL]**
    - Accesible por roles `KITCHEN_STAFF`, `BAR_STAFF`, `BUSINESS_ADMIN`.
    - Selector de destino ("COCINA", "BARRA").
    - Muestra ítems `PENDING_KDS` y `PREPARING` con detalles.
    - **Botones de acción para cambiar estado de `OrderItem`s** (Empezar Preparación, Marcar Listo, Cancelar Ítem), con feedback y notificaciones.
    - Polling para refresco automático.

## Estado Actual y Próximos Pasos 🗺️

La plataforma ha alcanzado la **versión v1.19.0**.

- **LoyalPyME Core (LCo):** Estable, completamente funcional y probado.
- **Arquitectura Multi-Módulo y Panel Super Admin:** Implementada y operativa.
- **Módulo Camarero (LC) - Hitos Clave Alcanzados:**
  - Gestión completa de la carta digital por el administrador (backend y frontend).
  - Visualización pública e interactiva de la carta por el cliente final.
  - Flujo de pedido por el cliente final funcional: desde la selección y personalización de ítems, pasando por un carrito de compras persistente y editable, hasta el envío del pedido al backend, su registro en la base de datos y la redirección a la página de estado del pedido.
  - Visualización del estado del pedido por el cliente con actualizaciones por polling.
  - **KDS Backend:** API y lógica de actualización de estados (`OrderItem` y `Order`) validadas y funcionales.
  - **KDS Frontend (MVP):** Interfaz que permite al personal de cocina/barra visualizar los ítems por destino y cambiar su estado de preparación.

El **enfoque principal de desarrollo inmediato** para el Módulo Camarero (LC) es completar el ciclo de servicio, centrándose en la **Interfaz del Camarero (MVP)**:

1.  ⭐ **LC - Backend: API para Interfaz de Camarero:**
    - **Objetivo:** Crear los endpoints para que el personal de sala pueda:
      - Ver los `OrderItem`s que el KDS ha marcado como `READY`.
      - Marcar estos `OrderItem`s como `SERVED`.
      - Desencadenar la actualización del `Order.status` general a `COMPLETED` cuando todos los ítems estén servidos.
2.  ⭐ **LC - Frontend: Interfaz de Camarero (MVP):**
    - **Objetivo:** Desarrollar una página/vista simple para que los camareros:
      - Visualicen la lista de ítems/pases listos para recoger.
      - Puedan usar un botón "Marcar como Servido" para cada ítem/pase.
3.  ⭐ **LC - Cliente: Visualización de Ítems Servidos y Pedido Completado:**
    - **Objetivo:** Asegurar que la `OrderStatusPage.tsx` del cliente refleje correctamente los ítems servidos y el estado `COMPLETED` del pedido.

Posteriormente, se abordarán funcionalidades como "Añadir Ítems a Pedido Existente" (cliente), mejoras en el KDS (tiempos, alertas, pases), gestión de mesas y personal por el administrador de LC (incluyendo la consideración de un sistema de permisos más granular), la solicitud de cancelación de pedidos por el cliente (con confirmación KDS), y una mayor integración con LoyalPyME Core.

- Consulta **[PROJECT_STATUS.md](./PROJECT_STATUS.md)** para un análisis detallado de los hitos completados, la versión actual y las decisiones de diseño clave.
- Revisa **[DEVELOPMENT_PLAN.md](./DEVELOPMENT_PLAN.md)** para el backlog completo, la hoja de ruta detallada de funcionalidades para el Módulo Camarero y las ideas futuras.
- Para los flujos de trabajo en detalle:
  - [LOYALPYME_CORE_WORKFLOW.md](./LOYALPYME_CORE_WORKFLOW.md)
  - [LOYALPYME_CAMARERO_WORKFLOW.md](./LOYALPYME_CAMARERO_WORKFLOW.md)
  - [MODULE_INTEGRATION_WORKFLOW.md](./MODULE_INTEGRATION_WORKFLOW.md)

## Tecnologías Utilizadas 🛠️

**Frontend:**
React (v19+, Hooks, Context API), TypeScript, Vite (v5+, bundler y servidor de desarrollo HMR), Mantine UI (v7+, biblioteca de componentes y hooks), Axios (cliente HTTP), React Router DOM (v6+, para enrutamiento SPA), `html5-qrcode` (para escaneo de códigos QR por el cliente en LCo), `react-image-crop` (para recorte de imágenes en interfaces de administración), `i18next` y `react-i18next` (para internacionalización ES/EN con archivos JSON), `zod` (para validación de formularios, implementación progresiva).

**Backend:**
Node.js (runtime), Express.js (framework web), TypeScript (lenguaje principal), Prisma ORM (v6+, para acceso a base de datos PostgreSQL, gestión de migraciones y generación de cliente tipado), PostgreSQL (sistema de gestión de base deatos relacional), JSON Web Tokens (JWT) (para autenticación stateless), `bcryptjs` (para hashing seguro de contraseñas), Cloudinary SDK (para almacenamiento y gestión de imágenes en la nube), Multer (middleware para manejo de subidas de archivos `multipart/form-data`), Vitest (para testing unitario y de integración), Supertest (para testing de API HTTP), Swagger/OpenAPI (`swagger-jsdoc`, `swagger-ui-express`) (para documentación interactiva de la API RESTful), `node-cron` (para la ejecución de tareas programadas, ej. actualización de tiers en LCo).

_(Una lista más detallada de dependencias y versiones específicas se encuentra en los archivos `package.json` de las carpetas `frontend/` y `backend/`. Una discusión más profunda sobre las tecnologías clave y su aplicación en el proyecto se encuentra en el documento [PROJECT_STATUS.md](./PROJECT_STATUS.md))._

## Inicio Rápido (Desarrollo Local) 🚀

1.  **Clonar el Repositorio:**
    ```bash
    git clone <URL_DEL_REPOSITORIO_GIT> LoyalPyME
    cd LoyalPyME
    ```
2.  **Configuración del Backend (`backend/`):**
    - Instalar dependencias: `yarn install` (o `npm install`).
    - Configurar Variables de Entorno: Copiar `backend/.env.example` a `backend/.env`. Rellenar **todas** las variables requeridas:
      - `DATABASE_URL`: Cadena de conexión a tu servidor PostgreSQL local (ej. `postgresql://postgres:tu_password@localhost:5432/loyalpymedb?schema=public`).
      - `JWT_SECRET`: Cadena aleatoria larga y segura para firmar tokens.
      - `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET`: Credenciales de tu cuenta de Cloudinary.
      - (Opcional) `TIER_UPDATE_CRON_SCHEDULE`: Para la tarea de actualización de tiers (ej. `0 3 * * *` para las 3 AM todos los días).
    - Base de Datos (PostgreSQL debe estar corriendo):
      1.  Crear la base de datos (ej. `loyalpymedb`) si no existe.
      2.  Desde `backend/`, ejecutar `npx prisma migrate reset` (confirma la acción, esto borrará y recreará la BD).
      3.  Ejecutar `npx prisma db seed` para poblar con datos de demostración (negocio, admin, cliente, carta LC, etc.).
      4.  Ejecutar `npx ts-node ./scripts/create-superadmin.ts` para crear el Super Administrador global (`superadmin@loyalpyme.com` / `superadminpassword`).
    - Ejecutar el Backend (desde `backend/`, en dos terminales separadas):
      1.  `yarn dev:build` (o `npx tsc --watch`): Compilación continua de TypeScript.
      2.  `yarn dev:run` (o `npx nodemon dist/index.js`): Iniciar servidor Node.js con Nodemon.
3.  **Configuración del Frontend (`frontend/`):**
    - Instalar dependencias: `yarn install` (o `npm install`).
    - Ejecutar el Frontend (desde `frontend/`):
      - `yarn dev` (para acceso en `https://localhost:5173`).
      - `yarn dev --host` (para acceso desde otros dispositivos en la red local, ej. móvil para probar QR de mesa o KDS en tablet).
4.  **Acceso a las Aplicaciones (URLs por defecto):**
    - **Carta Pública Módulo Camarero (Cliente):** `https://localhost:5173/m/restaurante-demo-loyalpyme` (o el slug de tu negocio demo; puedes añadir `/identificador-mesa` al final, ej. `/M1`, si usas los datos del seed).
    - **Página de Estado del Pedido (Cliente):** Se accede tras enviar un pedido desde la carta.
    - **Login / Registro / Dashboard Cliente LCo / Panel Admin Negocio:** `https://localhost:5173`
      - Login Admin Negocio Demo (LCo & LC): `admin@demo.com` / `password`
      - Login Cliente Demo (LCo): `cliente@demo.com` / `password`
      - Login Staff KDS Demo: `cocina@demo.com` / `password` (redirige a `/admin/kds`) o `barra@demo.com` / `password`.
    - **Panel KDS (Staff):** `https://localhost:5173/admin/kds` (requiere login como staff KDS o admin).
    - **Panel Super Admin:** `https://localhost:5173/superadmin`
      - Login: `superadmin@loyalpyme.com` / `superadminpassword` (o las credenciales configuradas).
    - **Documentación API Backend (Swagger):** `http://localhost:3000/api-docs`

**¡Importante!** Para instrucciones **exhaustivas y detalladas** sobre la instalación, configuración completa del entorno (variables `.env` para backend y frontend), creación de base de datos, y ejecución paso a paso, consulta la guía **[SETUP_GUIDE.md](./SETUP_GUIDE.md)**. Para soluciones a problemas comunes de configuración o ejecución, revisa la **[TROUBLESHOOTING_GUIDE.md](./TROUBLESHOOTING_GUIDE.md)**.

---

## Contribuciones 🤝

Este proyecto es software propietario desarrollado por Olivier Hottelet. No se aceptan contribuciones externas directas en este momento. Si se detectan errores o se tienen sugerencias de mejora, pueden ser comunicadas al propietario. Si el repositorio fuera público y permitiera la creación de "Issues" en la plataforma de hosting de código (ej. GitHub, GitLab), esa sería la vía formal para reportar bugs o proponer nuevas funcionalidades.

## Licencia 📜

Este proyecto es software propietario.
**Copyright (c) 2024-2025 Olivier Hottelet. Todos los derechos reservados.**

El uso, copia, reproducción, distribución, modificación, descompilación, ingeniería inversa o cualquier otra forma de explotación de este software o su código fuente, en su totalidad o en parte, está estrictamente prohibido sin el permiso previo, explícito y por escrito del propietario de los derechos de autor. Este software se considera información confidencial y un secreto comercial.

Para más detalles sobre los términos de la licencia, consulta el archivo [LICENSE.md](./LICENSE.MD) en el directorio raíz del proyecto.

## Contacto 📧

Para consultas sobre el proyecto, licencias, adquisición, o cualquier otro asunto relacionado:

- **Olivier Hottelet**
- [olivierhottelet1980@gmail.com](mailto:olivierhottelet1980@gmail.com)

---
