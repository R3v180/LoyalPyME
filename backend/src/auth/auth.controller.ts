// File: backend/src/auth/auth.controller.ts
// Version: 1.5.1 (Correct Register logic + Add Forgot/Reset Handlers - COMPLETE)

import { Request, Response } from 'express';
import { Prisma, DocumentType } from '@prisma/client';
// Importar service functions (incluyendo las futuras handleForgotPassword/handleResetPassword)
import {
    hashPassword, comparePassword, generateToken, findUserByEmail, createUser,
    handleForgotPassword, handleResetPassword
} from './auth.service';
// Importar DTOs
import { RegisterUserDto, ForgotPasswordDto, ResetPasswordDto } from './auth.dto';


// Funciones auxiliares (isValidDni, isValidNie) - Sin cambios
function isValidDni(dni: string): boolean { if (!/^\d{8}[A-Z]$/i.test(dni)) { return false; } const numero = parseInt(dni.substring(0, 8), 10); const letra = dni.substring(8, 9).toUpperCase(); const letrasControl = "TRWAGMYFPDXBNJZSQVHLCKE"; const letraCalculada = letrasControl.charAt(numero % 23); return letra === letraCalculada; }
function isValidNie(nie: string): boolean { if (!/^[XYZ]\d{7}[A-Z]$/i.test(nie)) { return false; } let numeroStr = nie.substring(1, 8); const letraInicial = nie.substring(0, 1).toUpperCase(); if (letraInicial === 'Y') numeroStr = '1' + numeroStr; if (letraInicial === 'Z') numeroStr = '2' + numeroStr; const numero = parseInt(numeroStr, 10); const letra = nie.substring(8, 9).toUpperCase(); const letrasControl = "TRWAGMYFPDXBNJZSQVHLCKE"; const letraCalculada = letrasControl.charAt(numero % 23); return letra === letraCalculada; }


/**
 * Handles user registration.
 * POST /auth/register
 * (Versión con orden de validación corregido)
 */
export const register = async (req: Request, res: Response) => {
  const { email, password, name, phone, documentId, documentType, businessId, role }: RegisterUserDto = req.body;
  console.log(`[AUTH CTRL DIAG] Attempting registration for email: ${email}`);

  // 1. Validación de campos obligatorios
  if (!email || !password || !phone || !documentId || !documentType || !businessId || !role) {
      console.log('[AUTH CTRL DIAG] Registration failed: Missing required fields.');
      return res.status(400).json({ message: 'Faltan campos obligatorios.' });
  }

  try {
    // 2. Comprobación de Email Duplicado PRIMERO
    console.log(`[AUTH CTRL DIAG] Checking if user email exists: ${email}`);
    const existingUser = await findUserByEmail(email);
    if (existingUser) {
      console.log(`[AUTH CTRL DIAG] Registration failed: User email already exists: ${email}. Sending 409.`);
      return res.status(409).json({ message: 'El email ya está registrado.' });
    }

    // 3. Validación de Formato (ahora después de comprobar email)
    console.log(`[AUTH CTRL DIAG] Email is unique. Validating formats...`);
    const phoneRegex = /^\+[0-9]{9,15}$/;
    if (!phoneRegex.test(phone)) {
        console.log(`[AUTH CTRL DIAG] Registration failed: Invalid phone format: ${phone}`);
        return res.status(400).json({ message: 'Formato de teléfono inválido. Debe empezar con + seguido de números (ej: +34666...).' });
    }
    let isDocumentValid = false;
    switch (documentType) {
        case DocumentType.DNI:
            console.log(`[AUTH CTRL DEBUG] Entering DNI validation case for ID: ${documentId}`);
            isDocumentValid = isValidDni(documentId);
            console.log(`[AUTH CTRL DEBUG] isValidDni result: ${isDocumentValid}`);
            if (!isDocumentValid) console.log(`[AUTH CTRL DIAG] Registration failed: Invalid DNI format: ${documentId}`);
            break;
        case DocumentType.NIE:
             console.log(`[AUTH CTRL DEBUG] Entering NIE validation case for ID: ${documentId}`);
            isDocumentValid = isValidNie(documentId);
             console.log(`[AUTH CTRL DEBUG] isValidNie result: ${isDocumentValid}`);
            if (!isDocumentValid) console.log(`[AUTH CTRL DIAG] Registration failed: Invalid NIE format: ${documentId}`);
            break;
        case DocumentType.PASSPORT:
             console.log(`[AUTH CTRL DEBUG] Entering PASSPORT validation case for ID: ${documentId}`);
            isDocumentValid = documentId.trim().length > 3;
             console.log(`[AUTH CTRL DEBUG] Passport validation result: ${isDocumentValid}`);
            if (!isDocumentValid) console.log(`[AUTH CTRL DIAG] Registration failed: Invalid Passport format: ${documentId}`);
            break;
        case DocumentType.OTHER:
             console.log(`[AUTH CTRL DEBUG] Entering OTHER validation case for ID: ${documentId}`);
            isDocumentValid = documentId.trim().length > 0;
             console.log(`[AUTH CTRL DEBUG] OTHER validation result: ${isDocumentValid}`);
            if (!isDocumentValid) console.log(`[AUTH CTRL DIAG] Registration failed: Invalid OTHER document format: ${documentId}`);
            break;
        default:
            console.log(`[AUTH CTRL DIAG] Registration failed: Invalid document type: ${documentType}`);
            return res.status(400).json({ message: 'Tipo de documento inválido.' });
    }
    if (!isDocumentValid) {
        return res.status(400).json({ message: `Formato de ${documentType} inválido.` });
    }
    console.log(`[AUTH CTRL DIAG] Format validation passed for ${email}.`);

    // 4. Hashear Contraseña y Llamar al Servicio (que hace check de phone/docId)
    console.log(`[AUTH CTRL DIAG] Hashing password...`);
    const hashedPassword = await hashPassword(password);
    console.log(`[AUTH CTRL DIAG] Password hashed. Calling createUser service...`);
    const userDataWithHashedPassword: RegisterUserDto = { email, password: hashedPassword, name, phone, documentId, documentType, businessId, role };
    const newUser = await createUser(userDataWithHashedPassword); // El servicio ahora valida unicidad de phone/docId

    // 5. Éxito: Generar Token y Responder
    console.log(`[AUTH CTRL DIAG] User created: ${newUser.id}. Generating token...`);
    const token = generateToken(newUser);
    const { password: _, documentId: __, ...userWithoutSensitiveData } = newUser;
    console.log(`[AUTH CTRL DIAG] Registration successful for user ${newUser.id}. Sending 201.`);
    res.status(201).json({ user: userWithoutSensitiveData, token });

  } catch (error) {
     // Manejo de Errores
     if (error instanceof Error && error.message.includes('Business with ID')) { return res.status(400).json({ message: error.message }); }
     if (error instanceof Error && (error.message.includes('teléfono ya está registrado') || error.message.includes('documento de identidad ya está registrado'))) { return res.status(409).json({ message: error.message }); }
     if (error instanceof Prisma.PrismaClientKnownRequestError) { if (error.code === 'P2002') { const target = (error.meta?.target as string[])?.join(', '); console.error(`[AUTH CTRL DIAG] Registration failed: Unique constraint DB error on ${target}. Error: ${error.message}`); return res.status(409).json({ message: `Error de unicidad DB: ${target}` }); } }
     console.error('[AUTH CTRL DIAG] Error during registration:', error);
     res.status(500).json({ message: 'Error del servidor durante el registro.' });
  }
};

/**
 * Handles user login.
 * POST /auth/login
 * (Función completa sin omisiones)
 */
export const login = async (req: Request, res: Response) => {
  const { email, password } = req.body;
  console.log(`[AUTH CTRL DIAG] Attempting login for email: ${email}`);

  if (!email || !password) {
    console.log('[AUTH CTRL DIAG] Login failed: Email or password missing.');
    return res.status(400).json({ message: 'Se requieren email y contraseña.' });
  }

  try {
    console.log(`[AUTH CTRL DIAG] Finding user by email: ${email}`);
    const user = await findUserByEmail(email);

    if (!user) {
      console.log(`[AUTH CTRL DIAG] User not found for email: ${email}. Sending 401.`);
      return res.status(401).json({ message: 'Credenciales inválidas.' });
    }

    console.log(`[AUTH CTRL DIAG] User found: ${user.id}. Comparing password...`);
    const passwordMatch = await comparePassword(password, user.password);
    console.log(`[AUTH CTRL DIAG] Password comparison result for user ${user.id}: ${passwordMatch}`);

    if (!passwordMatch) {
       console.log(`[AUTH CTRL DIAG] Password mismatch for user ${user.id}. Sending 401.`);
       return res.status(401).json({ message: 'Credenciales inválidas.' });
    }

    console.log(`[AUTH CTRL DIAG] Password matches for user ${user.id}. Generating token...`);
    const token = generateToken(user);

     // Excluimos campos sensibles antes de devolver el usuario
     const { password: _, documentId: __, ...userWithoutSensitiveData } = user; // Excluir docId también aquí

    console.log(`[AUTH CTRL DIAG] Login successful for user ${user.id}. Sending 200.`);
    res.status(200).json({ user: userWithoutSensitiveData, token }); // Devolver usuario sin contraseña ni documento

  } catch (error) {
    console.error('[AUTH CTRL DIAG] Error during login:', error);
    res.status(500).json({ message: 'Error del servidor durante el inicio de sesión.' });
  }
};

/**
 * Handles forgot password request.
 * POST /auth/forgot-password
 */
export const forgotPasswordHandler = async (req: Request, res: Response) => {
    const { email }: ForgotPasswordDto = req.body;
    console.log(`[AUTH CTRL] Forgot password request for email: ${email}`);

    if (!email) {
        return res.status(400).json({ message: 'Se requiere el email.' });
    }

    try {
        // Llama a la función del servicio (que crearemos después)
        await handleForgotPassword(email);

        // Respuesta genérica por seguridad
        res.status(200).json({ message: 'Si existe una cuenta con ese email, se ha enviado un enlace para restablecer la contraseña.' });

    } catch (error: any) {
        console.error('[AUTH CTRL] Error in forgotPasswordHandler:', error.message);
        // Devolver respuesta genérica también en caso de error interno
        res.status(200).json({ message: 'Si existe una cuenta con ese email, se ha enviado un enlace para restablecer la contraseña.' });
    }
};


/**
 * Handles password reset using a token.
 * POST /auth/reset-password/:token
 */
export const resetPasswordHandler = async (req: Request, res: Response) => {
    const { token } = req.params;
    const { password: newPassword }: ResetPasswordDto = req.body;

    console.log(`[AUTH CTRL] Reset password attempt with token: ${token ? token.substring(0,5)+'...' : 'undefined'}`);

    if (!token) { return res.status(400).json({ message: 'Falta el token de reseteo.' }); }
    if (!newPassword) { return res.status(400).json({ message: 'Se requiere la nueva contraseña.' }); }
    if (newPassword.length < 6) { return res.status(400).json({ message: 'La nueva contraseña debe tener al menos 6 caracteres.' }); }

    try {
        // Hashear la nueva contraseña
        const hashedNewPassword = await hashPassword(newPassword);

        // Llamar a la función del servicio (que crearemos después)
        await handleResetPassword(token, hashedNewPassword);

        res.status(200).json({ message: 'Contraseña restablecida con éxito.' });

    } catch (error: any) {
        console.error(`[AUTH CTRL] Error in resetPasswordHandler for token ${token ? token.substring(0,5)+'...' : 'undefined'}:`, error.message);
        res.status(400).json({ message: error.message || 'No se pudo restablecer la contraseña.' });
    }
};

// End of File: backend/src/auth/auth.controller.ts