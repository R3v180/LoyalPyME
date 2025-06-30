// backend/src/routes/public-order.routes.ts
import { Router } from 'express';
import {
    createPublicOrderHandler,
    getPublicOrderStatusHandler,
    addItemsToExistingOrderHandler,
    requestBillByClientHandler,
    applyRewardHandler // <-- Este import ahora funcionará
} from '../modules/camarero/public/order.controller';

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

// Ruta para aplicar una recompensa (cupón) a un pedido
publicOrderRouter.patch(
    '/:orderId/apply-reward',
    applyRewardHandler
);

export default publicOrderRouter;