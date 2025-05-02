// filename: backend/src/rewards/rewards.controller.ts
// Version: 1.2.0 (Fix: Pass imageUrl from body to service)

import { Request, Response, NextFunction } from 'express';
import { Prisma } from '@prisma/client';
import {
    createReward,
    findRewardsByBusiness,
    findRewardById,
    updateReward, // Asegúrate que updateReward se importa
    deleteReward,
} from './rewards.service';

// DTOs (sin cambios)
export interface CreateRewardDto {
    name: string;
    description?: string;
    pointsCost: number;
    imageUrl?: string | null; // <-- Incluir imageUrl aquí también es buena práctica
}

export interface UpdateRewardDto {
    name?: string;
    description?: string;
    pointsCost?: number;
    isActive?: boolean;
    imageUrl?: string | null; // <-- Ya estaba aquí
}

/**
 * Handles creation of a new reward.
 * POST /api/rewards
 */
export const createRewardHandler = async (req: Request, res: Response, next: NextFunction) => {
    if (!req.user || !req.user.businessId) {
        // ... (check sin cambios) ...
        return res.status(401).json({ message: "Usuario no autenticado o negocio no asociado." });
    }
    const businessId = req.user.businessId;

    // --- CORRECCIÓN: Extraer imageUrl del body ---
    const { name, description, pointsCost, imageUrl }: CreateRewardDto = req.body;
    // --- FIN CORRECCIÓN ---

    if (!name || pointsCost === undefined || typeof pointsCost !== 'number' || pointsCost < 0) {
        // ... (validación sin cambios) ...
        return res.status(400).json({ message: 'Se requieren nombre y un coste en puntos válido.' });
    }

    try {
        // --- CORRECCIÓN: Pasar imageUrl al servicio ---
        const newReward = await createReward({
            name,
            description,
            pointsCost,
            businessId,
            imageUrl // <-- Pasarlo aquí
        });
        // --- FIN CORRECCIÓN ---
        res.status(201).json(newReward);
    } catch (error) {
        // ... (manejo de errores sin cambios) ...
        console.error('[REWARDS CTRL] Error creating reward:', error);
        if (error instanceof Prisma.PrismaClientKnownRequestError) {
             if (error.code === 'P2002') return res.status(409).json({ message: `Ya existe una recompensa con el nombre "${name}" para este negocio.` });
             return res.status(500).json({ message: 'Error de base de datos al crear la recompensa.' });
        }
        next(new Error('Error del servidor al crear la recompensa.'));
    }
};

/**
 * Handles fetching all rewards for the authenticated business.
 * GET /api/rewards
 */
export const getRewardsHandler = async (req: Request, res: Response, next: NextFunction) => {
    // ... (código sin cambios) ...
     if (!req.user || !req.user.businessId) {
        return res.status(401).json({ message: "Usuario no autenticado o negocio no asociado." });
    }
    const businessId = req.user.businessId;
    try {
        const rewards = await findRewardsByBusiness(businessId);
        res.status(200).json(rewards);
    } catch (error) {
        console.error('[REWARDS CTRL] Error fetching rewards:', error);
        next(new Error('Error del servidor al obtener recompensas.'));
    }
};

/**
 * Handles fetching a single reward by ID. GET /api/rewards/:id
 */
export const getRewardByIdHandler = async (req: Request, res: Response, next: NextFunction) => {
   // ... (código sin cambios) ...
    if (!req.user || !req.user.businessId) {
        return res.status(401).json({ message: "Usuario no autenticado o negocio no asociado." });
    }
    const businessId = req.user.businessId;
    const rewardId = req.params.id;
    if (!rewardId) {
        return res.status(400).json({ message: 'Se requiere el ID de la recompensa en la URL.' });
    }
    try {
        const reward = await findRewardById(rewardId, businessId);
        if (!reward) {
            return res.status(404).json({ message: 'Recompensa no encontrada o no pertenece a tu negocio.' });
        }
        res.status(200).json(reward);
    } catch (error) {
        console.error('[REWARDS CTRL] Error fetching reward by ID:', error);
        next(new Error('Error del servidor al obtener la recompensa por ID.'));
    }
};

/**
 * Handles updating an existing reward (handles PUT and PATCH).
 * PUT/PATCH /api/rewards/:id
 */
export const updateRewardHandler = async (req: Request, res: Response, next: NextFunction) => {
     if (!req.user || !req.user.businessId) {
        // ... (check sin cambios) ...
         return res.status(401).json({ message: "Usuario no autenticado o negocio no asociado." });
    }
    const businessId = req.user.businessId;
    const rewardId = req.params.id;
    // --- BUENA PRÁCTICA: Usar el tipo UpdateRewardDto ---
    const updateData: UpdateRewardDto = req.body;
    // --- FIN BUENA PRÁCTICA ---

    if (!rewardId) {
        // ... (validación sin cambios) ...
        return res.status(400).json({ message: 'Se requiere el ID de la recompensa en la URL.' });
    }
    if (Object.keys(updateData).length === 0) {
        // ... (validación sin cambios) ...
        return res.status(400).json({ message: 'Se requieren datos de actualización en el cuerpo de la petición.' });
    }
    // Validaciones específicas (como isActive boolean) se mantienen bien
    if (updateData.isActive !== undefined && typeof updateData.isActive !== 'boolean') {
        return res.status(400).json({ message: 'El campo isActive debe ser un valor booleano (true o false).' });
    }
    // Podríamos añadir validación para pointsCost si se envía en updateData
     if (updateData.pointsCost !== undefined && (typeof updateData.pointsCost !== 'number' || updateData.pointsCost < 0)) {
        return res.status(400).json({ message: 'Si se actualiza, pointsCost debe ser un número >= 0.' });
    }

    try {
        // El servicio updateReward ya acepta UpdateRewardData (que incluye imageUrl)
        // y como pasamos updateData directamente, imageUrl se pasará si viene en el body.
        const updatedReward = await updateReward(rewardId, businessId, updateData);
        res.status(200).json(updatedReward);
    } catch (error) {
         // ... (manejo de errores sin cambios) ...
         console.error('[REWARDS CTRL] Error updating reward:', error);
         if (error instanceof Error && error.message.includes('no encontrada o no pertenece')) {
             return res.status(404).json({ message: error.message });
         }
        if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
            return res.status(409).json({ message: `Ya existe otra recompensa con el nombre "${updateData.name}" para este negocio.` });
        }
         next(new Error('Error del servidor al actualizar la recompensa.'));
    }
};

/**
 * Handles deletion of an existing reward. DELETE /api/rewards/:id
 */
export const deleteRewardHandler = async (req: Request, res: Response, next: NextFunction) => {
   // ... (código sin cambios) ...
    if (!req.user || !req.user.businessId) {
        return res.status(401).json({ message: "Usuario no autenticado o negocio no asociado." });
    }
    const businessId = req.user.businessId;
    const rewardId = req.params.id;
    if (!rewardId) {
        return res.status(400).json({ message: 'Se requiere el ID de la recompensa en la URL.' });
    }
    try {
        const deletedReward = await deleteReward(rewardId, businessId);
        res.status(200).json({ message: 'Recompensa eliminada con éxito.', deletedReward });
    } catch (error) {
        // ... (manejo de errores sin cambios) ...
        console.error('[REWARDS CTRL] Error deleting reward:', error);
        if (error instanceof Error && error.message.includes('no encontrada o no pertenece')) {
            return res.status(404).json({ message: error.message });
        }
        if (error instanceof Error && error.message.includes('siendo utilizada')) {
             return res.status(409).json({ message: error.message });
        }
        next(new Error('Error del servidor al eliminar la recompensa.'));
    }
};

// End of File: backend/src/rewards/rewards.controller.ts