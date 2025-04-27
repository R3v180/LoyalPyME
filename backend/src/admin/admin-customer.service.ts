// filename: backend/src/admin/admin-customer.service.ts
// Version: 1.1.0 (Add toggleActiveStatusForCustomer function)

// Contiene la lógica para las operaciones de administrador sobre clientes

import { PrismaClient, Prisma, UserRole, User, GrantedReward } from '@prisma/client';

const prisma = new PrismaClient();

// Interfaz GetCustomersOptions (sin cambios)
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

// getCustomersForBusiness (sin cambios)
export const getCustomersForBusiness = async ( businessId: string, options: GetCustomersOptions = {} ) => {
    const { page = 1, limit = 10, sortBy = 'createdAt', sortDir = 'desc', filters = {} } = options;
    console.log(`[ADM_CUST_SVC] Fetching customers for business ID: ${businessId}, Page: ${page}, Limit: ${limit}, SortBy: ${sortBy}, SortDir: ${sortDir}, Filters:`, filters);
    const allowedSortByFields = ['name', 'email', 'points', 'createdAt', 'isActive', 'isFavorite', 'currentTier.level'];
    const safeSortBy = allowedSortByFields.includes(sortBy) ? sortBy : 'createdAt';
    const safeSortDir = sortDir === 'asc' ? 'asc' : 'desc';
    const skip = (page - 1) * limit;
    try {
        const whereClause: Prisma.UserWhereInput = {
            businessId: businessId,
            role: UserRole.CUSTOMER_FINAL
        };
        if (filters.isFavorite !== undefined) { whereClause.isFavorite = filters.isFavorite; }
        if (filters.isActive !== undefined) { whereClause.isActive = filters.isActive; }
        if (filters.search && filters.search.trim() !== '') {
            const searchTerm = filters.search.trim();
            whereClause.OR = [
                { name: { contains: searchTerm, mode: 'insensitive' } },
                { email: { contains: searchTerm, mode: 'insensitive' } }
            ];
        }
        let orderByClause: Prisma.UserOrderByWithRelationInput | Prisma.UserOrderByWithRelationInput[];
        if (safeSortBy === 'currentTier.level') {
            orderByClause = { currentTier: { level: safeSortDir } };
        } else {
            orderByClause = { [safeSortBy]: safeSortDir };
        }
        const selectClause = {
            id: true, name: true, email: true, points: true, createdAt: true, isActive: true, isFavorite: true,
            currentTier: { select: { name: true, id: true, level: true } }
        };
        const [customers, totalItems] = await prisma.$transaction([
            prisma.user.findMany({ where: whereClause, select: selectClause, orderBy: orderByClause, skip: skip, take: limit, }),
            prisma.user.count({ where: whereClause, })
        ]);
        const totalPages = Math.ceil(totalItems / limit);
        console.log(`[ADM_CUST_SVC] Found ${customers.length} customers on page ${page}/${totalPages} (Total items: ${totalItems}) for business ${businessId} with applied filters.`);
        return { items: customers, totalPages: totalPages, currentPage: page, totalItems: totalItems };
    } catch (error) {
        console.error(`[ADM_CUST_SVC] Error fetching customers for business ${businessId} with options:`, options, error);
        throw new Error('Error al obtener la lista de clientes desde la base de datos.');
    }
};

// adjustPointsForCustomer (sin cambios)
export const adjustPointsForCustomer = async ( customerId: string, adminBusinessId: string, amount: number, reason?: string | null ): Promise<User> => {
    console.log(`[ADM_CUST_SVC] Attempting to adjust points for customer ${customerId} by ${amount}. Reason: ${reason || 'N/A'}. Admin Business: ${adminBusinessId}`);
    if (amount === 0) { throw new Error("La cantidad de puntos a ajustar no puede ser cero."); }
    try {
        const updatedUser = await prisma.$transaction(async (tx) => {
            const customer = await tx.user.findUnique({ where: { id: customerId }, select: { businessId: true, id: true, email: true } });
            if (!customer) { throw new Error(`Cliente con ID ${customerId} no encontrado.`); }
            if (customer.businessId !== adminBusinessId) { console.warn(`[ADM_CUST_SVC] Unauthorized attempt by admin from ${adminBusinessId} to modify customer ${customerId} of business ${customer.businessId}`); throw new Error("No tienes permiso para modificar este cliente."); }
            const userAfterUpdate = await tx.user.update({ where: { id: customerId }, data: { points: { increment: amount } } });
            console.log(`[ADM_CUST_SVC] Points adjusted successfully for customer ${userAfterUpdate.email} (${customerId}). New balance potentially: ${userAfterUpdate.points}`);
            return userAfterUpdate;
        });
        return updatedUser;
    } catch (error) {
        console.error(`[ADM_CUST_SVC] Error adjusting points for customer ${customerId}:`, error);
        if (error instanceof Prisma.PrismaClientKnownRequestError) { if (error.code === 'P2025') { throw new Error(`No se encontró el cliente especificado para actualizar.`); } throw new Error(`Error de base de datos al ajustar puntos: ${error.message}`); }
        if (error instanceof Error) { throw error; }
        throw new Error('Error inesperado al ajustar los puntos.');
    }
};

// changeCustomerTier (sin cambios)
export const changeCustomerTier = async ( customerId: string, adminBusinessId: string, newTierId: string | null ): Promise<User> => {
    console.log(`[ADM_CUST_SVC] Attempting to change tier for customer ${customerId} to tier ${newTierId ?? 'NULL'}. Admin Business: ${adminBusinessId}`);
    try {
        const updatedUser = await prisma.$transaction(async (tx) => {
            const customer = await tx.user.findUnique({ where: { id: customerId, businessId: adminBusinessId }, select: { id: true, email: true } });
            if (!customer) { throw new Error(`Cliente con ID ${customerId} no encontrado o no pertenece a tu negocio.`); }
            if (newTierId !== null) { const tierExists = await tx.tier.findUnique({ where: { id: newTierId, businessId: adminBusinessId }, select: { id: true } }); if (!tierExists) { throw new Error(`El nivel seleccionado (ID: ${newTierId}) no es válido o no pertenece a tu negocio.`); } }
            const userAfterUpdate = await tx.user.update({ where: { id: customerId }, data: { currentTierId: newTierId, tierAchievedAt: newTierId ? new Date() : null } });
            console.log(`[ADM_CUST_SVC] Tier changed successfully for customer ${userAfterUpdate.email} (${customerId}) to ${newTierId ?? 'NULL'}`);
            return userAfterUpdate;
        });
        return updatedUser;
    } catch (error) {
        console.error(`[ADM_CUST_SVC] Error changing tier for customer ${customerId} to ${newTierId}:`, error);
         if (error instanceof Prisma.PrismaClientKnownRequestError) { throw new Error(`Error de base de datos al cambiar nivel: ${error.message}`); }
         if (error instanceof Error) { throw error; }
         throw new Error('Error inesperado al cambiar el nivel del cliente.');
    }
};

// assignRewardToCustomer (sin cambios)
export const assignRewardToCustomer = async ( customerId: string, adminBusinessId: string, rewardId: string, adminUserId: string ): Promise<GrantedReward> => {
    console.log(`[ADM_CUST_SVC] Attempting to assign reward ${rewardId} to customer ${customerId} by admin ${adminUserId} from business ${adminBusinessId}`);
    try {
        const grantedReward = await prisma.$transaction(async (tx) => {
            const customer = await tx.user.findUnique({ where: { id: customerId, businessId: adminBusinessId }, select: { id: true, email: true } });
            if (!customer) { throw new Error(`Cliente con ID ${customerId} no encontrado o no pertenece a tu negocio.`); }
            const reward = await tx.reward.findUnique({ where: { id: rewardId, businessId: adminBusinessId }, select: { id: true, isActive: true, name: true } });
            if (!reward) { throw new Error(`Recompensa con ID ${rewardId} no encontrada o no pertenece a tu negocio.`); }
            if (!reward.isActive) { throw new Error(`La recompensa "${reward.name}" (${rewardId}) no está activa y no puede ser asignada.`); }
            const newGrantedReward = await tx.grantedReward.create({ data: { userId: customerId, rewardId: rewardId, businessId: adminBusinessId, assignedById: adminUserId, status: 'PENDING', } });
            console.log(`[ADM_CUST_SVC] Reward ${reward.name} (${rewardId}) assigned successfully to customer ${customer.email} (${customerId}). GrantedReward ID: ${newGrantedReward.id}`);
            return newGrantedReward;
        });
        return grantedReward;
    } catch (error) {
        console.error(`[ADM_CUST_SVC] Error assigning reward ${rewardId} to customer ${customerId}:`, error);
        if (error instanceof Prisma.PrismaClientKnownRequestError) { throw new Error(`Error de base de datos al asignar recompensa: ${error.message}`); }
        if (error instanceof Error) { throw error; }
        throw new Error('Error inesperado al asignar la recompensa.');
    }
};

// toggleFavoriteStatus (sin cambios, pero ajustamos tipo de retorno)
// Definimos un tipo para la respuesta parcial que necesitamos
type FavoriteStatusUpdate = Pick<User, 'id' | 'email' | 'isFavorite'>;

export const toggleFavoriteStatus = async ( customerId: string, adminBusinessId: string ): Promise<FavoriteStatusUpdate> => {
    console.log(`[ADM_CUST_SVC] Attempting to toggle favorite status for customer ${customerId} by admin from business ${adminBusinessId}`);
    try {
        const updatedUser = await prisma.$transaction(async (tx) => {
            const customer = await tx.user.findUnique({ where: { id: customerId, businessId: adminBusinessId }, select: { id: true, isFavorite: true, email: true } });
            if (!customer) { throw new Error(`Cliente con ID ${customerId} no encontrado o no pertenece a tu negocio.`); }
            const newFavoriteStatus = !customer.isFavorite;
            const userAfterUpdate = await tx.user.update({ where: { id: customerId }, data: { isFavorite: newFavoriteStatus }, select: { id: true, email: true, isFavorite: true } }); // Seleccionamos solo lo necesario
            console.log(`[ADM_CUST_SVC] Favorite status for customer ${customer.email} (${customerId}) toggled to ${newFavoriteStatus}`);
            return userAfterUpdate; // El tipo devuelto ahora coincide con FavoriteStatusUpdate
        });
        return updatedUser;
    } catch (error) {
        console.error(`[ADM_CUST_SVC] Error toggling favorite status for customer ${customerId}:`, error);
        if (error instanceof Prisma.PrismaClientKnownRequestError) { if (error.code === 'P2025') { throw new Error(`No se encontró el cliente especificado al intentar actualizar.`); } throw new Error(`Error de base de datos al cambiar estado de favorito: ${error.message}`); }
        if (error instanceof Error) { throw error; }
        throw new Error('Error inesperado al cambiar el estado de favorito.');
    }
};


// --- NUEVA FUNCIÓN ---
/**
 * Cambia el estado activo/inactivo de un cliente.
 * Verifica que el admin pertenezca al mismo negocio que el cliente.
 */
// Definimos un tipo para la respuesta parcial que necesitamos
type ActiveStatusUpdate = Pick<User, 'id' | 'email' | 'isActive'>;

export const toggleActiveStatusForCustomer = async ( customerId: string, adminBusinessId: string ): Promise<ActiveStatusUpdate> => {
    console.log(`[ADM_CUST_SVC] Attempting to toggle active status for customer ${customerId} by admin from business ${adminBusinessId}`);
    try {
        // Usar transacciÃ³n para verificar pertenencia y obtener estado actual antes de actualizar
        const updatedUser = await prisma.$transaction(async (tx) => {
            // 1. Buscar cliente, verificar pertenencia y obtener estado actual
            const customer = await tx.user.findUnique({
                where: {
                    id: customerId,
                    businessId: adminBusinessId // Verificar pertenencia directamente
                },
                select: {
                    id: true,
                    isActive: true, // Necesitamos el estado actual
                    email: true     // Para logs/mensajes
                }
            });

            // Verificar si el cliente existe y pertenece al negocio
            if (!customer) {
                throw new Error(`Cliente con ID ${customerId} no encontrado o no pertenece a tu negocio.`);
            }

            // 2. Calcular el nuevo estado y actualizar
            const newActiveStatus = !customer.isActive;
            const userAfterUpdate = await tx.user.update({
                where: {
                    id: customerId
                    // No necesitamos businessId aquÃ­ porque ya lo verificamos en findUnique
                },
                data: {
                    isActive: newActiveStatus // Establecer el nuevo estado
                },
                select: { // Seleccionar solo los campos necesarios para la respuesta
                    id: true,
                    email: true,
                    isActive: true
                }
            });

            console.log(`[ADM_CUST_SVC] Active status for customer ${customer.email} (${customerId}) toggled to ${newActiveStatus}`);
            return userAfterUpdate; // Devuelve el objeto con id, email, isActive
        });

        // El tipo devuelto por la transacciÃ³n coincide con ActiveStatusUpdate
        return updatedUser;

    } catch (error) {
        console.error(`[ADM_CUST_SVC] Error toggling active status for customer ${customerId}:`, error);
        if (error instanceof Prisma.PrismaClientKnownRequestError) {
             // El cÃ³digo P2025 ('Record to update not found.') serÃ­a manejado por el findUnique inicial
             if (error.code === 'P2025') { throw new Error(`No se encontrÃ³ el cliente especificado al intentar actualizar.`); }
             throw new Error(`Error de base de datos al cambiar estado activo: ${error.message}`);
         }
        if (error instanceof Error) { // Relanzar errores de validaciÃ³n (no encontrado, etc.)
            throw error;
        }
        throw new Error('Error inesperado al cambiar el estado activo del cliente.');
    }
};
// --- FIN NUEVA FUNCIÓN ---

// End of File: backend/src/admin/admin-customer.service.ts