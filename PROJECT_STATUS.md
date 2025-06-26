LoyalPyME - Estado del Proyecto y Decisiones Clave
Versión Actual: 1.22.0 (LC+LCo: Sistema de Recompensas Avanzado y Canje en Carrito COMPLETADOS Y VALIDADOS)
Fecha de Última Actualización: 26 de Junio de 2025

1. Resumen General del Proyecto LoyalPyME 🎯
   Concepto: LoyalPyME es una plataforma web integral, diseñada como una solución Software as a Service (SaaS) modular, orientada a Pequeñas y Medianas Empresas (PyMEs). Su arquitectura full-stack se basa en tecnologías modernas:

Frontend: React con TypeScript, utilizando Vite como herramienta de construcción y Mantine UI para la biblioteca de componentes, asegurando una experiencia de usuario responsive y moderna. La navegación se gestiona con React Router DOM y la internacionalización (i18n) con

i18next.

Backend: Node.js con Express.js y TypeScript, interactuando con una base de datos PostgreSQL a través del ORM Prisma. La autenticación se maneja con JSON Web Tokens (JWT).

La plataforma ofrece dos módulos principales que los negocios pueden activar según sus necesidades:

LoyalPyME Core (LCo): Un sistema de fidelización digital robusto y completo. [Funcionalmente Completo y Mejorado].

Características Clave LCo: Gestión integral de clientes (con roles), sistema de acumulación de puntos (configurable por negocio), niveles de fidelización (tiers) con beneficios personalizables, y un catálogo de recompensas avanzado que permite configurar productos gratis (vinculados a la carta de LC), descuentos flexibles (fijos o porcentuales) y reglas de negocio como límites de uso o validez.

LoyalPyME Camarero (LC): Un módulo avanzado, [FLUJO DE PEDIDO Y CANJE DE RECOMPENSAS COMPLETADO], diseñado para digitalizar y optimizar la operativa de servicio en el sector de la hostelería.

Funcionalidades Clave LC Implementadas y Validadas:

Gestión Completa de Carta Digital (Admin): Interfaz administrativa para crear, editar y organizar la carta, ítems y modificadores complejos.

Visualización de Carta y Toma de Pedidos por Cliente (con Modificadores): Interfaz interactiva para explorar la carta, personalizar ítems con modificadores y añadir a un carrito de compra persistente.

[NUEVO] Canje de Recompensas Integrado: Los clientes logueados pueden ver y aplicar sus recompensas de puntos (productos gratis o descuentos) directamente desde el carrito de compra (ShoppingCartModal.tsx), recalculando el total del pedido en tiempo real.

Gestión de Pedido Activo por Cliente: La PublicMenuViewPage detecta pedidos activos y adapta la UI, permitiendo añadir nuevos ítems a un pedido existente.

Visualización del Estado del Pedido por Cliente: La OrderStatusPage muestra el estado del pedido y de cada ítem en tiempo real (con polling).

Ciclo KDS (Cocina/Barra): API e Interfaz de KDS funcionales para que el personal vea y actualice el estado de preparación de los ítems (PENDING_KDS -> PREPARING -> READY).

Ciclo de Servicio del Camarero: API e Interfaz para que el camarero vea los ítems listos para recoger (READY) y los marque como SERVED.

Ciclo Financiero Completo: API e Interfaces para que el cliente pida la cuenta y para que el camarero marque el pedido como PAID, lo cual libera la mesa y asigna los puntos de fidelidad LCo correspondientes.

Componentes Tecnológicos Clave Detallados:

Backend: Node.js, Express.js, TypeScript, Prisma ORM (v6+), PostgreSQL, JWT, bcryptjs, Cloudinary SDK, Multer, Swagger/OpenAPI, node-cron, class-validator y class-transformer.

Frontend: React (v19+), TypeScript, Vite (v5+), Mantine UI (v7+), Axios, React Router DOM (v6+), i18next, react-i18next, html5-qrcode, react-image-crop.

Testing: Vitest.

Licencia: Software Propietario. Copyright (c) 2024-2025 Olivier Hottelet.

Áreas Funcionales Principales de la Plataforma (Detallado):

Panel Super Admin (/superadmin): Gestión global de negocios y activación/desactivación de módulos.

Panel de Administración del Negocio (/admin/dashboard/\*): Interfaz para el rol BUSINESS_ADMIN.

LCo (si isLoyaltyCoreActive): Gestión de clientes, recompensas avanzadas (con tipos y reglas), niveles/tiers y configuración del programa de fidelización.

LC (si isCamareroActive): Gestión de la carta digital, mesas e interfaz de camarero para recogida de ítems.

Interfaz KDS (Módulo LC - /admin/kds): Visualización y gestión de la preparación de comandas.

Portal de Cliente Final (LCo - /customer/dashboard): Dashboard para visualizar puntos, nivel, historial y canjear recompensas.

Interfaces Públicas del Módulo Camarero (LC):

Carta Digital Pública (/m/:businessSlug/:tableIdentifier?): Permite a los clientes explorar el menú, personalizar ítems, añadir al carrito y enviar la comanda.

Visualización Estado del Pedido Cliente (/order-status/:orderId): Muestra el estado del pedido en tiempo real.

2. Estado Actual Detallado (Hitos Completados y En Progreso - v1.22.0) 📝
   Fase 1 (Núcleo Operativo LCo): [COMPLETADO]

Autenticación completa, gestión de clientes, sistema de puntos por QR y lógica de tiers automática.

Fase 2 (Fundamentos Multi-Módulo y Panel Super Admin): [COMPLETADO]

Panel Super Admin, middleware de activación de módulos y payload de perfil de usuario enriquecido.

Fase 3 (Módulo Camarero - Ciclo de Pedido Completo): [COMPLETADO Y VALIDADO]

Fundamentos del backend (modelos y API de gestión de carta).

Frontend de admin para gestión de la carta digital.

Flujo completo de creación de pedido por parte del cliente, incluyendo la adición de ítems a un pedido existente.

Ciclos completos de KDS y Servicio de Camarero (recogida y entrega).

Ciclo financiero completo (solicitud de cuenta y marcado como pagado).

Fase 4 (Integración Avanzada LCo + LC): [COMPLETADO Y VALIDADO]

Modelo de Recompensas Extendido: El modelo Reward en la base de datos se ha ampliado para incluir RewardType, DiscountType, discountValue, linkedMenuItemId y reglas de negocio adicionales.

Gestión de Recompensas Dinámicas (Admin): Se ha implementado el nuevo formulario (RewardForm.tsx) que permite al BUSINESS_ADMIN crear los tres tipos de recompensas (producto gratis, descuento en ítem, descuento total). Se ha añadido el endpoint

GET /api/camarero/admin/menu/items/all para poblar el selector de productos.

Canje Integrado en el Carrito (Cliente): El ShoppingCartModal.tsx ahora muestra las recompensas canjeables a los usuarios logueados y permite su aplicación directa en el pedido, recalculando el total y añadiendo ítems gratis con precio 0.

Procesamiento Transaccional (Backend): El servicio order-creation.service.ts ahora maneja un payload enriquecido con redeemedRewardId (para ítems) y appliedLcoRewardId (para el total), validando la recompensa y debitando los puntos del cliente de forma atómica junto a la creación del pedido.

3. Key Concepts & Design Decisions 🔑

Arquitectura Modular y Activación por Negocio: La plataforma es multi-tenant, con funcionalidades que se habilitan o deshabilitan a nivel de negocio.

Estructura de Datos Detallada para Módulo Camarero (LC): Uso de snapshots de precios y nombres en OrderItem para garantizar la integridad histórica de los pedidos.

Flujo de Pedido LC - Cliente (Detallado): Proceso orquestado mediante hooks personalizados (usePublicMenuData, useMenuItemConfigurator, usePublicOrderCart, useActiveOrderState) que gestionan la lógica de forma desacoplada y eficiente.

Flujos Asíncronos (KDS y Camarero): La comunicación entre el cliente, la cocina y el personal de sala se gestiona de forma asíncrona mediante cambios de estado y polling en las interfaces correspondientes.

Internacionalización (i18n): Estrategia dual con archivos JSON para UI estática y campos duplicados en la BD (ej. name_es, name_en) para contenido dinámico.

Arquitectura de Backend y Frontend (Refactorizada): Estructura limpia y escalable con rutas centralizadas, middlewares específicos y una fuerte dependencia de hooks personalizados en el frontend para encapsular la lógica.

4. Lecciones Aprendidas & Troubleshooting Clave 💡

Sincronización de Tipos: Esencial mantener los tipos de Prisma, backend y frontend sincronizados, especialmente tras migraciones de la base de datos (npx prisma generate).

Deserialización de DTOs Anidados: Solucionado el bug crítico de modificadores usando plainToInstance en el backend para asegurar que class-transformer procese correctamente los payloads complejos.

Manejo de Transacciones Prisma: Clave para operaciones atómicas como la creación de pedidos con canje de recompensas, garantizando que todas las operaciones (crear pedido, debitar puntos, crear log) se completen o fallen juntas.

Sincronización de Documentación: Mantener los archivos .md actualizados con el código es un paso obligatorio para evitar confusiones.

5. Próximos Pasos Inmediatos / Prioridades ⏳📌
   Con la integración del canje de recompensas finalizada, el enfoque principal de desarrollo se mantiene en las funcionalidades avanzadas para el Módulo Camarero.

⭐ LC - Dividir la Cuenta (Split Bill): [CRÍTICO - SIGUIENTE BLOQUE FUNDAMENTAL]

Objetivo: Implementar la capacidad para que un camarero divida la cuenta de un pedido pendiente de pago, ya sea por ítems o en partes iguales.

Backend: Requerirá un diseño de datos para pagos parciales (ej. nuevo modelo PartialPayment) y un servicio (SplitBillService) que maneje la lógica de división y actualización del estado del pedido.

Frontend (Camarero): Requerirá una nueva interfaz o modal para que el camarero pueda asignar ítems a diferentes "cestas" de pago y procesarlas individualmente.

⭐ LC - Gestión de Personal (PINs y Permisos): [ALTA PRIORIDAD - Después de Split Bill]

Objetivo: Crear un sistema para que el BUSINESS_ADMIN pueda gestionar a su personal y asignarles PINs para un inicio de sesión rápido en las interfaces de servicio.

⭐ LC - Mejoras en la Interfaz de Camarero (TPV): [MEDIA PRIORIDAD]

Objetivo: Unificar y mejorar las vistas del camarero hacia un TPV (Terminal Punto de Venta) más cohesivo.

6. Información Adicional ℹ️
   Licencia: Software Propietario. Copyright (c) 2024-2025 Olivier Hottelet. Consulta

LICENSE.md para más detalles.

Flujos de Trabajo Detallados: Para una comprensión profunda de cómo operan los módulos y su integración, consultar: LOYALPYME_CORE_WORKFLOW.md, LOYALPYME_CAMARERO_WORKFLOW.md y MODULE_INTEGRATION_WORKFLOW.md.
