// filename: backend/src/admin/admin-customer-individual.controller.ts
// Version: 1.0.0 (Handlers extracted from admin-customer.controller, @ts-ignore removed, cleaned)

import { Request, Response, NextFunction } from 'express';
import { Prisma } from '@prisma/client'; // Para tipos de error

// Importar solo los servicios necesarios para acciones individuales
import {
    getCustomerDetailsById,
    updateAdminNotesForCustomer,
    adjustPointsForCustomer,
    changeCustomerTier,
    assignRewardToCustomer,
    toggleFavoriteStatus,
    toggleActiveStatusForCustomer
} from './admin-customer-individual.service'; // Ajustado a la nueva ubicación del servicio

/**
 * Handler para obtener los detalles completos de un cliente específico.
 */
export const getCustomerDetailsHandler = async (req: Request, res: Response, next: NextFunction) => {
    const { customerId } = req.params;

    // --- FIX: Comprobación explícita de req.user y req.user.businessId ---
    if (!req.user || !req.user.businessId) {
        console.error("[ADM_CUST_IND_CTRL] Critical: User or businessId missing in getCustomerDetailsHandler.");
        return res.status(401).json({ message: "Información de autenticación no encontrada." });
    }
    const adminBusinessId = req.user.businessId;
    // --- FIN FIX ---

    console.log(`[ADM_CUST_IND_CTRL] Request to get details for customer ${customerId} by admin from business ${adminBusinessId}`);
    if (!customerId) { return res.status(400).json({ message: "Falta el ID del cliente." }); }

    try {
        const customerDetails = await getCustomerDetailsById(customerId, adminBusinessId);
        if (!customerDetails) { return res.status(404).json({ message: "Cliente no encontrado o no pertenece a este negocio." }); }
        res.status(200).json(customerDetails);
    } catch (error) {
        console.error(`[ADM_CUST_IND_CTRL] Failed to get details for customer ${customerId}:`, error);
        // Pasar error al manejador global, excepto 404
        if (error instanceof Error && (error.message.includes('no encontrado') || error.message.includes('no pertenece'))) {
            return res.status(404).json({ message: error.message });
        }
        next(error);
    }
};

/**
 * Handler para actualizar las notas de administrador de un cliente.
 */
export const updateCustomerNotesHandler = async (req: Request, res: Response, next: NextFunction) => {
    const { customerId } = req.params;
    const { notes } = req.body;

    // --- FIX: Comprobación explícita ---
    if (!req.user || !req.user.businessId) {
        console.error("[ADM_CUST_IND_CTRL] Critical: User or businessId missing in updateCustomerNotesHandler.");
        return res.status(401).json({ message: "Información de autenticación no encontrada." });
    }
    const adminBusinessId = req.user.businessId;
    // --- FIN FIX ---

    console.log(`[ADM_CUST_IND_CTRL] Request to update notes for customer ${customerId} by admin from business ${adminBusinessId}`);
    if (!customerId) { return res.status(400).json({ message: "Falta el ID del cliente." }); }
    // Permitir enviar 'notes' como null explícitamente
    if (notes === undefined) { return res.status(400).json({ message: "Falta el campo 'notes' en el cuerpo de la petición (puede ser null)." }); }
    if (notes !== null && typeof notes !== 'string') { return res.status(400).json({ message: "El campo 'notes' debe ser un texto o nulo." }); }

    try {
        const updatedCustomer = await updateAdminNotesForCustomer(customerId, adminBusinessId, notes);
        res.status(200).json({ message: `Notas actualizadas correctamente para ${updatedCustomer.email}.` }); // Corregido: correctamente
    } catch (error) {
        console.error(`[ADM_CUST_IND_CTRL] Failed to update notes for customer ${customerId}:`, error);
         if (error instanceof Error && (error.message.includes('no encontrado') || error.message.includes('no pertenece'))) {
             return res.status(404).json({ message: error.message });
        }
        next(error);
    }
};

/**
 * Handler para ajustar puntos.
 */
export const adjustCustomerPoints = async (req: Request, res: Response, next: NextFunction) => {
    const { customerId } = req.params;
    const { amount, reason } = req.body;

    // --- FIX: Comprobación explícita ---
    if (!req.user || !req.user.businessId || !req.user.id) { // Necesitamos id y businessId
        console.error("[ADM_CUST_IND_CTRL] Critical: User, businessId or userId missing in adjustCustomerPoints.");
        return res.status(401).json({ message: "Información de autenticación no encontrada." });
    }
    const adminUserId = req.user.id; // Se usaba implícitamente antes, ahora explícito
    const adminBusinessId = req.user.businessId;
     // --- FIN FIX ---

    if (!customerId) { return res.status(400).json({ message: "Falta el ID del cliente." }); }
    if (typeof amount !== 'number' || amount === 0) { return res.status(400).json({ message: "La cantidad ('amount') debe ser un número distinto de cero." }); }

    try {
        const updatedCustomer = await adjustPointsForCustomer( customerId, adminBusinessId, amount, reason );
        res.status(200).json({ message: `Puntos ajustados correctamente para ${updatedCustomer.email}.`, customer: { id: updatedCustomer.id, points: updatedCustomer.points } }); // Corregido: correctamente
    }
    catch (error) { console.error(`[ADM_CUST_IND_CTRL] Failed to adjust points for customer ${customerId}:`, error); next(error); }
};

/**
 * Handler para cambiar tier.
 */
export const changeCustomerTierHandler = async (req: Request, res: Response, next: NextFunction) => {
    const { customerId } = req.params;
    const { tierId } = req.body;

     // --- FIX: Comprobación explícita ---
     if (!req.user || !req.user.businessId) {
        console.error("[ADM_CUST_IND_CTRL] Critical: User or businessId missing in changeCustomerTierHandler.");
        return res.status(401).json({ message: "Información de autenticación no encontrada." });
    }
    const adminBusinessId = req.user.businessId;
    // --- FIN FIX ---

    if (!customerId) { return res.status(400).json({ message: "Falta el ID del cliente." }); }
    if (tierId === undefined) { return res.status(400).json({ message: "Falta el ID del nivel ('tierId') en el cuerpo de la petición (puede ser nulo)." }); }
    if (tierId !== null && typeof tierId !== 'string') { return res.status(400).json({ message: "El ID del nivel ('tierId') debe ser un texto o nulo." }); }

    try {
        const updatedCustomer = await changeCustomerTier( customerId, adminBusinessId, tierId );
        res.status(200).json({ message: `Nivel cambiado correctamente para ${updatedCustomer.email}.`, customer: { id: updatedCustomer.id, currentTierId: updatedCustomer.currentTierId, tierAchievedAt: updatedCustomer.tierAchievedAt } }); // Corregido: correctamente
    }
    catch (error) { console.error(`[ADM_CUST_IND_CTRL] Failed to change tier for customer ${customerId} to ${tierId}:`, error); next(error); }
};

/**
 * Handler para asignar recompensa.
 */
export const assignRewardHandler = async (req: Request, res: Response, next: NextFunction) => {
    const { customerId } = req.params;
    const { rewardId } = req.body;

    // --- FIX: Comprobación explícita ---
    if (!req.user || !req.user.businessId || !req.user.id) { // Necesitamos id y businessId
        console.error("[ADM_CUST_IND_CTRL] Critical: User, businessId or userId missing in assignRewardHandler.");
        return res.status(401).json({ message: "Información de autenticación no encontrada." });
    }
    const adminUserId = req.user.id;
    const adminBusinessId = req.user.businessId;
     // --- FIN FIX ---

    if (!customerId) { return res.status(400).json({ message: "Falta el ID del cliente." }); }
    if (!rewardId || typeof rewardId !== 'string') { return res.status(400).json({ message: "Falta el ID de la recompensa ('rewardId') o no es válido." }); // Corregido: válido
    }

    try {
        const grantedReward = await assignRewardToCustomer( customerId, adminBusinessId, rewardId, adminUserId );
        res.status(201).json({ message: `Recompensa asignada correctamente al cliente.`, grantedRewardId: grantedReward.id }); // Corregido: correctamente
    }
    catch (error) { console.error(`[ADM_CUST_IND_CTRL] Failed to assign reward ${rewardId} to customer ${customerId}:`, error); next(error); }
};

/**
 * Handler para toggle favorito.
 */
export const toggleFavoriteHandler = async (req: Request, res: Response, next: NextFunction) => {
    const { customerId } = req.params;

    // --- FIX: Comprobación explícita ---
    if (!req.user || !req.user.businessId) {
        console.error("[ADM_CUST_IND_CTRL] Critical: User or businessId missing in toggleFavoriteHandler.");
        return res.status(401).json({ message: "Información de autenticación no encontrada." });
    }
    const adminBusinessId = req.user.businessId;
    // --- FIN FIX ---

    if (!customerId) { return res.status(400).json({ message: "Falta el ID del cliente." }); }

    try {
        const updatedCustomer = await toggleFavoriteStatus( customerId, adminBusinessId );
        res.status(200).json({ message: `Estado de favorito cambiado para ${updatedCustomer.email}. Nuevo estado: ${updatedCustomer.isFavorite}`, customer: { id: updatedCustomer.id, isFavorite: updatedCustomer.isFavorite } });
    }
    catch (error) { console.error(`[ADM_CUST_IND_CTRL] Failed to toggle favorite status for customer ${customerId}:`, error); next(error); }
};

/**
 * Handler para toggle activo.
 */
export const toggleActiveStatusHandler = async (req: Request, res: Response, next: NextFunction) => {
    const { customerId } = req.params;

     // --- FIX: Comprobación explícita ---
     if (!req.user || !req.user.businessId) {
        console.error("[ADM_CUST_IND_CTRL] Critical: User or businessId missing in toggleActiveStatusHandler.");
        return res.status(401).json({ message: "Información de autenticación no encontrada." });
    }
    const adminBusinessId = req.user.businessId;
    // --- FIN FIX ---

    if (!customerId) { return res.status(400).json({ message: "Falta el ID del cliente." }); }

    try {
        const updatedCustomer = await toggleActiveStatusForCustomer(customerId, adminBusinessId);
        res.status(200).json({ message: `Estado cambiado para ${updatedCustomer.email}. Nuevo estado: ${updatedCustomer.isActive ? 'Activo' : 'Inactivo'}`, customer: { id: updatedCustomer.id, isActive: updatedCustomer.isActive } });
    } catch (error) { console.error(`[ADM_CUST_IND_CTRL] Failed to toggle active status for customer ${customerId}:`, error); next(error); }
};


// End of File: backend/src/admin/admin-customer-individual.controller.ts