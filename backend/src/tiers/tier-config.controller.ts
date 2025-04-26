// filename: backend/src/tiers/tier-config.controller.ts
// Contiene los handlers para la configuraciÃ³n global de Tiers del negocio

import { Request, Response } from 'express';
import * as TierConfigService from './tier-config.service'; // Importa desde el servicio correspondiente

// --- Handlers para Configuración de Tiers del Negocio (Admin) ---

/**
 * Handler para obtener la configuraciÃ³n de Tiers del negocio.
 * GET /api/tiers/config
 */
export const getBusinessTierConfigHandler = async (req: Request, res: Response) => {
    // @ts-ignore - Asumimos req.user existe por middlewares previos
    const businessId = req.user?.businessId;
    if (!businessId) return res.status(401).json({ message: 'ID de negocio no encontrado en el token.' });

    console.log(`[TIER_CONF_CTRL] Getting tier config for business ${businessId}`);
    try {
        const config = await TierConfigService.getBusinessTierConfig(businessId);
        if (!config) {
             // Si el servicio devuelve null (negocio no encontrado)
             return res.status(404).json({ message: 'ConfiguraciÃ³n de Tiers no encontrada para este negocio.' });
        }
        res.status(200).json(config);
    } catch (error: any) {
        console.error(`[TIER_CONF_CTRL] Error getting tier config for business ${businessId}:`, error);
        res.status(500).json({ message: error.message || 'Error interno al obtener la configuraciÃ³n de Tiers.' });
    }
};

/**
 * Handler para actualizar la configuraciÃ³n de Tiers del negocio.
 * PUT /api/tiers/config
 */
export const updateBusinessTierConfigHandler = async (req: Request, res: Response) => {
     // @ts-ignore
     const businessId = req.user?.businessId;
     if (!businessId) return res.status(401).json({ message: 'ID de negocio no encontrado en el token.' });

     const configData = req.body; // Datos a actualizar
      console.log(`[TIER_CONF_CTRL] Updating tier config for business ${businessId}:`, configData);

     // TODO: ValidaciÃ³n mÃ¡s robusta con DTOs/Zod aquÃ­ si es necesario.
     // Validaciones bÃ¡sicas como ejemplo:
     if (configData.tierSystemEnabled !== undefined && typeof configData.tierSystemEnabled !== 'boolean') {
         return res.status(400).json({ message: 'tierSystemEnabled debe ser booleano.' });
     }
     // AÃ±adir mÃ¡s validaciones si se requiere...

     try {
         const updatedBusiness = await TierConfigService.updateBusinessTierConfig(businessId, configData);
         // Devolver solo la configuraciÃ³n actualizada para consistencia con GET? O el objeto Business?
         // El servicio devuelve Business, asÃ­ que lo devolvemos entero por ahora.
          console.log(`[TIER_CONF_CTRL] Tier config updated successfully for business ${businessId}`);
         res.status(200).json(updatedBusiness);
     } catch (error: any) {
         console.error(`[TIER_CONF_CTRL] Error updating tier config for business ${businessId}:`, error);
          // Manejar error de 'Negocio no encontrado' del servicio
         if (error instanceof Error && error.message.includes('no encontrado')) {
            return res.status(404).json({ message: error.message });
         }
         res.status(500).json({ message: error.message || 'Error interno al actualizar la configuraciÃ³n de Tiers.' });
     }
};

// End of File: backend/src/tiers/tier-config.controller.ts