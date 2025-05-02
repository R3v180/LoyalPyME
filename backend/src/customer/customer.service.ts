// filename: backend/src/customer/customer.service.ts
// Version: 2.1.2 (Add diagnostic logs for reward fetching)

import { PrismaClient, Reward, Prisma, User, GrantedReward, Business, TierCalculationBasis } from '@prisma/client';

const prisma = new PrismaClient();

// Tipo para la configuración que ve el cliente
export type CustomerBusinessConfig = Pick<Business, 'tierCalculationBasis'> | null;

/**
 * Encuentra todas las recompensas activas para un negocio específico.
 * Utilizado por el cliente para ver qué puede canjear.
 * Devuelve todos los campos de Reward, incluyendo imageUrl.
 */
export const findActiveRewardsForCustomer = async ( businessId: string ): Promise<Reward[]> => {
  console.log( `[CUST_SVC] Finding active rewards for business: ${businessId}` );
  try {
    const rewards = await prisma.reward.findMany({
        where: { businessId: businessId, isActive: true, },
        orderBy: { pointsCost: 'asc', },
        // Sin 'select', devuelve todos los campos por defecto (incluyendo imageUrl)
    });
    console.log( `[CUST_SVC] Found ${rewards.length} active rewards for business ${businessId}` );
    // --- LOG DE DEBUG ---
    // Muestra las recompensas encontradas, verifica si tienen 'imageUrl'
    console.log('[DEBUG findActiveRewardsForCustomer] Rewards found:', rewards);
    // --- FIN LOG DE DEBUG ---
    return rewards;
  } catch (error) {
    console.error( `[CUST_SVC] Error fetching active rewards for business ${businessId}:`, error );
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
        throw new Error(`Error de base de datos al buscar recompensas: ${error.message}`);
    }
    throw new Error('Error inesperado al buscar recompensas activas.');
  }
};


/**
 * Obtiene las recompensas otorgadas (regalos) que están pendientes de canjear por un usuario.
 * Incluye los detalles de la recompensa base (nombre, desc, imageUrl).
 */
export const getPendingGrantedRewards = async (userId: string): Promise<GrantedReward[]> => {
    console.log(`[CUST_SVC] Fetching pending granted rewards for user ${userId}`);
    try {
        const grantedRewards = await prisma.grantedReward.findMany({
            where: { userId: userId, status: 'PENDING' },
            include: {
                reward: {
                    select: { // Select CORREGIDO (ya incluía imageUrl)
                        id: true,
                        name: true,
                        description: true,
                        imageUrl: true
                    }
                },
                assignedBy: { select: { name: true, email: true } },
                business: { select: { name: true } }
            },
            orderBy: { assignedAt: 'desc' }
        });
        console.log(`[CUST_SVC] Found ${grantedRewards.length} pending granted rewards for user ${userId}`);
        // --- LOG DE DEBUG ---
        // Muestra los regalos encontrados, verifica si tienen 'reward.imageUrl' anidado
        console.log('[DEBUG getPendingGrantedRewards] Granted rewards found (check nested reward.imageUrl):', JSON.stringify(grantedRewards, null, 2));
        // --- FIN LOG DE DEBUG ---
        return grantedRewards;
    } catch (error) {
        console.error(`[CUST_SVC] Error fetching pending granted rewards for user ${userId}:`, error);
        if (error instanceof Prisma.PrismaClientKnownRequestError) {
             throw new Error(`Error de base de datos al buscar recompensas otorgadas: ${error.message}`);
        }
        throw new Error('Error inesperado al buscar recompensas otorgadas.');
    }
};

/**
 * Permite a un cliente canjear una recompensa que le fue otorgada (un regalo).
 * Marca el estado de GrantedReward como 'REDEEMED'.
 */
export const redeemGrantedReward = async ( userId: string, grantedRewardId: string ): Promise<GrantedReward> => {
    // ... (código sin cambios) ...
    console.log(`[CUST_SVC] User ${userId} attempting to redeem granted reward ${grantedRewardId}`);
    try {
        const updatedGrantedReward = await prisma.$transaction(async (tx) => {
            const grantedReward = await tx.grantedReward.findUnique({
                where: { id: grantedRewardId },
                include: { reward: { select: { name: true }} }
            });

            if (!grantedReward) { throw new Error(`Regalo con ID ${grantedRewardId} no encontrado.`); }
            if (grantedReward.userId !== userId) {
                console.warn(`[CUST_SVC] Unauthorized attempt by user ${userId} to redeem granted reward ${grantedRewardId} belonging to user ${grantedReward.userId}`);
                throw new Error("Este regalo no te pertenece.");
            }
            if (grantedReward.status !== 'PENDING') {
                throw new Error(`Este regalo (${grantedReward.reward.name}) ya fue canjeado o no es válido (Estado: ${grantedReward.status}).`);
            }

            const redeemed = await tx.grantedReward.update({
                where: { id: grantedRewardId, userId: userId, status: 'PENDING' },
                data: { status: 'REDEEMED', redeemedAt: new Date() }
            });
            console.log(`[CUST_SVC] Granted reward ${grantedRewardId} (${redeemed.rewardId}) successfully redeemed by user ${userId}`);
            return redeemed;
        });
        return updatedGrantedReward;

    } catch (error) {
        // ... (manejo de errores sin cambios) ...
        console.error(`[CUST_SVC] Error redeeming granted reward ${grantedRewardId} for user ${userId}:`, error);
        if (error instanceof Prisma.PrismaClientKnownRequestError) {
            if (error.code === 'P2025') { throw new Error("El regalo no se encontró o ya no estaba pendiente al intentar canjearlo."); }
            throw new Error(`Error de base de datos al canjear el regalo: ${error.message}`);
        }
        if (error instanceof Error) { throw error; }
        throw new Error('Error inesperado al canjear el regalo.');
    }
};


/**
 * Obtiene la configuración del negocio relevante para el cliente.
 * Por ahora, solo devuelve la base de cálculo para los tiers.
 */
export const getCustomerFacingBusinessConfig = async (businessId: string): Promise<CustomerBusinessConfig> => {
    // ... (código sin cambios) ...
    console.log(`[CUST_SVC] Fetching customer-facing config for business: ${businessId}`);
    try {
        const config = await prisma.business.findUnique({
            where: { id: businessId },
            select: { tierCalculationBasis: true }
        });

        if (!config) {
            console.warn(`[CUST_SVC] Business not found when fetching config: ${businessId}`);
            return null;
        }
        return { tierCalculationBasis: config.tierCalculationBasis ?? null };
    } catch (error) {
        console.error(`[CUST_SVC] Error fetching customer-facing config for business ${businessId}:`, error);
        throw new Error('Error al obtener la configuración del negocio.');
    }
};

// End of File: backend/src/customer/customer.service.ts