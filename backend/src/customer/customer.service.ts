// File: backend/src/customer/customer.service.ts
// Version: 1.4.0 (Add assignRewardToCustomer function - ABSOLUTELY FULL CODE)

import { PrismaClient, Reward, Prisma, UserRole, User, GrantedReward } from '@prisma/client';

const prisma = new PrismaClient();

// --- FUNCIÓN ORIGINAL (COMPLETA) ---
/**
 * Finds all active rewards for a specific business.
 * Used by customers to see available rewards.
 * @param businessId The ID of the business whose active rewards are to be fetched.
 * @returns A promise that resolves with an array of active reward objects.
 * @throws Error if there's a database error.
 */
export const findActiveRewardsForCustomer = async (
  businessId: string
): Promise<Reward[]> => {
  console.log(
    `[CUSTOMER SVC] Finding active rewards for business: ${businessId}`
  );
  try {
    const rewards = await prisma.reward.findMany({
      where: {
        businessId: businessId,
        isActive: true,
      },
      orderBy: {
        pointsCost: 'asc',
      },
    });
    console.log(
      `[CUSTOMER SVC] Found ${rewards.length} active rewards for business ${businessId}`
    );
    return rewards;
  } catch (error) {
    console.error(
      `[CUSTOMER SVC] Error fetching active rewards for business ${businessId}:`,
      error
    );
    // Manejo de error completo (basado en tu código original)
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      throw new Error(`Error de base de datos al buscar recompensas: ${error.message}`);
    }
    throw new Error('Error inesperado al buscar recompensas activas.');
  }
};

// --- FUNCIÓN PREVIA (COMPLETA) ---
/**
 * Obtiene la lista de clientes para un negocio específico (Vista Admin).
 * @param businessId - El ID del negocio del admin logueado.
 * @returns Lista de clientes con datos básicos y tier.
 * @throws Error si ocurre un problema con la base de datos.
 */
export const getCustomersForBusiness = async (businessId: string) => {
    console.log(`[CUST SVC] Fetching customers for business ID: ${businessId}`);
    try {
        const customers = await prisma.user.findMany({
            where: {
                businessId: businessId,
                role: UserRole.CUSTOMER_FINAL
            },
            select: {
                id: true, name: true, email: true, points: true, createdAt: true,
                isActive: true, isFavorite: true,
                currentTier: { select: { name: true, id: true } }
            },
            orderBy: { createdAt: 'desc' }
            // TODO: Paginación y búsqueda
        });
        console.log(`[CUST SVC] Found ${customers.length} customers for business ${businessId}`);
        return customers;
    } catch (error) {
        // Manejo de error completo
        console.error(`[CUST SVC] Error fetching customers for business ${businessId}:`, error);
        throw new Error('Error al obtener la lista de clientes desde la base de datos.');
    }
};

// --- FUNCIÓN PREVIA (COMPLETA) ---
/**
 * Ajusta los puntos de un cliente específico.
 * @param customerId - ID del cliente a modificar.
 * @param adminBusinessId - ID del negocio del administrador logueado.
 * @param amount - Cantidad de puntos a sumar (positivo) o restar (negativo).
 * @param reason - Motivo opcional para el ajuste.
 * @returns El objeto User del cliente actualizado.
 * @throws Error si el cliente no se encuentra, no pertenece al negocio, o falla la actualización.
 */
export const adjustPointsForCustomer = async (
    customerId: string,
    adminBusinessId: string,
    amount: number,
    reason?: string | null
): Promise<User> => {
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
        // Manejo de error completo
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


// --- FUNCIÓN PREVIA (COMPLETA) ---
/**
 * Cambia manualmente el nivel (Tier) de un cliente específico.
 * @param customerId El ID del cliente a modificar.
 * @param adminBusinessId El ID del negocio del admin que realiza la acción.
 * @param newTierId El ID del nuevo nivel a asignar, o null para quitar el nivel.
 * @returns El objeto User del cliente actualizado.
 * @throws Error si el cliente o el tier no se encuentran, no pertenecen al negocio, o falla la actualización.
 */
export const changeCustomerTier = async (
    customerId: string,
    adminBusinessId: string,
    newTierId: string | null
): Promise<User> => {
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
        // Manejo de error completo
        console.error(`[CUST SVC] Error changing tier for customer ${customerId} to ${newTierId}:`, error);
         if (error instanceof Prisma.PrismaClientKnownRequestError) {
             throw new Error(`Error de base de datos al cambiar nivel: ${error.message}`);
         }
         if (error instanceof Error) { // Capturar errores lanzados desde la transacción
              throw error;
         }
         throw new Error('Error inesperado al cambiar el nivel del cliente.');
    }
};


// --- NUEVA FUNCIÓN AÑADIDA (COMPLETA) ---
/**
 * Asigna una recompensa específica a un cliente como un 'regalo'.
 * @param customerId ID del cliente que recibe el regalo.
 * @param adminBusinessId ID del negocio del admin que realiza la acción.
 * @param rewardId ID de la recompensa que se regala.
 * @param adminUserId ID del admin que realiza la asignación (para auditoría).
 * @returns El objeto GrantedReward recién creado.
 * @throws Error si el cliente o recompensa no existen, no pertenecen al negocio, o falla la creación.
 */
export const assignRewardToCustomer = async (
    customerId: string,
    adminBusinessId: string,
    rewardId: string,
    adminUserId: string
): Promise<GrantedReward> => { // <-- Devuelve GrantedReward
    console.log(`[CUST SVC] Attempting to assign reward ${rewardId} to customer ${customerId} by admin ${adminUserId} from business ${adminBusinessId}`);
    try {
        const grantedReward = await prisma.$transaction(async (tx) => {
            const customer = await tx.user.findUnique({ where: { id: customerId, businessId: adminBusinessId }, select: { id: true } });
            if (!customer) { throw new Error(`Cliente con ID ${customerId} no encontrado o no pertenece a tu negocio.`); }
            const reward = await tx.reward.findUnique({ where: { id: rewardId, businessId: adminBusinessId }, select: { id: true, isActive: true } });
            if (!reward) { throw new Error(`Recompensa con ID ${rewardId} no encontrada o no pertenece a tu negocio.`); }
            if (!reward.isActive) { throw new Error(`La recompensa seleccionada (${rewardId}) no está activa.`); }

            const newGrantedReward = await tx.grantedReward.create({
                data: {
                    userId: customerId,
                    rewardId: rewardId,
                    businessId: adminBusinessId,
                    assignedById: adminUserId,
                    status: 'PENDING',
                }
            });
            console.log(`[CUST SVC] Reward ${rewardId} assigned successfully to customer ${customerId}. GrantedReward ID: ${newGrantedReward.id}`);
            return newGrantedReward;
        });
        return grantedReward;
    } catch (error) {
        // Manejo de error completo
        console.error(`[CUST SVC] Error assigning reward ${rewardId} to customer ${customerId}:`, error);
        if (error instanceof Prisma.PrismaClientKnownRequestError) {
             // Puedes manejar errores específicos como claves foráneas inválidas (P2003) si es necesario
             throw new Error(`Error de base de datos al asignar recompensa: ${error.message}`);
        }
        if (error instanceof Error) { throw error; }
        throw new Error('Error inesperado al asignar la recompensa.');
    }
};
// --- FIN NUEVA FUNCIÓN ---

// End of File: backend/src/customer/customer.service.ts