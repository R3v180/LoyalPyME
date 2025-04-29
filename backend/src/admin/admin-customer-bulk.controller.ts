// filename: backend/src/admin/admin-customer-bulk.controller.ts
// Version: 1.0.0 (Handlers extracted from admin-customer.controller, @ts-ignore removed, cleaned)

import { Request, Response, NextFunction } from 'express';
import { Prisma } from '@prisma/client'; // Para tipos de error

// Importar solo los servicios necesarios para acciones masivas
import {
    bulkUpdateStatusForCustomers,
    bulkDeleteCustomers,
    bulkAdjustPointsForCustomers
} from './admin-customer-bulk.service'; // Ajustado a la nueva ubicación del servicio

/**
 * Handler para actualizar estado activo/inactivo masivo.
 * PATCH /api/admin/customers/bulk-status
 */
export const bulkUpdateCustomerStatusHandler = async (req: Request, res: Response, next: NextFunction) => {
    // --- FIX: Comprobación explícita ---
    if (!req.user || !req.user.businessId) {
        console.error("[ADM_CUST_BULK_CTRL] Critical: User or businessId missing in bulkUpdateCustomerStatusHandler.");
        return res.status(401).json({ message: "Información de autenticación no encontrada." });
    }
    const adminBusinessId = req.user.businessId;
    // --- FIN FIX ---

    const { customerIds, isActive } = req.body;
    console.log(`[ADM_CUST_BULK_CTRL] Request for bulk status update to ${isActive} for customers [${customerIds?.join(', ')}] by admin from business ${adminBusinessId}`);

    // Validaciones
    if (!adminBusinessId) { return res.status(403).json({ message: "Información de administrador no disponible." }); } // Doble check por si acaso
    if (!Array.isArray(customerIds) || customerIds.length === 0) { return res.status(400).json({ message: "Se requiere un array 'customerIds' con al menos un ID de cliente." }); }
    if (typeof isActive !== 'boolean') { return res.status(400).json({ message: "Se requiere el campo 'isActive' (true o false) para indicar el estado deseado." }); }
    if (!customerIds.every(id => typeof id === 'string')) { return res.status(400).json({ message: "Todos los elementos en 'customerIds' deben ser strings." }); }

    try {
        const result = await bulkUpdateStatusForCustomers(customerIds, adminBusinessId, isActive);
        res.status(200).json({ message: `Estado actualizado a ${isActive ? 'Activo' : 'Inactivo'} para ${result.count} cliente(s).`, count: result.count }); // Corregido: cliente(s)
    } catch (error) {
        console.error(`[ADM_CUST_BULK_CTRL] Failed bulk status update for customers [${customerIds.join(', ')}]:`, error);
        next(error);
    }
};

/**
 * Handler para eliminar múltiples clientes.
 * DELETE /api/admin/customers/bulk-delete
 */
export const bulkDeleteCustomersHandler = async (req: Request, res: Response, next: NextFunction) => {
     // --- FIX: Comprobación explícita ---
     if (!req.user || !req.user.businessId) {
        console.error("[ADM_CUST_BULK_CTRL] Critical: User or businessId missing in bulkDeleteCustomersHandler.");
        return res.status(401).json({ message: "Información de autenticación no encontrada." });
    }
    const adminBusinessId = req.user.businessId;
    // --- FIN FIX ---

    const { customerIds } = req.body; // Los IDs vienen en el body para DELETE masivo
    console.log(`[ADM_CUST_BULK_CTRL] Request for bulk delete for customers [${customerIds?.join(', ')}] by admin from business ${adminBusinessId}`);

    // Validaciones
    if (!adminBusinessId) { return res.status(403).json({ message: "Información de administrador no disponible." }); }
    if (!Array.isArray(customerIds) || customerIds.length === 0) { return res.status(400).json({ message: "Se requiere un array 'customerIds' con al menos un ID de cliente." }); }
    if (!customerIds.every(id => typeof id === 'string')) { return res.status(400).json({ message: "Todos los elementos en 'customerIds' deben ser strings." }); }

    try {
        const result = await bulkDeleteCustomers(customerIds, adminBusinessId);
        res.status(200).json({ message: `${result.count} cliente(s) eliminados correctamente.`, count: result.count }); // Corregido: cliente(s), correctamente
    } catch (error) {
        console.error(`[ADM_CUST_BULK_CTRL] Failed bulk delete for customers [${customerIds.join(', ')}]:`, error);
        // Si el servicio lanza un error específico por FK, el manejador global lo capturará
        // pero podríamos querer manejarlo aquí si el frontend necesita un código de estado específico (ej: 409 Conflict)
        if (error instanceof Error && error.message.includes('datos asociados')) {
             return res.status(409).json({ message: error.message }); // 409 Conflict
        }
        next(error);
    }
};

/**
 * Handler para ajustar los puntos de múltiples clientes.
 * POST /api/admin/customers/bulk-adjust-points
 */
export const bulkAdjustPointsHandler = async (req: Request, res: Response, next: NextFunction) => {
    // --- FIX: Comprobación explícita ---
    if (!req.user || !req.user.businessId) { // No necesitamos user.id aquí en el controller
        console.error("[ADM_CUST_BULK_CTRL] Critical: User or businessId missing in bulkAdjustPointsHandler.");
        return res.status(401).json({ message: "Información de autenticación no encontrada." });
    }
    const adminBusinessId = req.user.businessId;
    // const adminUserId = req.user.id; // Lo obtenemos pero no lo usamos activamente aquí
    // --- FIN FIX ---

    const { customerIds, amount, reason } = req.body;
    // Log con menos info sensible
    console.log(`[ADM_CUST_BULK_CTRL] Request for bulk points adjustment by ${amount} for ${customerIds?.length} customers from business ${adminBusinessId}. Reason: ${reason || 'N/A'}`);

    // Validaciones
    if (!adminBusinessId) { return res.status(403).json({ message: "Información de administrador no disponible." }); }
    if (!Array.isArray(customerIds) || customerIds.length === 0) { return res.status(400).json({ message: "Se requiere un array 'customerIds' con al menos un ID de cliente." }); }
    if (typeof amount !== 'number' || amount === 0) { return res.status(400).json({ message: "La cantidad ('amount') debe ser un número distinto de cero." }); }
    if (reason !== undefined && reason !== null && typeof reason !== 'string') { return res.status(400).json({ message: "La razón ('reason') debe ser un texto o nula/omitida." }); } // Corregido: razón
    if (!customerIds.every(id => typeof id === 'string')) { return res.status(400).json({ message: "Todos los elementos en 'customerIds' deben ser strings." }); }

    try {
        const result = await bulkAdjustPointsForCustomers( customerIds, adminBusinessId, amount, reason || null );
        const actionText = amount > 0 ? 'añadidos' : 'restados'; // Corregido: ñ
        res.status(200).json({
            message: `${Math.abs(amount)} puntos ${actionText} correctamente para ${result.count} cliente(s).`, // Corregido: ñ, cliente(s)
            count: result.count
        });
    } catch (error) {
        console.error(`[ADM_CUST_BULK_CTRL] Failed bulk points adjustment for customers [${customerIds?.join(', ')}]:`, error);
        next(error);
    }
};

// End of File: backend/src/admin/admin-customer-bulk.controller.ts