# LoyalPyME - Plan de Desarrollo y Futuras Funcionalidades

**Última Actualización:** [PON LA FECHA ACTUAL AQUÍ, ej: 11 de Mayo de 2025]

Este documento detalla las tareas pendientes inmediatas, el alcance definido para las próximas versiones operativas, la deuda técnica y las ideas para la evolución futura, con un enfoque actual en el Módulo Camarero.

---

## A. TRABAJO RECIENTEMENTE COMPLETADO / CORRECCIONES (Plataforma Base, LCo, LC Admin Menu) ✅

1.  ⭐ **[COMPLETADO - MVP Base]** Panel Super Admin y Gestión Negocios/Módulos (`backend`, `frontend`)

    - ... (contenido sin cambios) ...

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

    - ... (contenido sin cambios) ...

5.  **[COMPLETADO]** Fix Mobile Popover Click en Barra de Progreso (`frontend`)

    - ... (contenido sin cambios) ...

6.  **[COMPLETADO]** Fix Backend Build Error (`uploads.service.ts`) (`backend`)

    - ... (contenido sin cambios) ...

7.  **[COMPLETADO]** Feature: Botones Canje en Resumen Cliente (`frontend`)
    - ... (contenido sin cambios) ...

---

## B. PRIORIDAD ACTUAL: Módulo "LoyalPyME Camarero" (LC) - Desarrollo del MVP (Continuación Funcionalidades Cliente y Operativas) 🧑‍🍳📱

_(Funcionalidades y requisitos técnicos mínimos para un primer lanzamiento operativo del módulo Camarero)._

8.  ⭐ **LC - Backend & Frontend: Visualización de Carta Digital por el Cliente Final** (`backend`, `frontend`)

    - **Prioridad:** **CRÍTICA**
    - **Dificultad Estimada:** Media-Alta
    - **Objetivo:** Un cliente (sin necesidad de login en la app LoyalPyME principal) escanea un código QR asociado a una mesa (o un QR general del negocio) y puede visualizar la carta digital completa y actualizada del negocio.
    - **Sub-Tareas Backend:**
      - Crear un nuevo endpoint público (ej: `/public/menu/:businessSlug` o `/public/menu/:businessSlug/:tableIdentifier`).
      - El endpoint debe devolver la estructura completa de la carta: categorías (activas, ordenadas), y dentro de cada categoría, sus ítems (activos, ordenados), y para cada ítem, sus grupos de modificadores (activos, ordenados) con sus opciones (activas, ordenadas).
      - Solo se deben incluir elementos marcados como `isActive` y `isAvailable`.
      - Considerar la internacionalización: ¿El endpoint devuelve todos los idiomas o se pasa un `lang` query param?
      - Optimizar la consulta para eficiencia.
    - **Sub-Tareas Frontend:**
      - Crear una nueva página/ruta pública (ej: `/m/:businessSlug` o `/m/:businessSlug/:tableIdentifier`) que no requiera login.
      - Esta página consumirá la API pública del backend.
      - Diseño responsive, atractivo y fácil de navegar (acordeones para categorías, tarjetas para ítems).
      - Mostrar nombre, descripción (i18n), precio, imagen de ítems.
      - Permitir al cliente ver los modificadores disponibles para cada ítem (pero sin funcionalidad de selección/pedido aún en esta tarea).
      - Búsqueda básica de ítems por nombre.
      - Filtros básicos (ej: por alérgenos, tags como "vegetariano").
    - **Consideraciones:** Performance (especialmente carga de imágenes). SEO básico si es una URL pública directa.

9.  ⭐ **LC - Backend & Frontend: Flujo de Pedido Básico por el Cliente Final** (`backend`, `frontend`)

    - **Prioridad:** Alta
    - **Dificultad Estimada:** Muy Alta
    - **Objetivo:** Desde la carta digital visualizada, el cliente puede seleccionar ítems, personalizarlos con modificadores, añadir notas, ver un resumen de su pedido (carrito) y enviarlo. El pedido se asocia a una mesa (si se usa QR de mesa) o es un pedido general para el local.
    - **Sub-Tareas Backend:**
      - API para recibir el objeto `Order` con sus `OrderItem`s (que incluyen `OrderItemModifierOption`s seleccionadas).
      - Validación exhaustiva de la orden (precios, disponibilidad, coherencia de modificadores, etc.).
      - Creación de los registros `Order`, `OrderItem`, `OrderItemModifierOption` en la BD.
      - Lógica para determinar el destino del pedido (ej. KDS).
    - **Sub-Tareas Frontend (extensión de la vista de carta):**
      - UI para seleccionar cantidad de ítems.
      - UI para seleccionar modificadores (según `uiType`, `minSelections`, `maxSelections` del `ModifierGroup`).
      - UI para añadir notas a un ítem o al pedido general.
      - Componente "Carrito de Pedido" visible y actualizable.
      - Pantalla de confirmación del pedido.
      - Feedback al usuario sobre el estado del envío del pedido.
    - **Consideraciones:** Manejo de estado del carrito. Sincronización de precios.

10. ⭐ **LC - Backend & Frontend: KDS (Kitchen Display System) Básico** (`backend`, `frontend`)

    - **Prioridad:** Alta
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

    - **Prioridad:** Media-Alta
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
      - **Testing Backend:** Unitario e Integración para los nuevos endpoints (Carta Cliente, Pedidos, KDS, Camarero).
      - **Validación Robusta Backend:** Aplicar Zod (o similar) a todas las entradas de las nuevas APIs de LC.
      - **Seguridad LC:** Revisar autenticación y autorización para todas las nuevas interfaces y APIs de LC.
      - **Logging y Monitoring Básico LC:** Asegurar que los flujos críticos (pedidos, cambios de estado) generan logs útiles.
      - **Decisión y Prototipo Gateway Local (si se opta por modelo híbrido para impresión/hardware):** Investigar y prototipar si es necesario para funcionalidades como impresión de tickets en local.

---

## C. FUNCIONALIDADES LOYALPYME CORE (LCo) Y MEJORAS PLATAFORMA - POST-LC MVP 📝

_(Funcionalidades valiosas que estaban en el plan V1.0 original de LCo o como mejoras generales. Su prioridad se re-evaluará después del MVP de LC)._

15. **Plataforma - Personalización Negocio - Logo (Upload)** (`backend`, `frontend`)
    - ... (contenido sin cambios) ...
16. **Plataforma - Personalización Negocio - Theming Básico** (`backend`, `frontend`)
    - ... (contenido sin cambios) ...
17. **[YA IMPLEMENTADO]** LCo - Historial de Actividad Cliente (`backend`, `frontend`)
    - ... (contenido sin cambios) ...
18. **LCo - Feature: "Mi Perfil" Cliente (con Foto)** (`backend`, `frontend`)
    - ... (contenido sin cambios) ...
19. **LCo - Feature: "Ofertas y Noticias" (Comunicación Básica)** (`backend`, `frontend`)
    - ... (contenido sin cambios) ...
20. **LCo - Fidelización Avanzada (Más Tipos de Beneficios para Tiers)** (`backend`, `frontend`)
    - ... (contenido sin cambios) ...

---

## D. DEUDA TÉCNICA Y MEJORAS CONTINUAS (Transversales) 🛠️

21. Usar Variables Entorno para Credenciales Tests (`backend`)
22. Completar Pruebas Backend (LCo y LC) (`backend`)
23. Iniciar/Completar Pruebas Frontend (LCo y LC) (`frontend`)
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
    - ... (contenido sin cambios) ...
31. **Refinar Espaciado/Diseño `RewardList.tsx`** (`frontend`, LCo)
    - ... (contenido sin cambios) ...
32. **Refinar UI y UX de Gestión de Menú y Modificadores (LC Admin):**
    - **Prioridad:** Media (Post-MVP LC funcional)
    - **Dificultad:** Media
    - **Objetivo:** Mejorar la usabilidad, añadir drag-and-drop para reordenar categorías/ítems/grupos/opciones. Mejorar la visualización de la jerarquía de modificadores. Añadir vista previa de cómo verá el cliente el ítem con sus modificadores.

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
