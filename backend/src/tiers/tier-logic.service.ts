// filename: backend/src/tiers/tier-logic.service.ts
// --- INICIO DEL CÓDIGO CORREGIDO ---
// File: backend/src/tiers/tier-logic.service.ts
// Version: 2.0.4 (Fix TS error: Use non-null assertion for calculationBasis in helper call)

import { PrismaClient, User, Prisma, QrCodeStatus, Tier, TierCalculationBasis, TierDowngradePolicy } from '@prisma/client';
import { subMonths, isBefore } from 'date-fns';

const prisma = new PrismaClient();

// Tipo auxiliar para los Tiers activos que necesitamos
type ActiveTierInfo = Pick<Tier, 'id' | 'name' | 'level' | 'minValue'>;

// ==============================================
// HELPER FUNCTIONS (Internal - Sin cambios respecto a v2.0.2)
// ==============================================
async function _calculateUserMetric(userId: string, basis: TierCalculationBasis, startDate: Date | undefined): Promise<number> { /* ...código sin cambios... */
    console.log(`[TierLogic Helper] Calculating metric for user ${userId}. Basis=${basis}, StartDate=${startDate?.toISOString() ?? 'Lifetime'}`);
    const whereBase: Prisma.QrCodeWhereInput = { userId: userId, status: QrCodeStatus.COMPLETED, };
    if (startDate) { whereBase.completedAt = { gte: startDate }; }
    let userMetricValue = 0;
    switch (basis) {
        case TierCalculationBasis.SPEND: const spendResult = await prisma.qrCode.aggregate({ _sum: { amount: true }, where: whereBase, }); userMetricValue = spendResult._sum.amount ?? 0; break;
        case TierCalculationBasis.VISITS: const visitCount = await prisma.qrCode.count({ where: whereBase, }); userMetricValue = visitCount; break;
        case TierCalculationBasis.POINTS_EARNED: const pointsResult = await prisma.qrCode.aggregate({ _sum: { pointsEarned: true }, where: whereBase, }); userMetricValue = pointsResult._sum.pointsEarned ?? 0; break;
    }
    console.log(`[TierLogic Helper] User ${userId} - Metric Result = ${userMetricValue}`);
    return userMetricValue;
 }
function _determineTargetTier(metricValue: number, activeTiers: ActiveTierInfo[]): string | null { /* ...código sin cambios... */
    let targetTierId: string | null = null;
    for (const tier of activeTiers) {
        if (metricValue >= tier.minValue) { targetTierId = tier.id; console.log(`[TierLogic Helper] User qualifies for Tier ${tier.name} (ID: ${tier.id}, Level: ${tier.level}) with metric value ${metricValue} >= ${tier.minValue}`); break; }
        else { console.log(`[TierLogic Helper] User does NOT qualify for Tier ${tier.name} (ID: ${tier.id}, Level: ${tier.level}) with metric value ${metricValue} < ${tier.minValue}`); }
    }
    return targetTierId;
}
async function _handlePeriodicReviewUser(userId: string): Promise<void> { /* ...código sin cambios... */
    console.log(`[Tier JOB Helper] Running periodic review for user ${userId}`);
    try { await updateUserTier(userId); }
    catch (error) { console.error(`[Tier JOB Helper] Error during periodic review for user ${userId}:`, error); }
 }
async function _handleInactivityCheckUser(user: Pick<User, 'id' | 'lastActivityAt' | 'currentTierId'>, inactivityPeriodMonths: number, now: Date): Promise<boolean> { /* ...código sin cambios... */
    if (user.currentTierId === null) { return false; }
    if (!user.lastActivityAt) { console.log(`[Tier JOB Helper] User ${user.id} has no lastActivityAt date recorded. Cannot check inactivity.`); return false; }
    const inactivityLimitDate = subMonths(now, inactivityPeriodMonths);
    if (isBefore(user.lastActivityAt, inactivityLimitDate)) {
        console.log(`[Tier JOB Helper] Downgrading user ${user.id} due to inactivity.`);
        try { await prisma.user.update({ where: { id: user.id }, data: { currentTierId: null, tierAchievedAt: null } }); return true; }
        catch (error) { console.error(`[Tier JOB Helper] Failed to downgrade user ${user.id}:`, error); return false; }
    }
    return false;
 }


// ==================================
// Funciones de Servicio Exportadas
// ==================================

/**
 * Calcula y actualiza el Tier de un usuario.
 * (CORREGIDO: Usa aserciÃ³n no nula en llamada a helper)
 */
export const updateUserTier = async (userId: string): Promise<void> => {
    console.log(`[TierLogic SVC] Checking/Updating tier for user: ${userId}`);
    try {
        // 1. Obtener usuario y configuraciÃ³n del negocio
        const user = await prisma.user.findUniqueOrThrow({
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

        // Validaciones iniciales
        if (!user.business) { console.warn(`[TierLogic SVC] User ${userId} has no associated business.`); return; }
        if (!user.business.tierSystemEnabled) { console.log(`[TierLogic SVC] Tier system disabled for business ${user.businessId}. Skipping.`); return; }
        if (!user.business.tiers || user.business.tiers.length === 0) { console.log(`[TierLogic SVC] No active tiers configured for business ${user.businessId}. Skipping.`); return; }
        // ValidaciÃ³n de nulidad (importante)
        if (!user.business.tierCalculationBasis) {
             console.log(`[TierLogic SVC] Tier calculation basis not configured for business ${user.businessId}. Skipping.`);
             return;
        }

        // Extraer config
        const config = user.business;
        const activeTiers: ActiveTierInfo[] = config.tiers;
        // Aunque hemos comprobado !user.business.tierCalculationBasis, TypeScript puede no estrechar el tipo de 'config.tierCalculationBasis' aquÃ­.
        // Lo asignamos a una variable ANTES de la llamada al helper.
        const calculationBasis = config.tierCalculationBasis;
        const periodMonths = config.tierCalculationPeriodMonths;
        const now = new Date();
        let startDate: Date | undefined = (periodMonths && periodMonths > 0) ? subMonths(now, periodMonths) : undefined;

        // 2. Calcular mÃ©trica usando helper
        // --- CORRECCIÃ“N: AÃ±adir aserciÃ³n no nula (!) ---
        // Le decimos a TS: "confÃ­a en mÃ­, sÃ© que calculationBasis no es null aquÃ­ debido a la comprobaciÃ³n anterior"
        const userMetricValue = await _calculateUserMetric(userId, calculationBasis!, startDate);
        // --- FIN CORRECCIÃ“N ---

        // 3. Determinar Tier objetivo usando helper (sin cambios)
        const targetTierId = _determineTargetTier(userMetricValue, activeTiers);

        // 4. Actualizar usuario SI el tier ha cambiado (sin cambios)
        if (user.currentTierId !== targetTierId) {
            console.log(`[TierLogic SVC] Updating user ${userId} tier from ${user.currentTierId || 'None'} to ${targetTierId || 'None'}`);
            await prisma.user.update({
                where: { id: userId },
                data: {
                    currentTierId: targetTierId,
                    tierAchievedAt: targetTierId ? now : null,
                },
            });
        } else {
            console.log(`[TierLogic SVC] User ${userId} remains in tier ${user.currentTierId || 'None'}. No update needed.`);
        }

    } catch (error) {
        if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2025') { console.error(`[TierLogic SVC] User ${userId} not found during tier update check.`); }
        else { console.error(`[TierLogic SVC] Error updating tier for user ${userId}:`, error); }
    }
};

/**
 * Procesa las actualizaciones y posibles descensos de nivel (Cron Job).
 * (Sin cambios respecto a v2.0.2)
 */
export const processTierUpdatesAndDowngrades = async (): Promise<void> => {
    // ... (el cÃ³digo de esta funciÃ³n no necesita cambios) ...
    const jobStartTime = new Date(); console.log(`[Tier JOB ${jobStartTime.toISOString()}] Starting scheduled tier update/downgrade process...`); let businessesProcessed = 0; let usersProcessed = 0; let usersDowngradedInactivity = 0; let usersCheckedPeriodic = 0; try { const businessesToProcess = await prisma.business.findMany({ where: { tierSystemEnabled: true, tierDowngradePolicy: { not: TierDowngradePolicy.NEVER } }, select: { id: true, tierDowngradePolicy: true, tierCalculationPeriodMonths: true, inactivityPeriodMonths: true } }); if (businessesToProcess.length === 0) { console.log(`[Tier JOB ${jobStartTime.toISOString()}] No businesses with active downgrade policies. Finishing.`); return; } console.log(`[Tier JOB ${jobStartTime.toISOString()}] Found ${businessesToProcess.length} businesses to process.`); businessesProcessed = businessesToProcess.length; for (const business of businessesToProcess) { console.log(`[Tier JOB] Processing business ${business.id} with policy ${business.tierDowngradePolicy}`); const users = await prisma.user.findMany({ where: { businessId: business.id, isActive: true, role: 'CUSTOMER_FINAL' }, select: { id: true, lastActivityAt: true, currentTierId: true } }); if (users.length === 0) { console.log(`[Tier JOB] No active customer users for business ${business.id}. Skipping.`); continue; } const now = new Date(); for (const user of users) { usersProcessed++; try { if (business.tierDowngradePolicy === TierDowngradePolicy.PERIODIC_REVIEW) { await _handlePeriodicReviewUser(user.id); usersCheckedPeriodic++; } else if (business.tierDowngradePolicy === TierDowngradePolicy.AFTER_INACTIVITY && business.inactivityPeriodMonths) { const downgraded = await _handleInactivityCheckUser(user, business.inactivityPeriodMonths, now); if (downgraded) usersDowngradedInactivity++; } } catch (userProcessingError) { console.error(`[Tier JOB] Error processing user ${user.id} for business ${business.id}:`, userProcessingError); } } } } catch (error) { console.error(`[Tier JOB ${jobStartTime.toISOString()}] Critical error during scheduled processing:`, error); } finally { const jobEndTime = new Date(); const duration = (jobEndTime.getTime() - jobStartTime.getTime()) / 1000; console.log(`[Tier JOB ${jobStartTime.toISOString()}] Finished processing. Duration: ${duration}s. Businesses: ${businessesProcessed}, Total Users Processed: ${usersProcessed}, Users Checked (Periodic): ${usersCheckedPeriodic}, Downgraded (Inactivity): ${usersDowngradedInactivity}.`); }
};

// End of File: backend/src/tiers/tier-logic.service.ts
// --- FIN DEL CÃ“DIGO CORREGIDO ---