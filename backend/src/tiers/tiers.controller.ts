// File: backend/src/tiers/tiers.controller.ts
// Version: 1.0.0 (Initial controller structure with handlers)

import { Request, Response } from 'express';
import { Prisma } from '@prisma/client'; // Para tipos de error y DTOs

// Importar funciones de los diferentes servicios de Tiers
import * as TierConfigService from './tier-config.service';
import * as TierService from './tiers.service';
import * as TierBenefitService from './tier-benefit.service';
// Todavía no importamos nada de tier-logic.service, ya que updateUserTier se llama internamente o por jobs

// --- Handlers para Configuración de Tiers del Negocio (Admin) ---

export const getBusinessTierConfigHandler = async (req: Request, res: Response) => {
    const businessId = req.user?.businessId; // Asumimos que authenticateToken y checkRole(ADMIN) ya pasaron
    if (!businessId) return res.status(401).json({ message: 'ID de negocio no encontrado en el token.' });

    try {
        const config = await TierConfigService.getBusinessTierConfig(businessId);
        if (!config) {
            // No es necesariamente un error, podría ser que el negocio no existe (aunque el token sí)
            // O simplemente devolvemos un objeto por defecto si queremos que siempre exista config?
            // Por ahora, devolvemos 404 si no hay negocio o config implícitamente.
             return res.status(404).json({ message: 'Configuración de Tiers no encontrada para este negocio.' });
        }
        res.status(200).json(config);
    } catch (error: any) {
        console.error(`[Tiers CTRL] Error getting tier config for business ${businessId}:`, error);
        res.status(500).json({ message: error.message || 'Error interno al obtener la configuración de Tiers.' });
    }
};

export const updateBusinessTierConfigHandler = async (req: Request, res: Response) => {
     const businessId = req.user?.businessId;
     if (!businessId) return res.status(401).json({ message: 'ID de negocio no encontrado en el token.' });

     // TODO: Validar req.body con un DTO (ej: usando class-validator si se añade)
     const configData = req.body; // Asumimos que el body contiene los campos a actualizar

     // Validación básica (mejorar con DTOs)
     if (typeof configData.tierSystemEnabled !== 'boolean' && configData.tierSystemEnabled !== undefined) {
         return res.status(400).json({ message: 'tierSystemEnabled debe ser booleano.' });
     }
     // Añadir más validaciones para enums, periodos, etc.

     try {
         const updatedBusiness = await TierConfigService.updateBusinessTierConfig(businessId, configData);
         // Devolvemos solo la parte de config actualizada para consistencia con GET? O todo el Business?
         // Devolvemos todo por ahora.
         res.status(200).json(updatedBusiness);
     } catch (error: any) {
         console.error(`[Tiers CTRL] Error updating tier config for business ${businessId}:`, error);
         res.status(500).json({ message: error.message || 'Error interno al actualizar la configuración de Tiers.' });
     }
};


// --- Handlers para CRUD de Tiers (Admin) ---

export const createTierHandler = async (req: Request, res: Response) => {
    const businessId = req.user?.businessId;
    if (!businessId) return res.status(401).json({ message: 'ID de negocio no encontrado en el token.' });

    // TODO: Validar req.body con DTO
    const tierData = req.body;

    // Validación básica (mejorar con DTOs)
     if (!tierData.name || typeof tierData.level !== 'number' || typeof tierData.minValue !== 'number') {
         return res.status(400).json({ message: 'Nombre, nivel y valor mínimo son requeridos para el Tier.' });
     }

    try {
        // Pasamos solo los datos relevantes al servicio, excluyendo relaciones/ids
        const { name, level, minValue, description, benefitsDescription, isActive } = tierData;
        const newTier = await TierService.createTier(businessId, { name, level, minValue, description, benefitsDescription, isActive });
        res.status(201).json(newTier);
    } catch (error: any) {
        console.error(`[Tiers CTRL] Error creating tier for business ${businessId}:`, error);
        // Devolver 409 si es error de unicidad
        if (error.message.includes('unicidad')) {
            return res.status(409).json({ message: error.message });
        }
        res.status(500).json({ message: error.message || 'Error interno al crear el Tier.' });
    }
};

export const getBusinessTiersHandler = async (req: Request, res: Response) => {
    const businessId = req.user?.businessId;
    if (!businessId) return res.status(401).json({ message: 'ID de negocio no encontrado en el token.' });
    const includeBenefits = req.query.includeBenefits === 'true'; // Opción para incluir beneficios

    try {
        const tiers = await TierService.findTiersByBusiness(businessId, includeBenefits);
        res.status(200).json(tiers);
    } catch (error: any) {
        console.error(`[Tiers CTRL] Error getting tiers for business ${businessId}:`, error);
        res.status(500).json({ message: error.message || 'Error interno al obtener los Tiers.' });
    }
};

export const getTierByIdHandler = async (req: Request, res: Response) => {
    const businessId = req.user?.businessId;
    const { tierId } = req.params;
    if (!businessId) return res.status(401).json({ message: 'ID de negocio no encontrado en el token.' });
    if (!tierId) return res.status(400).json({ message: 'Se requiere ID del Tier.' });
    const includeBenefits = req.query.includeBenefits === 'true';

    try {
        const tier = await TierService.findTierById(tierId, businessId, includeBenefits);
        if (!tier) {
            return res.status(404).json({ message: 'Tier no encontrado o no pertenece a este negocio.' });
        }
        res.status(200).json(tier);
    } catch (error: any) {
         console.error(`[Tiers CTRL] Error getting tier ${tierId} for business ${businessId}:`, error);
        res.status(500).json({ message: error.message || 'Error interno al obtener el Tier.' });
    }
};

export const updateTierHandler = async (req: Request, res: Response) => {
    const businessId = req.user?.businessId;
    const { tierId } = req.params;
     if (!businessId) return res.status(401).json({ message: 'ID de negocio no encontrado en el token.' });
     if (!tierId) return res.status(400).json({ message: 'Se requiere ID del Tier.' });

     // TODO: Validar req.body con DTO
     const updateData = req.body;
      // Validación básica
      if (Object.keys(updateData).length === 0) {
         return res.status(400).json({ message: 'Se requieren datos para actualizar.' });
      }

     try {
         const updatedTier = await TierService.updateTier(tierId, businessId, updateData);
         res.status(200).json(updatedTier);
     } catch (error: any) {
         console.error(`[Tiers CTRL] Error updating tier ${tierId} for business ${businessId}:`, error);
         if (error.message.includes('no encontrado')) {
             return res.status(404).json({ message: error.message });
         }
         if (error.message.includes('unicidad')) {
             return res.status(409).json({ message: error.message });
         }
         res.status(500).json({ message: error.message || 'Error interno al actualizar el Tier.' });
     }
};

export const deleteTierHandler = async (req: Request, res: Response) => {
    const businessId = req.user?.businessId;
    const { tierId } = req.params;
     if (!businessId) return res.status(401).json({ message: 'ID de negocio no encontrado en el token.' });
     if (!tierId) return res.status(400).json({ message: 'Se requiere ID del Tier.' });

     try {
         const deletedTier = await TierService.deleteTier(tierId, businessId);
         res.status(200).json({ message: 'Tier eliminado correctamente.', deletedTier }); // o res.sendStatus(204)
     } catch (error: any) {
         console.error(`[Tiers CTRL] Error deleting tier ${tierId} for business ${businessId}:`, error);
         if (error.message.includes('no encontrado') || error.message.includes('usuarios asignados')) {
             // 404 si no existe, 409 (Conflicto) si tiene usuarios
             const statusCode = error.message.includes('usuarios asignados') ? 409 : 404;
             return res.status(statusCode).json({ message: error.message });
         }
         res.status(500).json({ message: error.message || 'Error interno al eliminar el Tier.' });
     }
};

// --- Handlers para CRUD de TierBenefits (Admin) ---

export const createTierBenefitHandler = async (req: Request, res: Response) => {
    // Necesitamos el ID del Tier al que añadir el beneficio (vendrá en la URL)
    const businessId = req.user?.businessId; // Para verificar pertenencia del Tier
    const { tierId } = req.params;
    if (!businessId) return res.status(401).json({ message: 'ID de negocio no encontrado en el token.' });
    if (!tierId) return res.status(400).json({ message: 'Se requiere ID del Tier en la URL.' });

    // TODO: Validar req.body con DTO
    const benefitData = req.body;
     // Validación básica
     if (!benefitData.type || !benefitData.value) {
         return res.status(400).json({ message: 'Tipo y valor son requeridos para el beneficio.' });
     }
     // Añadir validación de enum BenefitType

    try {
        // Verificar que el Tier pertenece al negocio antes de crear el beneficio
        const tier = await TierService.findTierById(tierId, businessId);
        if (!tier) {
             return res.status(404).json({ message: 'Tier no encontrado o no pertenece a este negocio.' });
        }
        // Crear el beneficio asociado a ese tierId
        const { type, value, description, isActive } = benefitData;
        const newBenefit = await TierBenefitService.createTierBenefit(tierId, { type, value, description, isActive });
        res.status(201).json(newBenefit);
    } catch (error: any) {
         console.error(`[Tiers CTRL] Error creating benefit for tier ${tierId}:`, error);
        res.status(500).json({ message: error.message || 'Error interno al crear el beneficio.' });
    }
};

export const getTierBenefitsHandler = async (req: Request, res: Response) => {
    const businessId = req.user?.businessId; // Para verificar pertenencia del Tier
    const { tierId } = req.params;
    if (!businessId) return res.status(401).json({ message: 'ID de negocio no encontrado en el token.' });
    if (!tierId) return res.status(400).json({ message: 'Se requiere ID del Tier.' });

    try {
        // Opcional: Verificar que el Tier pertenece al negocio
        const tier = await TierService.findTierById(tierId, businessId);
        if (!tier) {
             return res.status(404).json({ message: 'Tier no encontrado o no pertenece a este negocio.' });
        }
        // Obtener los beneficios
        const benefits = await TierBenefitService.findBenefitsByTier(tierId);
        res.status(200).json(benefits);
    } catch (error: any) {
        console.error(`[Tiers CTRL] Error getting benefits for tier ${tierId}:`, error);
        res.status(500).json({ message: error.message || 'Error interno al obtener los beneficios.' });
    }
};

export const updateTierBenefitHandler = async (req: Request, res: Response) => {
    const { benefitId } = req.params; // Solo necesitamos el ID del beneficio
     if (!benefitId) return res.status(400).json({ message: 'Se requiere ID del Beneficio.' });
    // TODO: Validar req.body con DTO
    const updateData = req.body;
    if (Object.keys(updateData).length === 0) { return res.status(400).json({ message: 'Se requieren datos para actualizar.' }); }

    // Opcional: Verificar que el beneficio pertenece a un tier del negocio logueado (más complejo)
    // const businessId = req.user?.businessId;
    // const benefit = await prisma.tierBenefit.findUnique({ where: {id: benefitId}, include: { tier: { select: { businessId: true }}}})
    // if (!benefit || benefit.tier.businessId !== businessId) return res.status(404)...

    try {
        const updatedBenefit = await TierBenefitService.updateTierBenefit(benefitId, updateData);
        res.status(200).json(updatedBenefit);
    } catch (error: any) {
        console.error(`[Tiers CTRL] Error updating benefit ${benefitId}:`, error);
        if (error.message.includes('no encontrado')) {
            return res.status(404).json({ message: error.message });
        }
        res.status(500).json({ message: error.message || 'Error interno al actualizar el beneficio.' });
    }
};

export const deleteTierBenefitHandler = async (req: Request, res: Response) => {
    const { benefitId } = req.params;
    if (!benefitId) return res.status(400).json({ message: 'Se requiere ID del Beneficio.' });

    // Opcional: Verificar pertenencia al negocio logueado
    try {
        const deletedBenefit = await TierBenefitService.deleteTierBenefit(benefitId);
        res.status(200).json({ message: 'Beneficio eliminado correctamente.', deletedBenefit }); // o res.sendStatus(204)
    } catch (error: any) {
        console.error(`[Tiers CTRL] Error deleting benefit ${benefitId}:`, error);
        if (error.message.includes('no encontrado')) {
            return res.status(404).json({ message: error.message });
        }
        res.status(500).json({ message: error.message || 'Error interno al eliminar el beneficio.' });
    }
};


// --- Handlers para Clientes ---

export const getCustomerTiersHandler = async (req: Request, res: Response) => {
    const businessId = req.user?.businessId; // Cliente final autenticado
    if (!businessId) return res.status(401).json({ message: 'ID de negocio no encontrado en el token del cliente.' });

    try {
         // Reutilizamos la función del servicio de Tiers para obtenerlos
         // Podríamos querer incluir beneficios aquí también para mostrarlos al cliente
        const tiers = await TierService.findTiersByBusiness(businessId, true); // includeBenefits = true
        res.status(200).json(tiers);
    } catch (error: any) {
         console.error(`[Tiers CTRL] Error getting tiers for customer of business ${businessId}:`, error);
        res.status(500).json({ message: error.message || 'Error interno al obtener los niveles del programa.' });
    }
};


// End of File: backend/src/tiers/tiers.controller.ts