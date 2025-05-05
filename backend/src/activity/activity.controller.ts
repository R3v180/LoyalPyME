// filename: backend/src/activity/activity.controller.ts
import { Request, Response, NextFunction } from 'express';
import * as activityService from './activity.service'; // Importar el servicio

/**
 * Handler para obtener el historial de actividad paginado del cliente autenticado.
 * GET / (montado bajo /api/customer/activity)
 */
export const getCustomerActivityHandler = async (req: Request, res: Response, next: NextFunction) => {
    // El userId viene de req.user añadido por authenticateToken
    const userId = req.user?.id;

    if (!userId) {
        // Esto no debería ocurrir si el middleware funciona, pero es una guarda
        return res.status(401).json({ message: 'Usuario no autenticado.' });
    }

    // Obtener parámetros de paginación de la query string, con valores por defecto
    const pageQuery = req.query.page as string | undefined;
    const limitQuery = req.query.limit as string | undefined;

    const page = parseInt(pageQuery || '1', 10);
    const limit = parseInt(limitQuery || '15', 10); // Default 15 items por página

    // Validar que sean números válidos
    if (isNaN(page) || page < 1) {
        return res.status(400).json({ message: 'Parámetro "page" inválido. Debe ser un número mayor o igual a 1.' });
    }
    if (isNaN(limit) || limit < 1 || limit > 100) { // Limitar el máximo por petición
        return res.status(400).json({ message: 'Parámetro "limit" inválido. Debe ser un número entre 1 y 100.' });
    }

    console.log(`[Activity CTRL] Request received for user ${userId} activity. Page: ${page}, Limit: ${limit}`);

    try {
        const paginatedResult = await activityService.getCustomerActivityLog(userId, page, limit);
        res.status(200).json(paginatedResult);
    } catch (error) {
        // Pasar el error al manejador global de errores
        next(error);
    }
};