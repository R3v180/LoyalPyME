// backend/prisma/seed.ts
// Version: 20240630.9 - Final seed script adapted to the definitive rewards flow.

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
    GrantedRewardStatus, // Importar el nuevo enum
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
  console.log(`[SEED V21 - Definitive Rewards Flow Seed] Start seeding.`);
  
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

  // Cliente con muchos puntos y actividad para probar todo
  const powerUserEmail = 'poweruser@demo.com';
  const powerUser = await prisma.user.upsert({
    where: { email: powerUserEmail },
    update: { name: 'Power User Activo', points: 2000, totalSpend: 2000.0, totalVisits: 25, lastActivityAt: new Date(), isActive: true },
    create: { email: powerUserEmail, password: await hashPassword('password'), name: 'Power User Activo', phone: '+34000000002', documentId: '00000002B', documentType: DocumentType.DNI, role: UserRole.CUSTOMER_FINAL, businessId: demoBusiness.id, points: 2000, totalSpend: 2000.0, totalVisits: 25, lastActivityAt: new Date(), isActive: true },
  });

  // Cliente nuevo con pocos puntos
  const newUserEmail = 'newuser@demo.com';
  await prisma.user.upsert({
    where: { email: newUserEmail },
    update: { name: 'Nuevo Usuario', points: 25, totalSpend: 25, totalVisits: 1, isActive: true },
    create: { email: newUserEmail, password: await hashPassword('password'), name: 'Nuevo Usuario', phone: '+34000000003', documentId: '00000003C', documentType: DocumentType.DNI, role: UserRole.CUSTOMER_FINAL, businessId: demoBusiness.id, points: 25, totalSpend: 25, totalVisits: 1, createdAt: subDays(new Date(), 2) },
  });
  console.log(`[SEED] Upserted various types of customers.`);

  const tiersData = [ { name: 'Bronce', level: 1, minValue: 50 }, { name: 'Plata', level: 2, minValue: 200 }, { name: 'Oro', level: 3, minValue: 500 }, { name: 'Platino', level: 4, minValue: 1500 } ];
  for (const tierData of tiersData) { await prisma.tier.upsert({ where: { businessId_level: { businessId: demoBusiness.id, level: tierData.level } }, update: {name: tierData.name}, create: { ...tierData, businessId: demoBusiness.id }, }); }
  console.log(`[SEED] Upserted Tiers.`);
  
  // --- 3. Menu, Items, and Rewards ---
  console.log(`[SEED] Creating Digital Menu and Comprehensive Rewards...`);
  
  const categories = {
      entrantes: await prisma.menuCategory.upsert({ where: { businessId_name_es: { businessId: demoBusiness.id, name_es: 'Entrantes para Compartir' } }, update: {}, create: { name_es: 'Entrantes para Compartir', name_en: 'Starters to Share', businessId: demoBusiness.id, position: 1, imageUrl: 'https://images.unsplash.com/photo-1572441713135-c70a27b8a53c?q=80&w=800' } }),
      principales: await prisma.menuCategory.upsert({ where: { businessId_name_es: { businessId: demoBusiness.id, name_es: 'Platos Principales' } }, update: {}, create: { name_es: 'Platos Principales', name_en: 'Main Courses', businessId: demoBusiness.id, position: 2, imageUrl: 'https://images.unsplash.com/photo-1559847844-5315695d9e16?q=80&w=800' } }),
      postres: await prisma.menuCategory.upsert({ where: { businessId_name_es: { businessId: demoBusiness.id, name_es: 'Postres Caseros' } }, update: {}, create: { name_es: 'Postres Caseros', name_en: 'Homemade Desserts', businessId: demoBusiness.id, position: 3, imageUrl: 'https://images.unsplash.com/photo-1551024601-bec78aea704b?q=80&w=800' } }),
      bebidas: await prisma.menuCategory.upsert({ where: { businessId_name_es: { businessId: demoBusiness.id, name_es: 'Bebidas y Refrescos' } }, update: {}, create: { name_es: 'Bebidas y Refrescos', name_en: 'Drinks & Beverages', businessId: demoBusiness.id, position: 4, imageUrl: 'https://images.unsplash.com/photo-1573245929259-693680407254?q=80&w=800' } }),
  };
  
  const menuItems = {
      hamburguesa: await prisma.menuItem.upsert({ where: { categoryId_name_es: { categoryId: categories.principales.id, name_es: "Hamburguesa 'La Jefa'" } }, update: {}, create: { name_es: "Hamburguesa 'La Jefa'", name_en: "'The Boss' Burger", price: 13.50, kdsDestination: "COCINA", categoryId: categories.principales.id, businessId: demoBusiness.id, imageUrl: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?q=80&w=800' } }),
      tarta: await prisma.menuItem.upsert({ where: { categoryId_name_es: { categoryId: categories.postres.id, name_es: "Tarta de Queso Cremosa" } }, update: {}, create: { name_es: "Tarta de Queso Cremosa", name_en: "Creamy Cheesecake", price: 6.50, kdsDestination: "COCINA", categoryId: categories.postres.id, businessId: demoBusiness.id, imageUrl: 'https://images.unsplash.com/photo-1587314168485-3236d6710814?q=80&w=800' } }),
  };
  console.log(`[SEED] Upserted Menu Categories and Items.`);

  const rewards = {
      tartaGratis: await prisma.reward.upsert({ where: { unique_reward_name_es_business: { businessId: demoBusiness.id, name_es: "Tarta de Queso Gratis (de la Carta)" } }, update: {}, create: { name_es: "Tarta de Queso Gratis (de la Carta)", name_en: "Free Cheesecake (from Menu)", pointsCost: 80, type: RewardType.MENU_ITEM, linkedMenuItemId: menuItems.tarta.id, businessId: demoBusiness.id } }),
      gorra: await prisma.reward.upsert({ where: { unique_reward_name_es_business: { businessId: demoBusiness.id, name_es: "Gorra Exclusiva LoyalPyME" } }, update: {}, create: { name_es: "Gorra Exclusiva LoyalPyME", name_en: "Exclusive LoyalPyME Cap", pointsCost: 250, type: RewardType.GENERIC_FREE_PRODUCT, kdsDestination: "BARRA", businessId: demoBusiness.id } }),
      descuentoTotal: await prisma.reward.upsert({ where: { unique_reward_name_es_business: { businessId: demoBusiness.id, name_es: "5€ de Descuento en tu Cuenta" } }, update: {}, create: { name_es: "5€ de Descuento en tu Cuenta", name_en: "5€ Off Your Bill", pointsCost: 100, type: RewardType.DISCOUNT_ON_TOTAL, discountType: DiscountType.FIXED_AMOUNT, discountValue: new Prisma.Decimal(5.00), businessId: demoBusiness.id } }),
      descuentoBurger: await prisma.reward.upsert({ where: { unique_reward_name_es_business: { businessId: demoBusiness.id, name_es: "50% Dto. en Hamburguesa 'La Jefa'" } }, update: {}, create: { name_es: "50% Dto. en Hamburguesa 'La Jefa'", name_en: "50% Off 'The Boss' Burger", pointsCost: 120, type: RewardType.DISCOUNT_ON_ITEM, discountType: DiscountType.PERCENTAGE, discountValue: new Prisma.Decimal(50), linkedMenuItemId: menuItems.hamburguesa.id, businessId: demoBusiness.id } }),
  };
  console.log(`[SEED] Upserted Rewards.`);
  
  // --- 4. Datos de Ejemplo para el Nuevo Flujo ---
  console.log(`[SEED] Creating example data for the new rewards flow...`);

  // 4.1. Un REGALO (gift) asignado por un admin, pendiente de ser visto/aceptado.
  // Usamos create directamente ya que no hay una clave única para el upsert que queremos
  await prisma.grantedReward.create({
      data: {
          userId: powerUser.id,
          rewardId: rewards.tartaGratis.id,
          businessId: demoBusiness.id,
          assignedById: demoAdmin.id,
          status: GrantedRewardStatus.PENDING,
          expiresAt: addDays(new Date(), 30)
      }
  });
  console.log(`[SEED] Created a PENDING gift for Power User.`);

  // 4.2. Un "CUPÓN" que el cliente ya ha "comprado" con puntos y está listo para usar.
  await prisma.grantedReward.create({
      data: {
          userId: powerUser.id,
          rewardId: rewards.descuentoTotal.id,
          businessId: demoBusiness.id,
          status: GrantedRewardStatus.AVAILABLE,
          redeemedAt: new Date()
      }
  });
  await prisma.activityLog.create({
      data: {
          userId: powerUser.id,
          businessId: demoBusiness.id,
          type: ActivityType.REWARD_ACQUIRED,
          pointsChanged: -rewards.descuentoTotal.pointsCost,
          description: `Has obtenido la recompensa: '${rewards.descuentoTotal.name_es}'`,
          relatedRewardId: rewards.descuentoTotal.id
      }
  });
  console.log(`[SEED] Created an AVAILABLE coupon for Power User.`);

  // 4.3. Un pedido histórico donde ya se aplicó un cupón.
  const pastOrder = await prisma.order.create({
    data: {
        orderNumber: `HIST-${formatISO(subDays(new Date(), 2), { representation: 'date' })}-01`,
        status: OrderStatus.PAID,
        totalAmount: 13.50,
        discountAmount: 6.75,
        finalAmount: 6.75,
        businessId: demoBusiness.id,
        customerLCoId: powerUser.id,
        createdAt: subDays(new Date(), 2),
        paidAt: subDays(new Date(), 2),
        items: {
            create: [
                { menuItemId: menuItems.hamburguesa.id, quantity: 1, priceAtPurchase: 13.50, totalItemPrice: 13.50, status: OrderItemStatus.SERVED, itemNameSnapshot: menuItems.hamburguesa.name_es }
            ]
        }
    }
  });
  const appliedCoupon = await prisma.grantedReward.create({
    data: {
        userId: powerUser.id,
        rewardId: rewards.descuentoBurger.id,
        businessId: demoBusiness.id,
        status: GrantedRewardStatus.APPLIED,
        redeemedAt: subDays(new Date(), 2),
        appliedToOrderId: pastOrder.id
    }
  });
  await prisma.activityLog.create({
    data: {
        userId: powerUser.id,
        businessId: demoBusiness.id,
        type: ActivityType.REWARD_APPLIED_TO_ORDER,
        description: `Has usado '${rewards.descuentoBurger.name_es}' en el pedido #${pastOrder.orderNumber}`,
        relatedRewardId: rewards.descuentoBurger.id,
        relatedOrderId: pastOrder.id,
        relatedGrantedRewardId: appliedCoupon.id
    }
  });
  console.log(`[SEED] Created a past paid order with an applied coupon.`);

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