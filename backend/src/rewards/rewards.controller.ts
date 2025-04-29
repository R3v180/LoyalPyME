// filename: backend/src/rewards/rewards.controller.ts
// Version: 1.1.1 (Fix encoding, remove meta-comments, add req.user checks)

import { Request, Response, NextFunction } from 'express'; // Add NextFunction
import { Prisma } from '@prisma/client';
import {
    createReward,
    findRewardsByBusiness,
    findRewardById,
    updateReward,
    deleteReward,
} from './rewards.service';

// DTOs
export interface CreateRewardDto {
    name: string;
    description?: string;
    pointsCost: number;
}

export interface UpdateRewardDto {
    name?: string;
    description?: string;
    pointsCost?: number;
    isActive?: boolean; // Campo opcional para activar/desactivar
}

/**
 * Handles creation of a new reward. POST /api/rewards
 */
export const createRewardHandler = async (req: Request, res: Response, next: NextFunction) => { // Added next
    // --- FIX: Check req.user ---
    if (!req.user || !req.user.businessId) {
        console.error("[REWARDS CTRL] Critical: User context missing in createRewardHandler.");
        return res.status(401).json({ message: "Usuario no autenticado o negocio no asociado." });
    }
    const businessId = req.user.businessId;
    // const role = req.user.role; // Role check is done by middleware in routes
    // --- FIN FIX ---

    const { name, description, pointsCost }: CreateRewardDto = req.body;

    if (!name || pointsCost === undefined || typeof pointsCost !== 'number' || pointsCost < 0) {
        return res.status(400).json({ message: 'Se requieren nombre y un coste en puntos válido.' }); // Corregido: válido
    }

    try {
        const newReward = await createReward({ name, description, pointsCost, businessId });
        res.status(201).json(newReward);
    } catch (error) {
        // Loguear el error completo en el servidor
        console.error('[REWARDS CTRL] Error creating reward:', error);
        // Si es un error conocido de Prisma (ej: violación de constraint), podríamos dar un 409 o 400
        if (error instanceof Prisma.PrismaClientKnownRequestError) {
             // Manejar errores específicos si es necesario, ej P2002 (unique constraint)
             // if (error.code === 'P2002') return res.status(409).json({ message: 'Ya existe una recompensa con ese nombre.' });
            return res.status(500).json({ message: 'Error de base de datos al crear la recompensa.' });
        }
        // Usar next para otros errores o errores genéricos 500
        next(new Error('Error del servidor al crear la recompensa.'));
    }
};

/**
 * Handles fetching all rewards for the authenticated business. GET /api/rewards
 */
export const getRewardsHandler = async (req: Request, res: Response, next: NextFunction) => { // Added next
     // --- FIX: Check req.user ---
     if (!req.user || !req.user.businessId) {
        console.error("[REWARDS CTRL] Critical: User context missing in getRewardsHandler.");
        return res.status(401).json({ message: "Usuario no autenticado o negocio no asociado." });
    }
    const businessId = req.user.businessId;
    // --- FIN FIX ---

    try {
        const rewards = await findRewardsByBusiness(businessId);
        res.status(200).json(rewards);
    } catch (error) {
        console.error('[REWARDS CTRL] Error fetching rewards:', error);
        next(new Error('Error del servidor al obtener recompensas.')); // Usar next
    }
};

/**
 * Handles fetching a single reward by ID. GET /api/rewards/:id
 */
export const getRewardByIdHandler = async (req: Request, res: Response, next: NextFunction) => { // Added next
     // --- FIX: Check req.user ---
     if (!req.user || !req.user.businessId) {
        console.error("[REWARDS CTRL] Critical: User context missing in getRewardByIdHandler.");
        return res.status(401).json({ message: "Usuario no autenticado o negocio no asociado." });
    }
    const businessId = req.user.businessId;
    // --- FIN FIX ---
    const rewardId = req.params.id;

    if (!rewardId) {
        return res.status(400).json({ message: 'Se requiere el ID de la recompensa en la URL.' });
    }

    try {
        const reward = await findRewardById(rewardId, businessId);
        if (!reward) {
            // Específico 404 Not Found
            return res.status(404).json({ message: 'Recompensa no encontrada o no pertenece a tu negocio.' });
        }
        res.status(200).json(reward);
    } catch (error) {
        console.error('[REWARDS CTRL] Error fetching reward by ID:', error);
        next(new Error('Error del servidor al obtener la recompensa por ID.')); // Usar next
    }
};


/**
 * Handles updating an existing reward (handles PUT and PATCH).
 * PUT/PATCH /api/rewards/:id
 */
export const updateRewardHandler = async (req: Request, res: Response, next: NextFunction) => { // Added next
     // --- FIX: Check req.user ---
     if (!req.user || !req.user.businessId) {
        console.error("[REWARDS CTRL] Critical: User context missing in updateRewardHandler.");
        return res.status(401).json({ message: "Usuario no autenticado o negocio no asociado." });
    }
    const businessId = req.user.businessId;
    // const role = req.user.role; // Role check is done by middleware in routes
    // --- FIN FIX ---
    const rewardId = req.params.id;
    const updateData: UpdateRewardDto = req.body;

    // Validaciones básicas
    if (!rewardId) {
        return res.status(400).json({ message: 'Se requiere el ID de la recompensa en la URL.' });
    }
    if (Object.keys(updateData).length === 0) {
        return res.status(400).json({ message: 'Se requieren datos de actualización en el cuerpo de la petición.' }); // Corregido: actualización, petición
    }
    // Validación específica para isActive
    if (updateData.isActive !== undefined && typeof updateData.isActive !== 'boolean') {
        return res.status(400).json({ message: 'El campo isActive debe ser un valor booleano (true o false).' }); // Corregido: booleano
    }
    // Podríamos añadir más validaciones si es necesario (ej: pointsCost >= 0)

    try {
        // Llamamos al servicio de actualización
        const updatedReward = await updateReward(rewardId, businessId, updateData);
        res.status(200).json(updatedReward);
    } catch (error) {
         // Loguear el error completo
         console.error('[REWARDS CTRL] Error updating reward:', error);
         // Manejar error específico del servicio (404)
         if (error instanceof Error && error.message.includes('no encontrada o no pertenece')) {
             return res.status(404).json({ message: error.message });
         }
         // Usar next para otros errores
         next(new Error('Error del servidor al actualizar la recompensa.'));
    }
};

/**
 * Handles deletion of an existing reward. DELETE /api/rewards/:id
 */
export const deleteRewardHandler = async (req: Request, res: Response, next: NextFunction) => { // Added next
     // --- FIX: Check req.user ---
     if (!req.user || !req.user.businessId) {
        console.error("[REWARDS CTRL] Critical: User context missing in deleteRewardHandler.");
        return res.status(401).json({ message: "Usuario no autenticado o negocio no asociado." });
    }
    const businessId = req.user.businessId;
    // const role = req.user.role; // Role check is done by middleware in routes
    // --- FIN FIX ---
    const rewardId = req.params.id;

    if (!rewardId) {
        return res.status(400).json({ message: 'Se requiere el ID de la recompensa en la URL.' });
    }

    try {
        const deletedReward = await deleteReward(rewardId, businessId);
        // Respondemos con un mensaje y el objeto eliminado
        res.status(200).json({ message: 'Recompensa eliminada con éxito.', deletedReward }); // Corregido: éxito
    } catch (error) {
        console.error('[REWARDS CTRL] Error deleting reward:', error);
        // Manejar error específico del servicio (404 si no existe, 409 si está en uso por FK)
        if (error instanceof Error && error.message.includes('no encontrada o no pertenece')) {
            return res.status(404).json({ message: error.message });
        }
        if (error instanceof Error && error.message.includes('siendo utilizada')) {
             return res.status(409).json({ message: error.message }); // 409 Conflict
        }
        // Usar next para otros errores
        next(new Error('Error del servidor al eliminar la recompensa.'));
    }
};

// End of File: backend/src/rewards/rewards.controller.ts