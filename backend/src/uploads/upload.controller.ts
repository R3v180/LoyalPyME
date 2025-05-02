// filename: backend/src/uploads/upload.controller.ts
// Version: 1.0.0 (Initial upload controller handler)

import { Request, Response, NextFunction } from 'express';
import { uploadImageToCloudinary } from './upload.service'; // Importar el servicio

/**
 * Maneja la subida de una imagen (generalmente para recompensas).
 * Espera que el middleware Multer (upload.single('imageField')) se haya ejecutado antes.
 */
export const handleImageUpload = async (req: Request, res: Response, next: NextFunction) => {
    console.log('[Upload CTRL] Received image upload request.');

    // Multer añade el objeto 'file' a la request si la subida fue exitosa
    if (!req.file) {
        console.error('[Upload CTRL] No file found in req.file. Multer did not process a file.');
        // Este error podría indicar que el frontend no envió el archivo con el nombre de campo correcto ('imageField')
        // O que el archivo fue rechazado por el fileFilter de Multer.
        // Devolvemos 400 Bad Request.
        return res.status(400).json({ message: 'No se recibió ningún archivo de imagen o el tipo no es válido.' });
    }

    // Verificar si el buffer existe (debería si req.file existe y usamos memoryStorage)
    if (!req.file.buffer) {
         console.error('[Upload CTRL] File buffer is missing.');
         return res.status(500).json({ message: 'Error interno al procesar el archivo.' });
    }

    // Definir la carpeta en Cloudinary (podría venir de config o ser específica)
    // Usamos un nombre que incluye el entorno para separar dev/prod en Cloudinary
    const folderName = `loyalpyme/rewards_${process.env.NODE_ENV || 'development'}`;

    try {
        console.log(`[Upload CTRL] Uploading file ${req.file.originalname} (${(req.file.size / 1024).toFixed(1)} KB) to Cloudinary folder '${folderName}'...`);
        // Llamar al servicio para subir la imagen
        const imageUrl = await uploadImageToCloudinary(req.file.buffer, folderName);

        console.log(`[Upload CTRL] Image uploaded successfully. URL: ${imageUrl}`);
        // Devolver la URL de la imagen subida
        res.status(200).json({
            message: 'Imagen subida correctamente.',
            imageUrl: imageUrl
        });

    } catch (error) {
        console.error('[Upload CTRL] Error during image upload process:', error);
        // Pasar el error al manejador global de errores
        next(error);
    }
};

// End of File: backend/src/uploads/upload.controller.ts