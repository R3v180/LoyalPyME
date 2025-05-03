# LoyalPyME - Guía Completa de Instalación y Ejecución Local

**Última Actualización:** 03 de Mayo de 2025

Esta guía describe los pasos necesarios para instalar, configurar y ejecutar el proyecto LoyalPyME en un entorno de desarrollo local.

---

## 1. Prerrequisitos

Antes de empezar, asegúrate de tener instalado lo siguiente en tu sistema:

- **Node.js:** Se recomienda una versión LTS reciente (v18 o v20 al momento de escribir esto). Puedes descargarlo desde [nodejs.org](https://nodejs.org/).
- **Yarn:** Gestor de paquetes para Node.js (v1.x recomendada para este proyecto). Si tienes Node.js/npm, puedes instalarlo con `npm install --global yarn`.
- **PostgreSQL:** Sistema de base de datos. Necesitas tener un servidor PostgreSQL instalado y **corriendo** localmente o accesible en tu red. Puedes descargarlo desde [postgresql.org](https://www.postgresql.org/download/). Necesitarás crear una base de datos para el proyecto (puedes llamarla `loyalpymedb`).
- **Git:** Sistema de control de versiones para clonar el repositorio. [git-scm.com](https://git-scm.com/downloads).
- **(Opcional) NVM (Node Version Manager):** Útil para gestionar múltiples versiones de Node.js ([Linux/Mac](https://github.com/nvm-sh/nvm), [Windows](https://github.com/coreybutler/nvm-windows)).

---

## 2. Instalación del Backend

1.  **Clonar Repositorio:** Si aún no lo tienes, clona el repositorio y entra en la carpeta raíz:

    ```bash
    git clone <url_del_repositorio> LoyalPyME
    cd LoyalPyME
    ```

2.  **Navegar a Backend:**

    ```bash
    cd backend
    ```

3.  **Instalar Dependencias:**

    ```bash
    yarn install
    ```

4.  **Configurar Variables de Entorno (`.env`):**

    - Copia el archivo de ejemplo:
      ```bash
      cp .env.example .env
      ```
    - Abre el archivo `.env` recién creado con un editor de texto.
    - **Edita las siguientes variables obligatorias:**
      - `DATABASE_URL`: La cadena de conexión a tu base de datos PostgreSQL. Formato: `postgresql://<DB_USER>:<DB_PASSWORD>@<DB_HOST>:<DB_PORT>/<DB_NAME>?schema=public`.
        - Ejemplo local común: `postgresql://postgres:tu_contraseña_postgres@localhost:5432/loyalpymedb?schema=public` (Reemplaza `tu_contraseña_postgres` si estableciste una).
      - `JWT_SECRET`: Una cadena larga, secreta y aleatoria para firmar los tokens de autenticación. **¡No uses la de ejemplo en producción!**
      - `CLOUDINARY_CLOUD_NAME`: El "Cloud Name" de tu cuenta de Cloudinary.
      - `CLOUDINARY_API_KEY`: La "API Key" de tu cuenta de Cloudinary.
      - `CLOUDINARY_API_SECRET`: El "API Secret" de tu cuenta de Cloudinary.
    - **Edita estas variables si vas a ejecutar los tests de integración:** (Opcional para desarrollo normal)
      - `TEST_ADMIN_EMAIL`: El email que usarán los tests para el login de admin (ej: `"tests@admin.com"`). _(Tarea Técnica Pendiente #14)_
      - `TEST_ADMIN_PASSWORD`: La contraseña para ese email de test (ej: `"testpassword123"`). _(Tarea Técnica Pendiente #14)_
    - Guarda el archivo `.env`.

5.  **Aplicar Migraciones de Base de Datos:** Este comando crea/actualiza las tablas en tu base de datos según el `schema.prisma`.

    ```bash
    npx prisma migrate dev
    ```

    _(La primera vez te pedirá un nombre para la migración, puedes poner "init")_.

6.  **Generar Cliente Prisma:** **¡Paso MUY importante!** Actualiza el cliente Prisma basado en tu schema.

    ```bash
    npx prisma generate
    ```

    _(Debes ejecutarlo cada vez que cambies `schema.prisma`)_.

7.  **Datos Iniciales (Opcional):**
    - **Opción A (Seed):** Si existe un script de seed (`prisma/seed.ts`), ejecútalo: `npx prisma db seed`.
    - **Opción B (Manual):** Registra tu primer negocio y usuario administrador a través de la interfaz frontend (`/register-business`) una vez que ambos (frontend y backend) estén corriendo.
    - **Para Tests:** Si vas a correr los tests de integración, asegúrate de que el usuario admin definido en los tests (actualmente `admin@cafeelsol.com`/`superpasswordseguro`, o en el futuro el de las variables `TEST_ADMIN_...`) exista en la base de datos (se recomienda registrarlo vía la app).

---

## 3. Instalación del Frontend

1.  **Navegar a Frontend:** Desde la raíz del proyecto (`LoyalPyME/`)

    ```bash
    cd frontend
    ```

    _(O `cd ../frontend` si estás en `backend/`)_.

2.  **Instalar Dependencias:**
    ```bash
    yarn install
    ```

---

## 4. Ejecución en Modo Desarrollo

**¡Asegúrate de que tu servidor PostgreSQL esté corriendo!**

Se recomienda usar **dos terminales separadas** para el backend.

- **Terminal 1 (Backend - Compilador TS):**

  - Navega a la carpeta `backend/`.
  - Ejecuta: `npx tsc --watch`
  - Vigila cambios en `.ts` y compila a `dist/`. Déjalo corriendo.

- **Terminal 2 (Backend - Servidor Node):**

  - Navega a la carpeta `backend/`.
  - Ejecuta: `npx nodemon dist/index.js`
  - Inicia el servidor (`http://localhost:3000`) y reinicia si `dist/` cambia. Déjalo corriendo.

- **Terminal 3 (Frontend - Servidor Vite):**
  - Navega a la carpeta `frontend/`.
  - Ejecuta: `yarn dev --host`
  - Inicia el servidor de desarrollo (`https://localhost:5173` y la IP de red). Déjalo corriendo.

---

## 5. Acceso desde Móvil (Red Local)

1.  **Encuentra la IP Local de tu PC:** (Usando `ipconfig` o `ifconfig`).
2.  **Asegura Servidores Corriendo:** Los 3 procesos de la sección anterior.
3.  **Verifica Firewall:** Permitir TCP entrante en puertos `5173` y `3000` para red Privada.
4.  **Verifica Config Vite:** `server: { host: true, https: true, proxy: { ... } }` en `vite.config.ts`.
5.  **Accede desde el Navegador Móvil:** `https://<TU_IP_LOCAL_PC>:5173`.
6.  **Acepta Advertencia de Seguridad:** Necesario por el certificado autofirmado.

---

## 6. Build para Producción

- En `backend/`: `yarn build`
- En `frontend/`: `yarn build`

---

## 7. Ejecución en Producción (Conceptual)

_(Despliegue detallado pendiente)._ Implica compilar (`yarn build`), subir archivos (`backend/dist`, `frontend/dist`, dependencias prod), configurar variables de entorno, asegurar conexión a BD prod, ejecutar migraciones prod, iniciar servidor Node (`node dist/index.js`), y configurar un servidor web/proxy inverso (Nginx?).

---

## 8. Comandos y Herramientas Útiles (Ampliados)

Ejecuta estos comandos desde la carpeta correspondiente (`backend/` o `frontend/`).

- **Base de Datos (Backend):**

  - `npx prisma studio`: **Abre una interfaz gráfica en el navegador** para ver y editar los datos de tu base de datos. ¡Muy útil!
  - `npx prisma migrate dev`: Aplica migraciones pendientes, crea la BD si no existe, genera Prisma Client. (Ya mencionado en setup).
  - `npx prisma generate`: Regenera Prisma Client después de cambios en `schema.prisma`. (Ya mencionado en setup).
  - `npx prisma format`: Formatea automáticamente tu archivo `schema.prisma`.
  - `npx prisma validate`: Comprueba si tu `schema.prisma` es válido.
  - `npx prisma db seed`: Ejecuta el script `prisma/seed.ts` (si existe) para poblar la BD con datos iniciales.
  - `npx prisma migrate reset`: **¡CUIDADO!** Borra la base de datos y vuelve a aplicar todas las migraciones. Útil para empezar de cero o si las migraciones dan problemas irrecuperables.

- **Testing (Backend):**

  - `yarn test`: Ejecuta todos los tests (`*.test.ts`) una vez.
  - `yarn test:watch`: Ejecuta los tests y se queda vigilando cambios para volver a ejecutarlos.
  - `yarn test --coverage`: Ejecuta los tests y genera un informe de cobertura de código.
  - `yarn test <nombre_archivo>`: Ejecuta solo los tests de un archivo específico (ej: `yarn test tests/integration/auth.test.ts`).

- **Testing (Frontend):**

  - `yarn test`: Ejecuta todos los tests una vez.
  - `yarn test:watch`: Ejecuta en modo vigilancia.
  - `yarn test:ui`: Abre una interfaz gráfica en el navegador para explorar los resultados de los tests de Vitest.
  - `yarn test --coverage`: Ejecuta con informe de cobertura.

- **Scripts Personalizados (Backend):**

  - `npx ts-node ./scripts/hash-customer-password.ts`: Ejemplo para ejecutar un script TS directamente (usado para actualizar hash de contraseña). Necesita `ts-node` (puedes instalarlo con `yarn add --dev ts-node` si no lo tienes).

- **Otros Comandos Frontend:**

  - `yarn lint`: Ejecuta ESLint para comprobar la calidad y estilo del código.
  - `yarn preview`: Construye la app para producción y la sirve localmente para previsualizarla.

- **Herramientas Externas:**
  - **pgAdmin / DBeaver / etc.:** Clientes gráficos de base de datos para inspeccionar o modificar datos en PostgreSQL directamente.
  - **psql:** Cliente de línea de comandos para PostgreSQL.
  - **Postman / Insomnia:** Herramientas para probar la API backend directamente enviando peticiones HTTP.
  - **Navegador (Herramientas de Desarrollador - F12):** Indispensable para depurar el frontend (Consola, Red, Elementos, Almacenamiento Local).
  - **Navegador (Depuración Remota Móvil):** Para ver la consola del navegador móvil en el PC (ver sección 5 y `TROUBLESHOOTING_GUIDE.md`).

---

## 9. ¿Problemas?

Consulta la [TROUBLESHOOTING_GUIDE.md](./TROUBLESHOOTING_GUIDE.md) para ver soluciones a errores comunes encontrados durante el desarrollo.

---

_(Fin de la Guía de Setup)_
