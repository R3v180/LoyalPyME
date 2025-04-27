// filename: backend/src/customer/admin-customer.controller.ts
// Contiene los handlers para las rutas de admin relacionadas con la gestión de clientes
// Version: 1.2.0 (Add handler for get customer details)

import { Request, Response, NextFunction } from 'express';
import { UserRole } from '@prisma/client'; // User no se usa directamente, podría quitarse

// --- Importar funciones desde el servicio ---
// Confirma la ruta correcta de tu servicio. Usaré '../admin/admin-customer.service' basado en tu código.
import {
    getCustomersForBusiness,
    adjustPointsForCustomer,
    changeCustomerTier,
    assignRewardToCustomer,
    toggleFavoriteStatus,
    toggleActiveStatusForCustomer,
    getCustomerDetailsById // <-- Importar la nueva función del servicio
    // GetCustomersOptions
} from '../admin/admin-customer.service'; // Confirma esta ruta

// --- Definir tipo para sortDir explícitamente ---
type SortDirection = 'asc' | 'desc';

// --- Definir interfaz localmente (o importarla si se exporta del servicio) ---
interface GetCustomersOptions {
    page?: number;
    limit?: number;
    sortBy?: string;
    sortDir?: SortDirection;
    filters?: {
        search?: string;
        isFavorite?: boolean;
        isActive?: boolean;
    }
}

// Handler para obtener lista de clientes (sin cambios)
export const getAdminCustomers = async (req: Request, res: Response, next: NextFunction) => {
    // @ts-ignore
    const adminBusinessId = req.user?.businessId;
    if (!adminBusinessId) { return res.status(403).json({ message: "No se pudo identificar el negocio del administrador." }); }
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
    console.log(`[ADM_CUST_CTRL] Request received for admin customers list for business: ${adminBusinessId} with options:`, options);
    try {
        const result = await getCustomersForBusiness(adminBusinessId, options);
        console.log(`[ADM_CUST_CTRL] Sending ${result.items.length} customers of ${result.totalItems} total.`);
        res.status(200).json(result);
    } catch (error) { console.error("[ADM_CUST_CTRL] Error in getAdminCustomers controller:", error); next(error); }
};

// --- NUEVO HANDLER ---
/**
 * Handler para obtener los detalles completos de un cliente específico.
 */
export const getCustomerDetailsHandler = async (req: Request, res: Response, next: NextFunction) => {
    const { customerId } = req.params;
    // @ts-ignore - Obtener businessId del admin autenticado
    const adminBusinessId = req.user?.businessId;
    console.log(`[ADM_CUST_CTRL] Request to get details for customer ${customerId} by admin from business ${adminBusinessId}`);

    // Validaciones básicas
    if (!adminBusinessId) {
        return res.status(403).json({ message: "Información de administrador no disponible." });
    }
    if (!customerId) {
        return res.status(400).json({ message: "Falta el ID del cliente." });
    }

    try {
        // Llamar a la nueva función del servicio
        const customerDetails = await getCustomerDetailsById(customerId, adminBusinessId);

        // Enviar respuesta exitosa con los detalles
        // El servicio se encargará de devolver null o lanzar error si no se encuentra/no pertenece
        if (!customerDetails) {
             // Esto no debería ocurrir si el servicio lanza error, pero por si acaso
            return res.status(404).json({ message: "Cliente no encontrado o no pertenece a este negocio." });
        }
        res.status(200).json(customerDetails);

    } catch (error) {
        // Manejar errores (ej. cliente no encontrado lanzado por el servicio, error de BD)
        console.error(`[ADM_CUST_CTRL] Failed to get details for customer ${customerId}:`, error);
        // Si el servicio lanza un error específico de "no encontrado" o "permiso", podríamos dar un 404 o 403
        if (error instanceof Error && (error.message.includes('no encontrado') || error.message.includes('no pertenece'))) {
             return res.status(404).json({ message: error.message });
        }
        next(error); // Pasar otros errores al manejador global
    }
};
// --- FIN NUEVO HANDLER ---


// Handler para ajustar puntos (sin cambios)
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

// Handler para cambiar tier (sin cambios)
export const changeCustomerTierHandler = async (req: Request, res: Response, next: NextFunction) => {
    const { customerId } = req.params;
    const { tierId } = req.body;
    // @ts-ignore
    const adminBusinessId = req.user?.businessId;
    if (!adminBusinessId) { return res.status(403).json({ message: "Información de administrador no disponible." }); }
    if (!customerId) { return res.status(400).json({ message: "Falta el ID del cliente." }); }
    if (!tierId || typeof tierId !== 'string') { return res.status(400).json({ message: "Falta el ID del nivel ('tierId') o no es válido." }); }
    try {
        const updatedCustomer = await changeCustomerTier( customerId, adminBusinessId, tierId );
        res.status(200).json({ message: `Nivel cambiado correctamente para ${updatedCustomer.email}.`, customer: { id: updatedCustomer.id, currentTierId: updatedCustomer.currentTierId, tierAchievedAt: updatedCustomer.tierAchievedAt } });
    }
    catch (error) { console.error(`[ADM_CUST_CTRL] Failed to change tier for customer ${customerId} to ${tierId}:`, error); next(error); }
};

// Handler para asignar recompensa (sin cambios)
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

// Handler para toggle favorito (sin cambios)
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

// Handler para toggle activo (sin cambios)
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


// End of File: backend/src/customer/admin-customer.controller.ts