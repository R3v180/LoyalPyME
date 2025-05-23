// filename: backend/src/admin/admin-customer-individual.service.ts
// Version: 1.2.0 (Use i18n reward fields name_es/name_en)

import {
    PrismaClient, Prisma, UserRole, User, GrantedReward,
    ActivityType, Reward // <-- Reward debe estar aquí aunque usemos Pick
} from '@prisma/client';
const prisma = new PrismaClient();

// Tipos y Selectores (sin cambios)
const customerDetailsSelector = Prisma.validator<Prisma.UserSelect>()({ id: true, email: true, name: true, points: true, createdAt: true, isActive: true, isFavorite: true, tierAchievedAt: true, adminNotes: true, businessId: true, role: true, currentTier: { select: { id: true, name: true, level: true, description: true } } });
export type CustomerDetails = Prisma.UserGetPayload<{ select: typeof customerDetailsSelector }>;
type FavoriteStatusUpdate = Pick<User, 'id' | 'email' | 'isFavorite'>;
type ActiveStatusUpdate = Pick<User, 'id' | 'email' | 'isActive'>;
type NotesUpdate = Pick<User, 'id' | 'email' | 'adminNotes'>;

// getCustomerDetailsById (sin cambios)
export const getCustomerDetailsById = async (customerId: string, adminBusinessId: string): Promise<CustomerDetails | null> => {
     console.log(`[ADM_CUST_IND_SVC] Getting details for customer ${customerId} by admin from business ${adminBusinessId}`); try { const customerDetails = await prisma.user.findUnique({ where: { id: customerId, businessId: adminBusinessId, role: UserRole.CUSTOMER_FINAL }, select: customerDetailsSelector }); if (!customerDetails) { throw new Error(`Cliente con ID ${customerId} no encontrado o no pertenece a tu negocio.`); } console.log(`[ADM_CUST_IND_SVC] Details found for customer ${customerId}`); return customerDetails; } catch (error) { console.error(`[ADM_CUST_IND_SVC] Error getting details for customer ${customerId}:`, error); if (error instanceof Prisma.PrismaClientKnownRequestError) { throw new Error(`Error de base de datos al obtener detalles del cliente: ${error.message}`); } if (error instanceof Error) { throw error; } throw new Error('Error inesperado al obtener los detalles del cliente.'); }
};

// updateAdminNotesForCustomer (sin cambios)
export const updateAdminNotesForCustomer = async ( customerId: string, adminBusinessId: string, notes: string | null ): Promise<NotesUpdate> => {
     console.log(`[ADM_CUST_IND_SVC] Updating admin notes for customer ${customerId} by admin from business ${adminBusinessId}`); try { const updatedUser = await prisma.$transaction(async (tx) => { const customer = await tx.user.findUnique({ where: { id: customerId, businessId: adminBusinessId }, select: { id: true, email: true } }); if (!customer) { throw new Error(`Cliente con ID ${customerId} no encontrado o no pertenece a tu negocio.`); } const userAfterUpdate = await tx.user.update({ where: { id: customerId }, data: { adminNotes: notes }, select: { id: true, email: true, adminNotes: true } }); console.log(`[ADM_CUST_IND_SVC] Admin notes updated successfully for customer ${customer.email} (${customerId})`); return userAfterUpdate; }); return updatedUser; } catch (error) { console.error(`[ADM_CUST_IND_SVC] Error updating admin notes for customer ${customerId}:`, error); if (error instanceof Prisma.PrismaClientKnownRequestError) { if (error.code === 'P2025') { throw new Error(`No se encontró el cliente especificado al intentar actualizar las notas.`); } throw new Error(`Error de base de datos al actualizar las notas: ${error.message}`); } if (error instanceof Error) { throw error; } throw new Error('Error inesperado al actualizar las notas del administrador.'); }
};

// adjustPointsForCustomer (sin cambios respecto a versión anterior)
export const adjustPointsForCustomer = async ( customerId: string, adminBusinessId: string, amount: number, reason?: string | null ): Promise<User> => {
     console.log(`[ADM_CUST_IND_SVC] Attempting to adjust points for customer ${customerId} by ${amount}. Reason: ${reason || 'N/A'}. Admin Business: ${adminBusinessId}`); if (amount === 0) { throw new Error("La cantidad de puntos a ajustar no puede ser cero."); } try { const updatedUser = await prisma.$transaction(async (tx) => { const customer = await tx.user.findUnique({ where: { id: customerId }, select: { businessId: true, id: true, email: true } }); if (!customer) { throw new Error(`Cliente con ID ${customerId} no encontrado.`); } if (customer.businessId !== adminBusinessId) { throw new Error("No tienes permiso para modificar este cliente."); } const userAfterUpdate = await tx.user.update({ where: { id: customerId }, data: { points: { increment: amount } } }); console.log(`[ADM_CUST_IND_SVC - TX] Points adjusted successfully for customer ${userAfterUpdate.email} (${customerId}). New balance potentially: ${userAfterUpdate.points}`); await tx.activityLog.create({ data: { userId: customerId, businessId: adminBusinessId, type: ActivityType.POINTS_ADJUSTED_ADMIN, pointsChanged: amount, description: reason || null } }); console.log(`[ADM_CUST_IND_SVC - TX] ActivityLog created for admin points adjustment for user ${customerId}.`); return userAfterUpdate; }); return updatedUser; } catch (error) { console.error(`[ADM_CUST_IND_SVC] Error adjusting points for customer ${customerId}:`, error); if (error instanceof Prisma.PrismaClientKnownRequestError) { if (error.code === 'P2025') { throw new Error(`No se encontró el cliente especificado para actualizar.`); } throw new Error(`Error de base de datos al ajustar puntos: ${error.message}`); } if (error instanceof Error) { throw error; } throw new Error('Error inesperado al ajustar los puntos.'); }
};

// changeCustomerTier (sin cambios)
export const changeCustomerTier = async ( customerId: string, adminBusinessId: string, tierId: string | null ): Promise<User> => {
     console.log(`[ADM_CUST_IND_SVC] Attempting to change tier for customer ${customerId} to tier ${tierId ?? 'NULL'}. Admin Business: ${adminBusinessId}`); try { const updatedUser = await prisma.$transaction(async (tx) => { const customer = await tx.user.findUnique({ where: { id: customerId, businessId: adminBusinessId }, select: { id: true, email: true } }); if (!customer) { throw new Error(`Cliente con ID ${customerId} no encontrado o no pertenece a tu negocio.`); } if (tierId !== null) { const tierExists = await tx.tier.findUnique({ where: { id: tierId, businessId: adminBusinessId }, select: { id: true } }); if (!tierExists) { throw new Error(`El nivel seleccionado (ID: ${tierId}) no es válido o no pertenece a tu negocio.`); } } const userAfterUpdate = await tx.user.update({ where: { id: customerId }, data: { currentTierId: tierId, tierAchievedAt: tierId ? new Date() : null } }); console.log(`[ADM_CUST_IND_SVC] Tier changed successfully for customer ${userAfterUpdate.email} (${customerId}) to ${tierId ?? 'NULL'}`); return userAfterUpdate; }); return updatedUser; } catch (error) { console.error(`[ADM_CUST_IND_SVC] Error changing tier for customer ${customerId} to ${tierId}:`, error); if (error instanceof Prisma.PrismaClientKnownRequestError) { throw new Error(`Error de base de datos al cambiar nivel: ${error.message}`); } if (error instanceof Error) { throw error; } throw new Error('Error inesperado al cambiar el nivel del cliente.'); }
};

// --- assignRewardToCustomer MODIFICADO ---
/**
 * Asigna una recompensa como "regalo" a un cliente.
 */
export const assignRewardToCustomer = async (
    customerId: string,
    adminBusinessId: string,
    rewardId: string,
    adminUserId: string
): Promise<GrantedReward> => {
     console.log(`[ADM_CUST_IND_SVC] Attempting to assign reward ${rewardId} to customer ${customerId} by admin ${adminUserId} from business ${adminBusinessId}`);
     try {
        const grantedReward = await prisma.$transaction(async (tx) => {
            const customer = await tx.user.findUnique({ where: { id: customerId, businessId: adminBusinessId }, select: { id: true, email: true } });
            if (!customer) { throw new Error(`Cliente con ID ${customerId} no encontrado o no pertenece a tu negocio.`); }

            // --- MODIFICADO: Seleccionar name_es y name_en en lugar de name ---
            const reward = await tx.reward.findUnique({
                where: { id: rewardId, businessId: adminBusinessId },
                select: {
                    id: true,
                    isActive: true,
                    name_es: true, // Seleccionar nombre ES
                    name_en: true  // Seleccionar nombre EN
                }
            });
            // --- FIN MODIFICADO ---

            if (!reward) { throw new Error(`Recompensa con ID ${rewardId} no encontrada o no pertenece a tu negocio.`); }
            if (!reward.isActive) {
                // --- MODIFICADO: Usar name_es o name_en en el mensaje de error ---
                const rewardDisplayName = reward.name_es || reward.name_en || `ID ${rewardId}`;
                throw new Error(`La recompensa "${rewardDisplayName}" no está activa y no puede ser asignada.`);
                 // --- FIN MODIFICADO ---
            }

            const newGrantedReward = await tx.grantedReward.create({
                data: { userId: customerId, rewardId: rewardId, businessId: adminBusinessId, assignedById: adminUserId, status: 'PENDING', }
            });

            // --- MODIFICADO: Usar name_es o name_en en el log ---
            const rewardLogName = reward.name_es || reward.name_en || `ID ${rewardId}`;
            console.log(`[ADM_CUST_IND_SVC - TX] Reward ${rewardLogName} (${rewardId}) assigned successfully to customer ${customer.email} (${customerId}). GrantedReward ID: ${newGrantedReward.id}`);
            // --- FIN MODIFICADO ---

            return newGrantedReward;
        });
        return grantedReward;
    } catch (error) {
        console.error(`[ADM_CUST_IND_SVC] Error assigning reward ${rewardId} to customer ${customerId}:`, error);
        // --- MODIFICADO: Usar Prisma.PrismaClientKnownRequestError para chequear error ---
        if (error instanceof Prisma.PrismaClientKnownRequestError) {
            // No necesitamos chequear P2002 aquí específicamente, un error genérico está bien
            throw new Error(`Error de base de datos al asignar recompensa: ${error.message}`);
        }
        // --- FIN MODIFICADO ---
        if (error instanceof Error) { throw error; }
        throw new Error('Error inesperado al asignar la recompensa.');
    }
};
// --- FIN assignRewardToCustomer ---

// toggleFavoriteStatus (sin cambios)
export const toggleFavoriteStatus = async ( customerId: string, adminBusinessId: string ): Promise<FavoriteStatusUpdate> => {
     console.log(`[ADM_CUST_IND_SVC] Attempting to toggle favorite status for customer ${customerId} by admin from business ${adminBusinessId}`); try { const updatedUser = await prisma.$transaction(async (tx) => { const customer = await tx.user.findUnique({ where: { id: customerId, businessId: adminBusinessId }, select: { id: true, isFavorite: true, email: true } }); if (!customer) { throw new Error(`Cliente con ID ${customerId} no encontrado o no pertenece a tu negocio.`); } const newFavoriteStatus = !customer.isFavorite; const userAfterUpdate = await tx.user.update({ where: { id: customerId }, data: { isFavorite: newFavoriteStatus }, select: { id: true, email: true, isFavorite: true } }); console.log(`[ADM_CUST_IND_SVC] Favorite status for customer ${customer.email} (${customerId}) toggled to ${newFavoriteStatus}`); return userAfterUpdate; }); return updatedUser; } catch (error) { console.error(`[ADM_CUST_IND_SVC] Error toggling favorite status for customer ${customerId}:`, error); if (error instanceof Prisma.PrismaClientKnownRequestError) { if (error.code === 'P2025') { throw new Error(`No se encontró el cliente especificado al intentar actualizar.`); } throw new Error(`Error de base de datos al cambiar estado de favorito: ${error.message}`); } if (error instanceof Error) { throw error; } throw new Error('Error inesperado al cambiar el estado de favorito.'); }
};

// toggleActiveStatusForCustomer (sin cambios)
export const toggleActiveStatusForCustomer = async ( customerId: string, adminBusinessId: string ): Promise<ActiveStatusUpdate> => {
     console.log(`[ADM_CUST_IND_SVC] Attempting to toggle active status for customer ${customerId} by admin from business ${adminBusinessId}`); try { const updatedUser = await prisma.$transaction(async (tx) => { const customer = await tx.user.findUnique({ where: { id: customerId, businessId: adminBusinessId }, select: { id: true, isActive: true, email: true } }); if (!customer) { throw new Error(`Cliente con ID ${customerId} no encontrado o no pertenece a tu negocio.`); } const newActiveStatus = !customer.isActive; const userAfterUpdate = await tx.user.update({ where: { id: customerId }, data: { isActive: newActiveStatus }, select: { id: true, email: true, isActive: true } }); console.log(`[ADM_CUST_IND_SVC] Active status for customer ${customer.email} (${customerId}) toggled to ${newActiveStatus}`); return userAfterUpdate; }); return updatedUser; } catch (error) { console.error(`[ADM_CUST_IND_SVC] Error toggling active status for customer ${customerId}:`, error); if (error instanceof Prisma.PrismaClientKnownRequestError) { if (error.code === 'P2025') { throw new Error(`No se encontró el cliente especificado al intentar actualizar.`); } throw new Error(`Error de base de datos al cambiar estado activo: ${error.message}`); } if (error instanceof Error) { throw error; } throw new Error('Error inesperado al cambiar el estado activo del cliente.'); }
};

// End of File: backend/src/admin/admin-customer-individual.service.ts