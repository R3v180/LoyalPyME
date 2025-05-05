// filename: backend/src/points/points.service.ts
// Version: 2.3.1 (Use i18n reward fields name_es/name_en instead of name)

import {
    PrismaClient,
    User,
    Reward,
    QrCode,
    Business,
    QrCodeStatus,
    UserRole,
    Prisma,
    TierBenefit,
    TierCalculationBasis,
    Tier,
    TierDowngradePolicy,
    ActivityType
} from '@prisma/client';
import { v4 as uuidv4 } from 'uuid';
import { addMinutes, isAfter } from 'date-fns';
import { updateUserTier } from '../tiers/tier-logic.service';

const prisma = new PrismaClient();
const QR_EXPIRATION_MINUTES = 30;

// Tipos y Interfaces (sin cambios)
interface RedeemResult { message: string; newPointsBalance: number; }
type ValidQrCode = QrCode & { business: { id: string; pointsPerEuro: number; tierSystemEnabled: boolean; tierCalculationBasis: TierCalculationBasis | null; }, ticketNumber: string; };
type ValidCustomer = User & { currentTier: ({ benefits: TierBenefit[]; } & { id: string; name: string; }) | null; };
export interface ValidateQrResult { pointsEarned: number; updatedUser: { id: string; points: number; totalSpend: number; totalVisits: number; currentTierId: string | null; currentTierName: string | null; }; }

// ==============================================
// HELPER FUNCTIONS for validateQrCode (Internal) - Sin cambios aquí
// ==============================================
const _findAndValidateQrCodeRecord = async (qrToken: string, now: Date): Promise<ValidQrCode> => { /* ... (sin cambios) ... */ const qrCode = await prisma.qrCode.findUnique({ where: { token: qrToken }, include: { business: { select: { id: true, pointsPerEuro: true, tierSystemEnabled: true, tierCalculationBasis: true } } } }); if (!qrCode) { throw new Error('Código QR inválido.'); } if (qrCode.status !== QrCodeStatus.PENDING) { if (qrCode.status === QrCodeStatus.COMPLETED) throw new Error('El código QR ya ha sido utilizado.'); if (qrCode.status === QrCodeStatus.EXPIRED) throw new Error('El código QR ha expirado.'); throw new Error('El código QR no está disponible para canjear.'); } if (isAfter(now, qrCode.expiresAt)) { try { await prisma.qrCode.update({ where: { id: qrCode.id }, data: { status: QrCodeStatus.EXPIRED } }); console.log(`[Points SVC Helper] QR code ${qrToken} marked as EXPIRED.`); } catch (updateError) { console.error(`[Points SVC Helper] Failed to update QR status to EXPIRED for token ${qrToken}:`, updateError); } throw new Error('El código QR ha expirado.'); } if (!qrCode.business) { console.error(`[Points SVC Helper] QR code ${qrCode.id} has no associated business!`); throw new Error('Error interno: El QR no está asociado a un negocio.'); } if (qrCode.ticketNumber === null) { console.error(`[Points SVC Helper] QR code ${qrCode.id} has null ticketNumber!`); throw new Error('Error interno: Falta número de ticket en QR.'); } return qrCode as ValidQrCode; };
const _findAndValidateCustomerForQr = async (userId: string, qrCodeBusinessId: string): Promise<ValidCustomer> => { /* ... (sin cambios) ... */ const customer = await prisma.user.findUnique({ where: { id: userId }, include: { currentTier: { include: { benefits: { where: { isActive: true } } } } } }); if (!customer || customer.role !== UserRole.CUSTOMER_FINAL) { throw new Error('Solo las cuentas de cliente pueden canjear códigos QR.'); } if (customer.businessId !== qrCodeBusinessId) { throw new Error('El código QR no es válido para el negocio de este cliente.'); } return customer as ValidCustomer; };
const _calculatePointsEarned = (qrAmount: number, businessConfig: ValidQrCode['business'], customer: ValidCustomer): number => { /* ... (sin cambios) ... */ let effectivePoints = qrAmount * businessConfig.pointsPerEuro; const multiplierBenefit = customer.currentTier?.benefits.find(b => b.type === 'POINTS_MULTIPLIER'); if (multiplierBenefit) { const multiplier = parseFloat(multiplierBenefit.value); if (!isNaN(multiplier) && multiplier > 0) { effectivePoints *= multiplier; console.log(`[Points SVC Helper] Applied tier multiplier ${multiplier} for user ${customer.id}`); } else { console.warn(`[Points SVC Helper] Invalid multiplier value '${multiplierBenefit.value}' for tier ${customer.currentTier?.id}`); } } const calculatedPoints = Math.floor(effectivePoints); return calculatedPoints < 0 ? 0 : calculatedPoints; };
const _performQrValidationTransaction = async ( tx: Prisma.TransactionClient, qrCode: ValidQrCode, customerId: string, pointsEarned: number, now: Date ): Promise<void> => { /* ... (sin cambios) ... */ await tx.user.update({ where: { id: customerId }, data: { points: { increment: pointsEarned }, lastActivityAt: now, totalVisits: { increment: 1 }, totalSpend: { increment: qrCode.amount }, }, }); await tx.qrCode.update({ where: { id: qrCode.id }, data: { status: QrCodeStatus.COMPLETED, completedAt: now, userId: customerId, pointsEarned: pointsEarned }, }); await tx.activityLog.create({ data: { userId: customerId, businessId: qrCode.businessId, type: ActivityType.POINTS_EARNED_QR, pointsChanged: pointsEarned, description: qrCode.ticketNumber, relatedQrId: qrCode.id, } }); console.log(`[Points SVC Helper TX] User, QR, and ActivityLog updated for QR ${qrCode.id}`); };

// ==================================
// Funciones de Servicio Exportadas
// ==================================

// generateQrCodeData (sin cambios)
export const generateQrCodeData = async (businessId: string, amount: number, ticketNumber: string): Promise<{ qrToken: string; amount: number }> => { /* ... (sin cambios) ... */ if (amount <= 0 || typeof amount !== 'number') { throw new Error('El importe de la transacción debe ser un número positivo.'); } const token = uuidv4(); const expiresAt = addMinutes(new Date(), QR_EXPIRATION_MINUTES); try { const qrCode = await prisma.qrCode.create({ data: { token, businessId, amount, ticketNumber, expiresAt, status: QrCodeStatus.PENDING }, select: { token: true, amount: true } }); console.log(`[Points SVC] QR Code generated for business ${businessId} with token ${token} for amount ${amount}, ticket: ${ticketNumber}.`); return { qrToken: qrCode.token, amount: qrCode.amount }; } catch (error: unknown) { console.error('[Points SVC] Error generating QR code data:', error); throw new Error('No se pudieron generar los datos del código QR.'); } };

// validateQrCode (sin cambios)
export const validateQrCode = async (qrToken: string, customerUserId: string): Promise<ValidateQrResult> => { /* ... (sin cambios) ... */ const now = new Date(); console.log(`[Points SVC] Validating QR token starting with ${qrToken.substring(0, 5)}... for user ${customerUserId}`); try { const qrCode = await _findAndValidateQrCodeRecord(qrToken, now); const customer = await _findAndValidateCustomerForQr(customerUserId, qrCode.businessId); const calculatedPointsEarned = _calculatePointsEarned(qrCode.amount, qrCode.business, customer); await prisma.$transaction(async (tx) => { await _performQrValidationTransaction( tx, qrCode, customerUserId, calculatedPointsEarned, now ); }); console.log(`[Points SVC] Transaction successful for QR ${qrCode.id} and user ${customerUserId}.`); if (qrCode.business.tierSystemEnabled) { console.log(`[Points SVC] Triggering tier update for user ${customerUserId} (async)`); updateUserTier(customerUserId).catch(err => { console.error(`[Points SVC] Background tier update failed for user ${customerUserId}:`, err); }); } await new Promise(resolve => setTimeout(resolve, 150)); const updatedUserData = await prisma.user.findUniqueOrThrow({ where: { id: customerUserId }, select: { id: true, points: true, totalSpend: true, totalVisits: true, currentTierId: true, currentTier: { select: { name: true } } } }); console.log(`[Points SVC] Fetched latest user data post-validation for ${customerUserId}: TierId=${updatedUserData.currentTierId}`); return { pointsEarned: calculatedPointsEarned, updatedUser: { id: updatedUserData.id, points: updatedUserData.points, totalSpend: updatedUserData.totalSpend ?? 0, totalVisits: updatedUserData.totalVisits ?? 0, currentTierId: updatedUserData.currentTierId, currentTierName: updatedUserData.currentTier?.name ?? null } }; } catch (error: unknown) { if (error instanceof Error && ( error.message.startsWith('Código QR inválido') || error.message.includes('ya ha sido utilizado') || error.message.includes('ha expirado') || error.message.includes('no está disponible para canjear') || error.message.includes('Solo las cuentas de cliente') || error.message.includes('no es válido para el negocio') )) { console.warn(`[Points SVC] Validation failed for token ${qrToken}: ${error.message}`); throw error; } console.error(`[Points SVC] Unexpected error validating token ${qrToken}:`, error); throw new Error('Ocurrió un error interno del servidor durante la validación del QR.'); } };

// --- redeemReward MODIFICADO ---
export const redeemReward = async (customerUserId: string, rewardId: string): Promise<RedeemResult> => {
     console.log(`[Points SVC] Redeeming standard reward ${rewardId} for user ${customerUserId}`);
     try {
         const user = await prisma.user.findUniqueOrThrow({ where: { id: customerUserId }, select: { id: true, points: true, businessId: true, role: true } });
         // --- MODIFICADO: Seleccionar name_es y name_en en lugar de name ---
         const reward = await prisma.reward.findUniqueOrThrow({
             where: { id: rewardId },
             select: {
                 id: true,
                 // name: true, // <-- Eliminado
                 name_es: true, // <-- Añadido
                 name_en: true, // <-- Añadido
                 pointsCost: true,
                 isActive: true,
                 businessId: true
             }
         });
         // --- FIN MODIFICADO ---

         if (user.role !== UserRole.CUSTOMER_FINAL) { throw new Error('Rol de usuario inválido para canjear recompensas.'); }
         if (user.businessId !== reward.businessId) { throw new Error('La recompensa no pertenece al negocio del cliente.'); }
         if (!reward.isActive) { throw new Error('Esta recompensa está actualmente inactiva.'); }

         // --- MODIFICADO: Usar name_es (o name_en como fallback) en el mensaje de error ---
         const rewardDisplayName = reward.name_es || reward.name_en || `ID ${rewardId}`;
         if (user.points < reward.pointsCost) { throw new Error(`Puntos insuficientes para canjear "${rewardDisplayName}". Necesarios: ${reward.pointsCost}, Disponibles: ${user.points}`); }
         // --- FIN MODIFICADO ---

         const updatedUser = await prisma.$transaction(async (tx) => {
              const resultUser = await tx.user.update({ where: { id: customerUserId }, data: { points: { decrement: reward.pointsCost } }, select: { id: true, points: true } });

              // --- MODIFICADO: Usar name_es (o name_en) en la descripción del log ---
              await tx.activityLog.create({
                  data: {
                      userId: customerUserId,
                      businessId: user.businessId,
                      type: ActivityType.POINTS_REDEEMED_REWARD,
                      pointsChanged: -reward.pointsCost,
                      description: reward.name_es || reward.name_en, // <-- Usar nombre ES o EN
                      relatedRewardId: rewardId
                  }
              });
              // --- FIN MODIFICADO ---

              // --- MODIFICADO: Usar name_es (o name_en) en el log de consola ---
              console.log(`[Points SVC - TX SUCCESS] User ${resultUser.id} redeemed reward '${rewardDisplayName}' (${reward.id}) for ${reward.pointsCost} points. Activity logged. New balance: ${resultUser.points}.`);
              return resultUser;
         });

         // --- MODIFICADO: Usar name_es (o name_en) en el mensaje de éxito ---
         return { message: `¡Recompensa '${rewardDisplayName}' canjeada con éxito!`, newPointsBalance: updatedUser.points };
     } catch (error: unknown) {
         console.error(`[Points SVC - ERROR] Failed to redeem reward for user ${customerUserId}, reward ${rewardId}:`, error);
         if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2025') { throw new Error('No se encontró el usuario o la recompensa especificada.'); }
         if (error instanceof Error) { throw error; }
         throw new Error('Ocurrió un error inesperado durante el canje de la recompensa.');
     }
};
// --- FIN redeemReward ---

// End of File: backend/src/points/points.service.ts