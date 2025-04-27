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

![Captura del Panel de Administración de LoyalPyME](images/SC_LoyalPyME.png)
_(Nota: La captura de pantalla podría necesitar actualizarse para reflejar la interfaz más reciente)_

## Estado del Proyecto y Hoja de Ruta 🗺️

El desarrollo de LoyalPyME sigue un enfoque por fases, asegurando una base sólida antes de expandir la funcionalidad.

---

### ✅ Fase 1: Núcleo Operativo y Refactorización (Completada)

La fase fundacional, centrada en construir el motor de fidelización principal y llevar a cabo una refactorización significativa para la mantenibilidad y escalabilidad, está completada.

**Logros Clave:**

- **Plataforma Web Full-Stack:** Frontend (React/TS/Mantine) y Backend (Node/Express/TS/Prisma/PostgreSQL) operativos.
- **Refactorización Mayor:** Refactorizado con éxito tanto el frontend (hooks, componentes) como el backend (servicios, controladores por módulo) para mejorar la estructura y separación de responsabilidades.
- **Autenticación Segura:** Sistema basado en JWT implementado (Registro Admin/Cliente, Login, Recuperación Contraseña) con control de acceso basado en roles (`BUSINESS_ADMIN`, `CUSTOMER_FINAL`).
- **Sistema de Niveles (Backend Completo):** CRUD Admin para Niveles (Tiers), configuración a nivel de negocio, cálculo automático de nivel basado en métricas (gasto, visitas, puntos) y tarea CRON para actualizaciones/descensos periódicos.
- **Gestión de Recompensas:** CRUD completo para Administradores (Crear, Leer, Actualizar, Eliminar, Activar/Desactivar).
- **Flujo de Puntos Principal:**
  - Generación de Códigos QR por el Admin (FE+BE).
  - Validación de Códigos QR por el Cliente (FE+BE) que dispara la asignación de puntos, actualización de métricas y lógica de actualización de nivel.
- **Paneles de Usuario:**
  - **Panel Cliente:** Visualización de puntos, nivel actual (nombre); ver recompensas disponibles y regalos asignados; canjear recompensas (por puntos) y regalos.
  - **Panel Admin:** Layout básico (Header, Sidebar), página simple de Resumen (Overview).
- **Gestión de Clientes (Admin):**
  - Listado de clientes paginado y ordenable.
  - Búsqueda básica (nombre/email).
  - **Acciones Individuales:** Ver Detalles (incl. notas), Editar Notas Admin, Ajustar Puntos, Cambiar Nivel (manual), Marcar/Desmarcar Favorito, Activar/Desactivar, Asignar Recompensa como Regalo.
  - **Acciones Masivas:** Selección múltiple, Activar/Desactivar Masivo, Eliminar Masivo (con confirmación), Ajustar Puntos Masivo (vía modal).

---

### ⏳ Fase 1: Pulido y Mejoras (Foco Actual / Pendiente)

Esta fase se centra en refinar la funcionalidad central existente y abordar mejoras clave identificadas.

- **Funcionalidad Admin Clientes:**
  - Implementar **UI y Lógica Backend para Filtros Completos** (por estado Activo, Favorito, Nivel).
  - **Optimizar/Mejorar Búsqueda y Paginación** (Analizar/mejorar rendimiento BD, mejorar UI/UX).
- 💡 **Mejoras Experiencia Cliente (Frontend):**
  - Mostrar **Progreso Hacia el Siguiente Nivel** (visual/numérico).
  - Listar claramente los **Beneficios del Nivel Actual y del Siguiente**.
  - (Opcional) Añadir **Historial Básico de Actividad** (puntos ganados/gastados).
  - (Opcional) Refinar UI de tarjetas de Recompensas/Regalos para mayor claridad.
- 💡 **Mejoras Backend:**
  - Reforzar **Validación de Entrada en API** (Controllers/Middleware).
  - Utilizar **Códigos de Error HTTP más Específicos** (404, 409, etc.).
  - Revisar uso de **Transacciones Prisma** en operaciones críticas.
  - Añadir **Indexación Proactiva a Base de Datos**.
  - Asegurar uso consistente de `select` Prisma para **Optimización de Consultas**.
  - Mejorar **Logging** (estructurado, contextual).
  - Reforzar **Gestión de Configuración** (`.env`).
  - (Opcional) Implementar **Rate Limiting** básico.
  - (Opcional) Introducir **Registro de Auditoría (`AuditLog`)** básico.
- 💡 **Mejoras Experiencia Admin (Frontend):**
  - Enriquecer **Panel Principal Admin** (Métricas Clave, Feed Actividad).
  - Implementar **Búsqueda/Filtros de Clientes Avanzados** (Teléfono, Documento, Nivel).
  - Mejorar **Modal de Detalles del Cliente** (ej: acciones rápidas).
  - Añadir **Exportación CSV** básica para clientes.
  - Mostrar **Estadísticas de Uso** de Recompensas y Niveles.
  - Añadir más descripciones/ayudas en **Configuración de Niveles**.
  - Asegurar consistencia en **Notificaciones y Estados de Carga**.
  - Usar **Modales de Confirmación** para acciones críticas/destructivas.
- **Calidad y Mantenimiento:**
  - Realizar **Limpieza General de Código** (eliminar código muerto, TODOs, `console.log`; centralizar tipos).
  - **Introducir Pruebas Automatizadas (Unitarias, Integración, E2E):** Fundamental para asegurar estabilidad (**Alta Prioridad**).
  - ⚙️ Solucionar problema persistente con `yarn dev` (`ts-node-dev`).

---

### 🚀 Hoja de Ruta Futura (Plan de Evolución)

_(Alto nivel, sujeto a refinamiento)_

- **Fase 2 (Expansión Funcional - Post-Fase 1):**
  - Reglas de Fidelización Avanzadas (ej: descuentos, más tipos de recompensa).
  - Herramientas Básicas de Comunicación Web (ej: emails segmentados, anuncios en portal).
  - Segmentación Avanzada de Clientes y Funcionalidades CRM Ligero.
  - Implementación Audit Log en Backend.
- **Fase 3 (App Móvil y Análisis Avanzado):**
  - Aplicación Móvil Nativa para Clientes (ver estado, escanear QR, canjear, notificaciones push). Posible app compañera para Admin.
  - Funcionalidades CRM Completas y Analítica/Reportes Avanzados.
- **Fase 4 (Ecosistemas y Potencial Social - Largo Plazo):**
  - Ecosistemas de Fidelización Compartidos / Canjes entre negocios.
  - Funcionalidades Sociales (específico sector: mapas actividad, eventos, chat).

---

## Tecnologías Utilizadas 🛠️

**Frontend:**

- React & TypeScript
- Vite (Herramienta de Construcción)
- Mantine UI (v7+) & Mantine Hooks
- `@mantine/form` & `zod` (Validación de Formularios)
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
- dotenv (Variables de Entorno)
- node-cron (Tareas Programadas - Lógica de Niveles)
- uuid (IDs Únicos)
- cors
- `ts-node`, `ts-node-dev` (Dependencias de Desarrollo)

## Instalación y Configuración Local ⚙️

Para poner el proyecto en marcha en tu entorno de desarrollo:

### Prerrequisitos

- Node.js (v18+ recomendado, revisa especificidades del proyecto)
- yarn (v1.x recomendado, revisa especificidades del proyecto)
- Servidor de base de datos PostgreSQL accesible

### Configuración Backend

1.  Clona el repositorio y navega a la carpeta `backend`:
    ```bash
    git clone [https://github.com/R3v180/LoyalPyME.git](https://github.com/R3v180/LoyalPyME.git)
    cd LoyalPyME/backend
    ```
2.  Instala las dependencias:
    ```bash
    yarn install
    ```
3.  Crea un archivo `.env` en la raíz de `backend/` con:
    ```env
    DATABASE_URL="postgresql://tu_usuario:tu_contraseña@host:puerto/tu_bd?schema=public"
    JWT_SECRET="tu_secreto_jwt_fuerte_y_aleatorio_aqui"
    # PORT=3000 (Opcional, por defecto es 3000)
    ```
4.  Ejecuta las migraciones de Prisma:
    ```bash
    npx prisma migrate dev
    ```
5.  Genera el Cliente Prisma:
    ```bash
    npx prisma generate
    ```
6.  (Opcional) Hashea la contraseña para un cliente de prueba:
    ```bash
    # ¡Edita el script primero si es necesario!
    npx ts-node scripts/hash-customer-password.ts
    ```

### Configuración Frontend

1.  Navega a la carpeta `frontend`:
    ```bash
    cd ../frontend
    ```
2.  Instala las dependencias:
    ```bash
    yarn install
    ```

## Ejecutando el Proyecto ▶️

1.  Asegúrate de que tu servidor PostgreSQL está en ejecución.
2.  **Inicia el backend** (desde la carpeta `backend`):

    ```bash
    # Método recomendado (estable):
    yarn build && node dist/index.js

    # Alternativa (actualmente inestable por problemas con ts-node):
    # yarn dev
    ```

    El backend se ejecutará en `http://localhost:3000` (o puerto configurado).

3.  **Inicia el frontend** (desde la carpeta `frontend`):
    ```bash
    yarn dev
    ```
    El frontend se ejecutará en `http://localhost:5173`.

Accede a la aplicación vía `http://localhost:5173`.

## Contribuciones 🤝

¡Las contribuciones son bienvenidas! Por favor, sigue los procedimientos estándar de fork, branch, commit y Pull Request. Detalla tus cambios claramente en la descripción del PR.

1.  Haz un Fork del repositorio.
2.  Crea una rama para tu feature/fix.
3.  Haz commit de tus cambios.
4.  Haz push a tu fork.
5.  Abre un Pull Request hacia la rama `main` de este repositorio.

## Licencia 📜

Este proyecto está licenciado bajo los términos de la **GNU Affero General Public License v3.0 (AGPL-3.0)**.

Puedes encontrar el texto completo de la licencia en el archivo [`LICENSE`](LICENSE) en la raíz de este repositorio. La AGPL v3 promueve la colaboración requiriendo que las modificaciones accesibles por red también sean de código abierto.

Copyright (c) 2024-2025 Olivier Hottelet

## Contacto 📧

- **Olivier Hottelet**
- olivierhottelet1980@gmail.com
