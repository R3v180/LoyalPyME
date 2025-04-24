// filename: backend/src/routes/admin.routes.ts
// Version: 1.1.0 (RESTORED - Original POST route definition)

import { Router } from 'express';
import { UserRole } from '@prisma/client';

// Middlewares
import { authenticateToken } from '../middleware/auth.middleware';
import { checkRole } from '../middleware/role.middleware';

// Controladores
import { getAdminCustomers, adjustCustomerPoints } from '../customer/customer.controller';

const router = Router();

// --- Rutas específicas de Admin relacionadas con Clientes ---

// GET /customers
router.get(
    '/customers',
    authenticateToken,
    checkRole([UserRole.BUSINESS_ADMIN]),
    getAdminCustomers
);

// POST /customers/:customerId/adjust-points (Restaurado a la versión original)
router.post(
    '/customers/:customerId/adjust-points',
    authenticateToken,
    checkRole([UserRole.BUSINESS_ADMIN]),
    adjustCustomerPoints
);

export default router;