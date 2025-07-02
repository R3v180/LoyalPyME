// backend/src/modules/loyalpyme/rewards/rewards.service.ts
// VERSIÓN 3.0.0 - Eliminados los servicios de canje obsoletos (redeemRewardForLater, getAvailableRewardsForUser)

import { PrismaClient, Reward, Prisma, RewardType, DiscountType } from '@prisma/client';

const prisma = new PrismaClient();

// --- TIPOS DE DATOS ---
// Estos tipos se mantienen para el CRUD de recompensas desde el panel de admin.
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

type UpdateRewardData = Partial<CreateRewardData & { isActive?: boolean }>;

// --- SERVICIOS CRUD (SE MANTIENEN PARA EL PANEL DE ADMIN) ---

export const createReward = async (rewardData: CreateRewardData): Promise<Reward> => {
    console.log(`[Rewards SVC] Creating reward for business ${rewardData.businessId}: ${rewardData.name_es}`);
    try {
        const newReward = await prisma.reward.create({
            data: {
                ...rewardData,
                // Prisma espera Decimal, por lo que convertimos el valor del descuento
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

export const findRewardById = async (id: string, businessId: string): Promise<Reward | null> => {
    console.log(`[Rewards SVC] Finding reward by ID ${id} for business ${businessId}`);
    try {
        return await prisma.reward.findFirst({ where: { id, businessId } });
    } catch (error) {
        console.error(`[Rewards SVC] Error finding reward by ID ${id}:`, error);
        throw new Error('Error al buscar la recompensa por ID.');
    }
};

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

export const deleteReward = async (id: string, businessId: string): Promise<Reward> => {
    console.log(`[Rewards SVC] Deleting reward ID ${id} for business ${businessId}`);
    const existingReward = await findRewardById(id, businessId);
    if (!existingReward) {
        throw new Error(`Recompensa no encontrada.`);
    }
    // Verificar si está en uso en GrantedRewards
    const relatedGrantsCount = await prisma.grantedReward.count({ where: { rewardId: id } });
    if (relatedGrantsCount > 0) {
        throw new Error(`No se puede eliminar la recompensa "${existingReward.name_es}" porque está siendo utilizada en regalos o cupones ya asignados.`);
    }
    // Verificar si está en uso en Orders
    const relatedOrdersCount = await prisma.order.count({ where: { appliedLcoRewardId: id }});
    if (relatedOrdersCount > 0) {
        throw new Error(`No se puede eliminar la recompensa "${existingReward.name_es}" porque está siendo utilizada en pedidos históricos.`);
    }

    try {
        return await prisma.reward.delete({ where: { id } });
    } catch (error) {
        console.error(`[Rewards SVC] Error deleting reward ${id}:`, error);
        throw new Error('Error inesperado al eliminar la recompensa.');
    }
};

// --- SERVICIOS DE CANJE OBSOLETOS (ELIMINADOS) ---
// La función `redeemRewardForLater` ha sido eliminada.
// La función `getAvailableRewardsForUser` ha sido eliminada.