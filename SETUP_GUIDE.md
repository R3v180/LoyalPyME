# LoyalPyME - Guía Completa de Instalación y Ejecución Local

**Última Actualización:** 09 de Mayo de 2025

Esta guía describe los pasos necesarios para instalar, configurar y ejecutar el proyecto LoyalPyME en un entorno de desarrollo local. Es crucial seguir los pasos en orden para asegurar una configuración correcta.

---

## 1. Prerrequisitos

Antes de empezar, asegúrate de tener instalado lo siguiente en tu sistema:

- **Node.js:** Se recomienda una versión LTS reciente (v18 o v20+ al momento de escribir esto). Puedes descargarlo desde [nodejs.org](https://nodejs.org/). Node.js incluye npm (Node Package Manager).
- **Yarn (Opcional, pero usado en los ejemplos de scripts):** Gestor de paquetes para Node.js (v1.x recomendada si se usa). Si tienes Node.js/npm, puedes instalarlo con `npm install --global yarn`. Si prefieres usar `npm` para todos los comandos, puedes adaptar los ejemplos (`yarn install` -> `npm install`, `yarn dev` -> `npm run dev`).
- **PostgreSQL:** Sistema de base de datos relacional. Necesitas tener un servidor PostgreSQL instalado y **corriendo** localmente o accesible en tu red.
  - Puedes descargarlo desde [postgresql.org/download](https://www.postgresql.org/download/).
  - Durante la instalación, se te pedirá configurar una contraseña para el usuario `postgres` (o el usuario administrador por defecto). Anótala.
  - Necesitarás crear una base de datos para el proyecto. Usando una herramienta como `psql` (cliente de línea de comandos de PostgreSQL) o pgAdmin (GUI), puedes crearla con: `CREATE DATABASE loyalpymedb;` (o el nombre que prefieras, pero deberás ajustarlo en el `.env`).
- **Git:** Sistema de control de versiones para clonar el repositorio. [git-scm.com/downloads](https://git-scm.com/downloads).
- **`npx`:** Es una herramienta que viene con `npm` (desde la versión 5.2+). Permite ejecutar paquetes de Node.js sin necesidad de instalarlos globalmente. La usaremos para comandos de Prisma y `ts-node`.
- **(Opcional) NVM (Node Version Manager):** Útil para gestionar múltiples versiones de Node.js si trabajas en varios proyectos ([Linux/Mac](https://github.com/nvm-sh/nvm), [Windows](https://github.com/coreybutler/nvm-windows)).
- **(Opcional) Editor de Código:** Se recomienda VS Code con extensiones para Prisma, TypeScript, ESLint.

---

## 2. Instalación del Backend

La configuración del backend implica clonar el proyecto, instalar dependencias, configurar el entorno y preparar la base de datos.

1.  **Clonar Repositorio:**
    Si aún no lo tienes, clona el repositorio del proyecto desde su URL y navega a la carpeta raíz del proyecto.

    ```bash
    git clone <URL_DEL_REPOSITORIO_GIT> LoyalPyME
    cd LoyalPyME
    ```

2.  **Navegar a la Carpeta del Backend:**
    Todos los comandos siguientes para el backend se ejecutarán desde esta carpeta.

    ```bash
    cd backend
    ```

3.  **Instalar Dependencias del Backend:**
    Esto instalará todos los paquetes listados en `package.json` (Express, Prisma, etc.).

    ```bash
    yarn install
    # Alternativamente, si usas npm:
    # npm install
    ```

4.  **Configurar Variables de Entorno (`.env`):**
    Las variables de entorno son cruciales para configurar la conexión a la base de datos, secretos JWT, y credenciales de servicios externos como Cloudinary.

    - Copia el archivo de ejemplo `.env.example` a un nuevo archivo llamado `.env`:
      ```bash
      cp .env.example .env
      # En Windows, puedes usar: copy .env.example .env
      ```
    - Abre el archivo `.env` recién creado con un editor de texto.
    - **Edita las siguientes variables obligatorias:**
      - `DATABASE_URL`: La cadena de conexión a tu base de datos PostgreSQL. El formato es: `postgresql://<DB_USER>:<DB_PASSWORD>@<DB_HOST>:<DB_PORT>/<DB_NAME>?schema=public`.
        - Ejemplo para una instalación local común de PostgreSQL (reemplaza `<DB_PASSWORD>` con la contraseña que configuraste para tu usuario `postgres`, y `<DB_NAME>` con el nombre de la base de datos que creaste, ej: `loyalpymedb`):
          `postgresql://postgres:tu_contraseña_postgres@localhost:5432/loyalpymedb?schema=public`
        - Asegúrate que el usuario de la BD tiene permisos para crear tablas en el schema `public` de esa base de datos.
      - `JWT_SECRET`: Una cadena larga, secreta y aleatoria utilizada para firmar los tokens de autenticación (JWT). **¡No uses el valor de ejemplo en un entorno de producción!** Puedes generar una con un generador de contraseñas online.
      - `CLOUDINARY_CLOUD_NAME`: El "Cloud Name" de tu cuenta de Cloudinary (para almacenamiento de imágenes).
      - `CLOUDINARY_API_KEY`: La "API Key" de tu cuenta de Cloudinary.
      - `CLOUDINARY_API_SECRET`: El "API Secret" de tu cuenta de Cloudinary.
    - **(Opcional) Variables para Tests de Integración:** Si planeas ejecutar los tests de integración del backend, podrías necesitar definir:
      - `TEST_ADMIN_EMAIL`: Email para el admin en los tests.
      - `TEST_ADMIN_PASSWORD`: Contraseña para el admin en los tests.
        _(Nota: Actualmente, los tests podrían tener credenciales hardcodeadas. Idealmente, deberían usar estas variables de entorno.)_
    - **(Opcional) Variables para Creación de Super Admin (si se leen desde .env en el script):**
      - `SUPERADMIN_EMAIL`
      - `SUPERADMIN_PASSWORD`
    - Guarda los cambios en el archivo `.env`.

5.  **Preparar la Base de Datos y Cargar Datos Iniciales:**
    Estos pasos inicializarán tu base de datos con el esquema definido y datos de prueba.
    - **Paso 5.1: Resetear y Aplicar Migraciones:**
      Este comando es fundamental para el desarrollo. **Eliminará todos los datos de tu base de datos `loyalpymedb` (si existe y tiene datos)**, aplicará todas las migraciones desde el principio y creará las tablas según tu archivo `prisma/schema.prisma`. Es la forma más limpia de asegurar que tu BD está sincronizada con el schema durante el desarrollo.
      ```bash
      npx prisma migrate reset
      ```
      Prisma te pedirá confirmación. Escribe `y` o `yes` y presiona Enter.
    - **Paso 5.2: Generar Cliente Prisma:**
      Después de cualquier cambio en el schema (como el que ocurre con `migrate reset` o `migrate dev`), debes regenerar el Cliente Prisma. Esto actualiza los tipos de TypeScript en `node_modules/.prisma/client` para que coincidan con tu schema.
      ```bash
      npx prisma generate
      ```
    - **Paso 5.3: Poblar con Datos de Demostración (Seed):**
      Este comando ejecuta el script `prisma/seed.ts`. Este script está diseñado para crear:
      - Un negocio de demostración llamado "Restaurante Demo LoyalPyME".
      - Un usuario administrador (`BUSINESS_ADMIN`) para ese negocio con credenciales: `admin@demo.com` / `password`.
      - Un usuario cliente (`CUSTOMER_FINAL`) para ese negocio con credenciales: `cliente@demo.com` / `password`.
      - Algunos Tiers y Recompensas de ejemplo para el negocio demo.
      - Los módulos LoyalPyME Core y LoyalPyME Camarero se activan por defecto para este negocio demo.
        Ejecuta:
      ```bash
      npx prisma db seed
      ```
      Deberías ver en la consola los logs del script indicando la creación de estos datos.
    - **Paso 5.4: Crear Usuario Super Administrador Global:**
      La plataforma tiene un rol de Super Administrador para gestionar todos los negocios. Este script crea el primer (y posiblemente único) Super Admin.
      Por defecto (según el script `scripts/create-superadmin.ts`), las credenciales son: `superadmin@loyalpyme.com` / `superadminpassword`.
      **¡Es crucial que cambies la contraseña por defecto en el script `create-superadmin.ts` si vas a usar esto en un entorno más allá de tu máquina local!**
      Ejecuta:
      ```bash
      npx ts-node ./scripts/create-superadmin.ts
      ```
      Guarda estas credenciales del Super Admin en un lugar seguro.

---

## 3. Instalación del Frontend

1.  **Navegar a la Carpeta del Frontend:**
    Desde la raíz del proyecto (`LoyalPyME/`):

    ```bash
    cd frontend
    ```

    (O `cd ../frontend` si estás en la carpeta `backend/`).

2.  **Instalar Dependencias del Frontend:**
    Esto instalará React, Mantine, y otras librerías necesarias.
    ```bash
    yarn install
    # Alternativamente, si usas npm:
    # npm install
    ```
    _(No se requiere archivo `.env` en la carpeta `frontend/` por defecto, ya que la URL de la API se configura en `vite.config.ts` para el proxy o se usa directamente en `axiosInstance` si es una URL completa)._

---

## 4. Ejecución en Modo Desarrollo

**¡Asegúrate de que tu servidor PostgreSQL esté corriendo localmente!**

Se recomienda usar **dos terminales separadas** para el backend para una mejor experiencia de desarrollo.

- **Terminal 1 (Backend - Compilador TypeScript en modo "watch"):**

  - Navega a la carpeta `backend/`.
  - Ejecuta el script `dev:build` de tu `package.json` (o el comando directo):
    ```bash
    yarn dev:build
    # o npx tsc --watch
    ```
  - Esto vigilará cambios en tus archivos `.ts` dentro de `src/` y los compilará automáticamente a JavaScript en la carpeta `dist/`. Déjalo corriendo.

- **Terminal 2 (Backend - Servidor Node.js con Nodemon):**

  - Navega a la carpeta `backend/`.
  - Ejecuta el script `dev:run` de tu `package.json` (o el comando directo):
    ```bash
    yarn dev:run
    # o npx nodemon dist/index.js
    ```
  - Esto iniciará el servidor Express (`http://localhost:3000` por defecto) usando los archivos compilados en `dist/`. Nodemon reiniciará el servidor automáticamente si detecta cambios en `dist/` (causados por `tsc --watch`). Déjalo corriendo.

- **Terminal 3 (Frontend - Servidor de Desarrollo Vite):**
  - Navega a la carpeta `frontend/`.
  - Ejecuta el script `dev`:
    ```bash
    yarn dev
    # Si necesitas que el frontend sea accesible desde otros dispositivos en tu red local (ej: móvil):
    # yarn dev --host
    ```
  - Esto iniciará el servidor de desarrollo de Vite. Por defecto (con `mkcert`), intentará usar `https://localhost:5173`. Si no usas HTTPS, será `http://localhost:5173`. La terminal te mostrará la URL exacta. Déjalo corriendo.

---

## 5. Acceso a la Aplicación y Paneles

Una vez que todos los servidores estén corriendo:

- **Aplicación Principal (Login, Registro Cliente, Dashboard Cliente, Panel Admin Negocio):**
  - Abre tu navegador y ve a `https://localhost:5173` (o la URL que te haya dado Vite).
  - **Credenciales del Negocio Demo (creadas por el seed):**
    - Email: `admin@demo.com`
    - Contraseña: `password`
  - **Credenciales del Cliente Demo (creadas por el seed):**
    - Email: `cliente@demo.com`
    - Contraseña: `password`
- **Panel Super Administrador:**
  - Navega a `https://localhost:5173/superadmin`
  - **Credenciales Super Admin (creadas por el script `create-superadmin.ts`):**
    - Email: `superadmin@loyalpyme.com` (o el que configuraste)
    - Contraseña: `superadminpassword` (¡o la que configuraste!)
- **API Backend Directa:**
  - La API está disponible en `http://localhost:3000`.
- **Documentación API (Swagger UI):**
  - Accede a `http://localhost:3000/api-docs` en tu navegador para ver y probar los endpoints de la API.

**Acceso desde Móvil (Red Local):**
Si ejecutaste el frontend con `yarn dev --host`, Vite te mostrará una URL de "Network" (ej: `https://192.168.1.XX:5173`).

1.  Asegúrate que tu PC y tu dispositivo móvil están en la misma red WiFi.
2.  Abre el navegador en tu móvil y escribe esa URL de red.
3.  Si usas HTTPS (recomendado), es probable que el móvil muestre una advertencia de seguridad por el certificado autofirmado de `mkcert`. Deberás aceptarla para continuar (generalmente hay una opción de "Avanzado" o "Continuar de todas formas").
4.  Verifica que tu firewall en la PC permite conexiones entrantes en el puerto `5173` (para Vite) y `3000` (para el backend API) en redes privadas.

---

## 6. Build para Producción

Para crear las versiones optimizadas para despliegue:

- **Backend:**
  Desde la carpeta `backend/`:
  ```bash
  yarn build
  # o npm run build
  ```
  Esto generará la carpeta `dist/` con el código JavaScript transpilado.
- **Frontend:**
  Desde la carpeta `frontend/`:
  ```bash
  yarn build
  # o npm run build
  ```
  Esto generará la carpeta `dist/` (dentro de `frontend/`) con los assets estáticos optimizados.

---

## 7. Ejecución en Producción (Conceptual)

El despliegue a un entorno de producción es un tema más amplio y depende del proveedor de hosting/plataforma elegido. Conceptualmente, implicaría:

1.  Construir el backend y frontend (ver sección anterior).
2.  Configurar un servidor de producción (VPS, PaaS como Render, Heroku, etc.).
3.  Configurar una base de datos PostgreSQL de producción.
4.  Establecer todas las variables de entorno (`.env`) necesarias en el servidor de producción (DB_URL, JWT_SECRET, credenciales Cloudinary, etc.).
5.  Subir los archivos de `backend/dist/`, `backend/node_modules/` (solo producción), y `frontend/dist/`.
6.  Ejecutar las migraciones de Prisma en la base de datos de producción: `npx prisma migrate deploy`.
7.  Iniciar el servidor Node.js del backend (ej: `node dist/index.js`, idealmente usando un gestor de procesos como PM2).
8.  Configurar un servidor web (como Nginx o Apache) para servir los archivos estáticos del frontend y actuar como proxy inverso para las peticiones `/api` hacia el backend Node.js.
9.  Asegurar HTTPS con certificados SSL válidos.

_(El plan de desarrollo menciona una "Estrategia Deployment & CI/CD (Avanzada)" como tarea futura)._

---

## 8. Comandos y Herramientas Útiles (Ampliados)

Ejecuta estos comandos desde la carpeta correspondiente (`backend/` o `frontend/` según aplique).

- **Base de Datos (Backend - Prisma):**

  - `npx prisma studio`: Abre una interfaz gráfica en el navegador para ver y editar los datos de tu base de datos. ¡Muy útil para desarrollo!
  - `npx prisma migrate dev`: Aplica migraciones pendientes, crea la BD si no existe (en desarrollo). Te pedirá un nombre para la nueva migración si hay cambios en el schema.
  - `npx prisma migrate reset`: **¡CUIDADO!** Borra la base de datos y vuelve a aplicar todas las migraciones. Útil para empezar de cero si las migraciones dan problemas irrecuperables en desarrollo.
  - `npx prisma generate`: Regenera el Cliente Prisma (`@prisma/client`) después de cambios en `schema.prisma`. **Esencial después de cualquier migración.**
  - `npx prisma format`: Formatea automáticamente tu archivo `schema.prisma` para mantenerlo ordenado.
  - `npx prisma validate`: Comprueba si tu `schema.prisma` es válido sintácticamente.
  - `npx prisma db seed`: Ejecuta el script `prisma/seed.ts` para poblar la BD con datos iniciales/demo.

- **Testing (Backend - Vitest):**

  - `yarn test` (o `npm run test`): Ejecuta todos los tests (`*.test.ts`) una vez.
  - `yarn test:watch` (o `npm run test:watch`): Ejecuta los tests y se queda vigilando cambios para volver a ejecutarlos.
  - `yarn test --coverage` (o `npm run test -- --coverage`): Ejecuta los tests y genera un informe de cobertura de código.
  - `yarn test <nombre_archivo_o_patron>`: Ejecuta solo tests específicos.

- **Testing (Frontend - Vitest):**

  - `yarn test` (o `npm run test`): Ejecuta todos los tests una vez.
  - `yarn test:watch` (o `npm run test:watch`): Ejecuta en modo vigilancia.
  - `yarn test:ui` (o `npm run test:ui`): Abre una interfaz gráfica en el navegador para explorar los resultados de los tests de Vitest.
  - `yarn test --coverage` (o `npm run test -- --coverage`): Ejecuta con informe de cobertura.

- **Scripts Personalizados (Backend - ejecutados con `ts-node`):**

  - `npx ts-node ./scripts/create-superadmin.ts`: Crea el usuario Super Administrador global.
  - `npx ts-node ./scripts/hash-customer-password.ts`: (Ejemplo) Script para actualizar hash de contraseña de un usuario específico. Adaptar según necesidad.
    _(Para ejecutar scripts `ts-node`, asegúrate de estar en la carpeta `backend/` y que `ts-node` esté en `devDependencies`)_.

- **Otros Comandos Frontend:**

  - `yarn lint` (o `npm run lint`): Ejecuta ESLint para comprobar la calidad y estilo del código.
  - `yarn preview` (o `npm run preview`): Construye la app para producción y la sirve localmente para previsualizarla.

- **Herramientas Externas Recomendadas:**
  - **Clientes Gráficos de PostgreSQL:** pgAdmin (oficial), DBeaver (universal), DataGrip (de JetBrains, de pago). Muy útiles para inspeccionar el schema, los datos, y ejecutar SQL directamente.
  - **psql:** Cliente de línea de comandos para PostgreSQL. Potente para usuarios avanzados.
  - **Postman / Insomnia / Bruno:** Herramientas para probar la API backend directamente enviando peticiones HTTP (GET, POST, etc.) y viendo las respuestas. Esencial para depurar APIs.
  - **Navegador (Herramientas de Desarrollador - F12):** Indispensable para depurar el frontend:
    - **Consola:** Ver logs de JavaScript, errores.
    - **Red (Network):** Inspeccionar peticiones API, sus cabeceras, cuerpos y respuestas.
    - **Elementos (Elements):** Inspeccionar y modificar el DOM y CSS.
    - **Aplicación (Application):** Ver y modificar `localStorage`, `sessionStorage`, cookies.
  - **Navegador (Depuración Remota Móvil):** Si necesitas depurar la vista móvil, los navegadores de escritorio ofrecen herramientas para conectar con el navegador de un dispositivo móvil (o emulador) y ver su consola/inspector. (Ver sección 5 y `TROUBLESHOOTING_GUIDE.md`).

---

## 9. ¿Problemas?

Si encuentras problemas durante la instalación o ejecución, consulta primero la [TROUBLESHOOTING_GUIDE.md](./TROUBLESHOOTING_GUIDE.md) para ver soluciones a errores comunes ya documentados.

---

_(Fin de la Guía de Setup)_
