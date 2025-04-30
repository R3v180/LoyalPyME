// filename: backend/src/auth/password-reset.controller.ts
// Version: 1.0.3 (Remove Swagger annotations)

import { Request, Response } from 'express';
// DTOs necesarios para reseteo
import { ForgotPasswordDto, ResetPasswordDto } from './auth.dto';

// Servicios necesarios
import { hashPassword } from './auth.service';
import { handleForgotPassword, handleResetPassword } from './password-reset.service';

// SIN ANOTACIÓN @openapi
export const forgotPasswordHandler = async (req: Request, res: Response) => {
    const { email }: ForgotPasswordDto = req.body;

    if (!email) {
        return res.status(400).json({ message: 'Se requiere el email.' });
    }
    try {
        await handleForgotPassword(email);
        res.status(200).json({ message: 'Si existe una cuenta con ese email, se ha enviado un enlace para restablecer la contraseña.' });
    } catch (error: any) {
        console.error('[PWD_RESET CTRL] Error in forgotPasswordHandler:', error.message);
        res.status(200).json({ message: 'Si existe una cuenta con ese email, se ha enviado un enlace para restablecer la contraseña.' });
    }
};

// SIN ANOTACIÓN @openapi
export const resetPasswordHandler = async (req: Request, res: Response) => {
    const { token } = req.params;
    const { password: newPassword }: ResetPasswordDto = req.body;

    if (!token) {
        return res.status(400).json({ message: 'Falta el token de reseteo.' });
    }
    if (!newPassword) {
        return res.status(400).json({ message: 'Se requiere la nueva contraseña.' });
    }
    if (newPassword.length < 6) {
        return res.status(400).json({ message: 'La nueva contraseña debe tener al menos 6 caracteres.' });
    }

    try {
        const hashedNewPassword = await hashPassword(newPassword);
        await handleResetPassword(token, hashedNewPassword);

        res.status(200).json({ message: 'Contraseña restablecida con éxito.' });
    } catch (error: any) {
        console.error(`[PWD_RESET CTRL] Error in resetPasswordHandler for token ${token ? token.substring(0,5)+'...' : 'undefined'}:`, error.message);
        res.status(400).json({ message: error.message || 'No se pudo restablecer la contraseña.' });
    }
};

// End of File: backend/src/auth/password-reset.controller.ts