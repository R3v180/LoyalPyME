// backend/src/camarero/waiter.controller.ts
// Version: 1.2.0 (Add getStaffOrdersHandler)

import { Request, Response, NextFunction } from 'express';
import { OrderItemStatus, Order, OrderStatus } from '@prisma/client'; // Añadido OrderStatus
import * as waiterService from './waiter.service';
import { MarkOrderItemServedPayloadDto, OrderItemStatusUpdateResponseDto, MarkOrderAsPaidPayloadDto, WaiterOrderListItemDto } from './camarero.dto'; // Añadido WaiterOrderListItemDto

// Importar OrderService para la llamada a markOrderAsPaid
// Considerar refactorizar esto a un método en waiter.service.ts que llame a order.service.ts
import { OrderService } from '../public/order.service';

/**
 * Handler para GET /api/camarero/staff/ready-for-pickup
 */
export const getReadyForPickupItemsHandler = async (req: Request, res: Response, next: NextFunction) => {
    // ... (código existente sin cambios)
    const businessId = req.user?.businessId;

    if (!businessId) {
        console.error("[WaiterCtrl] Critical: businessId missing from req.user in getReadyForPickupItemsHandler.");
        return res.status(403).json({ message: "Identificador de negocio no encontrado en la sesión del usuario." });
    }

    console.log(`[WaiterCtrl] Request for ready-for-pickup items for business: ${businessId}`);

    try {
        const items = await waiterService.getReadyForPickupItems(businessId);
        res.status(200).json(items);
    } catch (error) {
        console.error(`[WaiterCtrl] Error getting ready-for-pickup items for business ${businessId}:`, error);
        next(error);
    }
};

/**
 * Handler para PATCH /api/camarero/staff/order-items/:orderItemId/status
 */
export const markOrderItemServedHandler = async (req: Request, res: Response, next: NextFunction) => {
    // ... (código existente sin cambios)
    const businessId = req.user?.businessId;
    const waiterUserId = req.user?.id;
    const { orderItemId } = req.params;
    const payload: MarkOrderItemServedPayloadDto = req.body;

    if (!businessId) {
        console.error("[WaiterCtrl] Critical: businessId missing from req.user for markOrderItemServedHandler.");
        return res.status(403).json({ message: "Identificador de negocio no encontrado." });
    }
    if (!orderItemId) {
        return res.status(400).json({ message: "Falta el ID del ítem de pedido (orderItemId) en la URL." });
    }

    if (!payload || payload.newStatus !== OrderItemStatus.SERVED) {
        return res.status(400).json({ message: "Payload inválido. Se esperaba que 'newStatus' sea 'SERVED'." });
    }

    console.log(`[WaiterCtrl] Request to mark OrderItem ${orderItemId} as SERVED by waiter ${waiterUserId || 'N/A'} for business ${businessId}.`);

    try {
        const updatedOrderItem = await waiterService.markOrderItemAsServed(
            orderItemId,
            businessId,
            waiterUserId
        );

        const responseDto: OrderItemStatusUpdateResponseDto = {
            message: `Ítem '${updatedOrderItem.itemNameSnapshot || orderItemId}' marcado como ${OrderItemStatus.SERVED}.`,
            orderItemId: updatedOrderItem.id,
            newStatus: updatedOrderItem.status,
        };
        res.status(200).json(responseDto);

    } catch (error: any) {
        console.error(`[WaiterCtrl] Error marking OrderItem ${orderItemId} as SERVED:`, error);

        if (error.message) {
            if (error.message.includes('no encontrado')) {
                return res.status(404).json({ message: error.message });
            }
            if (error.message.includes('no está en estado \'READY\'') ||
                error.message.includes('Transición de estado no permitida')) {
                return res.status(409).json({ message: error.message });
            }
        }
        next(error);
    }
};

export const requestBillByStaffHandler = async (req: Request, res: Response, next: NextFunction) => {
    // ... (código existente sin cambios)
    const businessId = req.user?.businessId;
    const staffUserId = req.user?.id;
    const { orderId } = req.params;
    const { paymentPreference } = req.body; // DTO: RequestBillPayloadDto

    if (!businessId || !staffUserId) {
        console.error("[WaiterCtrl] Critical: businessId or staffUserId missing from req.user for requestBillByStaffHandler.");
        return res.status(403).json({ message: "Información de autenticación de personal incompleta." });
    }
    if (!orderId) {
        return res.status(400).json({ message: "Falta el ID del pedido (orderId) en la URL." });
    }

    console.log(`[WaiterCtrl] Staff ${staffUserId} requesting bill for order ${orderId}. Preference: ${paymentPreference || 'N/A'}`);

    try {
        const updatedOrder: Order = await waiterService.requestBillByStaff(
            orderId,
            staffUserId,
            businessId,
            paymentPreference
        );

        res.status(200).json({
            message: `Cuenta solicitada para el pedido #${updatedOrder.orderNumber}. Estado: ${updatedOrder.status}.`,
            order: updatedOrder
        });

    } catch (error: any) {
        console.error(`[WaiterCtrl] Error requesting bill for order ${orderId} by staff ${staffUserId}:`, error);
        if (error.message) {
            if (error.message.includes('no encontrado')) {
                return res.status(404).json({ message: error.message });
            }
            if (error.message.includes('No se puede solicitar la cuenta')) {
                return res.status(400).json({ message: error.message });
            }
            if (error.message.includes('no pertenece al negocio')) {
                return res.status(403).json({ message: error.message });
            }
        }
        next(error);
    }
};

export const markOrderAsPaidHandler = async (req: Request, res: Response, next: NextFunction) => {
    // ... (código existente sin cambios)
    const businessId = req.user?.businessId;
    const staffUserId = req.user?.id;
    const { orderId } = req.params;
    const payload: MarkOrderAsPaidPayloadDto = req.body;

    if (!businessId || !staffUserId) {
        console.error("[WaiterCtrl] Critical: businessId or staffUserId missing from req.user for markOrderAsPaidHandler.");
        return res.status(403).json({ message: "Información de autenticación de personal incompleta." });
    }
    if (!orderId) {
        return res.status(400).json({ message: "Falta el ID del pedido (orderId) en la URL." });
    }

    console.log(`[WaiterCtrl] Staff ${staffUserId} marking order ${orderId} as PAID. Payment Details: ${JSON.stringify(payload)}`);

    try {
        const orderServiceInstance = new OrderService();
        const updatedOrder: Order = await orderServiceInstance.markOrderAsPaid(
            orderId,
            staffUserId,
            businessId,
            payload
        );

        res.status(200).json({
            message: `Pedido #${updatedOrder.orderNumber || orderId} marcado como PAGADO.`,
            order: updatedOrder
        });

    } catch (error: any) {
        console.error(`[WaiterCtrl] Error marking order ${orderId} as PAID by staff ${staffUserId}:`, error);
        if (error.message) {
            if (error.message.includes('no encontrado')) return res.status(404).json({ message: error.message });
            if (error.message.includes('Solo se pueden marcar como pagados') || error.message.includes('no pertenece al negocio')) {
                return res.status(error.message.includes('no pertenece') ? 403 : 400).json({ message: error.message });
            }
        }
        next(error);
    }
};

// ---- NUEVO HANDLER: getStaffOrdersHandler ----
/**
 * Handler para GET /api/camarero/staff/orders
 * Obtiene una lista de pedidos para la interfaz del camarero, con posibles filtros.
 */
export const getStaffOrdersHandler = async (req: Request, res: Response, next: NextFunction) => {
    const businessId = req.user?.businessId;

    if (!businessId) {
        console.error("[WaiterCtrl] Critical: businessId missing from req.user in getStaffOrdersHandler.");
        return res.status(403).json({ message: "Identificador de negocio no encontrado en la sesión del usuario." });
    }

    // Leer filtros de la query (ej. ?status=PENDING_PAYMENT,COMPLETED)
    const statusQuery = req.query.status as string | string[] | undefined;
    let statusFilter: OrderStatus[] | undefined = undefined;

    if (statusQuery) {
        const statuses = Array.isArray(statusQuery) ? statusQuery : [statusQuery];
        statusFilter = statuses.map(s => s.toUpperCase() as OrderStatus)
                               .filter(s => Object.values(OrderStatus).includes(s));
        if (statusFilter.length === 0) {
            statusFilter = undefined; // Si el filtro no es válido, no filtrar por estado
        }
    }

    console.log(`[WaiterCtrl] Request for staff orders for business: ${businessId}. Filters: ${JSON.stringify({ status: statusFilter })}`);

    try {
        const orders: WaiterOrderListItemDto[] = await waiterService.getOrdersForStaff(
            businessId,
            { status: statusFilter }
        );
        res.status(200).json(orders);
    } catch (error: any) {
        console.error(`[WaiterCtrl] Error fetching staff orders for business ${businessId}:`, error);
        // Si el servicio lanza un error conocido, ya tendrá un mensaje apropiado
        next(error);
    }
};
// ---- FIN NUEVO HANDLER ----