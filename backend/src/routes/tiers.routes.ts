// backend/src/routes/tiers.routes.ts (CORREGIDO)
import { Router } from 'express';
import { UserRole } from '@prisma/client';
// --- RUTAS CORREGIDAS ---
import { checkRole } from '../shared/middleware/role.middleware';
import { checkModuleActive } from '../shared/middleware/module.middleware';
import { getBusinessTierConfigHandler, updateBusinessTierConfigHandler } from '../modules/loyalpyme/tiers/tier-config.controller';
import { createTierHandler, getBusinessTiersHandler, getTierByIdHandler, updateTierHandler, deleteTierHandler } from '../modules/loyalpyme/tiers/tier-crud.controller';
import { createTierBenefitHandler, getTierBenefitsHandler, updateTierBenefitHandler, deleteTierBenefitHandler } from '../modules/loyalpyme/tiers/tier-benefit.controller';
// --- FIN RUTAS CORREGIDAS ---

const tierRouter = Router();
const adminOnly = checkRole([UserRole.BUSINESS_ADMIN]);
const loyaltyCoreRequired = checkModuleActive('LOYALTY_CORE');

// Rutas de Configuración
tierRouter.get('/config', adminOnly, loyaltyCoreRequired, getBusinessTierConfigHandler);
tierRouter.put('/config', adminOnly, loyaltyCoreRequired, updateBusinessTierConfigHandler);

// Rutas para Tiers CRUD
tierRouter.post('/tiers', adminOnly, loyaltyCoreRequired, createTierHandler);
tierRouter.get('/', adminOnly, loyaltyCoreRequired, getBusinessTiersHandler);
tierRouter.get('/tiers/:tierId', adminOnly, loyaltyCoreRequired, getTierByIdHandler);
tierRouter.put('/tiers/:tierId', adminOnly, loyaltyCoreRequired, updateTierHandler);
tierRouter.patch('/tiers/:tierId', adminOnly, loyaltyCoreRequired, updateTierHandler);
tierRouter.delete('/tiers/:tierId', adminOnly, loyaltyCoreRequired, deleteTierHandler);

// Rutas para Beneficios
tierRouter.post('/tiers/:tierId/benefits', adminOnly, loyaltyCoreRequired, createTierBenefitHandler);
tierRouter.get('/tiers/:tierId/benefits', adminOnly, loyaltyCoreRequired, getTierBenefitsHandler);
tierRouter.put('/benefits/:benefitId', adminOnly, loyaltyCoreRequired, updateTierBenefitHandler);
tierRouter.delete('/benefits/:benefitId', adminOnly, loyaltyCoreRequired, deleteTierBenefitHandler);

export default tierRouter;