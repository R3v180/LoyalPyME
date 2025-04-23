// File: backend/src/routes/auth.routes.ts
// Version: 1.1.0 (Add forgot/reset password routes)

import { Router } from 'express';
// --- CAMBIO: Importar nuevos handlers (a crear en controller) ---
import { register, login, forgotPasswordHandler, resetPasswordHandler } from '../auth/auth.controller';
// --- FIN CAMBIO ---

const router = Router();

// Rutas de autenticación existentes
router.post('/register', register);
router.post('/login', login);

// --- CAMBIO: Añadir nuevas rutas ---
// Ruta para solicitar el reseteo de contraseña
router.post('/forgot-password', forgotPasswordHandler);

// Ruta para establecer la nueva contraseña usando el token
// El token vendrá como parámetro en la URL
router.post('/reset-password/:token', resetPasswordHandler);
// --- FIN CAMBIO ---


export default router;

// End of File: backend/src/routes/auth.routes.ts