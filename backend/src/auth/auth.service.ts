// File: backend/src/auth/auth.service.ts
// Version: 1.1.0 (Import DTO from auth.dto.ts, save new fields)

// --- CAMBIO: Importar DocumentType ---
import { PrismaClient, User, UserRole, DocumentType } from '@prisma/client';
// --- FIN CAMBIO ---
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
// --- CAMBIO: Importar DTO desde auth.dto.ts ---
import { RegisterUserDto } from './auth.dto';
// --- FIN CAMBIO ---

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
 * Expects password to be hashed. Uses new fields from RegisterUserDto.
 */
 // La función ahora usa implícitamente la nueva definición de RegisterUserDto importada
export const createUser = async (userData: RegisterUserDto): Promise<User> => {
   // Verificar businessId (sin cambios)
   const businessExists = await prisma.business.findUnique({ where: { id: userData.businessId } });
   if (!businessExists) {
     const error = new Error(`Business with ID ${userData.businessId} not found.`);
     console.error(error.message);
     throw error;
   }

   // --- TODO: Añadir validación de unicidad para phone y documentId aquí ---
   // (Aunque ya hay constraints en BD, es mejor verificar antes para dar errores más claros)
   // if (userData.phone) {
   //   const existingPhone = await prisma.user.findUnique({ where: { phone: userData.phone } });
   //   if (existingPhone) throw new Error('Phone number already registered.');
   // }
   // if (userData.documentId) {
   //   const existingDocument = await prisma.user.findUnique({ where: { documentId: userData.documentId } });
   //   if (existingDocument) throw new Error('Document ID already registered.');
   // }
   // --- FIN TODO ---

   // --- CAMBIO: Añadir nuevos campos al 'data' de prisma.user.create ---
   return prisma.user.create({
    data: {
      email: userData.email,
      password: userData.password, // Ya viene hasheada desde el controller
      name: userData.name,
      phone: userData.phone, // Guardar teléfono
      documentId: userData.documentId, // Guardar ID documento
      documentType: userData.documentType, // Guardar tipo documento (usa el Enum)
      role: userData.role, // Usa el Enum UserRole
      businessId: userData.businessId,
      // isActive, points, marketingOptIn usan defaults
    },
   });
   // --- FIN CAMBIO ---
};

// End of File: backend/src/auth/auth.service.ts