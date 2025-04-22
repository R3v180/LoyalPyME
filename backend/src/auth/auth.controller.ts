// File: backend/src/auth/auth.controller.ts
// Version: 1.0.2 (Corrected Import + Diagnostic Logging)

import { Request, Response } from 'express';
import { Prisma } from '@prisma/client';
// --- CORRECCIÓN AQUÍ: Quitamos RegisterUserDto de esta importación ---
import { hashPassword, comparePassword, generateToken, findUserByEmail, createUser } from './auth.service';

// Define el DTO (Data Transfer Object) para el registro de usuario
// Se define aquí y auth.service lo importa si es necesario
export interface RegisterUserDto {
  email: string;
  password: string;
  name?: string;
  phone?: string;
  businessId: string;
  role: 'BUSINESS_ADMIN' | 'CUSTOMER_FINAL';
}

/**
 * Handles user registration.
 * POST /auth/register
 */
export const register = async (req: Request, res: Response) => {
  const { email, password, name, phone, businessId, role }: RegisterUserDto = req.body;
  console.log(`[AUTH CTRL DIAG] Attempting registration for email: ${email}`);

  if (!email || !password || !businessId || !role) {
    console.log('[AUTH CTRL DIAG] Registration failed: Missing required fields.');
    return res.status(400).json({ message: 'Email, password, businessId, and role are required.' });
  }

  if (role !== 'BUSINESS_ADMIN' && role !== 'CUSTOMER_FINAL') {
       console.log(`[AUTH CTRL DIAG] Registration failed: Invalid role specified: ${role}.`);
       return res.status(400).json({ message: 'Invalid role specified. Allowed roles are BUSINESS_ADMIN or CUSTOMER_FINAL.' });
  }

  try {
    console.log(`[AUTH CTRL DIAG] Checking if user exists: ${email}`);
    const existingUser = await findUserByEmail(email);
    if (existingUser) {
      console.log(`[AUTH CTRL DIAG] Registration failed: User already exists: ${email}. Sending 409.`);
      return res.status(409).json({ message: 'User with that email already exists.' });
    }
    console.log(`[AUTH CTRL DIAG] User does not exist. Hashing password...`);

    const hashedPassword = await hashPassword(password);
    console.log(`[AUTH CTRL DIAG] Password hashed. Creating user...`);

    const newUser = await createUser({
      email,
      password: hashedPassword,
      name,
      phone,
      businessId,
      role
    });
    console.log(`[AUTH CTRL DIAG] User created: ${newUser.id}. Generating token...`);

    const token = generateToken(newUser);
    const { password: _, ...userWithoutPassword } = newUser;
    console.log(`[AUTH CTRL DIAG] Registration successful for user ${newUser.id}. Sending 201.`);
    res.status(201).json({ user: userWithoutPassword, token });

  } catch (error) {
     if (error instanceof Error && error.message.includes('Business with ID')) {
         console.error(`[AUTH CTRL DIAG] Registration failed: Business ID not found. Error: ${error.message}`);
         return res.status(400).json({ message: error.message });
     }
     if (error instanceof Prisma.PrismaClientKnownRequestError) {
         if (error.code === 'P2002') {
             console.error(`[AUTH CTRL DIAG] Registration failed: Unique constraint failed. Error: ${error.message}`);
             return res.status(409).json({ message: `Duplicate field: ${error.meta?.target}` });
         }
     }
    console.error('[AUTH CTRL DIAG] Error during registration:', error);
    res.status(500).json({ message: 'Server error during registration.' });
  }
};


/**
 * Handles user login.
 * POST /auth/login
 */
export const login = async (req: Request, res: Response) => {
  const { email, password } = req.body;
  console.log(`[AUTH CTRL DIAG] Attempting login for email: ${email}`); // DIAG

  if (!email || !password) {
    console.log('[AUTH CTRL DIAG] Login failed: Email or password missing.'); // DIAG
    return res.status(400).json({ message: 'Email and password are required.' });
  }

  try {
    console.log(`[AUTH CTRL DIAG] Finding user by email: ${email}`); // DIAG
    const user = await findUserByEmail(email);

    if (!user) {
      console.log(`[AUTH CTRL DIAG] User not found for email: ${email}. Sending 401.`); // DIAG
      return res.status(401).json({ message: 'Invalid credentials.' });
    }

    console.log(`[AUTH CTRL DIAG] User found: ${user.id}. Comparing password...`); // DIAG
    const passwordMatch = await comparePassword(password, user.password);
    // --- ESTE LOG ES CLAVE ---
    console.log(`[AUTH CTRL DIAG] Password comparison result for user ${user.id}: ${passwordMatch}`); // DIAG

    if (!passwordMatch) {
       console.log(`[AUTH CTRL DIAG] Password mismatch for user ${user.id}. Sending 401.`); // DIAG
       return res.status(401).json({ message: 'Invalid credentials.' });
    }

    console.log(`[AUTH CTRL DIAG] Password matches for user ${user.id}. Generating token...`); // DIAG
    const token = generateToken(user);
    const { password: _, ...userWithoutPassword } = user;
    console.log(`[AUTH CTRL DIAG] Login successful for user ${user.id}. Sending 200.`); // DIAG
    res.status(200).json({ user: userWithoutPassword, token });

  } catch (error) {
    console.error('[AUTH CTRL DIAG] Error during login:', error); // DIAG
    res.status(500).json({ message: 'Server error during login.' });
  }
};

// End of File: backend/src/auth/auth.controller.ts