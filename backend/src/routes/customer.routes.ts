// backend/src/routes/customer.routes.ts
// Version 2.2.0 (Add available-coupons route and import activityRouter)

import { Router } from 'express';
import { UserRole } from '@prisma/client';

import { checkRole } from '../shared/middleware/role.middleware';
import { checkModuleActive } from '../shared/middleware/module.middleware';

import {
    getCustomerRewardsHandler,
    getPendingGrantedRewardsHandler,
    redeemGrantedRewardHandler,
    getCustomerTiersHandler,
    getCustomerBusinessConfigHandler,
    getAvailableCouponsHandler // <-- Lo crearemos a continuación
} from '../modules/loyalpyme/customer/customer.controller';

// --- IMPORTACIÓN AÑADIDA ---
import activityRouter from './activity.routes';
// --- FIN IMPORTACIÓN AÑADIDA ---

const router = Router();
const loyaltyCoreRequired = checkModuleActive('LOYALTY_CORE');


// Rutas existentes para Clientes
router.get(
    '/rewards',
    checkRole([UserRole.CUSTOMER_FINAL]),
    loyaltyCoreRequired,
    getCustomerRewardsHandler
);

router.get(
    '/granted-rewards',
    checkRole([UserRole.CUSTOMER_FINAL]),
    loyaltyCoreRequired,
    getPendingGrantedRewardsHandler
);

router.post(
    '/granted-rewards/:grantedRewardId/redeem',
    checkRole([UserRole.CUSTOMER_FINAL]),
    loyaltyCoreRequired,
    redeemGrantedRewardHandler
);

// Obtiene los cupones que el usuario ha adquirido y están listos para usar
router.get(
    '/available-coupons',
    checkRole([UserRole.CUSTOMER_FINAL]),
    loyaltyCoreRequired,
    getAvailableCouponsHandler // <-- Handler que crearemos ahora
);

router.get(
    '/tiers',
    checkRole([UserRole.CUSTOMER_FINAL]),
    loyaltyCoreRequired,
    getCustomerTiersHandler
);

router.get(
    '/business-config',
    checkRole([UserRole.CUSTOMER_FINAL]),
    loyaltyCoreRequired,
    getCustomerBusinessConfigHandler
);

// --- CORRECCIÓN: Ahora activityRouter está definido ---
router.use('/activity', checkRole([UserRole.CUSTOMER_FINAL]), loyaltyCoreRequired, activityRouter);


export default router;