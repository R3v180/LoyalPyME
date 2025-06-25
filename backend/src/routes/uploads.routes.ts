// backend/src/routes/uploads.routes.ts (CORREGIDO)
import { Router } from 'express';
// --- RUTAS CORREGIDAS ---
import { handleImageUpload } from '../shared/uploads/uploads.controller';
import uploadImageMemory from '../shared/middleware/multer.config';
// --- FIN RUTAS CORREGIDAS ---

const uploadsRouter = Router();

// Ruta para subir imágenes
uploadsRouter.post(
    '/image',
    uploadImageMemory.single('image'),
    handleImageUpload
);

export default uploadsRouter;