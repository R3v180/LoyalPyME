// backend/src/public/order-item-processor.service.ts
import {
    PrismaClient,
    Prisma,
    MenuItem,
    ModifierGroup,
    OrderItemStatus, // Necesario para el estado inicial del OrderItem
} from '@prisma/client';
import {
    BadRequestException,
    InternalServerErrorException,
    Logger,
    NotFoundException,
} from '@nestjs/common';

// Tipos importados de los DTOs internos (o definidos aquí si es preferible)
interface SelectedModifierOptionInternalDto {
    modifierOptionId: string;
}

interface OrderItemInternalDto {
    menuItemId: string;
    quantity: number;
    notes?: string | null;
    selectedModifierOptions?: SelectedModifierOptionInternalDto[] | null;
}

// Tipos para la estructura de datos que este servicio devolverá
// Esto es lo que se necesita para crear un OrderItem en la BD
export interface ProcessedOrderItemData {
    menuItemId: string;
    quantity: number;
    priceAtPurchase: Prisma.Decimal;
    totalItemPrice: Prisma.Decimal;
    notes?: string | null;
    kdsDestination: string | null;
    itemNameSnapshot: string; // Asumiendo que el snapshot se toma aquí
    itemDescriptionSnapshot: string | null; // Asumiendo que el snapshot se toma aquí
    status: OrderItemStatus; // Estado inicial
    // Datos para crear los OrderItemModifierOption asociados
    modifierOptionsToCreate: Prisma.OrderItemModifierOptionCreateManyOrderItemInput[];
}

// Tipos internos para el manejo de modificadores (similares a los que tenías)
interface SelectedModifierOptionShape {
    id: string;
    name_es: string | null;
    priceAdjustment: Prisma.Decimal;
    isAvailable: boolean;
    groupId: string; // Clave para la lógica de validación de grupos
}

type ModifierGroupWithSelectedOptions = ModifierGroup & {
    options: SelectedModifierOptionShape[];
};

// Prisma.validator para obtener MenuItem con sus modificadores y opciones activas
const menuItemWithFullModifiersArgs = Prisma.validator<Prisma.MenuItemDefaultArgs>()({
    include: {
        modifierGroups: {
            orderBy: { position: 'asc' }, // Importante para la lógica de validación si el orden importa
            include: {
                options: {
                    where: { isAvailable: true }, // Solo opciones disponibles
                    orderBy: { position: 'asc' },
                    select: { // Seleccionar solo lo necesario
                        id: true,
                        name_es: true, // Para snapshots
                        // name_en: true, // Si tuvieras i18n para snapshots
                        priceAdjustment: true,
                        isAvailable: true, // Aunque ya filtramos, es bueno tenerlo
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
     * Procesa una lista de ítems de un DTO, valida su contenido (incluyendo modificadores)
     * y calcula los precios.
     *
     * @param tx - Cliente Prisma de la transacción actual.
     * @param businessId - ID del negocio al que deben pertenecer los ítems.
     * @param itemsDto - Array de ítems tal como vienen en el payload de la orden.
     * @returns Un array de ProcessedOrderItemData, listos para ser usados en la creación de OrderItems.
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
                itemNameSnapshot: menuItem.name_es || 'Ítem sin nombre ES', // Tomar snapshot del nombre
                itemDescriptionSnapshot: menuItem.description_es, // Tomar snapshot de la descripción
                status: OrderItemStatus.PENDING_KDS, // Estado inicial por defecto
                modifierOptionsToCreate: modifierOptionsToCreateForDb,
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
            throw new BadRequestException(`Ítem de menú con ID '${menuItemId}' no pertenece a este negocio.`);
        }
        if (!menuItem.isAvailable) {
            this.logger.warn(`[OrderItemProcessor] MenuItem ID '${menuItem.name_es}' is not available.`);
            throw new BadRequestException(`El ítem '${menuItem.name_es || menuItemId}' no está disponible actualmente.`);
        }
        return menuItem;
    }

    /**
     * Procesa los modificadores seleccionados para un ítem de menú,
     * calcula el ajuste total de precio y valida las selecciones.
     */
    private processModifiersForItem(
        menuItem: MenuItemWithFullModifiers,
        selectedOptionsDto: SelectedModifierOptionInternalDto[]
    ): {
        itemPriceWithModifiers: Prisma.Decimal; // Es el total de los priceAdjustments
        modifierOptionsToCreateForDb: Prisma.OrderItemModifierOptionCreateManyOrderItemInput[];
    } {
        let totalModifierPriceAdjustment = new Prisma.Decimal(0);
        const modifierOptionsToCreateForDb: Prisma.OrderItemModifierOptionCreateManyOrderItemInput[] = [];
        const typedModifierGroups = menuItem.modifierGroups as ModifierGroupWithSelectedOptions[];

        // Mapear las opciones seleccionadas por el cliente a sus datos completos de la BD
        // y agruparlas por su modifierGroupId para fácil validación.
        const selectedOptionsDataByGroup: Record<string, SelectedModifierOptionShape[]> = {};

        for (const selectedOptDto of selectedOptionsDto) {
            let foundOption: SelectedModifierOptionShape | undefined;
            let foundInGroup: ModifierGroupWithSelectedOptions | undefined;

            for (const group of typedModifierGroups) {
                const option = group.options.find(opt => opt.id === selectedOptDto.modifierOptionId);
                if (option) {
                    foundOption = option;
                    foundInGroup = group;
                    break;
                }
            }

            if (!foundOption || !foundInGroup) {
                this.logger.warn(`[OrderItemProcessor] Invalid or unavailable modifierOptionId '${selectedOptDto.modifierOptionId}' for MenuItem '${menuItem.id}'.`);
                throw new BadRequestException(`Opción de modificador con ID '${selectedOptDto.modifierOptionId}' no es válida o no está disponible para el ítem '${menuItem.name_es}'.`);
            }
            
            if (!foundOption.groupId) { // Esto no debería pasar si el schema es correcto
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
                optionNameSnapshot: foundOption.name_es || 'Opción sin nombre ES', // Snapshot
                optionPriceAdjustmentSnapshot: foundOption.priceAdjustment,
            });
        }

        // Validar cada grupo de modificadores del MenuItem contra las selecciones hechas
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
            // Adicionalmente, si es RADIO, solo debe haber una selección
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