// filename: backend/src/rewards/rewards.service.ts
// Version: 1.1.6 (Add diagnostic logs)

import { PrismaClient, Reward, Prisma, GrantedReward } from '@prisma/client';
const prisma = new PrismaClient();

// Interfaz CreateRewardData (incluye imageUrl)
interface CreateRewardData {
    name: string;
    description?: string;
    pointsCost: number;
    businessId: string;
    imageUrl?: string | null;
}

/**
 * Creates a new reward for a specific business.
 */
export const createReward = async (rewardData: CreateRewardData): Promise<Reward> => {
    console.log(`[Rewards SVC] Creating reward for business ${rewardData.businessId}: ${rewardData.name}`);
    // --- LOG DE DEBUG ---
    // Mostramos exactamente qué datos se intentan guardar, incluyendo imageUrl
    console.log('[DEBUG createReward] Saving data:', { ...rewardData });
    // --- FIN LOG DE DEBUG ---
    try {
        const newReward = await prisma.reward.create({
            data: {
                name: rewardData.name,
                description: rewardData.description,
                pointsCost: rewardData.pointsCost,
                businessId: rewardData.businessId,
                imageUrl: rewardData.imageUrl, // Se guarda si viene en rewardData
            },
        });
        console.log('[DEBUG createReward] Reward created:', newReward); // Log del resultado
        return newReward;
    } catch (error) {
        // ... (manejo de errores sin cambios) ...
        if (error instanceof Prisma.PrismaClientKnownRequestError) {
             console.error(`[Rewards SVC] Prisma error creating reward: ${error.code}`, error);
             if (error.code === 'P2002') { throw new Error(`Ya existe una recompensa con el nombre "${rewardData.name}" para este negocio.`); }
        } else { console.error(`[Rewards SVC] Unexpected error creating reward:`, error); }
        throw new Error('Error al crear la recompensa.');
    }
};

// Tipo RewardListItem (incluye imageUrl)
type RewardListItem = Pick<Reward, 'id' | 'name' | 'pointsCost' | 'description' | 'isActive' | 'imageUrl'>;

/**
 * Finds all rewards for a specific business, INCLUDING their active status and imageUrl.
 */
export const findRewardsByBusiness = async (businessId: string): Promise<RewardListItem[]> => {
    console.log(`[Rewards SVC] Finding ALL rewards (with isActive & imageUrl) for business ${businessId}`);
    // --- LOG DE DEBUG ---
    // Confirmamos qué campos estamos seleccionando
    const selectFields = { id: true, name: true, pointsCost: true, description: true, isActive: true, imageUrl: true };
    console.log('[DEBUG findRewardsByBusiness] Using select:', selectFields);
    // --- FIN LOG DE DEBUG ---
    try {
        const rewardsFound = await prisma.reward.findMany({
            where: { businessId: businessId, },
            select: selectFields, // Usamos la variable definida arriba
            orderBy: [ { pointsCost: 'asc' }, { name: 'asc' } ]
        });
        // --- LOG DE DEBUG ---
        // Mostramos los datos reales encontrados antes de devolverlos
        console.log('[DEBUG findRewardsByBusiness] Rewards found:', rewardsFound);
        // --- FIN LOG DE DEBUG ---
        return rewardsFound;
    } catch (error) {
        console.error(`[Rewards SVC] Error finding rewards for business ${businessId}:`, error);
        throw new Error('Error al buscar las recompensas.');
    }
};


/**
 * Finds a single reward by its ID, ensuring it belongs to a specific business.
 * (Returns full object including imageUrl)
 */
export const findRewardById = async (id: string, businessId: string): Promise<Reward | null> => {
     console.log(`[Rewards SVC] Finding reward by ID ${id} for business ${businessId}`);
     try {
         // No select, devuelve todos los campos escalares (incluye imageUrl)
         const reward = await prisma.reward.findFirst({ where: { id: id, businessId: businessId } });
         // console.log('[DEBUG findRewardById] Reward found:', reward); // Opcional: loguear resultado
         return reward;
     } catch (error) {
         console.error(`[Rewards SVC] Error finding reward by ID ${id}:`, error);
         throw new Error('Error al buscar la recompensa por ID.');
     }
};

// Tipo UpdateRewardData (incluye imageUrl)
type UpdateRewardData = Partial<Pick<Reward, 'name' | 'description' | 'pointsCost' | 'isActive' | 'imageUrl'>>;

/**
 * Updates an existing reward, ensuring it belongs to a specific business.
 */
export const updateReward = async (
    id: string,
    businessId: string,
    updateData: UpdateRewardData
): Promise<Reward> => {
    console.log(`[Rewards SVC] Updating reward ID ${id} for business ${businessId}`);
    const existingReward = await findRewardById(id, businessId); // Verifica pertenencia
    if (!existingReward) { throw new Error(`Recompensa con ID ${id} no encontrada o no pertenece al negocio ${businessId}.`); }

    // --- LOG DE DEBUG ---
    // Mostramos qué datos se intentan actualizar
    console.log('[DEBUG updateReward] Updating with data:', { ...updateData });
    // --- FIN LOG DE DEBUG ---
    try {
        const updatedReward = await prisma.reward.update({
            where: { id: id },
            data: updateData, // Prisma actualiza solo los campos presentes en updateData
        });
        console.log('[DEBUG updateReward] Reward updated:', updatedReward); // Log del resultado
        return updatedReward;
    } catch (error) {
        // ... (manejo de errores sin cambios) ...
        if (error instanceof Prisma.PrismaClientKnownRequestError) {
            console.error(`[Rewards SVC] Prisma error updating reward ${id}: ${error.code}`, error);
            if (error.code === 'P2002') { throw new Error(`Ya existe otra recompensa con el nombre "${updateData.name}" para este negocio.`); }
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
    // ... (código sin cambios, no interactúa con imageUrl directamente aquí) ...
    console.log(`[Rewards SVC] Deleting reward ID ${id} for business ${businessId}`);
    const existingReward = await findRewardById(id, businessId);
    if (!existingReward) { throw new Error(`Recompensa con ID ${id} no encontrada o no pertenece al negocio ${businessId}.`); }
    const relatedGrantsCount = await prisma.grantedReward.count({ where: { rewardId: id } });
    if (relatedGrantsCount > 0) { throw new Error(`No se puede eliminar la recompensa "${existingReward.name}" (${id}) porque está siendo utilizada (ej: ha sido asignada como regalo ${relatedGrantsCount} veces).`); }
    try {
        return await prisma.reward.delete({ where: { id: id } });
    } catch (error) {
        if (error instanceof Prisma.PrismaClientKnownRequestError) {
            console.error(`[Rewards SVC] Prisma error deleting reward ${id}: ${error.code}`, error);
           throw new Error(`Error de base de datos al eliminar recompensa: ${error.message}`);
        }
        console.error(`[Rewards SVC] Unexpected error deleting reward ${id}:`, error);
        throw new Error('Error inesperado al eliminar la recompensa.');
    }
};

// End of File: backend/src/rewards/rewards.service.ts