# LoyalPyME - Plan de Desarrollo y Futuras Funcionalidades

**Última Actualización:** 13 de Mayo de 2025

Este documento detalla las tareas pendientes inmediatas, el alcance definido para las próximas versiones operativas, la deuda técnica y las ideas para la evolución futura, con un enfoque actual en el Módulo Camarero.

---

## A. TRABAJO RECIENTEMENTE COMPLETADO / CORRECCIONES ✅

1.  ⭐ **[COMPLETADO - MVP Base]** Panel Super Admin y Gestión Negocios/Módulos (`backend`, `frontend`)

    - **Detalles Alcanzados:**
      - Backend: Modelos `Business` actualizados con flags `isLoyaltyCoreActive`, `isCamareroActive`. API Endpoints para Super Admin (`/api/superadmin/*`) para listar negocios y activar/desactivar sus módulos y estado general.
      - Frontend: Página `/superadmin` con tabla de negocios, switches para gestionar estado y activación de módulos. Lógica de datos y UI implementada.
      - Middleware `checkModuleActive` en backend y lógica condicional en UI frontend para respetar la activación de módulos.

2.  **[COMPLETADO]** Módulo Camarero (LC) - Fundamentos Backend (Modelos BD y API Gestión Carta Base)

    - **Detalles Alcanzados:**
      - **BD:** Modelos Prisma implementados y migrados para `Table`, `MenuCategory`, `MenuItem`, `ModifierGroup`, `ModifierOption`, `Order`, `OrderItem`, `OrderItemModifierOption`, y `StaffPin`. Roles de personal (`WAITER`, etc.) añadidos a `UserRole` enum. Relaciones actualizadas.
      - **API Gestión Carta (Admin):** Endpoints CRUD backend (`/api/camarero/admin/*`) para `MenuCategory`, `MenuItem`, `ModifierGroup`, y `ModifierOption`, protegidos por rol y activación del módulo LC.

3.  ⭐ **[COMPLETADO - Módulo Camarero]** LC - Frontend: UI para Gestión de Carta Digital por el Admin del Negocio (`frontend`)

    - **Prioridad (Original):** CRÍTICA
    - **Objetivo Alcanzado:** Interfaz de usuario completa en el panel de `BUSINESS_ADMIN` (`/admin/dashboard/camarero/menu-editor`) para gestionar la carta digital.
    - **Detalles de Implementación:**
      - Componente `MenuCategoryManager.tsx`: UI para listar, crear, editar (en modal con subida/recorte de imagen), eliminar y reordenar (futuro) categorías.
      - Componente `MenuItemManager.tsx`: UI para listar ítems dentro de una categoría seleccionada.
      - Modal `MenuItemFormModal.tsx`: Formulario completo para CRUD de ítems (i18n para nombre/descripción, precio, subida/recorte de imagen, alérgenos, tags, disponibilidad, posición, tiempo prep., calorías, SKU, destino KDS).
      - Modal `ModifierGroupsManagementModal.tsx` (accesible desde `MenuItemFormModal`): UI para listar, crear, editar y eliminar `ModifierGroup`s asociados a un ítem de menú.
      - Modal `ModifierOptionsManagementModal.tsx` (accesible desde `ModifierGroupsManagementModal`): UI para listar, crear, editar y eliminar `ModifierOption`s dentro de un grupo.
      - Hooks `useAdminMenuCategories`, `useAdminMenuItems`, `useAdminModifierGroups`, `useAdminModifierOptions` para la lógica de datos.
      - Tipos definidos en `menu.types.ts`.
      - Internacionalización básica de la interfaz.

4.  **[COMPLETADO]** Arreglar Tipo `TierData` (`frontend`)

    - **Problema:** El tipo `TierData` en `customer.ts` no incluía `benefits?: TierBenefitData[]`, lo que causaba errores al intentar acceder a `userData.currentTier.benefits`.
    - **Solución:** Se añadió `benefits: TierBenefitData[];` al tipo `TierData` (o a la estructura anidada dentro de `UserData` para `currentTier`).

5.  **[COMPLETADO]** Fix Mobile Popover Click en Barra de Progreso (`frontend`)

    - **Problema:** En móvil, el popover de "Próximo Nivel" en la barra de progreso del dashboard de cliente no se abría/cerraba bien al hacer clic en el icono de ayuda.
    - **Solución:** Ajustada la lógica de `onMouseEnter`/`onMouseLeave` y `onClick` para el `ActionIcon` del popover, asegurando que `useDisclosure` maneje el estado correctamente en interacciones táctiles/clic.

6.  **[COMPLETADO]** Fix Backend Build Error (`uploads.service.ts`) (`backend`)

    - **Problema:** Error de TypeScript `TS2307: Cannot find module '../utils/cloudinary.config.js'` o similar porque la importación en `uploads.service.ts` podría tener una extensión incorrecta o la ruta era inválida tras alguna reestructuración.
    - **Solución:** Corregida la ruta de importación a `import cloudinary from '../utils/cloudinary.config';` asumiendo que `cloudinary.config.ts` exporta por defecto la instancia configurada.

7.  **[COMPLETADO]** Feature: Botones Canje en Resumen Cliente (`frontend`)

    - **Problema:** Faltaba acción directa para canjear regalos o recompensas desde el resumen.
    - **Solución:** Añadidos botones "Canjear Regalo" / "Canjear Recompensa" en las tarjetas de ítems de la sección "Recompensas y Regalos Disponibles" en la pestaña de Resumen del Dashboard de Cliente.

8.  ⭐ **[COMPLETADO - MVP Visualización Carta Cliente]** LC - Backend & Frontend: Visualización de Carta Digital por el Cliente Final (`backend`, `frontend`)

    - **Prioridad (Original):** CRÍTICA
    - **Objetivo Alcanzado:** Un cliente puede visualizar la carta digital completa y actualizada del negocio accediendo a una URL pública.
    - **Detalles Alcanzados (Backend):**
      - Endpoint público `/public/menu/business/:businessSlug` implementado.
      - Devuelve la estructura completa de la carta: categorías (activas, ordenadas), ítems (activos y disponibles, ordenados) y para cada ítem, sus grupos de modificadores (activos, ordenados) con sus opciones (disponibles, ordenadas).
      - Devuelve todos los campos de idioma (ej. `name_es`, `name_en`) para que el frontend seleccione.
      - Consulta Prisma optimizada para obtener todos los datos necesarios.
    - **Detalles Alcanzados (Frontend):**
      - Nueva página/ruta pública `/m/:businessSlug/:tableIdentifier?` implementada que consume la API del backend.
      - Diseño responsive básico con categorías en formato `Accordion`.
      - Muestra nombre (i18n), descripción (i18n), precio, imagen, alérgenos y tags de los ítems.
      - Muestra los grupos de modificadores y sus opciones para cada ítem, incluyendo precio de ajuste y reglas de selección (informativo).
      - Estado de carga y manejo de errores implementados.
    - **Estado:** Funcionalidad base de visualización completada. Búsqueda/filtros básicos aún pendientes (ver Tarea #33).

9.  ⭐ **[EN PROGRESO - Flujo de Pedido]** LC - Backend & Frontend: Flujo de Pedido Básico por el Cliente Final (`backend`, `frontend`)
    - **Prioridad (Original):** ALTA
    - **Objetivo (Parcialmente Alcanzado):** Desde la carta digital, el cliente puede seleccionar ítems, configurar cantidad y modificadores, y añadirlos a un carrito local. El envío del pedido al backend está implementado y probado.
    - **Detalles Alcanzados (Backend):**
      - API `POST /public/order/:businessSlug` implementada para recibir el objeto `Order` con `OrderItem`s y `OrderItemModifierOption`s seleccionadas (DTO definido).
      - Validación de la estructura del pedido.
      - Validación de existencia y disponibilidad de `MenuItem` y `ModifierOption`.
      - Validación de reglas de selección de `ModifierGroup` (`minSelections`, `maxSelections`, `isRequired`).
      - Cálculo del precio total del pedido, incluyendo ajustes de modificadores.
      - Creación transaccional de los registros `Order`, `OrderItem`, y `OrderItemModifierOption` en la BD.
      - Estado inicial del pedido `RECEIVED`.
      - Generación de `orderNumber` simple.
    - **Detalles Alcanzados (Frontend - Vista de Carta):**
      - **Selección de Cantidad:** UI (`NumberInput`) para que el cliente seleccione la cantidad de cada ítem.
      - **Selección de Modificadores:** UI interactiva (`Radio.Group`, `Checkbox.Group`) para seleccionar opciones de modificadores.
      - **Cálculo de Precio Dinámico:** El precio del ítem se actualiza en tiempo real según los modificadores seleccionados.
      - **Validación de Modificadores:** Se valida si se cumplen las reglas de los grupos (obligatorios, min/max) antes de permitir añadir al carrito.
      - **"Añadir al Carrito":** Funcionalidad para añadir el ítem configurado (con cantidad, modificadores, notas) a un estado de carrito local (`currentOrderItems`).
      - **Carrito Preliminar:** Visualización básica del total del pedido en la parte superior de la página.
    - **Siguientes Sub-Tareas para este Hito:**
      - **Frontend:**
        - Desarrollar un componente "Carrito de Pedido" detallado (modal o panel lateral) para ver, editar cantidades, y eliminar ítems del pedido.
        - Permitir añadir notas generales al pedido.
        - Implementar el botón "Enviar Pedido" que construya el DTO final y lo envíe al backend.
        - Manejo de feedback al usuario sobre el estado del envío del pedido (éxito, error).
      - **Backend:**
        - Refinar la validación exhaustiva de la orden (considerar Zod - Tarea #14).
        - Lógica para determinar el destino del pedido (ej. KDS, aunque la visualización KDS es Tarea #10).

---

## B. PRIORIDAD ACTUAL: Módulo "LoyalPyME Camarero" (LC) - Desarrollo del MVP (Continuación Funcionalidades Cliente y Operativas) 🧑‍🍳📱

_(Funcionalidades y requisitos técnicos mínimos para un primer lanzamiento operativo del módulo Camarero)._

_(La Tarea #8 se movió a la sección A como "COMPLETADO - MVP Visualización Carta Cliente")_

**9. ⭐ [EN PROGRESO - Flujo de Pedido]** LC - Backend & Frontend: Flujo de Pedido Básico por el Cliente Final (`backend`, `frontend`) - **Prioridad Actual:** **CRÍTICA** - **Dificultad Estimada (Restante):** Media-Alta (Principalmente Frontend: UI Carrito, envío y feedback) - **Objetivo Restante:** Completar la interfaz de usuario del carrito de pedido, permitir al cliente enviar el pedido al backend, y recibir confirmación o errores. - **Sub-Tareas Backend (Pendientes/Refinar):** - Refinar validación exhaustiva de la orden (considerar Zod - Tarea #14). - Asegurar que la lógica de destino KDS se almacena correctamente (para Tarea #10). - **Sub-Tareas Frontend (Pendientes CRÍTICAS):** - UI **Componente "Carrito de Pedido"** visible y actualizable: - Listar ítems con detalles (nombre, cantidad, modificadores, precio por línea, subtotal). - Permitir modificar cantidad de un ítem en el carrito. - Permitir eliminar un ítem del carrito. - UI para añadir notas al pedido general. - Botón "Enviar Pedido" / "Confirmar Pedido". - Lógica para construir el DTO `CreateOrderPayload` final desde el estado del carrito. - Llamada API `POST /public/order/:businessSlug` con el payload. - Pantalla de confirmación del pedido / Manejo de feedback al usuario sobre el estado del envío (éxito, errores de validación del backend, errores de servidor). - **Consideraciones:** Manejo robusto del estado del carrito. Flujo de usuario intuitivo para el checkout.

10. ⭐ **LC - Backend & Frontend: KDS (Kitchen Display System) Básico** (`backend`, `frontend`)

    - **Prioridad:** Alta (Después de que el Flujo de Pedido #9 sea funcional)
    - **Dificultad Estimada:** Alta
    - **Objetivo:** Una o varias pantallas (para cocina, barra, etc.) muestran las nuevas comandas (o ítems individuales) en tiempo real y permiten gestionar su estado (ej: Pendiente -> En Preparación -> Listo para Servir).
    - **Sub-Tareas Backend:**
      - API para que el KDS obtenga los `OrderItem`s relevantes según su `kdsDestination`.
      - API para actualizar el estado de un `OrderItem` (ej: `OrderItemStatus`).
      - Considerar WebSockets/Server-Sent Events para actualizaciones en tiempo real en el KDS.
    - **Sub-Tareas Frontend:**
      - Interfaz de KDS clara y funcional, optimizada para tablets.
      - Organización de comandas/ítems (tarjetas, columnas por estado).
      - Alertas visuales/sonoras para nuevas comandas.
      - Botones para cambiar estado de ítems/comandas.
    - **Consideraciones:** Fiabilidad de la comunicación en tiempo real. Usabilidad en entornos de cocina/barra.

11. ⭐ **LC - Backend & Frontend: Interfaz Camarero Básica (MVP)** (`backend`, `frontend`)

    - **Prioridad:** Media-Alta (Después de KDS funcional o en paralelo si es posible)
    - **Dificultad Estimada:** Alta
    - **Objetivo:** Una interfaz simple para que el personal (camareros) pueda ver notificaciones (ej: "Pedido Listo desde Cocina"), marcar ítems/pedidos como "Servidos" (requiriendo PIN de staff si está configurado).
    - **Sub-Tareas Backend:**
      - API para login de camarero (posiblemente con `StaffPin`).
      - API para obtener notificaciones relevantes para el camarero.
      - API para marcar un `Order` o `OrderItem` como `SERVED`.
    - **Sub-Tareas Frontend:**
      - Interfaz optimizada para tablet/móvil.
      - Lista de mesas con estados (si se implementa gestión de mesas).
      - Notificaciones claras.
      - Acciones rápidas para marcar como servido.
    - **Consideraciones:** Autenticación del personal. Flujo de trabajo eficiente.

12. **LC - Backend: Gestión de Personal y Mesas por Admin del Negocio** (`backend`)

    - **Prioridad:** Media (Necesario para funcionalidad completa de Camarero y KDS)
    - **Dificultad Estimada:** Media
    - **Objetivo:** APIs para que el `BUSINESS_ADMIN` gestione:
      - Usuarios tipo `Staff` (roles `WAITER`, `KITCHEN_STAFF`, etc.).
      - `StaffPin`s para acceso rápido del personal.
      - `Table`s (CRUD, asignación de QR único, zonas, capacidad).
    - **Pasos:** Rutas (`/api/camarero/admin/staff`, `/api/camarero/admin/tables`), controladores y servicios.

13. **LC - Frontend: UI para Gestión de Personal y Mesas por Admin del Negocio** (`frontend`)

    - **Prioridad:** Media
    - **Dificultad Estimada:** Media
    - **Objetivo:** UI en el panel de admin (`/admin/dashboard/camarero/*`) para que el `BUSINESS_ADMIN` pueda realizar CRUD de su personal y de las mesas del local.
    - **Pasos:** Nuevas secciones/páginas en el panel de admin. Formularios para creación/edición. Tablas para listar. Generación e impresión de QRs de mesa.

14. **LC - Fundamentos Técnicos Esenciales (Pre-Lanzamiento LC)** (`backend`, `frontend`, `infra`)
    - **Prioridad:** **CRÍTICA** (Paralelo al desarrollo de funcionalidades)
    - **Tareas Mínimas:**
      - **Testing Backend:** Unitario e Integración para los nuevos endpoints (Carta Cliente, Pedidos, KDS, Camarero). _(Pendiente para endpoints de Pedido y Carta Cliente)_
      - **Validación Robusta Backend:** Aplicar Zod (o similar) a todas las entradas de las nuevas APIs de LC. _(En progreso para Pedidos)_
      - **Seguridad LC:** Revisar autenticación y autorización para todas las nuevas interfaces y APIs de LC. _(Pendiente revisión formal)_
      - **Logging y Monitoring Básico LC:** Asegurar que los flujos críticos (pedidos, cambios de estado) generan logs útiles. _(Revisar logs de creación de pedidos)_
      - **Decisión y Prototipo Gateway Local (si se opta por modelo híbrido para impresión/hardware):** Investigar y prototipar si es necesario para funcionalidades como impresión de tickets en local.

---

## C. FUNCIONALIDADES LOYALPYME CORE (LCo) Y MEJORAS PLATAFORMA - POST-LC MVP 📝

_(Funcionalidades valiosas que estaban en el plan V1.0 original de LCo o como mejoras generales. Su prioridad se re-evaluará después del MVP de LC)._

15. **Plataforma - Personalización Negocio - Logo (Upload)** (`backend`, `frontend`)

    - **Objetivo:** Permitir al `BUSINESS_ADMIN` subir el logo de su negocio, que se mostrará en el header de su panel y en el dashboard del cliente final.
    - **Pasos:** Endpoint backend para subida (Cloudinary), UI en panel admin.

16. **Plataforma - Personalización Negocio - Theming Básico** (`backend`, `frontend`)

    - **Objetivo:** Permitir al `BUSINESS_ADMIN` elegir un color primario y secundario para su marca, que se apliquen sutilmente en el dashboard del cliente y, opcionalmente, en el header del admin.
    - **Pasos:** Campos en modelo `Business`, UI en panel admin, carga dinámica de estilos/variables CSS en frontend.

17. **[YA IMPLEMENTADO]** LCo - Historial de Actividad Cliente (`backend`, `frontend`)

    - **Detalles:** Ya existe `/api/customer/activity` y una pestaña en el dashboard de cliente.

18. **LCo - Feature: "Mi Perfil" Cliente (con Foto)** (`backend`, `frontend`)

    - **Objetivo:** Página donde el cliente pueda ver/editar sus datos (nombre, teléfono, DNI/NIE, email, contraseña) y subir una foto de perfil.
    - **Pasos:** Endpoints backend para actualizar perfil y subir foto, UI en dashboard cliente.

19. **LCo - Feature: "Ofertas y Noticias" (Comunicación Básica)** (`backend`, `frontend`)

    - **Objetivo:** Sección en el dashboard de cliente donde el negocio pueda publicar ofertas, noticias o anuncios simples.
    - **Pasos:** Modelo `Announcement` (o similar) en BD, CRUD para admin, UI para cliente.

20. **LCo - Fidelización Avanzada (Más Tipos de Beneficios para Tiers)** (`backend`, `frontend`)
    - **Objetivo:** Expandir `BenefitType` enum y la lógica asociada para incluir beneficios como "Descuento % en próxima compra", "Producto Gratis X", "Acceso Anticipado a Ofertas", etc.
    - **Pasos:** Modificar enum, actualizar UI de gestión de tiers, actualizar lógica de aplicación de beneficios.

---

## D. DEUDA TÉCNICA Y MEJORAS CONTINUAS (Transversales) 🛠️

21. Usar Variables Entorno para Credenciales Tests (`backend`)
22. Completar Pruebas Backend (LCo y LC) (`backend`) _(Énfasis en LC ahora)_
23. Iniciar/Completar Pruebas Frontend (LCo y LC) (`frontend`) _(Énfasis en LC ahora)_
24. **[EN PROGRESO - LC]** Validación Robusta Backend con Zod (Todos los módulos) (`backend`)
25. Estrategia Deployment & CI/CD (Avanzada) (`infra`)
26. Logging/Monitoring Avanzado (Producción) (`backend`, `frontend`)
27. Optimización Base de Datos (`backend`)
28. Tipado Centralizado (`common` package) (`infra`, `backend`, `frontend`)
29. **LC - Integración Opcional y Completa con Fidelización (LoyalPyME Core)** (`backend`, `frontend`)
    - **Prioridad:** Alta (Después de que LC MVP esté funcional)
    - **Dificultad:** Media-Alta
    - **Objetivo:** Sincronización de puntos por pedidos en LC, canje de recompensas LCo desde LC.
30. **Añadir Captura desde Cámara en `RewardForm.tsx`** (`frontend`, LCo)
    - **Objetivo:** Además de seleccionar archivo, permitir al admin tomar una foto directamente para la imagen de la recompensa.
    - **Pasos:** Integrar `MediaDevices.getUserMedia()` o una librería para acceso a cámara en el formulario.
31. **Refinar Espaciado/Diseño `RewardList.tsx`** (`frontend`, LCo)
    - **Objetivo:** Mejorar la apariencia visual y el espaciado de las tarjetas de recompensa en el dashboard del cliente.
    - **Pasos:** Ajustes CSS/Mantine.
32. **Refinar UI y UX de Gestión de Menú y Modificadores (LC Admin):**
    - **Prioridad:** Media (Post-MVP LC funcional)
    - **Dificultad:** Media
    - **Objetivo:** Mejorar la usabilidad, añadir drag-and-drop para reordenar categorías/ítems/grupos/opciones. Mejorar la visualización de la jerarquía de modificadores. Añadir vista previa de cómo verá el cliente el ítem con sus modificadores.
33. **[NUEVO - PENDIENTE]** **Frontend (LC - Visualización Carta):** Implementar búsqueda de ítems y filtros básicos (ej. alérgenos, tags) en la vista pública de la carta. _(Parte final de la Tarea #8 original)_.
34. **[NUEVO - PENDIENTE]** **Traducciones (i18n):** Completar todas las claves de traducción faltantes en el frontend, especialmente para la nueva vista de menú público y el flujo de pedido.

---

## E. VISIÓN FUTURA / MÓDULOS ADICIONALES (Post-LC MVP y Mejoras LCo) 🚀

33. **LC - Funcionalidades Avanzadas:** Pago Online, División Cuentas, Reservas, Inventario, Informes Avanzados.
34. Módulo Pedidos Online / Take Away / Delivery (Extensión de LC).
35. App Móvil Dedicada (PWA/Nativa) para Cliente LCo y/o Personal de LC.
36. E2E Tests Automatizados.
37. Monetización Avanzada y Planes de Suscripción Detallados.
38. Personalización y CRM Avanzado (Transversal).
39. Gamificación Avanzada (LCo).

---
