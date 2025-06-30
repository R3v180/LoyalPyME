// backend/src/modules/camarero/public/order-modification.service.ts
import {
    PrismaClient,
    Prisma,
    Order,
    OrderStatus,
    TableStatus,
} from '@prisma/client';
import {
    Injectable,
    Logger,
    NotFoundException,
    BadRequestException,
} from '@nestjs/common';

// --- CORRECCIÓN: Importar ProcessedOrderItemData desde order.types.ts ---
import { OrderItemProcessorService } from './order-item-processor.service';
import { ProcessedOrderItemData } from './order.types'; // <-- Se importa desde aquí
import { TableService } from '../../../shared/services/table.service';

// Importar los tipos necesarios desde el archivo centralizado
import {
    FrontendAddItemsToOrderDto,
    FrontendAddItemsOrderItemDto,
    OrderItemInternalDto,
} from './order.types';

// Interfaz BusinessContextForOrder (sin cambios)
interface BusinessContextForOrder {
    id: string;
    isActive: boolean;
    isCamareroActive: boolean;
}

@Injectable()
export class OrderModificationService {
    private readonly logger = new Logger(OrderModificationService.name);
    private readonly orderItemProcessorService: OrderItemProcessorService;
    private readonly tableService: TableService;
    private prisma: PrismaClient;

    constructor() {
        this.prisma = new PrismaClient();
        this.orderItemProcessorService = new OrderItemProcessorService();
        this.tableService = new TableService();
        this.logger.log("OrderModificationService instantiated");
    }

    async addItemsToExistingOrder(
        orderId: string,
        addItemsDto: FrontendAddItemsToOrderDto,
        businessSlug: string,
        _requestingCustomerId?: string | null
    ): Promise<Order> {
        this.logger.log(`[OrderModificationService] Attempting to add ${addItemsDto.items.length} items to order '${orderId}' for business slug '${businessSlug}'.`);

        const businessContext = await this._validateBusinessForOrdering(businessSlug);
        const businessId = businessContext.id;

        return this.prisma.$transaction(async (tx) => {
            this.logger.log(`[OrderModificationService TX] Transaction started for adding items to order '${orderId}'.`);

            const order = await tx.order.findUnique({
                where: { id: orderId },
                select: { id: true, status: true, businessId: true, totalAmount: true, finalAmount: true, notes: true, isBillRequested: true }
            });

            if (!order) {
                this.logger.warn(`[OrderModificationService TX] Order with ID '${orderId}' not found.`);
                throw new NotFoundException(`Pedido con ID '${orderId}' no encontrado.`);
            }
            if (order.businessId !== businessId) {
                this.logger.warn(`[OrderModificationService TX] Order '${orderId}' (business: ${order.businessId}) does not belong to specified business '${businessId}'.`);
                throw new BadRequestException(`El pedido no pertenece al negocio especificado.`);
            }

            const validStatusToAddItems: OrderStatus[] = [
                OrderStatus.RECEIVED, OrderStatus.IN_PROGRESS,
                OrderStatus.PARTIALLY_READY, OrderStatus.ALL_ITEMS_READY,
                OrderStatus.COMPLETED, OrderStatus.PENDING_PAYMENT,
            ];
            if (!validStatusToAddItems.includes(order.status)) {
                this.logger.warn(`[OrderModificationService TX] Cannot add items to order '${orderId}' in status '${order.status}'.`);
                throw new BadRequestException(`No se pueden añadir ítems a un pedido en estado '${order.status}'.`);
            }

            const itemsToProcessDto: OrderItemInternalDto[] = addItemsDto.items.map((item: FrontendAddItemsOrderItemDto) => ({
                menuItemId: item.menuItemId,
                quantity: item.quantity,
                notes: item.notes,
                selectedModifierOptions: item.selectedModifierOptions?.map(
                    (sm: { modifierOptionId: string }) => ({
                        modifierOptionId: sm.modifierOptionId
                    })
                ) || [],
            }));
            
            const processedNewItems: ProcessedOrderItemData[] =
                await this.orderItemProcessorService.processOrderItems(
                    tx,
                    businessId,
                    itemsToProcessDto
                );

            if (processedNewItems.length === 0 && addItemsDto.items.length === 0) {
                this.logger.warn(`[OrderModificationService TX] No new items provided in the payload to add to order '${orderId}'.`);
                throw new BadRequestException('No se proporcionaron ítems para añadir al pedido.');
            }

            const additionalAmount = processedNewItems.reduce(
                (sum, item) => sum.add(item.totalItemPrice),
                new Prisma.Decimal(0)
            );
            const newTotalAmount = new Prisma.Decimal(order.totalAmount).add(additionalAmount);
            const newFinalAmount = new Prisma.Decimal(order.finalAmount || order.totalAmount).add(additionalAmount);
            this.logger.log(`[OrderModificationService TX] Additional amount for order '${orderId}': ${additionalAmount}. New total: ${newTotalAmount}`);

            let updatedOrderNotes = order.notes;
            if (addItemsDto.customerNotes && addItemsDto.customerNotes.trim() !== '') {
                const additionNotePrefix = "Adición de ítems:";
                updatedOrderNotes = order.notes
                    ? `${order.notes}\n---\n${additionNotePrefix} ${addItemsDto.customerNotes.trim()}`
                    : `${additionNotePrefix} ${addItemsDto.customerNotes.trim()}`;
            }

            let newOrderStatus = order.status;
            let resetBillRequested = false;
            if (
                (order.status === OrderStatus.COMPLETED ||
                 order.status === OrderStatus.ALL_ITEMS_READY ||
                 order.status === OrderStatus.PENDING_PAYMENT) &&
                processedNewItems.length > 0
            ) {
                newOrderStatus = OrderStatus.IN_PROGRESS;
                this.logger.log(`[OrderModificationService TX] Order '${orderId}' was '${order.status}', new items added. Changing status to '${newOrderStatus}'.`);
                if (order.status === OrderStatus.PENDING_PAYMENT && order.isBillRequested) {
                    resetBillRequested = true;
                    this.logger.log(`[OrderModificationService TX] Bill was requested for order '${orderId}', resetting flag.`);
                }
            }

            const orderUpdateData: Prisma.OrderUpdateInput = {
                items: {
                    create: processedNewItems.map(pItem => ({
                        menuItemId: pItem.menuItemId,
                        quantity: pItem.quantity,
                        priceAtPurchase: pItem.priceAtPurchase,
                        totalItemPrice: pItem.totalItemPrice,
                        notes: pItem.notes,
                        kdsDestination: pItem.kdsDestination,
                        itemNameSnapshot: pItem.itemNameSnapshot,
                        itemDescriptionSnapshot: pItem.itemDescriptionSnapshot,
                        status: pItem.status,
                        ...(pItem.modifierOptionsToCreate.length > 0 && {
                            selectedModifiers: { createMany: { data: pItem.modifierOptionsToCreate } },
                        }),
                    })),
                },
                totalAmount: newTotalAmount,
                finalAmount: newFinalAmount,
                notes: updatedOrderNotes,
                status: newOrderStatus,
            };

            if (resetBillRequested) {
                orderUpdateData.isBillRequested = false;
            }

            const updatedOrder = await tx.order.update({
                where: { id: orderId },
                data: orderUpdateData,
                include: { items: { include: { selectedModifiers: true } }, table: true },
            });

            this.logger.log(`[OrderModificationService TX] Items successfully added to order '${orderId}'. New total: ${updatedOrder.totalAmount}. New status: ${updatedOrder.status}`);
            return updatedOrder;
        });
    }

    private async _validateBusinessForOrdering(businessSlug: string) {
        const business = await this.prisma.business.findUnique({
            where: { slug: businessSlug },
            select: { id: true, isActive: true, isCamareroActive: true },
        });

        if (!business) {
            this.logger.warn(`[OrderModificationService] Business with slug '${businessSlug}' not found.`);
            throw new NotFoundException(`Negocio con slug '${businessSlug}' no encontrado.`);
        }
        if (!business.isActive) {
            this.logger.warn(`[OrderModificationService] Business '${businessSlug}' is not active.`);
            throw new BadRequestException(`El negocio '${businessSlug}' no está activo y no puede procesar pedidos.`);
        }
        if (!business.isCamareroActive) {
            this.logger.warn(`[OrderModificationService] Camarero module not active for business '${businessSlug}'.`);
            throw new BadRequestException(`El módulo de pedidos (Camarero) no está activo para el negocio '${businessSlug}'.`);
        }
        this.logger.log(`[OrderModificationService] Business '${businessSlug}' validated for ordering. ID: ${business.id}`);
        return business;
    }
}