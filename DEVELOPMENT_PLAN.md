# LoyalPyME - Plan de Desarrollo y Futuras Funcionalidades

**Última Actualización:** 26 de Junio de 2025 (Refleja el sistema de recompensas avanzado como COMPLETADO. Mantiene "Dividir la Cuenta" como la prioridad CRÍTICA).

Este documento detalla las tareas pendientes inmediatas, el alcance definido para las próximas versiones operativas (con énfasis en el Módulo Camarero - LC), la deuda técnica y las ideas para la evolución futura. Se busca un máximo detalle para guiar el desarrollo, incluyendo consideraciones de UX, modelos de datos implicados, y flujos de trabajo.

---

## A. TRABAJO RECIENTEMENTE COMPLETADO / EN PROGRESO / CORRECCIONES ✅

[cite_start]⭐ **[COMPLETADO - MVP Base Plataforma] Panel Super Admin y Gestión de Negocios/Módulos (backend, frontend)** [cite: 3]

[cite_start]⭐ **[COMPLETADO - Módulo Camarero - Gestión de Carta Digital] LC - Backend (Modelos BD y API) y Frontend (UI Admin) para Gestión Completa de Carta Digital.** [cite: 3]

[cite_start]⭐ **[COMPLETADO - Módulo Camarero - Vista Cliente y Flujo de Pedido con Modificadores] LC - Backend y Frontend: Visualización de Carta, Configuración de Ítems, Carrito y Envío de Pedido por Cliente Final.** [cite: 3]

[cite_start]⭐ **[COMPLETADO - Módulo Camarero - KDS Funcional (Backend API, Lógica de Estados y Frontend con Acciones)]** [cite: 3]

[cite_start]⭐ **[COMPLETADO - Módulo Camarero - Ciclo de Servicio de Camarero (Entrega de Ítems)]** [cite: 3]

[cite_start]⭐ **[COMPLETADO - Módulo Camarero - Ciclo Financiero Completo del Pedido]** [cite: 3]

⭐ **[COMPLETADO - Integración LCo+LC] Sistema de Recompensas Avanzado y Canje en Carrito**

- **Detalles Alcanzados:**
  - **Modelo de Recompensas Extendido (Backend):** El modelo `Reward` en `schema.prisma` se ha ampliado para incluir `RewardType` (`MENU_ITEM`, `DISCOUNT_ON_ITEM`, `DISCOUNT_ON_TOTAL`), `DiscountType` (`PERCENTAGE`, `FIXED_AMOUNT`), `discountValue`, y `linkedMenuItemId` para vincular recompensas a productos específicos de la carta.
  - **Gestión de Recompensas Dinámicas (Admin):** La interfaz de administración de recompensas (`RewardForm.tsx`) ahora es dinámica. Permite al `BUSINESS_ADMIN` crear los tres tipos de recompensas, mostrando condicionalmente un selector de productos del menú o campos para configurar descuentos. Se ha añadido un endpoint (`GET /api/camarero/admin/menu/items/all`) para este propósito.
  - **Canje Integrado en Carrito (Cliente):** El componente `ShoppingCartModal.tsx` ahora muestra a los clientes logueados una sección con las recompensas que pueden permitirse. Pueden canjear productos (que se añaden al carrito con precio 0 €) o aplicar descuentos que recalculan el total del pedido.
  - **Procesamiento Transaccional Atómico (Backend):** El servicio de creación de pedidos se ha refactorizado para aceptar `redeemedRewardId` en los ítems y `appliedLcoRewardId` en el pedido general. El backend realiza todas las operaciones (validar y aplicar recompensa, debitar puntos, crear el pedido con los precios correctos y generar el `ActivityLog`) dentro de una única transacción de base de datos para garantizar la consistencia de los datos.

---

## B. PRIORIDADES ACTUALES: Módulo "LoyalPyME Camarero" (LC) - Funcionalidades Avanzadas de Cuenta 🚀

Con el ciclo de vida del pedido y la integración de recompensas ya implementados, el objetivo inmediato es añadir funcionalidades avanzadas que aporten gran valor a la operativa del restaurante, como la división de cuentas.

**BLOQUE 1: FUNCIONALIDADES AVANZADAS DE GESTIÓN DE CUENTA**

**B1.1. ⭐ [CRÍTICO - PENDIENTE] LC - Dividir la Cuenta (Split Bill)**

- [cite_start]**Objetivo Detallado:** Implementar la capacidad para que un camarero divida la cuenta de un pedido pendiente de pago, ya sea asignando ítems específicos a diferentes personas/pagos, o dividiendo el total en partes iguales. [cite: 4]
- **Sub-Tareas Detalladas (Backend):**
  1.  **Diseño de Datos (`schema.prisma`):**
      - Considerar un nuevo modelo `PartialPayment` o `SubOrder` relacionado con el `Order` principal. [cite_start]Este modelo podría contener campos como `amount`, `paymentMethod`, `status`, `paidByStaffId`, y una relación a los `OrderItem`s que incluye. [cite: 4]
      - [cite_start]El `Order` principal podría tener un nuevo estado `PARTIALLY_PAID` en su enum `OrderStatus`. [cite: 4]
  2.  **Lógica de Servicio (`split-bill.service.ts`):**
      - [cite_start]Crear un nuevo servicio que encapsule la lógica compleja de la división. [cite: 4]
      - [cite_start]Método `splitOrderByItems(orderId, splits: { items: orderItemIds[], paymentDetails: ... }[])`: Recibe un array de "divisiones", cada una con sus ítems y detalles de pago. [cite: 4]
      - [cite_start]Método `splitByAmount(orderId, numberOfWays: number)`: Divide `finalAmount` entre el número de partes. [cite: 5]
      - [cite_start]Debe validar que la suma de las partes coincida con el total del pedido antes de procesar los pagos. [cite: 5]
  3.  **Controladores y Rutas:**
      - Nuevos endpoints protegidos en `/api/camarero/staff/order/:orderId/split-bill`. [cite_start]Por ejemplo, uno para iniciar la división y otro para procesar cada pago parcial. [cite: 5]
- **Sub-Tareas Detalladas (Frontend - Camarero):**
  1.  **Diseño de UI/UX:**
      - [cite_start]En la vista de gestión de un pedido, un botón "Dividir Cuenta". [cite: 5]
      - Esto abrirá un modal o una nueva vista dedicada. [cite_start]La UI debe ser muy clara, mostrando todos los ítems del pedido a la izquierda y varias "columnas" o "cestas" a la derecha, representando a cada persona que va a pagar. [cite: 5]
      - El camarero debe poder arrastrar y soltar ítems a cada cesta. [cite_start]La UI recalculará los subtotales de cada cesta en tiempo real. [cite: 5]
      - [cite_start]Debe haber una opción para "dividir equitativamente" que distribuya el total automáticamente. [cite: 5]
  2.  **Integración con API:**
      - [cite_start]Conectar la nueva UI con los endpoints del backend para procesar cada pago parcial de forma individual. [cite: 5]
      - [cite_start]La vista principal del pedido debe reflejar los pagos parciales realizados y el saldo restante. [cite: 6]

---

## C. FUNDAMENTOS TÉCNICOS ESENCIALES LC (Paralelo y Continuo)

**C1. [ALTA] Testing Backend:**

- **PENDIENTE (Prioridad Alta):**
  - [cite_start]Tests unitarios y de integración para la lógica de "Dividir la Cuenta" (`split-bill.service.ts`). [cite: 6]
  - [cite_start]Tests para la API de gestión de personal y PINs cuando se desarrolle. [cite: 6]

**C2. [CRÍTICA - EN PROGRESO] Validación Robusta Backend (Zod o `class-validator`):**

- **PENDIENTE:**
  - [cite_start]Crear y validar DTOs para los nuevos endpoints de "Dividir la Cuenta". [cite: 6]

**C3. [ALTA - PENDIENTE] Seguridad LC:**

- **PENDIENTE:**
  - [cite_start]Implementar lógica de autenticación para `StaffPin` si se decide usarla para login rápido del camarero. [cite: 6]
  - [cite_start]Planificar cómo se integrará el futuro sistema de permisos granulares. [cite: 6]

**C4. [ALTA - EN PROGRESO] Logging y Monitoring Básico LC:**

- **PENDIENTE:**
  - [cite_start]Añadir logs detallados para el nuevo flujo de "Dividir la Cuenta". [cite: 6]

**C5. [MEDIA - PENDIENTE] Internacionalización (i18n) Completa LC:**

- **PENDIENTE:**
  - [cite_start]Traducir todos los textos de las nuevas interfaces (ej. modal de "Dividir la Cuenta"). [cite: 6]

---

## D. FUNCIONALIDADES LOYALPYME CORE (LCo) Y MEJORAS PLATAFORMA

- **D1. [cite_start][MEDIA] LCo - Mejoras UX/UI Panel Cliente** [cite: 7]
- **D2. [cite_start][BAJA/MEDIA] LCo - Gestión de Notificaciones al Cliente (Email/Push)** [cite: 7]
- **D3. [cite_start][BAJA/MEDIA] LCo - Estadísticas Avanzadas para Admin** [cite: 7]
- **D4. [cite_start][MEDIA] Plataforma - Mejoras UI/UX Panel Admin General** [cite: 7]
- **D5. [cite_start][BAJA/MEDIA] Plataforma - Documentación API Swagger/OpenAPI más Detallada** [cite: 7]
- **D6. [cite_start][BAJA] Plataforma - Configuración Adicional del Negocio por el Admin** [cite: 7]
- **D8. [cite_start][BAJA] Plataforma - Onboarding y Ayuda (Guías y Tooltips)** [cite: 7]
- **D9. [cite_start][BAJA/MEDIA] Plataforma - Optimización y Rendimiento General** [cite: 7]

---

## E. DEUDA TÉCNICA Y MEJORAS CONTINUAS (Transversales) 🛠️

- **E1. [cite_start][ALTA] Refactorización y Reorganización de Código Continuo** [cite: 7]
- **E2. [cite_start][MEDIA] Mejorar la Gestión y Presentación de Errores (Backend y Frontend)** [cite: 7]
- **E3. [cite_start][MEDIA] Actualización de Dependencias Periódica y Gestión de Vulnerabilidades** [cite: 7]
- **E4. [cite_start][EN PROGRESO - LC] Validación Robusta Backend (`class-validator` y `class-transformer`)** [cite: 7]
- **E5. [cite_start][BAJA/MEDIA] Optimización de Consultas a Base de Datos (Continuo)** [cite: 7]
- **E6. [cite_start][MEDIA] Documentación Interna del Código (JSDoc/TSDoc)** [cite: 7]
- **E7. [cite_start][ALTA] Variables de Entorno y Configuración Centralizada** [cite: 7]
- **E8. [cite_start][MEDIA] Accesibilidad (a11y) Frontend (Continuo)** [cite: 7]
- **E9. [cite_start][BAJA/MEDIA] CI/CD (Integración Continua / Despliegue Continuo) Básico** [cite: 7]

---

## F. VISIÓN FUTURA / MÓDULOS ADICIONALES 🚀

- **F1. [cite_start]LC - Funcionalidades Muy Avanzadas de Hostelería** (Pago Online, **[PRIORIDAD ACTUAL: División de Cuentas]**, Reservas, Inventario Básico, Informes Avanzados) [cite: 7, 8]
- **F2. [cite_start]Módulo Pedidos Online / Take Away / Delivery (Extensión de LC)** [cite: 8]
- **F3. [cite_start]App Móvil Dedicada (PWA Progresiva y/o Nativa)** [cite: 8]
- **F4. [cite_start]Pruebas Automatizadas E2E (End-to-End)** [cite: 8]
- **F5. [cite_start]Monetización Avanzada y Planes de Suscripción Detallados (Plataforma)** [cite: 8]
- **F6. [cite_start]Personalización y CRM Avanzado (Transversal LCo/LC)** [cite: 8]
- **F7. [cite_start]Gamificación Avanzada (LCo)** [cite: 8]
- **F8. [cite_start](VISIÓN A LARGO PLAZO) Módulo TPV (Terminal Punto de Venta) Integrado** [cite: 8]
- **F9. [cite_start](VISIÓN A MUY LARGO PLAZO) Módulo Contabilidad / Integraciones Contables** [cite: 8]
