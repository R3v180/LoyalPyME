# LoyalPyME - Estado del Proyecto y Hoja de Ruta Detallada 🧭

**Versión:** 1.9.1 (Post-Tabs Refactor, Pre-Image Upload)
**Fecha de Última Actualización:** 01 de Mayo de 2025

---

## 1. Resumen General del Proyecto LoyalPyME 🎯

- **Concepto:** Plataforma web full-stack (React/Node.js) para que las PyMEs (Pequeñas y Medianas Empresas) gestionen programas de fidelización digital para sus clientes finales[cite: 2]. El sistema permite configurar recompensas, niveles (tiers) basados en la actividad del cliente, y acumular/canjear puntos mediante interacciones digitales (ej. QR).
- **Componentes Principales:**
  - **Backend (Node.js/Express/Prisma/PostgreSQL):** API RESTful que maneja toda la lógica de negocio (usuarios, negocios, puntos, niveles, recompensas, autenticación JWT, etc.) y la interacción con la base de datos[cite: 7]. Incluye tareas programadas (cron) para mantenimiento (ej. cálculo/descenso de niveles).
  - **Frontend (React/Vite/Mantine/TypeScript):** Interfaz de usuario web con dos áreas principales:
    - **Panel de Administración:** Para dueños/empleados de la PyME. Permite configurar el programa de fidelización (reglas de niveles, puntos por euro, etc.), gestionar clientes (CRUD, filtros, acciones masivas, notas, regalos), gestionar recompensas (CRUD), gestionar niveles/beneficios (CRUD), generar códigos QR para puntos, y ver estadísticas básicas[cite: 2].
    - **Portal de Cliente:** Para los clientes finales de la PyME. Organizado por pestañas ("Resumen", "Recompensas", placeholders para "Actividad", "Ofertas", "Perfil"). Permite ver saldo de puntos, nivel actual y sus beneficios, progreso al siguiente nivel (con preview de beneficios en Tooltip/Popover), validar códigos QR (escaneando o manualmente), ver recompensas/regalos disponibles, y canjearlos[cite: 2]. Incluye un snippet resumen de regalos/recompensas en la pestaña principal.
- **Propósito:** Dotar a las PyMEs de una herramienta digital moderna, completa y **adaptable a diferentes sectores** (hostelería, retail, servicios, B2B)[cite: 276, 218] para fidelizar clientes, fomentar la recurrencia, mejorar la relación y diferenciarse de la competencia[cite: 212, 216], ofreciendo una experiencia clara y valiosa al cliente final.
- **Visión a Largo Plazo:** Evolucionar hacia una plataforma con **personalización visual avanzada por negocio/sector**, **comunicación integrada** (email, notificaciones push en futura app), **funcionalidades CRM ligeras** (segmentación, historial), **app móvil nativa**, **analítica avanzada** y potencialmente **ecosistemas de fidelización compartidos** y elementos sociales[cite: 5, 204, 207].

---

## 2. Stack Tecnológico 🛠️

- **Frontend:** React (v19), TypeScript, Vite, Mantine UI (v7+), @mantine/hooks, @mantine/form, zod (validación forms), @mantine/notifications, @mantine/modals, axios (instancia `axiosInstance` autenticada + base), react-router-dom (v6+), qrcode.react, html5-qrcode, i18next, react-i18next, i18next-http-backend, i18next-browser-languagedetector, react-country-flag, (`vite-plugin-mkcert` dev).
- **Backend:** Node.js, Express, TypeScript, Prisma (ORM), PostgreSQL, jsonwebtoken, bcryptjs, dotenv, node-cron, uuid, cors, date-fns, vitest & supertest (testing), swagger-jsdoc & swagger-ui-express (API Docs).
- **Otros:** Git, Yarn v1.

---

## 3. Estado Actual Detallado (Hitos Completados - v1.9.1) ✅

- **Fase 1 (Núcleo Operativo + Pulido):** **COMPLETADA.**
  - Funcionalidades base estables y refactorizadas: Autenticación completa (Login, Registro Cliente/Negocio, Reset Password), CRUDs Admin (Recompensas, Niveles/Tiers, Gestión Clientes completa con filtros/búsqueda/ordenación/acciones individuales y masivas, Notas Admin), Flujo Puntos/QR (Generación Admin, Validación/Escaneo Cliente), Lógica de Cálculo/Descenso de Tiers (Backend + Cron), Paneles Admin/Cliente básicos funcionales.
- **Fase 2 (Funcionalidades Iniciales y Mejoras UI/UX):** **PARCIALMENTE COMPLETADA.**
  - ✅ **Internacionalización (i18n) Frontend:** 100% completada (ES/EN), textos externalizados, selector de idioma funcional.
  - ✅ **Documentación API (Swagger):** Implementada y funcional (`/api-docs`).
  - ✅ **Testing Backend (Inicial):** Setup Vitest/Supertest OK, DI aplicada para mocks Prisma, ~18 tests unitarios y ~34 de integración básicos pasando.
  - ✅ **Refactor Panel Cliente a Tabs:** Layout principal del cliente ahora usa pestañas (`Resumen`, `Recompensas`, placeholders futuros). Componentes extraídos (`SummaryTab`, `RewardsTab`, etc.).
  - ✅ **Mejoras UI/UX `UserInfoDisplay`:**
    - Muestra correctamente beneficios del nivel actual.
    - Muestra barra de progreso funcional.
    - Preview beneficios siguiente nivel implementada con **Tooltip (hover desktop) / Popover (click móvil)** sobre barra de progreso (**FIX PENDIENTE:** clic en móvil simulado no funciona).
  - ✅ **Mejora UI/UX `SummaryTab`:**
    - Implementado snippet "Resumen Recompensas/Regalos".
    - Muestra contador de regalos pendientes.
    - Muestra hasta **4 previews** (regalos->asequibles) con layout horizontal adaptable y placeholders de imagen + texto más grandes.
    - Incluye botón "Ver Todas".
  - ✅ **Layout Header Móvil (`AppHeader`):** Corregido solapamiento usando menú Burger para controles de usuario/idioma/logout.
  - ✅ **Placeholders Imágenes Recompensas:** Añadido esqueleto 1:1 en `RewardList.tsx`.
  - ✅ **Dependencias Obsoletas Limpiadas** (`react-qr-reader` eliminada).

---

## 4. Key Concepts & Design Decisions (Actualizado) 🔑

- **Separación Puntos vs. Nivel:** (Sin cambios conceptuales) Nivel basado en actividad (`business.tierCalculationBasis`), Puntos (`User.points`) son la moneda canjeable. La UI refleja esto.
- **Orden de Niveles:** Natural (`level` numérico ascendente).
- **Actualización Nivel:** Automática tras QR o por Cron Job. Admin puede cambiar manualmente. Ajuste de puntos admin no afecta directamente (salvo si `basis=POINTS_EARNED`).
- **Layout Panel Cliente:** Basado en **Tabs** (`Resumen`, `Recompensas`, `Actividad`, `Ofertas`, `Perfil`). La Tab "Resumen" actúa como dashboard principal.
- **Layout Tab "Resumen":** `Stack` vertical: `UserInfoDisplay`, `QrValidationSection`, `Card` de Resumen de Recompensas.
- **Preview Siguiente Nivel:** Se muestra en `Tooltip` (hover desktop) o `Popover` (click mobile - PENDIENTE FIX) activado desde la barra de progreso en `UserInfoDisplay`.
- **Snippet Resumen Recompensas:** Muestra contador regalos + hasta 4 previews (Regalos->Asequibles) en `SimpleGrid` responsivo (ej: 2 cols base, 4 cols sm+). Cada preview es un bloque (`Paper`+`Stack`) con Skeleton (80x80) + Texto + Badge/Puntos. Botón "Ver Todas" debajo. **No** incluye canje directo por ahora para mantener limpieza.
- **Aspect Ratio Imágenes Recompensas:** Definido como **1:1 (Cuadrado)** para consistencia en `RewardList` y futuras implementaciones.
- **Header Móvil:** Usa menú Burger para controles de usuario, idioma y logout para evitar solapamientos.

---

## 5. Lecciones Aprendidas & Troubleshooting Clave 💡

- (Sin cambios respecto a v1.8.0 - Ver `TROUBLESHOOTING_GUIDE.md` o prompt inicial)
  - Workflow Backend Dev (2 terminales, no `yarn dev`).
  - Importancia `npx prisma generate`.
  - Mocking Prisma con DI.
  - Manejo errores Prisma (P2002->409, etc.).
  - Refresco Forzado Frontend (Vite HMR).
  - Resolución Errores TS (Centralizar Tipos, verificar nombres, limpiar caché).
  - Tipado explícito en Hooks/Callbacks.
  - Errores comunes JSX props (`icon: <Comp />`, props numéricas a SVG).
  - Testing Integración (Supertest 401 `text/plain`, validar datos setup, errores específicos).
  - i18n (ubicación JSON, `react-country-flag`).
  - **NUEVO APRENDIDO:** Las props responsive de Mantine (`hiddenFrom`, `visibleFrom`) pueden no funcionar directamente en todos los componentes (ej: `<Menu>`), requiriendo envolverlos en `<Box>` o `<Group>`.
  - **NUEVO APRENDIDO:** El componente `<Popover>` por defecto se activa con `click`, `<Tooltip>` por defecto con `hover`. `<Tooltip>` no tiene prop `width` o `shadow` directas como `<Popover>`. La prop `trigger` en `<Popover>` puede dar errores TS (investigar causa o alternativa).

---

## 6. Setup, Comandos y Acceso ⚙️

- (Sin cambios respecto a v1.8.0 - Ver prompt inicial o README)
  - Prerrequisitos: Node, Yarn, PostgreSQL.
  - Setup Backend: `cd backend`, `yarn install`, `.env`, `prisma migrate dev`, `prisma generate`, `(prisma db seed?)`.
  - Setup Frontend: `cd frontend`, `yarn install`.
  - Correr Backend Dev: `npx tsc --watch` & `npx nodemon dist/index.js` (Puerto 3000).
  - Correr Frontend Dev: `yarn dev --host` (Puerto 5173 HTTPS).
  - Build Prod: `yarn build` en ambos.
  - Correr Prod: `node dist/index.js`, servir estáticos `frontend/dist`.
  - Testing Backend: `yarn test` / `test:watch` / `test:coverage`.
  - Testing Frontend: `yarn test` / `test:watch` / `test:coverage`.
  - API Docs: `http://localhost:3000/api-docs`.
  - Credenciales Ejemplo Admin: `admin@cafeelsol.com` / `superpasswordseguro`.

---

## 7. 🗺️ Hoja de Ruta Detallada y Tareas Pendientes (v1.9.1)

_Leyenda: ✅=Completado | ⏳=Pendiente Inmediato/Técnico | ⭐=Próxima Gran Funcionalidad | 📝=Pendiente Fase 2+ | 🛠️=Técnico Fase 2+ | 🚀=Visión Futura_

**A. TAREAS INMEDIATAS / CORRECCIONES TÉCNICAS:**

1.  ⏳ **Arreglar Tipo `TierData`:** _(Técnico Rápido)_
    - **Objetivo:** Eliminar casts temporales (`as any`, etc.) y mejorar seguridad de tipos.
    - **Tareas:**
      - Modificar `interface TierData` en `frontend/src/types/customer.ts`.
      - Añadir `benefits?: TierBenefitData[];` (marcar como opcional por si alguna llamada API no lo incluye siempre).
      - Buscar y eliminar casts relacionados con `tier.benefits` en `CustomerDashboardPage.tsx` (en el `useMemo` de `tierDisplayData`) y donde sea necesario.
2.  📌 **Fix Mobile Popover Click:** _(Bug UX Móvil)_
    - **Objetivo:** Hacer que la preview del siguiente nivel funcione al tocar la barra de progreso en móvil.
    - **Tareas:**
      - Investigar por qué el `<Popover>` con trigger por defecto (clic) no se activaba en la simulación móvil (podría ser problema de la simulación, del CSS, de eventos solapados, o bug Mantine).
      - Probar en dispositivo real si es posible.
      - Ajustar la implementación en `UserInfoDisplay.tsx`: asegurar que el `<Popover.Target>` (el `<Progress>`) sea 'clickeable' en móvil, verificar CSS z-index, considerar alternativas si persiste (ej. un pequeño icono `IconInfoCircle` al lado de la barra que _sí_ sea clickeable y abra el Popover/Modal).

**B. PRÓXIMA GRAN FUNCIONALIDAD:**

3.  ⭐ **Implementar Imágenes Recompensas:** _(Prioridad ALTA)_
    - **Objetivo:** Permitir a los admins subir imágenes para las recompensas y mostrarlas a los clientes.
    - **Sub-Tareas Backend:**
      - [BE-IMG-1] Modificar `schema.prisma`: Añadir `imageUrl: String?` a `model Reward`.
      - [BE-IMG-2] Ejecutar `npx prisma migrate dev --name add_reward_image_url`.
      - [BE-IMG-3] Ejecutar `npx prisma generate`.
      - [BE-IMG-4] **Decidir Estrategia Storage:** Cloudinary (recomendado por facilidad/plan gratuito), AWS S3, Google Cloud Storage, o Almacenamiento Local (NO recomendado para producción). Configurar credenciales en `.env`.
      - [BE-IMG-5] Instalar SDK necesario (ej: `cloudinary`, `aws-sdk`).
      - [BE-IMG-6] Crear Endpoint API Upload: `POST /api/admin/rewards/upload-image` (o similar).
        - Usar `multer` para manejar `multipart/form-data`.
        - Validar tipo/tamaño de archivo.
        - Subir archivo al servicio de storage elegido.
        - Devolver la URL pública segura de la imagen subida.
      - [BE-IMG-7] Modificar Servicios/Controladores Rewards (`rewards.service.ts`, `rewards.controller.ts`):
        - Actualizar `createReward` y `updateReward` para aceptar y guardar `imageUrl`.
        - Actualizar `findRewardsByBusiness` y `findRewardById` (y otros si aplica, como en `customer.service`) para incluir `imageUrl` en los datos devueltos.
    - **Sub-Tareas Frontend (Admin):**
      - [FE-ADM-IMG-1] Componente `RewardForm.tsx` (`src/components/admin/rewards/`):
        - Añadir `<FileInput>` de Mantine para seleccionar archivo.
        - Añadir (opcionalmente) lógica para acceder a cámara en móvil (`navigator.mediaDevices.getUserMedia`).
        - Mostrar preview de imagen seleccionada/actual.
        - Integrar librería de recorte (ej: `react-image-crop`) configurada a aspect ratio **1:1**.
        - Añadir estado para manejar el archivo seleccionado/recortado y la `imageUrl` final.
      - [FE-ADM-IMG-2] Lógica `AdminRewardsPage.tsx` / `useAdminRewards.ts`:
        - Modificar DTOs (`CreateRewardDto`, `UpdateRewardDto`) para manejar la imagen.
        - Al guardar/crear:
          - Si hay imagen nueva/recortada: Llamar al endpoint de upload del backend.
          - Obtener la `imageUrl` devuelta.
          - Enviar `imageUrl` en la petición POST/PUT/PATCH a `/api/rewards`.
        - Al editar: Mostrar imagen actual (`reward.imageUrl`), permitir cambiarla/eliminarla.
    - **Sub-Tareas Frontend (Cliente):**
      - [FE-CUST-IMG-1] Componente `RewardList.tsx` (`src/components/customer/dashboard/`):
        - Importar `Image` de Mantine.
        - Dentro del `map`, en el `<AspectRatio>`, reemplazar `<Skeleton>` por `<Image src={reward.imageUrl} alt={reward.name} fallbackSrc="/placeholder-reward.png" fit="cover" />` (usar un placeholder local si `imageUrl` es null/undefined).
      - [FE-CUST-IMG-2] Componente `SummaryTab.tsx` (`src/components/customer/dashboard/tabs/`):
        - Importar `Image` de Mantine.
        - Dentro del `map` de `previewItems`, reemplazar `<Skeleton>` por `<Image src={item.imageUrl} alt={item.name} fallbackSrc="/placeholder-reward.png" fit="cover" h={80} w={80} radius="sm" />` (o usar el Skeleton si `imageUrl` no existe en `previewItems`).

**C. CONTINUACIÓN FASE 2 (Pendiente):**

4.  📝 **Refinar Espaciado/Diseño `RewardList`:** _(Visual - Prioridad Media)_
    - **Objetivo:** Mejorar legibilidad y estética general de las tarjetas de recompensa.
    - **Tareas:** Revisar `RewardList.tsx`. Ajustar `spacing` del `SimpleGrid`, `padding`/`margin` interno de las `<Card>`, tamaño/peso de fuentes (`Text`), estilos de `<Badge>`, `lineClamp` para descripciones, etc. Asegurar buen responsive.
5.  📝 **Personalización Negocio - Logo:** _(Funcional - Prioridad Alta)_
    - **Objetivo:** Permitir al admin subir un logo y mostrarlo en los Layouts.
    - **Tareas:** Similar a Imágenes Recompensas (BE: Schema Business, Storage, API Upload/Get; FE Admin: Componente upload en settings; FE Layout: Mostrar `<img>` en `AppHeader`).
6.  📝 **Personalización Negocio - Theming Básico:** _(Funcional - Prioridad Alta)_
    - **Objetivo:** Aplicar estilos visuales diferentes basados en el tipo de negocio.
    - **Tareas:** BE (añadir `themeIdentifier` a Business), FE (definir variables CSS/Temas Mantine por identificador, lógica JS para aplicar clase a `<body>`, ajustar CSS componentes).
7.  📝 **Historial de Actividad Cliente:** _(Funcional - Prioridad Alta - Requiere Backend)_
    - **Objetivo:** Que el cliente vea sus últimos movimientos (puntos, canjes).
    - **Tareas:** BE (Endpoint `GET /api/customer/activity` que consulte `QrCode`, `GrantedReward` - quizás crear tabla `PointTransaction`), FE (Crear `ActivityTab.tsx`, consumir endpoint, mostrar lista/tabla).
8.  📝 **Fidelización Avanzada:** _(Funcional - Prioridad Media)_
    - **Objetivo:** Ofrecer más tipos de beneficios/recompensas.
    - **Tareas:** BE (Modificar/ampliar `BenefitType` enum, lógica en `TierBenefit.service`, lógica de aplicación - ej. en `points.service` para bonus), FE (UI Admin para configurar nuevos tipos, UI Cliente para visualizarlos). Ejemplos: `% Descuento`, `Bonus Cumpleaños`, `Bonus por Nivel`.
9.  📝 **Comunicación Básica:** _(Funcional - Prioridad Media)_
    - **Objetivo:** Permitir al admin enviar mensajes básicos.
    - **Tareas:** BE (Entidad `Announcement`?, API CRUD Anuncios, ¿Setup servicio Email transaccional básico?), FE (UI Admin para crear/listar anuncios, UI Cliente - Tab "Ofertas/Noticias" para mostrar feed).

**D. TAREAS TÉCNICAS (Pendiente):**

10. 🛠️ **Completar Pruebas Backend:** _(Técnico - Prioridad Media/Baja)_
    - **Objetivo:** Aumentar cobertura y robustez.
    - **Tareas:** Tests Unitarios (Servicios restantes: points, tiers, customer), Tests Integración (Todos endpoints Admin, casos error 40x/500, filtros/ordenación complejos, lógica de tiers/cron).
11. 🛠️ **Iniciar/Completar Pruebas Frontend:** _(Técnico - Prioridad Media/Baja)_
    - **Objetivo:** Asegurar calidad y evitar regresiones en UI/lógica.
    - **Tareas:** Tests Unitarios Hooks (completar), Tests Componente con RTL (UserInfoDisplay, RewardList, QrValidation, Forms, Modals, Tabs, Layouts), Tests básicos renderizado Páginas.
12. 🛠️ **Validación Robusta Backend:** Investigar/Implementar Zod u otra librería para validación DTOs en controladores/rutas.
13. 🛠️ **Estrategia Deployment:** Definir cómo se desplegará (Docker?, Vercel/Netlify + Render/Heroku?, VPS?). Crear `Dockerfile`s. Configurar CI/CD básico (GitHub Actions?).
14. 🛠️ **Logging/Monitoring Avanzado:** Integrar Sentry o similar para captura de errores FE/BE en producción. Mejorar estructura de logs actuales.
15. 🛠️ **Optimización Base de Datos:** Revisar consultas lentas (si las hay), añadir índices necesarios a `schema.prisma` (ej. en `userId`, `businessId`, `status`, fechas).
16. 🛠️ **Tipado Centralizado:** Investigar creación de paquete `common` (workspace yarn/npm/pnpm?) para compartir tipos (`src/types`) entre Frontend y Backend y evitar duplicación/desincronización.

**E. VISIÓN FUTURA (Fase 3+):**

17. 🚀 **App Móvil Nativa/PWA:** _(Prioridad Baja/Fase 3)_
    - **Objetivo:** Mejorar experiencia cliente en móvil.
    - **Tareas:** Decidir tecnología (React Native vs PWA), desarrollar app enfocada en cliente (estado, recompensas, escaner nativo, notificaciones push).
18. 🚀 **Análisis Avanzado (Admin):** _(Prioridad Baja/Fase 3-4)_
    - **Objetivo:** Dar más insights al negocio.
    - **Tareas:** BE (Endpoints para métricas complejas: RFM, efectividad recompensas), FE (Componentes gráficos/tablas en Panel Admin).
19. 🚀 **Segmentación y CRM Ligero:** _(Prioridad Baja/Fase 3-4)_
    - **Objetivo:** Permitir marketing más dirigido.
    - **Tareas:** BE (Lógica segmentación guardada), FE (UI Admin para crear/gestionar segmentos). Implementar `AuditLog`.
20. 🚀 **E2E Tests:** _(Prioridad Baja/Fase 3)_
    - **Objetivo:** Testear flujos críticos completos.
    - **Tareas:** Setup Cypress/Playwright, escribir tests para Registro, Login, Validación QR, Canje, etc.
21. 🚀 **Ecosistemas y Funcionalidades Sociales:** _(Prioridad Baja/Fase 4-5 - Exploratorio)_
    - **Objetivo:** Crear valor añadido y comunidad.
    - **Tareas:** Explorar viabilidad técnica/negocio de programas compartidos, eventos, chat, gamificación avanzada (badges, desafíos), mapas actividad (anonimizados).

---

## 8. 🤝 Flujo de Trabajo Acordado

- Se mantiene sin cambios (Revisar Roadmap, Priorizar Tareas Pendientes, Código Completo, Flujos Dev, Git).

---

## 9. Información Adicional ℹ️

- Licencia: **AGPL v3.0**.

---

## 10. Próximo Paso Propuesto 👉

Iniciar la **Tarea 3: Implementar Imágenes Recompensas**, empezando por las modificaciones necesarias en el **Backend** (Schema, Migración, Storage, API).
