// filename: backend/src/auth/password-reset.controller.ts
// Version: 1.0.0 (Extracted password reset handlers from auth.controller.ts)

import { Request, Response } from 'express';

// DTOs necesarios para reseteo
import { ForgotPasswordDto, ResetPasswordDto } from './auth.dto';

// Servicios necesarios
import { hashPassword } from './auth.service'; // Solo para hashear la nueva contraseña
import { handleForgotPassword, handleResetPassword } from './password-reset.service';

/**
 * Handles forgot password request. POST /api/auth/forgot-password
 */
export const forgotPasswordHandler = async (req: Request, res: Response) => {
    const { email }: ForgotPasswordDto = req.body;
    // console.log(`[PWD_RESET CTRL] Forgot password request for email: ${email}`); // Log reducido

    if (!email) {
        return res.status(400).json({ message: 'Se requiere el email.' });
    }
    try {
        await handleForgotPassword(email);
        // Respuesta genérica para no revelar si el email existe o no
        res.status(200).json({ message: 'Si existe una cuenta con ese email, se ha enviado un enlace para restablecer la contraseña.' }); // Corregido: contraseña
    } catch (error: any) {
        // Aunque el servicio no debería lanzar error en caso de no encontrar usuario,
        // lo capturamos por si hay un error inesperado en el proceso (ej: DB)
        console.error('[PWD_RESET CTRL] Error in forgotPasswordHandler:', error.message); // Mantener log de error
        // Devolvemos la misma respuesta genérica incluso en caso de error interno por seguridad
        res.status(200).json({ message: 'Si existe una cuenta con ese email, se ha enviado un enlace para restablecer la contraseña.' }); // Corregido: contraseña
    }
};

/**
 * Handles password reset using token. POST /api/auth/reset-password/:token
 */
export const resetPasswordHandler = async (req: Request, res: Response) => {
    const { token } = req.params;
    const { password: newPassword }: ResetPasswordDto = req.body;
    // console.log(`[PWD_RESET CTRL] Reset password attempt with token: ${token ? token.substring(0,5)+'...' : 'undefined'}`); // Log reducido

    // Validaciones
    if (!token) {
        return res.status(400).json({ message: 'Falta el token de reseteo.' });
    }
    if (!newPassword) {
        return res.status(400).json({ message: 'Se requiere la nueva contraseña.' }); // Corregido: contraseña
    }
    if (newPassword.length < 6) {
        return res.status(400).json({ message: 'La nueva contraseña debe tener al menos 6 caracteres.' }); // Corregido: contraseña
    }

    try {
        // Hashear la nueva contraseña ANTES de pasarla al servicio
        const hashedNewPassword = await hashPassword(newPassword);
        await handleResetPassword(token, hashedNewPassword); // Llama al servicio con la contraseña ya hasheada

        res.status(200).json({ message: 'Contraseña restablecida con éxito.' }); // Corregido: Contraseña, éxito
    } catch (error: any) {
        console.error(`[PWD_RESET CTRL] Error in resetPasswordHandler for token ${token ? token.substring(0,5)+'...' : 'undefined'}:`, error.message); // Mantener log de error
        // Usamos el mensaje del servicio (ej: 'Token inválido o expirado.') o uno genérico
        res.status(400).json({ message: error.message || 'No se pudo restablecer la contraseña.' }); // Corregido: contraseña
    }
};

// End of File: backend/src/auth/password-reset.controller.ts