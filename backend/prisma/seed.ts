// backend/prisma/seed.ts
/// <reference types="node" />

import { 
    PrismaClient, UserRole, DocumentType, TierCalculationBasis, TierDowngradePolicy, 
    // ModifierUiType, // No se importa si se usa el objeto local
    Prisma, QrCodeStatus, ActivityType
} from '@prisma/client';
import bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';
import { subDays, startOfDay, endOfDay, eachDayOfInterval, formatISO } from 'date-fns';

const prisma = new PrismaClient();

// Definimos los valores de ModifierUiType localmente
const SeedModifierUiType = {
    RADIO: 'RADIO',
    CHECKBOX: 'CHECKBOX',
} as const;

async function hashPassword(password: string): Promise<string> {
  const salt = await bcrypt.genSalt(10);
  return bcrypt.hash(password, salt);
}

async function main() {
  console.log(`[SEED] Start seeding with FULL data (including menu & historical stats)...`);

  // --- 1. Crear Negocio de Demostración ---
  const demoBusinessName = 'Restaurante Demo LoyalPyME';
  const demoBusinessSlug = 'restaurante-demo-loyalpyme';
  
  let demoBusiness = await prisma.business.upsert({
    where: { slug: demoBusinessSlug },
    update: {
      name: demoBusinessName, pointsPerEuro: 1.0, tierSystemEnabled: true,
      tierCalculationBasis: TierCalculationBasis.SPEND, tierCalculationPeriodMonths: 0,
      tierDowngradePolicy: TierDowngradePolicy.PERIODIC_REVIEW, inactivityPeriodMonths: 6,
      isActive: true, isLoyaltyCoreActive: true, isCamareroActive: true,
      logoUrl: 'https://res.cloudinary.com/dq8e13lmr/image/upload/v1710860730/loyalpyme/assets/default_business_logo_vzg0sa.png',
      brandingColorPrimary: '#228BE6', brandingColorSecondary: '#495057',
    },
    create: {
      name: demoBusinessName, slug: demoBusinessSlug, pointsPerEuro: 1.0,
      tierSystemEnabled: true, tierCalculationBasis: TierCalculationBasis.SPEND,
      tierCalculationPeriodMonths: 0, tierDowngradePolicy: TierDowngradePolicy.PERIODIC_REVIEW,
      inactivityPeriodMonths: 6, isActive: true, isLoyaltyCoreActive: true, isCamareroActive: true,
      logoUrl: 'https://res.cloudinary.com/dq8e13lmr/image/upload/v1710860730/loyalpyme/assets/default_business_logo_vzg0sa.png',
      brandingColorPrimary: '#228BE6', brandingColorSecondary: '#495057',
    },
  });
  console.log(`[SEED] Upserted Demo Business: ${demoBusiness.name} (ID: ${demoBusiness.id})`);

  // --- 2. Crear Administrador ---
  const adminEmail = 'admin@demo.com';
  const hashedAdminPassword = await hashPassword('password');
  const demoAdmin = await prisma.user.upsert({
    where: { email: adminEmail },
    update: { password: hashedAdminPassword, name: 'Admin Demo', role: UserRole.BUSINESS_ADMIN, businessId: demoBusiness.id, isActive: true, },
    create: { email: adminEmail, password: hashedAdminPassword, name: 'Admin Demo', phone: '+34000000001', documentId: '00000001A', documentType: DocumentType.DNI, role: UserRole.BUSINESS_ADMIN, businessId: demoBusiness.id, isActive: true, },
  });
  console.log(`[SEED] Upserted Demo Admin: ${demoAdmin.email}`);

  // --- 3. Crear Clientes de Prueba ---
  const customer1Email = 'cliente@demo.com';
  const customer2Email = 'cliente2@demo.com';
  const customer3Email = 'cliente3.semana.pasada@demo.com';

  const hashedCustomer1Password = await hashPassword('password');
  const demoCustomer1 = await prisma.user.upsert({
    where: { email: customer1Email },
    update: { password: hashedCustomer1Password, name: 'Cliente Demo 1', points: 150, totalSpend: 150.0, totalVisits: 3, lastActivityAt: new Date(), isActive: true, },
    create: { email: customer1Email, password: hashedCustomer1Password, name: 'Cliente Demo 1', phone: '+34000000002', documentId: '00000002B', documentType: DocumentType.DNI, role: UserRole.CUSTOMER_FINAL, businessId: demoBusiness.id, points: 150, totalSpend: 150.0, totalVisits: 3, lastActivityAt: new Date(), isActive: true, },
  });
  console.log(`[SEED] Upserted Demo Customer 1: ${demoCustomer1.email}`);

  const hashedCustomer2Password = await hashPassword('password');
  const demoCustomer2 = await prisma.user.upsert({
    where: { email: customer2Email },
    update: { password: hashedCustomer2Password, name: 'Cliente Demo 2 Activo', isActive: true, },
    create: { email: customer2Email, password: hashedCustomer2Password, name: 'Cliente Demo 2 Activo', phone: '+34000000003', documentId: '00000003C', documentType: DocumentType.DNI, role: UserRole.CUSTOMER_FINAL, businessId: demoBusiness.id, isActive: true, createdAt: subDays(new Date(), 3) },
  });
  console.log(`[SEED] Upserted Demo Customer 2: ${demoCustomer2.email}`);

  const hashedCustomer3Password = await hashPassword('password');
  const demoCustomer3 = await prisma.user.upsert({
    where: { email: customer3Email },
    update: { password: hashedCustomer3Password, name: 'Cliente Semana Pasada', isActive: true, },
    create: { email: customer3Email, password: hashedCustomer3Password, name: 'Cliente Semana Pasada', phone: '+34000000004', documentId: '00000004D', documentType: DocumentType.DNI, role: UserRole.CUSTOMER_FINAL, businessId: demoBusiness.id, isActive: true, createdAt: subDays(new Date(), 9) },
  });
  console.log(`[SEED] Upserted Demo Customer 3: ${demoCustomer3.email}`);

  // --- 4. Tiers ---
  const tiersData = [
    { name: 'Bronce Demo', level: 1, minValue: 50, benefitsDescription: 'Pequeños descuentos', description: 'Nivel inicial.' },
    { name: 'Plata Demo', level: 2, minValue: 200, benefitsDescription: 'Descuentos y acceso', description: 'Nivel intermedio.' },
    { name: 'Oro Demo', level: 3, minValue: 500, benefitsDescription: 'Grandes descuentos', description: 'Nivel superior.' },
  ];
  for (const tierData of tiersData) {
    await prisma.tier.upsert({
      where: { businessId_level: { businessId: demoBusiness.id, level: tierData.level } },
      update: { name: tierData.name, minValue: tierData.minValue, description: tierData.description, benefitsDescription: tierData.benefitsDescription },
      create: { ...tierData, businessId: demoBusiness.id },
    });
  }
  console.log(`[SEED] Upserted Tiers for business ${demoBusiness.id}`);

  // --- 5. Recompensas LCo ---
  const rewardsLCoData = [
    { name_es: 'Café Gratis Demo LCo', name_en: 'Free Coffee Demo LCo', pointsCost: 50, imageUrl: 'https://source.unsplash.com/random/300x300/?coffee' },
    { name_es: 'Descuento 10% LCo', name_en: '10% Discount LCo', pointsCost: 100, isActive: true },
  ];
  let cafeLCoRewardId: string | undefined;
  for (const rewardData of rewardsLCoData) {
    const r = await prisma.reward.create({ // Usar create ya que migrate reset limpia
      data: { ...rewardData, businessId: demoBusiness.id },
    });
    if (rewardData.name_es.includes('Café')) cafeLCoRewardId = r.id;
  }
  console.log(`[SEED] Created LCo Rewards for business ${demoBusiness.id}`);

  // --- 6. Carta Digital ---
  console.log(`[SEED] Creating Digital Menu for business ${demoBusiness.id}...`);

  // 6.1 Categorías del Menú (Usar create)
  const catEntrantes = await prisma.menuCategory.create({
    data: { businessId: demoBusiness.id, name_es: "Entrantes Demo", name_en: "Starters Demo", description_es: "Deliciosas opciones para comenzar", description_en: "Delicious options to start", imageUrl: "https://source.unsplash.com/random/400x400/?appetizer", position: 0, isActive: true, }
  });
  const catPrincipales = await prisma.menuCategory.create({
    data: { businessId: demoBusiness.id, name_es: "Platos Principales Demo", name_en: "Main Courses Demo", description_es: "Nuestra selección de platos fuertes", description_en: "Our selection of main dishes", imageUrl: "https://source.unsplash.com/random/400x400/?main,course", position: 1, isActive: true, }
  });
  const catPostres = await prisma.menuCategory.create({
    data: { businessId: demoBusiness.id, name_es: "Postres Demo", name_en: "Desserts Demo", imageUrl: "https://source.unsplash.com/random/400x400/?dessert", position: 2, isActive: true, }
  });
  console.log(`[SEED] Created Menu Categories: ${catEntrantes.name_es}, ${catPrincipales.name_es}, ${catPostres.name_es}`);

  // 6.2 Ítems del Menú (Usar create)
  await prisma.menuItem.create({
    data: { businessId: demoBusiness.id, categoryId: catEntrantes.id, name_es: "Croquetas Caseras Demo", name_en: "Homemade Croquettes Demo", price: new Prisma.Decimal(8.50), imageUrl: "https://source.unsplash.com/random/300x300/?croquettes", allergens: ["GLUTEN", "LACTOSE"], tags: ["POPULAR"], position: 0, isAvailable: true, }
  });
  await prisma.menuItem.create({
    data: { businessId: demoBusiness.id, categoryId: catEntrantes.id, name_es: "Ensalada César Demo", name_en: "Caesar Salad Demo", description_es: "Pollo, lechuga, croutons, parmesano y nuestra salsa césar especial.", description_en: "Chicken, lettuce, croutons, parmesan, and our special caesar dressing.", price: new Prisma.Decimal(10.00), imageUrl: "https://source.unsplash.com/random/300x300/?caesar,salad", allergens: ["GLUTEN", "LACTOSE", "FISH"], tags: [], position: 1, isAvailable: true, }
  });

  const itemHamburguesa = await prisma.menuItem.create({
    data: { businessId: demoBusiness.id, categoryId: catPrincipales.id, name_es: "Hamburguesa Gourmet Demo", name_en: "Gourmet Burger Demo", price: new Prisma.Decimal(12.75), imageUrl: "https://source.unsplash.com/random/300x300/?burger", description_es: "200g de ternera premium, queso cheddar, bacon crujiente, lechuga, tomate y salsa especial. Acompañada de patatas fritas.", allergens: ["GLUTEN", "LACTOSE", "SESAME"], tags: ["HOUSE_SPECIAL"], position: 0, isAvailable: true, preparationTime: 15, calories: 850, sku: "BURG-GOURMET-001" }
  });
  console.log(`[SEED] Created Menu Item: ${itemHamburguesa.name_es}`);

  // Grupo de Modificadores para la Hamburguesa: Punto de Cocción
  // Asumimos que SÍ tienes @@unique([menuItemId, name_es]) en ModifierGroup
  const grupoPuntoCoccion = await prisma.modifierGroup.upsert({
    where: { menuItemId_name_es: { menuItemId: itemHamburguesa.id, name_es: "Punto de la Carne" } },
    update: {}, 
    create: {
        menuItemId: itemHamburguesa.id, businessId: demoBusiness.id, name_es: "Punto de la Carne", name_en: "Meat Doneness",
        uiType: SeedModifierUiType.RADIO,
        minSelections: 1, maxSelections: 1, position: 0, isRequired: true,
    }
  });
  await prisma.modifierOption.createMany({ data: [
    { groupId: grupoPuntoCoccion.id, name_es: "Poco Hecha", name_en: "Rare", priceAdjustment: new Prisma.Decimal(0), position: 0, isDefault: false, isAvailable: true },
    { groupId: grupoPuntoCoccion.id, name_es: "Al Punto", name_en: "Medium", priceAdjustment: new Prisma.Decimal(0), position: 1, isDefault: true, isAvailable: true },
    { groupId: grupoPuntoCoccion.id, name_es: "Muy Hecha", name_en: "Well Done", priceAdjustment: new Prisma.Decimal(0), position: 2, isDefault: false, isAvailable: true },
  ]});
  console.log(`[SEED] Upserted ModifierGroup "${grupoPuntoCoccion.name_es}" with options for ${itemHamburguesa.name_es}`);

  const grupoExtrasBurger = await prisma.modifierGroup.upsert({
    where: { menuItemId_name_es: { menuItemId: itemHamburguesa.id, name_es: "Extras Hamburguesa" } },
    update: {},
    create: {
        menuItemId: itemHamburguesa.id, businessId: demoBusiness.id, name_es: "Extras Hamburguesa", name_en: "Burger Extras",
        uiType: SeedModifierUiType.CHECKBOX,
        minSelections: 0, maxSelections: 3, position: 1, isRequired: false,
    }
  });
  await prisma.modifierOption.createMany({ data: [
    { groupId: grupoExtrasBurger.id, name_es: "Queso Extra", name_en: "Extra Cheese", priceAdjustment: new Prisma.Decimal(1.00), position: 0, isAvailable: true },
    { groupId: grupoExtrasBurger.id, name_es: "Bacon Extra", name_en: "Extra Bacon", priceAdjustment: new Prisma.Decimal(1.50), position: 1, isAvailable: true },
    { groupId: grupoExtrasBurger.id, name_es: "Huevo Frito", name_en: "Fried Egg", priceAdjustment: new Prisma.Decimal(1.20), position: 2, isAvailable: true },
    { groupId: grupoExtrasBurger.id, name_es: "Guacamole", name_en: "Guacamole", priceAdjustment: new Prisma.Decimal(2.00), position: 3, isAvailable: true },
  ]});
  console.log(`[SEED] Upserted ModifierGroup "${grupoExtrasBurger.name_es}" with options for ${itemHamburguesa.name_es}`);

  await prisma.menuItem.create({
    data: { businessId: demoBusiness.id, categoryId: catPrincipales.id, name_es: "Salmón a la Plancha Demo", name_en: "Grilled Salmon Demo", price: new Prisma.Decimal(15.00), imageUrl: "https://source.unsplash.com/random/300x300/?salmon,dish", allergens: ["FISH"], tags: [], position: 1, isAvailable: true, }
  });
  await prisma.menuItem.create({
    data: { businessId: demoBusiness.id, categoryId: catPostres.id, name_es: "Tarta de Queso Demo", name_en: "Cheesecake Demo", price: new Prisma.Decimal(6.00), imageUrl: "https://source.unsplash.com/random/300x300/?cheesecake", allergens: ["LACTOSE", "GLUTEN"], tags: ["POPULAR"], position: 0, isAvailable: true, }
  });
  console.log(`[SEED] Finished creating Digital Menu items.`);
  
  // --- 7. Generar Datos Históricos para Estadísticas ---
  console.log(`[SEED] Generating historical data for statistics...`);
  const now = new Date();

  const startOfThisWeek = startOfDay(subDays(now, 6));
  const daysThisWeek = eachDayOfInterval({ start: startOfThisWeek, end: now });

  for (const day of daysThisWeek.slice(0, -1)) { 
    if (Math.random() > 0.3) { 
        const amount = Math.floor(Math.random() * 40) + 5; 
        const pointsToEarn = Math.floor(amount * (demoBusiness.pointsPerEuro ?? 1));
        const ticketNum = `TICKET-${formatISO(day, { representation: 'date' })}-${Math.floor(Math.random() * 1000)}`;
        
        await prisma.qrCode.create({
            data: { token: uuidv4(), businessId: demoBusiness.id, amount, ticketNumber: ticketNum, expiresAt: subDays(day, -1), status: QrCodeStatus.COMPLETED, completedAt: day, userId: demoCustomer1.id, pointsEarned: pointsToEarn }
        });
        await prisma.activityLog.create({
            data: { userId: demoCustomer1.id, businessId: demoBusiness.id, type: ActivityType.POINTS_EARNED_QR, pointsChanged: pointsToEarn, description: ticketNum, createdAt: day, relatedQrId: (await prisma.qrCode.findFirstOrThrow({where: {token: (await prisma.qrCode.findFirstOrThrow({where: {ticketNumber: ticketNum}})).token}})).id } // Esto es un poco enrevesado, mejor guardar el ID del QR creado arriba
        });
        await prisma.user.update({ where: {id: demoCustomer1.id }, data: {  points: {increment: pointsToEarn}, totalSpend: {increment: amount}, totalVisits: {increment: 1}, lastActivityAt: day }});
    }
  }

  const startOfLastWeek = startOfDay(subDays(now, 13));
  const endOfLastWeek = endOfDay(subDays(now, 7));
  const daysLastWeek = eachDayOfInterval({ start: startOfLastWeek, end: endOfLastWeek });

  for (const day of daysLastWeek) {
    if (Math.random() > 0.4) { 
        const amount = Math.floor(Math.random() * 50) + 10; 
        const pointsToEarn = Math.floor(amount * (demoBusiness.pointsPerEuro ?? 1));
        const ticketNum = `TICKET-LW-${formatISO(day, { representation: 'date' })}-${Math.floor(Math.random() * 1000)}`;
        
        const createdQr = await prisma.qrCode.create({ // Guardar el QR creado
            data: { token: uuidv4(), businessId: demoBusiness.id, amount, ticketNumber: ticketNum, expiresAt: subDays(day, -1), status: QrCodeStatus.COMPLETED, completedAt: day, userId: demoCustomer3.id, pointsEarned: pointsToEarn }
        });
         await prisma.activityLog.create({
            data: { userId: demoCustomer3.id, businessId: demoBusiness.id, type: ActivityType.POINTS_EARNED_QR, pointsChanged: pointsToEarn, description: ticketNum, createdAt: day, relatedQrId: createdQr.id } // Usar el ID guardado
        });
        await prisma.user.update({ where: {id: demoCustomer3.id }, data: {  points: {increment: pointsToEarn}, totalSpend: {increment: amount}, totalVisits: {increment: 1}, lastActivityAt: day  }});
    }

    if (cafeLCoRewardId && Math.random() > 0.85) { 
      const user1 = await prisma.user.findUnique({where: {id: demoCustomer1.id}, select: {points: true}});
      const cafeReward = await prisma.reward.findUnique({where: {id: cafeLCoRewardId}, select: {pointsCost: true, name_es: true}}); // Añadir name_es para el log
      if (user1 && cafeReward && user1.points >= cafeReward.pointsCost) {
        const granted = await prisma.grantedReward.create({
            data: { userId: demoCustomer1.id, rewardId: cafeLCoRewardId, businessId: demoBusiness.id, status: 'REDEEMED', assignedAt: day, redeemedAt: day, assignedById: demoAdmin.id }
        });
         await prisma.activityLog.create({ // Log para el canje de regalo
            data: { userId: demoCustomer1.id, businessId: demoBusiness.id, type: ActivityType.GIFT_REDEEMED, pointsChanged: null, description: cafeReward.name_es, createdAt: day, relatedGrantedRewardId: granted.id }
        });
      }
    }
  }
  console.log(`[SEED] Finished generating historical data.`);

  console.log(`[SEED] Seeding finished.`);
}

main()
  .catch(async (e) => {
    console.error("[SEED] Error during seeding:", e);
    await prisma.$disconnect();
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });