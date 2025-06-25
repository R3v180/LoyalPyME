// backend/src/camarero/waiter.service.ts
// Version 1.3.1 (Corrected orderBy clause in getOrdersForStaff)

import {
    PrismaClient,
    OrderItem,
    OrderItemStatus,
    OrderStatus,
    Prisma,
    TableStatus,
    Order,
    OrderType,
    User, // Asegurarse de importar User si se usa en tipos
} from '@prisma/client';
import {
    ReadyPickupItemDto,
    WaiterSelectedModifierDto,
    WaiterOrderListItemDto
} from './camarero.dto';
import {
    NotFoundException,
    BadRequestException,
    ForbiddenException,
    Logger,
    InternalServerErrorException,
} from '@nestjs/common';

const prisma = new PrismaClient(); // Instancia de Prisma para este servicio
const logger = new Logger('WaiterService'); // Logger para este servicio

/**
 * Obtiene la lista de ítems de pedido que están listos para ser recogidos por el personal de sala.
 * @param businessId - ID del negocio.
 * @returns Un array de ReadyPickupItemDto.
 */
export const getReadyForPickupItems = async (businessId: string): Promise<ReadyPickupItemDto[]> => {
    logger.log(`[WaiterService] Fetching items ready for pickup for business: ${businessId}`);
    try {
        const orderItemsFromDb = await prisma.orderItem.findMany({
            where: {
                status: OrderItemStatus.READY,
                order: {
                    businessId: businessId,
                    status: {
                        in: [
                            OrderStatus.IN_PROGRESS,
                            OrderStatus.PARTIALLY_READY,
                            OrderStatus.ALL_ITEMS_READY,
                        ],
                    },
                },
            },
            include: {
                order: {
                    include: {
                        table: { select: { identifier: true } },
                    },
                },
                selectedModifiers: {
                    select: {
                        optionNameSnapshot: true,
                        modifierOption: {
                            select: { name_en: true, name_es: true }
                        }
                    },
                },
            },
            orderBy: [
                { order: { createdAt: 'asc' } },
                { createdAt: 'asc' }
            ]
        });

        const readyItemsDto: ReadyPickupItemDto[] = orderItemsFromDb.map(item => {
            const selectedModifiersDto: WaiterSelectedModifierDto[] = item.selectedModifiers.map(sm => {
                return {
                    optionName_es: sm.optionNameSnapshot || sm.modifierOption?.name_es || null,
                    optionName_en: sm.modifierOption?.name_en || null,
                };
            });

            return {
                orderItemId: item.id,
                orderId: item.orderId,
                orderNumber: item.order.orderNumber,
                orderCreatedAt: item.order.createdAt,
                tableIdentifier: item.order.table?.identifier || null,
                itemNameSnapshot_es: item.itemNameSnapshot,
                itemNameSnapshot_en: null, // Ajustar si tienes snapshot_en
                quantity: item.quantity,
                itemNotes: item.notes,
                kdsDestination: item.kdsDestination,
                selectedModifiers: selectedModifiersDto,
                currentOrderItemStatus: item.status,
            };
        });

        logger.log(`[WaiterService] Found ${readyItemsDto.length} items ready for pickup for business ${businessId}.`);
        return readyItemsDto;

    } catch (error) {
        logger.error(`[WaiterService] Error fetching 'ready for pickup' items for business ${businessId}:`, error);
        throw new InternalServerErrorException('Error al obtener los ítems listos para servir desde la base de datos.');
    }
};

export interface MarkServedResult {
    updatedOrderItem: OrderItem;
    finalOrderStatus: OrderStatus;
}

export const markOrderItemAsServed = async (
    orderItemId: string,
    businessId: string,
    waiterUserId?: string
): Promise<MarkServedResult> => {
    logger.log(`[WaiterService] Attempting to mark OrderItem ${orderItemId} as SERVED by waiter ${waiterUserId || 'unknown'} for business ${businessId}.`);

    return prisma.$transaction(async (tx) => {
        const orderItem = await tx.orderItem.findFirst({
            where: {
                id: orderItemId,
                order: { businessId: businessId }
            },
            include: {
                order: {
                    select: { id: true, status: true }
                }
            }
        });

        if (!orderItem) {
            logger.warn(`[WaiterService TX] OrderItem '${orderItemId}' not found or not in business '${businessId}'.`);
            throw new NotFoundException(`Ítem de pedido con ID ${orderItemId} no encontrado o no pertenece a este negocio.`);
        }
        if (!orderItem.order) {
            logger.error(`[WaiterService TX] Critical: OrderItem '${orderItemId}' has no associated order.`);
            throw new InternalServerErrorException(`Error interno: El ítem de pedido ${orderItemId} no está asociado a ningún pedido.`);
        }

        if (orderItem.status !== OrderItemStatus.READY) {
            logger.warn(`[WaiterService TX] OrderItem '${orderItemId}' is in status '${orderItem.status}', not 'READY'. Cannot mark as served.`);
            throw new BadRequestException(`El ítem de pedido '${orderItem.itemNameSnapshot || orderItemId}' no está en estado 'READY'. Estado actual: ${orderItem.status}. No se puede marcar como servido.`);
        }

        const dataToUpdateOrderItem: Prisma.OrderItemUpdateArgs['data'] = {
            status: OrderItemStatus.SERVED,
            servedAt: new Date(),
        };
        if (waiterUserId) {
            dataToUpdateOrderItem.servedById = waiterUserId;
        }

        const updatedOrderItem = await tx.orderItem.update({
            where: { id: orderItemId },
            data: dataToUpdateOrderItem,
        });
        logger.log(`[WaiterService TX] OrderItem ${orderItemId} marked as SERVED in DB.`);

        const orderId = orderItem.order.id;
        const allItemsInThisOrder = await tx.orderItem.findMany({
            where: { orderId: orderId },
            select: { status: true }
        });

        const activeItems = allItemsInThisOrder.filter(item => item.status !== OrderItemStatus.CANCELLED);
        let newOrderStatusForParent: OrderStatus = orderItem.order.status;

        if (activeItems.length > 0 && activeItems.every(item => item.status === OrderItemStatus.SERVED)) {
            if (
                orderItem.order.status !== OrderStatus.PAID &&
                orderItem.order.status !== OrderStatus.CANCELLED &&
                orderItem.order.status !== OrderStatus.COMPLETED
            ) {
                newOrderStatusForParent = OrderStatus.COMPLETED;
                await tx.order.update({
                    where: { id: orderId },
                    data: { status: newOrderStatusForParent }
                });
                logger.log(`[WaiterService TX] Order ${orderId} status updated to COMPLETED as all active items are SERVED.`);
            } else {
                 logger.log(`[WaiterService TX] Order ${orderId} already in final/completed state (${orderItem.order.status}). Not changing to COMPLETED.`);
            }
        } else if (activeItems.length === 0 && allItemsInThisOrder.length > 0) {
             if (orderItem.order.status !== OrderStatus.CANCELLED && orderItem.order.status !== OrderStatus.PAID) {
                newOrderStatusForParent = OrderStatus.CANCELLED;
                await tx.order.update({
                    where: { id: orderId },
                    data: { status: newOrderStatusForParent }
                });
                logger.log(`[WaiterService TX] Order ${orderId} status updated to CANCELLED as all items were cancelled.`);
            }
        } else {
            logger.log(`[WaiterService TX] Order ${orderId} still has items not SERVED or no active items. Order status remains ${newOrderStatusForParent}.`);
        }
        return { updatedOrderItem, finalOrderStatus: newOrderStatusForParent };
    });
};

export const requestBillByStaff = async (
    orderId: string,
    staffUserId: string,
    businessId: string,
    paymentPreference?: string | undefined
): Promise<Order> => {
    logger.log(`[WaiterService] Staff ${staffUserId} requesting bill for order ${orderId} in business ${businessId}. Preference: ${paymentPreference || 'N/A'}`);

    return prisma.$transaction(async (tx) => {
        const order = await tx.order.findUnique({
            where: { id: orderId },
            select: { id: true, status: true, businessId: true, tableId: true, orderNumber: true }
        });

        if (!order) {
            throw new NotFoundException(`Pedido con ID ${orderId} no encontrado.`);
        }
        if (order.businessId !== businessId) {
            throw new ForbiddenException("El pedido no pertenece al negocio del personal.");
        }

        const allowedStates: OrderStatus[] = [
            OrderStatus.RECEIVED, OrderStatus.IN_PROGRESS, OrderStatus.PARTIALLY_READY,
            OrderStatus.ALL_ITEMS_READY, OrderStatus.COMPLETED,
        ];
        if (!allowedStates.includes(order.status)) {
            throw new BadRequestException(`No se puede solicitar la cuenta para un pedido en estado '${order.status}'.`);
        }

        const updateData: Prisma.OrderUpdateInput = {
            status: OrderStatus.PENDING_PAYMENT,
            isBillRequested: true,
            ...(paymentPreference !== undefined && { paymentMethodPreference: paymentPreference }),
        };

        const updatedOrder = await tx.order.update({ where: { id: orderId }, data: updateData });
        logger.log(`[WaiterService TX] Bill requested by staff ${staffUserId} for order ${orderId}. Status set to PENDING_PAYMENT.`);

        if (order.tableId) {
            try {
                await tx.table.update({
                    where: { id: order.tableId },
                    data: { status: TableStatus.PENDING_PAYMENT_TABLE }
                });
                logger.log(`[WaiterService TX] Table ID '${order.tableId}' status updated to PENDING_PAYMENT_TABLE.`);
            } catch (tableError) {
                logger.error(`[WaiterService TX] Failed to update table status for table '${order.tableId}' on staff bill request. Continuing. Error:`, tableError);
            }
        }
        return updatedOrder;
    });
};

export const getOrdersForStaff = async (
    businessId: string,
    filters?: { status?: OrderStatus[] }
): Promise<WaiterOrderListItemDto[]> => {
    logger.log(`[WaiterService] Fetching orders for staff UI. Business: ${businessId}, Filters: ${JSON.stringify(filters)}`);

    const whereClause: Prisma.OrderWhereInput = {
        businessId: businessId,
    };

    if (filters?.status && filters.status.length > 0) {
        whereClause.status = { in: filters.status };
    } else {
        whereClause.status = {
            in: [
                OrderStatus.PENDING_PAYMENT, OrderStatus.COMPLETED,
                OrderStatus.ALL_ITEMS_READY, OrderStatus.PARTIALLY_READY,
                OrderStatus.IN_PROGRESS, OrderStatus.RECEIVED
            ]
        };
    }

    try {
        const ordersFromDb = await prisma.order.findMany({
            where: whereClause,
            select: {
                id: true,
                orderNumber: true,
                table: { select: { identifier: true } },
                status: true,
                finalAmount: true,
                totalAmount: true,
                items: {
                    where: { status: { not: OrderItemStatus.CANCELLED } },
                    select: { quantity: true }
                },
                customerLCo: { select: { name: true, email: true } },
                createdAt: true,
                isBillRequested: true,
                orderType: true,
            },
            // --- CORRECCIÓN APLICADA ---
            orderBy: [
                { status: 'asc' },    // Primer criterio de ordenación
                { createdAt: 'asc' }  // Segundo criterio de ordenación
            ]
            // --- FIN CORRECCIÓN ---
        });

        const orderListItems: WaiterOrderListItemDto[] = ordersFromDb.map(order => {
            const itemCount = order.items.reduce((sum, item) => sum + item.quantity, 0);
            let customerDisplayName: string | null = null;
            if (order.customerLCo) {
                customerDisplayName = order.customerLCo.name || order.customerLCo.email;
            }

            return {
                orderId: order.id,
                orderNumber: order.orderNumber,
                tableIdentifier: order.table?.identifier || null,
                status: order.status,
                finalAmount: (order.finalAmount ?? order.totalAmount).toNumber(),
                itemCount: itemCount,
                customerName: customerDisplayName,
                createdAt: order.createdAt,
                isBillRequested: order.isBillRequested,
                orderType: order.orderType as OrderType | null, // Casteo al enum local si es necesario
            };
        });

        logger.log(`[WaiterService] Found ${orderListItems.length} orders for staff UI for business ${businessId}.`);
        return orderListItems;

    } catch (error) {
        logger.error(`[WaiterService] Error fetching orders for staff UI (Business: ${businessId}):`, error);
        if (error instanceof Prisma.PrismaClientValidationError) {
            logger.error("[WaiterService] Prisma Client Validation Error details:", error.message);
            throw new InternalServerErrorException(`Error de validación de Prisma al obtener pedidos: ${error.message}`);
        }
        throw new InternalServerErrorException('Error al obtener la lista de pedidos para el personal.');
    }
};

// (No se necesita exportar `prisma` si el controlador no lo usa directamente)