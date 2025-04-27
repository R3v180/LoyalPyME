// filename: backend/src/customer/admin-customer.controller.ts
// Contiene los handlers para las rutas de admin relacionadas con la gestión de clientes
// Version: 1.1.0 (Add handler for toggle active status)

import { Request, Response, NextFunction } from 'express';
import { User, UserRole } from '@prisma/client'; // User no se usa directamente, podría quitarse

// --- Importar funciones desde el servicio ---
// Asumiendo que el servicio está en '../admin/admin-customer.service' según tu código original
// Si moviste el controlador a 'src/customer/' y el servicio a 'src/admin/', la ruta sería '../admin/admin-customer.service'
// Confirma la ruta correcta de tu servicio. Usaré '../admin/admin-customer.service' basado en tu código.
import {
    getCustomersForBusiness,
    adjustPointsForCustomer,
    changeCustomerTier,
    assignRewardToCustomer,
    toggleFavoriteStatus,
    toggleActiveStatusForCustomer // <-- Importar la nueva función del servicio
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

/**
 * Handler para que el Admin obtenga la lista PAGINADA, FILTRADA y ORDENADA de clientes.
 */
export const getAdminCustomers = async (req: Request, res: Response, next: NextFunction) => {
    // @ts-ignore - Considerar definir un tipo extendido para Request con 'user'
    const adminBusinessId = req.user?.businessId;
    if (!adminBusinessId) {
        console.error("[ADM_CUST_CTRL] No businessId found in req.user for admin.");
        return res.status(403).json({ message: "No se pudo identificar el negocio del administrador." });
    }

    // Leer query params
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
        filters: {
            search: search?.trim() || undefined,
            isFavorite: isFavoriteParam === undefined ? undefined : isFavoriteParam === 'true',
            isActive: isActiveParam === undefined ? undefined : isActiveParam === 'true',
        }
    };

    console.log(`[ADM_CUST_CTRL] Request received for admin customers list for business: ${adminBusinessId} with options:`, options);

    try {
        const result = await getCustomersForBusiness(adminBusinessId, options);
        console.log(`[ADM_CUST_CTRL] Sending ${result.items.length} customers of ${result.totalItems} total.`);
        res.status(200).json(result);
    } catch (error) {
        console.error("[ADM_CUST_CTRL] Error in getAdminCustomers controller:", error);
        next(error);
    }
};

// Handler para ajustar puntos (sin cambios)
export const adjustCustomerPoints = async (req: Request, res: Response, next: NextFunction) => {
    const { customerId } = req.params;
    const { amount, reason } = req.body;
    // @ts-ignore
    const adminUserId = req.user?.id;
    // @ts-ignore
    const adminBusinessId = req.user?.businessId;
    console.log(`[ADM_CUST_CTRL] Request to adjust points for customer ${customerId} by admin ${adminUserId} from business ${adminBusinessId}`);
    if (!adminBusinessId || !adminUserId) { return res.status(403).json({ message: "Información de administrador no disponible." }); }
    if (!customerId) { return res.status(400).json({ message: "Falta el ID del cliente." }); }
    if (typeof amount !== 'number' || amount === 0) { return res.status(400).json({ message: "La cantidad ('amount') debe ser un número distinto de cero." }); }
    try {
        const updatedCustomer = await adjustPointsForCustomer( customerId, adminBusinessId, amount, reason );
        // Devolver solo datos relevantes y no sensibles
        res.status(200).json({ message: `Puntos ajustados correctamente para ${updatedCustomer.email}.`, customer: { id: updatedCustomer.id, points: updatedCustomer.points } });
    }
    catch (error) { console.error(`[ADM_CUST_CTRL] Failed to adjust points for customer ${customerId}:`, error); next(error); }
};

// Handler para cambiar tier (sin cambios)
export const changeCustomerTierHandler = async (req: Request, res: Response, next: NextFunction) => {
    const { customerId } = req.params;
    const { tierId } = req.body; // Asume que el body contiene el ID del nuevo Tier
    // @ts-ignore
    const adminBusinessId = req.user?.businessId;
    console.log(`[ADM_CUST_CTRL] Request to change tier for customer ${customerId} to tier ${tierId} by admin from business ${adminBusinessId}`);
    if (!adminBusinessId) { return res.status(403).json({ message: "Información de administrador no disponible." }); }
    if (!customerId) { return res.status(400).json({ message: "Falta el ID del cliente." }); }
    if (!tierId || typeof tierId !== 'string') { return res.status(400).json({ message: "Falta el ID del nivel ('tierId') o no es válido." }); } // Validar tierId
    try {
        const updatedCustomer = await changeCustomerTier( customerId, adminBusinessId, tierId );
        // Devolver solo datos relevantes
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
    console.log(`[ADM_CUST_CTRL] Request to assign reward ${rewardId} to customer ${customerId} by admin ${adminUserId} from business ${adminBusinessId}`);
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
    console.log(`[ADM_CUST_CTRL] Request to toggle favorite status for customer ${customerId} by admin from business ${adminBusinessId}`);
    if (!adminBusinessId) { return res.status(403).json({ message: "Información de administrador no disponible." }); }
    if (!customerId) { return res.status(400).json({ message: "Falta el ID del cliente." }); }
    try {
        const updatedCustomer = await toggleFavoriteStatus( customerId, adminBusinessId );
        res.status(200).json({ message: `Estado de favorito cambiado para ${updatedCustomer.email}. Nuevo estado: ${updatedCustomer.isFavorite}`, customer: { id: updatedCustomer.id, isFavorite: updatedCustomer.isFavorite } });
    }
    catch (error) { console.error(`[ADM_CUST_CTRL] Failed to toggle favorite status for customer ${customerId}:`, error); next(error); }
};


// --- NUEVO HANDLER ---
/**
 * Handler para cambiar el estado activo/inactivo de un cliente.
 */
export const toggleActiveStatusHandler = async (req: Request, res: Response, next: NextFunction) => {
    const { customerId } = req.params;
    // @ts-ignore - Obtener businessId del admin autenticado
    const adminBusinessId = req.user?.businessId;
    console.log(`[ADM_CUST_CTRL] Request to toggle active status for customer ${customerId} by admin from business ${adminBusinessId}`);

    // Validaciones básicas
    if (!adminBusinessId) {
        return res.status(403).json({ message: "Información de administrador no disponible." });
    }
    if (!customerId) {
        return res.status(400).json({ message: "Falta el ID del cliente." });
    }

    try {
        // Llamar a la nueva función del servicio
        const updatedCustomer = await toggleActiveStatusForCustomer(customerId, adminBusinessId);

        // Enviar respuesta exitosa
        res.status(200).json({
            message: `Estado cambiado para ${updatedCustomer.email}. Nuevo estado: ${updatedCustomer.isActive ? 'Activo' : 'Inactivo'}`,
            customer: { // Devolver solo datos relevantes
                id: updatedCustomer.id,
                isActive: updatedCustomer.isActive
            }
        });
    } catch (error) {
        // Manejar errores (ej. cliente no encontrado, error de BD)
        console.error(`[ADM_CUST_CTRL] Failed to toggle active status for customer ${customerId}:`, error);
        next(error); // Pasar el error al manejador global
    }
};
// --- FIN NUEVO HANDLER ---


// End of File: backend/src/customer/admin-customer.controller.ts