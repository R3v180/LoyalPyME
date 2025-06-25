// filename: backend/src/auth/auth.service.ts
// Version: 2.1.0 (Add conditional logging for test environment)

import { PrismaClient, User } from '@prisma/client';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

const prisma = new PrismaClient();
const JWT_SECRET = process.env.JWT_SECRET as string;

// Validación de JWT_SECRET
if (!JWT_SECRET) {
    console.error('FATAL ERROR: JWT_SECRET is not defined in auth.service.');
    // process.exit(1); // Considerar salir
}

// --- Funciones de Utilidad Básicas ---

/**
 * Hashea una contraseña usando bcrypt.
 */
export const hashPassword = async (password: string): Promise<string> => {
    const salt = await bcrypt.genSalt(10);
    return bcrypt.hash(password, salt);
};

/**
 * Compara una contraseña en texto plano con una hasheada.
 */
export const comparePassword = async (plainPassword: string, hashedPassword: string): Promise<boolean> => {
    // --- LOG DE DEBUG (Solo en Test) ---
    if (process.env.VITEST === 'true') {
        console.log(`[DEBUG TEST - comparePassword] Comparing provided password with hash ${hashedPassword ? hashedPassword.substring(0,10) : 'N/A'}...`);
    }
    // --- FIN LOG DE DEBUG ---
    const isMatch = await bcrypt.compare(plainPassword, hashedPassword);
    // --- LOG DE DEBUG (Solo en Test) ---
    if (process.env.VITEST === 'true') {
        console.log(`[DEBUG TEST - comparePassword] Result: ${isMatch}`);
    }
    // --- FIN LOG DE DEBUG ---
    return isMatch;
};

/**
 * Genera un token JWT para un usuario.
 */
export const generateToken = (user: Pick<User, 'id' | 'role' | 'businessId'>): string => {
    const payload = {
        userId: user.id,
        role: user.role,
        businessId: user.businessId
    };
    const token = jwt.sign(payload, JWT_SECRET, { expiresIn: '7d' }); // 7 días de expiración
    return token;
};

/**
 * Encuentra un usuario por su dirección de email.
 */
export const findUserByEmail = async (email: string): Promise<User | null> => {
    // --- LOG DE DEBUG (Solo en Test) ---
    if (process.env.VITEST === 'true') {
        console.log(`[DEBUG TEST - findUserByEmail] Searching for email: ${email}`);
    }
    // --- FIN LOG DE DEBUG ---
    const user = await prisma.user.findUnique({ where: { email } });
    // --- LOG DE DEBUG (Solo en Test) ---
    if (process.env.VITEST === 'true') {
        console.log(`[DEBUG TEST - findUserByEmail] User found: ${user ? `{ id: ${user.id}, email: ${user.email}, isActive: ${user.isActive} }` : 'null'}`);
    }
    // --- FIN LOG DE DEBUG ---
    return user;
};

// --- Funciones movidas a otros servicios ---
// createUser -> registration.service.ts
// handleForgotPassword, handleResetPassword -> password-reset.service.ts
// createBusinessAndAdmin, generateSlug -> registration.service.ts

// End of File: backend/src/auth/auth.service.ts