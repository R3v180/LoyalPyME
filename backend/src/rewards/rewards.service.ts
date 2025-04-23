// File: backend/src/rewards/rewards.service.ts
// Version: 1.1.0 (Allow isActive update via updateReward, translate errors)

import { PrismaClient, Reward, Prisma } from '@prisma/client'; // Añadir Prisma para tipos de error

const prisma = new PrismaClient();

/**
 * Creates a new reward for a specific business.
 * (No cambios aquí)
 */
export const createReward = async (rewardData: {
    name: string;
    description?: string;
    pointsCost: number;
    businessId: string;
}): Promise<Reward> => {
    // La FK constraint en la BD ya valida que businessId exista.
    return prisma.reward.create({
        data: {
            name: rewardData.name,
            description: rewardData.description,
            pointsCost: rewardData.pointsCost,
            businessId: rewardData.businessId,
            // isActive usa default(true)
        },
    });
};

/**
 * Finds all rewards for a specific business.
 * (No cambios aquí)
 */
export const findRewardsByBusiness = async (businessId: string): Promise<Reward[]> => {
    return prisma.reward.findMany({
        where: { businessId },
    });
};

/**
 * Finds a single reward by its ID, ensuring it belongs to a specific business.
 * (No cambios aquí)
 */
export const findRewardById = async (id: string, businessId: string): Promise<Reward | null> => {
    // Usamos findFirst para poder añadir la condición de businessId directamente en el where
     return prisma.reward.findFirst({
         where: {
             id: id,
             businessId: businessId, // Asegura que pertenezca al negocio correcto
         },
     });
     // Alternativa con findUnique (requeriría validar businessId después):
     // return prisma.reward.findUnique({ where: { id } });
};

/**
 * Updates an existing reward, ensuring it belongs to a specific business.
 * Now handles partial updates including 'isActive'.
 * @param id - The ID of the reward to update.
 * @param businessId - The ID of the business the reward should belong to.
 * @param updateData - Data to update the reward (name?, pointsCost?, isActive?, etc.).
 * @returns A promise that resolves with the updated reward object.
 * @throws Error if the reward is not found or doesn't belong to the business.
 */
export const updateReward = async (
    id: string,
    businessId: string,
    // El tipo aquí acepta los campos opcionales del DTO v1.1.0 del controller
    updateData: { name?: string; description?: string; pointsCost?: number; isActive?: boolean }
): Promise<Reward> => {
    // 1. Verificar si la recompensa existe Y pertenece a este negocio
    const existingReward = await findRewardById(id, businessId);
    if (!existingReward) {
        // --- CAMBIO: Mensaje traducido ---
        const error = new Error(`Recompensa con ID ${id} no encontrada o no pertenece al negocio ${businessId}.`);
        // --- FIN CAMBIO ---
        console.error(error.message);
        throw error;
    }

    // 2. Si existe y pertenece, proceder con la actualizacion.
    // Prisma 'update' aplicará solo los campos presentes en 'updateData'.
    // Si 'isActive' viene en updateData, se actualizará. Si no viene, no se tocará.
    try {
        return await prisma.reward.update({
            where: { id: id }, // Actualiza por ID de recompensa
            data: updateData,  // Aplica los datos de actualizacion recibidos
        });
    } catch (error) {
         // Manejar posibles errores de Prisma durante la actualización
        if (error instanceof Prisma.PrismaClientKnownRequestError) {
            console.error(`Prisma error updating reward ${id}:`, error);
            // Podríamos tener errores si, por ejemplo, intentamos poner un pointsCost negativo y hubiera una constraint
            throw new Error(`Error de base de datos al actualizar recompensa: ${error.message}`); // Traducido
        }
        console.error(`Unexpected error updating reward ${id}:`, error);
        throw new Error('Error inesperado al actualizar la recompensa.'); // Traducido
    }
};

/**
 * Deletes an existing reward, ensuring it belongs to a specific business.
 * @param id - The ID of the reward to delete.
 * @param businessId - The ID of the business the reward should belong to.
 * @returns A promise that resolves with the deleted reward object.
 * @throws Error if the reward is not found or doesn't belong to the business.
 */
export const deleteReward = async (id: string, businessId: string): Promise<Reward> => {
     // 1. Verificar si la recompensa existe Y pertenece a este negocio
    const existingReward = await findRewardById(id, businessId);
    if (!existingReward) {
        // --- CAMBIO: Mensaje traducido ---
        const error = new Error(`Recompensa con ID ${id} no encontrada o no pertenece al negocio ${businessId}.`);
         // --- FIN CAMBIO ---
        console.error(error.message);
        throw error;
    }

    // 2. Si existe y pertenece, proceder con la eliminacion
    try {
        return await prisma.reward.delete({
            where: { id: id }, // Elimina por ID de recompensa
        });
    } catch (error) {
        // Manejar posibles errores de Prisma durante la eliminación
        if (error instanceof Prisma.PrismaClientKnownRequestError) {
             console.error(`Prisma error deleting reward ${id}:`, error);
             // Ejemplo: Código P2003 indica fallo de foreign key constraint (si la recompensa estuviera en uso)
             if (error.code === 'P2003') {
                 throw new Error('No se puede eliminar la recompensa porque está siendo utilizada.'); // Traducido
             }
            throw new Error(`Error de base de datos al eliminar recompensa: ${error.message}`); // Traducido
        }
        console.error(`Unexpected error deleting reward ${id}:`, error);
        throw new Error('Error inesperado al eliminar la recompensa.'); // Traducido
    }
};

// End of File: backend/src/rewards/rewards.service.ts