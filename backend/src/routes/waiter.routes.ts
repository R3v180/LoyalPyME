// backend/src/routes/waiter.routes.ts
// Version: 1.2.0 (Add route GET /orders for staff to list orders)

import { Router } from 'express';
import { authenticateToken } from '../middleware/auth.middleware';
import { checkRole } from '../middleware/role.middleware';
import { checkModuleActive } from '../middleware/module.middleware';
import { UserRole } from '@prisma/client';

// Importar los handlers del controlador de camarero
import {
    getReadyForPickupItemsHandler,
    markOrderItemServedHandler,
    requestBillByStaffHandler,
    markOrderAsPaidHandler,
    // ---- NUEVO HANDLER IMPORTADO ----
    getStaffOrdersHandler
} from '../camarero/waiter.controller'; // Ajusta la ruta si tu estructura es diferente

const waiterRouter = Router();

// Middlewares aplicados a TODAS las rutas definidas en este router
waiterRouter.use(authenticateToken);
waiterRouter.use(checkModuleActive('CAMARERO'));
waiterRouter.use(checkRole([UserRole.WAITER, UserRole.BUSINESS_ADMIN]));


// === Definición de Rutas para la Interfaz de Camarero ===
// El prefijo general (ej. /api/camarero/staff) se aplicará en index.ts al montar este router.

/**
 * @openapi
 * /camarero/staff/ready-for-pickup:
 *   get:
 *     tags: [Camarero Staff]
 *     summary: Obtiene ítems listos para recoger por el camarero.
 *     description: Devuelve una lista de OrderItems que han sido marcados como READY por el KDS y están pendientes de ser servidos.
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       '200':
 *         description: Lista de ítems listos para recoger obtenida con éxito.
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/ReadyPickupItemDto'
 *       '401': { description: 'No autorizado.' }
 *       '403': { description: 'Prohibido.' }
 *       '500': { description: 'Error interno.' }
 */
waiterRouter.get('/ready-for-pickup', getReadyForPickupItemsHandler);

/**
 * @openapi
 * /camarero/staff/order-items/{orderItemId}/status:
 *   patch:
 *     tags: [Camarero Staff]
 *     summary: Marca un ítem de pedido como SERVIDO.
 *     description: Permite al camarero actualizar el estado de un OrderItem específico a SERVED.
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - name: orderItemId
 *         in: path
 *         required: true
 *         schema: { type: string, format: uuid }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/MarkOrderItemServedPayloadDto'
 *     responses:
 *       '200':
 *         description: Ítem de pedido marcado como SERVIDO.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/OrderItemStatusUpdateResponseDto'
 *       '400': { description: 'Payload inválido.' }
 *       '401': { description: 'No autorizado.' }
 *       '403': { description: 'Prohibido.' }
 *       '404': { description: 'Ítem no encontrado.' }
 *       '409': { description: 'Conflicto de estado.' }
 *       '500': { description: 'Error interno.' }
 */
waiterRouter.patch('/order-items/:orderItemId/status', markOrderItemServedHandler);


// ---- RUTAS EXISTENTES (request-bill, mark-as-paid) ----

/**
 * @openapi
 * /camarero/staff/order/{orderId}/request-bill:
 *   post:
 *     tags: [Camarero Staff - Gestión de Pedidos]
 *     summary: El personal solicita la cuenta para un pedido.
 *     description: Cambia el estado del pedido a PENDING_PAYMENT y marca isBillRequested como true.
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - name: orderId
 *         in: path
 *         required: true
 *         schema: { type: string, format: uuid }
 *         description: ID del pedido para el cual se solicita la cuenta.
 *     requestBody:
 *       required: false
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/RequestBillPayloadDto'
 *     responses:
 *       '200':
 *         description: Cuenta solicitada con éxito, pedido actualizado.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message: { type: string }
 *                 order: { $ref: '#/components/schemas/Order' }
 *       '400': { description: 'ID de pedido faltante o datos inválidos.' }
 *       '401': { description: 'No autorizado.' }
 *       '403': { description: 'Prohibido.' }
 *       '404': { description: 'Pedido no encontrado.' }
 *       '409': { description: 'Conflicto.' }
 *       '500': { description: 'Error interno.' }
 */
waiterRouter.post('/order/:orderId/request-bill', requestBillByStaffHandler);

/**
 * @openapi
 * /camarero/staff/order/{orderId}/mark-as-paid:
 *   post:
 *     tags: [Camarero Staff - Gestión de Pedidos]
 *     summary: El personal marca un pedido como pagado.
 *     description: Cambia el estado del pedido a PAID, registra detalles del pago, libera la mesa y asigna puntos LCo si aplica.
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - name: orderId
 *         in: path
 *         required: true
 *         schema: { type: string, format: uuid }
 *         description: ID del pedido a marcar como pagado.
 *     requestBody:
 *       required: false
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/MarkOrderAsPaidPayloadDto'
 *     responses:
 *       '200':
 *         description: Pedido marcado como pagado con éxito.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message: { type: string }
 *                 order: { $ref: '#/components/schemas/Order' }
 *       '400': { description: 'ID de pedido faltante o datos inválidos.' }
 *       '401': { description: 'No autorizado.' }
 *       '403': { description: 'Prohibido.' }
 *       '404': { description: 'Pedido no encontrado.' }
 *       '409': { description: 'Conflicto.' }
 *       '500': { description: 'Error interno.' }
 */
waiterRouter.post('/order/:orderId/mark-as-paid', markOrderAsPaidHandler);


// ---- NUEVA RUTA PARA LISTAR PEDIDOS ----
/**
 * @openapi
 * /camarero/staff/orders:
 *   get:
 *     tags: [Camarero Staff - Gestión de Pedidos]
 *     summary: Obtiene la lista de pedidos para el personal de sala.
 *     description: Devuelve una lista de pedidos relevantes para el camarero, con posibilidad de filtrar por estado.
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - name: status
 *         in: query
 *         required: false
 *         description: Filtra pedidos por uno o más estados (separados por coma si son varios, ej. PENDING_PAYMENT,COMPLETED).
 *         schema:
 *           type: string # O type: array, items: { type: string, enum: [...] } si Swagger UI lo soporta mejor
 *     responses:
 *       '200':
 *         description: Lista de pedidos obtenida con éxito.
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/WaiterOrderListItemDto' # Este DTO lo definimos en camarero.dto.ts
 *       '400': { description: 'Filtro de estado inválido.' }
 *       '401': { description: 'No autorizado.' }
 *       '403': { description: 'Prohibido.' }
 *       '500': { description: 'Error interno del servidor.' }
 */
waiterRouter.get('/orders', getStaffOrdersHandler);
// ---- FIN NUEVA RUTA ----


export default waiterRouter;