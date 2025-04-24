// filename: backend/src/routes/admin.routes.ts
// Version: 1.4.0 (Add route POST /customers/:customerId/assign-reward)

import { Router } from 'express';
import { UserRole } from '@prisma/client';

// Middlewares
import { authenticateToken } from '../middleware/auth.middleware';
import { checkRole } from '../middleware/role.middleware';

// Controladores (Importamos TODOS los handlers de customer.controller)
import {
    getAdminCustomers,
    adjustCustomerPoints,
    changeCustomerTierHandler,
    assignRewardHandler // <-- Añadida esta importación
} from '../customer/customer.controller';

const router = Router();

// --- Rutas específicas de Admin relacionadas con Clientes ---

// GET /customers - Obtener la lista de clientes
router.get(
    '/customers',
    authenticateToken,
    checkRole([UserRole.BUSINESS_ADMIN]),
    getAdminCustomers
);

// POST /customers/:customerId/adjust-points - Ajustar puntos
router.post(
    '/customers/:customerId/adjust-points',
    authenticateToken,
    checkRole([UserRole.BUSINESS_ADMIN]),
    adjustCustomerPoints
);

// PUT /customers/:customerId/tier - Cambiar manualmente el tier
router.put(
    '/customers/:customerId/tier',
    authenticateToken,
    checkRole([UserRole.BUSINESS_ADMIN]),
    changeCustomerTierHandler
);

// --- NUEVA RUTA AÑADIDA ---
// POST /customers/:customerId/assign-reward - Asignar una recompensa como regalo
router.post(
    '/customers/:customerId/assign-reward', // Path con parámetro :customerId
    authenticateToken,                     // 1. Requiere login
    checkRole([UserRole.BUSINESS_ADMIN]),     // 2. Requiere rol admin
    assignRewardHandler                    // 3. Llama al controlador correspondiente
);
// --- FIN NUEVA RUTA ---


// Aquí podríamos añadir otras rutas de admin en el futuro

export default router;

// End of File