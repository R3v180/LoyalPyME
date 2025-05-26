// backend/src/routes/public-order.routes.ts
// Version: 1.1.0 (Add route for getting order status)

import { Router } from 'express';
// Importar ambos handlers del controlador
import { 
    createPublicOrderHandler,
    getPublicOrderStatusHandler // <-- Asegurarse que este está importado
} from '../public/order.controller'; // Ajustar ruta si la estructura de carpetas es diferente

const publicOrderRouter = Router();

// Ruta existente para crear un pedido
// POST /public/order/:businessSlug
publicOrderRouter.post(
    '/:businessSlug', 
    createPublicOrderHandler
);

// NUEVA RUTA para obtener el estado del pedido
// GET /public/order/:orderId/status 
// (El prefijo /public/order ya se aplica en index.ts)
publicOrderRouter.get(
    '/:orderId/status', // :orderId es el UUID del pedido
    getPublicOrderStatusHandler
);

export default publicOrderRouter;