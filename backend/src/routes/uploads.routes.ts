// filename: backend/src/routes/uploads.routes.ts
// Version: 1.0.1 (Fix Multer import syntax)

import { Router } from 'express';
import { handleImageUpload } from '../uploads/uploads.controller'; // Dejamos esta como está por ahora
// --- MODIFICADO: Cambiar sintaxis de importación de Multer ---
import uploadImageMemory from '../middleware/multer.config'; // Importar por defecto
// --- FIN MODIFICADO ---

const uploadsRouter = Router();

// Ruta para subir imágenes (POST /image -> resultará en /api/uploads/image)
uploadsRouter.post(
    '/image',
    // Usar el middleware importado por defecto
    uploadImageMemory.single('image'),
    handleImageUpload
);

export default uploadsRouter;