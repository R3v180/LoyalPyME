// filename: backend/src/tiers/tier-logic.helpers.ts
// Version: 1.3.2 (Add null check for calculationBasis in calculateTierForReview)

import { PrismaClient, User, Prisma, QrCodeStatus, Tier, TierCalculationBasis, TierDowngradePolicy } from '@prisma/client';
import { subMonths, isBefore } from 'date-fns';

type ActiveTierInfo = Pick<Tier, 'id' | 'name' | 'level' | 'minValue'>;

export async function calculateUserMetric(
    prismaClient: Pick<PrismaClient, 'qrCode'>,
    userId: string,
    basis: TierCalculationBasis, // Sigue siendo no nulo aquí
    startDate: Date | undefined
): Promise<number> {
    console.log(`[TierLogic Helper DI] Calculating metric for user ${userId}. Basis=${basis}, StartDate=${startDate?.toISOString() ?? 'Lifetime'}`);
    const whereBase: Prisma.QrCodeWhereInput = { userId: userId, status: QrCodeStatus.COMPLETED, };
    if (startDate) {
        whereBase.completedAt = { gte: startDate };
    }
    let userMetricValue = 0;
    try {
        switch (basis) {
            case TierCalculationBasis.SPEND:
                const spendResult = await prismaClient.qrCode.aggregate({ _sum: { amount: true }, where: whereBase, });
                userMetricValue = spendResult._sum.amount ?? 0;
                break;
            case TierCalculationBasis.VISITS:
                const visitCount = await prismaClient.qrCode.count({ where: whereBase, });
                userMetricValue = visitCount;
                break;
            case TierCalculationBasis.POINTS_EARNED:
                const pointsResult = await prismaClient.qrCode.aggregate({ _sum: { pointsEarned: true }, where: whereBase, });
                userMetricValue = pointsResult._sum.pointsEarned ?? 0;
                break;
        }
    } catch (error) {
        console.error(`[TierLogic Helper DI] Error calculating metric ${basis} for user ${userId}:`, error);
        userMetricValue = 0;
    }
    console.log(`[TierLogic Helper DI] User ${userId} - Metric Result (${basis}) = ${userMetricValue}`);
    return userMetricValue;
}

export function determineTargetTier(metricValue: number, activeTiers: ActiveTierInfo[]): string | null {
    // (Sin cambios)
    let targetTierId: string | null = null;
    for (const tier of activeTiers) {
        if (metricValue >= tier.minValue) {
            targetTierId = tier.id;
            break;
        }
    }
    return targetTierId;
}

export async function calculateTierForReview(
    prismaClient: PrismaClient,
    userId: string
): Promise<{ userId: string, currentTierId: string | null, targetTierId: string | null } | null> {
    console.log(`[Tier JOB Helper DI] Calculating target tier for user ${userId}`);
    try {
        const user = await prismaClient.user.findUnique({
             where: { id: userId },
             include: { /* ... include business ... */
                business: {
                    select: {
                        id: true, tierSystemEnabled: true, tierCalculationBasis: true,
                        tierCalculationPeriodMonths: true,
                        tiers: { where: { isActive: true }, orderBy: { level: 'desc' }, select: { id: true, name: true, level: true, minValue: true } }
                    }
                },
             }
        });

         if (!user || !user.business) { return null; }

        // --- NUEVO: Comprobación de null ---
        if (!user.business.tierSystemEnabled || !user.business.tierCalculationBasis || !user.business.tiers || user.business.tiers.length === 0) {
            console.log(`[Tier JOB Helper DI] Skipping review calc for user ${userId} due to missing config or no active tiers.`);
            return null;
        }
        // --- FIN NUEVO ---


        const config = user.business;
        const activeTiers: ActiveTierInfo[] = config.tiers;
        const calculationBasis = config.tierCalculationBasis; // Sabemos que no es null aquí
        const periodMonths = config.tierCalculationPeriodMonths;
        const now = new Date();
        let startDate: Date | undefined = (periodMonths && periodMonths > 0) ? subMonths(now, periodMonths) : undefined;

        // --- CAMBIO: Añadir '!' para asegurar a TS que calculationBasis no es null ---
        const userMetricValue = await calculateUserMetric(prismaClient, userId, calculationBasis!, startDate);
        // --- FIN CAMBIO ---
        const targetTierId = determineTargetTier(userMetricValue, activeTiers);

        return { userId: user.id, currentTierId: user.currentTierId, targetTierId: targetTierId };
    } catch (error) {
        console.error(`[Tier JOB Helper DI] Error calculating tier for review for user ${userId}:`, error);
        return null;
    }
}

export async function handleInactivityCheckUser(
    prismaClient: PrismaClient,
    user: Pick<User, 'id' | 'lastActivityAt' | 'currentTierId'>,
    inactivityPeriodMonths: number,
    now: Date
): Promise<boolean> {
    // (Sin cambios)
     if (user.currentTierId === null) { return false; }
    if (!user.lastActivityAt) { console.log(`[Tier JOB Helper DI] User ${user.id} has no lastActivityAt date.`); return false; }
    const inactivityLimitDate = subMonths(now, inactivityPeriodMonths);
    if (isBefore(user.lastActivityAt, inactivityLimitDate)) {
        console.log(`[Tier JOB Helper DI] Downgrading user ${user.id} due to inactivity.`);
        try {
            await prismaClient.user.update({ where: { id: user.id }, data: { currentTierId: null, tierAchievedAt: null } });
            return true;
        } catch (error) {
            console.error(`[Tier JOB Helper DI] Failed to downgrade user ${user.id} due to inactivity:`, error);
            return false;
        }
    }
    return false;
}

// End of File: backend/src/tiers/tier-logic.helpers.ts