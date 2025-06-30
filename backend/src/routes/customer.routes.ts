// backend/src/routes/customer.routes.ts
// Version 2.3.0 - Add /orders route for purchase history

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
    getAvailableCouponsHandler,
    getCustomerOrdersHandler // <-- NUEVA IMPORTACIÓN
} from '../modules/loyalpyme/customer/customer.controller';

import activityRouter from './activity.routes';

const router = Router();
const loyaltyCoreRequired = checkModuleActive('LOYALTY_CORE');


// Rutas existentes para Clientes (sin cambios)
router.get('/rewards', checkRole([UserRole.CUSTOMER_FINAL]), loyaltyCoreRequired, getCustomerRewardsHandler);
router.get('/granted-rewards', checkRole([UserRole.CUSTOMER_FINAL]), loyaltyCoreRequired, getPendingGrantedRewardsHandler);
router.post('/granted-rewards/:grantedRewardId/redeem', checkRole([UserRole.CUSTOMER_FINAL]), loyaltyCoreRequired, redeemGrantedRewardHandler);
router.get('/available-coupons', checkRole([UserRole.CUSTOMER_FINAL]), loyaltyCoreRequired, getAvailableCouponsHandler);
router.get('/tiers', checkRole([UserRole.CUSTOMER_FINAL]), loyaltyCoreRequired, getCustomerTiersHandler);
router.get('/business-config', checkRole([UserRole.CUSTOMER_FINAL]), loyaltyCoreRequired, getCustomerBusinessConfigHandler);

// --- NUEVA RUTA PARA EL HISTORIAL DE PEDIDOS ---
// Esta ruta obtendrá la lista paginada de pedidos pagados del cliente.
router.get(
    '/orders',
    checkRole([UserRole.CUSTOMER_FINAL]),
    loyaltyCoreRequired, // Lo mantenemos ya que el historial está ligado al cliente de LCo
    getCustomerOrdersHandler // El nuevo handler que crearemos en el controlador
);
// --- FIN NUEVA RUTA ---

router.use('/activity', checkRole([UserRole.CUSTOMER_FINAL]), loyaltyCoreRequired, activityRouter);


export default router;