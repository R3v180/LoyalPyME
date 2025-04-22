// File: backend/src/routes/auth.routes.ts
// Version: 1.0.0

import { Router } from 'express';
import { register, login } from '../auth/auth.controller'; // Importa las funciones del controlador de autenticacion

const router = Router(); // Crea una nueva instancia de Express Router

// Define las rutas de autenticación
router.post('/register', register); // Ruta POST para el registro de usuarios, manejada por la funcion register
router.post('/login', login);       // Ruta POST para el inicio de sesion, manejada por la funcion login

// Exporta el router para ser usado en el archivo principal de la aplicacion (index.ts)
export default router;

// End of File: backend/src/routes/auth.routes.ts