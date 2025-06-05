// backend/src/camarero/waiter.controller.ts
// Version 1.3.1 (Adjusted for waiter.service v1.3.0 and simplified markAsPaid response)

import { Request, Response, NextFunction } from 'express';
import { OrderItemStatus, Order, OrderStatus, Prisma, OrderItem } from '@prisma/client';

// Importar el servicio de camarero existente
import * as waiterService from './waiter.service'; // Asume que waiter.service.ts está en la misma carpeta
// Importar el OrderPaymentService para marcar como pagado
import { OrderPaymentService } from '../public/order-payment.service';

// DTOs y tipos
import {
    MarkOrderItemServedPayloadDto,
    OrderItemStatusUpdateResponseDto,
} from './camarero.dto';
import { FrontendMarkOrderAsPaidPayloadDto, FrontendRequestBillStaffPayloadDto } from '../public/order.types';

// Instanciar OrderPaymentService
const orderPaymentServiceInstance = new OrderPaymentService();

/**
 * Handler para GET /api/camarero/staff/ready-for-pickup
 */
export const getReadyForPickupItemsHandler = async (req: Request, res: Response, next: NextFunction) => {
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
 * Marca un OrderItem como SERVED.
 */
export const markOrderItemServedHandler = async (req: Request, res: Response, next: NextFunction) => {
    const businessId = req.user?.businessId;
    const waiterUserId = req.user?.id;
    const { orderItemId } = req.params;
    const payload: MarkOrderItemServedPayloadDto = req.body;

    if (!businessId || !waiterUserId) {
        console.error("[WaiterCtrl] Critical: businessId or waiterUserId missing for markOrderItemServedHandler.");
        return res.status(403).json({ message: "Información de autenticación de personal incompleta." });
    }
    if (!orderItemId) {
        return res.status(400).json({ message: "Falta el ID del ítem de pedido (orderItemId) en la URL." });
    }
    if (!payload || payload.newStatus !== OrderItemStatus.SERVED) {
        return res.status(400).json({ message: "Payload inválido. Se esperaba que 'newStatus' sea 'SERVED'." });
    }

    console.log(`[WaiterCtrl] Request to mark OrderItem ${orderItemId} as SERVED by waiter ${waiterUserId} for business ${businessId}.`);

    try {
        // Asumimos que waiterService.markOrderItemAsServed ahora devuelve { updatedOrderItem, finalOrderStatus }
        const result = await waiterService.markOrderItemAsServed(
            orderItemId,
            businessId,
            waiterUserId
        );

        const responseDto: OrderItemStatusUpdateResponseDto = {
            message: `Ítem '${result.updatedOrderItem.itemNameSnapshot || orderItemId}' marcado como ${OrderItemStatus.SERVED}.`,
            orderItemId: result.updatedOrderItem.id,
            newStatus: result.updatedOrderItem.status,
            orderStatus: result.finalOrderStatus, // Usar el estado del pedido devuelto por el servicio
        };
        res.status(200).json(responseDto);

    } catch (error: any) {
        console.error(`[WaiterCtrl] Error marking OrderItem ${orderItemId} as SERVED:`, error);
        if (error.message) {
            if (error.message.includes('no encontrado') || (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2025')) {
                return res.status(404).json({ message: error.message });
            }
            if (error.message.includes('no está en estado \'READY\'') || error.message.includes('Transición de estado no permitida')) {
                return res.status(409).json({ message: `Conflicto de estado: ${error.message}` });
            }
        }
        next(error);
    }
};

/**
 * Handler para POST /api/camarero/staff/order/:orderId/request-bill
 */
export const requestBillByStaffHandler = async (req: Request, res: Response, next: NextFunction) => {
    const businessId = req.user?.businessId;
    const staffUserId = req.user?.id;
    const { orderId } = req.params;
    const payload: FrontendRequestBillStaffPayloadDto = req.body;

    if (!businessId || !staffUserId) {
        console.error("[WaiterCtrl] Critical: businessId or staffUserId missing for requestBillByStaffHandler.");
        return res.status(403).json({ message: "Información de autenticación de personal incompleta." });
    }
    if (!orderId) {
        return res.status(400).json({ message: "Falta el ID del pedido (orderId) en la URL." });
    }

    console.log(`[WaiterCtrl] Staff ${staffUserId} requesting bill for order ${orderId}. Preference: ${payload.paymentPreference || 'N/A'}`);
    try {
        const paymentPreferenceForService = payload.paymentPreference ?? undefined;

        // Podríamos decidir que waiterService.requestBillByStaff llame internamente a OrderPaymentService
        // o hacer la llamada a OrderPaymentService aquí directamente.
        // Por consistencia con markOrderAsPaid, si el servicio de pago centraliza, lo llamaríamos aquí.
        // Por ahora, seguimos con la estructura donde WaiterService lo maneja.
        const updatedOrder: Order = await waiterService.requestBillByStaff(
            orderId,
            staffUserId,
            businessId,
            paymentPreferenceForService
        );
        res.status(200).json({
            message: `Cuenta solicitada para el pedido #${updatedOrder.orderNumber}. Estado: ${updatedOrder.status}.`,
            order: {
                id: updatedOrder.id,
                orderNumber: updatedOrder.orderNumber,
                status: updatedOrder.status,
                isBillRequested: updatedOrder.isBillRequested,
                paymentMethodPreference: updatedOrder.paymentMethodPreference,
            }
        });
    } catch (error: any) {
        console.error(`[WaiterCtrl] Error requesting bill for order ${orderId} by staff ${staffUserId}:`, error);
        if (error.message) {
            if (error.message.includes('no encontrado') || (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2025')) {
                return res.status(404).json({ message: error.message });
            }
            if (error.message.includes('No se puede solicitar la cuenta') || error.message.includes('estado inválido')) {
                return res.status(400).json({ message: error.message });
            }
            if (error.message.includes('no pertenece al negocio')) {
                return res.status(403).json({ message: error.message });
            }
        }
        next(error);
    }
};

/**
 * Handler para POST /api/camarero/staff/order/:orderId/mark-as-paid
 */
export const markOrderAsPaidHandler = async (req: Request, res: Response, next: NextFunction) => {
    const businessId = req.user?.businessId;
    const staffUserId = req.user?.id;
    const { orderId } = req.params;
    const payloadFromFrontend: FrontendMarkOrderAsPaidPayloadDto = req.body;

    if (!businessId || !staffUserId) {
        console.error("[WaiterCtrl] Critical: businessId or staffUserId missing for markOrderAsPaidHandler.");
        return res.status(403).json({ message: "Información de autenticación de personal incompleta." });
    }
    if (!orderId) {
        return res.status(400).json({ message: "Falta el ID del pedido (orderId) en la URL." });
    }

    const paymentDetailsForService: { method?: string; notes?: string } = {
        method: payloadFromFrontend.method,
        notes: payloadFromFrontend.notes ?? undefined,
    };

    console.log(`[WaiterCtrl] Staff ${staffUserId} marking order ${orderId} as PAID. Payment Details: ${JSON.stringify(paymentDetailsForService)}`);

    try {
        const updatedOrder: Order = await orderPaymentServiceInstance.markOrderAsPaid(
            orderId,
            staffUserId,
            businessId,
            paymentDetailsForService
        );

        // Respuesta simplificada. El frontend puede hacer un refetch de la lista de pedidos
        // o del estado de la mesa si necesita la info actualizada inmediatamente.
        res.status(200).json({
            message: `Pedido #${updatedOrder.orderNumber || orderId} marcado como PAGADO.`,
            order: { // Devolver la información esencial del pedido actualizado
                id: updatedOrder.id,
                orderNumber: updatedOrder.orderNumber,
                status: updatedOrder.status,
                paidAt: updatedOrder.paidAt,
                paymentMethodUsed: updatedOrder.paymentMethodUsed,
                tableId: updatedOrder.tableId, // Enviar tableId para que el frontend sepa si debe refetchear mesas
            }
        });

    } catch (error: any) {
        console.error(`[WaiterCtrl] Error marking order ${orderId} as PAID by staff ${staffUserId}:`, error);
        // El tipo de error de NestJS (error.name) podría no estar disponible si no se está ejecutando en un contexto NestJS puro
        // Usaremos instanceof para los errores de Prisma y mensajes para el resto
        if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2025') {
             return res.status(404).json({ message: 'Pedido no encontrado.' });
        }
        if (error.message?.includes('no encontrado')) {
             return res.status(404).json({ message: error.message });
        }
        if (error.message?.includes('Solo se pueden marcar como pagados') || error.message?.includes('estado inválido')) {
            return res.status(400).json({ message: error.message });
        }
        if (error.message?.includes('no pertenece al negocio')) {
            return res.status(403).json({ message: error.message });
        }
        next(error);
    }
};

/**
 * Handler para GET /api/camarero/staff/orders
 */
export const getStaffOrdersHandler = async (req: Request, res: Response, next: NextFunction) => {
    const businessId = req.user?.businessId;
    if (!businessId) {
        console.error("[WaiterCtrl] Critical: businessId missing from req.user in getStaffOrdersHandler.");
        return res.status(403).json({ message: "Identificador de negocio no encontrado en la sesión del usuario." });
    }
    const statusQuery = req.query.status as string | string[] | undefined;
    let statusFilter: OrderStatus[] | undefined = undefined;
    if (statusQuery) {
        const statuses = Array.isArray(statusQuery) ? statusQuery : (typeof statusQuery === 'string' ? statusQuery.split(',') : []);
        statusFilter = statuses
            .map(s => s.trim().toUpperCase() as OrderStatus)
            .filter(s => Object.values(OrderStatus).includes(s));
        if (statusFilter.length === 0) {
            statusFilter = undefined;
        }
    }
    console.log(`[WaiterCtrl] Request for staff orders for business: ${businessId}. Filters: ${JSON.stringify({ status: statusFilter })}`);
    try {
        const orders = await waiterService.getOrdersForStaff(businessId, { status: statusFilter });
        res.status(200).json(orders);
    } catch (error: any) {
        console.error(`[WaiterCtrl] Error fetching staff orders for business ${businessId}:`, error);
        next(error);
    }
};