# Guía Rápida de Troubleshooting - LoyalPyME

**Fecha de Última Actualización:** 29 de Abril de 2025

---

Esta guía recopila los problemas técnicos más comunes encontrados durante el desarrollo de LoyalPyME, sus posibles causas y las soluciones prácticas que han resultado efectivas. Es una referencia rápida para agilizar el proceso de depuración.

---

## Problemas Comunes y Soluciones

### 1. Backend: Inestabilidad, Errores o `SyntaxError` con `yarn dev`

- **Síntomas:** El servidor backend (`yarn dev`) se reinicia inesperadamente, muestra `SyntaxError: Cannot use import statement outside a module`, o no refleja cambios.
- **Causa Raíz:** Conflictos con `ts-node` / `ts-node-dev` y el manejo de módulos ES/CJS en Node v18/v20 en este entorno.
- **Solución Recomendada (Workaround Estable):** Usar el método de **dos terminales**:
  1.  **Terminal 1 (Compilación continua):** `cd backend && npx tsc --watch`
  2.  **Terminal 2 (Ejecución y reinicio):** `cd backend && npx nodemon dist/index.js`
  3.  Al guardar cambios en archivos `.ts`, `tsc --watch` recompilará a `dist/`, y `nodemon` reiniciará automáticamente el servidor `node` que lee desde `dist/`.
- **Alternativa (Manual):** `yarn build && node dist/index.js` (requiere parar y repetir tras cada cambio).

### 2. Frontend -> Backend: Fallo de Login o Acceso a Rutas Públicas (Error 401 / Conexión)

- **Síntomas:** Errores de "Credenciales inválidas", "Error de red", 401, o conexión rechazada en login/registro/recuperación contraseña.
- **Estado:** **RESUELTO** (Backend v1.3.0+, Frontend v1.3.0+)
- **Causa Raíz Antigua:** Middleware `authenticateToken` aplicado globalmente a `/api`, interceptando llamadas públicas a `/api/auth/...`.
- **Solución Aplicada:** Middleware `authenticateToken` y `checkRole` se aplican ahora individualmente solo a las rutas protegidas en `backend/src/index.ts`. `authRouter` se monta en `/api/auth` sin autenticación previa. Frontend usa `axiosInstance` con ruta relativa para `/auth/...`.

### 3. Backend: Error de Build `TS1192: Module ... has no default export`

- **Síntomas:** `yarn build` falla.
- **Causa Raíz:** `import Nombre from '...'` cuando el módulo no tiene `export default`.
- **Solución:** Cambiar a `import { Nombre } from '...'` o `import * as Nombre from '...'`.

### 4. PowerShell: Errores de Sintaxis o Parámetros al Usar `curl`

- **Síntomas:** `curl` (alias de `Invoke-WebRequest`) no reconoce parámetros `-X`, `-H`, `-d`. Error "No se puede enlazar el parámetro...".
- **Solución:** Usar `Invoke-WebRequest` o `Invoke-RestMethod` con sintaxis PowerShell (`-Method`, `-Headers @{}`, `-Body`, `-ContentType`, `-Uri`).

### 5. PowerShell: Error de Parseo JSON con `Invoke-RestMethod -Body`

- **Síntomas:** Falla `Invoke-RestMethod` con JSON complejo. Backend reporta JSON malformado.
- **Solución:** Construir cuerpo como hashtable PowerShell (`@{...}`) y pasar a `ConvertTo-Json -Depth N` antes de asignar a `-Body`.

### 6. Backend: Cambios en Código Fuente (`.ts`) No Se Reflejan en Ejecución

- **Síntomas:** Modificas `.ts`, `yarn build` OK (o `tsc -w` compila), pero la app se comporta igual.
- **Causa Raíz:** El proceso `node` (manejado por `nodemon` en Terminal 2) no se reinició o no leyó los cambios compilados en `dist/`.
- **Solución (con método 2 terminales):** Asegúrate de que `nodemon` (Terminal 2) detecta los cambios en `dist/` y muestra "[nodemon] restarting due to changes...". Si no lo hace, verifica que `tsc --watch` (Terminal 1) está compilando sin errores. Como último recurso, para y reinicia `nodemon` (Terminal 2).

### 7. Frontend: Funcionalidad No Se Aplica o Elementos No Aparecen Tras Actualizar Código (`yarn dev`)

- **Síntomas:** Botón no hace nada, elemento falta, estilo viejo, cambio en `vite.config.ts` no aplica.
- **Causa Raíz:** HMR falló, caché navegador, archivo no guardado, **cambio en `vite.config.ts` requiere reinicio**.
- **Solución:** 1. Verificar código local. 2. Verificar terminal `yarn dev`. 3. Refresco forzado navegador (Ctrl+Shift+R). 4. **Reiniciar** `yarn dev` (`Ctrl+C` y `yarn dev --host`), especialmente tras cambios en `vite.config.ts`.

### 8. General: Mensajes de Éxito/Error en UI en Idioma Incorrecto

- **Síntomas:** Notificaciones Mantine o alertas en inglés.
- **Estado:** Parcialmente Mitigado (Codificación), Solución Pendiente (i18n).
- **Causa Raíz:** Mensajes hardcodeados en inglés en el código (backend o frontend). Problemas de codificación de caracteres (ej: `Ã³`).
- **Solución Aplicada Parcial:** Se corrigieron la mayoría de los problemas de codificación (`Ã³`, etc.) durante la limpieza.
- **Solución Pendiente:** Implementar **internacionalización (i18n)** en el frontend para manejar todos los textos de UI de forma centralizada y traducible.

### 9. TypeScript: Errores Relacionados con Dependencias Circulares (`TS2303`, `TS2459`, etc.)

- **Síntomas:** Errores de ciclo de importación entre archivos.
- **Estado:** RESUELTO (Detectado y corregido en `tier-logic.service` / `tier-logic.helpers`).
- **Solución Aplicada:** Mover la función causante del ciclo o rediseñar para que una de las partes devuelva datos en lugar de llamar a la otra.

### 10. TypeScript: Error `TS2307: Cannot find module '...'`

- **Síntomas:** `yarn build` falla o editor muestra error, no encuentra módulo importado.
- **Causa Raíz:** Ruta incorrecta en `import`.
- **Solución:** Verificar y corregir la ruta relativa (`../`, `./`) y el nombre exacto del archivo/carpeta en la sentencia `import`.

### 11. TypeScript: Errores `TS2305` o similares con `@prisma/client`

- **Síntomas:** TS no encuentra tipos/enums de Prisma o no reconoce campos nuevos tras migración.
- **Causa Raíz:** Prisma Client no sincronizado con `schema.prisma`. `npx prisma generate` no se ejecutó o falló.
- **Solución:** 1. DETENER backend. 2. Ejecutar `npx prisma generate`. 3. Reiniciar backend. 4. (Opcional) Reiniciar TS server del editor.

### 12. Backend: Nueva Ruta o Router Modificado Devuelve 404

- **Síntomas:** Añades/modificas ruta (`.routes.ts`) o montas router (`index.ts`), compilas (`tsc -w`), pero la petición da 404.
- **Causa Raíz:** El servidor `nodemon` (Terminal 2) no se reinició para cargar la nueva estructura de rutas desde `dist/`.
- **Solución:** Asegúrate de que `nodemon` se reinicia tras la compilación de `tsc -w`. Si no, para (`Ctrl+C`) y reinicia `nodemon` manualmente en la Terminal 2.

### 13. Frontend: Errores de Tipado o Props con Mantine v7

- **Síntomas:** Errores TS por props obsoletas (`height`, `weight`, `leftIcon`) o componentes renombrados/anidados (`Navbar`, `Header`).
- **Solución:** Consultar docs Mantine v7. Usar props nuevas (`fw`, `leftSection`) y componentes anidados (`AppShell.Navbar`, `AppShell.Header`).

### 14. TypeScript: Advertencias Variables/Imports No Utilizadas (`TS6133`, `TS6196`)

- **Síntomas:** Warnings sobre declaraciones no leídas.
- **Estado:** Mayormente Resuelto durante la limpieza general.
- **Solución:** Eliminar declaraciones o `import` innecesarios.

### 15. Error al Escanear QR desde Dispositivo Móvil (`setPhotoOptions failed`)

- **Síntomas:** Cámara no inicia o falla en móvil con error `setPhotoOptions failed` en consola remota.
- **Estado:** **RESUELTO**.
- **Causa Raíz:** Incompatibilidad/bug en librería `react-qr-reader@3.0.0-beta-1`.
- **Solución Aplicada:** Se reemplazó `react-qr-reader` por `html5-qrcode` en el frontend (`QrValidationSection.tsx` y hook `useQrScanner.ts`).

### 16. Error TypeScript `Property 'constraints' is missing...`

- **Síntomas:** Error TS al quitar prop `constraints` de `QrReader`.
- **Estado:** **RESUELTO** (Componente `QrReader` eliminado).
- **Causa Raíz:** Tipos de `react-qr-reader`.
- **Solución Aplicada:** Cambio de librería a `html5-qrcode`.

### 17. Error TypeScript `'video' does not exist in type 'MediaTrackConstraints'`

- **Síntomas:** Error TS al usar `constraints={{ video: true }}`.
- **Estado:** **RESUELTO** (Componente `QrReader` eliminado).
- **Causa Raíz:** Tipos de `react-qr-reader`.
- **Solución Aplicada:** Cambio de librería a `html5-qrcode`.

### 18. Error Git `Deletion of directory 'images' failed` en Windows durante `git pull`

- **Síntomas:** Falla `git pull` al intentar borrar una carpeta bloqueada.
- **Causa Raíz:** Programa Windows (Explorador, VSCode, etc.) bloqueando la carpeta.
- **Solución:** Cerrar programas -> Abortar/resetear merge si es necesario (`git merge --abort` / `git reset --hard HEAD`) -> `git pull` -> Resolver conflictos (ej: `git add images && git commit`) -> `git push`.

### 19. Backend: API no se conecta a la Base de Datos (`PrismaClientInitializationError: Can't reach database server at localhost:5432`)

- **Síntomas:** Múltiples endpoints fallan con error 500. Logs del backend muestran `PrismaClientInitializationError`. Frontend puede mostrar "Server error during authentication".
- **Causa Raíz:** El servidor PostgreSQL no está corriendo o no es accesible, o la `DATABASE_URL` en `.env` es incorrecta. Frecuente después de reinicios inesperados del sistema (ej: corte de luz).
- **Solución:**
  1.  Verificar que el servicio **PostgreSQL está en ejecución** (ver `services.msc` o Task Manager en Windows). Si no, iniciarlo.
  2.  Si el servicio no inicia (ej: error "archivo no encontrado"), **reinstalar PostgreSQL** podría ser necesario.
  3.  Verificar que la **`DATABASE_URL` en `backend/.env`** es correcta (host, puerto 5432, usuario, contraseña, nombre de la base de datos).
  4.  **Si reinstalaste PostgreSQL o la base de datos está vacía:** Ejecutar `npx prisma migrate dev` en la carpeta `backend/` para recrear las tablas.

### 20. Frontend: Formulario (ej: Configuración Tiers) parece vacío después de guardar con éxito

- **Síntomas:** Guardas cambios en un formulario que usa Mantine Form (`useForm`), aparece la notificación de éxito, pero los campos se muestran vacíos o con valores por defecto, no los recién guardados. El botón "Guardar" se deshabilita correctamente.
- **Estado:** **RESUELTO** (en `TierSettingsPage.tsx v1.1.7`).
- **Causa Raíz:** Llamar a `form.reset()` inmediatamente después de `form.setValues()` dentro de la misma función (ej: `WorkspaceConfig`). `reset()` revierte a los `initialValues` conocidos _antes_ de la llamada a `setValues`, ocultando los datos recién establecidos.
- **Solución Aplicada:** Usar `form.initialize(datos)` después de cargar los datos iniciales (`WorkspaceConfig`) y también después de guardar con éxito (`handleSaveChanges`) usando los datos recién guardados. `initialize` actualiza tanto los valores actuales como los `initialValues` usados para el estado `dirty`. Eliminar llamadas innecesarias a `WorkspaceConfig` dentro de `handleSaveChanges`.

---

_(Fin de la Guía)_
