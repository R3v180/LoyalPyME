// filename: backend/src/tiers/tier-logic.service.ts
// Version: 2.2.1 (Pass prisma instance to helpers)

import { PrismaClient, User, Prisma, Tier, TierCalculationBasis, TierDowngradePolicy } from '@prisma/client';
import { subMonths } from 'date-fns';
import {
    calculateUserMetric,
    determineTargetTier,
    calculateTierForReview,
    handleInactivityCheckUser
} from './tier-logic.helpers';

// Instancia de Prisma para este servicio
const prisma = new PrismaClient();

type ActiveTierInfo = Pick<Tier, 'id' | 'name' | 'level' | 'minValue'>;


/**
 * Calcula y actualiza el Tier de un usuario basado en la configuración del negocio.
 */
export const updateUserTier = async (userId: string): Promise<void> => {
    console.log(`[TierLogic SVC] Checking/Updating tier for user: ${userId}`);
    try {
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
        if (!user.business || !user.business.tierSystemEnabled || !user.business.tierCalculationBasis || !user.business.tiers || user.business.tiers.length === 0) {
            console.log(`[TierLogic SVC] Skipping tier update for user ${userId} due to missing config or disabled system.`);
            return;
        }

        const config = user.business;
        const activeTiers: ActiveTierInfo[] = config.tiers;
        const calculationBasis = config.tierCalculationBasis; // Sabemos que no es null
        const periodMonths = config.tierCalculationPeriodMonths;
        const now = new Date();
        let startDate: Date | undefined = (periodMonths && periodMonths > 0) ? subMonths(now, periodMonths) : undefined;

        // --- CORRECCIÓN: Pasar 'prisma' a calculateUserMetric ---
        const userMetricValue = await calculateUserMetric(prisma, userId, calculationBasis!, startDate);
        // --- FIN CORRECCIÓN ---
        const targetTierId = determineTargetTier(userMetricValue, activeTiers);

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
        if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2025') {
             console.error(`[TierLogic SVC] User ${userId} not found during tier update check.`);
         } else {
             console.error(`[TierLogic SVC] Error updating tier for user ${userId}:`, error);
         }
    }
};

/**
 * Procesa las actualizaciones y posibles descensos de nivel para todos los usuarios aplicables.
 */
export const processTierUpdatesAndDowngrades = async (): Promise<void> => {
    const jobStartTime = new Date();
    console.log(`[Tier JOB ${jobStartTime.toISOString()}] Starting scheduled tier update/downgrade process...`);
    let businessesProcessed = 0;
    let usersProcessed = 0;
    let usersDowngradedInactivity = 0;
    let usersCheckedPeriodic = 0;
    let usersUpdatedPeriodic = 0;

    try {
        const businessesToProcess = await prisma.business.findMany({
            where: {
                tierSystemEnabled: true,
                 tierDowngradePolicy: { not: TierDowngradePolicy.NEVER }
            },
            select: { id: true, tierDowngradePolicy: true, tierCalculationPeriodMonths: true, inactivityPeriodMonths: true }
        });
        if (businessesToProcess.length === 0) {
            console.log(`[Tier JOB ${jobStartTime.toISOString()}] No businesses with active downgrade policies. Finishing.`);
            return;
        }
        console.log(`[Tier JOB ${jobStartTime.toISOString()}] Found ${businessesToProcess.length} businesses to process.`);
        businessesProcessed = businessesToProcess.length;
        const now = new Date();

        for (const business of businessesToProcess) {
            console.log(`[Tier JOB] Processing business ${business.id} with policy ${business.tierDowngradePolicy}`);
            const users = await prisma.user.findMany({
                where: { businessId: business.id, isActive: true, role: 'CUSTOMER_FINAL' },
                select: { id: true, lastActivityAt: true, currentTierId: true }
            });
            if (users.length === 0) {
                console.log(`[Tier JOB] No active customer users for business ${business.id}. Skipping.`);
                continue;
            }

            for (const user of users) {
                usersProcessed++;
                try {
                    if (business.tierDowngradePolicy === TierDowngradePolicy.PERIODIC_REVIEW) {
                        usersCheckedPeriodic++;
                        // --- CORRECCIÓN: Pasar 'prisma' a calculateTierForReview ---
                        const reviewResult = await calculateTierForReview(prisma, user.id);
                        // --- FIN CORRECCIÓN ---
                        if (reviewResult && reviewResult.currentTierId !== reviewResult.targetTierId) {
                            console.log(`[Tier JOB] Updating user ${user.id} tier from ${reviewResult.currentTierId || 'None'} to ${reviewResult.targetTierId || 'None'} based on periodic review.`);
                            await prisma.user.update({
                                where: { id: user.id },
                                data: {
                                     currentTierId: reviewResult.targetTierId,
                                     tierAchievedAt: reviewResult.targetTierId ? now : null
                                }
                            });
                            usersUpdatedPeriodic++;
                        } else if (reviewResult) {
                            // console.log(`[Tier JOB] User ${user.id} tier remains unchanged after periodic review.`);
                        }
                    } else if (business.tierDowngradePolicy === TierDowngradePolicy.AFTER_INACTIVITY && business.inactivityPeriodMonths) {
                        // --- CORRECCIÓN: Pasar 'prisma' a handleInactivityCheckUser ---
                        const downgraded = await handleInactivityCheckUser(prisma, user, business.inactivityPeriodMonths, now);
                        // --- FIN CORRECCIÓN ---
                        if (downgraded) usersDowngradedInactivity++;
                    }
                } catch (userProcessingError) {
                    console.error(`[Tier JOB] Unexpected error processing user ${user.id} for business ${business.id}:`, userProcessingError);
                }
            } // Fin loop usuarios
        } // Fin loop negocios
    } catch (error) {
        console.error(`[Tier JOB ${jobStartTime.toISOString()}] Critical error during scheduled processing:`, error);
    } finally {
        const jobEndTime = new Date();
        const duration = (jobEndTime.getTime() - jobStartTime.getTime()) / 1000;
        console.log(`[Tier JOB ${jobStartTime.toISOString()}] Finished processing. Duration: ${duration}s. Businesses: ${businessesProcessed}, Total Users Processed: ${usersProcessed}, Users Checked (Periodic): ${usersCheckedPeriodic}, Updated (Periodic): ${usersUpdatedPeriodic}, Downgraded (Inactivity): ${usersDowngradedInactivity}.`);
    }
};

// End of File: backend/src/tiers/tier-logic.service.ts