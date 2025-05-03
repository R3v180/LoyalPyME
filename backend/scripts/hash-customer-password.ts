// File: backend/scripts/hash-customer-password.ts
// MODIFIED: To target admin user and set correct password for tests

import { PrismaClient } from '@prisma/client';
// Importamos la funcion hashPassword de nuestro servicio de autenticacion
import { hashPassword } from '../src/auth/auth.service';

// Asegurarse de que las variables de entorno, incluida DATABASE_URL, esten cargadas
import dotenv from 'dotenv';
dotenv.config({ path: '.env' }); // Carga desde backend/.env

const prisma = new PrismaClient();

async function main() {
  // --- CONFIGURACION (MODIFICADA) ---
  const userEmailToUpdate = 'admin@cafeelsol.com'; // <-- Email del admin para los tests
  const plainPasswordToHash = 'superpasswordseguro';   // <-- Contraseña que usan los tests
  // --- FIN CONFIGURACION ---

  // --- LOGICA DEL SCRIPT ---
  try {
    console.log(`[SCRIPT] Iniciando hash y actualizacion de contraseña para: ${userEmailToUpdate}`);

    // 1. Buscar el usuario por email
    const user = await prisma.user.findUnique({
        where: { email: userEmailToUpdate },
        select: { id: true, email: true, password: true } // Seleccionar campos para verificacion
    });

    if (!user) {
        console.error(`[SCRIPT] ERROR: Usuario no encontrado con el email: ${userEmailToUpdate}`);
        console.error(`[SCRIPT] Asegúrate de haber registrado el negocio con este email primero.`);
        return; // Salir si el usuario no existe
    }

    console.log(`[SCRIPT] Usuario encontrado. ID: ${user.id}`);

    // 2. Hashear la contraseña plana
    console.log(`[SCRIPT] Hasheando la contraseña plana '${plainPasswordToHash}'...`);
    const hashedPassword = await hashPassword(plainPasswordToHash);
    console.log(`[SCRIPT] Contraseña hasheada (hash): ${hashedPassword.substring(0, 10)}...`);

    // 3. Actualizar el usuario en la base de datos con la contraseña hasheada
    console.log(`[SCRIPT] Actualizando usuario en la base de datos...`);
    const updatedUser = await prisma.user.update({
      where: { id: user.id }, // Actualizar por ID para mayor seguridad
      data: { password: hashedPassword },
      select: { id: true, email: true } // Seleccionar campos para confirmar actualizacion
    });
    console.log(`[SCRIPT] Usuario ${updatedUser.email} (${updatedUser.id}) actualizado exitosamente con contraseña hasheada.`);

  } catch (error: any) {
    console.error(`[SCRIPT] ERROR durante la ejecucion del script:`, error instanceof Error ? error.message : error);
  } finally {
    // Asegurar la desconexion de Prisma Client al finalizar el script
    await prisma.$disconnect();
    console.log('[SCRIPT] Prisma client desconectado.');
  }
}

// Ejecutar la funcion principal del script
main();