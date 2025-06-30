"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.seedTiers = seedTiers;
// backend/prisma/seed/_2_tiers.ts
const client_1 = require("@prisma/client");
/**
 * Función que crea los niveles de fidelización (Tiers) y les asigna beneficios.
 * Depende de que el negocio ya exista.
 * @param prisma - Instancia del PrismaClient.
 * @param businessId - El ID del negocio al que pertenecerán estos tiers.
 * @returns Un objeto con las entidades de Tier creadas.
 */
async function seedTiers(prisma, businessId) {
    console.log('--- Seeding [2]: Tiers & Benefits ---');
    // 1. CREAR LOS NIVELES (TIERS)
    // Usamos una transacción para crear todos los tiers a la vez. upsert es ideal aquí.
    const [bronce, plata, oro, platino] = await prisma.$transaction([
        prisma.tier.upsert({
            where: { businessId_level: { businessId, level: 1 } },
            update: { name: 'Bronce', minValue: 50 },
            create: { name: 'Bronce', level: 1, minValue: 50, businessId }
        }),
        prisma.tier.upsert({
            where: { businessId_level: { businessId, level: 2 } },
            update: { name: 'Plata', minValue: 200 },
            create: { name: 'Plata', level: 2, minValue: 200, businessId }
        }),
        prisma.tier.upsert({
            where: { businessId_level: { businessId, level: 3 } },
            update: { name: 'Oro', minValue: 500 },
            create: { name: 'Oro', level: 3, minValue: 500, businessId }
        }),
        prisma.tier.upsert({
            where: { businessId_level: { businessId, level: 4 } },
            update: { name: 'Platino', minValue: 1500 },
            create: { name: 'Platino', level: 4, minValue: 1500, businessId }
        }),
    ]);
    console.log(`[SEED] Upserted Tiers: Bronce, Plata, Oro, Platino.`);
    // 2. ASIGNAR BENEFICIOS A LOS NIVELES (con la estrategia de create/catch)
    // Beneficio para el Nivel Oro: Multiplicador de Puntos
    try {
        await prisma.tierBenefit.create({
            data: {
                tierId: oro.id,
                type: client_1.BenefitType.POINTS_MULTIPLIER,
                value: "1.5",
                description: "Gana un 50% más de puntos en todas tus compras."
            }
        });
    }
    catch (error) {
        if (error instanceof client_1.Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
            console.log('[SEED] Oro benefit already exists, skipping creation.');
        }
        else {
            throw error; // Relanzar si es un error diferente
        }
    }
    // Beneficio para el Nivel Platino: Beneficio Personalizado (texto)
    try {
        await prisma.tierBenefit.create({
            data: {
                tierId: platino.id,
                type: client_1.BenefitType.CUSTOM_BENEFIT,
                value: "Postre gratis al mes",
                description: "Un postre de la casa por cortesía una vez al mes."
            }
        });
    }
    catch (error) {
        if (error instanceof client_1.Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
            console.log('[SEED] Platino benefit already exists, skipping creation.');
        }
        else {
            throw error; // Relanzar si es un error diferente
        }
    }
    console.log(`[SEED] Created or verified specific Benefits for Oro and Platino tiers.`);
    // 3. DEVOLVER LOS OBJETOS CREADOS
    return { bronce, plata, oro, platino };
}
