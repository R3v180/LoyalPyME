// File: backend/src/points/points.service.ts
// Version: 1.2.1 (Translate user-facing messages)

import { PrismaClient, User, Reward, QrCode, Business, QrCodeStatus, UserRole, Prisma } from '@prisma/client';
import { v4 as uuidv4 } from 'uuid';
import { addMinutes, isAfter } from 'date-fns';

const prisma = new PrismaClient();
const QR_EXPIRATION_MINUTES = 30;

interface RedeemResult {
    message: string;
    newPointsBalance: number;
}

/**
 * Generates QR code data for a new points transaction.
 */
export const generateQrCodeData = async (businessId: string, amount: number, ticketNumber: string): Promise<{ qrToken: string; amount: number }> => {
    // Traducción de errores internos/de validación
    if (amount <= 0 || typeof amount !== 'number') {
        throw new Error('El importe de la transacción debe ser un número positivo.');
    }
    // ticketNumber es validado en controller y BD

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
        // Traducción de error genérico
        throw new Error('No se pudieron generar los datos del código QR.');
    }
};

/**
 * Validates a QR token and assigns points to a customer.
 */
export const validateQrCode = async (qrToken: string, customerUserId: string): Promise<number> => {
    const now = new Date();
    try {
        const qrCode = await prisma.qrCode.findUnique({
            where: { token: qrToken },
            include: { business: { select: { pointsPerEuro: true, id: true } } }
        });

        // Traducción de errores de validación de QR
        if (!qrCode) { throw new Error('Código QR inválido.'); }
        if (qrCode.status !== QrCodeStatus.PENDING) {
            if (qrCode.status === QrCodeStatus.COMPLETED) { throw new Error('El código QR ya ha sido utilizado.'); }
            if (qrCode.status === QrCodeStatus.EXPIRED) { throw new Error('El código QR ha expirado.'); }
            throw new Error('El código QR no está disponible para canjear.');
        }
        if (isAfter(now, qrCode.expiresAt)) {
            try { await prisma.qrCode.update({ where: { id: qrCode.id }, data: { status: QrCodeStatus.EXPIRED } }); }
            catch (updateError) { console.error('Failed to update QR status to EXPIRED:', updateError); }
            throw new Error('El código QR ha expirado.');
        }

        const customer = await prisma.user.findUnique({
            where: { id: customerUserId, role: UserRole.CUSTOMER_FINAL },
            select: { id: true, points: true, businessId: true, role: true }
        });

        // Traducción de errores de validación de cliente/negocio
        if (!customer || customer.role !== UserRole.CUSTOMER_FINAL) { throw new Error('Solo las cuentas de cliente pueden canjear códigos QR.'); }
        if (customer.businessId !== qrCode.businessId) { throw new Error('El código QR no es válido para el negocio de este cliente.'); }

        const pointsPerEuro = qrCode.business.pointsPerEuro;
        const pointsEarned = Math.floor(qrCode.amount * pointsPerEuro);

        // Traducción de error de puntos
        if (pointsEarned <= 0) { throw new Error('No se han ganado puntos para este importe de transacción.'); }

        const [updatedUser, updatedQrCodeRecord] = await prisma.$transaction([
            prisma.user.update({ where: { id: customer.id }, data: { points: customer.points + pointsEarned }, select: { id: true, points: true } }),
            prisma.qrCode.update({ where: { id: qrCode.id }, data: { status: QrCodeStatus.COMPLETED, completedAt: now }, select: { id: true, status: true, completedAt: true } })
        ]);

        console.log(`QR token ${qrToken} validated successfully. Assigned ${pointsEarned} points to user ${customerUserId}. User now has ${updatedUser.points} points.`);
        return pointsEarned; // No se devuelve mensaje aquí, se construye en controller

    } catch (error: unknown) {
        // Relanzar errores específicos traducidos o mantener mensaje original
        if (error instanceof Error) {
             console.error('QR validation failed (custom error):', error.message);
             throw error; // Mantenemos el mensaje específico del error que ocurrió
        }
         console.error('Server error during QR validation (unexpected):', error);
         // Traducción de error genérico
         throw new Error('Ocurrió un error interno del servidor durante la validación del QR.');
    }
};


/**
 * Handles the logic for a customer redeeming a reward with their points.
 */
export const redeemReward = async (customerUserId: string, rewardId: string): Promise<RedeemResult> => {
    console.log(`[REDEEM SVC] Service function called for user ${customerUserId} and reward ${rewardId}`);
    try {
        const user = await prisma.user.findUniqueOrThrow({
            where: { id: customerUserId },
            select: { id: true, points: true, businessId: true, role: true }
        });

        const reward = await prisma.reward.findUniqueOrThrow({
            where: { id: rewardId },
            select: { id: true, name: true, pointsCost: true, isActive: true, businessId: true }
        });

        console.log(`[REDEEM SVC] Found User: ${user.id}, Points: ${user.points}`);
        console.log(`[REDEEM SVC] Found Reward: ${reward.id}, Cost: ${reward.pointsCost}, Active: ${reward.isActive}`);

        // Traducción de errores de validación de canje
        if (user.role !== UserRole.CUSTOMER_FINAL) {
            throw new Error('Rol de usuario inválido para canjear recompensas.');
        }
        if (user.businessId !== reward.businessId) {
            throw new Error('La recompensa no pertenece al negocio del cliente.');
        }
        if (!reward.isActive) {
            throw new Error('Esta recompensa está actualmente inactiva.');
        }
        if (user.points < reward.pointsCost) {
            throw new Error(`Puntos insuficientes para canjear esta recompensa. Necesarios: ${reward.pointsCost}, Disponibles: ${user.points}`);
        }

        console.log(`[REDEEM SVC] Proceeding with transaction for user ${user.id} and reward ${reward.id}`);
        const updatedUser = await prisma.$transaction(async (tx) => {
            const resultUser = await tx.user.update({
                where: { id: customerUserId },
                data: { points: { decrement: reward.pointsCost } },
                select: { id: true, points: true }
            });
            console.log(`[REDEEM SVC - TX SUCCESS] User ${resultUser.id} redeemed reward '${reward.name}' (${reward.id}) for ${reward.pointsCost} points. New balance: ${resultUser.points}.`);
            return resultUser;
        });

        // --- CAMBIO: Mensaje de éxito traducido ---
        return {
            message: `¡Recompensa '${reward.name}' canjeada con éxito!`,
            newPointsBalance: updatedUser.points
        };
        // --- FIN CAMBIO ---

    } catch (error: unknown) {
        console.error(`[REDEEM SVC - ERROR] Failed to redeem reward for user ${customerUserId}, reward ${rewardId}:`, error);

        if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2025') {
             // Error específico si findUniqueOrThrow no encuentra algo
             throw new Error('No se encontró el usuario o la recompensa especificada.'); // Traducido
        }
        // Relanzar otros errores específicos traducidos o mantener mensaje original
        if (error instanceof Error) {
            throw error; // Mantenemos el mensaje específico del error que ocurrió (ej. "Puntos insuficientes...")
        }

        // Traducción de error genérico
        throw new Error('Ocurrió un error inesperado durante el canje de la recompensa.');
    }
};

// End of File: backend/src/points/points.service.ts