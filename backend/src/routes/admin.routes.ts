// File: backend/src/routes/admin.routes.ts
// Version: 1.7.0 (Add route for toggle active status)

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
    toggleActiveStatusHandler // <-- Importar el nuevo handler
} from '../customer/admin-customer.controller'; // Ruta actualizada

const router = Router();

// --- Rutas específicas de Admin relacionadas con Clientes ---
// Nota: checkRole se asegura que solo BUSINESS_ADMIN accede a estas rutas

// GET /customers
router.get(
    '/customers',
    checkRole([UserRole.BUSINESS_ADMIN]),
    getAdminCustomers
);

// POST /customers/:customerId/adjust-points
router.post(
    '/customers/:customerId/adjust-points',
    checkRole([UserRole.BUSINESS_ADMIN]),
    adjustCustomerPoints // Ojo: tu versión tenía adjustCustomerPoints, asegúrate que el nombre es correcto
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

// --- NUEVA RUTA ---
// PATCH /customers/:customerId/toggle-active
router.patch(
    '/customers/:customerId/toggle-active',      // Método PATCH para actualizar parcialmente
    checkRole([UserRole.BUSINESS_ADMIN]),         // Solo admins
    toggleActiveStatusHandler                     // Nuevo handler a implementar
);
// --- FIN NUEVA RUTA ---


export default router;

// End of File