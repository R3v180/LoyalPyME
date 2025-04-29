// filename: backend/src/routes/admin.routes.ts
// Version: 2.3.2 (Remove meta-comments)

import { Router } from 'express';
import { UserRole } from '@prisma/client';

// Middlewares
import { checkRole } from '../middleware/role.middleware';

// Importar handlers desde los controladores específicos en src/admin
import { getAdminCustomers } from '../admin/admin-customer-list.controller';
import {
    getCustomerDetailsHandler,
    updateCustomerNotesHandler,
    adjustCustomerPoints,
    changeCustomerTierHandler,
    assignRewardHandler,
    toggleFavoriteHandler,
    toggleActiveStatusHandler
} from '../admin/admin-customer-individual.controller';
import {
    bulkUpdateCustomerStatusHandler,
    bulkDeleteCustomersHandler,
    bulkAdjustPointsHandler
} from '../admin/admin-customer-bulk.controller';

// Importar handler de estadísticas
import { handleGetOverviewStats } from '../admin/admin-stats.controller';


const router = Router();

// Middleware de Rol Admin aplicado a todas las rutas definidas aquí
const adminOnly = checkRole([UserRole.BUSINESS_ADMIN]);

// Ruta para Estadísticas
router.get(
    '/stats/overview',
    adminOnly,
    handleGetOverviewStats
);

// --- Rutas específicas de Admin relacionadas con Clientes ---

// GET /customers (Listar)
router.get('/customers', adminOnly, getAdminCustomers); // Usa handler de -list.controller

// Rutas para Clientes Individuales (usando :customerId)
router.get('/customers/:customerId/details', adminOnly, getCustomerDetailsHandler); // Usa handler de -individual.controller
router.patch('/customers/:customerId/notes', adminOnly, updateCustomerNotesHandler); // Usa handler de -individual.controller
router.post('/customers/:customerId/adjust-points', adminOnly, adjustCustomerPoints); // Usa handler de -individual.controller
router.put('/customers/:customerId/tier', adminOnly, changeCustomerTierHandler); // Usa handler de -individual.controller
router.post('/customers/:customerId/assign-reward', adminOnly, assignRewardHandler); // Usa handler de -individual.controller
router.patch('/customers/:customerId/toggle-favorite', adminOnly, toggleFavoriteHandler); // Usa handler de -individual.controller
router.patch('/customers/:customerId/toggle-active', adminOnly, toggleActiveStatusHandler); // Usa handler de -individual.controller

// Rutas para Acciones Masivas sobre Clientes
router.patch('/customers/bulk-status', adminOnly, bulkUpdateCustomerStatusHandler); // Usa handler de -bulk.controller
router.delete('/customers/bulk-delete', adminOnly, bulkDeleteCustomersHandler); // Usa handler de -bulk.controller
router.post('/customers/bulk-adjust-points', adminOnly, bulkAdjustPointsHandler); // Usa handler de -bulk.controller


export default router;

// End of file: backend/src/routes/admin.routes.ts