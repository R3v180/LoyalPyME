// filename: backend/src/customer/customer.controller.ts
// --- INICIO DEL CÓDIGO MODIFICADO ---
// File: backend/src/customer/customer.controller.ts
// Version: 2.1.0 (Refactored: Added getCustomerTiersHandler from tiers controller)

import { Request, Response, NextFunction } from 'express';

// Importar funciones desde el servicio de cliente refactorizado
import {
    findActiveRewardsForCustomer,
    getPendingGrantedRewards,
    redeemGrantedReward
} from './customer.service';

// --- NUEVO: Importar TierService para el nuevo handler ---
import * as TierService from '../tiers/tiers.service';
// -------------------------------------------------------


/**
 * Handler para que el cliente obtenga las recompensas activas de su negocio.
 * (Handler 1 original, sin cambios funcionales)
 */
export const getCustomerRewardsHandler = async (req: Request, res: Response, next: NextFunction) => {
  // @ts-ignore
  const businessId = req.user?.businessId;
  // @ts-ignore
  const userId = req.user?.id;
  console.log(`[CUST_CTRL] User ${userId} requesting rewards for business ${businessId}`);

  if (!businessId || !userId) {
    console.error('[CUST_CTRL] Error: businessId or userId missing from req.user');
    return res.status(401).json({ message: 'InformaciÃ³n de usuario o negocio no encontrada en la sesiÃ³n.' });
  }
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
 * (Handler 6 original, sin cambios funcionales)
 */
export const getPendingGrantedRewardsHandler = async (req: Request, res: Response, next: NextFunction) => {
    // @ts-ignore
    const userId = req.user?.id;
    // @ts-ignore
    const userEmail = req.user?.email;
    console.log(`[CUST_CTRL] User ${userId} (${userEmail}) requesting pending granted rewards.`);

    if (!userId) {
        console.error('[CUST_CTRL] Error: userId missing from req.user for granted rewards request.');
        return res.status(401).json({ message: 'InformaciÃ³n de usuario no encontrada en la sesiÃ³n.' });
    }
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
 * Handler para que el cliente canjee un regalo especÃ­fico.
 * (Handler 7 original, sin cambios funcionales)
 */
export const redeemGrantedRewardHandler = async (req: Request, res: Response, next: NextFunction) => {
    // @ts-ignore
    const userId = req.user?.id;
    const { grantedRewardId } = req.params;
    console.log(`[CUST_CTRL] User ${userId} attempting to redeem granted reward ID: ${grantedRewardId}`);

    if (!userId) { return res.status(401).json({ message: 'InformaciÃ³n de usuario no encontrada en la sesiÃ³n.' }); }
    if (!grantedRewardId) { return res.status(400).json({ message: 'Falta el ID del regalo otorgado en la URL.' }); }

    try {
        const redeemedGrant = await redeemGrantedReward(userId, grantedRewardId);
        res.status(200).json({ message: 'Regalo canjeado con Ã©xito.', grantedRewardId: redeemedGrant.id, rewardId: redeemedGrant.rewardId, redeemedAt: redeemedGrant.redeemedAt });
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


// --- NUEVO HANDLER AÃ‘ADIDO (Movido desde tiers.controller) ---
/**
 * Handler para que el cliente obtenga los Tiers disponibles en su programa.
 * GET /api/customer/tiers (Asumiendo que se monta asÃ­ en las rutas)
 */
export const getCustomerTiersHandler = async (req: Request, res: Response, next: NextFunction) => {
    // @ts-ignore
    const businessId = req.user?.businessId; // Cliente final autenticado
    // @ts-ignore
    const userId = req.user?.id;
     console.log(`[CUST_CTRL] User ${userId} requesting available tiers for business ${businessId}.`);

    if (!businessId) return res.status(401).json({ message: 'ID de negocio no encontrado en el token del cliente.' });

    try {
         // Llama a la funciÃ³n del servicio de Tiers para obtenerlos
         // Incluimos beneficios para mostrarlos al cliente
        const tiers = await TierService.findTiersByBusiness(businessId, true); // includeBenefits = true
        res.status(200).json(tiers);
    } catch (error: any) {
         console.error(`[CUST_CTRL] Error getting tiers for customer of business ${businessId}:`, error);
         // Pasamos el error al manejador global
         next(error); // Usar next(error) es mÃ¡s consistente
        // res.status(500).json({ message: error.message || 'Error interno al obtener los niveles del programa.' });
    }
};
// --- FIN NUEVO HANDLER ---


// End of File: backend/src/customer/customer.controller.ts
// --- FIN DEL CÃ“DIGO MODIFICADO ---