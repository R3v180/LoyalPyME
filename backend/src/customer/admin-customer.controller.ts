// filename: backend/src/admin/admin-customer.controller.ts
// Contiene los handlers para las rutas de admin relacionadas con la gestiÃ³n de clientes
// Version: 1.0.3 (Ensure correct import path and sortDir type)

import { Request, Response, NextFunction } from 'express';
import { User, UserRole } from '@prisma/client';

// --- Importar funciones desde el servicio en la MISMA carpeta ---
import {
    getCustomersForBusiness,
    adjustPointsForCustomer,
    changeCustomerTier,
    assignRewardToCustomer,
    toggleFavoriteStatus
    // GetCustomersOptions // PodrÃ­amos importar la interfaz si se exporta del servicio
} from '../admin/admin-customer.service'; // Ruta corregida a './'

// --- Definir tipo para sortDir explÃ­citamente ---
type SortDirection = 'asc' | 'desc';

// --- Definir interfaz localmente (o importarla si se exporta del servicio) ---
// AsegÃºrate que esta interfaz coincide exactamente con la usada en el servicio
interface GetCustomersOptions {
    page?: number;
    limit?: number;
    sortBy?: string;
    sortDir?: SortDirection; // Usar el tipo explÃ­cito
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
    // @ts-ignore
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
    // Asegurar que sortDir es del tipo correcto
    const sortDir: SortDirection = sortDirInput === 'asc' ? 'asc' : 'desc';
    const search = req.query.search as string || undefined;
    const isFavoriteParam = req.query.isFavorite as string;
    const isActiveParam = req.query.isActive as string;

    // Preparar opciones usando la interfaz local o importada
    const options: GetCustomersOptions = { // <-- Usar la interfaz definida
        page: isNaN(page) || page < 1 ? 1 : page,
        limit: isNaN(limit) || limit < 1 ? 10 : limit,
        sortBy: sortBy,
        sortDir: sortDir, // Pasamos la variable con tipo correcto
        filters: {
            search: search?.trim() || undefined,
            isFavorite: isFavoriteParam === undefined ? undefined : isFavoriteParam === 'true',
            isActive: isActiveParam === undefined ? undefined : isActiveParam === 'true',
        }
    };

    console.log(`[ADM_CUST_CTRL] Request received for admin customers list for business: ${adminBusinessId} with options:`, options);

    try {
        // Llamar al servicio (el tipo de 'options' ahora debe coincidir)
        const result = await getCustomersForBusiness(adminBusinessId, options); // Pasar el objeto options directamente
        console.log(`[ADM_CUST_CTRL] Sending ${result.items.length} customers of ${result.totalItems} total.`);
        res.status(200).json(result);

    } catch (error) {
         console.error("[ADM_CUST_CTRL] Error in getAdminCustomers controller:", error);
         next(error);
    }
};

// --- Resto de handlers (adjustCustomerPoints, changeCustomerTierHandler, etc.) sin cambios ---
export const adjustCustomerPoints = async (req: Request, res: Response, next: NextFunction) => {
    const { customerId } = req.params;
    const { amount, reason } = req.body;
    // @ts-ignore
    const adminUserId = req.user?.id;
    // @ts-ignore
    const adminBusinessId = req.user?.businessId;
    console.log(`[ADM_CUST_CTRL] Request to adjust points for customer ${customerId} by admin ${adminUserId} from business ${adminBusinessId}`);
    if (!adminBusinessId || !adminUserId) { return res.status(403).json({ message: "InformaciÃ³n de administrador no disponible." }); }
    if (!customerId) { return res.status(400).json({ message: "Falta el ID del cliente." }); }
    if (typeof amount !== 'number' || amount === 0) { return res.status(400).json({ message: "La cantidad ('amount') debe ser un nÃºmero distinto de cero." }); }
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
    console.log(`[ADM_CUST_CTRL] Request to change tier for customer ${customerId} to tier ${tierId} by admin from business ${adminBusinessId}`);
    if (!adminBusinessId) { return res.status(403).json({ message: "InformaciÃ³n de administrador no disponible." }); }
    if (!customerId) { return res.status(400).json({ message: "Falta el ID del cliente." }); }
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
    console.log(`[ADM_CUST_CTRL] Request to assign reward ${rewardId} to customer ${customerId} by admin ${adminUserId} from business ${adminBusinessId}`);
    if (!adminBusinessId || !adminUserId) { return res.status(403).json({ message: "InformaciÃ³n de administrador no disponible." }); }
    if (!customerId) { return res.status(400).json({ message: "Falta el ID del cliente." }); }
    if (!rewardId || typeof rewardId !== 'string') { return res.status(400).json({ message: "Falta el ID de la recompensa ('rewardId') o no es vÃ¡lido." }); }
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
    console.log(`[ADM_CUST_CTRL] Request to toggle favorite status for customer ${customerId} by admin from business ${adminBusinessId}`);
    if (!adminBusinessId) { return res.status(403).json({ message: "InformaciÃ³n de administrador no disponible." }); }
    if (!customerId) { return res.status(400).json({ message: "Falta el ID del cliente." }); }
    try {
        const updatedCustomer = await toggleFavoriteStatus( customerId, adminBusinessId );
        res.status(200).json({ message: `Estado de favorito cambiado para ${updatedCustomer.email}. Nuevo estado: ${updatedCustomer.isFavorite}`, customer: { id: updatedCustomer.id, isFavorite: updatedCustomer.isFavorite } });
    }
    catch (error) { console.error(`[ADM_CUST_CTRL] Failed to toggle favorite status for customer ${customerId}:`, error); next(error); }
};

// End of File: backend/src/admin/admin-customer.controller.ts