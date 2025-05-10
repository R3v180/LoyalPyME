// backend/src/camarero/admin-modifier.service.ts
import { PrismaClient, ModifierGroup, ModifierOption, Prisma } from '@prisma/client';

const prisma = new PrismaClient();

// --- TIPOS PARA ModifierGroup ---
export type CreateModifierGroupData = Omit<Prisma.ModifierGroupCreateInput, 'menuItem' | 'business' | 'options'>;
export type UpdateModifierGroupData = Partial<Omit<Prisma.ModifierGroupUpdateInput, 'menuItem' | 'business' | 'options'>>;

// --- TIPOS PARA ModifierOption ---
export type CreateModifierOptionData = Omit<Prisma.ModifierOptionCreateInput, 'group' | 'orderItems'>;
export type UpdateModifierOptionData = Partial<Omit<Prisma.ModifierOptionUpdateInput, 'group' | 'orderItems'>>;

// === LÓGICA PARA ModifierGroup ===

/**
 * Crea un nuevo grupo de modificadores para un ítem de menú específico.
 */
export const createModifierGroup = async (
    businessId: string,
    menuItemId: string,
    data: Omit<CreateModifierGroupData, 'businessId' | 'menuItemId'>
): Promise<ModifierGroup> => {
    console.log(`[MOD_SVC] Creating modifier group for menuItem ${menuItemId}, business ${businessId}:`, data.name_es);
    try {
        // Verificar que el MenuItem pertenece al businessId
        const menuItemExists = await prisma.menuItem.findFirst({
            where: { id: menuItemId, businessId: businessId },
            select: { id: true }
        });
        if (!menuItemExists) {
            throw new Error(`Ítem de menú con ID ${menuItemId} no encontrado o no pertenece al negocio ${businessId}.`);
        }

        return await prisma.modifierGroup.create({
            data: {
                ...data,
                menuItem: { connect: { id: menuItemId } },
                business: { connect: { id: businessId } } // Conectar también al negocio
            }
        });
    } catch (error) {
        if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
            throw new Error(`Ya existe un grupo de modificadores con el nombre '${data.name_es}' para este ítem de menú.`);
        }
        if (error instanceof Error && error.message.startsWith('Ítem de menú con ID')) throw error;
        console.error(`[MOD_SVC] Error creating modifier group for menuItem ${menuItemId}:`, error);
        throw new Error("Error de base de datos al crear el grupo de modificadores.");
    }
};

/**
 * Obtiene todos los grupos de modificadores para un ítem de menú.
 */
export const getModifierGroupsByMenuItem = async (menuItemId: string, businessId: string): Promise<ModifierGroup[]> => {
    console.log(`[MOD_SVC] Fetching modifier groups for menuItem ${menuItemId}, business ${businessId}`);
    try {
        // Verificar que el MenuItem pertenece al businessId (opcional, pero buena práctica)
        const menuItemExists = await prisma.menuItem.count({ where: { id: menuItemId, businessId: businessId }});
        if (menuItemExists === 0) {
             throw new Error(`Ítem de menú con ID ${menuItemId} no encontrado o no pertenece al negocio ${businessId}.`);
        }

        return await prisma.modifierGroup.findMany({
            where: { menuItemId: menuItemId },
            orderBy: { position: 'asc' },
            include: { options: { orderBy: { position: 'asc' } } } // Incluir opciones ordenadas
        });
    } catch (error) {
        if (error instanceof Error && error.message.startsWith('Ítem de menú con ID')) throw error;
        console.error(`[MOD_SVC] Error fetching modifier groups for menuItem ${menuItemId}:`, error);
        throw new Error("Error al obtener los grupos de modificadores.");
    }
};

/**
 * Actualiza un grupo de modificadores existente.
 */
export const updateModifierGroup = async (
    modifierGroupId: string,
    businessId: string, // Para verificar pertenencia
    data: UpdateModifierGroupData
): Promise<ModifierGroup> => {
    console.log(`[MOD_SVC] Updating modifier group ${modifierGroupId} for business ${businessId}:`, data);
    try {
        const existingGroup = await prisma.modifierGroup.findFirst({
            where: { id: modifierGroupId, businessId: businessId }, // Asegurar que el grupo pertenece al negocio
            select: { id: true }
        });
        if (!existingGroup) {
            throw new Error(`Grupo de modificadores con ID ${modifierGroupId} no encontrado o no pertenece a este negocio.`);
        }
        return await prisma.modifierGroup.update({
            where: { id: modifierGroupId },
            data: data
        });
    } catch (error) {
        if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
            throw new Error(`Error de unicidad al actualizar el grupo de modificadores (ej: el nuevo nombre ya existe para el ítem).`);
        }
        if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2025') {
            throw new Error(`Grupo de modificadores con ID ${modifierGroupId} no encontrado.`);
        }
        if (error instanceof Error && error.message.startsWith('Grupo de modificadores con ID')) throw error;
        console.error(`[MOD_SVC] Error updating modifier group ${modifierGroupId}:`, error);
        throw new Error("Error de base de datos al actualizar el grupo de modificadores.");
    }
};

/**
 * Elimina un grupo de modificadores (y sus opciones en cascada).
 */
export const deleteModifierGroup = async (modifierGroupId: string, businessId: string): Promise<ModifierGroup> => {
    console.log(`[MOD_SVC] Deleting modifier group ${modifierGroupId} for business ${businessId}`);
    try {
        const existingGroup = await prisma.modifierGroup.findFirst({
            where: { id: modifierGroupId, businessId: businessId },
            select: { id: true }
        });
        if (!existingGroup) {
            throw new Error(`Grupo de modificadores con ID ${modifierGroupId} no encontrado o no pertenece a este negocio.`);
        }
        // Prisma maneja el borrado en cascada de ModifierOption debido a la relación
        return await prisma.modifierGroup.delete({
            where: { id: modifierGroupId }
        });
    } catch (error) {
        if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2025') {
            throw new Error(`Grupo de modificadores con ID ${modifierGroupId} no encontrado.`);
        }
         if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2003') {
            throw new Error(`No se puede eliminar el grupo de modificadores porque una de sus opciones está en uso (ej: en pedidos).`);
        }
        if (error instanceof Error && error.message.startsWith('Grupo de modificadores con ID')) throw error;
        console.error(`[MOD_SVC] Error deleting modifier group ${modifierGroupId}:`, error);
        throw new Error("Error de base de datos al eliminar el grupo de modificadores.");
    }
};


// === LÓGICA PARA ModifierOption ===

/**
 * Crea una nueva opción de modificador para un grupo específico.
 */
export const createModifierOption = async (
    modifierGroupId: string,
    businessId: string, // Para verificar que el grupo padre pertenece al negocio
    data: Omit<CreateModifierOptionData, 'groupId'>
): Promise<ModifierOption> => {
    console.log(`[MOD_SVC] Creating modifier option for group ${modifierGroupId}, business ${businessId}:`, data.name_es);
    try {
        // Verificar que el ModifierGroup padre pertenece al businessId
        const groupExists = await prisma.modifierGroup.findFirst({
            where: { id: modifierGroupId, businessId: businessId },
            select: { id: true }
        });
        if (!groupExists) {
            throw new Error(`Grupo de modificadores con ID ${modifierGroupId} no encontrado o no pertenece al negocio ${businessId}.`);
        }

        return await prisma.modifierOption.create({
            data: {
                ...data,
                group: { connect: { id: modifierGroupId } }
            }
        });
    } catch (error) {
        if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
            throw new Error(`Ya existe una opción con el nombre '${data.name_es}' en este grupo de modificadores.`);
        }
        if (error instanceof Error && error.message.startsWith('Grupo de modificadores con ID')) throw error;
        console.error(`[MOD_SVC] Error creating modifier option for group ${modifierGroupId}:`, error);
        throw new Error("Error de base de datos al crear la opción de modificador.");
    }
};

/**
 * Obtiene todas las opciones para un grupo de modificadores específico.
 * (La verificación de pertenencia del grupo al negocio ya se haría al obtener/validar el grupo)
 */
export const getModifierOptionsByGroup = async (modifierGroupId: string): Promise<ModifierOption[]> => {
    console.log(`[MOD_SVC] Fetching modifier options for group ${modifierGroupId}`);
    try {
        return await prisma.modifierOption.findMany({
            where: { groupId: modifierGroupId },
            orderBy: { position: 'asc' }
        });
    } catch (error) {
        console.error(`[MOD_SVC] Error fetching modifier options for group ${modifierGroupId}:`, error);
        throw new Error("Error al obtener las opciones de modificadores.");
    }
};

/**
 * Actualiza una opción de modificador existente.
 */
export const updateModifierOption = async (
    modifierOptionId: string,
    businessId: string, // Para verificar que la opción pertenece a un grupo de ese negocio
    data: UpdateModifierOptionData
): Promise<ModifierOption> => {
    console.log(`[MOD_SVC] Updating modifier option ${modifierOptionId} for business ${businessId}:`, data);
    try {
        // Verificar que la opción pertenece a un grupo del negocio
        const existingOption = await prisma.modifierOption.findFirst({
            where: {
                id: modifierOptionId,
                group: { businessId: businessId } // Verificar a través de la relación con el grupo
            },
            select: { id: true }
        });
        if (!existingOption) {
            throw new Error(`Opción de modificador con ID ${modifierOptionId} no encontrada o no pertenece a este negocio.`);
        }

        return await prisma.modifierOption.update({
            where: { id: modifierOptionId },
            data: data
        });
    } catch (error) {
        if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
            throw new Error(`Error de unicidad al actualizar la opción (ej: el nuevo nombre ya existe en el grupo).`);
        }
        if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2025') {
            throw new Error(`Opción de modificador con ID ${modifierOptionId} no encontrada.`);
        }
        if (error instanceof Error && error.message.startsWith('Opción de modificador con ID')) throw error;
        console.error(`[MOD_SVC] Error updating modifier option ${modifierOptionId}:`, error);
        throw new Error("Error de base de datos al actualizar la opción de modificador.");
    }
};

/**
 * Elimina una opción de modificador.
 */
export const deleteModifierOption = async (modifierOptionId: string, businessId: string): Promise<ModifierOption> => {
    console.log(`[MOD_SVC] Deleting modifier option ${modifierOptionId} for business ${businessId}`);
    try {
        const existingOption = await prisma.modifierOption.findFirst({
            where: {
                id: modifierOptionId,
                group: { businessId: businessId }
            },
            select: { id: true }
        });
        if (!existingOption) {
            throw new Error(`Opción de modificador con ID ${modifierOptionId} no encontrada o no pertenece a este negocio.`);
        }
        // Prisma maneja el borrado en cascada si esta opción estuviera en OrderItemModifierOption
        // debido a la relación en ese modelo de unión.
        return await prisma.modifierOption.delete({
            where: { id: modifierOptionId }
        });
    } catch (error) {
        if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2025') {
            throw new Error(`Opción de modificador con ID ${modifierOptionId} no encontrada.`);
        }
         if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2003') {
            // Foreign key constraint failed on the field: `OrderItemModifierOption_modifierOptionId_fkey (index)`
            throw new Error(`No se puede eliminar la opción porque está en uso (ej: en pedidos existentes).`);
        }
        if (error instanceof Error && error.message.startsWith('Opción de modificador con ID')) throw error;
        console.error(`[MOD_SVC] Error deleting modifier option ${modifierOptionId}:`, error);
        throw new Error("Error de base de datos al eliminar la opción de modificador.");
    }
};