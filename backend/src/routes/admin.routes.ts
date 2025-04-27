// File: backend/src/routes/admin.routes.ts
// Version: 2.2.0 (Add route for bulk adjusting customer points)

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
    bulkUpdateCustomerStatusHandler,
    bulkDeleteCustomersHandler,
    bulkAdjustPointsHandler // <-- Importar el nuevo handler
} from '../customer/admin-customer.controller'; // Asegúrate que esta ruta es correcta

const router = Router();

// --- Rutas específicas de Admin relacionadas con Clientes ---

// --- Rutas para Clientes Individuales ---
router.get('/customers', checkRole([UserRole.BUSINESS_ADMIN]), getAdminCustomers);
router.get('/customers/:customerId/details', checkRole([UserRole.BUSINESS_ADMIN]), getCustomerDetailsHandler);
router.patch('/customers/:customerId/notes', checkRole([UserRole.BUSINESS_ADMIN]), updateCustomerNotesHandler);
router.post('/customers/:customerId/adjust-points', checkRole([UserRole.BUSINESS_ADMIN]), adjustCustomerPoints);
router.put('/customers/:customerId/tier', checkRole([UserRole.BUSINESS_ADMIN]), changeCustomerTierHandler);
router.post('/customers/:customerId/assign-reward', checkRole([UserRole.BUSINESS_ADMIN]), assignRewardHandler);
router.patch('/customers/:customerId/toggle-favorite', checkRole([UserRole.BUSINESS_ADMIN]), toggleFavoriteHandler);
router.patch('/customers/:customerId/toggle-active', checkRole([UserRole.BUSINESS_ADMIN]), toggleActiveStatusHandler);

// --- Rutas para Acciones Masivas sobre Clientes ---

// PATCH /customers/bulk-status (Activar/Desactivar varios clientes)
router.patch(
    '/customers/bulk-status',
    checkRole([UserRole.BUSINESS_ADMIN]),
    bulkUpdateCustomerStatusHandler
);

// DELETE /customers/bulk-delete (Eliminar varios clientes)
router.delete(
    '/customers/bulk-delete',
    checkRole([UserRole.BUSINESS_ADMIN]),
    bulkDeleteCustomersHandler
);

// --- NUEVA RUTA ---
// POST /customers/bulk-adjust-points (Ajustar puntos a varios clientes)
router.post(
    '/customers/bulk-adjust-points',
    checkRole([UserRole.BUSINESS_ADMIN]),   // Solo admins
    bulkAdjustPointsHandler                 // Nuevo handler a implementar
);
// --- FIN NUEVA RUTA ---

// TODO: Añadir aquí futuras rutas para otras acciones masivas si fueran necesarias


export default router;

// End of File