// filename: backend/src/admin/admin-stats.service.ts
// Version: 1.2.0 (Refactor: Extract queries into helper functions)

import { PrismaClient, UserRole, QrCodeStatus, Prisma } from '@prisma/client';
import { startOfDay, endOfDay, subDays } from 'date-fns';

const prisma = new PrismaClient();

// Interface (sin cambios)
export interface AdminOverviewStatsData {
    totalActiveCustomers: number;
    newCustomersLast7Days: number;
    newCustomersPrevious7Days: number;
    pointsIssuedLast7Days: number;
    pointsIssuedPrevious7Days: number;
    rewardsRedeemedLast7Days: number;
    rewardsRedeemedPrevious7Days: number;
}

// --- Helper Functions ---

// Obtiene el número total de clientes activos
async function _getTotalActiveCustomers(businessId: string): Promise<number> {
    return prisma.user.count({
        where: { businessId, isActive: true, role: UserRole.CUSTOMER_FINAL }
    });
}

// Obtiene el número de nuevos clientes en un rango de fechas
async function _getNewCustomersCount(businessId: string, startDate: Date, endDate: Date): Promise<number> {
    return prisma.user.count({
        where: { businessId, role: UserRole.CUSTOMER_FINAL, createdAt: { gte: startDate, lte: endDate } }
    });
}

// Obtiene la suma de puntos otorgados en un rango de fechas
async function _getPointsIssuedSum(businessId: string, startDate: Date, endDate: Date): Promise<number> {
    const result = await prisma.qrCode.aggregate({
        _sum: { pointsEarned: true },
        where: { businessId, status: QrCodeStatus.COMPLETED, completedAt: { gte: startDate, lte: endDate } }
    });
    return result._sum.pointsEarned ?? 0;
}

// Obtiene el número de recompensas (regalos) canjeadas en un rango de fechas
async function _getRewardsRedeemedCount(businessId: string, startDate: Date, endDate: Date): Promise<number> {
    // Nota: Solo cuenta regalos canjeados ('GrantedReward') actualmente
    return prisma.grantedReward.count({
        where: { businessId, status: 'REDEEMED', redeemedAt: { gte: startDate, lte: endDate } }
    });
}

// --- Fin Helper Functions ---


/**
 * Calcula las estadísticas clave y los datos del periodo anterior para el overview.
 * (Ahora usa funciones helper para las consultas)
 * @param businessId - El ID del negocio.
 * @returns Un objeto con las estadísticas calculadas (periodo actual y anterior).
 * @throws Error si ocurre un problema al consultar la base de datos.
 */
export const getOverviewStats = async (businessId: string): Promise<AdminOverviewStatsData> => {
    console.log(`[AdminStatsService] Calculating overview stats (using helpers) for businessId: ${businessId}`);

    try {
        // Definir Rangos de Fechas (sin cambios)
        const now = new Date();
        const startOfLast7Days = startOfDay(subDays(now, 6));
        const endOfLast7Days = now;
        const startOfPrevious7Days = startOfDay(subDays(now, 13));
        const endOfPrevious7Days = endOfDay(subDays(now, 7));

        console.log(`[AdminStatsService] Date Ranges - Last 7: ${startOfLast7Days.toISOString()} - ${endOfLast7Days.toISOString()}`);
        console.log(`[AdminStatsService] Date Ranges - Prev 7: ${startOfPrevious7Days.toISOString()} - ${endOfPrevious7Days.toISOString()}`);

        // Ejecutar Helpers en Paralelo
        const [
            totalActiveCustomers,
            newCustomersLast7Days,
            pointsIssuedLast7Days,
            rewardsRedeemedLast7Days,
            newCustomersPrevious7Days,
            pointsIssuedPrevious7Days,
            rewardsRedeemedPrevious7Days,
        ] = await Promise.all([
            _getTotalActiveCustomers(businessId),
            _getNewCustomersCount(businessId, startOfLast7Days, endOfLast7Days),
            _getPointsIssuedSum(businessId, startOfLast7Days, endOfLast7Days),
            _getRewardsRedeemedCount(businessId, startOfLast7Days, endOfLast7Days),
            _getNewCustomersCount(businessId, startOfPrevious7Days, endOfPrevious7Days),
            _getPointsIssuedSum(businessId, startOfPrevious7Days, endOfPrevious7Days),
            _getRewardsRedeemedCount(businessId, startOfPrevious7Days, endOfPrevious7Days),
        ]);

        // Construir resultado (sin cambios)
        const result = {
            totalActiveCustomers,
            newCustomersLast7Days,
            newCustomersPrevious7Days,
            pointsIssuedLast7Days,
            pointsIssuedPrevious7Days,
            rewardsRedeemedLast7Days,
            rewardsRedeemedPrevious7Days,
        };

        console.log(`[AdminStatsService] Stats calculated (using helpers) for ${businessId}:`, result);
        return result;

    } catch (error) {
        console.error(`[AdminStatsService] Error calculating overview stats (using helpers) for business ${businessId}:`, error);
        // Relanzar el error para que el controlador lo maneje
        throw new Error('Error al obtener las estadísticas del dashboard.');
    }
};

// End of file: backend/src/admin/admin-stats.service.ts