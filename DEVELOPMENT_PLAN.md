# LoyalPyME - Plan de Desarrollo y Futuras Funcionalidades

**Última Actualización:** 10 de Mayo de 2025

Este documento detalla las tareas pendientes inmediatas, el alcance definido para las próximas versiones operativas, la deuda técnica y las ideas para la evolución futura, con un enfoque actual en el Módulo Camarero.

---

## A. TRABAJO RECIENTEMENTE COMPLETADO / CORRECCIONES (Plataforma Base y LCo) ✅

1.  ⭐ **[COMPLETADO - MVP Base]** Panel Super Admin y Gestión Negocios/Módulos (`backend`, `frontend`)

    - **Prioridad (Original):** CRÍTICA
    - **Dificultad:** Alta (Base completada)
    - **Objetivo Alcanzado (MVP):** Interfaz/lógica Super Admin para listar negocios, activar/desactivar negocios, y activar/desactivar módulos LoyalPyME Core (LCo) y LoyalPyME Camarero (LC) por negocio.
    - **Detalles de Implementación:**
      - **BE:** Rol `SUPER_ADMIN` definido y script de creación. Modelo `Business` con flags `isActive`, `isLoyaltyCoreActive`, `isCamareroActive`. API Super Admin (`/api/superadmin/*`) implementada para listar negocios y cambiar estos tres estados. Middleware `checkModuleActive` creado y aplicado a rutas LCo. `auth.middleware` modificado para cargar flags de módulos en `req.user`. Script de seed para negocio demo con módulos pre-activados.
      - **FE:** Página `/superadmin` protegida y funcional. UI con tabla de negocios y switches para gestionar estado general del negocio y activación de módulos LCo/LC. Internacionalización básica de la página. `useLayoutUserData`, `AdminNavbar`, `AdminOverview` adaptados para reaccionar a los flags de módulos.
    - **Pendiente para Completar Funcionalidad #5 (Post-MVP Camarero o según necesidad):**
      - BE: CRUD completo de Negocios desde Super Admin (crear, editar detalles, eliminar).
      - BE: Considerar lógica más granular si se opta por tabla `BusinessModule` en lugar de flags para muchos módulos.
      - FE: UI para CRUD completo de Negocios.
      - FE: UI para gestión granular de módulos si se cambia la estructura BE.

2.  **[COMPLETADO]** ~~Módulo Camarero (LC) - Fundamentos Backend (Modelos BD y API Gestión Carta Base)~~

    - ~~**Detalles:**~~
      - ~~**BD:** Modelos Prisma implementados y migrados para `Table`, `MenuCategory`, `MenuItem`, `ModifierGroup`, `ModifierOption`, `Order`, `OrderItem`, `OrderItemModifierOption`, y `StaffPin`. Roles de personal (`WAITER`, etc.) añadidos a `UserRole` enum. Relaciones actualizadas.~~
      - ~~**API Gestión Carta:** Endpoints CRUD backend (`/api/camarero/admin/*`) para `MenuCategory`, `MenuItem`, `ModifierGroup`, y `ModifierOption`, protegidos por rol y activación del módulo LC.~~

3.  **[COMPLETADO]** ~~Arreglar Tipo `TierData` (`frontend`)~~

    - ~~**Prioridad:** Alta~~
    - ~~**Dificultad:** Baja~~
    - ~~**Objetivo:** Eliminar casts `as any` al acceder a `tier.benefits` en `CustomerDashboardPage.tsx`.~~
    - ~~**Pasos:** Añadir `benefits?: TierBenefitData[];` a `interface TierData` (`types/customer.ts`). Eliminar casts usando `?.` o checks.~~

4.  **[COMPLETADO]** ~~Fix Mobile Popover Click en Barra de Progreso (`frontend`)~~

    - ~~**Prioridad:** Media (Bug UX)~~
    - ~~**Dificultad:** Media (Requiere depuración)~~
    - ~~**Objetivo:** Permitir ver beneficios del siguiente nivel con tap en móvil en `UserInfoDisplay`.~~
    - ~~**Pasos:** Se implementó icono (`IconHelp`) clickeable solo en móvil como disparador del Popover.~~

5.  **[COMPLETADO]** ~~Fix Backend Build Error (`uploads.service.ts`) (`backend`)~~

    - ~~**Prioridad:** CRÍTICA (Impedía compilación backend)~~
    - ~~**Dificultad:** Baja-Media~~
    - ~~**Objetivo:** Solucionar error `TS2307: Cannot find module './uploads.service'` que reportaba `tsc` al compilar `uploads.controller.ts`.~~
    - ~~**Pasos:** Se corrigieron nombres de archivo (`uploads.controller.ts`) e importaciones internas. Se verificó la existencia/exportación en `uploads.service.ts`. Se requirió limpieza de `dist/` y `npx prisma generate` para asegurar que `tsc` veía los tipos/módulos correctos.~~

6.  **[COMPLETADO]** ~~Feature: Botones Canje en Resumen Cliente (`frontend`)~~
    - ~~**Prioridad:** Media (Mejora UX solicitada)~~
    - ~~**Dificultad:** Baja-Media~~
    - ~~**Objetivo:** Añadir botones "Canjear" a las previsualizaciones de recompensas/regalos en `SummaryTab.tsx`.~~
    - ~~**Pasos:** Pasar props (`onRedeem...`, `redeemingRewardId`, `userPoints`) desde `CustomerDashboardPage` a `SummaryTab`. Añadir lógica de botones condicionales en `SummaryTab`. Simplificar texto botones. Añadir claves i18n.~~

---

## B. PRIORIDAD ACTUAL: Módulo "LoyalPyME Camarero" (LC) - Desarrollo del MVP (Continuación Frontend y Lógica de Negocio) 🧑‍🍳📱

_(Funcionalidades y requisitos técnicos mínimos para un primer lanzamiento operativo del módulo Camarero)._

7.  ⭐ **LC - Frontend: UI para Gestión de Carta Digital por el Admin del Negocio** (`frontend`)

    - **Prioridad:** **CRÍTICA**
    - **Dificultad Estimada:** Alta
    - **Objetivo:** Interfaz de usuario completa en el panel de `BUSINESS_ADMIN` (`/admin/dashboard/camarero/menu-editor`) para gestionar la carta digital.
    - **Sub-Tareas:**
      - Componente `MenuCategoryManager.tsx`: UI para listar, crear, editar (en modal), eliminar y reordenar (`position`) categorías.
      - Componente `MenuItemManager.tsx` (o similar): UI para listar ítems dentro de una categoría. UI para crear/editar ítems (formulario con todos los campos: i18n, precio, imagen, alérgenos, tags, disponibilidad, etc.). Incluir subida/recorte de imagen.
      - Gestión de Modificadores: Integrar en el formulario de `MenuItem` la UI para CRUD de `ModifierGroup`s y sus `ModifierOption`s.
    - **Consideraciones:** Usabilidad. Integración con APIs backend.

8.  ⭐ **LC - Backend & Frontend: Visualización de Carta Digital por el Cliente Final** (`backend`, `frontend`)

    - **Prioridad:** Alta
    - **Dificultad Estimada:** Media-Alta
    - **Objetivo:** Cliente escanea QR de mesa (`Table.qrCodeValue`) y visualiza la carta digital.
    - **Pasos BE:** API pública (ej: `/public/camarero/menu/:businessSlug/:tableQrValue`) para obtener la carta (solo ítems/categorías activas/disponibles).
    - **Pasos FE:** Página/vista dedicada (ej: `/m/:businessSlug/:tableQrValue`) para mostrar la carta (responsive, atractiva, navegable, búsqueda/filtros básicos).

9.  ⭐ **LC - Backend & Frontend: Flujo de Pedido Básico por el Cliente Final** (`backend`, `frontend`)

    - **Prioridad:** Alta
    - **Dificultad Estimada:** Muy Alta
    - **Objetivo:** Cliente selecciona ítems, personaliza, añade notas, envía pedido (asociado a `Table`).
    - **Pasos BE:** API para recibir `Order` y `OrderItem`s. Validación. Creación en BD.
    - **Pasos FE (Carta Cliente):** UI carrito, selección modificadores, envío, feedback.

10. ⭐ **LC - Backend & Frontend: KDS (Kitchen Display System) Básico** (`backend`, `frontend`)

    - **Prioridad:** Alta
    - **Dificultad Estimada:** Alta
    - **Objetivo:** Pantallas para cocina/barra ven nuevas comandas y gestionan su estado.
    - **Pasos BE:** API para KDS (obtener `OrderItem`s por `kdsDestination`, actualizar estado). Considerar WebSockets.
    - **Pasos FE:** Interfaz KDS clara.

11. ⭐ **LC - Backend & Frontend: Interfaz Camarero Básica (MVP)** (`backend`, `frontend`)

    - **Prioridad:** Media-Alta
    - **Dificultad Estimada:** Alta
    - **Objetivo:** Camarero ve notificaciones "Pedido Listo", marca ítems/pedidos como "Servidos" (con PIN).
    - **Pasos BE:** API para login camarero (PIN), notificaciones, marcar como servido.
    - **Pasos FE:** Interfaz camarero optimizada para tablet/móvil.

12. **LC - Backend: Gestión de Personal y Mesas por Admin del Negocio** (`backend`)

    - **Prioridad:** Media
    - **Dificultad Estimada:** Media
    - **Objetivo:** APIs para que `BUSINESS_ADMIN` gestione `User`s (roles WAITER, etc.), `StaffPin`s, y `Table`s (CRUD, QR).
    - **Pasos:** Rutas, controladores y servicios.

13. **LC - Frontend: UI para Gestión de Personal y Mesas por Admin del Negocio** (`frontend`)

    - **Prioridad:** Media
    - **Dificultad Estimada:** Media
    - **Objetivo:** UI en panel admin para gestionar personal LC y mesas.
    - **Pasos:** Nuevas secciones en `/admin/dashboard/camarero/`.

14. **LC - Fundamentos Técnicos Esenciales (Pre-Lanzamiento LC)** (`backend`, `frontend`, `infra`)
    - **Prioridad:** **CRÍTICA**
    - **Tareas Mínimas:** Testing BE (CRUD Menú, Pedido, KDS). Validación Backend LC. Decisión y prototipo Gateway Local (si modelo híbrido). Logging y Seguridad LC.

---

## C. FUNCIONALIDADES LOYALPYME CORE (LCo) Y MEJORAS PLATAFORMA - POST-LC MVP 📝

_(Funcionalidades valiosas que estaban en el plan V1.0 original de LCo o como mejoras generales. Su prioridad se re-evaluará después del MVP de LC)._

15. **Plataforma - Personalización Negocio - Logo (Upload)** (`backend`, `frontend`)

    - **Prioridad (Original LCo V1.0):** Alta
    - **Dificultad:** Media-Alta
    - **Objetivo:** Permitir al admin del negocio subir su propio logo.
    - **Pasos BE:** `Business.logoUrl`. API Upload (reutilizar `/api/uploads/image`). Servicio update `Business`. Devolver `logoUrl` en `/api/profile` del negocio.
    - **Pasos FE:** UI Admin (Settings Page?) con `<FileInput>`. Hook `useLayoutUserData` (o similar) obtiene `logoUrl`. `AppHeader` muestra logo dinámico.

16. **Plataforma - Personalización Negocio - Theming Básico** (`backend`, `frontend`)

    - **Prioridad (Original LCo V1.0):** Alta
    - **Dificultad:** Media
    - **Objetivo:** Adaptar colores primarios/secundarios básicos.
    - **Pasos BE:** `Business.brandingColorPrimary/Secondary`. UI Admin para seleccionar. Devolver en `/api/profile` del negocio.
    - **Pasos FE:** Aplicación dinámica de tema/clases CSS.

17. **[YA IMPLEMENTADO]** ~~LCo - Historial de Actividad Cliente (`backend`, `frontend`)~~

    - ~~**Prioridad (Original LCo V1.0):** Alta~~
    - ~~**Dificultad:** Alta~~
    - ~~**Objetivo:** Log de puntos, canjes, regalos para el cliente.~~
    - ~~**Pasos BE:** Creado `model ActivityLog`. Servicios modificados para registrar. API `GET /api/customer/activity` (paginada) creada.~~
    - ~~**Pasos FE:** Implementado `ActivityTab.tsx`. Creado Hook `useCustomerActivity`. UI Lista/Timeline con paginación. Descripciones internacionalizadas.~~

18. **LCo - Feature: "Mi Perfil" Cliente (con Foto)** (`backend`, `frontend`) - _Solicitado para LCo V1.0_

    - **Prioridad:** Baja-Media (Post-LC MVP)
    - **Dificultad:** Media
    - **Objetivo:** Implementar pestaña "Mi Perfil" en LCo y permitir subida/visualización de avatar.
    - **Pasos BE:** Añadir `avatarUrl` a `User`. Crear API Upload avatar. Modificar `GET /profile`.
    - **Pasos FE:** Implementar `ProfileTab.tsx`. Modificar `UserInfoDisplay`/`AppHeader` para mostrar `<Avatar>`.

19. **LCo - Feature: "Ofertas y Noticias" (Comunicación Básica)** (`backend`, `frontend`) - _Solicitado para LCo V1.0_

    - **Prioridad:** Baja-Media (Post-LC MVP)
    - **Dificultad:** Alta
    - **Objetivo:** Admin LCo publica noticias/ofertas generales. Cliente LCo las ve.
    - **Pasos BE:** `model Announcement`. API CRUD Admin. API lectura cliente. _(Opcional: Lógica Mailing)_.
    - **Pasos FE:** UI Admin. Implementar `OffersTab.tsx`. Mostrar resumen en `SummaryTab.tsx`.

20. **LCo - Fidelización Avanzada (Más Tipos de Beneficios para Tiers)** (`backend`, `frontend`)
    - **Prioridad:** Media (Post-LC MVP, si se decide potenciar LCo)
    - **Dificultad:** Alta
    - **Objetivo:** Más variedad en beneficios de Tiers LCo (ej: % Descuento, Bonus Cumpleaños).
    - **Pasos BE:** Expandir Enum `BenefitType`. Validar `value`. Implementar lógica aplicación.
    - **Pasos FE:** Actualizar Form/Select Admin. Actualizar display cliente.

---

## D. DEUDA TÉCNICA Y MEJORAS CONTINUAS (Transversales) 🛠️

21. Usar Variables Entorno para Credenciales Tests (`backend`)
22. Completar Pruebas Backend (LCo y LC) (`backend`)
23. Iniciar/Completar Pruebas Frontend (LCo y LC) (`frontend`)
24. Validación Robusta Backend con Zod (Todos los módulos) (`backend`)
25. Estrategia Deployment & CI/CD (Avanzada) (`infra`)
26. Logging/Monitoring Avanzado (Producción) (`backend`, `frontend`)
27. Optimización Base de Datos (`backend`)
28. Tipado Centralizado (`common` package) (`infra`, `backend`, `frontend`)
29. **LC - Integración Opcional y Completa con Fidelización (LoyalPyME Core)** (`backend`, `frontend`)
    - **Prioridad:** Alta (Después de que LC MVP esté funcional)
    - **Dificultad:** Media-Alta
    - **Objetivo:** Sincronización de puntos por pedidos en LC, canje de recompensas LCo desde LC.
30. **Añadir Captura desde Cámara en `RewardForm.tsx`** (`frontend`, LCo)
    - **Prioridad:** Media-Baja (Mejora UX LCo)
    - **Dificultad:** Media
31. **Refinar Espaciado/Diseño `RewardList.tsx`** (`frontend`, LCo)
    - **Prioridad:** Media (Mejora UX LCo)
    - **Dificultad:** Baja-Media

---

## E. VISIÓN FUTURA / MÓDULOS ADICIONALES (Post-LC MVP y Mejoras LCo) 🚀

32. **LC - Funcionalidades Avanzadas:** Pago Online, División Cuentas, Reservas, Inventario, Informes Avanzados.
33. Módulo Pedidos Online / Take Away / Delivery (Extensión de LC).
34. App Móvil Dedicada (PWA/Nativa) para Cliente LCo y/o Personal de LC.
35. E2E Tests Automatizados.
36. Monetización Avanzada y Planes de Suscripción Detallados.
37. Personalización y CRM Avanzado (Transversal).
38. Gamificación Avanzada (LCo).

---
