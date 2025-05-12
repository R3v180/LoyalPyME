// filename: backend/src/routes/customer.routes.ts
// Version: 1.6.1 (Mount activityRouter)

import { Router } from 'express';
import { UserRole } from '@prisma/client';

// Importar Middleware necesario
import { checkRole } from '../middleware/role.middleware';

// Importar los handlers necesarios de customer.controller.ts
import {
    getCustomerRewardsHandler,
    getPendingGrantedRewardsHandler,
    redeemGrantedRewardHandler,
    getCustomerTiersHandler,
    getCustomerBusinessConfigHandler
} from '../customer/customer.controller';

// --- AÑADIR ESTA IMPORTACIÓN ---
import activityRouter from './activity.routes'; // Asegúrate que la ruta sea correcta
// --- FIN AÑADIR ---

const router = Router();

// --- Rutas específicas para Clientes (montadas bajo /api/customer) ---

router.get(
    '/rewards',
    checkRole([UserRole.CUSTOMER_FINAL]),
    getCustomerRewardsHandler
);

router.get(
    '/granted-rewards',
    checkRole([UserRole.CUSTOMER_FINAL]),
    getPendingGrantedRewardsHandler
);

router.post(
    '/granted-rewards/:grantedRewardId/redeem',
    checkRole([UserRole.CUSTOMER_FINAL]),
    redeemGrantedRewardHandler
);

router.get(
    '/tiers',
    checkRole([UserRole.CUSTOMER_FINAL]),
    getCustomerTiersHandler
);

router.get(
    '/business-config',
    checkRole([UserRole.CUSTOMER_FINAL]),
    getCustomerBusinessConfigHandler
);

// --- AÑADIR ESTA LÍNEA PARA MONTAR EL ROUTER DE ACTIVIDAD ---
// Esto hará que las rutas definidas en activityRouter (como GET /)
// estén disponibles bajo /api/customer/activity
router.use('/activity', checkRole([UserRole.CUSTOMER_FINAL]), activityRouter);
// --- FIN AÑADIR ---


export default router;

// End of File: backend/src/routes/customer.routes.ts