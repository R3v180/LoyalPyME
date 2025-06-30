// backend/src/routes/protected.routes.ts
import { Router } from 'express';

// Se importan los handlers del controlador de perfil
import {
    getProfileHandler,
    updateProfileHandler,
    changePasswordHandler
} from '../modules/loyalpyme/customer/profile.controller';

// --- CORRECCIÓN: Importar el middleware de multer ---
import uploadImageMemory from '../shared/middleware/multer.config';

const router = Router();

// El middleware de autenticación ya se aplica antes de montar este router

// GET /api/profile (sin cambios)
router.get('/', getProfileHandler);

// --- CORRECCIÓN: Aplicar el middleware de multer a la ruta PUT ---
// Ahora, esta ruta aceptará un campo de formulario llamado 'profileImage'
router.put(
    '/',
    uploadImageMemory.single('profileImage'), // 'profileImage' debe coincidir con el nombre del campo en el FormData del frontend
    updateProfileHandler
);
// --- FIN DE LA CORRECCIÓN ---

// POST /api/profile/change-password (sin cambios)
router.post('/change-password', changePasswordHandler);

export default router;