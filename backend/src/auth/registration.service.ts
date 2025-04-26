// filename: backend/src/auth/registration.service.ts
// Contiene la lÃ³gica para el registro de clientes y negocios/admins

import { PrismaClient, User, UserRole, DocumentType, Prisma, Business } from '@prisma/client';

// Importar DTOs necesarios
import { RegisterUserDto, RegisterBusinessDto } from './auth.dto';

// Importar utilidades necesarias desde el servicio principal de auth
// ASUNCIÃ“N: Estas funciones permanecerÃ¡n o serÃ¡n exportadas desde auth.service.ts
import { hashPassword, findUserByEmail } from './auth.service';

const prisma = new PrismaClient();

// --- FunciÃ³n para crear USUARIO CLIENTE ---
export const createUser = async (userData: RegisterUserDto): Promise<User> => {
   console.log(`[REG SVC] Creating CUSTOMER user: ${userData.email}`);
   const businessExists = await prisma.business.findUnique({ where: { id: userData.businessId } });
   if (!businessExists) {
       throw new Error(`Business with ID ${userData.businessId} not found.`);
   }
   // Validaciones de unicidad de telÃ©fono/documento (mantenerlas aquÃ­ para registro de cliente)
   if (userData.phone) {
       const existingPhone = await prisma.user.findUnique({ where: { phone: userData.phone }, select: { id: true } });
       if (existingPhone) throw new Error('El telÃ©fono ya estÃ¡ registrado.');
   } else {
       // Considerar si el telÃ©fono debe ser obligatorio siempre o solo para clientes
       throw new Error('El telÃ©fono es un campo obligatorio para clientes.');
   }
   if (userData.documentId) {
       const existingDocument = await prisma.user.findUnique({ where: { documentId: userData.documentId }, select: { id: true } });
       if (existingDocument) throw new Error('El documento de identidad ya estÃ¡ registrado.');
   } else {
        // Considerar si el documento debe ser obligatorio siempre o solo para clientes
       throw new Error('El documento de identidad es un campo obligatorio para clientes.');
   }
   console.log(`[REG SVC] Uniqueness checks passed for ${userData.email}. Hashing password...`);

   // Hashear contraseÃ±a
   const hashedPassword = await hashPassword(userData.password); // Usa la utilidad importada

   // Crear usuario
   try {
       return prisma.user.create({
           data: {
               email: userData.email,
               password: hashedPassword,
               name: userData.name,
               phone: userData.phone,
               documentId: userData.documentId,
               documentType: userData.documentType,
               role: UserRole.CUSTOMER_FINAL, // Forzar rol cliente aquÃ­
               business: {
                   connect: { id: userData.businessId }
               }
           },
       });
   } catch (error) {
       // Capturar errores especÃ­ficos de Prisma si es necesario, por si acaso
       if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
            const target = (error.meta?.target as string[])?.join(', ');
            console.error(`[REG SVC] Customer creation failed: Unique constraint DB error on ${target}.`);
            // Personalizar mensaje segÃºn el campo duplicado
            if (target?.includes('email')) throw new Error('El email ya estÃ¡ registrado.');
            if (target?.includes('phone')) throw new Error('El telÃ©fono ya estÃ¡ registrado.');
            if (target?.includes('documentId')) throw new Error('El documento de identidad ya estÃ¡ registrado.');
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
        .replace(/[^\w\s-]/g, '') // Eliminar caracteres no alfanumÃ©ricos excepto espacios y guiones
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
    const existingUser = await findUserByEmail(data.adminEmail); // Usa la utilidad importada
    if (existingUser) {
        console.warn(`[REG SVC] Admin email ${data.adminEmail} already exists.`);
        throw new Error('El email proporcionado ya estÃ¡ registrado.');
    }

    // 2. Generar y validar slug del negocio
    const slug = generateSlug(data.businessName);
    if (!slug) {
        console.error(`[REG SVC] Could not generate slug from business name: ${data.businessName}`);
        throw new Error('El nombre del negocio proporcionado no es vÃ¡lido para generar un identificador.');
    }
    const existingBusiness = await prisma.business.findUnique({
        where: { slug: slug },
        select: { id: true }
    });
    if (existingBusiness) {
        console.warn(`[REG SVC] Business slug ${slug} already exists.`);
        throw new Error(`Ya existe un negocio con un nombre similar ('${slug}'). Por favor, elige otro nombre.`);
    }

    // 3. Hashear la contraseÃ±a del admin
    const hashedPassword = await hashPassword(data.adminPassword); // Usa la utilidad importada

    // 4. Crear Business y User Admin en una transacciÃ³n
    try {
        console.log(`[REG SVC] Starting transaction to create business '${data.businessName}' (slug: ${slug}) and admin '${data.adminEmail}'`);
        const newUser = await prisma.$transaction(async (tx) => {
            // Crear el negocio
            const newBusiness = await tx.business.create({
                data: {
                    name: data.businessName,
                    slug: slug,
                    // AquÃ­ se podrÃ­an poner valores por defecto para la config de Tiers si se desea
                },
                select: { id: true } // Necesitamos el ID para el usuario
            });
            console.log(`[REG SVC - TX] Business created with ID: ${newBusiness.id}`);

            // Crear el usuario administrador asociado al negocio
            const adminUser = await tx.user.create({
                data: {
                    email: data.adminEmail,
                    password: hashedPassword,
                    name: data.adminName, // Puede ser undefined
                    role: UserRole.BUSINESS_ADMIN, // Rol especÃ­fico
                    businessId: newBusiness.id, // Asociar al negocio reciÃ©n creado
                    // Otros campos podrÃ­an inicializarse aquÃ­ si fuera necesario
                }
            });
            console.log(`[REG SVC - TX] Admin user created with ID: ${adminUser.id} for business ${newBusiness.id}`);
            return adminUser; // Devolver el usuario creado
        });

        // 5. Quitar la contraseÃ±a antes de devolver
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
        // Relanzar como error genÃ©rico
        throw new Error('No se pudo completar el registro del negocio. Error interno del servidor.');
    }
};

// End of File: backend/src/auth/registration.service.ts