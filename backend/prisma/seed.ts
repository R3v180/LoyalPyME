// backend/prisma/seed.ts
// Version: 20240630.2 - Added positions to categories and KDS destination to generic rewards.

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
import { subDays, startOfDay, eachDayOfInterval, formatISO, addMinutes, subHours, subMonths, addDays } from 'date-fns';

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
  console.log(`[SEED V16 - Final Polish] Start seeding.`);
  
  await new Promise(resolve => setTimeout(resolve, 1500));
  await prisma.$connect();
  console.log('[SEED] Prisma client connected successfully.');

  // --- 1. Business ---
  const demoBusiness = await prisma.business.upsert({ 
    where: { slug: 'restaurante-demo-loyalpyme' }, 
    update: {
        isLoyaltyCoreActive: true,
        isCamareroActive: true,
    },
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
  
  // --- 2. Users & Tiers ---
  console.log('[SEED] Creating Users & Tiers...');
  const adminEmail = 'admin@demo.com';
  const demoAdmin = await prisma.user.upsert({
    where: { email: adminEmail },
    update: { password: await hashPassword('password'), name: 'Admin Demo', role: UserRole.BUSINESS_ADMIN, businessId: demoBusiness.id, isActive: true },
    create: { email: adminEmail, password: await hashPassword('password'), name: 'Admin Demo', phone: '+34000000001', documentId: '00000001A', documentType: DocumentType.DNI, role: UserRole.BUSINESS_ADMIN, businessId: demoBusiness.id, isActive: true },
  });
  console.log(`[SEED] Upserted Demo Admin: ${adminEmail}`);

  const powerUserEmail = 'poweruser@demo.com';
  const powerUser = await prisma.user.upsert({
    where: { email: powerUserEmail },
    update: { name: 'Power User Activo', points: 2000, totalSpend: 2000.0, totalVisits: 25, lastActivityAt: new Date(), isActive: true },
    create: { email: powerUserEmail, password: await hashPassword('password'), name: 'Power User Activo', phone: '+34000000002', documentId: '00000002B', documentType: DocumentType.DNI, role: UserRole.CUSTOMER_FINAL, businessId: demoBusiness.id, points: 2000, totalSpend: 2000.0, totalVisits: 25, lastActivityAt: new Date(), isActive: true },
  });

  const newUserEmail = 'newuser@demo.com';
  await prisma.user.upsert({
    where: { email: newUserEmail },
    update: { name: 'Nuevo Usuario', points: 25, totalSpend: 25, totalVisits: 1, isActive: true },
    create: { email: newUserEmail, password: await hashPassword('password'), name: 'Nuevo Usuario', phone: '+34000000003', documentId: '00000003C', documentType: DocumentType.DNI, role: UserRole.CUSTOMER_FINAL, businessId: demoBusiness.id, points: 25, totalSpend: 25, totalVisits: 1, createdAt: subDays(new Date(), 2) },
  });

  const inactiveUserEmail = 'inactive@demo.com';
  await prisma.user.upsert({
    where: { email: inactiveUserEmail },
    update: { name: 'Usuario Inactivo', isActive: false },
    create: { email: inactiveUserEmail, password: await hashPassword('password'), name: 'Usuario Inactivo', phone: '+34000000004', documentId: '00000004D', documentType: DocumentType.DNI, role: UserRole.CUSTOMER_FINAL, businessId: demoBusiness.id, isActive: false },
  });

  const oldUserEmail = 'olduser@demo.com';
  await prisma.user.upsert({
    where: { email: oldUserEmail },
    update: { name: 'Usuario Antiguo', lastActivityAt: subMonths(new Date(), 7) },
    create: { email: oldUserEmail, password: await hashPassword('password'), name: 'Usuario Antiguo', phone: '+34000000005', documentId: '00000005E', documentType: DocumentType.DNI, role: UserRole.CUSTOMER_FINAL, businessId: demoBusiness.id, points: 800, totalSpend: 800, totalVisits: 15, lastActivityAt: subMonths(new Date(), 7) },
  });
  console.log(`[SEED] Upserted various types of customers.`);

  const tiersData = [ { name: 'Bronce', level: 1, minValue: 50 }, { name: 'Plata', level: 2, minValue: 200 }, { name: 'Oro', level: 3, minValue: 500 }, { name: 'Platino', level: 4, minValue: 1500 } ];
  for (const tierData of tiersData) { await prisma.tier.upsert({ where: { businessId_level: { businessId: demoBusiness.id, level: tierData.level } }, update: {name: tierData.name}, create: { ...tierData, businessId: demoBusiness.id }, }); }
  console.log(`[SEED] Upserted Tiers.`);
  
  // --- 3. Menu, Items, and Rewards ---
  console.log(`[SEED] Creating Digital Menu and Comprehensive Rewards...`);
  
  // --- CORRECCIÓN: Añadida 'position' a las categorías ---
  const categories = {
      entrantes: await prisma.menuCategory.upsert({ where: { businessId_name_es: { businessId: demoBusiness.id, name_es: 'Entrantes para Compartir' } }, update: {}, create: { name_es: 'Entrantes para Compartir', name_en: 'Starters to Share', businessId: demoBusiness.id, position: 1, imageUrl: 'https://images.unsplash.com/photo-1572441713135-c70a27b8a53c?q=80&w=800' } }),
      principales: await prisma.menuCategory.upsert({ where: { businessId_name_es: { businessId: demoBusiness.id, name_es: 'Platos Principales' } }, update: {}, create: { name_es: 'Platos Principales', name_en: 'Main Courses', businessId: demoBusiness.id, position: 2, imageUrl: 'https://images.unsplash.com/photo-1559847844-5315695d9e16?q=80&w=800' } }),
      postres: await prisma.menuCategory.upsert({ where: { businessId_name_es: { businessId: demoBusiness.id, name_es: 'Postres Caseros' } }, update: {}, create: { name_es: 'Postres Caseros', name_en: 'Homemade Desserts', businessId: demoBusiness.id, position: 3, imageUrl: 'https://images.unsplash.com/photo-1551024601-bec78aea704b?q=80&w=800' } }),
      bebidas: await prisma.menuCategory.upsert({ where: { businessId_name_es: { businessId: demoBusiness.id, name_es: 'Bebidas y Refrescos' } }, update: {}, create: { name_es: 'Bebidas y Refrescos', name_en: 'Drinks & Beverages', businessId: demoBusiness.id, position: 4, imageUrl: 'https://images.unsplash.com/photo-1573245929259-693680407254?q=80&w=800' } }),
  };
  
  const menuItems = {
      croquetas: await prisma.menuItem.upsert({ where: { categoryId_name_es: { categoryId: categories.entrantes.id, name_es: "Croquetas de Jamón Ibérico" } }, update: {}, create: { name_es: "Croquetas de Jamón Ibérico", name_en: "Iberian Ham Croquettes", price: 8.50, kdsDestination: "COCINA", categoryId: categories.entrantes.id, businessId: demoBusiness.id } }),
      ensalada: await prisma.menuItem.upsert({ where: { categoryId_name_es: { categoryId: categories.entrantes.id, name_es: "Ensalada de Queso de Cabra" } }, update: {}, create: { name_es: "Ensalada de Queso de Cabra", name_en: "Goat Cheese Salad", price: 10.00, kdsDestination: "COCINA", categoryId: categories.entrantes.id, businessId: demoBusiness.id } }),
      hamburguesa: await prisma.menuItem.upsert({ where: { categoryId_name_es: { categoryId: categories.principales.id, name_es: "Hamburguesa 'La Jefa'" } }, update: {}, create: { name_es: "Hamburguesa 'La Jefa'", name_en: "'The Boss' Burger", price: 13.50, kdsDestination: "COCINA", categoryId: categories.principales.id, businessId: demoBusiness.id, imageUrl: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?q=80&w=800' } }),
      salmon: await prisma.menuItem.upsert({ where: { categoryId_name_es: { categoryId: categories.principales.id, name_es: "Salmón Noruego con Verduras" } }, update: {}, create: { name_es: "Salmón Noruego con Verduras", name_en: "Norwegian Salmon with Vegetables", price: 16.00, kdsDestination: "COCINA", categoryId: categories.principales.id, businessId: demoBusiness.id } }),
      tarta: await prisma.menuItem.upsert({ where: { categoryId_name_es: { categoryId: categories.postres.id, name_es: "Tarta de Queso Cremosa" } }, update: {}, create: { name_es: "Tarta de Queso Cremosa", name_en: "Creamy Cheesecake", price: 6.50, kdsDestination: "COCINA", categoryId: categories.postres.id, businessId: demoBusiness.id, imageUrl: 'https://images.unsplash.com/photo-1587314168485-3236d6710814?q=80&w=800' } }),
      refresco: await prisma.menuItem.upsert({ where: { categoryId_name_es: { categoryId: categories.bebidas.id, name_es: "Refresco de Cola" } }, update: {}, create: { name_es: "Refresco de Cola", name_en: "Cola Drink", price: 2.50, kdsDestination: "BARRA", categoryId: categories.bebidas.id, businessId: demoBusiness.id } }),
      agua: await prisma.menuItem.upsert({ where: { categoryId_name_es: { categoryId: categories.bebidas.id, name_es: "Agua Mineral sin Gas" } }, update: {}, create: { name_es: "Agua Mineral sin Gas", name_en: "Still Mineral Water", price: 2.00, kdsDestination: "BARRA", categoryId: categories.bebidas.id, businessId: demoBusiness.id } })
  };
  console.log(`[SEED] Upserted Menu Categories and Items.`);

  // --- CORRECCIÓN: Añadido 'kdsDestination' a recompensa genérica ---
  const rewardsData = [
    { name_es: "Tarta de Queso Gratis (de la Carta)", name_en: "Free Cheesecake (from Menu)", pointsCost: 80, type: RewardType.MENU_ITEM, linkedMenuItemId: menuItems.tarta.id, imageUrl: 'https://images.unsplash.com/photo-1543599723-8eac12520374?q=80&w=800' },
    { name_es: "Gorra Exclusiva LoyalPyME", name_en: "Exclusive LoyalPyME Cap", description_es: "Canjea tus puntos por esta gorra de edición limitada.", pointsCost: 250, type: RewardType.GENERIC_FREE_PRODUCT, kdsDestination: "BARRA", imageUrl: 'https://images.unsplash.com/photo-1588850561407-ed278381675b?q=80&w=800' },
    { name_es: "5€ de Descuento en tu Cuenta", name_en: "5€ Off Your Bill", pointsCost: 100, type: RewardType.DISCOUNT_ON_TOTAL, discountType: DiscountType.FIXED_AMOUNT, discountValue: new Prisma.Decimal(5.00) },
    { name_es: "50% Dto. en Hamburguesa 'La Jefa'", name_en: "50% Off 'The Boss' Burger", pointsCost: 120, type: RewardType.DISCOUNT_ON_ITEM, discountType: DiscountType.PERCENTAGE, discountValue: new Prisma.Decimal(50), linkedMenuItemId: menuItems.hamburguesa.id },
    { name_es: "Cualquier Refresco Gratis", name_en: "Any Soft Drink for Free", pointsCost: 40, type: RewardType.DISCOUNT_ON_ITEM, discountType: DiscountType.PERCENTAGE, discountValue: new Prisma.Decimal(100) },
    { name_es: "Bebida de Verano Gratis", name_en: "Free Summer Drink", pointsCost: 60, type: RewardType.MENU_ITEM, linkedMenuItemId: menuItems.refresco.id, validFrom: new Date('2025-06-01'), validUntil: new Date('2025-08-31') },
    { name_es: "Descuento VIP 15%", name_en: "VIP Discount 15%", pointsCost: 500, type: RewardType.DISCOUNT_ON_TOTAL, discountType: DiscountType.PERCENTAGE, discountValue: new Prisma.Decimal(15)},
  ];
  for (const rewardData of rewardsData) { await prisma.reward.upsert({ where: { unique_reward_name_es_business: { businessId: demoBusiness.id, name_es: rewardData.name_es } }, update: {}, create: { ...rewardData, businessId: demoBusiness.id } }); }
  console.log(`[SEED] Upserted ${rewardsData.length} comprehensive rewards.`);
  
  // --- 4. Staff, Tables, Modifiers, and Orders ---
  console.log(`[SEED] Creating Staff, Tables, and Orders...`);
  const staffUsersData = [ { email: 'cocina@demo.com', name: 'Cocinero Chef', role: UserRole.KITCHEN_STAFF, pin: '1111' }, { email: 'barra@demo.com', name: 'Barman Pro', role: UserRole.BAR_STAFF, pin: '2222' }, { email: 'camarero@demo.com', name: 'Camarero Senior', role: UserRole.WAITER, pin: '3333' }, ];
  for (const staffData of staffUsersData) { const user = await prisma.user.upsert({ where: { email: staffData.email }, update: {}, create: { email: staffData.email, password: await hashPassword('password123'), name: staffData.name, role: staffData.role, businessId: demoBusiness.id } }); await prisma.staffPin.upsert({ where: { userId: user.id }, update: {}, create: { pinHash: await hashPassword(staffData.pin), userId: user.id, businessId: demoBusiness.id } }); }
  console.log(`[SEED] Upserted Staff users and their Pins.`);

  const tablesData = [ { identifier: "M1", zone: "Salón Interior", capacity: 4 }, { identifier: "M2", zone: "Salón Interior", capacity: 2 }, { identifier: "T1", zone: "Terraza", capacity: 4 }, { identifier: "B1", zone: "Barra", capacity: 1 }, ];
  for (const tableData of tablesData) { await prisma.table.upsert({ where: { businessId_identifier: { businessId: demoBusiness.id, identifier: tableData.identifier } }, update: {}, create: { ...tableData, businessId: demoBusiness.id } }); }
  console.log(`[SEED] Upserted Tables.`);
  
  const puntoCoccionGroup = await prisma.modifierGroup.upsert({ where: { menuItemId_name_es: { menuItemId: menuItems.hamburguesa.id, name_es: "Punto de la Carne" } }, update: {}, create: { name_es: "Punto de la Carne", uiType: SeedModifierUiType.RADIO, isRequired: true, menuItemId: menuItems.hamburguesa.id, businessId: demoBusiness.id } });
  const puntoOptions = [ { name_es: "Poco Hecha" }, { name_es: "Al Punto", isDefault: true }, { name_es: "Muy Hecha" } ];
  for (const opt of puntoOptions) { await prisma.modifierOption.upsert({ where: { groupId_name_es: { groupId: puntoCoccionGroup.id, name_es: opt.name_es } }, update: {}, create: { ...opt, groupId: puntoCoccionGroup.id } }); }
  
  const extrasGroup = await prisma.modifierGroup.upsert({ where: { menuItemId_name_es: { menuItemId: menuItems.hamburguesa.id, name_es: "Extras Hamburguesa" } }, update: {}, create: { name_es: "Extras Hamburguesa", uiType: SeedModifierUiType.CHECKBOX, minSelections: 0, maxSelections: 3, menuItemId: menuItems.hamburguesa.id, businessId: demoBusiness.id } });
  const extrasOptions = [ { name_es: "Queso Extra", priceAdjustment: 1.00 }, { name_es: "Bacon Extra", priceAdjustment: 1.50 }, { name_es: "Huevo Frito", priceAdjustment: 1.20 } ];
  for (const opt of extrasOptions) { await prisma.modifierOption.upsert({ where: { groupId_name_es: { groupId: extrasGroup.id, name_es: opt.name_es } }, update: {}, create: { ...opt, groupId: extrasGroup.id } }); }
  console.log(`[SEED] Upserted Modifiers.`);

  // --- 5. Datos Históricos, Regalos y Pedidos ---
  console.log(`[SEED] Generating historical data, gifts, and past orders...`);
  const tartaReward = await prisma.reward.findFirst({ where: { name_es: "Tarta de Queso Gratis (de la Carta)" } });
  if (tartaReward) {
      await prisma.grantedReward.upsert({
          where: { userId_rewardId: { userId: powerUser.id, rewardId: tartaReward.id } },
          update: {},
          create: {
              userId: powerUser.id,
              rewardId: tartaReward.id,
              businessId: demoBusiness.id,
              assignedById: demoAdmin.id,
              status: "PENDING",
              expiresAt: addDays(new Date(), 30)
          }
      });
      console.log(`[SEED] Granted a welcome gift to the Power User.`);
  }

  const daysInPast = eachDayOfInterval({ start: subMonths(new Date(), 2), end: subDays(new Date(), 1) });
  for (const day of daysInPast) {
      if (Math.random() > 0.7) {
          const amount = Math.floor(Math.random() * 50) + 10;
          const pointsToEarn = Math.floor(amount * (demoBusiness.pointsPerEuro ?? 1));
          const ticketNum = `TICKET-HIST-${formatISO(day, { representation: 'date' })}-${Math.floor(Math.random() * 1000)}`;
          const createdQr = await prisma.qrCode.create({ data: { token: uuidv4(), businessId: demoBusiness.id, amount, ticketNumber: ticketNum, expiresAt: addMinutes(day, 30), status: QrCodeStatus.COMPLETED, completedAt: day, userId: powerUser.id, pointsEarned: pointsToEarn }});
          await prisma.activityLog.create({ data: { userId: powerUser.id, businessId: demoBusiness.id, type: ActivityType.POINTS_EARNED_QR, pointsChanged: pointsToEarn, description: `Ticket: ${ticketNum}`, createdAt: day, relatedQrId: createdQr.id }});
      }
  }
  console.log(`[SEED] Generated historical QR activity.`);

  const yesterday = subDays(new Date(), 1);
  const orderDate = subHours(yesterday, 3);
  await prisma.order.create({
      data: {
          orderNumber: `DEMO-${formatISO(orderDate, { representation: 'date' })}-01`,
          status: OrderStatus.PAID,
          totalAmount: 26.00,
          finalAmount: 26.00,
          businessId: demoBusiness.id,
          customerLCoId: powerUser.id,
          createdAt: orderDate,
          paidAt: addMinutes(orderDate, 45),
          items: {
              create: [
                  { menuItemId: menuItems.hamburguesa.id, quantity: 1, priceAtPurchase: 13.50, totalItemPrice: 13.50, status: OrderItemStatus.SERVED, itemNameSnapshot: menuItems.hamburguesa.name_es },
                  { menuItemId: menuItems.ensalada.id, quantity: 1, priceAtPurchase: 10.00, totalItemPrice: 10.00, status: OrderItemStatus.SERVED, itemNameSnapshot: menuItems.ensalada.name_es },
                  { menuItemId: menuItems.agua.id, quantity: 1, priceAtPurchase: 2.50, totalItemPrice: 2.50, status: OrderItemStatus.SERVED, itemNameSnapshot: menuItems.agua.name_es }
              ]
          }
      }
  });
  console.log(`[SEED] Created a past paid order for a customer.`);

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