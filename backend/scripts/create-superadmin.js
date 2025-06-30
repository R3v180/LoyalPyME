"use strict";
// backend/scripts/create-superadmin.ts
/// <reference types="node" />
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("@prisma/client");
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config({ path: '../.env' });
const prisma = new client_1.PrismaClient();
async function hashPassword(password) {
    const salt = await bcryptjs_1.default.genSalt(10);
    return bcryptjs_1.default.hash(password, salt);
}
async function createOrUpdateSuperAdmin() {
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
                    role: client_1.UserRole.SUPER_ADMIN, // Asegurar que el rol es SUPER_ADMIN
                    isActive: true, // Asegurar que está activo
                    name: superAdminName // Actualizar nombre por si acaso
                    // No tocamos businessId, debe seguir siendo null
                },
            });
            console.log(`[SUPERADMIN_SCRIPT] Datos del Super Admin actualizados (contraseña, rol, estado activo, nombre).`);
        }
        else {
            // Si no existe, crearlo
            const newSuperAdmin = await prisma.user.create({
                data: {
                    email: superAdminEmail,
                    password: hashedPassword,
                    name: superAdminName,
                    role: client_1.UserRole.SUPER_ADMIN,
                    isActive: true,
                },
            });
            console.log(`[SUPERADMIN_SCRIPT] Super Admin creado exitosamente:`);
            console.log(`  ID: ${newSuperAdmin.id}`);
            console.log(`  Email: ${newSuperAdmin.email}`);
        }
        console.log(`  IMPORTANTE: La contraseña para ${superAdminEmail} está establecida a '${superAdminPassword}'. ¡Guárdala de forma segura!`);
    }
    catch (error) {
        console.error('[SUPERADMIN_SCRIPT] Error creando/actualizando el Super Admin:', error);
    }
    finally {
        await prisma.$disconnect();
        console.log('[SUPERADMIN_SCRIPT] Prisma client desconectado.');
    }
}
createOrUpdateSuperAdmin();
