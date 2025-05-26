// backend/prisma/seed.ts
// Versión: 20250526_CORRECCION_FINAL_V7_OMIT_TOTALITEMPRICE_FOR_ORDERITEM
/// <reference types="node" />

import {
    PrismaClient, UserRole, DocumentType, TierCalculationBasis, TierDowngradePolicy,
    Prisma, QrCodeStatus, ActivityType, OrderStatus, OrderItemStatus, OrderType,
} from '@prisma/client';
import bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';
import { subDays, startOfDay, endOfDay, eachDayOfInterval, formatISO, subMinutes, addMinutes } from 'date-fns';

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
  console.log(`[SEED V7] Start seeding. OrderItem.totalItemPrice will NOT be set by seed.`);

  const createdCategories: Record<string, Prisma.MenuCategoryGetPayload<{}>> = {};
  const createdMenuItems: Record<string, Prisma.MenuItemGetPayload<{ include: { category: true } }>> = {};
  const createdTables: Record<string, Prisma.TableGetPayload<{}>> = {};
  const createdModOptionsPunto: Record<string, Prisma.ModifierOptionGetPayload<{}>> = {};
  const createdModOptionsExtras: Record<string, Prisma.ModifierOptionGetPayload<{}>> = {};

  // --- Creación de Business, Admin, Customers, Tiers, Rewards LCo, MenuCategories, MenuItems, Tables, Staff ---
  // (Esta parte es idéntica, la mantendré colapsada)
  const demoBusinessName = 'Restaurante Demo LoyalPyME'; const demoBusinessSlug = 'restaurante-demo-loyalpyme'; const demoBusiness = await prisma.business.upsert({ where: { slug: demoBusinessSlug }, update: { name: demoBusinessName, pointsPerEuro: 1.0, tierSystemEnabled: true, tierCalculationBasis: TierCalculationBasis.SPEND, tierCalculationPeriodMonths: 0, tierDowngradePolicy: TierDowngradePolicy.PERIODIC_REVIEW, inactivityPeriodMonths: 6, isActive: true, isLoyaltyCoreActive: true, isCamareroActive: true, logoUrl: 'https://res.cloudinary.com/dq8e13lmr/image/upload/v1710860730/loyalpyme/assets/default_business_logo_vzg0sa.png', brandingColorPrimary: '#228BE6', brandingColorSecondary: '#495057', qrCodeExpirationMinutes: 30, }, create: { id: uuidv4(), name: demoBusinessName, slug: demoBusinessSlug, pointsPerEuro: 1.0, tierSystemEnabled: true, tierCalculationBasis: TierCalculationBasis.SPEND, tierCalculationPeriodMonths: 0, tierDowngradePolicy: TierDowngradePolicy.PERIODIC_REVIEW, inactivityPeriodMonths: 6, isActive: true, isLoyaltyCoreActive: true, isCamareroActive: true, logoUrl: 'https://res.cloudinary.com/dq8e13lmr/image/upload/v1710860730/loyalpyme/assets/default_business_logo_vzg0sa.png', brandingColorPrimary: '#228BE6', brandingColorSecondary: '#495057', qrCodeExpirationMinutes: 30, }, }); console.log(`[SEED] Upserted Demo Business: ${demoBusiness.name} (ID: ${demoBusiness.id})`);
  const adminEmail = 'admin@demo.com'; const hashedAdminPassword = await hashPassword('password'); const demoAdminForGift = await prisma.user.upsert({ where: { email: adminEmail }, update: { password: hashedAdminPassword, name: 'Admin Demo', role: UserRole.BUSINESS_ADMIN, businessId: demoBusiness.id, isActive: true, }, create: { email: adminEmail, password: hashedAdminPassword, name: 'Admin Demo', phone: '+34000000001', documentId: '00000001A', documentType: DocumentType.DNI, role: UserRole.BUSINESS_ADMIN, businessId: demoBusiness.id, isActive: true, }, }); console.log(`[SEED] Upserted Demo Admin: ${adminEmail}`);
  const customer1Email = 'cliente@demo.com'; const hashedCustomer1Password = await hashPassword('password'); const demoCustomer1 = await prisma.user.upsert({ where: { email: customer1Email }, update: { password: hashedCustomer1Password, name: 'Cliente Demo 1', points: 150, totalSpend: 150.0, totalVisits: 3, lastActivityAt: new Date(), isActive: true, }, create: { email: customer1Email, password: hashedCustomer1Password, name: 'Cliente Demo 1', phone: '+34000000002', documentId: '00000002B', documentType: DocumentType.DNI, role: UserRole.CUSTOMER_FINAL, businessId: demoBusiness.id, points: 150, totalSpend: 150.0, totalVisits: 3, lastActivityAt: new Date(), isActive: true, }, }); console.log(`[SEED] Upserted Demo Customer 1: ${demoCustomer1.email}`);
  const customer2Email = 'cliente2@demo.com'; const customer3Email = 'cliente3.semana.pasada@demo.com'; const hashedCustomer2Password = await hashPassword('password'); await prisma.user.upsert({ where: { email: customer2Email }, update: { password: hashedCustomer2Password, name: 'Cliente Demo 2 Activo', isActive: true, }, create: { email: customer2Email, password: hashedCustomer2Password, name: 'Cliente Demo 2 Activo', phone: '+34000000003', documentId: '00000003C', documentType: DocumentType.DNI, role: UserRole.CUSTOMER_FINAL, businessId: demoBusiness.id, isActive: true, createdAt: subDays(new Date(), 3) }, }); console.log(`[SEED] Upserted Demo Customer 2: ${customer2Email}`); const hashedCustomer3Password = await hashPassword('password'); const demoCustomer3 = await prisma.user.upsert({ where: { email: customer3Email }, update: { password: hashedCustomer3Password, name: 'Cliente Semana Pasada', isActive: true, }, create: { email: customer3Email, password: hashedCustomer3Password, name: 'Cliente Semana Pasada', phone: '+34000000004', documentId: '00000004D', documentType: DocumentType.DNI, role: UserRole.CUSTOMER_FINAL, businessId: demoBusiness.id, isActive: true, createdAt: subDays(new Date(), 9) }, }); console.log(`[SEED] Upserted Demo Customer 3: ${demoCustomer3.email}`);
  const tiersDataSeed = [ { name: 'Bronce Demo', level: 1, minValue: 50, benefitsDescription: 'Pequeños descuentos', description: 'Nivel inicial.' }, { name: 'Plata Demo', level: 2, minValue: 200, benefitsDescription: 'Descuentos y acceso', description: 'Nivel intermedio.' }, { name: 'Oro Demo', level: 3, minValue: 500, benefitsDescription: 'Grandes descuentos', description: 'Nivel superior.' }, ]; for (const tierData of tiersDataSeed) { await prisma.tier.upsert({ where: { businessId_level: { businessId: demoBusiness.id, level: tierData.level } }, update: { name: tierData.name, minValue: tierData.minValue, description: tierData.description, benefitsDescription: tierData.benefitsDescription, isActive: true }, create: { ...tierData, businessId: demoBusiness.id, isActive: true }, }); } console.log(`[SEED] Upserted Tiers for business ${demoBusiness.id}`);
  const rewardsLCoDataSeed = [ { name_es: 'Café Gratis Demo LCo', name_en: 'Free Coffee Demo LCo', pointsCost: 50, imageUrl: 'https://source.unsplash.com/random/300x300/?coffee', description_es: 'Un delicioso café por tus puntos.', description_en: 'A delicious coffee for your points.', isActive: true }, { name_es: 'Descuento 10% LCo', name_en: '10% Discount LCo', pointsCost: 100, isActive: true, description_es: 'Obtén un 10% de descuento en tu próxima compra.', description_en: 'Get a 10% discount on your next purchase.' }, ]; let cafeLCoRewardIdSeed: string | undefined; for (const rewardData of rewardsLCoDataSeed) { const existingReward = await prisma.reward.findFirst({ where: { businessId: demoBusiness.id, name_es: rewardData.name_es, } }); let r: Prisma.RewardGetPayload<{}>; if (existingReward) { r = await prisma.reward.update({ where: { id: existingReward.id }, data: { name_en: rewardData.name_en, pointsCost: rewardData.pointsCost, imageUrl: rewardData.imageUrl, isActive: rewardData.isActive !== undefined ? rewardData.isActive : true, description_es: rewardData.description_es, description_en: rewardData.description_en, }, }); } else { r = await prisma.reward.create({ data: { ...rewardData, businessId: demoBusiness.id, }, }); } if (rewardData.name_es?.includes('Café')) cafeLCoRewardIdSeed = r.id; } console.log(`[SEED] Processed LCo Rewards for business ${demoBusiness.id}`);
  console.log(`[SEED] Creating Digital Menu for business ${demoBusiness.id}...`); const menuCategoriesDataSeed = [ { name_es: "Entrantes Demo", name_en: "Starters Demo", description_es: "Deliciosas opciones para comenzar", description_en: "Delicious options to start", imageUrl: "https://source.unsplash.com/random/400x400/?appetizer", position: 0, isActive: true }, { name_es: "Platos Principales Demo", name_en: "Main Courses Demo", description_es: "Nuestra selección de platos fuertes", description_en: "Our selection of main dishes", imageUrl: "https://source.unsplash.com/random/400x400/?main,course", position: 1, isActive: true }, { name_es: "Postres Demo", name_en: "Desserts Demo", description_es: "Dulces tentaciones para finalizar", description_en: "Sweet temptations to finish", imageUrl: "https://source.unsplash.com/random/400x400/?dessert", position: 2, isActive: true }, { name_es: "Bebidas Demo", name_en: "Drinks Demo", description_es: "Refrescantes opciones para acompañar", description_en: "Refreshing options to accompany", imageUrl: "https://source.unsplash.com/random/400x400/?drinks", position: 3, isActive: true }, ]; for (const catData of menuCategoriesDataSeed) { const category = await prisma.menuCategory.upsert({ where: { businessId_name_es: { businessId: demoBusiness.id, name_es: catData.name_es } }, update: { description_es:catData.description_es, description_en:catData.description_en, imageUrl:catData.imageUrl, position:catData.position, isActive: catData.isActive, name_en: catData.name_en }, create: { ...catData, businessId: demoBusiness.id } }); createdCategories[catData.name_es] = category; } console.log(`[SEED] Upserted Menu Categories: ${Object.values(createdCategories).map(c => c.name_es).join(', ')}`);
  const menuItemsDataSeed = [ { categoryName: "Entrantes Demo", name_es: "Croquetas Caseras Demo", name_en: "Homemade Croquettes Demo", price: new Prisma.Decimal(8.50), imageUrl: "https://source.unsplash.com/random/300x300/?croquettes", allergens: ["GLUTEN", "LACTOSE"], tags: ["POPULAR"], position: 0, isAvailable: true, kdsDestination: "COCINA", preparationTime: 10, description_es: "Croquetas cremosas de jamón ibérico.", description_en:"Creamy Iberian ham croquettes." }, { categoryName: "Entrantes Demo", name_es: "Ensalada César Demo", name_en: "Caesar Salad Demo", description_es: "Pollo, lechuga, croutons, parmesano y nuestra salsa césar especial.", description_en: "Chicken, lettuce, croutons, parmesan, and our special caesar dressing.", price: new Prisma.Decimal(10.00), imageUrl: "https://source.unsplash.com/random/300x300/?caesar,salad", allergens: ["GLUTEN", "LACTOSE", "FISH"], tags: [], position: 1, isAvailable: true, kdsDestination: "COCINA", preparationTime: 7 }, { categoryName: "Platos Principales Demo", idForModifiers: "itemHamburguesa", name_es: "Hamburguesa Gourmet Demo", name_en: "Gourmet Burger Demo", price: new Prisma.Decimal(12.75), imageUrl: "https://source.unsplash.com/random/300x300/?burger", description_es: "200g de ternera premium, queso cheddar, bacon crujiente, lechuga, tomate y salsa especial. Acompañada de patatas fritas.", description_en: "200g premium beef, cheddar cheese, crispy bacon, lettuce, tomato, and special sauce. Served with french fries.", allergens: ["GLUTEN", "LACTOSE", "SESAME"], tags: ["HOUSE_SPECIAL"], position: 0, isAvailable: true, preparationTime: 15, calories: 850, sku: "BURG-GOURMET-001", kdsDestination: "COCINA" }, { categoryName: "Platos Principales Demo", name_es: "Salmón a la Plancha Demo", name_en: "Grilled Salmon Demo", description_es: "Lomo de salmón fresco a la plancha con guarnición de verduras de temporada.", description_en: "Grilled fresh salmon loin with a side of seasonal vegetables.", price: new Prisma.Decimal(15.00), imageUrl: "https://source.unsplash.com/random/300x300/?salmon,dish", allergens: ["FISH"], tags: [], position: 1, isAvailable: true, kdsDestination: "COCINA", preparationTime: 12 }, { categoryName: "Postres Demo", name_es: "Tarta de Queso Demo", name_en: "Cheesecake Demo", description_es: "Nuestra famosa tarta de queso casera con coulis de frutos rojos.", description_en: "Our famous homemade cheesecake with red berry coulis.", price: new Prisma.Decimal(6.00), imageUrl: "https://source.unsplash.com/random/300x300/?cheesecake", allergens: ["LACTOSE", "GLUTEN"], tags: ["POPULAR"], position: 0, isAvailable: true, kdsDestination: "COCINA", preparationTime: 5 }, { categoryName: "Bebidas Demo", name_es: "Refresco de Cola Demo", name_en: "Cola Drink Demo", description_es: "Lata de 33cl.", description_en: "33cl can.", price: new Prisma.Decimal(2.50), imageUrl: "https://source.unsplash.com/random/300x300/?soda,can", tags: [], position: 0, isAvailable: true, kdsDestination: "BARRA", preparationTime: 1 }, { categoryName: "Bebidas Demo", name_es: "Agua Mineral Demo", name_en: "Mineral Water Demo", description_es: "Botella de 50cl.", description_en: "50cl bottle.", price: new Prisma.Decimal(2.00), imageUrl: "https://source.unsplash.com/random/300x300/?water,bottle", tags: [], position: 1, isAvailable: true, kdsDestination: "BARRA", preparationTime: 1 }, ]; for (const itemData of menuItemsDataSeed) { const { categoryName, idForModifiers, ...dataWithoutCategoryName } = itemData; const category = createdCategories[categoryName]; if (!category) { console.warn(`[SEED] Category ${categoryName} not found for item ${dataWithoutCategoryName.name_es}. Skipping item.`); continue; } const menuItem = await prisma.menuItem.upsert({ where: { categoryId_name_es: { categoryId: category.id, name_es: dataWithoutCategoryName.name_es } }, update: { ...dataWithoutCategoryName, businessId: demoBusiness.id, categoryId: category.id }, create: { ...dataWithoutCategoryName, businessId: demoBusiness.id, categoryId: category.id }, include: { category: true } }); if (idForModifiers) createdMenuItems[idForModifiers] = menuItem; const key = dataWithoutCategoryName.name_es.replace(/\s+/g, ''); createdMenuItems[key] = menuItem; } console.log(`[SEED] Upserted Menu Items.`);
  console.log(`[SEED] Creating Tables for business ${demoBusiness.id}...`); const tablesDataSeed = [ { identifier: "M1", zone: "Salón Interior", capacity: 4, isActive: true }, { identifier: "M2", zone: "Salón Interior", capacity: 2, isActive: true }, { identifier: "T1", zone: "Terraza", capacity: 4, isActive: true }, ]; for (const tableData of tablesDataSeed) { const table = await prisma.table.upsert({ where: { businessId_identifier: { businessId: demoBusiness.id, identifier: tableData.identifier } }, update: { ...tableData, businessId: demoBusiness.id }, create: { ...tableData, businessId: demoBusiness.id } }); createdTables[tableData.identifier] = table; } console.log(`[SEED] Upserted Tables: ${Object.keys(createdTables).join(', ')}`);
  console.log(`[SEED] Creating Staff users and Pins for business ${demoBusiness.id}...`); const staffUsersDataSeed = [ { email: 'cocina@demo.com', name: 'Cocinero Demo', role: UserRole.KITCHEN_STAFF, pin: '1111', pinDescription: 'PIN Cocina' }, { email: 'barra@demo.com', name: 'Barman Demo', role: UserRole.BAR_STAFF, pin: '2222', pinDescription: 'PIN Barra' }, { email: 'camarero@demo.com', name: 'Camarero Demo', role: UserRole.WAITER, pin: '3333', pinDescription: 'PIN Camarero' }, ]; for (const staffData of staffUsersDataSeed) { const user = await prisma.user.upsert({ where: { email: staffData.email }, update: { name: staffData.name, role: staffData.role, businessId: demoBusiness.id, isActive: true, password: await hashPassword('password123') }, create: { email: staffData.email, password: await hashPassword('password123'), name: staffData.name, role: staffData.role, businessId: demoBusiness.id, isActive: true } }); await prisma.staffPin.upsert({ where: { userId: user.id }, update: { pinHash: await hashPassword(staffData.pin), description: staffData.pinDescription, isActive: true, businessId: demoBusiness.id }, create: { pinHash: await hashPassword(staffData.pin), description: staffData.pinDescription, isActive: true, userId: user.id, businessId: demoBusiness.id } }); } console.log(`[SEED] Upserted Staff users (Kitchen, Bar, Waiter) and their Pins.`);
  console.log(`[SEED] Creating Modifiers and sample Orders for KDS Demo...`); const itemHamburguesaRefSeedMod = createdMenuItems["itemHamburguesa"]; if (itemHamburguesaRefSeedMod) { const grupoPuntoCoccion = await prisma.modifierGroup.upsert({ where: { menuItemId_name_es: { menuItemId: itemHamburguesaRefSeedMod.id, name_es: "Punto de la Carne" } }, update: { uiType: SeedModifierUiType.RADIO, minSelections: 1, maxSelections: 1, position: 0, isRequired: true, name_en: "Meat Doneness", businessId: demoBusiness.id }, create: { menuItemId: itemHamburguesaRefSeedMod.id, businessId: demoBusiness.id, name_es: "Punto de la Carne", name_en: "Meat Doneness", uiType: SeedModifierUiType.RADIO, minSelections: 1, maxSelections: 1, position: 0, isRequired: true } }); const modifierOptionsPuntoData = [ { groupId: grupoPuntoCoccion.id, name_es: "Poco Hecha", name_en: "Rare", priceAdjustment: new Prisma.Decimal(0), position: 0, isDefault: false, isAvailable: true }, { groupId: grupoPuntoCoccion.id, name_es: "Al Punto", name_en: "Medium", priceAdjustment: new Prisma.Decimal(0), position: 1, isDefault: true, isAvailable: true }, { groupId: grupoPuntoCoccion.id, name_es: "Muy Hecha", name_en: "Well Done", priceAdjustment: new Prisma.Decimal(0), position: 2, isDefault: false, isAvailable: true }, ]; for (const modOptData of modifierOptionsPuntoData) { const opt = await prisma.modifierOption.upsert({ where: {groupId_name_es: {groupId: modOptData.groupId, name_es: modOptData.name_es}}, update: {...modOptData}, create: {...modOptData} }); createdModOptionsPunto[modOptData.name_es.replace(/\s+/g, '')] = opt; } console.log(`[SEED] Upserted ModifierGroup "${grupoPuntoCoccion.name_es}" for ${itemHamburguesaRefSeedMod.name_es}`); const grupoExtrasBurger = await prisma.modifierGroup.upsert({ where: { menuItemId_name_es: { menuItemId: itemHamburguesaRefSeedMod.id, name_es: "Extras Hamburguesa" } }, update: { uiType: SeedModifierUiType.CHECKBOX, minSelections: 0, maxSelections: 3, position: 1, isRequired: false, name_en: "Burger Extras", businessId: demoBusiness.id }, create: { menuItemId: itemHamburguesaRefSeedMod.id, businessId: demoBusiness.id, name_es: "Extras Hamburguesa", name_en: "Burger Extras", uiType: SeedModifierUiType.CHECKBOX, minSelections: 0, maxSelections: 3, position: 1, isRequired: false } }); const modifierOptionsExtrasData = [ { groupId: grupoExtrasBurger.id, name_es: "Queso Extra", name_en: "Extra Cheese", priceAdjustment: new Prisma.Decimal(1.00), position: 0, isAvailable: true }, { groupId: grupoExtrasBurger.id, name_es: "Bacon Extra", name_en: "Extra Bacon", priceAdjustment: new Prisma.Decimal(1.50), position: 1, isAvailable: true }, { groupId: grupoExtrasBurger.id, name_es: "Huevo Frito", name_en: "Fried Egg", priceAdjustment: new Prisma.Decimal(1.20), position: 2, isAvailable: true }, { groupId: grupoExtrasBurger.id, name_es: "Guacamole", name_en: "Guacamole", priceAdjustment: new Prisma.Decimal(2.00), position: 3, isAvailable: true }, ]; for (const modOptData of modifierOptionsExtrasData) { const opt = await prisma.modifierOption.upsert({ where: {groupId_name_es: {groupId: modOptData.groupId, name_es: modOptData.name_es}}, update: {...modOptData}, create: {...modOptData} }); createdModOptionsExtras[modOptData.name_es.replace(/\s+/g, '')] = opt; } console.log(`[SEED] Upserted ModifierGroup "${grupoExtrasBurger.name_es}" for ${itemHamburguesaRefSeedMod.name_es}`);
    
      // --- Pedido 1 ---
      const order1CreationTime = subMinutes(new Date(), 30);
      const order1Table = createdTables["M1"];
      if (!order1Table) { console.warn("[SEED] Table M1 not found for Order 1. Skipping Order 1."); }
      else {
        const order1ItemsToCreateAnidado: Prisma.OrderItemCreateWithoutOrderInput[] = [];
        let calculatedTotalAmountOrder1 = new Prisma.Decimal(0);
        
        const hamburguesaMenuItemSeed = itemHamburguesaRefSeedMod;
        const refrescoMenuItemSeed = createdMenuItems["RefrescodeColaDemo"];
  
        if (hamburguesaMenuItemSeed && createdModOptionsPunto["AlPunto"] && createdModOptionsExtras["BaconExtra"]) {
          let hamburguesaBasePrice = hamburguesaMenuItemSeed.price;
          let hamburguesaModifierPriceAdjustment = new Prisma.Decimal(0);
          hamburguesaModifierPriceAdjustment = hamburguesaModifierPriceAdjustment.add(createdModOptionsPunto["AlPunto"].priceAdjustment);
          hamburguesaModifierPriceAdjustment = hamburguesaModifierPriceAdjustment.add(createdModOptionsExtras["BaconExtra"].priceAdjustment);
          const hamburguesaPriceAtPurchase = hamburguesaBasePrice.add(hamburguesaModifierPriceAdjustment);
          const hamburguesaQuantity = 1;
          const hamburguesaTotalItemPrice = hamburguesaPriceAtPurchase.mul(hamburguesaQuantity);
          calculatedTotalAmountOrder1 = calculatedTotalAmountOrder1.add(hamburguesaTotalItemPrice);
          
          order1ItemsToCreateAnidado.push({
              menuItem: { connect: { id: hamburguesaMenuItemSeed.id } }, 
              quantity: hamburguesaQuantity,
              priceAtPurchase: hamburguesaPriceAtPurchase, 
              totalItemPrice: hamburguesaTotalItemPrice, // <--- VALOR PARA totalItemPrice
              itemNameSnapshot: hamburguesaMenuItemSeed.name_es, 
              itemDescriptionSnapshot: hamburguesaMenuItemSeed.description_es,
              kdsDestination: hamburguesaMenuItemSeed.kdsDestination, 
              notes: "Bien hecha.",
              selectedModifiers: { create: [
                  { modifierOption: { connect: { id: createdModOptionsPunto["AlPunto"].id } }, optionNameSnapshot: createdModOptionsPunto["AlPunto"].name_es, optionPriceAdjustmentSnapshot: createdModOptionsPunto["AlPunto"].priceAdjustment },
                  { modifierOption: { connect: { id: createdModOptionsExtras["BaconExtra"].id } }, optionNameSnapshot: createdModOptionsExtras["BaconExtra"].name_es, optionPriceAdjustmentSnapshot: createdModOptionsExtras["BaconExtra"].priceAdjustment },
              ]}
          });
        } else console.warn("[SEED] Could not prepare Hamburguesa for Order 1 due to missing item or modifier references.");
  
        if (refrescoMenuItemSeed) {
          const refrescoQuantity = 2;
          const refrescoPriceAtPurchase = refrescoMenuItemSeed.price;
          const refrescoTotalItemPrice = refrescoPriceAtPurchase.mul(refrescoQuantity);
          calculatedTotalAmountOrder1 = calculatedTotalAmountOrder1.add(refrescoTotalItemPrice);
  
          order1ItemsToCreateAnidado.push({
              menuItem: { connect: { id: refrescoMenuItemSeed.id } }, 
              quantity: refrescoQuantity,
              priceAtPurchase: refrescoPriceAtPurchase,
              totalItemPrice: refrescoTotalItemPrice, // <--- VALOR PARA totalItemPrice
              itemNameSnapshot: refrescoMenuItemSeed.name_es, 
              itemDescriptionSnapshot: refrescoMenuItemSeed.description_es,
              kdsDestination: refrescoMenuItemSeed.kdsDestination,
          });
        } else console.warn("[SEED] Could not prepare Refresco for Order 1 due to missing item reference.");
  
        if (order1ItemsToCreateAnidado.length > 0) {
          const order1DataForCreate: Prisma.OrderCreateInput = {
              business: { connect: { id: demoBusiness.id } },
              orderNumber: `DEMO-${formatISO(new Date(), { representation: 'date' })}-001`, 
              status: OrderStatus.RECEIVED,
              totalAmount: calculatedTotalAmountOrder1, 
              finalAmount: calculatedTotalAmountOrder1, 
              source: "CUSTOMER_APP_DEMO", 
              table: { connect: { id: order1Table.id } },
              customerLCo: { connect: { id: demoCustomer1.id } },
              orderType: OrderType.DINE_IN, 
              notes: "Sin pepinillos en la hamburguesa, por favor.",
              createdAt: order1CreationTime, 
              items: { create: order1ItemsToCreateAnidado }
          };
          const order1 = await prisma.order.create({ data: order1DataForCreate });
          console.log(`[SEED] Created Order ${order1.orderNumber} (Total: ${order1.totalAmount}).`);
        } else console.warn("[SEED] No items to create for Order 1. Skipping Order 1 creation.");
      }
    } else console.warn("[SEED] itemHamburguesaRefSeedMod not found. Skipping Order 1 and its modifier setup.");
  
    // --- Pedido 2 ---
    const order2CreationTime = subMinutes(new Date(), 5);
    const order2Table = createdTables["T1"];
    if (!order2Table) { console.warn("[SEED] Table T1 not found for Order 2. Skipping Order 2."); }
    else {
      const order2ItemsToCreateAnidado: Prisma.OrderItemCreateWithoutOrderInput[] = [];
      let calculatedTotalAmountOrder2 = new Prisma.Decimal(0);
      const ensaladaCesarMenuItemSeed = createdMenuItems["EnsaladaCésarDemo"];
      const aguaMineralMenuItemSeed = createdMenuItems["AguaMineralDemo"];
  
      if (ensaladaCesarMenuItemSeed) {
          const ensaladaQuantity = 2;
          const ensaladaPriceAtPurchase = ensaladaCesarMenuItemSeed.price;
          const ensaladaTotalItemPrice = ensaladaPriceAtPurchase.mul(ensaladaQuantity);
          calculatedTotalAmountOrder2 = calculatedTotalAmountOrder2.add(ensaladaTotalItemPrice);
          order2ItemsToCreateAnidado.push({ menuItem: { connect: { id: ensaladaCesarMenuItemSeed.id } }, quantity: ensaladaQuantity, priceAtPurchase: ensaladaPriceAtPurchase, totalItemPrice: ensaladaTotalItemPrice, itemNameSnapshot: ensaladaCesarMenuItemSeed.name_es, itemDescriptionSnapshot: ensaladaCesarMenuItemSeed.description_es, kdsDestination: ensaladaCesarMenuItemSeed.kdsDestination });
      } else console.warn("[SEED] EnsaladaCésarDemo not found for Order 2.");
      if (aguaMineralMenuItemSeed) {
          const aguaQuantity = 1;
          const aguaPriceAtPurchase = aguaMineralMenuItemSeed.price;
          const aguaTotalItemPrice = aguaPriceAtPurchase.mul(aguaQuantity);
          calculatedTotalAmountOrder2 = calculatedTotalAmountOrder2.add(aguaTotalItemPrice);
          order2ItemsToCreateAnidado.push({ menuItem: { connect: { id: aguaMineralMenuItemSeed.id } }, quantity: aguaQuantity, priceAtPurchase: aguaPriceAtPurchase, totalItemPrice: aguaTotalItemPrice, itemNameSnapshot: aguaMineralMenuItemSeed.name_es, itemDescriptionSnapshot: aguaMineralMenuItemSeed.description_es, kdsDestination: aguaMineralMenuItemSeed.kdsDestination });
      } else console.warn("[SEED] AguaMineralDemo not found for Order 2.");
  
      if (order2ItemsToCreateAnidado.length > 0) {
        const order2DataForCreate: Prisma.OrderCreateInput = {
            business: { connect: { id: demoBusiness.id } }, 
            orderNumber: `DEMO-${formatISO(new Date(), { representation: 'date' })}-002`, 
            status: OrderStatus.RECEIVED,
            totalAmount: calculatedTotalAmountOrder2, 
            finalAmount: calculatedTotalAmountOrder2, 
            source: "CUSTOMER_APP_DEMO",
            table: { connect: { id: order2Table.id } }, 
            orderType: OrderType.DINE_IN, 
            createdAt: order2CreationTime,
            items: { create: order2ItemsToCreateAnidado }
        };
        const order2 = await prisma.order.create({ data: order2DataForCreate });
        console.log(`[SEED] Created Order ${order2.orderNumber} (Total: ${order2.totalAmount}).`);
      } else console.warn(`[SEED] Could not create Order 2 due to no items being added.`);
    }
  
    // --- Datos Históricos LCo ---
    console.log(`[SEED] Generating historical data for LCo statistics...`); const now = new Date(); const startOfThisWeek = startOfDay(subDays(now, 6)); const daysThisWeek = eachDayOfInterval({ start: startOfThisWeek, end: now }); for (const day of daysThisWeek.slice(0, -1)) { if (Math.random() > 0.3) { const amount = Math.floor(Math.random() * 40) + 5; const pointsToEarn = Math.floor(amount * (demoBusiness.pointsPerEuro ?? 1)); const ticketNum = `TICKET-${formatISO(day, { representation: 'date' })}-${Math.floor(Math.random() * 1000)}`; const createdQr = await prisma.qrCode.create({ data: { token: uuidv4(), businessId: demoBusiness.id, amount, ticketNumber: ticketNum, expiresAt: addMinutes(day, demoBusiness.qrCodeExpirationMinutes), status: QrCodeStatus.COMPLETED, completedAt: day, userId: demoCustomer1.id, pointsEarned: pointsToEarn }}); await prisma.activityLog.create({ data: { userId: demoCustomer1.id, businessId: demoBusiness.id, type: ActivityType.POINTS_EARNED_QR, pointsChanged: pointsToEarn, description: `Ticket: ${ticketNum}`, createdAt: day, relatedQrId: createdQr.id }}); await prisma.user.update({ where: {id: demoCustomer1.id }, data: { points: {increment: pointsToEarn}, totalSpend: {increment: amount}, totalVisits: {increment: 1}, lastActivityAt: day }}); } }
    const startOfLastWeek = startOfDay(subDays(now, 13)); const endOfLastWeek = endOfDay(subDays(now, 7)); const daysLastWeek = eachDayOfInterval({ start: startOfLastWeek, end: endOfLastWeek }); for (const day of daysLastWeek) { if (Math.random() > 0.4) { const amount = Math.floor(Math.random() * 50) + 10; const pointsToEarn = Math.floor(amount * (demoBusiness.pointsPerEuro ?? 1)); const ticketNum = `TICKET-LW-${formatISO(day, { representation: 'date' })}-${Math.floor(Math.random() * 1000)}`; const createdQr = await prisma.qrCode.create({ data: { token: uuidv4(), businessId: demoBusiness.id, amount, ticketNumber: ticketNum, expiresAt: addMinutes(day, demoBusiness.qrCodeExpirationMinutes), status: QrCodeStatus.COMPLETED, completedAt: day, userId: demoCustomer3.id, pointsEarned: pointsToEarn }}); await prisma.activityLog.create({ data: { userId: demoCustomer3.id, businessId: demoBusiness.id, type: ActivityType.POINTS_EARNED_QR, pointsChanged: pointsToEarn, description: `Ticket: ${ticketNum}`, createdAt: day, relatedQrId: createdQr.id }}); await prisma.user.update({ where: {id: demoCustomer3.id }, data: { points: {increment: pointsToEarn}, totalSpend: {increment: amount}, totalVisits: {increment: 1}, lastActivityAt: day }}); }
    if (cafeLCoRewardIdSeed && demoAdminForGift && Math.random() > 0.85) { const userForReward = await prisma.user.findUnique({where: {id: demoCustomer1.id}, select: {points: true}}); const cafeRewardDetails = await prisma.reward.findUnique({where: {id: cafeLCoRewardIdSeed}, select: {pointsCost: true, name_es: true}}); if (userForReward && cafeRewardDetails && cafeRewardDetails.name_es && userForReward.points >= cafeRewardDetails.pointsCost) { const granted = await prisma.grantedReward.create({ data: { userId: demoCustomer1.id, rewardId: cafeLCoRewardIdSeed, businessId: demoBusiness.id, status: 'REDEEMED', assignedAt: day, redeemedAt: day, assignedById: demoAdminForGift.id }}); await prisma.activityLog.create({ data: { userId: demoCustomer1.id, businessId: demoBusiness.id, type: ActivityType.GIFT_REDEEMED, description: `Canje: ${cafeRewardDetails.name_es}`, createdAt: day, relatedGrantedRewardId: granted.id } }); await prisma.user.update({ where: {id: demoCustomer1.id}, data: { points: {decrement: cafeRewardDetails.pointsCost}}}); } } }
    console.log(`[SEED] Finished generating historical LCo data.`);
  
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