// filename: backend/src/rewards/rewards.controller.ts
// Version: 1.3.0 (Adapt controller to use i18n reward fields)

import { Request, Response, NextFunction } from 'express';
import { Prisma } from '@prisma/client';
import {
    createReward,
    findRewardsByBusiness,
    findRewardById,
    updateReward,
    deleteReward,
    // Importar los tipos de datos necesarios del servicio si se definieron allí
    // o definirlos aquí/en un DTO
} from './rewards.service';

// --- DTOs ACTUALIZADOS ---
// DTO para la creación (ahora espera campos i18n)
export interface CreateRewardDto {
    name_es: string; // Obligatorio
    name_en: string; // Obligatorio
    description_es?: string | null;
    description_en?: string | null;
    pointsCost: number; // Obligatorio
    imageUrl?: string | null;
}

// DTO para la actualización (campos opcionales)
export interface UpdateRewardDto {
    name_es?: string;
    name_en?: string;
    description_es?: string | null;
    description_en?: string | null;
    pointsCost?: number;
    isActive?: boolean;
    imageUrl?: string | null;
}
// --- FIN DTOs ACTUALIZADOS ---


/**
 * Handles creation of a new reward.
 * POST /api/rewards
 */
export const createRewardHandler = async (req: Request, res: Response, next: NextFunction) => {
    if (!req.user || !req.user.businessId) {
        return res.status(401).json({ message: "Usuario no autenticado o negocio no asociado." });
    }
    const businessId = req.user.businessId;

    // --- CORRECCIÓN: Destructurar y validar campos i18n ---
    const {
        name_es, name_en, description_es, description_en, pointsCost, imageUrl
    }: CreateRewardDto = req.body;

    // Validación básica (mejorar con Zod si se desea)
    if (!name_es || typeof name_es !== 'string' || name_es.trim() === '') {
        return res.status(400).json({ message: 'Se requiere el nombre en español (name_es).' });
    }
     if (!name_en || typeof name_en !== 'string' || name_en.trim() === '') {
        return res.status(400).json({ message: 'Se requiere el nombre en inglés (name_en).' });
    }
    if (pointsCost === undefined || typeof pointsCost !== 'number' || pointsCost < 0) {
        return res.status(400).json({ message: 'Se requiere un coste en puntos válido (pointsCost).' });
    }
    // --- FIN CORRECCIÓN ---

    try {
        // --- CORRECCIÓN: Pasar campos i18n al servicio ---
        const newReward = await createReward({
            name_es: name_es.trim(), // <-- Pasar name_es
            name_en: name_en.trim(), // <-- Pasar name_en
            description_es: description_es?.trim() || null, // <-- Pasar description_es
            description_en: description_en?.trim() || null, // <-- Pasar description_en
            pointsCost, // Ya validado como número
            businessId,
            imageUrl // Puede ser null o undefined
        });
        // --- FIN CORRECCIÓN ---
        res.status(201).json(newReward); // Devuelve el objeto Reward completo (con todos los campos)
    } catch (error) {
        console.error('[REWARDS CTRL] Error creating reward:', error);
        if (error instanceof Prisma.PrismaClientKnownRequestError || error instanceof Error) {
            // Devolver 409 si es error de unicidad del servicio
            if (error.message.includes('unicidad') || error.message.includes('ya existen')) {
                 return res.status(409).json({ message: error.message });
            }
            // Para otros errores Prisma o genéricos, intentar devolver el mensaje
             return res.status(500).json({ message: error.message || 'Error de base de datos al crear la recompensa.' });
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
        // El servicio ya devuelve los campos correctos (name_es, name_en, etc.)
        const rewards = await findRewardsByBusiness(businessId);
        res.status(200).json(rewards); // rewards es ahora RewardListItem[]
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
        // El servicio devuelve el objeto Reward completo (con name_es, etc.)
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
    // --- CORRECCIÓN: Usar DTO actualizado y limpiar datos ---
    const updateInput: UpdateRewardDto = req.body;
    const updateData: UpdateRewardDto = {}; // Objeto limpio para pasar al servicio

    if (!rewardId) { return res.status(400).json({ message: 'Se requiere el ID de la recompensa en la URL.' }); }
    if (Object.keys(updateInput).length === 0) { return res.status(400).json({ message: 'Se requieren datos de actualización en el cuerpo de la petición.' }); }

    // Copiar y limpiar solo los campos válidos y definidos
    if (updateInput.name_es !== undefined) updateData.name_es = updateInput.name_es.trim();
    if (updateInput.name_en !== undefined) updateData.name_en = updateInput.name_en.trim();
    if (updateInput.description_es !== undefined) updateData.description_es = updateInput.description_es?.trim() || null;
    if (updateInput.description_en !== undefined) updateData.description_en = updateInput.description_en?.trim() || null;
    if (updateInput.pointsCost !== undefined) {
         if (typeof updateInput.pointsCost !== 'number' || updateInput.pointsCost < 0) { return res.status(400).json({ message: 'Si se actualiza, pointsCost debe ser un número >= 0.' }); }
         updateData.pointsCost = updateInput.pointsCost;
    }
    if (updateInput.isActive !== undefined) {
        if (typeof updateInput.isActive !== 'boolean') { return res.status(400).json({ message: 'El campo isActive debe ser un valor booleano (true o false).' }); }
        updateData.isActive = updateInput.isActive;
    }
    // Permitir enviar null para quitar la imagen
     if (updateInput.imageUrl !== undefined) {
         updateData.imageUrl = updateInput.imageUrl;
     }

     // Verificar si hay algo que actualizar después de limpiar
     if (Object.keys(updateData).length === 0) {
        return res.status(400).json({ message: 'No se proporcionaron datos válidos para actualizar.' });
     }
    // --- FIN CORRECCIÓN ---

    try {
        // Pasar los datos limpios y correctos al servicio
        const updatedReward = await updateReward(rewardId, businessId, updateData);
        res.status(200).json(updatedReward); // Devuelve el objeto completo actualizado
    } catch (error) {
         console.error('[REWARDS CTRL] Error updating reward:', error);
         if (error instanceof Error && error.message.includes('no encontrada o no pertenece')) { return res.status(404).json({ message: error.message }); }
         if (error instanceof Prisma.PrismaClientKnownRequestError || error instanceof Error) {
            // Devolver 409 si es error de unicidad del servicio
            if (error.message.includes('unicidad') || error.message.includes('ya existen')) {
                 return res.status(409).json({ message: error.message });
            }
            return res.status(500).json({ message: error.message || 'Error de base de datos al actualizar recompensa.' });
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
        // deleteReward ahora devuelve el objeto Reward completo (con name_es/en)
        const deletedReward = await deleteReward(rewardId, businessId);
        // Devolvemos el objeto borrado completo
        res.status(200).json({ message: 'Recompensa eliminada con éxito.', deletedReward });
    } catch (error) {
        console.error('[REWARDS CTRL] Error deleting reward:', error);
        if (error instanceof Error && error.message.includes('no encontrada o no pertenece')) { return res.status(404).json({ message: error.message }); }
        // El servicio ya lanza error específico si está en uso
        if (error instanceof Error && error.message.includes('siendo utilizada')) { return res.status(409).json({ message: error.message }); }
        // Otros errores
        if (error instanceof Prisma.PrismaClientKnownRequestError || error instanceof Error) { return res.status(500).json({ message: error.message || 'Error de base de datos al eliminar recompensa.' }); }
        next(new Error('Error del servidor al eliminar la recompensa.'));
    }
};

// End of File: backend/src/rewards/rewards.controller.ts