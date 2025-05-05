// filename: backend/src/customer/customer.service.ts
// Version: 2.2.0 (Add ActivityLog creation on gift redemption)

import {
    PrismaClient,
    Reward,
    Prisma,
    User,
    GrantedReward,
    Business,
    TierCalculationBasis,
    ActivityType // <-- Importar ActivityType
} from '@prisma/client';

const prisma = new PrismaClient();

// Tipo para la configuración que ve el cliente (sin cambios)
export type CustomerBusinessConfig = Pick<Business, 'tierCalculationBasis'> | null;

// findActiveRewardsForCustomer (sin cambios respecto a la última versión)
export const findActiveRewardsForCustomer = async ( businessId: string ): Promise<Reward[]> => {
  console.log( `[CUST_SVC] Finding active rewards for business: ${businessId}` );
  try {
    const rewards = await prisma.reward.findMany({
        where: { businessId: businessId, isActive: true, },
        orderBy: { pointsCost: 'asc', },
        // Sin 'select', devuelve todos los campos por defecto (incluyendo imageUrl)
    });
    console.log( `[CUST_SVC] Found ${rewards.length} active rewards for business ${businessId}` );
    console.log('[DEBUG findActiveRewardsForCustomer] Rewards found:', rewards);
    return rewards;
  } catch (error) {
    console.error( `[CUST_SVC] Error fetching active rewards for business ${businessId}:`, error );
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
        throw new Error(`Error de base de datos al buscar recompensas: ${error.message}`);
    }
    throw new Error('Error inesperado al buscar recompensas activas.');
  }
};

// getPendingGrantedRewards (sin cambios respecto a la última versión)
export const getPendingGrantedRewards = async (userId: string): Promise<GrantedReward[]> => {
    console.log(`[CUST_SVC] Fetching pending granted rewards for user ${userId}`);
    try {
        const grantedRewards = await prisma.grantedReward.findMany({
            where: { userId: userId, status: 'PENDING' },
            include: {
                reward: {
                    select: {
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
        console.log('[DEBUG getPendingGrantedRewards] Granted rewards found:', JSON.stringify(grantedRewards, null, 2));
        return grantedRewards;
    } catch (error) {
        console.error(`[CUST_SVC] Error fetching pending granted rewards for user ${userId}:`, error);
        if (error instanceof Prisma.PrismaClientKnownRequestError) {
             throw new Error(`Error de base de datos al buscar recompensas otorgadas: ${error.message}`);
        }
        throw new Error('Error inesperado al buscar recompensas otorgadas.');
    }
};

// --- redeemGrantedReward MODIFICADO para añadir ActivityLog ---
/**
 * Permite a un cliente canjear una recompensa que le fue otorgada (un regalo).
 * Marca el estado de GrantedReward como 'REDEEMED' y crea un log de actividad.
 */
export const redeemGrantedReward = async ( userId: string, grantedRewardId: string ): Promise<GrantedReward> => {
    console.log(`[CUST_SVC] User ${userId} attempting to redeem granted reward ${grantedRewardId}`);
    try {
        const updatedGrantedReward = await prisma.$transaction(async (tx) => {
            // 1. Encontrar el GrantedReward y verificar estado y pertenencia
            //    AÑADIMOS include para tener businessId y reward.name para el log
            const grantedReward = await tx.grantedReward.findUnique({
                where: { id: grantedRewardId },
                include: {
                    reward: { select: { name: true } }, // Incluir nombre de la recompensa
                    business: { select: { id: true } } // Incluir ID del negocio
                }
            });

            if (!grantedReward) { throw new Error(`Regalo con ID ${grantedRewardId} no encontrado.`); }
            // --- Añadir verificación de businessId ---
            if (!grantedReward.businessId) {
                 console.error(`[CUST_SVC] Critical: GrantedReward ${grantedRewardId} has no businessId!`);
                 throw new Error(`Error interno: El regalo no está asociado a un negocio.`);
            }
            // --- Fin verificación ---
            if (grantedReward.userId !== userId) {
                console.warn(`[CUST_SVC] Unauthorized attempt by user ${userId} to redeem granted reward ${grantedRewardId} belonging to user ${grantedReward.userId}`);
                throw new Error("Este regalo no te pertenece.");
            }
            if (grantedReward.status !== 'PENDING') {
                // Usamos el nombre de la recompensa en el mensaje de error
                throw new Error(`Este regalo (${grantedReward.reward.name || 'ID: '+grantedReward.rewardId}) ya fue canjeado o no es válido (Estado: ${grantedReward.status}).`);
            }

            // 2. Actualizar el estado del GrantedReward
            const redeemed = await tx.grantedReward.update({
                where: { id: grantedRewardId, userId: userId, status: 'PENDING' },
                data: { status: 'REDEEMED', redeemedAt: new Date() }
            });

            // --- 3. NUEVO: Crear Entrada en ActivityLog ---
            await tx.activityLog.create({
                data: {
                    userId: userId,
                    businessId: grantedReward.businessId, // ID del negocio obtenido con include
                    type: ActivityType.GIFT_REDEEMED,
                    pointsChanged: null, // No cambian puntos al canjear regalo
                    description: `Regalo canjeado: ${grantedReward.reward.name || 'ID: '+grantedReward.rewardId}`, // Nombre obtenido con include
                    relatedGrantedRewardId: grantedRewardId
                }
            });
            // --- FIN NUEVO ---

            console.log(`[CUST_SVC] Granted reward ${grantedRewardId} (${redeemed.rewardId}) successfully redeemed by user ${userId}. Activity logged.`);
            return redeemed; // Devuelve el GrantedReward actualizado
        });
        return updatedGrantedReward; // Devuelve el resultado de la transacción
    } catch (error) {
        console.error(`[CUST_SVC] Error redeeming granted reward ${grantedRewardId} for user ${userId}:`, error);
        if (error instanceof Prisma.PrismaClientKnownRequestError) {
            if (error.code === 'P2025') { throw new Error("El regalo no se encontró o ya no estaba pendiente al intentar canjearlo."); }
            throw new Error(`Error de base de datos al canjear el regalo: ${error.message}`);
        }
        if (error instanceof Error) { throw error; }
        throw new Error('Error inesperado al canjear el regalo.');
    }
};
// --- FIN redeemGrantedReward MODIFICADO ---

// getCustomerFacingBusinessConfig (sin cambios respecto a la última versión)
export const getCustomerFacingBusinessConfig = async (businessId: string): Promise<CustomerBusinessConfig> => {
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
        // Aseguramos que devolvemos null si tierCalculationBasis es null en la BD
        return { tierCalculationBasis: config.tierCalculationBasis ?? null };
    } catch (error) {
        console.error(`[CUST_SVC] Error fetching customer-facing config for business ${businessId}:`, error);
        throw new Error('Error al obtener la configuración del negocio.');
    }
};

// End of File: backend/src/customer/customer.service.ts