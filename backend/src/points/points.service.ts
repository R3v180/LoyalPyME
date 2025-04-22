// File: backend/src/points/points.service.ts
// Version: 1.2.0 (Implement redeemReward logic)

import { PrismaClient, User, Reward, QrCode, Business, QrCodeStatus, UserRole, Prisma } from '@prisma/client'; // Aseguramos todas las importaciones necesarias
import { v4 as uuidv4 } from 'uuid';
import { addMinutes, isAfter } from 'date-fns';

const prisma = new PrismaClient();
const QR_EXPIRATION_MINUTES = 30;

// --- Interfaz para el resultado del canje ---
interface RedeemResult {
    message: string;
    newPointsBalance: number;
}

/**
 * Generates QR code data for a new points transaction.
 * (No changes in this function)
 */
export const generateQrCodeData = async (businessId: string, amount: number, ticketNumber: string): Promise<{ qrToken: string; amount: number }> => {
    if (amount <= 0 || typeof amount !== 'number') {
        throw new Error('Transaction amount must be a positive number.');
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
        // Add detailed logging if needed
        throw new Error('Could not generate QR code data.');
    }
};

/**
 * Validates a QR token and assigns points to a customer.
 * (No changes in this function)
 */
export const validateQrCode = async (qrToken: string, customerUserId: string): Promise<number> => {
    const now = new Date();
    try {
        const qrCode = await prisma.qrCode.findUnique({
            where: { token: qrToken },
            include: { business: { select: { pointsPerEuro: true, id: true } } }
        });
        if (!qrCode) { throw new Error('Invalid QR code.'); }
        if (qrCode.status !== QrCodeStatus.PENDING) {
            if (qrCode.status === QrCodeStatus.COMPLETED) { throw new Error('QR code has already been used.'); }
            if (qrCode.status === QrCodeStatus.EXPIRED) { throw new Error('QR code has expired.'); }
            throw new Error('QR code is not available for redemption.');
        }
        if (isAfter(now, qrCode.expiresAt)) {
            try { await prisma.qrCode.update({ where: { id: qrCode.id }, data: { status: QrCodeStatus.EXPIRED } }); } catch (updateError) { console.error('Failed to update QR status to EXPIRED:', updateError); }
            throw new Error('QR code has expired.');
        }
        const customer = await prisma.user.findUnique({
            where: { id: customerUserId, role: UserRole.CUSTOMER_FINAL },
            select: { id: true, points: true, businessId: true, role: true }
        });
        if (!customer || customer.role !== UserRole.CUSTOMER_FINAL) { throw new Error('Only customer accounts can redeem QR codes.'); }
        if (customer.businessId !== qrCode.businessId) { throw new Error('QR code is not valid for this customer\'s business.'); }
        const pointsPerEuro = qrCode.business.pointsPerEuro;
        const pointsEarned = Math.floor(qrCode.amount * pointsPerEuro);
        if (pointsEarned <= 0) { throw new Error('No points earned for this transaction amount.'); }
        const [updatedUser, updatedQrCodeRecord] = await prisma.$transaction([
            prisma.user.update({ where: { id: customer.id }, data: { points: customer.points + pointsEarned }, select: { id: true, points: true } }),
            prisma.qrCode.update({ where: { id: qrCode.id }, data: { status: QrCodeStatus.COMPLETED, completedAt: now }, select: { id: true, status: true, completedAt: true } })
        ]);
        console.log(`QR token ${qrToken} validated successfully. Assigned ${pointsEarned} points to user ${customerUserId}. User now has ${updatedUser.points} points.`);
        return pointsEarned;
    } catch (error: unknown) {
        if (error instanceof Error) { console.error('QR validation failed (custom error):', error.message); throw error; }
        console.error('Server error during QR validation (unexpected):', error);
        throw new Error('An internal server error occurred during QR validation.');
    }
};

// --- CAMBIO: Implementar lógica de redeemReward ---
/**
 * Handles the logic for a customer redeeming a reward with their points.
 * @param customerUserId - The ID of the customer attempting to redeem.
 * @param rewardId - The ID of the reward to be redeemed.
 * @returns A promise that resolves with relevant data on success (e.g., updated points).
 * @throws Error if redemption fails (e.g., insufficient points, reward not found/inactive).
 */
export const redeemReward = async (customerUserId: string, rewardId: string): Promise<RedeemResult> => {
    console.log(`[REDEEM SVC] Service function called for user ${customerUserId} and reward ${rewardId}`);

    try {
        // 1. Buscar Usuario (asegurando rol) y Recompensa simultáneamente (o secuencialmente si prefieres)
        // Usamos findUniqueOrThrow para simplificar manejo si no existen
        const user = await prisma.user.findUniqueOrThrow({
            where: { id: customerUserId },
            select: { id: true, points: true, businessId: true, role: true } // Incluimos rol para asegurar
        });

        const reward = await prisma.reward.findUniqueOrThrow({
            where: { id: rewardId },
            select: { id: true, name: true, pointsCost: true, isActive: true, businessId: true }
        });

        console.log(`[REDEEM SVC] Found User: ${user.id}, Points: ${user.points}`);
        console.log(`[REDEEM SVC] Found Reward: ${reward.id}, Cost: ${reward.pointsCost}, Active: ${reward.isActive}`);

        // 2. Validaciones
        if (user.role !== UserRole.CUSTOMER_FINAL) {
            // Esto no debería pasar si el middleware/controller funciona, pero es una salvaguarda
            throw new Error('Invalid user role for redeeming rewards.');
        }
        if (user.businessId !== reward.businessId) {
            throw new Error('Reward does not belong to the customer\'s business.');
        }
        if (!reward.isActive) {
            throw new Error('This reward is currently inactive.');
        }
        if (user.points < reward.pointsCost) {
            throw new Error(`Insufficient points to redeem this reward. Required: ${reward.pointsCost}, Available: ${user.points}`);
        }

        // 3. Transacción Prisma para restar puntos
        console.log(`[REDEEM SVC] Proceeding with transaction for user ${user.id} and reward ${reward.id}`);
        const updatedUser = await prisma.$transaction(async (tx) => {
            // a. Restar puntos
            const resultUser = await tx.user.update({
                where: { id: customerUserId },
                data: { points: { decrement: reward.pointsCost } },
                select: { id: true, points: true } // Devolver usuario actualizado con nuevos puntos
            });

            // b. Registrar canje (log)
            console.log(`[REDEEM SVC - TX SUCCESS] User ${resultUser.id} redeemed reward '${reward.name}' (${reward.id}) for ${reward.pointsCost} points. New balance: ${resultUser.points}.`);

            // c. (Opcional) Aquí podríamos crear un registro en una tabla 'Redemptions' si existiera
            // await tx.redemption.create({ data: { userId: user.id, rewardId: reward.id, pointsSpent: reward.pointsCost } });

            return resultUser; // Devolvemos el usuario actualizado de la transacción
        });

        // 4. Respuesta exitosa
        return {
            message: `Reward '${reward.name}' redeemed successfully!`,
            newPointsBalance: updatedUser.points
        };

    } catch (error: unknown) {
        console.error(`[REDEEM SVC - ERROR] Failed to redeem reward for user ${customerUserId}, reward ${rewardId}:`, error);

        // Re-lanzar errores específicos de Prisma o validaciones para que el controlador los maneje
        if (error instanceof Prisma.PrismaClientKnownRequestError) {
             // Error específico de Prisma (ej: P2025 Record not found por findUniqueOrThrow)
            throw new Error(`Database error during redemption: ${error.message}`);
        }
        if (error instanceof Error) {
             // Errores de validación lanzados manualmente
             throw error;
        }

        // Error genérico si no es uno de los anteriores
        throw new Error('An unexpected error occurred during reward redemption.');
    }
};
// --- FIN CAMBIO ---

// End of File: backend/src/points/points.service.ts