# Guía Rápida de Troubleshooting - LoyalPyME v1.0

**(Basado en sesión del Miércoles, 23 de Abril de 2025)**

Resumen de problemas clave enfrentados y sus soluciones:

## 1. Backend: Inestabilidad con `yarn dev`

- **Síntomas:** Errores extraños, reinicios constantes, dificultad para diagnosticar.
- **Causa Raíz:** Posible conflicto o inestabilidad entre `nodemon`, `ts-node` y quizás otras dependencias en Windows.
- **Solución/Aprendizaje Clave:** Usar el flujo más estable:
  1.  Compilar con `yarn build` (ejecuta `npx tsc`).
  2.  Ejecutar el código compilado con `node dist/index.js`.

## 2. Frontend->Backend: Fallo de Login (Error 401 / Conexión Rechazada)

- **Síntomas:** El usuario no puede iniciar sesión a pesar de usar credenciales correctas (en teoría), la consola del navegador puede mostrar error de red o 401.
- **Causa Raíz:** La llamada desde `LoginPage.tsx` intentaba usar `axiosInstance` (configurado con `baseURL=/api`) que no aplicaba a la ruta pública `/auth/login`. La URL resultante era incorrecta (`/api/auth/login` o similar).
- **Solución/Aprendizaje Clave:** Para rutas de autenticación públicas (`/auth/...`), usar una instancia base de `axios` (o `fetch`) especificando la URL **completa** del backend (`http://localhost:3000/auth/login`), sin pasar por `axiosInstance`.

## 3. Backend: Error de Build `TS1192: Module ... has no default export`

- **Síntomas:** `yarn build` falla con este error específico.
- **Causa Raíz:** Un archivo (ej. `index.ts`) intenta importar algo de otro módulo (ej. `routes.ts`) usando `import nombreModulo from './ruta'`, pero el módulo exportador no tiene una línea `export default ...;`.
- **Solución/Aprendizaje Clave:** Asegurarse de que el módulo que se está importando **realmente** tiene una exportación `default`. Verificar la última línea del archivo exportador (`export default nombreExportado;`). Corregir la exportación o la importación según sea necesario.

## 4. PowerShell: Errores al usar `curl` (alias de `Invoke-WebRequest`)

- **Síntomas:** PowerShell no reconoce el comando `curl` o sus parámetros estándar (`-X`, `-H`, `-d`).
- **Causa Raíz:** En muchas configuraciones de PowerShell, `curl` es un alias para `Invoke-WebRequest`, que tiene parámetros diferentes. La sintaxis multi-línea con `\` tampoco funciona igual.
- **Solución/Aprendizaje Clave:** Usar el cmdlet específico `Invoke-RestMethod` con sus parámetros (`-Method`, `-Headers`, `-ContentType`, `-Body`).

## 5. PowerShell: Error `SyntaxError: Expected property name or '}' in JSON` al usar `Invoke-RestMethod`

- **Síntomas:** El comando PowerShell falla, y el backend loguea un error de JSON malformado.
- **Causa Raíz:** PowerShell puede tener problemas al interpretar cadenas JSON complejas (con comillas escapadas) pasadas directamente al parámetro `-Body`.
- **Solución/Aprendizaje Clave:** Construir el cuerpo como un objeto PowerShell (hashtable `@{key='value'}`) y pasarlo a través de `ConvertTo-Json` antes de asignarlo a `-Body`. Ejemplo: `-Body (@{email='..."; password='...'} | ConvertTo-Json)`.

## 6. Backend: Cambios en código `.ts` no se reflejan tras `yarn build`

- **Síntomas:** La aplicación sigue comportándose como antes del cambio, a pesar de haber compilado. Mensajes antiguos, lógica vieja.
- **Causa Raíz:** El servidor `node dist/index.js` sigue ejecutando la versión antigua del código cargada en memoria. `yarn build` actualiza `dist/`, pero no reinicia el proceso en ejecución.
- **Solución/Aprendizaje Clave:** Después de cada `yarn build` exitoso, es **IMPRESCINDIBLE**:
  1.  **Detener** el proceso `node dist/index.js` (Ctrl+C).
  2.  **Reiniciar** el proceso ejecutando `node dist/index.js` de nuevo.

## 7. Frontend: Funcionalidad (ej. `onClick`) no existe tras actualizar código

- **Síntomas:** El botón/elemento está visible pero no hace nada, o falta un elemento esperado.
- **Causa Raíz:** No se aplicó correctamente la última versión del código al archivo local. Se sigue ejecutando una versión anterior del componente.
- **Solución/Aprendizaje Clave:** Verificar **SIEMPRE** que el contenido del archivo local coincide exactamente con la última versión proporcionada. Reemplazar todo el contenido si es necesario, guardar y asegurarse de que el servidor de desarrollo (`yarn dev`) se recarga/reinicia.

## 8. General: Falta de Traducciones (i18n)

- **Síntomas:** Mensajes de éxito o error mostrados al usuario están en inglés en lugar de español.
- **Causa Raíz:** Los mensajes se originan en el código del **backend** (controladores o servicios) y no fueron traducidos allí.
- **Solución/Aprendizaje Clave:** Identificar el archivo `.ts` del backend donde se genera el mensaje y traducirlo en el código fuente. Recordar Recompilar (`yarn build`) y Reiniciar (`node dist/index.js`) el backend después.
