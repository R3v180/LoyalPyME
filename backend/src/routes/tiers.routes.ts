// filename: backend/src/routes/tiers.routes.ts
// Version: 2.1.0 (Ensure PATCH route for tiers update exists)

import { Router } from 'express';
import { checkRole } from '../middleware/role.middleware';
import { UserRole } from '@prisma/client';
import { getBusinessTierConfigHandler, updateBusinessTierConfigHandler } from '../tiers/tier-config.controller';
// Asegúrate que updateTierHandler se importa desde tier-crud.controller
import { createTierHandler, getBusinessTiersHandler, getTierByIdHandler, updateTierHandler, deleteTierHandler } from '../tiers/tier-crud.controller';
import { createTierBenefitHandler, getTierBenefitsHandler, updateTierBenefitHandler, deleteTierBenefitHandler } from '../tiers/tier-benefit.controller';

const tierRouter = Router();
const adminOnly = checkRole([UserRole.BUSINESS_ADMIN]);

// Rutas de Configuración
tierRouter.get('/config', adminOnly, getBusinessTierConfigHandler);
tierRouter.put('/config', adminOnly, updateBusinessTierConfigHandler);

// Rutas para Tiers CRUD
tierRouter.post('/tiers', adminOnly, createTierHandler);
tierRouter.get('/', adminOnly, getBusinessTiersHandler);
tierRouter.get('/tiers/:tierId', adminOnly, getTierByIdHandler);
tierRouter.put('/tiers/:tierId', adminOnly, updateTierHandler); // Para actualizar completo
// --- ASEGURARSE QUE ESTA LÍNEA EXISTE ---
tierRouter.patch('/tiers/:tierId', adminOnly, updateTierHandler); // Para actualizar parcial
// --- FIN ASEGURARSE ---
tierRouter.delete('/tiers/:tierId', adminOnly, deleteTierHandler);

// Rutas para Beneficios
tierRouter.post('/tiers/:tierId/benefits', adminOnly, createTierBenefitHandler);
tierRouter.get('/tiers/:tierId/benefits', adminOnly, getTierBenefitsHandler);
tierRouter.put('/benefits/:benefitId', adminOnly, updateTierBenefitHandler);
tierRouter.delete('/benefits/:benefitId', adminOnly, deleteTierBenefitHandler);

export default tierRouter;
// End of File: backend/src/routes/tiers.routes.ts