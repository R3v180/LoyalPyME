// File: backend/src/auth/auth.service.ts
// Version: 1.3.0 (Implement Forgot/Reset Password Logic)

import { PrismaClient, User, UserRole, DocumentType } from '@prisma/client';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
// --- NUEVO: Importar crypto para generar token seguro ---
import crypto from 'crypto';
// --- FIN NUEVO ---
import { RegisterUserDto } from './auth.dto'; // Import DTO desde archivo separado

const prisma = new PrismaClient();
const JWT_SECRET = process.env.JWT_SECRET as string;
if (!JWT_SECRET) { console.error('FATAL ERROR: JWT_SECRET is not defined.'); /* process.exit(1); */ }

// Constante para la expiración del token de reseteo (ej: 1 hora en milisegundos)
const RESET_TOKEN_EXPIRATION_MS = 60 * 60 * 1000; // 1 hour

// hashPassword (sin cambios)
export const hashPassword = async (password: string): Promise<string> => { const salt = await bcrypt.genSalt(10); return bcrypt.hash(password, salt); };

// comparePassword (sin cambios)
export const comparePassword = async (plainPassword: string, hashedPassword: string): Promise<boolean> => { return bcrypt.compare(plainPassword, hashedPassword); };

// generateToken (sin cambios)
export const generateToken = (user: User): string => { const payload = { userId: user.id, role: user.role, businessId: user.businessId }; const token = jwt.sign( payload, JWT_SECRET, { expiresIn: '7d' } ); return token; };

// findUserByEmail (sin cambios)
export const findUserByEmail = async (email: string): Promise<User | null> => { return prisma.user.findUnique({ where: { email }, }); };

// createUser (sin cambios funcionales, ya incluye nuevos campos y checks)
export const createUser = async (userData: RegisterUserDto): Promise<User> => {
   const businessExists = await prisma.business.findUnique({ where: { id: userData.businessId } });
   if (!businessExists) { throw new Error(`Business with ID ${userData.businessId} not found.`); }
   if (userData.phone) { const existingPhone = await prisma.user.findUnique({ where: { phone: userData.phone }, select: { id: true } }); if (existingPhone) throw new Error('El teléfono ya está registrado.'); } else { throw new Error('El teléfono es un campo obligatorio.'); }
   if (userData.documentId) { const existingDocument = await prisma.user.findUnique({ where: { documentId: userData.documentId }, select: { id: true } }); if (existingDocument) throw new Error('El documento de identidad ya está registrado.'); } else { throw new Error('El documento de identidad es un campo obligatorio.'); }
   console.log(`[AUTH SVC] Uniqueness checks passed for ${userData.email}. Creating user...`);
   return prisma.user.create({ data: { email: userData.email, password: userData.password, name: userData.name, phone: userData.phone, documentId: userData.documentId, documentType: userData.documentType, role: userData.role, businessId: userData.businessId, }, });
};


// --- NUEVO: Lógica para solicitar reseteo de contraseña ---
/**
 * Genera y guarda un token de reseteo hasheado para un usuario dado su email.
 * Loguea el token original (sin hashear) para simular el envío de email.
 * @param email Email del usuario.
 * @returns Promise<void>
 */
export const handleForgotPassword = async (email: string): Promise<void> => {
    console.log(`[AUTH SVC] Handling forgot password for: ${email}`);
    const user = await findUserByEmail(email);

    // No dar error si el usuario no existe (seguridad)
    if (!user) {
        console.log(`[AUTH SVC] User not found for forgot password: ${email}. Responding generically.`);
        return; // Salir silenciosamente
    }

    // Generar un token aleatorio seguro (32 bytes -> 64 caracteres hexadecimales)
    const resetToken = crypto.randomBytes(32).toString('hex');
    console.log(`[AUTH SVC] Generated PLAIN reset token for ${email}: ${resetToken}`); // <-- ESTE ES EL QUE USARÍAMOS EN EL ENLACE DEL EMAIL (Y PARA PRUEBAS)

    // Hashear el token antes de guardarlo en la BD
    const hashedResetToken = await hashPassword(resetToken);

    // Calcular fecha de expiración
    const expires = new Date(Date.now() + RESET_TOKEN_EXPIRATION_MS);

    try {
        // Actualizar el usuario con el token hasheado y la expiración
        await prisma.user.update({
            where: { email: email },
            data: {
                resetPasswordToken: hashedResetToken,
                resetPasswordExpires: expires,
            },
        });
        console.log(`[AUTH SVC] Hashed reset token stored successfully for user ${user.id}`);
        // Aquí iría la lógica real de envío de email con el 'resetToken' (el original)

    } catch (error) {
        console.error(`[AUTH SVC] Failed to store reset token for user ${user.id}:`, error);
        // No relanzar el error para mantener la respuesta genérica en el controller
    }
};
// --- FIN NUEVO ---


// --- NUEVO: Lógica para realizar el reseteo de contraseña ---
/**
 * Valida un token de reseteo (comparando con el hash guardado) y actualiza la contraseña.
 * @param token El token original (sin hashear) recibido por el usuario.
 * @param hashedNewPassword La nueva contraseña ya hasheada.
 * @returns Promise<void>
 * @throws Error si el token es inválido, ha expirado o falla la actualización.
 */
export const handleResetPassword = async (token: string, hashedNewPassword: string): Promise<void> => {
    console.log(`[AUTH SVC] Handling reset password with token starting: ${token.substring(0, 5)}...`);

    // 1. Buscar usuarios que tengan un token de reseteo VÁLIDO (no expirado y no nulo)
    //    No podemos buscar directamente por el token hasheado eficientemente.
    const potentialUsers = await prisma.user.findMany({
        where: {
            resetPasswordToken: { not: null },      // Que tengan un token guardado
            resetPasswordExpires: { gt: new Date() } // Y que no haya expirado
        }
    });

    if (!potentialUsers || potentialUsers.length === 0) {
         console.log('[AUTH SVC] No users found with potentially valid reset tokens.');
         throw new Error('Token inválido o expirado.'); // Error genérico
    }

    console.log(`[AUTH SVC] Found ${potentialUsers.length} users with active tokens. Verifying provided token...`);
    let userToUpdate: User | null = null;

    // 2. Comparar el token proporcionado (plano) con el hash guardado de cada candidato
    for (const user of potentialUsers) {
        if (user.resetPasswordToken) {
             const isTokenMatch = await comparePassword(token, user.resetPasswordToken);
             if (isTokenMatch) {
                 // ¡Coincidencia encontrada!
                 console.log(`[AUTH SVC] Token match found for user ID: ${user.id}`);
                 userToUpdate = user;
                 break; // Salir del bucle
             }
        }
    }

    // 3. Si no se encontró coincidencia después de revisar todos los candidatos
    if (!userToUpdate) {
         console.log(`[AUTH SVC] No user matched the provided token.`);
         throw new Error('Token inválido o expirado.'); // Mismo error genérico
    }

    // 4. Si todo es válido, actualizar la contraseña y limpiar los campos de reseteo
    try {
        await prisma.user.update({
            where: { id: userToUpdate.id },
            data: {
                password: hashedNewPassword,
                resetPasswordToken: null, // Limpiar token
                resetPasswordExpires: null, // Limpiar expiración
            },
        });
        console.log(`[AUTH SVC] Password reset successful for user ${userToUpdate.id}`);
    } catch (error) {
        console.error(`[AUTH SVC] Failed to update password for user ${userToUpdate.id}:`, error);
        throw new Error('Error al actualizar la contraseña.'); // Traducido
    }
};
// --- FIN NUEVO ---


// End of File: backend/src/auth/auth.service.ts