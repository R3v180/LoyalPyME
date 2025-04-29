// filename: backend/src/tiers/tier-config.controller.ts
// Version: 1.0.1 (Fix encoding, remove @ts-ignore)

import { Request, Response, NextFunction } from 'express'; // Add NextFunction
import * as TierConfigService from './tier-config.service';

// --- Handlers para Configuración de Tiers del Negocio (Admin) ---

/**
 * Handler para obtener la configuración de Tiers del negocio.
 * GET /api/tiers/config
 */
export const getBusinessTierConfigHandler = async (req: Request, res: Response, next: NextFunction) => { // Add next
    // --- FIX: Check req.user ---
    if (!req.user || !req.user.businessId) {
        console.error("[TIER_CONF_CTRL] Critical: User context missing in getBusinessTierConfigHandler.");
        return res.status(401).json({ message: 'ID de negocio no encontrado en el token.' });
    }
    const businessId = req.user.businessId;
    // --- FIN FIX ---

    console.log(`[TIER_CONF_CTRL] Getting tier config for business ${businessId}`);
    try {
        const config = await TierConfigService.getBusinessTierConfig(businessId);
        if (!config) {
            // Si el servicio devuelve null (negocio no encontrado, aunque no debería pasar si el token es válido)
            return res.status(404).json({ message: 'Configuración de Tiers no encontrada para este negocio.' }); // Corregido: Configuración
        }
        res.status(200).json(config);
    } catch (error: any) {
        console.error(`[TIER_CONF_CTRL] Error getting tier config for business ${businessId}:`, error);
        // Pasar al manejador global
        next(new Error('Error interno al obtener la configuración de Tiers.')); // Corregido: configuración
    }
};

/**
 * Handler para actualizar la configuración de Tiers del negocio.
 * PUT /api/tiers/config
 */
export const updateBusinessTierConfigHandler = async (req: Request, res: Response, next: NextFunction) => { // Add next
    // --- FIX: Check req.user ---
     if (!req.user || !req.user.businessId) {
        console.error("[TIER_CONF_CTRL] Critical: User context missing in updateBusinessTierConfigHandler.");
        return res.status(401).json({ message: 'ID de negocio no encontrado en el token.' });
    }
    const businessId = req.user.businessId;
    // --- FIN FIX ---

    const configData = req.body; // Datos a actualizar
    console.log(`[TIER_CONF_CTRL] Updating tier config for business ${businessId}:`, configData);

    // TODO: Validación más robusta con DTOs/Zod aquí si es necesario.
    // Validaciones básicas como ejemplo:
    if (configData.tierSystemEnabled !== undefined && typeof configData.tierSystemEnabled !== 'boolean') {
        return res.status(400).json({ message: 'tierSystemEnabled debe ser booleano.' });
    }
    // Añadir más validaciones si se requiere...

    try {
        const updatedBusiness = await TierConfigService.updateBusinessTierConfig(businessId, configData);
        // El servicio devuelve Business, lo devolvemos entero.
        console.log(`[TIER_CONF_CTRL] Tier config updated successfully for business ${businessId}`);
        res.status(200).json(updatedBusiness);
    } catch (error: any) {
        console.error(`[TIER_CONF_CTRL] Error updating tier config for business ${businessId}:`, error);
         // Manejar error de 'Negocio no encontrado' del servicio
        if (error instanceof Error && error.message.includes('no encontrado')) {
            return res.status(404).json({ message: error.message });
        }
        // Pasar otros errores al manejador global
        next(new Error('Error interno al actualizar la configuración de Tiers.')); // Corregido: configuración
    }
};

// End of File: backend/src/tiers/tier-config.controller.ts