// backend/src/routes/camarero-admin.routes.ts
import { Router } from 'express';
import { authenticateToken } from '../shared/middleware/auth.middleware';
import { checkRole } from '../shared/middleware/role.middleware';
import { UserRole } from '@prisma/client';
import { checkModuleActive } from '../shared/middleware/module.middleware';

// Controladores
import {
    createMenuCategoryHandler,
    getMenuCategoriesHandler,
    getMenuCategoryByIdHandler,
    updateMenuCategoryHandler,
    deleteMenuCategoryHandler
} from '../modules/camarero/admin-menu-category.controller';

import {
    createMenuItemHandler,
    getMenuItemsByCategoryHandler,
    getMenuItemByIdHandler,
    updateMenuItemHandler,
    deleteMenuItemHandler,
    getAllMenuItemsForBusinessHandler // <-- IMPORTACIÓN AÑADIDA
} from '../modules/camarero/admin-menu-item.controller';

import {
    createModifierGroupHandler,
    getModifierGroupsByMenuItemHandler,
    updateModifierGroupHandler,
    deleteModifierGroupHandler,
    createModifierOptionHandler,
    getModifierOptionsByGroupHandler,
    updateModifierOptionHandler,
    deleteModifierOptionHandler
} from '../modules/camarero/admin-modifier.controller';

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
const itemsBaseRelative = '/items';
const itemsBaseAbsolute = '/menu/items';

camareroAdminRouter.post(`${categoriesBase}/:categoryId${itemsBaseRelative}`, createMenuItemHandler);
camareroAdminRouter.get(`${categoriesBase}/:categoryId${itemsBaseRelative}`, getMenuItemsByCategoryHandler);

// --- RUTA NUEVA AÑADIDA ---
// Obtiene TODOS los items del negocio para los selectores del admin.
// Debe ir ANTES de la ruta /:itemId para que "all" no se interprete como un ID.
camareroAdminRouter.get(`${itemsBaseAbsolute}/all`, getAllMenuItemsForBusinessHandler);
// --- FIN RUTA NUEVA ---

camareroAdminRouter.get(`${itemsBaseAbsolute}/:itemId`, getMenuItemByIdHandler);
camareroAdminRouter.put(`${itemsBaseAbsolute}/:itemId`, updateMenuItemHandler);
camareroAdminRouter.patch(`${itemsBaseAbsolute}/:itemId`, updateMenuItemHandler);
camareroAdminRouter.delete(`${itemsBaseAbsolute}/:itemId`, deleteMenuItemHandler);

// --- RUTAS PARA GESTIÓN DE MODIFICADORES ---
const modifierGroupsBaseRelative = '/modifier-groups';
const modifierGroupsBaseAbsolute = '/modifier-groups';
const modifierOptionsBaseRelative = '/options';
const modifierOptionsBaseAbsolute = '/modifier-options';

camareroAdminRouter.post(`${itemsBaseAbsolute}/:itemId${modifierGroupsBaseRelative}`, createModifierGroupHandler);
camareroAdminRouter.get(`${itemsBaseAbsolute}/:itemId${modifierGroupsBaseRelative}`, getModifierGroupsByMenuItemHandler);
camareroAdminRouter.put(`${modifierGroupsBaseAbsolute}/:modifierGroupId`, updateModifierGroupHandler);
camareroAdminRouter.patch(`${modifierGroupsBaseAbsolute}/:modifierGroupId`, updateModifierGroupHandler);
camareroAdminRouter.delete(`${modifierGroupsBaseAbsolute}/:modifierGroupId`, deleteModifierGroupHandler);
camareroAdminRouter.post(`${modifierGroupsBaseAbsolute}/:modifierGroupId${modifierOptionsBaseRelative}`, createModifierOptionHandler);
camareroAdminRouter.get(`${modifierGroupsBaseAbsolute}/:modifierGroupId${modifierOptionsBaseRelative}`, getModifierOptionsByGroupHandler);
camareroAdminRouter.put(`${modifierOptionsBaseAbsolute}/:modifierOptionId`, updateModifierOptionHandler);
camareroAdminRouter.patch(`${modifierOptionsBaseAbsolute}/:modifierOptionId`, updateModifierOptionHandler);
camareroAdminRouter.delete(`${modifierOptionsBaseAbsolute}/:modifierOptionId`, deleteModifierOptionHandler);

camareroAdminRouter.get('/', (req, res) => {
    res.json({ message: `[CAMARERO ADMIN] Panel de administración del módulo Camarero para businessId: ${req.user?.businessId}` });
});

export default camareroAdminRouter;