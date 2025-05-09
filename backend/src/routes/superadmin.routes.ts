// backend/src/routes/superadmin.routes.ts
import { Router } from 'express';
import { authenticateToken } from '../middleware/auth.middleware';
import { checkRole } from '../middleware/role.middleware';
import { UserRole } from '@prisma/client';

// --- CAMBIO: Importar los handlers reales del controlador ---
import {
    getAllBusinessesHandler,
    toggleBusinessStatusHandler,
    toggleLoyaltyCoreModuleHandler,
    toggleCamareroModuleHandler
} from '../superadmin/superadmin.controller'; // Ahora importamos desde el archivo creado
// --- FIN CAMBIO ---

const router = Router();

// Middleware para todas las rutas de superadmin: autenticación y rol SUPER_ADMIN
router.use(authenticateToken);
router.use(checkRole([UserRole.SUPER_ADMIN]));

// --- CAMBIO: Usar los handlers importados ---
router.get('/businesses', getAllBusinessesHandler);
router.patch('/businesses/:businessId/status', toggleBusinessStatusHandler);
router.patch('/businesses/:businessId/module-loyaltycore', toggleLoyaltyCoreModuleHandler);
router.patch('/businesses/:businessId/module-camarero', toggleCamareroModuleHandler);
// --- FIN CAMBIO ---

export default router;