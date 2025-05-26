// backend/src/camarero/kds.controller.ts
import { Request, Response, NextFunction } from 'express';
import { OrderItemStatus } from '@prisma/client'; // Para validar el enum
import * as kdsService from './kds.service';

/**
 * Handler para GET /api/camarero/kds/items
 * Obtiene los ítems de pedido para una destino KDS específico.
 */
export const getItemsForKdsHandler = async (req: Request, res: Response, next: NextFunction) => {
    const businessId = req.user?.businessId; // Asumimos que authenticateToken ya lo añadió
    const { destination, status } = req.query;

    if (!businessId) {
        return res.status(403).json({ message: "Identificador de negocio no encontrado en la sesión del usuario." });
    }
    if (!destination || typeof destination !== 'string' || destination.trim() === '') {
        return res.status(400).json({ message: "El parámetro 'destination' (destino KDS) es obligatorio." });
    }

    let statusFilter: OrderItemStatus[] | undefined = undefined;
    if (status) {
        if (typeof status === 'string') {
            const singleStatus = status.toUpperCase() as OrderItemStatus;
            if (Object.values(OrderItemStatus).includes(singleStatus)) {
                statusFilter = [singleStatus];
            } else {
                return res.status(400).json({ message: `Valor de 'status' inválido: ${status}` });
            }
        } else if (Array.isArray(status)) {
            statusFilter = [];
            for (const s of status) {
                if (typeof s === 'string') {
                    const singleStatus = s.toUpperCase() as OrderItemStatus;
                     if (Object.values(OrderItemStatus).includes(singleStatus)) {
                        statusFilter.push(singleStatus);
                    } else {
                        return res.status(400).json({ message: `Valor de 'status' inválido en el array: ${s}` });
                    }
                } else {
                     return res.status(400).json({ message: "Todos los valores de 'status' en el array deben ser strings." });
                }
            }
            if (statusFilter.length === 0) statusFilter = undefined; // Si el array queda vacío, no filtrar
        } else {
            return res.status(400).json({ message: "El parámetro 'status' debe ser un string o un array de strings." });
        }
    }
    
    console.log(`[KDS CTRL] Request for KDS items. Business: ${businessId}, Dest: ${destination}, Status: ${statusFilter?.join(',') || 'Default'}`);

    try {
        const items = await kdsService.getItemsForKds(businessId, destination.trim().toUpperCase(), statusFilter);
        res.status(200).json(items);
    } catch (error) {
        console.error(`[KDS CTRL] Error getting items for KDS (Dest: ${destination}):`, error);
        next(error); // Pasar al manejador de errores global
    }
};

/**
 * Handler para PATCH /api/camarero/kds/items/:orderItemId/status
 * Actualiza el estado de un OrderItem específico.
 */
export const updateOrderItemStatusHandler = async (req: Request, res: Response, next: NextFunction) => {
    const businessId = req.user?.businessId; // Asumimos que authenticateToken ya lo añadió
    const { orderItemId } = req.params;
    const { newStatus } = req.body; // Esperamos { "newStatus": "PREPARING" } por ejemplo

    if (!businessId) {
        return res.status(403).json({ message: "Identificador de negocio no encontrado en la sesión del usuario." });
    }
    if (!orderItemId) {
        return res.status(400).json({ message: "Falta el ID del ítem de pedido (orderItemId) en la URL." });
    }
    if (!newStatus || typeof newStatus !== 'string') {
        return res.status(400).json({ message: "Falta el campo 'newStatus' o no es un string en el cuerpo de la petición." });
    }

    const validatedNewStatus = newStatus.toUpperCase() as OrderItemStatus;
    if (!Object.values(OrderItemStatus).includes(validatedNewStatus)) {
        return res.status(400).json({ message: `El valor de 'newStatus' ('${newStatus}') no es un estado válido.` });
    }
    
    console.log(`[KDS CTRL] Request to update OrderItem ${orderItemId} to status ${validatedNewStatus} for business ${businessId}`);

    try {
        const updatedItem = await kdsService.updateOrderItemStatus(orderItemId, validatedNewStatus, businessId);
        res.status(200).json(updatedItem);
    } catch (error: any) { // Especificar 'any' o un tipo más específico
        console.error(`[KDS CTRL] Error updating status for OrderItem ${orderItemId} to ${validatedNewStatus}:`, error);
        // El servicio ya puede lanzar errores con mensajes específicos (ej: transición no permitida, ítem no encontrado)
        // Si el mensaje es específico del servicio y queremos mostrarlo, lo pasamos tal cual.
        if (error.message) {
            // Podríamos mapear ciertos mensajes de error a códigos de estado HTTP específicos
            if (error.message.includes('no encontrado')) {
                return res.status(404).json({ message: error.message });
            }
            if (error.message.includes('no permitida')) {
                return res.status(400).json({ message: error.message }); // Bad Request por lógica de negocio
            }
        }
        next(error); // Pasar otros errores al manejador global
    }
};