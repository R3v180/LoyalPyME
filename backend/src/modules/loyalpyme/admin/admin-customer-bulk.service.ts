// filename: backend/src/admin/admin-customer-bulk.service.ts
// Version: 1.1.1 (Store reason or null in ActivityLog description for bulk adjustments)

import {
    PrismaClient, Prisma, UserRole,
    ActivityType // Asegúrate que esté importado
} from '@prisma/client';

const prisma = new PrismaClient();

// Tipos (sin cambios)
interface BatchPayload { count: number; }

// bulkUpdateStatusForCustomers (sin cambios)
export const bulkUpdateStatusForCustomers = async ( customerIds: string[], adminBusinessId: string, isActive: boolean ): Promise<BatchPayload> => {
    const action = isActive ? 'Activating' : 'Deactivating'; console.log(`[ADM_CUST_BULK_SVC] ${action} ${customerIds.length} customers for business ${adminBusinessId}`); try { const result = await prisma.user.updateMany({ where: { id: { in: customerIds, }, businessId: adminBusinessId, role: UserRole.CUSTOMER_FINAL }, data: { isActive: isActive }, }); console.log(`[ADM_CUST_BULK_SVC] Bulk status update successful. ${result.count} customers updated to isActive=${isActive}.`); return result; } catch (error) { console.error(`[ADM_CUST_BULK_SVC] Error during bulk status update for customers [${customerIds.join(', ')}] of business ${adminBusinessId}:`, error); if (error instanceof Prisma.PrismaClientKnownRequestError) { throw new Error(`Error de base de datos durante la actualización masiva: ${error.message}`); } throw new Error('Error inesperado durante la actualización masiva de estado.'); }
};

// bulkDeleteCustomers (sin cambios)
export const bulkDeleteCustomers = async ( customerIds: string[], adminBusinessId: string ): Promise<BatchPayload> => {
    console.log(`[ADM_CUST_BULK_SVC] Deleting ${customerIds.length} customers for business ${adminBusinessId}`); try { const result = await prisma.user.deleteMany({ where: { id: { in: customerIds, }, businessId: adminBusinessId, role: UserRole.CUSTOMER_FINAL }, }); console.log(`[ADM_CUST_BULK_SVC] Bulk delete successful. ${result.count} customers deleted.`); return result; } catch (error) { console.error(`[ADM_CUST_BULK_SVC] Error during bulk delete for customers [${customerIds.join(', ')}] of business ${adminBusinessId}:`, error); if (error instanceof Prisma.PrismaClientKnownRequestError) { if (error.code === 'P2003') { throw new Error(`No se pudieron eliminar todos los clientes porque tienen datos asociados (registros de puntos, regalos, etc.). Código: ${error.code}`); } throw new Error(`Error de base de datos durante el borrado masivo: ${error.message} (Código: ${error.code})`); } throw new Error('Error inesperado durante el borrado masivo de clientes.'); }
};


// --- bulkAdjustPointsForCustomers MODIFICADO ---
/**
 * Ajusta puntos masivamente y crea logs individuales guardando la razón (o null).
 */
export const bulkAdjustPointsForCustomers = async (
    customerIds: string[],
    adminBusinessId: string,
    amount: number,
    reason: string | null // La razón viene como argumento
): Promise<BatchPayload> => {
    const action = amount > 0 ? 'Adding' : 'Subtracting';
    console.log(`[ADM_CUST_BULK_SVC] ${action} ${Math.abs(amount)} points for ${customerIds.length} customers. Business: ${adminBusinessId}. Reason: ${reason || 'N/A'}`);

    if (amount === 0) { console.warn(`[ADM_CUST_BULK_SVC] Attempted bulk adjust points with amount 0. No action taken.`); return { count: 0 }; }

    const whereClause: Prisma.UserWhereInput = { id: { in: customerIds }, businessId: adminBusinessId, role: UserRole.CUSTOMER_FINAL };
    let updateResult: BatchPayload;

    try {
        // 1. Ejecutar la actualización masiva
        updateResult = await prisma.user.updateMany({ where: whereClause, data: { points: { increment: amount } }, });
        console.log(`[ADM_CUST_BULK_SVC] Bulk points update successful. ${updateResult.count} customers updated.`);
    } catch (error) {
        console.error(`[ADM_CUST_BULK_SVC] Error during bulk points update for customers [${customerIds.join(', ')}] of business ${adminBusinessId}:`, error); if (error instanceof Prisma.PrismaClientKnownRequestError) { throw new Error(`Error de base de datos durante el ajuste masivo de puntos: ${error.message}`); } throw new Error('Error inesperado durante el ajuste masivo de puntos.');
    }

    // 2. Si se actualizó algo, intentar crear logs
    if (updateResult.count > 0) {
        try {
            // 2.1 Obtener IDs afectados
            const affectedUsers = await prisma.user.findMany({ where: whereClause, select: { id: true } });
            console.log(`[ADM_CUST_BULK_SVC] Found ${affectedUsers.length} affected user IDs to log.`);

            // 2.2 Crear datos para los logs (MODIFICACIÓN en description)
            const logsToCreate: Prisma.ActivityLogCreateManyInput[] = affectedUsers.map(user => ({
                userId: user.id,
                businessId: adminBusinessId,
                type: ActivityType.POINTS_ADJUSTED_ADMIN,
                pointsChanged: amount,
                description: reason || null, // <-- GUARDA LA RAZÓN O NULL
                // No hay IDs relacionados
            }));

            // 2.3 Crear los logs
            if (logsToCreate.length > 0) {
                const logResult = await prisma.activityLog.createMany({ data: logsToCreate, skipDuplicates: true, });
                console.log(`[ADM_CUST_BULK_SVC] Successfully created ${logResult.count} activity logs for bulk adjustment.`);
            }
        } catch (logError) {
            console.error(`[ADM_CUST_BULK_SVC] WARNING: Failed to create some or all activity logs for bulk adjustment for business ${adminBusinessId}. Error:`, logError);
        }
    }

    // 3. Devolver resultado del updateMany
    return updateResult;
};
// --- FIN bulkAdjustPointsForCustomers ---

// End of File: backend/src/admin/admin-customer-bulk.service.ts