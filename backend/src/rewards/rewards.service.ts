// File: backend/src/rewards/rewards.service.ts
// Version: 1.1.2 (Fix: Correct orderBy syntax for multiple fields)

import { PrismaClient, Reward, Prisma } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * Creates a new reward for a specific business.
 */
export const createReward = async (rewardData: {
    name: string;
    description?: string;
    pointsCost: number;
    businessId: string;
}): Promise<Reward> => {
    return prisma.reward.create({
        data: {
            name: rewardData.name,
            description: rewardData.description,
            pointsCost: rewardData.pointsCost,
            businessId: rewardData.businessId,
        },
    });
};

/**
 * Finds all ACTIVE rewards for a specific business.
 * Returns only selected fields needed for assignment list.
 * Orders by pointsCost ascending, then name ascending.
 */
export const findRewardsByBusiness = async (businessId: string): Promise<Pick<Reward, 'id' | 'name' | 'pointsCost' | 'description'>[]> => {
    console.log(`[Rewards SVC] Finding ACTIVE rewards for business ${businessId}`);
    try {
        return await prisma.reward.findMany({
            where: {
                businessId: businessId,
                isActive: true // Filtrar solo activas
            },
            select: { // Seleccionar explícitamente los campos necesarios
                id: true,
                name: true,
                pointsCost: true, // Asegurar que se incluye
                description: true
            },
            // --- CORRECCIÓN: Usar array para múltiples orderBy ---
            orderBy: [
                { pointsCost: 'asc' }, // Primero por puntos
                { name: 'asc' }        // Luego por nombre
            ]
            // --- FIN CORRECCIÓN ---
        });
    } catch (error) {
        console.error(`[Rewards SVC] Error finding active rewards for business ${businessId}:`, error);
        // Lanzar un error genérico para que el controlador lo maneje
        throw new Error('Error al buscar las recompensas activas.');
    }
};


/**
 * Finds a single reward by its ID, ensuring it belongs to a specific business.
 */
export const findRewardById = async (id: string, businessId: string): Promise<Reward | null> => {
     return prisma.reward.findFirst({
         where: {
             id: id,
             businessId: businessId,
         },
     });
};

/**
 * Updates an existing reward, ensuring it belongs to a specific business.
 */
export const updateReward = async (
    id: string,
    businessId: string,
    updateData: { name?: string; description?: string; pointsCost?: number; isActive?: boolean }
): Promise<Reward> => {
    const existingReward = await findRewardById(id, businessId);
    if (!existingReward) {
        const error = new Error(`Recompensa con ID ${id} no encontrada o no pertenece al negocio ${businessId}.`);
        console.error(error.message);
        throw error;
    }
    try {
        return await prisma.reward.update({
            where: { id: id },
            data: updateData,
        });
    } catch (error) {
       if (error instanceof Prisma.PrismaClientKnownRequestError) {
           console.error(`Prisma error updating reward ${id}:`, error);
           throw new Error(`Error de base de datos al actualizar recompensa: ${error.message}`);
       }
       console.error(`Unexpected error updating reward ${id}:`, error);
       throw new Error('Error inesperado al actualizar la recompensa.');
    }
};

/**
 * Deletes an existing reward, ensuring it belongs to a specific business.
 */
export const deleteReward = async (id: string, businessId: string): Promise<Reward> => {
    const existingReward = await findRewardById(id, businessId);
    if (!existingReward) {
        const error = new Error(`Recompensa con ID ${id} no encontrada o no pertenece al negocio ${businessId}.`);
        console.error(error.message);
        throw error;
    }
    try {
        return await prisma.reward.delete({
            where: { id: id },
        });
    } catch (error) {
        if (error instanceof Prisma.PrismaClientKnownRequestError) {
            console.error(`Prisma error deleting reward ${id}:`, error);
            if (error.code === 'P2003') {
                throw new Error('No se puede eliminar la recompensa porque está siendo utilizada.');
            }
           throw new Error(`Error de base de datos al eliminar recompensa: ${error.message}`);
        }
        console.error(`Unexpected error deleting reward ${id}:`, error);
        throw new Error('Error inesperado al eliminar la recompensa.');
    }
};

// End of File: backend/src/rewards/rewards.service.ts