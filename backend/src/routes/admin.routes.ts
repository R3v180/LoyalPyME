// filename: backend/src/routes/admin.routes.ts
// Version: 2.3.0 (Add route for overview stats)

import { Router } from 'express';
import { UserRole } from '@prisma/client';

// Middlewares
import { checkRole } from '../middleware/role.middleware';

// Importar handlers de gestión de clientes (existentes)
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
    bulkAdjustPointsHandler
} from '../customer/admin-customer.controller'; // Asegúrate que esta ruta es correcta

// --- NUEVA IMPORTACIÓN ---
// Importar el nuevo handler para las estadísticas
import { handleGetOverviewStats } from '../admin/admin-stats.controller';
// --- FIN NUEVA IMPORTACIÓN ---

const router = Router();

// Middleware de Rol Admin aplicado a todas las rutas definidas aquí
// (checkRole se aplica en cada ruta individualmente para claridad)
const adminOnly = checkRole([UserRole.BUSINESS_ADMIN]);

// --- NUEVA RUTA PARA ESTADÍSTICAS ---
// GET /api/admin/stats/overview - Obtener estadísticas para el dashboard
router.get(
    '/stats/overview',        // Ruta relativa a /api/admin
    adminOnly,                // Middleware para asegurar que es admin
    handleGetOverviewStats    // Handler del controlador que creamos
);
// --- FIN NUEVA RUTA ---


// --- Rutas existentes específicas de Admin relacionadas con Clientes ---

// --- Rutas para Clientes Individuales ---
router.get('/customers', adminOnly, getAdminCustomers);
router.get('/customers/:customerId/details', adminOnly, getCustomerDetailsHandler);
router.patch('/customers/:customerId/notes', adminOnly, updateCustomerNotesHandler);
router.post('/customers/:customerId/adjust-points', adminOnly, adjustCustomerPoints);
router.put('/customers/:customerId/tier', adminOnly, changeCustomerTierHandler);
router.post('/customers/:customerId/assign-reward', adminOnly, assignRewardHandler);
router.patch('/customers/:customerId/toggle-favorite', adminOnly, toggleFavoriteHandler);
router.patch('/customers/:customerId/toggle-active', adminOnly, toggleActiveStatusHandler);

// --- Rutas para Acciones Masivas sobre Clientes ---
router.patch('/customers/bulk-status', adminOnly, bulkUpdateCustomerStatusHandler);
router.delete('/customers/bulk-delete', adminOnly, bulkDeleteCustomersHandler);
router.post('/customers/bulk-adjust-points', adminOnly, bulkAdjustPointsHandler);


export default router;

// End of file: backend/src/routes/admin.routes.ts