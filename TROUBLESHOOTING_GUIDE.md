# Guía Rápida de Troubleshooting - LoyalPyME

**Fecha de Última Actualización:** 28 de Abril de 2025

---

Esta guía recopila los problemas técnicos más comunes encontrados durante el desarrollo de LoyalPyME, sus posibles causas y las soluciones prácticas que han resultado efectivas. Es una referencia rápida para agilizar el proceso de depuración.

---

## Problemas Comunes y Soluciones

_(Las secciones 1-9 y 11-14 se mantienen con ajustes menores o sin cambios)_

### 1. Backend: Inestabilidad, Errores o `SyntaxError` con `yarn dev`

- **Síntomas:** El servidor backend (`yarn dev`) se reinicia inesperadamente, muestra errores inconsistentes (`SyntaxError: Cannot use import statement outside a module`), o no refleja cambios correctamente.
- **Causa Raíz:** Conflictos o inestabilidades potenciales con la combinación de `nodemon`, `ts-node` / `ts-node-dev` y el entorno de ejecución (Node.js v20 en Windows en este caso) respecto a la interpretación de módulos CommonJS vs ES Modules, incluso con `tsconfig.json` configurado para `commonjs`. Las configuraciones habituales (`--files`, `ts-node` en `tsconfig.json`, `ts-node-dev`) no resolvieron el problema.
- **Solución Recomendada (Temporal):** Optar por el flujo de build y ejecución que **sí** funciona de forma estable:
  1.  **Detén** el servidor backend (`Ctrl+C`).
  2.  **(Opcional, si hay dudas) Elimina `dist`:** `rm -rf dist` (Linux/Mac/Git Bash) o `Remove-Item -Recurse -Force ./dist` (PowerShell).
  3.  **Compila** el código TypeScript a JavaScript: `yarn build` (ejecuta `npx tsc`). Verifica que no haya errores de compilación.
  4.  **Ejecuta** el código compilado: `node dist/index.js`.
  5.  **Importante:** Repetir pasos (al menos 1, 3 y 4) después de cada cambio en el código `.ts` del backend.

### 2. Frontend -> Backend: Fallo de Login o Acceso a Rutas Públicas (Error 401 / Conexión)

- **Síntomas:** Errores de "Credenciales inválidas" o "Error de red" en login/registro/recuperación contraseña. Consola del navegador muestra 401 o conexión rechazada para `/auth/...`.
- **Causa Raíz:** Uso de `axiosInstance` (con `baseURL=/api` y token automático) para rutas que deberían ser públicas y no requieren token (ej: `/auth/login`, `/auth/register`). El middleware `authenticateToken` aplicado globalmente a `/api` en `index.ts` interceptaba estas llamadas y devolvía 401.
- **Solución:**
  1.  **Backend (`index.ts` v1.3.0):** Eliminar `app.use('/api', authenticateToken);`. Aplicar `authenticateToken` y `checkRole` _individualmente_ a cada router protegido montado bajo `/api` (ej: `/api/profile`, `/api/admin`, etc.). Montar `authRouter` en `/api/auth` (sin `authenticateToken` aplicado antes).
  2.  **Frontend (`LoginPage.tsx` v1.3.0, `RegisterPage.tsx` v1.4.0):** Asegurarse de usar `axiosInstance` (importado desde `../services/axiosInstance`) para llamar a las rutas relativas `/auth/login` y `/auth/register`. El `baseURL='/api'` de `axiosInstance` construirá la URL correcta `/api/auth/...` que ahora es manejada correctamente por el backend.
  3.  **Frontend (Rutas 100% Públicas):** Para llamadas que _nunca_ necesitan token y _no_ están bajo `/api` (como `GET /public/businesses/public-list`), seguir usando `axios` base con la URL relativa o completa según la configuración del proxy de Vite.

### 3. Backend: Error de Build `TS1192: Module ... has no default export`

- **Síntomas:** `yarn build` falla con este error.
- **Causa Raíz:** `import Nombre from '...'` cuando el módulo exportador no tiene `export default`.
- **Solución:** Añadir `export default` en el origen o cambiar a `import { Nombre } from '...'` o `import * as Nombre from '...'`.

### 4. PowerShell: Errores de Sintaxis o Parámetros al Usar `curl`

- **Síntomas:** `curl` (alias de `Invoke-WebRequest`) no reconoce parámetros `-X`, `-H`, `-d` como el `curl` estándar. Error "No se puede enlazar el parámetro 'Headers'. No se puede convertir el valor ... al tipo ...IDictionary".
- **Solución:** Usar el cmdlet nativo `Invoke-WebRequest` o `Invoke-RestMethod` con la sintaxis de parámetros de PowerShell:
  - `-Method GET` / `-Method POST`
  - `-Headers @{ "HeaderName" = "HeaderValue"; "OtherHeader" = "Value" }` (formato Hashtable para cabeceras)
  - `-ContentType "application/json"`
  - `-Body $jsonData` (donde `$jsonData` puede ser un string JSON o un objeto PowerShell convertido con `ConvertTo-Json`)
  - `-Uri "http://..."`

### 5. PowerShell: Error de Parseo JSON con `Invoke-RestMethod -Body`

- **Síntomas:** Falla `Invoke-RestMethod` con JSON complejo en `-Body`. Backend reporta JSON malformado.
- **Solución:** Construir el cuerpo como hashtable PowerShell (`@{clave = 'valor'; objeto = @{ anidado = $true }}`) y pasarlo a `ConvertTo-Json -Depth N` (donde N es la profundidad necesaria) antes de asignarlo a `-Body`. Ejemplo: `-Body ($miHashtable | ConvertTo-Json -Depth 5)`.

### 6. Backend: Cambios en Código Fuente (`.ts`) No Se Reflejan en Ejecución (`node dist/index.js`)

- **Síntomas:** Modificas `.ts`, `yarn build` OK, pero la app se comporta igual que antes.
- **Causa Raíz:** El proceso `node` sigue usando la versión anterior cargada en memoria o la carpeta `dist` no se actualizó correctamente.
- **Solución Crítica:** Después de **cada** `yarn build` exitoso, **SIEMPRE DETENER** (`Ctrl+C`) y **REINICIAR** (`node dist/index.js`) el servidor backend. Si persiste, **forzar limpieza:** `rm -rf dist && yarn build && node dist/index.js`.

### 7. Frontend: Funcionalidad No Se Aplica o Elementos No Aparecen Tras Actualizar Código (`yarn dev`)

- **Síntomas:** Botón no hace nada, elemento falta, estilo viejo, cambio en `vite.config.ts` no aplica.
- **Causa Raíz:** `yarn dev` (Vite HMR) no detectó el cambio, caché del navegador, archivo no guardado/incorrecto, **cambio en `vite.config.ts` requiere reinicio**.
- **Solución:** 1. Verificar/Reemplazar contenido archivo local. 2. Verificar terminal `yarn dev`. 3. Refresco forzado navegador (Ctrl+Shift+R). 4. **Reiniciar** `yarn dev` (`Ctrl+C` y `yarn dev --host`), especialmente tras cambios en `vite.config.ts`.

### 8. General: Mensajes de Éxito/Error en UI en Idioma Incorrecto

- **Síntomas:** Notificaciones Mantine o alertas en inglés en lugar de español.
- **Causa Raíz:** Mensajes generados en el **backend** (controladores/servicios) no traducidos.
- **Solución:** Localizar y traducir el string en el archivo `.ts` del backend. Recompilar y reiniciar backend. _(Nota: Esto se solucionará de forma global al implementar i18n en frontend)_.

### 9. TypeScript: Errores Relacionados con Dependencias Circulares (`TS2303`, `TS2459`, etc.)

- **Síntomas:** Errores de ciclo de importación entre archivos (ej. servicio importa de controlador y viceversa).
- **Solución:** Mover la definición causante del ciclo (interfaz, tipo) a un **archivo separado e independiente** (`.dto.ts`, `.types.ts`) e importar desde allí en ambos archivos originales.

### 10. TypeScript: Error `TS2307: Cannot find module '...'` al Construir o en Editor

- **Síntomas:** `yarn build` falla o VSCode muestra error, no encuentra un módulo importado.
- **Causa Raíz:** Ruta incorrecta en `import` (`../`, `../../`, nombre archivo/carpeta). Suele pasar tras mover/renombrar archivos o por despiste al generar código.
- **Solución:** Verificar y corregir la ruta en la sentencia `import` en el archivo que da el error. Comprobar la ubicación real y nombre exacto (mayús/minús) del archivo importado. _(Ej: Corregido en `LoginPage.tsx` y `RegisterPage.tsx`)_.

### 11. TypeScript: Errores `TS2305` o similares con `@prisma/client`

- **Síntomas:** TS no encuentra tipos/enums de Prisma (`UserRole`, `User`, etc.) o no reconoce campos nuevos tras una migración.
- **Causa Raíz:** Prisma Client (`node_modules/@prisma/client`) no está sincronizado con `schema.prisma`. `npx prisma generate` falló o no se ejecutó tras `migrate`.
- **Solución:**
  1.  **DETENER** servidor backend.
  2.  Ejecutar **`npx prisma generate`** en `backend/`. Verificar que no hay errores.
  3.  Reiniciar servidor backend.
  4.  (Opcional) Reiniciar servidor TS del editor (VSCode: Ctrl+Shift+P -> "TypeScript: Restart TS server").

### 12. Backend: Nueva Ruta o Router Modificado Devuelve 404

- **Síntomas:** Añades/modificas ruta (`.routes.ts`) o montas router (`index.ts`), compilas (`yarn build`), pero la petición da 404.
- **Causa Raíz Principal:** No reiniciaste el servidor backend (`node dist/index.js`) después de compilar cambios que afectan al enrutamiento.
- **Solución Crítica:** Tras **CUALQUIER** cambio en `index.ts` o archivos `.routes.ts`, y después de `yarn build`, **IMPRESCINDIBLE detener y reiniciar** el servidor backend. Si persiste, forzar limpieza (`rm -rf dist`).

### 13. Frontend: Errores de Tipado o Props con Mantine v7

- **Síntomas:** Errores TS: props desconocidas (`height`, `weight`, `leftIcon`), componentes no exportados (`Navbar`, `Header`).
- **Solución:** Consultar docs Mantine v7. Usar props nuevas (`fw`, `leftSection`) y componentes anidados (`AppShell.Navbar`).

### 14. TypeScript: Advertencias Variables/Imports No Utilizadas (`TS6133`, `TS6196`)

- **Síntomas:** Warnings sobre declaraciones no leídas.
- **Solución:** Eliminar declaraciones o `import` innecesarios. Usar `_variable` si el parámetro es requerido por firma pero no usado. _(Ej: Corregido en `AdminOverview.tsx`)_.

---

## **--- SECCIONES NUEVAS (Problemas Recientes) ---**

### 15. Error al Escanear QR desde Dispositivo Móvil (`setPhotoOptions failed`)

- **Síntomas:**
  - App cargada en móvil vía IP local (`https://<IP_PC>:5173`) con certificado HTTPS autofirmado aceptado.
  - Permiso de cámara solicitado por el navegador móvil y concedido por el usuario.
  - Al abrir el modal de escaneo, la cámara no se activa o se activa brevemente y falla.
  - Se muestra un mensaje de error genérico en la UI (ej: "Error al escanear...") o uno ligeramente más detallado pero inútil (ej: "...(e2: no details available)").
  - La consola del navegador móvil (vista con depuración remota USB) muestra: `Uncaught (in promise) UnknownError: setPhotoOptions failed`, originado en la librería `react-qr-reader`.
- **Diagnóstico:**
  - Se descartaron problemas de permisos y HTTPS, ya que el prompt de permisos sí aparecía.
  - Se probaron diferentes `constraints` (resolución, quitar `facingMode`) sin éxito.
  - El error `setPhotoOptions failed` apunta a un fallo interno de la librería (o su dependencia `@zxing/library`) al intentar configurar la cámara usando APIs del navegador (`ImageCapture`) que pueden ser incompatibles con el dispositivo/navegador móvil específico. La versión usada (`react-qr-reader@3.0.0-beta-1`) era antigua.
- **Causa Raíz:** Incompatibilidad o bug en `react-qr-reader@3.0.0-beta-1` al interactuar con la API de la cámara en el entorno móvil específico.
- **Solución:** Reemplazar la librería de escaneo QR en el frontend.
  1.  **Desinstalar:** `yarn remove react-qr-reader`.
  2.  **Instalar:** `yarn add html5-qrcode`.
  3.  **Refactorizar** el componente `frontend/src/components/customer/QrValidationSection.tsx` (Ver versión `2.1.2` o superior) para usar la API de `html5-qrcode`:
      - Usar `useEffect` para crear una instancia de `Html5Qrcode` asociada a un `div` específico cuando el modal se abre.
      - Llamar a `html5QrCode.start(...)` con los callbacks de éxito y error.
      - Implementar la **limpieza** en el `return` del `useEffect`: llamar a `html5QrCode.stop()` y `html5QrCode.clear()` para liberar la cámara correctamente al cerrar/desmontar. Usar `useRef` para gestionar la instancia.
  4.  **Ajustar Componente Padre** (`CustomerDashboardPage.tsx`) para manejar el estado del modal (`useDisclosure`) y pasarlo como props.

### 16. Error TypeScript `Property 'constraints' is missing... required in type 'QrReaderProps'` (TS2741)

- **Síntomas:** Error de TS al intentar quitar la prop `constraints` del componente `QrReader`.
- **Causa Raíz:** La definición de tipos de `react-qr-reader@3.0.0-beta-1` marca la prop `constraints` como obligatoria.
- **Solución (Alternativa si no se cambia de librería):** En lugar de quitarla, pasar un objeto vacío: `constraints={{}}`. _(Nota: Esta solución se intentó pero no resolvió el error subyacente `setPhotoOptions failed`, llevando finalmente al cambio de librería del punto 15)_.

### 17. Error TypeScript `'video' does not exist in type 'MediaTrackConstraints'` (TS2353)

- **Síntomas:** Error de TS al intentar usar `constraints={{ video: true }}` en `QrReader`.
- **Causa Raíz:** La prop `constraints` de `react-qr-reader` espera un objeto `MediaTrackConstraints` (con `facingMode`, `width`, etc.), no un `MediaStreamConstraints` (que tiene `video` y `audio` a nivel superior).
- **Solución (Alternativa si no se cambia de librería):** Pasar un objeto válido para `MediaTrackConstraints`, como `{}` (objeto vacío) o `{ facingMode: 'environment' }`. _(Nota: Esta solución se intentó pero no resolvió el error subyacente `setPhotoOptions failed`, llevando finalmente al cambio de librería del punto 15)_.

### 18. Error Git `Deletion of directory 'images' failed` en Windows durante `git pull`

- **Síntomas:** Al hacer `git pull origin master` (después de borrar `images` en GitHub y tenerla localmente), falla con `Deletion of directory 'images' failed`.
- **Causa Raíz:** Un programa en Windows (Explorador, VS Code, Visor Imágenes, Antivirus) tiene un bloqueo sobre la carpeta `images` o su contenido, impidiendo que Git la gestione durante el proceso de merge del `pull`.
- **Solución:**
  1.  Cerrar todos los programas que puedan estar usando la carpeta/archivos dentro de `images`.
  2.  Si el `pull` anterior dejó un estado de merge conflictivo, abortarlo: `git merge --abort` (o `git reset --hard HEAD` si es necesario).
  3.  Volver a intentar: `git pull origin master`.
  4.  Si ahora da conflicto "deleted by them, added by us", resolver manteniendo la versión local: `git add images` seguido de `git commit`.
  5.  Finalmente: `git push origin master`.

---

_(Fin de la Guía)_
