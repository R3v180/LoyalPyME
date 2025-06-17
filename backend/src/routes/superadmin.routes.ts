// backend/src/routes/superadmin.routes.ts
import { Router } from 'express';
import { authenticateToken } from '../middleware/auth.middleware';
import { checkRole } from '../middleware/role.middleware';
import { UserRole } from '@prisma/client';

// Importar todos los handlers del controlador de superadmin
import {
    getAllBusinessesHandler,
    toggleBusinessStatusHandler,
    toggleLoyaltyCoreModuleHandler,
    toggleCamareroModuleHandler,
    setSubscriptionPriceHandler,
    recordPaymentHandler,
    getPaymentHistoryHandler,
    impersonationHandler,
    // --- NUEVO HANDLER IMPORTADO ---
    getPendingPeriodsHandler
} from '../superadmin/superadmin.controller';

const router = Router();

// Middleware para todas las rutas de superadmin: autenticación y rol SUPER_ADMIN
router.use(authenticateToken);
router.use(checkRole([UserRole.SUPER_ADMIN]));

// --- Rutas existentes para gestión de Negocios y Módulos ---
router.get('/businesses', getAllBusinessesHandler);
router.patch('/businesses/:businessId/status', toggleBusinessStatusHandler);
router.patch('/businesses/:businessId/module-loyaltycore', toggleLoyaltyCoreModuleHandler);
router.patch('/businesses/:businessId/module-camarero', toggleCamareroModuleHandler);

// --- Rutas para Pagos y Suscripciones ---
router.put('/businesses/:businessId/subscription', setSubscriptionPriceHandler);
router.post('/businesses/:businessId/payments', recordPaymentHandler);
router.get('/businesses/:businessId/payments', getPaymentHistoryHandler);

// --- NUEVA RUTA AÑADIDA ---
router.get('/businesses/:businessId/pending-payments', getPendingPeriodsHandler);


// --- Ruta para Suplantación de Identidad ---
router.post('/impersonate/:userId', impersonationHandler);


export default router;