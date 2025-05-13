// backend/src/public/order.service.ts
// Version: 1.0.3 (Corrected type assignment for optional relations in Order creation)

import { PrismaClient, Prisma, Order, OrderItem, OrderItemModifierOption, OrderStatus } from '@prisma/client';

const prisma = new PrismaClient();

// Definición local de ModifierUiType
const ModifierUiTypeEnum = {
    RADIO: 'RADIO',
    CHECKBOX: 'CHECKBOX',
} as const;
type LocalModifierUiType = typeof ModifierUiTypeEnum[keyof typeof ModifierUiTypeEnum];

// DTOs
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
    tableIdentifier?: string | null; // Este sería el ID de un registro Table
    customerId?: string | null;
    orderNotes?: string | null;
    items: OrderItemDto[];
}


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
                        modifierOptionId: optionFull.id
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

            const finalPricePerItem = itemBasePrice.add(currentItemTotalModifierPrice);
            const subtotalForItem = finalPricePerItem.mul(itemDto.quantity);
            calculatedTotalAmount = calculatedTotalAmount.add(subtotalForItem);

            orderItemsToCreate.push({
                menuItem: { connect: { id: menuItem.id } },
                quantity: itemDto.quantity,
                unitPrice: finalPricePerItem,
                totalItemPrice: subtotalForItem,
                notes: itemDto.notes,
                kdsDestination: menuItem.kdsDestination,
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

        // --- CORRECCIÓN EN LA CONSTRUCCIÓN DEL OBJETO 'data' PARA 'tx.order.create' ---
        const orderCreateData: Prisma.OrderCreateInput = {
            business: { connect: { id: business.id } },
            notes: payload.orderNotes,
            totalAmount: calculatedTotalAmount,
            finalAmount: calculatedTotalAmount, // Asumimos que no hay descuentos iniciales
            status: OrderStatus.RECEIVED,
            orderNumber: orderNumber,
            items: { // 'items' es el nombre de la relación en tu schema Order
                create: orderItemsToCreate
            }
        };

        if (payload.tableIdentifier) {
            orderCreateData.table = { connect: { id: payload.tableIdentifier } };
        }

        if (payload.customerId) {
            orderCreateData.customerLCo = { connect: { id: payload.customerId } };
        }
        // --- FIN CORRECCIÓN ---

        const newOrder = await tx.order.create({
            data: orderCreateData, // Usar el objeto construido
        });
        console.log(`[PublicOrder SVC] Order ${newOrder.id} created successfully. Total: ${newOrder.totalAmount}`);
        return newOrder;
    });
};