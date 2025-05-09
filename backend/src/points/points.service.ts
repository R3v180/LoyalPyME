// backend/src/points/points.service.ts
import {
    PrismaClient,
    User,
    Reward,
    QrCode,
    Business, // Asegúrate que Business está importado si lo usas directamente en tipos
    QrCodeStatus,
    UserRole,
    Prisma,
    TierBenefit,
    TierCalculationBasis,
    // Tier, // Tier no se usa directamente en este archivo
    // TierDowngradePolicy, // No se usa directamente
    ActivityType
} from '@prisma/client';
import { v4 as uuidv4 } from 'uuid';
import { addMinutes, isAfter } from 'date-fns';
import { updateUserTier } from '../tiers/tier-logic.service';

const prisma = new PrismaClient();
const QR_EXPIRATION_MINUTES = 30; // O lee de config si es dinámico por negocio

// Tipos y Interfaces
interface RedeemResult {
    message: string;
    newPointsBalance: number;
}

// Tipo para el resultado de QR validado, incluyendo datos del usuario actualizados
export interface ValidateQrResult {
    pointsEarned: number;
    updatedUser: { // Estructura devuelta al frontend
        id: string;
        points: number;
        totalSpend: number; // Asegurar que este campo se actualiza y devuelve
        totalVisits: number; // Asegurar que este campo se actualiza y devuelve
        currentTierId: string | null;
        currentTierName: string | null; // Nombre del tier
    };
}


// Tipos internos para helpers
type ValidQrCode = QrCode & {
    business: Pick<Business, 'id' | 'pointsPerEuro' | 'tierSystemEnabled' | 'tierCalculationBasis'>; // Ajustado
    ticketNumber: string; // Asegurar que no sea null
};

type ValidCustomer = User & {
    currentTier: ({ benefits: TierBenefit[] } & { id: string; name: string }) | null;
    businessId: string; // <--- Aseguramos que aquí businessId NO es null
};


// ==============================================
// HELPER FUNCTIONS for validateQrCode (Internal)
// ==============================================

const _findAndValidateQrCodeRecord = async (qrToken: string, now: Date): Promise<ValidQrCode> => {
    const qrCode = await prisma.qrCode.findUnique({
        where: { token: qrToken },
        include: {
            business: { // Seleccionar solo lo necesario de business
                select: { id: true, pointsPerEuro: true, tierSystemEnabled: true, tierCalculationBasis: true }
            }
        }
    });

    if (!qrCode) { throw new Error('Código QR inválido.'); }
    if (qrCode.status !== QrCodeStatus.PENDING) {
        if (qrCode.status === QrCodeStatus.COMPLETED) throw new Error('El código QR ya ha sido utilizado.');
        if (qrCode.status === QrCodeStatus.EXPIRED) throw new Error('El código QR ha expirado.');
        throw new Error('El código QR no está disponible para canjear.');
    }
    if (isAfter(now, qrCode.expiresAt)) {
        try {
            await prisma.qrCode.update({ where: { id: qrCode.id }, data: { status: QrCodeStatus.EXPIRED } });
            console.log(`[Points SVC Helper] QR code ${qrToken} marked as EXPIRED.`);
        } catch (updateError) {
            console.error(`[Points SVC Helper] Failed to update QR status to EXPIRED for token ${qrToken}:`, updateError);
        }
        throw new Error('El código QR ha expirado.');
    }
    if (!qrCode.business) {
        console.error(`[Points SVC Helper] QR code ${qrCode.id} has no associated business!`);
        throw new Error('Error interno: El QR no está asociado a un negocio.');
    }
    if (qrCode.ticketNumber === null) { // Aunque el schema lo hace no-nulo, una verificación extra no daña
        console.error(`[Points SVC Helper] QR code ${qrCode.id} has null ticketNumber!`);
        throw new Error('Error interno: Falta número de ticket en QR.');
    }
    return qrCode as ValidQrCode; // Casteo seguro después de las validaciones
};

const _findAndValidateCustomerForQr = async (userId: string, qrCodeBusinessId: string): Promise<ValidCustomer> => {
    const customer = await prisma.user.findUnique({
        where: { id: userId },
        include: { currentTier: { include: { benefits: { where: { isActive: true } } } } }
    });

    if (!customer || customer.role !== UserRole.CUSTOMER_FINAL) {
        throw new Error('Solo las cuentas de cliente pueden canjear códigos QR.');
    }
    if (!customer.businessId) { // <--- AÑADIDA ESTA VALIDACIÓN
        console.error(`[Points SVC Helper] Customer ${userId} has no businessId! This should not happen for CUSTOMER_FINAL.`);
        throw new Error('Error interno: El cliente no está asociado a ningún negocio.');
    }
    if (customer.businessId !== qrCodeBusinessId) {
        throw new Error('El código QR no es válido para el negocio de este cliente.');
    }
    return customer as ValidCustomer; // Casteo seguro
};

const _calculatePointsEarned = (qrAmount: number, businessConfig: ValidQrCode['business'], customer: ValidCustomer): number => {
    let effectivePoints = qrAmount * (businessConfig.pointsPerEuro ?? 1); // Usar 1 si pointsPerEuro es null/undefined
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
    return calculatedPoints < 0 ? 0 : calculatedPoints; // Asegurar que no sean negativos
};

const _performQrValidationTransaction = async (
    tx: Prisma.TransactionClient,
    qrCode: ValidQrCode,
    customerId: string, // Este es el ID del usuario que validó
    customerBusinessId: string, // <--- AÑADIDO: El businessId del cliente que validó
    pointsEarned: number,
    now: Date
): Promise<void> => {
    await tx.user.update({
        where: { id: customerId },
        data: {
            points: { increment: pointsEarned },
            lastActivityAt: now,
            totalVisits: { increment: 1 },
            totalSpend: { increment: qrCode.amount },
        },
    });
    await tx.qrCode.update({
        where: { id: qrCode.id },
        data: {
            status: QrCodeStatus.COMPLETED,
            completedAt: now,
            userId: customerId,
            pointsEarned: pointsEarned
        },
    });

    // --- CORRECCIÓN EN ActivityLog ---
    await tx.activityLog.create({
        data: {
            userId: customerId,
            // businessId de la actividad debe ser el del negocio del cliente,
            // que ya validamos que es el mismo que el del QR.
            businessId: customerBusinessId, // <--- USAR EL businessId DEL CLIENTE
            type: ActivityType.POINTS_EARNED_QR,
            pointsChanged: pointsEarned,
            description: qrCode.ticketNumber, // ticketNumber ahora es string
            relatedQrId: qrCode.id,
        }
    });
    // --- FIN CORRECCIÓN ---
    console.log(`[Points SVC Helper TX] User, QR, and ActivityLog updated for QR ${qrCode.id}`);
};


// ==================================
// Funciones de Servicio Exportadas
// ==================================

export const generateQrCodeData = async (businessId: string, amount: number, ticketNumber: string): Promise<{ qrToken: string; amount: number }> => {
    if (amount <= 0 || typeof amount !== 'number') {
        throw new Error('El importe de la transacción debe ser un número positivo.');
    }
    const token = uuidv4();
    const expiresAt = addMinutes(new Date(), QR_EXPIRATION_MINUTES); // Considerar usar qrCodeExpirationMinutes del Business
    try {
        const qrCode = await prisma.qrCode.create({
            data: { token, businessId, amount, ticketNumber, expiresAt, status: QrCodeStatus.PENDING },
            select: { token: true, amount: true }
        });
        console.log(`[Points SVC] QR Code generated for business ${businessId} with token ${token} for amount ${amount}, ticket: ${ticketNumber}.`);
        return { qrToken: qrCode.token, amount: qrCode.amount };
    } catch (error: unknown) {
        console.error('[Points SVC] Error generating QR code data:', error);
        throw new Error('No se pudieron generar los datos del código QR.');
    }
};


export const validateQrCode = async (qrToken: string, customerUserId: string): Promise<ValidateQrResult> => {
    const now = new Date();
    console.log(`[Points SVC] Validating QR token starting with ${qrToken.substring(0, 5)}... for user ${customerUserId}`);
    try {
        const qrCode = await _findAndValidateQrCodeRecord(qrToken, now);
        const customer = await _findAndValidateCustomerForQr(customerUserId, qrCode.businessId); // customer.businessId aquí NO es null
        const calculatedPointsEarned = _calculatePointsEarned(qrCode.amount, qrCode.business, customer);

        await prisma.$transaction(async (tx) => {
            // Pasamos customer.businessId (que sabemos que no es null)
            await _performQrValidationTransaction(
                tx,
                qrCode,
                customerUserId,
                customer.businessId, // <--- PASAR EL businessId del cliente
                calculatedPointsEarned,
                now
            );
        });
        console.log(`[Points SVC] Transaction successful for QR ${qrCode.id} and user ${customerUserId}.`);

        // Lógica de actualización de Tier (sin cambios)
        if (qrCode.business.tierSystemEnabled) {
            console.log(`[Points SVC] Triggering tier update for user ${customerUserId} (async)`);
            updateUserTier(customerUserId).catch(err => {
                console.error(`[Points SVC] Background tier update failed for user ${customerUserId}:`, err);
            });
        }

        // Esperar un poco para que la actualización de tier se refleje si es síncrona (no es el caso ideal)
        // O mejor, el updateUserTier debería devolver el usuario actualizado o refetchear aquí.
        // Por ahora, un pequeño delay puede ayudar en algunos casos de prueba, pero no es robusto.
        // await new Promise(resolve => setTimeout(resolve, 150)); // Considerar quitar esto

        const updatedUserData = await prisma.user.findUniqueOrThrow({
            where: { id: customerUserId },
            select: {
                id: true,
                points: true,
                totalSpend: true,
                totalVisits: true,
                currentTierId: true,
                currentTier: { select: { name: true } }
            }
        });
        console.log(`[Points SVC] Fetched latest user data post-validation for ${customerUserId}: TierId=${updatedUserData.currentTierId}`);

        return {
            pointsEarned: calculatedPointsEarned,
            updatedUser: {
                id: updatedUserData.id,
                points: updatedUserData.points,
                totalSpend: updatedUserData.totalSpend ?? 0,
                totalVisits: updatedUserData.totalVisits ?? 0,
                currentTierId: updatedUserData.currentTierId,
                currentTierName: updatedUserData.currentTier?.name ?? null
            }
        };
    } catch (error: unknown) {
        // ... (manejo de errores sin cambios) ...
        if (error instanceof Error && (
            error.message.startsWith('Código QR inválido') ||
            error.message.includes('ya ha sido utilizado') ||
            error.message.includes('ha expirado') ||
            error.message.includes('no está disponible para canjear') ||
            error.message.includes('Solo las cuentas de cliente') ||
            error.message.includes('no es válido para el negocio')
        )) {
            console.warn(`[Points SVC] Validation failed for token ${qrToken}: ${error.message}`);
            throw error; // Relanzar el error específico para el controlador
        }
        console.error(`[Points SVC] Unexpected error validating token ${qrToken}:`, error);
        throw new Error('Ocurrió un error interno del servidor durante la validación del QR.');
    }
};


export const redeemReward = async (customerUserId: string, rewardId: string): Promise<RedeemResult> => {
    console.log(`[Points SVC] Redeeming standard reward ${rewardId} for user ${customerUserId}`);
    try {
        const user = await prisma.user.findUniqueOrThrow({
            where: { id: customerUserId },
            select: { id: true, points: true, businessId: true, role: true }
        });

        if (!user.businessId) { // <--- CHEQUEO IMPORTANTE
            console.error(`[Points SVC] Customer ${customerUserId} attempting to redeem reward but has no businessId.`);
            throw new Error("El usuario cliente no está asociado a ningún negocio.");
        }

        const reward = await prisma.reward.findUniqueOrThrow({
            where: { id: rewardId },
            select: {
                id: true, name_es: true, name_en: true,
                pointsCost: true, isActive: true, businessId: true
            }
        });

        if (user.role !== UserRole.CUSTOMER_FINAL) { throw new Error('Rol de usuario inválido para canjear recompensas.'); }
        if (user.businessId !== reward.businessId) { throw new Error('La recompensa no pertenece al negocio del cliente.'); }
        if (!reward.isActive) { throw new Error('Esta recompensa está actualmente inactiva.'); }

        const rewardDisplayName = reward.name_es || reward.name_en || `ID ${rewardId}`;
        if (user.points < reward.pointsCost) {
            throw new Error(`Puntos insuficientes para canjear "${rewardDisplayName}". Necesarios: ${reward.pointsCost}, Disponibles: ${user.points}`);
        }

        const updatedUser = await prisma.$transaction(async (tx) => {
            const resultUser = await tx.user.update({
                where: { id: customerUserId },
                data: { points: { decrement: reward.pointsCost } },
                select: { id: true, points: true }
            });

            // --- CORRECCIÓN EN ActivityLog ---
            await tx.activityLog.create({
                data: {
                    userId: customerUserId,
                    businessId: user.businessId!, // Usamos '!' porque ya validamos que no es null
                    type: ActivityType.POINTS_REDEEMED_REWARD,
                    pointsChanged: -reward.pointsCost,
                    description: reward.name_es || reward.name_en,
                    relatedRewardId: rewardId
                }
            });
            // --- FIN CORRECCIÓN ---

            console.log(`[Points SVC - TX SUCCESS] User ${resultUser.id} redeemed reward '${rewardDisplayName}' (${reward.id}) for ${reward.pointsCost} points. Activity logged. New balance: ${resultUser.points}.`);
            return resultUser;
        });

        return {
            message: `¡Recompensa '${rewardDisplayName}' canjeada con éxito!`,
            newPointsBalance: updatedUser.points
        };
    } catch (error: unknown) {
        // ... (manejo de errores sin cambios) ...
        console.error(`[Points SVC - ERROR] Failed to redeem reward for user ${customerUserId}, reward ${rewardId}:`, error);
        if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2025') {
            throw new Error('No se encontró el usuario o la recompensa especificada.');
        }
        if (error instanceof Error) { throw error; } // Relanzar errores específicos ya lanzados
        throw new Error('Ocurrió un error inesperado durante el canje de la recompensa.');
    }
};