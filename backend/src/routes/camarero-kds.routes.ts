// backend/src/routes/camarero-kds.routes.ts (CORREGIDO)
import { Router } from 'express';
// --- RUTAS CORREGIDAS ---
import { authenticateToken } from '../shared/middleware/auth.middleware';
import { checkRole } from '../shared/middleware/role.middleware';
import { checkModuleActive } from '../shared/middleware/module.middleware';
import { UserRole } from '@prisma/client';

import {
    getItemsForKdsHandler,
    updateOrderItemStatusHandler
} from '../modules/camarero/kds.controller';
// --- FIN RUTAS CORREGIDAS ---


const camareroKdsRouter = Router();

// Middlewares
camareroKdsRouter.use(authenticateToken);
camareroKdsRouter.use(checkModuleActive('CAMARERO'));
camareroKdsRouter.use(checkRole([
    UserRole.KITCHEN_STAFF,
    UserRole.BAR_STAFF,
    UserRole.BUSINESS_ADMIN
]));

// Rutas KDS
camareroKdsRouter.get('/items', getItemsForKdsHandler);
camareroKdsRouter.patch('/items/:orderItemId/status', updateOrderItemStatusHandler);

// Placeholder
camareroKdsRouter.get('/', (req, res) => {
    res.json({
        message: `[KDS API] Endpoints KDS para el negocio: ${req.user?.businessId}. Roles del usuario: ${req.user?.role}`
    });
});

export default camareroKdsRouter;