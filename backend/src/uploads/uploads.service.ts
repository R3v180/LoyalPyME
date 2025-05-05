// filename: backend/src/uploads/upload.service.ts
// Version: 1.0.0 (CORRECTED - Standard Cloudinary upload service with folder)

import cloudinary from '../utils/cloudinary.config'; // Importa config estándar (lee .env)
import streamifier from 'streamifier';
import { UploadApiResponse, UploadApiErrorResponse } from 'cloudinary';

// --- ASEGÚRATE DE QUE LA FIRMA DE LA FUNCIÓN ESTÉ ASÍ ---
export const uploadImageToCloudinary = (
    fileBuffer: Buffer,      // <-- Parámetro para el buffer
    folderName: string       // <-- Parámetro para la carpeta
): Promise<string> => {
// --- FIN FIRMA ---

    return new Promise((resolve, reject) => {
        // Usamos folderName en el log
        console.log(`[Upload SVC] Attempting to upload image buffer to Cloudinary folder: ${folderName}`);

        const uploadStream = cloudinary.uploader.upload_stream(
            {
                folder: folderName, // <-- Usamos el parámetro folderName
                resource_type: 'image',
            },
            (error: UploadApiErrorResponse | undefined, result: UploadApiResponse | undefined) => {
                if (error) {
                    console.error('[Upload SVC] Cloudinary upload failed:', error);
                    // Usar un mensaje genérico o el específico de Cloudinary
                    reject(new Error(`Error al subir imagen a Cloudinary: ${error.message}`));
                } else if (result) {
                    console.log(`[Upload SVC] Cloudinary upload successful! Secure URL: ${result.secure_url}`);
                    resolve(result.secure_url); // Devuelve la URL segura
                } else {
                    // Caso improbable
                    console.error('[Upload SVC] Cloudinary upload stream finished without error or result.');
                    reject(new Error('La subida a Cloudinary finalizó sin resultado ni error.'));
                }
            }
        );
        // Usamos fileBuffer para crear el stream de lectura
        streamifier.createReadStream(fileBuffer).pipe(uploadStream);
    });
}; // <-- Asegúrate que la llave de cierre de la función está

// End of File: backend/src/uploads/upload.service.ts