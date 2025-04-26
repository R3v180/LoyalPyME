// filename: backend/src/tiers/tier-benefit.controller.ts
// Contiene los handlers para las operaciones CRUD de TierBenefit

import { Request, Response } from 'express';
import { Prisma } from '@prisma/client'; // Para tipos de error y DTOs
import * as TierBenefitService from './tier-benefit.service'; // Importar servicio de beneficios
import * as TierService from './tiers.service'; // Importar servicio de Tiers (para validaciones)

// --- Handlers para CRUD de TierBenefits (Admin) ---

/**
 * Handler para crear un nuevo beneficio para un Tier especÃ­fico.
 * POST /api/tiers/tiers/:tierId/benefits
 */
export const createTierBenefitHandler = async (req: Request, res: Response) => {
    // @ts-ignore
    const businessId = req.user?.businessId; // Para verificar pertenencia del Tier
    const { tierId } = req.params;
    if (!businessId) return res.status(401).json({ message: 'ID de negocio no encontrado en el token.' });
    if (!tierId) return res.status(400).json({ message: 'Se requiere ID del Tier en la URL.' });

    const benefitData = req.body;
    console.log(`[TIER_BENEFIT_CTRL] Creating benefit for tier ${tierId}`);

     // ValidaciÃ³n bÃ¡sica (mejorar con DTOs/Zod)
     if (!benefitData.type || !benefitData.value) {
         return res.status(400).json({ message: 'Tipo y valor son requeridos para el beneficio.' });
     }
     // TODO: ValidaciÃ³n mÃ¡s profunda de 'type' y 'value' segÃºn el tipo

    try {
        // Verificar que el Tier pertenece al negocio antes de crear el beneficio
        // Esta verificaciÃ³n podrÃ­a hacerse tambiÃ©n en el servicio, pero hacerla aquÃ­ es una capa extra.
        const tier = await TierService.findTierById(tierId, businessId);
        if (!tier) {
             return res.status(404).json({ message: 'Tier no encontrado o no pertenece a este negocio.' });
        }

        // Crear el beneficio asociado a ese tierId usando el servicio de beneficios
        const { type, value, description, isActive } = benefitData;
        const newBenefit = await TierBenefitService.createTierBenefit(tierId, { type, value, description, isActive });
        console.log(`[TIER_BENEFIT_CTRL] Benefit created successfully: ${newBenefit.id}`);
        res.status(201).json(newBenefit);
    } catch (error: any) {
         console.error(`[TIER_BENEFIT_CTRL] Error creating benefit for tier ${tierId}:`, error);
         // Manejar error P2025 del servicio si el tierId no existe al hacer connect (ya cubierto por el check previo)
        res.status(500).json({ message: error.message || 'Error interno al crear el beneficio.' });
    }
};

/**
 * Handler para obtener todos los beneficios de un Tier especÃ­fico.
 * GET /api/tiers/tiers/:tierId/benefits
 */
export const getTierBenefitsHandler = async (req: Request, res: Response) => {
    // @ts-ignore
    const businessId = req.user?.businessId; // Para verificar pertenencia del Tier
    const { tierId } = req.params;
    if (!businessId) return res.status(401).json({ message: 'ID de negocio no encontrado en el token.' });
    if (!tierId) return res.status(400).json({ message: 'Se requiere ID del Tier.' });
     console.log(`[TIER_BENEFIT_CTRL] Getting benefits for tier ${tierId}`);

    try {
        // Opcional: Verificar que el Tier pertenece al negocio (buena prÃ¡ctica)
        const tier = await TierService.findTierById(tierId, businessId);
        if (!tier) {
             return res.status(404).json({ message: 'Tier no encontrado o no pertenece a este negocio.' });
        }

        // Obtener los beneficios usando el servicio de beneficios
        const benefits = await TierBenefitService.findBenefitsByTier(tierId);
        res.status(200).json(benefits);
    } catch (error: any) {
        console.error(`[TIER_BENEFIT_CTRL] Error getting benefits for tier ${tierId}:`, error);
        res.status(500).json({ message: error.message || 'Error interno al obtener los beneficios.' });
    }
};

/**
 * Handler para actualizar un beneficio de Tier existente.
 * PUT /api/tiers/benefits/:benefitId
 */
export const updateTierBenefitHandler = async (req: Request, res: Response) => {
    const { benefitId } = req.params; // Solo necesitamos el ID del beneficio
     if (!benefitId) return res.status(400).json({ message: 'Se requiere ID del Beneficio.' });

    const updateData = req.body;
     console.log(`[TIER_BENEFIT_CTRL] Updating benefit ${benefitId}`);
    // ValidaciÃ³n bÃ¡sica
    if (Object.keys(updateData).length === 0) { return res.status(400).json({ message: 'Se requieren datos para actualizar.' }); }
    // TODO: Validar updateData con DTO/Zod si es necesario

    // Opcional: Verificar que el beneficio pertenece a un tier del negocio logueado (mÃ¡s complejo, podrÃ­a hacerse en el servicio)
    // const businessId = req.user?.businessId;
    // const canAccess = await checkBenefitBelongsToBusiness(benefitId, businessId); // FunciÃ³n hipotÃ©tica
    // if (!canAccess) return res.status(403).json({ message: 'Acceso denegado a este beneficio.' });

    try {
        const updatedBenefit = await TierBenefitService.updateTierBenefit(benefitId, updateData);
         console.log(`[TIER_BENEFIT_CTRL] Benefit ${benefitId} updated successfully.`);
        res.status(200).json(updatedBenefit);
    } catch (error: any) {
        console.error(`[TIER_BENEFIT_CTRL] Error updating benefit ${benefitId}:`, error);
        if (error instanceof Error && error.message.includes('no encontrado')) {
            return res.status(404).json({ message: error.message });
        }
        res.status(500).json({ message: error.message || 'Error interno al actualizar el beneficio.' });
    }
};

/**
 * Handler para eliminar un beneficio de Tier existente.
 * DELETE /api/tiers/benefits/:benefitId
 */
export const deleteTierBenefitHandler = async (req: Request, res: Response) => {
    const { benefitId } = req.params;
    if (!benefitId) return res.status(400).json({ message: 'Se requiere ID del Beneficio.' });
     console.log(`[TIER_BENEFIT_CTRL] Deleting benefit ${benefitId}`);

    // Opcional: Verificar pertenencia al negocio logueado antes de borrar
    try {
        const deletedBenefit = await TierBenefitService.deleteTierBenefit(benefitId);
         console.log(`[TIER_BENEFIT_CTRL] Benefit ${benefitId} deleted successfully.`);
        res.status(200).json({ message: 'Beneficio eliminado correctamente.', deletedBenefit }); // o res.sendStatus(204)
    } catch (error: any) {
        console.error(`[TIER_BENEFIT_CTRL] Error deleting benefit ${benefitId}:`, error);
        if (error instanceof Error && error.message.includes('no encontrado')) {
            return res.status(404).json({ message: error.message });
        }
        res.status(500).json({ message: error.message || 'Error interno al eliminar el beneficio.' });
    }
};

// End of File: backend/src/tiers/tier-benefit.controller.ts