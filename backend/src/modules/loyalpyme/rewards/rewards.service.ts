// backend/src/modules/loyalpyme/rewards/rewards.service.ts
// Version: 2.0.1 - Fixed missing DiscountType import

import { PrismaClient, Reward, Prisma, GrantedReward, GrantedRewardStatus, ActivityType, RewardType, DiscountType } from '@prisma/client';

const prisma = new PrismaClient();

// --- INTERFACES ACTUALIZADAS ---
// Interfaz para la creación, ahora incluye todos los campos del nuevo formulario
interface CreateRewardData {
    name_es: string;
    name_en: string;
    description_es?: string | null;
    description_en?: string | null;
    pointsCost: number;
    businessId: string;
    imageUrl?: string | null;
    type: RewardType;
    discountType?: DiscountType | null;
    discountValue?: number | string | null;
    linkedMenuItemId?: string | null;
    kdsDestination?: string | null;
}

// Interfaz para la actualización, ahora es un parcial de la de creación
type UpdateRewardData = Partial<CreateRewardData>;


// --- SERVICIOS CRUD EXISTENTES (REVISADOS) ---

/**
 * Creates a new reward for a specific business.
 */
export const createReward = async (rewardData: CreateRewardData): Promise<Reward> => {
    console.log(`[Rewards SVC] Creating reward for business ${rewardData.businessId}: ${rewardData.name_es}`);
    try {
        const newReward = await prisma.reward.create({
            data: {
                ...rewardData,
                discountValue: rewardData.discountValue ? new Prisma.Decimal(rewardData.discountValue.toString()) : undefined,
            },
        });
        return newReward;
    } catch (error) {
        if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
            throw new Error(`Ya existe una recompensa con este nombre para el negocio.`);
        }
        console.error(`[Rewards SVC] Unexpected error creating reward:`, error);
        throw new Error('Error al crear la recompensa.');
    }
};

/**
 * Finds all rewards for a specific business.
 */
export const findRewardsByBusiness = async (businessId: string): Promise<Reward[]> => {
    console.log(`[Rewards SVC] Finding ALL rewards for business ${businessId}`);
    try {
        return await prisma.reward.findMany({
            where: { businessId: businessId },
            orderBy: [{ pointsCost: 'asc' }, { name_es: 'asc' }]
        });
    } catch (error) {
        console.error(`[Rewards SVC] Error finding rewards for business ${businessId}:`, error);
        throw new Error('Error al buscar las recompensas.');
    }
};

/**
 * Finds a single reward by its ID.
 */
export const findRewardById = async (id: string, businessId: string): Promise<Reward | null> => {
    console.log(`[Rewards SVC] Finding reward by ID ${id} for business ${businessId}`);
    try {
        return await prisma.reward.findFirst({ where: { id, businessId } });
    } catch (error) {
        console.error(`[Rewards SVC] Error finding reward by ID ${id}:`, error);
        throw new Error('Error al buscar la recompensa por ID.');
    }
};


/**
 * Updates an existing reward.
 */
export const updateReward = async (id: string, businessId: string, updateData: UpdateRewardData): Promise<Reward> => {
    console.log(`[Rewards SVC] Updating reward ID ${id} for business ${businessId}`);
    const existingReward = await findRewardById(id, businessId);
    if (!existingReward) {
        throw new Error(`Recompensa con ID ${id} no encontrada o no pertenece al negocio.`);
    }

    try {
        const dataToUpdate: Prisma.RewardUpdateInput = { ...updateData };
        if (updateData.discountValue !== undefined && updateData.discountValue !== null) {
            dataToUpdate.discountValue = new Prisma.Decimal(updateData.discountValue.toString());
        }

        return await prisma.reward.update({
            where: { id },
            data: dataToUpdate,
        });
    } catch (error) {
        if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
            throw new Error(`Conflicto de unicidad al actualizar la recompensa (el nombre ya existe).`);
        }
        console.error(`[Rewards SVC] Unexpected error updating reward ${id}:`, error);
        throw new Error('Error inesperado al actualizar la recompensa.');
    }
};


/**
 * Deletes an existing reward.
 */
export const deleteReward = async (id: string, businessId: string): Promise<Reward> => {
    console.log(`[Rewards SVC] Deleting reward ID ${id} for business ${businessId}`);
    const existingReward = await findRewardById(id, businessId);
    if (!existingReward) {
        throw new Error(`Recompensa no encontrada.`);
    }

    const relatedGrantsCount = await prisma.grantedReward.count({ where: { rewardId: id } });
    if (relatedGrantsCount > 0) {
        throw new Error(`No se puede eliminar la recompensa "${existingReward.name_es}" porque está siendo utilizada.`);
    }

    try {
        return await prisma.reward.delete({ where: { id } });
    } catch (error) {
        console.error(`[Rewards SVC] Error deleting reward ${id}:`, error);
        throw new Error('Error inesperado al eliminar la recompensa.');
    }
};


// --- NUEVOS SERVICIOS PARA EL FLUJO "REDIMIR Y APLICAR" ---

/**
 * Permite a un usuario gastar sus puntos para "comprar" una recompensa,
 * que se guardará en su cuenta como un cupón disponible.
 * @param userId El ID del usuario que redime.
 * @param rewardId El ID de la recompensa a redimir.
 * @returns El `GrantedReward` (cupón) creado.
 */
export const redeemRewardForLater = async (userId: string, rewardId: string): Promise<GrantedReward> => {
    console.log(`[Rewards SVC] User ${userId} is attempting to acquire reward ${rewardId}`);

    return prisma.$transaction(async (tx) => {
        // 1. Obtener datos del usuario y de la recompensa en una sola consulta
        const user = await tx.user.findUnique({ where: { id: userId } });
        const reward = await tx.reward.findUnique({ where: { id: rewardId } });

        if (!user) throw new Error("Usuario no encontrado.");
        if (!reward) throw new Error("Recompensa no encontrada.");
        if (!reward.isActive) throw new Error("Esta recompensa no está activa actualmente.");
        
        // 2. Verificar si el usuario tiene suficientes puntos
        if (user.points < reward.pointsCost) {
            throw new Error(`No tienes suficientes puntos. Necesitas ${reward.pointsCost} y tienes ${user.points}.`);
        }

        // 3. Debitar los puntos del usuario
        const updatedUser = await tx.user.update({
            where: { id: userId },
            data: {
                points: {
                    decrement: reward.pointsCost
                }
            }
        });
        console.log(`[Rewards SVC] Debited ${reward.pointsCost} points from user ${userId}. New balance: ${updatedUser.points}`);

        // 4. Crear el "cupón" o "vale" digital (GrantedReward)
        const newGrantedReward = await tx.grantedReward.create({
            data: {
                userId: user.id,
                rewardId: reward.id,
                businessId: reward.businessId,
                status: GrantedRewardStatus.AVAILABLE,
                redeemedAt: new Date(), // 'redeemedAt' ahora significa 'adquirido en'
            }
        });
        console.log(`[Rewards SVC] Created AVAILABLE GrantedReward ${newGrantedReward.id} for user ${userId}`);

        // 5. Registrar la transacción en el historial
        await tx.activityLog.create({
            data: {
                userId: user.id,
                businessId: reward.businessId,
                type: ActivityType.REWARD_ACQUIRED,
                pointsChanged: -reward.pointsCost,
                description: `Has obtenido la recompensa: "${reward.name_es}"`,
                relatedRewardId: reward.id,
                relatedGrantedRewardId: newGrantedReward.id,
            }
        });
        
        return newGrantedReward;
    });
};


/**
 * Obtiene todos los cupones disponibles (listos para aplicar) de un usuario.
 * @param userId El ID del usuario.
 * @returns Una lista de `GrantedReward` con sus recompensas asociadas.
 */
export const getAvailableRewardsForUser = async (userId: string): Promise<GrantedReward[]> => {
    console.log(`[Rewards SVC] Fetching AVAILABLE granted rewards for user ${userId}`);
    try {
        return await prisma.grantedReward.findMany({
            where: {
                userId,
                status: GrantedRewardStatus.AVAILABLE,
                // Opcional: añadir filtro de expiración
                // expiresAt: { gte: new Date() } 
            },
            include: {
                reward: true // Incluir toda la información de la recompensa para la UI
            },
            orderBy: {
                assignedAt: 'desc'
            }
        });
    } catch (error) {
        console.error(`[Rewards SVC] Error fetching available rewards for user ${userId}:`, error);
        throw new Error('Error al obtener tus recompensas disponibles.');
    }
};

// End of File