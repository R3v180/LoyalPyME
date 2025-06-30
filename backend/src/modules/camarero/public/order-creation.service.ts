// backend/src/modules/camarero/public/order-creation.service.ts
import {
    PrismaClient, Prisma, Order, OrderStatus, TableStatus, RewardType, DiscountType, ActivityType,
} from '@prisma/client';
import {
    Injectable, Logger, NotFoundException, BadRequestException,
} from '@nestjs/common';

import { OrderItemProcessorService } from './order-item-processor.service';
import { TableService } from '../../../shared/services/table.service';
import { CreateOrderPayloadInternalDto } from './order.types';

@Injectable()
export class OrderCreationService {
    private readonly logger = new Logger(OrderCreationService.name);
    private readonly orderItemProcessorService: OrderItemProcessorService;
    private readonly tableService: TableService;
    private prisma: PrismaClient;

    constructor() {
        this.prisma = new PrismaClient();
        this.orderItemProcessorService = new OrderItemProcessorService();
        this.tableService = new TableService();
    }

    async createNewOrder(
        businessSlug: string,
        payload: CreateOrderPayloadInternalDto,
        requestingCustomerId?: string | null
    ): Promise<Order> {
        this.logger.log(`[OrderCreationService] Creating new order for business slug '${businessSlug}'.`);
        
        const businessContext = await this.validateBusinessForOrdering(businessSlug);
        const businessId = businessContext.id;
        const finalCustomerId = payload.customerId || requestingCustomerId;

        return this.prisma.$transaction(async (tx) => {
            this.logger.log(`[TX] Order creation transaction started for business ${businessId}.`);

            const processedItems = await this.orderItemProcessorService.processOrderItems(
                tx, businessId, payload.items
            );
            if (processedItems.length === 0) throw new BadRequestException('El pedido debe contener al menos un ítem válido.');

            let subtotal = processedItems.reduce(
                (sum, item) => sum.add(item.totalItemPrice), new Prisma.Decimal(0)
            );
            
            let discountAmount = new Prisma.Decimal(0);
            
            if (finalCustomerId) {
                const customer = await tx.user.findUnique({ where: { id: finalCustomerId }});
                if (!customer) throw new BadRequestException('El cliente asociado al pedido no existe.');
                
                let totalPointsToDebit = 0;

                for (const item of processedItems) {
                    if (item.redeemedRewardId) {
                        const reward = await tx.reward.findUnique({ where: { id: item.redeemedRewardId }});
                        if (!reward || !reward.isActive || reward.type !== RewardType.MENU_ITEM) {
                            throw new BadRequestException(`La recompensa para '${item.itemNameSnapshot}' no es válida.`);
                        }
                        totalPointsToDebit += reward.pointsCost;
                    }
                }

                if (payload.appliedLcoRewardId) {
                    const discountReward = await tx.reward.findUnique({ where: { id: payload.appliedLcoRewardId } });
                    if (!discountReward || !discountReward.isActive || !(discountReward.type === RewardType.DISCOUNT_ON_ITEM || discountReward.type === RewardType.DISCOUNT_ON_TOTAL)) {
                        throw new BadRequestException('La recompensa de descuento general no es válida.');
                    }
                    totalPointsToDebit += discountReward.pointsCost;

                    if (discountReward.discountType === DiscountType.FIXED_AMOUNT && discountReward.discountValue) {
                        discountAmount = new Prisma.Decimal(discountReward.discountValue);
                    } else if (discountReward.discountType === DiscountType.PERCENTAGE && discountReward.discountValue) {
                        discountAmount = subtotal.mul(new Prisma.Decimal(discountReward.discountValue).div(100));
                    }
                }
                
                if (customer.points < totalPointsToDebit) {
                    throw new BadRequestException(`Puntos insuficientes. Necesitas ${totalPointsToDebit} y tienes ${customer.points}.`);
                }

                if (totalPointsToDebit > 0) {
                    await tx.user.update({
                        where: { id: customer.id },
                        data: { points: { decrement: totalPointsToDebit } }
                    });
                    this.logger.log(`[TX] Debited ${totalPointsToDebit} points from customer ${customer.id}.`);
                }
            } else if (payload.appliedLcoRewardId || processedItems.some(i => i.redeemedRewardId)) {
                throw new BadRequestException('Debes iniciar sesión para usar recompensas.');
            }

            const finalAmount = subtotal.sub(discountAmount).isNegative() ? new Prisma.Decimal(0) : subtotal.sub(discountAmount);
            const orderNumber = await this._generateOrderNumber(tx, businessId);

            const orderCreateData: Prisma.OrderCreateInput = {
                business: { connect: { id: businessId } },
                orderNumber,
                notes: payload.orderNotes,
                totalAmount: subtotal,
                discountAmount,
                finalAmount,
                status: OrderStatus.RECEIVED,
                source: finalCustomerId ? 'CUSTOMER_APP' : 'CUSTOMER_APP_ANONYMOUS',
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
                        redeemedRewardId: pItem.redeemedRewardId,
                        ...(pItem.modifierOptionsToCreate.length > 0 && {
                            selectedModifiers: { createMany: { data: pItem.modifierOptionsToCreate } },
                        }),
                    })),
                },
            };

            // --- CORRECCIÓN AQUÍ ---
            // Usar 'appliedLcoReward' para conectar la relación, en lugar de 'appliedLcoRewardId'
            if (payload.appliedLcoRewardId) {
                orderCreateData.appliedLcoReward = {
                    connect: { id: payload.appliedLcoRewardId }
                };
            }
            // --- FIN DE LA CORRECCIÓN ---

            if (payload.tableIdentifier) {
                const table = await this.tableService.findTableByIdentifier(tx, businessId, payload.tableIdentifier);
                if (table) {
                    orderCreateData.table = { connect: { id: table.id } };
                    await this.tableService.updateTableStatus(tx, table.id, TableStatus.OCCUPIED);
                }
            }

            if (finalCustomerId) {
                orderCreateData.customerLCo = { connect: { id: finalCustomerId } };
            }
            
            const newOrder = await tx.order.create({
                data: orderCreateData,
                include: { items: { include: { selectedModifiers: true } }, table: true },
            });

            this.logger.log(`[TX] Order ${newOrder.id} (Number: ${newOrder.orderNumber}) created successfully.`);
            return newOrder;
        });
    }
    
    private async validateBusinessForOrdering(businessSlug: string) {
        const business = await this.prisma.business.findUnique({
            where: { slug: businessSlug },
            select: { id: true, isActive: true, isCamareroActive: true },
        });
        if (!business) throw new NotFoundException(`Negocio con slug '${businessSlug}' no encontrado.`);
        if (!business.isActive) throw new BadRequestException(`El negocio '${businessSlug}' no está activo.`);
        if (!business.isCamareroActive) throw new BadRequestException(`El módulo de pedidos no está activo para '${businessSlug}'.`);
        return business;
    }

    private async _generateOrderNumber(tx: Prisma.TransactionClient, businessId: string): Promise<string> {
        const orderCount = await tx.order.count({ where: { businessId: businessId } });
        const datePrefix = new Date().toISOString().slice(0, 10).replace(/-/g, '');
        return `P-${datePrefix}-${String(orderCount + 1).padStart(5, '0')}`;
    }
}