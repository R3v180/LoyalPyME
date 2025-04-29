// filename: backend/src/points/points.controller.ts
// Version: 1.2.2 (Fix encoding, remove meta-comments)

import { Request, Response, NextFunction } from 'express'; // Added NextFunction import
import { Prisma } from '@prisma/client';
// Importa funciones del servicio de puntos
import { generateQrCodeData, validateQrCode, redeemReward } from './points.service';

// DTOs
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
export const generateQrHandler = async (req: Request, res: Response, next: NextFunction) => { // Added next
    // --- FIX: Check req.user explicitly ---
    if (!req.user || !req.user.businessId || !req.user.role) {
        console.error("[POINTS CTRL] Critical: User context missing in generateQrHandler.");
        return res.status(401).json({ message: "Información de autenticación no encontrada." });
    }
    const businessId = req.user.businessId;
    const role = req.user.role;
    // --- FIN FIX ---

    if (role !== 'BUSINESS_ADMIN') {
        return res.status(403).json({ message: 'Acceso denegado. Solo administradores pueden generar códigos QR.' }); // Corregido: códigos
    }

    const { amount, ticketNumber }: GenerateQrDto = req.body;

    // Validaciones internas
    if (amount === undefined || typeof amount !== 'number' || amount <= 0) {
         return res.status(400).json({ message: 'Transaction amount must be a positive number.' });
    }
    if (!ticketNumber || typeof ticketNumber !== 'string' || ticketNumber.trim() === '') {
         return res.status(400).json({ message: 'Ticket number is required.' });
    }

    try {
        const qrData = await generateQrCodeData(businessId, amount, ticketNumber.trim());
        res.status(201).json(qrData); // Devolver solo datos
    } catch (error: unknown) {
        // Los mensajes de error del servicio ya deberían estar en español o ser genéricos
        if (error instanceof Error) {
            // Si el servicio lanza un error conocido, lo devolvemos como 400
             return res.status(400).json({ message: error.message });
        }
        // Errores inesperados
        console.error('Server error in generateQrHandler (unexpected):', error);
        // Usar next(error) es más consistente para errores 500
        next(new Error('Error del servidor al generar código QR.')); // Corregido: código
    }
};


/**
 * Handles the request to validate a QR token and assign points to the customer.
 * POST /api/points/validate-qr
 */
export const validateQrHandler = async (req: Request, res: Response, next: NextFunction) => { // Added next
     // --- FIX: Check req.user explicitly ---
     if (!req.user || !req.user.id || !req.user.role) {
        console.error("[POINTS CTRL] Critical: User context missing in validateQrHandler.");
        return res.status(401).json({ message: "Información de autenticación no encontrada." });
    }
    const customerUserId = req.user.id;
    const role = req.user.role;
    // --- FIN FIX ---


    if (role !== 'CUSTOMER_FINAL') {
         console.warn(`User ${customerUserId} with role ${role} attempted to validate QR.`);
        return res.status(403).json({ message: 'Acceso denegado. Solo cuentas de cliente pueden validar códigos QR.' }); // Corregido: códigos
    }

    const { qrToken }: ValidateQrDto = req.body;

    if (!qrToken) {
         return res.status(400).json({ message: 'Se requiere el token QR.' });
    }

    try {
        const pointsEarned = await validateQrCode(qrToken, customerUserId);
        res.status(200).json({ message: 'Código QR validado con éxito. Puntos asignados.', pointsEarned: pointsEarned }); // Corregido: Código, éxito
    } catch (error: unknown) {
         if (error instanceof Error) {
             console.error('Error in validateQrHandler (service error):', error.message);
             // Pasamos el error del servicio (ya debería estar en español o ser claro)
             // Usamos 400 Bad Request para errores de validación de token (usado, expirado, etc.)
             return res.status(400).json({ message: error.message });
         }
         console.error('Server error in validateQrHandler (unexpected):', error);
         // Usar next(error) es más consistente para errores 500
         next(new Error('Ocurrió un error interno durante la validación del QR.')); // Corregido: Ocurrió, validación
    }
};


/**
 * Handles the request to redeem a specific reward using customer points.
 * POST /api/points/redeem-reward/:rewardId
 */
export const redeemRewardHandler = async (req: Request, res: Response, next: NextFunction) => { // Added next
    // --- FIX: Check req.user explicitly ---
    if (!req.user || !req.user.id || !req.user.role) {
       console.error("[POINTS CTRL] Critical: User context missing in redeemRewardHandler.");
       return res.status(401).json({ message: "Información de autenticación no encontrada." });
   }
   const userId = req.user.id;
   const role = req.user.role;
   // --- FIN FIX ---

    const rewardId = req.params.rewardId;

    console.log(`[REDEEM CTRL] Handling request for user ${userId}, reward ${rewardId}`);

    if (role !== 'CUSTOMER_FINAL') {
        console.warn(`[REDEEM CTRL] Access denied for user ${userId || 'unknown'} with role ${role}.`);
        return res.status(403).json({ message: 'Acceso denegado. Solo cuentas de cliente autenticadas pueden canjear recompensas.' }); // Corregido: autenticadas
    }
    if (!rewardId) {
        console.error('[REDEEM CTRL] Reward ID missing from request parameters.');
        return res.status(400).json({ message: 'Se requiere el ID de la recompensa.' });
    }

    try {
        console.log(`[REDEEM CTRL] Calling redeemReward service for user ${userId} and reward ${rewardId}...`);
        const result = await redeemReward(userId, rewardId); // El mensaje de éxito viene del servicio
        console.log(`[REDEEM CTRL] Service call successful for user ${userId}, reward ${rewardId}.`);
        res.status(200).json(result); // Devolvemos el resultado del servicio (que tiene mensaje y puntos)
    } catch (error: unknown) {
        console.error(`[REDEEM CTRL - ERROR] Error redeeming reward for user ${userId}, reward ${rewardId}:`, error);
        // Pasamos el error del servicio (que ya debería estar en español o ser claro)
        if (error instanceof Error) {
             // Errores como 'Puntos insuficientes' o 'Recompensa inactiva' son 400 Bad Request
            return res.status(400).json({ message: error.message });
        }
         // Usar next(error) es más consistente para errores 500
        next(new Error('Error interno del servidor durante el canje de recompensa.'));
    }
};

// End of File: backend/src/points/points.controller.ts