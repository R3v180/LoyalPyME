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

<div style="display: flex; justify-content: center; align-items: flex-start; gap: 15px;">
  <img src="images/SC_LoyalPyME.png" alt="Panel Admin LoyalPyME - Vista Escritorio" style="width: 55%; max-width: 450px; height: auto;">
  <img src="images/SC_LoyalPyME_PHONE.png" alt="Panel Admin LoyalPyME - Vista Móvil" style="width: 35%; max-width: 220px; height: auto;">
</div>
_(Nota: La captura de pantalla podría necesitar actualizarse para reflejar la interfaz más reciente)_

## Estado del Proyecto y Hoja de Ruta 🗺️

El desarrollo de LoyalPyME sigue un enfoque por fases, asegurando una base sólida antes de expandir la funcionalidad.

---

### ✅ Fase 1: Núcleo Operativo y Refactorización (Completada)

La fase fundacional, centrada en construir el motor de fidelización principal y llevar a cabo una refactorización significativa para la mantenibilidad y escalabilidad, está completada.

**Logros Clave:**

- **Plataforma Web Full-Stack:** Frontend (React/TS/Mantine) y Backend (Node/Express/TS/Prisma/PostgreSQL) operativos.
- **Refactorización Mayor:** Refactorizado con éxito tanto el frontend (hooks, componentes) como el backend (servicios, controladores por módulo) para mejorar la estructura y separación de responsabilidades.
- **Autenticación Segura:** Sistema basado en JWT con registro (Admin/Cliente), login, recuperación de contraseña y control de acceso basado en roles (`BUSINESS_ADMIN`, `CUSTOMER_FINAL`).
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
  - Reforzar **Gestión de Configuración** (`.env` validation).
  - (Opcional) Implementar **Rate Limiting** básico.
  - (Opcional) Introducir **Registro de Auditoría (`AuditLog`)** básico.
- 💡 **Mejoras Experiencia Admin (Frontend):**
  - Enriquecer **Panel Principal Admin** (Métricas Clave, Feed Actividad).
  - Implementar **Búsqueda/Filtros de Clientes Avanzados** (Teléfono, Documento, Nivel).
  - Mejorar **Modal de Detalles del Cliente** (ej: acciones rápidas).
  - Añadir **Exportación CSV** básica para lista de clientes.
  - Mostrar **Estadísticas de Uso** de Recompensas y Niveles.
  - Añadir más **descripciones/ayudas** en Configuración de Niveles.
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
2.  `yarn install`

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
    # Usa --host para probar en móvil vía IP local
    yarn dev --host
    ```
    _(Frontend corre en puerto 5173. Mira URL `Network:` en consola para acceso móvil - requiere firewall abierto en PC para 5173 y 3000)._

Accede vía `http://localhost:5173` (PC) o la URL `Network:` (Móvil). Usa credenciales del paso "Datos Iniciales".

## Contribuciones 🤝

¡Contribuciones bienvenidas! Flujo: Fork -> Branch -> Commit -> Push -> Pull Request.

## Licencia 📜

Licencia: **GNU Affero General Public License v3.0 (AGPL-3.0)**. Ver [`LICENSE`](LICENSE).

Copyright (c) 2024-2025 Olivier Hottelet

## Contacto 📧

- **Olivier Hottelet**
- olivierhottelet1980@gmail.com
