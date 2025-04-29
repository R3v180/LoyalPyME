// filename: backend/src/routes/points.routes.ts
// Version: 1.2.1 (Remove meta-comments)

import { Router } from 'express';
// Importar checkRole y UserRole
import { checkRole } from '../middleware/role.middleware';
import { UserRole } from '@prisma/client';
// Importar handlers
import { generateQrHandler, validateQrHandler, redeemRewardHandler } from '../points/points.controller';

const router = Router();

// NOTA: authenticateToken ya se aplicó globalmente a /api en index.ts

// --- Rutas para la gestión de puntos y QR con Roles ---

// Ruta para generar datos de QR
// POST /api/points/generate-qr
// Requiere rol BUSINESS_ADMIN
router.post('/generate-qr', checkRole([UserRole.BUSINESS_ADMIN]), generateQrHandler);

// Ruta para validar un QR y asignar puntos
// POST /api/points/validate-qr
// Requiere rol CUSTOMER_FINAL
router.post('/validate-qr', checkRole([UserRole.CUSTOMER_FINAL]), validateQrHandler);

// Ruta para canjear una recompensa usando puntos
// POST /api/points/redeem-reward/:rewardId
// Requiere rol CUSTOMER_FINAL
router.post('/redeem-reward/:rewardId', checkRole([UserRole.CUSTOMER_FINAL]), redeemRewardHandler);


export default router;

// End of File: backend/src/routes/points.routes.ts