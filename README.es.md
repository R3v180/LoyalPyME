# LoyalPyME

[![GitHub repo size](https://img.shields.io/github/repo-size/R3v180/LoyalPyME?style=flat-square)](https://github.com/R3v180/LoyalPyME)
[![GitHub contributors](https://img.shields.io/github/contributors/R3v180/LoyalPyME?style=flat-square)](https://github.com/R3v180/LoyalPyME/graphs/contributors)
[![GitHub last commit](https://img.shields.io/github/last-commit/R3v180/LoyalPyME?style=flat-square)](https://github.com/R3v180/LoyalPyME/commits/main)
[![GitHub issues](https://img.shields.io/github/issues/R3v180/LoyalPyME?style=flat-square)](https://github.com/R3v180/LoyalPyME/issues)
[![GitHub pull requests](https://img.shields.io/github/issues-pr/R3v180/LoyalPyME?style=flat-square)](https://github.com/R3v180/LoyalPyME/pulls)
[![License: AGPL v3](https://img.shields.io/badge/License-AGPL%20v3-blue.svg?style=flat-square)](https://www.gnu.org/licenses/agpl-3.0)

---

🇬🇧 [Read in English](README.md) | 🇪🇸 **Estás leyendo la versión en Español.**

---

# LoyalPyME 🇪🇸

**LoyalPyME** es una plataforma web integral full-stack (Frontend React + Backend Node.js) diseñada para facilitar a las Pequeñas y Medianas Empresas (PyMEs) la gestión de un programa de fidelización de clientes digital potente, robusto, mantenible y escalable.

## Visión y Propósito ✨

En un mercado competitivo, la lealtad del cliente es crucial. LoyalPyME nace para ser el aliado tecnológico de las PyMEs, proporcionando las herramientas para:

- **Fomentar Compras Recurrentes:** Implementando sistemas atractivos de puntos, niveles y recompensas.
- **Construir Relaciones Sólidas:** Reconociendo y premiando la fidelidad del cliente.
- **Simplificar la Gestión:** Ofreciendo un panel de administración intuitivo y rico en funcionalidades.
- **Mejorar la Experiencia del Cliente:** Proporcionando un portal digital claro y accesible para los clientes finales.

Nuestro objetivo es permitir a cualquier PyME (minorista, hostelería, servicios, etc.) digitalizar y optimizar su estrategia de retención de clientes, evolucionando la plataforma hacia capacidades integradas de comunicación, CRM, presencia móvil y, potencialmente, ecosistemas de fidelización compartidos.

<p align="center">
  <img src="images/SC_LoyalPyME.png" alt="Panel Admin LoyalPyME - Vista Escritorio" width="55%">
  &nbsp;&nbsp;&nbsp;&nbsp; <img src="images/SC_LoyalPyME_PHONE.png" alt="Panel Admin LoyalPyME - Vista Móvil" width="35%">
</p>
_(Nota: Las capturas podrían necesitar actualizarse a medida que evoluciona la interfaz)_

## Estado del Proyecto y Hoja de Ruta 🗺️

El desarrollo de LoyalPyME sigue un enfoque por fases, asegurando una base sólida antes de expandir la funcionalidad.

---

### ✅ Fase 1: Núcleo Operativo y Refactorización (Completada)

La fase fundacional, centrada en construir el motor de fidelización principal y llevar a cabo una refactorización significativa para la mantenibilidad y escalabilidad, está completada.

**Logros Clave:**

- **Plataforma Web Full-Stack:** Frontend (React/TS/Mantine) y Backend (Node/Express/TS/Prisma/PostgreSQL) operativos.
- **Refactorización Mayor:** Refactorizado con éxito tanto el frontend (hooks, componentes) como el backend (servicios, controladores por módulo).
- **Autenticación Segura:** Sistema JWT con registro (Admin/Cliente), login, recuperación contraseña, control de acceso por roles (`BUSINESS_ADMIN`, `CUSTOMER_FINAL`).
- **Sistema de Niveles (Backend Completo):** CRUD Admin Tiers, config. negocio, cálculo automático, CRON job.
- **Gestión de Recompensas:** CRUD Admin completo.
- **Flujo de Puntos Principal:** Generación QR Admin (FE+BE), Validación QR Cliente (FE+BE) con asignación puntos/métricas/trigger nivel.
- **Paneles de Usuario:**
  - **Panel Cliente:** Ver puntos/nivel; ver/canjear recompensas y regalos.
  - **Panel Admin:** Layout básico, Overview con stats clave y accesos rápidos.
- **Gestión de Clientes (Admin):** Listado paginado/ordenable/búsqueda; Acciones individuales (Ver/Editar Notas, Ajustar Puntos, Cambiar Nivel, Favorito, Activar/Desactivar, Asignar Regalo); Acciones Masivas (Activar/Desactivar, Eliminar, Ajustar Puntos).
- **Entorno de Pruebas Móvil:** Configuración de Vite (proxy, host) y servicios FE para permitir pruebas en móvil vía IP local.

---

### ⏳ Fase 1: Pulido y Mejoras (Foco Actual / Pendiente)

Esta fase se centra en refinar la funcionalidad central existente y abordar mejoras clave identificadas.

- **✨ [P1 COMPLETADA] Mejorar Dashboard Admin:** Implementadas Stat Cards con colores e indicadores de tendencia.
- **Funcionalidad Admin Clientes:**
  - Implementar **UI y Lógica Backend para Filtros Completos** (Activo, Favorito, Nivel).
  - **Optimizar/Mejorar Búsqueda y Paginación** (Analizar/mejorar rendimiento BD, mejorar UI/UX).
- 💡 **Mejoras Experiencia Cliente (Frontend):**
  - Mostrar **Progreso Hacia el Siguiente Nivel**.
  - Listar claramente los **Beneficios del Nivel Actual y Siguiente**.
  - (Opcional) Añadir **Historial Básico de Actividad**.
  - (Opcional) Refinar UI tarjetas Recompensas/Regalos.
- 💡 **Mejoras Backend:**
  - Reforzar **Validación de Entrada API**.
  - Utilizar **Códigos de Error HTTP Específicos**.
  - Revisar **Transacciones Prisma**.
  - Añadir **Indexación Proactiva BD**.
  - Asegurar uso `select` Prisma (Optimización).
  - Mejorar **Logging**.
  - Reforzar **Gestión Configuración** (`.env`).
  - (Opcional) Implementar **Rate Limiting**.
  - (Opcional) Introducir **Registro Auditoría (`AuditLog`)**.
- 💡 **Mejoras Experiencia Admin (Frontend):**
  - (Relacionado con P1) Enriquecer Dashboard con **Feed de Actividad**.
  - Implementar **Búsqueda/Filtros Clientes Avanzados**.
  - Mejorar **Modal Detalles Cliente**.
  - Añadir **Exportación CSV** básica.
  - Mostrar **Estadísticas Uso** Recompensas/Niveles.
  - Añadir **descripciones/ayudas** Config Niveles.
  - Revisar **Notificaciones/Carga** Consistentes.
  - Usar **Modales Confirmación**.
- **Calidad y Mantenimiento:**
  - Realizar **Limpieza General de Código**.
  - **Introducir Pruebas Automatizadas** (**Alta Prioridad**).
  - ⚙️ Solucionar problema `yarn dev`.

---

### 🚀 Hoja de Ruta Futura (Plan de Evolución)

_(Alto nivel, sujeto a refinamiento)_

- **Fase 2 (Expansión Funcional - Post-Fase 1):**
  - Reglas de Fidelización Avanzadas.
  - Herramientas Básicas de Comunicación Web.
  - Segmentación Avanzada y CRM Ligero.
  - Implementación Audit Log Backend.
- **Fase 3 (App Móvil y Análisis Avanzado):**
  - Aplicación Móvil Nativa (Clientes/Admin).
  - Funcionalidades CRM Completas y Analítica Avanzada.
- **Fase 4 (Ecosistemas y Potencial Social - Largo Plazo):**
  - Ecosistemas de Fidelización Compartidos.
  - Funcionalidades Sociales (mapas actividad, eventos, chat).
  - 💡 (Módulo Potencial) Gestión de Eventos/Listas de Invitados.

---

## Tecnologías Utilizadas 🛠️

**Frontend:**

- React & TypeScript
- Vite (Herramienta de Construcción)
- Mantine UI (v7+) & Mantine Hooks
- `@mantine/form` & `zod` (Validación Formularios)
- `@mantine/notifications` (Feedback UI)
- `@mantine/modals` (Modales)
- Axios (Peticiones API)
- React Router DOM (v6+)
- `qrcode.react`, `react-qr-reader` (Funcionalidad QR)

**Backend:**

- Node.js, Express, TypeScript
- Prisma (ORM)
- PostgreSQL (Base de Datos)
- JWT (Autenticación) & bcryptjs (Hashing)
- dotenv (Variables Entorno)
- node-cron (Tareas Programadas)
- uuid (IDs Únicos)
- cors
- `ts-node`, `ts-node-dev` (Dependencias Desarrollo)

## Instalación y Configuración Local ⚙️

Para poner el proyecto en marcha en tu entorno de desarrollo:

### Prerrequisitos

- Node.js (v18+ recomendado)
- yarn (v1.x recomendado)
- Servidor de base de datos PostgreSQL accesible y ejecutándose localmente.

### Configuración Backend

1.  Clona el repositorio y navega a `backend`:
    ```bash
    git clone [https://github.com/R3v180/LoyalPyME.git](https://github.com/R3v180/LoyalPyME.git)
    cd LoyalPyME/backend
    ```
2.  Instala dependencias:
    ```bash
    yarn install
    ```
3.  **Crea tu archivo de entorno local:** Copia el archivo `backend/.env.example` a `backend/.env`:
    ```bash
    cp .env.example .env
    ```
    _(Consulta `backend/.env.example` para detalles de las variables)._
4.  **Configura tu archivo `.env`:** Abre `backend/.env` y:
    - Reemplaza los placeholders de `DATABASE_URL` con tus datos locales de PostgreSQL. _(Ej: `postgresql://postgres:TU_CONTRASENA_BD@localhost:5432/loyalpymedb?schema=public`)_.
    - Reemplaza el placeholder de `JWT_SECRET` con una **cadena aleatoria segura** (mín. 32 chars, ej: `openssl rand -hex 32`). **¡No uses el placeholder!**
    - Opcionalmente, ajusta `PORT`.
    - **Importante:** Asegura que `.env` está en `.gitignore`.
5.  **Configura el esquema BD:**
    ```bash
    npx prisma migrate dev
    ```
6.  **Genera el Cliente Prisma:**
    ```bash
    npx prisma generate
    ```
7.  **Datos Iniciales y Credenciales (IMPORTANTE - Acción Requerida):**
    Necesitas datos iniciales (negocio, admin) para probar. Elige **UNA** opción:

    - **[ ] Opción A: Seed (Recomendado - Requiere Implementación/Confirmación)**

      - Ejecuta: `npx prisma db seed`
      - Debería crear datos por defecto.
      - **Credenciales Ejemplo (¡Confirmar/Cambiar en `prisma/seed.ts`!):** `admin@loyalpyme.test` / `password123`
      - _(Requiere script `prisma/seed.ts` funcional)._

    - **[ ] Opción B: Registro Manual (Si no hay seed)**
      - Tras arrancar todo, ve a `http://localhost:5173/register-business` en el navegador y registra tu primer negocio/admin. Usa esas credenciales.

    _(Mantenedor: Confirma flujo (A o B), implementa/actualiza seed si es A, y elimina la opción no aplicable)._

8.  **(Opcional) Cliente Test Específico:**
    - Crea cliente manualmente en BD y usa script para hashear contraseña:
      ```bash
      # Edita 'scripts/hash-customer-password.ts' primero
      npx ts-node scripts/hash-customer-password.ts
      ```

### Configuración Frontend

1.  Navega a la carpeta `frontend`:
    ```bash
    cd ../frontend
    ```
    _(O `cd frontend` desde la raíz)_.
2.  Instala dependencias:
    ```bash
    yarn install
    ```

## Ejecutando el Proyecto ▶️

1.  Asegúrate de que tu servidor PostgreSQL está **en ejecución**.
2.  **Inicia el backend** (desde `backend`):

    ```bash
    # Recomendado (estable):
    yarn build && node dist/index.js

    # Alternativa (puede fallar):
    # yarn dev
    ```

    _Nota: `yarn dev` puede ser inestable. `build && start` es más fiable ahora._
    Backend corre en `http://localhost:3000` (o `PORT` de `.env`).

3.  **Inicia el frontend** (desde `frontend`, en otra terminal):
    ```bash
    # Usa --host para probar en móvil vía IP local
    yarn dev --host
    ```
    Vite mostrará URLs `Local:` y `Network:`. Usa la `Network:` (ej: `http://<TU_IP_PC>:5173`) en el navegador del móvil (asegura firewall abierto en PC para puertos 5173 y 3000). Frontend corre en puerto `5173`.

Accede a la aplicación vía `http://localhost:5173` (en PC) o la URL `Network:` (en móvil). Inicia sesión con las credenciales del paso "Datos Iniciales".

## Contribuciones 🤝

¡Las contribuciones son bienvenidas! Sigue el flujo estándar: Fork -> Branch -> Commit -> Push -> Pull Request. Describe bien tus cambios.

1.  Haz Fork.
2.  Crea rama feature/fix.
3.  Haz Commit.
4.  Haz Push a tu fork.
5.  Abre Pull Request a `main`.

## Licencia 📜

Licencia: **GNU Affero General Public License v3.0 (AGPL-3.0)**.

Ver archivo [`LICENSE`](LICENSE). AGPL v3 requiere que modificaciones accesibles por red sean también código abierto.

Copyright (c) 2024-2025 Olivier Hottelet

## Contacto 📧

- **Olivier Hottelet**
- olivierhottelet1980@gmail.com
