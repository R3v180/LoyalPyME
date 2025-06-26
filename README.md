LoyalPyME 🇪🇸 (v1.22.0)

LoyalPyME es una plataforma web integral y modular, desarrollada con un stack Frontend React (TypeScript, Mantine UI, Vite) y Backend Node.js (TypeScript, Express, Prisma, PostgreSQL), diseñada específicamente para Pequeñas y Medianas Empresas (PyMEs). La plataforma se estructura en módulos activables individualmente por cada negocio cliente, permitiendo una solución a medida y adaptada a sus necesidades operativas y de marketing.

⭐ LoyalPyME Core (LCo) - Módulo de Fidelización [Estable y Funcional]:
Un sistema robusto y completo para la gestión de programas de lealtad digitales.

Gestión de Clientes: Administración detallada de clientes, incluyendo su historial de puntos, nivel de fidelización y actividad.

Sistema de Puntos: Configuración de ratio de puntos por gasto y generación de QR para acumulación en punto de venta físico.

Niveles de Fidelización (Tiers): Creación de múltiples niveles con umbrales personalizables (basados en gasto, visitas o puntos) y asignación de beneficios exclusivos por nivel.

Catálogo de Recompensas Avanzado: Gestión de un catálogo de recompensas dinámicas que pueden ser canjeadas por puntos. Permite configurar

productos gratis (vinculados directamente a la carta del Módulo Camarero), descuentos flexibles (de importe fijo o porcentuales, aplicables a ítems o al total del pedido) y reglas de negocio como fechas de validez o límites de uso.

Panel de Cliente Interactivo: Un dashboard personalizado donde los clientes consultan su saldo, progreso de nivel, canjean beneficios y revisan su historial completo de transacciones.

🚀 LoyalPyME Camarero (LC) - Módulo de Hostelería [Ciclo de Pedido y Canje Integrado Validado]:
Un módulo avanzado enfocado en la digitalización y optimización integral del servicio en el sector hostelero (restaurantes, bares, cafeterías), mejorando la eficiencia operativa y la experiencia del cliente.

Funcionalidad Actual Clave:

Gestión Completa de Carta Digital: Interfaz administrativa para crear y organizar categorías, productos y modificadores complejos con soporte para múltiples idiomas e imágenes.

Flujo de Pedido Digital por Cliente: Los clientes acceden a la carta, personalizan ítems con modificadores y realizan su pedido directamente desde el móvil. El sistema gestiona de forma inteligente la creación de nuevos pedidos o la adición de ítems a uno ya existente.

Canje de Recompensas Integrado en el Carrito: Los clientes que han iniciado sesión pueden ver y aplicar sus recompensas de puntos (productos gratis o descuentos) directamente desde el carrito de compra mientras realizan un pedido, viendo el total actualizado en tiempo real.

Sincronización con Cocina (KDS): Las comandas se muestran en tiempo real en una pantalla de cocina (Kitchen Display System), donde el personal actualiza el estado de preparación de cada ítem.

Ciclo de Servicio y Pago Completo: Una interfaz para camareros permite gestionar la entrega de los platos listos y registrar el pago final de los pedidos. Al marcar un pedido como pagado, se libera la mesa y se asignan automáticamente los puntos de fidelidad (si LCo está activo), cerrando el ciclo de servicio y fidelización.

La plataforma LoyalPyME está diseñada con un enfoque en la

mantenibilidad, escalabilidad y adaptabilidad, buscando ser el socio tecnológico que impulse la eficiencia operativa y el crecimiento sostenible de las PyMEs.

Visión y Propósito ✨
LoyalPyME aspira a ser el

aliado tecnológico integral de las Pequeñas y Medianas Empresas (PyMEs), proporcionando herramientas digitales sofisticadas pero intuitivas, integradas en una única plataforma modular que se adapta a las necesidades específicas de cada negocio.

Con

LoyalPyME Core (LCo), buscamos empoderar a las empresas para que puedan cultivar relaciones más profundas y duraderas con sus clientes, fomentando la lealtad a través de programas de recompensas personalizados y gratificantes.

Con el módulo

LoyalPyME Camarero (LC), nuestra visión es transformar y modernizar la operativa en el sector de la hostelería. Queremos que los negocios puedan:

Modernizar su servicio: Ofreciendo una experiencia de pedido digital ágil y sin fricciones.

Reducir errores manuales y agilizar la comunicación interna a través del KDS.

Mejorar significativamente la experiencia del cliente final, permitiéndole pedir y personalizar con total control.

Obtener datos operativos valiosos para la toma de decisiones estratégicas.

La

sinergia entre ambos módulos permite que un cliente que pide desde la carta digital gane puntos automáticamente al pagar, creando una experiencia integrada que maximiza la fidelización y enriquece los datos del negocio.

(Para un análisis exhaustivo del estado actual del proyecto, incluyendo la versión actual, los hitos completados en detalle, las decisiones de diseño clave y las lecciones aprendidas, consulta nuestro PROJECT_STATUS.md. La hoja de ruta completa, el backlog de funcionalidades futuras para ambos módulos, y la visión a largo plazo se encuentran detallados en DEVELOPMENT_PLAN.md).

Características Principales Implementadas ✅
Plataforma Base y Gestión Multi-Módulo:

Panel Super Admin: Interfaz dedicada (/superadmin) para la administración global de negocios y la activación/desactivación individual de los módulos LCo y LC para cada uno.

Control de Acceso Basado en Módulos y Roles (RBAC + MBAC): El acceso a las funcionalidades está condicionado por el rol del usuario (SUPER_ADMIN, BUSINESS_ADMIN, etc.) y por si el módulo requerido está activo para su negocio.

LoyalPyME Core (LCo) - Módulo de Fidelización [Estable y Funcional]:

Autenticación Completa y Segura: Registro de negocios y clientes, login con JWT y reseteo de contraseña.

Gestión Avanzada de Clientes: Panel de admin con listado, filtros, búsqueda y acciones individuales y masivas sobre los clientes (ajuste de puntos, cambio de nivel, asignación de regalos, etc.).

Sistema de Niveles/Tiers Dinámico y Configurable: CRUD completo para niveles, sus beneficios y la configuración global del sistema de progresión y descenso.

Gestión Integral de Recompensas: CRUD para un catálogo de recompensas avanzadas (productos gratis, descuentos) con soporte i18n, imágenes y reglas de negocio.

Panel de Cliente Completo (CustomerDashboardPage.tsx): Un dashboard para que los clientes consulten su estado, canjeen recompensas y revisen su historial de actividad.

Módulo LoyalPyME Camarero (LC) [Ciclo de Pedido y Canje Completo Validado]:

Gestión de Carta Digital (Admin): CRUD intuitivo para categorías, ítems y grupos de modificadores complejos, con soporte i18n e imágenes.

Flujo de Pedido por Cliente Final:

Visualización y Personalización: El cliente explora la carta, personaliza ítems con modificadores y ve el precio dinámicamente.

Carrito de Compra Inteligente (ShoppingCartModal.tsx): Permite revisar el pedido, añadir notas y, para usuarios logueados, canjear recompensas de LCo (productos gratis o descuentos) directamente en el pedido.

Envío y Adición de Ítems: El sistema gestiona inteligentemente la creación de nuevos pedidos o la adición de ítems a uno existente.

Visualización del Estado del Pedido (OrderStatusPage.tsx): Página con polling automático que muestra el estado en tiempo real del pedido y de cada ítem.

Kitchen Display System (KDS): Interfaz para cocina/barra que permite visualizar y gestionar el estado de preparación de las comandas.

Ciclo de Servicio y Pago Completo (Camarero): Interfaces para que el personal de sala vea los ítems listos para recoger (WaiterPickupPage.tsx) y para gestionar y marcar los pedidos como pagados (WaiterOrderManagementPage.tsx), automatizando la asignación de puntos LCo.

Estado Actual y Próximos Pasos 🗺️
La plataforma ha alcanzado la versión v1.22.0.

LoyalPyME Core (LCo): Estable y completamente funcional, con un sistema de recompensas avanzado.

Módulo Camarero (LC): El ciclo de vida completo de un pedido, incluyendo el canje de recompensas de fidelización, está completo y validado.

Arquitectura Multi-Módulo y Panel Super Admin: Implementada y operativa.

El enfoque principal de desarrollo inmediato es añadir funcionalidades avanzadas de gestión al Módulo Camarero (LC):

⭐ LC - Dividir la Cuenta (Split Bill):

Objetivo: Permitir al personal de sala dividir una cuenta entre múltiples clientes.

Posteriormente, se abordarán funcionalidades como la gestión de personal con PINs, mejoras en la interfaz del camarero (TPV) y un sistema de reservas.

Consulta PROJECT_STATUS.md para un análisis detallado.

Revisa

DEVELOPMENT_PLAN.md para la hoja de ruta completa.

Tecnologías Utilizadas 🛠️
Frontend:
React (v19+, Hooks, Context API), TypeScript, Vite (v5+, bundler y servidor de desarrollo HMR), Mantine UI (v7+, biblioteca de componentes y hooks), Axios (cliente HTTP), React Router DOM (v6+, para enrutamiento SPA),

html5-qrcode (para escaneo de códigos QR por el cliente en LCo), react-image-crop (para recorte de imágenes en interfaces de administración), i18next y react-i18next (para internacionalización ES/EN con archivos JSON), zod (para validación de formularios, implementación progresiva).

Backend:
Node.js (runtime), Express.js (framework web), TypeScript (lenguaje principal), Prisma ORM (v6+, para acceso a base de datos PostgreSQL, gestión de migraciones y generación de cliente tipado), PostgreSQL (sistema de gestión de base deatos relacional), JSON Web Tokens (JWT) (para autenticación stateless),

bcryptjs (para hashing seguro de contraseñas), Cloudinary SDK (para almacenamiento y gestión de imágenes en la nube), Multer (middleware para manejo de subidas de archivos multipart/form-data), Vitest (para testing unitario y de integración), Supertest (para testing de API HTTP), Swagger/OpenAPI (swagger-jsdoc, swagger-ui-express) (para documentación interactiva de la API RESTful), node-cron (para la ejecución de tareas programadas, ej. actualización de tiers en LCo).

Inicio Rápido (Desarrollo Local) 🚀
Clonar el Repositorio:

Bash

git clone <URL_DEL_REPOSITORIO_GIT> LoyalPyME
cd LoyalPyME
Configuración del Backend (backend/):

Instalar dependencias: yarn install (o npm install).

Configurar Variables de Entorno: Copiar backend/.env.example a backend/.env y rellenar todas las variables.

Base de Datos (PostgreSQL debe estar corriendo):

Crear la base de datos (ej. loyalpymedb).

Desde backend/, ejecutar npx prisma migrate reset.

Ejecutar npx prisma db seed para poblar con datos de demostración.

Ejecutar npx ts-node ./scripts/create-superadmin.ts para crear el Super Administrador.

Ejecutar el Backend (desde backend/, en dos terminales separadas):

yarn dev:build (o npx tsc --watch): Compilación continua de TypeScript.

yarn dev:run (o npx nodemon dist/index.js): Iniciar servidor Node.js con Nodemon.

Configuración del Frontend (frontend/):

Instalar dependencias: yarn install (o npm install).

Ejecutar el Frontend (desde frontend/): yarn dev.

Acceso a las Aplicaciones (URLs por defecto):

Carta Pública: https://localhost:5173/m/restaurante-demo-loyalpyme

Login / Dashboards: https://localhost:5173

Documentación API (Swagger): http://localhost:3000/api-docs

¡Importante! Para instrucciones exhaustivas y detalladas, consulta la guía SETUP_GUIDE.md. Para soluciones a problemas comunes, revisa la

TROUBLESHOOTING_GUIDE.md.

Contribuciones 🤝
Este proyecto es software propietario desarrollado por Olivier Hottelet. No se aceptan contribuciones externas directas en este momento. Si se detectan errores o se tienen sugerencias de mejora, pueden ser comunicadas al propietario. Si el repositorio fuera público y permitiera la creación de "Issues" en la plataforma de hosting de código (ej. GitHub, GitLab), esa sería la vía formal para reportar bugs o proponer nuevas funcionalidades.

Licencia 📜
Este proyecto es software propietario.
Copyright (c) 2024-2025 Olivier Hottelet. Todos los derechos reservados.

El uso, copia, reproducción, distribución, modificación, descompilación, ingeniería inversa o cualquier otra forma de explotación de este software o su código fuente, en su totalidad o en parte, está estrictamente prohibido sin el permiso previo, explícito y por escrito del propietario de los derechos de autor. Este software se considera información confidencial y un secreto comercial.

Para más detalles sobre los términos de la licencia, consulta el archivo

LICENSE.md en el directorio raíz del proyecto.

Contacto 📧
Para consultas sobre el proyecto, licencias, adquisición, o cualquier otro asunto relacionado:

Olivier Hottelet

olivierhottelet1980@gmail.com
