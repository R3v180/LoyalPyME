"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.seedUsers = seedUsers;
// backend/prisma/seed/_4_users.ts
const client_1 = require("@prisma/client");
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const date_fns_1 = require("date-fns");
// Función helper para hashear contraseñas
async function hashPassword(password) {
    const salt = await bcryptjs_1.default.genSalt(10);
    return bcryptjs_1.default.hash(password, salt);
}
/**
 * Función que crea los diferentes perfiles de cliente (personas).
 * Depende de que el negocio y los tiers ya existan.
 * @param prisma - Instancia del PrismaClient.
 * @param businessId - El ID del negocio al que pertenecerán los clientes.
 * @param tiers - Un objeto que contiene los tiers creados para asignar a los usuarios.
 * @returns Un objeto con las entidades de los clientes creados.
 */
async function seedUsers(prisma, businessId, tiers) {
    console.log('--- Seeding [4]: Customer Personas ---');
    // Usamos una transacción para crear todos los usuarios de una vez.
    const [anaOro, carlosPlata, davidNuevo, elenaInactiva, fernandoCero, usuarioDesactivado] = await prisma.$transaction([
        // 1. Ana "Oro": Cliente VIP
        prisma.user.upsert({
            where: { email: 'poweruser@demo.com' },
            update: { currentTierId: tiers.oro.id }, // Asegurar que tiene el tier correcto si ya existe
            create: {
                email: 'poweruser@demo.com', password: await hashPassword('password'), name: 'Ana "Oro" García', phone: '+34000000002',
                documentId: '00000002B', documentType: client_1.DocumentType.DNI, role: client_1.UserRole.CUSTOMER_FINAL, businessId,
                points: 2500, totalSpend: 850.50, totalVisits: 28, currentTierId: tiers.oro.id,
                tierAchievedAt: new Date(), lastActivityAt: (0, date_fns_1.subDays)(new Date(), 1)
            }
        }),
        // 2. Carlos "Plata": Cliente regular
        prisma.user.upsert({
            where: { email: 'mid-tier@demo.com' },
            update: { currentTierId: tiers.plata.id },
            create: {
                email: 'mid-tier@demo.com', password: await hashPassword('password'), name: 'Carlos "Plata" Ruiz', phone: '+34000000004',
                documentId: '00000004D', documentType: client_1.DocumentType.DNI, role: client_1.UserRole.CUSTOMER_FINAL, businessId,
                points: 350, totalSpend: 250.00, totalVisits: 8, currentTierId: tiers.plata.id,
                tierAchievedAt: (0, date_fns_1.subDays)(new Date(), 20), lastActivityAt: (0, date_fns_1.subDays)(new Date(), 5)
            }
        }),
        // 3. David "Nuevo": Cliente reciente
        prisma.user.upsert({
            where: { email: 'newuser@demo.com' },
            update: { currentTierId: tiers.bronce.id },
            create: {
                email: 'newuser@demo.com', password: await hashPassword('password'), name: 'David "Nuevo" Lopez', phone: '+34000000003',
                documentId: '00000003C', documentType: client_1.DocumentType.DNI, role: client_1.UserRole.CUSTOMER_FINAL, businessId,
                points: 65, totalSpend: 65.00, totalVisits: 2, currentTierId: tiers.bronce.id,
                tierAchievedAt: (0, date_fns_1.subDays)(new Date(), 3), createdAt: (0, date_fns_1.subDays)(new Date(), 3), lastActivityAt: (0, date_fns_1.subDays)(new Date(), 3)
            }
        }),
        // 4. Elena "Inactiva": Cliente para pruebas de downgrade
        prisma.user.upsert({
            where: { email: 'inactive@demo.com' },
            update: { currentTierId: tiers.bronce.id, lastActivityAt: (0, date_fns_1.subMonths)(new Date(), 7) },
            create: {
                email: 'inactive@demo.com', password: await hashPassword('password'), name: 'Elena "Inactiva" Martinez', phone: '+34000000005',
                documentId: '00000005E', documentType: client_1.DocumentType.DNI, role: client_1.UserRole.CUSTOMER_FINAL, businessId,
                points: 120, totalSpend: 110.00, totalVisits: 3, currentTierId: tiers.bronce.id,
                createdAt: (0, date_fns_1.subMonths)(new Date(), 8), lastActivityAt: (0, date_fns_1.subMonths)(new Date(), 7)
            }
        }),
        // 5. Fernando "Cero": Cliente sin actividad
        prisma.user.upsert({
            where: { email: 'zeropoints@demo.com' },
            update: {},
            create: {
                email: 'zeropoints@demo.com', password: await hashPassword('password'), name: 'Fernando "Cero" Sanchez', phone: '+34000000006',
                documentId: '00000006F', documentType: client_1.DocumentType.DNI, role: client_1.UserRole.CUSTOMER_FINAL, businessId,
                points: 0, totalSpend: 0, totalVisits: 0, createdAt: (0, date_fns_1.subDays)(new Date(), 10)
            }
        }),
        // 6. Usuario Desactivado
        prisma.user.upsert({
            where: { email: 'deactivated@demo.com' },
            update: { isActive: false },
            create: {
                email: 'deactivated@demo.com', password: await hashPassword('password'), name: 'Usuario Desactivado', phone: '+34000000007',
                documentId: '00000007G', documentType: client_1.DocumentType.DNI, role: client_1.UserRole.CUSTOMER_FINAL, businessId,
                points: 50, isActive: false
            }
        })
    ]);
    console.log(`[SEED] Upserted Customer Personas.`);
    return { anaOro, carlosPlata, davidNuevo, elenaInactiva, fernandoCero, usuarioDesactivado };
}
