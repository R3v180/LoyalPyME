// backend/prisma/seed.ts
/// <reference types="node" />

import { PrismaClient, UserRole, DocumentType, TierCalculationBasis, TierDowngradePolicy } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

// Helper para hashear contraseñas
async function hashPassword(password: string): Promise<string> {
  const salt = await bcrypt.genSalt(10);
  return bcrypt.hash(password, salt);
}

async function main() {
  console.log(`[SEED] Start seeding with full data ...`); // Mensaje actualizado

  // --- 1. Crear Negocio de Demostración ---
  const demoBusinessName = 'Restaurante Demo LoyalPyME';
  const demoBusinessSlug = 'restaurante-demo-loyalpyme';
  const demoPointsPerEuro = 1.0;
  // qrCodeExpirationMinutes no está en el schema actual de Business

  let demoBusiness = await prisma.business.upsert({
    where: { slug: demoBusinessSlug },
    update: {
      name: demoBusinessName,
      pointsPerEuro: demoPointsPerEuro,
      // qrCodeExpirationMinutes: demoQrExpiration, // No existe en el schema
      tierSystemEnabled: true,
      tierCalculationBasis: TierCalculationBasis.SPEND,
      tierCalculationPeriodMonths: 0,
      tierDowngradePolicy: TierDowngradePolicy.PERIODIC_REVIEW,
      inactivityPeriodMonths: 6,
      isActive: true,
      isLoyaltyCoreActive: true,
      isCamareroActive: true,
    },
    create: {
      name: demoBusinessName,
      slug: demoBusinessSlug,
      pointsPerEuro: demoPointsPerEuro,
      // qrCodeExpirationMinutes: demoQrExpiration, // No existe en el schema
      tierSystemEnabled: true,
      tierCalculationBasis: TierCalculationBasis.SPEND,
      tierCalculationPeriodMonths: 0,
      tierDowngradePolicy: TierDowngradePolicy.PERIODIC_REVIEW,
      inactivityPeriodMonths: 6,
      isActive: true,
      isLoyaltyCoreActive: true,
      isCamareroActive: true,
      logoUrl: 'https://res.cloudinary.com/dq8e13lmr/image/upload/v1710860730/loyalpyme/assets/default_business_logo_vzg0sa.png',
      brandingColorPrimary: '#228BE6',
      brandingColorSecondary: '#495057',
    },
  });
  console.log(`[SEED] Upserted Demo Business: ${demoBusiness.name} (ID: ${demoBusiness.id})`);

  // --- 2. Crear Administrador para el Negocio de Demostración ---
  const adminEmail = 'admin@demo.com';
  const adminPassword = 'password';
  const hashedAdminPassword = await hashPassword(adminPassword);

  const demoAdmin = await prisma.user.upsert({
    where: { email: adminEmail },
    update: {
      password: hashedAdminPassword,
      name: 'Admin Demo',
      role: UserRole.BUSINESS_ADMIN,
      businessId: demoBusiness.id,
      isActive: true,
    },
    create: {
      email: adminEmail,
      password: hashedAdminPassword,
      name: 'Admin Demo',
      phone: '+34000000001',
      documentId: '00000001A',
      documentType: DocumentType.DNI,
      role: UserRole.BUSINESS_ADMIN,
      businessId: demoBusiness.id,
      isActive: true,
    },
  });
  console.log(`[SEED] Upserted Demo Admin: ${demoAdmin.email} (ID: ${demoAdmin.id})`);

  // --- 3. Crear Cliente de Prueba para el Negocio de Demostración ---
  const customerEmail = 'cliente@demo.com';
  const customerPassword = 'password';
  const hashedCustomerPassword = await hashPassword(customerPassword);

  const demoCustomer = await prisma.user.upsert({
    where: { email: customerEmail },
    update: {
      password: hashedCustomerPassword,
      name: 'Cliente Demo',
      role: UserRole.CUSTOMER_FINAL,
      businessId: demoBusiness.id,
      points: 150,
      totalSpend: 150.0,
      totalVisits: 3,
      lastActivityAt: new Date(),
      isActive: true,
    },
    create: {
      email: customerEmail,
      password: hashedCustomerPassword,
      name: 'Cliente Demo',
      phone: '+34000000002',
      documentId: '00000002B',
      documentType: DocumentType.DNI,
      role: UserRole.CUSTOMER_FINAL,
      businessId: demoBusiness.id,
      points: 150,
      totalSpend: 150.0,
      totalVisits: 3,
      lastActivityAt: new Date(),
      isActive: true,
    },
  });
  console.log(`[SEED] Upserted Demo Customer: ${demoCustomer.email} (ID: ${demoCustomer.id})`);

  // --- 4. (Opcional) Crear algunos Tiers para el Negocio Demo ---
  const tiersData = [
    { name: 'Bronce Demo', level: 1, minValue: 50, businessId: demoBusiness.id, benefitsDescription: 'Pequeños descuentos', description: 'Nivel inicial con beneficios básicos.' },
    { name: 'Plata Demo', level: 2, minValue: 200, businessId: demoBusiness.id, benefitsDescription: 'Descuentos y acceso prioritario', description: 'Nivel intermedio con mejores ventajas.' },
    { name: 'Oro Demo', level: 3, minValue: 500, businessId: demoBusiness.id, benefitsDescription: 'Grandes descuentos y regalos exclusivos', description: 'Nivel superior con los mejores beneficios.' },
  ];

  for (const tierData of tiersData) {
    const tier = await prisma.tier.upsert({
      where: { businessId_level: { businessId: tierData.businessId, level: tierData.level } },
      update: { name: tierData.name, minValue: tierData.minValue, description: tierData.description, benefitsDescription: tierData.benefitsDescription },
      create: tierData,
    });
    console.log(`[SEED] Upserted Tier: ${tier.name} for business ${demoBusiness.id}`);
  }

  // --- 5. (Opcional) Crear algunas Recompensas para el Negocio Demo ---
  const rewardsData = [
    { name_es: 'Café Gratis Demo', name_en: 'Free Coffee Demo', pointsCost: 50, businessId: demoBusiness.id, imageUrl: 'https://res.cloudinary.com/dq8e13lmr/image/upload/v1715178079/loyalpyme/rewards_development/default_reward_coffee_bkumw5.png' },
    { name_es: 'Descuento 10% Demo', name_en: '10% Discount Demo', pointsCost: 100, businessId: demoBusiness.id, isActive: true },
    { name_es: 'Postre Especial Demo', name_en: 'Special Dessert Demo', pointsCost: 150, businessId: demoBusiness.id, isActive: false },
  ];

  for (const rewardData of rewardsData) {
    const existingReward = await prisma.reward.findFirst({
      where: { name_es: rewardData.name_es, businessId: rewardData.businessId }
    });

    if (existingReward) {
      await prisma.reward.update({
        where: { id: existingReward.id },
        data: rewardData,
      });
      console.log(`[SEED] Updated Reward: ${rewardData.name_es} for business ${demoBusiness.id}`);
    } else {
      await prisma.reward.create({
        data: rewardData,
      });
      console.log(`[SEED] Created Reward: ${rewardData.name_es} for business ${demoBusiness.id}`);
    }
  }

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