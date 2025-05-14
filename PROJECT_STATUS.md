# LoyalPyME - Estado del Proyecto y Decisiones Clave

**Versión Actual:** 1.17.0 (Módulo Camarero - Flujo de Pedido Cliente con Carrito Persistente y Funcionalidad de Envío a Backend)
**Fecha de Última Actualización:** 14 de Mayo de 2025

---

## 1. Resumen General del Proyecto LoyalPyME 🎯

- **Concepto:** Plataforma web integral y modular desarrollada con un stack full-stack (React/TypeScript en Frontend, Node.js/Express/TypeScript en Backend). Está diseñada para Pequeñas y Medianas Empresas (PyMEs) y ofrece dos módulos principales que pueden ser activados por negocio:
  - **LoyalPyME Core (LCo):** Un sistema robusto para la gestión de programas de fidelización de clientes digitales (puntos, niveles de lealtad, recompensas personalizadas, generación y validación de códigos QR para acumulación de puntos, panel de cliente interactivo).
  - **LoyalPyME Camarero (LC):** Un módulo avanzado, actualmente en desarrollo activo, enfocado en la digitalización y optimización de la operativa de servicio en el sector hostelero. Permite la gestión completa de la carta digital por el administrador, la visualización de esta carta por el cliente final, y un flujo de toma de comandas por el propio cliente desde su dispositivo móvil mediante el escaneo de un QR de mesa.
- **Componentes Tecnológicos Clave:**
  - **Backend:** Node.js, Express.js, TypeScript, Prisma ORM con PostgreSQL como base de datos, JWT (JSON Web Tokens) para autenticación, Cloudinary para almacenamiento y gestión de imágenes, Multer para el manejo de subidas de archivos, Swagger/OpenAPI para la documentación de la API, y `node-cron` para tareas programadas (ej. lógica de tiers).
  - **Frontend:** React (con Hooks), TypeScript, Vite como bundler y servidor de desarrollo, Mantine UI como librería principal de componentes, Axios (con una instancia interceptora para JWT) para peticiones HTTP, React Router DOM para la gestión de rutas, `i18next` para la internacionalización (ES/EN), `html5-qrcode` para la funcionalidad de escaneo de QR por el cliente, y `react-image-crop` para el recorte de imágenes en los paneles de administración.
  - **Testing:** Vitest para pruebas unitarias y de integración tanto en backend como en frontend.
- **Licencia:** Software Propietario. Copyright (c) 2024-2025 Olivier Hottelet. Todos los derechos reservados.
- **Áreas Funcionales Principales de la Plataforma:**
  - **Panel Super Admin (`/superadmin`):** Interfaz para la administración global de los negocios clientes registrados en la plataforma, permitiendo la activación/desactivación del estado general de un negocio y de sus módulos específicos (LCo, LC).
  - **Panel de Administración del Negocio (`/admin/dashboard/*`):** Interfaz para que el `BUSINESS_ADMIN` gestione las funcionalidades del módulo o módulos que tenga activos para su negocio.
    - **LCo:** Gestión de clientes, recompensas, niveles (tiers), configuración del programa de fidelización, generación de QR de puntos.
    - **LC:** Gestión de la carta digital (categorías, ítems, modificadores), y futuras gestiones de mesas, personal, KDS, etc.
  - **Portal de Cliente Final (LCo - `/customer/dashboard`):** Dashboard para clientes registrados en LCo, donde pueden ver sus puntos, nivel actual, progreso, recompensas disponibles, historial de actividad y validar códigos QR de puntos.
  - **Interfaces del Módulo Camarero (LC):**
    - **Carta Digital Pública (`/m/:businessSlug/:tableIdentifier?`):** Permite a cualquier persona (logueada o no) visualizar la carta del negocio y realizar un pedido desde su móvil, idealmente accediendo mediante un QR en la mesa.
    - **(Futuro) KDS (Kitchen Display System):** Pantallas para cocina/barra para visualizar y gestionar el estado de preparación de los ítems de los pedidos.
    - **(Futuro) Interfaz de Camarero:** Aplicación/vista para que el personal de sala gestione mesas, reciba notificaciones y tome pedidos.
- **Propósito y Visión:** Ser la herramienta digital integral, modular y adaptable que potencie la fidelización de clientes y optimice la operativa de servicio en PyMEs, especialmente en el sector hostelero, mejorando la recurrencia y la relación cliente-negocio.

_(Para una descripción más detallada de la visión a largo plazo, consulta el [README.md](./README.md). Para la hoja de ruta y el backlog de funcionalidades, revisa [DEVELOPMENT_PLAN.md](./DEVELOPMENT_PLAN.md). Para los flujos de trabajo detallados de cada módulo, consulta `LOYALPYME_CORE_WORKFLOW.md`, `LOYALPYME_CAMARERO_WORKFLOW.md`, y `MODULE_INTEGRATION_WORKFLOW.md`)._

---

## 2. Estado Actual Detallado (Hitos Completados - v1.17.0) ✅

- **Fase 1 (Núcleo Operativo LCo + Pulido Inicial): [COMPLETADO]**

  - Funcionalidades base de LoyalPyME Core (LCo) estables y probadas: Autenticación completa (registro negocios/clientes, login, reseteo password), CRUDs Admin LCo (Recompensas con i18n y recorte de imagen, Tiers con beneficios, Clientes con filtros/búsqueda/ordenación y acciones individuales/masivas), Flujo Puntos/QR LCo, Lógica de Tiers automática, Historial Actividad Cliente LCo.
  - Mejoras UI/UX iniciales, Internacionalización Frontend base (ES/EN) con `i18next`, Documentación API Swagger/OpenAPI base.

- **Fase 2 (Fundamentos Multi-Módulo y Panel Super Admin): [COMPLETADO]**

  - Implementación del Panel Super Admin: Gestión de estado de negocios y activación/desactivación de módulos LCo/LC por negocio.
  - Middleware `checkModuleActive` en backend y lógica condicional en UI frontend para acceso basado en módulos.
  - Payload de perfil de usuario (`/api/profile`) enriquecido para incluir flags de módulos activos del negocio y detalles como `businessSlug` y `businessName` para `BUSINESS_ADMIN` y `CUSTOMER_FINAL`.
  - Script de Seed (`prisma/seed.ts`) mejorado para poblar datos de demostración para ambos módulos.

- **Fase 3 (Desarrollo Módulo "LoyalPyME Camarero" - LC): [AVANZADO - MVP de Pedido por Cliente en Progreso]**
  - **LC - Fundamentos Backend (Modelos BD y API Gestión Carta): [COMPLETADO]**
    - Modelos Prisma definidos y migrados para `Table`, `MenuCategory`, `MenuItem`, `ModifierGroup`, `ModifierOption`, `Order`, `OrderItem`, `OrderItemModifierOption`, `StaffPin`. Roles de personal (`WAITER`, `KITCHEN_STAFF`, `BAR_STAFF`) añadidos a `UserRole`. Campos i18n, de disponibilidad, y operativos (SKU, `kdsDestination`, `preparationTime`) en modelos de carta.
    - API CRUD Admin (`/api/camarero/admin/*`) para gestión de `MenuCategory`, `MenuItem`, `ModifierGroup`, `ModifierOption`.
  - **LC - Frontend: UI Admin para Gestión de Carta Digital: [COMPLETADO]**
    - Página `/admin/dashboard/camarero/menu-editor` (`MenuManagementPage.tsx`) con componentes `MenuCategoryManager.tsx`, `MenuItemManager.tsx`, `MenuItemFormModal.tsx`, `ModifierGroupsManagementModal.tsx`, `ModifierOptionsManagementModal.tsx` para CRUD completo de la estructura de la carta, incluyendo subida/recorte de imágenes.
    - Botón "Previsualizar Carta Pública" para admins en `MenuManagementPage.tsx`.
  - **LC - Backend y Frontend: Visualización de Carta Pública por Cliente Final: [COMPLETADO]**
    - Endpoint público `/public/menu/business/:businessSlug` devuelve estructura de carta activa, i18n, y ordenada.
    - Página pública `/m/:businessSlug/:tableIdentifier?` (`PublicMenuViewPage.tsx`) consume la API y muestra la carta de forma interactiva (acordeones para categorías, `MenuItemCard.tsx` para ítems, `ModifierGroupInteractiveRenderer.tsx` para selección de modificadores).
  - ⭐ **LC - Backend y Frontend: Flujo de Pedido por Cliente Final (Anónimo o Logueado): [FUNCIONALIDAD BASE COMPLETADA]**
    - **Backend (`POST /public/order/:businessSlug`):** API implementada para recibir `CreateOrderPayloadDto`. Realiza validación exhaustiva de ítems (existencia, disponibilidad, pertenencia al negocio), modificadores (existencia, disponibilidad, reglas de selección `minSelections`/`maxSelections`/`isRequired`), y recalcula todos los precios. Crea registros `Order` (asociando `tableId` y opcionalmente `customerId` LCo, `orderNotes`), `OrderItem` (con `unitPrice` y `totalItemPrice` calculados, `kdsDestination`), y `OrderItemModifierOption` de forma transaccional. Estado inicial del pedido `RECEIVED`. Genera `orderNumber`. Devuelve el objeto `Order` creado.
    - **Frontend (`PublicMenuViewPage.tsx`, `MenuItemCard.tsx`, `ShoppingCartModal.tsx`):**
      - Cliente puede seleccionar cantidad y personalizar ítems con modificadores (UI interactiva con Radio/Checkbox).
      - Precio del ítem se actualiza dinámicamente durante la configuración.
      - Validación frontend de reglas de modificadores antes de permitir "Añadir al Carrito".
      - Ítems configurados (con cantidad, modificadores, notas de ítem) se añaden a un estado de carrito local (`currentOrderItems`).
      - **Persistencia del Carrito:** El estado `currentOrderItems` y las `orderNotes` generales se guardan en `localStorage` (asociado a `businessSlug` y `tableIdentifier`) y se recargan al volver a la página, permitiendo al cliente continuar un pedido no finalizado.
      - **Barra de Carrito Sticky:** Muestra número de ítems y total; al pulsar, abre el modal del carrito.
      - **Modal del Carrito (`ShoppingCartModal.tsx`):**
        - Lista detallada de ítems en el carrito (nombre i18n, cantidad, modificadores, notas, precio línea, subtotal).
        - Permite modificar cantidad de ítems (con recalculo de totales).
        - Permite eliminar ítems.
        - Permite añadir/editar notas generales para el pedido.
        - Botón para "Vaciar Carrito" completamente.
        - Muestra el total final del pedido.
      - **Envío del Pedido:** Botón "Enviar Pedido" construye el DTO y lo envía al backend.
      - **Feedback Post-Envío:** Notificaciones de éxito (mostrando `orderNumber` o `id` del pedido) o error (con mensaje del backend). Limpieza del carrito y cierre del modal en caso de éxito.
  - **LC - Acceso a Carta para Cliente LCo Logueado: [COMPLETADO]**
    - Tarjeta "Ver la Carta y Pedir" en `SummaryTab.tsx` del `CustomerDashboardPage.tsx` si el módulo LC está activo para el negocio del cliente y el `businessSlug` está disponible en `userData`.

---

## 3. Key Concepts & Design Decisions 🔑

- **Arquitectura Modular y Activación por Negocio:**
  - La plataforma soporta módulos discretos (`LOYALTY_CORE`, `CAMARERO`) que pueden ser activados o desactivados para cada `Business` por un `SUPER_ADMIN`.
  - El acceso a funcionalidades (API y UI) está condicionado por la activación del módulo correspondiente (`isLoyaltyCoreActive`, `isCamareroActive` en `Business` y propagado a `req.user`).
  - Middleware `checkModuleActive` en backend; lógica de renderizado condicional en frontend.
- **Estructura de Datos Detallada para Módulo Camarero (LC):**
  - **Carta Digital:** Jerarquía `MenuCategory` -> `MenuItem`. Ambos con campos i18n (`name_es/en`, `description_es/en`), `imageUrl`, `position` para orden, y estado `isActive`/`isAvailable`. `MenuItem` incluye `price`, `allergens` (array de strings, ej. `['GLUTEN', 'LACTOSE']`), `tags` (array de strings, ej. `['VEGAN', 'SPICY']`), `preparationTime` (minutos), `calories`, `sku`, `kdsDestination` (string para identificar puesto de cocina/barra).
  - **Modificadores:** `MenuItem` tiene `ModifierGroup[]`. Cada `ModifierGroup` tiene `name_es/en`, `uiType` (`RADIO`, `CHECKBOX`), reglas (`minSelections`, `maxSelections`, `isRequired`), `position`. Cada `ModifierGroup` tiene `ModifierOption[]`. Cada `ModifierOption` tiene `name_es/en`, `priceAdjustment` (Decimal), `position`, `isDefault`, `isAvailable`.
  - **Pedidos (`Order`):** Contiene `businessId`, `tableId?` (opcional, de `Table`), `customerId?` (opcional, de `User` LCo), `orderNumber` (ej. "P-000001"), `status` (`OrderStatus` enum: `RECEIVED`, `IN_PROGRESS`, `COMPLETED`, `PAID`, `CANCELLED`, etc.), `totalAmount` (calculado por backend), `discountAmount?`, `finalAmount`, `notes?` (generales del pedido), `source?` (ej. `CUSTOMER_APP`, `WAITER_APP`).
  - **Ítems del Pedido (`OrderItem`):** Enlazado a `Order` y `MenuItem`. Contiene `quantity`, `unitPrice` (precio del `MenuItem` + suma de `priceAdjustment` de modificadores seleccionados, snapshot al momento del pedido), `totalItemPrice` (`quantity * unitPrice`), `notes?` (del ítem), `kdsDestination` (snapshot del `MenuItem`), `status` (`OrderItemStatus` enum: `PENDING_KDS`, `PREPARING`, `READY`, `SERVED`, `CANCELLED`).
  - **Modificadores del Ítem del Pedido (`OrderItemModifierOption`):** Tabla de unión entre `OrderItem` y `ModifierOption` para registrar las opciones seleccionadas para cada ítem del pedido.
  - **Mesas (`Table`):** `businessId`, `identifier` (string legible ej. "MESA-05", usado en QR y URL), `capacity?`, `zone?`.
  - **Personal (`StaffPin` y Roles `UserRole`):** `User` con roles `WAITER`, `KITCHEN_STAFF`, `BAR_STAFF`. `StaffPin` para login rápido de personal.
- **Flujo de Pedido LC - Cliente:**
  - **Acceso Primario:** Escaneo de QR en mesa que lleva a `/m/:businessSlug/:tableIdentifier`.
  - **Pedido Anónimo por Defecto:** No se requiere login para ver carta ni para enviar un pedido.
  - **Login/Registro LCo Opcional:** Para ganar puntos, el cliente puede identificarse. Su `customerId` se asocia al pedido LC.
  - **DTO de Pedido Frontend (`CreateOrderPayloadDto`):** Envía `items: [{menuItemId, quantity, notes?, selectedModifierOptions: [{modifierOptionId}] }]`, `orderNotes?`, `tableIdentifier?`, `customerId?`.
  - **Validación y Creación en Backend:** El backend revalida todo (disponibilidad, reglas de modificadores) y recalcula precios. La creación es transaccional.
  - **Persistencia del Carrito:** El frontend usa `localStorage` para guardar el carrito no enviado, permitiendo al cliente continuar después.
- **Internacionalización (i18n):**
  - **Frontend:** `i18next` con archivos JSON (`es/translation.json`, `en/translation.json`) para todos los textos de la UI.
  - **Backend:** Los modelos de datos de la carta (Categorías, Ítems, Modificadores) almacenan campos de texto en múltiples idiomas (ej. `name_es`, `name_en`). La API pública de menú devuelve todos los campos de idioma para que el frontend seleccione el apropiado.
- **Almacenamiento de Imágenes:** Cloudinary, con subida gestionada por el backend y recorte en el frontend para admins.
- **Arquitectura de Servicios y Controladores (Backend):** Lógica de negocio encapsulada en servicios, controladores manejan HTTP req/res.
- **Hooks Personalizados (Frontend):** Para encapsular lógica de obtención y gestión de datos (ej. `useAdminMenuCategories`, `useUserProfileData`).

---

## 4. Lecciones Aprendidas & Troubleshooting Clave 💡

- **Configuración de Seed y Prisma CLI:** La sección `"prisma": { "seed": "ts-node prisma/seed.ts" }` en `package.json` es vital para que `npx prisma db seed` funcione con TypeScript. Siempre ejecutar `npx prisma generate` después de `migrate dev/reset`.
- **Gestión de Estado Complejo en Frontend (LC):**
  - El estado `configuringItem` para personalizar ítems y el estado `currentOrderItems` para el carrito en `PublicMenuViewPage.tsx` requieren una gestión cuidadosa para la actualización de precios, validación de modificadores y la correcta adición/modificación de ítems en el carrito.
  - Evitar bucles de renderizado (`Maximum update depth exceeded`) separando la lógica de cálculo de la actualización de estado y controlando las dependencias de `useEffect` y `useCallback`.
- **Errores de Tipo y Lógica en Backend:**
  - Al construir objetos `data` para `prisma.create/update` con relaciones opcionales (ej. `tableId?`, `customerId?` en `Order`), es crucial asegurar que los objetos `connect` solo se incluyan si el ID es válido, para evitar errores de tipo o de constraint de Prisma.
  - Las transacciones Prisma (`prisma.$transaction`) son esenciales para operaciones de creación/actualización complejas (como crear un Pedido con sus Ítems y Modificadores) para asegurar la atomicidad.
- **Internacionalización (i18n):**
  - La depuración de `missingKey` requiere verificar la ruta completa de la clave, la correcta carga del namespace (usar `debug: true` en `i18n.ts`), y la limpieza de caché.
  - Las claves para pluralización (`_one`, `_other`) y contexto deben usarse correctamente.
- **Manejo de Errores y Feedback al Usuario:** Proveer notificaciones claras y específicas tanto para éxitos como para errores (obteniendo mensajes del backend cuando sea posible) es crucial para la UX.
- **Manejo de Archivos (Multer/Cloudinary):** La configuración correcta de Multer (storage, fileFilter, limits) y el flujo de subida a Cloudinary (manejo de buffers/streams) son importantes.
- **Testing:** La necesidad de tests unitarios y de integración se hace más evidente a medida que la complejidad crece, especialmente para la lógica de negocio en servicios y la validación en controladores.

_(Para una guía más exhaustiva de problemas específicos, consulta [TROUBLESHOOTING_GUIDE.md](./TROUBLESHOOTING_GUIDE.md))_

---

## 5. Próximos Pasos Inmediatos / Prioridades (Foco en Módulo Camarero - LC) ⏳📌

1.  ⭐ **KDS (Kitchen Display System) - Backend (Tarea B1.1 del `DEVELOPMENT_PLAN.md`): [CRÍTICO]**
    - **Objetivo:** Crear las APIs necesarias para que las pantallas de KDS puedan obtener y actualizar el estado de los ítems de los pedidos.
    - **Acciones Inmediatas:**
      1.  Definir/Finalizar el enum `OrderItemStatus` en `schema.prisma` y añadir el campo `status` a `OrderItem`.
      2.  Implementar endpoint `GET /api/camarero/kds/items?destination=...`
      3.  Implementar endpoint `PATCH /api/camarero/kds/items/:orderItemId/status`.
      4.  Definir estrategia de autenticación para el KDS (rol de staff, token de API).
2.  ⭐ **KDS (Kitchen Display System) - Frontend (Tarea B1.2 del `DEVELOPMENT_PLAN.md`): [CRÍTICO]**
    - **Objetivo:** Desarrollar la interfaz visual básica del KDS.
    - **Acciones Inmediatas:**
      1.  Crear la estructura de la página/componente KDS.
      2.  Implementar la lógica para obtener y mostrar los `OrderItem`s del backend.
      3.  Implementar la funcionalidad para cambiar el estado de un `OrderItem` llamando a la API PATCH.
3.  **LC - Cliente: Visualización del Estado del Pedido (Tarea B2.1 del `DEVELOPMENT_PLAN.md`): [ALTA]**
    - **Objetivo:** Que el cliente vea el progreso de su pedido.
    - **Acciones Inmediatas:**
      1.  Backend: Endpoint `GET /public/order/:orderId/status`.
      2.  Frontend: Crear la página `OrderConfirmationPage.tsx` y lógica para mostrar/actualizar estados. (Implica modificar `handleSubmitOrder` en `PublicMenuViewPage.tsx` para redirigir y pasar datos).
4.  **(Paralelo/Continuo) Testing y Fundamentos Técnicos (Tarea C1-C4 del `DEVELOPMENT_PLAN.md`):**
    - Escribir tests para los nuevos endpoints KDS y de estado de pedido.
    - Continuar con la validación robusta backend (Zod) para estas nuevas APIs.
    - Revisar logs para asegurar que el flujo KDS y los cambios de estado son trazables.

_(Para ver la hoja de ruta completa, el backlog detallado y las funcionalidades futuras, consulta el `DEVELOPMENT_PLAN.md` actualizado)._

---

## 6. Información Adicional ℹ️

- **Licencia:** Software Propietario. Copyright (c) 2024-2025 Olivier Hottelet. Todos los derechos reservados. Consulta [LICENSE.md](./LICENSE.md) para más detalles.
- **Flujos de Trabajo Detallados:** Para una comprensión profunda de cómo operan los módulos y su integración, consultar:
  - `LOYALPYME_CORE_WORKFLOW.md`
  - `LOYALPYME_CAMARERO_WORKFLOW.md`
  - `LOYALPYME_MODULE_INTEGRATION_WORKFLOW.md`

---
