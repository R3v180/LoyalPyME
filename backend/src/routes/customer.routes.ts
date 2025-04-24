// File: backend/src/routes/customer.routes.ts
// Version: 1.4.0 (Add POST /granted-rewards/:id/redeem route - FINAL)

import { Router } from 'express';
import { UserRole } from '@prisma/client';

// Importar Middleware necesario
import { checkRole } from '../middleware/role.middleware';
// ASUNCIÓN: authenticateToken se aplica ANTES en index.ts al montar en /api/customer

// Importar los handlers necesarios de customer.controller.ts
import {
    getCustomerRewardsHandler,
    getPendingGrantedRewardsHandler,
    redeemGrantedRewardHandler // <-- Añadida esta importación
} from '../customer/customer.controller';


const router = Router();

// --- Rutas específicas para Clientes (montadas bajo /api/customer) ---

// GET /rewards - Obtener recompensas activas para el negocio del cliente
router.get(
    '/rewards',
    checkRole([UserRole.CUSTOMER_FINAL]), // Solo clientes
    getCustomerRewardsHandler
);

// GET /granted-rewards - Obtener las recompensas regaladas pendientes
router.get(
    '/granted-rewards',
    checkRole([UserRole.CUSTOMER_FINAL]), // Solo clientes
    getPendingGrantedRewardsHandler
);

// --- **NUEVA RUTA AÑADIDA** ---
// POST /granted-rewards/:grantedRewardId/redeem - Canjear una recompensa otorgada específica
// La URL final será /api/customer/granted-rewards/:grantedRewardId/redeem
router.post(
    '/granted-rewards/:grantedRewardId/redeem', // Path con parámetro :grantedRewardId
    // authenticateToken, // Asumimos que ya está aplicado globalmente a /api/customer
    checkRole([UserRole.CUSTOMER_FINAL]),    // Solo clientes pueden canjear sus regalos
    redeemGrantedRewardHandler             // Llama al handler de canje que ya existe
);
// --- FIN NUEVA RUTA ---


// Otras rutas de cliente irían aquí

export default router;

// End of File: backend/src/routes/customer.routes.ts