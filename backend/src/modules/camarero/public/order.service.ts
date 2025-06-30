// backend/src/modules/camarero/public/order.service.ts
// Versión 2.2.0 - Aligned with corrected order.types.ts

import {
    Injectable,
    Logger,
} from '@nestjs/common';
import {
    PrismaClient,
    Order,
    Prisma,
} from '@prisma/client';

// Importar los servicios que hacen el trabajo pesado
import { OrderCreationService } from './order-creation.service';
import { OrderModificationService } from './order-modification.service';
import { OrderPaymentService } from './order-payment.service';

// Importar los tipos necesarios desde el archivo centralizado
import {
    CreateOrderPayloadInternalDto,
    PublicOrderStatusInfo,
    FrontendAddItemsToOrderDto,
} from './order.types';

@Injectable()
export class OrderService {
    private readonly logger = new Logger(OrderService.name);

    private readonly orderCreationService: OrderCreationService;
    private readonly orderModificationService: OrderModificationService;
    private readonly orderPaymentService: OrderPaymentService;
    private readonly prisma: PrismaClient;

    constructor() {
        this.orderCreationService = new OrderCreationService();
        this.orderModificationService = new OrderModificationService();
        this.orderPaymentService = new OrderPaymentService();
        this.prisma = new PrismaClient();
        this.logger.log("OrderService (Public Orchestrator) instantiated");
    }

    // --- MÉTODOS DE ORQUESTACIÓN (sin cambios) ---
    async createOrder(businessSlug: string, payload: CreateOrderPayloadInternalDto, requestingCustomerId?: string | null): Promise<Order> {
        this.logger.log(`[OrderService -> Create] Orchestrating new order for business slug '${businessSlug}'.`);
        return this.orderCreationService.createNewOrder(businessSlug, payload, requestingCustomerId);
    }
    async addItemsToOrder(orderId: string, addItemsDto: FrontendAddItemsToOrderDto, businessSlug: string, requestingCustomerId?: string | null): Promise<Order> {
        this.logger.log(`[OrderService -> AddItems] Orchestrating add items to order '${orderId}' for business slug '${businessSlug}'.`);
        return this.orderModificationService.addItemsToExistingOrder(orderId, addItemsDto, businessSlug, requestingCustomerId);
    }
    async requestBillForClient(orderId: string, paymentPreference?: string | null): Promise<Order> {
        this.logger.log(`[OrderService -> RequestBillClient] Orchestrating client bill request for order '${orderId}'.`);
        return this.orderPaymentService.requestBillForClient(orderId, paymentPreference);
    }
    async markOrderAsPaid(orderId: string, paidByStaffId: string, businessId: string, paymentDetails?: { method?: string; notes?: string }): Promise<Order> {
        this.logger.log(`[OrderService -> MarkPaid] Orchestrating mark order '${orderId}' as PAID by staff '${paidByStaffId}'.`);
        return this.orderPaymentService.markOrderAsPaid(orderId, paidByStaffId, businessId, paymentDetails);
    }
    // --- FIN MÉTODOS DE ORQUESTACIÓN ---

    /**
     * Obtiene la información pública del estado de un pedido, convirtiendo los datos
     * al formato esperado por la interfaz `PublicOrderStatusInfo`.
     */
    async getOrderStatus(orderId: string): Promise<PublicOrderStatusInfo | null> {
        this.logger.log(`[OrderService -> GetStatus] Fetching public status for order '${orderId}'.`);
        try {
            const order = await this.prisma.order.findUnique({
                where: { id: orderId },
                select: {
                    id: true, orderNumber: true, status: true, notes: true, createdAt: true,
                    isBillRequested: true, totalAmount: true, discountAmount: true, finalAmount: true,
                    table: { select: { identifier: true } },
                    items: {
                        where: { status: { not: 'CANCELLED' } },
                        select: {
                            id: true,
                            // --- CORRECCIÓN 1: Seleccionar el campo `itemNameSnapshot` ---
                            itemNameSnapshot: true,
                            quantity: true, status: true, priceAtPurchase: true, totalItemPrice: true,
                            selectedModifiers: {
                                select: {
                                    optionNameSnapshot: true,
                                    optionPriceAdjustmentSnapshot: true,
                                },
                            },
                        },
                        orderBy: { createdAt: 'asc' },
                    },
                },
            });

            if (!order) {
                this.logger.warn(`[OrderService getOrderStatus] Pedido con ID ${orderId} no encontrado.`);
                return null;
            }

            // --- CORRECCIÓN 2: Mapeo explícito y conversión de tipos ---
            const responseData: PublicOrderStatusInfo = {
                orderId: order.id,
                orderNumber: order.orderNumber,
                orderStatus: order.status,
                items: order.items.map(item => ({
                    id: item.id,
                    // Asignar el snapshot al campo correcto de la interfaz
                    itemNameSnapshot: item.itemNameSnapshot,
                    quantity: item.quantity,
                    status: item.status,
                    // Convertir de Decimal a number
                    priceAtPurchase: item.priceAtPurchase.toNumber(),
                    totalItemPrice: item.totalItemPrice.toNumber(),
                    selectedModifiers: item.selectedModifiers.map(mod => ({
                        optionNameSnapshot: mod.optionNameSnapshot,
                        // Convertir Decimal | null a number, usando 0 como fallback
                        optionPriceAdjustmentSnapshot: mod.optionPriceAdjustmentSnapshot?.toNumber() ?? 0
                    }))
                })),
                tableIdentifier: order.table?.identifier,
                orderNotes: order.notes,
                createdAt: order.createdAt,
                isBillRequested: order.isBillRequested,
                // Convertir Decimal a number
                totalAmount: order.totalAmount.toNumber(),
                discountAmount: order.discountAmount?.toNumber() ?? null,
                // Usar fallback si finalAmount es null y luego convertir a number
                finalAmount: (order.finalAmount ?? order.totalAmount).toNumber(),
            };

            return responseData;

        } catch (error) {
            this.logger.error(`[OrderService -> GetStatus] Error fetching status for order '${orderId}':`, error);
            throw error;
        }
    }
}