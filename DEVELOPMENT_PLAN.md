# LoyalPyME - Plan de Desarrollo y Futuras Funcionalidades

**Última Actualización:** 03 de Mayo de 2025

Este documento detalla las tareas pendientes inmediatas, las funcionalidades planificadas a corto/medio plazo y las ideas para la evolución futura de LoyalPyME, incluyendo consideraciones de implementación para referencia futura. Sirve como backlog detallado y repositorio de ideas.

---

## A. TAREAS INMEDIATAS / CORRECCIONES TÉCNICAS ⏳📌

1.  **Arreglar Tipo `TierData`** (`frontend`)

    - **Prioridad:** Alta
    - **Dificultad:** Baja
    - **Objetivo:** Mejorar la seguridad de tipos eliminando `as any` al acceder a `tier.benefits` en el dashboard del cliente.
    - **Pasos:** Añadir `benefits?: TierBenefitData[];` a `interface TierData` (`types/customer.ts`). Eliminar casts en `CustomerDashboardPage.tsx` (`useMemo`) usando `?.` o checks.

2.  **Fix Mobile Popover Click en Barra de Progreso** (`frontend`)
    - **Prioridad:** Media (Bug UX)
    - **Dificultad:** Media (Requiere depuración)
    - **Objetivo:** Permitir ver beneficios del siguiente nivel con tap en móvil en `UserInfoDisplay`.
    - **Pasos:** Depurar (consola remota, inspector). Verificar eventos, CSS (`z-index`), posible bug Mantine. Probar wrapper (`Box`) o icono `IconInfoCircle` como trigger alternativo para el `<Popover>`.

---

## B. PRÓXIMAS FUNCIONALIDADES (FASE 2 / Prioridad Media-Alta) ⭐📝

3.  ⭐ **Panel Super Admin y Gestión de Negocios/Módulos** (`backend`, `frontend`)

    - **Prioridad:** **MUY ALTA** (Requisito para modelo SaaS/multi-negocio)
    - **Dificultad:** Alta
    - **Objetivo:** Crear la interfaz y lógica para que el administrador de la plataforma (tú) pueda gestionar los negocios registrados, su estado (activo/inactivo basado en pago futuro), y qué módulos/funcionalidades tienen habilitados.
    - **Pasos Backend:**
      1.  **Rol `SUPER_ADMIN`:** Definir en Enum `UserRole` (`schema.prisma`). Crear primer usuario Super Admin manualmente en BD o con script seguro.
      2.  **Gestión Negocios API:**
          - Crear `superadmin.routes.ts` (protegido con `checkRole(['SUPER_ADMIN'])`).
          - Endpoints: `GET /api/superadmin/businesses` (listar/paginar/filtrar negocios), `GET /api/superadmin/businesses/:id` (detalles), `PATCH /api/superadmin/businesses/:id/status` (cambiar `Business.isActive`?).
          - Crear `superadmin.service.ts` con lógica Prisma para estas operaciones.
          - Crear `superadmin.controller.ts` para manejar peticiones.
      3.  **Gestión Módulos/Features API & DB:**
          - **Decidir Modelo Datos:** ¿Campo JSON `enabledModules: String[]` en `Business`? ¿O tablas `Module` y `BusinessModule`? (Tablas es más escalable).
          - Crear/Modificar Schema Prisma según decisión. Migrar y Generar.
          - Endpoints API Super Admin para ver/activar/desactivar módulos por negocio (ej: `PATCH /api/superadmin/businesses/:id/modules`).
          - Servicios/Controladores para esta lógica.
      4.  **Feature Flags (Middleware/Servicios):** Implementar lógica en el backend principal para comprobar si un negocio tiene un módulo específico activo _antes_ de permitir el acceso a la API de ese módulo (ej: un middleware `checkModuleActive('WAITER_MODULE')` en las rutas del módulo camarero).
    - **Pasos Frontend:**
      1.  **Sección Super Admin:** Crear rutas (ej: `/superadmin`) y componentes accesibles solo para rol `SUPER_ADMIN` (ajustar `PrivateRoute`).
      2.  **UI Gestión Negocios:** Tabla para listar negocios con buscador/filtros. Vista de detalle por negocio. Botones para activar/desactivar.
      3.  **UI Gestión Módulos:** En la vista de detalle de un negocio, mostrar lista de módulos disponibles (definidos estáticamente en FE o leídos de tabla `Module` si existe) con `<Switch>` para activarlos/desactivarlos para ESE negocio. Llamar a la API correspondiente al cambiar el switch.
    - **Consideraciones:** Seguridad robusta para endpoints Super Admin. Diseño claro del sistema de módulos/feature flags.

4.  **Añadir Captura desde Cámara en `RewardForm.tsx`** (`frontend`)

    - **Prioridad:** Media (Mejora UX Admin)
    - **Dificultad:** Media
    - **Objetivo:** Opción para tomar foto con cámara para la recompensa.
    - **Pasos:** Activar botón, Modal con `<video>`, `getUserMedia`, botón captura a `<canvas>`, `toBlob`/`toDataURL`, detener stream, pasar DataURL a `ReactCrop`.

5.  **Refinar Espaciado/Diseño `RewardList.tsx`** (`frontend`)

    - **Prioridad:** Media (Mejora Visual)
    - **Dificultad:** Baja-Media
    - **Objetivo:** Mejorar estética/legibilidad tarjetas recompensa cliente.
    - **Pasos:** Ajustar props Mantine (`SimpleGrid` cols/spacing, `Card` padding, `Stack` gap, `Text` size/fw/lineClamp, `Badge` size/variant). Responsive.

6.  **Personalización Negocio - Logo (Upload)** (`backend`, `frontend`)

    - **Prioridad:** Alta
    - **Dificultad:** Media-Alta
    - **Objetivo:** Permitir al admin subir su logo.
    - **Pasos BE:** Añadir `logoUrl` a `Business`. API Upload (`/upload/business-logo`, carpeta Cloudinary `logos_...`). Servicio para update `Business`. Devolver `logoUrl` en `/api/profile`.
    - **Pasos FE:** UI Admin (Settings Page?) con `<FileInput>`. Llamada API Upload. Hook `useLayoutUserData` lee `logoUrl`. `AppHeader` muestra logo dinámico o fallback estático.

7.  **Personalización Negocio - Theming Básico** (`backend`, `frontend`)

    - **Prioridad:** Alta
    - **Dificultad:** Media
    - **Objetivo:** Adaptar colores primarios/secundarios.
    - **Pasos BE:** Añadir `themeIdentifier` a `Business`. UI Admin para seleccionar. Devolver en `/api/profile`.
    - **Pasos FE:** Definir temas Mantine o variables CSS. Lógica en `App.tsx`/`MainLayout.tsx` lee `themeIdentifier` y aplica tema/clase CSS.

8.  **Historial de Actividad Cliente** (`backend`, `frontend`)

    - **Prioridad:** Alta
    - **Dificultad:** Alta
    - **Objetivo:** Log de puntos, canjes, regalos para el cliente.
    - **Pasos BE:** (Recomendado) Crear `model PointTransaction`. Modificar servicios para registrar transacciones. API `GET /api/customer/activity` (paginada).
    - **Pasos FE:** Implementar `ActivityTab.tsx`. Hook `useCustomerActivity`. UI Lista/Feed con icono, descripción, fecha.

9.  **Fidelización Avanzada (Tipos de Beneficios)** (`backend`, `frontend`)

    - **Prioridad:** Media
    - **Dificultad:** Alta
    - **Objetivo:** Más variedad en beneficios de Tiers.
    - **Pasos BE:** Expandir Enum `BenefitType`. Validar `value`. Implementar lógica aplicación (Cron Job cumpleaños?).
    - **Pasos FE:** Actualizar Form/Select Admin. Actualizar display cliente.

10. **Comunicación Básica (Anuncios)** (`backend`, `frontend`)
    - **Prioridad:** Media
    - **Dificultad:** Alta
    - **Objetivo:** Admin publica noticias/ofertas generales.
    - **Pasos BE:** `model Announcement`. API CRUD Admin. API lectura cliente.
    - **Pasos FE:** UI Admin (crear/listar). UI Cliente (`OffersTab.tsx` feed).

---

## C. TAREAS TÉCNICAS PENDIENTES 🛠️

11. **Usar Variables Entorno para Credenciales Tests** (`backend`)

    - **Prioridad:** Media
    - **Dificultad:** Media
    - **Objetivo:** Desacoplar tests de integración de credenciales admin hardcodeadas.
    - **Pasos:** Definir `TEST_ADMIN_EMAIL`/`PASSWORD` en `.env`/`.env.example`. Modificar `beforeAll` en tests (`tests/integration/*.test.ts`) para usar `process.env`. Actualizar READMEs/`SETUP_GUIDE.md`. (Asegurar que el usuario existe en BD test).

12. **Completar Pruebas Backend** (`backend`)

    - **Prioridad:** Media/Baja
    - **Dificultad:** Alta / Larga
    - **Objetivo:** Aumentar cobertura y fiabilidad.
    - **Pasos:** Tests Unitarios (servicios). Tests Integración (endpoints, errores, filtros, cron).

13. **Iniciar/Completar Pruebas Frontend** (`frontend`)

    - **Prioridad:** Media/Baja
    - **Dificultad:** Alta / Larga
    - **Objetivo:** Asegurar calidad UI/lógica.
    - **Pasos:** Tests Unitarios (hooks). Tests Componente RTL (UI compleja). Tests Renderizado.

14. **Validación Robusta Backend (Zod)** (`backend`)

    - **Prioridad:** Media
    - **Dificultad:** Media
    - **Objetivo:** Validar DTOs de entrada.
    - **Pasos:** Instalar `zod`. Definir schemas. Middleware de validación Express.

15. **Estrategia Deployment & CI/CD** (`infra`)

    - **Prioridad:** Alta (cuando se quiera desplegar)
    - **Dificultad:** Alta
    - **Objetivo:** Despliegue automatizado.
    - **Pasos:** Decidir plataforma. Dockerizar?. Configurar builds prod, servidor/proxy, secretos prod. Pipeline CI/CD.

16. **Logging/Monitoring Avanzado** (`backend`, `frontend`)

    - **Prioridad:** Media (Prod)
    - **Dificultad:** Media
    - **Objetivo:** Observabilidad.
    - **Pasos:** Integrar Sentry/similar. Implementar librería logging formal (BE).

17. **Optimización Base de Datos** (`backend`)

    - **Prioridad:** Baja (Revisar si hay problemas)
    - **Dificultad:** Media
    - **Objetivo:** Rendimiento consultas.
    - **Pasos:** Analizar queries. Añadir índices (`@index`/`@@index`) en `schema.prisma`.

18. **Tipado Centralizado (`common` package)** (`infra`, `backend`, `frontend`)
    - **Prioridad:** Media/Baja (Refactor)
    - **Dificultad:** Media-Alta
    - **Objetivo:** Evitar duplicación/desincronización tipos.
    - **Pasos:** Configurar workspace (Yarn/pnpm/Nx). Mover tipos compartidos. Ajustar `tsconfig.json` y imports.

---

## D. VISIÓN FUTURA (FASE 3+ / Brainstorming) 🚀

_(Detalles conceptuales y consideraciones para ideas a más largo plazo)_

19. **Interacción Social y Gifting:**

    - **Objetivo:** Aumentar engagement y viralidad.
    - **Ideas:** Regalar Recompensas/Puntos cliente-a-cliente (búsqueda, mensaje), Transferir Puntos (límites?), Programa de Referidos (códigos, bonus mutuo), Compartir Logros, Chat Simple (admin-cliente / cliente-cliente?).
    - **Consideraciones:** Relaciones usuario (amigos?), búsqueda, BD, UI compleja, privacidad, moderación chat.

20. **Gamificación Avanzada:**

    - **Objetivo:** Incrementar frecuencia y logro.
    - **Ideas:** Pérdida/Bonus Puntos (Inactividad/Reactivación), Badges/Logros (hitos, UI perfil), Rachas (visitas/scans), Retos (propuestos por admin), Leaderboards (opcional/anonimizado).
    - **Consideraciones:** Lógica backend compleja, diseño UI atractivo, configuración admin.

21. **Monetización / Compra de Puntos / Módulos:**

    - **Objetivo:** Generar ingresos PyME / Acelerar cliente / Modelo SaaS.
    - **Ideas:** Recarga Saldo (Stripe?), Paquetes Puntos, Premium Tiers (suscripción), Módulos Opcionales (Camarero, CRM, Analytics Pro) con suscripción (gestionado vía Panel Super Admin - Tarea #3).
    - **Consideraciones:** Pasarela pago, seguridad PCI, lógica negocio suscripciones/precios/activación, UI compra/gestión.

22. **Personalización y CRM Avanzado:**

    - **Objetivo:** Mejorar relación cliente y marketing dirigido.
    - **Ideas:** Bonus Cumpleaños (requiere fecha!), Segmentación Clientes (UI admin), Ofertas Dirigidas (a segmento), Feedback/Encuestas Post-Acción (incentivo?), Recomendaciones (avanzado).
    - **Consideraciones:** Privacidad (fecha cumple.), UI admin potente, posible integración email.

23. **Analíticas Avanzadas (Admin):**

    - **Objetivo:** Más insights para el negocio.
    - **Ideas:** Análisis RFM, efectividad recompensas, gráficos distribución/migración tiers, puntos emitidos vs canjeados, LTV cliente.
    - **Consideraciones:** Queries agregación complejas, librerías gráficos.

24. **Operaciones y Gestión Negocio:**

    - **Objetivo:** Facilitar uso operativo en el local.
    - **Ideas:** **Pantalla Servicio/Comandas** (canjes tiempo real - WebSockets, UI tablet staff?), VIP Lists (flag user, UI admin/cliente?), **Multi-Admin/Roles** (invitar empleados, permisos limitados), Log de Auditoría (`AuditLog`).
    - **Consideraciones:** WebSockets para tiempo real, diseño roles/permisos granular, UI staff.

25. **Gestión de Catálogo e Integración de Datos Externos** **(¡Detallado!)**

    - **Objetivo:** Facilitar a los negocios la gestión de sus productos/servicios y datos relacionados (precio, stock) dentro de LoyalPyME, sincronizándolos con sus sistemas existentes. Esencial para módulos futuros (Pedidos, Carta Digital, Inventario, o recompensas específicas de producto).
    - **Concepto y Opciones (por complejidad creciente):**
      1.  **Importación Manual CSV/Excel (Base):**
          - _Descripción:_ UI Admin para subir archivo con catálogo (ID Producto, Nombre, Precio, Desc, Cat?, Stock inicial?). Backend parsea y crea/actualiza `Product`.
          - _Pros:_ Universal, relativamente fácil de implementar.
          - _Contras:_ Manual, propenso a errores, datos no en tiempo real (stock/precio desactualizados).
          - _Dificultad:_ Media.
      2.  **Conexión Directa Lectura BD (ODBC):**
          - _Descripción:_ Permitir configurar una conexión ODBC de solo lectura a la base de datos del ERP/TPV del cliente (si este lo permite). Backend LoyalPyME haría consultas `SELECT` periódicas/bajo demanda para obtener precios/stock actualizados.
          - _Pros:_ Datos casi en tiempo real, menos trabajo manual.
          - _Contras:_ **Muy complejo**. Requiere instalar drivers ODBC en servidor backend (complica despliegue). Configuración DSN/conexión específica por cada cliente. Dependencia de la estructura de BD del cliente. Rendimiento/seguridad.
          - _Dificultad:_ Alta / Muy Alta.
      3.  **Integración API ERP/TPV (Ideal pero Dependiente):**
          - _Descripción:_ Si el ERP/TPV del cliente ofrece una API REST/GraphQL moderna, desarrollar una integración específica para sincronizar catálogo, precios, stock, etc.
          - _Pros:_ La mejor opción si API existe y es buena. Datos en tiempo real, robusto.
          - _Contras:_ Requiere desarrollo específico por cada ERP/TPV a integrar. Depende de terceros.
          - _Dificultad:_ Alta (por cada integración).
    - **Pasos Iniciales (Para CSV):**
      - **BE:** `model Product` (schema, migrate, generate). Librería parseo CSV/Excel (`papaparse`?). API Import (`POST /api/admin/products/import-csv` con Multer). Servicio procesado/upsert. API CRUD Productos (opcional).
      - **FE:** UI Admin subida CSV (Ajustes/Catálogo). Instrucciones formato, plantilla. Feedback importación. UI ver catálogo (opcional).
    - **Prioridad:** Importación CSV (Media, sube a Alta con Módulos Producto). ODBC/API (Baja-Media, Muy específica/avanzada).

26. **App Móvil (PWA/Nativa):**

    - **Objetivo:** Mejorar experiencia móvil, notificaciones push, offline básico.
    - **Concepto:** PWA o nativa (React Native) enfocada en cliente.
    - **Consideraciones:** Service workers, Expo/RN CLI, API, diseño adaptado, cámara nativa, FCM.

27. **E2E Tests:** Cypress/Playwright para flujos críticos.
28. **Integraciones Externas:** (Muy futuro) POS, Reservas, etc.

---
