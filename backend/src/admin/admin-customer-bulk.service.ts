// filename: backend/src/admin/admin-customer-bulk.service.ts
// Version: 1.0.0 (Extracted bulk customer actions from admin-customer.service.ts)

import { PrismaClient, Prisma, UserRole } from '@prisma/client';

const prisma = new PrismaClient();

// --- Tipos (Copiados del original, necesarios para estas funciones) ---
interface BatchPayload { count: number; }
// --- Fin Tipos ---


/**
 * Actualiza el estado 'isActive' para múltiples clientes de un negocio específico.
 */
export const bulkUpdateStatusForCustomers = async ( customerIds: string[], adminBusinessId: string, isActive: boolean ): Promise<BatchPayload> => {
    const action = isActive ? 'Activating' : 'Deactivating';
    console.log(`[ADM_CUST_BULK_SVC] ${action} ${customerIds.length} customers for business ${adminBusinessId}`);
    try {
        const result = await prisma.user.updateMany({
            where: {
                id: { in: customerIds, },
                businessId: adminBusinessId,
                role: UserRole.CUSTOMER_FINAL
            },
            data: { isActive: isActive },
        });
        console.log(`[ADM_CUST_BULK_SVC] Bulk status update successful. ${result.count} customers updated to isActive=${isActive}.`);
        return result;
    } catch (error) {
        console.error(`[ADM_CUST_BULK_SVC] Error during bulk status update for customers [${customerIds.join(', ')}] of business ${adminBusinessId}:`, error);
        if (error instanceof Prisma.PrismaClientKnownRequestError) {
            // Podrían ocurrir otros errores, pero el más probable es un error genérico de DB
            throw new Error(`Error de base de datos durante la actualización masiva: ${error.message}`);
        }
        throw new Error('Error inesperado durante la actualización masiva de estado.');
    }
};

/**
 * Elimina múltiples clientes de un negocio específico.
 */
export const bulkDeleteCustomers = async ( customerIds: string[], adminBusinessId: string ): Promise<BatchPayload> => {
    console.log(`[ADM_CUST_BULK_SVC] Deleting ${customerIds.length} customers for business ${adminBusinessId}`);
    try {
        const result = await prisma.user.deleteMany({
            where: {
                id: { in: customerIds, },
                businessId: adminBusinessId,
                role: UserRole.CUSTOMER_FINAL
            },
        });
        console.log(`[ADM_CUST_BULK_SVC] Bulk delete successful. ${result.count} customers deleted.`);
        return result;
    } catch (error) {
        console.error(`[ADM_CUST_BULK_SVC] Error during bulk delete for customers [${customerIds.join(', ')}] of business ${adminBusinessId}:`, error);
        if (error instanceof Prisma.PrismaClientKnownRequestError) {
             // Error de restricción de clave externa (ej: si el usuario tiene QRCodes, GrantedRewards, etc.)
            if (error.code === 'P2003') {
                 throw new Error(`No se pudieron eliminar todos los clientes porque tienen datos asociados (registros de puntos, regalos, etc.). Código: ${error.code}`);
            }
            throw new Error(`Error de base de datos durante el borrado masivo: ${error.message} (Código: ${error.code})`);
        }
        throw new Error('Error inesperado durante el borrado masivo de clientes.');
    }
};

/**
 * Ajusta (incrementa/decrementa) los puntos para múltiples clientes de un negocio.
 */
export const bulkAdjustPointsForCustomers = async ( customerIds: string[], adminBusinessId: string, amount: number, reason: string | null ): Promise<BatchPayload> => {
    const action = amount > 0 ? 'Adding' : 'Subtracting';
    console.log(`[ADM_CUST_BULK_SVC] ${action} ${Math.abs(amount)} points for ${customerIds.length} customers. Business: ${adminBusinessId}. Reason: ${reason || 'N/A'}`);
    // Validación básica (aunque el controlador también debería validar)
    if (amount === 0) {
        // Devolver un resultado 'noop' en lugar de lanzar error podría ser una opción
        console.warn(`[ADM_CUST_BULK_SVC] Attempted bulk adjust points with amount 0. No action taken.`);
        return { count: 0 };
        // O lanzar error si se prefiere: throw new Error("La cantidad para el ajuste masivo no puede ser cero.");
    }
    try {
        const result = await prisma.user.updateMany({
            where: {
                id: { in: customerIds, },
                businessId: adminBusinessId,
                role: UserRole.CUSTOMER_FINAL
            },
            data: {
                points: { increment: amount, }
            },
        });
        console.log(`[ADM_CUST_BULK_SVC] Bulk points adjustment successful. ${result.count} customers updated.`);
        return result;
    } catch (error) {
        console.error(`[ADM_CUST_BULK_SVC] Error during bulk points adjustment for customers [${customerIds.join(', ')}] of business ${adminBusinessId}:`, error);
        if (error instanceof Prisma.PrismaClientKnownRequestError) {
             throw new Error(`Error de base de datos durante el ajuste masivo de puntos: ${error.message}`);
        }
        throw new Error('Error inesperado durante el ajuste masivo de puntos.');
    }
};

// End of File: backend/src/admin/admin-customer-bulk.service.ts