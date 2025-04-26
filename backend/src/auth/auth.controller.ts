// filename: backend/src/auth/auth.controller.ts
// --- INICIO DEL CÃ“DIGO MODIFICADO ---
// File: backend/src/auth/auth.controller.ts
// Version: 2.0.0 (Refactored: Uses new services and validation utils)

import { Request, Response } from 'express';
import { Prisma, DocumentType, User } from '@prisma/client';

// Importar DTOs (sin cambios)
import { RegisterUserDto, ForgotPasswordDto, ResetPasswordDto, RegisterBusinessDto } from './auth.dto';

// --- NUEVO: Importar funciones de validaciÃ³n desde utils ---
import { isValidDni, isValidNie, isValidPhoneNumber } from '../utils/validation';

// --- NUEVO: Importar funciones desde los servicios refactorizados ---
import { comparePassword, generateToken, findUserByEmail, hashPassword } from './auth.service'; // Utilidades
import { createUser, createBusinessAndAdmin } from './registration.service'; // LÃ³gica de registro
import { handleForgotPassword, handleResetPassword } from './password-reset.service'; // LÃ³gica de reseteo

// --- Las funciones auxiliares isValidDni, isValidNie se han movido a ../utils/validation.ts ---


/**
 * Handles CUSTOMER user registration. POST /auth/register
 * (Ahora usa utils de validaciÃ³n y el servicio de registro)
 */
export const register = async (req: Request, res: Response) => {
    const { email, password, name, phone, documentId, documentType, businessId, role }: RegisterUserDto = req.body;
    console.log(`[AUTH CTRL DIAG] Attempting customer registration for email: ${email}`);

    // ValidaciÃ³n de campos obligatorios para cliente
    if (!email || !password || !phone || !documentId || !documentType || !businessId || !role || role !== 'CUSTOMER_FINAL') {
        console.log('[AUTH CTRL DIAG] Registration failed: Missing required fields or invalid role for customer.');
        return res.status(400).json({ message: 'Faltan campos obligatorios o rol invÃ¡lido para registro de cliente.' });
    }

    // ComprobaciÃ³n de Email Duplicado (usa auth.service)
    try {
        const existingUser = await findUserByEmail(email);
        if (existingUser) {
            console.log(`[AUTH CTRL DIAG] Registration failed: User email already exists: ${email}. Sending 409.`);
            return res.status(409).json({ message: 'El email ya estÃ¡ registrado.' });
        }

        // --- ValidaciÃ³n de Formato (usa utils/validation) ---
        if (!isValidPhoneNumber(phone)) { // Usa utilidad importada
             return res.status(400).json({ message: 'Formato de telÃ©fono invÃ¡lido.' });
        }
        let isDocumentValid = false;
        const upperDocumentId = documentId.toUpperCase(); // Normalizar a mayÃºsculas
        switch (documentType) {
            case DocumentType.DNI: isDocumentValid = isValidDni(upperDocumentId); break; // Usa utilidad importada
            case DocumentType.NIE: isDocumentValid = isValidNie(upperDocumentId); break; // Usa utilidad importada
            case DocumentType.PASSPORT: isDocumentValid = upperDocumentId.trim().length > 3; break;
            case DocumentType.OTHER: isDocumentValid = upperDocumentId.trim().length > 0; break;
            default: return res.status(400).json({ message: 'Tipo de documento invÃ¡lido.' });
        }
        if (!isDocumentValid) { return res.status(400).json({ message: `Formato de ${documentType} invÃ¡lido.` }); }
        // --- Fin ValidaciÃ³n Formato ---

        // Llamar al Servicio createUser (desde registration.service)
        console.log(`[AUTH CTRL DIAG] Calling createUser service for customer ${email}...`);
        const userDataForService: RegisterUserDto = {
             email, password, name, phone,
             documentId: upperDocumentId, // Enviar normalizado
             documentType, businessId, role
        };
        const newUser = await createUser(userDataForService); // Llama a la funciÃ³n importada

        // Ã‰xito: Responder
        console.log(`[AUTH CTRL DIAG] Customer user created: ${newUser.id}.`);
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { password: _, documentId: __, ...userWithoutSensitiveData } = newUser;
        console.log(`[AUTH CTRL DIAG] Customer registration successful for user ${newUser.id}. Sending 201.`);
        res.status(201).json({ user: userWithoutSensitiveData });

   } catch (error) {
        // Manejo de Errores (igual que antes, captura errores de los servicios)
        if (error instanceof Error && (error.message.includes('telÃ©fono') || error.message.includes('documento') || error.message.includes('Business with ID') || error.message.includes('ya estÃ¡ registrado'))) {
            return res.status(409).json({ message: error.message });
        }
        if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
            const target = (error.meta?.target as string[])?.join(', ');
            console.error(`[AUTH CTRL DIAG] Registration failed: Unique constraint DB error on ${target}.`);
            return res.status(409).json({ message: `Error de unicidad en ${target}` });
        }
        console.error('[AUTH CTRL DIAG] Error during customer registration:', error);
        res.status(500).json({ message: 'Error del servidor durante el registro.' });
   }
};


/**
 * Handles user login. POST /auth/login
 * (Usa utilidades de auth.service)
 */
export const login = async (req: Request, res: Response) => {
    const { email, password } = req.body;
    console.log(`[AUTH CTRL DIAG] Attempting login for email: ${email}`);

    if (!email || !password) {
        console.log('[AUTH CTRL DIAG] Login failed: Email or password missing.');
        return res.status(400).json({ message: 'Se requieren email y contraseÃ±a.' });
    }

    try {
        console.log(`[AUTH CTRL DIAG] Finding user by email: ${email}`);
        const user = await findUserByEmail(email); // Usa utilidad importada
        if (!user || !user.isActive) {
            console.log(`[AUTH CTRL DIAG] User not found or inactive for email: ${email}. Sending 401.`);
            return res.status(401).json({ message: 'Credenciales invÃ¡lidas o usuario inactivo.' });
        }

        console.log(`[AUTH CTRL DIAG] User found: ${user.id}. Comparing password...`);
        const passwordMatch = await comparePassword(password, user.password); // Usa utilidad importada
        if (!passwordMatch) {
            console.log(`[AUTH CTRL DIAG] Password mismatch for user ${user.id}. Sending 401.`);
            return res.status(401).json({ message: 'Credenciales invÃ¡lidas.' });
        }

        console.log(`[AUTH CTRL DIAG] Password matches for user ${user.id}. Generating token...`);
        const token = generateToken(user); // Usa utilidad importada
        // Excluimos campos sensibles
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { password: _, documentId: __, resetPasswordToken: ___, resetPasswordExpires: ____, ...userWithoutSensitiveData } = user;
        console.log(`[AUTH CTRL DIAG] Login successful for user ${user.id}. Sending 200.`);
        res.status(200).json({ user: userWithoutSensitiveData, token });

    } catch (error) {
        console.error('[AUTH CTRL DIAG] Error during login:', error);
        res.status(500).json({ message: 'Error del servidor durante el inicio de sesiÃ³n.' });
    }
};


/**
 * Handles registration of a new business and its initial admin user.
 * POST /auth/register-business
 * (Ahora usa registration.service y auth.service)
 */
export const registerBusinessHandler = async (req: Request, res: Response) => {
    const { businessName, adminEmail, adminPassword, adminName }: RegisterBusinessDto = req.body;
    console.log(`[AUTH CTRL] Attempting business registration for: ${businessName} / ${adminEmail}`);

    // ValidaciÃ³n bÃ¡sica (sin cambios)
    if (!businessName || !adminEmail || !adminPassword) {
        return res.status(400).json({ message: 'Nombre del negocio, email del administrador y contraseÃ±a son requeridos.' });
    }
    if (businessName.trim().length < 2) {
        return res.status(400).json({ message: 'El nombre del negocio debe tener al menos 2 caracteres.' });
    }
    if (adminPassword.length < 6) {
        return res.status(400).json({ message: 'La contraseÃ±a debe tener al menos 6 caracteres.' });
    }

    try {
        // Llamar al servicio de registro (desde registration.service)
        console.log(`[AUTH CTRL] Calling createBusinessAndAdmin service for ${adminEmail}...`);
        const newAdminUser = await createBusinessAndAdmin({ // Llama a funciÃ³n importada
            businessName: businessName.trim(),
            adminEmail,
            adminPassword,
            adminName: adminName?.trim()
        });

        // Generar token (desde auth.service)
        const token = generateToken(newAdminUser as User); // Llama a funciÃ³n importada

        // Enviar respuesta (sin cambios)
        console.log(`[AUTH CTRL] Business registration successful for ${newAdminUser.email}. Sending 201.`);
        res.status(201).json({
            user: newAdminUser, // Ya viene sin contraseÃ±a
            token: token
        });

    } catch (error: any) {
        console.error('[AUTH CTRL] Error during business registration:', error);
        // Manejo de errores (igual que antes)
        if (error instanceof Error) {
             if (error.message.includes('El email proporcionado ya estÃ¡ registrado') ||
                 error.message.includes('Ya existe un negocio con un nombre similar')) {
                 return res.status(409).json({ message: error.message }); // 409 Conflict
             }
              if (error.message.includes('nombre del negocio') || error.message.includes('Error de base de datos')) {
                   return res.status(400).json({ message: error.message });
              }
        }
        res.status(500).json({ message: error.message || 'Error del servidor durante el registro del negocio.' });
    }
};


// --- Handlers para Reseteo de ContraseÃ±a (Ahora usan password-reset.service) ---

export const forgotPasswordHandler = async (req: Request, res: Response) => {
    const { email }: ForgotPasswordDto = req.body;
    console.log(`[AUTH CTRL] Forgot password request for email: ${email}`);
    if (!email) { return res.status(400).json({ message: 'Se requiere el email.' }); }
    try {
        await handleForgotPassword(email); // Llama a funciÃ³n importada
        // Respuesta genÃ©rica (sin cambios)
        res.status(200).json({ message: 'Si existe una cuenta con ese email, se ha enviado un enlace para restablecer la contraseÃ±a.' });
    } catch (error: any) {
        console.error('[AUTH CTRL] Error in forgotPasswordHandler:', error.message);
        // Respuesta genÃ©rica (sin cambios)
        res.status(200).json({ message: 'Si existe una cuenta con ese email, se ha enviado un enlace para restablecer la contraseÃ±a.' });
    }
};

export const resetPasswordHandler = async (req: Request, res: Response) => {
    const { token } = req.params;
    const { password: newPassword }: ResetPasswordDto = req.body;
    console.log(`[AUTH CTRL] Reset password attempt with token: ${token ? token.substring(0,5)+'...' : 'undefined'}`);
    // Validaciones (sin cambios)
    if (!token) { return res.status(400).json({ message: 'Falta el token de reseteo.' }); }
    if (!newPassword) { return res.status(400).json({ message: 'Se requiere la nueva contraseÃ±a.' }); }
    if (newPassword.length < 6) { return res.status(400).json({ message: 'La nueva contraseÃ±a debe tener al menos 6 caracteres.' }); }
    try {
        const hashedNewPassword = await hashPassword(newPassword); // Usa utilidad importada
        await handleResetPassword(token, hashedNewPassword); // Llama a funciÃ³n importada
        res.status(200).json({ message: 'ContraseÃ±a restablecida con Ã©xito.' });
    } catch (error: any) {
        console.error(`[AUTH CTRL] Error in resetPasswordHandler for token ${token ? token.substring(0,5)+'...' : 'undefined'}:`, error.message);
        // Usa el mensaje del servicio (que ahora puede ser 'Token invÃ¡lido o expirado.')
        res.status(400).json({ message: error.message || 'No se pudo restablecer la contraseÃ±a.' });
    }
};

// End of File: backend/src/auth/auth.controller.ts
// --- FIN DEL CÃ“DIGO MODIFICADO ---