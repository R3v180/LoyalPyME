// File: backend/src/routes/rewards.routes.ts
// Version: 1.1.0 (Add PATCH route for partial updates)

import { Router } from 'express';
// Importa las funciones del controlador de recompensas (sin cambios en importaciones)
import {
    createRewardHandler,
    getRewardsHandler,
    getRewardByIdHandler,
    updateRewardHandler, // Usaremos este mismo handler para PUT y PATCH por ahora
    deleteRewardHandler,
} from '../rewards/rewards.controller';

const router = Router(); // Crea una nueva instancia de Express Router

// NOTA: El middleware authenticateToken se aplicará a ESTE router
// en el archivo index.ts cuando lo montemos bajo /api

// --- Rutas para la gestion de recompensas ---

// POST /api/rewards - Crear nueva recompensa
router.post('/', createRewardHandler);

// GET /api/rewards - Obtener todas las recompensas del negocio
router.get('/', getRewardsHandler);

// GET /api/rewards/:id - Obtener una recompensa especifica por ID
router.get('/:id', getRewardByIdHandler);

// PUT /api/rewards/:id - Actualizar una recompensa completa (reemplazo)
router.put('/:id', updateRewardHandler);

// --- CAMBIO: Añadir ruta PATCH para actualizaciones parciales ---
// PATCH /api/rewards/:id - Actualizar parcialmente una recompensa (ej: activar/desactivar, editar nombre)
router.patch('/:id', updateRewardHandler);
// --- FIN CAMBIO ---

// DELETE /api/rewards/:id - Eliminar una recompensa
router.delete('/:id', deleteRewardHandler);

// Exporta el router para ser usado en el archivo principal de la aplicacion (index.ts)
export default router;

// End of File: backend/src/routes/rewards.routes.ts