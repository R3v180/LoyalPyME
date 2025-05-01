// filename: backend/src/auth/registration.service.ts
// Version: 1.1.0 (Call updateUserTier after customer creation - FULL CODE)

import { PrismaClient, User, UserRole, DocumentType, Prisma, Business } from '@prisma/client';

// Importar DTOs necesarios
import { RegisterUserDto, RegisterBusinessDto } from './auth.dto';

// Importar utilidades necesarias desde el servicio principal de auth
import { hashPassword, findUserByEmail } from './auth.service';

// --- NUEVO: Importar la función para actualizar el tier ---
import { updateUserTier } from '../tiers/tier-logic.service'; // Ajusta la ruta si es necesario
// --- FIN NUEVO ---


const prisma = new PrismaClient();

// --- Función para crear USUARIO CLIENTE ---
export const createUser = async (userData: RegisterUserDto): Promise<User> => {
    console.log(`[REG SVC] Creating CUSTOMER user: ${userData.email}`);
    const businessExists = await prisma.business.findUnique({ where: { id: userData.businessId } });
    if (!businessExists) {
        throw new Error(`Business with ID ${userData.businessId} not found.`);
    }
    // Validaciones de unicidad de teléfono/documento
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
    console.log(`[REG SVC] Uniqueness checks passed for ${userData.email}. Hashing password...`);

    const hashedPassword = await hashPassword(userData.password);
    let newUser: User | null = null; // Declarar fuera del try

    try {
        newUser = await prisma.user.create({
            data: {
                email: userData.email,
                password: hashedPassword,
                name: userData.name,
                phone: userData.phone,
                documentId: userData.documentId,
                documentType: userData.documentType,
                role: UserRole.CUSTOMER_FINAL, // Forzar rol cliente aquí
                business: {
                    connect: { id: userData.businessId }
                }
                // Los valores por defecto del schema se aplican aquí (points=0, etc)
            },
        });
        console.log(`[REG SVC] Customer user created successfully with ID: ${newUser.id}`);

        // --- NUEVO: Calcular y asignar tier inicial DESPUÉS de crear el usuario ---
        try {
             console.log(`[REG SVC] Attempting initial tier assignment for new user: ${newUser.id}`);
             await updateUserTier(newUser.id); // Llama a la lógica de cálculo de tier
             console.log(`[REG SVC] Initial tier assignment process completed for user: ${newUser.id}`);
        } catch (tierError) {
            // Loguear si falla la asignación inicial, pero no fallar el registro completo
            console.error(`[REG SVC] WARNING: Failed to assign initial tier for user ${newUser.id}. Tier can be updated later. Error:`, tierError);
        }
        // --- FIN NUEVO ---

        return newUser; // Devolver el usuario creado

    } catch (error) {
        // Capturar errores específicos de Prisma si es necesario, por si acaso
        if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
            const target = (error.meta?.target as string[])?.join(', ');
            console.error(`[REG SVC] Customer creation failed: Unique constraint DB error on ${target}.`);
            // Personalizar mensaje según el campo duplicado
            if (target?.includes('email')) throw new Error('El email ya está registrado.');
            if (target?.includes('phone')) throw new Error('El teléfono ya está registrado.');
            if (target?.includes('documentId')) throw new Error('El documento de identidad ya está registrado.');
            throw new Error(`Conflicto de unicidad en ${target}.`);
        }
        console.error(`[REG SVC] Unexpected error creating customer ${userData.email}:`, error);
        throw new Error('Error inesperado al crear el usuario cliente.');
    }
};

// --- Funciones para Registro de Negocio ---

/**
 * Genera un slug simple a partir de un nombre.
 * (Helper local para createBusinessAndAdmin)
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
 */
export const createBusinessAndAdmin = async (
    data: RegisterBusinessDto
): Promise<Omit<User, 'password'>> => {
    console.log('[REG SVC] Attempting to create business and admin:', data.businessName, data.adminEmail);

    // 1. Validar si el email del admin ya existe
    const existingUser = await findUserByEmail(data.adminEmail);
    if (existingUser) {
        console.warn(`[REG SVC] Admin email ${data.adminEmail} already exists.`);
        throw new Error('El email proporcionado ya está registrado.');
    }

    // 2. Generar y validar slug del negocio
    const slug = generateSlug(data.businessName);
    if (!slug) {
        console.error(`[REG SVC] Could not generate slug from business name: ${data.businessName}`);
        throw new Error('El nombre del negocio proporcionado no es válido para generar un identificador.');
    }
    const existingBusiness = await prisma.business.findUnique({
        where: { slug: slug },
        select: { id: true }
    });
    if (existingBusiness) {
        console.warn(`[REG SVC] Business slug ${slug} already exists.`);
        throw new Error(`Ya existe un negocio con un nombre similar ('${slug}'). Por favor, elige otro nombre.`);
    }

    // 3. Hashear la contraseña del admin
    const hashedPassword = await hashPassword(data.adminPassword);

    // 4. Crear Business y User Admin en una transacción
    try {
        console.log(`[REG SVC] Starting transaction to create business '${data.businessName}' (slug: ${slug}) and admin '${data.adminEmail}'`);
        const newUser = await prisma.$transaction(async (tx) => {
            const newBusiness = await tx.business.create({
                data: {
                    name: data.businessName,
                    slug: slug,
                    // Aquí se podrían poner valores por defecto para la config de Tiers si se desea
                },
                select: { id: true } // Necesitamos el ID para el usuario
            });
            console.log(`[REG SVC - TX] Business created with ID: ${newBusiness.id}`);

            const adminUser = await tx.user.create({
                data: {
                    email: data.adminEmail,
                    password: hashedPassword,
                    name: data.adminName, // Puede ser undefined
                    role: UserRole.BUSINESS_ADMIN,
                    businessId: newBusiness.id,
                    // Otros campos podrían inicializarse aquí si fuera necesario
                }
            });
            console.log(`[REG SVC - TX] Admin user created with ID: ${adminUser.id} for business ${newBusiness.id}`);
            // No calculamos tier para el admin
            return adminUser;
        });

        // 5. Quitar la contraseña antes de devolver
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { password, ...userWithoutPassword } = newUser;
        console.log(`[REG SVC] Business and admin creation successful for ${data.adminEmail}.`);
        return userWithoutPassword;

    } catch (error) {
        console.error('[REG SVC] Error during business/admin creation transaction:', error);
        if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
             const target = (error.meta?.target as string[])?.join(', ');
             console.error(`[REG SVC] Unique constraint failed on: ${target}`);
             throw new Error(`Error de base de datos: Conflicto de unicidad en ${target}.`);
        }
        // Relanzar como error genérico
        throw new Error('No se pudo completar el registro del negocio. Error interno del servidor.');
    }
};

// End of File: backend/src/auth/registration.service.ts