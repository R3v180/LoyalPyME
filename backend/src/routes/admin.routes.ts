// filename: backend/src/routes/admin.routes.ts
// Version: 1.2.0 (Add route PUT /customers/:customerId/tier)

import { Router } from 'express';
import { UserRole } from '@prisma/client';

// Middlewares
import { authenticateToken } from '../middleware/auth.middleware';
import { checkRole } from '../middleware/role.middleware';

// Controladores (Importamos los 3 handlers del customer controller ahora)
import {
    getAdminCustomers,
    adjustCustomerPoints,
    changeCustomerTierHandler // <-- Añadida esta importación
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

// --- NUEVA RUTA AÑADIDA ---
// PUT /customers/:customerId/tier - Cambiar manualmente el tier de un cliente
// Usamos PUT porque estamos reemplazando/estableciendo el valor del tier para ese cliente.
router.put(
    '/customers/:customerId/tier',    // Path con parámetro :customerId
    authenticateToken,                 // 1. Requiere login
    checkRole([UserRole.BUSINESS_ADMIN]), // 2. Requiere rol admin
    changeCustomerTierHandler          // 3. Llama al controlador correspondiente
);
// --- FIN NUEVA RUTA ---


// Aquí podríamos añadir otras rutas de admin en el futuro

export default router;