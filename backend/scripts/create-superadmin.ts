// backend/scripts/create-superadmin.ts
/// <reference types="node" />

import { PrismaClient, UserRole } from '@prisma/client';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';

dotenv.config({ path: '../.env' });

const prisma = new PrismaClient();

async function hashPassword(password: string): Promise<string> {
  const salt = await bcrypt.genSalt(10);
  return bcrypt.hash(password, salt);
}

async function createOrUpdateSuperAdmin() { // Nombre de función cambiado para reflejar la acción
  console.log('[SUPERADMIN_SCRIPT] Iniciando creación/actualización de Super Admin...');

  const superAdminEmail = 'superadmin@loyalpyme.com';
  const superAdminPassword = 'superadminpassword'; // Asegúrate de que esta es la contraseña que quieres usar
  const superAdminName = 'Super Admin';

  try {
    const existingSuperAdmin = await prisma.user.findUnique({
      where: { email: superAdminEmail },
    });

    const hashedPassword = await hashPassword(superAdminPassword); // Hasheamos la contraseña deseada

    if (existingSuperAdmin) {
      console.log(`[SUPERADMIN_SCRIPT] El Super Admin con email ${superAdminEmail} ya existe. Actualizando su contraseña y rol si es necesario...`);
      await prisma.user.update({
        where: { email: superAdminEmail },
        data: {
            password: hashedPassword,
            role: UserRole.SUPER_ADMIN, // Asegurar que el rol es SUPER_ADMIN
            isActive: true,             // Asegurar que está activo
            name: superAdminName        // Actualizar nombre por si acaso
            // No tocamos businessId, debe seguir siendo null
        },
      });
      console.log(`[SUPERADMIN_SCRIPT] Datos del Super Admin actualizados (contraseña, rol, estado activo, nombre).`);
    } else {
      // Si no existe, crearlo
      const newSuperAdmin = await prisma.user.create({
        data: {
          email: superAdminEmail,
          password: hashedPassword,
          name: superAdminName,
          role: UserRole.SUPER_ADMIN,
          isActive: true,
        },
      });
      console.log(`[SUPERADMIN_SCRIPT] Super Admin creado exitosamente:`);
      console.log(`  ID: ${newSuperAdmin.id}`);
      console.log(`  Email: ${newSuperAdmin.email}`);
    }
    console.log(`  IMPORTANTE: La contraseña para ${superAdminEmail} está establecida a '${superAdminPassword}'. ¡Guárdala de forma segura!`);

  } catch (error) {
    console.error('[SUPERADMIN_SCRIPT] Error creando/actualizando el Super Admin:', error);
  } finally {
    await prisma.$disconnect();
    console.log('[SUPERADMIN_SCRIPT] Prisma client desconectado.');
  }
}

createOrUpdateSuperAdmin();