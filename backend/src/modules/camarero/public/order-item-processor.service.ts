// backend/src/public/order-item-processor.service.ts
import {
    PrismaClient, // Aunque no lo use directamente, es común para servicios Prisma
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

// Tipos importados o definidos (asegúrate de que `SelectedModifierOptionInternalDto` esté definido si no se importa)
// Si estos DTOs se definen en un archivo central (ej. order.types.ts), impórtalos desde allí.
// Por ahora, los definiré aquí para que el archivo sea autocontenido.
interface SelectedModifierOptionInternalDto {
    modifierOptionId: string;
}

interface OrderItemInternalDto {
    menuItemId: string;
    quantity: number;
    notes?: string | null;
    selectedModifierOptions?: SelectedModifierOptionInternalDto[] | null;
}

// Tipo de retorno de este servicio para cada ítem procesado
export interface ProcessedOrderItemData {
    menuItemId: string;
    quantity: number;
    priceAtPurchase: Prisma.Decimal; // Precio unitario del ítem con modificadores
    totalItemPrice: Prisma.Decimal;  // priceAtPurchase * quantity
    notes?: string | null;
    kdsDestination: string | null;
    itemNameSnapshot: string;
    itemDescriptionSnapshot: string | null;
    status: OrderItemStatus;
    // Datos para crear los OrderItemModifierOption asociados
    modifierOptionsToCreate: Prisma.OrderItemModifierOptionCreateManyOrderItemInput[];
}

// Tipos internos para el manejo de modificadores, similares a los que tenías
interface SelectedModifierOptionShape {
    id: string;
    name_es: string | null;
    // name_en: string | null; // Si necesitas i18n para snapshots de modificadores
    priceAdjustment: Prisma.Decimal;
    isAvailable: boolean;
    groupId: string;
}

// Tipo para ModifierGroup cuando se incluye sus opciones (con los campos seleccionados)
type ModifierGroupWithSelectedOptions = ModifierGroup & {
    options: SelectedModifierOptionShape[];
};

// Prisma.validator para obtener MenuItem con sus modificadores y opciones activas
// Esta definición es crucial y debe ser consistente con tu schema.prisma
const menuItemWithFullModifiersArgs = Prisma.validator<Prisma.MenuItemDefaultArgs>()({
    include: {
        modifierGroups: {
            orderBy: { position: 'asc' },
            include: {
                options: {
                    where: { isAvailable: true }, // Solo opciones disponibles
                    orderBy: { position: 'asc' },
                    select: {
                        id: true,
                        name_es: true, // Para snapshots
                        // name_en: true, // Descomentar si tienes name_en y lo usas para snapshots
                        priceAdjustment: true,
                        isAvailable: true, // Aunque ya filtramos, es bueno tenerlo para confirmación
                        groupId: true, // Esencial para la lógica de grupo
                    },
                },
            },
        },
    },
});
type MenuItemWithFullModifiers = Prisma.MenuItemGetPayload<typeof menuItemWithFullModifiersArgs>;

export class OrderItemProcessorService {
    private readonly logger = new Logger(OrderItemProcessorService.name);
    // Este servicio no necesita su propia instancia de Prisma si siempre se le pasa 'tx'.
    // constructor(private prisma: PrismaClient) {} // Si se inyectara

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
        tx: Prisma.TransactionClient, // Siempre operamos dentro de una transacción
        businessId: string,
        itemsDto: OrderItemInternalDto[]
    ): Promise<ProcessedOrderItemData[]> {
        this.logger.log(`[OrderItemProcessor] Processing ${itemsDto.length} items for business ${businessId}`);
        const processedItems: ProcessedOrderItemData[] = [];

        for (const itemDto of itemsDto) {
            const menuItem = await this.fetchAndValidateMenuItem(tx, itemDto.menuItemId, businessId);

            const {
                accumulatedModifierPrice, // Cambiado el nombre para mayor claridad
                modifierOptionsToCreateForDb,
            } = this.processAndValidateModifiersForItem(menuItem, itemDto.selectedModifierOptions || []);

            // El precio base del ítem ya lo tenemos en menuItem.price
            // priceAtPurchase = precio base del ítem + suma de ajustes de los modificadores
            const priceAtPurchase = new Prisma.Decimal(menuItem.price).add(accumulatedModifierPrice);
            const totalItemPrice = priceAtPurchase.mul(itemDto.quantity);

            processedItems.push({
                menuItemId: menuItem.id,
                quantity: itemDto.quantity,
                priceAtPurchase,
                totalItemPrice,
                notes: itemDto.notes,
                kdsDestination: menuItem.kdsDestination,
                itemNameSnapshot: menuItem.name_es || 'Ítem (ES) no disponible', // Tomar snapshot
                itemDescriptionSnapshot: menuItem.description_es, // Tomar snapshot
                status: OrderItemStatus.PENDING_KDS, // Estado inicial por defecto
                modifierOptionsToCreate: modifierOptionsToCreateForDb,
            });
        }
        this.logger.log(`[OrderItemProcessor] Finished processing ${processedItems.length} items successfully.`);
        return processedItems;
    }

    /**
     * Obtiene y valida un MenuItem, asegurando que existe, pertenece al negocio y está disponible.
     * Incluye los grupos de modificadores y sus opciones disponibles.
     */
    private async fetchAndValidateMenuItem(
        tx: Prisma.TransactionClient,
        menuItemId: string,
        businessId: string
    ): Promise<MenuItemWithFullModifiers> {
        const menuItem = await tx.menuItem.findUnique({
            where: { id: menuItemId },
            ...menuItemWithFullModifiersArgs, // Usar el validador definido
        });

        if (!menuItem) {
            this.logger.warn(`[OrderItemProcessor] MenuItem ID '${menuItemId}' not found.`);
            throw new NotFoundException(`Ítem de menú con ID '${menuItemId}' no encontrado.`);
        }
        if (menuItem.businessId !== businessId) {
            this.logger.warn(`[OrderItemProcessor] MenuItem ID '${menuItemId}' (negocio: ${menuItem.businessId}) does not belong to specified business '${businessId}'.`);
            throw new BadRequestException(`Ítem de menú con ID '${menuItem.name_es || menuItemId}' no pertenece a este negocio.`);
        }
        if (!menuItem.isAvailable) {
            this.logger.warn(`[OrderItemProcessor] MenuItem '${menuItem.name_es || menuItemId}' is not available.`);
            throw new BadRequestException(`El ítem '${menuItem.name_es || menuItemId}' no está disponible actualmente.`);
        }
        return menuItem;
    }

    /**
     * Procesa los modificadores seleccionados para un ítem de menú,
     * calcula el ajuste total de precio y valida las selecciones contra las reglas del grupo.
     *
     * @param menuItem - El MenuItem completo con sus grupos de modificadores y opciones cargadas.
     * @param selectedOptionsDto - Array de IDs de las ModifierOption seleccionadas por el cliente para este ítem.
     * @returns Objeto con el ajuste total de precio de los modificadores y los datos para crear OrderItemModifierOption.
     */
    private processAndValidateModifiersForItem(
        menuItem: MenuItemWithFullModifiers,
        selectedOptionsDto: SelectedModifierOptionInternalDto[]
    ): {
        accumulatedModifierPrice: Prisma.Decimal; // Suma de todos los priceAdjustments de las opciones válidas
        modifierOptionsToCreateForDb: Prisma.OrderItemModifierOptionCreateManyOrderItemInput[];
    } {
        let accumulatedModifierPrice = new Prisma.Decimal(0);
        const modifierOptionsToCreateForDb: Prisma.OrderItemModifierOptionCreateManyOrderItemInput[] = [];

        // Casteo seguro, ya que menuItemWithFullModifiersArgs incluye esto
        const typedModifierGroups = menuItem.modifierGroups as ModifierGroupWithSelectedOptions[];

        // Un mapa para rastrear cuántas opciones se seleccionaron por grupo
        const selectionsByGroupId: Record<string, SelectedModifierOptionShape[]> = {};

        // Primero, iterar sobre las opciones seleccionadas por el cliente para validarlas y calcular precios
        for (const selectedOptDto of selectedOptionsDto) {
            let foundOption: SelectedModifierOptionShape | undefined;
            let parentGroupForOption: ModifierGroupWithSelectedOptions | undefined;

            // Buscar la opción seleccionada dentro de todos los grupos del ítem
            for (const group of typedModifierGroups) {
                // option es de tipo SelectedModifierOptionShape (definido arriba)
                const option = group.options.find(opt => opt.id === selectedOptDto.modifierOptionId);
                if (option) {
                    foundOption = option;
                    parentGroupForOption = group;
                    break;
                }
            }

            if (!foundOption || !parentGroupForOption) {
                this.logger.warn(`[OrderItemProcessor] Invalid or unavailable modifierOptionId '${selectedOptDto.modifierOptionId}' for MenuItem '${menuItem.id}' ('${menuItem.name_es}'). Option not found in any group or group not found.`);
                throw new BadRequestException(`Opción de modificador con ID '${selectedOptDto.modifierOptionId}' no es válida, no está disponible o no pertenece a ningún grupo del ítem '${menuItem.name_es}'.`);
            }
            
            // Asegurarse de que la opción tiene un groupId (debería ser así por el schema y la consulta)
            if (!foundOption.groupId) {
                 this.logger.error(`[OrderItemProcessor] Critical: ModifierOption '${foundOption.id}' ('${foundOption.name_es}') has no groupId. This indicates a data integrity issue or an error in the Prisma query.`);
                 throw new InternalServerErrorException(`Error de configuración: La opción de modificador '${foundOption.name_es}' no tiene un grupo asignado.`);
            }
            // Asegurarse de que el groupId de la opción coincide con el ID del grupo donde se encontró
             if (foundOption.groupId !== parentGroupForOption.id) {
                this.logger.error(`[OrderItemProcessor] Critical: ModifierOption '${foundOption.id}' groupId '${foundOption.groupId}' does not match parent group ID '${parentGroupForOption.id}'.`);
                throw new InternalServerErrorException(`Error de configuración: Inconsistencia en la asignación de grupo para la opción '${foundOption.name_es}'.`);
            }


            // Registrar la selección para el grupo padre
            if (!selectionsByGroupId[parentGroupForOption.id]) {
                selectionsByGroupId[parentGroupForOption.id] = [];
            }
            selectionsByGroupId[parentGroupForOption.id].push(foundOption);

            // Acumular ajuste de precio
            accumulatedModifierPrice = accumulatedModifierPrice.add(foundOption.priceAdjustment);

            // Preparar datos para la tabla de unión OrderItemModifierOption
            modifierOptionsToCreateForDb.push({
                modifierOptionId: foundOption.id,
                optionNameSnapshot: foundOption.name_es || 'Opción sin nombre ES', // Tomar snapshot
                optionPriceAdjustmentSnapshot: foundOption.priceAdjustment,
            });
        }

        // Segundo, validar las reglas de cada grupo del MenuItem
        for (const group of typedModifierGroups) {
            const selectedOptionsInThisGroup = selectionsByGroupId[group.id] || [];
            const countInThisGroup = selectedOptionsInThisGroup.length;

            this.logger.debug(`[OrderItemProcessor] Validating Group ID: ${group.id} ('${group.name_es}'). Required: ${group.isRequired}, Min: ${group.minSelections}, Max: ${group.maxSelections}, UI: ${group.uiType}. Selected count: ${countInThisGroup}`);

            if (group.isRequired && countInThisGroup < group.minSelections) {
                this.logger.warn(`[OrderItemProcessor] Validation fail for group '${group.name_es}': required min ${group.minSelections}, got ${countInThisGroup}.`);
                throw new BadRequestException(`Para el ítem '${menuItem.name_es}', el grupo de opciones '${group.name_es}' requiere al menos ${group.minSelections} selección(es). Se recibieron ${countInThisGroup}.`);
            }

            if (countInThisGroup > group.maxSelections) {
                this.logger.warn(`[OrderItemProcessor] Validation fail for group '${group.name_es}': allowed max ${group.maxSelections}, got ${countInThisGroup}.`);
                throw new BadRequestException(`Para el ítem '${menuItem.name_es}', el grupo de opciones '${group.name_es}' permite como máximo ${group.maxSelections} selección(es). Se recibieron ${countInThisGroup}.`);
            }

            // Si es tipo RADIO, y se seleccionó más de uno (aunque el frontend debería prevenirlo, es una guarda)
            if (group.uiType === 'RADIO' && countInThisGroup > 1) {
                this.logger.warn(`[OrderItemProcessor] Validation fail for RADIO group '${group.name_es}': got ${countInThisGroup} selections, expected 0 or 1.`);
                throw new BadRequestException(`El grupo de opciones '${group.name_es}' (tipo RADIO) solo permite una selección como máximo.`);
            }
        }

        this.logger.log(`[OrderItemProcessor] Modifier processing for item '${menuItem.name_es}' complete. Accumulated adjustment: ${accumulatedModifierPrice}. Options to create: ${modifierOptionsToCreateForDb.length}`);
        return {
            accumulatedModifierPrice,
            modifierOptionsToCreateForDb,
        };
    }
}