// File: backend/src/routes/rewards.routes.ts
// Version: 1.0.0

import { Router } from 'express';
// Importa el middleware de autenticacion (lo usaremos directamente en index.ts para este router)
// import { authenticateToken } from '../middleware/auth.middleware';

// Importa las funciones del controlador de recompensas
import {
    createRewardHandler,
    getRewardsHandler,
    getRewardByIdHandler,
    updateRewardHandler,
    deleteRewardHandler,
} from '../rewards/rewards.controller';

const router = Router(); // Crea una nueva instancia de Express Router

// NOTA: El middleware authenticateToken se aplicará a ESTE router
// en el archivo index.ts cuando lo montemos bajo /api

// Rutas para la gestion de recompensas
router.post('/', createRewardHandler);             // POST /api/rewards - Crear nueva recompensa
router.get('/', getRewardsHandler);                // GET /api/rewards - Obtener todas las recompensas del negocio
router.get('/:id', getRewardByIdHandler);          // GET /api/rewards/:id - Obtener una recompensa especifica por ID
router.put('/:id', updateRewardHandler);           // PUT /api/rewards/:id - Actualizar una recompensa completa
router.delete('/:id', deleteRewardHandler);        // DELETE /api/rewards/:id - Eliminar una recompensa

// Considerar añadir PATCH para actualizacion parcial si es necesario en el futuro

// Exporta el router para ser usado en el archivo principal de la aplicacion (index.ts)
export default router;

// End of File: backend/src/routes/rewards.routes.ts