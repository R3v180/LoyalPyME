// filename: backend/src/routes/tiers.routes.ts
// Version: 2.0.2 (Fix: Correct import paths)

import { Router } from 'express';
// Corregido: './' indica misma carpeta o subcarpeta relativa
import { checkRole } from '../middleware/role.middleware';
import { UserRole } from '@prisma/client';

// Corregido: './' indica misma carpeta o subcarpeta relativa
import { getBusinessTierConfigHandler, updateBusinessTierConfigHandler } from '../tiers/tier-config.controller';
import { createTierHandler, getBusinessTiersHandler, getTierByIdHandler, updateTierHandler, deleteTierHandler } from '../tiers/tier-crud.controller';
import { createTierBenefitHandler, getTierBenefitsHandler, updateTierBenefitHandler, deleteTierBenefitHandler } from '../tiers/tier-benefit.controller';

const tierRouter = Router();
const adminOnly = [checkRole([UserRole.BUSINESS_ADMIN])];

// Rutas de Configuración
tierRouter.get('/config', adminOnly, getBusinessTierConfigHandler);
tierRouter.put('/config', adminOnly, updateBusinessTierConfigHandler);

// Rutas para Tiers
tierRouter.post('/tiers', adminOnly, createTierHandler);
tierRouter.get('/', adminOnly, getBusinessTiersHandler); // Ruta de lista en GET /api/tiers/
tierRouter.get('/tiers/:tierId', adminOnly, getTierByIdHandler);
tierRouter.put('/tiers/:tierId', adminOnly, updateTierHandler);
tierRouter.delete('/tiers/:tierId', adminOnly, deleteTierHandler);

// Rutas para Beneficios
tierRouter.post('/tiers/:tierId/benefits', adminOnly, createTierBenefitHandler);
tierRouter.get('/tiers/:tierId/benefits', adminOnly, getTierBenefitsHandler);
tierRouter.put('/benefits/:benefitId', adminOnly, updateTierBenefitHandler);
tierRouter.delete('/benefits/:benefitId', adminOnly, deleteTierBenefitHandler);

export default tierRouter;
// End of File: backend/src/routes/tiers.routes.ts