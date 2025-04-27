// filename: backend/src/admin/admin-customer.service.ts
// Version: 1.6.1 (Fix return type of getCustomersForBusiness - COMPLETE FILE)

import { PrismaClient, Prisma, UserRole, User, GrantedReward } from '@prisma/client';

const prisma = new PrismaClient();

// --- Tipos y Selectores (Completos) ---
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

const customerDetailsSelector = Prisma.validator<Prisma.UserSelect>()({
    id: true, email: true, name: true, points: true, createdAt: true, isActive: true,
    isFavorite: true, tierAchievedAt: true, adminNotes: true, businessId: true, role: true,
    currentTier: { select: { id: true, name: true, level: true, description: true } }
});
export type CustomerDetails = Prisma.UserGetPayload<{ select: typeof customerDetailsSelector }>;

interface BatchPayload { count: number; }
type FavoriteStatusUpdate = Pick<User, 'id' | 'email' | 'isFavorite'>;
type ActiveStatusUpdate = Pick<User, 'id' | 'email' | 'isActive'>;
type NotesUpdate = Pick<User, 'id' | 'email' | 'adminNotes'>;

const customerListItemSelector = Prisma.validator<Prisma.UserSelect>()({
    id: true, name: true, email: true, points: true, createdAt: true, isActive: true, isFavorite: true,
    currentTier: { select: { name: true, id: true, level: true } }
});
type CustomerListItem = Prisma.UserGetPayload<{ select: typeof customerListItemSelector }>;
// --- Fin Tipos y Selectores ---


/**
 * Obtiene una lista paginada, filtrada y ordenada de clientes para un negocio específico.
 */
export const getCustomersForBusiness = async (
    businessId: string,
    options: GetCustomersOptions = {}
): Promise<{ items: CustomerListItem[], totalPages: number, currentPage: number, totalItems: number }> => {
    const { page = 1, limit = 10, sortBy = 'createdAt', sortDir = 'desc', filters = {} } = options;
    console.log(`[ADM_CUST_SVC] getCustomersForBusiness - Fetching: businessId=${businessId}, Page=${page}, Limit=${limit}, SortBy=${sortBy}, SortDir=${sortDir}, Filters=`, filters);
    const allowedSortByFields = ['name', 'email', 'points', 'createdAt', 'isActive', 'isFavorite', 'currentTier.level'];
    const safeSortBy = allowedSortByFields.includes(sortBy) ? sortBy : 'createdAt';
    const safeSortDir = sortDir === 'asc' ? 'asc' : 'desc';
    const skip = (page - 1) * limit;
    try {
        const whereClause: Prisma.UserWhereInput = { businessId: businessId, role: UserRole.CUSTOMER_FINAL };
        if (filters.isFavorite !== undefined) { whereClause.isFavorite = filters.isFavorite; }
        if (filters.isActive !== undefined) { whereClause.isActive = filters.isActive; }
        // --- Código Restaurado ---
        if (filters.search && filters.search.trim() !== '') {
            const searchTerm = filters.search.trim();
            whereClause.OR = [
                { name: { contains: searchTerm, mode: 'insensitive' } },
                { email: { contains: searchTerm, mode: 'insensitive' } }
            ];
        }
        // --- Fin Código Restaurado ---
        let orderByClause: Prisma.UserOrderByWithRelationInput | Prisma.UserOrderByWithRelationInput[];
        // --- Código Restaurado ---
        if (safeSortBy === 'currentTier.level') {
            orderByClause = { currentTier: { level: safeSortDir } };
        } else {
            orderByClause = { [safeSortBy]: safeSortDir };
        }
        // --- Fin Código Restaurado ---
        const selectClause = customerListItemSelector; // Usar el selector definido
        console.log('[ADM_CUST_SVC] getCustomersForBusiness - Clauses built:', { where: whereClause, orderBy: orderByClause });

        console.log('[ADM_CUST_SVC] getCustomersForBusiness - Finding many customers...');
        const customers = await prisma.user.findMany({ where: whereClause, select: selectClause, orderBy: orderByClause, skip: skip, take: limit, });
        console.log(`[ADM_CUST_SVC] getCustomersForBusiness - findMany completed. Found ${customers?.length ?? 'N/A'} customers.`);

        console.log('[ADM_CUST_SVC] getCustomersForBusiness - Counting total customers...');
        const totalItems = await prisma.user.count({ where: whereClause, });
        console.log(`[ADM_CUST_SVC] getCustomersForBusiness - count completed. Total items: ${totalItems ?? 'N/A'}`);

        console.log('[ADM_CUST_SVC] getCustomersForBusiness - Queries finished.');
        const totalPages = Math.ceil(totalItems / limit);
        console.log(`[ADM_CUST_SVC] getCustomersForBusiness - Calculation done. Total pages: ${totalPages}`);
        return { items: customers, totalPages: totalPages, currentPage: page, totalItems: totalItems }; // Sin 'as User[]'
    } catch (error) {
        console.error(`[ADM_CUST_SVC] *** ERROR within getCustomersForBusiness try/catch for business ${businessId}:`, error);
        console.error(`[ADM_CUST_SVC] Error fetching customers for business ${businessId} with options:`, options, error);
        throw new Error('Error al obtener la lista de clientes desde la base de datos.');
    }
};

/**
 * Obtiene los detalles completos de un cliente específico por su ID.
 */
export const getCustomerDetailsById = async (customerId: string, adminBusinessId: string): Promise<CustomerDetails | null> => {
     console.log(`[ADM_CUST_SVC] Getting details for customer ${customerId} by admin from business ${adminBusinessId}`);
    try {
        const customerDetails = await prisma.user.findUnique({ where: { id: customerId, businessId: adminBusinessId, role: UserRole.CUSTOMER_FINAL }, select: customerDetailsSelector });
        if (!customerDetails) { throw new Error(`Cliente con ID ${customerId} no encontrado o no pertenece a tu negocio.`); }
        console.log(`[ADM_CUST_SVC] Details found for customer ${customerId}`);
        return customerDetails;
    } catch (error) { console.error(`[ADM_CUST_SVC] Error getting details for customer ${customerId}:`, error); if (error instanceof Prisma.PrismaClientKnownRequestError) { throw new Error(`Error de base de datos al obtener detalles del cliente: ${error.message}`); } if (error instanceof Error) { throw error; } throw new Error('Error inesperado al obtener los detalles del cliente.'); }
};

/**
 * Actualiza las notas de administrador para un cliente específico.
 */
export const updateAdminNotesForCustomer = async ( customerId: string, adminBusinessId: string, notes: string | null ): Promise<NotesUpdate> => {
     console.log(`[ADM_CUST_SVC] Updating admin notes for customer ${customerId} by admin from business ${adminBusinessId}`);
    try {
        const updatedUser = await prisma.$transaction(async (tx) => {
            const customer = await tx.user.findUnique({ where: { id: customerId, businessId: adminBusinessId }, select: { id: true, email: true } });
            if (!customer) { throw new Error(`Cliente con ID ${customerId} no encontrado o no pertenece a tu negocio.`); }
            const userAfterUpdate = await tx.user.update({ where: { id: customerId }, data: { adminNotes: notes }, select: { id: true, email: true, adminNotes: true } });
            console.log(`[ADM_CUST_SVC] Admin notes updated successfully for customer ${customer.email} (${customerId})`);
            return userAfterUpdate;
        });
        return updatedUser;
    } catch (error) { console.error(`[ADM_CUST_SVC] Error updating admin notes for customer ${customerId}:`, error); if (error instanceof Prisma.PrismaClientKnownRequestError) { if (error.code === 'P2025') { throw new Error(`No se encontró el cliente especificado al intentar actualizar las notas.`); } throw new Error(`Error de base de datos al actualizar las notas: ${error.message}`); } if (error instanceof Error) { throw error; } throw new Error('Error inesperado al actualizar las notas del administrador.'); }
};

/**
 * Ajusta los puntos de un cliente específico.
 */
export const adjustPointsForCustomer = async ( customerId: string, adminBusinessId: string, amount: number, reason?: string | null ): Promise<User> => {
     console.log(`[ADM_CUST_SVC] Attempting to adjust points for customer ${customerId} by ${amount}. Reason: ${reason || 'N/A'}. Admin Business: ${adminBusinessId}`);
    if (amount === 0) { throw new Error("La cantidad de puntos a ajustar no puede ser cero."); }
    try {
        const updatedUser = await prisma.$transaction(async (tx) => {
            const customer = await tx.user.findUnique({ where: { id: customerId }, select: { businessId: true, id: true, email: true } });
            if (!customer) { throw new Error(`Cliente con ID ${customerId} no encontrado.`); }
            if (customer.businessId !== adminBusinessId) { throw new Error("No tienes permiso para modificar este cliente."); }
            const userAfterUpdate = await tx.user.update({ where: { id: customerId }, data: { points: { increment: amount } } });
            console.log(`[ADM_CUST_SVC] Points adjusted successfully for customer ${userAfterUpdate.email} (${customerId}). New balance potentially: ${userAfterUpdate.points}`);
            return userAfterUpdate;
        });
        return updatedUser;
    } catch (error) { console.error(`[ADM_CUST_SVC] Error adjusting points for customer ${customerId}:`, error); if (error instanceof Prisma.PrismaClientKnownRequestError) { if (error.code === 'P2025') { throw new Error(`No se encontró el cliente especificado para actualizar.`); } throw new Error(`Error de base de datos al ajustar puntos: ${error.message}`); } if (error instanceof Error) { throw error; } throw new Error('Error inesperado al ajustar los puntos.'); }
};

/**
 * Cambia manualmente el nivel (Tier) de un cliente.
 */
export const changeCustomerTier = async ( customerId: string, adminBusinessId: string, tierId: string | null ): Promise<User> => {
     console.log(`[ADM_CUST_SVC] Attempting to change tier for customer ${customerId} to tier ${tierId ?? 'NULL'}. Admin Business: ${adminBusinessId}`);
    try {
        const updatedUser = await prisma.$transaction(async (tx) => {
            const customer = await tx.user.findUnique({ where: { id: customerId, businessId: adminBusinessId }, select: { id: true, email: true } });
            if (!customer) { throw new Error(`Cliente con ID ${customerId} no encontrado o no pertenece a tu negocio.`); }
            if (tierId !== null) { const tierExists = await tx.tier.findUnique({ where: { id: tierId, businessId: adminBusinessId }, select: { id: true } }); if (!tierExists) { throw new Error(`El nivel seleccionado (ID: ${tierId}) no es válido o no pertenece a tu negocio.`); } }
            const userAfterUpdate = await tx.user.update({ where: { id: customerId }, data: { currentTierId: tierId, tierAchievedAt: tierId ? new Date() : null } });
            console.log(`[ADM_CUST_SVC] Tier changed successfully for customer ${userAfterUpdate.email} (${customerId}) to ${tierId ?? 'NULL'}`);
            return userAfterUpdate;
        });
        return updatedUser;
    } catch (error) { console.error(`[ADM_CUST_SVC] Error changing tier for customer ${customerId} to ${tierId}:`, error); if (error instanceof Prisma.PrismaClientKnownRequestError) { throw new Error(`Error de base de datos al cambiar nivel: ${error.message}`); } if (error instanceof Error) { throw error; } throw new Error('Error inesperado al cambiar el nivel del cliente.'); }
};

/**
 * Asigna una recompensa como "regalo" a un cliente.
 */
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
    } catch (error) { console.error(`[ADM_CUST_SVC] Error assigning reward ${rewardId} to customer ${customerId}:`, error); if (error instanceof Prisma.PrismaClientKnownRequestError) { throw new Error(`Error de base de datos al asignar recompensa: ${error.message}`); } if (error instanceof Error) { throw error; } throw new Error('Error inesperado al asignar la recompensa.'); }
};

/**
 * Cambia el estado de favorito de un cliente.
 */
export const toggleFavoriteStatus = async ( customerId: string, adminBusinessId: string ): Promise<FavoriteStatusUpdate> => {
     console.log(`[ADM_CUST_SVC] Attempting to toggle favorite status for customer ${customerId} by admin from business ${adminBusinessId}`);
    try {
        const updatedUser = await prisma.$transaction(async (tx) => {
            const customer = await tx.user.findUnique({ where: { id: customerId, businessId: adminBusinessId }, select: { id: true, isFavorite: true, email: true } });
            if (!customer) { throw new Error(`Cliente con ID ${customerId} no encontrado o no pertenece a tu negocio.`); }
            const newFavoriteStatus = !customer.isFavorite;
            const userAfterUpdate = await tx.user.update({ where: { id: customerId }, data: { isFavorite: newFavoriteStatus }, select: { id: true, email: true, isFavorite: true } });
            console.log(`[ADM_CUST_SVC] Favorite status for customer ${customer.email} (${customerId}) toggled to ${newFavoriteStatus}`);
            return userAfterUpdate;
        });
        return updatedUser;
    } catch (error) { console.error(`[ADM_CUST_SVC] Error toggling favorite status for customer ${customerId}:`, error); if (error instanceof Prisma.PrismaClientKnownRequestError) { if (error.code === 'P2025') { throw new Error(`No se encontró el cliente especificado al intentar actualizar.`); } throw new Error(`Error de base de datos al cambiar estado de favorito: ${error.message}`); } if (error instanceof Error) { throw error; } throw new Error('Error inesperado al cambiar el estado de favorito.'); }
};

/**
 * Cambia el estado activo/inactivo de un cliente.
 */
export const toggleActiveStatusForCustomer = async ( customerId: string, adminBusinessId: string ): Promise<ActiveStatusUpdate> => {
     console.log(`[ADM_CUST_SVC] Attempting to toggle active status for customer ${customerId} by admin from business ${adminBusinessId}`);
    try {
        const updatedUser = await prisma.$transaction(async (tx) => {
            const customer = await tx.user.findUnique({ where: { id: customerId, businessId: adminBusinessId }, select: { id: true, isActive: true, email: true } });
            if (!customer) { throw new Error(`Cliente con ID ${customerId} no encontrado o no pertenece a tu negocio.`); }
            const newActiveStatus = !customer.isActive;
            const userAfterUpdate = await tx.user.update({ where: { id: customerId }, data: { isActive: newActiveStatus }, select: { id: true, email: true, isActive: true } });
            console.log(`[ADM_CUST_SVC] Active status for customer ${customer.email} (${customerId}) toggled to ${newActiveStatus}`);
            return userAfterUpdate;
        });
        return updatedUser;
    } catch (error) { console.error(`[ADM_CUST_SVC] Error toggling active status for customer ${customerId}:`, error); if (error instanceof Prisma.PrismaClientKnownRequestError) { if (error.code === 'P2025') { throw new Error(`No se encontró el cliente especificado al intentar actualizar.`); } throw new Error(`Error de base de datos al cambiar estado activo: ${error.message}`); } if (error instanceof Error) { throw error; } throw new Error('Error inesperado al cambiar el estado activo del cliente.'); }
};

/**
 * Actualiza el estado 'isActive' para múltiples clientes de un negocio específico.
 */
export const bulkUpdateStatusForCustomers = async ( customerIds: string[], adminBusinessId: string, isActive: boolean ): Promise<BatchPayload> => {
    const action = isActive ? 'Activating' : 'Deactivating';
    console.log(`[ADM_CUST_SVC] ${action} ${customerIds.length} customers for business ${adminBusinessId}`);
    try {
        const result = await prisma.user.updateMany({ where: { id: { in: customerIds, }, businessId: adminBusinessId, role: UserRole.CUSTOMER_FINAL }, data: { isActive: isActive, }, });
        console.log(`[ADM_CUST_SVC] Bulk status update successful. ${result.count} customers updated to isActive=${isActive}.`);
        return result;
    } catch (error) { console.error(`[ADM_CUST_SVC] Error during bulk status update for customers [${customerIds.join(', ')}] of business ${adminBusinessId}:`, error); if (error instanceof Prisma.PrismaClientKnownRequestError) { throw new Error(`Error de base de datos durante la actualización masiva: ${error.message}`); } throw new Error('Error inesperado durante la actualización masiva de estado.'); }
};

/**
 * Elimina múltiples clientes de un negocio específico.
 */
export const bulkDeleteCustomers = async ( customerIds: string[], adminBusinessId: string ): Promise<BatchPayload> => {
    console.log(`[ADM_CUST_SVC] Deleting ${customerIds.length} customers for business ${adminBusinessId}`);
    try {
        const result = await prisma.user.deleteMany({ where: { id: { in: customerIds, }, businessId: adminBusinessId, role: UserRole.CUSTOMER_FINAL }, });
        console.log(`[ADM_CUST_SVC] Bulk delete successful. ${result.count} customers deleted.`);
        return result;
    } catch (error) { console.error(`[ADM_CUST_SVC] Error during bulk delete for customers [${customerIds.join(', ')}] of business ${adminBusinessId}:`, error); if (error instanceof Prisma.PrismaClientKnownRequestError) { if (error.code === 'P2003') { throw new Error(`No se pudieron eliminar todos los clientes porque tienen datos asociados. Código: ${error.code}`); } throw new Error(`Error de base de datos durante el borrado masivo: ${error.message} (Código: ${error.code})`); } throw new Error('Error inesperado durante el borrado masivo de clientes.'); }
};

/**
 * Ajusta (incrementa/decrementa) los puntos para múltiples clientes de un negocio.
 */
export const bulkAdjustPointsForCustomers = async ( customerIds: string[], adminBusinessId: string, amount: number, reason: string | null ): Promise<BatchPayload> => {
    const action = amount > 0 ? 'Adding' : 'Subtracting';
    console.log(`[ADM_CUST_SVC] ${action} ${Math.abs(amount)} points for ${customerIds.length} customers. Business: ${adminBusinessId}. Reason: ${reason || 'N/A'}`);
    try {
        const result = await prisma.user.updateMany({
            where: { id: { in: customerIds, }, businessId: adminBusinessId, role: UserRole.CUSTOMER_FINAL },
            data: { points: { increment: amount, } },
        });
        console.log(`[ADM_CUST_SVC] Bulk points adjustment successful. ${result.count} customers updated.`);
        return result;
    } catch (error) { console.error(`[ADM_CUST_SVC] Error during bulk points adjustment for customers [${customerIds.join(', ')}] of business ${adminBusinessId}:`, error); if (error instanceof Prisma.PrismaClientKnownRequestError) { throw new Error(`Error de base de datos durante el ajuste masivo de puntos: ${error.message}`); } throw new Error('Error inesperado durante el ajuste masivo de puntos.'); }
};

// End of File: backend/src/admin/admin-customer.service.ts