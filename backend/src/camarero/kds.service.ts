// backend/src/camarero/kds.service.ts
// Version: 1.1.1 (Corrected enums based on TS errors, refined Order.status logic - FULL FILE)

import { PrismaClient, Prisma, OrderItem, OrderItemStatus, OrderStatus } from '@prisma/client';

const prisma = new PrismaClient();

// Tipo para la información que necesita el KDS para cada OrderItem
export interface KdsOrderItemData {
    id: string; // OrderItem ID
    quantity: number;
    status: OrderItemStatus; // Usará los enums del cliente: PENDING_KDS, PREPARING, READY, etc.
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

    // Usamos los estados de Prisma que el entorno espera: PENDING_KDS, PREPARING
    const statusFilterToUse = filterStatus && filterStatus.length > 0
        ? filterStatus
        : [OrderItemStatus.PENDING_KDS, OrderItemStatus.PREPARING];

    try {
        const orderItems = await prisma.orderItem.findMany({
            where: {
                order: {
                    businessId: businessId,
                    // Pedidos que están listos para cocina/KDS: RECEIVED, IN_PROGRESS, PARTIALLY_READY, ALL_ITEMS_READY
                    // Excluimos PENDING_PAYMENT, PAID, COMPLETED, CANCELLED, PAYMENT_FAILED
                    status: {
                        in: [
                            OrderStatus.RECEIVED,
                            OrderStatus.IN_PROGRESS,
                            OrderStatus.PARTIALLY_READY,
                            OrderStatus.ALL_ITEMS_READY
                        ],
                    }
                },
                kdsDestination: kdsDestination,
                status: {
                    in: statusFilterToUse,
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
        if (error instanceof Error) {
            throw new Error(`Error al obtener los ítems para el KDS: ${error.message}`);
        }
        throw new Error('Error al obtener los ítems para el KDS desde la base de datos.');
    }
};


/**
 * Actualiza el estado de un OrderItem específico.
 * También maneja la lógica para actualizar el estado del Order general.
 * @param orderItemId - ID del OrderItem a actualizar.
 * @param newOrderItemStatus - El nuevo OrderItemStatus (debe ser uno de los definidos en el Prisma del entorno).
 * @param businessId - ID del negocio (para verificación de pertenencia).
 * @returns El OrderItem actualizado con sus relaciones (order, menuItem, selectedModifiers).
 */
export const updateOrderItemStatus = async (
    orderItemId: string,
    newOrderItemStatus: OrderItemStatus, // Usamos el enum del entorno
    businessId: string
): Promise<OrderItem> => {
    console.log(`[KDS SVC] Attempting to update OrderItem ${orderItemId} to ${newOrderItemStatus} for business ${businessId}`);

    // Transiciones permitidas usando los enums del entorno
    const allowedTransitions: Partial<Record<OrderItemStatus, OrderItemStatus[]>> = {
        [OrderItemStatus.PENDING_KDS]: [OrderItemStatus.PREPARING, OrderItemStatus.CANCELLED, OrderItemStatus.CANCELLATION_REQUESTED],
        [OrderItemStatus.PREPARING]:   [OrderItemStatus.READY, OrderItemStatus.PENDING_KDS, OrderItemStatus.CANCELLED, OrderItemStatus.CANCELLATION_REQUESTED],
        [OrderItemStatus.READY]:       [OrderItemStatus.SERVED, OrderItemStatus.PREPARING], // SERVED lo haría un camarero, KDS lo pasa a READY, quizá puede volver a PREPARING
        [OrderItemStatus.CANCELLATION_REQUESTED]: [OrderItemStatus.CANCELLED, OrderItemStatus.PENDING_KDS, OrderItemStatus.PREPARING], // Si se rechaza la cancelación
        // SERVED y CANCELLED son finales desde KDS
    };

    const finalUpdatedOrderItem = await prisma.$transaction(async (tx) => {
        let currentOrderItem = await tx.orderItem.findFirst({
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
            let newPreparedAtDate: Date | null = currentOrderItem.preparedAt;
            let newServedAtDate: Date | null = currentOrderItem.servedAt;

            if (newOrderItemStatus === OrderItemStatus.PREPARING && !currentOrderItem.preparedAt) {
                newPreparedAtDate = new Date();
                dataToUpdateForOrderItem.preparedAt = newPreparedAtDate;
            } else if (newOrderItemStatus === OrderItemStatus.READY && !currentOrderItem.preparedAt) {
                newPreparedAtDate = new Date();
                dataToUpdateForOrderItem.preparedAt = newPreparedAtDate;
            } else if (newOrderItemStatus === OrderItemStatus.SERVED && !currentOrderItem.servedAt) {
                newServedAtDate = new Date();
                dataToUpdateForOrderItem.servedAt = newServedAtDate;
                if (!currentOrderItem.preparedAt) { // Si se sirve directamente (ej. bebidas)
                    newPreparedAtDate = new Date();
                    dataToUpdateForOrderItem.preparedAt = newPreparedAtDate;
                }
            }

            await tx.orderItem.update({
                where: { id: orderItemId },
                data: dataToUpdateForOrderItem,
            });
            console.log(`[KDS SVC] OrderItem ${orderItemId} status updated to ${newOrderItemStatus} in DB.`);

            currentOrderItem.status = newOrderItemStatus;
            currentOrderItem.preparedAt = newPreparedAtDate;
            currentOrderItem.servedAt = newServedAtDate;

        } else {
            console.log(`[KDS SVC] OrderItem ${orderItemId} ya está en estado ${newOrderItemStatus}. No se requiere actualización de ítem.`);
        }

        // --- LÓGICA DE ACTUALIZACIÓN DEL ESTADO DEL PEDIDO (Order.status) CON ENUMS DEL ENTORNO ---
        const orderId = currentOrderItem.order.id;
        const currentOrderStatusInDb = currentOrderItem.order.status;

        const allItemsOfThisOrder = await tx.orderItem.findMany({
            where: { orderId: orderId },
            select: { status: true, id: true }
        });

        console.log(`[KDS SVC - OrderStatusLogic] For Order ${orderId} - Current Order Status in DB: ${currentOrderStatusInDb}`);
        console.log(`[KDS SVC - OrderStatusLogic] All items for order ${orderId} (after potential item update):`, allItemsOfThisOrder.map(i => ({id: i.id, status: i.status})));

        // Filtrar ítems que no están CANCELLED. CANCELLATION_REQUESTED se trata como activo hasta que se confirma.
        const activeItems = allItemsOfThisOrder.filter(item =>
            item.status !== OrderItemStatus.CANCELLED
        );

        let determinedNewOrderStatus: OrderStatus = currentOrderStatusInDb;

        if (allItemsOfThisOrder.length === 0) {
            console.log(`[KDS SVC - OrderStatusLogic] No items found for order ${orderId}. Status remains ${determinedNewOrderStatus}`);
        } else if (activeItems.length === 0) {
            // Todos los ítems originales fueron CANCELLED
            determinedNewOrderStatus = OrderStatus.CANCELLED;
            console.log(`[KDS SVC - OrderStatusLogic] All items are CANCELLED. New OrderStatus -> ${determinedNewOrderStatus}`);
        } else {
            const allServed = activeItems.every(item => item.status === OrderItemStatus.SERVED);
            const allReadyOrServed = activeItems.every(item => item.status === OrderItemStatus.READY || item.status === OrderItemStatus.SERVED);
            const anyReady = activeItems.some(item => item.status === OrderItemStatus.READY);
            const anyPreparing = activeItems.some(item => item.status === OrderItemStatus.PREPARING);
            // const allPendingKds = activeItems.every(item => item.status === OrderItemStatus.PENDING_KDS);

            if (allServed) {
                // Si todos los ítems activos están servidos, el pedido se considera completado.
                // La transición a PAID se manejaría en otro flujo (POS o similar).
                determinedNewOrderStatus = OrderStatus.COMPLETED;
                console.log(`[KDS SVC - OrderStatusLogic] All active items SERVED. New OrderStatus -> ${determinedNewOrderStatus}`);
            } else if (allReadyOrServed) {
                // Si todos los ítems activos están listos (READY) o ya servidos (pero no todos servidos)
                determinedNewOrderStatus = OrderStatus.ALL_ITEMS_READY;
                console.log(`[KDS SVC - OrderStatusLogic] All active items READY or SERVED. New OrderStatus -> ${determinedNewOrderStatus}`);
            } else if (anyReady) {
                // Si algunos ítems están listos (READY), pero no todos (y no todos servidos)
                // Y el pedido estaba en progreso o recién recibido.
                if (currentOrderStatusInDb === OrderStatus.IN_PROGRESS || currentOrderStatusInDb === OrderStatus.RECEIVED || currentOrderStatusInDb === OrderStatus.PARTIALLY_READY) {
                    determinedNewOrderStatus = OrderStatus.PARTIALLY_READY;
                    console.log(`[KDS SVC - OrderStatusLogic] Some items READY. Order status was ${currentOrderStatusInDb}. New OrderStatus -> ${determinedNewOrderStatus}`);
                } else {
                    console.log(`[KDS SVC - OrderStatusLogic] Some items READY, but current order status ${currentOrderStatusInDb} prevents auto-move to PARTIALLY_READY. Status remains ${determinedNewOrderStatus}`);
                }
            } else if (anyPreparing) {
                 // Si algún ítem se está preparando
                if (currentOrderStatusInDb === OrderStatus.RECEIVED || currentOrderStatusInDb === OrderStatus.IN_PROGRESS || currentOrderStatusInDb === OrderStatus.PARTIALLY_READY ) {
                    determinedNewOrderStatus = OrderStatus.IN_PROGRESS;
                    console.log(`[KDS SVC - OrderStatusLogic] Some items PREPARING. Order status was ${currentOrderStatusInDb}. New OrderStatus -> ${determinedNewOrderStatus}`);
                } else {
                    console.log(`[KDS SVC - OrderStatusLogic] Some items PREPARING, but current order status ${currentOrderStatusInDb} prevents auto-move to IN_PROGRESS. Status remains ${determinedNewOrderStatus}`);
                }
            }
            // No es necesario un 'else if (allPendingKds)' porque si el pedido está RECEIVED y todos los ítems están PENDING_KDS, el estado no debería cambiar.
            // Si estaba IN_PROGRESS y todos vuelven a PENDING_KDS (raro), podría volver a RECEIVED o quedarse IN_PROGRESS según la política.
            // Por ahora, si no se cumplen las condiciones anteriores, se mantiene el 'determinedNewOrderStatus'
            else {
                console.log(`[KDS SVC - OrderStatusLogic] No specific aggregate condition met for active items to change OrderStatus from ${currentOrderStatusInDb}.`);
                 // Si el estado actual es RECEIVED y hay algún item que no sea PENDING_KDS (ej. PREPARING, READY), debería pasar a IN_PROGRESS o PARTIALLY_READY
                if (currentOrderStatusInDb === OrderStatus.RECEIVED && activeItems.some(it => it.status !== OrderItemStatus.PENDING_KDS) ) {
                    if (activeItems.some(it => it.status === OrderItemStatus.READY)) {
                        determinedNewOrderStatus = OrderStatus.PARTIALLY_READY;
                         console.log(`[KDS SVC - OrderStatusLogic] Order was RECEIVED, now has READY items. New OrderStatus -> ${determinedNewOrderStatus}`);
                    } else if (activeItems.some(it => it.status === OrderItemStatus.PREPARING)) {
                        determinedNewOrderStatus = OrderStatus.IN_PROGRESS;
                        console.log(`[KDS SVC - OrderStatusLogic] Order was RECEIVED, now has PREPARING items. New OrderStatus -> ${determinedNewOrderStatus}`);
                    }
                }
            }
        }

        if (currentOrderStatusInDb !== determinedNewOrderStatus) {
            // Asegurar que el determinedNewOrderStatus es uno de los valores válidos del enum OrderStatus
            if (Object.values(OrderStatus).includes(determinedNewOrderStatus)) {
                 await tx.order.update({
                    where: { id: orderId },
                    data: { status: determinedNewOrderStatus }
                });
                console.log(`[KDS SVC - DB UPDATE] Order ${orderId} status was ${currentOrderStatusInDb}, NOW UPDATED to ${determinedNewOrderStatus}.`);
            } else {
                 // Esto no debería ocurrir si la lógica es correcta y solo asigna valores del enum
                 console.error(`[KDS SVC - INVALID STATUS] Attempted to set invalid OrderStatus '${determinedNewOrderStatus}'. Order status REMAINS ${currentOrderStatusInDb}.`);
            }
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