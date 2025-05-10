// backend/src/camarero/admin-menu-category.service.ts
import { PrismaClient, MenuCategory, Prisma } from '@prisma/client';

const prisma = new PrismaClient();

// Tipo para los datos de creación (excluye businessId ya que se pasa como argumento)
export type CreateMenuCategoryData = Omit<Prisma.MenuCategoryCreateInput, 'business' | 'items'>;

// Tipo para los datos de actualización (parcial y excluye relaciones)
export type UpdateMenuCategoryData = Partial<Omit<Prisma.MenuCategoryUpdateInput, 'business' | 'items'>>;


/**
 * Crea una nueva categoría de menú para un negocio específico.
 */
export const createMenuCategory = async (
    businessId: string,
    data: CreateMenuCategoryData
): Promise<MenuCategory> => {
    console.log(`[MC_SVC] Creating menu category for business ${businessId}:`, data.name_es);
    try {
        const newCategory = await prisma.menuCategory.create({
            data: {
                ...data,
                business: {
                    connect: { id: businessId }
                }
            }
        });
        return newCategory;
    } catch (error) {
        if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
            // P2002 es error de constraint único (ej: nombre de categoría ya existe para ese negocio)
            console.warn(`[MC_SVC] Unique constraint violation for business ${businessId}, name: ${data.name_es}`, error.meta);
            throw new Error(`Ya existe una categoría con el nombre '${data.name_es}' en este negocio.`);
        }
        console.error(`[MC_SVC] Error creating menu category for business ${businessId}:`, error);
        throw new Error("Error de base de datos al crear la categoría de menú.");
    }
};

/**
 * Obtiene todas las categorías de menú para un negocio, ordenadas por posición.
 */
export const getMenuCategoriesByBusiness = async (businessId: string): Promise<MenuCategory[]> => {
    console.log(`[MC_SVC] Fetching menu categories for business ${businessId}`);
    try {
        return await prisma.menuCategory.findMany({
            where: { businessId },
            orderBy: { position: 'asc' },
            // Podríamos incluir ítems si fuera necesario para alguna vista: include: { items: true }
        });
    } catch (error) {
        console.error(`[MC_SVC] Error fetching menu categories for business ${businessId}:`, error);
        throw new Error("Error al obtener las categorías de menú.");
    }
};

/**
 * Obtiene una categoría de menú específica por su ID, verificando que pertenezca al negocio.
 */
export const getMenuCategoryById = async (categoryId: string, businessId: string): Promise<MenuCategory | null> => {
    console.log(`[MC_SVC] Fetching menu category ${categoryId} for business ${businessId}`);
    try {
        return await prisma.menuCategory.findFirst({
            where: {
                id: categoryId,
                businessId: businessId
            },
            // include: { items: true } // Opcional: incluir ítems al obtener una categoría específica
        });
    } catch (error) {
        console.error(`[MC_SVC] Error fetching menu category ${categoryId}:`, error);
        throw new Error("Error al obtener la categoría de menú por ID.");
    }
};

/**
 * Actualiza una categoría de menú existente.
 */
export const updateMenuCategory = async (
    categoryId: string,
    businessId: string,
    data: UpdateMenuCategoryData
): Promise<MenuCategory> => {
    console.log(`[MC_SVC] Updating menu category ${categoryId} for business ${businessId}:`, data);
    try {
        // Verificar que la categoría existe y pertenece al negocio antes de actualizar
        const existingCategory = await prisma.menuCategory.findFirst({
            where: { id: categoryId, businessId: businessId },
            select: { id: true } // Solo necesitamos saber si existe
        });
        if (!existingCategory) {
            throw new Error(`Categoría de menú con ID ${categoryId} no encontrada o no pertenece a este negocio.`);
        }

        return await prisma.menuCategory.update({
            where: { id: categoryId },
            data: data
        });
    } catch (error) {
        if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
            console.warn(`[MC_SVC] Unique constraint violation on update for category ${categoryId}, business ${businessId}:`, error.meta);
            // El mensaje de error podría ser más específico si sabemos qué campo causó el P2002
            throw new Error(`Error de unicidad al actualizar la categoría (ej: el nuevo nombre ya existe).`);
        }
        if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2025') {
            // Este error significa que el registro a actualizar (where: { id: categoryId }) no se encontró.
            // Ya lo manejamos con la verificación previa, pero es bueno tenerlo por si acaso.
            throw new Error(`Categoría de menú con ID ${categoryId} no encontrada al intentar actualizar.`);
        }
        if (error instanceof Error && error.message.startsWith('Categoría de menú con ID')) {
            throw error; // Relanzar el error específico de "no encontrado"
        }
        console.error(`[MC_SVC] Error updating menu category ${categoryId}:`, error);
        throw new Error("Error de base de datos al actualizar la categoría de menú.");
    }
};

/**
 * Elimina una categoría de menú.
 * Prisma se encargará de eliminar los MenuItems asociados debido a `onDelete: Cascade`.
 */
export const deleteMenuCategory = async (categoryId: string, businessId: string): Promise<MenuCategory> => {
    console.log(`[MC_SVC] Deleting menu category ${categoryId} for business ${businessId}`);
    try {
        // Verificar que la categoría existe y pertenece al negocio antes de eliminar
        const existingCategory = await prisma.menuCategory.findFirst({
            where: { id: categoryId, businessId: businessId },
            select: { id: true }
        });
        if (!existingCategory) {
            throw new Error(`Categoría de menú con ID ${categoryId} no encontrada o no pertenece a este negocio.`);
        }

        // Opcional: Verificar si la categoría tiene ítems que a su vez están en pedidos activos si onDelete:Restrict se usara
        // En nuestro caso, MenuCategory -> MenuItem tiene onDelete: Cascade, así que borrar la categoría borrará sus ítems.
        // Y MenuItem -> OrderItem tiene onDelete: Restrict, lo que PREVENDRÍA borrar un MenuItem si está en un pedido.
        // Esto significa que si una categoría tiene ítems que están en pedidos, la eliminación de la categoría (que intenta borrar los ítems) fallará
        // debido a la restricción en MenuItem. Esto es probablemente el comportamiento deseado.

        return await prisma.menuCategory.delete({
            where: { id: categoryId }
        });
    } catch (error) {
        if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2025') {
            throw new Error(`Categoría de menú con ID ${categoryId} no encontrada al intentar eliminar.`);
        }
        if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2003') {
            // Error de Foreign key constraint failed on the field: `MenuItem_categoryId_fkey (index)` (o similar)
            // Esto ocurriría si intentamos borrar una categoría cuyos ítems están en uso (ej: en OrderItem) y la relación MenuItem->OrderItem es Restrict.
            console.warn(`[MC_SVC] Failed to delete category ${categoryId} due to foreign key constraint (likely items in use).`);
            throw new Error(`No se puede eliminar la categoría porque contiene ítems que están actualmente en uso (ej: en pedidos). Elimine o desvincule esos ítems primero.`);
        }
        if (error instanceof Error && error.message.startsWith('Categoría de menú con ID')) {
            throw error; // Relanzar el error específico de "no encontrado"
        }
        console.error(`[MC_SVC] Error deleting menu category ${categoryId}:`, error);
        throw new Error("Error de base de datos al eliminar la categoría de menú.");
    }
};