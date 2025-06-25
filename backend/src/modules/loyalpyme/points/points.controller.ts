// filename: backend/src/points/points.controller.ts
// Version: 1.3.0 (Handle updated return value from validateQrCode service)

import { Request, Response, NextFunction } from 'express';
import { Prisma } from '@prisma/client';
// --- MODIFICACIÓN: Importar también ValidateQrResult ---
import { generateQrCodeData, validateQrCode, redeemReward, ValidateQrResult } from './points.service';
// --- FIN MODIFICACIÓN ---

// DTOs (sin cambios)
export interface GenerateQrDto {
    amount: number;
    ticketNumber: string;
}
export interface ValidateQrDto {
    qrToken: string;
}

/**
 * Handles the request to generate QR code data for a points transaction.
 * POST /api/points/generate-qr
 */
export const generateQrHandler = async (req: Request, res: Response, next: NextFunction) => {
    if (!req.user || !req.user.businessId || !req.user.role) {
        console.error("[POINTS CTRL] Critical: User context missing in generateQrHandler.");
        return res.status(401).json({ message: "Información de autenticación no encontrada." });
    }
    const businessId = req.user.businessId;
    const role = req.user.role;

    if (role !== 'BUSINESS_ADMIN') {
        return res.status(403).json({ message: 'Acceso denegado. Solo administradores pueden generar códigos QR.' });
    }

    const { amount, ticketNumber }: GenerateQrDto = req.body;
    if (amount === undefined || typeof amount !== 'number' || amount <= 0) {
         return res.status(400).json({ message: 'Transaction amount must be a positive number.' });
    }
    if (!ticketNumber || typeof ticketNumber !== 'string' || ticketNumber.trim() === '') {
         return res.status(400).json({ message: 'Ticket number is required.' });
    }

    try {
        const qrData = await generateQrCodeData(businessId, amount, ticketNumber.trim());
        res.status(201).json(qrData);
    } catch (error: unknown) {
        if (error instanceof Error) {
             return res.status(400).json({ message: error.message });
        }
        console.error('Server error in generateQrHandler (unexpected):', error);
        next(new Error('Error del servidor al generar código QR.'));
    }
};


/**
 * Handles the request to validate a QR token and assign points to the customer.
 * POST /api/points/validate-qr
 */
export const validateQrHandler = async (req: Request, res: Response, next: NextFunction) => {
     if (!req.user || !req.user.id || !req.user.role) {
        console.error("[POINTS CTRL] Critical: User context missing in validateQrHandler.");
        return res.status(401).json({ message: "Información de autenticación no encontrada." });
    }
    const customerUserId = req.user.id;
    const role = req.user.role;

    if (role !== 'CUSTOMER_FINAL') {
         console.warn(`User ${customerUserId} with role ${role} attempted to validate QR.`);
         return res.status(403).json({ message: 'Acceso denegado. Solo cuentas de cliente pueden validar códigos QR.' });
    }

    const { qrToken }: ValidateQrDto = req.body;
    if (!qrToken) {
         return res.status(400).json({ message: 'Se requiere el token QR.' });
    }

    try {
        // --- MODIFICACIÓN: Capturar el objeto ValidateQrResult completo ---
        const result: ValidateQrResult = await validateQrCode(qrToken, customerUserId);
        // --- FIN MODIFICACIÓN ---

        // --- MODIFICACIÓN: Devolver el objeto updatedUser en la respuesta ---
        res.status(200).json({
            message: 'Código QR validado con éxito. Puntos asignados.',
            pointsEarned: result.pointsEarned,
            user: result.updatedUser // Devolver los datos actualizados del usuario
        });
        // --- FIN MODIFICACIÓN ---

    } catch (error: unknown) {
         if (error instanceof Error) {
             console.error('Error in validateQrHandler (service error):', error.message);
             return res.status(400).json({ message: error.message });
         }
         console.error('Server error in validateQrHandler (unexpected):', error);
         next(new Error('Ocurrió un error interno durante la validación del QR.'));
    }
};


/**
 * Handles the request to redeem a specific reward using customer points.
 * POST /api/points/redeem-reward/:rewardId
 */
export const redeemRewardHandler = async (req: Request, res: Response, next: NextFunction) => {
    if (!req.user || !req.user.id || !req.user.role) {
       console.error("[POINTS CTRL] Critical: User context missing in redeemRewardHandler.");
       return res.status(401).json({ message: "Información de autenticación no encontrada." });
   }
   const userId = req.user.id;
   const role = req.user.role;
    const rewardId = req.params.rewardId;

    console.log(`[REDEEM CTRL] Handling request for user ${userId}, reward ${rewardId}`);

    if (role !== 'CUSTOMER_FINAL') {
        console.warn(`[REDEEM CTRL] Access denied for user ${userId || 'unknown'} with role ${role}.`);
        return res.status(403).json({ message: 'Acceso denegado. Solo cuentas de cliente autenticadas pueden canjear recompensas.' });
    }
    if (!rewardId) {
        console.error('[REDEEM CTRL] Reward ID missing from request parameters.');
        return res.status(400).json({ message: 'Se requiere el ID de la recompensa.' });
    }

    try {
        console.log(`[REDEEM CTRL] Calling redeemReward service for user ${userId} and reward ${rewardId}...`);
        const result = await redeemReward(userId, rewardId);
        console.log(`[REDEEM CTRL] Service call successful for user ${userId}, reward ${rewardId}.`);
        res.status(200).json(result);
    } catch (error: unknown) {
        console.error(`[REDEEM CTRL - ERROR] Error redeeming reward for user ${userId}, reward ${rewardId}:`, error);
        if (error instanceof Error) {
            return res.status(400).json({ message: error.message });
        }
        next(new Error('Error interno del servidor durante el canje de recompensa.'));
    }
};

// End of File: backend/src/points/points.controller.ts