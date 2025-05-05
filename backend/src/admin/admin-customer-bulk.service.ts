// filename: backend/src/admin/admin-customer-bulk.service.ts
// Version: 1.1.0 (Add individual ActivityLog creation after bulk points adjustment)

import {
    PrismaClient, Prisma, UserRole,
    ActivityType // <-- Importar ActivityType
} from '@prisma/client';

const prisma = new PrismaClient();

// Tipos (sin cambios)
interface BatchPayload { count: number; }

// bulkUpdateStatusForCustomers (sin cambios)
export const bulkUpdateStatusForCustomers = async ( customerIds: string[], adminBusinessId: string, isActive: boolean ): Promise<BatchPayload> => {
    const action = isActive ? 'Activating' : 'Deactivating';
    console.log(`[ADM_CUST_BULK_SVC] ${action} ${customerIds.length} customers for business ${adminBusinessId}`);
    try {
        const result = await prisma.user.updateMany({
            where: { id: { in: customerIds, }, businessId: adminBusinessId, role: UserRole.CUSTOMER_FINAL },
            data: { isActive: isActive },
        });
        console.log(`[ADM_CUST_BULK_SVC] Bulk status update successful. ${result.count} customers updated to isActive=${isActive}.`);
        return result;
    } catch (error) {
        console.error(`[ADM_CUST_BULK_SVC] Error during bulk status update for customers [${customerIds.join(', ')}] of business ${adminBusinessId}:`, error);
        if (error instanceof Prisma.PrismaClientKnownRequestError) {
            throw new Error(`Error de base de datos durante la actualización masiva: ${error.message}`);
        }
        throw new Error('Error inesperado durante la actualización masiva de estado.');
    }
};

// bulkDeleteCustomers (sin cambios)
export const bulkDeleteCustomers = async ( customerIds: string[], adminBusinessId: string ): Promise<BatchPayload> => {
    console.log(`[ADM_CUST_BULK_SVC] Deleting ${customerIds.length} customers for business ${adminBusinessId}`);
    try {
        const result = await prisma.user.deleteMany({
            where: { id: { in: customerIds, }, businessId: adminBusinessId, role: UserRole.CUSTOMER_FINAL },
        });
        console.log(`[ADM_CUST_BULK_SVC] Bulk delete successful. ${result.count} customers deleted.`);
        return result;
    } catch (error) {
        console.error(`[ADM_CUST_BULK_SVC] Error during bulk delete for customers [${customerIds.join(', ')}] of business ${adminBusinessId}:`, error);
        if (error instanceof Prisma.PrismaClientKnownRequestError) {
            if (error.code === 'P2003') {
                 throw new Error(`No se pudieron eliminar todos los clientes porque tienen datos asociados (registros de puntos, regalos, etc.). Código: ${error.code}`);
            }
            throw new Error(`Error de base de datos durante el borrado masivo: ${error.message} (Código: ${error.code})`);
        }
        throw new Error('Error inesperado durante el borrado masivo de clientes.');
    }
};


// --- bulkAdjustPointsForCustomers MODIFICADO ---
/**
 * Ajusta (incrementa/decrementa) los puntos para múltiples clientes de un negocio
 * y crea entradas individuales en ActivityLog para cada cliente afectado.
 */
export const bulkAdjustPointsForCustomers = async (
    customerIds: string[],
    adminBusinessId: string,
    amount: number,
    reason: string | null
): Promise<BatchPayload> => { // Devuelve el resultado del updateMany original
    const action = amount > 0 ? 'Adding' : 'Subtracting';
    console.log(`[ADM_CUST_BULK_SVC] ${action} ${Math.abs(amount)} points for ${customerIds.length} customers. Business: ${adminBusinessId}. Reason: ${reason || 'N/A'}`);

    if (amount === 0) {
        console.warn(`[ADM_CUST_BULK_SVC] Attempted bulk adjust points with amount 0. No action taken.`);
        return { count: 0 };
    }

    // 1. Construir la cláusula WHERE (reutilizable)
    const whereClause: Prisma.UserWhereInput = {
        id: { in: customerIds },
        businessId: adminBusinessId,
        role: UserRole.CUSTOMER_FINAL
    };

    let updateResult: BatchPayload;

    try {
        // 2. Ejecutar la actualización masiva de puntos
        updateResult = await prisma.user.updateMany({
            where: whereClause,
            data: {
                points: { increment: amount }
            },
        });
        console.log(`[ADM_CUST_BULK_SVC] Bulk points update successful. ${updateResult.count} customers updated.`);

    } catch (error) {
        // Si falla la actualización principal, lanzar el error
        console.error(`[ADM_CUST_BULK_SVC] Error during bulk points update for customers [${customerIds.join(', ')}] of business ${adminBusinessId}:`, error);
        if (error instanceof Prisma.PrismaClientKnownRequestError) {
             throw new Error(`Error de base de datos durante el ajuste masivo de puntos: ${error.message}`);
        }
        throw new Error('Error inesperado durante el ajuste masivo de puntos.');
    }

    // 3. Si la actualización fue exitosa y afectó a alguien, intentar crear logs
    if (updateResult.count > 0) {
        try {
            // 3.1 Obtener los IDs de los usuarios que REALMENTE fueron actualizados
            // (Podría ser un subconjunto de customerIds si algunos no cumplían el WHERE)
            // Reutilizamos la whereClause, seleccionando solo el ID.
            const affectedUsers = await prisma.user.findMany({
                where: whereClause, // Mismos criterios que el updateMany
                select: { id: true }
            });

            console.log(`[ADM_CUST_BULK_SVC] Found ${affectedUsers.length} affected user IDs to log.`);

            // 3.2 Crear datos para los logs (preparar array)
            const logsToCreate: Prisma.ActivityLogCreateManyInput[] = affectedUsers.map(user => ({
                userId: user.id,
                businessId: adminBusinessId,
                type: ActivityType.POINTS_ADJUSTED_ADMIN,
                pointsChanged: amount,
                description: reason || `Ajuste masivo (${amount > 0 ? '+' : ''}${amount})`, // Descripción para bulk
                // No hay IDs relacionados
            }));

            // 3.3 Crear los logs usando createMany (más eficiente que un bucle con create)
            if (logsToCreate.length > 0) {
                const logResult = await prisma.activityLog.createMany({
                    data: logsToCreate,
                    skipDuplicates: true, // Por si acaso, aunque no debería haber duplicados aquí
                });
                console.log(`[ADM_CUST_BULK_SVC] Successfully created ${logResult.count} activity logs for bulk adjustment.`);
            }

        } catch (logError) {
            // Si falla la creación de logs, solo lo advertimos, no fallamos la operación completa
            console.error(`[ADM_CUST_BULK_SVC] WARNING: Failed to create some or all activity logs for bulk adjustment for business ${adminBusinessId}. Error:`, logError);
            // Considerar registrar este error de forma más persistente si es crítico
        }
    }

    // 4. Devolver el resultado de la operación principal (updateMany)
    return updateResult;
};
// --- FIN bulkAdjustPointsForCustomers ---

// End of File: backend/src/admin/admin-customer-bulk.service.ts