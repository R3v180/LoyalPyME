// File: backend/src/points/points.controller.ts
// Version: 1.2.0 (Connect redeemRewardHandler to service)

import { Request, Response } from 'express';
import { Prisma } from '@prisma/client';
// Importa funciones del servicio de puntos
import { generateQrCodeData, validateQrCode, redeemReward } from './points.service'; // redeemReward ya está implementado en v1.2.0 del servicio

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
 * (No changes in this function)
 */
export const generateQrHandler = async (req: Request, res: Response) => {
    const businessId = req.user?.businessId;
    const role = req.user?.role;

    if (!businessId) { return res.status(401).json({ message: 'User not associated with a business.' }); }
    if (role !== 'BUSINESS_ADMIN') { return res.status(403).json({ message: 'Access denied. Only business administrators can generate QR codes.' }); }

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
         if (error instanceof Error) { return res.status(400).json({ message: error.message }); }
        console.error('Server error in generateQrHandler (unexpected):', error);
        res.status(500).json({ message: 'Server error generating QR code.' });
    }
};


/**
 * Handles the request to validate a QR token and assign points to the customer.
 * POST /api/points/validate-qr
 * (No changes in this function)
 */
export const validateQrHandler = async (req: Request, res: Response) => {
    const customerUserId = req.user?.id;
    const role = req.user?.role;

     if (!customerUserId || role !== 'CUSTOMER_FINAL') {
         console.warn(`User ${req.user?.id || 'unknown'} with role ${role} attempted to validate QR.`);
        return res.status(403).json({ message: 'Access denied. Only customer accounts can validate QR codes.' });
    }

    const { qrToken }: ValidateQrDto = req.body;

    if (!qrToken) {
         return res.status(400).json({ message: 'QR token is required.' });
    }

    try {
        const pointsEarned = await validateQrCode(qrToken, customerUserId);
        res.status(200).json({ message: 'QR code validated successfully. Points assigned.', pointsEarned: pointsEarned });

    } catch (error: unknown) {
         if (error instanceof Error) {
              console.error('Error in validateQrHandler (service error):', error.message);
             return res.status(400).json({ message: error.message });
         }
        console.error('Server error in validateQrHandler (unexpected):', error);
        res.status(500).json({ message: 'An internal server error occurred during QR validation.' });
    }
};


/**
 * Handles the request to redeem a specific reward using customer points.
 * POST /api/points/redeem-reward/:rewardId
 */
export const redeemRewardHandler = async (req: Request, res: Response) => {
    const userId = req.user?.id; // Obtenido del middleware authenticateToken
    const role = req.user?.role; // Obtenido del middleware authenticateToken
    const rewardId = req.params.rewardId; // Obtener rewardId de los parámetros de la URL

    console.log(`[REDEEM CTRL] Handling request for user ${userId}, reward ${rewardId}`);

    // Validación de rol y existencia de IDs (ya hecha en parte, pero reforzamos)
    if (!userId || role !== 'CUSTOMER_FINAL') {
        console.warn(`[REDEEM CTRL] Access denied for user ${userId || 'unknown'} with role ${role}.`);
        return res.status(403).json({ message: 'Access denied. Only authenticated customer accounts can redeem rewards.' });
    }
    if (!rewardId) {
        console.error('[REDEEM CTRL] Reward ID missing from request parameters.');
        return res.status(400).json({ message: 'Reward ID is required.' });
    }

    // --- CAMBIO: Llamar al servicio y manejar respuesta/error ---
    try {
        console.log(`[REDEEM CTRL] Calling redeemReward service for user ${userId} and reward ${rewardId}...`);
        // Llamamos a la función del servicio que implementamos en el paso anterior
        const result = await redeemReward(userId, rewardId);

        console.log(`[REDEEM CTRL] Service call successful for user ${userId}, reward ${rewardId}.`);
        // Si el servicio se completa correctamente, enviamos el resultado
        res.status(200).json(result); // 200 OK con el mensaje y nuevo saldo de puntos

    } catch (error: unknown) {
        console.error(`[REDEEM CTRL - ERROR] Error redeeming reward for user ${userId}, reward ${rewardId}:`, error);

        // Manejo de errores provenientes del servicio o Prisma
        if (error instanceof Error) {
            // Enviamos el mensaje de error específico que lanzó el servicio (ej: "Insufficient points...")
            // Usamos 400 Bad Request como general para errores de lógica/validación.
            // Podríamos refinar a 404 si el error indicase explícitamente "Reward not found", etc.
            return res.status(400).json({ message: error.message });
        }

        // Error inesperado (no es instancia de Error)
        return res.status(500).json({ message: 'Internal server error during reward redemption.' });
    }
    // --- FIN CAMBIO ---
};

// End of File: backend/src/points/points.controller.ts