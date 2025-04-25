// File: backend/src/customer/customer.service.ts
// Version: 1.7.0 (Add toggleFavoriteStatus function - ABSOLUTELY 100% FULL CODE)

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
            // TODO: Paginación y búsqueda
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
            // TODO: Log Auditoría
            console.log(`[CUST SVC] Points adjusted successfully for customer ${customerId}. New balance potentially: ${userAfterUpdate.points}`);
            return userAfterUpdate;
        });
        return updatedUser;
    } catch (error) {
        console.error(`[CUST SVC] Error adjusting points for customer ${customerId}:`, error);
        if (error instanceof Prisma.PrismaClientKnownRequestError) { // Asegúrate de tener Prisma importado
             if (error.code === 'P2025') { // Error específico si el registro a actualizar no se encuentra
                 throw new Error(`No se encontró el cliente especificado para actualizar.`);
             }
             throw new Error(`Error de base de datos al ajustar puntos: ${error.message}`);
        }
        if (error instanceof Error) { // Capturar errores lanzados desde la transacción
             throw error;
        }
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

// --- Función 7 (Cliente - Canjear Regalo) ---
export const redeemGrantedReward = async ( userId: string, grantedRewardId: string ): Promise<GrantedReward> => {
    console.log(`[CUST SVC] User ${userId} attempting to redeem granted reward ${grantedRewardId}`);
    try {
        const updatedGrantedReward = await prisma.$transaction(async (tx) => {
            const grantedReward = await tx.grantedReward.findUnique({ where: { id: grantedRewardId }, include: { reward: { select: { name: true }} } });
            if (!grantedReward) { throw new Error(`Regalo con ID ${grantedRewardId} no encontrado.`); }
            if (grantedReward.userId !== userId) { throw new Error("Este regalo no te pertenece."); }
            if (grantedReward.status !== 'PENDING') { throw new Error(`Este regalo (${grantedReward.reward.name}) ya fue canjeado o no es válido (Estado: ${grantedReward.status}).`); }
            const redeemed = await tx.grantedReward.update({ where: { id: grantedRewardId, userId: userId, status: 'PENDING' }, data: { status: 'REDEEMED', redeemedAt: new Date() } });
            console.log(`[CUST SVC] Granted reward ${grantedRewardId} (${redeemed.rewardId}) successfully redeemed by user ${userId}`);
            return redeemed;
        });
        return updatedGrantedReward;
    } catch (error) {
        console.error(`[CUST SVC] Error redeeming granted reward ${grantedRewardId} for user ${userId}:`, error);
        if (error instanceof Prisma.PrismaClientKnownRequestError) { if (error.code === 'P2025') { throw new Error("El regalo no se encontró o ya no estaba pendiente al intentar canjearlo."); } throw new Error(`Error de base de datos al canjear el regalo: ${error.message}`); }
        if (error instanceof Error) { throw error; }
        throw new Error('Error inesperado al canjear el regalo.');
    }
};

// --- **NUEVA FUNCIÓN AÑADIDA (PARA MARCAR/DESMARCAR FAVORITO)** ---
/**
 * Cambia el estado de 'isFavorite' para un cliente específico.
 * Verifica que el cliente pertenezca al negocio del admin.
 *
 * @param customerId ID del cliente a modificar.
 * @param adminBusinessId ID del negocio del admin.
 * @returns El objeto User del cliente con el estado de favorito actualizado.
 * @throws Error si el cliente no existe o no pertenece al negocio.
 */
export const toggleFavoriteStatus = async (
    customerId: string,
    adminBusinessId: string
): Promise<User> => { // Devolvemos el User completo por si el frontend lo necesita
    console.log(`[CUST SVC] Attempting to toggle favorite status for customer ${customerId} by admin from business ${adminBusinessId}`);

    try {
        // Usamos transacción para leer y luego escribir de forma segura
        const updatedUser = await prisma.$transaction(async (tx) => {
            // 1. Buscar cliente y su estado actual de favorito, validando pertenencia
            const customer = await tx.user.findUnique({
                where: {
                    id: customerId,
                    businessId: adminBusinessId // Asegura que pertenece al negocio
                },
                select: {
                    id: true,
                    isFavorite: true // Necesitamos el valor actual
                }
            });

            // 2. Validar si se encontró
            if (!customer) {
                throw new Error(`Cliente con ID ${customerId} no encontrado o no pertenece a tu negocio.`);
            }

            // 3. Calcular el nuevo estado (el inverso del actual)
            const newFavoriteStatus = !customer.isFavorite;

            // 4. Actualizar el campo isFavorite en la base de datos
            const userAfterUpdate = await tx.user.update({
                where: {
                    id: customerId
                    // No necesitamos businessId aquí porque ya validamos arriba
                },
                data: {
                    isFavorite: newFavoriteStatus
                },
                // Devolvemos todos los campos necesarios para la tabla del admin
                select: {
                     id: true, name: true, email: true, points: true, createdAt: true,
                     isActive: true, isFavorite: true, // Devolver el nuevo estado
                     currentTier: { select: { name: true, id: true } }
                }
            });

            console.log(`[CUST SVC] Favorite status for customer ${customerId} toggled to ${newFavoriteStatus}`);
            return userAfterUpdate;
        });

        // @ts-ignore // Prisma select no siempre infiere bien el tipo exacto con relaciones, castear si es necesario o ajustar select
        return updatedUser as User;

    } catch (error) {
        console.error(`[CUST SVC] Error toggling favorite status for customer ${customerId}:`, error);
        if (error instanceof Prisma.PrismaClientKnownRequestError) {
            if (error.code === 'P2025') { // Error si no encuentra el user para actualizar
                 throw new Error(`No se encontró el cliente especificado al intentar actualizar.`);
            }
            throw new Error(`Error de base de datos al cambiar estado de favorito: ${error.message}`);
        }
        if (error instanceof Error) { // Capturar errores de validación lanzados arriba
             throw error;
        }
        throw new Error('Error inesperado al cambiar el estado de favorito.');
    }
};
// --- FIN NUEVA FUNCIÓN ---


// End of File: backend/src/customer/customer.service.ts