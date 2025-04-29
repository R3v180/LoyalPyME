// filename: backend/src/customer/customer.controller.ts
// Version: 2.1.1 (Fix encoding, remove @ts-ignore)

import { Request, Response, NextFunction } from 'express';

// Importar funciones desde el servicio de cliente
import {
    findActiveRewardsForCustomer,
    getPendingGrantedRewards,
    redeemGrantedReward
} from './customer.service';

// Importar TierService para el handler de tiers del cliente
import * as TierService from '../tiers/tiers.service';


/**
 * Handler para que el cliente obtenga las recompensas activas de su negocio.
 * GET /api/customer/rewards
 */
export const getCustomerRewardsHandler = async (req: Request, res: Response, next: NextFunction) => {
    // --- FIX: Comprobar req.user ---
    if (!req.user || !req.user.businessId || !req.user.id) {
        console.error('[CUST_CTRL] Error: User context (id or businessId) missing from request.');
        return res.status(401).json({ message: 'Información de usuario o negocio no encontrada en la sesión.' }); // Corregido: Información, sesión
    }
    const businessId = req.user.businessId;
    const userId = req.user.id;
    // --- FIN FIX ---

    console.log(`[CUST_CTRL] User ${userId} requesting rewards for business ${businessId}`);

    try {
        const rewards = await findActiveRewardsForCustomer(businessId);
        res.status(200).json(rewards);
    } catch (error) {
        console.error(`[CUST_CTRL] Error fetching rewards for business ${businessId}:`, error);
        next(error);
    }
};

/**
 * Handler para que el cliente obtenga sus regalos pendientes.
 * GET /api/customer/granted-rewards
 */
export const getPendingGrantedRewardsHandler = async (req: Request, res: Response, next: NextFunction) => {
     // --- FIX: Comprobar req.user ---
     if (!req.user || !req.user.id) {
        console.error('[CUST_CTRL] Error: userId missing from req.user for granted rewards request.');
        return res.status(401).json({ message: 'Información de usuario no encontrada en la sesión.' }); // Corregido: Información, sesión
    }
    const userId = req.user.id;
    const userEmail = req.user.email; // Email es opcional aquí pero útil para log
     // --- FIN FIX ---

    console.log(`[CUST_CTRL] User ${userId} (${userEmail || 'N/A'}) requesting pending granted rewards.`);

    try {
        const grantedRewards = await getPendingGrantedRewards(userId);
        res.status(200).json(grantedRewards);
    }
    catch (error) {
        console.error(`[CUST_CTRL] Failed to fetch pending granted rewards for user ${userId}:`, error);
        next(error);
    }
};

/**
 * Handler para que el cliente canjee un regalo específico.
 * POST /api/customer/granted-rewards/:grantedRewardId/redeem
 */
export const redeemGrantedRewardHandler = async (req: Request, res: Response, next: NextFunction) => {
     // --- FIX: Comprobar req.user ---
     if (!req.user || !req.user.id) {
        console.error('[CUST_CTRL] Error: userId missing from req.user for redeem request.');
        return res.status(401).json({ message: 'Información de usuario no encontrada en la sesión.' }); // Corregido: Información, sesión
    }
    const userId = req.user.id;
     // --- FIN FIX ---

    const { grantedRewardId } = req.params;
    console.log(`[CUST_CTRL] User ${userId} attempting to redeem granted reward ID: ${grantedRewardId}`);

    if (!grantedRewardId) { return res.status(400).json({ message: 'Falta el ID del regalo otorgado en la URL.' }); }

    try {
        const redeemedGrant = await redeemGrantedReward(userId, grantedRewardId);
        res.status(200).json({ message: 'Regalo canjeado con éxito.', grantedRewardId: redeemedGrant.id, rewardId: redeemedGrant.rewardId, redeemedAt: redeemedGrant.redeemedAt }); // Corregido: éxito
    }
    catch (error) {
        console.error(`[CUST_CTRL] Failed to redeem granted reward ${grantedRewardId} for user ${userId}:`, error);
        // Manejo de errores específicos del servicio
        if (error instanceof Error && (error.message.includes('no te pertenece') || error.message.includes('no encontrado'))) {
            return res.status(403).json({ message: error.message }); // 403 Forbidden o 404 Not Found
        }
        if (error instanceof Error && error.message.includes('ya fue canjeado')) {
            return res.status(409).json({ message: error.message }); // 409 Conflict
        }
        next(error); // Otros errores al manejador global
    }
};


/**
 * Handler para que el cliente obtenga los Tiers disponibles en su programa.
 * GET /api/customer/tiers
 */
export const getCustomerTiersHandler = async (req: Request, res: Response, next: NextFunction) => {
    // --- FIX: Comprobar req.user ---
    if (!req.user || !req.user.businessId || !req.user.id) {
        console.error('[CUST_CTRL] Error: User context (id or businessId) missing in getCustomerTiersHandler.');
        return res.status(401).json({ message: 'Información de usuario o negocio no encontrada en la sesión.' }); // Corregido: Información, sesión
    }
    const businessId = req.user.businessId;
    const userId = req.user.id;
    // --- FIN FIX ---

    console.log(`[CUST_CTRL] User ${userId} requesting available tiers for business ${businessId}.`);

    try {
        // Llama a la función del servicio de Tiers para obtenerlos
        const tiers = await TierService.findTiersByBusiness(businessId, true); // includeBenefits = true
        res.status(200).json(tiers);
    } catch (error: any) {
        console.error(`[CUST_CTRL] Error getting tiers for customer of business ${businessId}:`, error);
        next(error);
    }
};


// End of File: backend/src/customer/customer.controller.ts