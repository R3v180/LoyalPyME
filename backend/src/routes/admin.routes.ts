// filename: backend/src/routes/admin.routes.ts
// Version: 2.4.0 (Add reward image upload route)

import { Router } from 'express';
import { UserRole } from '@prisma/client';

// Middlewares
import { checkRole } from '../middleware/role.middleware';
// --- NUEVO: Importar configuración de Multer ---
import upload from '../middleware/multer.config';
// --- FIN NUEVO ---


// Importar handlers desde los controladores específicos en src/admin
import { getAdminCustomers } from '../admin/admin-customer-list.controller';
import {
    getCustomerDetailsHandler, updateCustomerNotesHandler, adjustCustomerPoints,
    changeCustomerTierHandler, assignRewardHandler, toggleFavoriteHandler,
    toggleActiveStatusHandler
} from '../admin/admin-customer-individual.controller';
import {
    bulkUpdateCustomerStatusHandler, bulkDeleteCustomersHandler, bulkAdjustPointsHandler
} from '../admin/admin-customer-bulk.controller';
import { handleGetOverviewStats } from '../admin/admin-stats.controller';
// --- NUEVO: Importar handler de subida ---
import { handleImageUpload } from '../uploads/uploads.controller';
// --- FIN NUEVO ---


const router = Router();

// Middleware de Rol Admin aplicado globalmente a las rutas montadas bajo /api/admin en index.ts
// No es necesario aplicarlo de nuevo aquí a menos que queramos doble seguridad.
// const adminOnly = checkRole([UserRole.BUSINESS_ADMIN]); // Comentado si ya se aplica en index.ts

// Ruta para Estadísticas
router.get('/stats/overview', handleGetOverviewStats); // Asume adminOnly aplicado en index.ts

// --- Rutas específicas de Admin relacionadas con Clientes ---
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

// --- NUEVA RUTA PARA SUBIDA DE IMAGEN DE RECOMPENSA ---
router.post(
    '/upload/reward-image',    // Ruta final será POST /api/admin/upload/reward-image
    upload.single('imageFile'), // Middleware Multer: procesa un archivo del campo 'imageFile'
    handleImageUpload          // Controlador que maneja la subida a Cloudinary
);
// --- FIN NUEVA RUTA ---


export default router;

// End of file: backend/src/routes/admin.routes.ts