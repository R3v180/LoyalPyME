// backend/src/routes/waiter.routes.ts (CORREGIDO)
import { Router } from 'express';
import { UserRole } from '@prisma/client';
// --- RUTAS CORREGIDAS ---
import { authenticateToken } from '../shared/middleware/auth.middleware';
import { checkRole } from '../shared/middleware/role.middleware';
import { checkModuleActive } from '../shared/middleware/module.middleware';

import {
    getReadyForPickupItemsHandler,
    markOrderItemServedHandler,
    requestBillByStaffHandler,
    markOrderAsPaidHandler,
    getStaffOrdersHandler
} from '../modules/camarero/waiter.controller';
// --- FIN RUTAS CORREGIDAS ---

const waiterRouter = Router();

// Middlewares
waiterRouter.use(authenticateToken);
waiterRouter.use(checkModuleActive('CAMARERO'));
waiterRouter.use(checkRole([UserRole.WAITER, UserRole.BUSINESS_ADMIN]));

// Rutas (sin cambios en la lógica)
waiterRouter.get('/ready-for-pickup', getReadyForPickupItemsHandler);
waiterRouter.patch('/order-items/:orderItemId/status', markOrderItemServedHandler);
waiterRouter.post('/order/:orderId/request-bill', requestBillByStaffHandler);
waiterRouter.post('/order/:orderId/mark-as-paid', markOrderAsPaidHandler);
waiterRouter.get('/orders', getStaffOrdersHandler);

export default waiterRouter;