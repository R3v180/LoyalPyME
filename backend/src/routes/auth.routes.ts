// backend/src/routes/auth.routes.ts (CORREGIDO)

import { Router } from 'express';

// --- RUTAS CORREGIDAS ---
import { login } from '../shared/auth/auth.controller';
import { register, registerBusinessHandler } from '../shared/auth/registration.controller';
import { forgotPasswordHandler, resetPasswordHandler } from '../shared/auth/password-reset.controller';
// --- FIN RUTAS CORREGIDAS ---

const router = Router();

// --- Rutas de autenticación (sin cambios en la lógica) ---
router.post('/register', register);
router.post('/register-business', registerBusinessHandler);
router.post('/login', login);
router.post('/forgot-password', forgotPasswordHandler);
router.post('/reset-password/:token', resetPasswordHandler);

export default router;