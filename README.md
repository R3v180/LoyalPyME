# LoyalPyME 🇪🇸 (v1.17.0)

**LoyalPyME** es una plataforma web integral y modular, desarrollada con un stack **Frontend React (TypeScript, Mantine UI, Vite)** y **Backend Node.js (TypeScript, Express, Prisma, PostgreSQL)**, diseñada específicamente para Pequeñas y Medianas Empresas (PyMEs). La plataforma se estructura en módulos activables individualmente por cada negocio cliente, permitiendo una solución a medida:

- ⭐ **LoyalPyME Core (LCo) - Módulo de Fidelización [Estable y Funcional]:** Un sistema robusto y completo para la gestión de programas de lealtad digitales. Incluye gestión de clientes, puntos, niveles de fidelización (tiers) con beneficios personalizables, un catálogo de recompensas canjeables (con soporte i18n e imágenes), generación de códigos QR para la acumulación de puntos en el punto de venta, y un panel de cliente interactivo para visualizar su progreso, recompensas y actividad.

- 🚀 **LoyalPyME Camarero (LC) - Módulo de Hostelería [En Desarrollo Activo - MVP Pedido Cliente Completado]:** Un módulo avanzado enfocado en la digitalización y optimización integral del servicio en el sector hostelero (restaurantes, bares, cafeterías).
  - **Funcionalidad Actual Clave:**
    - **Gestión de Carta Digital por el Administrador:** Interfaz completa para crear y modificar categorías, ítems (con i18n, precios, imágenes, alérgenos, tags, tiempos de preparación, destino KDS, etc.) y sus grupos de modificadores con opciones personalizables.
    - **Visualización de Carta Pública por el Cliente Final:** Acceso mediante URL directa (`/m/:businessSlug/:tableIdentifier?`), idealmente a través de un QR en la mesa. Presenta la carta de forma interactiva y responsive.
    - **Flujo de Pedido Completo por el Cliente Final:** Los clientes pueden seleccionar ítems, personalizar con modificadores (con cálculo de precio dinámico), añadir a un carrito persistente (`localStorage`), revisar, añadir notas y enviar el pedido directamente desde su móvil. El backend valida y procesa estos pedidos, guardándolos en la base de datos.
  - **Próximos Hitos Fundamentales:** Implementación del KDS (Kitchen Display System) para cocina/barra, visualización del estado del pedido para el cliente, y la interfaz básica para camareros.

La plataforma LoyalPyME está diseñada con un enfoque en la **mantenibilidad, escalabilidad y adaptabilidad**, buscando ser el socio tecnológico que impulse la eficiencia y el crecimiento de las PyMEs.

## Visión y Propósito ✨

LoyalPyME aspira a ser el **aliado tecnológico integral de las PyMEs**, proporcionando herramientas digitales sofisticadas pero fáciles de usar, integradas en una única plataforma modular.

Con **LoyalPyME Core**, buscamos que las empresas puedan cultivar relaciones más profundas y duraderas con sus clientes, fomentando la lealtad y la recurrencia a través de programas de recompensas personalizados y una comunicación efectiva.

Con el módulo **LoyalPyME Camarero**, nuestra visión es revolucionar la operativa en hostelería. Queremos que los negocios puedan modernizar su servicio, reducir errores manuales, agilizar la comunicación entre sala, cocina y barra, mejorar significativamente la experiencia del cliente final (permitiéndole pedir a su ritmo y con total control), y obtener datos operativos valiosos para la toma de decisiones estratégicas.

La plataforma es versátil, con **LoyalPyME Core** aplicable a una amplia gama de negocios (retail, servicios) y **LoyalPyME Camarero** ofreciendo una solución especializada y potente para el sector de la restauración.

_(Para un análisis exhaustivo del estado actual del proyecto, decisiones de diseño clave, y los hitos completados en detalle, consulta nuestro [**PROJECT_STATUS.md**](./PROJECT_STATUS.md). La hoja de ruta completa, el backlog de funcionalidades y la visión a largo plazo se encuentran en [**DEVELOPMENT_PLAN.md**](./DEVELOPMENT_PLAN.md))._

_(Para entender en profundidad los flujos de usuario y las interacciones dentro de cada módulo y su combinación, por favor revisa:_

- _[LOYALPYME_CORE_WORKFLOW.md](./LOYALPYME_CORE_WORKFLOW.md)_
- _[LOYALPYME_CAMARERO_WORKFLOW.md](./LOYALPYME_CAMARERO_WORKFLOW.md)_
- _[MODULE_INTEGRATION_WORKFLOW.md](./MODULE_INTEGRATION_WORKFLOW.md))_

|                                                        Panel de Admin (Escritorio)                                                         |                                                          Panel de Admin (Móvil)                                                          |
| :----------------------------------------------------------------------------------------------------------------------------------------: | :--------------------------------------------------------------------------------------------------------------------------------------: |
| <img src="images/SC_LoyalPyME.png" alt="Captura de pantalla del Panel de Administración de LoyalPyME en vista de escritorio" width="100%"> | <img src="images/SC_LoyalPyME_PHONE.png" alt="Captura de pantalla del Panel de Administración de LoyalPyME en vista móvil" width="100%"> |

_(Nota: Las capturas de pantalla podrían no reflejar las últimas funcionalidades implementadas, como las del Módulo Camarero o la interfaz del Super Admin. Se actualizarán progresivamente a medida que la UI se estabilice)._

## Características Principales Implementadas ✅

**Plataforma Base y Gestión Multi-Módulo:**

- **Panel Super Admin:** Interfaz dedicada (`/superadmin`) para la administración global de los negocios clientes registrados en la plataforma. Permite al Super Administrador listar negocios, ver su estado y **activar o desactivar módulos específicos** (LoyalPyME Core, LoyalPyME Camarero) así como el estado general (`isActive`) para cada negocio.
- **Gestión de Módulos por Negocio:** La funcionalidad de cada módulo se habilita o deshabilita a nivel de `Business` mediante flags (`isLoyaltyCoreActive`, `isCamareroActive`). El perfil de usuario (`/api/profile`) incluye estas flags para que el frontend adapte la UI.
- **Control de Acceso Basado en Módulos y Roles:** El acceso a las funcionalidades (tanto APIs backend como componentes UI frontend) está condicionado por los módulos activos para el negocio del usuario y su rol (`SUPER_ADMIN`, `BUSINESS_ADMIN`, `CUSTOMER_FINAL`, y futuros roles de staff de LC).

**LoyalPyME Core (LCo) - Módulo de Fidelización [Estable y Funcional]:**

- **Autenticación Completa y Segura:** Registro de Negocios con su primer Administrador, Registro de Clientes Finales (asociados a un negocio), Login robusto con JWT (JSON Web Tokens), y funcionalidad completa de Reseteo de Contraseña.
- **Gestión Avanzada de Clientes (Admin LCo):** Listado paginado con búsqueda por nombre/email, filtros (estado, favorito, nivel) y ordenación. CRUD de clientes, incluyendo la capacidad de añadir notas internas, ajustar puntos manualmente (con motivo), cambiar el nivel de fidelización manualmente, activar/desactivar cuentas, y marcar clientes como favoritos. Implementadas acciones masivas (activar/desactivar, eliminar, ajustar puntos).
- **Sistema de Niveles/Tiers Dinámico (Admin LCo):** CRUD completo para niveles de fidelización. Definición de umbrales (`minValue`) y beneficios específicos por nivel (`TierBenefit`: multiplicador de puntos, acceso a recompensa exclusiva, beneficio personalizado). Configuración global del sistema de tiers (`TierCalculationBasis`: por gasto, visitas o puntos históricos; `TierCalculationPeriodMonths`; `TierDowngradePolicy`: nunca, revisión periódica, o por inactividad; `inactivityPeriodMonths`).
- **Gestión Integral de Recompensas (Admin LCo):** CRUD completo para recompensas canjeables por puntos. Incluye subida y recorte de imágenes (Cloudinary, aspecto 1:1) para cada recompensa. Soporte multi-idioma completo (ES/EN) para nombre y descripción de recompensas, gestionado a través de campos i18n en el backend (`name_es`, `name_en`, etc.).
- **Flujo de Acumulación de Puntos y QR (LCo):** Generación de códigos QR únicos (basados en token UUID) por parte del `BUSINESS_ADMIN` para que los clientes sumen puntos (asociados a un importe de venta y número de ticket/referencia). Validación de estos QR por el `CUSTOMER_FINAL` en su dashboard, ya sea mediante introducción manual del token o escaneo con la cámara del móvil (integración de `html5-qrcode`).
- **Lógica de Tiers y Actualización Automática (LCo - Backend):** Sistema backend (con tarea programada/Cron Job utilizando `node-cron`) que calcula y actualiza automáticamente el nivel de los clientes basado en la configuración del negocio y las políticas de descenso definidas.
- **Panel de Cliente Completo (LCo - Frontend):** Interfaz rica para el cliente final (`CustomerDashboardPage.tsx`) con múltiples pestañas:
  - **Resumen (`SummaryTab.tsx`):** Información clave (puntos, nivel actual), barra de progreso visual hacia el siguiente nivel con previsualización de beneficios (popover), resumen de regalos/recompensas disponibles con botones de canje directo, y la sección para validar QR. Tarjeta de acceso a la carta del Módulo Camarero si está activo para el negocio.
  - **Recompensas (`RewardsTab.tsx`):** Listado completo y visual (`RewardList.tsx`) de todas las recompensas activas disponibles para canjear con puntos, así como los regalos otorgados directamente por el administrador, con imágenes y opción de canje.
  - **Actividad (`ActivityTab.tsx`):** Historial paginado y detallado de todas las transacciones de puntos (ganados, gastados, ajustados por admin) y canjes de regalos, con descripciones claras y fechas.
- **Otros (Plataforma y LCo):**
  - Internacionalización (i18n) completa del frontend (ES/EN) mediante `i18next` y archivos de traducción JSON.
  - Documentación de la API Backend generada con Swagger/OpenAPI y accesible en el endpoint `/api-docs`.

**Módulo LoyalPyME Camarero (LC) [En Desarrollo Activo - MVP Pedido Cliente Completado]:**

- **Modelo de Datos Robusto para Hostelería (Backend - Prisma):**
  - `MenuCategory`, `MenuItem`, `ModifierGroup`, `ModifierOption`: Para una carta digital jerárquica y altamente personalizable, con soporte i18n, imágenes, precios, disponibilidad, alérgenos (enum `AllergenType`), tags (enum `MenuItemTag`), orden (`position`), tiempo de preparación, calorías, SKU, y destino KDS (`kdsDestination`).
  - `Order`, `OrderItem`, `OrderItemModifierOption`: Para registrar pedidos con detalle de ítems, cantidades, modificadores seleccionados, precios calculados (unitarios y totales), notas, estado del pedido (enum `OrderStatus`), y estado por ítem (futuro enum `OrderItemStatus`). Se pueden asociar a una mesa (`Table`) y opcionalmente a un cliente LCo (`User`).
  - `Table`, `StaffPin`: Para la gestión futura de mesas (con `identifier` para QRs) y personal.
- **API de Gestión de Carta por el Administrador (Backend - `/api/camarero/admin/*`):** Endpoints CRUD completos y protegidos para que el `BUSINESS_ADMIN` gestione todos los aspectos de su carta digital si el módulo LC está activo.
- **Interfaz de Usuario para Gestión de Carta por el Administrador (Frontend - `/admin/dashboard/camarero/menu-editor`):**
  - `MenuManagementPage.tsx` orquesta la experiencia, utilizando:
    - `MenuCategoryManager.tsx` para CRUD de categorías (con subida/recorte de imagen).
    - `MenuItemManager.tsx` para listar y gestionar ítems dentro de la categoría seleccionada.
    - `MenuItemFormModal.tsx` como modal integral para CRUD de ítems, soportando todos los campos detallados del `MenuItem`.
    - `ModifierGroupsManagementModal.tsx` (accesible desde el form de ítem) para CRUD de `ModifierGroup`s.
    - `ModifierOptionsManagementModal.tsx` (accesible desde el form de grupo) para CRUD de `ModifierOption`s.
  - Botón "Previsualizar Carta Pública" para que el admin vea la carta tal como la vería un cliente.
- **Visualización de Carta Pública por el Cliente Final (Backend & Frontend - `/m/:businessSlug/:tableIdentifier?`):**
  - **Backend:** API pública (`GET /public/menu/business/:businessSlug`) que sirve la estructura completa de la carta activa, disponible, ordenada y con todos los campos i18n necesarios.
  - **Frontend (`PublicMenuViewPage.tsx`):** Página responsive que consume la API y renderiza la carta:
    - `CategoryAccordion.tsx`: Muestra categorías como secciones expandibles con su imagen y descripción.
    - `MenuItemCard.tsx`: Tarjeta detallada por ítem, mostrando imagen, nombre (i18n), descripción (i18n), precio, alérgenos, tags. Permite al cliente iniciar la personalización con modificadores.
    - `ModifierGroupInteractiveRenderer.tsx`: Presenta los grupos de modificadores de forma interactiva (Radio/Checkbox) para que el cliente personalice su selección, con actualización dinámica del precio del ítem.
- **Flujo Completo de Pedido por el Cliente Final (Backend & Frontend):**
  - **Personalización y Carrito Local:** El cliente configura ítems, cantidad, modificadores y notas. Estos se añaden a un estado de carrito local (`currentOrderItems`) en `PublicMenuViewPage.tsx`. El carrito se persiste en `localStorage` para mantenerlo entre sesiones o refrescos de página (específico por `businessSlug` y `tableIdentifier`).
  - **Modal de Carrito (`ShoppingCartModal.tsx`):**
    - Visualización detallada de todos los ítems del pedido, con sus configuraciones.
    - Funcionalidad para modificar cantidades, eliminar ítems, y añadir notas generales al pedido.
    - Botón para vaciar completamente el carrito.
    - Cálculo y muestra del total del pedido.
  - **Envío del Pedido al Backend:**
    - Al confirmar, el frontend construye un `CreateOrderPayloadDto` (con `items`, `orderNotes`, `tableIdentifier?`, y `customerId?` si el cliente se logueó con LCo).
    - Se envía a `POST /public/order/:businessSlug`.
  - **Procesamiento y Persistencia en Backend:**
    - Validación exhaustiva de la disponibilidad de ítems/opciones, reglas de selección de modificadores.
    - Recálculo de todos los precios en el backend para seguridad.
    - Creación transaccional de los registros `Order`, `OrderItem` y `OrderItemModifierOption` en la base de datos. El `Order` se guarda con estado inicial `RECEIVED` y un `orderNumber` generado.
    - El backend devuelve el objeto `Order` creado.
  - **Feedback al Cliente:** Notificación de éxito en el frontend (mostrando el `orderNumber` o `id` del pedido). El carrito local se limpia.

## Estado Actual y Próximos Pasos 🗺️

La plataforma ha alcanzado la **versión v1.17.0**.

- **LoyalPyME Core (LCo)** está estable y completamente funcional.
- La **arquitectura multi-módulo** con el **Panel Super Admin** está implementada y operativa.
- El **Módulo Camarero (LC)** ha logrado hitos cruciales:
  - Gestión completa de la carta digital por el administrador (backend y frontend).
  - Visualización pública e interactiva de la carta por el cliente final.
  - **Flujo de pedido por el cliente final funcional:** desde la selección y personalización de ítems, pasando por un carrito de compras persistente y editable, hasta el envío del pedido al backend y su registro en la base de datos.

El **enfoque principal de desarrollo inmediato** para el Módulo Camarero (LC) es:

1.  ⭐ **KDS (Kitchen Display System) Básico (Backend y Frontend):**
    - **Objetivo:** Permitir que cocina/barra vean los nuevos pedidos (`OrderItem`s) en tiempo real, con sus detalles, y puedan actualizar su estado de preparación (ej. Pendiente -> En Preparación -> Listo).
    - Esto incluye la definición del enum `OrderItemStatus` y los endpoints API necesarios en el backend, así como la interfaz de usuario del KDS.
2.  ⭐ **Visualización del Estado del Pedido para el Cliente:**
    - **Objetivo:** Que el cliente pueda ver el progreso de su pedido después de haberlo enviado (ej. en una página de confirmación o de seguimiento).
3.  ⭐ **Interfaz de Camarero (MVP Inicial):**
    - **Objetivo:** Funcionalidades básicas para el personal de sala, como recibir notificaciones de ítems listos desde el KDS y marcarlos como servidos.

Posteriormente, se abordarán funcionalidades como la gestión de mesas y personal por el administrador de LC, la solicitud de cancelación de pedidos por el cliente (con confirmación KDS), y una mayor integración con LoyalPyME Core para la acumulación de puntos y canje de beneficios en pedidos LC.

- Consulta **[PROJECT_STATUS.md](./PROJECT_STATUS.md)** para un análisis detallado de los hitos completados, la versión actual y las decisiones de diseño clave.
- Revisa **[DEVELOPMENT_PLAN.md](./DEVELOPMENT_PLAN.md)** para el backlog completo, la hoja de ruta detallada de funcionalidades para el Módulo Camarero y las ideas futuras.
- Para los flujos de trabajo en detalle:
  - [LOYALPYME_CORE_WORKFLOW.md](./LOYALPYME_CORE_WORKFLOW.md)
  - [LOYALPYME_CAMARERO_WORKFLOW.md](./LOYALPYME_CAMARERO_WORKFLOW.md)
  - [MODULE_INTEGRATION_WORKFLOW.md](./MODULE_INTEGRATION_WORKFLOW.md)

## Tecnologías Utilizadas 🛠️

**Frontend:**
React (v19+), TypeScript, Vite (v5+), Mantine UI (v7+), Axios, React Router DOM (v6+), `html5-qrcode` (para escaneo QR cliente LCo), `react-image-crop` (para recorte de imágenes en admin), `i18next` y `react-i18next` (para internacionalización ES/EN), `zod` (para validación de formularios, progresivamente).

**Backend:**
Node.js, Express.js, TypeScript, Prisma ORM (v6+), PostgreSQL, JSON Web Tokens (JWT) para autenticación, `bcryptjs` para hashing de contraseñas, Cloudinary SDK para almacenamiento y gestión de imágenes, Multer para manejo de subidas de archivos, Vitest para testing unitario/integración, Supertest para testing de API, Swagger/OpenAPI (`swagger-jsdoc`, `swagger-ui-express`) para documentación de API, `node-cron` para tareas programadas (lógica de tiers LCo).

_(Una lista más detallada de dependencias y versiones específicas se encuentra en los archivos `package.json` de las carpetas `frontend/` y `backend/`, y una discusión de tecnologías clave en [PROJECT_STATUS.md](./PROJECT_STATUS.md))._

## Inicio Rápido (Desarrollo Local) 🚀

1.  Clonar el repositorio del proyecto.
2.  **Configuración del Backend:**
    - Navegar a la carpeta `backend/`.
    - Ejecutar `yarn install` (o `npm install`) para instalar dependencias.
    - Copiar `backend/.env.example` a `backend/.env` y rellenar **todas** las variables de entorno requeridas (conexión a PostgreSQL, credenciales JWT, API keys de Cloudinary).
    - Asegurarse de tener un servidor PostgreSQL corriendo y una base de datos creada para el proyecto (ej. `loyalpymedb`).
    - Ejecutar `npx prisma migrate reset` desde `backend/` para inicializar la base de datos (esto la borrará y recreará). Confirmar la acción.
    - Ejecutar `npx prisma db seed` desde `backend/` para poblar la base de datos con un negocio de demostración (`restaurante-demo-loyalpyme`), su administrador (`admin@demo.com` / `password`), un cliente de prueba (`cliente@demo.com` / `password`), y datos de ejemplo para LCo y LC (incluyendo una carta digital).
    - Ejecutar `npx ts-node ./scripts/create-superadmin.ts` desde `backend/` para crear el usuario Super Administrador global (`superadmin@loyalpyme.com` / `superadminpassword`).
    - Ejecutar el backend en dos terminales separadas desde la carpeta `backend/`:
      1.  `yarn dev:build` (o `npx tsc --watch`) - Para la compilación continua de TypeScript.
      2.  `yarn dev:run` (o `npx nodemon dist/index.js`) - Para iniciar el servidor Node.js.
3.  **Configuración del Frontend:**
    - Navegar a la carpeta `frontend/`.
    - Ejecutar `yarn install` (o `npm install`).
    - Ejecutar `yarn dev` (o `yarn dev --host` para acceso desde otros dispositivos en la red local).
4.  **Acceso a las Aplicaciones (URLs por defecto):**
    - **Carta Pública Módulo Camarero (Cliente):** `https://localhost:5173/m/restaurante-demo-loyalpyme` (o el slug de tu negocio demo; puedes añadir `/identificador-mesa` al final si lo usas).
    - **Login / Registro / Dashboard Cliente LCo / Panel Admin Negocio:** `https://localhost:5173`
      - Login Admin Negocio Demo (LCo & LC): `admin@demo.com` / `password`
      - Login Cliente Demo (LCo): `cliente@demo.com` / `password`
    - **Panel Super Admin:** `https://localhost:5173/superadmin`
      - Login: `superadmin@loyalpyme.com` / `superadminpassword` (o las credenciales configuradas).
    - **Documentación API Backend:** `http://localhost:3000/api-docs`

**¡Importante!** Para instrucciones **exhaustivas y detalladas** sobre la instalación, configuración completa del entorno (variables `.env`), y ejecución, consulta la guía **[SETUP_GUIDE.md](./SETUP_GUIDE.md)**. Para soluciones a problemas comunes de configuración o ejecución, revisa la **[TROUBLESHOOTING_GUIDE.md](./TROUBLESHOOTING_GUIDE.md)**.

---

## Contribuciones 🤝

Este proyecto es software propietario desarrollado por Olivier Hottelet. No se aceptan contribuciones externas directas en este momento. Si se detectan errores o se tienen sugerencias de mejora, pueden ser comunicadas al propietario. Si el repositorio fuera público y permitiera issues, esa sería la vía.

## Licencia 📜

Este proyecto es software propietario.
Copyright (c) 2024-2025 Olivier Hottelet. Todos los derechos reservados.

El uso, copia, distribución, modificación, descompilación o ingeniería inversa de este software o su código fuente, en su totalidad o en parte, está estrictamente prohibido sin el permiso previo, explícito y por escrito del propietario de los derechos de autor.

Consulta el archivo [LICENSE.md](./LICENSE.MD) en el directorio raíz del proyecto para obtener más detalles sobre los términos de la licencia.

## Contacto 📧

Para consultas sobre el proyecto, licencias, o cualquier otro asunto relacionado:

- **Olivier Hottelet**
- olivierhottelet1980@gmail.com

---
