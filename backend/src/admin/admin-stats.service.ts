// filename: backend/src/admin/admin-stats.service.ts
// Version: 1.2.1 (Count points-based redemptions from ActivityLog)

import { PrismaClient, UserRole, QrCodeStatus, Prisma, ActivityType } from '@prisma/client';
import { startOfDay, endOfDay, subDays } from 'date-fns';

const prisma = new PrismaClient();

export interface AdminOverviewStatsData {
    totalActiveCustomers: number;
    newCustomersLast7Days: number;
    newCustomersPrevious7Days: number;
    pointsIssuedLast7Days: number;
    pointsIssuedPrevious7Days: number;
    rewardsRedeemedLast7Days: number;
    rewardsRedeemedPrevious7Days: number;
}

// Helper Functions (sin cambios respecto a tu versión anterior que funcionaba parcialmente)
async function _getTotalActiveCustomers(businessId: string): Promise<number> {
    return prisma.user.count({
        where: { businessId, isActive: true, role: UserRole.CUSTOMER_FINAL }
    });
}

async function _getNewCustomersCount(businessId: string, startDate: Date, endDate: Date): Promise<number> {
    return prisma.user.count({
        where: { businessId, role: UserRole.CUSTOMER_FINAL, createdAt: { gte: startDate, lte: endDate } }
    });
}

async function _getPointsIssuedSum(businessId: string, startDate: Date, endDate: Date): Promise<number> {
    const result = await prisma.qrCode.aggregate({
        _sum: { pointsEarned: true },
        where: { businessId, status: QrCodeStatus.COMPLETED, completedAt: { gte: startDate, lte: endDate } }
    });
    return result._sum.pointsEarned ?? 0;
}

// --- FUNCIÓN MODIFICADA PARA CONTAR TODOS LOS CANJES ---
async function _getRewardsRedeemedCount(businessId: string, startDate: Date, endDate: Date): Promise<number> {
    let giftedRedeemedCount = 0;
    let pointsRedeemedCount = 0;

    try {
        // Contar regalos canjeados (como estaba antes)
        giftedRedeemedCount = await prisma.grantedReward.count({
            where: { businessId, status: 'REDEEMED', redeemedAt: { gte: startDate, lte: endDate } }
        });
    } catch (error) {
        console.error(`[AdminStatsService] Error counting gifted redeemed rewards:`, error);
        // Continuar para intentar contar los otros canjes, pero loguear el error
    }

    try {
        // Contar recompensas canjeadas por puntos (usando ActivityLog)
        pointsRedeemedCount = await prisma.activityLog.count({
            where: {
                businessId,
                type: ActivityType.POINTS_REDEEMED_REWARD, // Usar el tipo de actividad correcto
                createdAt: { gte: startDate, lte: endDate } // Usar createdAt del log
            }
        });
    } catch (error) {
        console.error(`[AdminStatsService] Error counting points redeemed rewards:`, error);
        // Continuar, pero loguear el error
    }
    
    // Log más seguro para depuración
    const startDateStr = startDate ? startDate.toISOString() : 'N/A';
    const endDateStr = endDate ? endDate.toISOString() : 'N/A';
    console.log(`[AdminStatsService DEBUG] Period: ${startDateStr} to ${endDateStr}. Gifted redeemed: ${giftedRedeemedCount}, Points redeemed: ${pointsRedeemedCount}`);
    
    return giftedRedeemedCount + pointsRedeemedCount;
}
// --- FIN FUNCIÓN MODIFICADA ---


export const getOverviewStats = async (businessId: string): Promise<AdminOverviewStatsData> => {
    console.log(`[AdminStatsService] Calculating overview stats for businessId: ${businessId}`);

    try {
        const now = new Date();
        // Definición precisa de los rangos de fechas
        const startOfLast7Days = startOfDay(subDays(now, 6)); // Incluye hoy y los 6 días anteriores
        const endOfLast7Days = endOfDay(now);                 // Hasta el final del día de hoy

        const startOfPrevious7Days = startOfDay(subDays(now, 13)); // Empieza hace 13 días
        const endOfPrevious7Days = endOfDay(subDays(now, 7));   // Termina al final del día hace 7 días

        console.log(`[AdminStatsService DEBUG] Date Ranges - Last 7: ${startOfLast7Days.toISOString()} - ${endOfLast7Days.toISOString()}`);
        console.log(`[AdminStatsService DEBUG] Date Ranges - Prev 7: ${startOfPrevious7Days.toISOString()} - ${endOfPrevious7Days.toISOString()}`);

        const [
            totalActiveCustomers,
            newCustomersLast7Days,
            pointsIssuedLast7Days,
            rewardsRedeemedLast7Days, // Usará la función modificada
            newCustomersPrevious7Days,
            pointsIssuedPrevious7Days,
            rewardsRedeemedPrevious7Days, // Usará la función modificada
        ] = await Promise.all([
            _getTotalActiveCustomers(businessId),
            _getNewCustomersCount(businessId, startOfLast7Days, endOfLast7Days),
            _getPointsIssuedSum(businessId, startOfLast7Days, endOfLast7Days),
            _getRewardsRedeemedCount(businessId, startOfLast7Days, endOfLast7Days),
            _getNewCustomersCount(businessId, startOfPrevious7Days, endOfPrevious7Days),
            _getPointsIssuedSum(businessId, startOfPrevious7Days, endOfPrevious7Days),
            _getRewardsRedeemedCount(businessId, startOfPrevious7Days, endOfPrevious7Days),
        ]);

        const result = {
            totalActiveCustomers,
            newCustomersLast7Days,
            newCustomersPrevious7Days,
            pointsIssuedLast7Days,
            pointsIssuedPrevious7Days,
            rewardsRedeemedLast7Days,
            rewardsRedeemedPrevious7Days,
        };

        console.log(`[AdminStatsService] Stats calculated successfully for ${businessId}:`, result);
        return result;

    } catch (error) {
        console.error(`[AdminStatsService] CRITICAL Error calculating overview stats for business ${businessId}:`, error);
        // Es importante que el error se propague para que el controlador lo maneje
        throw new Error('Error crítico al obtener las estadísticas del dashboard.');
    }
};