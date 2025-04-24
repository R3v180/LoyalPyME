// File: backend/src/customer/customer.service.ts
// Version: 1.6.0 (Add redeemGrantedReward function - FULL CODE)

import { PrismaClient, Reward, Prisma, UserRole, User, GrantedReward } from '@prisma/client';

const prisma = new PrismaClient();

// --- Función 1 (Original) ---
export const findActiveRewardsForCustomer = async ( businessId: string ): Promise<Reward[]> => {
  console.log( `[CUSTOMER SVC] Finding active rewards for business: ${businessId}` );
  try {
    const rewards = await prisma.reward.findMany({ where: { businessId: businessId, isActive: true, }, orderBy: { pointsCost: 'asc', }, });
    console.log( `[CUSTOMER SVC] Found ${rewards.length} active rewards for business ${businessId}` );
    return rewards;
  } catch (error) {
    console.error( `[CUSTOMER SVC] Error fetching active rewards for business ${businessId}:`, error );
    if (error instanceof Prisma.PrismaClientKnownRequestError) { throw new Error(`Error de base de datos al buscar recompensas: ${error.message}`); }
    throw new Error('Error inesperado al buscar recompensas activas.');
  }
};

// --- Función 2 (Admin - Lista Clientes) ---
export const getCustomersForBusiness = async (businessId: string) => {
    console.log(`[CUST SVC] Fetching customers for business ID: ${businessId}`);
    try {
        const customers = await prisma.user.findMany({
            where: { businessId: businessId, role: UserRole.CUSTOMER_FINAL },
            select: { id: true, name: true, email: true, points: true, createdAt: true, isActive: true, isFavorite: true, currentTier: { select: { name: true, id: true } } },
            orderBy: { createdAt: 'desc' }
        });
        console.log(`[CUST SVC] Found ${customers.length} customers for business ${businessId}`);
        return customers;
    } catch (error) {
        console.error(`[CUST SVC] Error fetching customers for business ${businessId}:`, error);
        throw new Error('Error al obtener la lista de clientes desde la base de datos.');
    }
};

// --- Función 3 (Admin - Ajustar Puntos) ---
export const adjustPointsForCustomer = async ( customerId: string, adminBusinessId: string, amount: number, reason?: string | null ): Promise<User> => {
    console.log(`[CUST SVC] Attempting to adjust points for customer ${customerId} by ${amount}. Reason: ${reason || 'N/A'}. Admin Business: ${adminBusinessId}`);
    if (amount === 0) { throw new Error("La cantidad de puntos a ajustar no puede ser cero."); }
    try {
        const updatedUser = await prisma.$transaction(async (tx) => {
            const customer = await tx.user.findUnique({ where: { id: customerId }, select: { businessId: true, id: true } });
            if (!customer) { throw new Error(`Cliente con ID ${customerId} no encontrado.`); }
            if (customer.businessId !== adminBusinessId) { throw new Error("No tienes permiso para modificar este cliente."); }
            const userAfterUpdate = await tx.user.update({ where: { id: customerId, businessId: adminBusinessId, }, data: { points: { increment: amount } } });
            console.log(`[CUST SVC] Points adjusted successfully for customer ${customerId}. New balance potentially: ${userAfterUpdate.points}`);
            return userAfterUpdate;
        });
        return updatedUser;
    } catch (error) {
        console.error(`[CUST SVC] Error adjusting points for customer ${customerId}:`, error);
        if (error instanceof Prisma.PrismaClientKnownRequestError) { if (error.code === 'P2025') { throw new Error(`No se encontró el cliente especificado para actualizar.`); } throw new Error(`Error de base de datos al ajustar puntos: ${error.message}`); }
        if (error instanceof Error) { throw error; }
        throw new Error('Error inesperado al ajustar los puntos.');
    }
};

// --- Función 4 (Admin - Cambiar Nivel) ---
export const changeCustomerTier = async ( customerId: string, adminBusinessId: string, newTierId: string | null ): Promise<User> => {
    console.log(`[CUST SVC] Attempting to change tier for customer ${customerId} to tier ${newTierId || 'NULL'}. Admin Business: ${adminBusinessId}`);
    try {
        const updatedUser = await prisma.$transaction(async (tx) => {
            const customer = await tx.user.findUnique({ where: { id: customerId, businessId: adminBusinessId }, select: { id: true } });
            if (!customer) { throw new Error(`Cliente con ID ${customerId} no encontrado o no pertenece a tu negocio.`); }
            if (newTierId !== null) {
                const tierExists = await tx.tier.findUnique({ where: { id: newTierId, businessId: adminBusinessId }, select: { id: true } });
                if (!tierExists) { throw new Error(`El nivel seleccionado (ID: ${newTierId}) no es válido o no pertenece a tu negocio.`); }
            }
            const userAfterUpdate = await tx.user.update({ where: { id: customerId }, data: { currentTierId: newTierId, tierAchievedAt: newTierId ? new Date() : null } });
            console.log(`[CUST SVC] Tier changed successfully for customer ${customerId} to ${newTierId || 'NULL'}`);
            return userAfterUpdate;
        });
        return updatedUser;
    } catch (error) {
        console.error(`[CUST SVC] Error changing tier for customer ${customerId} to ${newTierId}:`, error);
         if (error instanceof Prisma.PrismaClientKnownRequestError) { throw new Error(`Error de base de datos al cambiar nivel: ${error.message}`); }
         if (error instanceof Error) { throw error; }
         throw new Error('Error inesperado al cambiar el nivel del cliente.');
    }
};

// --- Función 5 (Admin - Asignar Recompensa) ---
export const assignRewardToCustomer = async ( customerId: string, adminBusinessId: string, rewardId: string, adminUserId: string ): Promise<GrantedReward> => {
    console.log(`[CUST SVC] Attempting to assign reward ${rewardId} to customer ${customerId} by admin ${adminUserId} from business ${adminBusinessId}`);
    try {
        const grantedReward = await prisma.$transaction(async (tx) => {
            const customer = await tx.user.findUnique({ where: { id: customerId, businessId: adminBusinessId }, select: { id: true } });
            if (!customer) { throw new Error(`Cliente con ID ${customerId} no encontrado o no pertenece a tu negocio.`); }
            const reward = await tx.reward.findUnique({ where: { id: rewardId, businessId: adminBusinessId }, select: { id: true, isActive: true } });
            if (!reward) { throw new Error(`Recompensa con ID ${rewardId} no encontrada o no pertenece a tu negocio.`); }
            if (!reward.isActive) { throw new Error(`La recompensa seleccionada (${rewardId}) no está activa.`); }
            const newGrantedReward = await tx.grantedReward.create({ data: { userId: customerId, rewardId: rewardId, businessId: adminBusinessId, assignedById: adminUserId, status: 'PENDING', } });
            console.log(`[CUST SVC] Reward ${rewardId} assigned successfully to customer ${customerId}. GrantedReward ID: ${newGrantedReward.id}`);
            return newGrantedReward;
        });
        return grantedReward;
    } catch (error) {
        console.error(`[CUST SVC] Error assigning reward ${rewardId} to customer ${customerId}:`, error);
        if (error instanceof Prisma.PrismaClientKnownRequestError) { throw new Error(`Error de base de datos al asignar recompensa: ${error.message}`); }
        if (error instanceof Error) { throw error; }
        throw new Error('Error inesperado al asignar la recompensa.');
    }
};

// --- Función 6 (Cliente - Ver Regalos Pendientes) ---
export const getPendingGrantedRewards = async (userId: string) => {
    console.log(`[CUST SVC] Fetching pending granted rewards for user ${userId}`);
    try {
        const grantedRewards = await prisma.grantedReward.findMany({
            where: { userId: userId, status: 'PENDING' },
            include: { reward: { select: { id: true, name: true, description: true, } }, assignedBy: { select: { name: true, email: true } }, business: { select: { name: true } } },
            orderBy: { assignedAt: 'desc' }
        });
        console.log(`[CUST SVC] Found ${grantedRewards.length} pending granted rewards for user ${userId}`);
        return grantedRewards;
    } catch (error) {
        console.error(`[CUST SVC] Error fetching pending granted rewards for user ${userId}:`, error);
        if (error instanceof Prisma.PrismaClientKnownRequestError) { throw new Error(`Error de base de datos al buscar recompensas otorgadas: ${error.message}`); }
        throw new Error('Error inesperado al buscar recompensas otorgadas.');
    }
};

// --- **NUEVA FUNCIÓN AÑADIDA (PARA CANJEAR REGALO)** ---
/**
 * Marca una recompensa otorgada específica como canjeada por el cliente.
 * Verifica que el regalo pertenezca al cliente y esté pendiente.
 *
 * @param userId - ID del cliente que realiza la acción.
 * @param grantedRewardId - ID del registro GrantedReward a canjear.
 * @returns El objeto GrantedReward actualizado.
 * @throws Error si el regalo no se encuentra, no pertenece al usuario, ya fue canjeado, o falla la actualización.
 */
export const redeemGrantedReward = async (
    userId: string,
    grantedRewardId: string
): Promise<GrantedReward> => {
    console.log(`[CUST SVC] User ${userId} attempting to redeem granted reward ${grantedRewardId}`);

    try {
        // Es importante hacer la verificación y la actualización en una transacción
        // para evitar que se canjee dos veces si hay peticiones simultáneas.
        const updatedGrantedReward = await prisma.$transaction(async (tx) => {
            // 1. Buscar el registro del regalo incluyendo el userId para validar pertenencia
            const grantedReward = await tx.grantedReward.findUnique({
                where: { id: grantedRewardId },
                include: { reward: { select: { name: true }} } // Incluir nombre para logs/errores
            });

            // 2. Validaciones
            if (!grantedReward) {
                throw new Error(`Regalo con ID ${grantedRewardId} no encontrado.`);
            }
            if (grantedReward.userId !== userId) {
                console.warn(`[CUST SVC] SECURITY ALERT: User ${userId} attempted to redeem granted reward ${grantedRewardId} belonging to user ${grantedReward.userId}.`);
                throw new Error("Este regalo no te pertenece.");
            }
            if (grantedReward.status !== 'PENDING') {
                throw new Error(`Este regalo (${grantedReward.reward.name}) ya fue canjeado o no es válido (Estado: ${grantedReward.status}).`);
            }

            // 3. Actualizar el estado y la fecha de canje
            const redeemed = await tx.grantedReward.update({
                where: {
                    id: grantedRewardId,
                    // Añadir userId y status aquí asegura que solo se actualice si
                    // pertenece al usuario Y todavía está pendiente (protección extra contra concurrencia)
                    userId: userId,
                    status: 'PENDING'
                },
                data: {
                    status: 'REDEEMED',
                    redeemedAt: new Date()
                }
            });

            console.log(`[CUST SVC] Granted reward ${grantedRewardId} (${redeemed.rewardId}) successfully redeemed by user ${userId}`);
            return redeemed; // Devolvemos el registro actualizado
        });

        return updatedGrantedReward;

    } catch (error) {
        console.error(`[CUST SVC] Error redeeming granted reward ${grantedRewardId} for user ${userId}:`, error);
         if (error instanceof Prisma.PrismaClientKnownRequestError) {
             // El código 'P2025' (Record to update not found) podría indicar que
             // justo en el momento de actualizar, otro proceso ya lo había canjeado.
             if (error.code === 'P2025') {
                  throw new Error("El regalo no se encontró o ya no estaba pendiente al intentar canjearlo.");
             }
             throw new Error(`Error de base de datos al canjear el regalo: ${error.message}`);
         }
         if (error instanceof Error) { // Capturar errores lanzados desde la transacción
              throw error;
         }
         throw new Error('Error inesperado al canjear el regalo.');
    }
};
// --- FIN NUEVA FUNCIÓN ---


// End of File: backend/src/customer/customer.service.ts