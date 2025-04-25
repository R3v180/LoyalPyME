// File: backend/src/customer/customer.controller.ts
// Version: 1.7.0 (Add toggleFavoriteHandler - 100% FULL CODE)

import { Request, Response, NextFunction } from 'express';
// Importa el servicio (¡Ahora TODAS las 8 funciones!)
import {
    findActiveRewardsForCustomer,
    getCustomersForBusiness,
    adjustPointsForCustomer,
    changeCustomerTier,
    assignRewardToCustomer,
    getPendingGrantedRewards,
    redeemGrantedReward,
    toggleFavoriteStatus // <-- Añadida esta importación
} from './customer.service';
import { User } from '@prisma/client'; // Importar tipo User si lo devuelve el servicio

/** (Handler 1: getCustomerRewardsHandler) */
export const getCustomerRewardsHandler = async (req: Request, res: Response, next: NextFunction) => {
  // @ts-ignore
  const businessId = req.user?.businessId;
  // @ts-ignore
  const userId = req.user?.id;
  console.log(`[CUSTOMER CTRL] User ${userId} requesting rewards for business ${businessId}`);
  if (!businessId || !userId) {
    console.error('[CUSTOMER CTRL] Error: businessId or userId missing from req.user');
    return res.status(401).json({ message: 'Información de usuario o negocio no encontrada en la sesión.' });
  }
  try {
    const rewards = await findActiveRewardsForCustomer(businessId);
    res.status(200).json(rewards);
  } catch (error) {
    console.error(`[CUSTOMER CTRL] Error fetching rewards for business ${businessId}:`, error);
    next(error);
  }
};

/** (Handler 2: getAdminCustomers) */
export const getAdminCustomers = async (req: Request, res: Response, next: NextFunction) => {
    // @ts-ignore
    const adminBusinessId = req.user?.businessId;
    if (!adminBusinessId) {
        console.error("[CUST CTRL] No businessId found in req.user for admin.");
        return res.status(403).json({ message: "No se pudo identificar el negocio del administrador." });
    }
    console.log(`[CUST CTRL] Request received for admin customers list for business: ${adminBusinessId}`);
    try {
        const customers = await getCustomersForBusiness(adminBusinessId);
        // Respuesta con paginación placeholder
        const responseData = {
            items: customers,
            currentPage: 1, // Fijo por ahora
            totalPages: 1,  // Fijo por ahora
            totalItems: customers.length
        };
        console.log(`[CUST CTRL] Sending ${customers.length} customers.`);
        res.status(200).json(responseData);
    } catch (error) {
         console.error("[CUST CTRL] Error in getAdminCustomers controller:", error);
         next(error);
    }
};

/** (Handler 3: adjustCustomerPoints) */
export const adjustCustomerPoints = async (req: Request, res: Response, next: NextFunction) => {
    const { customerId } = req.params;
    const { amount, reason } = req.body;
    // @ts-ignore
    const adminUserId = req.user?.id;
    // @ts-ignore
    const adminBusinessId = req.user?.businessId;
    console.log(`[CUST CTRL] Request to adjust points for customer ${customerId} by admin ${adminUserId} from business ${adminBusinessId}`);
    if (!adminBusinessId || !adminUserId) { return res.status(403).json({ message: "Información de administrador no disponible." }); }
    if (!customerId) { return res.status(400).json({ message: "Falta el ID del cliente." }); }
    if (typeof amount !== 'number' || amount === 0) { return res.status(400).json({ message: "La cantidad ('amount') debe ser un número distinto de cero." }); }
    try {
        const updatedCustomer = await adjustPointsForCustomer( customerId, adminBusinessId, amount, reason );
        res.status(200).json({ message: `Puntos ajustados correctamente para ${updatedCustomer.email}.`, customer: { id: updatedCustomer.id, points: updatedCustomer.points } });
    } catch (error) {
        console.error(`[CUST CTRL] Failed to adjust points for customer ${customerId}:`, error);
        next(error);
    }
};


/** (Handler 4: changeCustomerTierHandler) */
export const changeCustomerTierHandler = async (req: Request, res: Response, next: NextFunction) => {
    const { customerId } = req.params; // ID del cliente desde la URL
    const { tierId } = req.body;      // ID del nuevo Tier desde el cuerpo (puede ser null)
    // @ts-ignore
    const adminBusinessId = req.user?.businessId; // ID del negocio del admin (para validación)
    console.log(`[CUST CTRL] Request to change tier for customer ${customerId} to tier ${tierId} by admin from business ${adminBusinessId}`);
    // Validación básica
    if (!adminBusinessId) { return res.status(403).json({ message: "Información de administrador no disponible." }); }
     if (!customerId) { return res.status(400).json({ message: "Falta el ID del cliente." }); }
    try {
        const updatedCustomer = await changeCustomerTier( customerId, adminBusinessId, tierId );
        res.status(200).json({ message: `Nivel cambiado correctamente para ${updatedCustomer.email}.`, customer: { id: updatedCustomer.id, currentTierId: updatedCustomer.currentTierId, tierAchievedAt: updatedCustomer.tierAchievedAt } });
    } catch (error) {
        console.error(`[CUST CTRL] Failed to change tier for customer ${customerId} to ${tierId}:`, error);
        next(error);
    }
};

/** (Handler 5: assignRewardHandler) */
export const assignRewardHandler = async (req: Request, res: Response, next: NextFunction) => {
    const { customerId } = req.params;   // ID del cliente desde la URL
    const { rewardId } = req.body;       // ID de la recompensa desde el cuerpo
    // @ts-ignore
    const adminUserId = req.user?.id;    // ID del admin que hace la acción
    // @ts-ignore
    const adminBusinessId = req.user?.businessId; // ID del negocio del admin
    console.log(`[CUST CTRL] Request to assign reward ${rewardId} to customer ${customerId} by admin ${adminUserId} from business ${adminBusinessId}`);
    // Validaciones básicas de entrada
    if (!adminBusinessId || !adminUserId) { return res.status(403).json({ message: "Información de administrador no disponible." }); }
    if (!customerId) { return res.status(400).json({ message: "Falta el ID del cliente." }); }
    if (!rewardId || typeof rewardId !== 'string') { return res.status(400).json({ message: "Falta el ID de la recompensa ('rewardId') o no es válido." }); }
    try {
        const grantedReward = await assignRewardToCustomer( customerId, adminBusinessId, rewardId, adminUserId );
        res.status(201).json({ message: `Recompensa asignada correctamente al cliente.`, grantedRewardId: grantedReward.id });
    } catch (error) {
        console.error(`[CUST CTRL] Failed to assign reward ${rewardId} to customer ${customerId}:`, error);
        next(error);
    }
};

/** (Handler 6: getPendingGrantedRewardsHandler) */
export const getPendingGrantedRewardsHandler = async (req: Request, res: Response, next: NextFunction) => {
    // @ts-ignore
    const userId = req.user?.id; // @ts-ignore
    const userEmail = req.user?.email;
    console.log(`[CUST CTRL] User ${userId} (${userEmail}) requesting pending granted rewards.`);
    if (!userId) { console.error('[CUST CTRL] Error: userId missing from req.user for granted rewards request.'); return res.status(401).json({ message: 'Información de usuario no encontrada en la sesión.' }); }
    try { const grantedRewards = await getPendingGrantedRewards(userId); res.status(200).json(grantedRewards); }
    catch (error) { console.error(`[CUST CTRL] Failed to fetch pending granted rewards for user ${userId}:`, error); next(error); }
};

/** (Handler 7: redeemGrantedRewardHandler) */
export const redeemGrantedRewardHandler = async (req: Request, res: Response, next: NextFunction) => {
    // @ts-ignore
    const userId = req.user?.id;
    const { grantedRewardId } = req.params;
    console.log(`[CUST CTRL] User ${userId} attempting to redeem granted reward ID: ${grantedRewardId}`);
    if (!userId) { return res.status(401).json({ message: 'Información de usuario no encontrada en la sesión.' }); }
    if (!grantedRewardId) { return res.status(400).json({ message: 'Falta el ID del regalo otorgado en la URL.' }); }
    try {
        const redeemedGrant = await redeemGrantedReward(userId, grantedRewardId);
        res.status(200).json({ message: 'Regalo canjeado con éxito.', grantedRewardId: redeemedGrant.id, rewardId: redeemedGrant.rewardId, redeemedAt: redeemedGrant.redeemedAt });
    } catch (error) {
        console.error(`[CUST CTRL] Failed to redeem granted reward ${grantedRewardId} for user ${userId}:`, error);
        if (error instanceof Error && (error.message.includes('no te pertenece') || error.message.includes('no encontrado'))) { return res.status(403).json({ message: error.message }); }
        if (error instanceof Error && error.message.includes('ya fue canjeado')) { return res.status(409).json({ message: error.message }); }
        next(error);
    }
};

// --- **Handler 8: toggleFavoriteHandler (AÑADIDO)** ---
/**
 * Controlador para que un Admin marque o desmarque un cliente como favorito.
 * PATCH /api/admin/customers/:customerId/toggle-favorite (o PUT)
 */
export const toggleFavoriteHandler = async (req: Request, res: Response, next: NextFunction) => {
    const { customerId } = req.params; // ID del cliente desde la URL
    // @ts-ignore
    const adminBusinessId = req.user?.businessId; // ID del negocio del admin

    console.log(`[CUST CTRL] Request to toggle favorite status for customer ${customerId} by admin from business ${adminBusinessId}`);

    // Validaciones básicas
    if (!adminBusinessId) {
        return res.status(403).json({ message: "Información de administrador no disponible." });
    }
     if (!customerId) {
        return res.status(400).json({ message: "Falta el ID del cliente." });
    }

    try {
        // Llamamos a la función del servicio que creamos en el paso anterior
        const updatedCustomer = await toggleFavoriteStatus(
            customerId,
            adminBusinessId
        );

        // Enviamos respuesta de éxito
        res.status(200).json({
            message: `Estado de favorito cambiado para ${updatedCustomer.email}. Nuevo estado: ${updatedCustomer.isFavorite}`,
            customer: { // Devolvemos info útil para actualizar UI si es necesario
                id: updatedCustomer.id,
                isFavorite: updatedCustomer.isFavorite // El nuevo estado
            }
        });

    } catch (error) {
        console.error(`[CUST CTRL] Failed to toggle favorite status for customer ${customerId}:`, error);
        // Pasamos el error al manejador global (puede ser un error 403/404 si el servicio lo lanza)
        next(error);
    }
};
// --- FIN NUEVA FUNCIÓN ---


// End of File: backend/src/customer/customer.controller.ts