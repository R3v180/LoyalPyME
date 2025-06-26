// backend/src/modules/camarero/admin-menu-item.service.ts
import { PrismaClient, MenuItem, Prisma } from '@prisma/client';

const prisma = new PrismaClient();

export type CreateMenuItemData = Omit<
    Prisma.MenuItemCreateInput,
    'business' | 'category' | 'modifierGroups' | 'orderItems' | 'rewardsLinkingToThis'
> & { categoryId: string };

export type UpdateMenuItemData = Partial<
    Omit<Prisma.MenuItemUncheckedUpdateInput, 'id' | 'businessId' | 'createdAt' | 'updatedAt' | 'modifierGroups' | 'orderItems' | 'category' | 'rewardsLinkingToThis'>
>;

export const createMenuItem = async (
    businessId: string,
    categoryId: string,
    data: Omit<CreateMenuItemData, 'businessId' | 'categoryId'>
): Promise<MenuItem> => {
    console.log(`[MI_SVC] Creating menu item for business ${businessId}, category ${categoryId}:`, data.name_es);
    try {
        const categoryExists = await prisma.menuCategory.findFirst({
            where: { id: categoryId, businessId: businessId },
            select: { id: true }
        });
        if (!categoryExists) {
            throw new Error(`Categoría con ID ${categoryId} no encontrada o no pertenece al negocio ${businessId}.`);
        }

        const skuValue = data.sku ? (typeof data.sku === 'string' ? data.sku.trim() : data.sku) : null;

        const newItem = await prisma.menuItem.create({
            data: {
                ...data,
                sku: skuValue || null,
                business: { connect: { id: businessId } },
                category: { connect: { id: categoryId } },
            }
        });
        return newItem;
    } catch (error) {
        if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
            console.warn(`[MI_SVC] Unique constraint violation for item:`, data.name_es, error.meta);
            const target = error.meta?.target as string[];
            if (target?.includes('name_es') && target?.includes('categoryId')) {
                 throw new Error(`Ya existe un ítem con el nombre '${data.name_es}' en esta categoría.`);
            }
            if (target?.includes('sku') && target?.includes('businessId')) {
                 throw new Error(`Ya existe un ítem con el SKU '${data.sku || ''}' en este negocio.`);
            }
            throw new Error(`Conflicto de unicidad al crear el ítem de menú.`);
        }
        if (error instanceof Error && error.message.startsWith('Categoría con ID')) {
            throw error;
        }
        console.error(`[MI_SVC] Error creating menu item for business ${businessId}:`, error);
        throw new Error("Error de base de datos al crear el ítem de menú.");
    }
};

export const getMenuItemsByCategory = async (
    categoryId: string,
    businessId: string,
    filter?: { isAvailable?: boolean }
): Promise<MenuItem[]> => {
    console.log(`[MI_SVC] Fetching menu items for category ${categoryId}, business ${businessId}, filter:`, filter);
    try {
        const categoryExists = await prisma.menuCategory.findFirst({
            where: { id: categoryId, businessId: businessId },
            select: { id: true }
        });
        if (!categoryExists) {
            throw new Error(`Categoría con ID ${categoryId} no encontrada o no pertenece al negocio ${businessId}.`);
        }

        const whereClause: Prisma.MenuItemWhereInput = { categoryId };
        if (filter?.isAvailable !== undefined) {
            whereClause.isAvailable = filter.isAvailable;
        }

        return await prisma.menuItem.findMany({
            where: whereClause,
            orderBy: { position: 'asc' },
        });
    } catch (error) {
        if (error instanceof Error && error.message.startsWith('Categoría con ID')) {
            throw error;
        }
        console.error(`[MI_SVC] Error fetching menu items for category ${categoryId}:`, error);
        throw new Error("Error al obtener los ítems de menú.");
    }
};

export const getMenuItemById = async (menuItemId: string, businessId: string): Promise<MenuItem | null> => {
    console.log(`[MI_SVC] Fetching menu item ${menuItemId} for business ${businessId}`);
    try {
        return await prisma.menuItem.findFirst({
            where: {
                id: menuItemId,
                businessId: businessId
            },
        });
    } catch (error) {
        console.error(`[MI_SVC] Error fetching menu item ${menuItemId}:`, error);
        throw new Error("Error al obtener el ítem de menú por ID.");
    }
};

export const updateMenuItem = async (
    menuItemId: string,
    businessId: string,
    data: UpdateMenuItemData
): Promise<MenuItem> => {
    console.log(`[MI_SVC] Updating menu item ${menuItemId} for business ${businessId}:`, data);
    try {
        const existingItem = await prisma.menuItem.findFirst({
            where: { id: menuItemId, businessId: businessId },
            select: { id: true, categoryId: true }
        });
        if (!existingItem) {
            throw new Error(`Ítem de menú con ID ${menuItemId} no encontrado o no pertenece a este negocio.`);
        }

        const updatePayload: Prisma.MenuItemUpdateInput = { ...data } as Prisma.MenuItemUpdateInput;

        if (data.sku !== undefined) {
            if (typeof data.sku === 'string') {
                updatePayload.sku = data.sku.trim() || null;
            } else {
                updatePayload.sku = null;
            }
        }
        
        if (data.categoryId && typeof data.categoryId === 'string' && data.categoryId !== existingItem.categoryId) {
            const newCategory = await prisma.menuCategory.findFirst({
                where: { id: data.categoryId, businessId: businessId },
                select: { id: true }
            });
            if (!newCategory) {
                throw new Error(`La nueva categoría de destino (ID: ${data.categoryId}) no es válida o no pertenece a este negocio.`);
            }
        }

        return await prisma.menuItem.update({
            where: { id: menuItemId },
            data: updatePayload,
        });
    } catch (error) {
        if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
            console.warn(`[MI_SVC] Unique constraint violation on update for item ${menuItemId}:`, error.meta);
            const target = error.meta?.target as string[];
            if (target?.includes('name_es') && target?.includes('categoryId')) {
                 throw new Error(`Ya existe un ítem con el nuevo nombre en la categoría especificada.`);
            }
            if (target?.includes('sku') && target?.includes('businessId')) {
                 throw new Error(`Ya existe un ítem con el nuevo SKU en este negocio.`);
            }
            throw new Error(`Conflicto de unicidad al actualizar el ítem de menú.`);
        }
        if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2025') {
            throw new Error(`Ítem de menú con ID ${menuItemId} no encontrado al intentar actualizar.`);
        }
        if (error instanceof Error && (error.message.startsWith('Ítem de menú con ID') || error.message.startsWith('La nueva categoría'))) {
            throw error;
        }
        console.error(`[MI_SVC] Error updating menu item ${menuItemId}:`, error);
        throw new Error("Error de base de datos al actualizar el ítem de menú.");
    }
};

export const deleteMenuItem = async (menuItemId: string, businessId: string): Promise<MenuItem> => {
    console.log(`[MI_SVC] Deleting menu item ${menuItemId} for business ${businessId}`);
    try {
        const existingItem = await prisma.menuItem.findFirst({
            where: { id: menuItemId, businessId: businessId },
            select: { id: true }
        });
        if (!existingItem) {
            throw new Error(`Ítem de menú con ID ${menuItemId} no encontrado o no pertenece a este negocio.`);
        }

        return await prisma.menuItem.delete({
            where: { id: menuItemId }
        });
    } catch (error) {
        if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2025') {
            throw new Error(`Ítem de menú con ID ${menuItemId} no encontrado al intentar eliminar.`);
        }
        if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2003') {
             console.warn(`[MI_SVC] Failed to delete menu item ${menuItemId} due to foreign key constraint (P2003).`);
            throw new Error(`No se puede eliminar el ítem de menú porque está en uso (ej: en pedidos existentes). Considere desactivarlo en su lugar.`);
        }
        if (error instanceof Error && error.message.startsWith('Ítem de menú con ID')) {
            throw error;
        }
        console.error(`[MI_SVC] Error deleting menu item ${menuItemId}:`, error);
        throw new Error("Error de base de datos al eliminar el ítem de menú.");
    }
};

// --- NUEVA FUNCIÓN AÑADIDA ---
/**
 * Obtiene todos los MenuItem disponibles para un negocio, ordenados por categoría y posición.
 * Ideal para rellenar selectores en el panel de administración.
 * @param businessId El ID del negocio.
 * @returns Una lista de objetos MenuItem.
 */
export const getAllMenuItemsForBusiness = async (businessId: string): Promise<MenuItem[]> => {
    console.log(`[MI_SVC] Fetching ALL menu items for business ${businessId}`);
    try {
        return await prisma.menuItem.findMany({
            where: {
                businessId: businessId,
                isAvailable: true // Solo traer ítems que el cliente puede ver/pedir
            },
            orderBy: [
                { category: { position: 'asc' } }, // Ordenar por la posición de la categoría
                { position: 'asc' }                // Luego por la posición del ítem dentro de la categoría
            ],
        });
    } catch (error) {
        console.error(`[MI_SVC] Error fetching all menu items for business ${businessId}:`, error);
        throw new Error("Error al obtener todos los ítems de menú.");
    }
};