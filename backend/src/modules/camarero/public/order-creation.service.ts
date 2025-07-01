// backend/src/modules/camarero/public/order-creation.service.ts
// VERSIÓN 2.5.4 - CORRECCIÓN DEFINITIVA DE LÓGICA DE DESCUENTOS Y CUPONES (con logs EXTENSOS para depuración)

import {
    PrismaClient, Prisma, Order, OrderStatus, TableStatus, RewardType, DiscountType, Reward,
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
        this.logger.log(`[OrderCreationService] Iniciando creación de pedido para slug '${businessSlug}'.`);
        
        const businessContext = await this.validateBusinessForOrdering(businessSlug);
        const businessId = businessContext.id;
        const finalCustomerId = payload.customerId || requestingCustomerId;

        return this.prisma.$transaction(async (tx) => {
            this.logger.log(`[TX] Transacción de creación de pedido iniciada para negocio ${businessId}.`);

            const processedItems = await this.orderItemProcessorService.processOrderItems(
                tx, businessId, payload.items
            );
            if (processedItems.length === 0) throw new BadRequestException('El pedido debe contener al menos un ítem válido.');

            const subtotal = processedItems.reduce((sum, item) => sum.add(item.totalItemPrice), new Prisma.Decimal(0));
            this.logger.log(`[TX] Subtotal de ítems procesados: ${subtotal.toFixed(2)}.`);

            let discountAmount = new Prisma.Decimal(0);
            
            // Declarar variables en un ámbito más amplio
            let actualAppliedReward: Reward | null = null; // Recompensa REAL aplicada (del catálogo o vía cupón)
            let grantedRewardUsed: { id: string, userId: string, reward: Reward, status: string } | null = null; // Info del GrantedReward si se usó un cupón
            let totalPointsToDebit = 0; // Se inicializa aquí para que esté disponible globalmente en el scope de la transacción

            // Lógica de recompensas y cupones
            if (finalCustomerId) {
                this.logger.log(`[TX] Cliente final identificado: ${finalCustomerId}. Procesando recompensas.`);
                const customer = await tx.user.findUnique({ where: { id: finalCustomerId }});
                if (!customer) throw new BadRequestException('El cliente asociado al pedido no existe.');
                
                // 1. Contabilizar puntos de ítems gratis y validar que las recompensas existen
                for (const item of processedItems) {
                    if (item.redeemedRewardId) {
                        const reward = await tx.reward.findUnique({ where: { id: item.redeemedRewardId }});
                        if (!reward || !reward.isActive || reward.type !== RewardType.MENU_ITEM) {
                            throw new BadRequestException(`La recompensa para '${item.itemNameSnapshot}' no es válida o no está activa.`);
                        }
                        totalPointsToDebit += reward.pointsCost;
                        this.logger.log(`[TX] Ítem de recompensa (producto gratis) encontrado: '${item.itemNameSnapshot}' (ID recompensa: ${reward.id}). Puntos a debitar por este ítem: ${reward.pointsCost}. Total acumulado: ${totalPointsToDebit}.`);
                    }
                }

                // 2. Procesar el descuento aplicado al total (puede ser un GrantedReward o un Reward directo)
                if (payload.appliedLcoRewardId) {
                    this.logger.log(`[TX] appliedLcoRewardId en payload: ${payload.appliedLcoRewardId}.`);
                    
                    // Primero, intentar buscar si es un GrantedReward (cupón ya adquirido)
                    grantedRewardUsed = await tx.grantedReward.findUnique({
                        where: { id: payload.appliedLcoRewardId },
                        include: { reward: true }
                    });

                    if (grantedRewardUsed) {
                        // Es un cupón (GrantedReward)
                        this.logger.log(`[TX] ¡GrantedReward encontrado!: ID: ${grantedRewardUsed.id}, Estatus: ${grantedRewardUsed.status}, Recompensa asociada: '${grantedRewardUsed.reward?.name_es}'.`);
                        
                        if (grantedRewardUsed.userId !== customer.id) {
                            throw new BadRequestException('Este cupón no pertenece al cliente.');
                        }
                        if (grantedRewardUsed.status !== 'AVAILABLE') {
                            throw new BadRequestException(`Este cupón no está disponible para ser usado (estatus: ${grantedRewardUsed.status}) o ya ha sido aplicado.`);
                        }
                        if (!grantedRewardUsed.reward || !grantedRewardUsed.reward.isActive || 
                            (grantedRewardUsed.reward.type !== RewardType.DISCOUNT_ON_ITEM && grantedRewardUsed.reward.type !== RewardType.DISCOUNT_ON_TOTAL)) {
                            throw new BadRequestException('La recompensa de descuento asociada a este cupón no es válida o no está activa.');
                        }
                        actualAppliedReward = grantedRewardUsed.reward; // Obtenemos la recompensa real del cupón
                        this.logger.log(`[TX] Recompensa REAL para descuento (vía GrantedReward): '${actualAppliedReward.name_es}'.`);

                    } else {
                        // Si no es un GrantedReward, intentar buscarlo como un Reward directo (canjeando puntos ahora)
                        this.logger.log(`[TX] No se encontró GrantedReward para ID: ${payload.appliedLcoRewardId}. Buscando como Reward directo.`);
                        const rewardDirect = await tx.reward.findUnique({ where: { id: payload.appliedLcoRewardId } });
                        if (!rewardDirect || !rewardDirect.isActive ||
                            (rewardDirect.type !== RewardType.DISCOUNT_ON_ITEM && rewardDirect.type !== RewardType.DISCOUNT_ON_TOTAL)) {
                            throw new BadRequestException('La recompensa de descuento seleccionada no es válida o no está activa.');
                        }
                        actualAppliedReward = rewardDirect; // Es una recompensa del catálogo canjeada directamente
                        totalPointsToDebit += rewardDirect.pointsCost; // Debitar puntos por este canje
                        this.logger.log(`[TX] Recompensa REAL para descuento (vía canje directo): '${actualAppliedReward.name_es}'. Puntos a debitar: ${rewardDirect.pointsCost}. Total acumulado: ${totalPointsToDebit}.`);
                    }
                } else {
                    this.logger.log(`[TX] No appliedLcoRewardId en payload. No se aplicarán descuentos generales.`);
                }

                // AHORA CALCULAMOS EL DESCUENTO FINAL BASADO EN `actualAppliedReward`
                if (actualAppliedReward) {
                    this.logger.log(`[TX] Proceso de cálculo de 'discountAmount' iniciado. Recompensa: '${actualAppliedReward.name_es}', Tipo: ${actualAppliedReward.type}, Tipo Descuento: ${actualAppliedReward.discountType}, Valor Descuento: ${actualAppliedReward.discountValue}.`);

                    let baseAmountForDiscount: Prisma.Decimal;

                    if (actualAppliedReward.type === RewardType.DISCOUNT_ON_ITEM) {
                        this.logger.log(`[TX] Tipo de recompensa es DISCOUNT_ON_ITEM.`);
                        if (actualAppliedReward.linkedMenuItemId) {
                            // DISCOUNT_ON_ITEM con producto vinculado: aplicar solo a ese ítem
                            baseAmountForDiscount = processedItems
                                .filter(item => item.menuItemId === actualAppliedReward!.linkedMenuItemId)
                                .reduce((sum, item) => sum.add(item.totalItemPrice), new Prisma.Decimal(0));
                            
                            this.logger.log(`[TX] linkedMenuItemId '${actualAppliedReward.linkedMenuItemId}' encontrado. Base de descuento (ítems específicos): ${baseAmountForDiscount.toFixed(2)}.`);
                            if (baseAmountForDiscount.isZero()) {
                                this.logger.warn(`[TX] Descuento en ítem '${actualAppliedReward.name_es}' aplicado, pero el ítem vinculado NO ESTÁ en el carrito. Descuento resultante: 0.`);
                            }
                        } else {
                            // DISCOUNT_ON_ITEM sin producto vinculado: aplicar al subtotal completo
                            this.logger.warn(`[TX] DISCOUNT_ON_ITEM '${actualAppliedReward.name_es}' sin linkedMenuItemId. Se aplicará sobre el subtotal completo: ${subtotal.toFixed(2)}.`);
                            baseAmountForDiscount = subtotal;
                        }
                    } else if (actualAppliedReward.type === RewardType.DISCOUNT_ON_TOTAL) {
                        // DISCOUNT_ON_TOTAL: aplicar al subtotal completo
                        this.logger.log(`[TX] Tipo de recompensa es DISCOUNT_ON_TOTAL. Base de descuento: ${subtotal.toFixed(2)}.`);
                        baseAmountForDiscount = subtotal;
                    } else {
                        this.logger.error(`[TX] ERROR: Tipo de recompensa inesperado para cálculo de descuento: ${actualAppliedReward.type}.`);
                        throw new BadRequestException('Tipo de recompensa no válido para cálculo de descuento.');
                    }

                    if (actualAppliedReward.discountType === DiscountType.FIXED_AMOUNT && actualAppliedReward.discountValue !== null && actualAppliedReward.discountValue !== undefined) {
                        const fixedValue = new Prisma.Decimal(actualAppliedReward.discountValue);
                        discountAmount = Prisma.Decimal.min(baseAmountForDiscount, fixedValue);
                        this.logger.log(`[TX] Descuento de IMPORTE FIJO: Valor: ${fixedValue.toFixed(2)}. Descuento aplicado: ${discountAmount.toFixed(2)}.`);
                    } else if (actualAppliedReward.discountType === DiscountType.PERCENTAGE && actualAppliedReward.discountValue !== null && actualAppliedReward.discountValue !== undefined) {
                        const percentage = new Prisma.Decimal(actualAppliedReward.discountValue).div(100);
                        discountAmount = baseAmountForDiscount.mul(percentage);
                        this.logger.log(`[TX] Descuento de PORCENTAJE: Valor: ${actualAppliedReward.discountValue}%. Descuento aplicado: ${discountAmount.toFixed(2)}.`);
                    } else {
                        this.logger.error(`[TX] ERROR: Configuración de tipo/valor de descuento inválida para recompensa ${actualAppliedReward.id}.`);
                        throw new BadRequestException('Configuración de descuento de recompensa inválida.');
                    }
                    this.logger.log(`[TX] 'discountAmount' final calculado ANTES de aplicar al total del pedido: ${discountAmount.toFixed(2)}.`);
                } else {
                    this.logger.log(`[TX] No 'actualAppliedReward' determinado, 'discountAmount' permanece en 0.`);
                }

                // Debitar puntos finales (si los hay)
                if (totalPointsToDebit > 0) { 
                    if (customer.points < totalPointsToDebit) {
                        throw new BadRequestException(`Puntos insuficientes. Necesitas ${totalPointsToDebit} y tienes ${customer.points}.`);
                    }
                    await tx.user.update({
                        where: { id: customer.id },
                        data: { points: { decrement: totalPointsToDebit } }
                    });
                    this.logger.log(`[TX] Puntos debitados: ${totalPointsToDebit} del cliente ${customer.id}.`);
                }

            } else if (payload.appliedLcoRewardId || processedItems.some(i => i.redeemedRewardId)) {
                // Si se intentan usar recompensas (ítems gratis o descuento) pero no hay customerId
                this.logger.warn(`[TX] Intento de usar recompensas sin customerId identificado o módulo LCo activo para el negocio.`);
                throw new BadRequestException('Debes iniciar sesión para usar recompensas o el módulo de fidelización no está activo para este negocio.');
            }

            const finalAmount = subtotal.sub(discountAmount).isNegative() ? new Prisma.Decimal(0) : subtotal.sub(discountAmount);
            this.logger.log(`[TX] Subtotal: ${subtotal.toFixed(2)}, Descuento: ${discountAmount.toFixed(2)}, Monto final: ${finalAmount.toFixed(2)}.`);

            const orderNumber = await this._generateOrderNumber(tx, businessId);

            // Determinar el ID de la recompensa base a vincular al pedido (si aplica)
            let finalRewardIdToLink: string | undefined = undefined;
            if (actualAppliedReward) { // Usamos actualAppliedReward aquí
                finalRewardIdToLink = actualAppliedReward.id;
                this.logger.log(`[TX] Reward ID a vincular al pedido: ${finalRewardIdToLink}.`);
            }

            const orderCreateData: Prisma.OrderCreateInput = {
                business: { connect: { id: businessId } },
                orderNumber,
                notes: payload.orderNotes,
                totalAmount: subtotal,
                discountAmount: discountAmount.toFixed(2), // Almacenar como string de 2 decimales
                finalAmount,
                status: OrderStatus.RECEIVED,
                source: finalCustomerId ? 'CUSTOMER_APP' : 'CUSTOMER_APP_ANONYMOUS',
                orderType: payload.tableIdentifier ? 'DINE_IN' : 'TAKE_AWAY', // O DELIVERY
                items: {
                    create: processedItems.map(pItem => ({
                        menuItemId: pItem.menuItemId, quantity: pItem.quantity,
                        priceAtPurchase: pItem.priceAtPurchase, totalItemPrice: pItem.totalItemPrice,
                        notes: pItem.notes, kdsDestination: pItem.kdsDestination,
                        itemNameSnapshot: pItem.itemNameSnapshot, itemDescriptionSnapshot: pItem.itemDescriptionSnapshot,
                        status: pItem.status, redeemedRewardId: pItem.redeemedRewardId,
                        ...(pItem.modifierOptionsToCreate.length > 0 && {
                            selectedModifiers: { createMany: { data: pItem.modifierOptionsToCreate } },
                        }),
                    })),
                },
                appliedLcoReward: finalRewardIdToLink ? { connect: { id: finalRewardIdToLink } } : undefined,
            };

            if (payload.tableIdentifier) {
                const table = await this.tableService.findTableByIdentifier(tx, businessId, payload.tableIdentifier);
                if (!table) throw new BadRequestException(`Mesa con identificador '${payload.tableIdentifier}' no encontrada.`);
                orderCreateData.table = { connect: { id: table.id } };
                await this.tableService.updateTableStatus(tx, table.id, TableStatus.OCCUPIED);
                this.logger.log(`[TX] Mesa ${payload.tableIdentifier} marcada como OCCUPIED.`);
            }
            if (finalCustomerId) {
                orderCreateData.customerLCo = { connect: { id: finalCustomerId } };
            }
            
            const newOrder = await tx.order.create({
                data: orderCreateData,
                include: { items: { include: { selectedModifiers: true } }, table: true },
            });
            this.logger.log(`[TX] Pedido ${newOrder.id} (Número: ${newOrder.orderNumber}) creado exitosamente.`);

            // CREACIÓN DEL ActivityLog aquí, después de que newOrder tenga su ID
            if (finalCustomerId && actualAppliedReward && (actualAppliedReward.type === RewardType.DISCOUNT_ON_ITEM || actualAppliedReward.type === RewardType.DISCOUNT_ON_TOTAL)) {
                this.logger.log(`[TX] Creando ActivityLog para descuento aplicado en pedido ${newOrder.id}.`);
                await tx.activityLog.create({
                    data: {
                        userId: finalCustomerId,
                        businessId: businessId,
                        type: 'REWARD_APPLIED_TO_ORDER', // Tipo específico para descuentos aplicados en pedidos
                        pointsChanged: actualAppliedReward.pointsCost > 0 ? -actualAppliedReward.pointsCost : null, // Solo si se debitaron puntos por el canje directo
                        description: `Descuento: '${actualAppliedReward.name_es || actualAppliedReward.name_en}' en pedido #${newOrder.orderNumber}`,
                        relatedRewardId: actualAppliedReward.id,
                        relatedGrantedRewardId: grantedRewardUsed?.id || null, // Vínculo al GrantedReward si existió
                        relatedOrderId: newOrder.id, // Ahora sí podemos vincular el Order ID
                    }
                });
                this.logger.log(`[TX] ActivityLog creado para descuento aplicado. User: ${finalCustomerId}, Order: ${newOrder.id}.`);
            }
            
            // Si la recompensa aplicada era un GrantedReward, marcarlo como APPLIED y vincularlo al pedido
            if (grantedRewardUsed) {
                this.logger.log(`[TX] Marcando GrantedReward ${grantedRewardUsed.id} como 'APPLIED' y vinculándolo al pedido ${newOrder.id}.`);
                await tx.grantedReward.update({
                    where: { id: grantedRewardUsed.id },
                    data: { status: 'APPLIED', appliedToOrderId: newOrder.id } // Vínculo al newOrder.id
                });
                this.logger.log(`[TX] GrantedReward ${grantedRewardUsed.id} marcado como APPLIED.`);
            }

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