// File: backend/src/rewards/rewards.controller.ts
// Version: 1.0.0

import { Request, Response } from 'express';
import { Prisma } from '@prisma/client'; // Importa Prisma para manejo de errores
import {
    createReward,
    findRewardsByBusiness,
    findRewardById,
    updateReward,
    deleteReward,
} from './rewards.service'; // Importa funciones del servicio de recompensas

// Define DTOs para la estructura de los datos esperados en las peticiones

// DTO para crear una recompensa (POST /rewards)
export interface CreateRewardDto {
    name: string;
    description?: string;
    pointsCost: number;
    // businessId no se incluye aqui porque lo obtendremos de req.user
}

// DTO para actualizar una recompensa (PUT/PATCH /rewards/:id)
export interface UpdateRewardDto {
    name?: string; // Campos opcionales para actualizacion parcial
    description?: string;
    pointsCost?: number;
    isActive?: boolean;
}

/**
 * Handles creation of a new reward for the authenticated business.
 * POST /api/rewards
 * Requires Authentication (via authenticateToken middleware)
 * Requires role BUSINESS_ADMIN (implementacion de rol en futuro middleware)
 * Expected body: CreateRewardDto
 */
export const createRewardHandler = async (req: Request, res: Response) => {
    // Obtenemos businessId del usuario autenticado (adjunto por authenticateToken middleware)
    const businessId = req.user?.businessId;
    const role = req.user?.role; // Obtenemos el rol para futura validacion si es BUSINESS_ADMIN

    // Validacion basica: Asegurar que el usuario esta autenticado y tiene businessId
    if (!req.user || !businessId) {
        // Esto no deberia pasar si authenticateToken funciono, pero es un fallback
        return res.status(401).json({ message: 'User not authenticated or business not associated.' });
    }

    // Futuro: Validar que el role sea BUSINESS_ADMIN

    // Extrae los datos del cuerpo de la petición
    const { name, description, pointsCost }: CreateRewardDto = req.body;

    // Validacion de los datos de entrada
    if (!name || pointsCost === undefined || pointsCost < 0) {
         return res.status(400).json({ message: 'Name and valid pointsCost are required.' });
    }

    try {
        // Llama a la funcion de servicio para crear la recompensa
        const newReward = await createReward({
            name,
            description,
            pointsCost,
            businessId: businessId, // Asigna la recompensa al negocio del usuario autenticado
        });

        // Responde con la recompensa creada
        res.status(201).json(newReward); // 201 Created

    } catch (error) {
         // Manejo de errores de base de datos
         if (error instanceof Prisma.PrismaClientKnownRequestError) {
             // Puedes añadir manejo especifico si es necesario
             console.error('Prisma error creating reward:', error);
             return res.status(500).json({ message: 'Database error creating reward.' });
         }
        console.error('Error creating reward:', error);
        res.status(500).json({ message: 'Server error creating reward.' });
    }
};

/**
 * Handles fetching all rewards for the authenticated business.
 * GET /api/rewards
 * Requires Authentication
 */
export const getRewardsHandler = async (req: Request, res: Response) => {
    const businessId = req.user?.businessId;

    if (!req.user || !businessId) {
         return res.status(401).json({ message: 'User not authenticated or business not associated.' });
    }

    try {
        // Llama a la funcion de servicio para encontrar todas las recompensas del negocio
        const rewards = await findRewardsByBusiness(businessId);

        // Responde con la lista de recompensas
        res.status(200).json(rewards); // 200 OK

    } catch (error) {
         if (error instanceof Prisma.PrismaClientKnownRequestError) {
             console.error('Prisma error fetching rewards:', error);
             return res.status(500).json({ message: 'Database error fetching rewards.' });
         }
        console.error('Error fetching rewards:', error);
        res.status(500).json({ message: 'Server error fetching rewards.' });
    }
};

/**
 * Handles fetching a single reward by ID for the authenticated business.
 * GET /api/rewards/:id
 * Requires Authentication
 */
export const getRewardByIdHandler = async (req: Request, res: Response) => {
    const businessId = req.user?.businessId;
    const rewardId = req.params.id; // Obtiene el ID de la recompensa de los parametros de la URL

    if (!req.user || !businessId) {
         return res.status(401).json({ message: 'User not authenticated or business not associated.' });
    }

    // Validacion basica del ID
    if (!rewardId) {
        return res.status(400).json({ message: 'Reward ID is required in the URL.' });
    }

    try {
        // Llama a la funcion de servicio para encontrar la recompensa por ID y businessId
        const reward = await findRewardById(rewardId, businessId);

        // Si la recompensa no se encuentra (o no pertenece al negocio), responde con 404 Not Found
        if (!reward) {
            return res.status(404).json({ message: 'Reward not found or does not belong to your business.' });
        }

        // Responde con la recompensa encontrada
        res.status(200).json(reward); // 200 OK

    } catch (error) {
         if (error instanceof Prisma.PrismaClientKnownRequestError) {
             console.error('Prisma error fetching reward by ID:', error);
             return res.status(500).json({ message: 'Database error fetching reward by ID.' });
         }
        console.error('Error fetching reward by ID:', error);
        res.status(500).json({ message: 'Server error fetching reward by ID.' });
    }
};


/**
 * Handles updating an existing reward for the authenticated business.
 * PUT/PATCH /api/rewards/:id
 * Requires Authentication
 * Expected body: UpdateRewardDto
 */
export const updateRewardHandler = async (req: Request, res: Response) => {
    const businessId = req.user?.businessId;
    const rewardId = req.params.id; // ID de la recompensa de la URL
    const updateData: UpdateRewardDto = req.body; // Datos a actualizar del cuerpo de la peticion

    if (!req.user || !businessId) {
         return res.status(401).json({ message: 'User not authenticated or business not associated.' });
    }

     if (!rewardId) {
        return res.status(400).json({ message: 'Reward ID is required in the URL.' });
    }

    // Validacion basica de que updateData no este vacio (aunque el servicio lo validaria al no encontrar que actualizar)
    if (Object.keys(updateData).length === 0) {
        return res.status(400).json({ message: 'Update data is required in the request body.' });
    }


    try {
        // Llama a la funcion de servicio para actualizar la recompensa
        // La funcion de servicio internamente verifica que pertenezca al negocio
        const updatedReward = await updateReward(rewardId, businessId, updateData);

        // Responde con la recompensa actualizada
        res.status(200).json(updatedReward); // 200 OK

    } catch (error) {
         // Manejo de errores del servicio (ej: recompensa no encontrada o no pertenece al negocio)
         if (error instanceof Error && error.message.includes('Reward with ID')) {
             return res.status(404).json({ message: error.message }); // 404 Not Found
         }
         if (error instanceof Prisma.PrismaClientKnownRequestError) {
             console.error('Prisma error updating reward:', error);
             return res.status(500).json({ message: 'Database error updating reward.' });
         }
        console.error('Error updating reward:', error);
        res.status(500).json({ message: 'Server error updating reward.' });
    }
};

/**
 * Handles deletion of an existing reward for the authenticated business.
 * DELETE /api/rewards/:id
 * Requires Authentication
 */
export const deleteRewardHandler = async (req: Request, res: Response) => {
    const businessId = req.user?.businessId;
    const rewardId = req.params.id; // ID de la recompensa de la URL

    if (!req.user || !businessId) {
         return res.status(401).json({ message: 'User not authenticated or business not associated.' });
    }

     if (!rewardId) {
        return res.status(400).json({ message: 'Reward ID is required in the URL.' });
    }

    try {
        // Llama a la funcion de servicio para eliminar la recompensa
        // La funcion de servicio internamente verifica que pertenezca al negocio
        const deletedReward = await deleteReward(rewardId, businessId);

        // Responde con un mensaje de éxito o la recompensa eliminada
        res.status(200).json({ message: 'Reward deleted successfully.', deletedReward }); // 200 OK

    } catch (error) {
         // Manejo de errores del servicio (ej: recompensa no encontrada o no pertenece al negocio)
         if (error instanceof Error && error.message.includes('Reward with ID')) {
             return res.status(404).json({ message: error.message }); // 404 Not Found
         }
         if (error instanceof Prisma.PrismaClientKnownRequestError) {
             console.error('Prisma error deleting reward:', error);
             return res.status(500).json({ message: 'Database error deleting reward.' });
         }
        console.error('Error deleting reward:', error);
        res.status(500).json({ message: 'Server error deleting reward.' });
    }
};


// Puedes añadir mas funciones de controlador de recompensas aqui en el futuro
// Por ejemplo: getActiveRewardsHandler, etc.


// End of File: backend/src/rewards/rewards.controller.ts