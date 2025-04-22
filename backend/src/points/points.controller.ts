// File: backend/src/points/points.controller.ts
// Version: 1.0.1 (Make ticketNumber mandatory - Full Code)

import { Request, Response } from 'express';
import { Prisma } from '@prisma/client'; // Importa Prisma para manejo de errores
// Importa funciones del servicio de puntos
import { generateQrCodeData, validateQrCode } from './points.service';

// DTO para generar un QR (POST /api/points/generate-qr)
export interface GenerateQrDto {
    amount: number;
    // --- CAMBIO: ticketNumber ahora es obligatorio ---
    ticketNumber: string;
    // --- FIN CAMBIO ---
}

// DTO para validar un QR (sin cambios)
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

    if (!businessId) { return res.status(401).json({ message: 'User not associated with a business.' }); }
    if (role !== 'BUSINESS_ADMIN') { return res.status(403).json({ message: 'Access denied. Only business administrators can generate QR codes.' }); }

    // Extrae los datos usando el DTO actualizado
    const { amount, ticketNumber }: GenerateQrDto = req.body;

    // --- CAMBIO: Validación de Datos de Entrada Actualizada ---
    if (amount === undefined || typeof amount !== 'number' || amount <= 0) {
         return res.status(400).json({ message: 'Transaction amount must be a positive number.' });
    }
    // Nueva validación para ticketNumber
    if (!ticketNumber || typeof ticketNumber !== 'string' || ticketNumber.trim() === '') {
         return res.status(400).json({ message: 'Ticket number is required.' });
    }
    // --- FIN CAMBIO ---

    try {
        // Llama al servicio (aún no hemos actualizado el servicio, pero pasamos el ticketNumber)
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
 */
export const validateQrHandler = async (req: Request, res: Response) => {
    // Obtenemos el ID del usuario autenticado y su rol
    const customerUserId = req.user?.id;
    const role = req.user?.role;

    // Verificacion basica: Asegurar que el usuario autenticado existe y es un cliente final (CUSTOMER_FINAL)
     if (!customerUserId || role !== 'CUSTOMER_FINAL') {
         console.warn(`User ${req.user?.id || 'unknown'} with role ${role} attempted to validate QR.`);
        return res.status(403).json({ message: 'Access denied. Only customer accounts can validate QR codes.' });
    }

    // Extrae el token del cuerpo de la petición usando el DTO
    const { qrToken }: ValidateQrDto = req.body;

    // Validacion basica de que el qrToken esta presente
    if (!qrToken) {
         return res.status(400).json({ message: 'QR token is required.' });
    }

    try {
        // Llama a la funcion de servicio para validar el QR y asignar puntos.
        const pointsEarned = await validateQrCode(qrToken, customerUserId);

        // Si todo es exitoso, responde al cliente con un mensaje de exito y la cantidad de puntos ganados.
        res.status(200).json({ message: 'QR code validated successfully. Points assigned.', pointsEarned: pointsEarned }); // 200 OK

    } catch (error: unknown) {
         if (error instanceof Error) {
              console.error('Error in validateQrHandler (service error):', error.message);
             return res.status(400).json({ message: error.message });
         }
        console.error('Server error in validateQrHandler (unexpected):', error);
        res.status(500).json({ message: 'An internal server error occurred during QR validation.' });
    }
};


// Puedes añadir mas funciones de controlador de puntos aqui en el futuro

// End of File: backend/src/points/points.controller.ts