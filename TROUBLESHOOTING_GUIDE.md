# Guía Rápida de Troubleshooting - LoyalPyME

**Fecha de Última Actualización:** 02 de Mayo de 2025

---

Esta guía recopila problemas técnicos significativos o no obvios encontrados durante el desarrollo de LoyalPyME, sus causas y soluciones, para agilizar futuras depuraciones.

---

## Problemas Comunes y Soluciones

**1. Backend: Inestabilidad con `yarn dev` (nodemon + ts-node)**

- **Síntomas:** Reinicios inesperados, errores `SyntaxError`, cambios no reflejados.
- **Causa:** Conflictos/inestabilidad de `ts-node-dev`/`nodemon` con módulos ES/CJS en el entorno.
- **Solución Estable:** Usar **dos terminales** en `backend/`:
  1.  `npx tsc --watch` (Compilación continua)
  2.  `npx nodemon dist/index.js` (Ejecución con reinicio automático al cambiar `dist/`)

**2. Backend: Cambios en `.ts` No Se Reflejan / Ruta Nueva da 404 / Lógica Antigua se Ejecuta**

- **Síntomas:** Modificas código en un archivo `.ts` (ej: un servicio), pero la API sigue comportándose como antes (ej: no guarda un campo nuevo, usa lógica vieja).
- **Causa:** El proceso `node` que ejecuta `nodemon` solo vigila cambios en la carpeta `dist/`. Si no tienes `npx tsc --watch` corriendo en otra terminal (o no has ejecutado `yarn build` manualmente después de guardar el `.ts`), los cambios no se compilan a JavaScript en `dist/` y `nodemon` no los detecta ni reinicia el servidor con el código nuevo.
- **Solución Crítica:** **SIEMPRE** asegúrate de que los cambios en `.ts` se compilen a `dist/` antes de esperar que se reflejen en la API en ejecución. Usa el método de 2 terminales (`tsc --watch` y `nodemon`) o ejecuta `yarn build` manually antes de (re)iniciar `nodemon` o `node dist/index.js`. Si persiste, forzar limpieza: `rm -rf dist && yarn build && node dist/index.js`.

**3. Frontend: Cambios No Se Aplican (Vite HMR)**

- **Síntomas:** Funcionalidad no cambia, estilos viejos, etc., tras guardar archivo.
- **Solución:** 1. Verificar terminal `yarn dev` por errores. 2. Refresco forzado navegador (Ctrl+Shift+R). 3. **Reiniciar `yarn dev`** (`Ctrl+C` y `yarn dev --host`), especialmente tras cambios en `vite.config.ts`.

**4. Backend: Errores `TS2305` / Tipos Prisma no encontrados**

- **Síntomas:** TS no encuentra tipos/enums de Prisma (`User`, `UserRole`, `PrismaClientKnownRequestError`, etc.) tras `yarn install` o `prisma migrate`.
- **Causa:** Prisma Client (`node_modules/@prisma/client`) no generado o no sincronizado.
- **Solución Crítica:** Ejecutar **`npx prisma generate`** en `backend/`. Opcional: Reiniciar servidor TS del editor.

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

- **Estado:** Resuelto.
- **Causa Antigua:** Bug/incompatibilidad en `react-qr-reader`.
- **Solución Aplicada:** Reemplazo por `html5-qrcode` y uso del hook `useQrScanner`.
- **Nota:** Este punto se refería a la librería antigua `react-qr-reader`. El problema más reciente del escáner (`html5-qrcode`) se detalla en el punto 25.

**10. Git: Error `Deletion of directory '...' failed` (Windows)** - **Causa:** Bloqueo de archivo/carpeta por otro programa. - **Solución:** Cerrar programas -> `git merge --abort` / `git reset --hard HEAD` (si necesario) -> `git pull`.

**11. Testing Backend (Vitest): Test file no se descubre** - **Síntomas:** Tests en archivo `.ts` no se ejecutan. - **Causa:** Nombre de archivo no termina en `.test.ts` o `.spec.ts`. - **Solución:** Renombrar archivo correctamente.

**12. Testing Backend (Vitest): Mocking de Prisma falla (`Cannot read properties of undefined`, spy not called)** - **Síntomas:** Tests unitarios de funciones que usan `new PrismaClient()` internamente fallan al intentar mockear Prisma. - **Causa:** Instancia interna de Prisma ignora mocks globales (`vi.mock`). - **Solución Aplicada:** **Inyección de Dependencias**. 1. Refactorizar función bajo prueba para aceptar `prismaClient` como argumento. 2. Refactorizar _todo_ el módulo helper para eliminar `new PrismaClient()` y usar DI. 3. Actualizar llamadas a los helpers en los servicios para pasar la instancia `prisma`. 4. En el test, crear mock simple y pasarlo como argumento a la función.

**13. Testing Backend (Vitest/TS): Errores TS2352/TS2554 persistentes (Mock vs Type)** - **Síntomas:** `tsc` (en `yarn build` o VS Code) se queja de incompatibilidad de tipos entre el mock simple pasado por DI y el tipo esperado (`Pick<PrismaClient,...>`) o de número incorrecto de argumentos. - **Causa:** Discrepancia estructural grande entre mock y tipo real, o TS server cache/resolución incorrecta de firmas tras refactor. - **Solución Aplicada:** 1. Asegurar que archivo fuente (`.ts`) con la firma correcta está guardado y compilado (`yarn build`). 2. Reiniciar servidor TS en VS Code (`Ctrl+Shift+P` -> Restart TS server). 3. Si persiste el TS2352/2345 en el test al pasar el mock, usar `// @ts-expect-error` en la línea anterior a la llamada dentro del archivo `.test.ts` para suprimir el error de tipo específico del test.

**14. Testing Integración (Supertest): Error 401 devuelve `text/plain`, no JSON** - **Síntomas:** Test que espera 401 por falta de token falla por `Content-Type`. - **Causa:** Middleware `authenticateToken` usa `res.sendStatus(401)` que responde con `text/plain`. - **Solución:** En esos tests específicos, eliminar la aserción `.expect('Content-Type', /json/)`.

**15. Testing Integración (Supertest): Test Login 401 (Éxito esperado)** - **Causa:** Credenciales hardcodeadas en el test no coinciden con las de la BD de prueba. - **Solución:** Verificar y usar credenciales correctas en el test.

**16. Testing Integración (Supertest): Setup Falla - Registro Cliente (DNI Inválido)** - **Causa:** DNI generado aleatoriamente en `beforeAll` no tenía letra de control válida. - **Solución:** Añadir función helper `generateValidDni()` al test setup para crear DNIs válidos.

**17. Testing Integración (Supertest): Ruta `PATCH` devuelve HTML/404** - **Causa:** Olvido de definir la ruta `router.patch(...)` en el archivo `.routes.ts` correspondiente. - **Solución:** Añadir la definición de la ruta PATCH en el router.

**18. Testing Integración (Supertest): Error 500 en lugar de 400 (Validación) o 409 (Conflicto)** - **Causa:** Falta validación de entrada (ej: números negativos) en el controlador; Error P2002 (Unique Constraint) de Prisma no manejado específicamente en el `catch` del controlador para devolver 409. - **Solución:** Añadir validaciones explícitas en controlador _antes_ de llamar al servicio; Añadir `if (error instanceof Error && error.message.includes(...))` específico para error de unicidad en el `catch` del controlador para devolver 409.

**19. Frontend (i18n): Claves (`loginPage.title`) se muestran en lugar de texto traducido** - **Causa:** Archivos de traducción (`translation.json`) no encontrados o no cargados. Generalmente por ubicación incorrecta de la carpeta `public/locales` o error de sintaxis en el JSON. - **Solución:** Asegurar estructura `frontend/public/locales/{lng}/translation.json`. Validar sintaxis JSON. Vaciar caché del navegador y recargar forzadamente.

**20. Frontend: Banderas de Idioma (Emoji Unicode) no se renderizan** - **Causa:** Falta de soporte de fuente en el sistema/navegador específico. - **Solución:** Usar una librería como `react-country-flag` que utiliza SVG.

**21. Frontend: Navbar Móvil Admin no se cierra automáticamente** - **Causa:** Componente Navbar no tenía acceso a función `close`. - **Solución:** Pasar `close` (de `useDisclosure`) como prop desde Layout a Navbar y llamarla en `onClick` del enlace.

**22. PowerShell: Sintaxis para `curl` y JSON** - **Solución:** Usar `Invoke-RestMethod` con parámetros PowerShell (`-Method`, `-Headers @{}`, `-Body ($obj | ConvertTo-Json -Depth N)`).

**23. Backend: Subida de Imágenes Cloudinary Falla (Error 500 o 401 en API `/upload/...`)** - **Síntomas:** Error 500 desde el backend al intentar subir. Los logs del backend muestran errores específicos de Cloudinary como `Invalid cloud_name <tu_cloud_name>` o `Unknown API key <tu_api_key>` (a menudo con `http_code: 401`). Esto ocurre incluso si las credenciales en `.env` _parecen_ correctas. - **Causas Posibles Detalladas:** - **Credenciales Incorrectas/Mezcladas:** La causa MÁS probable. Verificar **meticulosamente** en el dashboard de Cloudinary que el `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY` y `CLOUDINARY_API_SECRET` en `backend/.env` coinciden **exactamente** (¡mayúsculas/minúsculas!) con los de la **misma** cuenta/proyecto Cloudinary. Es fácil confundir el "Key Name" con el "Cloud Name". - **Backend No Reiniciado:** Imprescindible reiniciar (Ctrl+C, `npx nodemon...`) tras CUALQUIER cambio en `.env`. - **Error de Lectura `.env`:** Problemas con `dotenv` o cómo se carga el archivo `.env`. Probar a configurar con la variable única `CLOUDINARY_URL=cloudinary://KEY:SECRET@CLOUD_NAME` en `.env` y simplificar `cloudinary.config.ts` para que no llame a `cloudinary.config()` puede ayudar a diagnosticar (aunque la configuración final recomendada es con variables separadas). - **Problema de Cuenta Cloudinary:** Una cuenta nueva o antigua con algún problema interno. - **Solución Aplicada (Tras Varios Intentos):** 1. **Crear una cuenta de Cloudinary completamente nueva.** 2. Obtener las **nuevas** credenciales (Cloud Name, API Key, API Secret) de esta cuenta nueva. 3. Asegurarse de que `cloudinary.config.ts` use la configuración estándar leyendo de `process.env`. 4. Poner las **nuevas y correctas** credenciales en las variables separadas (`CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET`) en `backend/.env`. 5. **Reiniciar el backend**. 6. Verificar los logs de arranque del backend para confirmar que lee las credenciales desde `.env`. 7. Probar la subida.

**24. Backend/Frontend: Campo Nuevo (ej: `imageUrl`) Se Guarda/Recibe Como `null` o No Aparece** - **Síntomas:** La subida de imagen funciona (se obtiene URL), pero al guardar/editar la entidad (Recompensa), la URL no se guarda en la BD (`imageUrl` queda `null`). Por tanto, no se muestra después. - **Causas Posibles:** - **Backend (Controlador):** El handler del controlador (ej: `createRewardHandler` en `rewards.controller.ts`) **no extrae** el campo nuevo (`imageUrl`) del `req.body` y/o **no lo pasa** a la función del servicio correspondiente. - **Backend (Servicio - Guardado):** La función del servicio (ej: `createReward`) no incluye el campo en el objeto `data` de `prisma.create`. - **Backend (Servicio - Actualización):** La función del servicio (ej: `updateReward`) no incluye específicamente el campo `imageUrl` en el `data` de `prisma.update` (aunque pasar el `updateData` completo debería funcionar si el controlador lo envía). - **Backend (Servicio - Lectura):** La función del servicio que lee (ej: `getPendingGrantedRewards` en `customer.service.ts`) usa `select` en Prisma pero **olvida** incluir `imageUrl: true` (o `reward: { select: { ..., imageUrl: true } }` si es anidado). - **Backend (Compilación):** Los cambios en archivos `.ts` no se compilaron a `dist/` (`yarn build` o `npx tsc --watch`). - **Frontend (Tipo):** El tipo/interfaz usado en el frontend (`DisplayReward`, `Reward` en hooks) no incluye el campo `imageUrl?`. - **Solución Aplicada:** 1. **Verificar Controlador:** Asegurarse de que el controlador extrae `imageUrl` de `req.body` y lo pasa al llamar al servicio de creación/actualización (`rewards.controller.ts`). 2. **Verificar Servicio (Guardar):** Confirmar que el servicio recibe `imageUrl` y lo incluye en `prisma.create/update` (`rewards.service.ts`). 3. **Verificar Servicio (Leer):** Revisar **TODAS** las funciones de servicio que devuelven recompensas (`rewards.service.ts`, `customer.service.ts`) y asegurarse de que incluyan `imageUrl: true` si usan `select`. 4. **Verificar Tipos Frontend:** Asegurarse de que todas las interfaces/tipos relevantes en el frontend (`types/customer.ts`, hooks) incluyan `imageUrl?: string | null;`. 5. **Compilar y Reiniciar Backend.** 6. **Verificar Base de Datos:** Comprobar directamente en la BD si el campo (`imageUrl`) existe en la tabla `Reward` y si se guarda el valor. 7. **(Usar Logs):** Añadir `console.log` en cada paso (controller, service-save, service-read, hook) para ver dónde se pierde el dato `imageUrl`.

**25. Mobile: Escáner QR (`html5-qrcode`) No Se Inicia / Error "Element ... not found"** - **Síntomas:** Al intentar abrir el escáner QR en un dispositivo móvil (a través de un Modal), la cámara no se inicia y la consola del navegador móvil muestra `Element with ID 'html5qr-code-reader-region' not found`. - **Causa:** Problema de timing. El `useEffect` en el hook `useQrScanner` que inicializa la librería `Html5Qrcode` se ejecuta _antes_ de que React/Mantine haya terminado de renderizar completamente el contenido del Modal (incluyendo el `<div>` o `<Box>` con el ID `html5qr-code-reader-region`) en el DOM real. - **Solución/Workaround Aplicado:** 1. Modificar el `useEffect` dentro del hook `useQrScanner.ts`. 2. Envolver la lógica de inicialización (`document.getElementById`, `new Html5Qrcode`, `scannerInstance.start`) dentro de un `setTimeout(() => { ... }, 100)` (o un valor pequeño similar). Esto da un breve respiro para que el DOM se actualice antes de buscar el elemento. 3. Asegurarse de manejar correctamente la limpieza del `setTimeout` en la función de retorno del `useEffect`. - **Error Secundario (TypeScript):** Al usar `setTimeout`, el tipo de retorno para la `ref` del timeout debe ser `number` (navegador) y no `NodeJS.Timeout` (Node.js). Corregir el tipo en `useRef<number | null>(null)`.

---

_(Fin de la Guía)_
