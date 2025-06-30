"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.seedBusiness = seedBusiness;
// backend/prisma/seed/_1_business.ts
const client_1 = require("@prisma/client");
const bcryptjs_1 = __importDefault(require("bcryptjs"));
// Función helper para hashear contraseñas, necesaria para crear usuarios.
async function hashPassword(password) {
    const salt = await bcryptjs_1.default.genSalt(10);
    return bcryptjs_1.default.hash(password, salt);
}
/**
 * Función que crea el negocio principal, todos los roles de personal y las mesas.
 * Es la base sobre la que se construirán los demás datos.
 * @param prisma - Instancia del PrismaClient.
 * @returns Un objeto con las entidades creadas para que otros scripts las usen.
 */
async function seedBusiness(prisma) {
    console.log('--- Seeding [1]: Business, Staff & Tables ---');
    // 1. CREAR O ACTUALIZAR EL NEGOCIO DEMO
    const business = await prisma.business.upsert({
        where: { slug: 'restaurante-demo-loyalpyme' },
        update: { isLoyaltyCoreActive: true, isCamareroActive: true },
        create: {
            name: 'Restaurante Demo LoyalPyME',
            slug: 'restaurante-demo-loyalpyme',
            pointsPerEuro: 1.0,
            tierSystemEnabled: true,
            tierCalculationBasis: client_1.TierCalculationBasis.SPEND,
            tierCalculationPeriodMonths: 0,
            tierDowngradePolicy: client_1.TierDowngradePolicy.PERIODIC_REVIEW,
            inactivityPeriodMonths: 6,
            isActive: true,
            isLoyaltyCoreActive: true,
            isCamareroActive: true,
            logoUrl: 'https://res.cloudinary.com/dq8e13lmr/image/upload/v1710860730/loyalpyme/assets/default_business_logo_vzg0sa.png',
            brandingColorPrimary: '#228BE6',
            brandingColorSecondary: '#495057',
            qrCodeExpirationMinutes: 30,
            monthlyPrice: 49.99,
            currency: "EUR"
        },
    });
    console.log(`[SEED] Upserted Business: ${business.name}`);
    // 2. CREAR O ACTUALIZAR LOS USUARIOS DE PERSONAL
    const [admin, camarero, cocina, barra] = await prisma.$transaction([
        prisma.user.upsert({
            where: { email: 'admin@demo.com' },
            update: {},
            create: { email: 'admin@demo.com', password: await hashPassword('password'), name: 'Admin Demo', role: client_1.UserRole.BUSINESS_ADMIN, businessId: business.id },
        }),
        prisma.user.upsert({
            where: { email: 'camarero@demo.com' },
            update: {},
            create: { email: 'camarero@demo.com', password: await hashPassword('password'), name: 'Camarero Demo', role: client_1.UserRole.WAITER, businessId: business.id },
        }),
        prisma.user.upsert({
            where: { email: 'cocina@demo.com' },
            update: {},
            create: { email: 'cocina@demo.com', password: await hashPassword('password'), name: 'Cocinero Demo', role: client_1.UserRole.KITCHEN_STAFF, businessId: business.id },
        }),
        prisma.user.upsert({
            where: { email: 'barra@demo.com' },
            update: {},
            create: { email: 'barra@demo.com', password: await hashPassword('password'), name: 'Barman Demo', role: client_1.UserRole.BAR_STAFF, businessId: business.id },
        })
    ]);
    console.log(`[SEED] Upserted Staff Users.`);
    // 3. CREAR MESAS PARA EL RESTAURANTE
    console.log(`[SEED] Creating tables for the business...`);
    const tableIdentifiers = [
        'M1', 'M2', 'M3', 'M4', 'M5', 'M6', // Mesas interiores
        'T1', 'T2', 'T3', 'T4', 'T5', // Terraza
        'B1', 'B2', 'B3', 'B4' // Barra
    ];
    // Borramos las mesas existentes de este negocio para empezar de cero
    await prisma.table.deleteMany({ where: { businessId: business.id } });
    const tableCreationPromises = tableIdentifiers.map(identifier => prisma.table.create({
        data: {
            identifier,
            businessId: business.id,
            status: client_1.TableStatus.AVAILABLE,
            capacity: identifier.startsWith('M') ? 4 : (identifier.startsWith('T') ? 4 : 2) // Capacidad de ejemplo
        }
    }));
    await prisma.$transaction(tableCreationPromises);
    console.log(`[SEED] Created ${tableIdentifiers.length} tables.`);
    // 4. DEVOLVER LOS OBJETOS CREADOS
    return { business, admin, camarero, cocina, barra };
}
