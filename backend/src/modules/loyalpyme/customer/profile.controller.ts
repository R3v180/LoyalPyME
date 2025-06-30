// backend/src/modules/loyalpyme/customer/profile.controller.ts
import { Request, Response, NextFunction } from 'express';
import * as profileService from './profile.service';
import { uploadImageToCloudinary } from '../../../shared/uploads/uploads.service';

interface UpdateProfileDto {
    name?: string;
    phone?: string;
}

interface ChangePasswordDto {
    currentPassword?: string;
    newPassword?: string;
}

export const getProfileHandler = (req: Request, res: Response) => {
    if (!req.user) {
        return res.status(401).json({ message: 'Usuario no autenticado.' });
    }
    res.status(200).json(req.user);
};

export const updateProfileHandler = async (req: Request, res: Response, next: NextFunction) => {
    const userId = req.user?.id;
    if (!userId) {
        return res.status(401).json({ message: 'Usuario no autenticado.' });
    }

    // --- CORRECCIÓN PRINCIPAL: Leer campos de texto desde req.body ---
    // Cuando se usa multer, los campos de texto del FormData están en req.body
    const { name, phone }: UpdateProfileDto = req.body;
    let imageUrl: string | undefined = undefined;

    try {
        if (req.file && req.file.buffer) {
            console.log(`[PROFILE_CTRL] Imagen de perfil recibida para user ${userId}. Subiendo a Cloudinary...`);
            const folderName = `loyalpyme/avatars/${process.env.NODE_ENV || 'development'}`;
            imageUrl = await uploadImageToCloudinary(req.file.buffer, folderName);
            console.log(`[PROFILE_CTRL] Imagen subida exitosamente. URL: ${imageUrl}`);
        }

        // Construir el objeto de datos a actualizar
        const updateData: { name?: string; phone?: string; imageUrl?: string } = {};
        
        // --- CORRECCIÓN: Usar los valores leídos de req.body ---
        if (name !== undefined) updateData.name = name;
        if (phone !== undefined) updateData.phone = phone;
        // --- FIN CORRECCIÓN ---
        
        if (imageUrl !== undefined) updateData.imageUrl = imageUrl;
        
        if (Object.keys(updateData).length === 0) {
            return res.status(400).json({ message: 'No se proporcionaron datos para actualizar.' });
        }

        // Llamar al servicio para actualizar la BD
        const updatedUser = await profileService.updateUserProfile(userId, updateData);

        res.status(200).json(updatedUser);

    } catch (error) {
        next(error);
    }
};

export const changePasswordHandler = async (req: Request, res: Response, next: NextFunction) => {
    const userId = req.user?.id;
    if (!userId) {
        return res.status(401).json({ message: 'Usuario no autenticado.' });
    }

    const { currentPassword, newPassword }: ChangePasswordDto = req.body;

    if (!currentPassword || !newPassword) {
        return res.status(400).json({ message: 'Se requieren la contraseña actual y la nueva contraseña.' });
    }
    if (newPassword.length < 6) {
        return res.status(400).json({ message: 'La nueva contraseña debe tener al menos 6 caracteres.' });
    }
    if (currentPassword === newPassword) {
        return res.status(400).json({ message: 'La nueva contraseña no puede ser igual a la actual.' });
    }

    try {
        await profileService.changeUserPassword(userId, currentPassword, newPassword);
        res.status(200).json({ message: 'Contraseña actualizada correctamente.' });
    } catch (error) {
        next(error);
    }
};