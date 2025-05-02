# Guía Rápida de Troubleshooting - LoyalPyME

**Fecha de Última Actualización:** 02 de Mayo de 2025

---

Esta guía recopila problemas técnicos significativos o no obvios encontrados durante el desarrollo de LoyalPyME, sus causas y soluciones, para agilizar futuras depuraciones.

---

## Problemas Comunes y Soluciones

**1. Backend: Inestabilidad con `yarn dev` (nodemon + ts-node)**

- (Sin cambios)

**2. Backend: Cambios en `.ts` No Se Reflejan / Ruta Nueva da 404 / Lógica Antigua se Ejecuta**

- **Síntomas:** Modificas código en un archivo `.ts` (ej: un servicio), pero la API sigue comportándose como antes (ej: no guarda un campo nuevo, usa lógica vieja).
- **Causa:** El proceso `node` que ejecuta `nodemon` solo vigila cambios en la carpeta `dist/`. Si no tienes `npx tsc --watch` corriendo en otra terminal (o no has ejecutado `yarn build` manualmente después de guardar el `.ts`), los cambios no se compilan a JavaScript en `dist/` y `nodemon` no los detecta ni reinicia el servidor con el código nuevo.
- **Solución Crítica:** **SIEMPRE** asegúrate de que los cambios en `.ts` se compilen a `dist/` antes de esperar que se reflejen en la API en ejecución. Usa el método de 2 terminales (`tsc --watch` y `nodemon`) o ejecuta `yarn build` manualmente antes de (re)iniciar `nodemon` o `node dist/index.js`.

**3. Frontend: Cambios No Se Aplican (Vite HMR)**

- (Sin cambios)

**4. Backend: Errores `TS2305` / Tipos Prisma no encontrados**

- (Sin cambios)

**5. Backend: Dependencias Circulares (TS)**

- (Sin cambios)

**6. Backend: API no se conecta a Base de Datos (`PrismaClientInitializationError`)**

- (Sin cambios)

**7. Frontend: Error 401 al llamar a Rutas Públicas Backend desde `axiosInstance`**

- (Sin cambios)

**8. Frontend: Formulario Mantine parece vacío tras cargar datos**

- (Sin cambios)

**9. Mobile: Escáner QR falla (`setPhotoOptions failed`)**

- (Sin cambios)

**10. Git: Error `Deletion of directory '...' failed` (Windows)** - (Sin cambios)

**11. Testing Backend (Vitest): Test file no se descubre** - (Sin cambios)

**12. Testing Backend (Vitest): Mocking de Prisma falla (`Cannot read properties of undefined`, spy not called)** - (Sin cambios)

**13. Testing Backend (Vitest/TS): Errores TS2352/TS2554 persistentes (Mock vs Type)** - (Sin cambios)

**14. Testing Integración (Supertest): Error 401 devuelve `text/plain`, no JSON** - (Sin cambios)

**15. Testing Integración (Supertest): Test Login 401 (Éxito esperado)** - (Sin cambios)

**16. Testing Integración (Supertest): Setup Falla - Registro Cliente (DNI Inválido)** - (Sin cambios)

**17. Testing Integración (Supertest): Ruta `PATCH` devuelve HTML/404** - (Sin cambios)

**18. Testing Integración (Supertest): Error 500 en lugar de 400 (Validación) o 409 (Conflicto)** - (Sin cambios)

**19. Frontend (i18n): Claves (`loginPage.title`) se muestran en lugar de texto traducido** - (Sin cambios)

**20. Frontend: Banderas de Idioma (Emoji Unicode) no se renderizan** - (Sin cambios)

**21. Frontend: Navbar Móvil Admin no se cierra automáticamente** - (Sin cambios)

**22. PowerShell: Sintaxis para `curl` y JSON** - (Sin cambios)

**--- NUEVOS PUNTOS ---**

**23. Backend: Subida de Imágenes Falla (Error 500 Internal Server Error en API `/upload/...`)** - **Síntomas:** El frontend intenta subir una imagen, pero la llamada a la API falla con un error 500. La notificación del frontend puede decir "Internal Server Error" o un mensaje más específico si el backend lo devuelve. - **Causa Principal:** Casi siempre es un problema con la configuración del proveedor de almacenamiento en la nube (ej: Cloudinary, AWS S3) en el **backend**. - **Credenciales Inválidas/Faltantes:** Las variables de entorno (`CLOUDINARY_...`, `AWS_...`) en `backend/.env` no existen, están mal escritas, tienen valores incorrectos, o no coinciden con la cuenta/proyecto correcto. - **Backend No Reiniciado:** Se corrigió `.env`, pero no se reinició el servidor backend (`nodemon` o `node`). - **Configuración SDK Incorrecta:** El archivo de configuración (ej: `cloudinary.config.ts`, `s3.config.ts`) tiene errores o no inicializa bien el SDK. - **Error en Servicio de Subida:** La lógica en `upload.service.ts` falla al interactuar con la API del proveedor (error de red, permisos incorrectos en el bucket/cuenta, formato de datos inválido). - **Solución Crítica:** 1. **REVISAR LOGS DEL BACKEND:** Mira la consola donde corre el backend **en el momento del error 500**. Busca el mensaje de error específico (ej: "Invalid cloud_name", "Unknown API key", "Access Denied", "Bucket not found", etc.). **Este log es CLAVE.** 2. **VERIFICAR `.env` METICULOSAMENTE:** Comprueba CADA variable de entorno requerida por el proveedor cloud. Compara carácter por carácter con el dashboard del proveedor. Asegúrate de que no haya espacios extra y de que las claves/secretos/nombres pertenezcan a la MISMA cuenta/proyecto. 3. **REINICIAR BACKEND:** **Siempre** reinicia el backend (Ctrl+C, `npx nodemon ...`) después de CUALQUIER cambio en `.env`. 4. **Verificar Configuración SDK:** Revisa el archivo `*.config.ts` correspondiente. ¿Lee bien las variables? ¿Se inicializa correctamente? (Busca logs de "configured successfully" al arrancar). 5. **Añadir Logs en Servicio:** Si persiste, añade `console.log` detallados dentro de la función de subida en `upload.service.ts` para ver qué parámetros se usan y dónde falla exactamente la llamada al SDK. 6. **Probar Credenciales Externamente:** Usa la CLI del proveedor (ej: `aws s3 ls`, `cld admin`) o un script mínimo para verificar si las credenciales funcionan fuera de tu aplicación. 7. **Contactar Soporte:** Si todo falla y las credenciales parecen correctas, contacta al soporte del proveedor cloud.

**24. Backend/Frontend: Campo Nuevo (ej: `imageUrl`) Se Guarda/Recibe Como `null` o No Aparece** - **Síntomas:** Subes una imagen (la subida funciona), guardas la recompensa, pero al volver a verla (en edición o como cliente), la imagen no está (el campo `imageUrl` es `null` o falta). - **Causas Posibles:** - **Backend (Guardado):** La función del servicio (ej: `createReward`, `updateReward` en `rewards.service.ts`) no recibe el campo (`imageUrl`) desde el controlador o no lo incluye en la operación `data` de Prisma (`prisma.reward.create/update`). - **Backend (Lectura):** La función del servicio que lee los datos (ej: `findRewardsByBusiness`, `findActiveRewardsForCustomer`) usa una cláusula `select` en Prisma pero **olvida** incluir el campo nuevo (`imageUrl: true`). Si no hay `select`, Prisma debería devolverlo por defecto. - **Backend (Compilación):** Hiciste los cambios en el archivo `.ts` del servicio, pero **no recompilaste** el backend (`yarn build` o `npx tsc --watch`), por lo que `nodemon` sigue ejecutando el código viejo de la carpeta `dist/` que no maneja el campo nuevo. - **Frontend (Envío):** El componente del formulario (`RewardForm.tsx`) no incluye correctamente el campo (`imageUrl`) en el objeto de datos que envía a la API al guardar. - **Frontend (Recepción/Tipo):** El hook que recibe los datos (`useAdminRewards`, `useCustomerRewardsData`) o el tipo de datos (`Reward`, `DisplayReward`) no incluye la definición del campo nuevo (`imageUrl`), por lo que TypeScript/JavaScript lo ignora al procesar la respuesta. - **Solución:** 1. **Verificar Flujo de Datos (Logs):** Añade `console.log` en puntos clave: - Frontend: Justo antes de la llamada `axios.post/put` para guardar, loguea el objeto de datos completo que se envía. ¿Está `imageUrl` ahí? - Backend (Controlador): Loguea `req.body` al recibir la petición de guardar. ¿Está `imageUrl` ahí? - Backend (Servicio - Guardar): Loguea los datos recibidos del controlador y el objeto `data` pasado a Prisma. ¿Está `imageUrl` ahí? - Backend (Servicio - Leer): Loguea los datos devueltos por Prisma (`findMany`, `findFirst`). ¿Está `imageUrl` ahí? - Frontend (Hook): Loguea la respuesta cruda de la API (`response.data`) antes de hacer `setRewards` o similar. ¿Está `imageUrl` ahí? 2. **Corregir Código:** Basado en los logs, corrige el punto donde se pierde el dato (añadir al `req.body` en el controlador, añadir al `data` de Prisma en el servicio, añadir al `select` de Prisma, actualizar tipos/interfaces en frontend/backend). 3. **Asegurar Compilación Backend:** Confirma que tu proceso de build (`tsc`) está funcionando y actualizando la carpeta `dist/` antes de ejecutar `nodemon`. 4. **Verificar Tipos/Interfaces:** Revisa que la definición del tipo/interfaz en ambos lados (backend y frontend) incluya el nuevo campo correctamente (ej: `imageUrl?: string | null;`). 5. **Verificar Base de Datos:** Comprueba directamente en la base de datos si el campo (`imageUrl`) existe en la tabla y si se está guardando el valor esperado o si queda `NULL`.

---

_(Fin de la Guía)_
