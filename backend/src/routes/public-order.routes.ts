// backend/src/routes/public-order.routes.ts (CORREGIDO)
import { Router } from 'express';
// --- RUTA CORREGIDA ---
import {
    createPublicOrderHandler,
    getPublicOrderStatusHandler,
    addItemsToExistingOrderHandler,
    requestBillByClientHandler
} from '../modules/camarero/public/order.controller';
// --- FIN RUTA CORREGIDA ---

const publicOrderRouter = Router();

// Ruta para crear un pedido
publicOrderRouter.post(
    '/:businessSlug',
    createPublicOrderHandler
);

// Ruta para obtener el estado del pedido
publicOrderRouter.get(
    '/:orderId/status',
    getPublicOrderStatusHandler
);

// Ruta para añadir ítems a un pedido existente
publicOrderRouter.post(
    '/:orderId/items',
    addItemsToExistingOrderHandler
);

// Ruta para que el cliente solicite la cuenta
publicOrderRouter.post(
    '/:orderId/request-bill',
    requestBillByClientHandler
);

export default publicOrderRouter;