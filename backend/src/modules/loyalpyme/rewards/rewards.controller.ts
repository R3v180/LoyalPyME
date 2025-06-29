// backend/src/modules/loyalpyme/rewards/rewards.controller.ts
// Version: 2.0.0 - Implements handlers for the new "Redeem and Apply" flow.

import { Request, Response, NextFunction } from 'express';
import { Prisma, RewardType, DiscountType } from '@prisma/client';
import {
    createReward,
    findRewardsByBusiness,
    findRewardById,
    updateReward,
    deleteReward,
    redeemRewardForLater, // Importar el nuevo servicio
    getAvailableRewardsForUser, // Importar el nuevo servicio
} from './rewards.service';

// --- DTOs ACTUALIZADOS PARA EL FORMULARIO COMPLETO ---
export interface CreateRewardDto {
    name_es: string;
    name_en: string;
    description_es?: string | null;
    description_en?: string | null;
    pointsCost: number;
    imageUrl?: string | null;
    type: RewardType;
    discountType?: DiscountType | null;
    discountValue?: number;
    linkedMenuItemId?: string | null;
    kdsDestination?: string | null;
}

export type UpdateRewardDto = Partial<CreateRewardDto & { isActive?: boolean }>;
// --- FIN DTOs ---


/**
 * Handles creation of a new reward.
 * POST /api/rewards
 */
export const createRewardHandler = async (req: Request, res: Response, next: NextFunction) => {
    if (!req.user || !req.user.businessId) {
        return res.status(401).json({ message: "Usuario no autenticado o negocio no asociado." });
    }
    
    // La validación robusta se delega a Zod en el frontend.
    // Aquí se confía en que los datos llegan con la estructura correcta.
    const rewardData: CreateRewardDto = req.body;

    try {
        const newReward = await createReward({
            ...rewardData,
            businessId: req.user.businessId,
        });
        res.status(201).json(newReward);
    } catch (error) {
        console.error('[REWARDS CTRL] Error creating reward:', error);
        if (error instanceof Error) {
            // Devolver 409 si es error de unicidad del servicio
            if (error.message.includes('unicidad') || error.message.includes('ya existe')) {
                return res.status(409).json({ message: error.message });
            }
            return res.status(500).json({ message: error.message });
        }
        next(new Error('Error del servidor al crear la recompensa.'));
    }
};

/**
 * Handles fetching all rewards for the authenticated business.
 * GET /api/rewards
 */
export const getRewardsHandler = async (req: Request, res: Response, next: NextFunction) => {
     if (!req.user || !req.user.businessId) { return res.status(401).json({ message: "Usuario no autenticado o negocio no asociado." }); }
    const businessId = req.user.businessId;
    try {
        // findRewardsByBusiness ahora devuelve el objeto Reward completo
        const rewards = await findRewardsByBusiness(businessId);
        res.status(200).json(rewards);
    } catch (error) {
        console.error('[REWARDS CTRL] Error fetching rewards:', error);
        next(new Error('Error del servidor al obtener recompensas.'));
    }
};

/**
 * Handles fetching a single reward by ID.
 * GET /api/rewards/:id
 */
export const getRewardByIdHandler = async (req: Request, res: Response, next: NextFunction) => {
   if (!req.user || !req.user.businessId) { return res.status(401).json({ message: "Usuario no autenticado o negocio no asociado." }); }
    const businessId = req.user.businessId;
    const rewardId = req.params.id;
    if (!rewardId) { return res.status(400).json({ message: 'Se requiere el ID de la recompensa en la URL.' }); }
    try {
        const reward = await findRewardById(rewardId, businessId);
        if (!reward) { return res.status(404).json({ message: 'Recompensa no encontrada o no pertenece a tu negocio.' }); }
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
     if (!req.user || !req.user.businessId) { return res.status(401).json({ message: "Usuario no autenticado o negocio no asociado." }); }
    const businessId = req.user.businessId;
    const rewardId = req.params.id;
    const updateData: UpdateRewardDto = req.body;

    if (!rewardId) { return res.status(400).json({ message: 'Se requiere el ID de la recompensa en la URL.' }); }
    if (Object.keys(updateData).length === 0) { return res.status(400).json({ message: 'Se requieren datos de actualización.' }); }

    try {
        const updatedReward = await updateReward(rewardId, businessId, updateData);
        res.status(200).json(updatedReward);
    } catch (error) {
        console.error('[REWARDS CTRL] Error updating reward:', error);
        if (error instanceof Error) {
            if (error.message.includes('no encontrada')) { return res.status(404).json({ message: error.message }); }
            if (error.message.includes('unicidad')) { return res.status(409).json({ message: error.message }); }
            return res.status(500).json({ message: error.message });
        }
        next(new Error('Error del servidor al actualizar la recompensa.'));
    }
};

/**
 * Handles deletion of an existing reward. DELETE /api/rewards/:id
 */
export const deleteRewardHandler = async (req: Request, res: Response, next: NextFunction) => {
    if (!req.user || !req.user.businessId) { return res.status(401).json({ message: "Usuario no autenticado o negocio no asociado." }); }
    const businessId = req.user.businessId;
    const rewardId = req.params.id;
    if (!rewardId) { return res.status(400).json({ message: 'Se requiere el ID de la recompensa en la URL.' }); }
    try {
        const deletedReward = await deleteReward(rewardId, businessId);
        res.status(200).json({ message: 'Recompensa eliminada con éxito.', deletedReward });
    } catch (error) {
        console.error('[REWARDS CTRL] Error deleting reward:', error);
        if (error instanceof Error) {
            if (error.message.includes('no encontrada')) { return res.status(404).json({ message: error.message }); }
            if (error.message.includes('siendo utilizada')) { return res.status(409).json({ message: error.message }); }
            return res.status(500).json({ message: error.message });
        }
        next(new Error('Error del servidor al eliminar la recompensa.'));
    }
};


// --- NUEVOS HANDLERS PARA EL FLUJO "REDIMIR Y APLICAR" ---

/**
 * Handles the "acquisition" of a reward by a customer, turning points into an available coupon.
 * POST /api/rewards/:id/redeem
 */
export const redeemRewardForLaterHandler = async (req: Request, res: Response, next: NextFunction) => {
    // Solo los clientes finales pueden hacer esto
    if (!req.user || req.user.role !== 'CUSTOMER_FINAL') {
        return res.status(403).json({ message: "Acción no permitida." });
    }
    const userId = req.user.id;
    const rewardId = req.params.id;

    if (!rewardId) {
        return res.status(400).json({ message: 'Se requiere el ID de la recompensa en la URL.' });
    }

    try {
        const grantedReward = await redeemRewardForLater(userId, rewardId);
        res.status(200).json(grantedReward);
    } catch (error) {
        console.error(`[REWARDS CTRL] Error redeeming reward ${rewardId} for user ${userId}:`, error);
        if (error instanceof Error) {
            // Errores de negocio específicos del servicio (ej. "no tienes puntos")
            if (error.message.includes('puntos') || error.message.includes('activa')) {
                return res.status(400).json({ message: error.message });
            }
            return res.status(500).json({ message: error.message });
        }
        next(new Error('Error del servidor al adquirir la recompensa.'));
    }
};

/**
 * Handles fetching all available coupons (GrantedRewards) for the logged-in user.
 * GET /api/me/rewards/available
 */
export const getAvailableRewardsHandler = async (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
        return res.status(401).json({ message: "Usuario no autenticado." });
    }
    const userId = req.user.id;

    try {
        const availableRewards = await getAvailableRewardsForUser(userId);
        res.status(200).json(availableRewards);
    } catch (error) {
        console.error(`[REWARDS CTRL] Error fetching available rewards for user ${userId}:`, error);
        next(new Error('Error del servidor al obtener tus recompensas disponibles.'));
    }
};

// End of File