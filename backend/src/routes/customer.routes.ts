// backend/src/routes/customer.routes.ts
// VERSIÓN 2.4.1 - CORRECCIÓN DE HANDLER PARA granted-rewards

import { Router } from 'express';
import { UserRole } from '@prisma/client';

import { checkRole } from '../shared/middleware/role.middleware';
import { checkModuleActive } from '../shared/middleware/module.middleware';

import {
    getCustomerRewardsHandler,
    getGrantedRewardsHandler, // <-- Se usa el nuevo handler
    redeemGrantedRewardHandler,
    getCustomerTiersHandler,
    getCustomerBusinessConfigHandler,
    getAvailableCouponsHandler,
    getCustomerOrdersHandler
} from '../modules/loyalpyme/customer/customer.controller';

import activityRouter from './activity.routes';

const router = Router();
const loyaltyCoreRequired = checkModuleActive('LOYALTY_CORE');

// --- RUTA CORREGIDA ---
// Ahora esta ruta llama al handler que devuelve TODOS los GrantedRewards.
router.get('/granted-rewards', checkRole([UserRole.CUSTOMER_FINAL]), loyaltyCoreRequired, getGrantedRewardsHandler);
// --- FIN RUTA CORREGIDA ---

// El resto de rutas se mantienen igual
router.get('/rewards', checkRole([UserRole.CUSTOMER_FINAL]), loyaltyCoreRequired, getCustomerRewardsHandler);
router.post('/granted-rewards/:grantedRewardId/redeem', checkRole([UserRole.CUSTOMER_FINAL]), loyaltyCoreRequired, redeemGrantedRewardHandler);
router.get('/available-coupons', checkRole([UserRole.CUSTOMER_FINAL]), loyaltyCoreRequired, getAvailableCouponsHandler);
router.get('/tiers', checkRole([UserRole.CUSTOMER_FINAL]), loyaltyCoreRequired, getCustomerTiersHandler);
router.get('/business-config', checkRole([UserRole.CUSTOMER_FINAL]), loyaltyCoreRequired, getCustomerBusinessConfigHandler);
router.get('/orders', checkRole([UserRole.CUSTOMER_FINAL]), loyaltyCoreRequired, getCustomerOrdersHandler);
router.use('/activity', checkRole([UserRole.CUSTOMER_FINAL]), loyaltyCoreRequired, activityRouter);


export default router;