// File: backend/src/routes/admin.routes.ts
// Version: 1.5.0 (Includes PATCH /customers/:customerId/toggle-favorite route)

import { Router } from 'express';
import { UserRole } from '@prisma/client';

// Middlewares
import { authenticateToken } from '../middleware/auth.middleware';
import { checkRole } from '../middleware/role.middleware';

// Controladores (Importa los 5 handlers necesarios)
import {
    getAdminCustomers,
    adjustCustomerPoints,
    changeCustomerTierHandler,
    assignRewardHandler,
    toggleFavoriteHandler // <-- Importación para el toggle
} from '../customer/customer.controller';

const router = Router();

// --- Rutas específicas de Admin relacionadas con Clientes ---

// GET /customers
router.get(
    '/customers',
    authenticateToken,
    checkRole([UserRole.BUSINESS_ADMIN]),
    getAdminCustomers
);

// POST /customers/:customerId/adjust-points
router.post(
    '/customers/:customerId/adjust-points',
    authenticateToken,
    checkRole([UserRole.BUSINESS_ADMIN]),
    adjustCustomerPoints
);

// PUT /customers/:customerId/tier
router.put(
    '/customers/:customerId/tier',
    authenticateToken,
    checkRole([UserRole.BUSINESS_ADMIN]),
    changeCustomerTierHandler
);

// POST /customers/:customerId/assign-reward
router.post(
    '/customers/:customerId/assign-reward',
    authenticateToken,
    checkRole([UserRole.BUSINESS_ADMIN]),
    assignRewardHandler
);

// PATCH /customers/:customerId/toggle-favorite <-- Ruta para el toggle
router.patch(
    '/customers/:customerId/toggle-favorite',
    authenticateToken,
    checkRole([UserRole.BUSINESS_ADMIN]),
    toggleFavoriteHandler // Llama al handler correcto
);


export default router;

// End of File