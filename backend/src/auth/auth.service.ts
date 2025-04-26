// filename: backend/src/auth/auth.service.ts
// --- INICIO DEL CÃ“DIGO MODIFICADO ---
// File: backend/src/auth/auth.service.ts
// Version: 2.0.0 (Refactored: Keeps only core utilities after splitting)

import { PrismaClient, User } from '@prisma/client';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
// Ya no necesitamos crypto aquÃ­

const prisma = new PrismaClient();
const JWT_SECRET = process.env.JWT_SECRET as string;

// ValidaciÃ³n de JWT_SECRET (se mantiene)
if (!JWT_SECRET) {
    console.error('FATAL ERROR: JWT_SECRET is not defined in auth.service.');
    // Considerar salir del proceso si es crÃ­tico: process.exit(1);
}

// --- Funciones de Utilidad BÃ¡sicas (Se mantienen y exportan) ---

/**
 * Hashea una contraseÃ±a usando bcrypt.
 * @param password - La contraseÃ±a en texto plano.
 * @returns La contraseÃ±a hasheada.
 */
export const hashPassword = async (password: string): Promise<string> => {
    const salt = await bcrypt.genSalt(10);
    return bcrypt.hash(password, salt);
};

/**
 * Compara una contraseÃ±a en texto plano con una hasheada.
 * @param plainPassword - La contraseÃ±a en texto plano.
 * @param hashedPassword - La contraseÃ±a hasheada almacenada.
 * @returns true si las contraseÃ±as coinciden, false en caso contrario.
 */
export const comparePassword = async (plainPassword: string, hashedPassword: string): Promise<boolean> => {
    return bcrypt.compare(plainPassword, hashedPassword);
};

/**
 * Genera un token JWT para un usuario.
 * @param user - El objeto User (al menos con id, role, businessId).
 * @returns El token JWT firmado.
 */
export const generateToken = (user: Pick<User, 'id' | 'role' | 'businessId'>): string => {
    // Incluir solo lo esencial y seguro en el payload
    const payload = {
        userId: user.id,
        role: user.role,
        businessId: user.businessId
    };
    // Considera un tiempo de expiraciÃ³n mÃ¡s corto para producciÃ³n si es posible
    const token = jwt.sign(payload, JWT_SECRET, { expiresIn: '7d' });
    return token;
};

/**
 * Encuentra un usuario por su direcciÃ³n de email.
 * @param email - El email del usuario a buscar.
 * @returns El objeto User completo o null si no se encuentra.
 */
export const findUserByEmail = async (email: string): Promise<User | null> => {
    return prisma.user.findUnique({ where: { email } });
};

// --- Las funciones createUser, handleForgotPassword, handleResetPassword, createBusinessAndAdmin y generateSlug han sido movidas a:
// --- registration.service.ts y password-reset.service.ts
// --- AsegÃºrate de que los controladores que las usaban ahora importen desde esos nuevos archivos.

// End of File: backend/src/auth/auth.service.ts
// --- FIN DEL CÃ“DIGO MODIFICADO ---