// File: backend/src/routes/customer.routes.ts
// Version: 1.2.0 (Remove admin route, keep only customer routes)

import { Router } from 'express';
import { UserRole } from '@prisma/client'; // UserRole sí se usa en checkRole aquí abajo

// Importar Middleware necesario para esta ruta
import { checkRole } from '../middleware/role.middleware';
// Asumimos que authenticateToken se aplica ANTES en index.ts al montar en /api/customer

// Importar SOLO los handlers necesarios para ESTE router (rutas de cliente)
import { getCustomerRewardsHandler } from '../customer/customer.controller';


const router = Router();

// --- Rutas específicas para Clientes ---

// GET /rewards - Obtener recompensas activas para el negocio del cliente
// La URL final será /api/customer/rewards (si se monta en /api/customer)
router.get(
    '/rewards',
    // authenticateToken, // Descomentar si NO se aplica antes globalmente
    checkRole([UserRole.CUSTOMER_FINAL]), // Solo accesible para clientes finales
    getCustomerRewardsHandler
);

// Otras rutas de cliente irían aquí

export default router;

// End of File: backend/src/routes/customer.routes.ts