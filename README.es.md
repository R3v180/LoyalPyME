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

|                                   Panel de Admin (Escritorio)                                   |                                      Panel de Admin (Móvil)                                      |
| :---------------------------------------------------------------------------------------------: | :----------------------------------------------------------------------------------------------: |
| <img src="images/SC_LoyalPyME.png" alt="Panel Admin LoyalPyME - Vista Escritorio" width="100%"> | <img src="images/SC_LoyalPyME_PHONE.png" alt="Panel Admin LoyalPyME - Vista Móvil" width="100%"> |

_(Nota: Las capturas podrían necesitar actualizarse a medida que evoluciona la interfaz)_

## Estado del Proyecto y Hoja de Ruta 🗺️

El desarrollo de LoyalPyME sigue un enfoque por fases, priorizando la entrega de un núcleo de fidelización funcional y escalando hacia capacidades avanzadas y comunitarias.

**Fase 1: Núcleo de Fidelización Web (Operativa y Casi Completa)**

- **Gestión de Recompensas Centralizada:** Creación, edición, eliminación y gestión de estado (activo/inactivo) de recompensas canjeables. **(Funcional)**
- **Sistema de Puntos Transaccional:** Generación de códigos QR únicos por transacción para asignación de puntos. **(Funcional)** Validación de códigos QR por el cliente final para ganar puntos. **(Funcional)**
- **Sistema de Niveles Configurable:** Definición de niveles (tiers) con umbrales, gestión de beneficios asociados, configuración de lógica global del sistema y políticas de descenso (vía backend). **(Funcional)**
- **Portal de Cliente Esencial:** Visualización del perfil de usuario (puntos, nivel), visualización de recompensas disponibles y regalos, canje de ambas categorías. **(Funcional)**
- **Gestión de Clientes (Admin):**

  - Listado de clientes registrados con datos clave (puntos, nivel, fecha registro, estado), ordenación. **(Funcional)**

  * Búsqueda básica por nombre/email. **(Funcional)**
  * Paginación (Lógica básica UI/Backend presente). **(Funcional)**
  * Acciones Individuales: Ajuste manual de puntos, cambio manual de nivel, asignación de recompensas como regalos, marcar/desmarcar como "Favorito", Activar/Desactivar cliente. **(Funcional)**
  * Modal Ver Detalles: Muestra información detallada del cliente incluyendo notas de admin. **(Funcional)**
  * Notas Admin: Funcionalidad completa para ver, editar y guardar notas internas por cliente. **(Funcional)**
  * Acciones Masivas: Seleccionar múltiples clientes, Activar/Desactivar Masivo, Eliminar Masivo (con confirmación), Ajustar Puntos Masivo (con modal input). **(Funcional)**

- **_Tareas Restantes para Fase 1:_**
  - Implementar **Filtros Completos** en Gestión Clientes Admin (UI + conexión BE para filtrar por Estado Activo, Favorito, etc.).
  - **Optimizar/Mejorar Búsqueda y Paginación** (Revisar rendimiento backend, mejorar UI paginación si es necesario).
  * **Limpieza General** (Revisar TODOs, eliminar logs de depuración, centralizar tipos, revisar consistencia).

**Fases Futuras (Hacia un Ecosistema Completo):**

- **Fase 2 (Expansión Web):** Reglas de puntos y recompensas más complejas, herramientas básicas de comunicación directa (email, publicaciones en portal), segmentación avanzada de clientes, potencialmente otras acciones masivas.
- **Fase 3 (Plataforma Móvil):** Aplicaciones nativas para clientes y personal, notificaciones push, check-in basado en ubicación, tarjeta de fidelización digital en la app.
- **Fase 4 (Inteligencia de Negocio y CRM Ligero):** Módulos de análisis e informes sobre comportamiento y valor del cliente, funcionalidades de CRM ligero (historial completo más allá de notas?), automatización de marketing.
- **Fase 5 (Ecosistemas Conectados y Potencial Social):** Programas de fidelización compartidos entre grupos de negocios, módulo de eventos, chat Cliente-Negocio y potencial chat comunitario/social (ej: mapa de actividad anónima en sectores específicos como ocio nocturno), expansión a otros sectores y geografías.

## Tecnologías Utilizadas 🛠️

**Frontend:**

- React & TypeScript
- Vite (Herramienta Construcción)
- Mantine UI (v7+) & Mantine Hooks
- `@mantine/form` & `zod` (Validación Formularios)
- `@mantine/notifications` (Feedback UI)
- `@mantine/modals` (Modales)
- Axios (Peticiones API)
- React Router DOM (v6+)
- `qrcode.react`, `html5-qrcode` (Funcionalidad QR) _(Librería actualizada)_
- `vite-plugin-mkcert` _(Añadido para HTTPS Dev)_

**Backend:**

- Node.js, Express, TypeScript
- Prisma (ORM)
- PostgreSQL (Base de Datos)
- JWT (Autenticación) & bcryptjs (Hashing)
- dotenv (Variables Entorno)
- node-cron (Tareas Programadas - Lógica Niveles)
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

1.  Clona repo y `cd LoyalPyME/backend`
2.  `yarn install`
3.  Copia `backend/.env.example` a `backend/.env` (`cp .env.example .env`)
4.  **Configura `.env`:** Rellena `DATABASE_URL` con tus datos locales y genera un `JWT_SECRET` seguro y aleatorio. **No subas `.env` a Git**.
5.  Ejecuta migraciones: `npx prisma migrate dev`
6.  Genera cliente: `npx prisma generate`
7.  **Datos Iniciales (IMPORTANTE - Acción Requerida):** Elige **UNA** opción:
    - **[ ] Opción A: Seed (Recomendado - Requiere Implementación/Confirmación)**: Ejecuta `npx prisma db seed`. Credenciales Ejemplo (¡Confirmar/Cambiar!): `admin@loyalpyme.test` / `password123`. _(Requiere script `prisma/seed.ts` funcional)_.
    - **[ ] Opción B: Registro Manual (Si no hay seed)**: Tras arrancar, ve a `/register-business` y crea tu primer negocio/admin.
      _(Mantenedor: Confirma flujo (A o B), implementa/actualiza seed si es A, y elimina la opción no aplicable)._
8.  (Opcional) `npx ts-node scripts/hash-customer-password.ts` para clientes específicos.

### Configuración Frontend

1.  Navega a `frontend` (`cd ../frontend`)
2.  Instala dependencias (incluyendo `vite-plugin-mkcert` si añadiste HTTPS):
    ```bash
    yarn install
    # Si no has añadido mkcert aún:
    # yarn add -D vite-plugin-mkcert
    ```

## Ejecutando el Proyecto ▶️

1.  Asegúrate de que PostgreSQL está **en ejecución**.
2.  **Inicia Backend** (desde `backend`):
    ```bash
    # Recomendado (estable):
    yarn build && node dist/index.js
    # Alternativa (inestable):
    # yarn dev
    ```
    _(Backend corre en puerto 3000 o el de `.env`)_
3.  **Inicia Frontend** (desde `frontend`):
    ```bash
    # Usa --host para acceso por red y HTTPS (si está configurado)
    yarn dev --host
    ```
    _(Frontend corre en puerto 5173. Revisa URL `Network:` en consola para acceso móvil - requiere firewall abierto en PC para puertos 5173 y 3000)._

Accede vía `https://localhost:5173` (en PC, acepta advertencia seguridad) o la URL `Network:` (en Móvil, acepta advertencia seguridad). Usa credenciales del paso "Datos Iniciales".

#### **Acceso desde Móvil (Red Local)**

Para probar el frontend en un dispositivo móvil conectado a la misma red WiFi/Hotspot que tu PC:

1.  **Encuentra IP Local del PC:** Usa `ipconfig` (Win) o `ip addr show` / `ifconfig` (Mac/Linux). Busca la dirección IPv4 de la conexión activa (ej: `192.168.X.Y`).
2.  **Asegura Servidores Corriendo:** Backend (`node ...`) y Frontend (`yarn dev --host`).
3.  **Verifica Firewall PC:** Permite conexiones **TCP** entrantes en puertos **5173** (Vite) y **3000** (Backend) para tu perfil de red **Privado**.
4.  **Verifica Config Vite:** Asegura que `frontend/vite.config.ts` incluye `server: { host: true, https: true, proxy: { ... } }`.
5.  **Verifica URLs Servicios FE:** Asegura que `axiosInstance` usa `baseURL: '/api'` y `businessService` usa `/public/...` (rutas relativas).
6.  **Accede en Móvil:** Abre navegador en móvil y navega a `https://<TU_IP_PC>:5173` (ej: `https://192.168.X.Y:5173`). **Acepta la advertencia de seguridad** del navegador por el certificado auto-firmado. La app debería cargar y las llamadas API funcionar vía proxy.

---

## Contribuciones 🤝

¡Contribuciones bienvenidas! Flujo: Fork -> Branch -> Commit -> Push -> Pull Request.

## Licencia 📜

Licencia: **GNU Affero General Public License v3.0 (AGPL-3.0)**. Ver [`LICENSE`](LICENSE).

Copyright (c) 2024-2025 Olivier Hottelet

## Contacto 📧

- **Olivier Hottelet**
- olivierhottelet1980@gmail.com
