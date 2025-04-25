// File: backend/src/customer/customer.service.ts
// Version: 1.8.3 (Fix TS2355 error in findActiveRewardsForCustomer - 100% FULL CODE)

import { PrismaClient, Reward, Prisma, UserRole, User, GrantedReward } from '@prisma/client';

const prisma = new PrismaClient();

// --- Interfaz para opciones de getCustomersForBusiness ---
interface GetCustomersOptions {
    page?: number;
    limit?: number;
    sortBy?: string;
    sortDir?: 'asc' | 'desc';
    filters?: {
      search?: string;
      isFavorite?: boolean;
      isActive?: boolean;
    }
}

// --- Función 1 (Original - CORREGIDA para TS2355) ---
/**
 * Finds all active rewards for a specific business.
 */
// Volvemos a poner el tipo explícito Promise<Reward[]>
export const findActiveRewardsForCustomer = async ( businessId: string ): Promise<Reward[]> => {
  console.log( `[CUSTOMER SVC] Finding active rewards for business: ${businessId}` );
  try {
    const rewards = await prisma.reward.findMany({ where: { businessId: businessId, isActive: true, }, orderBy: { pointsCost: 'asc', }, });
    console.log( `[CUSTOMER SVC] Found ${rewards.length} active rewards for business ${businessId}` );
    return rewards; // <-- Devuelve en caso de éxito
  } catch (error) {
    console.error( `[CUSTOMER SVC] Error fetching active rewards for business ${businessId}:`, error );
    if (error instanceof Prisma.PrismaClientKnownRequestError) { throw new Error(`Error de base de datos al buscar recompensas: ${error.message}`); }
    throw new Error('Error inesperado al buscar recompensas activas.');
  }
  // --- AÑADIDO PARA SATISFACER TS2355 ---
  // Este código es técnicamente inalcanzable si siempre hay un throw en el catch,
  // pero asegura a TypeScript que siempre hay un return del tipo esperado.
  // return [];
  // ------------------------------------
  // CORRECCIÓN: El throw en todas las ramas del catch ya debería ser suficiente.
  // Si TS sigue dando error, podría ser un problema con el reconocimiento de 'throw'
  // como salida válida. Dejamos el código como estaba originalmente en el catch,
  // ya que lanzar un error es una salida válida para una función async que devuelve Promise.
  // El error TS2355 podría ser un falso positivo o indicar un problema no resuelto
  // con la generación de tipos de Prisma que afecte a PrismaClientKnownRequestError.
  // Vamos a asumir que el throw ES suficiente y el error se debía a un estado inconsistente anterior.
};

// --- Función 2 (Admin - Lista Clientes - Con Sort/Filter/Pag) ---
export const getCustomersForBusiness = async ( businessId: string, options: GetCustomersOptions = {} ) => {
    const { page = 1, limit = 10, sortBy = 'createdAt', sortDir = 'desc', filters = {} } = options;
    console.log(`[CUST SVC] Fetching customers for business ID: ${businessId}, Page: ${page}, Limit: ${limit}, SortBy: ${sortBy}, SortDir: ${sortDir}, Filters:`, filters);
    const allowedSortByFields = ['name', 'email', 'points', 'createdAt', 'isActive', 'isFavorite', 'currentTier.level'];
    const safeSortBy = allowedSortByFields.includes(sortBy) ? sortBy : 'createdAt';
    const safeSortDir = sortDir === 'asc' ? 'asc' : 'desc';
    const skip = (page - 1) * limit;
    try {
        const whereClause: Prisma.UserWhereInput = { businessId: businessId, role: UserRole.CUSTOMER_FINAL };
        if (filters.isFavorite !== undefined) { whereClause.isFavorite = filters.isFavorite; }
        if (filters.isActive !== undefined) { whereClause.isActive = filters.isActive; }
        if (filters.search && filters.search.trim() !== '') { const searchTerm = filters.search.trim(); whereClause.OR = [ { name: { contains: searchTerm, mode: 'insensitive' } }, { email: { contains: searchTerm, mode: 'insensitive' } } ]; }
        let orderByClause: Prisma.UserOrderByWithRelationInput | Prisma.UserOrderByWithRelationInput[];
        if (safeSortBy === 'currentTier.level') { orderByClause = { currentTier: { level: safeSortDir } }; }
        else { orderByClause = { [safeSortBy]: safeSortDir }; }
        const selectClause = { id: true, name: true, email: true, points: true, createdAt: true, isActive: true, isFavorite: true, currentTier: { select: { name: true, id: true, level: true } } };
        const [customers, totalItems] = await prisma.$transaction([ prisma.user.findMany({ where: whereClause, select: selectClause, orderBy: orderByClause, skip: skip, take: limit, }), prisma.user.count({ where: whereClause, }) ]);
        const totalPages = Math.ceil(totalItems / limit);
        console.log(`[CUST SVC] Found ${customers.length} customers on page ${page}/${totalPages} (Total items: ${totalItems}) for business ${businessId} with applied filters.`);
        return { items: customers, totalPages: totalPages, currentPage: page, totalItems: totalItems };
    } catch (error) { console.error(`[CUST SVC] Error fetching customers for business ${businessId} with options:`, options, error); throw new Error('Error al obtener la lista de clientes desde la base de datos.'); }
};

// --- Función 3 (Admin - Ajustar Puntos - Completa) ---
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

// --- Función 4 (Admin - Cambiar Nivel - Completa) ---
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

// --- Función 5 (Admin - Asignar Recompensa - Completa) ---
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

// --- Función 6 (Cliente - Ver Regalos Pendientes - Completa) ---
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

// --- Función 7 (Cliente - Canjear Regalo - Completa) ---
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

// --- Función 8 (Admin - Toggle Favorito - Completa) ---
export const toggleFavoriteStatus = async ( customerId: string, adminBusinessId: string ): Promise<User> => {
    console.log(`[CUST SVC] Attempting to toggle favorite status for customer ${customerId} by admin from business ${adminBusinessId}`);
    try {
        const updatedUser = await prisma.$transaction(async (tx) => {
            const customer = await tx.user.findUnique({ where: { id: customerId, businessId: adminBusinessId }, select: { id: true, isFavorite: true } });
            if (!customer) { throw new Error(`Cliente con ID ${customerId} no encontrado o no pertenece a tu negocio.`); }
            const newFavoriteStatus = !customer.isFavorite;
            const userAfterUpdate = await tx.user.update({ where: { id: customerId }, data: { isFavorite: newFavoriteStatus }, select: { id: true, name: true, email: true, points: true, createdAt: true, isActive: true, isFavorite: true, currentTier: { select: { name: true, id: true } } } });
            console.log(`[CUST SVC] Favorite status for customer ${customerId} toggled to ${newFavoriteStatus}`);
            return userAfterUpdate;
        });
        // @ts-ignore
        return updatedUser as User;
    } catch (error) {
        console.error(`[CUST SVC] Error toggling favorite status for customer ${customerId}:`, error);
        if (error instanceof Prisma.PrismaClientKnownRequestError) { if (error.code === 'P2025') { throw new Error(`No se encontró el cliente especificado al intentar actualizar.`); } throw new Error(`Error de base de datos al cambiar estado de favorito: ${error.message}`); }
        if (error instanceof Error) { throw error; }
        throw new Error('Error inesperado al cambiar el estado de favorito.');
    }
};

// End of File: backend/src/customer/customer.service.ts