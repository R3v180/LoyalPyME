// backend/src/routes/camarero-admin.routes.ts
import { Router } from 'express';
import { authenticateToken } from '../middleware/auth.middleware';
import { checkRole } from '../middleware/role.middleware';
import { UserRole } from '@prisma/client';
import { checkModuleActive } from '../middleware/module.middleware';

// Controladores para Categorías
import {
    createMenuCategoryHandler,
    getMenuCategoriesHandler,
    getMenuCategoryByIdHandler,
    updateMenuCategoryHandler,
    deleteMenuCategoryHandler
} from '../camarero/admin-menu-category.controller';

// Controladores para Ítems
import {
    createMenuItemHandler,
    getMenuItemsByCategoryHandler,
    getMenuItemByIdHandler,
    updateMenuItemHandler,
    deleteMenuItemHandler
} from '../camarero/admin-menu-item.controller';

// --- NUEVO: Importar controladores para Modificadores ---
import {
    createModifierGroupHandler,
    getModifierGroupsByMenuItemHandler,
    updateModifierGroupHandler,
    deleteModifierGroupHandler,
    createModifierOptionHandler,
    getModifierOptionsByGroupHandler,
    updateModifierOptionHandler,
    deleteModifierOptionHandler
} from '../camarero/admin-modifier.controller';
// --- FIN NUEVO ---

const camareroAdminRouter = Router();

// Middlewares aplicados a TODAS las rutas definidas en este router:
camareroAdminRouter.use(authenticateToken);
camareroAdminRouter.use(checkRole([UserRole.BUSINESS_ADMIN]));
camareroAdminRouter.use(checkModuleActive('CAMARERO'));

// --- RUTAS PARA GESTIÓN DE CATEGORÍAS DEL MENÚ ---
const categoriesBase = '/menu/categories';
camareroAdminRouter.post(categoriesBase, createMenuCategoryHandler);
camareroAdminRouter.get(categoriesBase, getMenuCategoriesHandler);
camareroAdminRouter.get(`${categoriesBase}/:categoryId`, getMenuCategoryByIdHandler);
camareroAdminRouter.put(`${categoriesBase}/:categoryId`, updateMenuCategoryHandler);
camareroAdminRouter.patch(`${categoriesBase}/:categoryId`, updateMenuCategoryHandler);
camareroAdminRouter.delete(`${categoriesBase}/:categoryId`, deleteMenuCategoryHandler);

// --- RUTAS PARA GESTIÓN DE ÍTEMS DEL MENÚ ---
const itemsBaseRelative = '/items'; // Relativo a la categoría
const itemsBaseAbsolute = '/menu/items'; // Para acceder a un ítem directamente por su ID

camareroAdminRouter.post(`${categoriesBase}/:categoryId${itemsBaseRelative}`, createMenuItemHandler);
camareroAdminRouter.get(`${categoriesBase}/:categoryId${itemsBaseRelative}`, getMenuItemsByCategoryHandler);
camareroAdminRouter.get(`${itemsBaseAbsolute}/:itemId`, getMenuItemByIdHandler);
camareroAdminRouter.put(`${itemsBaseAbsolute}/:itemId`, updateMenuItemHandler);
camareroAdminRouter.patch(`${itemsBaseAbsolute}/:itemId`, updateMenuItemHandler);
camareroAdminRouter.delete(`${itemsBaseAbsolute}/:itemId`, deleteMenuItemHandler);

// --- NUEVAS RUTAS PARA GESTIÓN DE MODIFICADORES ---
const modifierGroupsBaseRelative = '/modifier-groups'; // Relativo al ítem de menú
const modifierGroupsBaseAbsolute = '/modifier-groups'; // Para acceder a un grupo directamente
const modifierOptionsBaseRelative = '/options'; // Relativo al grupo de modificadores
const modifierOptionsBaseAbsolute = '/modifier-options'; // Para acceder a una opción directamente

// ModifierGroups (anidados bajo un MenuItem)
// POST /api/camarero/admin/menu/items/:itemId/modifier-groups
camareroAdminRouter.post(`${itemsBaseAbsolute}/:itemId${modifierGroupsBaseRelative}`, createModifierGroupHandler);
// GET /api/camarero/admin/menu/items/:itemId/modifier-groups
camareroAdminRouter.get(`${itemsBaseAbsolute}/:itemId${modifierGroupsBaseRelative}`, getModifierGroupsByMenuItemHandler);

// ModifierGroups (acceso directo por ID del grupo)
// PUT /api/camarero/admin/modifier-groups/:modifierGroupId
camareroAdminRouter.put(`${modifierGroupsBaseAbsolute}/:modifierGroupId`, updateModifierGroupHandler);
camareroAdminRouter.patch(`${modifierGroupsBaseAbsolute}/:modifierGroupId`, updateModifierGroupHandler);
// DELETE /api/camarero/admin/modifier-groups/:modifierGroupId
camareroAdminRouter.delete(`${modifierGroupsBaseAbsolute}/:modifierGroupId`, deleteModifierGroupHandler);

// ModifierOptions (anidados bajo un ModifierGroup)
// POST /api/camarero/admin/modifier-groups/:modifierGroupId/options
camareroAdminRouter.post(`${modifierGroupsBaseAbsolute}/:modifierGroupId${modifierOptionsBaseRelative}`, createModifierOptionHandler);
// GET /api/camarero/admin/modifier-groups/:modifierGroupId/options
camareroAdminRouter.get(`${modifierGroupsBaseAbsolute}/:modifierGroupId${modifierOptionsBaseRelative}`, getModifierOptionsByGroupHandler);

// ModifierOptions (acceso directo por ID de la opción)
// PUT /api/camarero/admin/modifier-options/:modifierOptionId
camareroAdminRouter.put(`${modifierOptionsBaseAbsolute}/:modifierOptionId`, updateModifierOptionHandler);
camareroAdminRouter.patch(`${modifierOptionsBaseAbsolute}/:modifierOptionId`, updateModifierOptionHandler);
// DELETE /api/camarero/admin/modifier-options/:modifierOptionId
camareroAdminRouter.delete(`${modifierOptionsBaseAbsolute}/:modifierOptionId`, deleteModifierOptionHandler);
// --- FIN NUEVAS RUTAS MODIFICADORES ---


// Placeholder para la raíz de /api/camarero/admin
camareroAdminRouter.get('/', (req, res) => {
    res.json({ message: `[CAMARERO ADMIN] Panel de administración del módulo Camarero para businessId: ${req.user?.businessId}` });
});

export default camareroAdminRouter;