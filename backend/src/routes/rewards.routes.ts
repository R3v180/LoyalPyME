// frontend/src/routes/rewards.routes.ts
// VERSIÓN 3.0.0 - CORRECCIÓN DE PERMISOS PARA CANJE DE CLIENTE

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
    redeemRewardForLaterHandler,
} from '../modules/loyalpyme/rewards/rewards.controller';


const router = Router();
const loyaltyCoreRequired = checkModuleActive('LOYALTY_CORE');

// --- Rutas para BUSINESS_ADMIN (Crear, Ver, Editar, Borrar) ---
// Estas rutas requieren el rol de administrador y se mantienen como estaban.
router.post('/', checkRole([UserRole.BUSINESS_ADMIN]), loyaltyCoreRequired, createRewardHandler);
router.get('/', checkRole([UserRole.BUSINESS_ADMIN]), loyaltyCoreRequired, getRewardsHandler);
router.get('/:id', checkRole([UserRole.BUSINESS_ADMIN]), loyaltyCoreRequired, getRewardByIdHandler);
router.put('/:id', checkRole([UserRole.BUSINESS_ADMIN]), loyaltyCoreRequired, updateRewardHandler);
router.patch('/:id', checkRole([UserRole.BUSINESS_ADMIN]), loyaltyCoreRequired, updateRewardHandler);
router.delete('/:id', checkRole([UserRole.BUSINESS_ADMIN]), loyaltyCoreRequired, deleteRewardHandler);

// --- RUTA ESPECÍFICA PARA CUSTOMER_FINAL ---
// Esta es la ruta que estaba mal configurada. Ahora permite explícitamente el canje
// por parte de un cliente final.
router.post(
    '/:id/redeem', 
    checkRole([UserRole.CUSTOMER_FINAL]), // <-- CORRECCIÓN CLAVE: Solo para clientes
    loyaltyCoreRequired, 
    redeemRewardForLaterHandler
);

export default router;