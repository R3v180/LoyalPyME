# LoyalPyME 🇪🇸 (v1.21.0)

**LoyalPyME** es una plataforma web integral y modular, desarrollada con un stack **Frontend React (TypeScript, Mantine UI, Vite)** y **Backend Node.js (TypeScript, Express, Prisma, PostgreSQL)**, diseñada específicamente para Pequeñas y Medianas Empresas (PyMEs). La plataforma se estructura en módulos activables individualmente por cada negocio cliente, permitiendo una solución a medida y adaptada a sus necesidades operativas y de marketing.

- ⭐ **LoyalPyME Core (LCo) - Módulo de Fidelización [Estable y Funcional]:**
  Un sistema robusto y completo para la gestión de programas de lealtad digitales.

  - **Gestión de Clientes:** Administración detallada de clientes, incluyendo su historial de puntos, nivel de fidelización, y actividad.
  - **Sistema de Puntos:** Configuración de ratio de puntos por gasto, generación de QR para acumulación en punto de venta físico.
  - **Niveles de Fidelización (Tiers):** Creación de múltiples niveles con umbrales personalizables (basados en gasto, visitas, o puntos acumulados) y asignación de beneficios exclusivos por nivel (ej. multiplicadores de puntos, acceso a recompensas especiales).
  - **Catálogo de Recompensas:** Gestión de un catálogo de recompensas canjeables por puntos, con soporte completo para internacionalización (nombres y descripciones en ES/EN) e imágenes individuales por recompensa.
  - **Panel de Cliente Interactivo:** Un dashboard personalizado para que los clientes finales consulten su saldo de puntos, nivel actual y progreso hacia el siguiente, visualicen las recompensas disponibles y regalos asignados, canjeen beneficios, y revisen su historial completo de transacciones de fidelización.

- 🚀 **LoyalPyME Camarero (LC) - Módulo de Hostelería [Ciclo Completo de Pedido y Servicio Validado]:**
  Un módulo avanzado enfocado en la digitalización y optimización integral del servicio en el sector hostelero (restaurantes, bares, cafeterías), mejorando la eficiencia operativa y la experiencia del cliente.
  - **Funcionalidad Actual Clave:**
    1.  **Gestión de Carta Digital por el Administrador:** Interfaz administrativa completa y detallada (`/admin/dashboard/camarero/menu-editor`) para crear, editar y organizar:
        - **Categorías del Menú:** Con nombre (ES/EN), descripción (ES/EN), imagen (con recorte), posición y estado de activación.
        - **Ítems del Menú:** Dentro de cada categoría, con nombre (ES/EN), descripción (ES/EN), precio, imagen (con recorte), listado de alérgenos, etiquetas (ej. "Vegano", "Popular"), disponibilidad, posición, tiempo de preparación estimado, calorías, SKU y destino KDS.
        - **Grupos de Modificadores:** Asociados a cada ítem, con nombre (ES/EN), tipo de interfaz de usuario (`RADIO` para selección única, `CHECKBOX` para múltiple), y reglas de selección (mínimo/máximo, obligatorio).
        - **Opciones de Modificador:** Dentro de cada grupo, con nombre (ES/EN) y ajuste de precio.
    2.  **Visualización de Carta Pública por el Cliente Final:** Acceso mediante URL directa (`/m/:businessSlug/:tableIdentifier?`). Los clientes pueden:
        - Navegar por categorías y ver detalles de cada ítem.
        - Personalizar ítems seleccionando opciones de los modificadores, con el precio actualizándose dinámicamente.
    3.  **Flujo de Pedido Completo por el Cliente Final:**
        - **Carrito de Compra Local:** Los ítems configurados se añaden a un carrito que persiste en el `localStorage`.
        - **Modal de Carrito (`ShoppingCartModal.tsx`):** Permite revisar el pedido, modificar cantidades, eliminar ítems y añadir notas generales.
        - **Envío y Adición a Pedido:** Al confirmar, el sistema envía un `CreateOrderPayloadDto` al backend, gestionando inteligentemente si se debe crear un pedido nuevo o añadir los ítems a uno ya existente.
        - **Procesamiento Backend:** Validación exhaustiva de disponibilidad, reglas y precios, con creación transaccional en la base de datos.
        - **Feedback al Cliente:** Notificación de éxito y redirección a la página de estado del pedido.
    4.  **Visualización del Estado del Pedido por el Cliente (`OrderStatusPage.tsx`):**
        - Muestra el estado general del pedido y de cada ítem (`En preparación`, `Listo`, `Servido`).
        - Se actualiza automáticamente mediante polling.
        - Permite al cliente **solicitar la cuenta** para iniciar el proceso de pago.
    5.  **Kitchen Display System (KDS) - Backend y Frontend (Funcional):**
        - **API KDS Backend:** Endpoints validados para obtener y actualizar el estado de los ítems de preparación.
        - **Interfaz KDS Frontend:** Permite al personal de cocina/barra visualizar los ítems por destino y cambiar su estado (`PENDING_KDS` -> `PREPARING` -> `READY`).
    6.  **Interfaz de Camarero y Ciclo de Pago Completo (Funcional):**
        - **Recogida y Entrega:** La interfaz de camarero (`WaiterPickupPage.tsx`) muestra los ítems listos para recoger, permitiendo marcarlos como servidos.
        - **Gestión de Pago:** La interfaz de gestión (`WaiterOrderManagementPage.tsx`) muestra los pedidos pendientes de pago, permitiendo al camarero marcarlos como `PAID`.
        - **Automatización:** Al marcar como pagado, el sistema libera la mesa y asigna puntos de fidelidad LCo al cliente de forma automática.

La plataforma LoyalPyME está diseñada con un enfoque en la **mantenibilidad**, **escalabilidad** y **adaptabilidad**, buscando ser el socio tecnológico que impulse la eficiencia operativa y el crecimiento sostenible de las PyMEs.

## Visión y Propósito ✨

LoyalPyME aspira a ser el **aliado tecnológico integral de las Pequeñas y Medianas Empresas (PyMEs)**, proporcionando herramientas digitales sofisticadas pero intuitivas y fáciles de usar, integradas en una única plataforma modular que se adapta a las necesidades específicas de cada negocio.

Con **LoyalPyME Core (LCo)**, buscamos empoderar a las empresas para que puedan cultivar relaciones más profundas, significativas y duraderas con sus clientes. El objetivo es fomentar la lealtad y la recurrencia a través de programas de recompensas personalizados, comunicación efectiva y una experiencia de cliente gratificante que los haga sentir valorados.

Con el módulo **LoyalPyME Camarero (LC)**, nuestra visión es transformar y modernizar la operativa en el sector de la hostelería. Queremos que los negocios puedan:

- **Modernizar su servicio:** Ofreciendo una experiencia de pedido digital ágil y sin fricciones directamente desde la mesa del cliente.
- **Reducir errores manuales:** Minimizando las imprecisiones en la toma de comandas y la comunicación con cocina/barra.
- **Agilizar la comunicación interna:** Optimizando el flujo de información entre el personal de sala, la cocina y la barra a través del KDS y la interfaz de camarero.
- **Mejorar significativamente la experiencia del cliente final:** Permitiéndole explorar la carta a su ritmo, personalizar sus pedidos con total control y transparencia, y seguir el estado de su comanda en tiempo real.
- **Obtener datos operativos valiosos:** Recopilando información sobre ventas, popularidad de ítems, y tiempos de preparación para la toma de decisiones estratégicas y la optimización continua del negocio.

La plataforma es inherentemente versátil: **LoyalPyME Core** es aplicable a una amplia gama de sectores empresariales (retail, servicios profesionales, bienestar, etc.) que busquen implementar programas de fidelización. Por su parte, **LoyalPyME Camarero** ofrece una solución especializada, potente y adaptada a las particularidades del sector de la restauración, desde pequeñas cafeterías hasta restaurantes con mayor volumen de operaciones. La sinergia entre ambos módulos permite una experiencia de cliente altamente integrada y datos de negocio enriquecidos.

_(Para un análisis exhaustivo del estado actual del proyecto, incluyendo la versión actual, los hitos completados en detalle, las decisiones de diseño clave y las lecciones aprendidas, consulta nuestro [**PROJECT_STATUS.md**](./PROJECT_STATUS.md). La hoja de ruta completa, el backlog de funcionalidades futuras para ambos módulos, y la visión a largo plazo se encuentran detallados en [**DEVELOPMENT_PLAN.md**](./DEVELOPMENT_PLAN.md))._

## Características Principales Implementadas ✅

**Plataforma Base y Gestión Multi-Módulo:**

- **Panel Super Admin:** Interfaz dedicada (`/superadmin`) para el rol `SUPER_ADMIN`, permitiendo la administración global de los negocios clientes registrados. Funcionalidades: listar negocios, ver su estado general (`isActive`), y **activar/desactivar individualmente los módulos LoyalPyME Core (`isLoyaltyCoreActive`) y LoyalPyME Camarero (`isCamareroActive`)** para cada negocio.
- **Gestión de Módulos por Negocio:** La funcionalidad de cada módulo (LCo, LC) se habilita o deshabilita a nivel de la entidad `Business` en la base de datos. El perfil de usuario (`/api/profile`) que se obtiene tras el login incluye estos flags de activación para el negocio asociado, permitiendo al frontend adaptar la UI dinámicamente.
- **Control de Acceso Basado en Módulos y Roles (RBAC + MBAC):**
  - **RBAC (Role-Based Access Control):** El acceso a las funcionalidades (APIs backend y componentes UI frontend) está condicionado por el rol del usuario (`SUPER_ADMIN`, `BUSINESS_ADMIN`, `CUSTOMER_FINAL`, `KITCHEN_STAFF`, `BAR_STAFF`, y futuro `WAITER`).
  - **MBAC (Module-Based Access Control):** Un middleware backend (`checkModuleActive`) y lógica en frontend verifican que el módulo requerido esté activo para el negocio del usuario antes de permitir el acceso a funcionalidades específicas de dicho módulo.

**LoyalPyME Core (LCo) - Módulo de Fidelización [Estable y Funcional]:**

- **Autenticación Completa y Segura:**
  - Registro de Negocios con su primer `BUSINESS_ADMIN`.
  - Registro de `CUSTOMER_FINAL` asociados a un negocio específico.
  - Login robusto con email/contraseña, utilizando JWT para la gestión de sesiones.
  - Funcionalidad completa de Reseteo de Contraseña.
- **Gestión Avanzada de Clientes (Panel Admin LCo):**
  - Listado paginado con búsqueda por nombre/email, filtros y ordenación.
  - Funcionalidades CRUD para clientes, incluyendo: notas internas, ajuste manual de puntos, cambio manual de nivel, asignación de regalos, activación/desactivación y marcado como favoritos.
  - Acciones Masivas sobre clientes seleccionados: activar/desactivar, eliminar y ajustar puntos.
- **Sistema de Niveles/Tiers Dinámico y Configurable (Panel Admin LCo):**
  - CRUD completo para niveles de fidelización y sus beneficios asociados.
  - Configuración global del sistema de tiers: base de cálculo, periodo y políticas de descenso.
- **Gestión Integral de Recompensas (Panel Admin LCo):**
  - CRUD completo para recompensas canjeables por puntos, con soporte i18n y subida de imágenes.
- **Flujo de Acumulación de Puntos y QR (LCo):**
  - Generación de QR únicos y temporales por parte del administrador.
  - Validación de QR por parte del cliente mediante escaneo con la cámara o introducción manual.
- **Lógica de Tiers y Actualización Automática (LCo - Backend):** Tarea programada (Cron Job) para recalcular y actualizar el nivel de los clientes.
- **Panel de Cliente Completo (LCo - Frontend - `CustomerDashboardPage.tsx`):**
  - Interfaz organizada en pestañas:
    - **Resumen (`SummaryTab.tsx`):** Información clave, barra de progreso al siguiente nivel, y sección para validar QR.
    - **Recompensas (`RewardsTab.tsx`):** Listado de recompensas canjeables y regalos pendientes.
    - **Actividad (`ActivityTab.tsx`):** Historial paginado de todas las transacciones de puntos.

**Módulo LoyalPyME Camarero (LC) [Ciclo de Pedido Completo Validado]:**

- **Modelo de Datos Robusto para Hostelería (Backend - Prisma):**
  - Definición detallada de entidades como `MenuCategory`, `MenuItem`, `ModifierGroup`, `Order`, `OrderItem`, `Table`, `StaffPin`.
- **API de Gestión de Carta por el Administrador (Backend):**
  - Endpoints CRUD completos y protegidos para gestionar toda la carta digital.
- **Interfaz de Usuario para Gestión de Carta (Admin Frontend):**
  - Componentes dedicados para un CRUD intuitivo de la estructura de la carta, incluyendo subida y recorte de imágenes.
- **Visualización de Carta Pública y Flujo de Pedido por Cliente Final:**
  - **Frontend:** Página responsive para visualización y personalización de ítems con precios dinámicos.
  - **Carrito de Compra Local:** Con persistencia en `localStorage` y funcionalidades de edición.
  - **Envío y Adición de Ítems:** El sistema gestiona inteligentemente si crear un nuevo pedido o añadir ítems a uno ya existente.
- **Visualización del Estado del Pedido por el Cliente:**
  - Página con polling automático que muestra el estado del `Order` y de cada `OrderItem`.
  - Incluye la funcionalidad para "Pedir la Cuenta".
- **Kitchen Display System (KDS) - Backend y Frontend:**
  - **API KDS:** Endpoints validados para obtener y actualizar el estado de los ítems de preparación.
  - **Interfaz KDS:** Permite al personal de cocina/barra visualizar los ítems y cambiar su estado de preparación.
- **Ciclo de Servicio y Pago Completo (Camarero):**
  - **Recogida:** Interfaz para que el personal de sala vea los ítems listos y los marque como servidos.
  - **Pago:** Interfaz para ver los pedidos pendientes de pago y marcarlos como `PAID`.
  - **Automatización:** El marcado como pagado libera la mesa y asigna puntos LCo.

## Estado Actual y Próximos Pasos 🗺️

La plataforma ha alcanzado la **versión v1.21.0**.

- **LoyalPyME Core (LCo):** Estable, completamente funcional y probado.
- **Arquitectura Multi-Módulo y Panel Super Admin:** Implementada y operativa.
- **Módulo Camarero (LC):** El ciclo de vida completo de un pedido está **completo y validado.**

El **enfoque principal de desarrollo inmediato** es añadir funcionalidades avanzadas de gestión al Módulo Camarero (LC):

1.  ⭐ **LC - Dividir la Cuenta (Split Bill):**
    - **Objetivo:** Permitir al personal de sala dividir una cuenta entre múltiples clientes.

Posteriormente, se abordarán funcionalidades como la gestión de personal con PINs, mejoras en la interfaz del camarero (TPV), y un sistema de reservas.

- Consulta **[PROJECT_STATUS.md](./PROJECT_STATUS.md)** para un análisis detallado.
- Revisa **[DEVELOPMENT_PLAN.md](./DEVELOPMENT_PLAN.md)** para la hoja de ruta completa.

## Tecnologías Utilizadas 🛠️

**Frontend:**
React (v19+, Hooks, Context API), TypeScript, Vite (v5+, bundler y servidor de desarrollo HMR), Mantine UI (v7+, biblioteca de componentes y hooks), Axios (cliente HTTP), React Router DOM (v6+, para enrutamiento SPA), `html5-qrcode` (para escaneo de códigos QR por el cliente en LCo), `react-image-crop` (para recorte de imágenes en interfaces de administración), `i18next` y `react-i18next` (para internacionalización ES/EN con archivos JSON), `zod` (para validación de formularios, implementación progresiva).

**Backend:**
Node.js (runtime), Express.js (framework web), TypeScript (lenguaje principal), Prisma ORM (v6+, para acceso a base de datos PostgreSQL, gestión de migraciones y generación de cliente tipado), PostgreSQL (sistema de gestión de base deatos relacional), JSON Web Tokens (JWT) (para autenticación stateless), `bcryptjs` (para hashing seguro de contraseñas), Cloudinary SDK (para almacenamiento y gestión de imágenes en la nube), Multer (middleware para manejo de subidas de archivos `multipart/form-data`), Vitest (para testing unitario y de integración), Supertest (para testing de API HTTP), Swagger/OpenAPI (`swagger-jsdoc`, `swagger-ui-express`) (para documentación interactiva de la API RESTful), `node-cron` (para la ejecución de tareas programadas, ej. actualización de tiers en LCo).

## Inicio Rápido (Desarrollo Local) 🚀

1.  **Clonar el Repositorio:**
    ```bash
    git clone <URL_DEL_REPOSITORIO_GIT> LoyalPyME
    cd LoyalPyME
    ```
2.  **Configuración del Backend (`backend/`):**
    - Instalar dependencias: `yarn install` (o `npm install`).
    - Configurar Variables de Entorno: Copiar `backend/.env.example` a `backend/.env` y rellenar todas las variables.
    - Base de Datos (PostgreSQL debe estar corriendo):
      1.  Crear la base de datos (ej. `loyalpymedb`).
      2.  Desde `backend/`, ejecutar `npx prisma migrate reset`.
      3.  Ejecutar `npx prisma db seed` para poblar con datos de demostración.
      4.  Ejecutar `npx ts-node ./scripts/create-superadmin.ts` para crear el Super Administrador.
    - Ejecutar el Backend (desde `backend/`, en dos terminales separadas):
      1.  `yarn dev:build` (o `npx tsc --watch`): Compilación continua de TypeScript.
      2.  `yarn dev:run` (o `npx nodemon dist/index.js`): Iniciar servidor Node.js con Nodemon.
3.  **Configuración del Frontend (`frontend/`):**
    - Instalar dependencias: `yarn install` (o `npm install`).
    - Ejecutar el Frontend (desde `frontend/`): `yarn dev`.
4.  **Acceso a las Aplicaciones (URLs por defecto):**
    - **Carta Pública:** `https://localhost:5173/m/restaurante-demo-loyalpyme`
    - **Login / Dashboards:** `https://localhost:5173`
    - **Documentación API (Swagger):** `http://localhost:3000/api-docs`

**¡Importante!** Para instrucciones **exhaustivas y detalladas**, consulta la guía **[SETUP_GUIDE.md](./SETUP_GUIDE.md)**. Para soluciones a problemas comunes, revisa la **[TROUBLESHOOTING_GUIDE.md](./TROUBLESHOOTING_GUIDE.md)**.

---

## Contribuciones 🤝

Este proyecto es software propietario desarrollado por Olivier Hottelet. No se aceptan contribuciones externas directas en este momento. Si se detectan errores o se tienen sugerencias de mejora, pueden ser comunicadas al propietario. Si el repositorio fuera público y permitiera la creación de "Issues" en la plataforma de hosting de código (ej. GitHub, GitLab), esa sería la vía formal para reportar bugs o proponer nuevas funcionalidades.

## Licencia 📜

Este proyecto es software propietario.
**Copyright (c) 2024-2025 Olivier Hottelet. Todos los derechos reservados.**

El uso, copia, reproducción, distribución, modificación, descompilación, ingeniería inversa o cualquier otra forma de explotación de este software o su código fuente, en su totalidad o en parte, está estrictamente prohibido sin el permiso previo, explícito y por escrito del propietario de los derechos de autor. Este software se considera información confidencial y un secreto comercial.

Para más detalles sobre los términos de la licencia, consulta el archivo [LICENSE.md](./LICENSE.MD) en el directorio raíz del proyecto.

## Contacto 📧

Para consultas sobre el proyecto, licencias, adquisición, o cualquier otro asunto relacionado:

- **Olivier Hottelet**
- [olivierhottelet1980@gmail.com](mailto:olivierhottelet1980@gmail.com)
