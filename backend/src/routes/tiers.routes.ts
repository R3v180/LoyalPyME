// File: backend/src/routes/tiers.routes.ts
// Version: 1.0.0 (Initial routes for Tier management and viewing)

import { Router } from 'express';
import { authenticateToken } from '../middleware/auth.middleware';
import { checkRole } from '../middleware/role.middleware';
import { UserRole } from '@prisma/client'; // Importar enum de roles

// Importar todos los handlers del controlador
import * as TiersController from '../tiers/tiers.controller';

const tierRouter = Router();

// --- Rutas de Administración (Requieren rol BUSINESS_ADMIN) ---
const adminOnly = [authenticateToken, checkRole([UserRole.BUSINESS_ADMIN])];

// Rutas para Configuración del Negocio
tierRouter.get('/config', adminOnly, TiersController.getBusinessTierConfigHandler);
tierRouter.put('/config', adminOnly, TiersController.updateBusinessTierConfigHandler);

// Rutas para Tiers
tierRouter.post('/tiers', adminOnly, TiersController.createTierHandler);
tierRouter.get('/tiers', adminOnly, TiersController.getBusinessTiersHandler); // Lista Tiers del negocio
tierRouter.get('/tiers/:tierId', adminOnly, TiersController.getTierByIdHandler);
tierRouter.put('/tiers/:tierId', adminOnly, TiersController.updateTierHandler);
tierRouter.delete('/tiers/:tierId', adminOnly, TiersController.deleteTierHandler);

// Rutas para Beneficios (anidadas bajo tiers para creación/listado)
tierRouter.post('/tiers/:tierId/benefits', adminOnly, TiersController.createTierBenefitHandler);
tierRouter.get('/tiers/:tierId/benefits', adminOnly, TiersController.getTierBenefitsHandler);

// Rutas para Beneficios individuales (actualizar/eliminar por ID de beneficio)
// Usamos una ruta separada para simplificar, aunque podría anidarse más
tierRouter.put('/benefits/:benefitId', adminOnly, TiersController.updateTierBenefitHandler);
tierRouter.delete('/benefits/:benefitId', adminOnly, TiersController.deleteTierBenefitHandler);


// --- Rutas de Cliente (Requieren rol CUSTOMER_FINAL) ---
const customerOnly = [authenticateToken, checkRole([UserRole.CUSTOMER_FINAL])];

// Ruta para que el cliente vea los Tiers disponibles en su programa
tierRouter.get('/customer/tiers', customerOnly, TiersController.getCustomerTiersHandler);


export default tierRouter;

// End of File: backend/src/routes/tiers.routes.ts