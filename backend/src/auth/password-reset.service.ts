// filename: backend/src/auth/password-reset.service.ts
// Contiene la lÃ³gica para el flujo de olvido y reseteo de contraseÃ±a

import { PrismaClient, User } from '@prisma/client';
import bcrypt from 'bcryptjs'; // Necesario para comparePassword si se mueve aquÃ­, pero lo importaremos
import crypto from 'crypto';

// Importar utilidades necesarias desde el servicio principal de auth
// ASUNCIÃ“N: Estas funciones permanecerÃ¡n o serÃ¡n exportadas desde auth.service.ts
import { hashPassword, comparePassword, findUserByEmail } from './auth.service';

const prisma = new PrismaClient();

// Constante de expiraciÃ³n (especÃ­fica de este flujo)
const RESET_TOKEN_EXPIRATION_MS = 60 * 60 * 1000; // 1 hour

// --- Funciones para Reseteo de ContraseÃ±a ---

export const handleForgotPassword = async (email: string): Promise<void> => {
    console.log(`[PWD_RESET SVC] Handling forgot password for: ${email}`);
    const user = await findUserByEmail(email); // Usa la utilidad importada
    if (!user) {
        console.log(`[PWD_RESET SVC] User not found for forgot password: ${email}. Responding generically.`);
        return; // Salir silenciosamente
    }
    // Generar token
    const resetToken = crypto.randomBytes(32).toString('hex');
    console.log(`[PWD_RESET SVC] Generated PLAIN reset token for ${email}: ${resetToken}`); // Log para pruebas
    const hashedResetToken = await hashPassword(resetToken); // Usa la utilidad importada
    const expires = new Date(Date.now() + RESET_TOKEN_EXPIRATION_MS);

    // Guardar token hasheado y expiraciÃ³n
    try {
        await prisma.user.update({
            where: { email: email },
            data: {
                resetPasswordToken: hashedResetToken,
                resetPasswordExpires: expires,
            },
        });
        console.log(`[PWD_RESET SVC] Hashed reset token stored successfully for user ${user.id}`);
        // AquÃ­ irÃ­a la lÃ³gica real de envÃ­o de email con el 'resetToken' (el original)
        // Ejemplo: await sendPasswordResetEmail(user.email, resetToken);
    } catch (error) {
        console.error(`[PWD_RESET SVC] Failed to store reset token for user ${user.id}:`, error);
        // Considerar si relanzar o manejar el error de forma diferente
    }
};

export const handleResetPassword = async (token: string, hashedNewPassword: string): Promise<void> => {
    console.log(`[PWD_RESET SVC] Handling reset password with token starting: ${token.substring(0, 5)}...`);
    // Buscar usuarios con token activo y no expirado
    const potentialUsers = await prisma.user.findMany({
        where: {
            resetPasswordToken: { not: null },
            resetPasswordExpires: { gt: new Date() }
        }
    });

    if (!potentialUsers || potentialUsers.length === 0) {
         console.log('[PWD_RESET SVC] No users found with potentially valid reset tokens.');
         throw new Error('Token invÃ¡lido o expirado.'); // Error genÃ©rico
    }
    console.log(`[PWD_RESET SVC] Found ${potentialUsers.length} users with active tokens. Verifying provided token...`);

    // Comparar token plano con hashes guardados
    let userToUpdate: User | null = null;
    for (const user of potentialUsers) {
        if (user.resetPasswordToken) {
             // Usa la utilidad importada
             const isTokenMatch = await comparePassword(token, user.resetPasswordToken);
             if (isTokenMatch) {
                 console.log(`[PWD_RESET SVC] Token match found for user ID: ${user.id}`);
                 userToUpdate = user;
                 break;
             }
        }
    }

    if (!userToUpdate) {
         console.log(`[PWD_RESET SVC] No user matched the provided token.`);
         throw new Error('Token invÃ¡lido o expirado.'); // Mismo error genÃ©rico
    }

    // Actualizar contraseÃ±a y limpiar campos de reseteo
    try {
        await prisma.user.update({
            where: { id: userToUpdate.id },
            data: {
                password: hashedNewPassword,
                resetPasswordToken: null,
                resetPasswordExpires: null,
            },
        });
        console.log(`[PWD_RESET SVC] Password reset successful for user ${userToUpdate.id}`);
    } catch (error) {
        console.error(`[PWD_RESET SVC] Failed to update password for user ${userToUpdate.id}:`, error);
        throw new Error('Error al actualizar la contraseÃ±a.');
    }
};

// End of File: backend/src/auth/password-reset.service.ts