// filename: backend/src/auth/auth.controller.ts
// --- INICIO DEL CÓDIGO COMPLETO ---
// File: backend/src/auth/auth.controller.ts
// Version: 1.6.1 (Import User type from @prisma/client)

import { Request, Response } from 'express';
// *** CAMBIO: Añadir User a la importación de Prisma ***
import { Prisma, DocumentType, User } from '@prisma/client';
// Importar service functions
import {
    hashPassword, comparePassword, generateToken, findUserByEmail, createUser,
    handleForgotPassword, handleResetPassword,
    createBusinessAndAdmin
} from './auth.service';
// Importar DTOs
import { RegisterUserDto, ForgotPasswordDto, ResetPasswordDto, RegisterBusinessDto } from './auth.dto';


// Funciones auxiliares (isValidDni, isValidNie) - Sin cambios
function isValidDni(dni: string): boolean { if (!/^\d{8}[A-Z]$/i.test(dni)) { return false; } const numero = parseInt(dni.substring(0, 8), 10); const letra = dni.substring(8, 9).toUpperCase(); const letrasControl = "TRWAGMYFPDXBNJZSQVHLCKE"; const letraCalculada = letrasControl.charAt(numero % 23); return letra === letraCalculada; }
function isValidNie(nie: string): boolean { if (!/^[XYZ]\d{7}[A-Z]$/i.test(nie)) { return false; } let numeroStr = nie.substring(1, 8); const letraInicial = nie.substring(0, 1).toUpperCase(); if (letraInicial === 'Y') numeroStr = '1' + numeroStr; if (letraInicial === 'Z') numeroStr = '2' + numeroStr; const numero = parseInt(numeroStr, 10); const letra = nie.substring(8, 9).toUpperCase(); const letrasControl = "TRWAGMYFPDXBNJZSQVHLCKE"; const letraCalculada = letrasControl.charAt(numero % 23); return letra === letraCalculada; }


/**
 * Handles CUSTOMER user registration. POST /auth/register
 * (Función sin cambios respecto a versión anterior)
 */
export const register = async (req: Request, res: Response) => {
  const { email, password, name, phone, documentId, documentType, businessId, role }: RegisterUserDto = req.body;
  console.log(`[AUTH CTRL DIAG] Attempting customer registration for email: ${email}`);

  // Validación de campos obligatorios para cliente
   if (!email || !password || !phone || !documentId || !documentType || !businessId || !role || role !== 'CUSTOMER_FINAL') {
       console.log('[AUTH CTRL DIAG] Registration failed: Missing required fields or invalid role for customer.');
       return res.status(400).json({ message: 'Faltan campos obligatorios o rol inválido para registro de cliente.' });
   }

   // Comprobación de Email Duplicado
   try {
      const existingUser = await findUserByEmail(email);
      if (existingUser) {
        console.log(`[AUTH CTRL DIAG] Registration failed: User email already exists: ${email}. Sending 409.`);
        return res.status(409).json({ message: 'El email ya está registrado.' });
      }

      // Validación de Formato (Documento y Teléfono para cliente)
      const phoneRegex = /^\+[0-9]{9,15}$/;
      if (!phoneRegex.test(phone)) { return res.status(400).json({ message: 'Formato de teléfono inválido.' }); }
      let isDocumentValid = false;
      switch (documentType) {
          case DocumentType.DNI: isDocumentValid = isValidDni(documentId); break;
          case DocumentType.NIE: isDocumentValid = isValidNie(documentId); break;
          case DocumentType.PASSPORT: isDocumentValid = documentId.trim().length > 3; break;
          case DocumentType.OTHER: isDocumentValid = documentId.trim().length > 0; break;
          default: return res.status(400).json({ message: 'Tipo de documento inválido.' });
      }
      if (!isDocumentValid) { return res.status(400).json({ message: `Formato de ${documentType} inválido.` }); }

      // Llamar al Servicio createUser (específico para clientes)
      console.log(`[AUTH CTRL DIAG] Calling createUser service for customer ${email}...`);
      // Pasamos la contraseña plana, el servicio createUser ahora hashea internamente
      const userDataForService: RegisterUserDto = { email, password, name, phone, documentId, documentType, businessId, role };
      const newUser = await createUser(userDataForService);

      // Éxito: Responder (sin token por ahora para registro de cliente)
      console.log(`[AUTH CTRL DIAG] Customer user created: ${newUser.id}.`);
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { password: _, documentId: __, ...userWithoutSensitiveData } = newUser;
      console.log(`[AUTH CTRL DIAG] Customer registration successful for user ${newUser.id}. Sending 201.`);
      res.status(201).json({ user: userWithoutSensitiveData });

   } catch (error) {
     // Manejo de Errores
     if (error instanceof Error && (error.message.includes('teléfono') || error.message.includes('documento') || error.message.includes('Business with ID'))) {
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
 * (Función sin cambios respecto a versión anterior)
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
    if (!user || !user.isActive) {
      console.log(`[AUTH CTRL DIAG] User not found or inactive for email: ${email}. Sending 401.`);
      return res.status(401).json({ message: 'Credenciales inválidas o usuario inactivo.' });
    }

    console.log(`[AUTH CTRL DIAG] User found: ${user.id}. Comparing password...`);
    const passwordMatch = await comparePassword(password, user.password);
    if (!passwordMatch) {
       console.log(`[AUTH CTRL DIAG] Password mismatch for user ${user.id}. Sending 401.`);
       return res.status(401).json({ message: 'Credenciales inválidas.' });
    }

    console.log(`[AUTH CTRL DIAG] Password matches for user ${user.id}. Generating token...`);
    const token = generateToken(user);
    // Excluimos campos sensibles
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { password: _, documentId: __, resetPasswordToken: ___, resetPasswordExpires: ____, ...userWithoutSensitiveData } = user;
    console.log(`[AUTH CTRL DIAG] Login successful for user ${user.id}. Sending 200.`);
    res.status(200).json({ user: userWithoutSensitiveData, token });

  } catch (error) {
    console.error('[AUTH CTRL DIAG] Error during login:', error);
    res.status(500).json({ message: 'Error del servidor durante el inicio de sesión.' });
  }
};


/**
 * Handles registration of a new business and its initial admin user.
 * POST /auth/register-business
 * (Función sin cambios respecto a versión anterior)
 */
export const registerBusinessHandler = async (req: Request, res: Response) => {
    const { businessName, adminEmail, adminPassword, adminName }: RegisterBusinessDto = req.body;
    console.log(`[AUTH CTRL] Attempting business registration for: ${businessName} / ${adminEmail}`);

    // Validación básica
    if (!businessName || !adminEmail || !adminPassword) {
        return res.status(400).json({ message: 'Nombre del negocio, email del administrador y contraseña son requeridos.' });
    }
    if (businessName.trim().length < 2) {
        return res.status(400).json({ message: 'El nombre del negocio debe tener al menos 2 caracteres.' });
    }
    if (adminPassword.length < 6) {
        return res.status(400).json({ message: 'La contraseña debe tener al menos 6 caracteres.' });
    }

    try {
        // Llamar al servicio
        console.log(`[AUTH CTRL] Calling createBusinessAndAdmin service for ${adminEmail}...`);
        const newAdminUser = await createBusinessAndAdmin({
            businessName: businessName.trim(),
            adminEmail,
            adminPassword,
            adminName: adminName?.trim()
        });

        // Generar token (usando la 'User' importada para el cast)
        // *** El cast 'as User' ahora funciona porque User está importado ***
        const token = generateToken(newAdminUser as User);

        // Enviar respuesta
        console.log(`[AUTH CTRL] Business registration successful for ${newAdminUser.email}. Sending 201.`);
        res.status(201).json({
            user: newAdminUser, // Ya viene sin contraseña
            token: token
        });

    } catch (error: any) {
        console.error('[AUTH CTRL] Error during business registration:', error);
        // Manejar errores específicos
        if (error instanceof Error) {
             if (error.message.includes('El email proporcionado ya está registrado') ||
                 error.message.includes('Ya existe un negocio con un nombre similar')) {
                 return res.status(409).json({ message: error.message }); // 409 Conflict
             }
             // Añadir otros errores específicos si es necesario
              if (error.message.includes('nombre del negocio') || error.message.includes('Error de base de datos')) {
                   return res.status(400).json({ message: error.message });
              }
        }
        // Error genérico
        res.status(500).json({ message: error.message || 'Error del servidor durante el registro del negocio.' });
    }
};


// --- Handlers para Reseteo de Contraseña (existentes, sin cambios) ---

export const forgotPasswordHandler = async (req: Request, res: Response) => {
    const { email }: ForgotPasswordDto = req.body;
    console.log(`[AUTH CTRL] Forgot password request for email: ${email}`);
    if (!email) { return res.status(400).json({ message: 'Se requiere el email.' }); }
    try {
        await handleForgotPassword(email);
        res.status(200).json({ message: 'Si existe una cuenta con ese email, se ha enviado un enlace para restablecer la contraseña.' });
    } catch (error: any) {
        console.error('[AUTH CTRL] Error in forgotPasswordHandler:', error.message);
        // Devolver respuesta genérica incluso si hay error interno
        res.status(200).json({ message: 'Si existe una cuenta con ese email, se ha enviado un enlace para restablecer la contraseña.' });
    }
};

export const resetPasswordHandler = async (req: Request, res: Response) => {
    const { token } = req.params;
    const { password: newPassword }: ResetPasswordDto = req.body;
    console.log(`[AUTH CTRL] Reset password attempt with token: ${token ? token.substring(0,5)+'...' : 'undefined'}`);
    if (!token) { return res.status(400).json({ message: 'Falta el token de reseteo.' }); }
    if (!newPassword) { return res.status(400).json({ message: 'Se requiere la nueva contraseña.' }); }
    if (newPassword.length < 6) { return res.status(400).json({ message: 'La nueva contraseña debe tener al menos 6 caracteres.' }); }
    try {
        const hashedNewPassword = await hashPassword(newPassword);
        await handleResetPassword(token, hashedNewPassword);
        res.status(200).json({ message: 'Contraseña restablecida con éxito.' });
    } catch (error: any) {
        console.error(`[AUTH CTRL] Error in resetPasswordHandler for token ${token ? token.substring(0,5)+'...' : 'undefined'}:`, error.message);
        res.status(400).json({ message: error.message || 'No se pudo restablecer la contraseña.' });
    }
};

// End of File: backend/src/auth/auth.controller.ts
// --- FIN DEL CÓDIGO COMPLETO ---