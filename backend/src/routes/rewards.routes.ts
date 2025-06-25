// backend/src/routes/rewards.routes.ts (CORREGIDO)
import { Router } from 'express';
import { UserRole } from '@prisma/client';
// --- RUTAS CORREGIDAS ---
import { checkRole } from '../shared/middleware/role.middleware';
import { checkModuleActive } from '../shared/middleware/module.middleware';
import {
    createRewardHandler,
    getRewardsHandler,
    getRewardByIdHandler,
    updateRewardHandler,
    deleteRewardHandler,
} from '../modules/loyalpyme/rewards/rewards.controller';
// --- FIN RUTAS CORREGIDAS ---


const router = Router();

const loyaltyCoreRequired = checkModuleActive('LOYALTY_CORE');

// NOTA: El middleware checkRole([UserRole.BUSINESS_ADMIN]) ya se aplica en src/routes/index.ts
// antes de montar este router, por lo que técnicamente podría eliminarse de aquí para evitar redundancia.
// Lo mantenemos por ahora por si decides cambiar la lógica de montaje.

router.post('/', checkRole([UserRole.BUSINESS_ADMIN]), loyaltyCoreRequired, createRewardHandler);
router.get('/', checkRole([UserRole.BUSINESS_ADMIN]), loyaltyCoreRequired, getRewardsHandler);
router.get('/:id', checkRole([UserRole.BUSINESS_ADMIN]), loyaltyCoreRequired, getRewardByIdHandler);
router.put('/:id', checkRole([UserRole.BUSINESS_ADMIN]), loyaltyCoreRequired, updateRewardHandler);
router.patch('/:id', checkRole([UserRole.BUSINESS_ADMIN]), loyaltyCoreRequired, updateRewardHandler);
router.delete('/:id', checkRole([UserRole.BUSINESS_ADMIN]), loyaltyCoreRequired, deleteRewardHandler);

export default router;