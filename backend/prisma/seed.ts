// backend/prisma/seed.ts
// ORCHESTRATOR - Calls modular seed files in order.

import { PrismaClient } from '@prisma/client';
import { seedBusiness } from './seed/_1_business';
import { seedTiers } from './seed/_2_tiers';
import { seedMenu } from './seed/_3_menu';
import { seedUsers } from './seed/_4_users';
import { seedActivity } from './seed/_5_activity';

const prisma = new PrismaClient();

async function main() {
    console.log(`[SEED ORCHESTRATOR] Starting modular seeding...`);

    // --- The order of execution is critical ---
    
    // 1. Create the business and staff. These are the foundation.
    const { business, admin, camarero, cocina, barra } = await seedBusiness(prisma);
    
    // 2. Create the loyalty tiers for the business.
    const { bronce, plata, oro, platino } = await seedTiers(prisma, business.id);
    
    // 3. Create the digital menu, items, and modifiers.
    const { hamburguesa, tarta, cafe, refresco, puntoCarneGroup, extrasGroup } = await seedMenu(prisma, business.id);
    
    // 4. Create the customer personas and assign them tiers.
    const { anaOro, carlosPlata, davidNuevo, elenaInactiva, fernandoCero } = await seedUsers(prisma, business.id, { bronce, plata, oro });

    // 5. Create the historical activity, linking all previously created entities.
    await seedActivity(prisma, {
        business,
        admin,
        anaOro,
        carlosPlata,
        davidNuevo,
        hamburguesa,
        tarta,
        cafe,
        puntoCarneGroup,
        extrasGroup
    });

    console.log(`[SEED ORCHESTRATOR] Modular seeding finished successfully!`);
}

main()
  .catch(async (e) => {
    console.error("[SEED ORCHESTRATOR] An error occurred during the seeding process:", e);
    await prisma.$disconnect();
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });