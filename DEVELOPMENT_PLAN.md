# LoyalPyME - Plan de Desarrollo y Futuras Funcionalidades

**Última Actualización:** 03 de Mayo de 2025

Este documento detalla las tareas pendientes inmediatas, las funcionalidades planificadas a corto/medio plazo y las ideas para la evolución futura de LoyalPyME, incluyendo consideraciones de implementación para referencia futura.

---

## A. TAREAS INMEDIATAS / CORRECCIONES TÉCNICAS ⏳📌

1.  **Arreglar Tipo `TierData`**

    - **Objetivo:** Mejorar la seguridad de tipos eliminando `as any` al acceder a `tier.benefits` en el dashboard del cliente.
    - **Archivos:**
      - `frontend/src/types/customer.ts`: Modificar la interfaz `TierData` para añadir `benefits?: TierBenefitData[];` (hacerlo opcional por si alguna API no lo devuelve siempre).
      - `frontend/src/pages/CustomerDashboardPage.tsx`: Buscar dentro del `useMemo` que calcula `tierDisplayData` (y cualquier otro lugar) los casts `as any` o similares relacionados con `tier.benefits` y eliminarlos usando el tipado correcto o comprobaciones opcionales (`?.`).
    - **Dificultad:** Baja.

2.  **Fix Mobile Popover Click en Barra de Progreso**
    - **Objetivo:** Permitir que los usuarios móviles vean los beneficios del siguiente nivel haciendo clic/tap en la barra de progreso en `UserInfoDisplay`.
    - **Archivos:** `frontend/src/components/customer/UserInfoDisplay.tsx`.
    - **Pasos:**
      1.  **Investigar:** Causa raíz (CSS `z-index`, conflicto eventos, bug Mantine `<Popover>`/`<Progress>`). Probar en dispositivo real.
      2.  **Probar Soluciones:** Envolver `Progress` en `Box`/`Group`, ajustar CSS, o usar un icono `IconInfoCircle` como trigger alternativo si persiste.
    - **Dificultad:** Media (depende de la causa).

---

## B. PRÓXIMAS FUNCIONALIDADES (FASE 2 / Prioridad Media-Alta) ⭐📝

3.  **Añadir Captura desde Cámara en `RewardForm.tsx`**

    - **Objetivo:** Permitir al admin tomar una foto con la cámara para la recompensa.
    - **Archivos:** `frontend/src/components/admin/rewards/RewardForm.tsx`.
    - **Pasos:**
      1.  Activar botón "Cámara".
      2.  Handler `onClick` que use `navigator.mediaDevices.getUserMedia`.
      3.  Mostrar stream `<video>` en un `Modal`.
      4.  Botón "Capturar" que dibuje frame en `<canvas>`.
      5.  Obtener Blob/DataURL del canvas (`toBlob`/`toDataURL`).
      6.  **Importante:** Detener stream (`track.stop()`) al capturar/cerrar modal.
      7.  Pasar DataURL a `imgSrc` de `RewardForm` para activar `ReactCrop`.
      8.  Flujo de recorte y subida (`handleConfirmCropAndUpload`) existente se encarga del resto.
    - **Dificultad:** Media.

4.  **Refinar Espaciado/Diseño `RewardList.tsx`**

    - **Objetivo:** Mejorar estética/legibilidad de tarjetas de recompensa (cliente).
    - **Archivos:** `frontend/src/components/customer/RewardList.tsx`.
    - **Pasos:** Revisar visualmente y ajustar props Mantine (`SimpleGrid` spacing, `Card` padding, `Text` size/fw/lineClamp, `Badge` size/variant). Asegurar responsive.
    - **Dificultad:** Baja-Media.

5.  **Personalización Negocio - Logo (Upload)**

    - **Objetivo:** Que el admin suba su logo para mostrarlo en la app.
    - **Pasos Backend:** Añadir `logoUrl?: String` a `Business` (schema, migrate, generate). API `POST /api/admin/upload/business-logo` (similar a reward-image, distinta carpeta Cloudinary). Servicio/Controlador para actualizar `logoUrl` en `Business`. Devolver `logoUrl` en `/api/profile` (o similar).
    - **Pasos Frontend:** Componente de subida en "Ajustes Admin" (a crear). Modificar `useLayoutUserData` para obtener `logoUrl`. Modificar `AppHeader.tsx` para mostrar `userData.business.logoUrl` o el logo estático como fallback.
    - **Dificultad:** Media-Alta.

6.  **Personalización Negocio - Theming Básico**

    - **Objetivo:** Aplicar colores/estilos basados en configuración del negocio.
    - **Pasos Backend:** Añadir `themeIdentifier?: String` (o Enum) a `Business`. UI Admin para configurarlo. Devolverlo en `/api/profile`.
    - **Pasos Frontend:** Definir temas Mantine o variables CSS por identificador. Lógica en `App.tsx` o `MainLayout.tsx` para leer identificador del `userData` y aplicar tema/clase CSS globalmente. Ajustar componentes para usar colores primarios/secundarios del tema.
    - **Dificultad:** Media.

7.  **Historial de Actividad Cliente**

    - **Objetivo:** Permitir al cliente ver sus últimas transacciones de puntos/canjes.
    - **Pasos Backend:** Decidir estrategia BD (¿Nueva tabla `PointTransaction`? - Recomendado). Crear Servicio/Controlador/Ruta `GET /api/customer/activity` (paginado).
    - **Pasos Frontend:** Crear `ActivityTab.tsx`. Hook `useCustomerActivity`. UI (Lista/Tabla) para mostrar fecha, tipo (con icono), detalle (puntos +/- , nombre recompensa), saldo resultante (opcional).
    - **Dificultad:** Alta.

8.  **Fidelización Avanzada (Tipos de Beneficios)**

    - **Objetivo:** Añadir más variedad a los beneficios de los Tiers.
    - **Pasos Backend:** Expandir Enum `BenefitType` (`PERCENTAGE_DISCOUNT`, `BIRTHDAY_GIFT_REWARD`, etc.). Validar `value` en `tier-benefit.service`. Implementar lógica de aplicación (¿Cron Job para cumpleaños? ¿Ajuste en `points.service` para multiplicadores?).
    - **Pasos Frontend:** Actualizar `<Select>` en `AddTierBenefitForm`. Actualizar display (`UserInfoDisplay`, etc.) para mostrar nuevos beneficios formateados.
    - **Dificultad:** Alta.

9.  **Comunicación Básica (Anuncios)**
    - **Objetivo:** Permitir al admin enviar anuncios simples a clientes.
    - **Pasos Backend:** `model Announcement` (schema, migrate, generate). API CRUD Admin (`/api/admin/announcements`). API lectura cliente (`GET /api/customer/announcements`).
    - **Pasos Frontend:** UI Admin (crear/listar/borrar). UI Cliente (`OffersTab.tsx` para mostrar feed).
    - **Dificultad:** Alta.

---

## C. TAREAS TÉCNICAS PENDIENTES 🛠️

10. **Usar Variables Entorno para Credenciales Tests**

    - **Objetivo:** Desacoplar tests de integración de credenciales admin hardcodeadas.
    - **Pasos:** Definir `TEST_ADMIN_EMAIL`/`PASSWORD` en `.env`/`.env.example`. Modificar `beforeAll` en `tests/integration/*.test.ts` para usar `process.env`. Actualizar READMEs con instrucciones. (Asegurarse de que el usuario/pass existe en la BD de test antes de ejecutar).
    - **Dificultad:** Media.

11. **Completar Pruebas Backend**

    - **Objetivo:** Aumentar cobertura tests unitarios y de integración.
    - **Pasos:** Tests Unitarios (servicios restantes). Tests Integración (endpoints, casos error, filtros, cron).
    - **Dificultad:** Alta / Larga.

12. **Iniciar/Completar Pruebas Frontend**

    - **Objetivo:** Asegurar calidad UI/lógica.
    - **Pasos:** Tests Unitarios (hooks). Tests Componente RTL (elementos UI clave). Tests Renderizado Páginas.
    - **Dificultad:** Alta / Larga.

13. **Validación Robusta Backend (Zod)**

    - **Objetivo:** Mejorar validación DTOs/payloads.
    - **Pasos:** Instalar `zod`. Definir schemas Zod. Crear/usar middleware de validación en rutas Express antes de los controladores.
    - **Dificultad:** Media.

14. **Estrategia Deployment & CI/CD**

    - **Objetivo:** Desplegar a producción de forma automatizada.
    - **Pasos:** Decidir plataforma (Docker+VPS/CloudRun?, Vercel+Render?). Crear Dockerfiles si aplica. Configurar build prod. Configurar servidor web/proxy. Gestionar secrets prod. Configurar GitHub Actions (o similar) para build, test, deploy.
    - **Dificultad:** Alta.

15. **Logging/Monitoring Avanzado**

    - **Objetivo:** Mejorar observabilidad y captura de errores prod.
    - **Pasos:** Integrar Sentry (FE/BE). Configurar librería de logging formal (Winston/Pino) en BE.
    - **Dificultad:** Media.

16. **Optimización Base de Datos**

    - **Objetivo:** Asegurar rendimiento con más datos.
    - **Pasos:** Analizar consultas (`EXPLAIN ANALYZE`). Añadir índices (`@index`/`@@index`) en `schema.prisma` a columnas clave usadas en `WHERE`/`ORDER BY`.
    - **Dificultad:** Media.

17. **Tipado Centralizado (`common` package)**
    - **Objetivo:** Compartir tipos entre FE/BE.
    - **Pasos:** Investigar/implementar workspace (Yarn/pnpm/Nx). Mover tipos compartidos a paquete `common`. Configurar `tsconfig.json` (references). Refactorizar imports.
    - **Dificultad:** Media-Alta.

---

## D. VISIÓN FUTURA (FASE 3+ / Exploratorio) 🚀

18. **App Móvil (PWA/Nativa)**

    - **Objetivo:** Mejorar experiencia móvil, notificaciones push, acceso offline básico.
    - **Concepto:** Crear una PWA (Progressive Web App) desde el frontend actual o una app nativa (React Native) enfocada en el cliente.
    - **Pasos/Consideraciones:** Service workers para PWA. Expo/React Native CLI para nativa. API unificada. Diseño adaptado. Acceso a cámara nativa (más fiable que navegador). Notificaciones push (Firebase Cloud Messaging?).

19. **Funcionalidades Sociales y Gifting**

    - **Objetivo:** Aumentar engagement y viralidad.
    - **Concepto:** Permitir interacción entre clientes del mismo negocio.
      - **Regalar Recompensas/Puntos:** Botón "Regalar" en recompensa, cliente busca a otro cliente (¿por email?), usa sus puntos, añade mensaje. Notificaciones.
      - **Transferir Puntos:** Opción en perfil para enviar X puntos a otro cliente. Límites/fees configurables por admin.
      - **Programa de Referidos:** Generar código único por cliente. Nuevo cliente introduce código al registrarse -> ambos reciben bonus de puntos. UI admin para ver referidos.
      - **Compartir Logros/Actividad:** Opción de compartir en un "muro" simple o externamente (si se sube de nivel, canjea algo especial).
      - **Chat Simple:** (Dependencia mayor) Mensajería básica admin-cliente o cliente-cliente (requiere moderación/control).
    - **Pasos/Consideraciones:** Necesita definir relaciones entre usuarios (¿amigos?). Búsqueda de usuarios. Nuevas tablas/lógica en BD. UI compleja. Privacidad.

20. **Gamificación Avanzada**

    - **Objetivo:** Incrementar frecuencia de uso y sentimiento de logro.
    - **Concepto:** Añadir mecánicas de juego.
      - **Pérdida/Bonus Puntos por Inactividad/Reactivación:** Configurable por admin. Comunicación clara al usuario.
      - **Badges/Logros:** Definir hitos (1er canje, N visitas, Nivel X). Crear entidad `Badge` y `UserBadge`. Diseñar iconos. Mostrar en perfil. Notificaciones.
      - **Rachas (Streaks):** Contar visitas/scans consecutivos. Lógica en backend para detectar y premiar. UI para mostrar racha actual/récord.
      - **Retos (Challenges):** Admin crea retos (ej: "Visítanos 3 veces esta semana"). Entidad `Challenge` y `UserChallengeProgress`. UI admin/cliente. Premios (puntos/badges).
      - **Leaderboards:** (Opcional, privacidad) Tablas de clasificación (puntos/visitas) semanal/mensual. Requiere agregaciones y considerar anonimización/opt-in.
    - **Pasos/Consideraciones:** Aumenta complejidad lógica backend. Necesita diseño UI atractivo.

21. **Monetización / Compra de Puntos**

    - **Objetivo:** Generar ingresos adicionales para la PyME, permitir a clientes alcanzar recompensas antes.
    - **Concepto:** Permitir comprar puntos con dinero real.
    - **Pasos/Consideraciones:** Integración pasarela de pago (Stripe es popular, requiere cuenta Stripe). Definir conversión € -> Puntos. Crear API/UI para seleccionar paquete/cantidad, procesar pago, añadir puntos (transacción segura). Cumplimiento normativas pago (PCI DSS si se manejan tarjetas directamente, menos si se usa Stripe Elements/Checkout).

22. **Personalización y CRM Avanzado**

    - **Objetivo:** Mejorar relación con cliente y permitir marketing dirigido.
    - **Concepto:** Usar datos del cliente para acciones personalizadas.
      - **Bonus Cumpleaños:** Requiere pedir fecha nacimiento (opcional, aviso privacidad). Cron job diario busca cumpleaños y otorga puntos/regalo.
      - **Segmentación Clientes:** UI Admin para crear segmentos (ej: Nivel > X, Última visita > Y meses, Ha canjeado Recompensa Z).
      - **Ofertas Dirigidas:** Permitir al admin enviar un anuncio/oferta/regalo solo a un segmento específico.
      - **Feedback/Encuestas:** Mecanismo simple para pedir valoración tras interacción (QR/Canje). Guardar respuestas. UI admin para ver resultados.
      - **Recomendaciones:** (Muy avanzado) Sugerir recompensas basadas en historial.
    - **Pasos/Consideraciones:** Complejidad queries/lógica segmentación. UI admin potente. Potencial integración email para ofertas.

23. **Analíticas Avanzadas (Admin)**

    - **Objetivo:** Dar más información útil al negocio sobre el programa.
    - **Concepto:** Calcular y visualizar métricas clave.
    - **Pasos/Consideraciones:** RFM (Recencia, Frecuencia, Monetario/Puntos). Tasa de canje por recompensa. Gráficos de distribución de clientes por nivel. Evolución de puntos emitidos vs canjeados. UI con gráficos (Chart.js, Recharts?). Queries de agregación complejas en backend.

24. **Operaciones y Gestión Negocio**

    - **Objetivo:** Facilitar gestión del programa.
    - **Concepto:** Herramientas adicionales para el admin.
      - **VIP Lists:** Derivado de Tiers o manual. Flag en `User`. Filtro/vista en tabla clientes admin. ¿Forma de mostrarlo en cliente (App)?
      - **Multi-Admin:** Permitir al admin principal invitar a otros usuarios (con email existente o nuevo) con rol `BUSINESS_EMPLOYEE` (nuevo rol?) con permisos limitados (ej: solo generar QR, solo ver clientes). Requiere lógica de roles/permisos más granular.
      - **Log de Auditoría (`AuditLog`):** Registrar acciones importantes (cambio de nivel manual, ajuste de puntos admin, cambio config tiers, etc.) con timestamp y usuario admin responsable.
    - **Pasos/Consideraciones:** Nuevos roles/permisos backend. UI admin para gestión empleados/auditoría.

25. **E2E Tests:** Cypress/Playwright para flujos críticos completos.
26. **Integraciones Externas:** (Muy futuro) POS, Reservas, etc.

---

Este archivo lo puedes guardar como `DEVELOPMENT_PLAN.md` en la raíz de tu proyecto y mantenerlo actualizado a medida que completes tareas o surjan nuevas ideas. ¡Espero que esta versión más detallada te sea más útil a largo plazo!
