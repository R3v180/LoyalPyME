# LoyalPyME - Plan de Desarrollo y Futuras Funcionalidades

**Última Actualización:** 03 de Mayo de 2025

Este documento detalla las tareas pendientes inmediatas, el alcance definido para una V1.0 operativa, las mejoras planificadas post-V1.0, la deuda técnica y las ideas para la evolución futura.

---

## A. CORRECCIONES INMEDIATAS (Pre-V1.0) ⏳📌

_(Bloqueadores o bugs a solucionar antes de seguir con nuevas features)_

1.  **Arreglar Tipo `TierData`** (`frontend`)

    - **Prioridad:** Alta
    - **Dificultad:** Baja
    - **Objetivo:** Eliminar casts `as any` al acceder a `tier.benefits` en `CustomerDashboardPage.tsx`.
    - **Pasos:** Añadir `benefits?: TierBenefitData[];` a `interface TierData` (`types/customer.ts`). Eliminar casts usando `?.` o checks.

2.  **Fix Mobile Popover Click en Barra de Progreso** (`frontend`)
    - **Prioridad:** Media (Bug UX)
    - **Dificultad:** Media (Requiere depuración)
    - **Objetivo:** Permitir ver beneficios del siguiente nivel con tap en móvil en `UserInfoDisplay`.
    - **Pasos:** Depurar (consola remota). Verificar eventos/CSS. Probar wrapper o icono trigger alternativo para `<Popover>`.

---

## B. ALCANCE OBJETIVO "V1.0" (Operativa y Atractiva) ⭐🚀

_(Funcionalidades y requisitos técnicos mínimos para poder empezar a ofrecer la plataforma, aunque sea en beta o con planes iniciales)_

3.  ⭐ **Panel Super Admin y Gestión Negocios/Módulos** (`backend`, `frontend`)

    - **Prioridad:** **CRÍTICA** (Requisito para modelo SaaS/multi-negocio)
    - **Dificultad:** Alta
    - **Objetivo:** Interfaz/lógica para que el admin de LoyalPyME gestione negocios (estado activo/inactivo) y módulos habilitados.
    - **Pasos BE:** Rol `SUPER_ADMIN`. API Super Admin (`/api/superadmin/...` protegida) para CRUD básico de Negocios (listar, activar/desactivar) y gestión de módulos/features por negocio (¿Modelo BD `BusinessModule`? ¿JSON en `Business`?). Middleware `checkModuleActive`.
    - **Pasos FE:** Sección `/superadmin` protegida. UI Gestión Negocios (Tabla, botones estado). UI Gestión Módulos (Lista + Switch por negocio).
    - **Consideraciones:** Seguridad endpoints Super Admin, diseño feature flags/módulos.

4.  ⭐ **Personalización Negocio - Logo (Upload)** (`backend`, `frontend`)

    - **Prioridad:** Alta (Importante para imagen de marca del cliente PyME)
    - **Dificultad:** Media-Alta
    - **Objetivo:** Permitir al admin del negocio subir su propio logo.
    - **Pasos BE:** `Business.logoUrl`. API Upload (`/upload/business-logo`). Servicio update `Business`. Devolver `logoUrl` en `/api/profile`.
    - **Pasos FE:** UI Admin (Settings Page?) con `<FileInput>`. Hook `useLayoutUserData` obtiene `logoUrl`. `AppHeader` muestra logo dinámico o fallback.

5.  ⭐ **Personalización Negocio - Theming Básico** (`backend`, `frontend`)

    - **Prioridad:** Alta (Importante para imagen de marca del cliente PyME)
    - **Dificultad:** Media
    - **Objetivo:** Adaptar colores primarios/secundarios básicos.
    - **Pasos BE:** `Business.themeIdentifier`. UI Admin para seleccionar. Devolver en `/api/profile`.
    - **Pasos FE:** Definir temas Mantine/variables CSS. Lógica `App.tsx`/`MainLayout.tsx` aplica tema/clase.

6.  ⭐ **Historial de Actividad Cliente** (`backend`, `frontend`)

    - **Prioridad:** Alta (Valor clave para el cliente final)
    - **Dificultad:** Alta
    - **Objetivo:** Log de puntos, canjes, regalos para el cliente.
    - **Pasos BE:** (Recomendado) `model PointTransaction`. Modificar servicios para registrar. API `GET /api/customer/activity` (paginada).
    - **Pasos FE:** Implementar `ActivityTab.tsx`. Hook `useCustomerActivity`. UI Lista/Feed.

7.  ⭐ **Fundamentos Técnicos Esenciales (Pre-Lanzamiento)** (`backend`, `frontend`, `infra`)
    - **Prioridad:** **CRÍTICA**
    - **Dificultad:** Media-Alta
    - **Objetivo:** Asegurar un mínimo de estabilidad, seguridad y operatividad antes de que usuarios reales (incluso beta) usen la plataforma.
    - **Tareas Mínimas:**
      - **Testing Mínimo (BE):** Escribir y pasar tests de integración para flujos críticos: Login (Admin/Cliente), Registro (Cliente/Negocio), Validación QR, Canje Puntos, Canje Regalo, CRUD Recompensa básico, CRUD Tier básico. (Parte de C.12).
      - **Validación Backend Mínima:** Revisar **todos** los endpoints API y asegurar que las entradas (`req.body`, `req.params`, `req.query`) tienen validaciones básicas para prevenir errores 500 por datos inesperados (puede ser sin Zod inicialmente, pero mejorado respecto a ahora). (Parte de C.14).
      - **Despliegue Inicial:** Definir, implementar y **probar** un método de despliegue simple pero funcional en un entorno tipo producción (ej: Dockerizar + VPS/Cloud Simple, o PaaS como Render/Fly.io). Configurar variables de entorno de producción (DB, JWT, Cloudinary, etc.). Asegurar HTTPS. (Parte de C.15).
      - **Logging Básico Producción:** Configurar el backend para que los logs (errores, warnings, info básica) se escriban a archivos o a un servicio de logging simple en producción. (Parte de C.16).
      - **Seguridad Básica:** Revisar dependencias (`yarn audit`), configurar cabeceras HTTP de seguridad básicas (Helmet.js en Express?), asegurar que la gestión de JWT (expiración, secreto) es robusta.

---

## C. MEJORAS POST-V1.0 / PRÓXIMA PRIORIDAD (Fase 2 Continuación) 📝

_(Funcionalidades valiosas a añadir después del lanzamiento inicial V1.0)_

8.  **Añadir Captura desde Cámara en `RewardForm.tsx`** (`frontend`)

    - **Prioridad:** Media-Baja (Post-V1.0)
    - **Dificultad:** Media
    - **Objetivo:** Opción para tomar foto con cámara para la recompensa.
    - **Pasos:** Activar botón, Modal con `<video>`, `getUserMedia`, botón captura a `<canvas>`, `toBlob`/`toDataURL`, detener stream, pasar DataURL a `ReactCrop`.

9.  **Refinar Espaciado/Diseño `RewardList.tsx`** (`frontend`)

    - **Prioridad:** Media (Post-V1.0)
    - **Dificultad:** Baja-Media
    - **Objetivo:** Mejorar estética/legibilidad tarjetas recompensa cliente.
    - **Pasos:** Ajustar props Mantine (`SimpleGrid` cols/spacing, `Card` padding, `Stack` gap, `Text` size/fw/lineClamp, `Badge` size/variant). Responsive.

10. **Fidelización Avanzada (Tipos de Beneficios)** (`backend`, `frontend`)

    - **Prioridad:** Media (Post-V1.0)
    - **Dificultad:** Alta
    - **Objetivo:** Más variedad en beneficios de Tiers (ej: % Descuento, Bonus Cumpleaños).
    - **Pasos BE:** Expandir Enum `BenefitType`. Validar `value`. Implementar lógica aplicación (Cron Job?).
    - **Pasos FE:** Actualizar Form/Select Admin. Actualizar display cliente.

11. **Comunicación Básica (Anuncios)** (`backend`, `frontend`)
    - **Prioridad:** Media (Post-V1.0)
    - **Dificultad:** Alta
    - **Objetivo:** Admin publica noticias/ofertas generales.
    - **Pasos BE:** `model Announcement`. API CRUD Admin. API lectura cliente.
    - **Pasos FE:** UI Admin (crear/listar). UI Cliente (`OffersTab.tsx` feed).

---

## D. DEUDA TÉCNICA Y MEJORAS CONTINUAS 🛠️

_(Tareas importantes para la salud y escalabilidad a largo plazo, a abordar progresivamente)_

12. **Usar Variables Entorno para Credenciales Tests** (`backend`)

    - **Prioridad:** Media (Hacer después de V1.0)
    - **Dificultad:** Media
    - **Objetivo:** Desacoplar tests de credenciales hardcodeadas.
    - **Pasos:** Definir `TEST_ADMIN_EMAIL`/`PASSWORD` en `.env`/`.env.example`. Modificar `beforeAll` tests. Actualizar `SETUP_GUIDE.md`.

13. **Completar Pruebas Backend** (`backend`)

    - **Prioridad:** Media (Continuo Post-V1.0)
    - **Dificultad:** Alta / Larga
    - **Objetivo:** Aumentar cobertura >80-90%.
    - **Pasos:** Tests Unitarios servicios. Tests Integración exhaustivos (casos borde, errores, seguridad).

14. **Iniciar/Completar Pruebas Frontend** (`frontend`)

    - **Prioridad:** Media (Continuo Post-V1.0)
    - **Dificultad:** Alta / Larga
    - **Objetivo:** Asegurar calidad UI/lógica.
    - **Pasos:** Tests Unitarios hooks. Tests Componente RTL.

15. **Validación Robusta Backend (Zod)** (`backend`)

    - **Prioridad:** Media (Post-V1.0)
    - **Dificultad:** Media
    - **Objetivo:** Validar DTOs de forma declarativa.
    - **Pasos:** Instalar `zod`. Definir schemas. Middleware validación Express.

16. **Estrategia Deployment & CI/CD (Avanzada)** (`infra`)

    - **Prioridad:** Media (Post-V1.0)
    - **Dificultad:** Alta
    - **Objetivo:** Despliegue robusto y automatizado.
    - **Pasos:** Dockerizar. Pipeline CI/CD completo (GitHub Actions?). Entornos Staging/Prod.

17. **Logging/Monitoring Avanzado (Producción)** (`backend`, `frontend`)

    - **Prioridad:** Alta (Post-Lanzamiento)
    - **Dificultad:** Media
    - **Objetivo:** Observabilidad detallada.
    - **Pasos:** Integrar Sentry. Librería logging formal BE (Winston/Pino). Métricas básicas.

18. **Optimización Base de Datos** (`backend`)

    - **Prioridad:** Baja (Según necesidad)
    - **Dificultad:** Media
    - **Objetivo:** Rendimiento consultas.
    - **Pasos:** Analizar queries (`EXPLAIN ANALYZE`). Añadir índices (`@index`/`@@index`).

19. **Tipado Centralizado (`common` package)** (`infra`, `backend`, `frontend`)
    - **Prioridad:** Media/Baja (Refactor Post-V1.0)
    - **Dificultad:** Media-Alta
    - **Objetivo:** Evitar duplicación tipos.
    - **Pasos:** Configurar workspace. Mover tipos compartidos. Ajustar `tsconfig.json` y imports.

---

## E. VISIÓN FUTURA / MÓDULOS ADICIONALES (Post-V1.0) 🚀

_(Ideas a largo plazo, a detallar y priorizar después de V1.0)_

20. **Módulo Camarero/Servicio (Real-time)**

    - **Objetivo:** Notificar al staff de canjes para preparación/entrega.
    - **Concepto:** Pantalla simple (tablet?) con lista de canjes pendientes (cliente, recompensa, mesa?, hora). Actualización en tiempo real. Botón "Servido".
    - **Consideraciones:** WebSockets (Socket.IO), UI específica staff, posible rol "Empleado".

21. **Módulo Pedidos / Carta Digital**

    - **Objetivo:** Permitir a clientes ver carta y/o hacer pedidos desde la app.
    - **Concepto:** Digitalizar menú, categorías, opciones. UI cliente para navegar/pedir. UI staff para recibir/gestionar pedidos (requiere módulo anterior).
    - **Consideraciones:** Depende de Gestión Catálogo (#26). Complejidad UI/UX. Integración con cocina/TPV (muy complejo).

22. **Interacción Social y Gifting**

    - **Objetivo:** Aumentar engagement y viralidad.
    - **Ideas:** Regalar Recompensas/Puntos cliente-a-cliente, Transferir Puntos, Programa Referidos, Compartir Logros, Chat Simple.
    - **Consideraciones:** Relaciones usuario (amigos?), búsqueda, BD, UI, privacidad, moderación.

23. **Gamificación Avanzada**

    - **Objetivo:** Incrementar frecuencia y logro.
    - **Ideas:** Pérdida/Bonus Puntos (Inactividad/Reactivación), Badges/Logros, Rachas, Retos, Leaderboards.
    - **Consideraciones:** Lógica backend compleja, diseño UI, config admin.

24. **Monetización Avanzada**

    - **Objetivo:** Diversificar ingresos.
    - **Ideas:** Recarga Saldo (€->Puntos vía Stripe), Paquetes Puntos, Premium Tiers (suscripción), Venta Módulos (SaaS).
    - **Consideraciones:** Pasarela pago, seguridad PCI, lógica negocio suscripciones.

25. **Personalización y CRM Avanzado**

    - **Objetivo:** Mejorar relación cliente y marketing dirigido.
    - **Ideas:** Bonus Cumpleaños, Segmentación Clientes (UI admin), Ofertas Dirigidas, Feedback/Encuestas Post-Acción, Recomendaciones.
    - **Consideraciones:** Privacidad (fecha cumple.), UI admin potente, posible integración email/push.

26. **Gestión de Catálogo e Integración de Datos Externos**

    - **Objetivo:** Facilitar gestión de productos/servicios (precio, stock) sincronizando con sistemas negocio. Esencial para módulos Pedidos, Carta, etc.
    - **Opciones:** Importación CSV/Excel (Base - Media Dificultad). Conexión Lectura BD (ODBC) (Avanzado - Muy Alta Dificultad). Integración API ERP/TPV (Ideal pero Dependiente - Alta Dificultad).
    - **Pasos (CSV):** BE (`model Product`, parser, API import, servicio upsert). FE (UI Upload, feedback).

27. **Analíticas Avanzadas (Admin)**

    - **Objetivo:** Más insights para el negocio.
    - **Ideas:** RFM, efectividad recompensas, gráficos tiers, puntos emitidos/canjeados, LTV.
    - **Consideraciones:** Queries agregación, librerías gráficos.

28. **Operaciones y Gestión Negocio Adicional**

    - **Objetivo:** Facilitar uso operativo en el local.
    - **Ideas:** VIP Lists, Multi-Admin/Roles (permisos granulares), Log de Auditoría (`AuditLog`).
    - **Consideraciones:** Diseño roles/permisos, UI staff/auditoría.

29. **App Móvil (PWA/Nativa)**

    - **Objetivo:** Mejorar experiencia móvil, notificaciones push.
    - **Concepto:** PWA o nativa (React Native).
    - **Consideraciones:** Service workers, Expo/RN CLI, API, diseño, cámara nativa, FCM.

30. **E2E Tests:** Cypress/Playwright para flujos críticos.
31. **Integraciones Externas:** POS, Reservas, etc.

---
