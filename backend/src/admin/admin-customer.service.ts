// filename: backend/src/admin/admin-customer.service.ts
// Version: 1.3.1 (Restore GetCustomersOptions definition)

// Contiene la lógica para las operaciones de administrador sobre clientes

import { PrismaClient, Prisma, UserRole, User, GrantedReward } from '@prisma/client';

const prisma = new PrismaClient();

// --- Interfaz GetCustomersOptions (Restaurada) ---
interface GetCustomersOptions {
    page?: number;
    limit?: number;
    sortBy?: string;
    sortDir?: 'asc' | 'desc'; // Asegúrate que el tipo SortDirection esté disponible o definido si se usa aquí
    filters?: {
      search?: string;
      isFavorite?: boolean;
      isActive?: boolean;
    }
}
// --- Fin Interfaz ---

// --- Selector y Tipo para Detalles del Cliente (sin cambios respecto a v1.2.2) ---
const customerDetailsSelector = Prisma.validator<Prisma.UserSelect>()({
    id: true, email: true, name: true, points: true, createdAt: true, isActive: true,
    isFavorite: true, tierAchievedAt: true, adminNotes: true, businessId: true, role: true,
    currentTier: { select: { id: true, name: true, level: true, description: true } }
});
export type CustomerDetails = Prisma.UserGetPayload<{ select: typeof customerDetailsSelector }>;
// --- Fin Selector y Tipo ---


// getCustomersForBusiness (Usa GetCustomersOptions)
export const getCustomersForBusiness = async ( businessId: string, options: GetCustomersOptions = {} ): Promise<{ items: any[], totalPages: number, currentPage: number, totalItems: number }> => {
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

// getCustomerDetailsById (sin cambios)
export const getCustomerDetailsById = async (customerId: string, adminBusinessId: string): Promise<CustomerDetails | null> => {
    // ... (código existente sin cambios)
     console.log(`[ADM_CUST_SVC] Getting details for customer ${customerId} by admin from business ${adminBusinessId}`);
    try {
        const customerDetails = await prisma.user.findUnique({
            where: { id: customerId, businessId: adminBusinessId, role: UserRole.CUSTOMER_FINAL },
            select: customerDetailsSelector
        });
        if (!customerDetails) { throw new Error(`Cliente con ID ${customerId} no encontrado o no pertenece a tu negocio.`); }
        console.log(`[ADM_CUST_SVC] Details found for customer ${customerId}`);
        return customerDetails;
    } catch (error) {
        console.error(`[ADM_CUST_SVC] Error getting details for customer ${customerId}:`, error);
        if (error instanceof Prisma.PrismaClientKnownRequestError) { throw new Error(`Error de base de datos al obtener detalles del cliente: ${error.message}`); }
        if (error instanceof Error) { throw error; }
        throw new Error('Error inesperado al obtener los detalles del cliente.');
    }
};

// updateAdminNotesForCustomer (sin cambios)
type NotesUpdate = Pick<User, 'id' | 'email' | 'adminNotes'>;
export const updateAdminNotesForCustomer = async ( customerId: string, adminBusinessId: string, notes: string | null ): Promise<NotesUpdate> => {
    // ... (código existente sin cambios)
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
    } catch (error) {
        console.error(`[ADM_CUST_SVC] Error updating admin notes for customer ${customerId}:`, error);
        if (error instanceof Prisma.PrismaClientKnownRequestError) { if (error.code === 'P2025') { throw new Error(`No se encontró el cliente especificado al intentar actualizar las notas.`); } throw new Error(`Error de base de datos al actualizar las notas: ${error.message}`); }
        if (error instanceof Error) { throw error; }
        throw new Error('Error inesperado al actualizar las notas del administrador.');
    }
};


// adjustPointsForCustomer (sin cambios)
export const adjustPointsForCustomer = async ( customerId: string, adminBusinessId: string, amount: number, reason?: string | null ): Promise<User> => { /* ... */ return {} as User; };
// changeCustomerTier (sin cambios)
export const changeCustomerTier = async ( customerId: string, adminBusinessId: string, newTierId: string | null ): Promise<User> => { /* ... */ return {} as User; };
// assignRewardToCustomer (sin cambios)
export const assignRewardToCustomer = async ( customerId: string, adminBusinessId: string, rewardId: string, adminUserId: string ): Promise<GrantedReward> => { /* ... */ return {} as GrantedReward; };
// toggleFavoriteStatus (sin cambios funcionales)
type FavoriteStatusUpdate = Pick<User, 'id' | 'email' | 'isFavorite'>;
export const toggleFavoriteStatus = async ( customerId: string, adminBusinessId: string ): Promise<FavoriteStatusUpdate> => { /* ... */ return {} as FavoriteStatusUpdate; };
// toggleActiveStatusForCustomer (sin cambios)
type ActiveStatusUpdate = Pick<User, 'id' | 'email' | 'isActive'>;
export const toggleActiveStatusForCustomer = async ( customerId: string, adminBusinessId: string ): Promise<ActiveStatusUpdate> => { /* ... */ return {} as ActiveStatusUpdate; };


// End of File: backend/src/admin/admin-customer.service.ts