// filename: backend/src/uploads/uploads.controller.ts
// Version: 1.0.1 (Correct service import path)

import { Request, Response, NextFunction } from 'express';
// --- MODIFICADO: Importar desde 'uploads.service' (plural) ---
import { uploadImageToCloudinary } from './uploads.service';
// --- FIN MODIFICADO ---

/**
 * Maneja la subida de una imagen (generalmente para recompensas).
 * Espera que el middleware Multer (upload.single('image')) se haya ejecutado antes.
 */
export const handleImageUpload = async (req: Request, res: Response, next: NextFunction) => {
    console.log('[Upload CTRL] Received image upload request.');

    // Multer añade 'file' a la request
    if (!req.file) {
        console.error('[Upload CTRL] No file found in req.file. Check field name in client and Multer config.');
        // El campo en Multer y en RewardForm debe ser 'image' según código anterior
        return res.status(400).json({ message: 'No se recibió ningún archivo de imagen o el campo no es "image".' });
    }

    if (!req.file.buffer) {
        console.error('[Upload CTRL] File buffer is missing.');
        return res.status(500).json({ message: 'Error interno al procesar el archivo.' });
    }

    // Carpeta en Cloudinary
    const folderName = `loyalpyme/rewards_${process.env.NODE_ENV || 'development'}`;

    try {
        console.log(`[Upload CTRL] Uploading file ${req.file.originalname} (${(req.file.size / 1024).toFixed(1)} KB) to Cloudinary folder '${folderName}'...`);
        const imageUrl = await uploadImageToCloudinary(req.file.buffer, folderName);

        console.log(`[Upload CTRL] Image uploaded successfully. URL: ${imageUrl}`);
        // Devolver la URL (ajustado a como lo espera el form v2.1.0)
        res.status(200).json({
            // message: 'Imagen subida correctamente.', // El form no espera message
            url: imageUrl // El form espera 'url'
        });

    } catch (error) {
        console.error('[Upload CTRL] Error during image upload process:', error);
        next(error); // Pasar al manejador global
    }
};

// End of File: backend/src/uploads/uploads.controller.ts