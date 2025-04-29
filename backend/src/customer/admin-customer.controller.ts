// filename: backend/src/customer/admin-customer.controller.ts
// Version: 1.7.1 (Update imports after service refactoring)

import { Request, Response, NextFunction } from 'express';
import { UserRole } from '@prisma/client';
import { Prisma } from '@prisma/client';

// --- CAMBIO: Importar desde los nuevos archivos de servicio ---
import { getCustomersForBusiness } from '../admin/admin-customer-list.service';
import {
    getCustomerDetailsById,
    updateAdminNotesForCustomer,
    adjustPointsForCustomer,
    changeCustomerTier,
    assignRewardToCustomer,
    toggleFavoriteStatus,
    toggleActiveStatusForCustomer
} from '../admin/admin-customer-individual.service';
import {
    bulkUpdateStatusForCustomers,
    bulkDeleteCustomers,
    bulkAdjustPointsForCustomers
} from '../admin/admin-customer-bulk.service';
// --- FIN CAMBIO ---

// --- Tipos y Interfaces (Sin cambios) ---
type SortDirection = 'asc' | 'desc';
interface ControllerGetCustomersOptions {
    page?: number;
    limit?: number;
    sortBy?: string;
    sortDir?: SortDirection;
    filters?: {
        search?: string;
        isFavorite?: boolean;
        isActive?: boolean;
        tierId?: string;
    }
}

// --- Handlers (El código interno de los handlers no cambia) ---

/**
 * Handler para que el Admin obtenga la lista PAGINADA, FILTRADA y ORDENADA de clientes.
 */
export const getAdminCustomers = async (req: Request, res: Response, next: NextFunction) => {
    console.log('[ADM_CUST_CTRL] Entering getAdminCustomers handler...');
    // @ts-ignore - Asumiendo que auth.middleware ya cargó req.user
    const adminBusinessId = req.user?.businessId;
    if (!adminBusinessId) {
        console.error("[ADM_CUST_CTRL] No businessId found in req.user for admin.");
        return res.status(403).json({ message: "No se pudo identificar el negocio del administrador." });
    }
    console.log(`[ADM_CUST_CTRL] Admin businessId: ${adminBusinessId}`);

    // Leer TODOS los parámetros de la query
    const page = parseInt(req.query.page as string || '1', 10);
    const limit = parseInt(req.query.limit as string || '10', 10);
    const sortBy = req.query.sortBy as string || 'createdAt';
    const sortDirInput = req.query.sortDir as string;
    const sortDir: SortDirection = sortDirInput === 'asc' ? 'asc' : 'desc';
    const search = req.query.search as string | undefined;
    const isActiveParam = req.query.isActive as string | undefined;
    const isFavoriteParam = req.query.isFavorite as string | undefined;
    const tierIdParam = req.query.tierId as string | undefined;

    // Construir objeto de filtros para el servicio
    const filters: ControllerGetCustomersOptions['filters'] = {};
    if (search?.trim()) filters.search = search.trim();
    if (isActiveParam !== undefined) filters.isActive = isActiveParam === 'true';
    if (isFavoriteParam !== undefined) filters.isFavorite = isFavoriteParam === 'true';
    if (tierIdParam?.trim()) filters.tierId = tierIdParam.trim();

    // Construir objeto de opciones completo
    const options: ControllerGetCustomersOptions = {
        page: isNaN(page) || page < 1 ? 1 : page,
        limit: isNaN(limit) || limit < 1 ? 10 : limit,
        sortBy: sortBy,
        sortDir: sortDir,
        filters: filters
    };

    console.log(`[ADM_CUST_CTRL] Parsed options being sent to service:`, options);

    try {
        // Llamar al servicio (ahora importado de -list.service)
        const result = await getCustomersForBusiness(adminBusinessId, options);
        console.log(`[ADM_CUST_CTRL] Service call returned. Result has ${result?.items?.length ?? 'N/A'} items. Total items: ${result?.totalItems ?? 'N/A'}`);
        res.status(200).json(result);
    } catch (error) {
        console.error("[ADM_CUST_CTRL] *** ERROR caught in getAdminCustomers handler:", error);
        next(error);
    }
};

/**
 * Handler para obtener los detalles completos de un cliente específico.
 */
export const getCustomerDetailsHandler = async (req: Request, res: Response, next: NextFunction) => {
    const { customerId } = req.params;
    // @ts-ignore
    const adminBusinessId = req.user?.businessId;
    console.log(`[ADM_CUST_CTRL] Request to get details for customer ${customerId} by admin from business ${adminBusinessId}`);
    if (!adminBusinessId) { return res.status(403).json({ message: "Información de administrador no disponible." }); }
    if (!customerId) { return res.status(400).json({ message: "Falta el ID del cliente." }); }
    try {
        // Llamada al servicio (ahora importado de -individual.service)
        const customerDetails = await getCustomerDetailsById(customerId, adminBusinessId);
        if (!customerDetails) { return res.status(404).json({ message: "Cliente no encontrado o no pertenece a este negocio." }); }
        res.status(200).json(customerDetails);
    } catch (error) {
        console.error(`[ADM_CUST_CTRL] Failed to get details for customer ${customerId}:`, error);
        if (error instanceof Error && (error.message.includes('no encontrado') || error.message.includes('no pertenece'))) { return res.status(404).json({ message: error.message }); }
        next(error);
    }
};

/**
 * Handler para actualizar las notas de administrador de un cliente.
 */
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
         // Llamada al servicio (ahora importado de -individual.service)
        const updatedCustomer = await updateAdminNotesForCustomer(customerId, adminBusinessId, notes);
        res.status(200).json({ message: `Notas actualizadas correctamente para ${updatedCustomer.email}.`, });
    } catch (error) {
        console.error(`[ADM_CUST_CTRL] Failed to update notes for customer ${customerId}:`, error);
        if (error instanceof Error && (error.message.includes('no encontrado') || error.message.includes('no pertenece'))) { return res.status(404).json({ message: error.message }); }
        next(error);
    }
};

/**
 * Handler para ajustar puntos.
 */
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
        // Llamada al servicio (ahora importado de -individual.service)
        const updatedCustomer = await adjustPointsForCustomer( customerId, adminBusinessId, amount, reason );
        res.status(200).json({ message: `Puntos ajustados correctamente para ${updatedCustomer.email}.`, customer: { id: updatedCustomer.id, points: updatedCustomer.points } });
    }
    catch (error) { console.error(`[ADM_CUST_CTRL] Failed to adjust points for customer ${customerId}:`, error); next(error); }
};

/**
 * Handler para cambiar tier.
 */
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
         // Llamada al servicio (ahora importado de -individual.service)
        const updatedCustomer = await changeCustomerTier( customerId, adminBusinessId, tierId );
        res.status(200).json({ message: `Nivel cambiado correctamente para ${updatedCustomer.email}.`, customer: { id: updatedCustomer.id, currentTierId: updatedCustomer.currentTierId, tierAchievedAt: updatedCustomer.tierAchievedAt } });
    }
    catch (error) { console.error(`[ADM_CUST_CTRL] Failed to change tier for customer ${customerId} to ${tierId}:`, error); next(error); }
};

/**
 * Handler para asignar recompensa.
 */
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
        // Llamada al servicio (ahora importado de -individual.service)
        const grantedReward = await assignRewardToCustomer( customerId, adminBusinessId, rewardId, adminUserId );
        res.status(201).json({ message: `Recompensa asignada correctamente al cliente.`, grantedRewardId: grantedReward.id });
    }
    catch (error) { console.error(`[ADM_CUST_CTRL] Failed to assign reward ${rewardId} to customer ${customerId}:`, error); next(error); }
};

/**
 * Handler para toggle favorito.
 */
export const toggleFavoriteHandler = async (req: Request, res: Response, next: NextFunction) => {
    const { customerId } = req.params;
    // @ts-ignore
    const adminBusinessId = req.user?.businessId;
    if (!adminBusinessId) { return res.status(403).json({ message: "Información de administrador no disponible." }); }
    if (!customerId) { return res.status(400).json({ message: "Falta el ID del cliente." }); }
    try {
        // Llamada al servicio (ahora importado de -individual.service)
        const updatedCustomer = await toggleFavoriteStatus( customerId, adminBusinessId );
        res.status(200).json({ message: `Estado de favorito cambiado para ${updatedCustomer.email}. Nuevo estado: ${updatedCustomer.isFavorite}`, customer: { id: updatedCustomer.id, isFavorite: updatedCustomer.isFavorite } });
    }
    catch (error) { console.error(`[ADM_CUST_CTRL] Failed to toggle favorite status for customer ${customerId}:`, error); next(error); }
};

/**
 * Handler para toggle activo.
 */
export const toggleActiveStatusHandler = async (req: Request, res: Response, next: NextFunction) => {
    const { customerId } = req.params;
    // @ts-ignore
    const adminBusinessId = req.user?.businessId;
    if (!adminBusinessId) { return res.status(403).json({ message: "Información de administrador no disponible." }); }
    if (!customerId) { return res.status(400).json({ message: "Falta el ID del cliente." }); }
    try {
        // Llamada al servicio (ahora importado de -individual.service)
        const updatedCustomer = await toggleActiveStatusForCustomer(customerId, adminBusinessId);
        res.status(200).json({ message: `Estado cambiado para ${updatedCustomer.email}. Nuevo estado: ${updatedCustomer.isActive ? 'Activo' : 'Inactivo'}`, customer: { id: updatedCustomer.id, isActive: updatedCustomer.isActive } });
    } catch (error) { console.error(`[ADM_CUST_CTRL] Failed to toggle active status for customer ${customerId}:`, error); next(error); }
};

/**
 * Handler para actualizar estado activo/inactivo masivo.
 */
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
        // Llamada al servicio (ahora importado de -bulk.service)
        const result = await bulkUpdateStatusForCustomers(customerIds, adminBusinessId, isActive);
        res.status(200).json({ message: `Estado actualizado a ${isActive ? 'Activo' : 'Inactivo'} para ${result.count} cliente(s).`, count: result.count });
    } catch (error) {
        console.error(`[ADM_CUST_CTRL] Failed bulk status update for customers [${customerIds.join(', ')}]:`, error);
        next(error);
    }
};

/**
 * Handler para eliminar múltiples clientes.
 */
export const bulkDeleteCustomersHandler = async (req: Request, res: Response, next: NextFunction) => {
    // @ts-ignore
    const adminBusinessId = req.user?.businessId;
    const { customerIds } = req.body;
    console.log(`[ADM_CUST_CTRL] Request for bulk delete for customers [${customerIds?.join(', ')}] by admin from business ${adminBusinessId}`);
    if (!adminBusinessId) { return res.status(403).json({ message: "Información de administrador no disponible." }); }
    if (!Array.isArray(customerIds) || customerIds.length === 0) { return res.status(400).json({ message: "Se requiere un array 'customerIds' con al menos un ID de cliente." }); }
    if (!customerIds.every(id => typeof id === 'string')) { return res.status(400).json({ message: "Todos los elementos en 'customerIds' deben ser strings." }); }
    try {
         // Llamada al servicio (ahora importado de -bulk.service)
        const result = await bulkDeleteCustomers(customerIds, adminBusinessId);
        res.status(200).json({ message: `${result.count} cliente(s) eliminados correctamente.`, count: result.count });
    } catch (error) {
        console.error(`[ADM_CUST_CTRL] Failed bulk delete for customers [${customerIds.join(', ')}]:`, error);
        next(error);
    }
};

/**
 * Handler para ajustar los puntos de múltiples clientes.
 */
export const bulkAdjustPointsHandler = async (req: Request, res: Response, next: NextFunction) => {
    // @ts-ignore - Obtener businessId y userId del admin autenticado
    const adminBusinessId = req.user?.businessId;
    const adminUserId = req.user?.id; // Puede ser útil para auditoría o lógica específica

    // Extraer datos del body
    const { customerIds, amount, reason } = req.body;

    console.log(`[ADM_CUST_CTRL] Request for bulk points adjustment by ${amount} for customers [${customerIds?.join(', ')}] by admin ${adminUserId} from business ${adminBusinessId}. Reason: ${reason || 'N/A'}`);

    // Validaciones
    if (!adminBusinessId) { return res.status(403).json({ message: "Información de administrador no disponible." }); }
    if (!Array.isArray(customerIds) || customerIds.length === 0) { return res.status(400).json({ message: "Se requiere un array 'customerIds' con al menos un ID de cliente." }); }
    if (typeof amount !== 'number' || amount === 0) { return res.status(400).json({ message: "La cantidad ('amount') debe ser un número distinto de cero." }); }
    if (reason !== undefined && reason !== null && typeof reason !== 'string') { return res.status(400).json({ message: "La razón ('reason') debe ser un texto o nula/omitida." }); }
    if (!customerIds.every(id => typeof id === 'string')) { return res.status(400).json({ message: "Todos los elementos en 'customerIds' deben ser strings." }); }

    try {
        // Llamada al servicio (ahora importado de -bulk.service)
        const result = await bulkAdjustPointsForCustomers( customerIds, adminBusinessId, amount, reason || null );
        // Enviar respuesta exitosa indicando cuántos se actualizaron
        const actionText = amount > 0 ? 'añadidos' : 'restados';
        res.status(200).json({
            message: `${Math.abs(amount)} puntos ${actionText} correctamente para ${result.count} cliente(s).`,
            count: result.count
        });
    } catch (error) {
        console.error(`[ADM_CUST_CTRL] Failed bulk points adjustment for customers [${customerIds.join(', ')}]:`, error);
        next(error); // Pasar al manejador global
    }
};

// End of File: backend/src/customer/admin-customer.controller.ts