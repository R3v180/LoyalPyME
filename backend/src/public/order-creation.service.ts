// backend/src/public/order-creation.service.ts
import {
    PrismaClient,
    Prisma,
    Order,
    OrderStatus,
    TableStatus,
    // User, // No necesitamos User completo aquí directamente
    // Business, // No necesitamos Business completo aquí directamente
} from '@prisma/client';
import {
    Injectable, // Para futuros usos si se integra con NestJS DI
    Logger,
    NotFoundException,
    BadRequestException,
    InternalServerErrorException,
} from '@nestjs/common';

// Importar los servicios que vamos a usar
import { OrderItemProcessorService, ProcessedOrderItemData } from './order-item-processor.service'; // TS2307 (se resolverá al crear el archivo)
// --- CORRECCIÓN AQUÍ: Quitar la extensión .ts ---
import { TableService } from '../services/table.service';
// --- FIN CORRECCIÓN ---

// Tipos del payload que este servicio espera (igual que en OrderService original)
// Asumimos que este tipo se moverá a un archivo de tipos compartidos, ej: order.types.ts
export interface CreateOrderPayloadInternalDto {
    tableIdentifier?: string | null;
    customerId?: string | null;
    orderNotes?: string | null;
    items: OrderItemInternalDto[]; // OrderItemInternalDto también necesitará ser definido/importado
}

// Definición local de OrderItemInternalDto si no se importa
interface OrderItemInternalDto {
    menuItemId: string;
    quantity: number;
    notes?: string | null;
    selectedModifierOptions?: { modifierOptionId: string }[] | null;
}


// Podríamos definir tipos más específicos para el contexto del negocio si fuera necesario
interface BusinessContextForOrder {
    id: string;
    isActive: boolean;
    isCamareroActive: boolean;
}

@Injectable()
export class OrderCreationService {
    private readonly logger = new Logger(OrderCreationService.name);
    private readonly orderItemProcessorService: OrderItemProcessorService;
    private readonly tableService: TableService;
    private prisma: PrismaClient;

    constructor() {
        this.prisma = new PrismaClient();
        this.orderItemProcessorService = new OrderItemProcessorService(); // Esto fallará hasta que se cree el archivo
        this.tableService = new TableService(); // Esto fallará hasta que se cree el archivo
        this.logger.log("OrderCreationService instantiated");
    }

    async createNewOrder(
        businessSlug: string,
        payload: CreateOrderPayloadInternalDto,
        requestingCustomerId?: string | null
    ): Promise<Order> {
        this.logger.log(`[OrderCreationService] Attempting to create new order for business slug '${businessSlug}'. Items: ${payload.items.length}`);

        const businessContext = await this.validateBusinessForOrdering(businessSlug);
        const businessId = businessContext.id;

        return this.prisma.$transaction(async (tx) => {
            this.logger.log(`[OrderCreationService TX] Transaction started for new order.`);

            const processedItems: ProcessedOrderItemData[] =
                await this.orderItemProcessorService.processOrderItems(
                    tx,
                    businessId,
                    payload.items
                );

            if (processedItems.length === 0 && payload.items.length > 0) {
                this.logger.warn(`[OrderCreationService TX] All items in payload were invalid. No items to create for order.`);
                throw new BadRequestException('Ninguno de los ítems proporcionados pudo ser procesado.');
            }
            if (processedItems.length === 0 && payload.items.length === 0) {
                 this.logger.warn(`[OrderCreationService TX] No items provided in the payload.`);
                 throw new BadRequestException('El pedido debe contener al menos un ítem.');
            }

            const totalAmount = processedItems.reduce(
                (sum, item) => sum.add(item.totalItemPrice),
                new Prisma.Decimal(0)
            );
            this.logger.log(`[OrderCreationService TX] Calculated totalAmount: ${totalAmount}`);

            const orderNumber = await this._generateOrderNumber(tx, businessId);
            this.logger.log(`[OrderCreationService TX] Generated orderNumber: ${orderNumber}`);

            const orderCreateData: Prisma.OrderCreateInput = {
                business: { connect: { id: businessId } },
                orderNumber: orderNumber,
                notes: payload.orderNotes,
                totalAmount: totalAmount,
                finalAmount: totalAmount,
                status: OrderStatus.RECEIVED,
                isBillRequested: false,
                source: payload.customerId || requestingCustomerId ? 'CUSTOMER_APP' : 'CUSTOMER_APP_ANONYMOUS',
                orderType: payload.tableIdentifier ? 'DINE_IN' : 'TAKE_AWAY',
                items: {
                    create: processedItems.map(pItem => ({
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
                            selectedModifiers: {
                                createMany: {
                                    data: pItem.modifierOptionsToCreate,
                                },
                            },
                        }),
                    })),
                },
            };

            if (payload.tableIdentifier) {
                const table = await this.tableService.findTableByIdentifier(
                    tx,
                    businessId,
                    payload.tableIdentifier
                );
                if (table) {
                    orderCreateData.table = { connect: { id: table.id } };
                    await this.tableService.updateTableStatus(tx, table.id, TableStatus.OCCUPIED);
                    this.logger.log(`[OrderCreationService TX] Table '${payload.tableIdentifier}' (ID: ${table.id}) connected and set to OCCUPIED.`);
                } else {
                    this.logger.warn(`[OrderCreationService TX] Table identifier '${payload.tableIdentifier}' provided but table not found for business '${businessId}'. Order will be created without table assignment.`);
                }
            }

            const finalCustomerId = payload.customerId || requestingCustomerId;
            if (finalCustomerId) {
                const customerExists = await tx.user.findFirst({ where: { id: finalCustomerId, businessId: businessId }});
                if(customerExists) {
                    orderCreateData.customerLCo = { connect: { id: finalCustomerId } };
                    this.logger.log(`[OrderCreationService TX] CustomerLCoId '${finalCustomerId}' connected to order.`);
                } else {
                    this.logger.warn(`[OrderCreationService TX] CustomerLCoId '${finalCustomerId}' provided but not found for business '${businessId}'. Order will be created without LCo customer.`);
                }
            }

            const newOrder = await tx.order.create({
                data: orderCreateData,
                include: { items: { include: { selectedModifiers: true } }, table: true },
            });

            this.logger.log(`[OrderCreationService TX] Order ${newOrder.id} (Number: ${newOrder.orderNumber}) created successfully with ${newOrder.items.length} item(s).`);
            return newOrder;
        });
    }

    private async validateBusinessForOrdering(businessSlug: string): Promise<BusinessContextForOrder> {
        const business = await this.prisma.business.findUnique({
            where: { slug: businessSlug },
            select: { id: true, isActive: true, isCamareroActive: true },
        });

        if (!business) {
            this.logger.warn(`[OrderCreationService] Business with slug '${businessSlug}' not found.`);
            throw new NotFoundException(`Negocio con slug '${businessSlug}' no encontrado.`);
        }
        if (!business.isActive) {
            this.logger.warn(`[OrderCreationService] Business '${businessSlug}' is not active.`);
            throw new BadRequestException(`El negocio '${businessSlug}' no está activo y no puede recibir pedidos.`);
        }
        if (!business.isCamareroActive) {
            this.logger.warn(`[OrderCreationService] Camarero module not active for business '${businessSlug}'.`);
            throw new BadRequestException(`El módulo de pedidos (Camarero) no está activo para el negocio '${businessSlug}'.`);
        }
        this.logger.log(`[OrderCreationService] Business '${businessSlug}' validated for ordering. ID: ${business.id}`);
        return business;
    }

    private async _generateOrderNumber(tx: Prisma.TransactionClient, businessId: string): Promise<string> {
        const orderCount = await tx.order.count({
            where: { businessId: businessId },
        });
        const datePrefix = new Date().toISOString().slice(0, 10).replace(/-/g, '');
        const newCount = orderCount + 1;
        return `P-${datePrefix}-${String(newCount).padStart(5, '0')}`;
    }
}