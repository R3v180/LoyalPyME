// File: backend/src/routes/admin.routes.ts
// Version: 1.6.0 (Update controller import path after refactoring)

import { Router } from 'express';
import { UserRole } from '@prisma/client';

// Middlewares (sin cambios)
import { authenticateToken } from '../middleware/auth.middleware'; // authenticateToken se aplica en index.ts globalmente a /api, podrÃ­a quitarse de aquÃ­
import { checkRole } from '../middleware/role.middleware';

// --- CORRECCIÃ“N: Importar handlers desde la nueva ubicaciÃ³n ---
import {
    getAdminCustomers,
    adjustCustomerPoints,
    changeCustomerTierHandler,
    assignRewardHandler,
    toggleFavoriteHandler
} from '../customer/admin-customer.controller'; // Ruta actualizada a la carpeta admin
// --- FIN CORRECCIÃ“N ---

const router = Router();

// --- Rutas especÃ­ficas de Admin relacionadas con Clientes ---
// Nota: authenticateToken se aplica globalmente en index.ts a /api,
// por lo que no es estrictamente necesario aplicarlo de nuevo aquÃ­.
// Lo mantenemos por claridad o por si se cambia el montaje global.

// GET /customers
router.get(
    '/customers',
    // authenticateToken, // Redundante si se aplica globalmente
    checkRole([UserRole.BUSINESS_ADMIN]),
    getAdminCustomers
);

// POST /customers/:customerId/adjust-points
router.post(
    '/customers/:customerId/adjust-points',
    // authenticateToken, // Redundante
    checkRole([UserRole.BUSINESS_ADMIN]),
    adjustCustomerPoints
);

// PUT /customers/:customerId/tier
router.put(
    '/customers/:customerId/tier',
    // authenticateToken, // Redundante
    checkRole([UserRole.BUSINESS_ADMIN]),
    changeCustomerTierHandler
);

// POST /customers/:customerId/assign-reward
router.post(
    '/customers/:customerId/assign-reward',
    // authenticateToken, // Redundante
    checkRole([UserRole.BUSINESS_ADMIN]),
    assignRewardHandler
);

// PATCH /customers/:customerId/toggle-favorite
router.patch(
    '/customers/:customerId/toggle-favorite',
    // authenticateToken, // Redundante
    checkRole([UserRole.BUSINESS_ADMIN]),
    toggleFavoriteHandler
);


export default router;

// End of File