// File: backend/src/rewards/rewards.service.ts
// Version: 1.0.0

import { PrismaClient, Reward } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * Creates a new reward for a specific business.
 * @param rewardData - Data for the new reward (name, pointsCost, businessId, etc.).
 * @returns A promise that resolves with the created reward object.
 */
export const createReward = async (rewardData: {
    name: string;
    description?: string;
    pointsCost: number;
    businessId: string;
}): Promise<Reward> => {
    // Opcional: Verificar si el businessId existe antes de crear la recompensa.
    // Esto ya se puede validar a nivel de base de datos por la foreign key,
    // pero una verificacion temprana aqui podria dar un error mas amigable.
    // Por ahora, confiamos en la FK.

    return prisma.reward.create({
        data: {
            name: rewardData.name,
            description: rewardData.description,
            pointsCost: rewardData.pointsCost,
            businessId: rewardData.businessId, // Asigna la recompensa al negocio
            // isActive usa default(true)
        },
    });
};

/**
 * Finds all rewards for a specific business.
 * @param businessId - The ID of the business.
 * @returns A promise that resolves with an array of reward objects.
 */
export const findRewardsByBusiness = async (businessId: string): Promise<Reward[]> => {
    return prisma.reward.findMany({
        where: { businessId }, // Filtra recompensas por businessId
    });
};

/**
 * Finds a single reward by its ID, ensuring it belongs to a specific business.
 * @param id - The ID of the reward.
 * @param businessId - The ID of the business the reward should belong to.
 * @returns A promise that resolves with the reward object or null if not found or doesn't belong to the business.
 */
export const findRewardById = async (id: string, businessId: string): Promise<Reward | null> => {
    return prisma.reward.findUnique({
        where: {
            id,
            businessId, // Asegura que la recompensa encontrada pertenezca a este negocio
        },
    });
};

/**
 * Updates an existing reward, ensuring it belongs to a specific business.
 * @param id - The ID of the reward to update.
 * @param businessId - The ID of the business the reward should belong to.
 * @param updateData - Data to update the reward (name, pointsCost, isActive, etc.).
 * @returns A promise that resolves with the updated reward object.
 * @throws Error if the reward is not found or doesn't belong to the business.
 */
export const updateReward = async (
    id: string,
    businessId: string,
    updateData: { name?: string; description?: string; pointsCost?: number; isActive?: boolean }
): Promise<Reward> => {
    // Primero, verificar si la recompensa existe Y pertenece a este negocio
    const existingReward = await findRewardById(id, businessId);
    if (!existingReward) {
        // Si no se encuentra o no pertenece al negocio, lanzar un error
        const error = new Error(`Reward with ID ${id} not found or does not belong to business ${businessId}.`);
        console.error(error.message);
        throw error;
    }

    // Si existe y pertenece al negocio, proceder con la actualizacion
    return prisma.reward.update({
        where: { id }, // Actualiza por ID de recompensa
        data: updateData, // Aplica los datos de actualizacion
    });
};

/**
 * Deletes an existing reward, ensuring it belongs to a specific business.
 * @param id - The ID of the reward to delete.
 * @param businessId - The ID of the business the reward should belong to.
 * @returns A promise that resolves with the deleted reward object.
 * @throws Error if the reward is not found or doesn't belong to the business.
 */
export const deleteReward = async (id: string, businessId: string): Promise<Reward> => {
     // Primero, verificar si la recompensa existe Y pertenece a este negocio
    const existingReward = await findRewardById(id, businessId);
    if (!existingReward) {
        // Si no se encuentra o no pertenece al negocio, lanzar un error
        const error = new Error(`Reward with ID ${id} not found or does not belong to business ${businessId}.`);
        console.error(error.message);
        throw error;
    }

    // Si existe y pertenece al negocio, proceder con la eliminacion
    return prisma.reward.delete({
        where: { id }, // Elimina por ID de recompensa
    });
};


// Puedes añadir mas funciones de servicio de recompensas aqui en el futuro
// Por ejemplo: deactivateReward, activateReward, etc.


// End of File: backend/src/rewards/rewards.service.ts