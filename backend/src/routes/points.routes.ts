// File: backend/src/routes/points.routes.ts
// Version: 1.0.0

import { Router } from 'express';
// Importa las funciones del controlador de puntos (generateQrHandler, validateQrHandler)
import { generateQrHandler, validateQrHandler } from '../points/points.controller';

const router = Router(); // Crea una nueva instancia de Express Router

// NOTA: El middleware authenticateToken ya se aplicó a TODAS las rutas bajo /api/*
// en el archivo index.ts. Estas rutas ya estan protegidas por autenticacion.
// TODO: Implementar middleware de roles para asegurar que solo el rol correcto accede a cada ruta

// --- Rutas para la gestion de puntos y QR ---

// Ruta para generar datos de QR (para BUSINESS_ADMIN)
// POST /api/points/generate-qr
// Requiere autenticacion JWT. Requiere BUSINESS_ADMIN role (pendiente middleware de rol).
router.post('/generate-qr', generateQrHandler);

// Ruta para validar un QR y asignar puntos (para CUSTOMER_FINAL)
// POST /api/points/validate-qr
// Requiere autenticacion JWT. Requiere CUSTOMER_FINAL role (pendiente middleware de rol).
router.post('/validate-qr', validateQrHandler);


// Puedes añadir mas rutas relacionadas con puntos aqui en el futuro, por ejemplo:
// router.get('/me', getCustomerPointsHandler); // GET /api/points/me - Obtener puntos del cliente autenticado
// router.post('/redeem-reward', redeemRewardHandler); // POST /api/points/redeem-reward - Canjear una recompensa

// Exporta este router para que pueda ser usado en el archivo principal de la aplicacion (index.ts)
export default router;

// End of File: backend/src/routes/points.routes.ts