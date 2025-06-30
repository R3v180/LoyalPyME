// backend/scripts/hash-customer-password.ts
import { PrismaClient } from '@prisma/client';
// --- RUTA CORREGIDA ---
import { hashPassword } from '../src/shared/auth/auth.service';

import dotenv from 'dotenv';
dotenv.config({ path: '.env' }); 

const prisma = new PrismaClient();

async function main() {
  const userEmailToUpdate = 'admin@cafeelsol.com';
  const plainPasswordToHash = 'superpasswordseguro';

  try {
    console.log(`[SCRIPT] Iniciando hash y actualizacion de contraseña para: ${userEmailToUpdate}`);
    const user = await prisma.user.findUnique({ where: { email: userEmailToUpdate } });
    if (!user) {
      console.error(`[SCRIPT] ERROR: Usuario no encontrado con el email: ${userEmailToUpdate}`);
      return;
    }
    const hashedPassword = await hashPassword(plainPasswordToHash);
    await prisma.user.update({ where: { id: user.id }, data: { password: hashedPassword } });
    console.log(`[SCRIPT] Usuario ${userEmailToUpdate} actualizado exitosamente.`);
  } catch (error: any) {
    console.error(`[SCRIPT] ERROR:`, error.message);
  } finally {
    await prisma.$disconnect();
  }
}

main();