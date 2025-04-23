// File: backend/src/tiers/tier-logic.service.ts
// Version: 1.3.3 (Revise Prisma include/select structure for updateUserTier - COMPLETE FILE)

import { PrismaClient, User, Prisma, QrCodeStatus } from '@prisma/client';
import { TierCalculationBasis, TierDowngradePolicy } from '@prisma/client';
import { subMonths, isBefore } from 'date-fns';

const prisma = new PrismaClient();

/**
 * Calcula y actualiza el Tier de un usuario basado en la configuración del negocio y las métricas del usuario.
 * @param userId - ID del usuario a actualizar.
 */
export const updateUserTier = async (userId: string): Promise<void> => {
    console.log(`[TierLogic SVC] Checking/Updating tier for user: ${userId}`);
    try {
        // 1. Obtener usuario, incluyendo relación business (con campos seleccionados) y tiers anidados
        const user = await prisma.user.findUniqueOrThrow({
             where: { id: userId },
             // --- ESTRUCTURA INCLUDE/SELECT REVISADA ---
             include: {
                 business: { // Incluir la relación 'business'
                     select: { // Seleccionar explícitamente los campos necesarios de Business Y la relación anidada 'tiers'
                         id: true,
                         tierSystemEnabled: true,
                         tierCalculationBasis: true,
                         tierCalculationPeriodMonths: true,
                         // No necesitamos downgradePolicy ni inactivity aquí
                         tiers: { // Incluir la relación 'tiers' dentro de la selección de business
                             where: { isActive: true },
                             orderBy: { level: 'desc' },
                             select: {
                                 id: true,
                                 name: true,
                                 level: true,
                                 minValue: true,
                             }
                         }
                     }
                 }
                 // NO incluir campos escalares de User aquí. Se obtienen por defecto.
             }
             // --- FIN REVISIÓN ---
        });

        // Validaciones iniciales (Deberían funcionar con la nueva estructura)
        if (!user.business) {
             console.warn(`[TierLogic SVC] User ${userId} has no associated business loaded.`);
             return;
        }
        // Acceder a los campos seleccionados del negocio
        if (!user.business.tierSystemEnabled) {
            console.log(`[TierLogic SVC] Tier system disabled for business ${user.businessId}. Skipping update for user ${userId}.`);
            return;
        }
        // Acceder a 'tiers' a través de la relación cargada en la selección
        if (!user.business.tierCalculationBasis || !user.business.tiers || user.business.tiers.length === 0) {
            console.log(`[TierLogic SVC] Tier system not configured (no basis or no tiers) for business ${user.businessId}. Skipping update for user ${userId}.`);
            return;
        }

        // Acceder a la configuración y tiers desde el objeto business incluido en user
        const config = user.business; // Ahora 'config' tiene exactamente los campos seleccionados
        const activeTiers = config.tiers;
        const calculationBasis = config.tierCalculationBasis;
        const periodMonths = config.tierCalculationPeriodMonths;
        const now = new Date();
        let startDate: Date | undefined = undefined;
        let userMetricValue: number = 0;

        // Calcular fecha inicio si hay periodo móvil
        if (periodMonths && periodMonths > 0) {
            startDate = subMonths(now, periodMonths);
            console.log(`[TierLogic SVC] User ${userId}: Calculating metric since ${startDate.toISOString()}`);
        } else {
            console.log(`[TierLogic SVC] User ${userId}: Calculating metric based on lifetime activity.`);
        }

        // 2. --- CÁLCULO DE MÉTRICA ---
        console.log(`[TierLogic SVC] User ${userId}: Basis = ${calculationBasis}`);
        const whereBase: Prisma.QrCodeWhereInput = {
            userId: userId,
            status: QrCodeStatus.COMPLETED,
        };
        if (startDate) {
             whereBase.completedAt = { gte: startDate };
        }

        switch (calculationBasis) {
            case TierCalculationBasis.SPEND:
                const spendResult = await prisma.qrCode.aggregate({
                    _sum: { amount: true },
                    where: whereBase,
                });
                userMetricValue = spendResult._sum.amount ?? 0;
                console.log(`[TierLogic SVC] User ${userId} - Metric SPEND = ${userMetricValue}`);
                break;

            case TierCalculationBasis.VISITS:
                const visitCount = await prisma.qrCode.count({
                    where: whereBase,
                });
                userMetricValue = visitCount;
                console.log(`[TierLogic SVC] User ${userId} - Metric VISITS = ${userMetricValue}`);
                break;

            case TierCalculationBasis.POINTS_EARNED:
                 // TODO: Implementación precisa requiere cambios en schema/points.service
                 userMetricValue = user.totalPointsEarned ?? 0;
                 console.log(`[TierLogic SVC] User ${userId} - Metric POINTS_EARNED = ${userMetricValue} (using lifetime total - window not applied)`);
                 break;

            default:
                console.warn(`[TierLogic SVC] Unknown tier calculation basis '${calculationBasis}'. Skipping.`);
                return;
        }
        // --- FIN CÁLCULO DE MÉTRICA ---


        // 3. Determinar el Tier más alto que cumple el usuario
        let targetTierId: string | null = null;
        for (const tier of activeTiers) { // activeTiers viene de user.business.tiers
            if (userMetricValue >= tier.minValue) {
                targetTierId = tier.id;
                console.log(`[TierLogic SVC] User ${userId} qualifies for Tier ${tier.name} (ID: ${tier.id})`);
                break;
            }
        }

        // 4. Actualizar el usuario SI el tier ha cambiado
        // Comparamos con user.currentTierId (campo escalar del usuario, obtenido por defecto)
        if (user.currentTierId !== targetTierId) {
            console.log(`[TierLogic SVC] Updating user ${userId} tier from ${user.currentTierId || 'None'} to ${targetTierId || 'None'}`);
            await prisma.user.update({
                where: { id: userId },
                data: {
                    currentTierId: targetTierId,
                    tierAchievedAt: targetTierId ? new Date() : null,
                },
            });
            // TODO: Generar notificación interna o evento
        } else {
            console.log(`[TierLogic SVC] User ${userId} remains in tier ${user.currentTierId || 'None'}.`);
        }

    } catch (error) {
        if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2025') {
             console.error(`[TierLogic SVC] User with ID ${userId} not found during tier update.`);
        } else {
             console.error(`[TierLogic SVC] Error updating tier for user ${userId}:`, error);
        }
    }
};

/**
 * Procesa las actualizaciones y posibles descensos de nivel para todos los usuarios relevantes.
 * Diseñado para ser llamado por un cron job.
 */
export const processTierUpdatesAndDowngrades = async (): Promise<void> => {
    const jobStartTime = new Date();
    console.log(`[Tier JOB ${jobStartTime.toISOString()}] Starting scheduled tier update/downgrade process...`);
    let businessesProcessed = 0;
    let usersProcessed = 0;
    let usersDowngradedInactivity = 0;

    try {
        // 1. Obtener Businesses con políticas de descenso activas
        const businessesToProcess = await prisma.business.findMany({
            where: {
                tierSystemEnabled: true,
                tierDowngradePolicy: { not: TierDowngradePolicy.NEVER }
            },
            select: {
                id: true,
                tierDowngradePolicy: true,
                tierCalculationPeriodMonths: true,
                inactivityPeriodMonths: true
            }
        });

        if (businessesToProcess.length === 0) {
            console.log(`[Tier JOB ${jobStartTime.toISOString()}] No businesses found with active downgrade policies. Finishing.`);
            return;
        }
        console.log(`[Tier JOB ${jobStartTime.toISOString()}] Found ${businessesToProcess.length} businesses to process.`);
        businessesProcessed = businessesToProcess.length;

        // 2. Iterar sobre cada negocio
        for (const business of businessesToProcess) {
            console.log(`[Tier JOB] Processing business ${business.id} with policy ${business.tierDowngradePolicy}`);
            // 3. Obtener usuarios
            const users = await prisma.user.findMany({
                where: {
                    businessId: business.id,
                    isActive: true,
                    role: 'CUSTOMER_FINAL'
                },
                select: {
                    id: true,
                    lastActivityAt: true,
                    currentTierId: true
                }
            });

            if (users.length === 0) {
                console.log(`[Tier JOB] No active customer users found for business ${business.id}. Skipping.`);
                continue;
            }

            const now = new Date();
            // 4. Iterar sobre cada usuario
            for (const user of users) {
                usersProcessed++;
                try {
                    // 5. Lógica PERIODIC_REVIEW
                    if (business.tierDowngradePolicy === TierDowngradePolicy.PERIODIC_REVIEW) {
                         await updateUserTier(user.id);
                    }
                    // 6. Lógica AFTER_INACTIVITY
                    else if (business.tierDowngradePolicy === TierDowngradePolicy.AFTER_INACTIVITY &&
                             business.inactivityPeriodMonths && business.inactivityPeriodMonths > 0)
                    {
                        if (user.lastActivityAt) {
                            const inactivityLimitDate = subMonths(now, business.inactivityPeriodMonths);
                            if (isBefore(user.lastActivityAt, inactivityLimitDate)) {
                                if (user.currentTierId !== null) {
                                    console.log(`[Tier JOB] Downgrading user ${user.id} due to inactivity (last activity: ${user.lastActivityAt.toISOString()}).`);
                                    // TODO: Lógica exacta de descenso
                                    await prisma.user.update({
                                        where: { id: user.id },
                                        data: {
                                            currentTierId: null,
                                            tierAchievedAt: null
                                        }
                                    });
                                    usersDowngradedInactivity++;
                                }
                            }
                        } else {
                             console.log(`[Tier JOB] User ${user.id} has no lastActivityAt date recorded. Cannot check inactivity.`);
                        }
                    }
                } catch (userError) {
                    console.error(`[Tier JOB] Error processing user ${user.id} for business ${business.id}:`, userError);
                }
            } // Fin loop usuarios
        } // Fin loop negocios
    } catch (error) {
        console.error(`[Tier JOB ${jobStartTime.toISOString()}] Error during scheduled processing:`, error);
    } finally {
        // Log final COMPLETO
        const jobEndTime = new Date();
        const duration = (jobEndTime.getTime() - jobStartTime.getTime()) / 1000;
        console.log(`[Tier JOB ${jobStartTime.toISOString()}] Finished processing. Duration: ${duration}s. Businesses: ${businessesProcessed}, Users: ${usersProcessed}, Downgraded (Inactivity): ${usersDowngradedInactivity}.`);
    }
};

// End of File: backend/src/tiers/tier-logic.service.ts