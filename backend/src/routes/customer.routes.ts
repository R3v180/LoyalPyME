// backend/src/routes/customer.routes.ts
// Version 2.0.0 - Added route to fetch available rewards for a customer

import { Router } from 'express';
import { UserRole } from '@prisma/client';

import { checkRole } from '../shared/middleware/role.middleware';
import { checkModuleActive } from '../shared/middleware/module.middleware'; // Importar para consistencia

import {
    getCustomerRewardsHandler,
    getPendingGrantedRewardsHandler,
    redeemGrantedRewardHandler,
    getCustomerTiersHandler,
    getCustomerBusinessConfigHandler
} from '../modules/loyalpyme/customer/customer.controller';

// --- Importar el nuevo handler de recompensas ---
import { getAvailableRewardsHandler } from '../modules/loyalpyme/rewards/rewards.controller';

import activityRouter from './activity.routes';


const router = Router();
const loyaltyCoreRequired = checkModuleActive('LOYALTY_CORE');


// --- Rutas existentes para Clientes (se añade loyaltyCoreRequired para consistencia) ---
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

// --- NUEVA RUTA PARA OBTENER CUPONES DISPONIBLES ---
router.get(
    '/available-rewards', // -> GET /api/customer/available-rewards
    checkRole([UserRole.CUSTOMER_FINAL]),
    loyaltyCoreRequired,
    getAvailableRewardsHandler
);
// --- FIN NUEVA RUTA ---

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

router.use('/activity', checkRole([UserRole.CUSTOMER_FINAL]), loyaltyCoreRequired, activityRouter);


export default router;