# Guía Rápida de Troubleshooting - LoyalPyME

**Fecha de Última Actualización:** 27 de Abril de 2025 _(Actualizada)_

---

Esta guía recopila los problemas técnicos más comunes encontrados durante el desarrollo de LoyalPyME, sus posibles causas y las soluciones prácticas que han resultado efectivas. Es una referencia rápida para agilizar el proceso de depuración.

---

## Problemas Comunes y Soluciones

_(Las secciones 1-9 y 11-14 se mantienen con ajustes menores o sin cambios, ya que cubren problemas generales que también encontramos. Añadimos/modificamos puntos clave)_

### 1. Backend: Inestabilidad, Errores o `SyntaxError` con `yarn dev`

- **Síntomas:** El servidor backend (`yarn dev`) se reinicia inesperadamente, muestra errores inconsistentes (`SyntaxError: Cannot use import statement outside a module`), o no refleja cambios correctamente.
- **Causa Raíz:** Conflictos o inestabilidades potenciales con la combinación de `nodemon`, `ts-node` / `ts-node-dev` y el entorno de ejecución (Node.js v20 en Windows en este caso) respecto a la interpretación de módulos CommonJS vs ES Modules, incluso con `tsconfig.json` configurado para `commonjs`. Las configuraciones habituales (`--files`, `ts-node` en `tsconfig.json`, `ts-node-dev`) no resolvieron el problema.
- **Solución Recomendada (Temporal):** Optar por el flujo de build y ejecución que **sí** funciona de forma estable:
  1.  **Detén** el servidor backend (`Ctrl+C`).
  2.  **Compila** el código TypeScript a JavaScript: `yarn build` (ejecuta `npx tsc`). Verifica que no haya errores de compilación.
  3.  **Ejecuta** el código compilado: `node dist/index.js`.
  4.  **Importante:** Repetir pasos 1, 2 y 3 después de cada cambio en el código `.ts` del backend.

### 2. Frontend -> Backend: Fallo de Login o Acceso a Rutas Públicas (Error 401 / Conexión)

- **Síntomas:** Errores de "Credenciales inválidas" o "Error de red" en login/registro/recuperación contraseña. Consola del navegador muestra 401 o conexión rechazada para `/auth/...`.
- **Causa Raíz:** Uso de `axiosInstance` (con `baseURL=/api`) para rutas públicas (`/auth/*`).
- **Solución:** Usar instancia `axios` base con URL completa (`http://localhost:3000/auth/...`) para rutas públicas.

### 3. Backend: Error de Build `TS1192: Module ... has no default export`

- **Síntomas:** `yarn build` falla con este error.
- **Causa Raíz:** `import Nombre from '...'` cuando el módulo exportador no tiene `export default`.
- **Solución:** Añadir `export default` en el origen o cambiar a `import { Nombre } from '...'`.

### 4. PowerShell: Errores de Sintaxis o Parámetros al Usar `curl`

- **Síntomas:** `curl` (alias de `Invoke-WebRequest`) no reconoce parámetros `-X`, `-H`, `-d`.
- **Solución:** Usar `Invoke-RestMethod` con sus parámetros (`-Method`, `-Headers`, `-ContentType`, `-Body`).

### 5. PowerShell: Error de Parseo JSON con `Invoke-RestMethod -Body`

- **Síntomas:** Falla `Invoke-RestMethod` con JSON complejo en `-Body`. Backend reporta JSON malformado.
- **Solución:** Construir el cuerpo como hashtable PowerShell (`@{...}`) y pasarlo a `ConvertTo-Json` antes de asignarlo a `-Body`.

### 6. Backend: Cambios en Código Fuente (`.ts`) No Se Reflejan en Ejecución (`node dist/index.js`)

- **Síntomas:** Modificas `.ts`, `yarn build` OK, pero la app se comporta igual que antes.
- **Causa Raíz:** El proceso `node` sigue usando la versión anterior cargada en memoria.
- **Solución Crítica:** Después de **cada** `yarn build` exitoso, **SIEMPRE DETENER** (Ctrl+C) y **REINICIAR** (`node dist/index.js`) el servidor backend.

### 7. Frontend: Funcionalidad No Se Aplica o Elementos No Aparecen Tras Actualizar Código (`yarn dev`)

- **Síntomas:** Botón no hace nada, elemento falta, estilo viejo.
- **Causa Raíz:** `yarn dev` (Vite) no detectó el cambio, caché del navegador, archivo no guardado/incorrecto.
- **Solución:** 1. Verificar/Reemplazar contenido archivo local. 2. Verificar terminal `yarn dev`. 3. Refresco forzado navegador (Ctrl+Shift+R). 4. Reiniciar `yarn dev`.

### 8. General: Mensajes de Éxito/Error en UI en Idioma Incorrecto

- **Síntomas:** Notificaciones Mantine o alertas en inglés en lugar de español.
- **Causa Raíz:** Mensajes generados en el **backend** (controladores/servicios) no traducidos.
- **Solución:** Localizar y traducir el string en el archivo `.ts` del backend. Recompilar y reiniciar backend.

### 9. TypeScript: Errores Relacionados con Dependencias Circulares (`TS2303`, `TS2459`, etc.)

- **Síntomas:** Errores de ciclo de importación entre archivos (ej. servicio importa de controlador y viceversa).
- **Solución:** Mover la definición causante del ciclo (interfaz, tipo) a un **archivo separado e independiente** (`.dto.ts`, `.types.ts`) e importar desde allí en ambos archivos originales.

### 10. TypeScript: Error `TS2307: Cannot find module '...'` al Construir

- **Síntomas:** `yarn build` falla, no encuentra un módulo importado.
- **Causa Raíz:** Ruta incorrecta en `import` (relativa `./`, `../` o nombre archivo/carpeta). Suele pasar tras mover/renombrar archivos.
- **Solución:** Verificar y corregir la ruta en la sentencia `import` en el archivo que da el error. Comprobar la ubicación real y nombre exacto (mayús/minús) del archivo importado. _(Nota: Lo sufrimos varias veces por mi error al generar rutas)_.

### 11. TypeScript: Errores `TS2305` o similares con `@prisma/client`

- **Síntomas:** TS no encuentra tipos/enums de Prisma (`UserRole`, `User`, etc.) o no reconoce campos nuevos tras una migración.
- **Causa Raíz:** Prisma Client (`node_modules/@prisma/client`) no está sincronizado con `schema.prisma`. Puede ocurrir si `npx prisma generate` falla (ej. por error `EPERM` en Windows si el servidor backend está corriendo y bloquea archivos) o no se ejecuta tras `migrate`.
- **Solución:**
  1.  **DETENER** el servidor backend (`node dist/index.js`).
  2.  Ejecutar **`npx prisma generate`** en la carpeta `backend/`. Verificar que termina sin errores.
  3.  Reiniciar el servidor backend.
  4.  (Opcional) Reiniciar el servidor TS del editor (VSCode: Ctrl+Shift+P -> "TypeScript: Restart TS server").

### 12. Backend: Nueva Ruta o Router Modificado Devuelve 404

- **Síntomas:** Añades/modificas una ruta en un archivo `.routes.ts` o montas un nuevo router en `index.ts`, compilas (`yarn build`), pero la petición a esa ruta da 404.
- **Causa Raíz Principal:** No reiniciaste el servidor backend (`node dist/index.js`) después de compilar los cambios que afectan al enrutamiento (cambios en `index.ts` o en archivos `.routes.ts`).
- **Solución Crítica:** Tras **CUALQUIER** cambio en `index.ts` o archivos `.routes.ts`, y después de un `yarn build` exitoso, es **IMPRESCINDIBLE detener y reiniciar** el servidor backend.

### 13. Frontend: Errores de Tipado o Props con Mantine v7

- **Síntomas:** Errores TS indicando props desconocidas (`height`, `weight`, `leftIcon`) o componentes no exportados (`Navbar`, `Header`) desde `@mantine/core`.
- **Solución:** Consultar documentación Mantine v7. Usar props nuevas (`fw`, `leftSection`) y componentes anidados (`AppShell.Navbar`).

### 14. TypeScript: Advertencias Variables/Imports No Utilizadas (`TS6133`, `TS6196`)

- **Síntomas:** Warnings sobre declaraciones no leídas.
- **Solución:** Eliminar las declaraciones o `import` innecesarios para mantener el código limpio. Se puede usar `_variable` para indicar intencionalidad si el parámetro es requerido por una firma pero no usado.

### **NUEVO:** 15. API Devuelve 404 (Not Found) - Discrepancias Frontend/Backend

- **Síntomas:** El frontend realiza una petición a una URL (`/api/...`) que _debería_ existir, pero el backend devuelve 404. El log del backend puede o no mostrar la llegada de la petición.
- **Causas Comunes Verificadas:**
  - **Doble Prefijo API:** `axiosInstance` tiene `baseURL: '/api'` y la llamada en el frontend también incluye `/api` (ej. `axiosInstance.get('/api/admin/...')`). **Solución:** Quitar el `/api` explícito de la llamada en el frontend (dejar solo `/admin/...`).
  - **Método HTTP Incorrecto:** Frontend usa `PATCH` pero la ruta backend espera `POST` (o `PUT` vs `PATCH`, etc.). **Solución:** Asegurar que el método en la llamada `axiosInstance` (`.get`, `.post`, `.put`, `.patch`, `.delete`) coincida con el método definido en el archivo `.routes.ts` del backend (`router.get`, `router.post`, etc.).
  - **Nombre/Path de Ruta Incorrecto:** Frontend llama a `/api/.../grant-reward` pero el backend espera `/api/.../assign-reward`. O frontend llama a `/api/tiers/tiers` cuando la ruta correcta era `/api/tiers`. **Solución:** Corregir la cadena de la URL en la llamada `axiosInstance` del frontend para que coincida exactamente con la ruta completa definida en el backend (considerando el montaje en `index.ts` y la definición en el archivo `.routes.ts`).
  - **Fallo Silencioso en Handler/Servicio:** (Menos común para 404, usualmente da 500) El backend recibe la petición, empieza a procesarla, pero un error interno no capturado o un `await` que nunca resuelve impide que se envíe la respuesta. **Solución:** Añadir `console.log` detallados en el controlador y servicio del backend para seguir la ejecución paso a paso y localizar dónde se detiene o falla. Revisar bloques `try/catch/finally`.

### **NUEVO:** 16. Error Prisma en Ejecución (Ej. `PrismaClientValidationError` en `orderBy`)

- **Síntomas:** El backend falla en tiempo de ejecución (al recibir una petición) con un error de Prisma, a menudo en la consola del backend.
- **Causa Ejemplo:** Sintaxis incorrecta en cláusulas de Prisma, como `orderBy`. Para ordenar por múltiples campos, se espera un array de objetos `[{campo1: 'asc'}, {campo2: 'desc'}]` y no un solo objeto `{campo1: 'asc', campo2: 'desc'}`.
- **Solución:** Leer atentamente el mensaje de error de Prisma. Consultar la documentación de Prisma para la sintaxis correcta de la operación que falla (ej. `findMany`, `updateMany`, `orderBy`, `select`, etc.). Corregir la sintaxis en el archivo `.service.ts` correspondiente. Recompilar y reiniciar backend.

### **NUEVO:** 17. Discrepancia de Datos Frontend/Backend (Ej. Campo `null`/`undefined`)

- **Síntomas:** El frontend espera un campo (ej. `pointsRequired`) pero recibe `undefined` o `null`, causando bugs visuales (ej. "N/A pts"). La petición API backend tuvo éxito (ej. 200 OK).
- **Causa Raíz:** El backend no está enviando el campo esperado, o lo envía con un nombre diferente (ej. `pointsCost` vs `pointsRequired`).
- **Solución:**
  1.  Verificar la respuesta **real** de la API en la pestaña "Red" del navegador o con un `console.log(response.data)` en el frontend para confirmar qué campos y nombres llegan.
  2.  Si el campo falta o tiene nombre incorrecto: Añadir/corregir una cláusula `select` explícita en la consulta Prisma dentro del archivo `.service.ts` del backend para asegurar que se incluye el campo con el nombre esperado. Recompilar/Reiniciar backend.
  3.  Si el campo llega pero con nombre diferente: Ajustar la interfaz TypeScript y el acceso a la propiedad en el código del frontend para usar el nombre correcto que envía el backend (ej. usar `reward.pointsCost` en lugar de `reward.pointsRequired`).

### **NUEVO:** 18. Errores TypeScript Frontend Tras Cambios (Ej. `TS2739`, `TS2322`)

- **Síntomas:** El compilador TS (`yarn build` frontend) o el editor muestran errores como "Property '...' is missing in type '...' but required in type '...'" (`TS2739`) o "Type '...' is not assignable to type '...'" (`TS2322`).
- **Causa Raíz:** Generalmente ocurren después de refactorizar o modificar un componente hijo.
  - `TS2739`: Se añadieron props requeridas a un componente hijo, pero no se actualizaron los sitios donde se usa ese componente para pasarle esas nuevas props.
  - `TS2322`: El tipo de dato/función que se pasa como prop desde un componente padre no coincide exactamente con el tipo esperado por la prop en el componente hijo (ej. `string | null` vs `string | undefined`).
- **Solución:**
  - Para `TS2739`: Localizar dónde se usa el componente que ahora requiere más props y pasarle las props que faltan desde el componente padre.
  - Para `TS2322`: Ajustar el tipo en el componente padre o en el hijo para que coincidan exactamente. A menudo es más fácil ajustar la definición del handler/variable en el padre para que coincida con el tipo inferido o esperado por el hijo (ej. ajustar un handler para que acepte `string | undefined` si el hijo lo envía así).

### **NUEVO:** 19. Error TypeScript Frontend `TS2307: Cannot find module '@mantine/...'`

- **Síntomas:** El compilador TS falla porque no encuentra un módulo específico de Mantine (ej. `@mantine/modals`).
- **Causa Raíz:** Se está intentando usar una funcionalidad (ej. `useModals`) de un paquete de Mantine que no ha sido instalado en el proyecto frontend.
- **Solución:** Instalar el paquete faltante usando yarn: `yarn add @mantine/modals` (o el paquete que sea). Además, verificar si ese paquete requiere añadir un `Provider` específico en `main.tsx` (como `ModalsProvider`).

---
