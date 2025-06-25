// backend/src/modules/camarero/public/order-payment.service.ts (CORREGIDO)
import {
    PrismaClient,
    Prisma,
    Order,
    OrderStatus,
    TableStatus,
    User,
    Business,
    ActivityType,
    TierBenefit,
} from '@prisma/client';
import {
    Injectable,
    Logger,
    NotFoundException,
    BadRequestException,
    ForbiddenException,
    InternalServerErrorException,
} from '@nestjs/common';

// --- RUTAS CORREGIDAS ---
import { TableService } from '../../../shared/services/table.service';
import { LoyaltyPointsService } from '../../../shared/services/loyalty-points.service';
import { updateUserTier } from '../../../modules/loyalpyme/tiers/tier-logic.service';
// --- FIN RUTAS CORREGIDAS ---

// Tipos para los datos que necesita LoyaltyPointsService
type OrderForLoyalty = Pick<Order, 'id' | 'orderNumber' | 'finalAmount' | 'totalAmount' | 'customerLCoId' | 'businessId'>;
type CustomerForLoyalty = User & {
    currentTier?: ({ benefits: Pick<TierBenefit, 'type' | 'value' | 'isActive'>[] } & { id: string; name: string }) | null;
};
type BusinessForLoyalty = Pick<Business, 'id' | 'pointsPerEuro' | 'isLoyaltyCoreActive'>;

@Injectable()
export class OrderPaymentService {
    private readonly logger = new Logger(OrderPaymentService.name);
    private readonly tableService: TableService;
    private readonly loyaltyPointsService: LoyaltyPointsService;
    private prisma: PrismaClient;

    constructor() {
        this.prisma = new PrismaClient();
        this.tableService = new TableService();
        this.loyaltyPointsService = new LoyaltyPointsService();
        this.logger.log("OrderPaymentService instantiated");
    }

    async requestBillForClient(
        orderId: string,
        paymentPreference?: string | null
    ): Promise<Order> {
        this.logger.log(`[OrderPaymentService] Client requesting bill for order '${orderId}'. Preference: ${paymentPreference || 'N/A'}`);

        return this.prisma.$transaction(async (tx) => {
            const order = await tx.order.findUnique({
                where: { id: orderId },
                select: { id: true, status: true, businessId: true, tableId: true, orderNumber: true },
            });

            if (!order) {
                this.logger.warn(`[OrderPaymentService TX] Order '${orderId}' not found for client bill request.`);
                throw new NotFoundException(`Pedido con ID '${orderId}' no encontrado.`);
            }

            const allowedStates: OrderStatus[] = [
                OrderStatus.RECEIVED, OrderStatus.IN_PROGRESS,
                OrderStatus.PARTIALLY_READY, OrderStatus.ALL_ITEMS_READY,
                OrderStatus.COMPLETED,
            ];
            if (!allowedStates.includes(order.status)) {
                this.logger.warn(`[OrderPaymentService TX] Cannot request bill for order '${orderId}' in status '${order.status}'.`);
                throw new BadRequestException(`No se puede solicitar la cuenta para un pedido en estado '${order.status}'.`);
            }

            const updateData: Prisma.OrderUpdateInput = {
                status: OrderStatus.PENDING_PAYMENT,
                isBillRequested: true,
            };
            if (paymentPreference !== undefined) {
                updateData.paymentMethodPreference = paymentPreference;
            }

            const updatedOrder = await tx.order.update({
                where: { id: orderId },
                data: updateData,
            });
            this.logger.log(`[OrderPaymentService TX] Order '${orderId}' status set to PENDING_PAYMENT by client request.`);

            if (order.tableId && order.businessId) {
                try {
                    await this.tableService.updateTableStatus(tx, order.tableId, TableStatus.PENDING_PAYMENT_TABLE);
                    this.logger.log(`[OrderPaymentService TX] Table ID '${order.tableId}' status updated to PENDING_PAYMENT_TABLE.`);
                } catch (tableError) {
                    this.logger.error(`[OrderPaymentService TX] Failed to update table status for table '${order.tableId}' during client bill request. Continuing. Error:`, tableError);
                }
            }
            return updatedOrder;
        });
    }

    async markOrderAsPaid(
        orderId: string,
        paidByStaffId: string,
        businessId: string,
        paymentDetails?: { method?: string; notes?: string }
    ): Promise<Order> {
        this.logger.log(`[OrderPaymentService] Staff '${paidByStaffId}' attempting to mark order '${orderId}' as PAID for business '${businessId}'. Payment method: ${paymentDetails?.method || 'N/A'}`);

        return this.prisma.$transaction(async (tx) => {
            const order = await tx.order.findUnique({
                where: { id: orderId },
                include: {
                    business: { select: { id: true, isLoyaltyCoreActive: true, pointsPerEuro: true } },
                    table: { select: { id: true, status: true } },
                    customerLCo: {
                        include: {
                            currentTier: {
                                include: {
                                    benefits: { where: { isActive: true, type: 'POINTS_MULTIPLIER' } }
                                }
                            }
                        }
                    }
                }
            });

            if (!order) {
                this.logger.warn(`[OrderPaymentService TX] Order '${orderId}' not found.`);
                throw new NotFoundException(`Pedido con ID '${orderId}' no encontrado.`);
            }
            if (order.businessId !== businessId) {
                this.logger.warn(`[OrderPaymentService TX] Order '${orderId}' (business: ${order.businessId}) does not belong to staff's business '${businessId}'.`);
                throw new ForbiddenException("El pedido no pertenece al negocio del personal.");
            }

            if (order.status !== OrderStatus.PENDING_PAYMENT && order.status !== OrderStatus.COMPLETED) {
                this.logger.warn(`[OrderPaymentService TX] Cannot mark order '${orderId}' as PAID. Current status: '${order.status}'.`);
                throw new BadRequestException(`Solo se pueden marcar como pagados pedidos en estado 'PENDING_PAYMENT' o 'COMPLETED'. Estado actual: ${order.status}`);
            }

            const updatedOrder = await tx.order.update({
                where: { id: orderId },
                data: {
                    status: OrderStatus.PAID,
                    paidAt: new Date(),
                    paidByUserId: paidByStaffId,
                    paymentMethodUsed: paymentDetails?.method,
                },
            });
            this.logger.log(`[OrderPaymentService TX] Order '${orderId}' status updated to PAID.`);

            if (order.tableId && order.table && order.table.status !== TableStatus.AVAILABLE) {
                await this.tableService.updateTableStatus(tx, order.tableId, TableStatus.AVAILABLE);
                this.logger.log(`[OrderPaymentService TX] Table ID '${order.tableId}' status updated to AVAILABLE.`);
            }

            if (order.customerLCoId && order.business?.isLoyaltyCoreActive && order.customerLCo) {
                const loyaltyResult = await this.loyaltyPointsService.awardPointsForLcOrder(
                    tx,
                    order as OrderForLoyalty,
                    order.customerLCo as CustomerForLoyalty,
                    order.business as BusinessForLoyalty
                );
                if (loyaltyResult) {
                    this.logger.log(`[OrderPaymentService TX] Loyalty points awarded: ${loyaltyResult.pointsAwarded} for order '${orderId}'.`);
                } else {
                    this.logger.warn(`[OrderPaymentService TX] Loyalty points awarding process for order '${orderId}' returned null (possibly skipped or failed internally).`);
                }
            } else {
                if (order.customerLCoId) {
                    this.logger.log(`[OrderPaymentService TX] LCo module not active for business '${order.businessId}' or customer data missing. Skipping LCo points for order '${order.id}'.`);
                }
            }
            return updatedOrder;
        });
    }
}