// backend/src/public/order.service.ts
// Version: 1.1.0 (Add getOrderStatusById function and related types)

import { 
    PrismaClient, 
    Prisma, 
    Order, 
    OrderItem, // No se usa directamente, pero es parte del modelo
    OrderItemModifierOption, // No se usa directamente
    OrderStatus, 
    OrderItemStatus // Necesario para los tipos de respuesta
} from '@prisma/client';

const prisma = new PrismaClient();

// Definición local de ModifierUiType (o importar desde @prisma/client si está disponible y se usa)
enum ModifierUiTypeEnum {
    RADIO = 'RADIO',
    CHECKBOX = 'CHECKBOX',
}
// type LocalModifierUiType = typeof ModifierUiTypeEnum[keyof typeof ModifierUiTypeEnum]; // No usado directamente en este archivo

// --- DTOs para la creación de Pedidos (Existentes) ---
interface SelectedModifierOptionDto {
    modifierOptionId: string;
}

interface OrderItemDto {
    menuItemId: string;
    quantity: number;
    notes?: string | null;
    selectedModifierOptions?: SelectedModifierOptionDto[] | null;
}

export interface CreateOrderPayloadDto {
    tableIdentifier?: string | null; 
    customerId?: string | null;
    orderNotes?: string | null;
    items: OrderItemDto[];
}
// --- Fin DTOs para creación ---


// --- ESTRUCTURAS DE DATOS PARA LA RESPUESTA DEL ESTADO DEL PEDIDO (NUEVO) ---
export interface PublicOrderItemStatusInfo {
    id: string; // OrderItem ID
    menuItemName_es: string | null;
    menuItemName_en: string | null; // Si tuvieras itemNameSnapshot_en, lo usarías.
    quantity: number;
    status: OrderItemStatus; // El estado específico del ítem
}

export interface PublicOrderStatusInfo {
    orderId: string;
    orderNumber: string;
    orderStatus: OrderStatus; // El estado general del pedido
    items: PublicOrderItemStatusInfo[];
    tableIdentifier?: string | null; // Opcional: identificador de la mesa
    orderNotes?: string | null;      // Opcional: notas generales del pedido
    createdAt: Date;                // Fecha de creación del pedido
}
// --- FIN ESTRUCTURAS DE DATOS PARA ESTADO ---


/**
 * Crea un nuevo pedido público para un negocio.
 * (Función existente, sin cambios lógicos internos respecto a la V1.0.4 que te pasé,
 *  pero la incluyo completa para que el archivo esté autocontenido)
 */
export const createPublicOrder = async (
    businessSlug: string,
    payload: CreateOrderPayloadDto
): Promise<Order> => {
    console.log(`[PublicOrder SVC] Attempting to create order for business slug: ${businessSlug}`);

    const business = await prisma.business.findUnique({
        where: { slug: businessSlug },
        select: { id: true, isActive: true, isCamareroActive: true }
    });

    if (!business) {
        throw new Error(`Negocio con slug '${businessSlug}' no encontrado.`);
    }
    if (!business.isActive) {
        throw new Error(`El negocio '${businessSlug}' no está activo actualmente.`);
    }
    if (!business.isCamareroActive) {
        throw new Error(`El módulo de pedidos no está activo para el negocio '${businessSlug}'.`);
    }

    return prisma.$transaction(async (tx) => {
        let calculatedTotalAmount = new Prisma.Decimal(0);
        const orderItemsToCreate: Prisma.OrderItemCreateWithoutOrderInput[] = [];

        for (const itemDto of payload.items) {
            const menuItem = await tx.menuItem.findUnique({
                where: { id: itemDto.menuItemId },
                include: {
                    modifierGroups: {
                        include: {
                            options: {
                                where: { isAvailable: true }
                            }
                        }
                    }
                }
            });

            if (!menuItem || menuItem.businessId !== business.id || !menuItem.isAvailable) {
                throw new Error(`Ítem de menú con ID '${itemDto.menuItemId}' no es válido, no está disponible o no pertenece a este negocio.`);
            }

            let itemBasePrice = menuItem.price;
            let currentItemTotalModifierPrice = new Prisma.Decimal(0);
            const orderItemModifierOptionsData: Prisma.OrderItemModifierOptionCreateManyOrderItemInput[] = [];

            if (itemDto.selectedModifierOptions && itemDto.selectedModifierOptions.length > 0) {
                const selectedOptionsByGroup: Record<string, string[]> = {};
                for (const selectedOpt of itemDto.selectedModifierOptions) {
                    const optionFull = menuItem.modifierGroups
                        .flatMap(g => g.options)
                        .find(opt => opt.id === selectedOpt.modifierOptionId);

                    if (!optionFull) {
                        throw new Error(`Opción de modificador con ID '${selectedOpt.modifierOptionId}' no encontrada o no válida para el ítem '${menuItem.name_es}'.`);
                    }
                    if (!optionFull.isAvailable) {
                        throw new Error(`Opción de modificador '${optionFull.name_es}' no está disponible.`);
                    }
                    
                    const parentGroup = menuItem.modifierGroups.find(g => g.id === optionFull.groupId);
                    if (!parentGroup) {
                         throw new Error(`Error interno: Grupo padre no encontrado para la opción ${optionFull.id}.`);
                    }

                    if (!selectedOptionsByGroup[parentGroup.id]) {
                        selectedOptionsByGroup[parentGroup.id] = [];
                    }
                    selectedOptionsByGroup[parentGroup.id].push(optionFull.id);
                    
                    currentItemTotalModifierPrice = currentItemTotalModifierPrice.add(optionFull.priceAdjustment);
                    
                    orderItemModifierOptionsData.push({
                        modifierOptionId: optionFull.id,
                        optionNameSnapshot: optionFull.name_es, 
                        optionPriceAdjustmentSnapshot: optionFull.priceAdjustment,
                    });
                }

                for (const group of menuItem.modifierGroups) {
                    const selectedCountInGroup = selectedOptionsByGroup[group.id]?.length || 0;
                    if (group.isRequired && selectedCountInGroup < group.minSelections) {
                        throw new Error(`Para el grupo '${group.name_es}', se requiere al menos ${group.minSelections} selección(es).`);
                    }
                    if (selectedCountInGroup < group.minSelections && group.minSelections > 0) { 
                        throw new Error(`Para el grupo '${group.name_es}', se deben seleccionar al menos ${group.minSelections} opción(es). Seleccionadas: ${selectedCountInGroup}.`);
                    }
                    if (selectedCountInGroup > group.maxSelections) {
                        throw new Error(`Para el grupo '${group.name_es}', se pueden seleccionar como máximo ${group.maxSelections} opción(es). Seleccionadas: ${selectedCountInGroup}.`);
                    }
                    if (group.uiType === ModifierUiTypeEnum.RADIO && selectedCountInGroup > 1) {
                         throw new Error(`El grupo '${group.name_es}' es de selección única, pero se enviaron ${selectedCountInGroup} opciones.`);
                    }
                }
            }
            for (const group of menuItem.modifierGroups) {
                if (group.isRequired && group.minSelections > 0) {
                    const hasSelectionInGroup = itemDto.selectedModifierOptions?.some(smo => 
                        group.options.find(opt => opt.id === smo.modifierOptionId && opt.groupId === group.id)
                    );
                    if (!hasSelectionInGroup) {
                        throw new Error(`El grupo '${group.name_es || 'Modificador'}' es obligatorio y requiere al menos ${group.minSelections} selección(es).`);
                    }
                }
            }

            const priceAtPurchaseValue = itemBasePrice.add(currentItemTotalModifierPrice);
            const totalItemPriceValue = priceAtPurchaseValue.mul(itemDto.quantity); // Este es el total del ítem
            calculatedTotalAmount = calculatedTotalAmount.add(totalItemPriceValue);

            orderItemsToCreate.push({
                menuItem: { connect: { id: menuItem.id } },
                quantity: itemDto.quantity,
                priceAtPurchase: priceAtPurchaseValue,
                totalItemPrice: totalItemPriceValue, // Asumiendo que el schema lo permite y es requerido
                notes: itemDto.notes,
                kdsDestination: menuItem.kdsDestination,
                itemNameSnapshot: menuItem.name_es, 
                itemDescriptionSnapshot: menuItem.description_es, 
                ...(orderItemModifierOptionsData.length > 0 && {
                    selectedModifiers: {
                        createMany: {
                            data: orderItemModifierOptionsData
                        }
                    }
                })
            });
        }

        const orderCount = await tx.order.count({ where: { businessId: business.id } });
        const orderNumber = `P-${String(orderCount + 1).padStart(6, '0')}`;

        const orderCreateData: Prisma.OrderCreateInput = {
            business: { connect: { id: business.id } },
            notes: payload.orderNotes,
            totalAmount: calculatedTotalAmount, 
            finalAmount: calculatedTotalAmount, 
            status: OrderStatus.RECEIVED,
            orderNumber: orderNumber,
            items: { create: orderItemsToCreate }
        };

        if (payload.tableIdentifier) {
            const tableRecord = await tx.table.findUnique({
                where: { businessId_identifier: { businessId: business.id, identifier: payload.tableIdentifier } },
                select: { id: true }
            });
            if (tableRecord) {
                orderCreateData.table = { connect: { id: tableRecord.id } };
            } else {
                console.warn(`[PublicOrder SVC] Table with identifier '${payload.tableIdentifier}' not found for business ${business.id}. Order will be created without table linkage.`);
            }
        }

        if (payload.customerId) {
            orderCreateData.customerLCo = { connect: { id: payload.customerId } };
        }

        const newOrder = await tx.order.create({ data: orderCreateData, });
        console.log(`[PublicOrder SVC] Order ${newOrder.id} (Number: ${newOrder.orderNumber}) created successfully. Total: ${newOrder.totalAmount}`);
        return newOrder;
    });
};


// --- NUEVA FUNCIÓN PARA OBTENER ESTADO DEL PEDIDO ---
/**
 * Obtiene el estado de un pedido específico por su ID, incluyendo el estado de sus ítems.
 * Este endpoint es PÚBLICO.
 * @param orderId - El ID del pedido (UUID).
 * @returns PublicOrderStatusInfo o null si el pedido no se encuentra.
 */
export const getOrderStatusById = async (orderId: string): Promise<PublicOrderStatusInfo | null> => {
    console.log(`[PublicOrder SVC] Fetching status for order ID: ${orderId}`);
    try {
        const order = await prisma.order.findUnique({
            where: { id: orderId },
            select: {
                id: true,
                orderNumber: true,
                status: true,         // OrderStatus general
                notes: true,          // Notas generales del pedido
                createdAt: true,      // Fecha de creación del pedido
                table: {              // Para obtener el identificador de la mesa
                    select: { identifier: true }
                },
                items: {              // Ítems del pedido
                    select: {
                        id: true,                         // ID del OrderItem
                        itemNameSnapshot: true,           // Nombre del ítem en el momento del pedido
                        // Si también guardas name_en en snapshot, inclúyelo aquí
                        quantity: true,
                        status: true,                     // OrderItemStatus (PENDING_KDS, PREPARING, etc.)
                        // Opcional: si quieres el nombre actual del MenuItem de la carta
                        // menuItem: { select: { name_es: true, name_en: true } } 
                    },
                    orderBy: { 
                        createdAt: 'asc' // O por alguna otra lógica si tienes 'positionInOrder'
                    } 
                }
            }
        });

        if (!order) {
            console.log(`[PublicOrder SVC] Order with ID ${orderId} not found.`);
            return null;
        }

        // Mapear los ítems al formato deseado para la respuesta
        const itemsInfo: PublicOrderItemStatusInfo[] = order.items.map(item => ({
            id: item.id,
            menuItemName_es: item.itemNameSnapshot, 
            menuItemName_en: null, // Asumiendo que itemNameSnapshot solo guarda un idioma.
                                   // Si tuvieras itemNameSnapshot_en, lo usarías aquí.
                                   // O si usaras item.menuItem.name_en (si lo incluyes arriba).
            quantity: item.quantity,
            status: item.status,
        }));

        const orderStatusInfo: PublicOrderStatusInfo = {
            orderId: order.id,
            orderNumber: order.orderNumber,
            orderStatus: order.status,
            items: itemsInfo,
            tableIdentifier: order.table?.identifier || null,
            orderNotes: order.notes,
            createdAt: order.createdAt,
        };
        
        console.log(`[PublicOrder SVC] Status for order ${orderId} (Number: ${order.orderNumber}): ${order.status}, Items: ${itemsInfo.length}`);
        return orderStatusInfo;

    } catch (error) {
        console.error(`[PublicOrder SVC] Error fetching status for order ID ${orderId}:`, error);
        throw new Error('Error al obtener el estado del pedido desde la base de datos.');
    }
};
// --- FIN NUEVA FUNCIÓN ---