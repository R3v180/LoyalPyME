// filename: backend/src/auth/auth.controller.ts
// Version: 2.1.0 (Refactored: Only contains login handler, cleaned)

import { Request, Response } from 'express';
import { User } from '@prisma/client'; // Needed for type casting if generateToken expects User

// Importar solo utilidades necesarias para login desde auth.service
import { comparePassword, generateToken, findUserByEmail } from './auth.service';

/**
 * Handles user login. POST /api/auth/login
 */
export const login = async (req: Request, res: Response) => {
    const { email, password } = req.body;
    // console.log(`[AUTH CTRL] Attempting login for email: ${email}`); // Log reducido

    if (!email || !password) {
        // console.log('[AUTH CTRL] Login failed: Email or password missing.'); // Log reducido
        return res.status(400).json({ message: 'Se requieren email y contraseña.' }); // Corregido: contraseña
    }

    try {
        // console.log(`[AUTH CTRL] Finding user by email: ${email}`); // Log reducido
        const user = await findUserByEmail(email);
        if (!user || !user.isActive) {
            // console.log(`[AUTH CTRL] User not found or inactive for email: ${email}. Sending 401.`); // Log reducido
            // Devolvemos 401 Unauthorized para ambos casos (no encontrado o inactivo) por seguridad
            return res.status(401).json({ message: 'Credenciales inválidas o usuario inactivo.' }); // Corregido: inválidas
        }

        // console.log(`[AUTH CTRL] User found: ${user.id}. Comparing password...`); // Log reducido
        const passwordMatch = await comparePassword(password, user.password);
        if (!passwordMatch) {
            // console.log(`[AUTH CTRL] Password mismatch for user ${user.id}. Sending 401.`); // Log reducido
            return res.status(401).json({ message: 'Credenciales inválidas.' }); // Corregido: inválidas
        }

        // console.log(`[AUTH CTRL] Password matches for user ${user.id}. Generating token...`); // Log reducido
        const token = generateToken(user); // generateToken necesita id, role, businessId

        // Excluimos campos sensibles de la respuesta. Ahora quitamos las variables no usadas directamente.
        const {
            password: _password, // Renombrar para evitar conflicto y marcar como no usado
            documentId: _documentId,
            resetPasswordToken: _resetPasswordToken,
            resetPasswordExpires: _resetPasswordExpires,
            ...userWithoutSensitiveData // El resto de campos del usuario
        } = user;

        console.log(`[AUTH CTRL] Login successful for user ${user.id}. Sending 200.`);
        res.status(200).json({ user: userWithoutSensitiveData, token });

    } catch (error) {
        console.error('[AUTH CTRL] Error during login:', error); // Mantener log de error
        res.status(500).json({ message: 'Error del servidor durante el inicio de sesión.' }); // Corregido: sesión
    }
};

// Las funciones register, registerBusinessHandler, forgotPasswordHandler, resetPasswordHandler han sido movidas.

// End of File: backend/src/auth/auth.controller.ts