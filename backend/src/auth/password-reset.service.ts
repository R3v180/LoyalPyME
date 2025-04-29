// filename: backend/src/auth/password-reset.service.ts
// Version: 1.0.1 (Fix encoding, remove insecure log, cleanup comments)

import { PrismaClient, User } from '@prisma/client';
// bcrypt ya no se usa directamente aquí si usamos comparePassword desde auth.service
import crypto from 'crypto';

// Importar utilidades necesarias desde el servicio principal de auth
// ASUNCIÓN: Estas funciones permanecerán o serán exportadas desde auth.service.ts
import { hashPassword, comparePassword, findUserByEmail } from './auth.service';

const prisma = new PrismaClient();

// Constante de expiración (específica de este flujo)
const RESET_TOKEN_EXPIRATION_MS = 60 * 60 * 1000; // 1 hour

// --- Funciones para Reseteo de Contraseña ---

export const handleForgotPassword = async (email: string): Promise<void> => {
    console.log(`[PWD_RESET SVC] Handling forgot password for: ${email}`);
    const user = await findUserByEmail(email); // Usa la utilidad importada
    if (!user) {
        console.log(`[PWD_RESET SVC] User not found for forgot password: ${email}. Responding generically.`);
        return; // Salir silenciosamente
    }

    const resetToken = crypto.randomBytes(32).toString('hex');
    // console.log(`[PWD_RESET SVC] Generated PLAIN reset token for ${email}: ${resetToken}`); // <-- LOG INSEGURO ELIMINADO
    const hashedResetToken = await hashPassword(resetToken);
    const expires = new Date(Date.now() + RESET_TOKEN_EXPIRATION_MS);

    try {
        await prisma.user.update({
            where: { email: email },
            data: {
                resetPasswordToken: hashedResetToken,
                resetPasswordExpires: expires,
            },
        });
        console.log(`[PWD_RESET SVC] Hashed reset token stored successfully for user ${user.id}`);
        // Aquí iría la lógica real de envío de email con el 'resetToken' (el original, NO el hasheado)
        // Ejemplo: await sendPasswordResetEmail(user.email, resetToken);
        // Por ahora, el token plano solo se logueaba (y ya hemos quitado eso)
    } catch (error) {
        console.error(`[PWD_RESET SVC] Failed to store reset token for user ${user.id}:`, error);
        // Considerar si relanzar o manejar el error de forma diferente
    }
};

export const handleResetPassword = async (token: string, hashedNewPassword: string): Promise<void> => {
    console.log(`[PWD_RESET SVC] Handling reset password with token starting: ${token.substring(0, 5)}...`);

    const potentialUsers = await prisma.user.findMany({
        where: {
            resetPasswordToken: { not: null },
            resetPasswordExpires: { gt: new Date() } // Buscar solo tokens no expirados
        }
    });

    if (!potentialUsers || potentialUsers.length === 0) {
        console.log('[PWD_RESET SVC] No users found with potentially valid (non-null, non-expired) reset tokens.');
        throw new Error('Token inválido o expirado.'); // Error genérico
    }
    console.log(`[PWD_RESET SVC] Found ${potentialUsers.length} users with active tokens. Verifying provided token...`);

    // Comparar token plano proporcionado con los hashes guardados
    let userToUpdate: User | null = null;
    for (const user of potentialUsers) {
        if (user.resetPasswordToken) {
            const isTokenMatch = await comparePassword(token, user.resetPasswordToken);
            if (isTokenMatch) {
                console.log(`[PWD_RESET SVC] Token match found for user ID: ${user.id}`);
                userToUpdate = user;
                break; // Encontramos el usuario, salimos del bucle
            }
        }
    }

    if (!userToUpdate) {
        // Si recorrimos todos los usuarios con token activo y ninguno coincidió
        console.log(`[PWD_RESET SVC] No user matched the provided token among active ones.`);
        throw new Error('Token inválido o expirado.'); // Mismo error genérico
    }

    // Actualizar contraseña y limpiar campos de reseteo
    try {
        await prisma.user.update({
            where: { id: userToUpdate.id },
            data: {
                password: hashedNewPassword,
                resetPasswordToken: null, // Limpiar token
                resetPasswordExpires: null, // Limpiar expiración
            },
        });
        console.log(`[PWD_RESET SVC] Password reset successful for user ${userToUpdate.id}`);
    } catch (error) {
        console.error(`[PWD_RESET SVC] Failed to update password for user ${userToUpdate.id}:`, error);
        throw new Error('Error al actualizar la contraseña.'); // Error más específico para el frontend
    }
};

// End of File: backend/src/auth/password-reset.service.ts