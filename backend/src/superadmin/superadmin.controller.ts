// backend/src/superadmin/superadmin.controller.ts
import { Request, Response, NextFunction } from 'express';
// --- CAMBIO: Importar el servicio real ---
import * as superAdminService from './superadmin.service';
// --- FIN CAMBIO ---

export const getAllBusinessesHandler = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const businesses = await superAdminService.getAllBusinesses();
        res.status(200).json(businesses);
    } catch (error) {
        console.error("[SA_CTRL] Error in getAllBusinessesHandler:", error);
        next(error);
    }
};

export const toggleBusinessStatusHandler = async (req: Request, res: Response, next: NextFunction) => {
    const { businessId } = req.params;
    const { isActive } = req.body;

    if (typeof isActive !== 'boolean') {
        return res.status(400).json({ message: 'El campo "isActive" es requerido y debe ser un booleano.' });
    }

    try {
        // --- CAMBIO: Quitar @ts-ignore, ahora el servicio tiene tipos correctos ---
        const updatedBusiness = await superAdminService.toggleBusinessStatus(businessId, isActive);
        res.status(200).json(updatedBusiness);
    } catch (error: any) { // Especificar 'any' o un tipo de error más específico
        console.error(`[SA_CTRL] Error in toggleBusinessStatusHandler for business ${businessId}:`, error);
        // Manejar error específico de "no encontrado" que podría lanzar el servicio
        if (error.message && error.message.includes('no encontrado')) {
            return res.status(404).json({ message: error.message });
        }
        next(error);
    }
};

export const toggleLoyaltyCoreModuleHandler = async (req: Request, res: Response, next: NextFunction) => {
    const { businessId } = req.params;
    const { isActive } = req.body;

    if (typeof isActive !== 'boolean') {
        return res.status(400).json({ message: 'El campo "isActive" es requerido y debe ser un booleano para el módulo.' });
    }

    try {
        // --- CAMBIO: Quitar @ts-ignore ---
        const updatedBusiness = await superAdminService.toggleModule(businessId, 'isLoyaltyCoreActive', isActive);
        res.status(200).json(updatedBusiness);
    } catch (error: any) {
        console.error(`[SA_CTRL] Error in toggleLoyaltyCoreModuleHandler for business ${businessId}:`, error);
        if (error.message && error.message.includes('no encontrado')) {
            return res.status(404).json({ message: error.message });
        }
        next(error);
    }
};

export const toggleCamareroModuleHandler = async (req: Request, res: Response, next: NextFunction) => {
    const { businessId } = req.params;
    const { isActive } = req.body;

    if (typeof isActive !== 'boolean') {
        return res.status(400).json({ message: 'El campo "isActive" es requerido y debe ser un booleano para el módulo.' });
    }

    try {
        // --- CAMBIO: Quitar @ts-ignore ---
        const updatedBusiness = await superAdminService.toggleModule(businessId, 'isCamareroActive', isActive);
        res.status(200).json(updatedBusiness);
    } catch (error: any) {
        console.error(`[SA_CTRL] Error in toggleCamareroModuleHandler for business ${businessId}:`, error);
        if (error.message && error.message.includes('no encontrado')) {
            return res.status(404).json({ message: error.message });
        }
        next(error);
    }
};