// filename: backend/src/routes/auth.routes.ts
// --- INICIO DEL CÓDIGO COMPLETO ---
// File: backend/src/routes/auth.routes.ts
// Version: 1.2.0 (Add register-business route)

import { Router } from 'express';
// *** CAMBIO: Importar el nuevo handler ***
import {
    register,
    login,
    forgotPasswordHandler,
    resetPasswordHandler,
    registerBusinessHandler // <-- Añadido
} from '../auth/auth.controller';

const router = Router();

// --- Rutas de autenticación ---

// Registro de Cliente (existente)
router.post('/register', register); // POST /auth/register

// Inicio de sesión (existente)
router.post('/login', login);       // POST /auth/login

// *** NUEVO: Ruta para Registro de Negocio ***
router.post('/register-business', registerBusinessHandler); // POST /auth/register-business

// Reseteo de contraseña (existentes)
router.post('/forgot-password', forgotPasswordHandler);         // POST /auth/forgot-password
router.post('/reset-password/:token', resetPasswordHandler); // POST /auth/reset-password/:token


export default router;

// End of File: backend/src/routes/auth.routes.ts
// --- FIN DEL CÓDIGO COMPLETO ---