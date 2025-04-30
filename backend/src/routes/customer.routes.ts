// filename: backend/src/routes/customer.routes.ts
// Version: 1.6.0 (Add route for customer to get business config)

import { Router } from 'express';
import { UserRole } from '@prisma/client';

// Importar Middleware necesario
import { checkRole } from '../middleware/role.middleware';
// ASUNCIÓN: authenticateToken se aplica ANTES en index.ts al montar en /api/customer

// Importar los handlers necesarios de customer.controller.ts
import {
    getCustomerRewardsHandler,
    getPendingGrantedRewardsHandler,
    redeemGrantedRewardHandler,
    getCustomerTiersHandler,
    // --- NUEVO: Importar el futuro handler ---
    getCustomerBusinessConfigHandler // Aún no existe, lo crearemos después
    // --- FIN NUEVO ---
} from '../customer/customer.controller';


const router = Router();

// --- Rutas específicas para Clientes (montadas bajo /api/customer) ---

// GET /rewards - Obtener recompensas activas para el negocio del cliente
// URL Final: GET /api/customer/rewards
router.get(
    '/rewards',
    checkRole([UserRole.CUSTOMER_FINAL]), // Solo clientes
    getCustomerRewardsHandler
);

// GET /granted-rewards - Obtener las recompensas regaladas pendientes
// URL Final: GET /api/customer/granted-rewards
router.get(
    '/granted-rewards',
    checkRole([UserRole.CUSTOMER_FINAL]), // Solo clientes
    getPendingGrantedRewardsHandler
);

// POST /granted-rewards/:grantedRewardId/redeem - Canjear una recompensa otorgada específica
// URL Final: POST /api/customer/granted-rewards/:grantedRewardId/redeem
router.post(
    '/granted-rewards/:grantedRewardId/redeem',
    checkRole([UserRole.CUSTOMER_FINAL]), // Solo clientes
    redeemGrantedRewardHandler
);

// GET /tiers - Obtener los tiers disponibles para el cliente
// URL Final: GET /api/customer/tiers
router.get(
    '/tiers',
    checkRole([UserRole.CUSTOMER_FINAL]), // Solo clientes
    getCustomerTiersHandler
);

// --- NUEVA RUTA ---
// GET /business-config - Obtener configuración relevante del negocio para el cliente
// URL Final: GET /api/customer/business-config
router.get(
    '/business-config',
    checkRole([UserRole.CUSTOMER_FINAL]), // Solo clientes
    getCustomerBusinessConfigHandler // Handler a crear
);
// --- FIN NUEVA RUTA ---


// Otras rutas de cliente irían aquí

export default router;

// End of File: backend/src/routes/customer.routes.ts