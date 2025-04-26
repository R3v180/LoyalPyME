// filename: backend/src/customer/customer.service.ts
// --- INICIO DEL CÃ“DIGO MODIFICADO ---
// File: backend/src/customer/customer.service.ts
// Version: 2.0.0 (Refactored: Contains only customer-facing actions)

import { PrismaClient, Reward, Prisma, User, GrantedReward } from '@prisma/client'; // UserRole ya no es necesario aquÃ­

const prisma = new PrismaClient();

// --- La interfaz GetCustomersOptions ha sido movida a admin/admin-customer.service.ts ---

/**
 * Encuentra todas las recompensas activas para un negocio especÃ­fico.
 * Utilizado por el cliente para ver quÃ© puede canjear.
 * (FunciÃ³n 1 original, sin cambios funcionales)
 */
export const findActiveRewardsForCustomer = async ( businessId: string ): Promise<Reward[]> => {
  console.log( `[CUST_SVC] Finding active rewards for business: ${businessId}` ); // Prefijo log cambiado
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
        // PodrÃ­a haber errores si la conexiÃ³n falla, etc.
        throw new Error(`Error de base de datos al buscar recompensas: ${error.message}`);
    }
    throw new Error('Error inesperado al buscar recompensas activas.');
  }
  // La correcciÃ³n para TS2355 ya no es necesaria aquÃ­ si los throws son exhaustivos
};


/**
 * Obtiene las recompensas otorgadas (regalos) que estÃ¡n pendientes de canjear por un usuario.
 * (FunciÃ³n 6 del original, sin cambios funcionales)
 */
export const getPendingGrantedRewards = async (userId: string): Promise<GrantedReward[]> => {
    console.log(`[CUST_SVC] Fetching pending granted rewards for user ${userId}`);
    try {
        const grantedRewards = await prisma.grantedReward.findMany({
            where: { userId: userId, status: 'PENDING' },
            // Incluir datos Ãºtiles para mostrar al cliente
            include: {
                reward: { select: { id: true, name: true, description: true } }, // Info de la recompensa
                assignedBy: { select: { name: true, email: true } }, // QuiÃ©n asignÃ³ (si es admin)
                business: { select: { name: true } } // Nombre del negocio (si fue asignado por sistema/otro)
            },
            orderBy: { assignedAt: 'desc' } // Mostrar los mÃ¡s recientes primero
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
 * (FunciÃ³n 7 del original, sin cambios funcionales)
 */
export const redeemGrantedReward = async ( userId: string, grantedRewardId: string ): Promise<GrantedReward> => {
    console.log(`[CUST_SVC] User ${userId} attempting to redeem granted reward ${grantedRewardId}`);
    try {
        // Usar transacciÃ³n para verificar estado y pertenencia antes de actualizar
        const updatedGrantedReward = await prisma.$transaction(async (tx) => {
            // 1. Buscar el regalo y verificar que pertenece al usuario y estÃ¡ pendiente
            const grantedReward = await tx.grantedReward.findUnique({
                where: { id: grantedRewardId },
                include: { reward: { select: { name: true }} } // Incluir nombre para mensaje de error
            });

            if (!grantedReward) {
                throw new Error(`Regalo con ID ${grantedRewardId} no encontrado.`);
            }
            if (grantedReward.userId !== userId) {
                // Error de seguridad/lÃ³gica
                console.warn(`[CUST_SVC] Unauthorized attempt by user ${userId} to redeem granted reward ${grantedRewardId} belonging to user ${grantedReward.userId}`);
                throw new Error("Este regalo no te pertenece.");
            }
            if (grantedReward.status !== 'PENDING') {
                // Evitar doble canje o canje de regalos ya procesados/expirados
                throw new Error(`Este regalo (${grantedReward.reward.name}) ya fue canjeado o no es vÃ¡lido (Estado: ${grantedReward.status}).`);
            }

            // 2. Actualizar el estado si todo es correcto
            const redeemed = await tx.grantedReward.update({
                where: { id: grantedRewardId, userId: userId, status: 'PENDING' }, // CondiciÃ³n extra de seguridad
                data: {
                    status: 'REDEEMED',
                    redeemedAt: new Date()
                }
                // PodrÃ­amos seleccionar campos especÃ­ficos si no necesitamos todo el objeto
            });
            console.log(`[CUST_SVC] Granted reward ${grantedRewardId} (${redeemed.rewardId}) successfully redeemed by user ${userId}`);
            return redeemed;
        });
        return updatedGrantedReward; // Devolver el resultado de la transacciÃ³n

    } catch (error) {
        console.error(`[CUST_SVC] Error redeeming granted reward ${grantedRewardId} for user ${userId}:`, error);
        if (error instanceof Prisma.PrismaClientKnownRequestError) {
             // P2025: PodrÃ­a ocurrir si el regalo se elimina/modifica justo antes del update
            if (error.code === 'P2025') { throw new Error("El regalo no se encontrÃ³ o ya no estaba pendiente al intentar canjearlo."); }
            throw new Error(`Error de base de datos al canjear el regalo: ${error.message}`);
        }
        if (error instanceof Error) { // Relanzar errores de validaciÃ³n (no encontrado, no pertenece, ya canjeado)
            throw error;
        }
        throw new Error('Error inesperado al canjear el regalo.');
    }
};


// --- Las funciones getCustomersForBusiness, adjustPointsForCustomer, changeCustomerTier,
// --- assignRewardToCustomer y toggleFavoriteStatus han sido movidas a:
// --- admin/admin-customer.service.ts
// --- AsegÃºrate de que el controlador customer.controller.ts que las usaba
// --- ahora importe desde ese nuevo archivo.

// End of File: backend/src/customer/customer.service.ts
// --- FIN DEL CÃ“DIGO MODIFICADO ---