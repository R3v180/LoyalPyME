// filename: backend/src/customer/admin-customer.controller.ts
// Version: 1.5.0 (Add handler for bulk deleting customers)

import { Request, Response, NextFunction } from 'express';
import { UserRole } from '@prisma/client';

// --- Importar funciones desde el servicio ---
import {
    getCustomersForBusiness,
    adjustPointsForCustomer,
    changeCustomerTier,
    assignRewardToCustomer,
    toggleFavoriteStatus,
    toggleActiveStatusForCustomer,
    getCustomerDetailsById,
    updateAdminNotesForCustomer,
    bulkUpdateStatusForCustomers,
    bulkDeleteCustomers // <-- Importar la nueva función del servicio
    // GetCustomersOptions
} from '../admin/admin-customer.service'; // Confirma esta ruta

// --- Tipos y Interfaces (sin cambios) ---
type SortDirection = 'asc' | 'desc';
interface GetCustomersOptions { /* ... */ }

// --- Handlers Existentes (Código completo restaurado) ---

export const getAdminCustomers = async (req: Request, res: Response, next: NextFunction) => {
    console.log('[ADM_CUST_CTRL] Entering getAdminCustomers handler...'); // LOG 1
    // @ts-ignore
    const adminBusinessId = req.user?.businessId;
    if (!adminBusinessId) { console.error("[ADM_CUST_CTRL] No businessId found..."); return res.status(403).json({ message: "..." }); }
    console.log(`[ADM_CUST_CTRL] Admin businessId: ${adminBusinessId}`); // LOG 2
    const page = parseInt(req.query.page as string || '1', 10);
    const limit = parseInt(req.query.limit as string || '10', 10);
    const sortBy = req.query.sortBy as string || 'createdAt';
    const sortDirInput = req.query.sortDir as string;
    const sortDir: SortDirection = sortDirInput === 'asc' ? 'asc' : 'desc';
    const search = req.query.search as string || undefined;
    const isFavoriteParam = req.query.isFavorite as string;
    const isActiveParam = req.query.isActive as string;
    const options: GetCustomersOptions = {
        page: isNaN(page) || page < 1 ? 1 : page,
        limit: isNaN(limit) || limit < 1 ? 10 : limit,
        sortBy: sortBy,
        sortDir: sortDir,
        filters: { search: search?.trim() || undefined, isFavorite: isFavoriteParam === undefined ? undefined : isFavoriteParam === 'true', isActive: isActiveParam === undefined ? undefined : isActiveParam === 'true', }
    };
    console.log(`[ADM_CUST_CTRL] Parsed options:`, options); // LOG 3
    try {
        console.log('[ADM_CUST_CTRL] Calling getCustomersForBusiness service...'); // LOG 4
        const result = await getCustomersForBusiness(adminBusinessId, options);
        console.log(`[ADM_CUST_CTRL] Service call returned. Result has ${result?.items?.length ?? 'N/A'} items. Total items: ${result?.totalItems ?? 'N/A'}`); // LOG 5
        console.log('[ADM_CUST_CTRL] Attempting to send JSON response...'); // LOG 6
        res.status(200).json(result);
    } catch (error) {
        console.error("[ADM_CUST_CTRL] *** ERROR caught in getAdminCustomers handler:", error); // LOG 8
        next(error);
    }
};

export const getCustomerDetailsHandler = async (req: Request, res: Response, next: NextFunction) => {
    const { customerId } = req.params;
    // @ts-ignore
    const adminBusinessId = req.user?.businessId;
    console.log(`[ADM_CUST_CTRL] Request to get details for customer ${customerId} by admin from business ${adminBusinessId}`);
    if (!adminBusinessId) { return res.status(403).json({ message: "Información de administrador no disponible." }); }
    if (!customerId) { return res.status(400).json({ message: "Falta el ID del cliente." }); }
    try {
        const customerDetails = await getCustomerDetailsById(customerId, adminBusinessId);
        if (!customerDetails) { return res.status(404).json({ message: "Cliente no encontrado o no pertenece a este negocio." }); }
        res.status(200).json(customerDetails);
    } catch (error) {
        console.error(`[ADM_CUST_CTRL] Failed to get details for customer ${customerId}:`, error);
        if (error instanceof Error && (error.message.includes('no encontrado') || error.message.includes('no pertenece'))) { return res.status(404).json({ message: error.message }); }
        next(error);
    }
};

export const updateCustomerNotesHandler = async (req: Request, res: Response, next: NextFunction) => {
    const { customerId } = req.params;
    const { notes } = req.body;
    // @ts-ignore
    const adminBusinessId = req.user?.businessId;
    console.log(`[ADM_CUST_CTRL] Request to update notes for customer ${customerId} by admin from business ${adminBusinessId}`);
    if (!adminBusinessId) { return res.status(403).json({ message: "Información de administrador no disponible." }); }
    if (!customerId) { return res.status(400).json({ message: "Falta el ID del cliente." }); }
    if (notes === undefined) { return res.status(400).json({ message: "Falta el campo 'notes' en el cuerpo de la petición." }); }
     if (notes !== null && typeof notes !== 'string') { return res.status(400).json({ message: "El campo 'notes' debe ser un texto o nulo." }); }
    try {
        const updatedCustomer = await updateAdminNotesForCustomer(customerId, adminBusinessId, notes);
        res.status(200).json({ message: `Notas actualizadas correctamente para ${updatedCustomer.email}.`, });
    } catch (error) {
        console.error(`[ADM_CUST_CTRL] Failed to update notes for customer ${customerId}:`, error);
        if (error instanceof Error && (error.message.includes('no encontrado') || error.message.includes('no pertenece'))) { return res.status(404).json({ message: error.message }); }
        next(error);
    }
};

export const adjustCustomerPoints = async (req: Request, res: Response, next: NextFunction) => {
    const { customerId } = req.params;
    const { amount, reason } = req.body;
    // @ts-ignore
    const adminUserId = req.user?.id;
    // @ts-ignore
    const adminBusinessId = req.user?.businessId;
    if (!adminBusinessId || !adminUserId) { return res.status(403).json({ message: "Información de administrador no disponible." }); }
    if (!customerId) { return res.status(400).json({ message: "Falta el ID del cliente." }); }
    if (typeof amount !== 'number' || amount === 0) { return res.status(400).json({ message: "La cantidad ('amount') debe ser un número distinto de cero." }); }
    try {
        const updatedCustomer = await adjustPointsForCustomer( customerId, adminBusinessId, amount, reason );
        res.status(200).json({ message: `Puntos ajustados correctamente para ${updatedCustomer.email}.`, customer: { id: updatedCustomer.id, points: updatedCustomer.points } });
    }
    catch (error) { console.error(`[ADM_CUST_CTRL] Failed to adjust points for customer ${customerId}:`, error); next(error); }
};

export const changeCustomerTierHandler = async (req: Request, res: Response, next: NextFunction) => {
    const { customerId } = req.params;
    const { tierId } = req.body;
    // @ts-ignore
    const adminBusinessId = req.user?.businessId;
    if (!adminBusinessId) { return res.status(403).json({ message: "Información de administrador no disponible." }); }
    if (!customerId) { return res.status(400).json({ message: "Falta el ID del cliente." }); }
    if (tierId === undefined) { return res.status(400).json({ message: "Falta el ID del nivel ('tierId') en el cuerpo de la petición (puede ser nulo)." }); }
    if (tierId !== null && typeof tierId !== 'string') { return res.status(400).json({ message: "El ID del nivel ('tierId') debe ser un texto o nulo." }); }
    try {
        const updatedCustomer = await changeCustomerTier( customerId, adminBusinessId, tierId );
        res.status(200).json({ message: `Nivel cambiado correctamente para ${updatedCustomer.email}.`, customer: { id: updatedCustomer.id, currentTierId: updatedCustomer.currentTierId, tierAchievedAt: updatedCustomer.tierAchievedAt } });
    }
    catch (error) { console.error(`[ADM_CUST_CTRL] Failed to change tier for customer ${customerId} to ${tierId}:`, error); next(error); }
};

export const assignRewardHandler = async (req: Request, res: Response, next: NextFunction) => {
    const { customerId } = req.params;
    const { rewardId } = req.body;
    // @ts-ignore
    const adminUserId = req.user?.id;
    // @ts-ignore
    const adminBusinessId = req.user?.businessId;
    if (!adminBusinessId || !adminUserId) { return res.status(403).json({ message: "Información de administrador no disponible." }); }
    if (!customerId) { return res.status(400).json({ message: "Falta el ID del cliente." }); }
    if (!rewardId || typeof rewardId !== 'string') { return res.status(400).json({ message: "Falta el ID de la recompensa ('rewardId') o no es válido." }); }
    try {
        const grantedReward = await assignRewardToCustomer( customerId, adminBusinessId, rewardId, adminUserId );
        res.status(201).json({ message: `Recompensa asignada correctamente al cliente.`, grantedRewardId: grantedReward.id });
    }
    catch (error) { console.error(`[ADM_CUST_CTRL] Failed to assign reward ${rewardId} to customer ${customerId}:`, error); next(error); }
};

export const toggleFavoriteHandler = async (req: Request, res: Response, next: NextFunction) => {
    const { customerId } = req.params;
    // @ts-ignore
    const adminBusinessId = req.user?.businessId;
    if (!adminBusinessId) { return res.status(403).json({ message: "Información de administrador no disponible." }); }
    if (!customerId) { return res.status(400).json({ message: "Falta el ID del cliente." }); }
    try {
        const updatedCustomer = await toggleFavoriteStatus( customerId, adminBusinessId );
        res.status(200).json({ message: `Estado de favorito cambiado para ${updatedCustomer.email}. Nuevo estado: ${updatedCustomer.isFavorite}`, customer: { id: updatedCustomer.id, isFavorite: updatedCustomer.isFavorite } });
    }
    catch (error) { console.error(`[ADM_CUST_CTRL] Failed to toggle favorite status for customer ${customerId}:`, error); next(error); }
};

export const toggleActiveStatusHandler = async (req: Request, res: Response, next: NextFunction) => {
    const { customerId } = req.params;
    // @ts-ignore
    const adminBusinessId = req.user?.businessId;
    if (!adminBusinessId) { return res.status(403).json({ message: "Información de administrador no disponible." }); }
    if (!customerId) { return res.status(400).json({ message: "Falta el ID del cliente." }); }
    try {
        const updatedCustomer = await toggleActiveStatusForCustomer(customerId, adminBusinessId);
        res.status(200).json({ message: `Estado cambiado para ${updatedCustomer.email}. Nuevo estado: ${updatedCustomer.isActive ? 'Activo' : 'Inactivo'}`, customer: { id: updatedCustomer.id, isActive: updatedCustomer.isActive } });
    } catch (error) { console.error(`[ADM_CUST_CTRL] Failed to toggle active status for customer ${customerId}:`, error); next(error); }
};

export const bulkUpdateCustomerStatusHandler = async (req: Request, res: Response, next: NextFunction) => {
    // @ts-ignore
    const adminBusinessId = req.user?.businessId;
    const { customerIds, isActive } = req.body;
    console.log(`[ADM_CUST_CTRL] Request for bulk status update to ${isActive} for customers [${customerIds?.join(', ')}] by admin from business ${adminBusinessId}`);
    if (!adminBusinessId) { return res.status(403).json({ message: "Información de administrador no disponible." }); }
    if (!Array.isArray(customerIds) || customerIds.length === 0) { return res.status(400).json({ message: "Se requiere un array 'customerIds' con al menos un ID de cliente." }); }
    if (typeof isActive !== 'boolean') { return res.status(400).json({ message: "Se requiere el campo 'isActive' (true o false) para indicar el estado deseado." }); }
    if (!customerIds.every(id => typeof id === 'string')) { return res.status(400).json({ message: "Todos los elementos en 'customerIds' deben ser strings." }); }
    try {
        const result = await bulkUpdateStatusForCustomers(customerIds, adminBusinessId, isActive);
        res.status(200).json({ message: `Estado actualizado a ${isActive ? 'Activo' : 'Inactivo'} para ${result.count} cliente(s).`, count: result.count });
    } catch (error) {
        console.error(`[ADM_CUST_CTRL] Failed bulk status update for customers [${customerIds.join(', ')}]:`, error);
        next(error);
    }
};

// --- NUEVO HANDLER PARA BORRADO MASIVO ---
/**
 * Handler para eliminar múltiples clientes.
 */
export const bulkDeleteCustomersHandler = async (req: Request, res: Response, next: NextFunction) => {
    // @ts-ignore - Obtener businessId del admin autenticado
    const adminBusinessId = req.user?.businessId;
    // Extraer datos del body: esperamos un array de IDs
    const { customerIds } = req.body;

    console.log(`[ADM_CUST_CTRL] Request for bulk delete for customers [${customerIds?.join(', ')}] by admin from business ${adminBusinessId}`);

    // Validaciones
    if (!adminBusinessId) {
        return res.status(403).json({ message: "Información de administrador no disponible." });
    }
    if (!Array.isArray(customerIds) || customerIds.length === 0) {
        return res.status(400).json({ message: "Se requiere un array 'customerIds' con al menos un ID de cliente." });
    }
    // Validar que todos los IDs sean strings
    if (!customerIds.every(id => typeof id === 'string')) {
         return res.status(400).json({ message: "Todos los elementos en 'customerIds' deben ser strings." });
    }

    try {
        // Llamar a la nueva función del servicio
        const result = await bulkDeleteCustomers(customerIds, adminBusinessId);

        // Enviar respuesta exitosa indicando cuántos se eliminaron
        res.status(200).json({
            message: `${result.count} cliente(s) eliminados correctamente.`,
            count: result.count // Prisma deleteMany devuelve un objeto con 'count'
        });
    } catch (error) {
        // Manejar errores (ej. error de BD)
        console.error(`[ADM_CUST_CTRL] Failed bulk delete for customers [${customerIds.join(', ')}]:`, error);
        next(error); // Pasar al manejador global
    }
};
// --- FIN NUEVO HANDLER ---

// End of File: backend/src/customer/admin-customer.controller.ts