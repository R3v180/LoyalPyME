// backend/src/routes/rewards.routes.ts
// VERSIÓN 4.0.0 - SIMPLIFIED: Only includes CRUD endpoints for Admin panel.

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
} from '../modules/loyalpyme/rewards/rewards.controller';


const router = Router();
const loyaltyCoreRequired = checkModuleActive('LOYALTY_CORE');

// --- Rutas para que el BUSINESS_ADMIN gestione el catálogo de recompensas ---
// Estas rutas requieren que el usuario esté autenticado, sea BUSINESS_ADMIN y tenga el módulo de lealtad activo.
// Estos middlewares se aplican en el router principal (index.ts) antes de llegar aquí.

router.post('/', checkRole([UserRole.BUSINESS_ADMIN]), loyaltyCoreRequired, createRewardHandler);
router.get('/', checkRole([UserRole.BUSINESS_ADMIN]), loyaltyCoreRequired, getRewardsHandler);
router.get('/:id', checkRole([UserRole.BUSINESS_ADMIN]), loyaltyCoreRequired, getRewardByIdHandler);
router.put('/:id', checkRole([UserRole.BUSINESS_ADMIN]), loyaltyCoreRequired, updateRewardHandler);
router.patch('/:id', checkRole([UserRole.BUSINESS_ADMIN]), loyaltyCoreRequired, updateRewardHandler);
router.delete('/:id', checkRole([UserRole.BUSINESS_ADMIN]), loyaltyCoreRequired, deleteRewardHandler);

// --- RUTAS OBSOLETAS ELIMINADAS ---
// La ruta POST /:id/redeem que era para los clientes ya no existe en este archivo.
// La lógica de canje ahora está 100% contenida dentro de la creación del pedido.

export default router;