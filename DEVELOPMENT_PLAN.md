# LoyalPyME - Plan de Desarrollo y Futuras Funcionalidades

**Última Actualización:** 05 de Mayo de 2025

Este documento detalla las tareas pendientes inmediatas, el alcance definido para una V1.0 operativa, las mejoras planificadas post-V1.0, la deuda técnica y las ideas para la evolución futura.

---

## A. CORRECCIONES INMEDIATAS (Pre-V1.0) ⏳📌

_(Bloqueadores o bugs a solucionar antes de seguir con nuevas features)_

1.  **[COMPLETADO]** ~~Arreglar Tipo `TierData` (`frontend`)~~

    - ~~**Prioridad:** Alta~~
    - ~~**Dificultad:** Baja~~
    - ~~**Objetivo:** Eliminar casts `as any` al acceder a `tier.benefits` en `CustomerDashboardPage.tsx`.~~
    - ~~**Pasos:** Añadir `benefits?: TierBenefitData[];` a `interface TierData` (`types/customer.ts`). Eliminar casts usando `?.` o checks.~~

2.  **[COMPLETADO]** ~~Fix Mobile Popover Click en Barra de Progreso (`frontend`)~~

    - ~~**Prioridad:** Media (Bug UX)~~
    - ~~**Dificultad:** Media (Requiere depuración)~~
    - ~~**Objetivo:** Permitir ver beneficios del siguiente nivel con tap en móvil en `UserInfoDisplay`.~~
    - ~~**Pasos:** Se implementó icono (`IconHelp`) clickeable solo en móvil como disparador del Popover.~~

3.  **[COMPLETADO]** ~~Fix Backend Build Error (`uploads.service.ts`) (`backend`)~~

    - ~~**Prioridad:** CRÍTICA (Impedía compilación backend)~~
    - ~~**Dificultad:** Baja-Media~~
    - ~~**Objetivo:** Solucionar error `TS2307: Cannot find module './uploads.service'` que reportaba `tsc` al compilar `uploads.controller.ts`.~~
    - ~~**Pasos:** Se corrigieron nombres de archivo (`uploads.controller.ts`) e importaciones internas. Se verificó la existencia/exportación en `uploads.service.ts`. Se requirió limpieza de `dist/` y `npx prisma generate` para asegurar que `tsc` veía los tipos/módulos correctos.~~

4.  **[COMPLETADO]** ~~Feature: Botones Canje en Resumen Cliente (`frontend`)~~
    - ~~**Prioridad:** Media (Mejora UX solicitada)~~
    - ~~**Dificultad:** Baja-Media~~
    - ~~**Objetivo:** Añadir botones "Canjear" a las previsualizaciones de recompensas/regalos en `SummaryTab.tsx`.~~
    - ~~**Pasos:** Pasar props (`onRedeem...`, `redeemingRewardId`, `userPoints`) desde `CustomerDashboardPage` a `SummaryTab`. Añadir lógica de botones condicionales en `SummaryTab`. Simplificar texto botones. Añadir claves i18n.~~

---

## B. ALCANCE OBJETIVO "V1.0" (Operativa y Atractiva) ⭐🚀

_(Funcionalidades y requisitos técnicos mínimos para poder empezar a ofrecer la plataforma, aunque sea en beta o con planes iniciales)_

5.  ⭐ **Panel Super Admin y Gestión Negocios/Módulos** (`backend`, `frontend`)

    - **Prioridad:** **CRÍTICA** (Requisito para modelo SaaS/multi-negocio)
    - **Dificultad:** Alta
    - **Objetivo:** Interfaz/lógica para que el admin de LoyalPyME gestione negocios (estado activo/inactivo) y módulos habilitados.
    - **Pasos BE:** Rol `SUPER_ADMIN`. API Super Admin (`/api/superadmin/...` protegida) para CRUD básico de Negocios (listar, activar/desactivar) y gestión de módulos/features por negocio (¿Modelo BD `BusinessModule`? ¿JSON en `Business`?). Middleware `checkModuleActive`.
    - **Pasos FE:** Sección `/superadmin` protegida. UI Gestión Negocios (Tabla, botones estado). UI Gestión Módulos (Lista + Switch por negocio).
    - **Consideraciones:** Seguridad endpoints Super Admin, diseño feature flags/módulos, creación primer Super Admin.

6.  ⭐ **Personalización Negocio - Logo (Upload)** (`backend`, `frontend`)

    - **Prioridad:** Alta (Importante para imagen de marca del cliente PyME)
    - **Dificultad:** Media-Alta
    - **Objetivo:** Permitir al admin del negocio subir su propio logo.
    - **Pasos BE:** `Business.logoUrl`. API Upload (`/upload/business-logo` o usar genérica `/uploads/image`). Servicio update `Business`. Devolver `logoUrl` en `/api/profile`.
    - **Pasos FE:** UI Admin (Settings Page?) con `<FileInput>`. Hook `useLayoutUserData` obtiene `logoUrl`. `AppHeader` muestra logo dinámico o fallback.

7.  ⭐ **Personalización Negocio - Theming Básico** (`backend`, `frontend`)

    - **Prioridad:** Alta (Importante para imagen de marca del cliente PyME)
    - **Dificultad:** Media
    - **Objetivo:** Adaptar colores primarios/secundarios básicos.
    - **Pasos BE:** `Business.themeIdentifier` o `brandingColor`. UI Admin para seleccionar. Devolver en `/api/profile`.
    - **Pasos FE:** Definir temas Mantine/variables CSS. Lógica `App.tsx`/`MainLayout.tsx` aplica tema/clase.

8.  ⭐ **[COMPLETADO]** ~~Historial de Actividad Cliente (`backend`, `frontend`)~~

    - ~~**Prioridad:** Alta (Valor clave para el cliente final)~~
    - ~~**Dificultad:** Alta~~
    - ~~**Objetivo:** Log de puntos, canjes, regalos para el cliente.~~
    - ~~**Pasos BE:** Creado `model ActivityLog`. Servicios modificados para registrar. API `GET /api/customer/activity` (paginada) creada.~~
    - ~~**Pasos FE:** Implementado `ActivityTab.tsx`. Creado Hook `useCustomerActivity`. UI Lista/Timeline con paginación. Descripciones internacionalizadas.~~

9.  ⭐ **Fundamentos Técnicos Esenciales (Pre-Lanzamiento)** (`backend`, `frontend`, `infra`)
    - **Prioridad:** **CRÍTICA**
    - **Dificultad:** Media-Alta
    - **Objetivo:** Asegurar un mínimo de estabilidad, seguridad y operatividad antes de que usuarios reales (incluso beta) usen la plataforma.
    - **Tareas Mínimas:**
      - Testing Mínimo (BE): Escribir y pasar tests de integración para flujos críticos: Login (Admin/Cliente), Registro (Cliente/Negocio), Validación QR, Canje Puntos, Canje Regalo, CRUD Recompensa básico, CRUD Tier básico, Historial Actividad. (Parte de C.12).
      - Validación Backend Mínima:** Revisar **todos\*\* los endpoints API y asegurar que las entradas (`req.body`, `req.params`, `req.query`) tienen validaciones básicas para prevenir errores 500 por datos inesperados (puede ser sin Zod inicialmente, pero mejorado respecto a ahora). (Parte de C.14).
      - Despliegue Inicial:** Definir, implementar y **probar\*\* un método de despliegue simple pero funcional en un entorno tipo producción (ej: Dockerizar + VPS/Cloud Simple, o PaaS como Render/Fly.io). Configurar variables de entorno de producción (DB, JWT, Cloudinary, etc.). Asegurar HTTPS. (Parte de C.15).
      - Logging Básico Producción:\*\* Configurar el backend para que los logs (errores, warnings, info básica) se escriban a archivos o a un servicio de logging simple en producción. (Parte de C.16).
      - Seguridad Básica:\*\* Revisar dependencias (`yarn audit`), configurar cabeceras HTTP de seguridad básicas (Helmet.js en Express?), asegurar que la gestión de JWT (expiración, secreto) es robusta.

---

## C. MEJORAS POST-V1.0 / PRÓXIMA PRIORIDAD (Fase 2 Continuación) 📝

_(Funcionalidades valiosas a añadir después del lanzamiento inicial V1.0, o si se decide incluirlas en V1.0)_

10. **Feature: "Mi Perfil" Cliente (con Foto)** (`backend`, `frontend`) - **NUEVO (Prioridad Solicitada)**

    - **Prioridad:** Alta (Solicitada por usuario para V1.0)
    - **Dificultad:** Media
    - **Objetivo:** Implementar pestaña "Mi Perfil" y permitir subida/visualización de avatar.
    - **Pasos BE:** Añadir `avatarUrl` a `User`. Crear API Upload avatar. Modificar `GET /profile`.
    - **Pasos FE:** Implementar `ProfileTab.tsx` (UI subida/recorte?). Modificar `UserInfoDisplay`/`AppHeader` para mostrar `<Avatar>`. Actualizar hooks (`useUserProfileData`, `useLayoutUserData`).

11. **Feature: "Ofertas y Noticias" (Comunicación Básica)** (`backend`, `frontend`) - **NUEVO (Prioridad Solicitada)**

    - **Prioridad:** Alta (Solicitada por usuario para V1.0) / Media (Plan Original)
    - **Dificultad:** Alta
    - **Objetivo:** Admin publica noticias/ofertas generales. Cliente las ve.
    - **Pasos BE:** `model Announcement`. API CRUD Admin. API lectura cliente. _(Opcional: Lógica Mailing)_.
    - **Pasos FE:** UI Admin (crear/listar). Implementar `OffersTab.tsx` feed. Mostrar resumen en `SummaryTab.tsx`. Hook `useAnnouncements`. _(Opcional: UI suscripción email)_.

12. **Añadir Captura desde Cámara en `RewardForm.tsx`** (`frontend`)

    - **Prioridad:** Media-Baja (Post-V1.0)
    - **Dificultad:** Media
    - **Objetivo:** Opción para tomar foto con cámara para la recompensa.
    - **Pasos:** Activar botón, Modal con `<video>`, `getUserMedia`, botón captura a `<canvas>`, `toBlob`/`toDataURL`, detener stream, pasar DataURL a `ReactCrop`.

13. **Refinar Espaciado/Diseño `RewardList.tsx`** (`frontend`)

    - **Prioridad:** Media (Post-V1.0)
    - **Dificultad:** Baja-Media
    - **Objetivo:** Mejorar estética/legibilidad tarjetas recompensa cliente.
    - **Pasos:** Ajustar props Mantine (`SimpleGrid` cols/spacing, `Card` padding, `Stack` gap, `Text` size/fw/lineClamp, `Badge` size/variant). Responsive.

14. **Fidelización Avanzada (Tipos de Beneficios)** (`backend`, `frontend`)
    - **Prioridad:** Media (Post-V1.0)
    - **Dificultad:** Alta
    - **Objetivo:** Más variedad en beneficios de Tiers (ej: % Descuento, Bonus Cumpleaños).
    - **Pasos BE:** Expandir Enum `BenefitType`. Validar `value`. Implementar lógica aplicación (Cron Job?).
    - **Pasos FE:** Actualizar Form/Select Admin. Actualizar display cliente.

---

## D. DEUDA TÉCNICA Y MEJORAS CONTINUAS 🛠️

_(Tareas importantes para la salud y escalabilidad a largo plazo, a abordar progresivamente)_

15. Usar Variables Entorno para Credenciales Tests (`backend`)
16. Completar Pruebas Backend (`backend`)
17. Iniciar/Completar Pruebas Frontend (`frontend`)
18. Validación Robusta Backend (Zod) (`backend`)
19. Estrategia Deployment & CI/CD (Avanzada) (`infra`)
20. Logging/Monitoring Avanzado (Producción) (`backend`, `frontend`)
21. Optimización Base de Datos (`backend`)
22. Tipado Centralizado (`common` package) (`infra`, `backend`, `frontend`)

---

## E. VISIÓN FUTURA / MÓDULOS ADICIONALES (Post-V1.0) 🚀

_(Ideas a largo plazo, a detallar y priorizar después de V1.0)_

23. Módulo Camarero/Servicio (Real-time)
24. Módulo Pedidos / Carta Digital
25. Interacción Social y Gifting
26. Gamificación Avanzada
27. Monetización Avanzada
28. Personalización y CRM Avanzado
29. Gestión de Catálogo e Integración de Datos Externos
30. Analíticas Avanzadas (Admin)
31. Operaciones y Gestión Negocio Adicional
32. App Móvil (PWA/Nativa)
33. E2E Tests

---
