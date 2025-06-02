// backend/src/camarero/waiter.controller.ts
// Version: 1.0.0 (Initial controller for waiter actions: get ready items, mark as served)

import { Request, Response, NextFunction } from 'express';
import { OrderItemStatus } from '@prisma/client'; // Para validar el enum
import * as waiterService from './waiter.service'; // Asume que waiter.service.ts está en la misma carpeta
import { MarkOrderItemServedPayloadDto, OrderItemStatusUpdateResponseDto } from './camarero.dto'; // Importar DTOs

/**
 * Handler para GET /api/camarero/staff/ready-for-pickup
 * Obtiene los ítems de pedido que están listos para ser recogidos por el personal de camareros.
 * 
 * El `businessId` se extrae de `req.user`, que es añadido por el middleware `authenticateToken`.
 * Los middlewares `checkRole` y `checkModuleActive` también se aplican antes en el router.
 */
export const getReadyForPickupItemsHandler = async (req: Request, res: Response, next: NextFunction) => {
    const businessId = req.user?.businessId;

    if (!businessId) {
        // Esta comprobación es una salvaguarda adicional.
        // Los middlewares deberían haber prevenido llegar aquí sin un businessId válido.
        console.error("[WaiterCtrl] Critical: businessId missing from req.user in getReadyForPickupItemsHandler.");
        return res.status(403).json({ message: "Identificador de negocio no encontrado en la sesión del usuario." });
    }
    
    console.log(`[WaiterCtrl] Request for ready-for-pickup items for business: ${businessId}`);

    try {
        const items = await waiterService.getReadyForPickupItems(businessId);
        res.status(200).json(items);
    } catch (error) {
        // Loguear el error y pasarlo al manejador de errores global
        console.error(`[WaiterCtrl] Error getting ready-for-pickup items for business ${businessId}:`, error);
        next(error);
    }
};

/**
 * Handler para PATCH /api/camarero/staff/order-items/:orderItemId/status
 * (Específicamente para marcar un OrderItem como SERVED)
 * 
 * El `businessId` y `waiterUserId` (opcional) se extraen de `req.user`.
 * El `orderItemId` se extrae de los parámetros de la URL.
 * El payload debe contener `newStatus: "SERVED"`.
 */
export const markOrderItemServedHandler = async (req: Request, res: Response, next: NextFunction) => {
    const businessId = req.user?.businessId;
    const waiterUserId = req.user?.id; // ID del camarero autenticado, útil para auditoría
    const { orderItemId } = req.params;
    const payload: MarkOrderItemServedPayloadDto = req.body;

    if (!businessId) {
        console.error("[WaiterCtrl] Critical: businessId missing from req.user for markOrderItemServedHandler.");
        return res.status(403).json({ message: "Identificador de negocio no encontrado." });
    }
    if (!orderItemId) {
        return res.status(400).json({ message: "Falta el ID del ítem de pedido (orderItemId) en la URL." });
    }

    // Validación estricta del payload para esta acción específica
    if (!payload || payload.newStatus !== OrderItemStatus.SERVED) {
        return res.status(400).json({ message: "Payload inválido. Se esperaba que 'newStatus' sea 'SERVED'." });
    }
    
    console.log(`[WaiterCtrl] Request to mark OrderItem ${orderItemId} as SERVED by waiter ${waiterUserId || 'N/A'} for business ${businessId}.`);

    try {
        const updatedOrderItem = await waiterService.markOrderItemAsServed(
            orderItemId,
            businessId,
            waiterUserId // Pasamos el ID del camarero al servicio
        );
        
        // Crear una respuesta DTO (podría también devolver el updatedOrderItem completo)
        const responseDto: OrderItemStatusUpdateResponseDto = {
            message: `Ítem '${updatedOrderItem.itemNameSnapshot || orderItemId}' marcado como ${OrderItemStatus.SERVED}.`,
            orderItemId: updatedOrderItem.id,
            newStatus: updatedOrderItem.status,
            // Si el servicio modificara y devolviera el estado del pedido, lo añadiríamos aquí
            // orderStatus: updatedOrderItem.order.status 
        };
        res.status(200).json(responseDto);

    } catch (error: any) { 
        console.error(`[WaiterCtrl] Error marking OrderItem ${orderItemId} as SERVED:`, error);
        
        // Manejo de errores específicos que podría lanzar el servicio
        if (error.message) {
            if (error.message.includes('no encontrado')) {
                return res.status(404).json({ message: error.message });
            }
            // El servicio lanza error si no está READY o la transición no es válida
            if (error.message.includes('no está en estado \'READY\'') || 
                error.message.includes('Transición de estado no permitida')) {
                return res.status(409).json({ message: error.message }); // 409 Conflict indica que el estado actual impide la acción
            }
        }
        next(error); // Para otros errores, usar el manejador global
    }
};