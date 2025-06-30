// backend/src/modules/loyalpyme/customer/profile.service.ts
import { PrismaClient, Prisma, User } from '@prisma/client';
import { hashPassword, comparePassword } from '../../../shared/auth/auth.service';
import { isValidPhoneNumber } from '../../../shared/utils/validation';

const prisma = new PrismaClient();

// Tipo para los datos que se pueden actualizar en el perfil
interface ProfileUpdateData {
    name?: string;
    phone?: string;
    imageUrl?: string;
}

/**
 * Actualiza los datos del perfil de un usuario en la base de datos.
 * Realiza validaciones de unicidad si es necesario.
 * @param userId - El ID del usuario a actualizar.
 * @param data - Los datos a actualizar.
 * @returns El objeto User actualizado (sin campos sensibles).
 */
export const updateUserProfile = async (
    userId: string,
    data: ProfileUpdateData
): Promise<Omit<User, 'password' | 'resetPasswordToken' | 'resetPasswordExpires'>> => {
    
    // --- CORRECCIÓN 1: Lógica de validación movida aquí, al servicio ---
    if (data.phone) {
        if (!isValidPhoneNumber(data.phone)) {
            throw new Error('El formato del número de teléfono no es válido.');
        }
        const existingUserWithPhone = await prisma.user.findFirst({
            where: { 
                phone: data.phone,
                id: { not: userId } // Asegurarse de que no es el propio usuario
            },
        });
        if (existingUserWithPhone) {
            throw new Error('El número de teléfono ya está en uso por otra cuenta.');
        }
    }
    // --- FIN CORRECCIÓN 1 ---
    
    try {
        // --- CORRECCIÓN 2: Asegurarse de que 'data' se pasa directamente ---
        // El objeto 'data' ya contiene los campos correctos ('name', 'phone', 'imageUrl')
        // que coinciden con el modelo de Prisma, por lo que se puede pasar directamente.
        const updatedUser = await prisma.user.update({
            where: { id: userId },
            data: data, // <-- ESTA ES LA CORRECCIÓN CLAVE
            select: {
                id: true, email: true, name: true, phone: true, documentId: true, documentType: true,
                role: true, points: true, totalSpend: true, totalVisits: true,
                currentTierId: true, isFavorite: true, isActive: true, imageUrl: true,
                createdAt: true, updatedAt: true, lastActivityAt: true, tierAchievedAt: true,
                businessId: true, adminNotes: true,
            }
        });
        console.log(`[PROFILE_SVC] Perfil del usuario ${userId} actualizado correctamente en la BD.`);
        return updatedUser;

    } catch (error) {
        if (error instanceof Prisma.PrismaClientKnownRequestError) {
            if (error.code === 'P2002') { // Error de unicidad
                const target = (error.meta?.target as string[]) || [];
                if (target.includes('phone')) {
                     throw new Error('El número de teléfono ya está registrado.');
                }
                throw new Error('Error de conflicto: Los datos proporcionados ya están en uso.');
            }
            if (error.code === 'P2025') { // Registro no encontrado
                 throw new Error(`Usuario con ID ${userId} no encontrado para actualizar.`);
            }
        }
        console.error(`[PROFILE_SVC] Error al actualizar el perfil del usuario ${userId}:`, error);
        throw new Error('Error de base de datos al actualizar el perfil.');
    }
};


/**
 * Cambia la contraseña de un usuario.
 * @param userId - El ID del usuario.
 * @param currentPassword - La contraseña actual para verificación.
 * @param newPassword - La nueva contraseña a establecer.
 */
export const changeUserPassword = async (
    userId: string,
    currentPassword: string,
    newPassword: string
): Promise<void> => {
    
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
        throw new Error('Usuario no encontrado.');
    }

    const isMatch = await comparePassword(currentPassword, user.password);
    if (!isMatch) {
        throw new Error('La contraseña actual es incorrecta.');
    }

    const hashedNewPassword = await hashPassword(newPassword);

    await prisma.user.update({
        where: { id: userId },
        data: { password: hashedNewPassword },
    });

    console.log(`[PROFILE_SVC] Contraseña del usuario ${userId} actualizada correctamente.`);
};