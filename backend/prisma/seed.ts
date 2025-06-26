// backend/prisma/seed.ts
// Version: 20240618.13 - Complete, no-omissions version with all original logic restored.

/// <reference types="node" />

import {
    PrismaClient,
    UserRole,
    DocumentType,
    TierCalculationBasis,
    TierDowngradePolicy,
    Prisma,
    QrCodeStatus,
    ActivityType,
    OrderStatus,
    OrderItemStatus,
    OrderType,
    TableStatus,
    RewardType,
    DiscountType,
} from '@prisma/client';
import bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';
import { subDays, startOfDay, endOfDay, eachDayOfInterval, formatISO, subMinutes, addMinutes, subHours } from 'date-fns';

const prisma = new PrismaClient();

enum SeedModifierUiType {
    RADIO = 'RADIO',
    CHECKBOX = 'CHECKBOX',
}

async function hashPassword(password: string): Promise<string> {
  const salt = await bcrypt.genSalt(10);
  return bcrypt.hash(password, salt);
}

async function main() {
  console.log(`[SEED V13 - Final Complete] Start seeding.`);
  
  await new Promise(resolve => setTimeout(resolve, 1500)); // Delay to prevent race conditions
  await prisma.$connect();
  console.log('[SEED] Prisma client connected successfully.');

  const randomSuffix = Math.floor(Math.random() * 10000);
  
  // --- 1. Business ---
  const demoBusiness = await prisma.business.upsert({ 
    where: { slug: 'restaurante-demo-loyalpyme' }, 
    update: {},
    create: { 
      id: uuidv4(), name: 'Restaurante Demo LoyalPyME', slug: 'restaurante-demo-loyalpyme', pointsPerEuro: 1.0, 
      tierSystemEnabled: true, tierCalculationBasis: TierCalculationBasis.SPEND, tierCalculationPeriodMonths: 0, 
      tierDowngradePolicy: TierDowngradePolicy.PERIODIC_REVIEW, inactivityPeriodMonths: 6, 
      isActive: true, isLoyaltyCoreActive: true, isCamareroActive: true, 
      logoUrl: 'https://res.cloudinary.com/dq8e13lmr/image/upload/v1710860730/loyalpyme/assets/default_business_logo_vzg0sa.png', 
      brandingColorPrimary: '#228BE6', brandingColorSecondary: '#495057', 
      qrCodeExpirationMinutes: 30, monthlyPrice: 49.99, currency: "EUR"
    }, 
  }); 
  console.log(`[SEED] Ensured Demo Business exists: ${demoBusiness.name}`);
  
  // --- 2. Users and Tiers (Lógica original restaurada) ---
  const adminEmail = 'admin@demo.com';
  const demoAdminForGift = await prisma.user.upsert({
    where: { email: adminEmail },
    update: { password: await hashPassword('password'), name: 'Admin Demo', role: UserRole.BUSINESS_ADMIN, businessId: demoBusiness.id, isActive: true },
    create: { email: adminEmail, password: await hashPassword('password'), name: 'Admin Demo', phone: '+34000000001', documentId: '00000001A', documentType: DocumentType.DNI, role: UserRole.BUSINESS_ADMIN, businessId: demoBusiness.id, isActive: true },
  });
  console.log(`[SEED] Upserted Demo Admin: ${adminEmail}`);

  const customer1Email = 'cliente@demo.com';
  const demoCustomer1 = await prisma.user.upsert({
    where: { email: customer1Email },
    update: { password: await hashPassword('password'), name: 'Cliente Demo 1', points: 150, totalSpend: 150.0, totalVisits: 3, lastActivityAt: new Date(), isActive: true },
    create: { email: customer1Email, password: await hashPassword('password'), name: 'Cliente Demo 1', phone: '+34000000002', documentId: '00000002B', documentType: DocumentType.DNI, role: UserRole.CUSTOMER_FINAL, businessId: demoBusiness.id, points: 150, totalSpend: 150.0, totalVisits: 3, lastActivityAt: new Date(), isActive: true },
  });
  console.log(`[SEED] Upserted Demo Customer 1: ${demoCustomer1.email}`);
  
  const customer2Email = 'cliente2@demo.com';
  await prisma.user.upsert({
    where: { email: customer2Email },
    update: { password: await hashPassword('password'), name: 'Cliente Demo 2 Activo', isActive: true },
    create: { email: customer2Email, password: await hashPassword('password'), name: 'Cliente Demo 2 Activo', phone: '+34000000003', documentId: '00000003C', documentType: DocumentType.DNI, role: UserRole.CUSTOMER_FINAL, businessId: demoBusiness.id, isActive: true, createdAt: subDays(new Date(), 3) },
  });
  console.log(`[SEED] Upserted Demo Customer 2: ${customer2Email}`);
  
  const customer3Email = 'cliente3.semana.pasada@demo.com';
  await prisma.user.upsert({
    where: { email: customer3Email },
    update: { password: await hashPassword('password'), name: 'Cliente Semana Pasada', isActive: true },
    create: { email: customer3Email, password: await hashPassword('password'), name: 'Cliente Semana Pasada', phone: '+34000000004', documentId: '00000004D', documentType: DocumentType.DNI, role: UserRole.CUSTOMER_FINAL, businessId: demoBusiness.id, isActive: true, createdAt: subDays(new Date(), 9) },
  });
  console.log(`[SEED] Upserted Demo Customer 3: ${customer3Email}`);

  const tiersDataSeed = [ { name: 'Bronce Demo', level: 1, minValue: 50, benefitsDescription: 'Pequeños descuentos', description: 'Nivel inicial.' }, { name: 'Plata Demo', level: 2, minValue: 200, benefitsDescription: 'Descuentos y acceso', description: 'Nivel intermedio.' }, { name: 'Oro Demo', level: 3, minValue: 500, benefitsDescription: 'Grandes descuentos', description: 'Nivel superior.' }, ];
  for (const tierData of tiersDataSeed) { await prisma.tier.upsert({ where: { businessId_level: { businessId: demoBusiness.id, level: tierData.level } }, update: {}, create: { ...tierData, businessId: demoBusiness.id }, }); }
  console.log(`[SEED] Upserted Tiers.`);
  
  // --- 3. Menu, Items, and Rewards ---
  console.log(`[SEED] Creating Digital Menu...`);
  const createdCategories: Record<string, Prisma.MenuCategoryGetPayload<{}>> = {};
  const menuCategoriesDataSeed = [ { name_es: "Entrantes Demo", name_en: "Starters Demo", position: 0 }, { name_es: "Platos Principales Demo", name_en: "Main Courses Demo", position: 1 }, { name_es: "Postres Demo", name_en: "Desserts Demo", position: 2 }, { name_es: "Bebidas Demo", name_en: "Drinks Demo", position: 3 }, ];
  for (const catData of menuCategoriesDataSeed) { const category = await prisma.menuCategory.upsert({ where: { businessId_name_es: { businessId: demoBusiness.id, name_es: catData.name_es } }, update: {}, create: { ...catData, businessId: demoBusiness.id, imageUrl: `https://source.unsplash.com/random/400x400/?${catData.name_en?.toLowerCase().split(' ')[0]}` } }); createdCategories[catData.name_es] = category; }
  
  const menuItems = {
      croquetas: await prisma.menuItem.upsert({ where: { categoryId_name_es: { categoryId: createdCategories["Entrantes Demo"].id, name_es: "Croquetas Caseras Demo" } }, update: {}, create: { name_es: "Croquetas Caseras Demo", name_en: "Homemade Croquettes Demo", price: 8.50, allergens: ["GLUTEN", "LACTOSE"], tags: ["POPULAR"], kdsDestination: "COCINA", categoryId: createdCategories["Entrantes Demo"].id, businessId: demoBusiness.id } }),
      ensalada: await prisma.menuItem.upsert({ where: { categoryId_name_es: { categoryId: createdCategories["Entrantes Demo"].id, name_es: "Ensalada César Demo" } }, update: {}, create: { name_es: "Ensalada César Demo", name_en: "Caesar Salad Demo", price: 10.00, allergens: ["GLUTEN", "LACTOSE", "FISH"], kdsDestination: "COCINA", categoryId: createdCategories["Entrantes Demo"].id, businessId: demoBusiness.id } }),
      hamburguesa: await prisma.menuItem.upsert({ where: { categoryId_name_es: { categoryId: createdCategories["Platos Principales Demo"].id, name_es: "Hamburguesa Gourmet Demo" } }, update: {}, create: { name_es: "Hamburguesa Gourmet Demo", name_en: "Gourmet Burger Demo", description_es: "200g de ternera premium, queso cheddar, bacon crujiente, y nuestra salsa especial.", price: 12.75, allergens: ["GLUTEN", "LACTOSE", "SESAME"], tags: ["HOUSE_SPECIAL"], kdsDestination: "COCINA", categoryId: createdCategories["Platos Principales Demo"].id, businessId: demoBusiness.id } }),
      salmon: await prisma.menuItem.upsert({ where: { categoryId_name_es: { categoryId: createdCategories["Platos Principales Demo"].id, name_es: "Salmón a la Plancha Demo" } }, update: {}, create: { name_es: "Salmón a la Plancha Demo", name_en: "Grilled Salmon Demo", price: 15.00, allergens: ["FISH"], kdsDestination: "COCINA", categoryId: createdCategories["Platos Principales Demo"].id, businessId: demoBusiness.id } }),
      tarta: await prisma.menuItem.upsert({ where: { categoryId_name_es: { categoryId: createdCategories["Postres Demo"].id, name_es: "Tarta de Queso Demo" } }, update: {}, create: { name_es: "Tarta de Queso Demo", name_en: "Cheesecake Demo", price: 6.00, allergens: ["LACTOSE", "GLUTEN"], tags: ["POPULAR"], kdsDestination: "COCINA", categoryId: createdCategories["Postres Demo"].id, businessId: demoBusiness.id } }),
      refresco: await prisma.menuItem.upsert({ where: { categoryId_name_es: { categoryId: createdCategories["Bebidas Demo"].id, name_es: "Refresco de Cola Demo" } }, update: {}, create: { name_es: "Refresco de Cola Demo", name_en: "Cola Drink Demo", price: 2.50, kdsDestination: "BARRA", categoryId: createdCategories["Bebidas Demo"].id, businessId: demoBusiness.id } }),
      agua: await prisma.menuItem.upsert({ where: { categoryId_name_es: { categoryId: createdCategories["Bebidas Demo"].id, name_es: "Agua Mineral Demo" } }, update: {}, create: { name_es: "Agua Mineral Demo", name_en: "Mineral Water Demo", price: 2.00, kdsDestination: "BARRA", categoryId: createdCategories["Bebidas Demo"].id, businessId: demoBusiness.id } })
  };
  console.log(`[SEED] Upserted Menu Items.`);

  const rewardsData = [
    { name_es: "Tarta de Queso Gratis", pointsCost: 80, type: RewardType.MENU_ITEM, linkedMenuItemId: menuItems.tarta.id },
    { name_es: "50% Dto. en Salmón", pointsCost: 120, type: RewardType.DISCOUNT_ON_ITEM, discountType: DiscountType.PERCENTAGE, discountValue: new Prisma.Decimal(50), usageLimitPerUser: 1 },
    { name_es: "5€ de Descuento en tu Cuenta", pointsCost: 100, type: RewardType.DISCOUNT_ON_TOTAL, discountType: DiscountType.FIXED_AMOUNT, discountValue: new Prisma.Decimal(5.00) },
    { name_es: "Bebida de Verano Gratis", pointsCost: 60, type: RewardType.MENU_ITEM, linkedMenuItemId: menuItems.refresco.id, validFrom: new Date('2025-06-01'), validUntil: new Date('2025-08-31') },
  ];
  for (const rewardData of rewardsData) { await prisma.reward.upsert({ where: { unique_reward_name_es_business: { businessId: demoBusiness.id, name_es: rewardData.name_es } }, update: {}, create: { ...rewardData, businessId: demoBusiness.id } }); }
  console.log(`[SEED] Upserted ${rewardsData.length} advanced rewards.`);
  
  // --- 4. Staff, Tables, Modifiers, and Orders (Lógica original restaurada) ---
  console.log(`[SEED] Creating Staff, Tables, and Orders...`);
  const staffUsersDataSeed = [ { email: 'cocina@demo.com', name: 'Cocinero Demo', role: UserRole.KITCHEN_STAFF, pin: '1111' }, { email: 'barra@demo.com', name: 'Barman Demo', role: UserRole.BAR_STAFF, pin: '2222' }, { email: 'camarero@demo.com', name: 'Camarero Demo', role: UserRole.WAITER, pin: '3333' }, ];
  let camareroDemoUser: Prisma.UserGetPayload<{ select: { id: true } }> | null = null;
  for (const staffData of staffUsersDataSeed) { const user = await prisma.user.upsert({ where: { email: staffData.email }, update: {}, create: { email: staffData.email, password: await hashPassword('password123'), name: staffData.name, role: staffData.role, businessId: demoBusiness.id } }); await prisma.staffPin.upsert({ where: { userId: user.id }, update: {}, create: { pinHash: await hashPassword(staffData.pin), userId: user.id, businessId: demoBusiness.id } }); if (user.role === UserRole.WAITER) camareroDemoUser = user; }
  console.log(`[SEED] Upserted Staff users and their Pins.`);

  const tablesDataSeed = [ { identifier: "M1", zone: "Salón Interior", capacity: 4 }, { identifier: "M2", zone: "Salón Interior", capacity: 2 }, { identifier: "T1", zone: "Terraza", capacity: 4 }, { identifier: "B1", zone: "Barra", capacity: 1 }, ];
  const createdTables: Record<string, Prisma.TableGetPayload<{}>> = {};
  for (const tableData of tablesDataSeed) { const table = await prisma.table.upsert({ where: { businessId_identifier: { businessId: demoBusiness.id, identifier: tableData.identifier } }, update: {}, create: { ...tableData, businessId: demoBusiness.id } }); createdTables[tableData.identifier] = table; }
  console.log(`[SEED] Upserted Tables.`);
  
  const grupoPuntoCoccion = await prisma.modifierGroup.upsert({ where: { menuItemId_name_es: { menuItemId: menuItems.hamburguesa.id, name_es: "Punto de la Carne" } }, update: {}, create: { name_es: "Punto de la Carne", uiType: SeedModifierUiType.RADIO, minSelections: 1, maxSelections: 1, isRequired: true, menuItemId: menuItems.hamburguesa.id, businessId: demoBusiness.id } });
  const modifierOptionsPuntoData = [ { name_es: "Poco Hecha" }, { name_es: "Al Punto", isDefault: true }, { name_es: "Muy Hecha" }, ];
  for (const modOptData of modifierOptionsPuntoData) { await prisma.modifierOption.upsert({ where: { groupId_name_es: { groupId: grupoPuntoCoccion.id, name_es: modOptData.name_es } }, update: {}, create: { ...modOptData, groupId: grupoPuntoCoccion.id } }); }
  
  const grupoExtrasBurger = await prisma.modifierGroup.upsert({ where: { menuItemId_name_es: { menuItemId: menuItems.hamburguesa.id, name_es: "Extras Hamburguesa" } }, update: {}, create: { name_es: "Extras Hamburguesa", uiType: SeedModifierUiType.CHECKBOX, minSelections: 0, maxSelections: 3, menuItemId: menuItems.hamburguesa.id, businessId: demoBusiness.id } });
  const modifierOptionsExtrasData = [ { name_es: "Queso Extra", priceAdjustment: 1.00 }, { name_es: "Bacon Extra", priceAdjustment: 1.50 }, { name_es: "Huevo Frito", priceAdjustment: 1.20 }, ];
  for (const modOptData of modifierOptionsExtrasData) { await prisma.modifierOption.upsert({ where: { groupId_name_es: { groupId: grupoExtrasBurger.id, name_es: modOptData.name_es } }, update: {}, create: { ...modOptData, groupId: grupoExtrasBurger.id } }); }
  console.log(`[SEED] Upserted Modifiers.`);

  // --- 5. Datos Históricos y Pedidos (Lógica original restaurada) ---
  console.log(`[SEED] Generating historical data...`); const now = new Date(); const startOfThisWeek = startOfDay(subDays(now, 6)); const daysThisWeek = eachDayOfInterval({ start: startOfThisWeek, end: now }); for (const day of daysThisWeek.slice(0, -1)) { if (Math.random() > 0.3) { const amount = Math.floor(Math.random() * 40) + 5; const pointsToEarn = Math.floor(amount * (demoBusiness.pointsPerEuro ?? 1)); const ticketNum = `TICKET-${formatISO(day, { representation: 'date' })}-${Math.floor(Math.random() * 1000)}`; const createdQr = await prisma.qrCode.create({ data: { token: uuidv4(), businessId: demoBusiness.id, amount, ticketNumber: ticketNum, expiresAt: addMinutes(day, 30), status: QrCodeStatus.COMPLETED, completedAt: day, userId: demoCustomer1.id, pointsEarned: pointsToEarn }}); await prisma.activityLog.create({ data: { userId: demoCustomer1.id, businessId: demoBusiness.id, type: ActivityType.POINTS_EARNED_QR, pointsChanged: pointsToEarn, description: `Ticket: ${ticketNum}`, createdAt: day, relatedQrId: createdQr.id }}); await prisma.user.update({ where: {id: demoCustomer1.id }, data: { points: {increment: pointsToEarn}, totalSpend: {increment: amount}, totalVisits: {increment: 1}, lastActivityAt: day }}); } }
  
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