// backend/src/routes/superadmin.routes.ts (CORREGIDO)
import { Router } from 'express';
import { UserRole } from '@prisma/client';
// --- RUTAS CORREGIDAS ---
import { authenticateToken } from '../shared/middleware/auth.middleware';
import { checkRole } from '../shared/middleware/role.middleware';
import {
    getAllBusinessesHandler,
    toggleBusinessStatusHandler,
    toggleLoyaltyCoreModuleHandler,
    toggleCamareroModuleHandler,
    setSubscriptionPriceHandler,
    recordPaymentHandler,
    getPaymentHistoryHandler,
    impersonationHandler,
    getPendingPeriodsHandler
} from '../modules/superadmin/superadmin.controller';
// --- FIN RUTAS CORREGIDAS ---


const router = Router();

// Middleware para todas las rutas de superadmin
router.use(authenticateToken);
router.use(checkRole([UserRole.SUPER_ADMIN]));

// Rutas de Superadmin (sin cambios en la lógica)
router.get('/businesses', getAllBusinessesHandler);
router.patch('/businesses/:businessId/status', toggleBusinessStatusHandler);
router.patch('/businesses/:businessId/module-loyaltycore', toggleLoyaltyCoreModuleHandler);
router.patch('/businesses/:businessId/module-camarero', toggleCamareroModuleHandler);
router.put('/businesses/:businessId/subscription', setSubscriptionPriceHandler);
router.post('/businesses/:businessId/payments', recordPaymentHandler);
router.get('/businesses/:businessId/payments', getPaymentHistoryHandler);
router.get('/businesses/:businessId/pending-payments', getPendingPeriodsHandler);
router.post('/impersonate/:userId', impersonationHandler);

export default router;