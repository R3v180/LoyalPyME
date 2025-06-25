// filename: backend/src/admin/admin-customer-list.controller.ts
// Version: 1.0.0 (Handler extracted from admin-customer.controller, @ts-ignore removed)

import { Request, Response, NextFunction } from 'express';

// Importar sólo el servicio necesario
import { getCustomersForBusiness } from './admin-customer-list.service'; // Ajustado a la nueva ubicación del servicio

// Tipos locales para este controlador (podrían moverse a un DTO o types si se complejizan)
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

/**
 * Handler para que el Admin obtenga la lista PAGINADA, FILTRADA y ORDENADA de clientes.
 * GET /api/admin/customers
 */
export const getAdminCustomers = async (req: Request, res: Response, next: NextFunction) => {
    console.log('[ADM_CUST_LIST_CTRL] Entering getAdminCustomers handler...');

    // --- FIX: Comprobación explícita de req.user y req.user.businessId ---
    if (!req.user || !req.user.businessId) {
        // Este error no debería ocurrir si authenticateToken funciona, pero es una guarda segura.
        console.error("[ADM_CUST_LIST_CTRL] Critical: User or businessId missing after authenticateToken.");
        return res.status(401).json({ message: "Información de autenticación no encontrada." });
    }
    const adminBusinessId = req.user.businessId; // Ahora podemos acceder de forma segura
    console.log(`[ADM_CUST_LIST_CTRL] Admin businessId: ${adminBusinessId}`);
    // --- FIN FIX ---

    // Leer parámetros de query (sin cambios)
    const page = parseInt(req.query.page as string || '1', 10);
    const limit = parseInt(req.query.limit as string || '10', 10);
    const sortBy = req.query.sortBy as string || 'createdAt';
    const sortDirInput = req.query.sortDir as string;
    const sortDir: SortDirection = sortDirInput === 'asc' ? 'asc' : 'desc';
    const search = req.query.search as string | undefined;
    const isActiveParam = req.query.isActive as string | undefined;
    const isFavoriteParam = req.query.isFavorite as string | undefined;
    const tierIdParam = req.query.tierId as string | undefined;

    // Construir objeto de filtros (sin cambios)
    const filters: ControllerGetCustomersOptions['filters'] = {};
    if (search?.trim()) filters.search = search.trim();
    if (isActiveParam !== undefined) filters.isActive = isActiveParam === 'true';
    if (isFavoriteParam !== undefined) filters.isFavorite = isFavoriteParam === 'true';
    if (tierIdParam?.trim()) filters.tierId = tierIdParam.trim();

    // Construir objeto de opciones (sin cambios)
    const options: ControllerGetCustomersOptions = {
        page: isNaN(page) || page < 1 ? 1 : page,
        limit: isNaN(limit) || limit < 1 ? 10 : limit,
        sortBy: sortBy,
        sortDir: sortDir,
        filters: filters
    };

    console.log(`[ADM_CUST_LIST_CTRL] Parsed options being sent to service:`, options);

    try {
        // Llamar al servicio (sin cambios)
        const result = await getCustomersForBusiness(adminBusinessId, options);
        console.log(`[ADM_CUST_LIST_CTRL] Service call returned. Result has ${result?.items?.length ?? 'N/A'} items. Total items: ${result?.totalItems ?? 'N/A'}`);
        res.status(200).json(result);
    } catch (error) {
        console.error("[ADM_CUST_LIST_CTRL] *** ERROR caught in getAdminCustomers handler:", error);
        next(error); // Pasar al manejador de errores global
    }
};

// End of File: backend/src/admin/admin-customer-list.controller.ts