// File: backend/src/auth/auth.service.ts
// Version: 1.2.0 (Add uniqueness checks for phone and documentId)

import { PrismaClient, User, UserRole, DocumentType } from '@prisma/client';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { RegisterUserDto } from './auth.dto'; // Import DTO desde archivo separado

const prisma = new PrismaClient();
const JWT_SECRET = process.env.JWT_SECRET as string;
if (!JWT_SECRET) { console.error('FATAL ERROR: JWT_SECRET is not defined.'); /* process.exit(1); */ }

// hashPassword (sin cambios)
export const hashPassword = async (password: string): Promise<string> => { const salt = await bcrypt.genSalt(10); return bcrypt.hash(password, salt); };

// comparePassword (sin cambios)
export const comparePassword = async (plainPassword: string, hashedPassword: string): Promise<boolean> => { return bcrypt.compare(plainPassword, hashedPassword); };

// generateToken (sin cambios)
export const generateToken = (user: User): string => { const payload = { userId: user.id, role: user.role, businessId: user.businessId }; const token = jwt.sign( payload, JWT_SECRET, { expiresIn: '7d' } ); return token; };

// findUserByEmail (sin cambios)
export const findUserByEmail = async (email: string): Promise<User | null> => { return prisma.user.findUnique({ where: { email }, }); };

/**
 * Creates a new user in the database.
 * Performs uniqueness checks for phone and documentId before creation.
 * Expects password to be hashed. Uses new fields from RegisterUserDto.
 */
export const createUser = async (userData: RegisterUserDto): Promise<User> => {
   // 1. Verificar businessId (sin cambios)
   const businessExists = await prisma.business.findUnique({ where: { id: userData.businessId } });
   if (!businessExists) {
     const error = new Error(`Business with ID ${userData.businessId} not found.`);
     console.error(error.message);
     throw error;
   }

   // --- NUEVO: Comprobaciones de Unicidad ANTES de crear ---
   // Comprobar teléfono (usamos el índice @unique que creamos)
   // Asegurarse de que userData.phone tiene valor antes de buscar
   if (userData.phone) {
       const existingPhone = await prisma.user.findUnique({
           where: { phone: userData.phone },
           select: { id: true } // Solo necesitamos saber si existe
       });
       if (existingPhone) {
            console.warn(`Attempted registration with existing phone: ${userData.phone}`);
            throw new Error('El teléfono ya está registrado.'); // Lanzar error claro
       }
   } else {
       // Aunque el DTO lo requiere, si por alguna razón llegara null/undefined aquí, lo rechazamos.
       // O podríamos permitirlo si la lógica de negocio lo permitiera para ciertos roles,
       // pero según los requisitos, debe ser obligatorio.
       throw new Error('El teléfono es un campo obligatorio.');
   }


   // Comprobar Documento ID (usamos el índice @unique que creamos)
    // Asegurarse de que userData.documentId tiene valor antes de buscar
   if (userData.documentId) {
       const existingDocument = await prisma.user.findUnique({
           where: { documentId: userData.documentId },
           select: { id: true } // Solo necesitamos saber si existe
       });
       if (existingDocument) {
            console.warn(`Attempted registration with existing documentId: ${userData.documentId}`);
           throw new Error('El documento de identidad ya está registrado.'); // Lanzar error claro
       }
   } else {
        // Rechazar si llega null/undefined
        throw new Error('El documento de identidad es un campo obligatorio.');
   }
   // --- FIN NUEVO ---

   // --- TODO: Añadir validación de formato aquí o en el controlador ---

   // 3. Si todas las validaciones pasan, crear el usuario (sin cambios en esta parte)
   console.log(`[AUTH SVC] Uniqueness checks passed for ${userData.email}. Creating user...`);
   return prisma.user.create({
    data: {
      email: userData.email,
      password: userData.password,
      name: userData.name,
      phone: userData.phone,
      documentId: userData.documentId,
      documentType: userData.documentType,
      role: userData.role,
      businessId: userData.businessId,
    },
   });
};

// End of File: backend/src/auth/auth.service.ts