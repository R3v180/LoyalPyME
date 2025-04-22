// File: backend/scripts/hash-customer-password.ts
// Este script hashea la contraseña de un usuario cliente y actualiza la base de datos.
// Se usa solo para corregir la contraseña del usuario creado manualmente en pgAdmin.

import { PrismaClient } from '@prisma/client';
// Importamos la funcion hashPassword de nuestro servicio de autenticacion
import { hashPassword } from '../src/auth/auth.service';

// Asegurarse de que las variables de entorno, incluida DATABASE_URL, esten cargadas
import dotenv from 'dotenv';
dotenv.config({ path: '.env' });


const prisma = new PrismaClient();

async function main() {
  // --- CONFIGURACION ---
  const userEmailToUpdate = 'cliente@cafeelsol.com'; // <-- Email del usuario cliente creado en pgAdmin
  const plainPasswordToHash = 'clientepass';        // <-- Contraseña PLANA usada en pgAdmin

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
        return; // Salir si el usuario no existe
    }

    console.log(`[SCRIPT] Usuario encontrado. ID: ${user.id}`);
    // console.log(`[SCRIPT] Contraseña actual (plaintext): ${user.password}`); // No loggear contraseñas reales!


    // 2. Hashear la contraseña plana
    console.log(`[SCRIPT] Hashing la contraseña plana...`);
    const hashedPassword = await hashPassword(plainPasswordToHash);
    console.log(`[SCRIPT] Contraseña hasheada (hash): ${hashedPassword.substring(0, 10)}...`); // Loggear solo el inicio del hash


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