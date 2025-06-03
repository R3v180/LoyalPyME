// backend/src/routes/public-order.routes.ts
// Version 1.1.0 (Add route for client to request bill)

import { Router } from 'express';
import {
    createPublicOrderHandler,
    getPublicOrderStatusHandler,
    addItemsToExistingOrderHandler,
    // ---- NUEVO HANDLER IMPORTADO ----
    requestBillByClientHandler
} from '../public/order.controller'; // Asegúrate que la ruta es correcta

const publicOrderRouter = Router();

// Ruta para crear un pedido
// POST /:businessSlug  (el prefijo /public/order se aplica en index.ts)
publicOrderRouter.post(
    '/:businessSlug',
    createPublicOrderHandler
);

// Ruta para obtener el estado del pedido
// GET /:orderId/status
publicOrderRouter.get(
    '/:orderId/status',
    getPublicOrderStatusHandler
);

// Ruta para añadir ítems a un pedido existente
// POST /:orderId/items
publicOrderRouter.post(
    '/:orderId/items',
    addItemsToExistingOrderHandler
);

// ---- NUEVA RUTA ----
/**
 * @openapi
 * /public/order/{orderId}/request-bill:
 *   post:
 *     tags: [Public Orders]
 *     summary: El cliente solicita la cuenta para su pedido.
 *     description: Permite a un cliente (sin necesidad de autenticación de usuario) solicitar la cuenta para un pedido existente, cambiando su estado a PENDING_PAYMENT.
 *     parameters:
 *       - name: orderId
 *         in: path
 *         required: true
 *         description: ID del pedido para el cual se solicita la cuenta.
 *         schema:
 *           type: string
 *           format: uuid
 *     requestBody:
 *       required: false
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/RequestBillClientPayloadDto' # Definido en order.dto.ts
 *     responses:
 *       '200':
 *         description: Cuenta solicitada con éxito.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message: { type: string }
 *                 order:
 *                   type: object
 *                   properties:
 *                     id: { type: string, format: uuid }
 *                     orderNumber: { type: string }
 *                     status: { type: string } # Debería ser PENDING_PAYMENT
 *                     isBillRequested: { type: boolean } # Debería ser true
 *       '400':
 *         description: ID de pedido faltante o datos de payload inválidos.
 *       '404':
 *         description: Pedido no encontrado.
 *       '409': # O 400 dependiendo de la implementación del servicio
 *         description: Conflicto (ej. el pedido ya está pagado, cancelado, o la cuenta ya fue solicitada).
 *       '500':
 *         description: Error interno del servidor.
 */
publicOrderRouter.post(
    '/:orderId/request-bill',
    requestBillByClientHandler
);
// ---- FIN NUEVA RUTA ----


export default publicOrderRouter;