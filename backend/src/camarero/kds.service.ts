// backend/src/camarero/kds.service.ts
// Version: 1.0.5 (Corrected type assignment for local currentOrderItem date fields - FULL FILE)

import { PrismaClient, Prisma, OrderItem, OrderItemStatus, OrderStatus, UserRole } from '@prisma/client';

const prisma = new PrismaClient();

// Tipo para la información que necesita el KDS para cada OrderItem
export interface KdsOrderItemData {
    id: string; // OrderItem ID
    quantity: number;
    status: OrderItemStatus;
    notes: string | null;
    kdsDestination: string | null;
    menuItemName_es: string | null;
    menuItemName_en: string | null;
    selectedModifiers: {
        optionName_es: string | null;
        optionName_en: string | null;
    }[];
    orderInfo: {
        id: string; // Order ID
        orderNumber: string;
        createdAt: Date;
        tableIdentifier: string | null;
    };
    preparationTime?: number | null; 
    preparedAt?: Date | null;
    servedAt?: Date | null;
}


/**
 * Obtiene los ítems de pedido para una destino KDS específico.
 * @param businessId - ID del negocio.
 * @param kdsDestination - El destino KDS (ej. "COCINA", "BARRA").
 * @param filterStatus - Array opcional de OrderItemStatus para filtrar.
 * @returns Array de KdsOrderItemData.
 */
export const getItemsForKds = async (
    businessId: string,
    kdsDestination: string,
    filterStatus?: OrderItemStatus[]
): Promise<KdsOrderItemData[]> => {
    console.log(`[KDS SVC] Fetching items for KDS. Business: ${businessId}, Destination: ${kdsDestination}, StatusFilter: ${filterStatus?.join(',')}`);

    const statusFilter = filterStatus && filterStatus.length > 0 
        ? filterStatus 
        : [OrderItemStatus.PENDING_KDS, OrderItemStatus.PREPARING];

    try {
        const orderItems = await prisma.orderItem.findMany({
            where: {
                order: { 
                    businessId: businessId, 
                    status: { 
                        notIn: [OrderStatus.COMPLETED, OrderStatus.PAID, OrderStatus.CANCELLED] 
                    }
                },
                kdsDestination: kdsDestination,
                status: {
                    in: statusFilter,
                },
            },
            include: {
                menuItem: { 
                    select: {
                        name_es: true,
                        name_en: true,
                        preparationTime: true,
                    }
                },
                selectedModifiers: { 
                    include: {
                        modifierOption: {
                            select: {
                                name_es: true,
                                name_en: true,
                            }
                        }
                    }
                },
                order: { 
                    select: {
                        id: true,
                        orderNumber: true,
                        createdAt: true,
                        table: { 
                            select: {
                                identifier: true,
                            }
                        }
                    }
                }
            },
            orderBy: {
                order: {
                    createdAt: 'asc', 
                }
            }
        });

        const kdsItems: KdsOrderItemData[] = orderItems.map(item => ({
            id: item.id,
            quantity: item.quantity,
            status: item.status,
            notes: item.notes,
            kdsDestination: item.kdsDestination,
            menuItemName_es: item.menuItem?.name_es || item.itemNameSnapshot,
            menuItemName_en: item.menuItem?.name_en || null, 
            selectedModifiers: item.selectedModifiers.map(sm => ({
                optionName_es: sm.modifierOption?.name_es || sm.optionNameSnapshot,
                optionName_en: sm.modifierOption?.name_en || null,
            })),
            orderInfo: {
                id: item.order.id,
                orderNumber: item.order.orderNumber,
                createdAt: item.order.createdAt,
                tableIdentifier: item.order.table?.identifier || null,
            },
            preparationTime: item.menuItem?.preparationTime,
            preparedAt: item.preparedAt,
            servedAt: item.servedAt,
        }));

        console.log(`[KDS SVC] Found ${kdsItems.length} items for KDS Destination '${kdsDestination}'.`);
        return kdsItems;

    } catch (error) {
        console.error(`[KDS SVC] Error fetching items for KDS (Destination: ${kdsDestination}):`, error);
        throw new Error('Error al obtener los ítems para el KDS desde la base de datos.');
    }
};


/**
 * Actualiza el estado de un OrderItem específico.
 * También maneja la lógica para actualizar el estado del Order general.
 * @param orderItemId - ID del OrderItem a actualizar.
 * @param newOrderItemStatus - El nuevo OrderItemStatus.
 * @param businessId - ID del negocio (para verificación de pertenencia).
 * @returns El OrderItem actualizado con sus relaciones (order, menuItem, selectedModifiers).
 */
export const updateOrderItemStatus = async (
    orderItemId: string,
    newOrderItemStatus: OrderItemStatus,
    businessId: string
): Promise<OrderItem> => {
    console.log(`[KDS SVC] Attempting to update OrderItem ${orderItemId} to ${newOrderItemStatus} for business ${businessId}`);

    const allowedTransitions: Partial<Record<OrderItemStatus, OrderItemStatus[]>> = {
        [OrderItemStatus.PENDING_KDS]: [OrderItemStatus.PREPARING, OrderItemStatus.CANCELLED, OrderItemStatus.CANCELLATION_REQUESTED],
        [OrderItemStatus.PREPARING]: [OrderItemStatus.READY, OrderItemStatus.CANCELLED, OrderItemStatus.CANCELLATION_REQUESTED, OrderItemStatus.PENDING_KDS],
        [OrderItemStatus.READY]: [OrderItemStatus.SERVED, OrderItemStatus.PREPARING], 
        [OrderItemStatus.CANCELLATION_REQUESTED]: [OrderItemStatus.CANCELLED, OrderItemStatus.PENDING_KDS, OrderItemStatus.PREPARING],
    };

    const finalUpdatedOrderItem = await prisma.$transaction(async (tx) => {
        let currentOrderItem = await tx.orderItem.findFirst({ // Usar let para poder modificar sus propiedades
            where: { id: orderItemId, order: { businessId: businessId } },
            include: { order: { select: { id: true, status: true } } } 
        });

        if (!currentOrderItem) {
            throw new Error(`Ítem de pedido con ID ${orderItemId} no encontrado o no pertenece a este negocio.`);
        }
        if (!currentOrderItem.order?.id) { 
             throw new Error(`Error interno: El ítem de pedido ${orderItemId} no está asociado a un pedido.`);
        }

        const currentOrderItemStatusValue = currentOrderItem.status;
        
        if (currentOrderItemStatusValue !== newOrderItemStatus) {
            if (allowedTransitions[currentOrderItemStatusValue] && !allowedTransitions[currentOrderItemStatusValue]?.includes(newOrderItemStatus)) {
                throw new Error(`Transición de estado no permitida para el ítem de '${currentOrderItemStatusValue}' a '${newOrderItemStatus}'.`);
            }
            
            const dataToUpdateForOrderItem: Prisma.OrderItemUpdateInput = { status: newOrderItemStatus };
            let newPreparedAtDate: Date | null = currentOrderItem.preparedAt; // Para la variable local
            let newServedAtDate: Date | null = currentOrderItem.servedAt;     // Para la variable local

            if (newOrderItemStatus === OrderItemStatus.PREPARING && !currentOrderItem.preparedAt) {
                newPreparedAtDate = new Date();
                dataToUpdateForOrderItem.preparedAt = newPreparedAtDate;
            } else if (newOrderItemStatus === OrderItemStatus.SERVED && !currentOrderItem.servedAt) {
                 newServedAtDate = new Date();
                 dataToUpdateForOrderItem.servedAt = newServedAtDate;
            } else if (newOrderItemStatus === OrderItemStatus.READY && !currentOrderItem.preparedAt) {
                newPreparedAtDate = new Date();
                dataToUpdateForOrderItem.preparedAt = newPreparedAtDate;
            }

            await tx.orderItem.update({
                where: { id: orderItemId },
                data: dataToUpdateForOrderItem,
            });
            console.log(`[KDS SVC] OrderItem ${orderItemId} status updated to ${newOrderItemStatus} in DB.`);
            
            // Reflejar el cambio en nuestra variable local para la lógica siguiente
            currentOrderItem.status = newOrderItemStatus; 
            currentOrderItem.preparedAt = newPreparedAtDate; // Asignar el Date o null
            currentOrderItem.servedAt = newServedAtDate;   // Asignar el Date o null

        } else {
            console.log(`[KDS SVC] OrderItem ${orderItemId} ya está en estado ${newOrderItemStatus}. No se requiere actualización de ítem.`);
        }

        // --- LÓGICA DE ACTUALIZACIÓN DEL ESTADO DEL PEDIDO (Order.status) CON LOGS ---
        const orderId = currentOrderItem.order.id;
        const currentOrderStatusInDb = currentOrderItem.order.status; 

        const allItemsOfThisOrder = await tx.orderItem.findMany({
            where: { orderId: orderId },
            select: { status: true, id: true } 
        });
        
        console.log(`[KDS SVC - OrderStatusLogic] For Order ${orderId} - Current Order Status in DB: ${currentOrderStatusInDb}`);
        console.log(`[KDS SVC - OrderStatusLogic] All items for order ${orderId} (after potential item update):`, allItemsOfThisOrder.map(i => ({id: i.id, status: i.status})));

        const activeItems = allItemsOfThisOrder.filter(item => item.status !== OrderItemStatus.CANCELLED);
        let determinedNewOrderStatus: OrderStatus = currentOrderStatusInDb; 
        console.log(`[KDS SVC - OrderStatusLogic] Initial determinedNewOrderStatus set to: ${determinedNewOrderStatus}`);

        if (activeItems.length === 0 && allItemsOfThisOrder.length > 0) { 
            determinedNewOrderStatus = OrderStatus.CANCELLED;
            console.log(`[KDS SVC - OrderStatusLogic] Condition met: All items cancelled. New OrderStatus -> ${determinedNewOrderStatus}`);
        } else if (activeItems.every(item => item.status === OrderItemStatus.SERVED)) {
            determinedNewOrderStatus = OrderStatus.COMPLETED;
            console.log(`[KDS SVC - OrderStatusLogic] Condition met: All active items SERVED. New OrderStatus -> ${determinedNewOrderStatus}`);
        } else if (activeItems.every(item => item.status === OrderItemStatus.READY || item.status === OrderItemStatus.SERVED)) {
            determinedNewOrderStatus = OrderStatus.ALL_ITEMS_READY;
            console.log(`[KDS SVC - OrderStatusLogic] Condition met: All active items READY or SERVED. New OrderStatus -> ${determinedNewOrderStatus}`);
        } else if (activeItems.some(item => item.status === OrderItemStatus.READY)) {
            determinedNewOrderStatus = OrderStatus.PARTIALLY_READY;
            console.log(`[KDS SVC - OrderStatusLogic] Condition met: Some items READY. New OrderStatus -> ${determinedNewOrderStatus}`);
        } else if (activeItems.some(item => item.status === OrderItemStatus.PREPARING)) {
            determinedNewOrderStatus = OrderStatus.IN_PROGRESS;
            console.log(`[KDS SVC - OrderStatusLogic] Condition met: Some items PREPARING. New OrderStatus -> ${determinedNewOrderStatus}`);
        } else if (activeItems.every(item => item.status === OrderItemStatus.PENDING_KDS)) {
            determinedNewOrderStatus = OrderStatus.RECEIVED;
            console.log(`[KDS SVC - OrderStatusLogic] Condition met: All active items PENDING_KDS. New OrderStatus -> ${determinedNewOrderStatus}`);
        } else {
             console.log(`[KDS SVC - OrderStatusLogic] No primary condition met. Current OrderStatus in DB: ${currentOrderStatusInDb}`);
            if (currentOrderStatusInDb === OrderStatus.RECEIVED && 
                activeItems.some(item => 
                       item.status === OrderItemStatus.PREPARING || 
                       item.status === OrderItemStatus.READY || 
                       item.status === OrderItemStatus.SERVED
                   )
            ) {
                 determinedNewOrderStatus = OrderStatus.IN_PROGRESS;
                 console.log(`[KDS SVC - OrderStatusLogic] Fallback condition: Was RECEIVED, now has active non-PENDING_KDS items. New OrderStatus -> ${determinedNewOrderStatus}`);
            } else {
                console.log(`[KDS SVC - OrderStatusLogic] Fallback: No specific status change detected based on current item states. Order status would remain: ${determinedNewOrderStatus}`);
            }
        }
        
        if (currentOrderStatusInDb !== determinedNewOrderStatus) {
            await tx.order.update({
                where: { id: orderId },
                data: { status: determinedNewOrderStatus }
            });
            console.log(`[KDS SVC - DB UPDATE] Order ${orderId} status was ${currentOrderStatusInDb}, NOW UPDATED to ${determinedNewOrderStatus}.`);
        } else {
            console.log(`[KDS SVC - NO DB UPDATE] Order ${orderId} status REMAINS ${currentOrderStatusInDb}. (Determined new status was also: ${determinedNewOrderStatus})`);
        }
        // --- FIN LÓGICA DE ACTUALIZACIÓN DEL ESTADO DEL PEDIDO ---
        
        const finalOrderItemResult = await tx.orderItem.findUniqueOrThrow({
            where: { id: orderItemId },
            include: { 
                order: true, 
                menuItem: true, 
                selectedModifiers: { include: { modifierOption: true }}
            }
        });
        return finalOrderItemResult;
    });
    return finalUpdatedOrderItem; 
};