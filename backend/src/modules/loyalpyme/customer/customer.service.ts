// filename: backend/src/customer/customer.service.ts
// Version: 2.3.2 (Use i18n reward fields name_es/name_en)

import {
    PrismaClient,
    Reward,
    Prisma,
    User,
    GrantedReward,
    Business,
    TierCalculationBasis,
    ActivityType
} from '@prisma/client';

const prisma = new PrismaClient();

// Tipo CustomerBusinessConfig (sin cambios)
export type CustomerBusinessConfig = Pick<Business, 'tierCalculationBasis'> | null;

// --- findActiveRewardsForCustomer ACTUALIZADO ---
/**
 * Encuentra recompensas activas para el cliente, seleccionando campos i18n.
 */
export const findActiveRewardsForCustomer = async ( businessId: string ): Promise<Reward[]> => { // La firma que devuelve Reward completo es correcta
  console.log( `[CUST_SVC] Finding active rewards for customer view for business: ${businessId}` );
  try {
    // CORRECCIÓN: Se ha eliminado la cláusula 'select' para que Prisma devuelva el objeto Reward completo.
    const rewards = await prisma.reward.findMany({
        where: { 
            businessId: businessId, 
            isActive: true, 
        },
        orderBy: { 
            pointsCost: 'asc', 
        },
    });
    console.log( `[CUST_SVC] Found ${rewards.length} active rewards for business ${businessId}` );
    
    // Ahora la variable 'rewards' es de tipo Reward[] y coincide con el tipo de retorno.
    return rewards;
  } catch (error) {
    console.error( `[CUST_SVC] Error fetching active rewards for business ${businessId}:`, error );
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
        throw new Error(`Error de base de datos al buscar recompensas: ${error.message}`);
    }
    throw new Error('Error inesperado al buscar recompensas activas.');
  }
};
// --- FIN findActiveRewardsForCustomer ---


// getPendingGrantedRewards (MODIFICADO para seleccionar name_es/en)
export const getPendingGrantedRewards = async (userId: string): Promise<GrantedReward[]> => {
    console.log(`[CUST_SVC] Fetching pending granted rewards for user ${userId}`);
    try {
        const grantedRewards = await prisma.grantedReward.findMany({
            where: { userId: userId, status: 'PENDING' },
            include: {
                reward: {
                    select: { // Seleccionar campos i18n
                        id: true,
                        name_es: true, // <-- Seleccionar nuevo campo
                        name_en: true, // <-- Seleccionar nuevo campo
                        description_es: true, // <-- Opcional: seleccionar si se necesita
                        description_en: true, // <-- Opcional: seleccionar si se necesita
                        imageUrl: true
                    }
                },
                assignedBy: { select: { name: true, email: true } },
                business: { select: { name: true } } // No necesitamos ID aquí
            },
            orderBy: { assignedAt: 'desc' }
        });
        console.log(`[CUST_SVC] Found ${grantedRewards.length} pending granted rewards for user ${userId}`);
        console.log('[DEBUG getPendingGrantedRewards] Granted rewards found:', JSON.stringify(grantedRewards, null, 2));
        // El tipo GrantedReward[] devuelto ahora tendrá la estructura interna de reward actualizada
        return grantedRewards;
    } catch (error) {
        console.error(`[CUST_SVC] Error fetching pending granted rewards for user ${userId}:`, error);
        if (error instanceof Prisma.PrismaClientKnownRequestError) {
             throw new Error(`Error de base de datos al buscar recompensas otorgadas: ${error.message}`);
        }
        throw new Error('Error inesperado al buscar recompensas otorgadas.');
    }
};


// --- redeemGrantedReward MODIFICADO ---
export const redeemGrantedReward = async ( userId: string, grantedRewardId: string ): Promise<GrantedReward> => {
    console.log(`[CUST_SVC] User ${userId} attempting to redeem granted reward ${grantedRewardId}`);
    try {
        const updatedGrantedReward = await prisma.$transaction(async (tx) => {
            // 1. Encontrar el GrantedReward y verificar estado y pertenencia
            //    Incluimos reward con sus nuevos campos de nombre y el businessId
            const grantedReward = await tx.grantedReward.findUnique({
                where: { id: grantedRewardId },
                include: {
                    // Incluimos la relación reward completa para acceder a sus campos
                    reward: {
                        select: { // Seleccionar explícitamente lo necesario
                            id: true,
                            name_es: true,
                            name_en: true
                        }
                    },
                    business: { select: { id: true } } // Necesario para el businessId del log
                }
            });

            if (!grantedReward) { throw new Error(`Regalo con ID ${grantedRewardId} no encontrado.`); }
            // Verificar que las relaciones necesarias existen
            if (!grantedReward.business?.id) { console.error(`[CUST_SVC] Critical: GrantedReward ${grantedRewardId} missing business relation!`); throw new Error(`Error interno: El regalo no está asociado a un negocio.`); }
            if (!grantedReward.reward?.id) { console.error(`[CUST_SVC] Critical: GrantedReward ${grantedRewardId} missing reward relation!`); throw new Error(`Error interno: El regalo no está asociado a una recompensa.`); }


            if (grantedReward.userId !== userId) { console.warn(`[CUST_SVC] Unauthorized attempt by user ${userId} to redeem granted reward ${grantedRewardId} belonging to user ${grantedReward.userId}`); throw new Error("Este regalo no te pertenece."); }
            if (grantedReward.status !== 'PENDING') {
                 // Usar los nuevos campos de nombre para el mensaje de error
                 const rewardDisplayName = grantedReward.reward.name_es || grantedReward.reward.name_en || `ID ${grantedReward.rewardId}`;
                throw new Error(`Este regalo (${rewardDisplayName}) ya fue canjeado o no es válido (Estado: ${grantedReward.status}).`);
            }

            // 2. Actualizar el estado del GrantedReward
            const redeemed = await tx.grantedReward.update({
                where: { id: grantedRewardId, userId: userId, status: 'PENDING' },
                data: { status: 'REDEEMED', redeemedAt: new Date() }
            });

            // 3. Crear Entrada en ActivityLog
            // Usar los nuevos campos de nombre para la descripción
            const logDescription = grantedReward.reward.name_es || grantedReward.reward.name_en || null;
            await tx.activityLog.create({
                data: {
                    userId: userId,
                    businessId: grantedReward.business.id, // Usar el ID del negocio incluido
                    type: ActivityType.GIFT_REDEEMED,
                    pointsChanged: null,
                    description: logDescription, // Guardar nombre ES o EN o null
                    relatedGrantedRewardId: grantedRewardId
                }
            });

            console.log(`[CUST_SVC] Granted reward ${grantedRewardId} (${redeemed.rewardId}) successfully redeemed by user ${userId}. Activity logged.`);
            return redeemed;
        });
        return updatedGrantedReward;
    } catch (error) {
        console.error(`[CUST_SVC] Error redeeming granted reward ${grantedRewardId} for user ${userId}:`, error);
        if (error instanceof Prisma.PrismaClientKnownRequestError) { if (error.code === 'P2025') { throw new Error("El regalo no se encontró o ya no estaba pendiente al intentar canjearlo."); } throw new Error(`Error de base de datos al canjear el regalo: ${error.message}`); }
        if (error instanceof Error) { throw error; }
        throw new Error('Error inesperado al canjear el regalo.');
    }
};
// --- FIN redeemGrantedReward ---

// getCustomerFacingBusinessConfig (sin cambios)
export const getCustomerFacingBusinessConfig = async (businessId: string): Promise<CustomerBusinessConfig> => { /* ... (sin cambios) ... */ console.log(`[CUST_SVC] Fetching customer-facing config for business: ${businessId}`); try { const config = await prisma.business.findUnique({ where: { id: businessId }, select: { tierCalculationBasis: true } }); if (!config) { console.warn(`[CUST_SVC] Business not found when fetching config: ${businessId}`); return null; } return { tierCalculationBasis: config.tierCalculationBasis ?? null }; } catch (error) { console.error(`[CUST_SVC] Error fetching customer-facing config for business ${businessId}:`, error); throw new Error('Error al obtener la configuración del negocio.'); } };

// End of File: backend/src/customer/customer.service.ts