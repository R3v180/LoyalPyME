# LoyalPyME 🇪🇸 (v1.16.0)

**LoyalPyME** es una plataforma web integral y modular (Frontend React + Backend Node.js) diseñada para Pequeñas y Medianas Empresas (PyMEs). La plataforma se compone de diferentes módulos que pueden ser activados por negocio:

- **LoyalPyME Core:** Un sistema robusto para la gestión de programas de fidelización de clientes digitales (puntos, niveles, recompensas personalizadas, códigos QR para acumulación, panel de cliente, etc.).
- **LoyalPyME Camarero (En Desarrollo Activo):** Un módulo avanzado enfocado en la digitalización y optimización del servicio en el sector hostelero. Actualmente incluye gestión de carta digital por el administrador, visualización de carta por el cliente final, y el inicio del flujo de toma de comandas por el cliente. Próximamente incluirá envío a pantallas de cocina/barra (KDS), gestión de mesas e interfaz para camareros.

La plataforma está diseñada para ser mantenible, escalable y adaptable a las necesidades específicas de cada negocio.

## Visión y Propósito ✨

LoyalPyME busca ser el aliado tecnológico de las PyMEs, proporcionando herramientas digitales integradas para potenciar su crecimiento y eficiencia.
Con **LoyalPyME Core**, las empresas pueden fomentar la lealtad y recurrencia de sus clientes, construyendo relaciones más sólidas y duraderas.
Con el módulo **LoyalPyME Camarero**, los negocios de hostelería podrán modernizar su operativa, reducir errores, agilizar el servicio, mejorar significativamente la experiencia del cliente final y obtener datos valiosos para la gestión.
La plataforma es versátil, con aplicaciones en retail, servicios diversos (para LoyalPyME Core) y un fuerte enfoque en hostelería (para LoyalPyME Camarero).

_(Consulta [PROJECT_STATUS.md](./PROJECT_STATUS.md) para ver el estado detallado, las decisiones de diseño clave y los hitos completados. Para la hoja de ruta y el backlog de funcionalidades, revisa [DEVELOPMENT_PLAN.md](./DEVELOPMENT_PLAN.md))._

|                                   Panel de Admin (Escritorio)                                   |                                      Panel de Admin (Móvil)                                      |
| :---------------------------------------------------------------------------------------------: | :----------------------------------------------------------------------------------------------: |
| <img src="images/SC_LoyalPyME.png" alt="Panel Admin LoyalPyME - Vista Escritorio" width="100%"> | <img src="images/SC_LoyalPyME_PHONE.png" alt="Panel Admin LoyalPyME - Vista Móvil" width="100%"> |

_(Nota: Las capturas de pantalla podrían no reflejar las últimas funcionalidades o la interfaz del panel Super Admin. Se actualizarán progresivamente)._

## Características Principales Implementadas ✅

**Plataforma Base y Gestión Multi-Módulo:**

- **Panel Super Admin:** Interfaz para la administración global de negocios clientes registrados en la plataforma.
- **Gestión de Módulos por Negocio:** Capacidad para activar o desactivar módulos específicos (como LoyalPyME Core o LoyalPyME Camarero) para cada negocio cliente.
- **Control de Acceso Basado en Módulos:** La funcionalidad disponible para cada administrador de negocio y sus clientes/empleados depende de los módulos que tengan activos.

**LoyalPyME Core (Módulo de Fidelización - Funcional):**

- **Autenticación Completa:** Registro de Negocios y su primer Administrador, Registro de Clientes Finales, Login seguro con JWT, Funcionalidad de Reseteo de Contraseña.
- **Gestión de Clientes (Admin LCo):** Listado avanzado con búsqueda, filtros y ordenación. CRUD de clientes, incluyendo la capacidad de añadir notas internas, ajustar puntos manualmente, cambiar nivel, activar/desactivar y marcar como favoritos. Acciones masivas sobre clientes.
- **Gestión de Niveles/Tiers (Admin LCo):** Creación, edición y eliminación de niveles de fidelización. Definición de beneficios específicos por nivel. Configuración global del sistema de tiers (base de cálculo, política de descenso, periodos de inactividad).
- **Gestión de Recompensas (Admin LCo):** CRUD completo para recompensas canjeables por puntos. Incluye subida y recorte de imágenes (1:1, Cloudinary) para cada recompensa. Soporte multi-idioma (ES/EN) para nombre y descripción de recompensas.
- **Flujo de Puntos y QR (LCo):** Generación de códigos QR únicos por parte del Admin para que los clientes sumen puntos (asociados a un importe de venta y número de ticket). Validación de QR por el Cliente Final a través de introducción manual o escaneo con la cámara del móvil (usando `html5-qrcode`).
- **Lógica de Tiers Automática (LCo):** Sistema backend (con tarea programada/Cron Job) que calcula y actualiza automáticamente el nivel de los clientes basado en la configuración del negocio (gasto, visitas, puntos) y las políticas de descenso.
- **Panel de Cliente (LCo):** Interfaz para el cliente final con múltiples pestañas:
  - **Resumen:** Información clave, puntos, nivel actual, barra de progreso hacia el siguiente nivel (con previsualización de beneficios), resumen de regalos/recompensas disponibles, y sección para validar QR.
  - **Recompensas:** Listado completo de recompensas disponibles para canjear con puntos y regalos otorgados, con imágenes y opción de canje.
  - **Actividad:** Historial paginado de todas las transacciones de puntos (ganados, gastados) y canjes de regalos.
- **Otros (Plataforma y LCo):**
  - Internacionalización (i18n) completa del frontend (ES/EN).
  - Documentación de la API Backend generada con Swagger y accesible vía `/api-docs`.
  - Logo estático y diseño de cabecera restringido para una imagen de marca consistente.

**Módulo LoyalPyME Camarero (En Desarrollo Activo - Funcionalidades Clave del Cliente):**

- **Base de Datos:** Modelos Prisma definidos para Mesas (con QR y estado), Carta Digital (Categorías, Ítems con i18n, precio, imagen, alérgenos, tags, disponibilidad, etc.), Modificadores (Grupos y Opciones con ajuste de precio, tipo de UI, reglas de selección), Pedidos (con estado, ítems, cliente/camarero opcional, total calculado), y Personal (con roles y PINs).
- **API Backend (Admin Negocio - Gestión Carta):** Endpoints CRUD implementados para la gestión de Categorías del Menú, Ítems del Menú y sus Modificadores. Protegidos y condicionados a la activación del módulo.
- **UI Frontend (Admin Negocio - Gestión Carta):** Interfaz completa para gestionar la carta digital (CRUD para categorías, ítems con detalles y recorte de imagen, grupos de modificadores y sus opciones).
- ⭐ **Visualización de Carta por Cliente Final (Backend y Frontend):**
  - API pública (`/public/menu/business/:slug`) para obtener la carta activa y disponible.
  - Página pública (`/m/:slug`) responsive que muestra la carta, incluyendo categorías (acordeón), ítems con detalles (imagen, precio, i18n) y sus modificadores de forma informativa.
- ⭐ **Flujo de Pedido por Cliente Final (Backend y Frontend - MVP Inicial):**
  - API pública (`POST /public/order/:slug`) para la creación de pedidos, con validación de ítems, modificadores, reglas de selección y cálculo de precios. Creación transaccional en BD.
  - Frontend permite al cliente seleccionar cantidad, personalizar ítems con modificadores (RADIO/CHECKBOX), ver precio dinámico y añadir a un carrito local preliminar.

## Estado Actual y Próximos Pasos 🗺️

La plataforma ha completado la **Fase 1 (Núcleo Funcional de LoyalPyME Core)**, la **implementación base de la arquitectura multi-módulo con el Panel Super Admin**, la **UI de Gestión de Carta para Administradores del Módulo Camarero**, y un **progreso significativo en el flujo de cliente del Módulo Camarero (visualización de carta y MVP de toma de pedidos)**. La versión actual es **v1.16.0**.

- El enfoque principal de desarrollo para el Módulo Camarero se centrará ahora en:
  1.  Completar la UI del **Carrito de Pedido** del cliente final y la lógica de **envío de pedido** al backend.
  2.  Implementar el Sistema de Visualización en Cocina (**KDS**) básico.
  3.  Desarrollar la Interfaz de Camarero básica (MVP).
- Consulta **[PROJECT_STATUS.md](./PROJECT_STATUS.md)** para ver los **hitos completados en detalle** y las **decisiones de diseño clave**.
- Consulta **[DEVELOPMENT_PLAN.md](./DEVELOPMENT_PLAN.md)** para ver el **backlog completo** de tareas pendientes, la hoja de ruta detallada para el Módulo Camarero y las **ideas futuras**.

## Tecnologías Utilizadas 🛠️

**Frontend:** React, TypeScript, Vite, Mantine UI (v7+), Axios, React Router DOM (v6+), `html5-qrcode`, `react-image-crop`, `i18next` (para i18n), Zustand (o similar, considerado para gestión de estado global avanzada si es necesario).
**Backend:** Node.js, Express, TypeScript, Prisma ORM, PostgreSQL, JSON Web Tokens (JWT), bcryptjs (para hashing), Cloudinary (almacenamiento de imágenes), Multer (manejo de subidas), Vitest (testing unitario/integración), Supertest (testing API), Swagger (documentación API), `node-cron` (tareas programadas).

_(Una lista más detallada y continuamente actualizada se encuentra en [PROJECT_STATUS.md](./PROJECT_STATUS.md))._

## Inicio Rápido (Desarrollo Local) 🚀

1.  Clonar el repositorio.
2.  **Backend:**
    - `cd backend && yarn install`
    - Configurar el archivo `.env` completamente (copiar de `.env.example` y rellenar).
    - `npx prisma migrate reset` (Esto borrará y recreará la base de datos).
    - `npx prisma db seed` (Esto poblará la base de datos con un negocio demo, admin, cliente, y datos de ejemplo para LCo/LC, incluyendo una carta digital).
    - `npx ts-node ./scripts/create-superadmin.ts` (Esto creará el usuario Super Admin global).
    - Ejecutar en dos terminales:
      1.  `yarn dev:build` (o `npx tsc --watch`)
      2.  `yarn dev:run` (o `npx nodemon dist/index.js`)
3.  **Frontend:**
    - `cd ../frontend && yarn install`
    - Ejecutar: `yarn dev` (o `yarn dev --host` para acceso en red local).
4.  **Acceso a las Aplicaciones:**
    - **Cliente Final (Visualización de Carta):** `https://localhost:5173/m/restaurante-demo-loyalpyme` (o el slug de tu negocio demo).
    - **Cliente Final (Dashboard LCo) / Admin de Negocio:** `https://localhost:5173`
      - Login Negocio Demo (LCo & LC): `admin@demo.com` / `password`
      - Login Cliente Demo (LCo): `cliente@demo.com` / `password`
    - **Panel Super Admin:** `https://localhost:5173/superadmin`
      - Login: `superadmin@loyalpyme.com` / `superadminpassword` (o las credenciales configuradas en el script).
    - **Documentación API:** `http://localhost:3000/api-docs`

**¡Importante!** Consulta la **[SETUP_GUIDE.md](./SETUP_GUIDE.md)** para obtener instrucciones **completas y detalladas** sobre la instalación, configuración y ejecución. Para problemas comunes, revisa la [TROUBLESHOOTING_GUIDE.md](./TROUBLESHOOTING_GUIDE.md).

---

## Contribuciones 🤝

Este proyecto es software propietario. Si tienes informes de errores o sugerencias, pueden hacerse a través de los Issues de GitHub (si el repositorio permite issues siendo privado).

## Licencia 📜

Este proyecto es software propietario.
Copyright (c) 2024-2025 Olivier Hottelet. Todos los derechos reservados.

Consulta el archivo [LICENSE.md](./LICENSE.MD) en el directorio raíz para más detalles.

## Contacto 📧

- **Olivier Hottelet**
- olivierhottelet1980@gmail.com
