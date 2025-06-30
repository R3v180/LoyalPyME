// backend/prisma/seed/_5_activity.ts
import { 
    PrismaClient, Prisma, RewardType, DiscountType, ActivityType, GrantedRewardStatus, 
    QrCodeStatus, OrderStatus, OrderItemStatus, Business, User, MenuItem, ModifierGroup, TableStatus 
} from '@prisma/client';
import { subDays, formatISO, addDays } from 'date-fns';
import { v4 as uuidv4 } from 'uuid';

// Interfaz para las dependencias que necesita este script
interface SeedActivityDeps {
    business: Business;
    admin: User;
    anaOro: User;
    carlosPlata: User;
    davidNuevo: User;
    hamburguesa: MenuItem;
    tarta: MenuItem;
    cafe: MenuItem;
    puntoCarneGroup: ModifierGroup;
    extrasGroup: ModifierGroup;
}

/**
 * Función que crea el catálogo de recompensas y simula actividad histórica.
 */
export async function seedActivity(prisma: PrismaClient, deps: SeedActivityDeps) {
    const { business, admin, anaOro, carlosPlata, davidNuevo, hamburguesa, tarta, cafe, puntoCarneGroup, extrasGroup } = deps;
    
    console.log('--- Seeding [5]: Rewards, History & Transactions ---');

    // 1. CREAR CATÁLOGO DE RECOMPENSAS
    const rewards = {
      tartaGratis: await prisma.reward.upsert({ where: { unique_reward_name_es_business: { businessId: business.id, name_es: "Tarta de Queso Gratis (de la Carta)" } }, update: {}, create: { name_es: "Tarta de Queso Gratis (de la Carta)", name_en: "Free Cheesecake (from Menu)", pointsCost: 80, type: RewardType.MENU_ITEM, linkedMenuItemId: tarta.id, businessId: business.id, imageUrl: tarta.imageUrl } }),
      gorra: await prisma.reward.upsert({ where: { unique_reward_name_es_business: { businessId: business.id, name_es: "Gorra Exclusiva LoyalPyME" } }, update: {}, create: { name_es: "Gorra Exclusiva LoyalPyME", name_en: "Exclusive LoyalPyME Cap", pointsCost: 250, type: RewardType.GENERIC_FREE_PRODUCT, kdsDestination: "BARRA", businessId: business.id } }),
      descuentoTotal: await prisma.reward.upsert({ where: { unique_reward_name_es_business: { businessId: business.id, name_es: "5€ de Descuento en tu Cuenta" } }, update: {}, create: { name_es: "5€ de Descuento en tu Cuenta", name_en: "5€ Off Your Bill", pointsCost: 100, type: RewardType.DISCOUNT_ON_TOTAL, discountType: DiscountType.FIXED_AMOUNT, discountValue: new Prisma.Decimal(5.00), businessId: business.id } }),
      descuentoBurger: await prisma.reward.upsert({ where: { unique_reward_name_es_business: { businessId: business.id, name_es: "50% Dto. en Hamburguesa 'La Jefa'" } }, update: {}, create: { name_es: "50% Dto. en Hamburguesa 'La Jefa'", name_en: "50% Off 'The Boss' Burger", pointsCost: 120, type: RewardType.DISCOUNT_ON_ITEM, discountType: DiscountType.PERCENTAGE, discountValue: new Prisma.Decimal(50), linkedMenuItemId: hamburguesa.id, businessId: business.id } }),
    };
    console.log(`[SEED] Upserted Rewards Catalog.`);

    // 2. CREAR HISTORIAL DE ACTIVIDAD
    
    const qr1 = await prisma.qrCode.create({ data: { token: uuidv4(), businessId: business.id, amount: 25.50, ticketNumber: "T-HIST-001", expiresAt: new Date(), status: QrCodeStatus.COMPLETED, userId: davidNuevo.id, pointsEarned: 25, completedAt: subDays(new Date(), 3) } });
    await prisma.activityLog.create({ data: { userId: davidNuevo.id, businessId: business.id, type: ActivityType.POINTS_EARNED_QR, pointsChanged: 25, description: "T-HIST-001", relatedQrId: qr1.id } });

    // Pedido Activo para probar flujo de camarero
    const mesa5 = await prisma.table.findFirst({where: {identifier: 'M5', businessId: business.id }});
    if(mesa5) {
        await prisma.order.create({ data: {
            orderNumber: `LIVE-${formatISO(new Date(), { representation: 'date' })}-01`,
            status: OrderStatus.COMPLETED,
            businessId: business.id,
            customerLCoId: anaOro.id,
            tableId: mesa5.id,
            totalAmount: 18.30,
            finalAmount: 18.30,
            items: { 
                create: [
                    { menuItemId: cafe.id, quantity: 1, totalItemPrice: 1.80, priceAtPurchase: 1.80, status: OrderItemStatus.SERVED },
                    { menuItemId: tarta.id, quantity: 1, totalItemPrice: 6.50, priceAtPurchase: 6.50, status: OrderItemStatus.SERVED } 
                ] 
            }
        }});
        await prisma.table.update({where: {id: mesa5.id}, data: { status: TableStatus.OCCUPIED }});
        console.log(`[SEED] Created an ACTIVE (unpaid) order on Table M5.`);
    }

    const opAlPunto = await prisma.modifierOption.findFirst({ where: { groupId: puntoCarneGroup.id, name_es: 'Al Punto' } });
    const opBacon = await prisma.modifierOption.findFirst({ where: { groupId: extrasGroup.id, name_es: 'Bacon Extra' } });
    
    if (opAlPunto && opBacon) {
      const priceWithModifiers = new Prisma.Decimal(hamburguesa.price).add(opBacon.priceAdjustment);
      const orderItemDataWithMods = {
          menuItemId: hamburguesa.id, quantity: 1, priceAtPurchase: priceWithModifiers, totalItemPrice: priceWithModifiers, 
          status: OrderItemStatus.SERVED, itemNameSnapshot: hamburguesa.name_es, 
          selectedModifiers: { createMany: { data: [
              { modifierOptionId: opAlPunto.id, optionNameSnapshot: opAlPunto.name_es, optionPriceAdjustmentSnapshot: opAlPunto.priceAdjustment }, 
              { modifierOptionId: opBacon.id, optionNameSnapshot: opBacon.name_es, optionPriceAdjustmentSnapshot: opBacon.priceAdjustment }
          ]}}
      };
      await prisma.order.create({
          data: {
              orderNumber: `HIST-${formatISO(subDays(new Date(), 1), { representation: 'date' })}-01`,
              status: OrderStatus.PAID, businessId: business.id, customerLCoId: anaOro.id, 
              createdAt: subDays(new Date(), 1), paidAt: subDays(new Date(), 1),
              totalAmount: priceWithModifiers, finalAmount: priceWithModifiers,
              items: { create: [orderItemDataWithMods] }
          }
      });
    }

    await prisma.order.create({ data: {
        orderNumber: `HIST-${formatISO(subDays(new Date(), 5), { representation: 'date' })}-02`, status: OrderStatus.PAID, businessId: business.id, 
        customerLCoId: carlosPlata.id, createdAt: subDays(new Date(), 5), paidAt: subDays(new Date(), 5), 
        totalAmount: 8.30, discountAmount: 5.00, finalAmount: 3.30, appliedLcoRewardId: rewards.descuentoTotal.id,
        items: { create: [
            { menuItemId: tarta.id, quantity: 1, totalItemPrice: 6.50, priceAtPurchase: 6.50, status: OrderItemStatus.SERVED, itemNameSnapshot: tarta.name_es },
            { menuItemId: cafe.id, quantity: 1, totalItemPrice: 1.80, priceAtPurchase: 1.80, status: OrderItemStatus.SERVED, itemNameSnapshot: cafe.name_es }
        ]}
    }});
    
    await prisma.order.create({ data: { 
        orderNumber: `HIST-${formatISO(subDays(new Date(), 8), { representation: 'date' })}-03`, status: OrderStatus.PAID, businessId: business.id, 
        customerLCoId: davidNuevo.id, createdAt: subDays(new Date(), 8), paidAt: subDays(new Date(), 8), 
        totalAmount: 1.80, finalAmount: 1.80, 
        items: { create: [ 
            { menuItemId: cafe.id, quantity: 1, totalItemPrice: 1.80, priceAtPurchase: 1.80, status: OrderItemStatus.SERVED, itemNameSnapshot: cafe.name_es },
            { menuItemId: tarta.id, redeemedRewardId: rewards.tartaGratis.id, quantity: 1, totalItemPrice: 0, priceAtPurchase: 0, status: OrderItemStatus.SERVED, itemNameSnapshot: `GRATIS: ${tarta.name_es}` }
        ]}
    }});
    console.log(`[SEED] Created historical paid orders.`);

    // 3. CREAR REGALOS Y CUPONES (GRANTED REWARDS)
    await prisma.grantedReward.create({ data: { userId: anaOro.id, rewardId: rewards.tartaGratis.id, businessId: business.id, assignedById: admin.id, status: GrantedRewardStatus.PENDING, expiresAt: addDays(new Date(), 30) } });
    if (rewards.gorra) {
        const grantedReward = await prisma.grantedReward.create({ data: { userId: carlosPlata.id, rewardId: rewards.gorra.id, businessId: business.id, status: GrantedRewardStatus.AVAILABLE, redeemedAt: new Date() } });
        await prisma.activityLog.create({ data: { userId: carlosPlata.id, businessId: business.id, type: ActivityType.REWARD_ACQUIRED, pointsChanged: -rewards.gorra.pointsCost, description: `Has obtenido la recompensa: '${rewards.gorra.name_es}'`, relatedRewardId: rewards.gorra.id, relatedGrantedRewardId: grantedReward.id } });
    }
    console.log(`[SEED] Created pending gift and available coupon.`);
}