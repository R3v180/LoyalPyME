// backend/src/modules/camarero/public/order-item-processor.service.ts
import {
    Prisma,
    MenuItem,
    ModifierGroup,
    OrderItemStatus,
} from '@prisma/client';
import {
    BadRequestException,
    InternalServerErrorException,
    Logger,
    NotFoundException,
} from '@nestjs/common';

// Importamos los tipos desde el archivo central
import { ProcessedOrderItemData, OrderItemInternalDto, SelectedModifierOptionInternalDto } from './order.types';

// Tipos internos para el manejo de modificadores
interface SelectedModifierOptionShape {
    id: string;
    name_es: string | null;
    priceAdjustment: Prisma.Decimal;
    isAvailable: boolean;
    groupId: string;
}

type ModifierGroupWithSelectedOptions = ModifierGroup & {
    options: SelectedModifierOptionShape[];
};

// Prisma.validator para obtener MenuItem con sus modificadores y opciones activas
const menuItemWithFullModifiersArgs = Prisma.validator<Prisma.MenuItemDefaultArgs>()({
    include: {
        modifierGroups: {
            orderBy: { position: 'asc' },
            include: {
                options: {
                    where: { isAvailable: true },
                    orderBy: { position: 'asc' },
                    select: {
                        id: true,
                        name_es: true,
                        priceAdjustment: true,
                        isAvailable: true,
                        groupId: true,
                    },
                },
            },
        },
    },
});
type MenuItemWithFullModifiers = Prisma.MenuItemGetPayload<typeof menuItemWithFullModifiersArgs>;


export class OrderItemProcessorService {
    private readonly logger = new Logger(OrderItemProcessorService.name);

    /**
     * Procesa una lista de ítems de un DTO, valida su contenido, calcula precios,
     * y maneja ítems canjeados como recompensa.
     *
     * @param tx - Cliente Prisma de la transacción actual.
     * @param businessId - ID del negocio.
     * @param itemsDto - Array de ítems del payload de la orden.
     * @returns Un array de ProcessedOrderItemData listos para crear OrderItems.
     */
    async processOrderItems(
        tx: Prisma.TransactionClient,
        businessId: string,
        itemsDto: OrderItemInternalDto[]
    ): Promise<ProcessedOrderItemData[]> {
        this.logger.log(`[OrderItemProcessor] Processing ${itemsDto.length} items for business ${businessId}`);
        const processedItems: ProcessedOrderItemData[] = [];

        for (const itemDto of itemsDto) {
            const menuItem = await this.fetchAndValidateMenuItem(tx, itemDto.menuItemId, businessId);

            // --- CORRECCIÓN PRINCIPAL ---
            // Si el ítem viene con un ID de recompensa, lo procesamos como un ítem gratuito.
            if (itemDto.redeemedRewardId) {
                this.logger.log(`[OrderItemProcessor] Item '${menuItem.name_es}' is a redeemed reward (ID: ${itemDto.redeemedRewardId}). Setting price to 0.`);
                
                processedItems.push({
                    menuItemId: menuItem.id,
                    quantity: 1, // Los ítems de recompensa son siempre de cantidad 1
                    priceAtPurchase: new Prisma.Decimal(0),
                    totalItemPrice: new Prisma.Decimal(0),
                    notes: itemDto.notes,
                    kdsDestination: menuItem.kdsDestination,
                    itemNameSnapshot: `[RECOMPENSA] ${menuItem.name_es || 'Ítem sin nombre'}`,
                    itemDescriptionSnapshot: menuItem.description_es,
                    status: OrderItemStatus.PENDING_KDS,
                    modifierOptionsToCreate: [], // Los ítems de recompensa no procesan modificadores
                    redeemedRewardId: itemDto.redeemedRewardId, // Pasamos el ID para guardarlo en la BD
                });

                // Saltamos al siguiente ítem del bucle, ya que este ya está procesado.
                continue;
            }
            // --- FIN DE LA CORRECCIÓN ---

            // Si no es un ítem de recompensa, se procesa normalmente.
            const {
                itemPriceWithModifiers,
                modifierOptionsToCreateForDb,
            } = this.processModifiersForItem(menuItem, itemDto.selectedModifierOptions || []);

            const priceAtPurchase = menuItem.price.add(itemPriceWithModifiers);
            const totalItemPrice = priceAtPurchase.mul(itemDto.quantity);

            processedItems.push({
                menuItemId: menuItem.id,
                quantity: itemDto.quantity,
                priceAtPurchase,
                totalItemPrice,
                notes: itemDto.notes,
                kdsDestination: menuItem.kdsDestination,
                itemNameSnapshot: menuItem.name_es || 'Ítem sin nombre',
                itemDescriptionSnapshot: menuItem.description_es,
                status: OrderItemStatus.PENDING_KDS,
                modifierOptionsToCreate: modifierOptionsToCreateForDb,
                redeemedRewardId: null // Aseguramos que sea null si no es recompensa
            });
        }
        this.logger.log(`[OrderItemProcessor] Finished processing ${processedItems.length} items.`);
        return processedItems;
    }

    /**
     * Obtiene y valida un MenuItem.
     */
    private async fetchAndValidateMenuItem(
        tx: Prisma.TransactionClient,
        menuItemId: string,
        businessId: string
    ): Promise<MenuItemWithFullModifiers> {
        const menuItem = await tx.menuItem.findUnique({
            where: { id: menuItemId },
            ...menuItemWithFullModifiersArgs,
        });

        if (!menuItem) {
            this.logger.warn(`[OrderItemProcessor] MenuItem ID '${menuItemId}' not found.`);
            throw new NotFoundException(`Ítem de menú con ID '${menuItemId}' no encontrado.`);
        }
        if (menuItem.businessId !== businessId) {
            this.logger.warn(`[OrderItemProcessor] MenuItem ID '${menuItemId}' does not belong to business '${businessId}'.`);
            throw new BadRequestException(`Ítem de menú con ID '${menuItem.name_es || menuItemId}' no pertenece a este negocio.`);
        }
        if (!menuItem.isAvailable) {
            this.logger.warn(`[OrderItemProcessor] MenuItem '${menuItem.name_es || menuItemId}' is not available.`);
            throw new BadRequestException(`El ítem '${menuItem.name_es || menuItemId}' no está disponible actualmente.`);
        }
        return menuItem;
    }

    /**
     * Procesa los modificadores seleccionados para un ítem de menú.
     */
    private processModifiersForItem(
        menuItem: MenuItemWithFullModifiers,
        selectedOptionsDto: SelectedModifierOptionInternalDto[]
    ): {
        itemPriceWithModifiers: Prisma.Decimal;
        modifierOptionsToCreateForDb: Prisma.OrderItemModifierOptionCreateManyOrderItemInput[];
    } {
        let totalModifierPriceAdjustment = new Prisma.Decimal(0);
        const modifierOptionsToCreateForDb: Prisma.OrderItemModifierOptionCreateManyOrderItemInput[] = [];
        const typedModifierGroups = menuItem.modifierGroups as ModifierGroupWithSelectedOptions[];

        const selectedOptionsDataByGroup: Record<string, SelectedModifierOptionShape[]> = {};

        for (const selectedOptDto of selectedOptionsDto) {
            let foundOption: SelectedModifierOptionShape | undefined;

            for (const group of typedModifierGroups) {
                const option = group.options.find(opt => opt.id === selectedOptDto.modifierOptionId);
                if (option) {
                    foundOption = option;
                    break;
                }
            }

            if (!foundOption) {
                this.logger.warn(`[OrderItemProcessor] Invalid or unavailable modifierOptionId '${selectedOptDto.modifierOptionId}' for MenuItem '${menuItem.id}'.`);
                throw new BadRequestException(`Opción de modificador con ID '${selectedOptDto.modifierOptionId}' no es válida o no está disponible para el ítem '${menuItem.name_es}'.`);
            }
            
            if (!foundOption.groupId) {
                 this.logger.error(`[OrderItemProcessor] Critical: ModifierOption '${foundOption.id}' has no groupId.`);
                 throw new InternalServerErrorException(`Error de configuración: Opción de modificador '${foundOption.id}' no tiene grupo.`);
            }

            if (!selectedOptionsDataByGroup[foundOption.groupId]) {
                selectedOptionsDataByGroup[foundOption.groupId] = [];
            }
            selectedOptionsDataByGroup[foundOption.groupId].push(foundOption);

            totalModifierPriceAdjustment = totalModifierPriceAdjustment.add(foundOption.priceAdjustment);
            modifierOptionsToCreateForDb.push({
                modifierOptionId: foundOption.id,
                optionNameSnapshot: foundOption.name_es || 'Opción sin nombre',
                optionPriceAdjustmentSnapshot: foundOption.priceAdjustment,
            });
        }

        for (const group of typedModifierGroups) {
            const selectionsInThisGroup = selectedOptionsDataByGroup[group.id] || [];
            const selectedCount = selectionsInThisGroup.length;

            if (group.isRequired && selectedCount < group.minSelections) {
                this.logger.warn(`[OrderItemProcessor] Validation fail for group '${group.name_es}': required min ${group.minSelections}, got ${selectedCount}.`);
                throw new BadRequestException(`Para el ítem '${menuItem.name_es}', el grupo de modificadores '${group.name_es}' requiere al menos ${group.minSelections} selección(es).`);
            }
            if (selectedCount > group.maxSelections) {
                this.logger.warn(`[OrderItemProcessor] Validation fail for group '${group.name_es}': allowed max ${group.maxSelections}, got ${selectedCount}.`);
                throw new BadRequestException(`Para el ítem '${menuItem.name_es}', el grupo de modificadores '${group.name_es}' permite como máximo ${group.maxSelections} selección(es).`);
            }
            if (group.uiType === 'RADIO' && selectedCount > 1) {
                this.logger.warn(`[OrderItemProcessor] Validation fail for RADIO group '${group.name_es}': got ${selectedCount} selections.`);
                throw new BadRequestException(`El grupo de modificadores '${group.name_es}' (tipo RADIO) solo permite una selección.`);
            }
        }

        return {
            itemPriceWithModifiers: totalModifierPriceAdjustment,
            modifierOptionsToCreateForDb,
        };
    }
}