// backend/src/camarero/kds.service.ts
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
    // Campos opcionales para tiempos
    preparationTime?: number | null; // Del MenuItem (snapshot o directo)
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
                    // Podríamos filtrar por OrderStatus también si es necesario (ej. solo pedidos 'RECEIVED' o 'IN_PROGRESS')
                },
                kdsDestination: kdsDestination,
                status: {
                    in: statusFilter,
                },
            },
            include: {
                menuItem: { // Para obtener nombre y tiempo de preparación
                    select: {
                        name_es: true,
                        name_en: true,
                        preparationTime: true,
                    }
                },
                selectedModifiers: { // Para obtener los nombres de los modificadores seleccionados
                    include: {
                        modifierOption: {
                            select: {
                                name_es: true,
                                name_en: true,
                            }
                        }
                    }
                },
                order: { // Para obtener info del pedido
                    select: {
                        id: true,
                        orderNumber: true,
                        createdAt: true,
                        table: { // Para obtener el identificador de la mesa
                            select: {
                                identifier: true,
                            }
                        }
                    }
                }
            },
            orderBy: {
                order: {
                    createdAt: 'asc', // Pedidos más antiguos primero
                }
            }
        });

        // Mapear al formato KdsOrderItemData
        const kdsItems: KdsOrderItemData[] = orderItems.map(item => ({
            id: item.id,
            quantity: item.quantity,
            status: item.status,
            notes: item.notes,
            kdsDestination: item.kdsDestination,
            menuItemName_es: item.menuItem?.name_es || item.itemNameSnapshot, // Fallback a snapshot
            menuItemName_en: item.menuItem?.name_en || null, // Fallback a snapshot si itemNameSnapshot fuera bilingüe
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
 * @param newStatus - El nuevo OrderItemStatus.
 * @param businessId - ID del negocio (para verificación de pertenencia).
 * @returns El OrderItem actualizado.
 */
export const updateOrderItemStatus = async (
    orderItemId: string,
    newStatus: OrderItemStatus,
    businessId: string
): Promise<OrderItem> => {
    console.log(`[KDS SVC] Updating status for OrderItem ${orderItemId} to ${newStatus} for business ${businessId}`);

    // Validaciones de transición de estado (simplificado por ahora, expandir según sea necesario)
    const allowedTransitions: Partial<Record<OrderItemStatus, OrderItemStatus[]>> = {
        [OrderItemStatus.PENDING_KDS]: [OrderItemStatus.PREPARING, OrderItemStatus.CANCELLED, OrderItemStatus.CANCELLATION_REQUESTED],
        [OrderItemStatus.PREPARING]: [OrderItemStatus.READY, OrderItemStatus.CANCELLED, OrderItemStatus.CANCELLATION_REQUESTED], // Podría volver a PENDING_KDS?
        [OrderItemStatus.READY]: [OrderItemStatus.SERVED, OrderItemStatus.PREPARING], // PREPARING si se devuelve a cocina
        [OrderItemStatus.CANCELLATION_REQUESTED]: [OrderItemStatus.CANCELLED, OrderItemStatus.PREPARING, OrderItemStatus.PENDING_KDS], // Puede aceptarse o rechazarse
        // SERVED y CANCELLED son estados finales para este flujo KDS
    };

    return prisma.$transaction(async (tx) => {
        const orderItem = await tx.orderItem.findFirst({
            where: {
                id: orderItemId,
                order: { businessId: businessId }
            },
            include: { order: { select: { id: true } } } // Incluir ID del pedido
        });

        if (!orderItem) {
            throw new Error(`Ítem de pedido con ID ${orderItemId} no encontrado o no pertenece a este negocio.`);
        }
        if (!orderItem.order?.id) { // Chequeo de seguridad
             throw new Error(`Error interno: El ítem de pedido ${orderItemId} no está asociado a un pedido.`);
        }

        const currentStatus = orderItem.status;
        if (currentStatus === newStatus) {
            console.log(`[KDS SVC] OrderItem ${orderItemId} ya está en estado ${newStatus}. No se requiere actualización.`);
            return orderItem;
        }

        if (allowedTransitions[currentStatus] && !allowedTransitions[currentStatus]?.includes(newStatus)) {
            throw new Error(`Transición de estado no permitida de '${currentStatus}' a '${newStatus}'.`);
        }
        
        const dataToUpdate: Prisma.OrderItemUpdateInput = { status: newStatus };
        if (newStatus === OrderItemStatus.PREPARING && !orderItem.preparedAt) {
            dataToUpdate.preparedAt = new Date();
        } else if (newStatus === OrderItemStatus.SERVED && !orderItem.servedAt) {
             dataToUpdate.servedAt = new Date();
        }
        // Considerar si al pasar a READY también se debe actualizar preparedAt si aún no está seteado.

        const updatedOrderItem = await tx.orderItem.update({
            where: { id: orderItemId },
            data: dataToUpdate,
        });
        console.log(`[KDS SVC] OrderItem ${updatedOrderItem.id} status updated to ${updatedOrderItem.status}.`);

        // Ahora, actualiza el estado del Order general
        const orderId = orderItem.order.id;
        const allItemsOfOrder = await tx.orderItem.findMany({
            where: { orderId: orderId },
            select: { status: true }
        });

        let newOrderStatus: OrderStatus | null = null;

        if (allItemsOfOrder.every(item => item.status === OrderItemStatus.SERVED)) {
            newOrderStatus = OrderStatus.COMPLETED; // O quizás PAID si el pago es después del servicio total
        } else if (allItemsOfOrder.every(item => item.status === OrderItemStatus.READY || item.status === OrderItemStatus.SERVED || item.status === OrderItemStatus.CANCELLED )) {
            // Si todos están listos, servidos o cancelados (pero no todos servidos aún)
            if (allItemsOfOrder.some(item => item.status === OrderItemStatus.READY)) {
                 newOrderStatus = OrderStatus.ALL_ITEMS_READY;
            } else if (allItemsOfOrder.every(item => item.status === OrderItemStatus.CANCELLED)) {
                newOrderStatus = OrderStatus.CANCELLED;
            }
            // Podría haber otros casos aquí
        } else if (allItemsOfOrder.some(item => item.status === OrderItemStatus.READY) && allItemsOfOrder.some(item => item.status === OrderItemStatus.PENDING_KDS || item.status === OrderItemStatus.PREPARING)) {
            newOrderStatus = OrderStatus.PARTIALLY_READY;
        } else if (allItemsOfOrder.some(item => item.status === OrderItemStatus.PREPARING || item.status === OrderItemStatus.PENDING_KDS || item.status === OrderItemStatus.READY)) {
            newOrderStatus = OrderStatus.IN_PROGRESS;
        }
        // Si todos los ítems son CANCELLED, el pedido es CANCELLED
        else if (allItemsOfOrder.every(item => item.status === OrderItemStatus.CANCELLED)) {
            newOrderStatus = OrderStatus.CANCELLED;
        }


        if (newOrderStatus) {
            const currentOrder = await tx.order.findUnique({ where: {id: orderId}, select: {status: true}});
            if(currentOrder && currentOrder.status !== newOrderStatus) {
                await tx.order.update({
                    where: { id: orderId },
                    data: { status: newOrderStatus }
                });
                console.log(`[KDS SVC] Order ${orderId} status updated to ${newOrderStatus}.`);
            }
        }
        return updatedOrderItem;
    });
};