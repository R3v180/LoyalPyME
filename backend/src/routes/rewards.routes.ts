// backend/src/routes/rewards.routes.ts
import { Router } from 'express';
import { checkRole } from '../middleware/role.middleware';
import { UserRole } from '@prisma/client';
// --- AÑADIR IMPORTACIÓN ---
import { checkModuleActive } from '../middleware/module.middleware';
// --- FIN AÑADIR ---
import {
    createRewardHandler,
    getRewardsHandler,
    getRewardByIdHandler,
    updateRewardHandler,
    deleteRewardHandler,
} from '../rewards/rewards.controller';

const router = Router();

// Middleware de rol (BUSINESS_ADMIN) ya se aplica a nivel de montaje en index.ts
// o se aplica individualmente aquí si fuera necesario (como lo tienes actualmente)

// --- APLICAR checkModuleActive A TODAS LAS RUTAS ---
const loyaltyCoreRequired = checkModuleActive('LOYALTY_CORE');

router.post('/', checkRole([UserRole.BUSINESS_ADMIN]), loyaltyCoreRequired, createRewardHandler);
router.get('/', checkRole([UserRole.BUSINESS_ADMIN]), loyaltyCoreRequired, getRewardsHandler);
router.get('/:id', checkRole([UserRole.BUSINESS_ADMIN]), loyaltyCoreRequired, getRewardByIdHandler);
router.put('/:id', checkRole([UserRole.BUSINESS_ADMIN]), loyaltyCoreRequired, updateRewardHandler);
router.patch('/:id', checkRole([UserRole.BUSINESS_ADMIN]), loyaltyCoreRequired, updateRewardHandler);
router.delete('/:id', checkRole([UserRole.BUSINESS_ADMIN]), loyaltyCoreRequired, deleteRewardHandler);
// --- FIN APLICAR ---

export default router;