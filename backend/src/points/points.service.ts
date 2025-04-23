// filename: backend/src/points/points.service.ts
// --- INICIO DEL CÓDIGO COMPLETO ---
// File: backend/src/points/points.service.ts
// Version: 1.4.0 (Save pointsEarned in validateQrCode transaction - COMPLETE CODE)

import { PrismaClient, User, Reward, QrCode, Business, QrCodeStatus, UserRole, Prisma } from '@prisma/client';
import { v4 as uuidv4 } from 'uuid';
import { addMinutes, isAfter } from 'date-fns';
// Tier Service import
import { updateUserTier } from '../tiers/tier-logic.service'; // Importar función

const prisma = new PrismaClient();
const QR_EXPIRATION_MINUTES = 30;

interface RedeemResult { message: string; newPointsBalance: number; }

// generateQrCodeData (Función original - Asumimos que está completa donde se necesite)
export const generateQrCodeData = async (businessId: string, amount: number, ticketNumber: string): Promise<{ qrToken: string; amount: number }> => {
    if (amount <= 0 || typeof amount !== 'number') {
        throw new Error('El importe de la transacción debe ser un número positivo.');
    }
    const token = uuidv4();
    const expiresAt = addMinutes(new Date(), QR_EXPIRATION_MINUTES);
    try {
        const qrCode = await prisma.qrCode.create({
            data: { token, businessId, amount, ticketNumber, expiresAt, status: QrCodeStatus.PENDING },
            select: { token: true, amount: true }
        });
        console.log(`QR Code generated for business ${businessId} with token ${token} for amount ${amount}, ticket: ${ticketNumber}.`);
        return { qrToken: qrCode.token, amount: qrCode.amount };
    } catch (error: unknown) {
        console.error('Error generating QR code data:', error);
        throw new Error('No se pudieron generar los datos del código QR.');
    }
};


/**
 * Validates a QR token and assigns points to a customer.
 * Incluye validaciones completas, actualización de métricas/tier y guardado de pointsEarned.
 */
export const validateQrCode = async (qrToken: string, customerUserId: string): Promise<number> => {
    const now = new Date();
    let calculatedPointsEarned = 0;

    try {
        const qrCode = await prisma.qrCode.findUnique({
            where: { token: qrToken },
            include: {
                business: {
                    select: {
                        id: true,
                        pointsPerEuro: true,
                        tierSystemEnabled: true,
                        tierCalculationBasis: true,
                    }
                }
            }
        });

        // --- Validaciones del QR COMPLETAS ---
        if (!qrCode) {
            throw new Error('Código QR inválido.');
        }
        // Verificar estado
        if (qrCode.status !== QrCodeStatus.PENDING) {
            if (qrCode.status === QrCodeStatus.COMPLETED) {
                throw new Error('El código QR ya ha sido utilizado.');
            }
            if (qrCode.status === QrCodeStatus.EXPIRED) {
                throw new Error('El código QR ha expirado.');
            }
            // Otro estado inesperado
            throw new Error('El código QR no está disponible para canjear.');
        }
        // Verificar expiración
        if (isAfter(now, qrCode.expiresAt)) {
            try {
                // Marcar como expirado en BD antes de lanzar error
                await prisma.qrCode.update({
                    where: { id: qrCode.id },
                    data: { status: QrCodeStatus.EXPIRED }
                });
                 console.log(`[Points SVC] QR code ${qrToken} marked as EXPIRED.`);
            } catch (updateError) {
                console.error(`[Points SVC] Failed to update QR status to EXPIRED for token ${qrToken}:`, updateError);
            }
            throw new Error('El código QR ha expirado.');
        }
        // --- Fin Validaciones del QR ---

        // Obtener usuario y verificar pertenencia al negocio
        const customer = await prisma.user.findUnique({
            where: { id: customerUserId, role: UserRole.CUSTOMER_FINAL },
            // Incluir tier y beneficios para calcular multiplicador
            select: { id: true, points: true, businessId: true, role: true, currentTier: { include: { benefits: true } } }
        });
        if (!customer || customer.role !== UserRole.CUSTOMER_FINAL) {
            throw new Error('Solo las cuentas de cliente pueden canjear códigos QR.');
        }
        if (customer.businessId !== qrCode.businessId) {
            throw new Error('El código QR no es válido para el negocio de este cliente.');
        }

        // Calcular puntos (considerando multiplicador de tier)
        const pointsPerEuro = qrCode.business.pointsPerEuro;
        let effectivePoints = qrCode.amount * pointsPerEuro;
        const multiplierBenefit = customer.currentTier?.benefits.find(b => b.type === 'POINTS_MULTIPLIER' && b.isActive);
        if (multiplierBenefit) {
            const multiplier = parseFloat(multiplierBenefit.value);
            if (!isNaN(multiplier) && multiplier > 0) {
                effectivePoints *= multiplier;
                console.log(`[Points SVC] Applied tier multiplier ${multiplier} for user ${customerUserId}`);
            }
        }
        calculatedPointsEarned = Math.floor(effectivePoints);
        if (calculatedPointsEarned < 0) calculatedPointsEarned = 0;

        // --- Transacción para actualizar User y QrCode ---
        const [updatedUser, updatedQrCodeRecord] = await prisma.$transaction([
            prisma.user.update({
                where: { id: customer.id },
                data: {
                    points: { increment: calculatedPointsEarned },
                    lastActivityAt: now,
                    totalVisits: { increment: 1 },
                    totalSpend: { increment: qrCode.amount },
                    totalPointsEarned: { increment: calculatedPointsEarned },
                },
                select: { id: true, points: true }
            }),
            prisma.qrCode.update({
                where: { id: qrCode.id },
                data: {
                    status: QrCodeStatus.COMPLETED,
                    completedAt: now,
                    userId: customerUserId, // Guardar quién lo validó
                    // *** LÍNEA AÑADIDA AQUÍ ***
                    pointsEarned: calculatedPointsEarned // Guardar los puntos específicos de este QR
                },
                select: { id: true, status: true, completedAt: true, userId: true, pointsEarned: true } // Incluir pointsEarned en select si se quiere devolver/loggear
            })
        ]);
        // --- Fin Transacción ---

        console.log(`QR token ${qrToken} validated by user ${updatedQrCodeRecord.userId}. Assigned ${calculatedPointsEarned} points (recorded as ${updatedQrCodeRecord.pointsEarned}). User now has ${updatedUser.points} points.`);

        // Disparar actualización de Tier (asíncrona)
        if (qrCode.business.tierSystemEnabled) {
            console.log(`[Points SVC] Triggering tier update for user ${customerUserId} (async)`);
            updateUserTier(customerUserId).catch(err => {
                 console.error(`[Points SVC] Background tier update failed for user ${customerUserId}:`, err);
            });
        }

        return calculatedPointsEarned;

    } catch (error: unknown) {
        // Capturar y relanzar errores específicos de validación
        if (error instanceof Error && (
            error.message.startsWith('Código QR inválido') ||
            error.message.includes('ya ha sido utilizado') ||
            error.message.includes('ha expirado') ||
            error.message.includes('no está disponible para canjear') ||
            error.message.includes('Solo las cuentas de cliente') ||
            error.message.includes('no es válido para el negocio')
        )) {
            console.warn(`[Points SVC] Validation failed for token ${qrToken}: ${error.message}`);
            throw error; // Relanzar para que el controlador lo envíe al frontend
        }
        // Loguear otros errores inesperados
        console.error(`[Points SVC] Unexpected error validating token ${qrToken}:`, error);
        throw new Error('Ocurrió un error interno del servidor durante la validación del QR.');
    }
};

// redeemReward (Función original - Sin cambios aquí)
export const redeemReward = async (customerUserId: string, rewardId: string): Promise<RedeemResult> => {
    console.log(`[REDEEM SVC] Service function called for user ${customerUserId} and reward ${rewardId}`);
    try {
        const user = await prisma.user.findUniqueOrThrow({ where: { id: customerUserId }, select: { id: true, points: true, businessId: true, role: true } });
        const reward = await prisma.reward.findUniqueOrThrow({ where: { id: rewardId }, select: { id: true, name: true, pointsCost: true, isActive: true, businessId: true } });
        console.log(`[REDEEM SVC] Found User: ${user.id}, Points: ${user.points}`);
        console.log(`[REDEEM SVC] Found Reward: ${reward.id}, Cost: ${reward.pointsCost}, Active: ${reward.isActive}`);
        if (user.role !== UserRole.CUSTOMER_FINAL) { throw new Error('Rol de usuario inválido para canjear recompensas.'); }
        if (user.businessId !== reward.businessId) { throw new Error('La recompensa no pertenece al negocio del cliente.'); }
        if (!reward.isActive) { throw new Error('Esta recompensa está actualmente inactiva.'); }
        if (user.points < reward.pointsCost) { throw new Error(`Puntos insuficientes para canjear esta recompensa. Necesarios: ${reward.pointsCost}, Disponibles: ${user.points}`); }
        console.log(`[REDEEM SVC] Proceeding with transaction for user ${user.id} and reward ${reward.id}`);
        const updatedUser = await prisma.$transaction(async (tx) => {
            const resultUser = await tx.user.update({ where: { id: customerUserId }, data: { points: { decrement: reward.pointsCost } }, select: { id: true, points: true } });
            console.log(`[REDEEM SVC - TX SUCCESS] User ${resultUser.id} redeemed reward '${reward.name}' (${reward.id}) for ${reward.pointsCost} points. New balance: ${resultUser.points}.`);
            // Aquí podríamos añadir lógica adicional en la transacción si fuera necesario, como registrar el canje
            return resultUser;
        });
        return { message: `¡Recompensa '${reward.name}' canjeada con éxito!`, newPointsBalance: updatedUser.points };
    } catch (error: unknown) {
        console.error(`[REDEEM SVC - ERROR] Failed to redeem reward for user ${customerUserId}, reward ${rewardId}:`, error);
        if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2025') { throw new Error('No se encontró el usuario o la recompensa especificada.'); }
        if (error instanceof Error) { throw error; }
        throw new Error('Ocurrió un error inesperado durante el canje de la recompensa.');
    }
};

// End of File: backend/src/points/points.service.ts
// --- FIN DEL CÓDIGO COMPLETO ---