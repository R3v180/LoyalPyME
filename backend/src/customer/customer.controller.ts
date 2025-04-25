// File: backend/src/customer/customer.controller.ts
// Version: 1.8.0 (Add toggleFavoriteHandler and filter logic to getAdminCustomers - 100% FULL CODE)

import { Request, Response, NextFunction } from 'express';
// Importa el servicio (Las 8 funciones)
import {
    findActiveRewardsForCustomer,
    getCustomersForBusiness,
    adjustPointsForCustomer,
    changeCustomerTier,
    assignRewardToCustomer,
    getPendingGrantedRewards,
    redeemGrantedReward,
    toggleFavoriteStatus
} from './customer.service';
import { User, UserRole } from '@prisma/client'; // Importar UserRole también

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

// --- Handler 2: getAdminCustomers (MODIFICADO PARA FILTROS/SORT/PAG) ---
/**
 * Controlador para que el Admin obtenga la lista PAGINADA, FILTRADA y ORDENADA de clientes.
 * Lee query parameters: page, limit, sortBy, sortDir, search, isFavorite, isActive
 */
export const getAdminCustomers = async (req: Request, res: Response, next: NextFunction) => {
    // @ts-ignore
    const adminBusinessId = req.user?.businessId;
    if (!adminBusinessId) {
        console.error("[CUST CTRL] No businessId found in req.user for admin.");
        return res.status(403).json({ message: "No se pudo identificar el negocio del administrador." });
    }

    // --- LEER QUERY PARAMS ---
    const page = parseInt(req.query.page as string || '1', 10);
    const limit = parseInt(req.query.limit as string || '10', 10);
    const sortBy = req.query.sortBy as string || 'createdAt'; // Campo por defecto
    const sortDir = (req.query.sortDir as string === 'asc') ? 'asc' : 'desc'; // Dirección por defecto
    const search = req.query.search as string || undefined;
    const isFavoriteParam = req.query.isFavorite as string;
    const isActiveParam = req.query.isActive as string;

    // Convertir params a tipos correctos para el servicio
    // Definimos GetCustomersOptions aquí para claridad (idealmente iría en un archivo de tipos)
    interface GetCustomersOptions {
        page?: number; limit?: number; sortBy?: string; sortDir?: 'asc' | 'desc';
        filters?: { search?: string; isFavorite?: boolean; isActive?: boolean; }
    }
    const options: GetCustomersOptions = {
        page: isNaN(page) || page < 1 ? 1 : page,
        limit: isNaN(limit) || limit < 1 ? 10 : limit,
        sortBy: sortBy,
        sortDir: sortDir,
        filters: {
            search: search?.trim() || undefined,
            isFavorite: isFavoriteParam === undefined ? undefined : isFavoriteParam === 'true',
            isActive: isActiveParam === undefined ? undefined : isActiveParam === 'true',
        }
    };
    // --------------------------

    console.log(`[CUST CTRL] Request received for admin customers list for business: ${adminBusinessId} with options:`, options);

    try {
        // Llamamos al servicio CON el objeto options
        const result = await getCustomersForBusiness(adminBusinessId, options);

        // El servicio ya devuelve el objeto con formato { items, currentPage, totalPages, totalItems }
        console.log(`[CUST CTRL] Sending ${result.items.length} customers of ${result.totalItems} total.`);
        res.status(200).json(result); // Devolvemos directamente el resultado del servicio

    } catch (error) {
         console.error("[CUST CTRL] Error in getAdminCustomers controller:", error);
         next(error);
    }
};
// --- FIN Handler 2 MODIFICADO ---


/** (Handler 3: adjustCustomerPoints) */
export const adjustCustomerPoints = async (req: Request, res: Response, next: NextFunction) => {
    const { customerId } = req.params; const { amount, reason } = req.body; // @ts-ignore
    const adminUserId = req.user?.id; // @ts-ignore
    const adminBusinessId = req.user?.businessId;
    console.log(`[CUST CTRL] Request to adjust points for customer ${customerId} by admin ${adminUserId} from business ${adminBusinessId}`);
    if (!adminBusinessId || !adminUserId) { return res.status(403).json({ message: "Información de administrador no disponible." }); }
    if (!customerId) { return res.status(400).json({ message: "Falta el ID del cliente." }); }
    if (typeof amount !== 'number' || amount === 0) { return res.status(400).json({ message: "La cantidad ('amount') debe ser un número distinto de cero." }); }
    try { const updatedCustomer = await adjustPointsForCustomer( customerId, adminBusinessId, amount, reason ); res.status(200).json({ message: `Puntos ajustados correctamente para ${updatedCustomer.email}.`, customer: { id: updatedCustomer.id, points: updatedCustomer.points } }); }
    catch (error) { console.error(`[CUST CTRL] Failed to adjust points for customer ${customerId}:`, error); next(error); }
};

/** (Handler 4: changeCustomerTierHandler) */
export const changeCustomerTierHandler = async (req: Request, res: Response, next: NextFunction) => {
    const { customerId } = req.params; const { tierId } = req.body; // @ts-ignore
    const adminBusinessId = req.user?.businessId;
    console.log(`[CUST CTRL] Request to change tier for customer ${customerId} to tier ${tierId} by admin from business ${adminBusinessId}`);
    if (!adminBusinessId) { return res.status(403).json({ message: "Información de administrador no disponible." }); }
    if (!customerId) { return res.status(400).json({ message: "Falta el ID del cliente." }); }
    try { const updatedCustomer = await changeCustomerTier( customerId, adminBusinessId, tierId ); res.status(200).json({ message: `Nivel cambiado correctamente para ${updatedCustomer.email}.`, customer: { id: updatedCustomer.id, currentTierId: updatedCustomer.currentTierId, tierAchievedAt: updatedCustomer.tierAchievedAt } }); }
    catch (error) { console.error(`[CUST CTRL] Failed to change tier for customer ${customerId} to ${tierId}:`, error); next(error); }
};

/** (Handler 5: assignRewardHandler) */
export const assignRewardHandler = async (req: Request, res: Response, next: NextFunction) => {
    const { customerId } = req.params; const { rewardId } = req.body; // @ts-ignore
    const adminUserId = req.user?.id; // @ts-ignore
    const adminBusinessId = req.user?.businessId;
    console.log(`[CUST CTRL] Request to assign reward ${rewardId} to customer ${customerId} by admin ${adminUserId} from business ${adminBusinessId}`);
    if (!adminBusinessId || !adminUserId) { return res.status(403).json({ message: "Información de administrador no disponible." }); }
    if (!customerId) { return res.status(400).json({ message: "Falta el ID del cliente." }); }
    if (!rewardId || typeof rewardId !== 'string') { return res.status(400).json({ message: "Falta el ID de la recompensa ('rewardId') o no es válido." }); }
    try { const grantedReward = await assignRewardToCustomer( customerId, adminBusinessId, rewardId, adminUserId ); res.status(201).json({ message: `Recompensa asignada correctamente al cliente.`, grantedRewardId: grantedReward.id }); }
    catch (error) { console.error(`[CUST CTRL] Failed to assign reward ${rewardId} to customer ${customerId}:`, error); next(error); }
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
    const userId = req.user?.id; const { grantedRewardId } = req.params;
    console.log(`[CUST CTRL] User ${userId} attempting to redeem granted reward ID: ${grantedRewardId}`);
    if (!userId) { return res.status(401).json({ message: 'Información de usuario no encontrada en la sesión.' }); }
    if (!grantedRewardId) { return res.status(400).json({ message: 'Falta el ID del regalo otorgado en la URL.' }); }
    try { const redeemedGrant = await redeemGrantedReward(userId, grantedRewardId); res.status(200).json({ message: 'Regalo canjeado con éxito.', grantedRewardId: redeemedGrant.id, rewardId: redeemedGrant.rewardId, redeemedAt: redeemedGrant.redeemedAt }); }
    catch (error) { console.error(`[CUST CTRL] Failed to redeem granted reward ${grantedRewardId} for user ${userId}:`, error); if (error instanceof Error && (error.message.includes('no te pertenece') || error.message.includes('no encontrado'))) { return res.status(403).json({ message: error.message }); } if (error instanceof Error && error.message.includes('ya fue canjeado')) { return res.status(409).json({ message: error.message }); } next(error); }
};

/** (Handler 8: toggleFavoriteHandler) */
export const toggleFavoriteHandler = async (req: Request, res: Response, next: NextFunction) => {
    const { customerId } = req.params; // @ts-ignore
    const adminBusinessId = req.user?.businessId;
    console.log(`[CUST CTRL] Request to toggle favorite status for customer ${customerId} by admin from business ${adminBusinessId}`);
    if (!adminBusinessId) { return res.status(403).json({ message: "Información de administrador no disponible." }); }
    if (!customerId) { return res.status(400).json({ message: "Falta el ID del cliente." }); }
    try { const updatedCustomer = await toggleFavoriteStatus( customerId, adminBusinessId ); res.status(200).json({ message: `Estado de favorito cambiado para ${updatedCustomer.email}. Nuevo estado: ${updatedCustomer.isFavorite}`, customer: { id: updatedCustomer.id, isFavorite: updatedCustomer.isFavorite } }); }
    catch (error) { console.error(`[CUST CTRL] Failed to toggle favorite status for customer ${customerId}:`, error); next(error); }
};

// End of File: backend/src/customer/customer.controller.ts