# LoyalPyME - Estado del Proyecto y Decisiones Clave

**Versión:** 1.13.0 (Implementación Base Super Admin y Gestión Módulos)
**Fecha de Última Actualización:** 09 de Mayo de 2025

---

## 1. Resumen General del Proyecto LoyalPyME 🎯

- **Concepto:** Plataforma web full-stack (React/Node.js) para que las PyMEs gestionen programas de fidelización digital (LoyalPyME Core) y, opcionalmente, la operativa de servicio en hostelería (LoyalPyME Camarero). Los módulos pueden activarse por negocio.
- **Componentes:** Backend (Node/Express/Prisma/Postgres/Cloudinary), Frontend (React/Vite/Mantine/TS).
- **Áreas Principales:**
  - **Panel Super Admin:** Gestión de negocios y activación de módulos de la plataforma.
  - **Panel de Administración (Business Admin):** Gestión de las funcionalidades del módulo o módulos activos para su negocio (ej: clientes, recompensas, tiers para LCo; carta digital, mesas para LC).
  - **Portal de Cliente (Customer Final - LCo):** Dashboard con puntos, recompensas, historial de actividad (si LCo está activo).
  - **Interfaces Módulo Camarero (LC):** Carta digital para clientes, app para camareros, KDS (si LC está activo).
- **Propósito:** Herramienta digital completa, modular y adaptable para fidelización, optimización de servicio en hostelería, recurrencia y mejora de la relación cliente-negocio.

_(Para una descripción más detallada de la visión a largo plazo, consulta el [README](./README.es.md) y para el plan de desarrollo, [DEVELOPMENT_PLAN.md](./DEVELOPMENT_PLAN.md))_

---

## 2. Estado Actual Detallado (Hitos Completados - v1.13.0) ✅

- **Fase 1 (Núcleo Operativo LCo + Pulido Inicial):** **COMPLETADA.**

  - Funcionalidades base de LoyalPyME Core (LCo) estables: Autenticación completa (Cliente, Business Admin), CRUDs Admin LCo (Recompensas con i18n, Tiers, Clientes con filtros/acciones/notas), Flujo Puntos/QR, Lógica Tiers (BE+Cron), Historial Actividad Cliente.
  - Mejoras UI/UX previas (Popover móvil, etc.), Internacionalización Frontend base, Documentación API Swagger base.

- **Fase 2 (Fundamentos Multi-Módulo y Panel Super Admin):** **AVANCE SIGNIFICATIVO - BASE IMPLEMENTADA.**
  - ✅ **Implementación Base del Panel Super Admin:**
    - **Backend:**
      - Rol `SUPER_ADMIN` definido. Script para creación del primer Super Admin.
      - Modelo `Business` actualizado con flags `isActive` (estado general del negocio), `isLoyaltyCoreActive` (para módulo LCo), `isCamareroActive` (para futuro módulo LC).
      - API Endpoints (`/api/superadmin/*`) para:
        - Listar todos los negocios.
        - Cambiar el estado `isActive` de un negocio.
        - Activar/desactivar los módulos `isLoyaltyCoreActive` e `isCamareroActive` para un negocio específico.
      - Servicios y controladores correspondientes para la lógica del Super Admin.
      - Rutas Super Admin protegidas por `authenticateToken` y `checkRole(['SUPER_ADMIN'])`.
    - **Frontend:**
      - Página `/superadmin` creada y protegida por `PrivateRoute` para rol `SUPER_ADMIN`.
      - UI básica en `/superadmin` que muestra una tabla de negocios con su estado general y switches para activar/desactivar los módulos LCo y LC.
      - Funcionalidad en la UI para llamar a las APIs del Super Admin y actualizar estos estados.
      - Internacionalización básica de la página Super Admin.
  - ✅ **Implementación de Control de Acceso por Módulo:**
    - **Backend:**
      - Middleware `checkModuleActive(moduleCode)` creado para verificar si un módulo está activo para el negocio del usuario autenticado.
      - Middleware `checkModuleActive('LOYALTY_CORE')` aplicado a las rutas API de LCo (recompensas, tiers).
      - `auth.middleware.ts` actualizado para que el objeto `req.user` (y por ende la respuesta de `/api/profile`) incluya los flags `isLoyaltyCoreActive` e `isCamareroActive` del negocio al que pertenece el `BUSINESS_ADMIN` o `CUSTOMER_FINAL`.
    - **Frontend:**
      - Hook `useLayoutUserData` ahora consume y expone los flags de módulos activos.
      - Componente `AdminNavbar.tsx` modificado para mostrar/ocultar condicionalmente los enlaces del menú de LCo (Recompensas, Tiers, etc.) basándose en el flag `isLoyaltyCoreActive`.
      - Página `AdminOverview.tsx` modificada para mostrar/ocultar condicionalmente las tarjetas de "Accesos Rápidos" de LCo basándose en el flag `isLoyaltyCoreActive`.
  - ✅ **Script de Seed Mejorado:**
    - `prisma/seed.ts` ahora crea un negocio de demostración ("Restaurante Demo LoyalPyME") con un `BUSINESS_ADMIN` (`admin@demo.com`) y un `CUSTOMER_FINAL` (`cliente@demo.com`).
    - El negocio demo se crea con los módulos `isLoyaltyCoreActive` e `isCamareroActive` puestos a `true` por defecto para facilitar el desarrollo y pruebas.
    - Incluye Tiers y Recompensas de ejemplo para el negocio demo.
  - ✅ **Correcciones Varias:** Solucionados múltiples errores de compilación TS (backend/frontend), errores de tipado, y problemas con la ejecución del script de seed.

---

## 3. Key Concepts & Design Decisions (Actualizado) 🔑

- **Arquitectura Modular:**
  - La plataforma se está desarrollando para soportar múltiples módulos (ej: LoyalPyME Core, LoyalPyME Camarero) que pueden ser activados o desactivados por negocio.
  - Un rol `SUPER_ADMIN` gestiona los negocios y sus módulos activos a través de un panel dedicado.
  - El acceso a funcionalidades (API y UI) de un módulo específico está condicionado por el estado de activación de dicho módulo para el negocio.
- **Flags de Módulos:**
  - El modelo `Business` en la base de datos contiene los campos booleanos `isLoyaltyCoreActive` e `isCamareroActive` para controlar el acceso.
  - El middleware `checkModuleActive` en el backend protege las rutas API de los módulos.
  - El frontend (hooks y componentes UI) lee estos flags para renderizar condicionalmente elementos de navegación y acceso a funcionalidades.
- **Usuario Super Admin:**
  - Existe un rol `SUPER_ADMIN` que no está asociado a un `businessId` específico.
  - Tiene acceso a un panel `/superadmin` para gestionar todos los negocios de la plataforma y sus módulos.
- **Separación Puntos vs. Nivel (LCo):** Nivel por actividad (`business.tierCalculationBasis`), Puntos (`User.points`) moneda canjeable. (Sin cambios)
- **Orden de Niveles (LCo):** Natural (`level` numérico ascendente). (Sin cambios)
- **Actualización Nivel (LCo):** Automática (QR/Cron) o Manual Admin. (Sin cambios)
- **Layout Panel Cliente (LCo):** Basado en Tabs. (Sin cambios)
- **Historial Actividad (LCo):** Modelo `ActivityLog` en BD. API paginada. Frontend usa `Timeline`. (Sin cambios)
- **Internacionalización Recompensas (LCo):** Campos `name_es`, `name_en`, etc., en BD. (Sin cambios)
- **Almacenamiento Imágenes:** Cloudinary. (Sin cambios)

---

## 4. Lecciones Aprendidas & Troubleshooting Clave (Actualizado) 💡

- **Ejecución de Scripts de Seed con `ts-node` y Prisma CLI:**
  - Para que `npx prisma db seed` ejecute correctamente un script `seed.ts` usando `ts-node`, es crucial configurar la clave `"prisma": { "seed": "ts-node prisma/seed.ts" }` (o similar, ajustando path y opciones de `ts-node` si es necesario) en el `package.json` del directorio desde donde se ejecuta `npx prisma ...`.
  - Pasar `--compiler-options` directamente en la línea de `ts-node` dentro del `package.json` puede causar errores `TS5023: Unknown compiler option` debido a problemas de escape de comillas. Es mejor confiar en el `tsconfig.json` del proyecto.
  - Si `npx prisma db seed` no muestra salida de `console.log` del script, verificar ejecutando el script directamente con `npx ts-node ./ruta/al/seed.ts` para aislar si el problema es del script o de la invocación de Prisma CLI.
- **Regeneración del Cliente Prisma:** **IMPRESCINDIBLE** ejecutar `npx prisma generate` después de CUALQUIER `prisma migrate dev` o `prisma migrate reset` para sincronizar los tipos de `@prisma/client`. Si no, pueden aparecer errores TS2353 (propiedad no existe en tipo) al usar nuevos campos en el código.
- **Errores de Migración con Datos Existentes (P3018):** Al hacer cambios estructurales (ej: opcionalidad de campos con claves foráneas), Prisma puede intentar `DROP` y recrear tablas. Si hay datos que violan las FK durante la reinserción, la migración falla. Para desarrollo, `npx prisma migrate reset` es la solución más simple.
- **Tipado y Middlewares (Backend):**
  - Asegurar que el objeto `req.user` construido por `auth.middleware.ts` tenga una estructura consistente y que los campos opcionales (como `businessId` para `SUPER_ADMIN`, o `currentTier` para usuarios sin tier) se manejen correctamente y no causen errores de tipo en middlewares o controladores subsiguientes.
  - Al seleccionar datos relacionados (ej: `user.business` para obtener los flags de módulos), asegurarse de que el `select` en Prisma traiga todos los campos necesarios y que el tipo del objeto resultante se maneje correctamente al aplanar los datos en `req.user`.
- **Flujo de Datos en Frontend (Hooks y LocalStorage):**
  - Es crucial que el hook responsable de cargar el perfil del usuario (ej: `useLayoutUserData`) obtenga todos los datos necesarios de la API (`/api/profile`), incluyendo los nuevos flags de módulos, y los guarde/exponga correctamente.
  - Si un componente depende de estos flags (ej: `AdminNavbar`), pero el hook no los provee, la UI condicional no funcionará como se espera. La depuración implica verificar la respuesta de `/api/profile` y el contenido de `localStorage`.

_(Para una guía más exhaustiva de otros problemas específicos, consulta [TROUBLESHOOTING_GUIDE.md](./TROUBLESHOOTING_GUIDE.md))_

---

## 5. Próximos Pasos Inmediatos / Prioridades (Actualizado) ⏳📌

1.  **(Prioridad Principal) Desarrollo Módulo "LoyalPyME Camarero" (LC):**
    - **Objetivo:** Empezar la implementación del módulo LC, dado el interés del inversor.
    - **Tareas Inmediatas (LC):**
      1.  **Diseño y Migración de Base de Datos (LC):** Finalizar y aplicar los modelos Prisma para Mesas, Carta Digital (Categorías, Ítems, Modificadores), Pedidos, Personal LC.
      2.  **Backend LC (Gestión Carta):** Implementar rutas, controladores y servicios para el CRUD de la Carta Digital por el `BUSINESS_ADMIN`. Proteger estas rutas con `checkModuleActive('CAMARERO')`.
      3.  **Frontend LC (Gestión Carta):** Crear las páginas de administración para la Carta Digital en `/admin/dashboard/camarero/menu-editor` (o similar). Asegurar que el enlace en `AdminNavbar` y la tarjeta en `AdminOverview` para esta sección solo aparezcan si `isCamareroActive` es `true`.
2.  **(Opcional - Menor Prioridad) Pulido Super Admin y Admin Overview:**
    - **Internacionalización (i18n) de `SuperAdminPage.tsx`:** Completar si no se hizo.
    - **Internacionalización (i18n) de `AdminOverview.tsx`:** Añadir claves para las nuevas tarjetas del módulo Camarero.
3.  **(A Evaluar) Funcionalidades LCo Pausadas:**
    - Revisar el `DEVELOPMENT_PLAN.md` para las funcionalidades de LCo que estaban en curso o planeadas (ej: "Mi Perfil Cliente con foto", "Ofertas y Noticias LCo") y decidir si se retoman después de un MVP de LC o se posponen indefinidamente.

_(Para ver la hoja de ruta completa V1.0 y post-V1.0, y el backlog, consulta [DEVELOPMENT_PLAN.md](./DEVELOPMENT_PLAN.md))_

---

## 6. Información Adicional ℹ️

- Licencia: **MIT**. (Ver archivo `LICENSE` en la raíz del proyecto).

---
