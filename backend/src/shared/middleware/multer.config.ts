// filename: backend/src/middleware/multer.config.ts
// Version: 1.0.0 (Initial Multer configuration for image uploads)

import multer, { FileFilterCallback } from 'multer';
import { Request } from 'express';

// Tipos de archivo permitidos (MIME types)
const ALLOWED_MIMETYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
// Límite de tamaño (ej. 5MB)
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5 MB in bytes

// Configuración de almacenamiento en memoria
const storage = multer.memoryStorage();

// Función de filtro de archivos
const fileFilter = (
    req: Request,
    file: Express.Multer.File,
    cb: FileFilterCallback
) => {
    console.log(`[Multer Filter] Checking file: ${file.originalname}, MIME type: ${file.mimetype}`);
    if (ALLOWED_MIMETYPES.includes(file.mimetype)) {
        // Aceptar el archivo
        console.log(`[Multer Filter] File type ${file.mimetype} accepted.`);
        cb(null, true);
    } else {
        // Rechazar el archivo
        console.warn(`[Multer Filter] File type ${file.mimetype} rejected.`);
        // Pasamos un error para que pueda ser manejado por el controlador/manejador de errores
        cb(new Error('Tipo de archivo no permitido. Solo se aceptan imágenes (jpeg, png, webp, gif).'));
        // Alternativa: cb(null, false); // Simplemente rechaza sin error explícito
    }
};

// Crear la instancia de Multer configurada
const upload = multer({
    storage: storage,
    fileFilter: fileFilter,
    limits: {
        fileSize: MAX_FILE_SIZE, // Límite de 5MB
    },
});

// Exportar la instancia configurada (específicamente para manejar un solo archivo llamado 'image')
// Usaremos upload.single('imageField') en la ruta. El nombre 'imageField' debe coincidir
// con el nombre del campo que envía el frontend en el FormData.
// Exportamos la instancia base para usarla en la ruta.
export default upload;

// End of File: backend/src/middleware/multer.config.ts