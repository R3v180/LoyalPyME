# LoyalPyME - Plan de Desarrollo y Futuras Funcionalidades

**Última Actualización:** 03 de Mayo de 2025

Este documento detalla las tareas pendientes inmediatas, las funcionalidades planificadas a corto/medio plazo y las ideas para la evolución futura de LoyalPyME, incluyendo consideraciones de implementación para referencia futura. Sirve como backlog detallado y repositorio de ideas.

---

## A. TAREAS INMEDIATAS / CORRECCIONES TÉCNICAS ⏳📌

1.  **Arreglar Tipo `TierData`** (`frontend`)

    - **Prioridad:** Alta
    - **Dificultad:** Baja
    - **Objetivo:** Mejorar la seguridad de tipos eliminando casts `as any` o similares al acceder a `tier.benefits` en el dashboard del cliente, lo cual puede ocultar errores o causar comportamientos inesperados si la estructura de datos cambia.
    - **Pasos Detallados:**
      1.  Abrir `frontend/src/types/customer.ts`.
      2.  Localizar la interfaz `TierData`.
      3.  Añadir la propiedad opcional: `benefits?: TierBenefitData[];` (El `?` es importante si la API no siempre devuelve el array de beneficios, por ejemplo, si se pide una lista de tiers sin detalles).
      4.  Abrir `frontend/src/pages/CustomerDashboardPage.tsx`.
      5.  Buscar la sección `useMemo` donde se calcula `tierDisplayData`.
      6.  Inspeccionar cómo se accede a los beneficios del `currentTier` o `nextTier`. Eliminar cualquier `as any` o `as TierData & { benefits: ... }`.
      7.  Usar encadenamiento opcional (`?.`) o comprobaciones explícitas (`if (tier && tier.benefits)`) para acceder a los beneficios de forma segura.
      8.  Buscar en otros componentes si se usan casts similares para `tier.benefits` y corregirlos.

2.  **Fix Mobile Popover Click en Barra de Progreso** (`frontend`)
    - **Prioridad:** Media (Bug UX)
    - **Dificultad:** Media (Requiere depuración)
    - **Objetivo:** El popover que muestra los beneficios del siguiente nivel (activado desde la barra de progreso en `UserInfoDisplay`) funciona con hover en escritorio pero no con tap/click en la simulación móvil del navegador ni (probablemente) en dispositivos reales.
    - **Archivos:** `frontend/src/components/customer/UserInfoDisplay.tsx`.
    - **Pasos Detallados:**
      1.  **Depuración:** Usar las herramientas de depuración remota móvil (ver `TROUBLESHOOTING_GUIDE.md`) para inspeccionar el componente en un dispositivo real o simulador fiable.
      2.  **Verificar Eventos:** ¿Llega el evento `onClick` o `onTap` al componente `<Progress>` o a su wrapper cuando se usa en móvil?
      3.  **Verificar CSS:** ¿Hay algún elemento superpuesto que esté interceptando el clic? Comprobar `z-index` del Popover, del Progress y de elementos circundantes. ¿Es el área de la barra de progreso suficientemente grande para un tap cómodo?
      4.  **Probar Target Alternativo:** Envolver el `<Progress>` en un `<Box onClick={popover.open}>` y ver si el Box sí captura el clic.
      5.  **Considerar Bug Mantine:** Investigar si hay issues abiertos en Mantine relacionados con `<Popover>` y `<Progress>` o eventos táctiles.
      6.  **Solución Alternativa (Si todo falla):** Añadir un pequeño `<ActionIcon>` con `IconInfoCircle` justo al lado de la barra de progreso. Hacer que _ese icono_ sea el `Popover.Target` o que abra un `Modal` simple con la información de los beneficios al hacerle clic.

---

## B. PRÓXIMAS FUNCIONALIDADES (FASE 2 / Prioridad Media-Alta) ⭐📝

3.  **Añadir Captura desde Cámara en `RewardForm.tsx`** (`frontend`)

    - **Prioridad:** Media
    - **Dificultad:** Media
    - **Objetivo:** Ofrecer al admin la opción de usar la cámara del dispositivo para tomar la foto de la recompensa, además de subir un archivo.
    - **Archivos:** `frontend/src/components/admin/rewards/RewardForm.tsx`.
    - **Pasos Detallados:**
      1.  Habilitar el botón "Cámara".
      2.  Crear un estado para controlar la visibilidad de un `Modal` de cámara.
      3.  En el `onClick` del botón Cámara, abrir el Modal.
      4.  Dentro del Modal:
          - Usar `navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' }})` al montar/abrir el modal.
          - Manejar errores (permiso denegado `NotAllowedError`, cámara no encontrada `NotFoundError`). Mostrar alerta al usuario.
          - Si éxito, obtener el `MediaStream`. Guardarlo en una ref o estado.
          - Mostrar el stream en un elemento `<video autoPlay ref={videoRef}`.
          - Añadir un botón "Tomar Foto".
          - Al hacer clic en "Tomar Foto":
            - Crear un `<canvas>` (puede ser oculto).
            - Ajustar tamaño del canvas al del vídeo (`videoRef.current.videoWidth`, `videoHeight`).
            - Dibujar el frame actual del vídeo en el canvas: `ctx.drawImage(videoRef.current, 0, 0)`.
            - Obtener la DataURL del canvas: `canvas.toDataURL('image/png')`.
            - **MUY IMPORTANTE:** Detener el stream de la cámara para liberarla: `streamRef.current?.getTracks().forEach(track => track.stop());`.
            - Cerrar el Modal.
            - Llamar a una función en `RewardForm` (pasada como prop al modal o definida ahí) pasándole la DataURL.
      5.  En `RewardForm`:
          - La función llamada desde el modal debe hacer: `setImgSrc(dataUrlFromCanvas)`. Esto activará el `ReactCrop` existente.
          - El resto del flujo (recorte, subida) ya está implementado.

4.  **Refinar Espaciado/Diseño `RewardList.tsx`** (`frontend`)

    - **Prioridad:** Media (Mejora Visual)
    - **Dificultad:** Baja-Media
    - **Objetivo:** Mejorar la apariencia visual y legibilidad de las tarjetas de recompensa en la vista de cliente.
    - **Archivos:** `frontend/src/components/customer/RewardList.tsx`.
    - **Pasos Detallados:**
      1.  Ajustar `cols` en `<SimpleGrid>` para diferentes breakpoints (quizás `xs:1, sm:2, md:3` sea mejor que `xs:2, md:3`).
      2.  Ajustar `spacing` y `verticalSpacing` en `<SimpleGrid>`.
      3.  Ajustar `padding` de `<Card>` (¿quizás `p="md"`?).
      4.  Revisar `gap` del `<Stack>` principal dentro de la Card.
      5.  Ajustar tamaño (`fz`), peso (`fw`) y `lineClamp` de los `<Text>` para nombre y descripción.
      6.  ¿Estilizar `<Badge>` (regalo/puntos)? `size`, `variant`.
      7.  Asegurar consistencia visual con `SummaryTab`.

5.  **Personalización Negocio - Logo (Upload)** (`backend`, `frontend`)

    - **Prioridad:** Alta
    - **Dificultad:** Media-Alta
    - **Objetivo:** Permitir al admin subir su logo para reemplazar el estático.
    - **Pasos Backend:**
      1.  Schema `Business`: Añadir `logoUrl?: String`.
      2.  Ejecutar `prisma migrate dev --name add_business_logo_url` y `prisma generate`.
      3.  Ruta API: `POST /api/admin/upload/business-logo` (proteger con rol admin). Usar Multer.
      4.  Servicio Subida: Reutilizar/adaptar `upload.service.ts` para subir a carpeta Cloudinary `loyalpyme/logos_development/`.
      5.  Servicio Negocio (`businesses.service.ts` o nuevo): Función `updateBusiness(businessId, { logoUrl: newUrl })`.
      6.  Controlador: Orquestar subida y actualización del negocio.
      7.  Servicio Perfil (`auth.service.ts` o donde se obtenga `/api/profile`): Incluir `business: { select: { ..., logoUrl: true } }` en la query del usuario para devolverlo.
    - **Pasos Frontend:**
      1.  Crear página/sección "Ajustes del Negocio" para el admin.
      2.  Componente UI: Incluir `<FileInput>` y un botón "Subir Logo" en esa página. Probablemente no necesite recorte, solo validación de tamaño/tipo.
      3.  Llamada API: Enviar archivo a `POST /api/admin/upload/business-logo`. La respuesta podría ser la URL o un mensaje de éxito (la URL se leerá del perfil).
      4.  Hook `useLayoutUserData`: Modificar para que espere y almacene `userData.business.logoUrl`.
      5.  Componente `AppHeader.tsx`: Modificar componente `Logo` para mostrar `<img>` con `src={userData.business.logoUrl}` si existe, de lo contrario mostrar `src="/loyalpymelogo.jpg"`.
    - **Consideraciones:** Manejo de caché si la URL del logo no cambia pero la imagen sí.

6.  **Personalización Negocio - Theming Básico** (`backend`, `frontend`)

    - **Prioridad:** Alta
    - **Dificultad:** Media
    - **Objetivo:** Adaptar colores primarios/secundarios de la interfaz según el negocio.
    - **Pasos Backend:** Añadir `themeIdentifier: String?` a `Business` (schema, migrate, generate). UI Admin (en "Ajustes Negocio") para seleccionar un tema (ej: 'Default', 'Restaurante', 'Tienda', 'Oscuro'). Servicio/Controlador para guardar. Devolver `themeIdentifier` en `/api/profile`.
    - **Pasos Frontend:**
      1.  Definir Temas: En `theme.ts` o archivos separados, crear objetos de tema Mantine (`createTheme`) para cada identificador, variando `primaryColor`, `colors`, `fontFamily`, etc. O definir conjuntos de variables CSS.
      2.  Aplicar Tema: En `App.tsx` o `MainLayout.tsx`, leer `userData.business.themeIdentifier`. Envolver la app en `<MantineProvider theme={getThemeObject(identifier)}>` que seleccione el objeto de tema correcto. O si es CSS, añadir clase dinámica al `<body>` o `div#root`.
      3.  Uso: Componentes que usen `color="primary"` o `theme.colors.primary[x]` usarán automáticamente los colores del tema activo.

7.  **Historial de Actividad Cliente** (`backend`, `frontend`)

    - **Prioridad:** Alta
    - **Dificultad:** Alta
    - **Objetivo:** Mostrar al cliente un log de sus acciones relevantes.
    - **Pasos Backend:**
      1.  **Modelo BD:** Crear `model PointTransaction { id, userId, businessId, type: TransactionType, pointsChange: Int, relatedId?: String, relatedType?: String, timestamp }` (Enum `TransactionType`: `QR_VALIDATION`, `REWARD_REDEEM`, `GIFT_REDEEM`, `MANUAL_ADJUST`, `REFERRAL_BONUS`, `BIRTHDAY_BONUS`, `POINT_DECAY`...).
      2.  **Lógica de Registro:** Modificar servicios (`points.service`, `customer.service`, `admin-customer-individual/bulk.service`) para que CADA VEZ que se modifiquen los puntos o se canjee algo, se cree un registro en `PointTransaction`.
      3.  **API Lectura:** Endpoint `GET /api/customer/activity` (paginado) que consulte `PointTransaction` para el `userId`, ordenado por `timestamp` descendente. Devolver datos relevantes (tipo, puntos, fecha, descripción derivada).
    - **Pasos Frontend:**
      1.  `ActivityTab.tsx`: Implementar UI.
      2.  Hook `useCustomerActivity`: Llamar a API con paginación (scroll infinito?).
      3.  UI Lista/Feed: Mostrar cada transacción con icono, descripción clara (ej: "+50 pts por QR Ticket #123", "-100 pts por Canje 'Café Gratis'", "+10 pts Regalo Cumpleaños"), fecha.

8.  **Fidelización Avanzada (Tipos de Beneficios)** (`backend`, `frontend`)

    - **Prioridad:** Media
    - **Dificultad:** Alta
    - **Objetivo:** Más opciones de beneficios para Tiers.
    - **Pasos Backend:** Ampliar Enum `BenefitType` (`PERCENTAGE_DISCOUNT`, `FIXED_DISCOUNT`, `FREE_SHIPPING`, `BIRTHDAY_BONUS_POINTS`, `BIRTHDAY_GIFT_REWARD`). Lógica de validación y aplicación en servicios (`tier-benefit.service`, `points.service`, ¿Cron Job para cumpleaños?).
    - **Pasos Frontend:** Actualizar `AddTierBenefitForm` (`<Select>`). Actualizar `TierBenefitsDisplay` y otros sitios para mostrar los nuevos beneficios de forma comprensible.

9.  **Comunicación Básica (Anuncios)** (`backend`, `frontend`)
    - **Prioridad:** Media
    - **Dificultad:** Alta
    - **Objetivo:** Permitir al admin publicar noticias/ofertas generales.
    - **Pasos Backend:** `model Announcement`. API CRUD Admin. API Lectura Cliente (`GET /api/customer/announcements`).
    - **Pasos Frontend:** UI Admin (crear/listar/borrar). UI Cliente (`OffersTab.tsx` para mostrar feed).

---

## C. TAREAS TÉCNICAS PENDIENTES 🛠️

10. **Usar Variables Entorno para Credenciales Tests** (`backend`)

    - **Prioridad:** Media
    - **Dificultad:** Media
    - **Objetivo:** Desacoplar tests de integración de credenciales admin hardcodeadas.
    - **Pasos:** Definir `TEST_ADMIN_EMAIL`/`PASSWORD` en `.env`/`.env.example`. Modificar `beforeAll` en `tests/integration/*.test.ts` para usar `process.env`. Actualizar `READMEs`/`SETUP_GUIDE.md`.

11. **Completar Pruebas Backend** (`backend`)

    - **Prioridad:** Media/Baja
    - **Dificultad:** Alta / Larga
    - **Objetivo:** Aumentar cobertura y fiabilidad.
    - **Pasos:** Tests Unitarios (servicios). Tests Integración (endpoints, errores, filtros, cron).

12. **Iniciar/Completar Pruebas Frontend** (`frontend`)

    - **Prioridad:** Media/Baja
    - **Dificultad:** Alta / Larga
    - **Objetivo:** Asegurar calidad UI/lógica.
    - **Pasos:** Tests Unitarios (hooks). Tests Componente RTL (UI compleja). Tests Renderizado.

13. **Validación Robusta Backend (Zod)** (`backend`)

    - **Prioridad:** Media
    - **Dificultad:** Media
    - **Objetivo:** Validar DTOs de entrada de forma declarativa y segura.
    - **Pasos:** Instalar `zod`. Definir schemas Zod. Middleware de validación Express.

14. **Estrategia Deployment & CI/CD** (`infra`)

    - **Prioridad:** Alta (cuando se quiera desplegar)
    - **Dificultad:** Alta
    - **Objetivo:** Despliegue automatizado y fiable.
    - **Pasos:** Decidir plataforma. Dockerizar?. Configurar builds prod. Configurar servidor/proxy. Gestionar secretos prod. Pipeline CI/CD (GitHub Actions?).

15. **Logging/Monitoring Avanzado** (`backend`, `frontend`)

    - **Prioridad:** Media (Importante para producción)
    - **Dificultad:** Media
    - **Objetivo:** Observabilidad y diagnóstico errores prod.
    - **Pasos:** Integrar Sentry/similar (FE/BE). Implementar librería logging formal (BE).

16. **Optimización Base de Datos** (`backend`)

    - **Prioridad:** Baja (Revisar si hay problemas de rendimiento)
    - **Dificultad:** Media
    - **Objetivo:** Asegurar consultas eficientes.
    - **Pasos:** Analizar queries lentas (`EXPLAIN ANALYZE`). Añadir índices (`@index`/`@@index`) en `schema.prisma`.

17. **Tipado Centralizado (`common` package)** (`infra`, `backend`, `frontend`)
    - **Prioridad:** Media/Baja (Refactor técnico)
    - **Dificultad:** Media-Alta
    - **Objetivo:** Evitar duplicación/desincronización de tipos.
    - **Pasos:** Configurar workspace (Yarn/pnpm/Nx). Mover tipos compartidos a paquete `common`. Ajustar `tsconfig.json` y imports.

---

## D. VISIÓN FUTURA (FASE 3+ / Brainstorming) 🚀

18. **App Móvil (PWA/Nativa)**

    - **Objetivo:** Mejorar experiencia móvil, notificaciones push, acceso offline básico.
    - **Concepto:** Crear PWA o app nativa (React Native) enfocada en cliente.
    - **Consideraciones:** Service workers, Expo/RN CLI, API unificada, diseño adaptado, cámara nativa, Firebase Cloud Messaging.

19. **Funcionalidades Sociales y Gifting**

    - **Objetivo:** Aumentar engagement y viralidad.
    - **Ideas:** Regalar Recompensas/Puntos cliente-a-cliente (con búsqueda, mensaje), Transferir Puntos, Programa de Referidos (códigos, bonus mutuo), Compartir Logros, Chat Simple (admin-cliente, ¿cliente-cliente?).
    - **Consideraciones:** Relaciones usuario (amigos?), búsqueda usuarios, BD, UI compleja, privacidad, moderación chat.

20. **Gamificación Avanzada**

    - **Objetivo:** Incrementar frecuencia de uso y sentimiento de logro.
    - **Ideas:** Pérdida/Bonus Puntos (Inactividad/Reactivación), Badges/Logros (hitos, UI perfil), Rachas (visitas/scans consecutivos), Retos (propuestos por admin, UI seguimiento), Leaderboards (opcional/anonimizado).
    - **Consideraciones:** Lógica backend compleja, diseño UI atractivo, configuración admin.

21. **Monetización / Compra de Puntos / Módulos**

    - **Objetivo:** Generar ingresos para PyME / Permitir a clientes acelerar / Modelo SaaS.
    - **Ideas:**
      - **Recarga Saldo:** Comprar puntos con dinero real (pasarela de pago Stripe/PayPal, definir conversión €->Puntos).
      - **Paquetes Puntos:** Ofertas tipo "Compra X, llévate Y gratis".
      - **Premium Tiers:** Niveles con beneficios muy altos que requieran suscripción mensual/anual.
      - **Módulos Opcionales (SaaS):** Vender acceso a funcionalidades avanzadas (Módulo Camarero, Módulo CRM, Módulo Analytics Pro) con suscripción.
    - **Consideraciones:** Integración pasarela pago, seguridad (PCI), lógica de negocio para suscripciones/precios/activación módulos, UI de compra/gestión suscripción.

22. **Personalización y CRM Avanzado**

    - **Objetivo:** Mejorar relación cliente y marketing dirigido.
    - **Ideas:** Bonus Cumpleaños (requiere fecha), Segmentación Clientes (UI admin para crear reglas), Ofertas Dirigidas (enviar anuncio/regalo a segmento), Feedback/Encuestas Post-Acción (con incentivo?), Recomendaciones (muy avanzado).
    - **Consideraciones:** Privacidad (fecha cumple.), UI admin potente para segmentos, posible integración email.

23. **Analíticas Avanzadas (Admin)**

    - **Objetivo:** Dar más insights al negocio.
    - **Ideas:** Análisis RFM, efectividad recompensas, gráficos distribución/migración tiers, puntos emitidos vs canjeados, LTV cliente.
    - **Consideraciones:** Queries agregación complejas, librerías gráficos (Recharts?).

24. **Operaciones y Gestión Negocio**

    - **Objetivo:** Facilitar uso operativo en el local.
    - **Ideas:**
      - **Pantalla Servicio/Comandas:** (Relacionado con idea inicial) UI simple (tablet?) para staff que muestre canjes de recompensas/regalos en tiempo real (requiere WebSockets). Podría incluir nombre cliente, mesa (si se añade), recompensa. Botón "Marcar como Servido".
      - **VIP Lists:** Flag en `User` (por Tier o manual). Filtro/vista admin. ¿Mostrar status en app cliente? ¿Integración cola?
      - **Multi-Admin/Roles:** Permitir invitar empleados con permisos limitados (Generar QR, Ver Clientes, Ver Comandas Canje). Requiere sistema de roles/permisos granular.
      - **Log de Auditoría (`AuditLog`):** Registrar acciones clave admin (ajuste puntos, cambio nivel, etc.).
    - **Consideraciones:** WebSockets para tiempo real, diseño roles/permisos, UI adaptada a staff.

25. **E2E Tests:** Cypress/Playwright para flujos críticos.
26. **Integraciones Externas:** POS, Reservas, etc.

---

Este archivo debería servir como una guía mucho más detallada para recordar qué falta y cómo abordar cada punto cuando llegue el momento. ¡Espero que esta versión más completa te sea útil!
