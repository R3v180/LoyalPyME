// backend/src/routes/rewards.routes.ts
// Version: 2.0.0 - Added redeem route for customers

import { Router } from 'express';
import { UserRole } from '@prisma/client';
import { checkRole } from '../shared/middleware/role.middleware';
import { checkModuleActive } from '../shared/middleware/module.middleware';
import {
    createRewardHandler,
    getRewardsHandler,
    getRewardByIdHandler,
    updateRewardHandler,
    deleteRewardHandler,
    redeemRewardForLaterHandler, // Importar el nuevo handler
} from '../modules/loyalpyme/rewards/rewards.controller';


const router = Router();
const loyaltyCoreRequired = checkModuleActive('LOYALTY_CORE');

// --- Rutas para BUSINESS_ADMIN ---
router.post('/', checkRole([UserRole.BUSINESS_ADMIN]), loyaltyCoreRequired, createRewardHandler);
router.get('/', checkRole([UserRole.BUSINESS_ADMIN]), loyaltyCoreRequired, getRewardsHandler);
router.get('/:id', checkRole([UserRole.BUSINESS_ADMIN]), loyaltyCoreRequired, getRewardByIdHandler);
router.put('/:id', checkRole([UserRole.BUSINESS_ADMIN]), loyaltyCoreRequired, updateRewardHandler);
router.patch('/:id', checkRole([UserRole.BUSINESS_ADMIN]), loyaltyCoreRequired, updateRewardHandler);
router.delete('/:id', checkRole([UserRole.BUSINESS_ADMIN]), loyaltyCoreRequired, deleteRewardHandler);

// --- NUEVA RUTA para CUSTOMER_FINAL ---
// Permite a un cliente canjear una recompensa para obtener un "cupón"
router.post(
    '/:id/redeem', 
    checkRole([UserRole.CUSTOMER_FINAL]), // Solo para clientes
    loyaltyCoreRequired, 
    redeemRewardForLaterHandler
);

export default router;