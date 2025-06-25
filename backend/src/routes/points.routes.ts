// backend/src/routes/points.routes.ts (CORREGIDO)
import { Router } from 'express';
import { UserRole } from '@prisma/client';
// --- RUTAS CORREGIDAS ---
import { checkRole } from '../shared/middleware/role.middleware';
import { generateQrHandler, validateQrHandler, redeemRewardHandler } from '../modules/loyalpyme/points/points.controller';
// --- FIN RUTAS CORREGIDAS ---

const router = Router();

// Rutas para la gestión de puntos y QR con Roles
router.post('/generate-qr', checkRole([UserRole.BUSINESS_ADMIN]), generateQrHandler);
router.post('/validate-qr', checkRole([UserRole.CUSTOMER_FINAL]), validateQrHandler);
router.post('/redeem-reward/:rewardId', checkRole([UserRole.CUSTOMER_FINAL]), redeemRewardHandler);

export default router;