// filename: backend/src/routes/customer.routes.ts
// Version: 1.5.1 (Remove meta-comments)

import { Router } from 'express';
import { UserRole } from '@prisma/client';

// Importar Middleware necesario
import { checkRole } from '../middleware/role.middleware';
// ASUNCIÓN: authenticateToken se aplica ANTES en index.ts al montar en /api/customer

// Importar los handlers necesarios de customer.controller.ts
// (Asegúrate de que este archivo contiene los 4 handlers)
import {
    getCustomerRewardsHandler,
    getPendingGrantedRewardsHandler,
    redeemGrantedRewardHandler,
    getCustomerTiersHandler // <-- Handler movido desde tiers.controller
} from '../customer/customer.controller'; // Importar desde el controlador de cliente


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
    '/tiers', // Ruta relativa al punto de montaje /api/customer
    checkRole([UserRole.CUSTOMER_FINAL]), // Solo clientes
    getCustomerTiersHandler           // Handler que movimos a customer.controller
);

// Otras rutas de cliente irían aquí

export default router;

// End of File: backend/src/routes/customer.routes.ts