# LoyalPyME - Estado del Proyecto y Decisiones Clave

**Versión:** 1.11.0 (Post-Reward Images, Logo, Header/Scanner Fixes)
**Fecha de Última Actualización:** 03 de Mayo de 2025

---

## 1. Resumen General del Proyecto LoyalPyME 🎯

- **Concepto:** Plataforma web full-stack (React/Node.js) para que las PyMEs gestionen programas de fidelización digital (recompensas con imágenes, niveles, puntos, QR).
- **Componentes:** Backend (Node/Express/Prisma/Postgres/Cloudinary), Frontend (React/Vite/Mantine/TS).
- **Áreas Principales:** Panel de Administración, Portal de Cliente (con Tabs).
- **Propósito:** Herramienta digital completa y adaptable para fidelización, recurrencia y mejora de relación cliente-negocio.

_(Para una descripción más detallada, tecnologías y visión a largo plazo, consulta el [README](./README.es.md))_

---

## 2. Estado Actual Detallado (Hitos Completados - v1.11.0) ✅

- **Fase 1 (Núcleo Operativo + Pulido):** **COMPLETADA.**
  - Funcionalidades base estables: Autenticación completa, CRUDs Admin (Recompensas, Tiers, Clientes con filtros/acciones/notas), Flujo Puntos/QR, Lógica Tiers (BE+Cron).
- **Fase 2 (Funcionalidades Iniciales y Mejoras UI/UX):** **AVANZANDO SIGNIFICATIVAMENTE.**
  - ✅ **Internacionalización (i18n) Frontend:** Completada (ES/EN).
  - ✅ **Documentación API (Swagger):** Implementada (`/api-docs`).
  - ✅ **Testing Backend (Inicial):** Setup OK, cobertura básica. (Tests ahora pasan tras fix admin).
  - ✅ **Refactor Panel Cliente a Tabs:** Completado (`SummaryTab`, `RewardsTab`, etc.).
  - ✅ **Mejoras UI/UX `UserInfoDisplay`:** Beneficios actuales, barra progreso, preview siguiente nivel (popover móvil pendiente).
  - ✅ **Mejora UI/UX `SummaryTab`:** Snippet resumen recompensas/regalos implementado.
  - ✅ **Layout Header Móvil (`AppHeader`):** Corregido solapamiento (Burger Menu).
  - ✅ **Implementación Imágenes en Recompensas (Tarea 3):** Completado (Backend Cloudinary + API Upload + Servicios; Frontend Admin Form Crop/Upload + Cliente Display).
  - ✅ **Logo Estático:** Añadido y mostrado en `AppHeader.tsx`.
  - ✅ **Restringir Ancho Cabecera:** Implementado con `<Container>` en `AppHeader.tsx`.
  - ✅ **Fix Escáner QR Móvil:** Solucionado error "Element not found" en `useQrScanner.ts`.
  - ✅ **Gestión Dependencias:** Actualizadas y limpiadas durante desarrollo Tarea 3.

---

## 3. Key Concepts & Design Decisions (Actualizado) 🔑

- **Separación Puntos vs. Nivel:** Nivel por actividad (`business.tierCalculationBasis`), Puntos (`User.points`) moneda canjeable.
- **Orden de Niveles:** Natural (`level` numérico ascendente).
- **Actualización Nivel:** Automática (QR/Cron) o Manual Admin. Ajuste puntos admin no afecta directamente (salvo si `basis=POINTS_EARNED`).
- **Layout Panel Cliente:** Basado en Tabs (`Resumen`, `Recompensas`, `Actividad`, `Ofertas`, `Perfil`). `Resumen` es dashboard principal.
- **Layout Tab "Resumen":** `Stack` vertical: `UserInfoDisplay`, `QrValidationSection`, `Card` Resumen Recompensas.
- **Preview Siguiente Nivel:** Tooltip/Popover desde barra de progreso (`UserInfoDisplay`) - (fix móvil pendiente).
- **Snippet Resumen Recompensas:** Contador regalos + hasta 4 previews (Regalos->Asequibles) con imagen 1:1. Botón "Ver Todas".
- **Aspect Ratio Imágenes Recompensas:** Forzado 1:1 (Cuadrado) en subida (recorte) y visualización.
- **Almacenamiento Imágenes:** Cloudinary (configurado vía `.env`).
- **Layout Cabecera:** Contenido restringido por `<Container>`. Logo estático. Header móvil usa Burger Menu.
- **Escáner QR:** Usa `html5-qrcode` vía hook `useQrScanner`.

---

## 4. Lecciones Aprendidas & Troubleshooting Clave 💡

- **Workflow Backend Dev / Compilación:** Crucial `tsc --watch` o `yarn build` para reflejar cambios `.ts` en `dist/`.
- **Prisma Generate:** Necesario tras `schema.prisma`.
- **Mocking Prisma:** Usar Inyección de Dependencias.
- **Errores Prisma:** Manejar P2002 (unicidad -> 409), P2025 (no encontrado -> 404).
- **Refresco Frontend:** Forzar refresco (Ctrl+Shift+R) o reiniciar `yarn dev`.
- **Errores TS:** Centralizar Tipos, `NodeJS.Timeout` vs `number` en navegador.
- **Testing Integración:** 401 puede ser `text/plain`. **Dependencia de datos**: asegurar existencia/validez de datos base (ej: usuario admin de test) antes de ejecutar.
- **i18n:** Estructura `public/locales`, `react-country-flag` SVG.
- **Mantine Responsive Props:** Wrappers `Box`/`Group` para `hiddenFrom`/`visibleFrom`.
- **Mantine Tooltip/Popover:** Diferencias trigger/props.
- **Cloudinary Debugging:** **Credenciales EXACTAS** (`cloud_name`, `api_key`, `api_secret` misma cuenta), **reiniciar backend** tras `.env`, **logs backend** vitales (`Invalid cloud_name`, `Unknown API key`), **regenerar credenciales** o **cuenta nueva** como último recurso.
- **Guardado/Lectura Campos Nuevos (`imageUrl`):** Verificar todo el flujo (FE send -> BE Controller -> BE Service Save -> BE Service Read/Select -> BE Service Return -> FE Hook -> FE Component). Asegurar compilación backend. Verificar tipos FE/BE. Revisar BD. Usar logs `[DEBUG]`.
- **Inicialización Librerías en Modales (QR Scanner):** Posible error `Element ... not found`. Workaround: `setTimeout` en `useEffect` de inicialización.

_(Para una guía más exhaustiva de problemas específicos, consulta [TROUBLESHOOTING_GUIDE.md](./TROUBLESHOOTING_GUIDE.md))_

---

## 5. Próximos Pasos Inmediatos / Prioridades ⏳📌

1.  **Arreglar Tipo `TierData`:** _(Técnico Rápido)_
    - **Objetivo:** Eliminar casts (`as any`) en `CustomerDashboardPage.tsx`.
    - **Tareas:** Añadir `benefits?: TierBenefitData[];` a `interface TierData` en `frontend/src/types/customer.ts`. Eliminar casts relacionados.
2.  **Fix Mobile Popover Click:** _(Bug UX Móvil)_
    - **Objetivo:** Hacer que preview siguiente nivel funcione al tocar barra progreso en móvil (`UserInfoDisplay.tsx`).
    - **Tareas:** Investigar causa (simulación, CSS, eventos), probar en real, ajustar implementación (icono clickeable?).

_(Para ver la hoja de ruta completa, el backlog detallado y las ideas futuras, consulta [DEVELOPMENT_PLAN.md](./DEVELOPMENT_PLAN.md))_

---

## 6. Información Adicional ℹ️

- Licencia: **AGPL v3.0**.

---
