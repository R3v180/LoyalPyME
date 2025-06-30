// backend/src/modules/loyalpyme/customer/customer.controller.ts
// Version: 2.3.0 (Add getAvailableCouponsHandler)

import { Request, Response, NextFunction } from 'express';

// Importar funciones desde el servicio de cliente
import {
    findActiveRewardsForCustomer,
    getPendingGrantedRewards,
    redeemGrantedReward,
    getCustomerFacingBusinessConfig,
    getAvailableCouponsForUser // <-- IMPORTACIÓN AÑADIDA
} from './customer.service';

import * as TierService from '../tiers/tiers.service';


/**
 * Handler para que el cliente obtenga las recompensas activas de su negocio.
 * GET /api/customer/rewards
 */
export const getCustomerRewardsHandler = async (req: Request, res: Response, next: NextFunction) => {
    if (!req.user || !req.user.businessId || !req.user.id) {
        console.error('[CUST_CTRL] Error: User context (id or businessId) missing from request.');
        return res.status(401).json({ message: 'Información de usuario o negocio no encontrada en la sesión.' });
    }
    const businessId = req.user.businessId;
    const userId = req.user.id;
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
     if (!req.user || !req.user.id) {
        console.error('[CUST_CTRL] Error: userId missing from req.user for granted rewards request.');
        return res.status(401).json({ message: 'Información de usuario no encontrada en la sesión.' });
    }
    const userId = req.user.id;
    const userEmail = req.user.email;
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
     if (!req.user || !req.user.id) {
        console.error('[CUST_CTRL] Error: userId missing from req.user for redeem request.');
        return res.status(401).json({ message: 'Información de usuario no encontrada en la sesión.' });
    }
    const userId = req.user.id;
    const { grantedRewardId } = req.params;
    console.log(`[CUST_CTRL] User ${userId} attempting to redeem granted reward ID: ${grantedRewardId}`);
    if (!grantedRewardId) { return res.status(400).json({ message: 'Falta el ID del regalo otorgado en la URL.' }); }
    try {
        const redeemedGrant = await redeemGrantedReward(userId, grantedRewardId);
        res.status(200).json({ message: 'Regalo canjeado con éxito.', grantedRewardId: redeemedGrant.id, rewardId: redeemedGrant.rewardId, redeemedAt: redeemedGrant.redeemedAt });
    }
    catch (error) {
        console.error(`[CUST_CTRL] Failed to redeem granted reward ${grantedRewardId} for user ${userId}:`, error);
        if (error instanceof Error && (error.message.includes('no te pertenece') || error.message.includes('no encontrado'))) {
            return res.status(403).json({ message: error.message });
        }
        if (error instanceof Error && error.message.includes('ya fue canjeado')) {
            return res.status(409).json({ message: error.message });
        }
        next(error);
    }
};


/**
 * Handler para que el cliente obtenga los Tiers disponibles en su programa.
 * GET /api/customer/tiers
 */
export const getCustomerTiersHandler = async (req: Request, res: Response, next: NextFunction) => {
    if (!req.user || !req.user.businessId || !req.user.id) {
        console.error('[CUST_CTRL] Error: User context (id or businessId) missing in getCustomerTiersHandler.');
        return res.status(401).json({ message: 'Información de usuario o negocio no encontrada en la sesión.' });
    }
    const businessId = req.user.businessId;
    const userId = req.user.id;
    console.log(`[CUST_CTRL] User ${userId} requesting available tiers for business ${businessId}.`);
    try {
        const tiers = await TierService.findTiersByBusiness(businessId, true);
        res.status(200).json(tiers);
    } catch (error: any) {
        console.error(`[CUST_CTRL] Error getting tiers for customer of business ${businessId}:`, error);
        next(error);
    }
};

/**
 * Handler para que el cliente obtenga la configuración relevante de su negocio.
 * GET /api/customer/business-config
 */
export const getCustomerBusinessConfigHandler = async (req: Request, res: Response, next: NextFunction) => {
    if (!req.user || !req.user.businessId) {
        console.error('[CUST_CTRL] Error: businessId missing from req.user for business-config request.');
        return res.status(401).json({ message: 'Información de negocio no encontrada en la sesión.' });
    }
    const businessId = req.user.businessId;
    const userId = req.user.id; 

    console.log(`[CUST_CTRL] User ${userId} requesting business config for business ${businessId}.`);

    try {
        const config = await getCustomerFacingBusinessConfig(businessId);

        if (!config) {
            console.warn(`[CUST_CTRL] Business config not found for businessId: ${businessId}`);
            return res.status(404).json({ message: 'No se encontró la configuración para el negocio asociado.' });
        }

        res.status(200).json(config);

    } catch (error) {
        console.error(`[CUST_CTRL] Error getting business config for user ${userId}, business ${businessId}:`, error);
        next(error);
    }
};

// --- NUEVO HANDLER AÑADIDO ---
/**
 * Handler para que el cliente obtenga sus cupones disponibles (GrantedRewards con estado AVAILABLE).
 * GET /api/customer/available-coupons
 */
export const getAvailableCouponsHandler = async (req: Request, res: Response, next: NextFunction) => {
    if (!req.user || !req.user.id) {
        return res.status(401).json({ message: 'Información de usuario no encontrada en la sesión.' });
    }
    const userId = req.user.id;
    console.log(`[CUST_CTRL] User ${userId} requesting their available coupons.`);

    try {
        const availableCoupons = await getAvailableCouponsForUser(userId);
        res.status(200).json(availableCoupons);
    } catch (error) {
        console.error(`[CUST_CTRL] Error fetching available coupons for user ${userId}:`, error);
        next(error);
    }
};