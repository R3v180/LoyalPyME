# LoyalPyME - Plan de Desarrollo y Futuras Funcionalidades

**Última Actualización:** 17 de Junio de 2025 (Refleja el ciclo completo de pedido LC (pago incluido) como COMPLETADO. Establece "Dividir la Cuenta" como la nueva prioridad CRÍTICA para el desarrollo de LC.)

Este documento detalla las tareas pendientes inmediatas, el alcance definido para las próximas versiones operativas (con énfasis en el Módulo Camarero - LC), la deuda técnica y las ideas para la evolución futura. Se busca un máximo detalle para guiar el desarrollo, incluyendo consideraciones de UX, modelos de datos implicados, y flujos de trabajo.

---

## A. TRABAJO RECIENTEMENTE COMPLETADO / EN PROGRESO / CORRECCIONES ✅

⭐ **[COMPLETADO - MVP Base Plataforma] Panel Super Admin y Gestión de Negocios/Módulos (backend, frontend)**

⭐ **[COMPLETADO - Módulo Camarero - Gestión de Carta Digital] LC - Backend (Modelos BD y API) y Frontend (UI Admin) para Gestión Completa de Carta Digital.**

⭐ **[COMPLETADO - Módulo Camarero - Vista Cliente y Flujo de Pedido con Modificadores] LC - Backend y Frontend: Visualización de Carta, Configuración de Ítems, Carrito y Envío de Pedido por Cliente Final.**

⭐ **[COMPLETADO - Módulo Camarero - KDS Funcional (Backend API, Lógica de Estados y Frontend con Acciones)]**

⭐ **[COMPLETADO - Módulo Camarero - Ciclo de Servicio de Camarero (Entrega de Ítems)]**

⭐ **[COMPLETADO - Módulo Camarero - Ciclo Financiero Completo del Pedido]**

- **Detalles Alcanzados:**
  - **Pedir la Cuenta:** Funcionalidad implementada y validada en backend y frontend (`OrderStatusPage`) para que el cliente solicite la cuenta, cambiando el estado del pedido a `PENDING_PAYMENT`.
  - **Marcar Como Pagado:** Funcionalidad implementada y validada en backend y la interfaz del camarero (`WaiterOrderManagementPage`). El camarero puede marcar un pedido como `PAID`, lo que libera la mesa asociada y dispara la asignación de puntos de fidelidad LCo al cliente correcto.
  - **Añadir Ítems a Pedido Existente:** La lógica para que un cliente añada más productos a un pedido en curso (`IN_PROGRESS` o `COMPLETED`) está implementada y validada en el backend y frontend.

---

## B. PRIORIDADES ACTUALES: Módulo "LoyalPyME Camarero" (LC) - Funcionalidades Avanzadas de Cuenta 🚀

Con el ciclo de vida completo del pedido ya implementado, el objetivo inmediato es añadir funcionalidades avanzadas que aporten gran valor a la operativa del restaurante, como la división de cuentas.

**BLOQUE 1: FUNCIONALIDADES AVANZADAS DE GESTIÓN DE CUENTA**

**B1.1. ⭐ [CRÍTICO - PENDIENTE] LC - Dividir la Cuenta (Split Bill)**

- **Objetivo Detallado:** Implementar la capacidad para que un camarero divida la cuenta de un pedido pendiente de pago, ya sea asignando ítems específicos a diferentes personas/pagos, o dividiendo el total en partes iguales.
- **Sub-Tareas Detalladas (Backend):**
  1.  **Diseño de Datos (`schema.prisma`):**
      - Considerar un nuevo modelo `PartialPayment` o `SubOrder` relacionado con el `Order` principal. Este modelo podría contener campos como `amount`, `paymentMethod`, `status`, `paidByStaffId`, y una relación a los `OrderItem`s que incluye.
      - El `Order` principal podría tener un nuevo estado `PARTIALLY_PAID` en su enum `OrderStatus`.
  2.  **Lógica de Servicio (`split-bill.service.ts`):**
      - Crear un nuevo servicio que encapsule la lógica compleja de la división.
      - Método `splitOrderByItems(orderId, splits: { items: orderItemIds[], paymentDetails: ... }[])`: Recibe un array de "divisiones", cada una con sus ítems y detalles de pago.
      - Método `splitByAmount(orderId, numberOfWays: number)`: Divide `finalAmount` entre el número de partes.
      - Debe validar que la suma de las partes coincida con el total del pedido antes de procesar los pagos.
  3.  **Controladores y Rutas:**
      - Nuevos endpoints protegidos en `/api/camarero/staff/order/:orderId/split-bill`. Por ejemplo, uno para iniciar la división y otro para procesar cada pago parcial.
- **Sub-Tareas Detalladas (Frontend - Camarero):**
  1.  **Diseño de UI/UX:**
      - En la vista de gestión de un pedido, un botón "Dividir Cuenta".
      - Esto abrirá un modal o una nueva vista dedicada. La UI debe ser muy clara, mostrando todos los ítems del pedido a la izquierda y varias "columnas" o "cestas" a la derecha, representando a cada persona que va a pagar.
      - El camarero debe poder arrastrar y soltar ítems a cada cesta. La UI recalculará los subtotales de cada cesta en tiempo real.
      - Debe haber una opción para "dividir equitativamente" que distribuya el total automáticamente.
  2.  **Integración con API:**
      - Conectar la nueva UI con los endpoints del backend para procesar cada pago parcial de forma individual.
      - La vista principal del pedido debe reflejar los pagos parciales realizados y el saldo restante.

---

## C. FUNDAMENTOS TÉCNICOS ESENCIALES LC (Paralelo y Continuo)

**C1. [ALTA] Testing Backend:**

- **PENDIENTE (Prioridad Alta):**
  - Tests unitarios y de integración para la lógica de "Dividir la Cuenta" (`split-bill.service.ts`).
  - Tests para la API de gestión de personal y PINs cuando se desarrolle.

**C2. [CRÍTICA - EN PROGRESO] Validación Robusta Backend (Zod o `class-validator`):**

- **PENDIENTE:**
  - Crear y validar DTOs para los nuevos endpoints de "Dividir la Cuenta".

**C3. [ALTA - PENDIENTE] Seguridad LC:**

- **PENDIENTE:**
  - Implementar lógica de autenticación para `StaffPin` si se decide usarla para login rápido del camarero.
  - Planificar cómo se integrará el futuro sistema de permisos granulares.

**C4. [ALTA - EN PROGRESO] Logging y Monitoring Básico LC:**

- **PENDIENTE:**
  - Añadir logs detallados para el nuevo flujo de "Dividir la Cuenta".

**C5. [MEDIA - PENDIENTE] Internacionalización (i18n) Completa LC:**

- **PENDIENTE:**
  - Traducir todos los textos de las nuevas interfaces (ej. modal de "Dividir la Cuenta").

---

## D. FUNCIONALIDADES LOYALPYME CORE (LCo) Y MEJORAS PLATAFORMA - (Prioridad Re-evaluada Post-LC MVP Cierre de Pedido)

- **D1. [MEDIA] LCo - Mejoras UX/UI Panel Cliente**
- **D2. [BAJA/MEDIA] LCo - Gestión de Notificaciones al Cliente (Email/Push)**
- **D3. [BAJA/MEDIA] LCo - Estadísticas Avanzadas para Admin**
- **D4. [MEDIA] Plataforma - Mejoras UI/UX Panel Admin General**
- **D5. [BAJA/MEDIA] Plataforma - Documentación API Swagger/OpenAPI más Detallada**
- **D6. [BAJA] Plataforma - Configuración Adicional del Negocio por el Admin**
- **D7. [ALTA - POST LC MVP] LC - Integración Completa con Fidelización LCo**
- **D8. [BAJA] Plataforma - Onboarding y Ayuda (Guías y Tooltips)**
- **D9. [BAJA/MEDIA] Plataforma - Optimización y Rendimiento General**

---

## E. DEUDA TÉCNICA Y MEJORAS CONTINUAS (Transversales) 🛠️

- **E1. [ALTA] Refactorización y Reorganización de Código Continuo**
- **E2. [MEDIA] Mejorar la Gestión y Presentación de Errores (Backend y Frontend)**
- **E3. [MEDIA] Actualización de Dependencias Periódica y Gestión de Vulnerabilidades**
- **E4. [EN PROGRESO - LC] Validación Robusta Backend (`class-validator` y `class-transformer`)**
- **E5. [BAJA/MEDIA] Optimización de Consultas a Base de Datos (Continuo)**
- **E6. [MEDIA] Documentación Interna del Código (JSDoc/TSDoc)**
- **E7. [ALTA] Variables de Entorno y Configuración Centralizada**
- **E8. [MEDIA] Accesibilidad (a11y) Frontend (Continuo)**
- **E9. [BAJA/MEDIA] CI/CD (Integración Continua / Despliegue Continuo) Básico**

---

## F. VISIÓN FUTURA / MÓDULOS ADICIONALES (Post-LC MVP y Mejoras LCo) 🚀

- **F1. LC - Funcionalidades Muy Avanzadas de Hostelería** (Pago Online, **[PRIORIDAD ACTUAL: División de Cuentas]**, Reservas, Inventario Básico, Informes Avanzados)
- **F2. Módulo Pedidos Online / Take Away / Delivery (Extensión de LC)**
- **F3. App Móvil Dedicada (PWA Progresiva y/o Nativa)**
- **F4. Pruebas Automatizadas E2E (End-to-End)**
- **F5. Monetización Avanzada y Planes de Suscripción Detallados (Plataforma)**
- **F6. Personalización y CRM Avanzado (Transversal LCo/LC)**
- **F7. Gamificación Avanzada (LCo)**
- **F8. (VISIÓN A LARGO PLAZO) Módulo TPV (Terminal Punto de Venta) Integrado**
- **F9. (VISIÓN A MUY LARGO PLAZO) Módulo Contabilidad / Integraciones Contables**
