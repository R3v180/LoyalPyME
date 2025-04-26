# Guía Rápida de Troubleshooting - LoyalPyME

**Fecha de Última Actualización:** 26 de Mayo de 2024

---

Esta guía recopila los problemas técnicos más comunes encontrados durante el desarrollo de LoyalPyME, sus posibles causas y las soluciones prácticas que han resultado efectivas. Es una referencia rápida para agilizar el proceso de depuración.

---

## Problemas Comunes y Soluciones

### 1. Backend: Inestabilidad o Comportamiento Erróneo con `yarn dev`

- **Síntomas:** El servidor backend se reinicia inesperadamente, muestra errores inconsistentes, o no refleja cambios correctamente al usar `yarn dev`.
- **Causa Raíz:** Conflictos o inestabilidades potenciales con la combinación de `nodemon`, `ts-node` y el entorno de ejecución (particularmente en sistemas Windows).
- **Solución Recomendada:** Optar por un flujo de build y ejecución más estable.
  1.  Compila el código TypeScript a JavaScript: `yarn build` (ejecuta `npx tsc`).
  2.  Detén cualquier proceso `node dist/index.js` previo (Ctrl+C).
  3.  Ejecuta el código compilado: `node dist/index.js`.

### 2. Frontend -> Backend: Fallo de Login o Acceso a Rutas Públicas (Error 401 / Conexión)

- **Síntomas:** La pantalla de login muestra errores de "Credenciales inválidas" o "Error de red", o la consola del navegador reporta errores 401 (Unauthorized) o de conexión rechazada al intentar acceder a `/auth/...` u otras rutas públicas.
- **Causa Raíz:** El frontend está intentando usar `axiosInstance` (configurado con `baseURL=/api`) para rutas que no están bajo `/api`, como las rutas de autenticación públicas (`/auth/*`). Esto resulta en una URL de destino incorrecta (`/api/auth/...`).
- **Solución:** Para interactuar con rutas públicas del backend (ej. `/auth/login`, `/auth/register`, `/auth/forgot-password`), utiliza la instancia base de `axios` (no `axiosInstance`) y especifica la **URL completa** del endpoint del backend (ej. `http://localhost:3000/auth/login`).

### 3. Backend: Error de Build `TS1192: Module ... has no default export`

- **Síntomas:** El comando `yarn build` falla con el mensaje `TS1192: Module 'ruta/del/modulo' has no default export`.
- **Causa Raíz:** Un archivo TypeScript está intentando importar un valor por defecto (`import Nombre from '...'`), pero el archivo de origen (`ruta/del/modulo.ts`) no tiene una exportación marcada como `export default Nombre;`.
- **Solución:** Revisa el archivo que está siendo importado (`ruta/del/modulo.ts`) y confirma si debe tener una exportación por defecto. Si es así, añade `export default Nombre;` al final. Si no, ajusta la sentencia `import` en el archivo que falla para importar los miembros nombrados (ej. `import { Nombre } from '...'`).

### 4. PowerShell: Errores de Sintaxis o Parámetros al Usar `curl`

- **Síntomas:** El comando `curl` en PowerShell no funciona como se espera, o sus parámetros comunes (`-X`, `-H`, `-d`) no son reconocidos o dan errores.
- **Causa Raíz:** En muchas configuraciones de PowerShell, `curl` es un alias preconfigurado para `Invoke-WebRequest`, que utiliza una sintaxis y nombres de parámetros diferentes a la herramienta `curl` de Linux/otros sistemas.
- **Solución:** Utiliza el cmdlet nativo de PowerShell diseñado para peticiones HTTP, `Invoke-RestMethod`, con sus parámetros correspondientes (ej. `-Method GET/POST/etc.`, `-Headers @{...}`, `-ContentType 'application/json'`, `-Body '...'`).

### 5. PowerShell: Error de Parseo JSON con `Invoke-RestMethod -Body`

- **Síntomas:** Al enviar un cuerpo JSON complejo con `Invoke-RestMethod -Body`, el comando falla o el backend reporta JSON malformado.
- **Causa Raíz:** PowerShell puede tener problemas interpretando cadenas JSON que contienen caracteres especiales o comillas escapadas cuando se pasan directamente como string al parámetro `-Body`.
- **Solución:** Construye el cuerpo de la petición como un objeto (hashtable) en PowerShell y conviértelo a JSON antes de pasarlo a `-Body`.
  ```powershell
  $body = @{
      email = "tu@email.com"
      password = "tucontraseña"
  }
  $jsonBody = $body | ConvertTo-Json
  Invoke-RestMethod -Method Post -Uri "http://localhost:3000/auth/login" -ContentType "application/json" -Body $jsonBody
  ```

### 6. Backend: Cambios en Código Fuente (`.ts`) No Se Reflejan en la Aplicación en Ejecución

- **Síntomas:** Modificas un archivo `.ts` en el backend, ejecutas `yarn build` sin errores, pero la aplicación sigue comportándose como antes (ej. logs antiguos, lógica previa).
- **Causa Raíz:** El proceso de Node.js que está ejecutando el código compilado (`dist/index.js`) cargó la versión anterior del código en memoria al iniciar. Compilar actualiza los archivos en la carpeta `dist/`, pero no fuerza al proceso en ejecución a recargarlos.
- **Solución Crítica:** Después de cada ejecución exitosa de `yarn build`, debes **detener el proceso del servidor backend** (generalmente con Ctrl+C en la terminal) y luego **reiniciarlo** ejecutando `node dist/index.js` nuevamente.

### 7. Frontend: Funcionalidad (Ej. `onClick`) No Se Aplica o Elementos No Aparecen Tras Actualizar Código

- **Síntomas:** Modificas un archivo `.tsx` o `.css` en el frontend, guardas, pero los cambios no se ven reflejados en el navegador o el componente no funciona como se espera.
- **Causa Raíz:** El servidor de desarrollo de Vite (`yarn dev`) no detectó correctamente el cambio, el navegador está cargando una versión cacheada del componente, o el contenido del archivo local no se guardó correctamente o no coincide con la versión prevista.
- **Solución:**
  1.  Asegúrate de que el contenido de tu archivo local coincide **exactamente** con la última versión del código que esperas tener. Si es necesario, reemplaza todo el contenido del archivo, guarda y verifica.
  2.  Verifica que la terminal donde corre `yarn dev` detecta el cambio y muestra que está reconstruyendo/reponiendo el módulo (Hot Module Replacement).
  3.  Si el problema persiste, fuerza un refresco completo del navegador (Ctrl+Shift+R o Cmd+Shift+R). Si aún así no funciona, detén y reinicia el servidor de desarrollo de Vite (`yarn dev`).

### 8. General: Mensajes de Éxito/Error en la Interfaz de Usuario en Idioma Incorrecto (Ej. Inglés en Lugar de Español)

- **Síntomas:** Las notificaciones de Mantine o los mensajes de error mostrados al usuario final están en un idioma inesperado (principalmente inglés).
- **Causa Raíz:** El texto de estos mensajes se genera en el código del **backend** (generalmente en controladores o servicios) y no fue traducido al español en el código fuente.
- **Solución:** Localiza el archivo `.ts` en el backend donde se origina el mensaje específico (busca el texto exacto en el código) y traduce la cadena de texto al español. Recuerda **recompilar (`yarn build`) y reiniciar el servidor backend** después de realizar el cambio.

### 9. TypeScript: Errores Relacionados con Dependencias Circulares (`TS2303`, `TS2459`, etc.)

- **Síntomas:** TypeScript reporta errores que indican definiciones circulares de tipos o aliases entre dos o más archivos que se importan mutuamente (ej. un servicio importa una interfaz de un controlador, y el controlador importa una función del servicio).
- **Causa Raíz:** Existe un ciclo de importación entre archivos TypeScript, lo que confunde al compilador sobre el orden en que debe procesar las definiciones de tipos.
- **Solución:** Identifica la definición (generalmente una interfaz o un tipo) que está causando el ciclo. Mueve esa definición a un **archivo completamente separado e independiente** (ej. un archivo `.dto.ts` o `.types.ts` dentro del módulo o en un directorio común `utils/types/`). Luego, modifica los archivos originales para importar la definición desde este nuevo archivo, rompiendo así el ciclo.

### 10. TypeScript: Error `TS2307: Cannot find module '...'` al Construir

- **Síntomas:** `yarn build` falla con el mensaje `TS2307: Cannot find module './ruta/incorrecta'` o similar.
- **Causa Raíz:** La ruta de importación especificada en una sentencia `import` no coincide exactamente con la ubicación y el nombre del archivo `.ts` (o `.tsx`) al que se refiere. Esto puede ocurrir tras renombrar archivos o moverlos sin actualizar todas las importaciones.
- **Solución:** Verifica la sentencia `import` que causa el error. Confirma que la ruta relativa (`./`, `../`) y el nombre del archivo (incluyendo mayúsculas/minúsculas, aunque TS suele ser flexible, es mejor ser exacto) son correctos en relación con la ubicación del archivo que contiene la sentencia `import`. Asegúrate de que el archivo de destino realmente existe en esa ubicación.

### 11. TypeScript: Errores `TS2305` (`... has no exported member ...`) Relacionados con `@prisma/client`

- **Síntomas:** TypeScript no puede encontrar tipos o enumeraciones (ej. `UserRole`, `DocumentType`, tipos de modelos como `User`, `Reward`) que deberían estar disponibles en el paquete `@prisma/client` tras una migración.
- **Causa Raíz:** El cliente de Prisma (el código TypeScript que define estos tipos basado en tu esquema `schema.prisma`) no se ha regenerado correctamente después de la última migración o de un cambio en el esquema. O el servidor TypeScript de tu editor está usando información cacheada obsoleta.
- **Solución:**
  1.  Ejecuta `npx prisma generate` en la carpeta `backend/`. Esto fuerza a Prisma a leer tu `schema.prisma` y regenerar el código del cliente en `node_modules/@prisma/client`.
  2.  Si el error persiste en tu editor, intenta reiniciar el servidor de lenguaje TypeScript de tu editor (en VSCode, abre la paleta de comandos `Ctrl+Shift+P` o `Cmd+Shift+P` y busca "TypeScript: Restart TS server").
  3.  Asegúrate de que no tienes errores de dependencia circular que puedan estar interfiriendo con el análisis de tipos.

### 12. Backend: Nueva Ruta API Devuelve 404 (Not Found)

- **Síntomas:** Defines una nueva ruta o router en tu código backend (`.ts`), compilas (`yarn build`), pero al intentar acceder desde el frontend o una herramienta como Postman, recibes un error HTTP 404 (Not Found).
- **Causa Raíz:** El archivo principal que monta los routers en tu aplicación Express (`backend/src/index.ts`) fue modificado para incluir la nueva ruta/router, pero el proceso de Node.js en ejecución no se reinició para cargar los cambios en `index.ts`.
- **Solución Crítica:** Después de cualquier modificación en `backend/src/index.ts` (y tras ejecutar `yarn build`), es **IMPRESCINDIBLE detener** el servidor backend (Ctrl+C) y **reiniciarlo** ejecutando `node dist/index.js`.

### 13. Frontend: Errores de Tipado o Props con Mantine v7 (`TS2305`, `TS2322`, `TS2741`, etc.)

- **Síntomas:** TypeScript muestra errores indicando que props esperadas en componentes de Mantine no existen (ej. `height` en `AppShell`, `weight` en `Text`, `leftIcon` en `Button`) o que ciertos componentes ya no se exportan directamente desde `@mantine/core` (`Navbar`, `Header`).
- **Causa Raíz:** Estás utilizando sintaxis, props o importaciones de versiones anteriores de Mantine (v6 o inferior) en un proyecto configurado con Mantine v7. La versión 7 introdujo cambios importantes (breaking changes) en la API de varios componentes y en la convención de nombres de props.
- **Solución:** Consulta la documentación oficial de Mantine v7 (especialmente la guía de migración si vienes de v6). Actualiza las importaciones (ej. usa `AppShell.Navbar` en lugar de `Navbar`). Reemplaza las props antiguas por las nuevas convenciones (ej. `height` en `AppShell` se pasa a la configuración dentro del objeto `header` o `navbar`, `weight={700}` se convierte en `fw={700}`, `leftIcon` se convierte en `leftSection`).

### 14. TypeScript: Advertencias de Variables o Importaciones No Utilizadas (`TS6133`, `TS6196`)

- **Síntomas:** El compilador TypeScript o el linter (ESLint) muestran advertencias sobre variables, funciones, interfaces o importaciones que han sido declaradas pero no se usan en el código.
- **Causa Raíz:** Durante el desarrollo o refactorización, se eliminó el uso de un elemento pero no se eliminó su declaración o su sentencia `import` original.
- **Solución:** Elimina las declaraciones o sentencias `import` que no sean necesarias. Esto mantiene el código limpio, reduce la complejidad y previene posibles confusiones futuras. Tu editor o linter a menudo pueden automatizar esto.
