# LoyalPyME - Estado del Proyecto y Decisiones Clave

**Versión:** 1.12.0 (Post-Activity History, Reward i18n & Fixes)
**Fecha de Última Actualización:** 05 de Mayo de 2025

---

## 1. Resumen General del Proyecto LoyalPyME 🎯

- **Concepto:** Plataforma web full-stack (React/Node.js) para que las PyMEs gestionen programas de fidelización digital (recompensas con imágenes, niveles, puntos, QR, historial).
- **Componentes:** Backend (Node/Express/Prisma/Postgres/Cloudinary), Frontend (React/Vite/Mantine/TS).
- **Áreas Principales:** Panel de Administración, Portal de Cliente (con Tabs: Resumen, Recompensas, Actividad).
- **Propósito:** Herramienta digital completa y adaptable para fidelización, recurrencia y mejora de relación cliente-negocio.

_(Para una descripción más detallada, tecnologías y visión a largo plazo, consulta el [README](./README.es.md))_

---

## 2. Estado Actual Detallado (Hitos Completados - v1.12.0) ✅

- **Fase 1 (Núcleo Operativo + Pulido):** **COMPLETADA.**
  - Funcionalidades base estables: Autenticación completa, CRUDs Admin (Recompensas, Tiers, Clientes con filtros/acciones/notas), Flujo Puntos/QR, Lógica Tiers (BE+Cron).
- **Fase 2 (Funcionalidades Iniciales y Mejoras):** **AVANZANDO SIGNIFICATIVAMENTE.**
  - ✅ **Internacionalización (i18n) Frontend:** Completada (ES/EN). Corregidos problemas de carga/claves faltantes.
  - ✅ **Documentación API (Swagger):** Implementada (`/api-docs`). Actualizada con nuevas rutas/schemas.
  - ✅ **Testing Backend (Inicial):** Setup OK, cobertura básica. (Errores de compilación recientes solucionados).
  - ✅ **Refactor Panel Cliente a Tabs:** Completado (`SummaryTab`, `RewardsTab`, `ActivityTab` ahora implementada, otras como placeholder).
  - ✅ **Mejoras UI/UX `UserInfoDisplay`:** Beneficios actuales, barra progreso, preview siguiente nivel (fix popover móvil OK).
  - ✅ **Mejora UI/UX `SummaryTab`:** Snippet resumen recompensas/regalos implementado (mostrando hasta 6), textos de botones acortados.
  - ✅ **Layout Cabecera Móvil (`AppHeader`):** Corregido solapamiento (Burger Menu).
  - ✅ **Implementación Imágenes en Recompensas:** Completado (Backend Cloudinary + API Upload + Servicios; Frontend Admin Form Crop/Upload + Cliente Display). Fix 404 ruta upload OK.
  - ✅ **Logo Estático:** Añadido y mostrado en `AppHeader.tsx`.
  - ✅ **Restringir Ancho Cabecera:** Implementado con `<Container>` en `AppHeader.tsx`.
  - ✅ **Fix Escáner QR:** Solucionado error "Element not found" y crash "Device not found" en escritorio. Botón habilitado correctamente en móvil.
  - ✅ **Gestión Dependencias:** Actualizadas y limpiadas. (Solucionados problemas `yarn install`).
  - ✅ **Fix Tipo `TierData`:** Corregido type error y eliminado cast `as any`.
  - ✅ **Fix Popover Móvil:** Implementado icono clickeable en `UserInfoDisplay` para mostrar beneficios siguiente nivel.
  - ✅ **Implementación Historial de Actividad Cliente:** Completado (Backend: Modelo `ActivityLog`, registro en servicios, API paginada; Frontend: Tipo, Hook `useCustomerActivity`, Componente `ActivityTab` con Timeline y paginación).
  - ✅ **Internacionalización Recompensas (Nombre/Desc):** Completado (Backend: Schema, Servicios, Controller; Frontend: Tipos, Visualización Admin/Cliente, Formulario Admin con campos ES/EN).
  - ✅ **Corrección Errores Varios:** Solucionados múltiples errores de compilación TS (backend/frontend), errores de runtime (Tooltip) y 404s.

---

## 3. Key Concepts & Design Decisions (Actualizado) 🔑

- **Separación Puntos vs. Nivel:** Nivel por actividad (`business.tierCalculationBasis`), Puntos (`User.points`) moneda canjeable.
- **Orden de Niveles:** Natural (`level` numérico ascendente).
- **Actualización Nivel:** Automática (QR/Cron) o Manual Admin.
- **Layout Panel Cliente:** Basado en Tabs (`Resumen`, `Recompensas`, `Actividad`, `Ofertas`_, `Perfil`_). `Resumen` es dashboard principal. (\* = Placeholder).
- **Layout Tab "Resumen":** Grid 2 columnas (Desktop): Izq (Info+QR), Der (Resumen Recompensas). 1 Columna (Móvil). Resumen muestra hasta 6 items (Regalos > Puntos Asequibles).
- **Preview Siguiente Nivel:** Popover desde icono (`IconHelp`) en móvil, hover en barra progreso en desktop (`UserInfoDisplay`).
- **Historial Actividad:** Modelo `ActivityLog` en BD. API paginada. Frontend usa `Timeline`. Descripciones se construyen en frontend con i18n (excepto razón ajuste admin).
- **Internacionalización Recompensas:** Campos `name_es`, `name_en`, `description_es`, `description_en` en BD. Backend API devuelve estos campos. Frontend muestra según idioma `i18n.language`. Form Admin permite edición bilingüe.
- **Aspect Ratio Imágenes Recompensas:** Forzado 1:1 (Cuadrado) en subida (recorte) y visualización.
- **Almacenamiento Imágenes:** Cloudinary (configurado vía `.env`).
- **Layout Cabecera:** Contenido restringido por `<Container>`. Logo estático. Header móvil usa Burger Menu.
- **Escáner QR:** Usa `html5-qrcode` vía hook `useQrScanner`. Errores de cámara no encontrada/permisos se capturan y muestran en UI, no rompen la app. Botón siempre activo salvo durante validación.

---

## 4. Lecciones Aprendidas & Troubleshooting Clave 💡

- **Workflow Backend Dev / Compilación:** Crucial `tsc --watch` o `yarn build` para reflejar cambios `.ts` en `dist/`. **Importante:** Limpiar `dist/` si persisten errores extraños tras arreglar código fuente.
- **Prisma Generate:** **IMPRESCINDIBLE** ejecutar `npx prisma generate` después de CUALQUIER `prisma migrate dev` para sincronizar los tipos de `@prisma/client` con el schema. Si no, aparecen errores TS2305 (no se encuentra miembro exportado).
- **Errores TS (Tipos vs Uso):** Verificar que los tipos definidos (Interfaces, Types) coincidan con la estructura de los datos reales que se reciben de APIs o se usan en el código (Causa de errores TS2339, TS2741). Importar tipos desde su fuente original (`types/customer.ts`) en lugar de desde otros módulos que los usan.
- **Errores Migración Prisma:** Error al añadir columna `NOT NULL` sin `DEFAULT` a tabla con datos. Solución dev: Hacer columna opcional (`?`) temporalmente.
- **i18n:** `i18next missingKey` indica clave no encontrada en JSON del idioma actual. Verificar claves y sintaxis JSON. Usar `debug: true` y `console.log(i18n.language, t('key'))` para depurar. Contenido dinámico de BD (ej: nombre recompensa) debe internacionalizarse en BD o construirse en FE con interpolación.
- **Mantine Tooltip Error (`children should accept ref`):** Evitar Fragment (`<>`) como hijo directo. Envolver hijos complejos (como `<Group>`) en un `<Box>` simple si da problemas. Limpiar espacios en blanco JSX en tablas (`<table>`, `<thead>`, `<tr>`) para evitar advertencias de hidratación.
- **API 404 Not Found:** Causa probable: Ruta no montada correctamente en `backend/src/index.ts` (olvido de `app.use(...)` o error tipográfico) o backend no reiniciado tras cambios en `index.ts`. Verificar también rutas relativas en el router específico.
- **Error `NotFoundError` Escáner QR:** Capturar error en `scanner.start().catch()` dentro del hook `useQrScanner` y mostrar mensaje al usuario en lugar de dejar que React se rompa. No desactivar botón por tamaño pantalla (`isMobile`).
- **Errores `yarn install` (`ENOENT: no such file or directory, copyfile...`):** Puede indicar corrupción de caché. Probar `yarn cache clean` y/o borrar `node_modules` y `yarn.lock` y reinstalar.

_(Para una guía más exhaustiva de problemas específicos, consulta [TROUBLESHOOTING_GUIDE.md](./TROUBLESHOOTING_GUIDE.md))_

---

## 5. Próximos Pasos Inmediatos / Prioridades ⏳📌

1.  **Fix Backend Build Error (`uploads.service.ts`):** _(Bug Crítico)_
    - **Objetivo:** Solucionar el error `TS2307: Cannot find module './uploads.service'` que impide compilar el backend.
    - **Tareas:** Revisar el código de `backend/src/uploads/uploads.service.ts` en busca de errores internos que impidan su análisis por `tsc`. _(Necesita que el usuario proporcione el código de este archivo)_.
2.  **Feature: Botones Canje en Resumen Cliente:** _(Mejora UX)_
    - **Objetivo:** Añadir botones "Canjear" a los items de previsualización en `SummaryTab.tsx`.
    - **Tareas:** Modificar `SummaryTab.tsx` para incluir botones condicionales y lógica de estado/disabled (basado en código de `RewardList.tsx`). Ajustar UI/estilo de botones. _(Implementación propuesta y lista para probar)_.
3.  **(A Evaluar) Priorización V1.0:**
    - **Objetivo:** Decidir si las funcionalidades "Mi Perfil (con foto)" y "Ofertas/Noticias" se incluirán en V1.0 o se mantendrán para post-V1.0 como estaba planeado originalmente.
    - **Tareas:** Discutir prioridades vs. esfuerzo estimado. Actualizar `DEVELOPMENT_PLAN.md` si se decide cambiar el alcance V1.0.

_(Para ver la hoja de ruta completa V1.0 y post-V1.0, consulta [DEVELOPMENT_PLAN.md](./DEVELOPMENT_PLAN.md))_

---

## 6. Información Adicional ℹ️

- Licencia: **MIT**. (Ver archivo `LICENSE` en la raíz del proyecto).

---
