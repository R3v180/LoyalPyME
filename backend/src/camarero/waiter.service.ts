// backend/src/camarero/waiter.service.ts
// Version: 1.2.1 (Fix totalAmount select in getOrdersForStaff)

import {
    PrismaClient,
    OrderItem,
    OrderItemStatus,
    OrderStatus,
    Prisma,
    TableStatus,
    Order,
    OrderType
} from '@prisma/client';
import { ReadyPickupItemDto, WaiterSelectedModifierDto, WaiterOrderListItemDto } from './camarero.dto';
import { NotFoundException, BadRequestException, ForbiddenException, Logger, InternalServerErrorException } from '@nestjs/common';

const prisma = new PrismaClient();
const logger = new Logger('WaiterService');

export const getReadyForPickupItems = async (businessId: string): Promise<ReadyPickupItemDto[]> => {
    logger.log(`Fetching items ready for pickup for business: ${businessId}`);
    try {
        const orderItemsFromDb = await prisma.orderItem.findMany({
            where: {
                status: OrderItemStatus.READY,
                order: {
                    businessId: businessId,
                    status: {
                        notIn: [
                            OrderStatus.COMPLETED,
                            OrderStatus.PAID,
                            OrderStatus.CANCELLED,
                            OrderStatus.PENDING_PAYMENT,
                            OrderStatus.PAYMENT_FAILED
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

            let itemNameSnapshotEn: string | null = null;

            return {
                orderItemId: item.id,
                orderId: item.orderId,
                orderNumber: item.order.orderNumber,
                orderCreatedAt: item.order.createdAt,
                tableIdentifier: item.order.table?.identifier || null,
                itemNameSnapshot_es: item.itemNameSnapshot,
                itemNameSnapshot_en: itemNameSnapshotEn,
                quantity: item.quantity,
                itemNotes: item.notes,
                kdsDestination: item.kdsDestination,
                selectedModifiers: selectedModifiersDto,
                currentOrderItemStatus: item.status,
            };
        });

        logger.log(`Found ${readyItemsDto.length} items ready for pickup for business ${businessId}.`);
        return readyItemsDto;

    } catch (error) {
        logger.error(`Error fetching 'ready for pickup' items for business ${businessId}:`, error);
        throw new Error('Error al obtener los ítems listos para servir desde la base de datos.');
    }
};


export const markOrderItemAsServed = async (
    orderItemId: string,
    businessId: string,
    waiterUserId?: string
): Promise<OrderItem> => {
    logger.log(`Attempting to mark OrderItem ${orderItemId} as SERVED by waiter ${waiterUserId || 'unknown'} for business ${businessId}.`);

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
            throw new NotFoundException(`Ítem de pedido con ID ${orderItemId} no encontrado o no pertenece a este negocio.`);
        }
        if (!orderItem.order) {
            throw new InternalServerErrorException(`Error interno: El ítem de pedido ${orderItemId} no está asociado a ningún pedido.`);
        }

        if (orderItem.status !== OrderItemStatus.READY) {
            throw new BadRequestException(`El ítem de pedido '${orderItem.itemNameSnapshot || orderItemId}' no está en estado 'READY'. Estado actual: ${orderItem.status}. No se puede marcar como servido.`);
        }

        const dataToUpdate: Prisma.OrderItemUpdateArgs['data'] = {
            status: OrderItemStatus.SERVED,
            servedAt: new Date(),
        };
        if (waiterUserId) {
            dataToUpdate.servedById = waiterUserId;
        }

        const updatedOrderItem = await tx.orderItem.update({
            where: { id: orderItemId },
            data: dataToUpdate,
        });
        logger.log(`[TX] OrderItem ${orderItemId} marked as SERVED.`);

        const orderId = orderItem.order.id;
        const allItemsInOrder = await tx.orderItem.findMany({
            where: { orderId: orderId },
            select: { status: true }
        });

        const activeItems = allItemsInOrder.filter(item => item.status !== OrderItemStatus.CANCELLED);

        if (activeItems.length > 0 && activeItems.every(item => item.status === OrderItemStatus.SERVED)) {
            if (
                orderItem.order.status !== OrderStatus.PAID &&
                orderItem.order.status !== OrderStatus.CANCELLED &&
                orderItem.order.status !== OrderStatus.COMPLETED
            ) {
                await tx.order.update({
                    where: { id: orderId },
                    data: { status: OrderStatus.COMPLETED }
                });
                logger.log(`[TX] Order ${orderId} status updated to COMPLETED as all active items are SERVED.`);
            } else {
                 logger.log(`[TX] Order ${orderId} already in state ${orderItem.order.status}. Not changing to COMPLETED despite all items served.`);
            }
        } else if (activeItems.length === 0 && allItemsInOrder.length > 0) {
            if (orderItem.order.status !== OrderStatus.CANCELLED && orderItem.order.status !== OrderStatus.PAID) {
                 await tx.order.update({
                    where: { id: orderId },
                    data: { status: OrderStatus.CANCELLED }
                });
                logger.log(`[TX] Order ${orderId} status updated to CANCELLED as all items were cancelled.`);
            }
        }
        else {
             logger.log(`[TX] Order ${orderId} still has items not SERVED or no active items. Status not changed to COMPLETED. Active items: ${activeItems.length}, All items: ${allItemsInOrder.length}`);
        }

        return updatedOrderItem;
    });
};


export const requestBillByStaff = async (
    orderId: string,
    staffUserId: string,
    businessId: string,
    paymentPreference?: string
): Promise<Order> => {
    logger.log(`Staff ${staffUserId} requesting bill for order ${orderId} in business ${businessId}. Preference: ${paymentPreference || 'N/A'}`);

    const order = await prisma.order.findUnique({
      where: { id: orderId },
      select: { status: true, businessId: true, tableId: true }
    });

    if (!order) {
      throw new NotFoundException(`Pedido con ID ${orderId} no encontrado.`);
    }

    if (order.businessId !== businessId) {
        throw new ForbiddenException("El pedido no pertenece al negocio del personal.");
    }

    const allowedStatesToRequestBill: OrderStatus[] = [
      OrderStatus.RECEIVED,
      OrderStatus.IN_PROGRESS,
      OrderStatus.PARTIALLY_READY,
      OrderStatus.ALL_ITEMS_READY,
      OrderStatus.COMPLETED,
    ];

    if (!allowedStatesToRequestBill.includes(order.status)) {
      throw new BadRequestException(`No se puede solicitar la cuenta para un pedido en estado '${order.status}'.`);
    }

    const updatedOrder = await prisma.order.update({
      where: { id: orderId },
      data: {
        status: OrderStatus.PENDING_PAYMENT,
        isBillRequested: true,
        paymentMethodPreference: paymentPreference,
      },
    });

    logger.log(`Bill requested by staff ${staffUserId} for order ${orderId}. Status set to PENDING_PAYMENT.`);

    if (order.tableId) {
        try {
            await prisma.table.update({
                where: { id: order.tableId },
                data: { status: TableStatus.PENDING_PAYMENT_TABLE }
            });
            logger.log(`Table ${order.tableId} status updated to PENDING_PAYMENT_TABLE.`);
        } catch (tableError) {
            logger.error(`Failed to update table status for table ${order.tableId} on bill request:`, tableError);
        }
    }

    return updatedOrder;
};

export const getOrdersForStaff = async (
    businessId: string,
    filters?: { status?: OrderStatus[] }
): Promise<WaiterOrderListItemDto[]> => {
    logger.log(`Fetching orders for staff UI. Business: ${businessId}, Filters: ${JSON.stringify(filters)}`);

    const whereClause: Prisma.OrderWhereInput = {
        businessId: businessId,
    };

    if (filters?.status && filters.status.length > 0) {
        whereClause.status = { in: filters.status };
    } else {
        whereClause.status = { in: [OrderStatus.PENDING_PAYMENT, OrderStatus.COMPLETED, OrderStatus.ALL_ITEMS_READY, OrderStatus.PARTIALLY_READY, OrderStatus.IN_PROGRESS, OrderStatus.RECEIVED] };
    }

    try {
        const orders = await prisma.order.findMany({
            where: whereClause,
            select: {
                id: true,
                orderNumber: true,
                table: { select: { identifier: true } },
                status: true,
                finalAmount: true,
                totalAmount: true, // Asegurarse que este campo está seleccionado
                items: {
                    where: { status: { not: OrderItemStatus.CANCELLED } },
                    select: { quantity: true }
                },
                customerLCo: { select: { name: true, email: true } },
                createdAt: true,
                isBillRequested: true,
                orderType: true,
            },
            orderBy: {
                createdAt: 'desc',
            }
        });

        const orderListItems: WaiterOrderListItemDto[] = orders.map(order => {
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
                finalAmount: order.finalAmount?.toNumber() ?? order.totalAmount.toNumber(),
                itemCount: itemCount,
                customerName: customerDisplayName,
                createdAt: order.createdAt,
                isBillRequested: order.isBillRequested,
                orderType: order.orderType,
            };
        });

        logger.log(`Found ${orderListItems.length} orders for staff UI for business ${businessId}.`);
        return orderListItems;

    } catch (error) {
        logger.error(`Error fetching orders for staff UI (Business: ${businessId}):`, error);
        throw new Error('Error al obtener la lista de pedidos para el personal.');
    }
};