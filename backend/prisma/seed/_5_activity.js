"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.seedActivity = seedActivity;
// backend/prisma/seed/_5_activity.ts
const client_1 = require("@prisma/client");
const date_fns_1 = require("date-fns");
const uuid_1 = require("uuid");
/**
 * Función que crea el catálogo de recompensas y simula actividad histórica.
 */
async function seedActivity(prisma, deps) {
    const { business, admin, anaOro, carlosPlata, davidNuevo, hamburguesa, tarta, cafe, puntoCarneGroup, extrasGroup } = deps;
    console.log('--- Seeding [5]: Rewards, History & Transactions ---');
    // 1. CREAR CATÁLOGO DE RECOMPENSAS
    const rewards = {
        tartaGratis: await prisma.reward.upsert({ where: { unique_reward_name_es_business: { businessId: business.id, name_es: "Tarta de Queso Gratis (de la Carta)" } }, update: {}, create: { name_es: "Tarta de Queso Gratis (de la Carta)", name_en: "Free Cheesecake (from Menu)", pointsCost: 80, type: client_1.RewardType.MENU_ITEM, linkedMenuItemId: tarta.id, businessId: business.id, imageUrl: tarta.imageUrl } }),
        gorra: await prisma.reward.upsert({ where: { unique_reward_name_es_business: { businessId: business.id, name_es: "Gorra Exclusiva LoyalPyME" } }, update: {}, create: { name_es: "Gorra Exclusiva LoyalPyME", name_en: "Exclusive LoyalPyME Cap", pointsCost: 250, type: client_1.RewardType.GENERIC_FREE_PRODUCT, kdsDestination: "BARRA", businessId: business.id } }),
        descuentoTotal: await prisma.reward.upsert({ where: { unique_reward_name_es_business: { businessId: business.id, name_es: "5€ de Descuento en tu Cuenta" } }, update: {}, create: { name_es: "5€ de Descuento en tu Cuenta", name_en: "5€ Off Your Bill", pointsCost: 100, type: client_1.RewardType.DISCOUNT_ON_TOTAL, discountType: client_1.DiscountType.FIXED_AMOUNT, discountValue: new client_1.Prisma.Decimal(5.00), businessId: business.id } }),
        descuentoBurger: await prisma.reward.upsert({ where: { unique_reward_name_es_business: { businessId: business.id, name_es: "50% Dto. en Hamburguesa 'La Jefa'" } }, update: {}, create: { name_es: "50% Dto. en Hamburguesa 'La Jefa'", name_en: "50% Off 'The Boss' Burger", pointsCost: 120, type: client_1.RewardType.DISCOUNT_ON_ITEM, discountType: client_1.DiscountType.PERCENTAGE, discountValue: new client_1.Prisma.Decimal(50), linkedMenuItemId: hamburguesa.id, businessId: business.id } }),
    };
    console.log(`[SEED] Upserted Rewards Catalog.`);
    // 2. CREAR HISTORIAL DE ACTIVIDAD
    const qr1 = await prisma.qrCode.create({ data: { token: (0, uuid_1.v4)(), businessId: business.id, amount: 25.50, ticketNumber: "T-HIST-001", expiresAt: new Date(), status: client_1.QrCodeStatus.COMPLETED, userId: davidNuevo.id, pointsEarned: 25, completedAt: (0, date_fns_1.subDays)(new Date(), 3) } });
    await prisma.activityLog.create({ data: { userId: davidNuevo.id, businessId: business.id, type: client_1.ActivityType.POINTS_EARNED_QR, pointsChanged: 25, description: "T-HIST-001", relatedQrId: qr1.id } });
    // Pedido Activo para probar flujo de camarero
    const mesa5 = await prisma.table.findFirst({ where: { identifier: 'M5', businessId: business.id } });
    if (mesa5) {
        await prisma.order.create({ data: {
                orderNumber: `LIVE-${(0, date_fns_1.formatISO)(new Date(), { representation: 'date' })}-01`,
                status: client_1.OrderStatus.COMPLETED,
                businessId: business.id,
                customerLCoId: anaOro.id,
                tableId: mesa5.id,
                totalAmount: 18.30,
                finalAmount: 18.30,
                items: {
                    create: [
                        { menuItemId: cafe.id, quantity: 1, totalItemPrice: 1.80, priceAtPurchase: 1.80, status: client_1.OrderItemStatus.SERVED },
                        { menuItemId: tarta.id, quantity: 1, totalItemPrice: 6.50, priceAtPurchase: 6.50, status: client_1.OrderItemStatus.SERVED }
                    ]
                }
            } });
        await prisma.table.update({ where: { id: mesa5.id }, data: { status: client_1.TableStatus.OCCUPIED } });
        console.log(`[SEED] Created an ACTIVE (unpaid) order on Table M5.`);
    }
    const opAlPunto = await prisma.modifierOption.findFirst({ where: { groupId: puntoCarneGroup.id, name_es: 'Al Punto' } });
    const opBacon = await prisma.modifierOption.findFirst({ where: { groupId: extrasGroup.id, name_es: 'Bacon Extra' } });
    if (opAlPunto && opBacon) {
        const priceWithModifiers = new client_1.Prisma.Decimal(hamburguesa.price).add(opBacon.priceAdjustment);
        const orderItemDataWithMods = {
            menuItemId: hamburguesa.id, quantity: 1, priceAtPurchase: priceWithModifiers, totalItemPrice: priceWithModifiers,
            status: client_1.OrderItemStatus.SERVED, itemNameSnapshot: hamburguesa.name_es,
            selectedModifiers: { createMany: { data: [
                        { modifierOptionId: opAlPunto.id, optionNameSnapshot: opAlPunto.name_es, optionPriceAdjustmentSnapshot: opAlPunto.priceAdjustment },
                        { modifierOptionId: opBacon.id, optionNameSnapshot: opBacon.name_es, optionPriceAdjustmentSnapshot: opBacon.priceAdjustment }
                    ] } }
        };
        await prisma.order.create({
            data: {
                orderNumber: `HIST-${(0, date_fns_1.formatISO)((0, date_fns_1.subDays)(new Date(), 1), { representation: 'date' })}-01`,
                status: client_1.OrderStatus.PAID, businessId: business.id, customerLCoId: anaOro.id,
                createdAt: (0, date_fns_1.subDays)(new Date(), 1), paidAt: (0, date_fns_1.subDays)(new Date(), 1),
                totalAmount: priceWithModifiers, finalAmount: priceWithModifiers,
                items: { create: [orderItemDataWithMods] }
            }
        });
    }
    await prisma.order.create({ data: {
            orderNumber: `HIST-${(0, date_fns_1.formatISO)((0, date_fns_1.subDays)(new Date(), 5), { representation: 'date' })}-02`, status: client_1.OrderStatus.PAID, businessId: business.id,
            customerLCoId: carlosPlata.id, createdAt: (0, date_fns_1.subDays)(new Date(), 5), paidAt: (0, date_fns_1.subDays)(new Date(), 5),
            totalAmount: 8.30, discountAmount: 5.00, finalAmount: 3.30, appliedLcoRewardId: rewards.descuentoTotal.id,
            items: { create: [
                    { menuItemId: tarta.id, quantity: 1, totalItemPrice: 6.50, priceAtPurchase: 6.50, status: client_1.OrderItemStatus.SERVED, itemNameSnapshot: tarta.name_es },
                    { menuItemId: cafe.id, quantity: 1, totalItemPrice: 1.80, priceAtPurchase: 1.80, status: client_1.OrderItemStatus.SERVED, itemNameSnapshot: cafe.name_es }
                ] }
        } });
    await prisma.order.create({ data: {
            orderNumber: `HIST-${(0, date_fns_1.formatISO)((0, date_fns_1.subDays)(new Date(), 8), { representation: 'date' })}-03`, status: client_1.OrderStatus.PAID, businessId: business.id,
            customerLCoId: davidNuevo.id, createdAt: (0, date_fns_1.subDays)(new Date(), 8), paidAt: (0, date_fns_1.subDays)(new Date(), 8),
            totalAmount: 1.80, finalAmount: 1.80,
            items: { create: [
                    { menuItemId: cafe.id, quantity: 1, totalItemPrice: 1.80, priceAtPurchase: 1.80, status: client_1.OrderItemStatus.SERVED, itemNameSnapshot: cafe.name_es },
                    { menuItemId: tarta.id, redeemedRewardId: rewards.tartaGratis.id, quantity: 1, totalItemPrice: 0, priceAtPurchase: 0, status: client_1.OrderItemStatus.SERVED, itemNameSnapshot: `GRATIS: ${tarta.name_es}` }
                ] }
        } });
    console.log(`[SEED] Created historical paid orders.`);
    // 3. CREAR REGALOS Y CUPONES (GRANTED REWARDS)
    await prisma.grantedReward.create({ data: { userId: anaOro.id, rewardId: rewards.tartaGratis.id, businessId: business.id, assignedById: admin.id, status: client_1.GrantedRewardStatus.PENDING, expiresAt: (0, date_fns_1.addDays)(new Date(), 30) } });
    if (rewards.gorra) {
        const grantedReward = await prisma.grantedReward.create({ data: { userId: carlosPlata.id, rewardId: rewards.gorra.id, businessId: business.id, status: client_1.GrantedRewardStatus.AVAILABLE, redeemedAt: new Date() } });
        await prisma.activityLog.create({ data: { userId: carlosPlata.id, businessId: business.id, type: client_1.ActivityType.REWARD_ACQUIRED, pointsChanged: -rewards.gorra.pointsCost, description: `Has obtenido la recompensa: '${rewards.gorra.name_es}'`, relatedRewardId: rewards.gorra.id, relatedGrantedRewardId: grantedReward.id } });
    }
    console.log(`[SEED] Created pending gift and available coupon.`);
}
