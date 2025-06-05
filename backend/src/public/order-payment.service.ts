// backend/src/public/order-payment.service.ts
import {
    PrismaClient,
    Prisma,
    Order,
    OrderStatus,
    TableStatus,
    User,       // Para el tipado del cliente LCo
    Business,   // Para el tipado del negocio
    ActivityType, // Para el log de puntos
    TierBenefit,  // Para el tipado de beneficios de tier
} from '@prisma/client';
import {
    Injectable,
    Logger,
    NotFoundException,
    BadRequestException,
    ForbiddenException,
    InternalServerErrorException,
} from '@nestjs/common';

// Importar servicios dependientes
import { TableService } from '../services/table.service';         // Asumiendo la ruta que definimos
import { LoyaltyPointsService } from '../services/loyalty-points.service'; // Asumiendo la ruta que definimos
import { updateUserTier } from '../tiers/tier-logic.service';      // Para la reevaluación de tier

// Tipos para los datos que necesita LoyaltyPointsService (pueden vivir en un archivo de tipos común)
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

    /**
     * Permite a un cliente solicitar la cuenta para su pedido.
     * Actualiza el estado del pedido a PENDING_PAYMENT.
     *
     * @param orderId - ID del pedido.
     * @param paymentPreference - (Opcional) Preferencia de pago del cliente.
     * @returns El objeto Order actualizado.
     */
    async requestBillForClient(
        orderId: string,
        paymentPreference?: string | null // Permitir null
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
            if (paymentPreference !== undefined) { // Solo añadir si se proporcionó (incluso si es null)
                updateData.paymentMethodPreference = paymentPreference;
            }

            const updatedOrder = await tx.order.update({
                where: { id: orderId },
                data: updateData,
            });
            this.logger.log(`[OrderPaymentService TX] Order '${orderId}' status set to PENDING_PAYMENT by client request.`);

            // Si el pedido está asociado a una mesa, actualizar el estado de la mesa
            if (order.tableId && order.businessId) { // Asegurarse que businessId existe
                try {
                    // No necesitamos el resultado de updateTableStatus aquí, solo asegurar que se ejecuta
                    await this.tableService.updateTableStatus(tx, order.tableId, TableStatus.PENDING_PAYMENT_TABLE);
                    this.logger.log(`[OrderPaymentService TX] Table ID '${order.tableId}' status updated to PENDING_PAYMENT_TABLE.`);
                } catch (tableError) {
                    this.logger.error(`[OrderPaymentService TX] Failed to update table status for table '${order.tableId}' during client bill request. Continuing. Error:`, tableError);
                    // No hacer fallar la solicitud de cuenta si la mesa no se actualiza, pero loguear.
                }
            }
            return updatedOrder;
        });
    }


    /**
     * Marca un pedido como pagado.
     * Actualiza el estado del pedido, registra detalles del pago, libera la mesa,
     * y gestiona la asignación de puntos de fidelidad si aplica.
     *
     * @param orderId - ID del pedido.
     * @param paidByStaffId - ID del miembro del personal que procesó el pago.
     * @param businessId - ID del negocio (para validación).
     * @param paymentDetails - (Opcional) Detalles del pago como método y notas.
     * @returns El objeto Order actualizado.
     */
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
                include: { // Incluir datos necesarios para lógica de puntos y mesa
                    business: { select: { id: true, isLoyaltyCoreActive: true, pointsPerEuro: true } },
                    table: { select: { id: true, status: true } },
                    customerLCo: { // Para la lógica de puntos
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

            // Permitir marcar como pagado si está PENDING_PAYMENT o incluso COMPLETED (si se saltó el paso de pedir cuenta)
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
                    // Aquí se podrían añadir las notas del pago al campo 'notes' del pedido si fuera relevante
                    // Ejemplo: notes: paymentDetails?.notes ? (order.notes ? `${order.notes}\n\nNota de Pago: ${paymentDetails.notes}` : `Nota de Pago: ${paymentDetails.notes}`) : order.notes,
                },
            });
            this.logger.log(`[OrderPaymentService TX] Order '${orderId}' status updated to PAID.`);

            // Liberar la mesa
            if (order.tableId && order.table && order.table.status !== TableStatus.AVAILABLE) {
                await this.tableService.updateTableStatus(tx, order.tableId, TableStatus.AVAILABLE);
                this.logger.log(`[OrderPaymentService TX] Table ID '${order.tableId}' status updated to AVAILABLE.`);
            }

            // Asignar puntos de fidelidad si aplica
            if (order.customerLCoId && order.business?.isLoyaltyCoreActive && order.customerLCo) {
                const loyaltyResult = await this.loyaltyPointsService.awardPointsForLcOrder(
                    tx,
                    order as OrderForLoyalty, // Casteo seguro después de las validaciones
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