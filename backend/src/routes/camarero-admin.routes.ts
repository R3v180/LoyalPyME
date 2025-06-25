// backend/src/routes/camarero-admin.routes.ts (CORREGIDO)
import { Router } from 'express';
// --- RUTAS CORREGIDAS ---
import { authenticateToken } from '../shared/middleware/auth.middleware';
import { checkRole } from '../shared/middleware/role.middleware';
import { UserRole } from '@prisma/client';
import { checkModuleActive } from '../shared/middleware/module.middleware';

// Controladores (ahora desde la ubicación modular correcta)
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
    deleteMenuItemHandler
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
// --- FIN RUTAS CORREGIDAS ---

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
camareroAdminRouter.post(`${itemsBaseAbsolute}/:itemId${modifierGroupsBaseRelative}`, createModifierGroupHandler);
camareroAdminRouter.get(`${itemsBaseAbsolute}/:itemId${modifierGroupsBaseRelative}`, getModifierGroupsByMenuItemHandler);

// ModifierGroups (acceso directo por ID del grupo)
camareroAdminRouter.put(`${modifierGroupsBaseAbsolute}/:modifierGroupId`, updateModifierGroupHandler);
camareroAdminRouter.patch(`${modifierGroupsBaseAbsolute}/:modifierGroupId`, updateModifierGroupHandler);
camareroAdminRouter.delete(`${modifierGroupsBaseAbsolute}/:modifierGroupId`, deleteModifierGroupHandler);

// ModifierOptions (anidados bajo un ModifierGroup)
camareroAdminRouter.post(`${modifierGroupsBaseAbsolute}/:modifierGroupId${modifierOptionsBaseRelative}`, createModifierOptionHandler);
camareroAdminRouter.get(`${modifierGroupsBaseAbsolute}/:modifierGroupId${modifierOptionsBaseRelative}`, getModifierOptionsByGroupHandler);

// ModifierOptions (acceso directo por ID de la opción)
camareroAdminRouter.put(`${modifierOptionsBaseAbsolute}/:modifierOptionId`, updateModifierOptionHandler);
camareroAdminRouter.patch(`${modifierOptionsBaseAbsolute}/:modifierOptionId`, updateModifierOptionHandler);
camareroAdminRouter.delete(`${modifierOptionsBaseAbsolute}/:modifierOptionId`, deleteModifierOptionHandler);


// Placeholder para la raíz de /api/camarero/admin
camareroAdminRouter.get('/', (req, res) => {
    res.json({ message: `[CAMARERO ADMIN] Panel de administración del módulo Camarero para businessId: ${req.user?.businessId}` });
});

export default camareroAdminRouter;