// filename: backend/src/tiers/tier-benefit.controller.ts
// Version: 1.0.1 (Fix encoding, remove @ts-ignore)

import { Request, Response, NextFunction } from 'express'; // Add NextFunction
import { Prisma } from '@prisma/client';
import * as TierBenefitService from './tier-benefit.service';
import * as TierService from './tiers.service';

// --- Handlers para CRUD de TierBenefits (Admin) ---

/**
 * Handler para crear un nuevo beneficio para un Tier específico.
 * POST /api/tiers/tiers/:tierId/benefits
 */
export const createTierBenefitHandler = async (req: Request, res: Response, next: NextFunction) => { // Add next
    // --- FIX: Check req.user ---
    if (!req.user || !req.user.businessId) {
        console.error("[TIER_BENEFIT_CTRL] Critical: User context missing in createTierBenefitHandler.");
        return res.status(401).json({ message: 'ID de negocio no encontrado en el token.' });
    }
    const businessId = req.user.businessId;
    // --- FIN FIX ---

    const { tierId } = req.params;
    if (!tierId) return res.status(400).json({ message: 'Se requiere ID del Tier en la URL.' });

    const benefitData = req.body;
    console.log(`[TIER_BENEFIT_CTRL] Creating benefit for tier ${tierId}`);

     // Validación básica (mejorar con DTOs/Zod)
     if (!benefitData.type || !benefitData.value) {
         return res.status(400).json({ message: 'Tipo y valor son requeridos para el beneficio.' });
     }
     // TODO: Validación más profunda de 'type' y 'value' según el tipo

    try {
        // Verificar que el Tier pertenece al negocio antes de crear el beneficio
        // Esta verificación podría hacerse también en el servicio, pero hacerla aquí es una capa extra.
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
        // Devolver 500 para errores inesperados
        next(new Error('Error interno al crear el beneficio.')); // Pasar a manejador global
    }
};

/**
 * Handler para obtener todos los beneficios de un Tier específico.
 * GET /api/tiers/tiers/:tierId/benefits
 */
export const getTierBenefitsHandler = async (req: Request, res: Response, next: NextFunction) => { // Add next
    // --- FIX: Check req.user ---
     if (!req.user || !req.user.businessId) {
        console.error("[TIER_BENEFIT_CTRL] Critical: User context missing in getTierBenefitsHandler.");
        return res.status(401).json({ message: 'ID de negocio no encontrado en el token.' });
    }
    const businessId = req.user.businessId;
    // --- FIN FIX ---

    const { tierId } = req.params;
    if (!tierId) return res.status(400).json({ message: 'Se requiere ID del Tier.' });
     console.log(`[TIER_BENEFIT_CTRL] Getting benefits for tier ${tierId}`);

    try {
        // Opcional: Verificar que el Tier pertenece al negocio (buena práctica)
        const tier = await TierService.findTierById(tierId, businessId);
        if (!tier) {
             return res.status(404).json({ message: 'Tier no encontrado o no pertenece a este negocio.' });
        }

        // Obtener los beneficios usando el servicio de beneficios
        const benefits = await TierBenefitService.findBenefitsByTier(tierId);
        res.status(200).json(benefits);
    } catch (error: any) {
        console.error(`[TIER_BENEFIT_CTRL] Error getting benefits for tier ${tierId}:`, error);
        next(new Error('Error interno al obtener los beneficios.')); // Pasar a manejador global
    }
};

/**
 * Handler para actualizar un beneficio de Tier existente.
 * PUT /api/tiers/benefits/:benefitId
 */
export const updateTierBenefitHandler = async (req: Request, res: Response, next: NextFunction) => { // Add next
    const { benefitId } = req.params;
     if (!benefitId) return res.status(400).json({ message: 'Se requiere ID del Beneficio.' });

    const updateData = req.body;
     console.log(`[TIER_BENEFIT_CTRL] Updating benefit ${benefitId}`);
    // Validación básica
    if (Object.keys(updateData).length === 0) { return res.status(400).json({ message: 'Se requieren datos para actualizar.' }); }
    // TODO: Validar updateData con DTO/Zod si es necesario

    // Opcional: Verificar que el beneficio pertenece a un tier del negocio logueado (más complejo, podría hacerse en el servicio)
    // const businessId = req.user?.businessId; // Necesitaría check de req.user
    // const canAccess = await checkBenefitBelongsToBusiness(benefitId, businessId); // Función hipotética
    // if (!canAccess) return res.status(403).json({ message: 'Acceso denegado a este beneficio.' });

    try {
        const updatedBenefit = await TierBenefitService.updateTierBenefit(benefitId, updateData);
         console.log(`[TIER_BENEFIT_CTRL] Benefit ${benefitId} updated successfully.`);
        res.status(200).json(updatedBenefit);
    } catch (error: any) {
        console.error(`[TIER_BENEFIT_CTRL] Error updating benefit ${benefitId}:`, error);
        if (error instanceof Error && error.message.includes('no encontrado')) {
            return res.status(404).json({ message: error.message }); // Específico 404
        }
        next(new Error('Error interno al actualizar el beneficio.')); // Pasar a manejador global
    }
};

/**
 * Handler para eliminar un beneficio de Tier existente.
 * DELETE /api/tiers/benefits/:benefitId
 */
export const deleteTierBenefitHandler = async (req: Request, res: Response, next: NextFunction) => { // Add next
    const { benefitId } = req.params;
    if (!benefitId) return res.status(400).json({ message: 'Se requiere ID del Beneficio.' });
     console.log(`[TIER_BENEFIT_CTRL] Deleting benefit ${benefitId}`);

    // Opcional: Verificar pertenencia al negocio logueado antes de borrar (requiere check de req.user)
    try {
        const deletedBenefit = await TierBenefitService.deleteTierBenefit(benefitId);
         console.log(`[TIER_BENEFIT_CTRL] Benefit ${benefitId} deleted successfully.`);
        res.status(200).json({ message: 'Beneficio eliminado correctamente.', deletedBenefit }); // o res.sendStatus(204) // Corregido: correctamente
    } catch (error: any) {
        console.error(`[TIER_BENEFIT_CTRL] Error deleting benefit ${benefitId}:`, error);
        if (error instanceof Error && error.message.includes('no encontrado')) {
            return res.status(404).json({ message: error.message }); // Específico 404
        }
        next(new Error('Error interno al eliminar el beneficio.')); // Pasar a manejador global
    }
};

// End of File: backend/src/tiers/tier-benefit.controller.ts