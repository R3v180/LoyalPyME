// backend/src/public/order.service.ts
// Versión 2.1.0 (Refactored to use dedicated sub-services for creation, modification, and payment logic)
import {
    Injectable,
    Logger,
    // Las excepciones específicas ya no se lanzan desde aquí, sino desde los sub-servicios.
} from '@nestjs/common';
import {
    PrismaClient,
    Order,
    // Ya no se necesitan la mayoría de los otros tipos de Prisma aquí
} from '@prisma/client';

// Importar los nuevos servicios que harán el trabajo pesado
import { OrderCreationService } from './order-creation.service';
import { OrderModificationService } from './order-modification.service';
import { OrderPaymentService } from './order-payment.service';

// Importar los tipos necesarios desde el archivo centralizado
import {
    CreateOrderPayloadInternalDto,
    PublicOrderStatusInfo,
    PublicOrderItemStatusInfo,
    FrontendAddItemsToOrderDto,
} from './order.types'; // Asumiendo que se llama order.types.ts

@Injectable()
export class OrderService {
    private readonly logger = new Logger(OrderService.name);

    // Instanciar los nuevos servicios. En un entorno NestJS completo, se inyectarían.
    private readonly orderCreationService: OrderCreationService;
    private readonly orderModificationService: OrderModificationService;
    private readonly orderPaymentService: OrderPaymentService;
    private readonly prisma: PrismaClient; // Necesario solo para getOrderStatus si se queda aquí

    constructor() {
        this.orderCreationService = new OrderCreationService();
        this.orderModificationService = new OrderModificationService();
        this.orderPaymentService = new OrderPaymentService();
        this.prisma = new PrismaClient();
        this.logger.log("OrderService (Public Orchestrator) instantiated");
    }

    /**
     * Orquesta la creación de un nuevo pedido delegando al OrderCreationService.
     */
    async createOrder(
        businessSlug: string,
        payload: CreateOrderPayloadInternalDto,
        requestingCustomerId?: string | null
    ): Promise<Order> {
        this.logger.log(`[OrderService -> Create] Orchestrating new order for business slug '${businessSlug}'.`);
        // La lógica compleja ahora vive en OrderCreationService
        return this.orderCreationService.createNewOrder(businessSlug, payload, requestingCustomerId);
    }

    /**
     * Orquesta la adición de ítems a un pedido existente delegando al OrderModificationService.
     */
    async addItemsToOrder(
        orderId: string,
        addItemsDto: FrontendAddItemsToOrderDto,
        businessSlug: string,
        requestingCustomerId?: string | null,
    ): Promise<Order> {
        this.logger.log(`[OrderService -> AddItems] Orchestrating add items to order '${orderId}' for business slug '${businessSlug}'.`);
        // La lógica compleja ahora vive en OrderModificationService
        return this.orderModificationService.addItemsToExistingOrder(
            orderId,
            addItemsDto,
            businessSlug,
            requestingCustomerId
        );
    }

    /**
     * Orquesta la solicitud de cuenta por parte de un cliente delegando al OrderPaymentService.
     */
    async requestBillForClient(
        orderId: string,
        paymentPreference?: string | null
    ): Promise<Order> {
        this.logger.log(`[OrderService -> RequestBillClient] Orchestrating client bill request for order '${orderId}'.`);
        // La lógica compleja ahora vive en OrderPaymentService
        return this.orderPaymentService.requestBillForClient(orderId, paymentPreference);
    }

    /**
     * Orquesta el marcado de un pedido como pagado delegando al OrderPaymentService.
     * Este método sería llamado típicamente desde un servicio de staff (como WaiterService), no directamente desde un controlador público.
     */
    async markOrderAsPaid(
        orderId: string,
        paidByStaffId: string,
        businessId: string,
        paymentDetails?: { method?: string; notes?: string }
    ): Promise<Order> {
        this.logger.log(`[OrderService -> MarkPaid] Orchestrating mark order '${orderId}' as PAID by staff '${paidByStaffId}'.`);
        // La lógica compleja ahora vive en OrderPaymentService
        return this.orderPaymentService.markOrderAsPaid(orderId, paidByStaffId, businessId, paymentDetails);
    }

    /**
     * Obtiene la información pública del estado de un pedido.
     * Esta función es principalmente de lectura y puede permanecer aquí.
     */
    async getOrderStatus(orderId: string): Promise<PublicOrderStatusInfo | null> {
        this.logger.log(`[OrderService -> GetStatus] Fetching public status for order '${orderId}'.`);
        try {
            const order = await this.prisma.order.findUnique({
                where: { id: orderId },
                select: {
                    id: true, orderNumber: true, status: true, notes: true, createdAt: true,
                    isBillRequested: true,
                    table: { select: { identifier: true } },
                    items: {
                        select: { id: true, itemNameSnapshot: true, itemDescriptionSnapshot: true, quantity: true, status: true },
                        orderBy: { createdAt: 'asc' }
                    }
                }
            });

            if (!order) {
                this.logger.warn(`[OrderService getOrderStatus] Pedido con ID ${orderId} no encontrado.`);
                return null;
            }

            const itemsInfo: PublicOrderItemStatusInfo[] = order.items.map(item => ({
                id: item.id,
                menuItemName_es: item.itemNameSnapshot,
                menuItemName_en: null, // Si tuvieras itemNameSnapshot_en, lo usarías aquí
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
                isBillRequested: order.isBillRequested,
            };

            this.logger.log(`[OrderService -> GetStatus] Status for order '${orderId}': ${orderStatusInfo.orderStatus}`);
            return orderStatusInfo;
        } catch (error) {
            this.logger.error(`[OrderService -> GetStatus] Error fetching status for order '${orderId}':`, error);
            // Relanzar para que el controlador lo maneje
            throw error;
        }
    }
}