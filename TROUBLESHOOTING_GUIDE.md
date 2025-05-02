# LoyalPyME - Estado del Proyecto y Hoja de Ruta Detallada 🧭

**Versión:** 1.11.0 (Post-Reward Images, Logo, Header/Scanner Fixes)
**Fecha de Última Actualización:** 02 de Mayo de 2025

---

## 1. Resumen General del Proyecto LoyalPyME 🎯

- **Concepto:** Plataforma web full-stack (React/Node.js) para que las PyMEs gestionen programas de fidelización digital. Permite configurar recompensas (con imágenes 1:1 subidas a Cloudinary), niveles (tiers) basados en métricas configurables, y acumular/canjear puntos mediante QR.
- **Componentes Principales:**
  - **Backend (Node.js/Express/Prisma/PostgreSQL):** API RESTful que maneja lógica de negocio (usuarios, negocios, puntos, tiers, recompensas con `imageUrl`, autenticación JWT), interacción con BD (PostgreSQL vía Prisma), subida de imágenes (Multer + Cloudinary SDK), y tareas programadas (cron para tiers).
  - **Frontend (React/Vite/Mantine/TypeScript):** Interfaz web con dos áreas:
    - **Panel de Administración:** Configuración del programa (tiers, reglas, etc.), gestión de clientes (CRUD, filtros, acciones masivas, notas), gestión de recompensas (CRUD + subida/recorte de imágenes 1:1), gestión de niveles/beneficios (CRUD), generación QR puntos, estadísticas básicas. Cabecera muestra logo estático y contenido restringido en ancho.
    - **Portal de Cliente:** Organizado por pestañas (`Resumen`, `Recompensas`, placeholders `Actividad`, `Ofertas`, `Perfil`). Muestra estado (puntos, nivel con beneficios), progreso a siguiente nivel (con preview beneficios en Tooltip/Popover), validación QR (manual o escáner móvil vía `html5-qrcode`), lista de recompensas/regalos disponibles (mostrando imágenes 1:1), canje. Snippet resumen en `Resumen` muestra imágenes. Cabecera muestra logo estático y contenido restringido.
- **Propósito:** Herramienta digital completa y adaptable (multi-sector) para fidelizar clientes, fomentar recurrencia, mejorar relación y diferenciarse, ofreciendo experiencia clara y valiosa al cliente final.
- **Visión a Largo Plazo:** Personalización visual avanzada, comunicación integrada (email/push), CRM ligero, app móvil nativa, analítica avanzada, ecosistemas compartidos, elementos sociales.

---

## 2. Stack Tecnológico 🛠️

- **Frontend:** React (v19), TypeScript, Vite, Mantine UI (v7+), @mantine/hooks, @mantine/form, zod, @mantine/notifications, @mantine/modals, axios (instancia `axiosInstance` + base), react-router-dom (v6+), qrcode.react, **html5-qrcode**, i18next, react-i18next, i18next-http-backend, i18next-browser-languagedetector, react-country-flag, **react-image-crop**, (`vite-plugin-mkcert` dev).
- **Backend:** Node.js, Express, TypeScript, Prisma (ORM), PostgreSQL, jsonwebtoken, bcryptjs, dotenv, node-cron, uuid, cors, date-fns, **cloudinary**, **multer**, **streamifier**, vitest & supertest (testing), swagger-jsdoc & swagger-ui-express (API Docs).
- **Otros:** Git, Yarn v1.

---

## 3. Estado Actual Detallado (Hitos Completados - v1.11.0) ✅

- **Fase 1 (Núcleo Operativo + Pulido):** **COMPLETADA.**
  - Funcionalidades base estables y refactorizadas.
- **Fase 2 (Funcionalidades Iniciales y Mejoras UI/UX):** **AVANZANDO SIGNIFICATIVAMENTE.**
  - ✅ **Internacionalización (i18n) Frontend:** Completada (ES/EN).
  - ✅ **Documentación API (Swagger):** Implementada.
  - ✅ **Testing Backend (Inicial):** Setup OK, cobertura básica.
  - ✅ **Refactor Panel Cliente a Tabs:** Completado (`SummaryTab`, `RewardsTab`, etc.).
  - ✅ **Mejoras UI/UX `UserInfoDisplay`:** Beneficios actuales, barra progreso, preview siguiente nivel (popover móvil pendiente).
  - ✅ **Mejora UI/UX `SummaryTab`:** Snippet resumen recompensas/regalos implementado.
  - ✅ **Layout Header Móvil (`AppHeader`):** Corregido solapamiento (Burger Menu).
  - ✅ **Implementación Imágenes en Recompensas (Tarea 3):** Completado.
    - **Backend:**
      - `Reward.imageUrl` añadido a `schema.prisma` y migrado a DB.
      - Cloudinary configurado como proveedor de storage (`cloudinary.config.ts`, variables en `.env`).
      - Middleware Multer (`multer.config.ts`) para procesar uploads en memoria.
      - Endpoint `POST /api/admin/upload/reward-image` creado (`admin.routes.ts`).
      - Servicio (`upload.service.ts`) implementado para subir a Cloudinary.
      - Controlador (`upload.controller.ts`) para manejar la petición y llamar al servicio.
      - Servicios (`rewards.service.ts`, `customer.service.ts`) y Controlador (`rewards.controller.ts`) actualizados para recibir, guardar y devolver `imageUrl` en operaciones CRUD y de lectura de recompensas/regalos.
    - **Frontend (Admin):**
      - Componente `RewardForm.tsx` (antes `AddRewardForm.tsx`) ahora maneja imágenes.
      - Usa `<FileInput>` para selección.
      - Integra `react-image-crop` para forzar recorte 1:1.
      - Incluye helper `canvasPreview.ts` para obtener el blob recortado.
      - Llama a la API de subida con `FormData`.
      - Guarda la `imageUrl` devuelta en estado local.
      - Envía `imageUrl` al crear/actualizar recompensa (`POST/PUT /api/rewards`).
      - Muestra la imagen actual al editar.
    - **Frontend (Cliente):**
      - Componentes `RewardList.tsx` y `SummaryTab.tsx` reemplazan `<Skeleton>` por `<Image>`.
      - Usan `item.imageUrl` con un fallback (`/placeholder-reward.png`).
      - Mantienen el aspect ratio 1:1.
  - ✅ **Logo Estático:** Añadido `loyalpymelogo.jpg` a `frontend/public` y mostrado en `AppHeader.tsx`.
  - ✅ **Layout Cabecera:** Modificado `AppHeader.tsx` para usar `<Container>` y restringir el ancho del contenido en pantallas grandes.
  - ✅ **Fix Escáner QR Móvil:** Solucionado error "Element not found" en `useQrScanner.ts` (ajuste de timing con `setTimeout`, corrección de tipo `NodeJS.Timeout` a `number`).
  - ✅ **Dependencias:** Añadidas (`react-image-crop`, `cloudinary`, `multer`, etc.), limpiadas (`react-qr-reader`).

---

## 4. Key Concepts & Design Decisions (Actualizado) 🔑

- **Separación Puntos vs. Nivel:** Sin cambios.
- **Orden de Niveles:** Sin cambios.
- **Actualización Nivel:** Sin cambios.
- **Layout Panel Cliente:** Basado en Tabs. Sin cambios.
- **Layout Tab "Resumen":** `Stack` vertical. Sin cambios.
- **Preview Siguiente Nivel:** Tooltip/Popover desde barra de progreso (fix móvil pendiente).
- **Snippet Resumen Recompensas:** Muestra contador regalos + hasta 4 previews (Regalos->Asequibles) en `SimpleGrid`. Cada preview ahora **muestra la imagen** (o fallback) 1:1 + Texto + Badge/Puntos.
- **Aspect Ratio Imágenes Recompensas:** Definido y **aplicado** como **1:1 (Cuadrado)** en `RewardList`, `SummaryTab` y recorte admin.
- **Almacenamiento Imágenes:** **Cloudinary**, configurado mediante variables de entorno (`.env`). Se suben a una carpeta específica (ej: `loyalpyme/rewards_development`).
- **Subida de Imágenes (Flujo):** FE selecciona -> FE recorta (1:1) -> FE obtiene Blob -> FE envía Blob a API Upload BE (`/api/admin/upload/reward-image`) -> BE sube a Cloudinary -> BE devuelve URL Cloudinary -> FE guarda URL -> FE envía URL al crear/actualizar Recompensa (`/api/rewards`).
- **Layout Cabecera:** Contenido (Logo, controles usuario) restringido por un `<Container>` en pantallas anchas. Logo estático cargado desde `/public`. Header móvil usa Burger Menu.
- **Escáner QR:** Usa `html5-qrcode` a través del hook `useQrScanner`. Requiere HTTPS y permisos de cámara. El hook maneja inicialización/limpieza.

---

## 5. Lecciones Aprendidas & Troubleshooting Clave 💡 (Actualizado)

- **Workflow Backend Dev:** Sigue siendo recomendado usar 2 terminales (`tsc -w` y `nodemon dist/...`). Crucial reiniciar `nodemon` tras cambios en `.ts` compilados a `dist/`.
- **Prisma Generate:** Necesario tras cambios en `schema.prisma`.
- **Mocking Prisma:** Usar Inyección de Dependencias.
- **Errores Prisma:** Manejar P2002 (unicidad -> 409 Conflict), P2025 (no encontrado -> 404 Not Found).
- **Refresco Frontend:** Forzar refresco (Ctrl+Shift+R) o reiniciar `yarn dev` si HMR falla.
- **Errores TS:** Centralizar tipos, verificar nombres/imports, limpiar caché TS server. `NodeJS.Timeout` vs `number` en navegador.
- **Testing Integración:** Supertest puede devolver 401 como `text/plain`. Validar datos de setup.
- **i18n:** Estructura `public/locales`, usar `react-country-flag` para banderas SVG.
- **Mantine Responsive Props:** `hiddenFrom`/`visibleFrom` pueden necesitar wrappers (`Box`/`Group`).
- **Mantine Tooltip/Popover:** Diferencias en trigger (`hover` vs `click`), props (`width`).
- **Cloudinary Debugging (Extenso):**
  - Errores 500/401 en subidas casi siempre son **credenciales incorrectas** en `backend/.env`.
  - Verificar **EXACTAMENTE** `CLOUDINARY_CLOUD_NAME` (¡sensible a mayúsculas!), `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET` contra el dashboard de Cloudinary. Asegurarse de que las 3 claves pertenecen a la **misma cuenta activa**. No confundir "Key Name" con "Cloud Name".
  - **Siempre reiniciar el backend** tras cambios en `.env`.
  - **Logs del Backend son CRUCIALES:** Buscar mensajes específicos como `Invalid cloud_name ...` o `Unknown API key ...`.
  - Probar diferentes métodos de configuración (variables separadas vs `CLOUDINARY_URL`) puede ayudar a diagnosticar problemas de lectura de `.env`.
  - Si persisten errores ilógicos ("Invalid cloud_name" para un nombre correcto), **regenerar API Secret/Key** o **crear una cuenta nueva** puede solucionar problemas internos de Cloudinary.
  - Contactar soporte Cloudinary si las credenciales fallan incluso en pruebas externas (CLI, script mínimo).
- **Guardado/Lectura Campos Nuevos (ej: `imageUrl`):**
  - Verificar todo el flujo: FE envía -> BE Controller recibe (`req.body`) -> BE Controller pasa a Service -> BE Service guarda en `prisma.create/update({ data: ... })` -> BE Service lee con `prisma.find...` (¿usa `select`? ¿incluye el campo?) -> BE Service devuelve -> FE Hook recibe -> FE Hook actualiza estado -> FE Componente usa el estado.
  - Añadir `console.log` en cada paso es la forma más efectiva de ver dónde se pierde el dato.
  - Asegurar que el backend se recompila (`tsc`) tras cambios en archivos `.ts`.
  - Verificar que las interfaces/tipos en FE/BE incluyen el nuevo campo.
  - Comprobar directamente la base de datos.
- **Inicialización Librerías en Modales/Condicionales (QR Scanner):**
  - Librerías que interactúan con el DOM (como `html5-qrcode`) pueden fallar si intentan encontrar un elemento (`getElementById`) antes de que React/Mantine lo haya renderizado completamente (especialmente dentro de Modals).
  - Error común: `Element with ID '...' not found`.
  - Workaround: Usar `setTimeout` con un pequeño delay (ej: 100ms) en el `useEffect` que inicializa la librería para dar tiempo al DOM. Manejar la limpieza del timeout. (Soluciones más robustas: callback refs).

---

## 6. Setup, Comandos y Acceso ⚙️

- **Prerrequisitos:** Node, Yarn, PostgreSQL.
- **Setup Backend:** `cd backend`, `yarn install`, crear `backend/.env` desde `.env.example`, configurar **TODAS** las variables (`DATABASE_URL`, `JWT_SECRET`, `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET`), `npx prisma migrate dev`, `npx prisma generate`. Seed opcional.
- **Setup Frontend:** `cd frontend`, `yarn install`.
- **Correr Backend Dev:** `npx tsc --watch` & `npx nodemon dist/index.js` (Puerto 3000).
- **Correr Frontend Dev:** `yarn dev --host` (Puerto 5173 HTTPS).
- **Build Prod:** `yarn build` en ambos.
- **Correr Prod:** `node dist/index.js`, servir estáticos `frontend/dist`.
- **Testing Backend:** `yarn test` / `test:watch` / `test:coverage`.
- **Testing Frontend:** `yarn test` / `test:watch` / `test:coverage`.
- **API Docs:** `http://localhost:3000/api-docs`.
- **Credenciales Ejemplo Admin:** (Verificar si siguen siendo válidas o si se usó `db seed`) `admin@cafeelsol.com` / `superpasswordseguro`.

---

## 7. 🗺️ Hoja de Ruta Detallada y Tareas Pendientes (v1.11.0)

_Leyenda: ✅=Completado | ⏳=Pendiente Inmediato/Técnico | ⭐=Próxima Gran Funcionalidad | 📝=Pendiente Fase 2+ | 🛠️=Técnico Fase 2+ | 🚀=Visión Futura_

**A. TAREAS INMEDIATAS / CORRECCIONES TÉCNICAS:**

1.  ⏳ **Arreglar Tipo `TierData`:** _(Técnico Rápido)_
    - **Objetivo:** Eliminar casts (`as any`) en `CustomerDashboardPage.tsx`.
    - **Tareas:** Añadir `benefits?: TierBenefitData[];` a `interface TierData` en `frontend/src/types/customer.ts`. Eliminar casts relacionados.
2.  📌 **Fix Mobile Popover Click:** _(Bug UX Móvil)_
    - **Objetivo:** Hacer que preview siguiente nivel funcione al tocar barra progreso en móvil (`UserInfoDisplay.tsx`).
    - **Tareas:** Investigar causa (simulación, CSS, eventos), probar en real, ajustar implementación (icono clickeable?).

**B. FUNCIONALIDADES COMPLETADAS RECIENTEMENTE:**

3.  ✅ **Implementar Imágenes Recompensas (Tarea 3):** _(COMPLETADO)_ - Ver sección 3 para detalles.
4.  ✅ **Añadir Logo Estático:** _(COMPLETADO)_ - Mostrado en `AppHeader`.
5.  ✅ **Restringir Ancho Cabecera:** _(COMPLETADO)_ - Usando `<Container>` en `AppHeader`.
6.  ✅ **Fix Escáner QR Móvil:** _(COMPLETADO)_ - Solucionado error "Element not found" en `useQrScanner`.

**C. CONTINUACIÓN FASE 2 (Pendiente):**

7.  📝 **Refinar Espaciado/Diseño `RewardList` (Tarea 4):** _(Visual - Prioridad Media)_
    - **Objetivo:** Mejorar legibilidad/estética tarjetas recompensa.
    - **Tareas:** Ajustar estilos/props Mantine en `RewardList.tsx`.
8.  📝 **(Siguiente Funcionalidad Mencionada):** Añadir captura desde **Cámara** en `RewardForm.tsx`. _(Funcional - Prioridad Media)_
9.  📝 **Personalización Negocio - Logo (Upload) (Tarea 5):** _(Funcional - Prioridad Alta)_
    - **Objetivo:** Permitir al admin subir su propio logo.
    - **Tareas:** Backend (Schema, Storage, API), Frontend (UI Admin, mostrar en `AppHeader`).
10. 📝 **Personalización Negocio - Theming Básico (Tarea 6):** _(Funcional - Prioridad Alta)_
    - **Objetivo:** Aplicar estilos diferentes por tipo de negocio.
    - **Tareas:** Backend (campo `themeIdentifier`), Frontend (CSS/Themes Mantine, JS).
11. 📝 **Historial de Actividad Cliente (Tarea 7):** _(Funcional - Prioridad Alta - Requiere Backend)_
    - **Objetivo:** Que el cliente vea sus movimientos.
    - **Tareas:** Backend (Endpoint `GET /api/customer/activity`), FE (`ActivityTab.tsx`).
12. 📝 **Fidelización Avanzada (Tarea 8):** _(Funcional - Prioridad Media)_
    - **Objetivo:** Más tipos de beneficios/recompensas.
    - **Tareas:** Backend (Enum `BenefitType`, lógica servicios), FE (UI Admin/Cliente).
13. 📝 **Comunicación Básica (Tarea 9):** _(Funcional - Prioridad Media)_
    - **Objetivo:** Permitir al admin enviar mensajes básicos.
    - **Tareas:** Backend (Entidad `Announcement`?, API CRUD, Email?), FE (UI Admin/Cliente).

**D. TAREAS TÉCNICAS (Pendiente):**

14. 🛠️ **Completar Pruebas Backend:** _(Técnico - Prioridad Media/Baja)_
15. 🛠️ **Iniciar/Completar Pruebas Frontend:** _(Técnico - Prioridad Media/Baja)_
16. 🛠️ **Validación Robusta Backend:** Investigar/Implementar Zod.
17. 🛠️ **Estrategia Deployment:** Definir (Docker?, Vercel/Netlify + Render/Heroku?). CI/CD.
18. 🛠️ **Logging/Monitoring Avanzado:** Integrar Sentry o similar.
19. 🛠️ **Optimización Base de Datos:** Revisar consultas, añadir índices.
20. 🛠️ **Tipado Centralizado:** Investigar paquete `common`.

**E. VISIÓN FUTURA (Fase 3+):**

21. 🚀 **App Móvil Nativa/PWA**
22. 🚀 **Análisis Avanzado (Admin)**
23. 🚀 **Segmentación y CRM Ligero**
24. 🚀 **E2E Tests**
25. 🚀 **Ecosistemas y Funcionalidades Sociales**

---

## 8. 🤝 Flujo de Trabajo Acordado

- (Sin cambios)

---

## 9. Información Adicional ℹ️

- Licencia: **AGPL v3.0**.

---

## 10. Próximo Paso Propuesto 👉

Abordar las **Tareas Pendientes Inmediatas/Técnicas (A.1 y A.2)**:

1.  Arreglar tipo `TierData`.
2.  Investigar/Fixear el Popover en móvil.

O, si se prefiere empezar con algo visual:

- Iniciar la **Tarea 7: Refinar Espaciado/Diseño `RewardList`**.

O, como mencionaste para mañana:

- Iniciar la **Tarea 8: Añadir captura desde Cámara en `RewardForm`**.
