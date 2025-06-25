// backend/src/public/menu.controller.ts
import { Request, Response, NextFunction } from 'express';
import * as publicMenuService from './menu.service'; // Asumimos que el servicio se llamará menu.service.ts en la misma carpeta

export const getPublicDigitalMenuHandler = async (req: Request, res: Response, next: NextFunction) => {
    const { businessSlug } = req.params;

    if (!businessSlug || typeof businessSlug !== 'string' || businessSlug.trim() === '') {
        return res.status(400).json({ message: 'Se requiere el slug del negocio en la URL.' });
    }

    console.log(`[PublicMenu CTRL] Requesting public menu for business slug: ${businessSlug}`);

    try {
        const menuData = await publicMenuService.getPublicDigitalMenuBySlug(businessSlug.trim());

        if (!menuData) {
            // El servicio devolverá null si el negocio no existe o el módulo camarero no está activo
            return res.status(404).json({ message: 'Menú no encontrado o no disponible para este negocio.' });
        }

        res.status(200).json(menuData);
    } catch (error) {
        // Loguear el error en el backend para diagnóstico
        console.error(`[PublicMenu CTRL] Error fetching public menu for slug ${businessSlug}:`, error);
        // Pasar el error al manejador de errores global de Express
        // El manejador global puede decidir enviar una respuesta 500 genérica
        // o manejar errores específicos si los lanzamos desde el servicio.
        next(error);
    }
};