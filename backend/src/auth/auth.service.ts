// filename: backend/src/auth/auth.service.ts
// --- INICIO DEL CÓDIGO COMPLETO ---
// File: backend/src/auth/auth.service.ts
// Version: 1.4.1 (Fix syntax errors and createUser data structure)

import { PrismaClient, User, UserRole, DocumentType, Prisma, Business } from '@prisma/client';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { RegisterUserDto, ForgotPasswordDto, ResetPasswordDto, RegisterBusinessDto } from './auth.dto';

const prisma = new PrismaClient();
const JWT_SECRET = process.env.JWT_SECRET as string;
if (!JWT_SECRET) { console.error('FATAL ERROR: JWT_SECRET is not defined.'); /* process.exit(1); */ }

const RESET_TOKEN_EXPIRATION_MS = 60 * 60 * 1000; // 1 hour

// --- Funciones de Utilidad ---

export const hashPassword = async (password: string): Promise<string> => {
    const salt = await bcrypt.genSalt(10);
    return bcrypt.hash(password, salt);
};

export const comparePassword = async (plainPassword: string, hashedPassword: string): Promise<boolean> => {
    return bcrypt.compare(plainPassword, hashedPassword);
};

export const generateToken = (user: User): string => {
    const payload = { userId: user.id, role: user.role, businessId: user.businessId };
    const token = jwt.sign( payload, JWT_SECRET, { expiresIn: '7d' } );
    return token;
};

export const findUserByEmail = async (email: string): Promise<User | null> => {
    return prisma.user.findUnique({ where: { email } });
};

// --- Función para crear USUARIO CLIENTE ---
export const createUser = async (userData: RegisterUserDto): Promise<User> => {
   const businessExists = await prisma.business.findUnique({ where: { id: userData.businessId } });
   if (!businessExists) {
       throw new Error(`Business with ID ${userData.businessId} not found.`);
   }
   // Validaciones de unicidad de teléfono/documento (mantenerlas aquí para registro de cliente)
   if (userData.phone) {
       const existingPhone = await prisma.user.findUnique({ where: { phone: userData.phone }, select: { id: true } });
       if (existingPhone) throw new Error('El teléfono ya está registrado.');
   } else {
       // Considerar si el teléfono debe ser obligatorio siempre o solo para clientes
       throw new Error('El teléfono es un campo obligatorio para clientes.');
   }
   if (userData.documentId) {
       const existingDocument = await prisma.user.findUnique({ where: { documentId: userData.documentId }, select: { id: true } });
       if (existingDocument) throw new Error('El documento de identidad ya está registrado.');
   } else {
        // Considerar si el documento debe ser obligatorio siempre o solo para clientes
       throw new Error('El documento de identidad es un campo obligatorio para clientes.');
   }
   console.log(`[AUTH SVC] Uniqueness checks passed for ${userData.email}. Creating user...`);

   // Hashear contraseña (asegurarse que se hace aquí si el controller no lo hizo)
   const hashedPassword = await hashPassword(userData.password);

   // *** CORRECCIÓN AQUÍ: Usar 'connect' para la relación 'business' ***
   return prisma.user.create({
       data: {
           email: userData.email,
           password: hashedPassword,
           name: userData.name,
           phone: userData.phone,
           documentId: userData.documentId,
           documentType: userData.documentType,
           role: UserRole.CUSTOMER_FINAL, // Forzar rol cliente aquí
           // businessId: userData.businessId, // <- Forma incorrecta
           business: { // <- Forma correcta usando connect
               connect: { id: userData.businessId }
           }
       },
   });
   // *** FIN CORRECCIÓN ***
};

// --- Funciones para Reseteo de Contraseña ---

export const handleForgotPassword = async (email: string): Promise<void> => {
    console.log(`[AUTH SVC] Handling forgot password for: ${email}`);
    const user = await findUserByEmail(email);
    if (!user) {
        console.log(`[AUTH SVC] User not found for forgot password: ${email}. Responding generically.`);
        return; // Salir silenciosamente
    }
    // Generar token
    const resetToken = crypto.randomBytes(32).toString('hex');
    console.log(`[AUTH SVC] Generated PLAIN reset token for ${email}: ${resetToken}`); // Log para pruebas
    const hashedResetToken = await hashPassword(resetToken);
    const expires = new Date(Date.now() + RESET_TOKEN_EXPIRATION_MS);

    // Guardar token hasheado y expiración
    try {
        await prisma.user.update({
            where: { email: email },
            data: {
                resetPasswordToken: hashedResetToken,
                resetPasswordExpires: expires,
            },
        });
        console.log(`[AUTH SVC] Hashed reset token stored successfully for user ${user.id}`);
        // Aquí iría la lógica real de envío de email con el 'resetToken' (el original)
    } catch (error) {
        console.error(`[AUTH SVC] Failed to store reset token for user ${user.id}:`, error);
    }
};

export const handleResetPassword = async (token: string, hashedNewPassword: string): Promise<void> => {
    console.log(`[AUTH SVC] Handling reset password with token starting: ${token.substring(0, 5)}...`);
    // Buscar usuarios con token activo y no expirado
    const potentialUsers = await prisma.user.findMany({
        where: {
            resetPasswordToken: { not: null },
            resetPasswordExpires: { gt: new Date() }
        }
    });

    if (!potentialUsers || potentialUsers.length === 0) {
         console.log('[AUTH SVC] No users found with potentially valid reset tokens.');
         throw new Error('Token inválido o expirado.'); // Error genérico
    }
    console.log(`[AUTH SVC] Found ${potentialUsers.length} users with active tokens. Verifying provided token...`);

    // Comparar token plano con hashes guardados
    let userToUpdate: User | null = null;
    for (const user of potentialUsers) {
        if (user.resetPasswordToken) {
             const isTokenMatch = await comparePassword(token, user.resetPasswordToken);
             if (isTokenMatch) {
                 console.log(`[AUTH SVC] Token match found for user ID: ${user.id}`);
                 userToUpdate = user;
                 break;
             }
        }
    }

    if (!userToUpdate) {
         console.log(`[AUTH SVC] No user matched the provided token.`);
         throw new Error('Token inválido o expirado.'); // Mismo error genérico
    }

    // Actualizar contraseña y limpiar campos de reseteo
    try {
        await prisma.user.update({
            where: { id: userToUpdate.id },
            data: {
                password: hashedNewPassword,
                resetPasswordToken: null,
                resetPasswordExpires: null,
            },
        });
        console.log(`[AUTH SVC] Password reset successful for user ${userToUpdate.id}`);
    } catch (error) {
        console.error(`[AUTH SVC] Failed to update password for user ${userToUpdate.id}:`, error);
        throw new Error('Error al actualizar la contraseña.');
    }
};


// --- Funciones para Registro de Negocio ---

/**
 * Genera un slug simple a partir de un nombre.
 * @param name - El nombre a convertir.
 * @returns Un string slugificado.
 */
const generateSlug = (name: string): string => {
    return name
        .toLowerCase()
        .trim()
        .replace(/[^\w\s-]/g, '') // Eliminar caracteres no alfanuméricos excepto espacios y guiones
        .replace(/[\s_-]+/g, '-') // Reemplazar espacios y guiones bajos por guion simple
        .replace(/^-+|-+$/g, ''); // Eliminar guiones al principio/final
};

/**
 * Crea un nuevo negocio y su usuario administrador inicial.
 * @param data - Datos del DTO RegisterBusinessDto.
 * @returns El objeto User del administrador creado (sin la contraseña).
 * @throws Error si el email o el slug ya existen, o si ocurre un error en la transacción.
 */
export const createBusinessAndAdmin = async (
    data: RegisterBusinessDto
): Promise<Omit<User, 'password'>> => {
    console.log('[AUTH SVC] Attempting to create business and admin:', data.businessName, data.adminEmail);

    // 1. Validar si el email del admin ya existe
    const existingUser = await findUserByEmail(data.adminEmail);
    if (existingUser) {
        console.warn(`[AUTH SVC] Admin email ${data.adminEmail} already exists.`);
        throw new Error('El email proporcionado ya está registrado.');
    }

    // 2. Generar y validar slug del negocio
    const slug = generateSlug(data.businessName);
    if (!slug) {
        // Añadir un valor por defecto o lanzar error si el nombre no genera slug
        console.error(`[AUTH SVC] Could not generate slug from business name: ${data.businessName}`);
        throw new Error('El nombre del negocio proporcionado no es válido.');
    }
    const existingBusiness = await prisma.business.findUnique({
        where: { slug: slug },
        select: { id: true }
    });
    if (existingBusiness) {
        console.warn(`[AUTH SVC] Business slug ${slug} already exists.`);
        throw new Error(`Ya existe un negocio con un nombre similar ('${slug}'). Por favor, elige otro nombre.`);
    }

    // 3. Hashear la contraseña del admin
    const hashedPassword = await hashPassword(data.adminPassword);

    // 4. Crear Business y User Admin en una transacción
    try {
        console.log(`[AUTH SVC] Starting transaction to create business '${data.businessName}' (slug: ${slug}) and admin '${data.adminEmail}'`);
        const newUser = await prisma.$transaction(async (tx) => {
            // Crear el negocio
            const newBusiness = await tx.business.create({
                data: {
                    name: data.businessName,
                    slug: slug,
                },
                select: { id: true } // Necesitamos el ID para el usuario
            });
            console.log(`[AUTH SVC - TX] Business created with ID: ${newBusiness.id}`);

            // Crear el usuario administrador asociado al negocio
            const adminUser = await tx.user.create({
                data: {
                    email: data.adminEmail,
                    password: hashedPassword,
                    name: data.adminName, // Puede ser undefined
                    role: UserRole.BUSINESS_ADMIN, // Rol específico
                    businessId: newBusiness.id, // Asociar al negocio recién creado
                }
            });
            console.log(`[AUTH SVC - TX] Admin user created with ID: ${adminUser.id} for business ${newBusiness.id}`);
            return adminUser; // Devolver el usuario creado
        });

        // 5. Quitar la contraseña antes de devolver
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { password, ...userWithoutPassword } = newUser;
        console.log(`[AUTH SVC] Business and admin creation successful for ${data.adminEmail}.`);
        return userWithoutPassword;

    } catch (error) {
        console.error('[AUTH SVC] Error during business/admin creation transaction:', error);
        if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
             const target = (error.meta?.target as string[])?.join(', ');
             console.error(`[AUTH SVC] Unique constraint failed on: ${target}`);
             // Podríamos personalizar más el mensaje según el target
             throw new Error(`Error de base de datos: Conflicto de unicidad en ${target}.`);
        }
        // Relanzar como error genérico
        throw new Error('No se pudo completar el registro del negocio. Error interno del servidor.');
    }
};


// End of File: backend/src/auth/auth.service.ts
// --- FIN DEL CÓDIGO COMPLETO ---