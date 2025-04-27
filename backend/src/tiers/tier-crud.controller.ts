// filename: backend/src/tiers/tier-crud.controller.ts
// Version: 1.0.1 (Add debug log)
// Contiene los handlers para las operaciones CRUD de la entidad Tier

import { Request, Response, NextFunction } from 'express'; // Añadir NextFunction si no estaba
import { Prisma } from '@prisma/client'; // Para tipos de error
import * as TierService from './tiers.service'; // Importa desde el servicio correspondiente

// --- Handlers para CRUD de Tiers (Admin) ---

/**
 * Handler para crear un nuevo Tier.
 * POST /api/tiers/tiers
 */
export const createTierHandler = async (req: Request, res: Response, next: NextFunction) => { // Usar next para errores
    // @ts-ignore
    const businessId = req.user?.businessId;
    if (!businessId) return res.status(401).json({ message: 'ID de negocio no encontrado en el token.' });

    const tierData = req.body;
    console.log(`[TIER_CRUD_CTRL] Attempting to create tier for business ${businessId}`);

     if (!tierData.name || typeof tierData.level !== 'number' || typeof tierData.minValue !== 'number') {
         return res.status(400).json({ message: 'Nombre, nivel y valor mínimo son requeridos para el Tier.' });
     }

    try {
        const { name, level, minValue, description, benefitsDescription, isActive } = tierData;
        const newTier = await TierService.createTier(businessId, { name, level, minValue, description, benefitsDescription, isActive });
        console.log(`[TIER_CRUD_CTRL] Tier created successfully: ${newTier.id}`);
        res.status(201).json(newTier);
    } catch (error: any) {
        console.error(`[TIER_CRUD_CTRL] Error creating tier for business ${businessId}:`, error);
        if (error.message.includes('unicidad')) {
            // Usar next es preferible para errores 500, pero para 409 podemos responder directamente
            return res.status(409).json({ message: error.message });
        }
        next(error); // Pasar otros errores al manejador global
        // res.status(500).json({ message: error.message || 'Error interno al crear el Tier.' });
    }
};

/**
 * Handler para obtener todos los Tiers del negocio.
 * GET /api/tiers/ (la ruta base ahora es /)
 */
export const getBusinessTiersHandler = async (req: Request, res: Response, next: NextFunction) => { // Usar next para errores
    // @ts-ignore
    const businessId = req.user?.businessId;
    if (!businessId) return res.status(401).json({ message: 'ID de negocio no encontrado en el token.' });
    const includeBenefits = req.query.includeBenefits === 'true';
    console.log(`[TIER_CRUD_CTRL] Getting tiers for business ${businessId}, includeBenefits: ${includeBenefits}`);

    try {
        const tiers = await TierService.findTiersByBusiness(businessId, includeBenefits);
        // --- NUEVO LOG ---
        console.log(`[TIER_CRUD_CTRL] Service call finished. Received ${tiers.length} tiers. Preparing response...`);
        // ---------------
        res.status(200).json(tiers); // Enviar respuesta si todo va bien
    } catch (error: any) {
         // --- NUEVO LOG ---
         console.error(`[TIER_CRUD_CTRL] *** ERROR within getBusinessTiersHandler try/catch for business ${businessId}:`, error);
         // ---------------
         console.error(`[TIER_CRUD_CTRL] Error getting tiers for business ${businessId}:`, error); // Mantener log original
         next(error); // Pasar error al manejador global
         // res.status(500).json({ message: error.message || 'Error interno al obtener los Tiers.' });
    }
};

/**
 * Handler para obtener un Tier específico por ID.
 * GET /api/tiers/tiers/:tierId
 */
export const getTierByIdHandler = async (req: Request, res: Response, next: NextFunction) => { // Usar next para errores
    // @ts-ignore
    const businessId = req.user?.businessId;
    const { tierId } = req.params;
    if (!businessId) return res.status(401).json({ message: 'ID de negocio no encontrado en el token.' });
    if (!tierId) return res.status(400).json({ message: 'Se requiere ID del Tier.' });
    const includeBenefits = req.query.includeBenefits === 'true';
    console.log(`[TIER_CRUD_CTRL] Getting tier ${tierId} for business ${businessId}, includeBenefits: ${includeBenefits}`);

    try {
        const tier = await TierService.findTierById(tierId, businessId, includeBenefits);
        if (!tier) {
            // Devolver 404 si no se encuentra
            return res.status(404).json({ message: 'Tier no encontrado o no pertenece a este negocio.' });
        }
        res.status(200).json(tier);
    } catch (error: any) {
        console.error(`[TIER_CRUD_CTRL] Error getting tier ${tierId} for business ${businessId}:`, error);
        next(error); // Pasar error al manejador global
        // res.status(500).json({ message: error.message || 'Error interno al obtener el Tier.' });
    }
};

/**
 * Handler para actualizar un Tier existente.
 * PUT /api/tiers/tiers/:tierId
 */
export const updateTierHandler = async (req: Request, res: Response, next: NextFunction) => { // Usar next para errores
    // @ts-ignore
    const businessId = req.user?.businessId;
    const { tierId } = req.params;
     if (!businessId) return res.status(401).json({ message: 'ID de negocio no encontrado en el token.' });
     if (!tierId) return res.status(400).json({ message: 'Se requiere ID del Tier.' });

     const updateData = req.body;
     console.log(`[TIER_CRUD_CTRL] Updating tier ${tierId} for business ${businessId}`);
     if (Object.keys(updateData).length === 0) {
         return res.status(400).json({ message: 'Se requieren datos para actualizar.' });
     }

     try {
         const updatedTier = await TierService.updateTier(tierId, businessId, updateData);
         console.log(`[TIER_CRUD_CTRL] Tier ${tierId} updated successfully.`);
         res.status(200).json(updatedTier);
     } catch (error: any) {
         console.error(`[TIER_CRUD_CTRL] Error updating tier ${tierId} for business ${businessId}:`, error);
         if (error instanceof Error && error.message.includes('no encontrado')) {
             return res.status(404).json({ message: error.message });
         }
         if (error instanceof Error && error.message.includes('unicidad')) {
             return res.status(409).json({ message: error.message });
         }
         next(error); // Pasar otros errores al manejador global
         // res.status(500).json({ message: error.message || 'Error interno al actualizar el Tier.' });
     }
};

/**
 * Handler para eliminar un Tier existente.
 * DELETE /api/tiers/tiers/:tierId
 */
export const deleteTierHandler = async (req: Request, res: Response, next: NextFunction) => { // Usar next para errores
    // @ts-ignore
    const businessId = req.user?.businessId;
    const { tierId } = req.params;
     if (!businessId) return res.status(401).json({ message: 'ID de negocio no encontrado en el token.' });
     if (!tierId) return res.status(400).json({ message: 'Se requiere ID del Tier.' });
     console.log(`[TIER_CRUD_CTRL] Deleting tier ${tierId} for business ${businessId}`);

     try {
         const deletedTier = await TierService.deleteTier(tierId, businessId);
         console.log(`[TIER_CRUD_CTRL] Tier ${tierId} deleted successfully.`);
         res.status(200).json({ message: 'Tier eliminado correctamente.', deletedTier });
     } catch (error: any) {
         console.error(`[TIER_CRUD_CTRL] Error deleting tier ${tierId} for business ${businessId}:`, error);
         if (error instanceof Error && (error.message.includes('no encontrado') || error.message.includes('usuarios asignados'))) {
             const statusCode = error.message.includes('usuarios asignados') ? 409 : 404;
             return res.status(statusCode).json({ message: error.message });
         }
         next(error); // Pasar otros errores al manejador global
         // res.status(500).json({ message: error.message || 'Error interno al eliminar el Tier.' });
     }
};

// End of File: backend/src/tiers/tier-crud.controller.ts