// File: backend/src/points/points.controller.ts
// Version: 1.2.1 (Translate user-facing messages)

import { Request, Response } from 'express';
import { Prisma } from '@prisma/client';
// Importa funciones del servicio de puntos (asumimos que service v1.2.0+ ya existe)
import { generateQrCodeData, validateQrCode, redeemReward } from './points.service';

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
export const generateQrHandler = async (req: Request, res: Response) => {
    const businessId = req.user?.businessId;
    const role = req.user?.role;

    if (!businessId) { return res.status(401).json({ message: 'Usuario no asociado a un negocio.' }); } // Traducido
    if (role !== 'BUSINESS_ADMIN') { return res.status(403).json({ message: 'Acceso denegado. Solo administradores pueden generar códigos QR.' }); } // Traducido

    const { amount, ticketNumber }: GenerateQrDto = req.body;

    // Usamos mensajes técnicos en inglés para validaciones internas, pero podríamos traducirlos si fuera necesario
    if (amount === undefined || typeof amount !== 'number' || amount <= 0) {
         return res.status(400).json({ message: 'Transaction amount must be a positive number.' });
    }
    if (!ticketNumber || typeof ticketNumber !== 'string' || ticketNumber.trim() === '') {
         return res.status(400).json({ message: 'Ticket number is required.' });
    }

    try {
        const qrData = await generateQrCodeData(businessId, amount, ticketNumber.trim());
        res.status(201).json(qrData); // No hay mensaje aquí, solo datos
    } catch (error: unknown) {
         // Los mensajes de error del servicio se pasan directamente, o se traducen en el servicio
         if (error instanceof Error) { return res.status(400).json({ message: error.message }); }
        console.error('Server error in generateQrHandler (unexpected):', error);
        res.status(500).json({ message: 'Error del servidor al generar código QR.' }); // Traducido
    }
};


/**
 * Handles the request to validate a QR token and assign points to the customer.
 * POST /api/points/validate-qr
 */
export const validateQrHandler = async (req: Request, res: Response) => {
    const customerUserId = req.user?.id;
    const role = req.user?.role;

     if (!customerUserId || role !== 'CUSTOMER_FINAL') {
         console.warn(`User ${req.user?.id || 'unknown'} with role ${role} attempted to validate QR.`);
        return res.status(403).json({ message: 'Acceso denegado. Solo cuentas de cliente pueden validar códigos QR.' }); // Traducido
    }

    const { qrToken }: ValidateQrDto = req.body;

    if (!qrToken) {
         return res.status(400).json({ message: 'Se requiere el token QR.' }); // Traducido
    }

    try {
        const pointsEarned = await validateQrCode(qrToken, customerUserId);
        // --- CAMBIO: Mensaje de éxito traducido ---
        res.status(200).json({ message: 'Código QR validado con éxito. Puntos asignados.', pointsEarned: pointsEarned });
        // --- FIN CAMBIO ---
    } catch (error: unknown) {
         if (error instanceof Error) {
              console.error('Error in validateQrHandler (service error):', error.message);
             // Pasamos el error del servicio (que también traduciremos)
             return res.status(400).json({ message: error.message });
         }
        console.error('Server error in validateQrHandler (unexpected):', error);
        res.status(500).json({ message: 'Ocurrió un error interno durante la validación del QR.' }); // Traducido
    }
};


/**
 * Handles the request to redeem a specific reward using customer points.
 * POST /api/points/redeem-reward/:rewardId
 */
export const redeemRewardHandler = async (req: Request, res: Response) => {
    const userId = req.user?.id;
    const role = req.user?.role;
    const rewardId = req.params.rewardId;

    console.log(`[REDEEM CTRL] Handling request for user ${userId}, reward ${rewardId}`);

    if (!userId || role !== 'CUSTOMER_FINAL') {
        console.warn(`[REDEEM CTRL] Access denied for user ${userId || 'unknown'} with role ${role}.`);
        return res.status(403).json({ message: 'Acceso denegado. Solo cuentas de cliente autenticadas pueden canjear recompensas.' }); // Traducido
    }
    if (!rewardId) {
        console.error('[REDEEM CTRL] Reward ID missing from request parameters.');
        return res.status(400).json({ message: 'Se requiere el ID de la recompensa.' }); // Traducido
    }

    try {
        console.log(`[REDEEM CTRL] Calling redeemReward service for user ${userId} and reward ${rewardId}...`);
        const result = await redeemReward(userId, rewardId); // El mensaje de éxito viene del servicio
        console.log(`[REDEEM CTRL] Service call successful for user ${userId}, reward ${rewardId}.`);
        res.status(200).json(result); // Devolvemos el resultado del servicio (que tendrá el mensaje traducido)
    } catch (error: unknown) {
        console.error(`[REDEEM CTRL - ERROR] Error redeeming reward for user ${userId}, reward ${rewardId}:`, error);
        // Pasamos el error del servicio (que también traduciremos)
        if (error instanceof Error) {
            return res.status(400).json({ message: error.message });
        }
        return res.status(500).json({ message: 'Error interno del servidor durante el canje de recompensa.' }); // Traducido
    }
};

// End of File: backend/src/points/points.controller.ts