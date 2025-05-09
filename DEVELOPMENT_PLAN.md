# LoyalPyME - Plan de Desarrollo y Futuras Funcionalidades

**Última Actualización:** 09 de Mayo de 2025

Este documento detalla las tareas pendientes inmediatas, el alcance definido para las próximas versiones operativas (con foco en la plataforma base, Módulo Camarero MVP, y luego mejoras LCo), la deuda técnica y las ideas para la evolución futura.

---

## A. TRABAJO RECIENTEMENTE COMPLETADO / CORRECCIONES ✅

1.  **[COMPLETADO]** ~~Panel Super Admin y Gestión de Módulos (MVP Base)~~

    - ~~**Prioridad (Original):** CRÍTICA~~
    - ~~**Dificultad:** Alta~~
    - ~~**Objetivo Alcanzado (MVP):** Interfaz/lógica Super Admin para listar negocios, activar/desactivar negocios, y activar/desactivar módulos LoyalPyME Core (LCo) y LoyalPyME Camarero (LC) por negocio. Middleware `checkModuleActive` implementado y aplicado a rutas LCo. `auth.middleware` y `useLayoutUserData` actualizados para manejar y exponer flags de módulos. Navbar y Overview del Admin de Negocio reaccionan a estos flags.~~
    - ~~**Detalles Implementación:**~~
      - ~~**BE:** Rol `SUPER_ADMIN`, API Super Admin (`/api/superadmin/*`) para gestión de estado de `Business` y flags `isLoyaltyCoreActive`, `isCamareroActive`. Scripts de seed y creación de Super Admin.~~
      - ~~**FE:** Página `/superadmin` con tabla de negocios y controles (switches).~~

2.  **[COMPLETADO]** ~~Arreglar Tipo `TierData` (`frontend`)~~

    - ~~**Detalles:** Eliminación de casts `as any` al acceder a `tier.benefits` en `CustomerDashboardPage.tsx` añadiendo `benefits?: TierBenefitData[];` a `interface TierData` (`types/customer.ts`).~~

3.  **[COMPLETADO]** ~~Fix Mobile Popover Click en Barra de Progreso (`frontend`)~~

    - ~~**Detalles:** Implementación de icono (`IconHelp`) clickeable solo en móvil como disparador del Popover en `UserInfoDisplay` para ver beneficios del siguiente nivel.~~

4.  **[COMPLETADO]** ~~Fix Backend Build Error (`uploads.service.ts`) (`backend`)~~

    - ~~**Detalles:** Corrección de nombres de archivo e importaciones. Limpieza de `dist/` y `npx prisma generate`.~~

5.  **[COMPLETADO]** ~~Feature: Botones Canje en Resumen Cliente (`frontend`)~~
    - ~~**Detalles:** Añadidos botones "Canjear" a las previsualizaciones de recompensas/regalos en `SummaryTab.tsx`, pasando props necesarias y añadiendo lógica condicional.~~

---

## B. PRIORIDAD ACTUAL: Módulo "LoyalPyME Camarero" (LC) - Desarrollo del MVP 🧑‍🍳📱

_(Funcionalidades y requisitos técnicos mínimos para un primer lanzamiento operativo del módulo Camarero, aprovechando la base de Super Admin ya implementada para su activación por negocio)._

6.  ⭐ **LC - Diseño y Estructura Base de Datos** (`backend`)

    - **Prioridad:** **CRÍTICA (BLOQUEADOR PARA LC)**
    - **Dificultad Estimada:** Media-Alta
    - **Objetivo:** Definir, implementar y migrar los modelos Prisma necesarios para el módulo Camarero.
    - **Modelos Clave a Considerar:** `Table` (Mesas, QR de mesa, estado), `MenuCategory`, `MenuItem` (con precio, imagen, descripción, alérgenos, estado disponible, destino KDS), `ModifierGroup`, `ModifierOption` (con ajuste de precio), `Order` (con estado, mesa, cliente opcional, camarero opcional, total), `OrderItem` (con cantidad, precio unitario, notas, estado KDS, modificadores seleccionados), `StaffPin` (para camareros/cocina).
    - **Pasos:**
      1.  Refinar y finalizar las definiciones de estos modelos en `schema.prisma`.
      2.  Establecer relaciones (ej: `Order` con `Table` y `OrderItem`, `OrderItem` con `MenuItem` y `ModifierOption`).
      3.  Considerar campos para auditoría (quién sirvió, quién preparó).
      4.  Ejecutar `npx prisma migrate dev --name add_camarero_module_tables`.
      5.  Ejecutar `npx prisma generate`.

7.  ⭐ **LC - Backend: API para Gestión de Carta Digital por el Admin del Negocio** (`backend`)

    - **Prioridad:** **CRÍTICA**
    - **Dificultad Estimada:** Alta
    - **Objetivo:** Endpoints API REST para que el `BUSINESS_ADMIN` pueda realizar CRUD completo sobre `MenuCategory`, `MenuItem` (incluyendo subida de imagen para ítems), `ModifierGroup`, y `ModifierOption`.
    - **Pasos:**
      1.  Crear nuevas rutas (ej: `/api/camarero/admin/menu/categories`, `/api/camarero/admin/menu/items`, etc.).
      2.  Proteger estas rutas con `authenticateToken`, `checkRole(['BUSINESS_ADMIN'])`, y **`checkModuleActive('CAMARERO')`**.
      3.  Implementar controladores y servicios para cada entidad CRUD.
      4.  Para `MenuItem`, integrar con el servicio de subida de imágenes existente (Cloudinary) para las fotos de los platos.
      5.  Incluir lógica para marcar ítems como "agotado" (`isAvailable`).
      6.  Validaciones robustas de entrada para todos los endpoints.

8.  ⭐ **LC - Frontend: UI para Gestión de Carta Digital por el Admin del Negocio** (`frontend`)

    - **Prioridad:** **CRÍTICA**
    - **Dificultad Estimada:** Alta
    - **Objetivo:** Interfaz de usuario en el panel de `BUSINESS_ADMIN` (ej: nueva sección `/admin/dashboard/camarero/menu-editor`) para gestionar la carta digital.
    - **Pasos:**
      1.  Asegurar que el enlace/sección en `AdminNavbar.tsx` y `AdminOverview.tsx` solo aparece si `isCamareroActive` es `true`.
      2.  Diseñar y desarrollar componentes React/Mantine para:
          - Listar, crear, editar, eliminar `MenuCategory`.
          - Listar, crear, editar (con formulario complejo incluyendo subida de imagen y selección de modificadores), eliminar `MenuItem` dentro de una categoría.
          - Gestionar `ModifierGroup` y `ModifierOption` asociados a un `MenuItem`.
      3.  Integrar con las APIs del backend creadas en el punto anterior.

9.  ⭐ **LC - Backend & Frontend: Visualización de Carta Digital por el Cliente Final** (`backend`, `frontend`)

    - **Prioridad:** Alta
    - **Dificultad Estimada:** Media-Alta
    - **Objetivo:** Permitir que los clientes del restaurante escaneen un QR en su mesa y vean la carta digital actualizada en sus móviles.
    - **Pasos BE:**
      1.  API pública o semi-pública (ej: `/public/camarero/menu/:businessSlug` o `/api/camarero/menu/:businessId`) para obtener la estructura completa de la carta (categorías, ítems activos, modificadores) de un negocio. Debe ser eficiente.
      2.  Lógica para generar y asociar QR únicos a cada `Table` del negocio.
    - **Pasos FE:**
      1.  Página/vista dedicada (ej: `/menu/:businessSlug/:tableNumber`) que se carga al escanear el QR.
      2.  UI atractiva, responsive y fácil de navegar para la carta digital:
          - Mostrar categorías, ítems con fotos, descripciones, precios, alérgenos.
          - Permitir búsqueda y filtrado básico.

10. ⭐ **LC - Backend & Frontend: Flujo de Pedido Básico por el Cliente Final** (`backend`, `frontend`)

    - **Prioridad:** Alta
    - **Dificultad Estimada:** Muy Alta
    - **Objetivo:** Permitir a los clientes seleccionar ítems de la carta digital, personalizar con modificadores, añadir notas y enviar el pedido a cocina/barra. (MVP inicial puede ser con sesión de mesa anónima, sin login de cliente LCo).
    - **Pasos BE:**
      1.  API para recibir un nuevo pedido (`Order` con sus `OrderItem`). Debe asociarse a la `Table` (identificada por el QR escaneado).
      2.  Lógica para validar el pedido (ítems disponibles, precios correctos).
      3.  Crear registros `Order` y `OrderItem` en la BD, con estado inicial (ej: `RECEIVED`).
    - **Pasos FE (Carta Digital Cliente):**
      1.  UI para seleccionar cantidad, modificadores, añadir notas a ítems.
      2.  Carrito de compra o resumen del pedido.
      3.  Botón para enviar pedido.
      4.  Feedback al cliente sobre el estado del envío del pedido.

11. ⭐ **LC - Backend & Frontend: KDS (Kitchen/Bar Display System) Básico** (`backend`, `frontend`)

    - **Prioridad:** Alta
    - **Dificultad Estimada:** Alta
    - **Objetivo:** Pantalla(s) para cocina y/o barra donde aparecen las nuevas comandas (o ítems específicos) y el personal puede marcar su estado de preparación.
    - **Pasos BE:**
      1.  API para que las pantallas KDS obtengan los `OrderItem` pendientes/en preparación (filtrados por `kdsDestination` si se implementa).
      2.  API para que el personal de KDS actualice el estado de un `OrderItem` (ej: de `PENDING` a `PREPARING`, de `PREPARING` a `READY`).
      3.  Considerar WebSockets para actualizaciones en tiempo real en las pantallas KDS cuando entra un nuevo pedido o ítem.
    - **Pasos FE:**
      1.  Interfaz de usuario clara para KDS, mostrando comandas/ítems en columnas o tarjetas.
      2.  Visualización de mesa, hora, ítems, modificadores, notas.
      3.  Botones para cambiar el estado del ítem/pedido.

12. ⭐ **LC - Backend & Frontend: Interfaz Camarero Básica (MVP)** (`backend`, `frontend`)

    - **Prioridad:** Media-Alta
    - **Dificultad Estimada:** Alta
    - **Objetivo Inicial:** Que un camarero pueda ver notificaciones de "Pedido Listo" del KDS y marcar ítems/pedidos como "Servidos".
    - **Pasos BE:**
      1.  API para que la interfaz del camarero reciba notificaciones (podría ser polling o WebSockets) cuando un `OrderItem` está `READY`.
      2.  API para que el camarero marque un `OrderItem` (o `Order` completo) como `SERVED`, registrando su `userId` (del camarero, después de login con PIN) y la hora.
    - **Pasos FE:**
      1.  Login para camareros (con PIN gestionado por `BUSINESS_ADMIN`).
      2.  Vista simple de notificaciones/pedidos listos para servir.
      3.  Botón para marcar como "Servido".

13. **LC - Fundamentos Técnicos Esenciales (Pre-Lanzamiento LC)** (`backend`, `frontend`, `infra`)
    - **Prioridad:** **CRÍTICA** (paralelo al desarrollo de LC)
    - **Dificultad Estimada:** Media-Alta
    - **Objetivo:** Asegurar un mínimo de estabilidad, seguridad y operatividad para el módulo Camarero.
    - **Tareas Mínimas:**
      - **Testing Mínimo (BE):** Escribir y pasar tests de integración para flujos críticos de LC: CRUD Ítem Menú, Enviar Pedido Cliente, Ver Pedido en KDS, Actualizar Estado KDS.
      - **Validación Backend Mínima (LC):** Revisar **todos** los nuevos endpoints API de LC y asegurar que las entradas tienen validaciones básicas.
      - **(Si se opta por Modelo Híbrido) Diseño y Prototipo de Gateway Local:** Si la operativa offline es crítica, empezar a diseñar la arquitectura y un prototipo del gateway local que se instalaría en el restaurante. Esta es una tarea significativa.
      - **Logging y Seguridad:** Extender el logging actual para cubrir las operaciones de LC. Revisar la seguridad de los nuevos endpoints, especialmente los que no requieren autenticación de cliente final (ej: ver carta).

---

## C. FUNCIONALIDADES LOYALPYME CORE (LCo) Y MEJORAS PLATAFORMA - PRIORIDAD SECUNDARIA / POST-LC MVP 📝

_(Funcionalidades valiosas que estaban en el plan V1.0 original de LCo o como mejoras generales, ahora con prioridad ajustada)_

14. **Plataforma - Personalización Negocio - Logo (Upload)** (`backend`, `frontend`)

    - **Prioridad:** Media (Después del MVP de LC, pero podría adelantarse si es simple y reutilizable por LC)
    - **Dificultad Estimada:** Media-Alta
    - **Objetivo:** Permitir al admin del negocio subir su propio logo.
    - **Pasos BE:** `Business.logoUrl`. API Upload (`/upload/business-logo` o usar genérica `/uploads/image` que ya existe). Servicio update `Business`. Devolver `logoUrl` en `/api/profile` del negocio.
    - **Pasos FE:** UI Admin (Settings Page?) con `<FileInput>`. Hook `useLayoutUserData` (o similar para datos del negocio) obtiene `logoUrl`. `AppHeader` y otras áreas muestran logo dinámico o fallback.

15. **Plataforma - Personalización Negocio - Theming Básico** (`backend`, `frontend`)

    - **Prioridad:** Media (Similar al logo)
    - **Dificultad Estimada:** Media
    - **Objetivo:** Permitir al admin del negocio adaptar colores primarios/secundarios básicos.
    - **Pasos BE:** `Business.brandingColorPrimary`, `Business.brandingColorSecondary`. UI Admin para seleccionar. Devolver en `/api/profile` del negocio.
    - **Pasos FE:** Definir temas Mantine o variables CSS. Lógica en `App.tsx` o `MainLayout.tsx` aplica tema/clase dinámicamente.

16. **LCo - Historial de Actividad Cliente (Mejoras)** (`backend`, `frontend`)

    - **Estado:** Ya implementado en LCo (v1.12.0).
    - **Posibles Mejoras Futuras (Baja Prioridad):** Filtros avanzados, exportación.

17. **LCo - Feature: "Mi Perfil" Cliente (con Foto)** (`backend`, `frontend`)

    - **Prioridad:** Baja (Post-LC MVP y si LCo se retoma con fuerza)
    - **Dificultad Estimada:** Media
    - **Objetivo:** Implementar pestaña "Mi Perfil" en el dashboard de cliente LCo y permitir subida/visualización de avatar.
    - **Pasos BE:** Añadir `avatarUrl` a `User`. Crear API Upload avatar. Modificar `GET /profile`.
    - **Pasos FE:** Implementar `ProfileTab.tsx` (UI subida/recorte?). Modificar `UserInfoDisplay`/`AppHeader` para mostrar `<Avatar>`. Actualizar hooks.

18. **LCo - Feature: "Ofertas y Noticias" (Comunicación Básica)** (`backend`, `frontend`)

    - **Prioridad:** Baja (Similar a "Mi Perfil LCo")
    - **Dificultad Estimada:** Alta
    - **Objetivo:** Admin de LCo publica noticias/ofertas generales. Cliente LCo las ve.

    * **Pasos BE:** `model Announcement`. API CRUD Admin. API lectura cliente.
    * **Pasos FE:** UI Admin (crear/listar). Implementar `OffersTab.tsx`. Mostrar resumen en `SummaryTab.tsx`.

19. **LCo - Fidelización Avanzada (Más Tipos de Beneficios para Tiers)** (`backend`, `frontend`)

    - **Prioridad:** Media (Si LCo sigue siendo un foco importante después de LC)
    - **Dificultad Estimada:** Alta
    - **Objetivo:** Más variedad en beneficios de Tiers LCo (ej: % Descuento aplicable en pedidos, Bonus Cumpleaños automático).
    - **Pasos BE:** Expandir Enum `BenefitType`. Validar `value` según tipo. Implementar lógica de aplicación (posiblemente en el flujo de pedido de LC si hay integración, o mediante crons).
    - **Pasos FE:** Actualizar Form/Select Admin para nuevos tipos. Actualizar display de beneficios para el cliente.

20. **Completar Funcionalidad #5 - Panel Super Admin (Más allá del MVP)** (`backend`, `frontend`)
    - **Prioridad:** Media (Según necesidad después de LC MVP)
    - **Objetivo:** CRUD completo de Negocios, gestión de suscripciones más detallada (si aplica), logs de Super Admin.
    - **Pasos:** Ver "Pendiente para Completar Funcionalidad #5" en la Sección A.

---

## D. DEUDA TÉCNICA Y MEJORAS CONTINUAS (Transversales a LCo y LC) 🛠️

_(Tareas importantes para la salud y escalabilidad a largo plazo de TODA la plataforma, a abordar progresivamente)_

21. **Usar Variables Entorno para Credenciales de Tests** (`backend`)
    - **Objetivo:** Eliminar credenciales hardcodeadas de los archivos de test.
22. **Completar Pruebas Backend (LCo y LC)** (`backend`)
    - **Objetivo:** Aumentar cobertura de tests de integración y unitarios para todos los flujos críticos de ambos módulos.
23. **Iniciar/Completar Pruebas Frontend (LCo y LC)** (`frontend`)
    - **Objetivo:** Implementar tests unitarios para componentes complejos y tests de integración/E2E para flujos de usuario clave.
24. **Validación Robusta Backend con Zod** (Todos los módulos) (`backend`)
    - **Objetivo:** Reemplazar validaciones manuales en controladores por esquemas Zod para mayor robustez y claridad.
25. **Estrategia de Despliegue & CI/CD (Avanzada)** (`infra`)
    - **Objetivo:** Automatizar el proceso de build, test y despliegue para backend y frontend. Investigar Dockerización.
26. **Logging/Monitoring Avanzado en Producción** (`backend`, `frontend`)
    - **Objetivo:** Integrar herramientas de logging estructurado (ej: Winston, Pino) y monitorización de errores (ej: Sentry) y rendimiento.
27. **Optimización de Consultas a Base de Datos** (`backend`)
    - **Objetivo:** Revisar consultas Prisma complejas o frecuentes, añadir índices donde sea necesario, optimizar para rendimiento.
28. **Tipado Centralizado (Potencial `common` package)** (`infra`, `backend`, `frontend`)
    - **Objetivo:** Mover tipos y enums compartidos entre backend y frontend a un paquete común para evitar duplicación y asegurar consistencia.
29. **Mejorar UI/UX General:**
    - Refinar espaciado/diseño `RewardList.tsx` (`frontend`, LCo).
    - Añadir captura desde cámara en `RewardForm.tsx` (`frontend`, LCo).
    - Mejorar la accesibilidad (ARIA, contraste).

---

## E. VISIÓN FUTURA / MÓDULOS ADICIONALES (Post-MVP LC y Mejoras LCo) 🚀

_(Ideas a largo plazo, que requerirán su propio análisis y planificación detallada si se decide proceder con ellas)_

30. **LC - Funcionalidades Avanzadas de Servicio:**
    - **Pago Online desde Mesa:** Integración con pasarelas de pago.
    - **División de Cuentas Avanzada:** Múltiples métodos de división directamente por los clientes o el camarero.
    - **Gestión de Reservas:** Integrada con la gestión de mesas.
    - **Gestión de Inventario (Básico):** Para marcar ítems como agotados automáticamente o alertar sobre stock bajo.
    - **Informes y Analíticas Avanzadas para LC:** Más métricas sobre rendimiento de camareros, tiempos, rentabilidad de platos.
31. **LC - Integración Completa y Nativa con LCo:**
    - Permitir canjear recompensas de puntos LCo directamente al hacer un pedido en LC.
    - Aplicar beneficios de Tier LCo (ej: % descuento) automáticamente a la cuenta en LC.
    - Interfaz de cliente en LC que muestre claramente sus puntos LCo y recompensas disponibles.
32. **Módulo Pedidos Online / Take Away / Delivery:** (Extensión natural de LC y la carta digital)
33. **App Móvil Dedicada (PWA o Nativa):**
    - Para Clientes LCo (mejorando la experiencia PWA actual).
    - Para Personal de LC (Camareros, KDS).
34. **E2E (End-to-End) Tests Automatizados:** Para los flujos de usuario más críticos de toda la plataforma.
35. **Monetización Avanzada:**
    - Diferentes planes de suscripción (Básico, Pro, Premium) con acceso a distintos módulos o límites de uso.
    - Cobro por módulos adicionales específicos.
36. **Personalización y CRM Avanzado (Transversal):**
    - Segmentación de clientes más avanzada.
    - Campañas de marketing dirigidas.
37. **Gamificación Avanzada (LCo):** Badges, retos, leaderboards.

---
