// File: backend/src/routes/admin.routes.ts
// Version: 1.8.2 (Restore checkRole for details route)

import { Router } from 'express';
import { UserRole } from '@prisma/client';

// Middlewares
import { checkRole } from '../middleware/role.middleware';

// Importar handlers desde la ubicación correcta
import {
    getAdminCustomers,
    adjustCustomerPoints,
    changeCustomerTierHandler,
    assignRewardHandler,
    toggleFavoriteHandler,
    toggleActiveStatusHandler,
    getCustomerDetailsHandler
} from '../customer/admin-customer.controller'; // Asegúrate que esta ruta es correcta

const router = Router();

// --- Rutas específicas de Admin relacionadas con Clientes ---

// GET /customers (Lista)
router.get(
    '/customers',
    checkRole([UserRole.BUSINESS_ADMIN]),
    getAdminCustomers
);

// GET /customers/:customerId/details (Detalles de un cliente)
router.get(
    '/customers/:customerId/details',
    checkRole([UserRole.BUSINESS_ADMIN]), // <-- Middleware DESCOMENTADO de nuevo
    getCustomerDetailsHandler
);

// POST /customers/:customerId/adjust-points
router.post(
    '/customers/:customerId/adjust-points',
    checkRole([UserRole.BUSINESS_ADMIN]),
    adjustCustomerPoints
);

// PUT /customers/:customerId/tier
router.put(
    '/customers/:customerId/tier',
    checkRole([UserRole.BUSINESS_ADMIN]),
    changeCustomerTierHandler
);

// POST /customers/:customerId/assign-reward
router.post(
    '/customers/:customerId/assign-reward',
    checkRole([UserRole.BUSINESS_ADMIN]),
    assignRewardHandler
);

// PATCH /customers/:customerId/toggle-favorite
router.patch(
    '/customers/:customerId/toggle-favorite',
    checkRole([UserRole.BUSINESS_ADMIN]),
    toggleFavoriteHandler
);

// PATCH /customers/:customerId/toggle-active
router.patch(
    '/customers/:customerId/toggle-active',
    checkRole([UserRole.BUSINESS_ADMIN]),
    toggleActiveStatusHandler
);


export default router;

// End of File