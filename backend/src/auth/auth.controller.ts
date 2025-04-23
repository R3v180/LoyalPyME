// File: backend/src/auth/auth.controller.ts
// Version: 1.3.1 (Import DTO from auth.dto.ts)

import { Request, Response } from 'express';
// Traemos solo Prisma para el manejo de errores
import { Prisma } from '@prisma/client';
// Importamos las funciones del servicio
import { hashPassword, comparePassword, generateToken, findUserByEmail, createUser } from './auth.service';

// --- CAMBIO: Importar RegisterUserDto desde el nuevo archivo ---
import { RegisterUserDto } from './auth.dto';
// --- FIN CAMBIO ---

// --- CAMBIO: Eliminar definición local de RegisterUserDto ---
// La interfaz ahora se importa desde auth.dto.ts
// --- FIN CAMBIO ---


/**
 * Handles user registration.
 * POST /auth/register
 * (Usa la DTO importada, requiere nuevos campos)
 */
export const register = async (req: Request, res: Response) => {
  // Usa la interfaz RegisterUserDto importada que ahora incluye los nuevos campos
  const { email, password, name, phone, documentId, documentType, businessId, role }: RegisterUserDto = req.body;

  console.log(`[AUTH CTRL DIAG] Attempting registration for email: ${email}`);

  // Validación de campos obligatorios (incluye los nuevos)
  if (!email || !password || !phone || !documentId || !documentType || !businessId || !role) {
    console.log('[AUTH CTRL DIAG] Registration failed: Missing required fields.');
    return res.status(400).json({ message: 'Email, password, phone, documentId, documentType, businessId, and role are required.' });
  }

  // TODO: Añadir validación de formato para phone y documentId aquí
  console.log(`[AUTH CTRL DIAG] Basic validation passed for ${email}. Proceeding...`);

  try {
    console.log(`[AUTH CTRL DIAG] Checking if user exists: ${email}`);
    const existingUser = await findUserByEmail(email);
    if (existingUser) {
      console.log(`[AUTH CTRL DIAG] Registration failed: User already exists: ${email}. Sending 409.`);
      return res.status(409).json({ message: 'El email ya está registrado.' }); // Traducido
    }

    // TODO: Añadir verificación de unicidad para phone y documentId ANTES de hashear/crear en el servicio o aquí.

    console.log(`[AUTH CTRL DIAG] User does not exist. Hashing password...`);
    const hashedPassword = await hashPassword(password);
    console.log(`[AUTH CTRL DIAG] Password hashed. Creating user...`);

    // Creamos el objeto userData asegurando que cumple el tipo RegisterUserDto
    const userDataWithHashedPassword: RegisterUserDto = {
        email,
        password: hashedPassword,
        name,
        phone,
        documentId,
        documentType,
        businessId,
        role
    };
    // Llamamos al servicio createUser (que actualizaremos en el siguiente paso)
    const newUser = await createUser(userDataWithHashedPassword);

    console.log(`[AUTH CTRL DIAG] User created: ${newUser.id}. Generating token...`);
    const token = generateToken(newUser);
    // Excluimos campos sensibles de la respuesta
    const { password: _, documentId: __, ...userWithoutSensitiveData } = newUser;

    console.log(`[AUTH CTRL DIAG] Registration successful for user ${newUser.id}. Sending 201.`);
    res.status(201).json({ user: userWithoutSensitiveData, token });

  } catch (error) {
     if (error instanceof Error && error.message.includes('Business with ID')) {
         console.error(`[AUTH CTRL DIAG] Registration failed: Business ID not found. Error: ${error.message}`);
         return res.status(400).json({ message: error.message }); // Podríamos traducir este error también
     }
     if (error instanceof Prisma.PrismaClientKnownRequestError) {
         if (error.code === 'P2002') {
             const target = (error.meta?.target as string[])?.join(', ');
             console.error(`[AUTH CTRL DIAG] Registration failed: Unique constraint failed on ${target}. Error: ${error.message}`);
             if (target?.includes('email')) { return res.status(409).json({ message: `El email ya está registrado.` }); }
             if (target?.includes('phone')) { return res.status(409).json({ message: `El teléfono ya está registrado.` }); }
             if (target?.includes('documentId')) { return res.status(409).json({ message: `El documento de identidad ya está registrado.` }); }
             return res.status(409).json({ message: `Error de unicidad: ${target}` });
         }
     }
    console.error('[AUTH CTRL DIAG] Error during registration:', error);
    res.status(500).json({ message: 'Error del servidor durante el registro.' });
  }
};


/**
 * Handles user login.
 * POST /auth/login
 * (Sin cambios)
 */
export const login = async (req: Request, res: Response) => {
  const { email, password } = req.body;
  console.log(`[AUTH CTRL DIAG] Attempting login for email: ${email}`);
  if (!email || !password) { console.log('[AUTH CTRL DIAG] Login failed: Email or password missing.'); return res.status(400).json({ message: 'Se requieren email y contraseña.' }); }
  try {
    console.log(`[AUTH CTRL DIAG] Finding user by email: ${email}`);
    const user = await findUserByEmail(email);
    if (!user) { console.log(`[AUTH CTRL DIAG] User not found for email: ${email}. Sending 401.`); return res.status(401).json({ message: 'Credenciales inválidas.' }); }
    console.log(`[AUTH CTRL DIAG] User found: ${user.id}. Comparing password...`);
    const passwordMatch = await comparePassword(password, user.password);
    console.log(`[AUTH CTRL DIAG] Password comparison result for user ${user.id}: ${passwordMatch}`);
    if (!passwordMatch) { console.log(`[AUTH CTRL DIAG] Password mismatch for user ${user.id}. Sending 401.`); return res.status(401).json({ message: 'Credenciales inválidas.' }); }
    console.log(`[AUTH CTRL DIAG] Password matches for user ${user.id}. Generating token...`);
    const token = generateToken(user);
    const { password: _, documentId: __, ...userWithoutSensitiveData } = user;
    console.log(`[AUTH CTRL DIAG] Login successful for user ${user.id}. Sending 200.`);
    res.status(200).json({ user: userWithoutSensitiveData, token });
  } catch (error) { console.error('[AUTH CTRL DIAG] Error during login:', error); res.status(500).json({ message: 'Error del servidor durante el inicio de sesión.' }); }
};

// End of File: backend/src/auth/auth.controller.ts