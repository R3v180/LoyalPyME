// Copia Gemini/backend/src/routes/public-order.routes.ts
// Versión actualizada para usar los handlers exportados y añadir nueva ruta

import { Router } from 'express';
import { 
    createPublicOrderHandler,
    getPublicOrderStatusHandler,
    addItemsToExistingOrderHandler // <-- Importar el nuevo handler
} from '../public/order.controller'; // Asegúrate que la ruta es correcta

const publicOrderRouter = Router();

// Ruta para crear un pedido
// POST /:businessSlug  (el prefijo /api/public/order se aplica en index.ts)
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

// NUEVA RUTA para añadir ítems a un pedido existente
// POST /:orderId/items
publicOrderRouter.post(
    '/:orderId/items', // :orderId es el UUID del pedido
    addItemsToExistingOrderHandler
);

export default publicOrderRouter;