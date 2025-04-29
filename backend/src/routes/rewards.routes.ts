// filename: backend/src/routes/rewards.routes.ts
// Version: 1.2.1 (Remove meta-comments)

import { Router } from 'express';
// Importar checkRole y UserRole
import { checkRole } from '../middleware/role.middleware';
import { UserRole } from '@prisma/client';
// Importar handlers
import {
    createRewardHandler,
    getRewardsHandler,
    getRewardByIdHandler,
    updateRewardHandler,
    deleteRewardHandler,
} from '../rewards/rewards.controller';

const router = Router();

// --- Rutas para la gestion de recompensas ---
// TODAS estas rutas ahora requieren el rol BUSINESS_ADMIN (según checkRole aplicado)

// POST /api/rewards - Crear nueva recompensa
router.post('/', checkRole([UserRole.BUSINESS_ADMIN]), createRewardHandler);

// GET /api/rewards - Obtener todas las recompensas del negocio
// Aunque obtener podría ser para clientes también, lo restringimos a admin por ahora
// Más adelante podríamos tener una ruta pública o para clientes si fuera necesario
router.get('/', checkRole([UserRole.BUSINESS_ADMIN]), getRewardsHandler);

// GET /api/rewards/:id - Obtener una recompensa específica por ID
router.get('/:id', checkRole([UserRole.BUSINESS_ADMIN]), getRewardByIdHandler);

// PUT /api/rewards/:id - Actualizar una recompensa completa (reemplazo)
router.put('/:id', checkRole([UserRole.BUSINESS_ADMIN]), updateRewardHandler);

// PATCH /api/rewards/:id - Actualizar parcialmente una recompensa
router.patch('/:id', checkRole([UserRole.BUSINESS_ADMIN]), updateRewardHandler);

// DELETE /api/rewards/:id - Eliminar una recompensa
router.delete('/:id', checkRole([UserRole.BUSINESS_ADMIN]), deleteRewardHandler);

export default router;

// End of File: backend/src/routes/rewards.routes.ts