// filename: backend/src/tiers/tier-logic.service.ts
// --- INICIO DEL CÓDIGO COMPLETO ---
// File: backend/src/tiers/tier-logic.service.ts
// Version: 1.4.0 (Use aggregation for POINTS_EARNED basis in updateUserTier - COMPLETE FILE)

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
                             orderBy: { level: 'desc' }, // Ordenar de mayor a menor nivel
                             select: {
                                 id: true,
                                 name: true,
                                 level: true,
                                 minValue: true,
                             }
                         }
                     }
                 },
                 // Los campos escalares de User (como currentTierId) se obtienen por defecto.
             }
        });

        // Validaciones iniciales
        if (!user.business) {
             console.warn(`[TierLogic SVC] User ${userId} has no associated business loaded.`);
             return;
        }
        if (!user.business.tierSystemEnabled) {
            console.log(`[TierLogic SVC] Tier system disabled for business ${user.businessId}. Skipping update for user ${userId}.`);
            return;
        }
        if (!user.business.tierCalculationBasis || !user.business.tiers || user.business.tiers.length === 0) {
            console.log(`[TierLogic SVC] Tier system not configured (no basis or no tiers) for business ${user.businessId}. Skipping update for user ${userId}.`);
            return;
        }

        // Acceder a la configuración y tiers desde el objeto business incluido en user
        const config = user.business;
        const activeTiers = config.tiers; // Ya ordenados DESC por nivel
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
        // Define la condición base para las consultas de agregación/conteo
        const whereBase: Prisma.QrCodeWhereInput = {
            userId: userId,
            status: QrCodeStatus.COMPLETED, // Solo contar QR completados
        };
        if (startDate) {
             // Si hay fecha de inicio, añadirla a la condición
             whereBase.completedAt = { gte: startDate };
        }

        switch (calculationBasis) {
            case TierCalculationBasis.SPEND:
                const spendResult = await prisma.qrCode.aggregate({
                    _sum: { amount: true },
                    where: whereBase, // Usar la condición base (usuario + opcionalmente fecha)
                });
                userMetricValue = spendResult._sum.amount ?? 0;
                console.log(`[TierLogic SVC] User ${userId} - Metric SPEND = ${userMetricValue}`);
                break;

            case TierCalculationBasis.VISITS:
                const visitCount = await prisma.qrCode.count({
                    where: whereBase, // Usar la condición base (usuario + opcionalmente fecha)
                });
                userMetricValue = visitCount;
                console.log(`[TierLogic SVC] User ${userId} - Metric VISITS = ${userMetricValue}`);
                break;

            // *** SECCIÓN MODIFICADA AQUÍ ***
            case TierCalculationBasis.POINTS_EARNED:
                const pointsResult = await prisma.qrCode.aggregate({
                    _sum: { pointsEarned: true }, // ¡Suma los puntos de la casilla 'pointsEarned'!
                    where: whereBase, // 'whereBase' ya filtra por usuario y fecha (si aplica)
                });
                userMetricValue = pointsResult._sum.pointsEarned ?? 0; // El valor es la suma, o 0 si no hay nada
                console.log(`[TierLogic SVC] User ${userId} - Metric POINTS_EARNED = ${userMetricValue} (Calculated from QrCodes within period)`);
                break; // No olvides el break!
            // *** FIN SECCIÓN MODIFICADA ***

            default:
                console.warn(`[TierLogic SVC] Unknown tier calculation basis '${calculationBasis}'. Skipping.`);
                return;
        }
        // --- FIN CÁLCULO DE MÉTRICA ---


        // 3. Determinar el Tier más alto que cumple el usuario
        // Los tiers ya están ordenados de mayor a menor nivel (minValue más alto primero)
        let targetTierId: string | null = null;
        for (const tier of activeTiers) {
            if (userMetricValue >= tier.minValue) {
                // El primer tier que cumple (el de nivel más alto) es el objetivo
                targetTierId = tier.id;
                console.log(`[TierLogic SVC] User ${userId} qualifies for Tier ${tier.name} (ID: ${tier.id}, Level: ${tier.level}) with metric value ${userMetricValue} >= ${tier.minValue}`);
                break; // Salir en cuanto se encuentra el primer tier que cumple
            } else {
                 console.log(`[TierLogic SVC] User ${userId} does NOT qualify for Tier ${tier.name} (ID: ${tier.id}, Level: ${tier.level}) with metric value ${userMetricValue} < ${tier.minValue}`);
            }
        }

        // 4. Actualizar el usuario SI el tier ha cambiado
        if (user.currentTierId !== targetTierId) {
            console.log(`[TierLogic SVC] Updating user ${userId} tier from ${user.currentTierId || 'None'} to ${targetTierId || 'None'}`);
            await prisma.user.update({
                where: { id: userId },
                data: {
                    currentTierId: targetTierId, // Asignar el nuevo ID (o null si no califica para ninguno)
                    tierAchievedAt: targetTierId ? new Date() : null, // Actualizar fecha si se obtiene un tier
                },
            });
            // TODO: Generar notificación interna o evento si es necesario
        } else {
            console.log(`[TierLogic SVC] User ${userId} remains in tier ${user.currentTierId || 'None'}. No update needed.`);
        }

    } catch (error) {
        if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2025') {
             console.error(`[TierLogic SVC] User with ID ${userId} not found during tier update.`);
        } else {
             console.error(`[TierLogic SVC] Error updating tier for user ${userId}:`, error);
        }
        // No relanzar el error para no detener procesos batch (como el cron job) si un usuario falla
    }
};

/**
 * Procesa las actualizaciones y posibles descensos de nivel para todos los usuarios relevantes.
 * Diseñado para ser llamado por un cron job.
 * (Función sin cambios en esta actualización)
 */
export const processTierUpdatesAndDowngrades = async (): Promise<void> => {
    const jobStartTime = new Date();
    console.log(`[Tier JOB ${jobStartTime.toISOString()}] Starting scheduled tier update/downgrade process...`);
    let businessesProcessed = 0;
    let usersProcessed = 0;
    let usersDowngradedInactivity = 0;
    let usersCheckedPeriodic = 0; // Contador para periodic review

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
                tierCalculationPeriodMonths: true, // Necesario para updateUserTier
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
            // 3. Obtener usuarios activos del negocio
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
            // 4. Iterar sobre cada usuario del negocio
            for (const user of users) {
                usersProcessed++;
                try {
                    // 5. Lógica PERIODIC_REVIEW: Siempre recalcular el tier
                    if (business.tierDowngradePolicy === TierDowngradePolicy.PERIODIC_REVIEW) {
                         console.log(`[Tier JOB] Running periodic review for user ${user.id}`);
                         await updateUserTier(user.id); // Recalcula basado en la ventana de tiempo actual
                         usersCheckedPeriodic++;
                    }
                    // 6. Lógica AFTER_INACTIVITY: Solo comprobar inactividad si tiene un tier asignado
                    else if (business.tierDowngradePolicy === TierDowngradePolicy.AFTER_INACTIVITY &&
                             business.inactivityPeriodMonths && business.inactivityPeriodMonths > 0 &&
                             user.currentTierId !== null) // Solo verificar si está en un tier
                    {
                        if (user.lastActivityAt) {
                            const inactivityLimitDate = subMonths(now, business.inactivityPeriodMonths);
                            if (isBefore(user.lastActivityAt, inactivityLimitDate)) {
                                // El usuario está inactivo y tiene un tier -> Bajar a null (Base)
                                console.log(`[Tier JOB] Downgrading user ${user.id} from tier ${user.currentTierId} due to inactivity (last activity: ${user.lastActivityAt.toISOString()}).`);
                                // Implementación recomendada: Bajar a null
                                await prisma.user.update({
                                    where: { id: user.id },
                                    data: {
                                        currentTierId: null, // Bajar al nivel base
                                        tierAchievedAt: null
                                    }
                                });
                                usersDowngradedInactivity++;
                            } else {
                                // Usuario activo, no hacer nada por inactividad
                                // console.log(`[Tier JOB] User ${user.id} is active. No downgrade needed.`);
                            }
                        } else {
                             // Usuario sin registro de actividad, ¿qué hacer?
                             // Podríamos decidir bajarlo por defecto, o ignorarlo. Ignoramos por ahora.
                             console.log(`[Tier JOB] User ${user.id} has no lastActivityAt date recorded. Cannot check inactivity for downgrade.`);
                        }
                    }
                } catch (userError) {
                    console.error(`[Tier JOB] Error processing user ${user.id} for business ${business.id}:`, userError);
                    // Continuar con el siguiente usuario aunque uno falle
                }
            } // Fin loop usuarios
        } // Fin loop negocios
    } catch (error) {
        console.error(`[Tier JOB ${jobStartTime.toISOString()}] Critical error during scheduled processing:`, error);
    } finally {
        // Log final COMPLETO
        const jobEndTime = new Date();
        const duration = (jobEndTime.getTime() - jobStartTime.getTime()) / 1000;
        console.log(`[Tier JOB ${jobStartTime.toISOString()}] Finished processing. Duration: ${duration}s. Businesses: ${businessesProcessed}, Total Users Processed: ${usersProcessed}, Users Checked (Periodic): ${usersCheckedPeriodic}, Downgraded (Inactivity): ${usersDowngradedInactivity}.`);
    }
};

// End of File: backend/src/tiers/tier-logic.service.ts
// --- FIN DEL CÓDIGO COMPLETO ---