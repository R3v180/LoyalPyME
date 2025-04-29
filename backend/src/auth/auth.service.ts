// filename: backend/src/auth/auth.service.ts
// Version: 2.0.1 (Fix character encoding)

import { PrismaClient, User } from '@prisma/client';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

const prisma = new PrismaClient();
const JWT_SECRET = process.env.JWT_SECRET as string;

// Validación de JWT_SECRET (se mantiene)
if (!JWT_SECRET) {
    console.error('FATAL ERROR: JWT_SECRET is not defined in auth.service.');
    // Considerar salir del proceso si es crítico: process.exit(1);
}

// --- Funciones de Utilidad Básicas (Se mantienen y exportan) ---

/**
 * Hashea una contraseña usando bcrypt.
 * @param password - La contraseña en texto plano.
 * @returns La contraseña hasheada.
 */
export const hashPassword = async (password: string): Promise<string> => {
    const salt = await bcrypt.genSalt(10);
    return bcrypt.hash(password, salt);
};

/**
 * Compara una contraseña en texto plano con una hasheada.
 * @param plainPassword - La contraseña en texto plano.
 * @param hashedPassword - La contraseña hasheada almacenada.
 * @returns true si las contraseñas coinciden, false en caso contrario.
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
    // Considera un tiempo de expiración más corto para producción si es posible
    const token = jwt.sign(payload, JWT_SECRET, { expiresIn: '7d' });
    return token;
};

/**
 * Encuentra un usuario por su dirección de email.
 * @param email - El email del usuario a buscar.
 * @returns El objeto User completo o null si no se encuentra.
 */
export const findUserByEmail = async (email: string): Promise<User | null> => {
    return prisma.user.findUnique({ where: { email } });
};

// --- Las funciones createUser, handleForgotPassword, handleResetPassword, createBusinessAndAdmin y generateSlug han sido movidas a:
// --- registration.service.ts y password-reset.service.ts
// --- Asegúrate de que los controladores que las usaban ahora importen desde esos nuevos archivos.

// End of File: backend/src/auth/auth.service.ts