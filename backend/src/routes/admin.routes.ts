// backend/src/routes/admin.routes.ts (CORREGIDO)

import { Router } from 'express';
// UserRole no es necesario aquí si checkRole no se usa directamente
// import { UserRole } from '@prisma/client';

// --- RUTAS DE MIDDLEWARE CORREGIDAS ---
import { checkRole } from '../shared/middleware/role.middleware';
import upload from '../shared/middleware/multer.config';

// --- RUTAS DE CONTROLADORES CORREGIDAS ---
import { getAdminCustomers } from '../modules/loyalpyme/admin/admin-customer-list.controller';
import {
    getCustomerDetailsHandler,
    updateCustomerNotesHandler,
    adjustCustomerPoints,
    changeCustomerTierHandler,
    assignRewardHandler,
    toggleFavoriteHandler,
    toggleActiveStatusHandler
} from '../modules/loyalpyme/admin/admin-customer-individual.controller';
import {
    bulkUpdateCustomerStatusHandler,
    bulkDeleteCustomersHandler,
    bulkAdjustPointsHandler
} from '../modules/loyalpyme/admin/admin-customer-bulk.controller';
import { handleGetOverviewStats } from '../modules/loyalpyme/admin/admin-stats.controller';
import { handleImageUpload } from '../shared/uploads/uploads.controller';


const router = Router();

// NOTA: El middleware checkRole([UserRole.BUSINESS_ADMIN]) se aplica en /src/routes/index.ts
// antes de montar este router, por lo que no es necesario volver a aplicarlo aquí.

// Ruta para Estadísticas
router.get('/stats/overview', handleGetOverviewStats);

// --- Rutas específicas de Admin relacionadas con Clientes (sin cambios en la lógica) ---
router.get('/customers', getAdminCustomers);
router.get('/customers/:customerId/details', getCustomerDetailsHandler);
router.patch('/customers/:customerId/notes', updateCustomerNotesHandler);
router.post('/customers/:customerId/adjust-points', adjustCustomerPoints);
router.put('/customers/:customerId/tier', changeCustomerTierHandler);
router.post('/customers/:customerId/assign-reward', assignRewardHandler);
router.patch('/customers/:customerId/toggle-favorite', toggleFavoriteHandler);
router.patch('/customers/:customerId/toggle-active', toggleActiveStatusHandler);
router.patch('/customers/bulk-status', bulkUpdateCustomerStatusHandler);
router.delete('/customers/bulk-delete', bulkDeleteCustomersHandler);
router.post('/customers/bulk-adjust-points', bulkAdjustPointsHandler);

// Ruta para subida de imagen de recompensa
router.post(
    '/upload/reward-image',
    upload.single('imageFile'),
    handleImageUpload
);

export default router;