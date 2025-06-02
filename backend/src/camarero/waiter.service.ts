// backend/src/camarero/waiter.service.ts
// Version: 1.0.1 (Corrected OrderStatus check in markOrderItemAsServed for TS2345)

import { 
    PrismaClient, 
    OrderItem, 
    OrderItemStatus, 
    OrderStatus, 
    Prisma 
} from '@prisma/client';
import { ReadyPickupItemDto, WaiterSelectedModifierDto } from './camarero.dto';

const prisma = new PrismaClient();

// ... (La función getReadyForPickupItems se mantiene igual que en la versión anterior)
export const getReadyForPickupItems = async (businessId: string): Promise<ReadyPickupItemDto[]> => {
    console.log(`[WaiterService] Fetching items ready for pickup for business: ${businessId}`);
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
                            select: { name_en: true }
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
                let nameEnForModifier: string | null = null;
                if (sm.modifierOption?.name_en) {
                    nameEnForModifier = sm.modifierOption.name_en;
                }
                return {
                    optionName_es: sm.optionNameSnapshot || null, 
                    optionName_en: nameEnForModifier,
                };
            });
            
            let nameEnForItem: string | null = null;

            return {
                orderItemId: item.id,
                orderId: item.orderId,
                orderNumber: item.order.orderNumber,
                orderCreatedAt: item.order.createdAt,
                tableIdentifier: item.order.table?.identifier || null,
                itemNameSnapshot_es: item.itemNameSnapshot,
                itemNameSnapshot_en: nameEnForItem, 
                quantity: item.quantity,
                itemNotes: item.notes,
                kdsDestination: item.kdsDestination,
                selectedModifiers: selectedModifiersDto,
                currentOrderItemStatus: item.status,
            };
        });
        
        console.log(`[WaiterService] Found ${readyItemsDto.length} items ready for pickup for business ${businessId}.`);
        return readyItemsDto;

    } catch (error) {
        console.error(`[WaiterService] Error fetching 'ready for pickup' items for business ${businessId}:`, error);
        throw new Error('Error al obtener los ítems listos para servir desde la base de datos.');
    }
};


export const markOrderItemAsServed = async (
    orderItemId: string,
    businessId: string,
    waiterUserId?: string
): Promise<OrderItem> => {
    console.log(`[WaiterService] Attempting to mark OrderItem ${orderItemId} as SERVED by waiter ${waiterUserId || 'unknown'} for business ${businessId}.`);

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
            throw new Error(`Ítem de pedido con ID ${orderItemId} no encontrado o no pertenece a este negocio.`);
        }
        if (!orderItem.order) {
            throw new Error(`Error interno: El ítem de pedido ${orderItemId} no está asociado a ningún pedido.`);
        }

        if (orderItem.status !== OrderItemStatus.READY) {
            throw new Error(`El ítem de pedido '${orderItem.itemNameSnapshot || orderItemId}' no está en estado 'READY'. Estado actual: ${orderItem.status}. No se puede marcar como servido.`);
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
        console.log(`[WaiterService TX] OrderItem ${orderItemId} marked as SERVED.`);

        const orderId = orderItem.order.id;
        const allItemsInOrder = await tx.orderItem.findMany({
            where: { orderId: orderId },
            select: { status: true }
        });

        const activeItems = allItemsInOrder.filter(item => item.status !== OrderItemStatus.CANCELLED);
        
        if (activeItems.length > 0 && activeItems.every(item => item.status === OrderItemStatus.SERVED)) {
            // --- CORRECCIÓN DE LA CONDICIÓN ---
            // Solo actualizar a COMPLETED si el estado actual NO ES ya uno final o más avanzado.
            if (
                orderItem.order.status !== OrderStatus.PAID &&
                orderItem.order.status !== OrderStatus.CANCELLED &&
                orderItem.order.status !== OrderStatus.COMPLETED // Evitar re-actualizar si ya está COMPLETED
            ) {
            // --- FIN CORRECCIÓN ---
                await tx.order.update({
                    where: { id: orderId },
                    data: { status: OrderStatus.COMPLETED }
                });
                console.log(`[WaiterService TX] Order ${orderId} status updated to COMPLETED as all active items are SERVED.`);
            } else {
                 console.log(`[WaiterService TX] Order ${orderId} already in state ${orderItem.order.status}. Not changing to COMPLETED despite all items served.`);
            }
        } else if (activeItems.length === 0 && allItemsInOrder.length > 0) {
            if (orderItem.order.status !== OrderStatus.CANCELLED && orderItem.order.status !== OrderStatus.PAID) {
                 await tx.order.update({
                    where: { id: orderId },
                    data: { status: OrderStatus.CANCELLED }
                });
                console.log(`[WaiterService TX] Order ${orderId} status updated to CANCELLED as all items were cancelled.`);
            }
        }
        else {
             console.log(`[WaiterService TX] Order ${orderId} still has items not SERVED or no active items. Status not changed to COMPLETED. Active items: ${activeItems.length}, All items: ${allItemsInOrder.length}`);
        }

        return updatedOrderItem;
    });
};