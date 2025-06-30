// backend/src/modules/loyalpyme/admin/admin-stats.service.ts
// Version: 1.3.0 (Use correct APPLIED status enum for redeemed rewards count)

import { PrismaClient, UserRole, QrCodeStatus, Prisma, ActivityType, GrantedRewardStatus } from '@prisma/client'; // <-- GrantedRewardStatus AÑADIDO
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

// Helper Functions
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

async function _getRewardsRedeemedCount(businessId: string, startDate: Date, endDate: Date): Promise<number> {
    let giftedAndAppliedCount = 0;
    let pointsRedeemedCount = 0;

    try {
        // Contar cupones que han sido APLICADOS a un pedido
        giftedAndAppliedCount = await prisma.grantedReward.count({
            // --- CORRECCIÓN AQUÍ ---
            where: { businessId, status: GrantedRewardStatus.APPLIED, redeemedAt: { gte: startDate, lte: endDate } }
        });
    } catch (error) {
        console.error(`[AdminStatsService] Error counting applied/gifted rewards:`, error);
    }

    try {
        // Contar recompensas del flujo antiguo (canje directo por puntos)
        pointsRedeemedCount = await prisma.activityLog.count({
            where: {
                businessId,
                type: ActivityType.POINTS_REDEEMED_REWARD,
                createdAt: { gte: startDate, lte: endDate }
            }
        });
    } catch (error) {
        console.error(`[AdminStatsService] Error counting points redeemed rewards:`, error);
    }
    
    const startDateStr = startDate ? startDate.toISOString() : 'N/A';
    const endDateStr = endDate ? endDate.toISOString() : 'N/A';
    console.log(`[AdminStatsService DEBUG] Period: ${startDateStr} to ${endDateStr}. Applied/Gifted count: ${giftedAndAppliedCount}, Direct Points redeemed: ${pointsRedeemedCount}`);
    
    return giftedAndAppliedCount + pointsRedeemedCount;
}


export const getOverviewStats = async (businessId: string): Promise<AdminOverviewStatsData> => {
    console.log(`[AdminStatsService] Calculating overview stats for businessId: ${businessId}`);

    try {
        const now = new Date();
        const startOfLast7Days = startOfDay(subDays(now, 6));
        const endOfLast7Days = endOfDay(now);
        const startOfPrevious7Days = startOfDay(subDays(now, 13));
        const endOfPrevious7Days = endOfDay(subDays(now, 7));

        console.log(`[AdminStatsService DEBUG] Date Ranges - Last 7: ${startOfLast7Days.toISOString()} - ${endOfLast7Days.toISOString()}`);
        console.log(`[AdminStatsService DEBUG] Date Ranges - Prev 7: ${startOfPrevious7Days.toISOString()} - ${endOfPrevious7Days.toISOString()}`);

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
        throw new Error('Error crítico al obtener las estadísticas del dashboard.');
    }
};