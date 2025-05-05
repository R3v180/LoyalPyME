// filename: backend/src/activity/activity.service.ts
import { PrismaClient, ActivityLog, Prisma } from '@prisma/client';

const prisma = new PrismaClient();

// Tipo para la respuesta paginada
export interface PaginatedActivityLog {
    logs: Pick<ActivityLog, 'id' | 'type' | 'pointsChanged' | 'description' | 'createdAt'>[]; // Devolvemos solo campos necesarios
    totalPages: number;
    currentPage: number;
    totalItems: number;
}

/**
 * Obtiene el historial de actividad paginado para un usuario específico.
 * @param userId ID del usuario.
 * @param page Número de página solicitada.
 * @param limit Número de items por página.
 * @returns Objeto con los logs paginados y metadatos de paginación.
 */
export const getCustomerActivityLog = async (
    userId: string,
    page: number,
    limit: number
): Promise<PaginatedActivityLog> => {
    console.log(`[Activity SVC] Fetching activity log for user ${userId}, Page: ${page}, Limit: ${limit}`);

    const skip = (page - 1) * limit;

    try {
        // Usar transacción para obtener count y logs en una sola llamada a DB
        const [totalItems, logs] = await prisma.$transaction([
            prisma.activityLog.count({
                where: { userId: userId },
            }),
            prisma.activityLog.findMany({
                where: { userId: userId },
                select: { // Seleccionar solo los campos que necesita el frontend
                    id: true,
                    type: true,
                    pointsChanged: true,
                    description: true,
                    createdAt: true,
                },
                orderBy: {
                    createdAt: 'desc', // Más recientes primero
                },
                skip: skip,
                take: limit,
            }),
        ]);

        const totalPages = Math.ceil(totalItems / limit);
        console.log(`[Activity SVC] Found ${logs.length} logs on page ${page}. Total items: ${totalItems}, Total pages: ${totalPages}`);

        return {
            logs,
            totalPages,
            currentPage: page,
            totalItems,
        };

    } catch (error) {
        console.error(`[Activity SVC] Error fetching activity log for user ${userId}:`, error);
        // Podríamos relanzar un error más específico si quisiéramos
        throw new Error('Error al obtener el historial de actividad desde la base de datos.');
    }
};