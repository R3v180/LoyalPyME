# Guía Rápida de Troubleshooting - LoyalPyME

**Fecha de Última Actualización:** 29 de Abril de 2025

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

**2. Backend: Cambios en `.ts` No Se Reflejan / Ruta Nueva da 404**

- **Síntomas:** Modificas código, `yarn build` OK (o `tsc -w` OK), pero la API se comporta igual o la nueva ruta no funciona.
- **Causa:** El proceso `node` (ejecutado por `nodemon` o manualmente) no se reinició para cargar los cambios compilados en `dist/`.
- **Solución Crítica:** Después de **CADA** `yarn build` (o después de que `tsc --watch` termine), **SIEMPRE DETENER y REINICIAR** el proceso `node dist/index.js` (o asegurarse que `nodemon` lo haga). Si persiste, forzar limpieza: `rm -rf dist && yarn build && node dist/index.js`.

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

---

_(Fin de la Guía)_
