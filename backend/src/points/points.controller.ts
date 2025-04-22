// File: backend/src/points/points.controller.ts
// Version: 1.0.0

import { Request, Response } from 'express';
import { Prisma } from '@prisma/client'; // Importa Prisma para manejo de errores
// Importa funciones del servicio de puntos (generateQrCodeData, validateQrCode)
import { generateQrCodeData, validateQrCode } from './points.service';

// Define DTOs (Data Transfer Objects) para validar la estructura de los datos en las peticiones

// DTO para generar un QR (POST /api/points/generate-qr)
export interface GenerateQrDto {
    amount: number;
    ticketNumber?: string; // Campo opcional para el numero de ticket de venta
    // Nota: 'businessId' no esta aqui porque lo obtendremos del usuario autenticado via req.user
}

// DTO para validar un QR (POST /api/points/validate-qr)
export interface ValidateQrDto {
    qrToken: string; // El token unico leido del codigo QR
    // Nota: 'customerUserId' no esta aqui porque lo obtendremos del usuario autenticado via req.user
}


/**
 * Handles the request to generate QR code data for a points transaction.
 * This endpoint is intended for the BUSINESS_ADMIN role within the Admin Panel.
 * It requires authentication via JWT.
 * POST /api/points/generate-qr
 * Requires Authentication (handled by authenticateToken middleware)
 * Requires BUSINESS_ADMIN role (TODO: Implement role middleware for strict authorization)
 * Expected request body: GenerateQrDto
 */
export const generateQrHandler = async (req: Request, res: Response) => {
    // Obtenemos el businessId y role del usuario autenticado, adjuntos por el authenticateToken middleware (req.user)
    const businessId = req.user?.businessId;
    const role = req.user?.role; // Obtenemos el rol para verificar si es BUSINESS_ADMIN

    // Verificacion basica: Asegurar que el usuario autenticado tiene un businessId asociado.
    // El middleware authenticateToken ya verifica si req.user existe.
    if (!businessId) {
        // Si por alguna razon no hay businessId en el usuario autenticado (configuracion incorrecta del usuario)
        console.error('Authenticated user has no businessId during QR generation.');
        return res.status(401).json({ message: 'User not associated with a business.' }); // O 403 Forbidden si usuario autenticado existe
    }

    // TODO: Implementar un middleware de autorizacion de roles mas robusto.
    // Por ahora, verificamos el rol dentro del controlador.
    if (role !== 'BUSINESS_ADMIN') {
         // Si el usuario no es BUSINESS_ADMIN, no puede generar QRs
         console.warn(`User ${req.user?.id} with role ${role} attempted to generate QR.`);
         return res.status(403).json({ message: 'Access denied. Only business administrators can generate QR codes.' });
    }

    // Extrae los datos necesarios del cuerpo de la petición usando el DTO
    const { amount, ticketNumber }: GenerateQrDto = req.body;

    // Validacion basica de los datos de entrada: el monto es requerido y debe ser un numero
    if (amount === undefined || typeof amount !== 'number') {
         // Si el monto no esta presente o no es un numero, responde con error 400 Bad Request
         return res.status(400).json({ message: 'Transaction amount is required and must be a number.' });
    }
    // Validacion adicional que el monto sea positivo (el servicio tambien lo valida, pero aqui damos feedback rapido)
    if (amount <= 0) {
         return res.status(400).json({ message: 'Transaction amount must be positive.' });
    }


    try {
        // Llama a la funcion de servicio para generar los datos del QR y guardar el registro en la BD
        // Pasa el businessId del usuario autenticado para asociar el QR
        const qrData = await generateQrCodeData(businessId, amount, ticketNumber);

        // Si todo es exitoso, responde al cliente (panel admin) con los datos necesarios para generar el QR visual
        res.status(201).json(qrData); // 201 Created - Indica que se creo un nuevo recurso (el registro QR en BD)

    } catch (error: unknown) { // Captura cualquier error (del servicio o inesperado)
        // Manejo de errores
         if (error instanceof Error) {
             // Si el error es una instancia de Error (como los que lanzamos desde el servicio),
             // loggea el error original y responde con un mensaje amigable y status 400.
             console.error('Error in generateQrHandler (service error):', error.message);
             return res.status(400).json({ message: error.message }); // Ej: 'Transaction amount must be positive.'
         }
         // Si es otro tipo de error inesperado (ej: error de base de datos no capturado en el servicio)
        console.error('Server error in generateQrHandler (unexpected):', error); // Loggea el error completo para depuracion
        res.status(500).json({ message: 'Server error generating QR code.' }); // Responde con un error generico 500 Internal Server Error
    }
};


/**
 * Handles the request to validate a QR token and assign points to the customer.
 * This endpoint is intended for the CUSTOMER_FINAL role within the Customer Portal.
 * It requires authentication via JWT.
 * POST /api/points/validate-qr
 * Requires Authentication (handled by authenticateToken middleware)
 * Requires CUSTOMER_FINAL role (TODO: Implement role middleware for strict authorization)
 * Expected request body: ValidateQrDto
 */
export const validateQrHandler = async (req: Request, res: Response) => {
    // Obtenemos el ID del usuario autenticado y su rol
    const customerUserId = req.user?.id;
    const role = req.user?.role;

    // Verificacion basica: Asegurar que el usuario autenticado existe y es un cliente final (CUSTOMER_FINAL)
    // El middleware authenticateToken ya verifica si req.user existe.
     if (!customerUserId || role !== 'CUSTOMER_FINAL') {
         // Si el usuario no tiene ID (imposible si authenticateToken funciono) o no es CUSTOMER_FINAL
         console.warn(`User ${req.user?.id || 'unknown'} with role ${role} attempted to validate QR.`);
         // Un middleware de rol futuro seria mas adecuado, pero aqui verificamos el rol.
        return res.status(403).json({ message: 'Access denied. Only customer accounts can validate QR codes.' }); // 403 Forbidden
    }


    // Extrae el token del cuerpo de la petición usando el DTO
    const { qrToken }: ValidateQrDto = req.body;

    // Validacion basica de que el qrToken esta presente
    if (!qrToken) {
         // Si el token no esta presente, responde con error 400 Bad Request
         return res.status(400).json({ message: 'QR token is required.' });
    }


    try {
        // Llama a la funcion de servicio para validar el QR y asignar puntos.
        // Pasa el qrToken del cuerpo de la peticion y el customerUserId del usuario autenticado.
        // El servicio maneja toda la logica de validacion (existencia, estado, expiracion, negocio)
        // y la actualizacion atomica (puntos del cliente, estado del QR).
        const pointsEarned = await validateQrCode(qrToken, customerUserId);

        // Si todo es exitoso, responde al cliente con un mensaje de exito y la cantidad de puntos ganados.
        res.status(200).json({ message: 'QR code validated successfully. Points assigned.', pointsEarned: pointsEarned }); // 200 OK

    } catch (error: unknown) { // Captura cualquier error (del servicio o inesperado)
        // Manejo de errores. Captura los errores lanzados por el servicio (ej: 'Invalid QR code.', 'QR code has expired.')
        // y tambien errores inesperados de base de datos o servidor.
         if (error instanceof Error) {
              // Si es un error custom lanzado desde el servicio, loggea y responde con status 400.
              // Estos errores custom son para casos de validacion de logica de negocio/QR.
              console.error('Error in validateQrHandler (service error):', error.message);
             return res.status(400).json({ message: error.message }); // Ej: 'QR code has expired.'
         }
         // Si es otro tipo de error inesperado (ej: Prisma error no capturado, etc.)
         // Usa un type guard para acceder a message si existe, sino muestra el error completo para depuracion
        console.error('Server error in validateQrHandler (unexpected):', error instanceof Error ? error.message : error); // Loggea para depuracion
        res.status(500).json({ message: 'An internal server error occurred during QR validation.' }); // Responde con un error generico 500 Internal Server Error
    }
};


// Puedes añadir mas funciones de controlador de puntos aqui en el futuro
// Por ejemplo: getCustomerPoints (para el portal cliente), redeemRewardHandler, etc.


// End of File: backend/src/points/points.controller.ts