// File: backend/src/customer/customer.controller.ts
// Version: 1.0.0 (Initial controller for customer actions)

import { Request, Response, NextFunction } from 'express';

// Importar la función del servicio (a crear)
import { findActiveRewardsForCustomer } from './customer.service';

/**
 * Handles fetching active rewards for the logged-in customer's business.
 * GET /api/customer/rewards
 */
export const getCustomerRewardsHandler = async (req: Request, res: Response, next: NextFunction) => {
    // El middleware authenticateToken ya ha añadido req.user
    // El middleware checkRole ya ha verificado que es CUSTOMER_FINAL
    const businessId = req.user?.businessId;
    const userId = req.user?.id; // Podríamos usarlo para logs o personalización futura

    console.log(`[CUSTOMER CTRL] User ${userId} requesting rewards for business ${businessId}`);

    // Doble check por si acaso, aunque los middlewares deberían garantizarlo
    if (!businessId || !userId) {
        console.error('[CUSTOMER CTRL] Error: businessId or userId missing from req.user');
        // Usamos next(error) o devolvemos un error directamente
        return res.status(401).json({ message: 'Información de usuario o negocio no encontrada en la sesión.' });
    }

    try {
        // Llamar a la función del servicio (a crear)
        const rewards = await findActiveRewardsForCustomer(businessId);
        res.status(200).json(rewards);

    } catch (error) {
        // Loguear el error y pasar al manejador de errores general o devolver 500
        console.error(`[CUSTOMER CTRL] Error fetching rewards for business ${businessId}:`, error);
        // Podríamos pasar el error a un manejador global con next(error)
        res.status(500).json({ message: 'Error al obtener las recompensas.' });
    }
};

// Aquí podríamos añadir otros handlers específicos para clientes en el futuro

// End of File: backend/src/customer/customer.controller.ts