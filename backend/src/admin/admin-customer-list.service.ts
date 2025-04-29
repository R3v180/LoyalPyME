// filename: backend/src/admin/admin-customer-list.service.ts
// Version: 1.0.0 (Extracted from admin-customer.service.ts and cleaned)

import { PrismaClient, Prisma, UserRole } from '@prisma/client';

const prisma = new PrismaClient();

// --- Tipos y Selectores (Copiados del original, necesarios para esta función) ---
interface GetCustomersOptions {
    page?: number;
    limit?: number;
    sortBy?: string;
    sortDir?: 'asc' | 'desc';
    filters?: {
        search?: string;
        isFavorite?: boolean;
        isActive?: boolean;
        tierId?: string;
    }
}

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
    // Log inicial con todos los parámetros (útil para debug)
    console.log(`[ADM_CUST_LIST_SVC] getCustomersForBusiness - Fetching: businessId=${businessId}, Page=${page}, Limit=${limit}, SortBy=${sortBy}, SortDir=${sortDir}, Filters=`, filters);
    const allowedSortByFields = ['name', 'email', 'points', 'createdAt', 'isActive', 'isFavorite', 'currentTier.level'];
    const safeSortBy = allowedSortByFields.includes(sortBy) ? sortBy : 'createdAt';
    const safeSortDir = sortDir === 'asc' ? 'asc' : 'desc';
    const skip = (page - 1) * limit;

    try {
        // Construcción de whereClause con todos los filtros
        const whereClause: Prisma.UserWhereInput = {
            businessId: businessId,
            role: UserRole.CUSTOMER_FINAL
        };

        // Filtro de Búsqueda (Name/Email)
        if (filters.search && filters.search.trim() !== '') {
            const searchTerm = filters.search.trim();
            whereClause.OR = [
                { name: { contains: searchTerm, mode: 'insensitive' } },
                { email: { contains: searchTerm, mode: 'insensitive' } }
            ];
        }

        // Filtro Favorito (isFavorite)
        if (filters.isFavorite !== undefined) {
            whereClause.isFavorite = filters.isFavorite;
        }

        // Filtro Estado (isActive)
        if (filters.isActive !== undefined) {
            whereClause.isActive = filters.isActive;
        }

        // Filtro Nivel (tierId)
        if (filters.tierId && filters.tierId.trim() !== '') {
             if (filters.tierId === 'NONE') { // Manejar explícitamente "Sin Nivel"
                whereClause.currentTierId = null;
             } else {
                whereClause.currentTierId = filters.tierId;
             }
        }

        // Ordenación (OrderBy)
        let orderByClause: Prisma.UserOrderByWithRelationInput | Prisma.UserOrderByWithRelationInput[];
        if (safeSortBy === 'currentTier.level') {
            orderByClause = { currentTier: { level: safeSortDir } };
        } else {
            orderByClause = { [safeSortBy]: safeSortDir };
        }

        const selectClause = customerListItemSelector;
        // Log de cláusulas finales (útil para debug)
        console.log('[ADM_CUST_LIST_SVC] getCustomersForBusiness - Final Clauses:', { where: whereClause, orderBy: orderByClause });

        // Ejecutar Consultas (COUNT y FINDMANY) en transacción
        const [totalItems, customers] = await prisma.$transaction([
            prisma.user.count({ where: whereClause }),
            prisma.user.findMany({
                where: whereClause,
                select: selectClause,
                orderBy: orderByClause,
                skip: skip,
                take: limit,
            })
        ]);

        console.log(`[ADM_CUST_LIST_SVC] getCustomersForBusiness - Found ${customers.length} customers on page ${page}. Total items matching filters: ${totalItems}`);
        const totalPages = Math.ceil(totalItems / limit);
        console.log(`[ADM_CUST_LIST_SVC] getCustomersForBusiness - Calculation done. Total pages: ${totalPages}`);

        return { items: customers, totalPages: totalPages, currentPage: page, totalItems: totalItems };

    } catch (error) {
        console.error(`[ADM_CUST_LIST_SVC] *** ERROR in getCustomersForBusiness for business ${businessId}:`, error);
        console.error(`[ADM_CUST_LIST_SVC] Options causing error:`, options);
        throw new Error('Error al obtener la lista de clientes desde la base de datos.');
    }
};

// End of File: backend/src/admin/admin-customer-list.service.ts