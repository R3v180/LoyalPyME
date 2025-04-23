// File: backend/src/routes/rewards.routes.ts
// Version: 1.2.0 (Apply Role Middleware for BUSINESS_ADMIN)

import { Router } from 'express';
// --- CAMBIO: Importar checkRole y UserRole ---
import { checkRole } from '../middleware/role.middleware';
import { UserRole } from '@prisma/client';
// --- FIN CAMBIO ---
import {
    createRewardHandler,
    getRewardsHandler,
    getRewardByIdHandler,
    updateRewardHandler,
    deleteRewardHandler,
} from '../rewards/rewards.controller';

const router = Router();

// --- Rutas para la gestion de recompensas ---
// TODAS estas rutas ahora requieren el rol BUSINESS_ADMIN

// POST /api/rewards - Crear nueva recompensa
// --- CAMBIO: Añadir middleware checkRole ---
router.post('/', checkRole([UserRole.BUSINESS_ADMIN]), createRewardHandler);
// --- FIN CAMBIO ---

// GET /api/rewards - Obtener todas las recompensas del negocio
// --- CAMBIO: Añadir middleware checkRole ---
// Aunque obtener podría ser para clientes también, lo restringimos a admin por ahora
// Más adelante podríamos tener una ruta pública o para clientes si fuera necesario
router.get('/', checkRole([UserRole.BUSINESS_ADMIN]), getRewardsHandler);
// --- FIN CAMBIO ---

// GET /api/rewards/:id - Obtener una recompensa especifica por ID
// --- CAMBIO: Añadir middleware checkRole ---
router.get('/:id', checkRole([UserRole.BUSINESS_ADMIN]), getRewardByIdHandler);
// --- FIN CAMBIO ---

// PUT /api/rewards/:id - Actualizar una recompensa completa (reemplazo)
// --- CAMBIO: Añadir middleware checkRole ---
router.put('/:id', checkRole([UserRole.BUSINESS_ADMIN]), updateRewardHandler);
// --- FIN CAMBIO ---

// PATCH /api/rewards/:id - Actualizar parcialmente una recompensa
// --- CAMBIO: Añadir middleware checkRole ---
router.patch('/:id', checkRole([UserRole.BUSINESS_ADMIN]), updateRewardHandler);
// --- FIN CAMBIO ---

// DELETE /api/rewards/:id - Eliminar una recompensa
// --- CAMBIO: Añadir middleware checkRole ---
router.delete('/:id', checkRole([UserRole.BUSINESS_ADMIN]), deleteRewardHandler);
// --- FIN CAMBIO ---

export default router;

// End of File: backend/src/routes/rewards.routes.ts