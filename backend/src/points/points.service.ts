// filename: backend/src/points/points.service.ts
// --- INICIO DEL CÃ“DIGO CORREGIDO ---
// File: backend/src/points/points.service.ts
// Version: 2.0.1 (Fix TS error for TierCalculationBasis import)

import {
    PrismaClient,
    User,
    Reward,
    QrCode,
    Business,
    QrCodeStatus,
    UserRole,
    Prisma, // AÃºn necesario para Prisma.QrCodeWhereInput, etc.
    TierBenefit,
    // --- CORRECCIÃ“N: Importar el Enum directamente ---
    TierCalculationBasis
    // --- FIN CORRECCIÃ“N ---
} from '@prisma/client';
import { v4 as uuidv4 } from 'uuid';
import { addMinutes, isAfter } from 'date-fns';
import { updateUserTier } from '../tiers/tier-logic.service';

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
        // --- CORRECCIÃ“N: Usar el Enum importado ---
        tierCalculationBasis: TierCalculationBasis | null;
        // --- FIN CORRECCIÃ“N ---
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
// (Las funciones _findAndValidateQrCodeRecord, _findAndValidateCustomerForQr,
//  _calculatePointsEarned, _performQrValidationTransaction no necesitan cambios
//  respecto a la versiÃ³n 2.0.0 que te pasÃ© antes)

/**
 * (Helper) Busca y valida un registro QrCode.
 * @throws Error si no se encuentra, ya estÃ¡ usado o ha expirado.
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
    if (!qrCode) { throw new Error('CÃ³digo QR invÃ¡lido.'); }
    if (qrCode.status !== QrCodeStatus.PENDING) {
        if (qrCode.status === QrCodeStatus.COMPLETED) throw new Error('El cÃ³digo QR ya ha sido utilizado.');
        if (qrCode.status === QrCodeStatus.EXPIRED) throw new Error('El cÃ³digo QR ha expirado.');
        throw new Error('El cÃ³digo QR no estÃ¡ disponible para canjear.');
    }
    if (isAfter(now, qrCode.expiresAt)) {
        try {
            await prisma.qrCode.update({ where: { id: qrCode.id }, data: { status: QrCodeStatus.EXPIRED } });
            console.log(`[Points SVC Helper] QR code ${qrToken} marked as EXPIRED.`);
        } catch (updateError) {
            console.error(`[Points SVC Helper] Failed to update QR status to EXPIRED for token ${qrToken}:`, updateError);
        }
        throw new Error('El cÃ³digo QR ha expirado.');
    }
    if (!qrCode.business) {
        console.error(`[Points SVC Helper] QR code ${qrCode.id} has no associated business!`);
        throw new Error('Error interno: El QR no estÃ¡ asociado a un negocio.');
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
        throw new Error('Solo las cuentas de cliente pueden canjear cÃ³digos QR.');
    }
    if (customer.businessId !== qrCodeBusinessId) {
        throw new Error('El cÃ³digo QR no es vÃ¡lido para el negocio de este cliente.');
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
 * (Helper) Ejecuta la transacciÃ³n para actualizar el usuario y el QR.
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
 * Genera los datos para un nuevo cÃ³digo QR asociado a una transacciÃ³n.
 */
export const generateQrCodeData = async (businessId: string, amount: number, ticketNumber: string): Promise<{ qrToken: string; amount: number }> => {
    // ... (sin cambios respecto a v2.0.0) ...
    if (amount <= 0 || typeof amount !== 'number') { throw new Error('El importe de la transacciÃ³n debe ser un nÃºmero positivo.'); }
    const token = uuidv4();
    const expiresAt = addMinutes(new Date(), QR_EXPIRATION_MINUTES);
    try {
        const qrCode = await prisma.qrCode.create({ data: { token, businessId, amount, ticketNumber, expiresAt, status: QrCodeStatus.PENDING }, select: { token: true, amount: true } });
        console.log(`[Points SVC] QR Code generated for business ${businessId} with token ${token} for amount ${amount}, ticket: ${ticketNumber}.`);
        return { qrToken: qrCode.token, amount: qrCode.amount };
    } catch (error: unknown) { console.error('[Points SVC] Error generating QR code data:', error); throw new Error('No se pudieron generar los datos del cÃ³digo QR.'); }
};


/**
 * Valida un QR token y asigna puntos a un cliente. (Refactorizada)
 */
export const validateQrCode = async (qrToken: string, customerUserId: string): Promise<number> => {
    // ... (sin cambios en la lÃ³gica principal respecto a v2.0.0, solo usa los helpers) ...
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
        if (qrCode.business.tierSystemEnabled) {
            console.log(`[Points SVC] Triggering tier update for user ${customerUserId} (async)`);
            updateUserTier(customerUserId).catch(err => { console.error(`[Points SVC] Background tier update failed for user ${customerUserId}:`, err); });
        }
        return calculatedPointsEarned;
    } catch (error: unknown) {
        if (error instanceof Error && ( error.message.startsWith('CÃ³digo QR invÃ¡lido') || error.message.includes('ya ha sido utilizado') || error.message.includes('ha expirado') || error.message.includes('no estÃ¡ disponible para canjear') || error.message.includes('Solo las cuentas de cliente') || error.message.includes('no es vÃ¡lido para el negocio') )) { console.warn(`[Points SVC] Validation failed for token ${qrToken}: ${error.message}`); throw error; }
        console.error(`[Points SVC] Unexpected error validating token ${qrToken}:`, error); throw new Error('OcurriÃ³ un error interno del servidor durante la validaciÃ³n del QR.');
    }
};

/**
 * Canjea una recompensa estÃ¡ndar usando los puntos del cliente.
 */
export const redeemReward = async (customerUserId: string, rewardId: string): Promise<RedeemResult> => {
    // ... (sin cambios respecto a v2.0.0) ...
     console.log(`[Points SVC] Redeeming standard reward ${rewardId} for user ${customerUserId}`);
     try {
         const user = await prisma.user.findUniqueOrThrow({ where: { id: customerUserId }, select: { id: true, points: true, businessId: true, role: true, email: true } });
         const reward = await prisma.reward.findUniqueOrThrow({ where: { id: rewardId }, select: { id: true, name: true, pointsCost: true, isActive: true, businessId: true } });
         console.log(`[Points SVC] Found User: ${user.email}, Points: ${user.points}`);
         console.log(`[Points SVC] Found Reward: ${reward.name}, Cost: ${reward.pointsCost}, Active: ${reward.isActive}`);
         if (user.role !== UserRole.CUSTOMER_FINAL) { throw new Error('Rol de usuario invÃ¡lido para canjear recompensas.'); }
         if (user.businessId !== reward.businessId) { throw new Error('La recompensa no pertenece al negocio del cliente.'); }
         if (!reward.isActive) { throw new Error('Esta recompensa estÃ¡ actualmente inactiva.'); }
         if (user.points < reward.pointsCost) { throw new Error(`Puntos insuficientes para canjear "${reward.name}". Necesarios: ${reward.pointsCost}, Disponibles: ${user.points}`); }
         console.log(`[Points SVC] Proceeding with transaction for user ${user.id} and reward ${reward.id}`);
         const updatedUser = await prisma.$transaction(async (tx) => {
             const resultUser = await tx.user.update({ where: { id: customerUserId }, data: { points: { decrement: reward.pointsCost } }, select: { id: true, points: true } });
             console.log(`[Points SVC - TX SUCCESS] User ${resultUser.id} redeemed reward '${reward.name}' (${reward.id}) for ${reward.pointsCost} points. New balance: ${resultUser.points}.`);
             return resultUser;
         });
         return { message: `Â¡Recompensa '${reward.name}' canjeada con Ã©xito!`, newPointsBalance: updatedUser.points };
     } catch (error: unknown) {
         console.error(`[Points SVC - ERROR] Failed to redeem reward for user ${customerUserId}, reward ${rewardId}:`, error);
         if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2025') { throw new Error('No se encontrÃ³ el usuario o la recompensa especificada.'); }
         if (error instanceof Error) { throw error; }
         throw new Error('OcurriÃ³ un error inesperado durante el canje de la recompensa.');
     }
};


// End of File: backend/src/points/points.service.ts
// --- FIN DEL CÃ“DIGO CORREGIDO ---