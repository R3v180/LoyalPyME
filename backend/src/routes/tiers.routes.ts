// filename: backend/src/routes/tiers.routes.ts
// Version: 2.0.0 (Update handler imports after controller refactoring)

import { Router } from 'express';
import { checkRole } from '../middleware/role.middleware';
import { UserRole } from '@prisma/client';

// --- NUEVO: Importar handlers desde los controladores especÃ­ficos ---
import { getBusinessTierConfigHandler, updateBusinessTierConfigHandler } from '../tiers/tier-config.controller';
import { createTierHandler, getBusinessTiersHandler, getTierByIdHandler, updateTierHandler, deleteTierHandler } from '../tiers/tier-crud.controller';
import { createTierBenefitHandler, getTierBenefitsHandler, updateTierBenefitHandler, deleteTierBenefitHandler } from '../tiers/tier-benefit.controller';
// --- FIN NUEVO ---

const tierRouter = Router();

// Middleware array solo para rol (asumiendo que authenticateToken se aplica globalmente)
const adminOnly = [checkRole([UserRole.BUSINESS_ADMIN])];

// --- Rutas de AdministraciÃ³n (Requieren rol BUSINESS_ADMIN) ---

// Rutas para ConfiguraciÃ³n del Negocio (usan tier-config.controller)
tierRouter.get('/config', adminOnly, getBusinessTierConfigHandler);
tierRouter.put('/config', adminOnly, updateBusinessTierConfigHandler);

// Rutas para Tiers (usan tier-crud.controller)
tierRouter.post('/tiers', adminOnly, createTierHandler);
tierRouter.get('/tiers', adminOnly, getBusinessTiersHandler); // Lista Tiers del negocio
tierRouter.get('/tiers/:tierId', adminOnly, getTierByIdHandler);
tierRouter.put('/tiers/:tierId', adminOnly, updateTierHandler);
tierRouter.delete('/tiers/:tierId', adminOnly, deleteTierHandler);

// Rutas para Beneficios (usan tier-benefit.controller)
tierRouter.post('/tiers/:tierId/benefits', adminOnly, createTierBenefitHandler); // Crear beneficio para un Tier
tierRouter.get('/tiers/:tierId/benefits', adminOnly, getTierBenefitsHandler); // Obtener beneficios de un Tier
tierRouter.put('/benefits/:benefitId', adminOnly, updateTierBenefitHandler); // Actualizar beneficio por su ID
tierRouter.delete('/benefits/:benefitId', adminOnly, deleteTierBenefitHandler); // Eliminar beneficio por su ID

// --- Rutas de Cliente ---
// La ruta GET /customer/tiers fue MOVIDA a customer.routes.ts

export default tierRouter;

// End of File: backend/src/routes/tiers.routes.ts