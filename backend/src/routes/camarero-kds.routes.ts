// backend/src/routes/camarero-kds.routes.ts
import { Router } from 'express';
import { authenticateToken } from '../middleware/auth.middleware';
import { checkRole } from '../middleware/role.middleware';
import { checkModuleActive } from '../middleware/module.middleware';
import { UserRole } from '@prisma/client';

// Importar los handlers del controlador KDS
import {
    getItemsForKdsHandler,
    updateOrderItemStatusHandler
} from '../camarero/kds.controller'; // Ajusta la ruta si es necesario

const camareroKdsRouter = Router();

// Middlewares que se aplicarán a todas las rutas definidas en este router:
// 1. Autenticación: Asegura que hay un token válido y req.user está poblado.
camareroKdsRouter.use(authenticateToken);

// 2. Módulo Activo: Asegura que el módulo 'CAMARERO' está activo para el negocio.
camareroKdsRouter.use(checkModuleActive('CAMARERO'));

// 3. Roles Permitidos: Solo personal de cocina, barra o el admin del negocio pueden acceder.
//    Si tienes roles más específicos como KITCHEN_STAFF, BAR_STAFF, inclúyelos.
//    BUSINESS_ADMIN podría tener acceso para supervisión o configuración inicial.
camareroKdsRouter.use(checkRole([
    UserRole.KITCHEN_STAFF,
    UserRole.BAR_STAFF,
    UserRole.BUSINESS_ADMIN 
    // UserRole.WAITER // Considera si el camarero necesita acceso a alguna parte del KDS
]));


// --- Definición de Rutas para KDS ---

// GET /api/camarero/kds/items
// Obtiene los ítems de pedido para un destino KDS
camareroKdsRouter.get('/items', getItemsForKdsHandler);

// PATCH /api/camarero/kds/items/:orderItemId/status
// Actualiza el estado de un ítem de pedido específico
camareroKdsRouter.patch('/items/:orderItemId/status', updateOrderItemStatusHandler);


// Placeholder para la raíz de /api/camarero/kds (opcional)
camareroKdsRouter.get('/', (req, res) => {
    res.json({ 
        message: `[KDS API] Endpoints KDS para el negocio: ${req.user?.businessId}. Roles del usuario: ${req.user?.role}` 
    });
});

export default camareroKdsRouter;