// File: backend/src/routes/admin.routes.ts
// Version: 2.0.0 (Add route for bulk updating customer status)

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
    getCustomerDetailsHandler,
    updateCustomerNotesHandler,
    bulkUpdateCustomerStatusHandler // <-- Importar el nuevo handler
} from '../customer/admin-customer.controller'; // Asegúrate que esta ruta es correcta

const router = Router();

// --- Rutas específicas de Admin relacionadas con Clientes ---

// --- Rutas para Clientes Individuales ---
// GET /customers (Lista)
router.get('/customers', checkRole([UserRole.BUSINESS_ADMIN]), getAdminCustomers);
// GET /customers/:customerId/details (Detalles)
router.get('/customers/:customerId/details', checkRole([UserRole.BUSINESS_ADMIN]), getCustomerDetailsHandler);
// PATCH /customers/:customerId/notes (Actualizar notas)
router.patch('/customers/:customerId/notes', checkRole([UserRole.BUSINESS_ADMIN]), updateCustomerNotesHandler);
// POST /customers/:customerId/adjust-points (Ajustar puntos)
router.post('/customers/:customerId/adjust-points', checkRole([UserRole.BUSINESS_ADMIN]), adjustCustomerPoints);
// PUT /customers/:customerId/tier (Cambiar nivel)
router.put('/customers/:customerId/tier', checkRole([UserRole.BUSINESS_ADMIN]), changeCustomerTierHandler);
// POST /customers/:customerId/assign-reward (Asignar regalo)
router.post('/customers/:customerId/assign-reward', checkRole([UserRole.BUSINESS_ADMIN]), assignRewardHandler);
// PATCH /customers/:customerId/toggle-favorite (Marcar favorito)
router.patch('/customers/:customerId/toggle-favorite', checkRole([UserRole.BUSINESS_ADMIN]), toggleFavoriteHandler);
// PATCH /customers/:customerId/toggle-active (Activar/Desactivar)
router.patch('/customers/:customerId/toggle-active', checkRole([UserRole.BUSINESS_ADMIN]), toggleActiveStatusHandler);

// --- Rutas para Acciones Masivas sobre Clientes ---

// PATCH /customers/bulk-status (Activar/Desactivar varios clientes)
router.patch(
    '/customers/bulk-status',
    checkRole([UserRole.BUSINESS_ADMIN]),   // Solo admins
    bulkUpdateCustomerStatusHandler         // Nuevo handler a implementar
);
// TODO: Añadir aquí futuras rutas para acciones masivas (bulk delete, bulk points, etc.)


export default router;

// End of File