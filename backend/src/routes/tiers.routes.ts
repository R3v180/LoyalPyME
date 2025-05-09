// backend/src/routes/tiers.routes.ts
import { Router } from 'express';
import { checkRole } from '../middleware/role.middleware';
import { UserRole } from '@prisma/client';
// --- AÑADIR IMPORTACIÓN ---
import { checkModuleActive } from '../middleware/module.middleware';
// --- FIN AÑADIR ---
import { getBusinessTierConfigHandler, updateBusinessTierConfigHandler } from '../tiers/tier-config.controller';
import { createTierHandler, getBusinessTiersHandler, getTierByIdHandler, updateTierHandler, deleteTierHandler } from '../tiers/tier-crud.controller';
import { createTierBenefitHandler, getTierBenefitsHandler, updateTierBenefitHandler, deleteTierBenefitHandler } from '../tiers/tier-benefit.controller';

const tierRouter = Router();
const adminOnly = checkRole([UserRole.BUSINESS_ADMIN]); // Esto ya estaba
// --- APLICAR checkModuleActive ---
const loyaltyCoreRequired = checkModuleActive('LOYALTY_CORE');

// Rutas de Configuración
tierRouter.get('/config', adminOnly, loyaltyCoreRequired, getBusinessTierConfigHandler);
tierRouter.put('/config', adminOnly, loyaltyCoreRequired, updateBusinessTierConfigHandler);

// Rutas para Tiers CRUD
tierRouter.post('/tiers', adminOnly, loyaltyCoreRequired, createTierHandler);
tierRouter.get('/', adminOnly, loyaltyCoreRequired, getBusinessTiersHandler); // La raíz de /api/tiers
tierRouter.get('/tiers/:tierId', adminOnly, loyaltyCoreRequired, getTierByIdHandler);
tierRouter.put('/tiers/:tierId', adminOnly, loyaltyCoreRequired, updateTierHandler);
tierRouter.patch('/tiers/:tierId', adminOnly, loyaltyCoreRequired, updateTierHandler);
tierRouter.delete('/tiers/:tierId', adminOnly, loyaltyCoreRequired, deleteTierHandler);

// Rutas para Beneficios
tierRouter.post('/tiers/:tierId/benefits', adminOnly, loyaltyCoreRequired, createTierBenefitHandler);
tierRouter.get('/tiers/:tierId/benefits', adminOnly, loyaltyCoreRequired, getTierBenefitsHandler);
tierRouter.put('/benefits/:benefitId', adminOnly, loyaltyCoreRequired, updateTierBenefitHandler);
tierRouter.delete('/benefits/:benefitId', adminOnly, loyaltyCoreRequired, deleteTierBenefitHandler);
// --- FIN APLICAR ---

export default tierRouter;