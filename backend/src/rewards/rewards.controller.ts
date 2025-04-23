// File: backend/src/rewards/rewards.controller.ts
// Version: 1.1.0 (Allow isActive in UpdateRewardDto)

import { Request, Response } from 'express';
import { Prisma } from '@prisma/client';
import {
    createReward,
    findRewardsByBusiness,
    findRewardById,
    updateReward,
    deleteReward,
} from './rewards.service';

// DTO para crear una recompensa (POST /rewards) - Sin cambios
export interface CreateRewardDto {
    name: string;
    description?: string;
    pointsCost: number;
}

// --- CAMBIO: Añadir isActive al DTO de actualización ---
// DTO para actualizar una recompensa (PUT/PATCH /rewards/:id)
export interface UpdateRewardDto {
    name?: string;
    description?: string;
    pointsCost?: number;
    isActive?: boolean; // <-- Añadido campo opcional
}
// --- FIN CAMBIO ---

/**
 * Handles creation of a new reward. POST /api/rewards
 * (No cambios aquí)
 */
export const createRewardHandler = async (req: Request, res: Response) => {
    const businessId = req.user?.businessId;
    const role = req.user?.role; // TODO: Add role check (BUSINESS_ADMIN)

    if (!req.user || !businessId) {
        return res.status(401).json({ message: 'Usuario no autenticado o negocio no asociado.' }); // Traducido
    }
    // TODO: Implementar middleware o chequeo de rol 'BUSINESS_ADMIN' aquí

    const { name, description, pointsCost }: CreateRewardDto = req.body;

    if (!name || pointsCost === undefined || pointsCost < 0) {
         return res.status(400).json({ message: 'Se requieren nombre y un coste en puntos válido.' }); // Traducido
    }

    try {
        const newReward = await createReward({ name, description, pointsCost, businessId });
        res.status(201).json(newReward);
    } catch (error) {
         if (error instanceof Prisma.PrismaClientKnownRequestError) {
             console.error('Prisma error creating reward:', error);
             return res.status(500).json({ message: 'Error de base de datos al crear la recompensa.' }); // Traducido
         }
        console.error('Error creating reward:', error);
        res.status(500).json({ message: 'Error del servidor al crear la recompensa.' }); // Traducido
    }
};

/**
 * Handles fetching all rewards for the authenticated business. GET /api/rewards
 * (No cambios aquí)
 */
export const getRewardsHandler = async (req: Request, res: Response) => {
    const businessId = req.user?.businessId;

    if (!req.user || !businessId) {
         return res.status(401).json({ message: 'Usuario no autenticado o negocio no asociado.' }); // Traducido
    }

    try {
        const rewards = await findRewardsByBusiness(businessId);
        res.status(200).json(rewards);
    } catch (error) {
         if (error instanceof Prisma.PrismaClientKnownRequestError) {
             console.error('Prisma error fetching rewards:', error);
             return res.status(500).json({ message: 'Error de base de datos al obtener recompensas.' }); // Traducido
         }
        console.error('Error fetching rewards:', error);
        res.status(500).json({ message: 'Error del servidor al obtener recompensas.' }); // Traducido
    }
};

/**
 * Handles fetching a single reward by ID. GET /api/rewards/:id
 * (No cambios aquí)
 */
export const getRewardByIdHandler = async (req: Request, res: Response) => {
    const businessId = req.user?.businessId;
    const rewardId = req.params.id;

    if (!req.user || !businessId) {
         return res.status(401).json({ message: 'Usuario no autenticado o negocio no asociado.' }); // Traducido
    }
    if (!rewardId) {
        return res.status(400).json({ message: 'Se requiere el ID de la recompensa en la URL.' }); // Traducido
    }

    try {
        const reward = await findRewardById(rewardId, businessId);
        if (!reward) {
            return res.status(404).json({ message: 'Recompensa no encontrada o no pertenece a tu negocio.' }); // Traducido
        }
        res.status(200).json(reward);
    } catch (error) {
         if (error instanceof Prisma.PrismaClientKnownRequestError) {
             console.error('Prisma error fetching reward by ID:', error);
             return res.status(500).json({ message: 'Error de base de datos al obtener la recompensa por ID.' }); // Traducido
         }
        console.error('Error fetching reward by ID:', error);
        res.status(500).json({ message: 'Error del servidor al obtener la recompensa por ID.' }); // Traducido
    }
};


/**
 * Handles updating an existing reward (handles PUT and PATCH).
 * PUT/PATCH /api/rewards/:id
 */
export const updateRewardHandler = async (req: Request, res: Response) => {
    const businessId = req.user?.businessId;
    const rewardId = req.params.id;
    const updateData: UpdateRewardDto = req.body; // Ahora incluye isActive opcional
    const role = req.user?.role; // TODO: Add role check (BUSINESS_ADMIN)


    // Validaciones básicas
    if (!req.user || !businessId) {
         return res.status(401).json({ message: 'Usuario no autenticado o negocio no asociado.' }); // Traducido
    }
     // TODO: Implementar middleware o chequeo de rol 'BUSINESS_ADMIN' aquí
     if (!rewardId) {
        return res.status(400).json({ message: 'Se requiere el ID de la recompensa en la URL.' }); // Traducido
    }
    if (Object.keys(updateData).length === 0) {
        return res.status(400).json({ message: 'Se requieren datos de actualización en el cuerpo de la petición.' }); // Traducido
    }

    // --- CAMBIO: Validación opcional específica para isActive si se recibe ---
    if (updateData.isActive !== undefined && typeof updateData.isActive !== 'boolean') {
        return res.status(400).json({ message: 'El campo isActive debe ser un valor booleano (true o false).' }); // Traducido
    }
     // Podríamos añadir validaciones similares para name, pointsCost si quisiéramos ser más estrictos aquí
    // --- FIN CAMBIO ---


    try {
        // Llamamos al servicio de actualización, pasándole todos los datos recibidos
        // El servicio se encargará de aplicarlos y de verificar pertenencia al negocio
        const updatedReward = await updateReward(rewardId, businessId, updateData);
        res.status(200).json(updatedReward);
    } catch (error) {
         if (error instanceof Error && error.message.includes('Reward with ID')) { // Error del servicio si no encuentra/no pertenece
             return res.status(404).json({ message: error.message });
         }
         if (error instanceof Prisma.PrismaClientKnownRequestError) {
             console.error('Prisma error updating reward:', error);
             return res.status(500).json({ message: 'Error de base de datos al actualizar la recompensa.' }); // Traducido
         }
        console.error('Error updating reward:', error);
        res.status(500).json({ message: 'Error del servidor al actualizar la recompensa.' }); // Traducido
    }
};

/**
 * Handles deletion of an existing reward. DELETE /api/rewards/:id
 * (No cambios aquí)
 */
export const deleteRewardHandler = async (req: Request, res: Response) => {
    const businessId = req.user?.businessId;
    const rewardId = req.params.id;
    const role = req.user?.role; // TODO: Add role check (BUSINESS_ADMIN)


    if (!req.user || !businessId) {
         return res.status(401).json({ message: 'Usuario no autenticado o negocio no asociado.' }); // Traducido
    }
     // TODO: Implementar middleware o chequeo de rol 'BUSINESS_ADMIN' aquí
     if (!rewardId) {
        return res.status(400).json({ message: 'Se requiere el ID de la recompensa en la URL.' }); // Traducido
    }

    try {
        const deletedReward = await deleteReward(rewardId, businessId);
        // Respondemos con un mensaje genérico o con el objeto eliminado
        res.status(200).json({ message: 'Recompensa eliminada con éxito.', deletedReward }); // Traducido
    } catch (error) {
        if (error instanceof Error && error.message.includes('Reward with ID')) { // Error del servicio si no encuentra/no pertenece
             return res.status(404).json({ message: error.message });
         }
         if (error instanceof Prisma.PrismaClientKnownRequestError) {
             console.error('Prisma error deleting reward:', error);
             // Podríamos querer manejar errores de FK si intentamos borrar una recompensa en uso
             return res.status(500).json({ message: 'Error de base de datos al eliminar la recompensa.' }); // Traducido
         }
        console.error('Error deleting reward:', error);
        res.status(500).json({ message: 'Error del servidor al eliminar la recompensa.' }); // Traducido
    }
};

// End of File: backend/src/rewards/rewards.controller.ts