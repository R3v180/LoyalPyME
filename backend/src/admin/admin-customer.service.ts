// filename: backend/src/admin/admin-customer.service.ts
// Contiene la lÃ³gica para las operaciones de administrador sobre clientes

import { PrismaClient, Prisma, UserRole, User, GrantedReward } from '@prisma/client';

const prisma = new PrismaClient();

// --- Interfaz para opciones de getCustomersForBusiness (Movida aquÃ­) ---
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

/**
 * Obtiene una lista paginada, filtrada y ordenada de clientes para un negocio especÃ­fico.
 * (FunciÃ³n 2 del customer.service original)
 */
export const getCustomersForBusiness = async ( businessId: string, options: GetCustomersOptions = {} ) => {
    const { page = 1, limit = 10, sortBy = 'createdAt', sortDir = 'desc', filters = {} } = options;
    console.log(`[ADM_CUST_SVC] Fetching customers for business ID: ${businessId}, Page: ${page}, Limit: ${limit}, SortBy: ${sortBy}, SortDir: ${sortDir}, Filters:`, filters);

    // Validar campos de ordenaciÃ³n permitidos
    const allowedSortByFields = ['name', 'email', 'points', 'createdAt', 'isActive', 'isFavorite', 'currentTier.level'];
    const safeSortBy = allowedSortByFields.includes(sortBy) ? sortBy : 'createdAt';
    const safeSortDir = sortDir === 'asc' ? 'asc' : 'desc';
    const skip = (page - 1) * limit;

    try {
        // Construir clÃ¡usula Where
        const whereClause: Prisma.UserWhereInput = {
            businessId: businessId,
            role: UserRole.CUSTOMER_FINAL // Asegurar que solo obtenemos clientes finales
        };
        if (filters.isFavorite !== undefined) { whereClause.isFavorite = filters.isFavorite; }
        if (filters.isActive !== undefined) { whereClause.isActive = filters.isActive; }
        if (filters.search && filters.search.trim() !== '') {
            const searchTerm = filters.search.trim();
            // Buscar en nombre O email (insensible a mayÃºsculas/minÃºsculas)
            whereClause.OR = [
                { name: { contains: searchTerm, mode: 'insensitive' } },
                { email: { contains: searchTerm, mode: 'insensitive' } }
            ];
        }

        // Construir clÃ¡usula OrderBy
        let orderByClause: Prisma.UserOrderByWithRelationInput | Prisma.UserOrderByWithRelationInput[];
        if (safeSortBy === 'currentTier.level') {
            orderByClause = { currentTier: { level: safeSortDir } };
        } else {
            orderByClause = { [safeSortBy]: safeSortDir };
        }

        // Definir campos a seleccionar (para evitar enviar datos sensibles como password)
        const selectClause = {
            id: true, name: true, email: true, points: true, createdAt: true, isActive: true, isFavorite: true,
            currentTier: { select: { name: true, id: true, level: true } } // Incluir info relevante del Tier
        };

        // Ejecutar consulta paginada y conteo total en una transacciÃ³n
        const [customers, totalItems] = await prisma.$transaction([
            prisma.user.findMany({
                where: whereClause,
                select: selectClause,
                orderBy: orderByClause,
                skip: skip,
                take: limit,
            }),
            prisma.user.count({
                where: whereClause,
            })
        ]);

        const totalPages = Math.ceil(totalItems / limit);
        console.log(`[ADM_CUST_SVC] Found ${customers.length} customers on page ${page}/${totalPages} (Total items: ${totalItems}) for business ${businessId} with applied filters.`);

        // Devolver resultado estructurado para paginaciÃ³n
        return {
            items: customers,
            totalPages: totalPages,
            currentPage: page,
            totalItems: totalItems
        };
    } catch (error) {
        console.error(`[ADM_CUST_SVC] Error fetching customers for business ${businessId} with options:`, options, error);
        // Considerar un log mÃ¡s detallado si es necesario
        throw new Error('Error al obtener la lista de clientes desde la base de datos.');
    }
};

/**
 * Ajusta los puntos de un cliente especÃ­fico (aÃ±ade o resta).
 * Verifica que el admin pertenezca al mismo negocio que el cliente.
 * (FunciÃ³n 3 del customer.service original)
 */
export const adjustPointsForCustomer = async ( customerId: string, adminBusinessId: string, amount: number, reason?: string | null ): Promise<User> => {
    console.log(`[ADM_CUST_SVC] Attempting to adjust points for customer ${customerId} by ${amount}. Reason: ${reason || 'N/A'}. Admin Business: ${adminBusinessId}`);
    if (amount === 0) { throw new Error("La cantidad de puntos a ajustar no puede ser cero."); }

    try {
        // Usar transacciÃ³n para asegurar que el cliente existe y pertenece al negocio antes de actualizar
        const updatedUser = await prisma.$transaction(async (tx) => {
            // 1. Buscar cliente y verificar pertenencia
            const customer = await tx.user.findUnique({
                where: { id: customerId },
                select: { businessId: true, id: true, email: true } // Seleccionar email para logs/mensajes
            });

            if (!customer) {
                throw new Error(`Cliente con ID ${customerId} no encontrado.`);
            }
            if (customer.businessId !== adminBusinessId) {
                // Este error indica un intento de operaciÃ³n no autorizada
                console.warn(`[ADM_CUST_SVC] Unauthorized attempt by admin from ${adminBusinessId} to modify customer ${customerId} of business ${customer.businessId}`);
                throw new Error("No tienes permiso para modificar este cliente.");
            }

            // 2. Actualizar puntos si la verificaciÃ³n es exitosa
            const userAfterUpdate = await tx.user.update({
                where: { id: customerId }, // Ya sabemos que existe y pertenece
                data: {
                    points: { increment: amount }
                    // PodrÃ­amos querer actualizar lastActivityAt aquÃ­ tambiÃ©n?
                },
                // Devolver el usuario actualizado completo (o campos seleccionados)
                // select: { id: true, points: true, email: true }
            });
            console.log(`[ADM_CUST_SVC] Points adjusted successfully for customer ${userAfterUpdate.email} (${customerId}). New balance potentially: ${userAfterUpdate.points}`);
            return userAfterUpdate; // Devolver el usuario actualizado desde la transacciÃ³n
        });
        return updatedUser; // Devolver el resultado de la transacciÃ³n

    } catch (error) {
        console.error(`[ADM_CUST_SVC] Error adjusting points for customer ${customerId}:`, error);
        if (error instanceof Prisma.PrismaClientKnownRequestError) {
            // P2025 podrÃ­a ocurrir si el cliente se elimina justo antes de update (aunque findUnique lo prevendrÃ­a)
            if (error.code === 'P2025') { throw new Error(`No se encontrÃ³ el cliente especificado para actualizar.`); }
            throw new Error(`Error de base de datos al ajustar puntos: ${error.message}`);
        }
        if (error instanceof Error) { // Relanzar errores de validaciÃ³n (ej: amount 0, no encontrado, permiso)
            throw error;
        }
        throw new Error('Error inesperado al ajustar los puntos.');
    }
};

/**
 * Cambia manualmente el nivel (Tier) de un cliente.
 * Verifica que el admin y el tier pertenezcan al mismo negocio que el cliente.
 * (FunciÃ³n 4 del customer.service original)
 */
export const changeCustomerTier = async ( customerId: string, adminBusinessId: string, newTierId: string | null ): Promise<User> => {
    console.log(`[ADM_CUST_SVC] Attempting to change tier for customer ${customerId} to tier ${newTierId ?? 'NULL'}. Admin Business: ${adminBusinessId}`);

    try {
        const updatedUser = await prisma.$transaction(async (tx) => {
            // 1. Verificar cliente y pertenencia
            const customer = await tx.user.findUnique({
                where: { id: customerId, businessId: adminBusinessId }, // Se puede verificar businessId directamente
                select: { id: true, email: true }
            });
            if (!customer) {
                throw new Error(`Cliente con ID ${customerId} no encontrado o no pertenece a tu negocio.`);
            }

            // 2. Verificar si el Tier seleccionado (si no es null) existe Y pertenece al mismo negocio
            if (newTierId !== null) {
                const tierExists = await tx.tier.findUnique({
                    where: { id: newTierId, businessId: adminBusinessId }, // Importante verificar businessId tambiÃ©n aquÃ­
                    select: { id: true }
                });
                if (!tierExists) {
                    throw new Error(`El nivel seleccionado (ID: ${newTierId}) no es vÃ¡lido o no pertenece a tu negocio.`);
                }
            }

            // 3. Actualizar el Tier del usuario
            const userAfterUpdate = await tx.user.update({
                where: { id: customerId },
                data: {
                    currentTierId: newTierId,
                    // Actualizar la fecha de consecuciÃ³n solo si se asigna un nivel
                    tierAchievedAt: newTierId ? new Date() : null
                }
            });
            console.log(`[ADM_CUST_SVC] Tier changed successfully for customer ${userAfterUpdate.email} (${customerId}) to ${newTierId ?? 'NULL'}`);
            return userAfterUpdate;
        });
        return updatedUser;

    } catch (error) {
        console.error(`[ADM_CUST_SVC] Error changing tier for customer ${customerId} to ${newTierId}:`, error);
         if (error instanceof Prisma.PrismaClientKnownRequestError) {
            // PodrÃ­a haber un error P2003 si el tierId no existe (FK constraint), aunque lo validamos antes.
            throw new Error(`Error de base de datos al cambiar nivel: ${error.message}`);
         }
         if (error instanceof Error) { // Relanzar errores de validaciÃ³n
             throw error;
         }
         throw new Error('Error inesperado al cambiar el nivel del cliente.');
    }
};

/**
 * Asigna una recompensa como "regalo" a un cliente (sin coste de puntos).
 * Verifica que admin, cliente y recompensa pertenezcan al mismo negocio.
 * (FunciÃ³n 5 del customer.service original)
 */
export const assignRewardToCustomer = async ( customerId: string, adminBusinessId: string, rewardId: string, adminUserId: string ): Promise<GrantedReward> => {
    console.log(`[ADM_CUST_SVC] Attempting to assign reward ${rewardId} to customer ${customerId} by admin ${adminUserId} from business ${adminBusinessId}`);
    try {
        // Usar transacciÃ³n para asegurar consistencia y verificar pertenencia
        const grantedReward = await prisma.$transaction(async (tx) => {
            // 1. Verificar cliente y pertenencia
            const customer = await tx.user.findUnique({
                where: { id: customerId, businessId: adminBusinessId }, // Verificar businessId aquÃ­
                select: { id: true, email: true }
            });
            if (!customer) {
                throw new Error(`Cliente con ID ${customerId} no encontrado o no pertenece a tu negocio.`);
            }

            // 2. Verificar recompensa, pertenencia y estado activo
            const reward = await tx.reward.findUnique({
                where: { id: rewardId, businessId: adminBusinessId }, // Verificar businessId tambiÃ©n aquÃ­
                select: { id: true, isActive: true, name: true } // Seleccionar nombre para mensajes
            });
            if (!reward) {
                throw new Error(`Recompensa con ID ${rewardId} no encontrada o no pertenece a tu negocio.`);
            }
            if (!reward.isActive) {
                throw new Error(`La recompensa "${reward.name}" (${rewardId}) no estÃ¡ activa y no puede ser asignada.`);
            }

            // 3. Crear el registro GrantedReward
            const newGrantedReward = await tx.grantedReward.create({
                data: {
                    userId: customerId,
                    rewardId: rewardId,
                    businessId: adminBusinessId, // Asegurar que se guarda el ID del negocio
                    assignedById: adminUserId, // QuiÃ©n lo asignÃ³
                    status: 'PENDING', // Estado inicial
                    // assignedAt se establece por defecto
                }
            });
            console.log(`[ADM_CUST_SVC] Reward ${reward.name} (${rewardId}) assigned successfully to customer ${customer.email} (${customerId}). GrantedReward ID: ${newGrantedReward.id}`);
            return newGrantedReward;
        });
        return grantedReward;

    } catch (error) {
        console.error(`[ADM_CUST_SVC] Error assigning reward ${rewardId} to customer ${customerId}:`, error);
        if (error instanceof Prisma.PrismaClientKnownRequestError) {
            // P2003 podrÃ­a ocurrir si rewardId o userId no existen (FK constraint), aunque se validan antes.
             throw new Error(`Error de base de datos al asignar recompensa: ${error.message}`);
        }
        if (error instanceof Error) { // Relanzar errores de validaciÃ³n
            throw error;
        }
        throw new Error('Error inesperado al asignar la recompensa.');
    }
};

/**
 * Cambia el estado de favorito de un cliente.
 * Verifica que el admin pertenezca al mismo negocio que el cliente.
 * (FunciÃ³n 8 del customer.service original)
 */
export const toggleFavoriteStatus = async ( customerId: string, adminBusinessId: string ): Promise<User> => {
    console.log(`[ADM_CUST_SVC] Attempting to toggle favorite status for customer ${customerId} by admin from business ${adminBusinessId}`);
    try {
        // Usar transacciÃ³n para verificar pertenencia antes de actualizar
        const updatedUser = await prisma.$transaction(async (tx) => {
            // 1. Buscar cliente y verificar pertenencia, obtener estado actual
            const customer = await tx.user.findUnique({
                where: { id: customerId, businessId: adminBusinessId }, // Verificar businessId
                select: { id: true, isFavorite: true, email: true }
            });
            if (!customer) {
                throw new Error(`Cliente con ID ${customerId} no encontrado o no pertenece a tu negocio.`);
            }

            // 2. Calcular nuevo estado y actualizar
            const newFavoriteStatus = !customer.isFavorite;
            const userAfterUpdate = await tx.user.update({
                where: { id: customerId },
                data: { isFavorite: newFavoriteStatus },
                // Devolver datos Ãºtiles para la respuesta del controlador
                select: { id: true, email: true, isFavorite: true }
            });
            console.log(`[ADM_CUST_SVC] Favorite status for customer ${customer.email} (${customerId}) toggled to ${newFavoriteStatus}`);
            return userAfterUpdate;
        });
        // El tipo devuelto por la transacciÃ³n coincide con Pick<User, ...>, necesita cast si se espera User completo
        // O ajustar el select final si se necesita mÃ¡s info. Por ahora, devolvemos lo seleccionado.
        // Consideramos que la info devuelta es suficiente para el controlador actual.
        // @ts-ignore - Permitir devolver el tipo parcial si es necesario, aunque el tipo Promise<User> espera User completo.
        // O mejor, cambiamos el tipo de retorno a Pick<User, 'id' | 'email' | 'isFavorite'>
        return updatedUser as unknown as User; // Hacer un cast mÃ¡s explÃ­cito pero inseguro, o ajustar tipo de retorno

    } catch (error) {
        console.error(`[ADM_CUST_SVC] Error toggling favorite status for customer ${customerId}:`, error);
        if (error instanceof Prisma.PrismaClientKnownRequestError) {
             if (error.code === 'P2025') { throw new Error(`No se encontrÃ³ el cliente especificado al intentar actualizar.`); }
             throw new Error(`Error de base de datos al cambiar estado de favorito: ${error.message}`);
         }
        if (error instanceof Error) { // Relanzar errores de validaciÃ³n
            throw error;
        }
        throw new Error('Error inesperado al cambiar el estado de favorito.');
    }
};


// End of File: backend/src/admin/admin-customer.service.ts