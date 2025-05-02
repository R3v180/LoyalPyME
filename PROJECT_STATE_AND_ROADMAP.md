# LoyalPyME - Estado del Proyecto y Hoja de Ruta Detallada 🧭

**Versión:** 1.10.0 (Post-Reward Image Upload)
**Fecha de Última Actualización:** 02 de Mayo de 2025

---

## 1. Resumen General del Proyecto LoyalPyME 🎯

- **Concepto:** Plataforma web full-stack (React/Node.js) para que las PyMEs (Pequeñas y Medianas Empresas) gestionen programas de fidelización digital para sus clientes finales. El sistema permite configurar recompensas (ahora con imágenes), niveles (tiers) basados en la actividad del cliente, y acumular/canjear puntos mediante interacciones digitales (ej. QR).
- **Componentes Principales:**
  - **Backend (Node.js/Express/Prisma/PostgreSQL):** API RESTful que maneja toda la lógica de negocio (usuarios, negocios, puntos, niveles, recompensas con imágenes, autenticación JWT, subida de imágenes a Cloudinary, etc.) y la interacción con la base de datos. Incluye tareas programadas (cron) para mantenimiento.
  - **Frontend (React/Vite/Mantine/TypeScript):** Interfaz de usuario web con dos áreas principales:
    - **Panel de Administración:** Para dueños/empleados de la PyME. Permite configurar el programa de fidelización, gestionar clientes, gestionar recompensas (CRUD, incluyendo subida y recorte de imágenes 1:1), gestionar niveles/beneficios, generar códigos QR, y ver estadísticas.
    - **Portal de Cliente:** Para los clientes finales de la PyME. Organizado por pestañas ("Resumen", "Recompensas", placeholders). Permite ver saldo, nivel, beneficios, progreso, validar QR, y ver/canjear recompensas y regalos (ahora mostrando sus imágenes). Incluye snippet resumen con imágenes en la pestaña principal.
- **Propósito:** Dotar a las PyMEs de una herramienta digital moderna, completa y adaptable para fidelizar clientes, fomentar la recurrencia, mejorar la relación y diferenciarse, ofreciendo una experiencia clara y valiosa al cliente final.
- **Visión a Largo Plazo:** Evolucionar hacia personalización visual avanzada, comunicación integrada, CRM ligero, app móvil, analítica avanzada, y ecosistemas compartidos.

---

## 2. Stack Tecnológico 🛠️

- **Frontend:** React (v19), TypeScript, Vite, Mantine UI (v7+), @mantine/hooks, @mantine/form, zod, @mantine/notifications, @mantine/modals, axios, react-router-dom (v6+), qrcode.react, html5-qrcode, i18next, react-i18next, i18next-http-backend, i18next-browser-languagedetector, react-country-flag, **react-image-crop**, (`vite-plugin-mkcert` dev).
- **Backend:** Node.js, Express, TypeScript, Prisma (ORM), PostgreSQL, jsonwebtoken, bcryptjs, dotenv, node-cron, uuid, cors, date-fns, **cloudinary**, **multer**, **streamifier**, vitest & supertest, swagger-jsdoc & swagger-ui-express.
- **Otros:** Git, Yarn v1.

---

## 3. Estado Actual Detallado (Hitos Completados - v1.10.0) ✅

- **Fase 1 (Núcleo Operativo + Pulido):** **COMPLETADA.**
  - (Sin cambios)
- **Fase 2 (Funcionalidades Iniciales y Mejoras UI/UX):** **AVANZANDO.**
  - ✅ **Internacionalización (i18n) Frontend:** Completada.
  - ✅ **Documentación API (Swagger):** Implementada.
  - ✅ **Testing Backend (Inicial):** Setup OK, cobertura básica.
  - ✅ **Refactor Panel Cliente a Tabs:** Completado.
  - ✅ **Mejoras UI/UX `UserInfoDisplay`:** Completado (excepto fix popover móvil).
  - ✅ **Mejora UI/UX `SummaryTab`:** Snippet recompensas implementado.
  - ✅ **Layout Header Móvil (`AppHeader`):** Corregido.
  - ✅ **Placeholders Imágenes Recompensas:** Añadidos inicialmente.
  - ✅ **Dependencias Obsoletas Limpiadas.**
  - ✅ **Imágenes en Recompensas (Tarea 3):** Implementado.
    - Backend: Schema, migración, Cloudinary (storage, SDK, config), API de subida (`/api/admin/upload/reward-image` con Multer), servicios CRUD actualizados para `imageUrl`.
    - Frontend Admin (`RewardForm.tsx`): Selección de archivo (`FileInput`), recorte 1:1 (`react-image-crop`), subida a API, guardado de `imageUrl`.
    - Frontend Cliente (`RewardList.tsx`, `SummaryTab.tsx`): Muestra de imágenes (`<Image>`) con fallback, respetando aspect ratio 1:1.

---

## 4. Key Concepts & Design Decisions (Actualizado) 🔑

- (Sección Puntos/Nivel sin cambios)
- (Sección Layout Panel Cliente sin cambios)
- (Sección Layout Tab "Resumen" sin cambios)
- (Sección Preview Siguiente Nivel sin cambios)
- **Snippet Resumen Recompensas:** Muestra contador regalos + hasta 4 previews (Regalos->Asequibles) en `SimpleGrid`. Cada preview ahora **muestra la imagen de la recompensa (o un placeholder)** (80x80) + Texto + Badge/Puntos. Botón "Ver Todas".
- **Aspect Ratio Imágenes Recompensas:** Definido y **aplicado** como **1:1 (Cuadrado)** en `RewardList`, `SummaryTab` y el recorte en `RewardForm`.
- **Almacenamiento de Imágenes:** Se utiliza **Cloudinary** para el almacenamiento de las imágenes subidas.
- (Sección Header Móvil sin cambios)

---

## 5. Lecciones Aprendidas & Troubleshooting Clave 💡

- (Sección sin cambios relevantes a Tarea 3, pero añadir)
- **NUEVO APRENDIDO:** La configuración de proveedores cloud (Cloudinary) requiere verificar **exactamente** todas las credenciales (`cloud_name`, `api_key`, `api_secret`) y reiniciar el backend tras cambios en `.env`. Errores 401/500 en subidas suelen originarse ahí. Usar logs del backend es crucial para diagnosticar.
- **NUEVO APRENDIDO:** Integrar recorte de imágenes en frontend (`react-image-crop`) requiere manejar estado para el archivo fuente, el crop, el crop completado y la URL final, además de usar `canvas` para obtener el blob recortado.

---

## 6. Setup, Comandos y Acceso ⚙️

- **Setup Backend:** `cd backend`, `yarn install`, crear y configurar `.env` (incluyendo `DATABASE_URL`, `JWT_SECRET`, `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET`), `prisma migrate dev`, `prisma generate`.
- (Resto sin cambios)

---

## 7. 🗺️ Hoja de Ruta Detallada y Tareas Pendientes (v1.10.0)

_Leyenda: ✅=Completado | ⏳=Pendiente Inmediato/Técnico | ⭐=Próxima Gran Funcionalidad | 📝=Pendiente Fase 2+ | 🛠️=Técnico Fase 2+ | 🚀=Visión Futura_

**A. TAREAS INMEDIATAS / CORRECCIONES TÉCNICAS:**

1.  ⏳ **Arreglar Tipo `TierData`:** _(Técnico Rápido)_
    - **Objetivo:** Eliminar casts temporales (`as any`, etc.) y mejorar seguridad de tipos.
    - **Tareas:**
      - Modificar `interface TierData` en `frontend/src/types/customer.ts`.
      - Añadir `benefits?: TierBenefitData[];`.
      - Buscar y eliminar casts relacionados con `tier.benefits`.
2.  📌 **Fix Mobile Popover Click:** _(Bug UX Móvil)_
    - **Objetivo:** Hacer que la preview del siguiente nivel funcione al tocar la barra de progreso en móvil.
    - **Tareas:** Investigar y ajustar implementación en `UserInfoDisplay.tsx`.

**B. FUNCIONALIDADES COMPLETADAS RECIENTEMENTE:**

3.  ✅ **Implementar Imágenes Recompensas:** _(COMPLETADO - Tarea 3)_
    - **Objetivo:** Permitir a los admins subir imágenes para las recompensas y mostrarlas a los clientes.
    - **Sub-Tareas Backend:**
      - ✅ [BE-IMG-1] Modificar `schema.prisma`.
      - ✅ [BE-IMG-2] Ejecutar `prisma migrate dev`.
      - ✅ [BE-IMG-3] Ejecutar `prisma generate`.
      - ✅ [BE-IMG-4] **Decidido/Implementado Storage:** Cloudinary. Credenciales configuradas en `.env`.
      - ✅ [BE-IMG-5] SDKs Instalados: `cloudinary`, `multer`, `streamifier`.
      - ✅ [BE-IMG-6] Endpoint API Upload Creado: `POST /api/admin/upload/reward-image` (con Multer).
      - ✅ [BE-IMG-7] Servicios/Controladores Rewards Actualizados para `imageUrl`.
    - **Sub-Tareas Frontend (Admin):**
      - ✅ [FE-ADM-IMG-1] Componente `RewardForm.tsx`:
        - `<FileInput>` añadido.
        - Preview de imagen actual/subida.
        - `react-image-crop` integrado para ratio 1:1.
        - Estado y lógica para manejar archivo, recorte, URL final.
      - ✅ [FE-ADM-IMG-2] Lógica `AdminRewardsPage.tsx` / `useAdminRewards.ts`:
        - Formulario (`RewardForm`) integrado en modal de edición y panel de añadir.
        - Llamada a API de subida implementada dentro de `RewardForm`.
        - `imageUrl` enviada en la petición POST/PUT/PATCH a `/api/rewards`.
        - Imagen actual mostrada al editar.
    - **Sub-Tareas Frontend (Cliente):**
      - ✅ [FE-CUST-IMG-1] Componente `RewardList.tsx`:
        - Importado `Image` de Mantine.
        - Reemplazado `<Skeleton>` por `<Image src={item.imageUrl || fallback} ... />`.
      - ✅ [FE-CUST-IMG-2] Componente `SummaryTab.tsx`:
        - Importado `Image` de Mantine.
        - Reemplazado `<Skeleton>` por `<Image src={item.imageUrl || fallback} ... />` en `previewItems`.

**C. CONTINUACIÓN FASE 2 (Pendiente):**

4.  📝 **Refinar Espaciado/Diseño `RewardList`:** _(Visual - Prioridad Media)_
    - **Objetivo:** Mejorar legibilidad y estética general de las tarjetas de recompensa.
    - **Tareas:** Revisar `RewardList.tsx`. Ajustar `spacing`, `padding`/`margin`, fuentes, badges, `lineClamp`, etc. Asegurar responsive.
5.  📝 **Personalización Negocio - Logo:** _(Funcional - Prioridad Alta)_
    - **Objetivo:** Permitir al admin subir un logo y mostrarlo en los Layouts.
    - **Tareas:** Similar a Imágenes Recompensas (BE: Schema Business, Storage, API Upload/Get; FE Admin: Componente upload en settings; FE Layout: Mostrar `<img>` en `AppHeader`).
6.  📝 **Personalización Negocio - Theming Básico:** _(Funcional - Prioridad Alta)_
    - **Objetivo:** Aplicar estilos visuales diferentes basados en el tipo de negocio.
    - **Tareas:** BE (añadir `themeIdentifier` a Business), FE (definir variables CSS/Temas Mantine, lógica JS para aplicar clase, ajustar CSS).
7.  📝 **Historial de Actividad Cliente:** _(Funcional - Prioridad Alta - Requiere Backend)_
    - **Objetivo:** Que el cliente vea sus últimos movimientos (puntos, canjes).
    - **Tareas:** BE (Endpoint `GET /api/customer/activity`), FE (Crear `ActivityTab.tsx`, consumir endpoint, mostrar lista/tabla).
8.  📝 **Fidelización Avanzada:** _(Funcional - Prioridad Media)_
    - **Objetivo:** Ofrecer más tipos de beneficios/recompensas.
    - **Tareas:** BE (Ampliar `BenefitType`, lógica servicios), FE (UI Admin/Cliente). Ejemplos: `% Descuento`, `Bonus Cumpleaños`, `Bonus por Nivel`.
9.  📝 **Comunicación Básica:** _(Funcional - Prioridad Media)_
    - **Objetivo:** Permitir al admin enviar mensajes básicos.
    - **Tareas:** BE (Entidad `Announcement`?, API CRUD, Email?), FE (UI Admin/Cliente).

**D. TAREAS TÉCNICAS (Pendiente):**

10. 🛠️ **Completar Pruebas Backend:** _(Técnico - Prioridad Media/Baja)_
11. 🛠️ **Iniciar/Completar Pruebas Frontend:** _(Técnico - Prioridad Media/Baja)_
12. 🛠️ **Validación Robusta Backend:** Investigar/Implementar Zod u otra librería.
13. 🛠️ **Estrategia Deployment:** Definir (Docker?, Vercel/Netlify + Render/Heroku?). CI/CD.
14. 🛠️ **Logging/Monitoring Avanzado:** Integrar Sentry o similar.
15. 🛠️ **Optimización Base de Datos:** Revisar consultas, añadir índices.
16. 🛠️ **Tipado Centralizado:** Investigar paquete `common`.

**E. VISIÓN FUTURA (Fase 3+):**

17. 🚀 **App Móvil Nativa/PWA:** _(Prioridad Baja/Fase 3)_
18. 🚀 **Análisis Avanzado (Admin):** _(Prioridad Baja/Fase 3-4)_
19. 🚀 **Segmentación y CRM Ligero:** _(Prioridad Baja/Fase 3-4)_
20. 🚀 **E2E Tests:** _(Prioridad Baja/Fase 3)_
21. 🚀 **Ecosistemas y Funcionalidades Sociales:** _(Prioridad Baja/Fase 4-5 - Exploratorio)_

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

O, si se prefiere, iniciar la **Tarea 4: Refinar Espaciado/Diseño `RewardList`**.
