// backend/src/routes/customer.routes.ts (CORREGIDO)
import { Router } from 'express';
import { UserRole } from '@prisma/client';

// --- RUTAS CORREGIDAS ---
import { checkRole } from '../shared/middleware/role.middleware';

import {
    getCustomerRewardsHandler,
    getPendingGrantedRewardsHandler,
    redeemGrantedRewardHandler,
    getCustomerTiersHandler,
    getCustomerBusinessConfigHandler
} from '../modules/loyalpyme/customer/customer.controller';

// La ruta a activity.routes.ts ya es correcta porque ambos están en /src/routes
import activityRouter from './activity.routes';
// --- FIN RUTAS CORREGIDAS ---


const router = Router();

// --- Rutas específicas para Clientes (sin cambios en la lógica) ---
router.get(
    '/rewards',
    checkRole([UserRole.CUSTOMER_FINAL]),
    getCustomerRewardsHandler
);

router.get(
    '/granted-rewards',
    checkRole([UserRole.CUSTOMER_FINAL]),
    getPendingGrantedRewardsHandler
);

router.post(
    '/granted-rewards/:grantedRewardId/redeem',
    checkRole([UserRole.CUSTOMER_FINAL]),
    redeemGrantedRewardHandler
);

router.get(
    '/tiers',
    checkRole([UserRole.CUSTOMER_FINAL]),
    getCustomerTiersHandler
);

router.get(
    '/business-config',
    checkRole([UserRole.CUSTOMER_FINAL]),
    getCustomerBusinessConfigHandler
);

router.use('/activity', checkRole([UserRole.CUSTOMER_FINAL]), activityRouter);


export default router;