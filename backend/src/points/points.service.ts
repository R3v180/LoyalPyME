// filename: backend/src/points/points.service.ts
// Version: 2.0.2 (Fix encoding, remove meta-comments)

import {
    PrismaClient,
    User,
    Reward,
    QrCode,
    Business,
    QrCodeStatus,
    UserRole,
    Prisma, // Aún necesario para Prisma.QrCodeWhereInput, etc.
    TierBenefit,
    TierCalculationBasis
} from '@prisma/client';
import { v4 as uuidv4 } from 'uuid';
import { addMinutes, isAfter } from 'date-fns';
import { updateUserTier } from '../tiers/tier-logic.service'; // Asumiendo que esta ruta es correcta

const prisma = new PrismaClient();
const QR_EXPIRATION_MINUTES = 30;

// --- Tipos y Interfaces ---
interface RedeemResult { message: string; newPointsBalance: number; }

// Tipo para el objeto QrCode validado
type ValidQrCode = QrCode & {
    business: {
        id: string;
        pointsPerEuro: number;
        tierSystemEnabled: boolean;
        tierCalculationBasis: TierCalculationBasis | null;
    }
};

// Tipo para el objeto Customer validado
type ValidCustomer = User & {
    currentTier: ({
        benefits: TierBenefit[];
    } & {
        id: string;
        name: string;
    }) | null;
};
// --- Fin Tipos ---


// ==============================================
// HELPER FUNCTIONS for validateQrCode (Internal)
// ==============================================

/**
 * (Helper) Busca y valida un registro QrCode.
 * @throws Error si no se encuentra, ya está usado o ha expirado.
 */
const _findAndValidateQrCodeRecord = async (qrToken: string, now: Date): Promise<ValidQrCode> => {
    const qrCode = await prisma.qrCode.findUnique({
        where: { token: qrToken },
        include: {
            business: {
                select: { id: true, pointsPerEuro: true, tierSystemEnabled: true, tierCalculationBasis: true }
            }
        }
    });
    if (!qrCode) { throw new Error('Código QR inválido.'); } // Corregido: Código, inválido
    if (qrCode.status !== QrCodeStatus.PENDING) {
        if (qrCode.status === QrCodeStatus.COMPLETED) throw new Error('El código QR ya ha sido utilizado.'); // Corregido: código
        if (qrCode.status === QrCodeStatus.EXPIRED) throw new Error('El código QR ha expirado.'); // Corregido: código
        throw new Error('El código QR no está disponible para canjear.'); // Corregido: código, está
    }
    if (isAfter(now, qrCode.expiresAt)) {
        try {
            await prisma.qrCode.update({ where: { id: qrCode.id }, data: { status: QrCodeStatus.EXPIRED } });
            console.log(`[Points SVC Helper] QR code ${qrToken} marked as EXPIRED.`);
        } catch (updateError) {
            console.error(`[Points SVC Helper] Failed to update QR status to EXPIRED for token ${qrToken}:`, updateError);
        }
        throw new Error('El código QR ha expirado.'); // Corregido: código
    }
    if (!qrCode.business) {
        console.error(`[Points SVC Helper] QR code ${qrCode.id} has no associated business!`);
        throw new Error('Error interno: El QR no está asociado a un negocio.');
    }
    return qrCode as ValidQrCode;
};

/**
 * (Helper) Busca y valida al usuario cliente.
 * @throws Error si no se encuentra, no es cliente final o no pertenece al negocio del QR.
 */
const _findAndValidateCustomerForQr = async (userId: string, qrCodeBusinessId: string): Promise<ValidCustomer> => {
    const customer = await prisma.user.findUnique({
        where: { id: userId },
        include: {
            currentTier: {
                include: {
                    benefits: { where: { isActive: true } }
                }
            }
        }
    });
    if (!customer || customer.role !== UserRole.CUSTOMER_FINAL) {
        throw new Error('Solo las cuentas de cliente pueden canjear códigos QR.'); // Corregido: códigos
    }
    if (customer.businessId !== qrCodeBusinessId) {
        throw new Error('El código QR no es válido para el negocio de este cliente.'); // Corregido: código, válido
    }
    return customer as ValidCustomer;
};

/**
 * (Helper) Calcula los puntos a otorgar, considerando el multiplicador del tier.
 */
const _calculatePointsEarned = (qrAmount: number, businessConfig: ValidQrCode['business'], customer: ValidCustomer): number => {
    let effectivePoints = qrAmount * businessConfig.pointsPerEuro;
    const multiplierBenefit = customer.currentTier?.benefits.find(b => b.type === 'POINTS_MULTIPLIER');
    if (multiplierBenefit) {
        const multiplier = parseFloat(multiplierBenefit.value);
        if (!isNaN(multiplier) && multiplier > 0) {
            effectivePoints *= multiplier;
            console.log(`[Points SVC Helper] Applied tier multiplier ${multiplier} for user ${customer.id}`);
        } else {
            console.warn(`[Points SVC Helper] Invalid multiplier value '${multiplierBenefit.value}' for tier ${customer.currentTier?.id}`);
        }
    }
    const calculatedPoints = Math.floor(effectivePoints);
    return calculatedPoints < 0 ? 0 : calculatedPoints;
};

/**
 * (Helper) Ejecuta la transacción para actualizar el usuario y el QR.
 */
const _performQrValidationTransaction = async (
    qrCodeId: string,
    customerId: string,
    pointsEarned: number,
    qrAmount: number,
    now: Date
): Promise<{ updatedUserPoints: number; updatedQrPoints: number | null }> => {
    const [updatedUser, updatedQrCodeRecord] = await prisma.$transaction([
        prisma.user.update({
            where: { id: customerId },
            data: {
                points: { increment: pointsEarned },
                lastActivityAt: now,
                totalVisits: { increment: 1 },
                totalSpend: { increment: qrAmount },
                totalPointsEarned: { increment: pointsEarned },
            },
            select: { points: true }
        }),
        prisma.qrCode.update({
            where: { id: qrCodeId },
            data: {
                status: QrCodeStatus.COMPLETED,
                completedAt: now,
                userId: customerId,
                pointsEarned: pointsEarned
            },
            select: { pointsEarned: true }
        })
    ]);
    return { updatedUserPoints: updatedUser.points, updatedQrPoints: updatedQrCodeRecord.pointsEarned };
};


// ==================================
// Funciones de Servicio Exportadas
// ==================================

/**
 * Genera los datos para un nuevo código QR asociado a una transacción.
 */
export const generateQrCodeData = async (businessId: string, amount: number, ticketNumber: string): Promise<{ qrToken: string; amount: number }> => {
    if (amount <= 0 || typeof amount !== 'number') { throw new Error('El importe de la transacción debe ser un número positivo.'); } // Corregido: transacción, número
    const token = uuidv4();
    const expiresAt = addMinutes(new Date(), QR_EXPIRATION_MINUTES);
    try {
        const qrCode = await prisma.qrCode.create({ data: { token, businessId, amount, ticketNumber, expiresAt, status: QrCodeStatus.PENDING }, select: { token: true, amount: true } });
        console.log(`[Points SVC] QR Code generated for business ${businessId} with token ${token} for amount ${amount}, ticket: ${ticketNumber}.`);
        return { qrToken: qrCode.token, amount: qrCode.amount };
    } catch (error: unknown) { console.error('[Points SVC] Error generating QR code data:', error); throw new Error('No se pudieron generar los datos del código QR.'); } // Corregido: código
};


/**
 * Valida un QR token y asigna puntos a un cliente. (Refactorizada)
 */
export const validateQrCode = async (qrToken: string, customerUserId: string): Promise<number> => {
    const now = new Date();
    console.log(`[Points SVC] Validating QR token starting with ${qrToken.substring(0, 5)}... for user ${customerUserId}`);
    try {
        const qrCode = await _findAndValidateQrCodeRecord(qrToken, now);
        console.log(`[Points SVC] QR record ${qrCode.id} found and validated.`);
        const customer = await _findAndValidateCustomerForQr(customerUserId, qrCode.businessId);
        console.log(`[Points SVC] Customer ${customer.id} found and validated.`);
        const calculatedPointsEarned = _calculatePointsEarned(qrCode.amount, qrCode.business, customer);
        console.log(`[Points SVC] Calculated points to earn: ${calculatedPointsEarned}`);
        const { updatedUserPoints, updatedQrPoints } = await _performQrValidationTransaction( qrCode.id, customerUserId, calculatedPointsEarned, qrCode.amount, now );
        console.log(`[Points SVC] Transaction successful. User points: ${updatedUserPoints}. QR points recorded: ${updatedQrPoints}`);
        // Trigger tier update check (async)
        if (qrCode.business.tierSystemEnabled) {
            console.log(`[Points SVC] Triggering tier update for user ${customerUserId} (async)`);
            updateUserTier(customerUserId).catch(err => { console.error(`[Points SVC] Background tier update failed for user ${customerUserId}:`, err); });
        }
        return calculatedPointsEarned;
    } catch (error: unknown) {
         // Corregir mensajes de error con caracteres especiales
        if (error instanceof Error && (
            error.message.startsWith('Código QR inválido') || // Corregido
            error.message.includes('ya ha sido utilizado') ||
            error.message.includes('ha expirado') ||
            error.message.includes('no está disponible para canjear') || // Corregido: está
            error.message.includes('Solo las cuentas de cliente') ||
            error.message.includes('no es válido para el negocio') // Corregido: válido
        )) {
            console.warn(`[Points SVC] Validation failed for token ${qrToken}: ${error.message}`);
            throw error; // Relanzar el error específico
        }
        console.error(`[Points SVC] Unexpected error validating token ${qrToken}:`, error);
        throw new Error('Ocurrió un error interno del servidor durante la validación del QR.'); // Corregido: Ocurrió, validación
    }
};

/**
 * Canjea una recompensa estándar usando los puntos del cliente.
 */
export const redeemReward = async (customerUserId: string, rewardId: string): Promise<RedeemResult> => {
     console.log(`[Points SVC] Redeeming standard reward ${rewardId} for user ${customerUserId}`);
     try {
         const user = await prisma.user.findUniqueOrThrow({ where: { id: customerUserId }, select: { id: true, points: true, businessId: true, role: true, email: true } });
         const reward = await prisma.reward.findUniqueOrThrow({ where: { id: rewardId }, select: { id: true, name: true, pointsCost: true, isActive: true, businessId: true } });
         console.log(`[Points SVC] Found User: ${user.email}, Points: ${user.points}`);
         console.log(`[Points SVC] Found Reward: ${reward.name}, Cost: ${reward.pointsCost}, Active: ${reward.isActive}`);

         if (user.role !== UserRole.CUSTOMER_FINAL) { throw new Error('Rol de usuario inválido para canjear recompensas.'); } // Corregido: inválido
         if (user.businessId !== reward.businessId) { throw new Error('La recompensa no pertenece al negocio del cliente.'); }
         if (!reward.isActive) { throw new Error('Esta recompensa está actualmente inactiva.'); } // Corregido: está
         if (user.points < reward.pointsCost) { throw new Error(`Puntos insuficientes para canjear "${reward.name}". Necesarios: ${reward.pointsCost}, Disponibles: ${user.points}`); }

         console.log(`[Points SVC] Proceeding with transaction for user ${user.id} and reward ${reward.id}`);
         const updatedUser = await prisma.$transaction(async (tx) => {
              const resultUser = await tx.user.update({ where: { id: customerUserId }, data: { points: { decrement: reward.pointsCost } }, select: { id: true, points: true } });
              console.log(`[Points SVC - TX SUCCESS] User ${resultUser.id} redeemed reward '${reward.name}' (${reward.id}) for ${reward.pointsCost} points. New balance: ${resultUser.points}.`);
              return resultUser;
         });

         return { message: `¡Recompensa '${reward.name}' canjeada con éxito!`, newPointsBalance: updatedUser.points }; // Corregido: ¡Recompensa, éxito!
     } catch (error: unknown) {
         console.error(`[Points SVC - ERROR] Failed to redeem reward for user ${customerUserId}, reward ${rewardId}:`, error);
         if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2025') {
             throw new Error('No se encontró el usuario o la recompensa especificada.'); // Corregido: encontró, especificada
         }
         if (error instanceof Error) { throw error; } // Relanzar errores específicos (ej: Puntos insuficientes)
         throw new Error('Ocurrió un error inesperado durante el canje de la recompensa.'); // Corregido: Ocurrió
     }
};


// End of File: backend/src/points/points.service.ts