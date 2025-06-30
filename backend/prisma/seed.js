"use strict";
// backend/prisma/seed.ts
// ORCHESTRATOR - Calls modular seed files in order.
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("@prisma/client");
const _1_business_1 = require("./seed/_1_business");
const _2_tiers_1 = require("./seed/_2_tiers");
const _3_menu_1 = require("./seed/_3_menu");
const _4_users_1 = require("./seed/_4_users");
const _5_activity_1 = require("./seed/_5_activity");
const prisma = new client_1.PrismaClient();
async function main() {
    console.log(`[SEED ORCHESTRATOR] Starting modular seeding...`);
    // --- The order of execution is critical ---
    // 1. Create the business and staff. These are the foundation.
    const { business, admin, camarero, cocina, barra } = await (0, _1_business_1.seedBusiness)(prisma);
    // 2. Create the loyalty tiers for the business.
    const { bronce, plata, oro, platino } = await (0, _2_tiers_1.seedTiers)(prisma, business.id);
    // 3. Create the digital menu, items, and modifiers.
    const { hamburguesa, tarta, cafe, refresco, puntoCarneGroup, extrasGroup } = await (0, _3_menu_1.seedMenu)(prisma, business.id);
    // 4. Create the customer personas and assign them tiers.
    const { anaOro, carlosPlata, davidNuevo, elenaInactiva, fernandoCero } = await (0, _4_users_1.seedUsers)(prisma, business.id, { bronce, plata, oro });
    // 5. Create the historical activity, linking all previously created entities.
    await (0, _5_activity_1.seedActivity)(prisma, {
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
