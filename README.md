# LoyalPyME

[![GitHub repo size](https://img.shields.io/github/repo-size/R3v180/LoyalPyME?style=flat-square)](https://github.com/R3v180/LoyalPyME)
[![GitHub contributors](https://img.shields.io/github/contributors/R3v180/LoyalPyME?style=flat-square)](https://github.com/R3v180/LoyalPyME/graphs/contributors)
[![GitHub last commit](https://img.shields.io/github/last-commit/R3v180/LoyalPyME?style=flat-square)](https://github.com/R3v180/LoyalPyME/commits/main)
[![GitHub issues](https://img.shields.io/github/issues/R3v180/LoyalPyME?style=flat-square)](https://github.com/R3v180/LoyalPyME/issues)
[![GitHub pull requests](https://img.shields.io/github/issues-pr/R3v180/LoyalPyME?style=flat-square)](https://github.com/R3v180/LoyalPyME/pulls)
[![License: AGPL v3](https://img.shields.io/badge/License-AGPL%20v3-blue.svg?style=flat-square)](https://www.gnu.org/licenses/agpl-3.0)

**LoyalPyME** es una plataforma web integral diseñada para empoderar a Pequeñas y Medianas Empresas (PyMEs) con un programa de fidelización de clientes digital, potente y fácil de gestionar.

## Visión y Propósito

En un mercado competitivo, la lealtad del cliente es un activo invaluable. LoyalPyME nace para proporcionar a las PyMEs las herramientas necesarias para:

*   **Fomentar la Repetición de Compra:** Implementando sistemas de puntos, niveles y recompensas atractivas.
*   **Construir Relaciones Sólidas:** Reconociendo y premiando la lealtad de sus clientes.
*   **Simplificar la Gestión:** Ofreciendo un panel de administración intuitivo y eficiente.
*   **Mejorar la Experiencia del Cliente:** Proporcionando un portal digital accesible y transparente.

Nuestro objetivo es ser el aliado tecnológico que permita a cualquier PyME, independientemente de su sector (retail, hostelería, servicios, etc.), digitalizar y optimizar su estrategia de retención de clientes, sentando las bases para el crecimiento a largo plazo.

## Fases de Evolución Funcional

El desarrollo de LoyalPyME sigue una hoja de ruta por fases, priorizando la entrega de un núcleo de fidelización funcional y escalando hacia capacidades avanzadas y comunitarias.

**Fase 1: Núcleo de Fidelización Web (Operativa Principalmente)**
*   **Gestión de Recompensas:** Creación, edición, eliminación y gestión del estado (activo/inactivo) de recompensas canjeables por puntos. **(Funcional)**
*   **Sistema de Puntos Transaccional:** Generación de códigos QR únicos por transacción (importe, ticket) para asignación de puntos. **(Funcional)** Validación de códigos QR por el cliente final a través de su portal web para sumar puntos. **(Funcional)**
*   **Sistema de Niveles (Tiers):** Definición de niveles con umbrales (puntos, gasto, visitas) y gestión de beneficios por nivel. Configuración de la lógica de cálculo y descenso de nivel. **(Funcional)**
*   **Panel Cliente Esencial:** Visualización del perfil de usuario (puntos, nivel) e historial de transacciones. Visualización de recompensas disponibles y regalos asignados directamente por el negocio. Canjeo de ambas categorías. **(Funcional)**
*   **Gestión de Clientes (Admin):** Listado de clientes registrados en el negocio, con datos clave (puntos, nivel, fecha registro, estado). Ajuste manual de puntos, cambio manual de nivel, asignación de recompensas como regalo, y marcar/desmarcar como "Favorito" para clientes individuales. **(Funcional)**
*   *Próximo en Fase 1:* Implementación completa de filtros (ej: Favoritos, Activos), búsqueda por nombre/email y paginación real en la gestión de clientes Admin. Desarrollo del modal "Ver Detalles" de cliente (posiblemente incluyendo notas internas para Admin). Acción Activar/Desactivar cliente.

**Fases Futuras (Hacia un Ecosistema Completo):**
*   **Fase 2 (Expansión Web):** Reglas de puntos y recompensas más complejas, herramientas básicas de comunicación directa (email, publicaciones en portal), segmentación avanzada de clientes, acciones masivas en panel Admin.
*   **Fase 3 (Plataforma Móvil):** Aplicaciones nativas para clientes y personal, notificaciones push, check-in basado en localización, tarjeta de fidelización digital en app.
*   **Fase 4 (Inteligencia y CRM Ligero):** Módulos de análisis e informes sobre comportamiento y valor del cliente, funcionalidades de CRM ligero (notas, historial completo), automatización de marketing.
*   **Fase 5 (Ecosistemas Conectados y Potencial Social):** Programas de fidelización compartidos entre grupos de negocios, módulo de eventos, chat Cliente-Negocio y potencial chat comunitario/social (ej: mapa de actividad anónima en sectores específicos como el ocio nocturno), expansión a otros sectores y geografías.

## Tecnologías Utilizadas

**Frontend:**
*   React & TypeScript
*   Vite
*   Mantine UI (v7+)
*   Axios
*   React Router DOM (v6+)
*   qrcode.react, react-qr-reader
*   Zod, Mantine Form, @mantine/notifications

**Backend:**
*   Node.js, Express, TypeScript
*   Prisma, PostgreSQL
*   JWT para autenticación
*   bcryptjs
*   dotenv
*   node-cron (para tareas programadas, ej. cálculo de tiers)
*   uuid, date-fns
*   cors

## Instalación y Configuración Local

Para poner el proyecto en marcha en tu entorno de desarrollo:

### Prerrequisitos
*   Node.js (v18+ recomendado)
*   yarn
*   Servidor de base de datos PostgreSQL accesible

### Configuración del Backend
1.  Clona el repositorio y navega a la carpeta `backend`:
    ```bash
    git clone https://github.com/R3v180/LoyalPyME.git
    cd LoyalPyME/backend
    ```
2.  Instala las dependencias:
    ```bash
    yarn install
    ```
3.  Crea un archivo `.env` en la raíz de la carpeta `backend/` con las siguientes variables:
    ```env
    DATABASE_URL="postgresql://tu_usuario:tu_contraseña@host:puerto/tu_base_de_datos?schema=public"
    JWT_SECRET="una_cadena_larga_y_segura_aleatoria"
    # Otras variables si son necesarias
    ```
4.  Ejecuta las migraciones de Prisma para preparar la base de datos:
    ```bash
    npx prisma migrate dev
    ```
5.  (Opcional) Puedes generar un usuario de prueba cliente ejecutando el script:
    ```bash
    npx ts-node scripts/hash-customer-password.ts
    ```
    *(Edita `scripts/hash-customer-password.ts` antes de ejecutarlo para configurar el email y contraseña deseados).*

### Configuración del Frontend
1.  Navega a la carpeta `frontend`:
    ```bash
    cd ../frontend
    ```
2.  Instala las dependencias:
    ```bash
    yarn install
    ```

## Ejecutar el Proyecto

1.  Asegúrate de que tu servidor PostgreSQL está corriendo.
2.  Inicia el backend desde la carpeta `backend` (en una terminal):
    ```bash
    # Para desarrollo con hot-reloading (puede ser inestable):
    yarn dev
    # O para una ejecución más robusta después de construir:
    yarn build && node dist/index.js
    ```
    El backend se ejecutará en `http://localhost:3000`.
3.  Inicia el frontend desde la carpeta `frontend` (en otra terminal):
    ```bash
    yarn dev
    ```
    El frontend se ejecutará en `http://localhost:5173`.

Accede a la aplicación a través de `http://localhost:5173` en tu navegador.

## Contribuciones

¡Agradecemos y alentamos las contribuciones a LoyalPyME! Si encuentras un bug, tienes una idea para una nueva funcionalidad, o quieres mejorar el código, por favor:

1.  Haz un "Fork" de este repositorio.
2.  Clona tu fork localmente.
3.  Crea una rama nueva para tu trabajo (`git checkout -b feature/nombre-funcionalidad` o `fix/descripcion-bug`).
4.  Realiza tus cambios y asegúrate de que pasen las comprobaciones de linting (si hay).
5.  Escribe mensajes de commit claros y descriptivos.
6.  Empuja tu rama a tu fork en GitHub.
7.  Abre un Pull Request (PR) hacia la rama `main` de este repositorio.
8.  Describe detalladamente los cambios propuestos en el PR.

## Licencia

Este proyecto está licenciado bajo los términos de la **Licencia Pública General Affero de GNU v3.0 (AGPL-3.0)**.

Puedes encontrar el texto completo de la licencia en el archivo [`LICENSE`](LICENSE) en la raíz de este repositorio.

La AGPL v3 es una licencia copyleft que garantiza que el código fuente del software, incluyendo cualquier modificación, esté disponible para los usuarios, especialmente cuando el software se utiliza para ofrecer un servicio a través de una red. Esto fomenta la colaboración y asegura que las mejoras realizadas permanezcan en el ecosistema del proyecto.

Copyright (c) 2024 Olivier Hottelet

## Contacto

Para cualquier pregunta o consulta sobre el proyecto, puedes contactar a:

*   **Olivier Hottelet**
*   [Opcional: Añade aquí tu email de contacto público o perfil de LinkedIn si lo deseas]

---
