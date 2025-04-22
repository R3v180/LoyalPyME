// File: backend/src/points/points.service.ts
// Version: 1.0.4 (Make ticketNumber mandatory)

import { PrismaClient, QrCode, User, Business, QrCodeStatus, UserRole, Prisma } from '@prisma/client';
import { v4 as uuidv4 } from 'uuid';
import { addMinutes, isAfter } from 'date-fns';

const prisma = new PrismaClient();
const QR_EXPIRATION_MINUTES = 30;

/**
 * Generates QR code data for a new points transaction.
 * @param businessId - The ID of the business generating the QR.
 * @param amount - The transaction amount.
 * @param ticketNumber - The ticket number (NOW MANDATORY).
 * @returns A promise that resolves with QR token and amount.
 */
 // --- CAMBIO: ticketNumber ya no es opcional (sin ?) ---
export const generateQrCodeData = async (businessId: string, amount: number, ticketNumber: string): Promise<{ qrToken: string; amount: number }> => {
    // --- FIN CAMBIO ---

    if (amount <= 0 || typeof amount !== 'number') {
        throw new Error('Transaction amount must be a positive number.');
    }
    // Ya no necesitamos validar ticketNumber aquí porque el controlador lo hace
    // y Prisma fallaría si fuera null/undefined/vacío al ser NOT NULL en la BD.

    const token = uuidv4();
    const expiresAt = addMinutes(new Date(), QR_EXPIRATION_MINUTES);

    try {
        const qrCode = await prisma.qrCode.create({
            data: {
                token: token,
                businessId: businessId,
                amount: amount,
                // --- CAMBIO: Pasamos ticketNumber directamente (ya no puede ser undefined) ---
                ticketNumber: ticketNumber,
                // --- FIN CAMBIO ---
                expiresAt: expiresAt,
                status: QrCodeStatus.PENDING,
            },
             select: {
                 token: true,
                 amount: true
             }
        });

        console.log(`QR Code generated for business ${businessId} with token ${token} for amount ${amount}, ticket: ${ticketNumber}.`); // Log actualizado

        return { qrToken: qrCode.token, amount: qrCode.amount };

    } catch (error: unknown) {
        console.error('Error generating QR code data:', error);
        if (error instanceof Prisma.PrismaClientKnownRequestError) {
            console.error('Prisma error generating QR code:', error.message);
        }
         if (error instanceof Error) {
             console.error('General error generating QR code:', error.message);
         }
        throw new Error('Could not generate QR code data.');
    }
};

/**
 * Validates a QR token and assigns points to a customer.
 * (No changes needed in this function for making ticketNumber mandatory in generation)
 * @param qrToken - The token scanned from the QR code.
 * @param customerUserId - The ID of the customer user redeeming the QR.
 * @returns A promise that resolves with the number of points awarded.
 * @throws Error if validation fails.
 */
export const validateQrCode = async (qrToken: string, customerUserId: string): Promise<number> => {
    const now = new Date();

    try {
        // 1. Buscar el QrCode
        const qrCode = await prisma.qrCode.findUnique({
            where: { token: qrToken },
            include: { business: { select: { pointsPerEuro: true, id: true } } }
        });

        if (!qrCode) { throw new Error('Invalid QR code.'); }

        // 2. Verificar estado PENDING
        if (qrCode.status !== QrCodeStatus.PENDING) {
             if (qrCode.status === QrCodeStatus.COMPLETED) { throw new Error('QR code has already been used.'); }
             if (qrCode.status === QrCodeStatus.EXPIRED) { throw new Error('QR code has expired.'); }
             throw new Error('QR code is not available for redemption.');
        }

        // 3. Verificar expiración
        if (isAfter(now, qrCode.expiresAt)) {
             try { await prisma.qrCode.update({ where: { id: qrCode.id }, data: { status: QrCodeStatus.EXPIRED } }); }
             catch (updateError: unknown) { console.error('Failed to update QR status to EXPIRED:', updateError instanceof Error ? updateError.message : updateError); }
            throw new Error('QR code has expired.');
        }

        // 4. Buscar cliente y verificar rol y negocio
        const customer = await prisma.user.findUnique({
            where: { id: customerUserId, role: UserRole.CUSTOMER_FINAL },
             select: { id: true, points: true, businessId: true, role: true }
        });

        if (!customer || customer.role !== UserRole.CUSTOMER_FINAL) { throw new Error('Only customer accounts can redeem QR codes.'); }
        if (customer.businessId !== qrCode.businessId) { throw new Error('QR code is not valid for this customer\'s business.'); }

        // 5. Calcular puntos
        const pointsPerEuro = qrCode.business.pointsPerEuro;
        const pointsEarned = Math.floor(qrCode.amount * pointsPerEuro);

        if (pointsEarned <= 0) { throw new Error('No points earned for this transaction amount.'); }

        // 6. Transacción atómica para actualizar puntos y QR
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

// End of File: backend/src/points/points.service.ts