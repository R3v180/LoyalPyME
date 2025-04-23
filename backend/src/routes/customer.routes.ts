// File: backend/src/routes/customer.routes.ts
// Version: 1.0.0 (Initial routes for customer-specific actions)

import { Router } from 'express';
import { checkRole } from '../middleware/role.middleware';
import { UserRole } from '@prisma/client';

// Importar handlers (a crear) desde un futuro controlador de cliente
import { getCustomerRewardsHandler } from '../customer/customer.controller'; // <-- ¡OJO! Este archivo/función aún no existe

const router = Router();

// --- Rutas específicas para Clientes ---
// NOTA: El middleware authenticateToken se aplicará globalmente a /api/customer en index.ts

// GET /api/customer/rewards - Obtener recompensas activas para el negocio del cliente
router.get(
    '/rewards',
    checkRole([UserRole.CUSTOMER_FINAL]), // Solo accesible para clientes finales
    getCustomerRewardsHandler // Handler a crear en customer.controller.ts
);

// Aquí podríamos añadir otras rutas específicas para clientes en el futuro
// ej: GET /api/customer/profile-details, PUT /api/customer/profile, etc.

export default router;

// End of File: backend/src/routes/customer.routes.ts