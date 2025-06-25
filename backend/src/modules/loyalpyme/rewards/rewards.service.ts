// filename: backend/src/rewards/rewards.service.ts
// Version: 1.2.1 (Use generated i18n Reward types correctly)

import { PrismaClient, Reward, Prisma, GrantedReward } from '@prisma/client';

const prisma = new PrismaClient();

// Interfaz CreateRewardData (Usa los campos correctos del schema)
interface CreateRewardData {
    name_es: string;
    name_en: string;
    description_es?: string | null;
    description_en?: string | null;
    pointsCost: number;
    businessId: string;
    imageUrl?: string | null;
}

/**
 * Creates a new reward for a specific business with i18n fields.
 */
export const createReward = async (rewardData: CreateRewardData): Promise<Reward> => {
    console.log(`[Rewards SVC] Creating reward for business ${rewardData.businessId}: ${rewardData.name_es} / ${rewardData.name_en}`);
    console.log('[DEBUG createReward] Saving data:', { ...rewardData });
    try {
        // Prisma create ya espera los campos correctos (name_es, etc.)
        // según el cliente generado después de la migración
        const newReward = await prisma.reward.create({
            data: {
                name_es: rewardData.name_es,
                name_en: rewardData.name_en,
                description_es: rewardData.description_es,
                description_en: rewardData.description_en,
                pointsCost: rewardData.pointsCost,
                businessId: rewardData.businessId,
                imageUrl: rewardData.imageUrl,
            },
        });
        console.log('[DEBUG createReward] Reward created:', newReward);
        return newReward;
    } catch (error) {
        if (error instanceof Prisma.PrismaClientKnownRequestError) {
            console.error(`[Rewards SVC] Prisma error creating reward: ${error.code}`, error);
             if (error.code === 'P2002') {
                const target = (error.meta?.target as string[]) || [];
                // Usamos name_es en el mensaje como ejemplo
                if (target.includes('name_es')) { throw new Error(`Ya existe una recompensa con el nombre (ES) "${rewardData.name_es}" para este negocio.`); }
                if (target.includes('name_en')) { throw new Error(`Ya existe una recompensa con el nombre (EN) "${rewardData.name_en}" para este negocio.`); }
                 throw new Error(`Conflicto de unicidad al crear la recompensa (nombre ES o EN ya existen).`);
             }
        } else { console.error(`[Rewards SVC] Unexpected error creating reward:`, error); }
        throw new Error('Error al crear la recompensa.');
    }
};

// --- Tipo RewardListItem ACTUALIZADO ---
// Ahora usa los campos correctos que seleccionaremos
type RewardListItem = Pick<
    Reward,
    'id' | 'name_es' | 'name_en' | 'pointsCost' | 'description_es' | 'description_en' | 'isActive' | 'imageUrl'
>;

/**
 * Finds all rewards for a specific business, selecting i18n fields.
 */
export const findRewardsByBusiness = async (businessId: string): Promise<RewardListItem[]> => {
    console.log(`[Rewards SVC] Finding ALL rewards (with i18n fields) for business ${businessId}`);
    // Select ya está actualizado para seleccionar los campos correctos
    const selectFields = {
        id: true,
        name_es: true,
        name_en: true,
        pointsCost: true,
        description_es: true,
        description_en: true,
        isActive: true,
        imageUrl: true
    };
    console.log('[DEBUG findRewardsByBusiness] Using select:', selectFields);
    try {
        const rewardsFound = await prisma.reward.findMany({
            where: { businessId: businessId, },
            select: selectFields,
            // Usar name_es para ordenar (o name_en si se prefiere)
            orderBy: [ { pointsCost: 'asc' }, { name_es: 'asc' } ]
        });
        console.log('[DEBUG findRewardsByBusiness] Rewards found:', rewardsFound);
        // El tipo de retorno ahora coincide con RewardListItem actualizado
        return rewardsFound;
    } catch (error) {
        console.error(`[Rewards SVC] Error finding rewards for business ${businessId}:`, error);
        throw new Error('Error al buscar las recompensas.');
    }
};


/**
 * Finds a single reward by its ID, ensuring it belongs to a specific business.
 * (Returns full object including i18n fields)
 */
export const findRewardById = async (id: string, businessId: string): Promise<Reward | null> => {
     console.log(`[Rewards SVC] Finding reward by ID ${id} for business ${businessId}`);
     try {
         // findFirst devuelve el tipo Reward completo (que ahora tiene name_es, etc.)
         const reward = await prisma.reward.findFirst({ where: { id: id, businessId: businessId } });
         return reward;
     } catch (error) {
         console.error(`[Rewards SVC] Error finding reward by ID ${id}:`, error);
         throw new Error('Error al buscar la recompensa por ID.');
     }
};

// --- Tipo UpdateRewardData ACTUALIZADO ---
// Ahora Partial<Pick<...>> usa los campos correctos
type UpdateRewardData = Partial<Pick<
    Reward,
    'name_es' | 'name_en' | 'description_es' | 'description_en' | 'pointsCost' | 'isActive' | 'imageUrl'
>>;

/**
 * Updates an existing reward with i18n fields, ensuring it belongs to a specific business.
 */
export const updateReward = async (
    id: string,
    businessId: string,
    updateData: UpdateRewardData // Usa el tipo actualizado
): Promise<Reward> => {
    console.log(`[Rewards SVC] Updating reward ID ${id} for business ${businessId}`);
    const existingReward = await findRewardById(id, businessId);
    if (!existingReward) { throw new Error(`Recompensa con ID ${id} no encontrada o no pertenece al negocio ${businessId}.`); }

    console.log('[DEBUG updateReward] Updating with data:', { ...updateData });
    try {
        // updateData ya debe contener los nombres de campo correctos (name_es, etc.)
        const updatedReward = await prisma.reward.update({
            where: { id: id },
            data: updateData,
        });
        console.log('[DEBUG updateReward] Reward updated:', updatedReward);
        return updatedReward;
    } catch (error) {
        if (error instanceof Prisma.PrismaClientKnownRequestError) {
            console.error(`[Rewards SVC] Prisma error updating reward ${id}: ${error.code}`, error);
            // Comprobar unicidad en ambos nombres si se están actualizando
             if (error.code === 'P2002') {
                const target = (error.meta?.target as string[]) || [];
                 if (target.includes('name_es') && updateData.name_es) { // Comprobar si se intentó actualizar name_es
                     throw new Error(`Ya existe otra recompensa con el nombre (ES) "${updateData.name_es}" para este negocio.`);
                 }
                  if (target.includes('name_en') && updateData.name_en) { // Comprobar si se intentó actualizar name_en
                     throw new Error(`Ya existe otra recompensa con el nombre (EN) "${updateData.name_en}" para este negocio.`);
                  }
                 throw new Error(`Conflicto de unicidad al actualizar la recompensa (nombre ES o EN ya existen).`);
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
    const existingReward = await findRewardById(id, businessId); // Ahora existingReward tiene name_es, name_en
    if (!existingReward) { throw new Error(`Recompensa con ID ${id} no encontrada o no pertenece al negocio ${businessId}.`); }

    const relatedGrantsCount = await prisma.grantedReward.count({ where: { rewardId: id } });
    if (relatedGrantsCount > 0) {
        // Usar name_es o name_en (o ID) en el mensaje de error
        const displayName = existingReward.name_es || existingReward.name_en || `ID ${id}`;
        throw new Error(`No se puede eliminar la recompensa "${displayName}" porque está siendo utilizada (ej: ha sido asignada como regalo ${relatedGrantsCount} veces).`);
    }
    try {
        // delete no necesita cambios, usa el where { id }
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