// filename: backend/src/rewards/rewards.service.ts
// Version: 1.1.3 (Fix encoding, remove meta-comments)

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
    // Añadir log para trazabilidad
    console.log(`[Rewards SVC] Creating reward for business ${rewardData.businessId}: ${rewardData.name}`);
    try {
        return await prisma.reward.create({
            data: {
                name: rewardData.name,
                description: rewardData.description,
                pointsCost: rewardData.pointsCost,
                businessId: rewardData.businessId,
                // isActive por defecto es true según el schema (si no se especifica)
            },
        });
    } catch (error) {
        // Loguear error específico de Prisma si ocurre
        if (error instanceof Prisma.PrismaClientKnownRequestError) {
             console.error(`[Rewards SVC] Prisma error creating reward: ${error.code}`, error);
             // Podríamos querer lanzar un error más específico si es P2002 (unique constraint en name+businessId)
             if (error.code === 'P2002') {
                 throw new Error(`Ya existe una recompensa con el nombre "${rewardData.name}" para este negocio.`);
             }
        } else {
            console.error(`[Rewards SVC] Unexpected error creating reward:`, error);
        }
        // Relanzar un error genérico o el específico
        throw new Error('Error al crear la recompensa.');
    }
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
                pointsCost: true,
                description: true
            },
            orderBy: [ // Ordenar por coste y luego por nombre
                { pointsCost: 'asc' },
                { name: 'asc' }
            ]
        });
    } catch (error) {
        console.error(`[Rewards SVC] Error finding active rewards for business ${businessId}:`, error);
        // Lanzar un error genérico para que el controlador lo maneje
        throw new Error('Error al buscar las recompensas activas.'); // Corregido: genérico
    }
};


/**
 * Finds a single reward by its ID, ensuring it belongs to a specific business.
 */
export const findRewardById = async (id: string, businessId: string): Promise<Reward | null> => {
     console.log(`[Rewards SVC] Finding reward by ID ${id} for business ${businessId}`); // Log añadido
     try {
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
    updateData: { name?: string; description?: string; pointsCost?: number; isActive?: boolean }
): Promise<Reward> => {
    console.log(`[Rewards SVC] Updating reward ID ${id} for business ${businessId}`); // Log añadido
    // Primero verificar que existe y pertenece al negocio
    const existingReward = await findRewardById(id, businessId);
    if (!existingReward) {
        // Lanzar error específico que el controlador pueda capturar como 404
        const errorMsg = `Recompensa con ID ${id} no encontrada o no pertenece al negocio ${businessId}.`;
        console.error(`[Rewards SVC] ${errorMsg}`);
        throw new Error(errorMsg);
    }
    try {
        // Realizar la actualización
        return await prisma.reward.update({
            where: { id: id }, // id es único, no necesitamos businessId aquí
            data: updateData,
        });
    } catch (error) {
        if (error instanceof Prisma.PrismaClientKnownRequestError) {
            console.error(`[Rewards SVC] Prisma error updating reward ${id}: ${error.code}`, error);
            // Podríamos manejar P2002 si el cambio de nombre causa conflicto
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
    console.log(`[Rewards SVC] Deleting reward ID ${id} for business ${businessId}`); // Log añadido
    // Verificar existencia y pertenencia primero
    const existingReward = await findRewardById(id, businessId);
    if (!existingReward) {
        const errorMsg = `Recompensa con ID ${id} no encontrada o no pertenece al negocio ${businessId}.`;
        console.error(`[Rewards SVC] ${errorMsg}`);
        throw new Error(errorMsg); // Lanzar error para 404 en controlador
    }
    try {
        // Intentar eliminar
        return await prisma.reward.delete({
            where: { id: id },
        });
    } catch (error) {
        if (error instanceof Prisma.PrismaClientKnownRequestError) {
            console.error(`[Rewards SVC] Prisma error deleting reward ${id}: ${error.code}`, error);
            // Error común: restricción de clave externa (P2003) si la recompensa está en uso (ej: en GrantedReward)
            if (error.code === 'P2003') {
                throw new Error('No se puede eliminar la recompensa porque está siendo utilizada (ej: ha sido asignada como regalo).'); // Corregido: está
            }
           throw new Error(`Error de base de datos al eliminar recompensa: ${error.message}`);
        }
        console.error(`[Rewards SVC] Unexpected error deleting reward ${id}:`, error);
        throw new Error('Error inesperado al eliminar la recompensa.');
    }
};

// End of File: backend/src/rewards/rewards.service.ts