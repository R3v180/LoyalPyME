// filename: backend/src/customer/customer.service.ts
// Version: 2.0.1 (Fix character encoding)

import { PrismaClient, Reward, Prisma, User, GrantedReward } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * Encuentra todas las recompensas activas para un negocio específico.
 * Utilizado por el cliente para ver qué puede canjear.
 */
export const findActiveRewardsForCustomer = async ( businessId: string ): Promise<Reward[]> => {
  console.log( `[CUST_SVC] Finding active rewards for business: ${businessId}` );
  try {
    // Busca recompensas activas, ordenadas por coste
    const rewards = await prisma.reward.findMany({
        where: { businessId: businessId, isActive: true, },
        orderBy: { pointsCost: 'asc', },
    });
    console.log( `[CUST_SVC] Found ${rewards.length} active rewards for business ${businessId}` );
    return rewards;
  } catch (error) {
    console.error( `[CUST_SVC] Error fetching active rewards for business ${businessId}:`, error );
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
        // Podría haber errores si la conexión falla, etc.
        throw new Error(`Error de base de datos al buscar recompensas: ${error.message}`); // Corregido: Podría, conexión
    }
    throw new Error('Error inesperado al buscar recompensas activas.');
  }
};


/**
 * Obtiene las recompensas otorgadas (regalos) que están pendientes de canjear por un usuario.
 */
export const getPendingGrantedRewards = async (userId: string): Promise<GrantedReward[]> => {
    console.log(`[CUST_SVC] Fetching pending granted rewards for user ${userId}`);
    try {
        const grantedRewards = await prisma.grantedReward.findMany({
            where: { userId: userId, status: 'PENDING' },
            // Incluir datos útiles para mostrar al cliente
            include: {
                reward: { select: { id: true, name: true, description: true } }, // Info de la recompensa
                assignedBy: { select: { name: true, email: true } }, // Quién asignó (si es admin) // Corregido: Quién, asignó
                business: { select: { name: true } } // Nombre del negocio (si fue asignado por sistema/otro)
            },
            orderBy: { assignedAt: 'desc' } // Mostrar los más recientes primero
        });
        console.log(`[CUST_SVC] Found ${grantedRewards.length} pending granted rewards for user ${userId}`);
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
    console.log(`[CUST_SVC] User ${userId} attempting to redeem granted reward ${grantedRewardId}`);
    try {
        // Usar transacción para verificar estado y pertenencia antes de actualizar
        const updatedGrantedReward = await prisma.$transaction(async (tx) => {
            // 1. Buscar el regalo y verificar que pertenece al usuario y está pendiente
            const grantedReward = await tx.grantedReward.findUnique({
                where: { id: grantedRewardId },
                include: { reward: { select: { name: true }} } // Incluir nombre para mensaje de error
            });

            if (!grantedReward) {
                throw new Error(`Regalo con ID ${grantedRewardId} no encontrado.`);
            }
            if (grantedReward.userId !== userId) {
                // Error de seguridad/lógica
                console.warn(`[CUST_SVC] Unauthorized attempt by user ${userId} to redeem granted reward ${grantedRewardId} belonging to user ${grantedReward.userId}`);
                throw new Error("Este regalo no te pertenece.");
            }
            if (grantedReward.status !== 'PENDING') {
                // Evitar doble canje o canje de regalos ya procesados/expirados
                throw new Error(`Este regalo (${grantedReward.reward.name}) ya fue canjeado o no es válido (Estado: ${grantedReward.status}).`); // Corregido: válido
            }

            // 2. Actualizar el estado si todo es correcto
            const redeemed = await tx.grantedReward.update({
                where: { id: grantedRewardId, userId: userId, status: 'PENDING' }, // Condición extra de seguridad // Corregido: Condición
                data: {
                    status: 'REDEEMED',
                    redeemedAt: new Date()
                }
                // Podríamos seleccionar campos específicos si no necesitamos todo el objeto
            });
            console.log(`[CUST_SVC] Granted reward ${grantedRewardId} (${redeemed.rewardId}) successfully redeemed by user ${userId}`);
            return redeemed;
        });
        return updatedGrantedReward; // Devolver el resultado de la transacción

    } catch (error) {
        console.error(`[CUST_SVC] Error redeeming granted reward ${grantedRewardId} for user ${userId}:`, error);
        if (error instanceof Prisma.PrismaClientKnownRequestError) {
             // P2025: Podría ocurrir si el regalo se elimina/modifica justo antes del update
            if (error.code === 'P2025') { throw new Error("El regalo no se encontró o ya no estaba pendiente al intentar canjearlo."); }
            throw new Error(`Error de base de datos al canjear el regalo: ${error.message}`);
        }
        if (error instanceof Error) { // Relanzar errores de validación (no encontrado, no pertenece, ya canjeado)
             throw error;
        }
        throw new Error('Error inesperado al canjear el regalo.');
    }
};

// End of File: backend/src/customer/customer.service.ts