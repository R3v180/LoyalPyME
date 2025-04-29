// filename: backend/src/tiers/tier-logic.helpers.ts
// Version: 1.1.0 (Fix circular dependency by returning calculation from review helper)

import { PrismaClient, User, Prisma, QrCodeStatus, Tier, TierCalculationBasis, TierDowngradePolicy } from '@prisma/client';
import { subMonths, isBefore } from 'date-fns';

const prisma = new PrismaClient();

type ActiveTierInfo = Pick<Tier, 'id' | 'name' | 'level' | 'minValue'>;

// NOTA: Ya NO importamos updateUserTier desde tier-logic.service

/**
 * Calcula la métrica relevante para un usuario según la base de cálculo.
 * (Sin cambios respecto a la versión anterior)
 */
export async function calculateUserMetric(userId: string, basis: TierCalculationBasis, startDate: Date | undefined): Promise<number> {
    console.log(`[TierLogic Helper] Calculating metric for user ${userId}. Basis=${basis}, StartDate=${startDate?.toISOString() ?? 'Lifetime'}`);
    const whereBase: Prisma.QrCodeWhereInput = { userId: userId, status: QrCodeStatus.COMPLETED, };
    if (startDate) { whereBase.completedAt = { gte: startDate }; }
    let userMetricValue = 0;
    try {
        switch (basis) {
            case TierCalculationBasis.SPEND: const spendResult = await prisma.qrCode.aggregate({ _sum: { amount: true }, where: whereBase, }); userMetricValue = spendResult._sum.amount ?? 0; break;
            case TierCalculationBasis.VISITS: const visitCount = await prisma.qrCode.count({ where: whereBase, }); userMetricValue = visitCount; break;
            case TierCalculationBasis.POINTS_EARNED: const pointsResult = await prisma.qrCode.aggregate({ _sum: { pointsEarned: true }, where: whereBase, }); userMetricValue = pointsResult._sum.pointsEarned ?? 0; break;
        }
    } catch (error) { console.error(`[TierLogic Helper] Error calculating metric ${basis} for user ${userId}:`, error); userMetricValue = 0; }
    console.log(`[TierLogic Helper] User ${userId} - Metric Result (${basis}) = ${userMetricValue}`);
    return userMetricValue;
}

/**
 * Determina el ID del tier objetivo basado en la métrica y los tiers activos.
 * (Sin cambios respecto a la versión anterior)
 */
export function determineTargetTier(metricValue: number, activeTiers: ActiveTierInfo[]): string | null {
    let targetTierId: string | null = null;
    for (const tier of activeTiers) {
        if (metricValue >= tier.minValue) { targetTierId = tier.id; break; }
    }
    return targetTierId;
}

/**
 * (Helper para CRON - MODIFICADO) Calcula el tier objetivo para un usuario durante la revisión periódica.
 * Ya NO actualiza directamente, solo devuelve el resultado del cálculo.
 * @returns Objeto con { userId, currentTierId, targetTierId } o null si no se puede calcular/no aplica.
 */
export async function calculateTierForReview(userId: string): Promise<{ userId: string, currentTierId: string | null, targetTierId: string | null } | null> {
    console.log(`[Tier JOB Helper] Calculating target tier (for periodic review) for user ${userId}`);
    try {
        // 1. Obtener usuario y configuración del negocio (similar a updateUserTier)
        const user = await prisma.user.findUnique({ // Usar findUnique en lugar de findUniqueOrThrow para devolver null si falla
             where: { id: userId },
             include: {
                 business: {
                     select: {
                         id: true, tierSystemEnabled: true, tierCalculationBasis: true,
                         tierCalculationPeriodMonths: true,
                         tiers: { where: { isActive: true }, orderBy: { level: 'desc' }, select: { id: true, name: true, level: true, minValue: true } }
                     }
                 },
             }
        });

        // Validaciones
        if (!user || !user.business) { console.warn(`[Tier JOB Helper] User ${userId} or their business not found during review calculation.`); return null; }
        if (!user.business.tierSystemEnabled || !user.business.tierCalculationBasis) { console.log(`[Tier JOB Helper] Tier system/basis not enabled/configured for business ${user.businessId}. Skipping review calc.`); return null; }
        if (!user.business.tiers || user.business.tiers.length === 0) { console.log(`[Tier JOB Helper] No active tiers for business ${user.businessId}. Skipping review calc.`); return null; }

        // Extraer config y calcular métrica/tier (igual que en updateUserTier)
        const config = user.business;
        const activeTiers: ActiveTierInfo[] = config.tiers;
        const calculationBasis = config.tierCalculationBasis; // Sabemos que no es null por el check anterior
        const periodMonths = config.tierCalculationPeriodMonths;
        const now = new Date();
        let startDate: Date | undefined = (periodMonths && periodMonths > 0) ? subMonths(now, periodMonths) : undefined;

        const userMetricValue = await calculateUserMetric(userId, calculationBasis!, startDate); // Usar helper
        const targetTierId = determineTargetTier(userMetricValue, activeTiers); // Usar helper

        // Devolver la información necesaria para que el CRON job decida si actualizar
        return { userId: user.id, currentTierId: user.currentTierId, targetTierId: targetTierId };

    } catch (error) {
        console.error(`[Tier JOB Helper] Error calculating tier for review for user ${userId}:`, error);
        return null; // Devolver null si hay un error al calcular para este usuario
    }
}

/**
 * (Helper para CRON) Comprueba la inactividad y baja al usuario a null si aplica.
 * (Sin cambios respecto a la versión anterior)
 * @returns true si el usuario fue bajado de nivel, false en caso contrario.
 */
export async function handleInactivityCheckUser(user: Pick<User, 'id' | 'lastActivityAt' | 'currentTierId'>, inactivityPeriodMonths: number, now: Date): Promise<boolean> {
    if (user.currentTierId === null) { return false; }
    if (!user.lastActivityAt) { console.log(`[Tier JOB Helper] User ${user.id} has no lastActivityAt date recorded. Cannot check inactivity.`); return false; }
    const inactivityLimitDate = subMonths(now, inactivityPeriodMonths);
    if (isBefore(user.lastActivityAt, inactivityLimitDate)) {
        console.log(`[Tier JOB Helper] Downgrading user ${user.id} (Last activity: ${user.lastActivityAt.toISOString()}) due to inactivity (Limit: ${inactivityLimitDate.toISOString()}).`);
        try { await prisma.user.update({ where: { id: user.id }, data: { currentTierId: null, tierAchievedAt: null } }); return true; }
        catch (error) { console.error(`[Tier JOB Helper] Failed to downgrade user ${user.id} due to inactivity:`, error); return false; }
    }
    return false;
}

// End of File: backend/src/tiers/tier-logic.helpers.ts