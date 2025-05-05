# Guía Rápida de Troubleshooting - LoyalPyME

**Fecha de Última Actualización:** 05 de Mayo de 2025

---

Esta guía recopila problemas técnicos significativos o no obvios encontrados durante el desarrollo de LoyalPyME, sus causas y soluciones, para agilizar futuras depuraciones.

---

## Problemas Comunes y Soluciones

**1. Backend: Inestabilidad con `yarn dev` (nodemon + ts-node)**

- **Síntomas:** Reinicios inesperados, errores `SyntaxError`, cambios no reflejados.
- **Causa:** Conflictos/inestabilidad de `ts-node-dev`/`nodemon` con módulos ES/CJS en el entorno.
- **Solución Estable:** Usar **dos terminales** en `backend/`:
  1. `npx tsc --watch` (Compilación continua)
  2. `npx nodemon dist/index.js` (Ejecución con reinicio automático al cambiar `dist/`)

**2. Backend: Cambios en `.ts` No Se Reflejan / Ruta Nueva da 404 / Lógica Antigua se Ejecuta**

- **Síntomas:** Modificas código en un archivo `.ts` (ej: un servicio), pero la API sigue comportándose como antes (ej: no guarda un campo nuevo, usa lógica vieja). O creas una ruta nueva y da 404.
- **Causa:** El proceso `node` que ejecuta `nodemon` solo vigila cambios en la carpeta `dist/`. Si no tienes `npx tsc --watch` corriendo o no has ejecutado `yarn build` manualmente después de guardar el `.ts`, los cambios no se compilan a JavaScript en `dist/`. Además, si añades una nueva ruta, debes asegurarte de montarla con `app.use()` en `index.ts`.
- **Solución Crítica:** **SIEMPRE** asegúrate de que los cambios en `.ts` se compilen a `dist/` (`tsc --watch` o `yarn build`). Si añades rutas, asegúrate de que `index.ts` las importa y las monta (`app.use(...)`). **Reinicia `nodemon`** después de cambiar `index.ts`. Si persiste, forzar limpieza: `rm -rf dist && yarn build && npx nodemon dist/index.js`. _(Visto con rutas /api/customer/activity y /api/uploads/image)_

**3. Frontend: Cambios No Se Aplican (Vite HMR)**

- **Síntomas:** Funcionalidad no cambia, estilos viejos, etc., tras guardar archivo.
- **Solución:** 1. Verificar terminal `yarn dev` por errores. 2. Refresco forzado navegador (Ctrl+Shift+R). 3. **Reiniciar `yarn dev`** (`Ctrl+C` y `yarn dev --host`), especialmente tras cambios en `vite.config.ts`.

**4. Backend: Errores `TS2305` (`Module '"@prisma/client"' has no exported member 'User', 'Reward', etc.`)**

- **Síntomas:** TypeScript no encuentra **ninguno** de los tipos/enums generados por Prisma al importar desde `@prisma/client`, incluso después de una migración exitosa. Ocurre al compilar (`npx tsc`).
- **Causa:** La generación del Cliente Prisma (`node_modules/.prisma/client`) está incompleta, corrupta, o no se ejecutó/terminó correctamente después de la última migración (`prisma migrate`). `tsc` no puede encontrar las definiciones de tipos necesarias.
- **Solución Crítica:** Ejecutar explícitamente **`npx prisma generate`** en `backend/` después de cada `prisma migrate dev` exitoso. Asegurarse de que `prisma generate` termina sin errores. Reiniciar el servidor TS del editor si es necesario. Si persiste, borrar `node_modules/.prisma/client` manualmente y regenerar.

**5. Backend: Dependencias Circulares (TS)**

- **Síntomas:** Errores de ciclo de importación entre archivos.
- **Solución:** Mover definiciones (interfaces, tipos) a archivos independientes e importar desde allí.

**6. Backend: API no se conecta a Base de Datos (`PrismaClientInitializationError`)**

- **Síntomas:** Endpoints fallan con 500, logs muestran error de conexión a DB. Frecuente tras reinicios del sistema.
- **Solución:** 1. Verificar que servicio PostgreSQL corre. 2. Verificar `DATABASE_URL` en `.env`. 3. Ejecutar `npx prisma migrate dev` si la BD está vacía/corrupta.

**7. Frontend: Error 401 al llamar a Rutas Públicas Backend desde `axiosInstance`**

- **Estado:** Resuelto (Backend v1.3.0+).
- **Causa Antigua:** Middleware `authenticateToken` aplicado globalmente a `/api`.
- **Solución Aplicada:** Middlewares aplicados individualmente a rutas protegidas en `backend/src/index.ts`. Rutas públicas (`/api/auth/*`, `/public/*`) no llevan middleware global. Usar `axiosInstance` para `/api/*` (incl. `/api/auth`) y `axios` base para `/public/*`.

**8. Frontend: Formulario Mantine parece vacío tras cargar datos**

- **Estado:** Resuelto (en `TierSettingsPage.tsx`).
- **Causa Antigua:** Llamada incorrecta a `form.reset()` después de `form.setValues()` en la carga.
- **Solución Aplicada:** Eliminar `form.reset()` de la función de carga inicial. Usar `form.setValues()` y luego `form.reset()` _después_ de un guardado exitoso para actualizar valores base y limpiar estado 'dirty'.

**9. Mobile: Escáner QR falla (`setPhotoOptions failed`)**

- **Estado:** Resuelto (Obsoleto).
- **Causa Antigua:** Bug/incompatibilidad en `react-qr-reader`.
- **Solución Aplicada:** Reemplazo por `html5-qrcode` y uso del hook `useQrScanner`.

**10. Git: Error `Deletion of directory '...' failed` (Windows)**

- **Causa:** Bloqueo de archivo/carpeta por otro programa.
- **Solución:** Cerrar programas -> `git merge --abort` / `git reset --hard HEAD` (si necesario) -> `git pull`.

**11. Testing Backend (Vitest): Test file no se descubre**

- **Síntomas:** Tests en archivo `.ts` no se ejecutan.
- **Causa:** Nombre de archivo no termina en `.test.ts` o `.spec.ts`.
- **Solución:** Renombrar archivo correctamente.

**12. Testing Backend (Vitest): Mocking de Prisma falla (`Cannot read properties of undefined`, spy not called)**

- **Síntomas:** Tests unitarios de funciones que usan `new PrismaClient()` internamente fallan al intentar mockear Prisma.
- **Causa:** Instancia interna de Prisma ignora mocks globales (`vi.mock`).
- **Solución Aplicada:** **Inyección de Dependencias**. 1. Refactorizar función/helper para aceptar `prismaClient` como argumento. 2. En el test, crear mock simple y pasarlo como argumento.

**13. Testing Backend (Vitest/TS): Errores TS2352/TS2554 persistentes (Mock vs Type)**

- **Síntomas:** `tsc` se queja de incompatibilidad de tipos entre el mock simple pasado por DI y el tipo esperado (`Pick<PrismaClient,...>`) o de número incorrecto de argumentos.
- **Causa:** Discrepancia estructural grande entre mock y tipo real, o TS server cache/resolución incorrecta de firmas tras refactor.
- **Solución Aplicada:** 1. Asegurar archivo fuente (`.ts`) guardado y compilado (`yarn build`). 2. Reiniciar servidor TS en VS Code. 3. Si persiste, usar `// @ts-expect-error` en la línea anterior a la llamada dentro del archivo `.test.ts`.

**14. Testing Integración (Supertest): Error 401 devuelve `text/plain`, no JSON**

- **Síntomas:** Test que espera 401 por falta de token falla por `Content-Type`.
- **Causa:** Middleware `authenticateToken` usa `res.sendStatus(401)` que responde con `text/plain`.
- **Solución:** En esos tests específicos, eliminar la aserción `.expect('Content-Type', /json/)`.

**15. Testing Integración (Supertest): Test Login 401 (Éxito esperado)**

- **Causa:** Credenciales hardcodeadas en el test no coinciden con las de la BD de prueba.
- **Solución:** Verificar/corregir usuario admin de test en BD. Considerar usar variables de entorno para credenciales de test.

**16. Testing Integración (Supertest): Setup Falla - Registro Cliente (DNI Inválido)**

- **Causa:** DNI generado aleatoriamente en `beforeAll` no tenía letra de control válida.
- **Solución:** Añadir función helper `generateValidDni()` al test setup para crear DNIs válidos.

**17. Testing Integración (Supertest): Ruta `PATCH` devuelve HTML/404**

- **Causa:** Olvido de definir la ruta `router.patch(...)` en el archivo `.routes.ts`.
- **Solución:** Añadir la definición de la ruta PATCH en el router.

**18. Testing Integración (Supertest): Error 500 en lugar de 400 (Validación) o 409 (Conflicto)**

- **Causa:** Falta validación de entrada en controlador; Error P2002 (Unique Constraint) de Prisma no manejado específicamente en el `catch` del controlador.
- **Solución:** Añadir validaciones en controlador; Añadir `if (error instanceof Error && error.message.includes(...))` específico para unicidad en `catch` para devolver 409.

**19. Frontend (i18n): Claves (`loginPage.title`, `desc_REDEEMED`) se muestran en lugar de texto traducido**

- **Causa:** Clave no encontrada en el archivo de idioma (`translation.json`) cargado para el idioma actual (ej: `en`). Puede ser por error tipográfico en la clave (código vs JSON), error de sintaxis en el archivo JSON que impide su carga completa, o clave no añadida a **todos** los archivos de idioma necesarios.
- **Solución:** Verificar coincidencia exacta de claves. Validar sintaxis JSON. Asegurar que la clave existe en los archivos de _todos_ los idiomas soportados (`es`, `en`). Usar `debug: true` en `i18n.ts` y revisar consola por `i18next: missingKey ...`.

**20. Frontend: Banderas de Idioma (Emoji Unicode) no se renderizan**

- **Causa:** Falta de soporte de fuente en el sistema/navegador.
- **Solución:** Usar una librería como `react-country-flag` que utiliza SVG.

**21. Frontend: Navbar Móvil Admin no se cierra automáticamente**

- **Causa:** Componente Navbar no tenía acceso a función `close`.
- **Solución:** Pasar `close` (de `useDisclosure`) como prop desde Layout a Navbar y llamarla en `onClick` del enlace.

**22. PowerShell: Sintaxis para `curl` y JSON**

- **Solución:** Usar `Invoke-RestMethod` con parámetros PowerShell (`-Method`, `-Headers @{}`, `-Body ($obj | ConvertTo-Json -Depth N)`).

**23. Backend: Subida de Imágenes Cloudinary Falla (Error 500 o 401)**

- **Síntomas:** Error 500/401 desde backend al subir, logs indican `Invalid cloud_name` o `Unknown API key`.
- **Causas:** Credenciales (`.env`) incorrectas/mezcladas, backend no reiniciado tras cambiar `.env`, error lectura `.env`, problema cuenta Cloudinary.
- **Solución Aplicada:** Crear cuenta Cloudinary nueva, obtener credenciales nuevas, ponerlas correctamente en `.env` (`CLOUDINARY_CLOUD_NAME`, `_API_KEY`, `_API_SECRET`), reiniciar backend.

**24. Backend/Frontend: Campo Nuevo (ej: `imageUrl`, `name_es`) Se Guarda/Recibe Como `null` o Da Error de Tipo**

- **Síntomas:** Campo nuevo no se guarda en BD, o el frontend da error de tipo (ej: `Property 'name_es' does not exist on type 'Reward'`) al intentar usar datos de la API.
- **Causas:**
  - **Backend:** Controlador no extrae/pasa el campo al servicio; Servicio no incluye campo en `prisma.create/update`; Servicio no incluye campo en `select` al leer; `tsc` no recompiló `dist/`.
  - **Frontend:** Tipo/Interfaz (`types/customer.ts`) no actualizado; Hook que obtiene datos no usa/devuelve el tipo actualizado; Componente que muestra datos usa el nombre de campo antiguo.
- **Solución:** Verificar/corregir **toda** la cadena: Controlador (extracción/paso) -> Servicio (guardado) -> Servicio (lectura `select`) -> Backend Compilación (`tsc`) -> Frontend Tipo (`types/customer.ts`) -> Frontend Hook (estado/retorno) -> Frontend Componente (acceso a propiedad correcta, ej: `reward.name_es`).

**25. Mobile: Escáner QR (`html5-qrcode`) No Se Inicia / Error "Element ... not found"**

- **Síntomas:** Al abrir modal de escáner en móvil, la cámara no inicia, consola muestra `Element with ID '...' not found`.
- **Causa:** Timing: `useEffect` del hook `useQrScanner` intenta inicializar `Html5Qrcode` antes de que el DOM del modal esté completamente listo.
- **Solución/Workaround Aplicado:** En `useQrScanner.ts`, envolver la inicialización (`new Html5Qrcode`, `scannerInstance.start`) dentro de un `setTimeout(() => { ... }, 500)`. Limpiar timeout en cleanup. Corregir tipo de `useRef` para timeout a `number | null`.

**26. Backend: Error TS2307 (`Cannot find module '...'`) Persistente**

- **Síntomas:** `npx tsc` sigue fallando al importar un módulo (ej: `./uploads.service` desde `uploads.controller`) incluso después de verificar exportaciones y limpiar `dist`.
- **Causa Probable:** Nombre de archivo incorrecto en el disco (ej: `upload.controller.ts` vs `uploads.controller.ts`); Error interno en el archivo que se intenta importar (`uploads.service.ts`) que impide a `tsc` analizarlo; Problema caché `tsc`.
- **Solución:** Verificar **exactamente** el nombre del archivo en disco y en la importación. Revisar el código del archivo importado en busca de errores. Forzar recompilación limpia (`rm -rf dist && npx tsc`).

**27. Frontend: Error TS2322 (`Type '... | TFunctionDetailedResult' is not assignable to type 'string'/'ReactNode'`) Persistente**

- **Síntomas:** Error de tipo al asignar el resultado de `t()` (de i18next) a una prop que espera `string` o `ReactNode` (ej: `title` en `Timeline.Item`), incluso después de intentar conversiones (`String()`, template literals).
- **Causa Probable:** Inferencia de tipos compleja de `t()` con interpolación; Problema de tipos específico de la versión de Mantine/i18next/TS; Caché/Entorno.
- **Solución Aplicada:** Usar aserción de tipo `as string` (`prop={resultado_t as string}`) o variable intermedia tipada explícitamente (`const titulo: string = String(resultado_t); prop={titulo}`). Si persiste, resetear entorno (`rm -rf node_modules yarn.lock && yarn install`).

**28. Frontend: Error Runtime Mantine (`Tooltip component children should be an element or component that accepts ref...`)**

- **Síntomas:** La aplicación falla en runtime al renderizar un `Tooltip`.
- **Causa:** El hijo directo del `Tooltip` no es un elemento/componente válido que acepte `ref` (ej: Fragment `<>...</>`, texto suelto, o componente complejo anidado). A veces relacionado con advertencias de hidratación por whitespace.
- **Solución:** Asegurar que el hijo directo del `Tooltip` sea un único elemento válido (ej: `<ActionIcon>`, `<Button>`). Si es necesario, envolver el contenido en un `<Box>`. Limpiar espacios en blanco en JSX de tablas (`Table`, `Thead`, `Tr`, etc.).

---

_(Fin de la Guía)_
