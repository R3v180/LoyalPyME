// filename: backend/src/rewards/rewards.service.ts
// Version: 1.1.4 (Ensure isActive is selected and returned)

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
    console.log(`[Rewards SVC] Creating reward for business ${rewardData.businessId}: ${rewardData.name}`);
    try {
        // isActive por defecto es true según el schema (si no se especifica)
        // No es necesario incluirlo explícitamente aquí si el default funciona.
        return await prisma.reward.create({
            data: {
                name: rewardData.name,
                description: rewardData.description,
                pointsCost: rewardData.pointsCost,
                businessId: rewardData.businessId,
            },
        });
    } catch (error) {
        if (error instanceof Prisma.PrismaClientKnownRequestError) {
             console.error(`[Rewards SVC] Prisma error creating reward: ${error.code}`, error);
             if (error.code === 'P2002') {
                 throw new Error(`Ya existe una recompensa con el nombre "${rewardData.name}" para este negocio.`);
             }
        } else {
            console.error(`[Rewards SVC] Unexpected error creating reward:`, error);
        }
        throw new Error('Error al crear la recompensa.');
    }
};

/**
 * Finds all rewards for a specific business, INCLUDING their active status.
 * Returns selected fields needed for the admin management list.
 * Orders by pointsCost ascending, then name ascending.
 */
export const findRewardsByBusiness = async (
    businessId: string
    // --- FIX: Ensure return type includes isActive ---
): Promise<Pick<Reward, 'id' | 'name' | 'pointsCost' | 'description' | 'isActive'>[]> => {
    console.log(`[Rewards SVC] Finding ALL rewards (with isActive) for business ${businessId}`);
    try {
        return await prisma.reward.findMany({
            where: {
                businessId: businessId,
                // NO filtramos por isActive aquí para obtener TODAS y mostrar su estado
            },
            // --- FIX: Ensure isActive is explicitly selected ---
            select: {
                 id: true,
                 name: true,
                 pointsCost: true,
                 description: true,
                 isActive: true // <-- ASEGURARSE QUE ESTÁ AQUÍ
            },
            orderBy: [
                 { pointsCost: 'asc' },
                 { name: 'asc' }
            ]
        });
    } catch (error) {
        console.error(`[Rewards SVC] Error finding rewards for business ${businessId}:`, error);
        throw new Error('Error al buscar las recompensas.');
    }
};


/**
 * Finds a single reward by its ID, ensuring it belongs to a specific business.
 */
export const findRewardById = async (id: string, businessId: string): Promise<Reward | null> => {
     console.log(`[Rewards SVC] Finding reward by ID ${id} for business ${businessId}`);
     try {
        // Devuelve el objeto completo si lo encuentra
        return await prisma.reward.findFirst({
            where: {
                id: id,
                businessId: businessId,
            },
        });
     } catch (error) {
         console.error(`[Rewards SVC] Error finding reward by ID ${id}:`, error);
         throw new Error('Error al buscar la recompensa por ID.');
     }
};

/**
 * Updates an existing reward, ensuring it belongs to a specific business.
 */
export const updateReward = async (
    id: string,
    businessId: string,
    updateData: Partial<Pick<Reward, 'name' | 'description' | 'pointsCost' | 'isActive'>> // Update type to use Partial<Pick<...>>
): Promise<Reward> => {
    console.log(`[Rewards SVC] Updating reward ID ${id} for business ${businessId}`);
    // Verificar que existe y pertenece al negocio
    const existingReward = await findRewardById(id, businessId);
    if (!existingReward) {
        const errorMsg = `Recompensa con ID ${id} no encontrada o no pertenece al negocio ${businessId}.`;
        console.error(`[Rewards SVC] ${errorMsg}`);
        throw new Error(errorMsg);
    }
    try {
        // Realizar la actualización
        return await prisma.reward.update({
            where: { id: id },
            data: updateData, // Pasar los datos directamente
        });
    } catch (error) {
        if (error instanceof Prisma.PrismaClientKnownRequestError) {
            console.error(`[Rewards SVC] Prisma error updating reward ${id}: ${error.code}`, error);
            if (error.code === 'P2002') {
                 throw new Error(`Ya existe otra recompensa con el nombre "${updateData.name}" para este negocio.`);
             }
            throw new Error(`Error de base de datos al actualizar recompensa: ${error.message}`);
         }
        console.error(`[Rewards SVC] Unexpected error updating reward ${id}:`, error);
        throw new Error('Error inesperado al actualizar la recompensa.');
    }
};

/**
 * Deletes an existing reward, ensuring it belongs to a specific business.
 */
export const deleteReward = async (id: string, businessId: string): Promise<Reward> => {
    console.log(`[Rewards SVC] Deleting reward ID ${id} for business ${businessId}`);
    // Verificar existencia y pertenencia primero
    const existingReward = await findRewardById(id, businessId);
    if (!existingReward) {
        const errorMsg = `Recompensa con ID ${id} no encontrada o no pertenece al negocio ${businessId}.`;
        console.error(`[Rewards SVC] ${errorMsg}`);
        throw new Error(errorMsg);
    }

    // --- Check for usage before deleting ---
    const relatedGrantsCount = await prisma.grantedReward.count({
        where: { rewardId: id }
    });

    if (relatedGrantsCount > 0) {
        const errorMsg = `No se puede eliminar la recompensa "${existingReward.name}" (${id}) porque está siendo utilizada (ej: ha sido asignada como regalo ${relatedGrantsCount} veces).`;
        console.warn(`[Rewards SVC] ${errorMsg}`);
        throw new Error(errorMsg);
    }
    // --- End Check ---

    try {
        // Intentar eliminar
        return await prisma.reward.delete({
            where: { id: id },
        });
    } catch (error) {
        // Catch specific Prisma errors if needed, although P2003 should be caught by the check above now.
        if (error instanceof Prisma.PrismaClientKnownRequestError) {
            console.error(`[Rewards SVC] Prisma error deleting reward ${id}: ${error.code}`, error);
            // P2025: Not found (should have been caught by findRewardById)
            // P2003: Foreign key constraint (should be caught by the check above)
           throw new Error(`Error de base de datos al eliminar recompensa: ${error.message}`);
        }
        console.error(`[Rewards SVC] Unexpected error deleting reward ${id}:`, error);
        throw new Error('Error inesperado al eliminar la recompensa.');
    }
};

// End of File: backend/src/rewards/rewards.service.ts