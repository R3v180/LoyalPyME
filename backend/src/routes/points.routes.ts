// File: backend/src/routes/points.routes.ts
// Version: 1.2.0 (Apply Role Middleware)

import { Router } from 'express';
// --- CAMBIO: Importar checkRole y UserRole ---
import { checkRole } from '../middleware/role.middleware';
import { UserRole } from '@prisma/client';
// --- FIN CAMBIO ---
import { generateQrHandler, validateQrHandler, redeemRewardHandler } from '../points/points.controller';

const router = Router();

// NOTA: authenticateToken ya se aplicó globalmente a /api

// --- Rutas para la gestion de puntos y QR con Roles ---

// Ruta para generar datos de QR
// POST /api/points/generate-qr
// --- CAMBIO: Requiere rol BUSINESS_ADMIN ---
router.post('/generate-qr', checkRole([UserRole.BUSINESS_ADMIN]), generateQrHandler);
// --- FIN CAMBIO ---

// Ruta para validar un QR y asignar puntos
// POST /api/points/validate-qr
// --- CAMBIO: Requiere rol CUSTOMER_FINAL ---
router.post('/validate-qr', checkRole([UserRole.CUSTOMER_FINAL]), validateQrHandler);
// --- FIN CAMBIO ---

// Ruta para canjear una recompensa
// POST /api/points/redeem-reward/:rewardId
// --- CAMBIO: Requiere rol CUSTOMER_FINAL ---
router.post('/redeem-reward/:rewardId', checkRole([UserRole.CUSTOMER_FINAL]), redeemRewardHandler);
// --- FIN CAMBIO ---

export default router;

// End of File: backend/src/routes/points.routes.ts