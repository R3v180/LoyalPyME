// File: backend/src/auth/auth.service.ts
// Version: 1.0.1

import { PrismaClient, User, UserRole } from '@prisma/client';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
// Importamos el DTO desde auth.controller.ts (Esta importacion es CORRECTA)
import { RegisterUserDto } from './auth.controller';

const prisma = new PrismaClient();
// Asegurarse que JWT_SECRET esta cargado desde .env
// Usamos 'as string' porque process.env siempre devuelve string | undefined
const JWT_SECRET = process.env.JWT_SECRET as string;

// Validar que JWT_SECRET esta definido al iniciar la aplicacion
if (!JWT_SECRET) {
  console.error('FATAL ERROR: JWT_SECRET is not defined. Please set it in your .env file.');
  // En un entorno real, aqui saldrias del proceso o manejarias el error de forma mas robusta
  // process.exit(1); // No salimos para que nodemon pueda intentar reiniciar en desarrollo
}


/**
 * Hashes a plain password using bcrypt.
 * @param password - The plain password string.
 * @returns A promise that resolves with the hashed password string.
 */
export const hashPassword = async (password: string): Promise<string> => {
  const salt = await bcrypt.genSalt(10); // Genera un salt con 10 rondas de hash (costo de computo)
  return bcrypt.hash(password, salt); // Hashea la contraseña con el salt
};

/**
 * Compares a plain password with a hashed password.
 * @param plainPassword - The plain password string.
 * @param hashedPassword - The hashed password string from the database.
 * @returns A promise that resolves with a boolean indicating if the passwords match.
 */
export const comparePassword = async (plainPassword: string, hashedPassword: string): Promise<boolean> => {
  return bcrypt.compare(plainPassword, hashedPassword); // Compara la contraseña plana con la hasheada
};

/**
 * Generates a JWT for a given user.
 * @param user - The user object from Prisma (debe tener id, role, businessId).
 * @returns The generated JWT string.
 */
export const generateToken = (user: User): string => {
  const payload = {
    userId: user.id,
    role: user.role,
    businessId: user.businessId // Incluimos businessId en el token para validaciones multi-tenancy
  };

  // Genera el token con el payload, la clave secreta y una expiracion
  // La clave secreta debe ser la misma que definimos en .env
  const token = jwt.sign(
    payload,
    JWT_SECRET, // Usamos la clave secreta del entorno
    { expiresIn: '7d' } // Token expira en 7 dias (configurable)
  );

  return token;
};

/**
 * Finds a user by email.
 * @param email - The user's email address.
 * @returns A promise that resolves with the user object or null if not found.
 */
export const findUserByEmail = async (email: string): Promise<User | null> => {
  // Busca un usuario unico por email
  return prisma.user.findUnique({
    where: { email },
  });
};

/**
 * Creates a new user in the database.
 * NOTE: This function expects the password in userData to ALREADY be hashed.
 * Hashing should be done in the controller before calling this service function.
 * @param userData - The data for the new user (password must be hashed).
 * @returns A promise that resolves with the created user object.
 */
export const createUser = async (userData: RegisterUserDto): Promise<User> => {
   // Verificar si el businessId proporcionado existe en la base de datos
   const businessExists = await prisma.business.findUnique({ where: { id: userData.businessId } });
   if (!businessExists) {
     // Si el negocio no existe, lanzamos un error que sera capturado en el controlador
     const error = new Error(`Business with ID ${userData.businessId} not found.`);
     console.error(error.message); // Log del error en el servidor
     throw error; // Lanzar el error para que el controlador lo maneje
   }

  // Crea el usuario en la base de datos usando Prisma Client
  return prisma.user.create({
    data: {
      email: userData.email,
      password: userData.password, // Asume que la contraseña ya esta hasheada
      name: userData.name,
      phone: userData.phone,
      role: userData.role, // Asume que el role viene validado
      businessId: userData.businessId, // Relacion con el negocio
      // is Active, points, loyaltyTier, marketingOptIn usan defaults definidos en schema.prisma
    },
  });
};


// Puedes añadir mas funciones de servicio de autenticacion aqui en el futuro
// Por ejemplo: findUserById, updateUserPassword, deleteUser, etc.


// End of File: backend/src/auth/auth.service.ts