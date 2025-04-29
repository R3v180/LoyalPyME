// filename: backend/src/tiers/tier-logic.service.ts
// Version: 2.1.0 (Import helpers from separate file, update CRON logic, fix encoding)

import { PrismaClient, User, Prisma, Tier, TierCalculationBasis, TierDowngradePolicy } from '@prisma/client';
import { subMonths } from 'date-fns'; // isBefore ya no se usa aquí directamente

const prisma = new PrismaClient();

// Importar helpers desde el nuevo archivo
import {
    calculateUserMetric,
    determineTargetTier,
    calculateTierForReview,
    handleInactivityCheckUser
} from './tier-logic.helpers';

// Tipo auxiliar (podría moverse a types si se usa en más sitios)
type ActiveTierInfo = Pick<Tier, 'id' | 'name' | 'level' | 'minValue'>;


// ==================================
// Funciones de Servicio Exportadas
// ==================================

/**
 * Calcula y actualiza el Tier de un usuario basado en la configuración del negocio.
 * Se llama típicamente después de que un usuario gana puntos (ej: validar QR).
 */
export const updateUserTier = async (userId: string): Promise<void> => {
    console.log(`[TierLogic SVC] Checking/Updating tier for user: ${userId}`);
    try {
        // 1. Obtener usuario y configuración del negocio
        const user = await prisma.user.findUniqueOrThrow({
             where: { id: userId },
             include: {
                 business: {
                     select: {
                         id: true, tierSystemEnabled: true, tierCalculationBasis: true,
                         tierCalculationPeriodMonths: true,
                         // Obtener tiers activos ordenados por nivel DESC para facilitar la lógica
                         tiers: { where: { isActive: true }, orderBy: { level: 'desc' }, select: { id: true, name: true, level: true, minValue: true } }
                     }
                 },
             }
        });

        // Validaciones iniciales
        if (!user.business) { console.warn(`[TierLogic SVC] User ${userId} has no associated business.`); return; }
        if (!user.business.tierSystemEnabled) { console.log(`[TierLogic SVC] Tier system disabled for business ${user.businessId}. Skipping tier update.`); return; }
        if (!user.business.tiers || user.business.tiers.length === 0) { console.log(`[TierLogic SVC] No active tiers configured for business ${user.businessId}. Skipping tier update.`); return; }
        if (!user.business.tierCalculationBasis) {
             console.log(`[TierLogic SVC] Tier calculation basis not configured for business ${user.businessId}. Skipping tier update.`);
             return;
        }

        // Extraer config
        const config = user.business;
        const activeTiers: ActiveTierInfo[] = config.tiers;
        const calculationBasis = config.tierCalculationBasis; // Sabemos que no es null
        const periodMonths = config.tierCalculationPeriodMonths;
        const now = new Date();
        let startDate: Date | undefined = (periodMonths && periodMonths > 0) ? subMonths(now, periodMonths) : undefined;

        // 2. Calcular métrica usando helper importado
        const userMetricValue = await calculateUserMetric(userId, calculationBasis!, startDate); // Usar helper importado

        // 3. Determinar Tier objetivo usando helper importado
        const targetTierId = determineTargetTier(userMetricValue, activeTiers); // Usar helper importado

        // 4. Actualizar usuario SI el tier ha cambiado
        if (user.currentTierId !== targetTierId) {
            console.log(`[TierLogic SVC] Updating user ${userId} tier from ${user.currentTierId || 'None'} to ${targetTierId || 'None'}`);
            await prisma.user.update({
                where: { id: userId },
                data: {
                    currentTierId: targetTierId,
                    tierAchievedAt: targetTierId ? now : null, // Actualizar fecha solo si se asigna un nuevo tier
                },
            });
        } else {
            console.log(`[TierLogic SVC] User ${userId} remains in tier ${user.currentTierId || 'None'}. No update needed.`);
        }

    } catch (error) {
        // Manejar error si el usuario no se encuentra (findUniqueOrThrow)
        if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2025') {
             console.error(`[TierLogic SVC] User ${userId} not found during tier update check.`);
        } else {
             // Otros errores inesperados
             console.error(`[TierLogic SVC] Error updating tier for user ${userId}:`, error);
        }
        // No relanzamos el error aquí para no detener el flujo que lo llamó (ej: validateQr)
        // pero el error queda registrado.
    }
};

/**
 * Procesa las actualizaciones y posibles descensos de nivel para todos los usuarios aplicables.
 * Diseñado para ser ejecutado por un CRON job.
 */
export const processTierUpdatesAndDowngrades = async (): Promise<void> => {
    const jobStartTime = new Date();
    console.log(`[Tier JOB ${jobStartTime.toISOString()}] Starting scheduled tier update/downgrade process...`);
    let businessesProcessed = 0;
    let usersProcessed = 0;
    let usersDowngradedInactivity = 0;
    let usersCheckedPeriodic = 0;
    let usersUpdatedPeriodic = 0; // Contador para actualizaciones por revisión periódica

    try {
        // Obtener negocios con sistema de tiers activo y alguna política de descenso (que no sea NEVER)
        const businessesToProcess = await prisma.business.findMany({
            where: {
                tierSystemEnabled: true,
                tierDowngradePolicy: { not: TierDowngradePolicy.NEVER } // Solo procesar si hay posibilidad de descenso
            },
            select: { id: true, tierDowngradePolicy: true, tierCalculationPeriodMonths: true, inactivityPeriodMonths: true }
        });

        if (businessesToProcess.length === 0) {
            console.log(`[Tier JOB ${jobStartTime.toISOString()}] No businesses with active downgrade policies. Finishing.`);
            return;
        }
        console.log(`[Tier JOB ${jobStartTime.toISOString()}] Found ${businessesToProcess.length} businesses to process.`);
        businessesProcessed = businessesToProcess.length;

        const now = new Date(); // Usar la misma fecha para todas las comprobaciones del job

        // Iterar por cada negocio
        for (const business of businessesToProcess) {
            console.log(`[Tier JOB] Processing business ${business.id} with policy ${business.tierDowngradePolicy}`);

            // Obtener usuarios activos del negocio
            const users = await prisma.user.findMany({
                where: { businessId: business.id, isActive: true, role: 'CUSTOMER_FINAL' },
                select: { id: true, lastActivityAt: true, currentTierId: true } // Campos necesarios para las revisiones
            });

            if (users.length === 0) {
                console.log(`[Tier JOB] No active customer users for business ${business.id}. Skipping.`);
                continue;
            }

            // Iterar por cada usuario del negocio
            for (const user of users) {
                usersProcessed++;
                try {
                    // Aplicar lógica según la política del negocio
                    if (business.tierDowngradePolicy === TierDowngradePolicy.PERIODIC_REVIEW) {
                        usersCheckedPeriodic++;
                        // --- CAMBIO: Usar helper que calcula y devuelve datos ---
                        const reviewResult = await calculateTierForReview(user.id);
                        if (reviewResult && reviewResult.currentTierId !== reviewResult.targetTierId) {
                            // Si el helper devolvió un resultado y el tier calculado es diferente al actual, actualizamos
                            console.log(`[Tier JOB] Updating user ${user.id} tier from ${reviewResult.currentTierId || 'None'} to ${reviewResult.targetTierId || 'None'} based on periodic review.`);
                            await prisma.user.update({
                                where: { id: user.id },
                                data: {
                                    currentTierId: reviewResult.targetTierId,
                                    tierAchievedAt: reviewResult.targetTierId ? now : null
                                }
                            });
                            usersUpdatedPeriodic++; // Contar actualización
                        } else if (reviewResult) {
                            console.log(`[Tier JOB] User ${user.id} tier remains unchanged after periodic review.`);
                        }
                        // Si reviewResult es null, el helper ya logueó el error/skip
                        // --- FIN CAMBIO ---

                    } else if (business.tierDowngradePolicy === TierDowngradePolicy.AFTER_INACTIVITY && business.inactivityPeriodMonths) {
                        // Usar helper importado para comprobar inactividad (sin cambios aquí)
                        const downgraded = await handleInactivityCheckUser(user, business.inactivityPeriodMonths, now);
                        if (downgraded) usersDowngradedInactivity++;
                    }
                } catch (userProcessingError) {
                    // Capturar errores inesperados al procesar un usuario individual para no detener todo el job
                    console.error(`[Tier JOB] Unexpected error processing user ${user.id} for business ${business.id}:`, userProcessingError);
                }
            } // Fin loop usuarios
        } // Fin loop negocios

    } catch (error) {
        // Capturar errores críticos al obtener negocios o fallos generales
        console.error(`[Tier JOB ${jobStartTime.toISOString()}] Critical error during scheduled processing:`, error);
    } finally {
        const jobEndTime = new Date();
        const duration = (jobEndTime.getTime() - jobStartTime.getTime()) / 1000;
        console.log(`[Tier JOB ${jobStartTime.toISOString()}] Finished processing. Duration: ${duration}s. Businesses: ${businessesProcessed}, Total Users Processed: ${usersProcessed}, Users Checked (Periodic): ${usersCheckedPeriodic}, Updated (Periodic): ${usersUpdatedPeriodic}, Downgraded (Inactivity): ${usersDowngradedInactivity}.`); // Añadido contador de actualizados
    }
};

// End of File: backend/src/tiers/tier-logic.service.ts