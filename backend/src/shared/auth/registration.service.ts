// backend/src/shared/auth/registration.service.ts (CORREGIDO)
import { PrismaClient, User, UserRole, DocumentType, Prisma, Business } from '@prisma/client';
import { RegisterUserDto, RegisterBusinessDto } from './auth.dto';
import { hashPassword, findUserByEmail } from './auth.service';

// --- RUTA CORREGIDA ---
import { updateUserTier } from '../../modules/loyalpyme/tiers/tier-logic.service';
// --- FIN RUTA CORREGIDA ---

const prisma = new PrismaClient();

export const createUser = async (userData: RegisterUserDto): Promise<User> => {
    console.log(`[REG SVC] Creating CUSTOMER user: ${userData.email}`);
    const businessExists = await prisma.business.findUnique({ where: { id: userData.businessId } });
    if (!businessExists) {
        throw new Error(`Business with ID ${userData.businessId} not found.`);
    }
    if (userData.phone) {
        const existingPhone = await prisma.user.findUnique({ where: { phone: userData.phone }, select: { id: true } });
        if (existingPhone) throw new Error('El teléfono ya está registrado.');
    } else {
        throw new Error('El teléfono es un campo obligatorio para clientes.');
    }
    if (userData.documentId) {
        const existingDocument = await prisma.user.findUnique({ where: { documentId: userData.documentId }, select: { id: true } });
        if (existingDocument) throw new Error('El documento de identidad ya está registrado.');
    } else {
        throw new Error('El documento de identidad es un campo obligatorio para clientes.');
    }
    console.log(`[REG SVC] Uniqueness checks passed for ${userData.email}. Hashing password...`);

    const hashedPassword = await hashPassword(userData.password);
    let newUser: User | null = null;

    try {
        newUser = await prisma.user.create({
            data: {
                email: userData.email,
                password: hashedPassword,
                name: userData.name,
                phone: userData.phone,
                documentId: userData.documentId,
                documentType: userData.documentType,
                role: UserRole.CUSTOMER_FINAL,
                business: {
                    connect: { id: userData.businessId }
                }
            },
        });
        console.log(`[REG SVC] Customer user created successfully with ID: ${newUser.id}`);

        try {
             console.log(`[REG SVC] Attempting initial tier assignment for new user: ${newUser.id}`);
             await updateUserTier(newUser.id);
             console.log(`[REG SVC] Initial tier assignment process completed for user: ${newUser.id}`);
        } catch (tierError: any) {
            console.error(`[REG SVC] WARNING: Failed to assign initial tier for user ${newUser.id}. Tier can be updated later. Error:`, tierError);
        }

        return newUser;

    } catch (error) {
        if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
            const target = (error.meta?.target as string[])?.join(', ');
            console.error(`[REG SVC] Customer creation failed: Unique constraint DB error on ${target}.`);
            if (target?.includes('email')) throw new Error('El email ya está registrado.');
            if (target?.includes('phone')) throw new Error('El teléfono ya está registrado.');
            if (target?.includes('documentId')) throw new Error('El documento de identidad ya está registrado.');
            throw new Error(`Conflicto de unicidad en ${target}.`);
        }
        console.error(`[REG SVC] Unexpected error creating customer ${userData.email}:`, error);
        throw new Error('Error inesperado al crear el usuario cliente.');
    }
};

const generateSlug = (name: string): string => {
    return name
        .toLowerCase()
        .trim()
        .replace(/[^\w\s-]/g, '')
        .replace(/[\s_-]+/g, '-')
        .replace(/^-+|-+$/g, '');
};

export const createBusinessAndAdmin = async (
    data: RegisterBusinessDto
): Promise<Omit<User, 'password'>> => {
    console.log('[REG SVC] Attempting to create business and admin:', data.businessName, data.adminEmail);

    const existingUser = await findUserByEmail(data.adminEmail);
    if (existingUser) {
        console.warn(`[REG SVC] Admin email ${data.adminEmail} already exists.`);
        throw new Error('El email proporcionado ya está registrado.');
    }

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

    const hashedPassword = await hashPassword(data.adminPassword);

    try {
        console.log(`[REG SVC] Starting transaction to create business '${data.businessName}' (slug: ${slug}) and admin '${data.adminEmail}'`);
        const newUser = await prisma.$transaction(async (tx) => {
            const newBusiness = await tx.business.create({
                data: {
                    name: data.businessName,
                    slug: slug,
                },
                select: { id: true }
            });
            console.log(`[REG SVC - TX] Business created with ID: ${newBusiness.id}`);

            const adminUser = await tx.user.create({
                data: {
                    email: data.adminEmail,
                    password: hashedPassword,
                    name: data.adminName,
                    role: UserRole.BUSINESS_ADMIN,
                    businessId: newBusiness.id,
                }
            });
            console.log(`[REG SVC - TX] Admin user created with ID: ${adminUser.id} for business ${newBusiness.id}`);
            return adminUser;
        });

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
        throw new Error('No se pudo completar el registro del negocio. Error interno del servidor.');
    }
};