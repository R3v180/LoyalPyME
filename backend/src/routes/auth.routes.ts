// filename: backend/src/routes/auth.routes.ts
// Version: 1.3.0 (Update imports after controller refactoring)

import { Router } from 'express';

// --- CAMBIO: Importar handlers desde los controladores específicos ---
import { login } from '../auth/auth.controller';
import { register, registerBusinessHandler } from '../auth/registration.controller';
import { forgotPasswordHandler, resetPasswordHandler } from '../auth/password-reset.controller';
// --- FIN CAMBIO ---

const router = Router();

// --- Rutas de autenticación (sin cambios en las definiciones) ---

// Registro (usa registration.controller)
router.post('/register', register);
router.post('/register-business', registerBusinessHandler);

// Inicio de sesión (usa auth.controller)
router.post('/login', login);

// Reseteo de contraseña (usa password-reset.controller)
router.post('/forgot-password', forgotPasswordHandler);
router.post('/reset-password/:token', resetPasswordHandler);


export default router;

// End of File: backend/src/routes/auth.routes.ts