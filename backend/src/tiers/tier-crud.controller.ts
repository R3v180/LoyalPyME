// filename: backend/src/tiers/tier-crud.controller.ts
// Contiene los handlers para las operaciones CRUD de la entidad Tier

import { Request, Response } from 'express';
import { Prisma } from '@prisma/client'; // Para tipos de error
import * as TierService from './tiers.service'; // Importa desde el servicio correspondiente

// --- Handlers para CRUD de Tiers (Admin) ---

/**
 * Handler para crear un nuevo Tier.
 * POST /api/tiers/tiers
 */
export const createTierHandler = async (req: Request, res: Response) => {
    // @ts-ignore
    const businessId = req.user?.businessId;
    if (!businessId) return res.status(401).json({ message: 'ID de negocio no encontrado en el token.' });

    const tierData = req.body;
    console.log(`[TIER_CRUD_CTRL] Attempting to create tier for business ${businessId}`);

    // ValidaciÃ³n bÃ¡sica (mejorar con DTOs/Zod si es necesario)
     if (!tierData.name || typeof tierData.level !== 'number' || typeof tierData.minValue !== 'number') {
         return res.status(400).json({ message: 'Nombre, nivel y valor mÃ­nimo son requeridos para el Tier.' });
     }

    try {
        // Pasar solo los datos relevantes al servicio
        const { name, level, minValue, description, benefitsDescription, isActive } = tierData;
        const newTier = await TierService.createTier(businessId, { name, level, minValue, description, benefitsDescription, isActive });
        console.log(`[TIER_CRUD_CTRL] Tier created successfully: ${newTier.id}`);
        res.status(201).json(newTier);
    } catch (error: any) {
        console.error(`[TIER_CRUD_CTRL] Error creating tier for business ${businessId}:`, error);
        if (error.message.includes('unicidad')) {
            return res.status(409).json({ message: error.message }); // Conflicto
        }
        res.status(500).json({ message: error.message || 'Error interno al crear el Tier.' });
    }
};

/**
 * Handler para obtener todos los Tiers del negocio.
 * GET /api/tiers/tiers
 */
export const getBusinessTiersHandler = async (req: Request, res: Response) => {
    // @ts-ignore
    const businessId = req.user?.businessId;
    if (!businessId) return res.status(401).json({ message: 'ID de negocio no encontrado en el token.' });
    const includeBenefits = req.query.includeBenefits === 'true'; // OpciÃ³n para incluir beneficios
    console.log(`[TIER_CRUD_CTRL] Getting tiers for business ${businessId}, includeBenefits: ${includeBenefits}`);

    try {
        const tiers = await TierService.findTiersByBusiness(businessId, includeBenefits);
        res.status(200).json(tiers);
    } catch (error: any) {
        console.error(`[TIER_CRUD_CTRL] Error getting tiers for business ${businessId}:`, error);
        res.status(500).json({ message: error.message || 'Error interno al obtener los Tiers.' });
    }
};

/**
 * Handler para obtener un Tier especÃ­fico por ID.
 * GET /api/tiers/tiers/:tierId
 */
export const getTierByIdHandler = async (req: Request, res: Response) => {
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
            return res.status(404).json({ message: 'Tier no encontrado o no pertenece a este negocio.' });
        }
        res.status(200).json(tier);
    } catch (error: any) {
         console.error(`[TIER_CRUD_CTRL] Error getting tier ${tierId} for business ${businessId}:`, error);
        res.status(500).json({ message: error.message || 'Error interno al obtener el Tier.' });
    }
};

/**
 * Handler para actualizar un Tier existente.
 * PUT /api/tiers/tiers/:tierId
 */
export const updateTierHandler = async (req: Request, res: Response) => {
    // @ts-ignore
    const businessId = req.user?.businessId;
    const { tierId } = req.params;
     if (!businessId) return res.status(401).json({ message: 'ID de negocio no encontrado en el token.' });
     if (!tierId) return res.status(400).json({ message: 'Se requiere ID del Tier.' });

     const updateData = req.body;
     console.log(`[TIER_CRUD_CTRL] Updating tier ${tierId} for business ${businessId}`);
      // ValidaciÃ³n bÃ¡sica
      if (Object.keys(updateData).length === 0) {
         return res.status(400).json({ message: 'Se requieren datos para actualizar.' });
      }
      // TODO: Validar updateData con DTO/Zod si es necesario

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
         res.status(500).json({ message: error.message || 'Error interno al actualizar el Tier.' });
     }
};

/**
 * Handler para eliminar un Tier existente.
 * DELETE /api/tiers/tiers/:tierId
 */
export const deleteTierHandler = async (req: Request, res: Response) => {
    // @ts-ignore
    const businessId = req.user?.businessId;
    const { tierId } = req.params;
     if (!businessId) return res.status(401).json({ message: 'ID de negocio no encontrado en el token.' });
     if (!tierId) return res.status(400).json({ message: 'Se requiere ID del Tier.' });
     console.log(`[TIER_CRUD_CTRL] Deleting tier ${tierId} for business ${businessId}`);

     try {
         const deletedTier = await TierService.deleteTier(tierId, businessId);
          console.log(`[TIER_CRUD_CTRL] Tier ${tierId} deleted successfully.`);
         res.status(200).json({ message: 'Tier eliminado correctamente.', deletedTier }); // o res.sendStatus(204)
     } catch (error: any) {
         console.error(`[TIER_CRUD_CTRL] Error deleting tier ${tierId} for business ${businessId}:`, error);
         if (error instanceof Error && (error.message.includes('no encontrado') || error.message.includes('usuarios asignados'))) {
             // 404 si no existe, 409 (Conflicto) si tiene usuarios
             const statusCode = error.message.includes('usuarios asignados') ? 409 : 404;
             return res.status(statusCode).json({ message: error.message });
         }
         res.status(500).json({ message: error.message || 'Error interno al eliminar el Tier.' });
     }
};

// End of File: backend/src/tiers/tier-crud.controller.ts