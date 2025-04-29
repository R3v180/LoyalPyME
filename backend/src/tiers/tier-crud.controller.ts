// filename: backend/src/tiers/tier-crud.controller.ts
// Version: 1.1.1 (Fix validation checks and P2002->409 mapping)

import { Request, Response, NextFunction } from 'express';
import { Prisma } from '@prisma/client';
import * as TierService from './tiers.service';

// --- Handlers para CRUD de Tiers (Admin) ---

export const createTierHandler = async (req: Request, res: Response, next: NextFunction) => {
    if (!req.user || !req.user.businessId) {
        return res.status(401).json({ message: 'ID de negocio no encontrado en el token.' });
    }
    const businessId = req.user.businessId;
    const tierData = req.body;
    console.log(`[TIER_CRUD_CTRL] Attempting to create tier for business ${businessId}`);

    // --- VALIDACIÓN REFORZADA ---
    if (!tierData.name || typeof tierData.name !== 'string' || tierData.name.trim() === '') {
        return res.status(400).json({ message: 'El campo "name" es obligatorio y debe ser un texto.' });
    }
    // Comprobar que level sea número, entero y >= 0 EXPLÍCITAMENTE
    if (tierData.level === undefined || typeof tierData.level !== 'number' || !Number.isInteger(tierData.level) || tierData.level < 0) {
         return res.status(400).json({ message: 'El campo "level" es obligatorio y debe ser un número entero igual o mayor que 0.' });
     }
     // Comprobar que minValue sea número y >= 0 EXPLÍCITAMENTE
    if (tierData.minValue === undefined || typeof tierData.minValue !== 'number' || tierData.minValue < 0) {
        return res.status(400).json({ message: 'El campo "minValue" es obligatorio y debe ser un número igual o mayor que 0.' });
    }
     if (tierData.isActive !== undefined && typeof tierData.isActive !== 'boolean') {
        return res.status(400).json({ message: 'El campo "isActive" debe ser un valor booleano (true/false) si se proporciona.' });
    }
    // --- FIN VALIDACIÓN ---

    try {
        const { name, level, minValue, description, benefitsDescription, isActive } = tierData;
        const newTier = await TierService.createTier(businessId, {
            name: name.trim(), level, minValue,
            description: description?.trim() || null,
            benefitsDescription: benefitsDescription?.trim() || null,
            isActive
        });
        console.log(`[TIER_CRUD_CTRL] Tier created successfully: ${newTier.id}`);
        res.status(201).json(newTier);
    } catch (error: any) {
        console.error(`[TIER_CRUD_CTRL] Error creating tier for business ${businessId}:`, error);
        // --- CAPTURA ESPECÍFICA PARA 409 ---
        // El servicio lanza un Error con un mensaje específico para P2002
        if (error instanceof Error && (error.message.includes('Ya existe un Tier con el nivel') || error.message.includes('Ya existe un Tier con el nombre'))) {
             return res.status(409).json({ message: error.message }); // Devolver 409
        }
        // --- FIN CAPTURA 409 ---
        next(error); // Otros errores a 500
    }
};

// getBusinessTiersHandler (sin cambios)
export const getBusinessTiersHandler = async (req: Request, res: Response, next: NextFunction) => {
    if (!req.user || !req.user.businessId) { return res.status(401).json({ message: 'ID de negocio no encontrado en el token.' }); }
    const businessId = req.user.businessId;
    const includeBenefits = req.query.includeBenefits === 'true';
    try {
        const tiers = await TierService.findTiersByBusiness(businessId, includeBenefits);
        res.status(200).json(tiers);
    } catch (error: any) { next(error); }
};

// getTierByIdHandler (sin cambios)
export const getTierByIdHandler = async (req: Request, res: Response, next: NextFunction) => {
    if (!req.user || !req.user.businessId) { return res.status(401).json({ message: 'ID de negocio no encontrado en el token.' }); }
    const businessId = req.user.businessId;
    const { tierId } = req.params;
    if (!tierId) return res.status(400).json({ message: 'Se requiere ID del Tier.' });
    const includeBenefits = req.query.includeBenefits === 'true';
    try {
        const tier = await TierService.findTierById(tierId, businessId, includeBenefits);
        if (!tier) { return res.status(404).json({ message: 'Tier no encontrado o no pertenece a este negocio.' }); }
        res.status(200).json(tier);
    } catch (error: any) { next(error); }
};

// updateTierHandler (con validación añadida)
export const updateTierHandler = async (req: Request, res: Response, next: NextFunction) => {
     if (!req.user || !req.user.businessId) { return res.status(401).json({ message: 'ID de negocio no encontrado en el token.' }); }
     const businessId = req.user.businessId;
     const { tierId } = req.params;
     if (!tierId) return res.status(400).json({ message: 'Se requiere ID del Tier.' });
     const updateData = req.body;

     // --- VALIDACIÓN ---
     if (Object.keys(updateData).length === 0) { return res.status(400).json({ message: 'Se requieren datos para actualizar.' }); }
     if (updateData.name !== undefined && (typeof updateData.name !== 'string' || updateData.name.trim() === '')) { return res.status(400).json({ message: 'Si se proporciona "name", no puede estar vacío.' }); }
     if (updateData.level !== undefined && (typeof updateData.level !== 'number' || !Number.isInteger(updateData.level) || updateData.level < 0)) { return res.status(400).json({ message: 'Si se proporciona "level", debe ser un número entero igual o mayor que 0.' }); }
     if (updateData.minValue !== undefined && (typeof updateData.minValue !== 'number' || updateData.minValue < 0)) { return res.status(400).json({ message: 'Si se proporciona "minValue", debe ser un número igual o mayor que 0.' }); }
     if (updateData.isActive !== undefined && typeof updateData.isActive !== 'boolean') { return res.status(400).json({ message: 'Si se proporciona "isActive", debe ser un valor booleano.' }); }
     // --- FIN VALIDACIÓN ---

     try {
         const cleanUpdateData: Prisma.TierUpdateInput = {}; // Usar tipo Prisma aquí
         if (updateData.name !== undefined) cleanUpdateData.name = updateData.name.trim();
         if (updateData.level !== undefined) cleanUpdateData.level = updateData.level;
         if (updateData.minValue !== undefined) cleanUpdateData.minValue = updateData.minValue;
         if (updateData.description !== undefined) cleanUpdateData.description = updateData.description?.trim() || null;
         if (updateData.benefitsDescription !== undefined) cleanUpdateData.benefitsDescription = updateData.benefitsDescription?.trim() || null;
         if (updateData.isActive !== undefined) cleanUpdateData.isActive = updateData.isActive;

         const updatedTier = await TierService.updateTier(tierId, businessId, cleanUpdateData);
         console.log(`[TIER_CRUD_CTRL] Tier ${tierId} updated successfully.`);
         res.status(200).json(updatedTier);
     } catch (error: any) {
         console.error(`[TIER_CRUD_CTRL] Error updating tier ${tierId} for business ${businessId}:`, error);
         // --- CAPTURA ESPECÍFICA 404 y 409 ---
         if (error instanceof Error && error.message.includes('no encontrado')) { return res.status(404).json({ message: error.message }); }
         if (error instanceof Error && (error.message.includes('Ya existe un Tier con el nivel') || error.message.includes('Ya existe un Tier con el nombre'))) { return res.status(409).json({ message: error.message }); }
         // --- FIN CAPTURA ---
         next(error);
     }
};

// deleteTierHandler (con manejo de 409 añadido)
export const deleteTierHandler = async (req: Request, res: Response, next: NextFunction) => {
     if (!req.user || !req.user.businessId) { return res.status(401).json({ message: 'ID de negocio no encontrado en el token.' }); }
     const businessId = req.user.businessId;
     const { tierId } = req.params;
     if (!tierId) return res.status(400).json({ message: 'Se requiere ID del Tier.' });
     console.log(`[TIER_CRUD_CTRL] Deleting tier ${tierId} for business ${businessId}`);
     try {
         const deletedTier = await TierService.deleteTier(tierId, businessId);
         console.log(`[TIER_CRUD_CTRL] Tier ${tierId} deleted successfully.`);
         res.status(200).json({ message: 'Tier eliminado correctamente.', deletedTier });
     } catch (error: any) {
         console.error(`[TIER_CRUD_CTRL] Error deleting tier ${tierId} for business ${businessId}:`, error);
         // --- CAPTURA ESPECÍFICA 404 y 409 ---
         if (error instanceof Error && error.message.includes('no encontrado')) { return res.status(404).json({ message: error.message }); }
         if (error instanceof Error && error.message.includes('usuarios asignados')) { return res.status(409).json({ message: error.message }); }
         // --- FIN CAPTURA ---
         next(error);
     }
};

// End of File: backend/src/tiers/tier-crud.controller.ts