// frontend/src/modules/loyalpyme/rewards/rewards.controller.ts
// Version 3.0.0 - REMOVED handlers for obsolete redeem/coupon flow.

import { Request, Response, NextFunction } from 'express';
import { RewardType, DiscountType } from '@prisma/client';

// --- SERVICE IMPORTS UPDATED ---
// Import only the CRUD services that are still in use.
import {
    createReward,
    findRewardsByBusiness,
    findRewardById,
    updateReward,
    deleteReward,
} from './rewards.service';

// --- DTOs (No change) ---
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

// --- CRUD HANDLERS (Remain for Admin Panel) ---

/**
 * Handles creation of a new reward.
 * POST /api/rewards
 */
export const createRewardHandler = async (req: Request, res: Response, next: NextFunction) => {
    if (!req.user || !req.user.businessId) {
        return res.status(401).json({ message: "Usuario no autenticado o negocio no asociado." });
    }
    
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


// --- HANDLERS OBSOLETOS (ELIMINADOS) ---

// La función `redeemRewardForLaterHandler` ha sido eliminada.
// La función `getAvailableRewardsHandler` ha sido eliminada.