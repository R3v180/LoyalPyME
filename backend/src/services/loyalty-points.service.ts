// backend/src/services/loyalty-points.service.ts
import {
    PrismaClient,
    Prisma,
    Order,
    User,
    Business,
    ActivityType,
    TierBenefit, // Para el tipado de los beneficios del tier
} from '@prisma/client';
import { Logger, InternalServerErrorException } from '@nestjs/common';
import { updateUserTier } from '../tiers/tier-logic.service'; // Asumiendo que esta es la ruta correcta

// Tipos para los datos que necesita este servicio
// (Podrían ser más específicos usando Pick si se desea mayor granularidad)
type OrderForLoyalty = Pick<Order, 'id' | 'orderNumber' | 'finalAmount' | 'totalAmount' | 'customerLCoId' | 'businessId'>;
type CustomerForLoyalty = User & {
    currentTier?: ({ benefits: Pick<TierBenefit, 'type' | 'value' | 'isActive'>[] } & { id: string; name: string }) | null;
};
type BusinessForLoyalty = Pick<Business, 'id' | 'pointsPerEuro' | 'isLoyaltyCoreActive'>;


export class LoyaltyPointsService {
    private readonly logger = new Logger(LoyaltyPointsService.name);

    /**
     * Calcula y otorga puntos de fidelidad a un cliente por un pedido del Módulo Camarero (LC)
     * que ha sido marcado como pagado.
     *
     * Esta función está diseñada para ser llamada DENTRO de una transacción Prisma
     * iniciada por el servicio que marca el pedido como pagado (ej. OrderPaymentService).
     *
     * @param tx - El cliente Prisma de la transacción actual.
     * @param order - El objeto Order que ha sido pagado.
     * @param customer - El objeto User (cliente LCo) asociado al pedido.
     * @param business - El objeto Business asociado al pedido.
     */
    async awardPointsForLcOrder(
        tx: Prisma.TransactionClient,
        order: OrderForLoyalty,
        customer: CustomerForLoyalty, // Asumimos que el cliente ya fue validado y existe
        business: BusinessForLoyalty  // Asumimos que el negocio ya fue validado
    ): Promise<{ pointsAwarded: number } | null> {
        if (!order.customerLCoId) {
            this.logger.warn(`[LoyaltyPointsService] Order ${order.id} has no customerLCoId. No points to award.`);
            return null;
        }
        if (!business.isLoyaltyCoreActive) {
            this.logger.log(`[LoyaltyPointsService] LoyaltyCore module is not active for business ${business.id}. Skipping points for order ${order.id}.`);
            return null;
        }
        if (customer.id !== order.customerLCoId) {
             this.logger.error(`[LoyaltyPointsService] Mismatch: Order customerLCoId ${order.customerLCoId} vs provided customer ID ${customer.id}. Aborting points.`);
             // Esto sería un error de lógica interna si ocurre
             throw new InternalServerErrorException("Discrepancia en IDs de cliente al otorgar puntos.");
        }


        this.logger.log(`[LoyaltyPointsService TX] Processing LCo points for customer ${customer.id} (Order: ${order.id}, Business: ${business.id})`);

        const orderAmountForPoints = order.finalAmount ?? order.totalAmount; // Usar finalAmount si existe, sino totalAmount
        let pointsToEarnDecimal = new Prisma.Decimal(orderAmountForPoints).mul(business.pointsPerEuro ?? 1);

        const multiplierBenefit = customer.currentTier?.benefits.find(
            b => b.type === 'POINTS_MULTIPLIER' && b.isActive
        );

        if (multiplierBenefit?.value) {
            const multiplier = parseFloat(multiplierBenefit.value);
            if (!isNaN(multiplier) && multiplier > 0) {
                pointsToEarnDecimal = pointsToEarnDecimal.mul(multiplier);
                this.logger.log(`[LoyaltyPointsService TX] Applied tier '${customer.currentTier?.name}' multiplier ${multiplier} for LCo points.`);
            } else {
                this.logger.warn(`[LoyaltyPointsService TX] Invalid LCo tier multiplier value '${multiplierBenefit.value}' for user ${customer.id} on tier '${customer.currentTier?.name}'.`);
            }
        }

        const finalPointsToAward = Math.floor(pointsToEarnDecimal.toNumber());

        if (finalPointsToAward <= 0) {
            this.logger.log(`[LoyaltyPointsService TX] No LCo points to award (calculated ${finalPointsToAward}) for customer ${customer.id} on order ${order.id}.`);
            return { pointsAwarded: 0 };
        }

        try {
            // 1. Actualizar puntos, gasto total y visitas del usuario
            await tx.user.update({
                where: { id: customer.id },
                data: {
                    points: { increment: finalPointsToAward },
                    totalSpend: { increment: orderAmountForPoints.toNumber() }, // Asegurarse que es número
                    totalVisits: { increment: 1 },
                    lastActivityAt: new Date(), // Actualizar última actividad
                },
            });
            this.logger.log(`[LoyaltyPointsService TX] Customer ${customer.id} updated: +${finalPointsToAward} points, +${orderAmountForPoints} spend, +1 visit.`);

            // 2. Crear registro en ActivityLog
            await tx.activityLog.create({
                data: {
                    userId: customer.id,
                    businessId: business.id,
                    type: ActivityType.POINTS_EARNED_ORDER_LC,
                    pointsChanged: finalPointsToAward,
                    description: `Puntos por pedido LC #${order.orderNumber}`,
                    relatedOrderId: order.id,
                },
            });
            this.logger.log(`[LoyaltyPointsService TX] ActivityLog created for order ${order.id}, user ${customer.id}.`);

            // 3. Disparar reevaluación de Tier (asíncrona, no bloquea la transacción)
            //    Se pasa el ID del cliente. updateUserTier ya usa su propia instancia de Prisma.
            updateUserTier(customer.id).catch((tierError: any) => {
                this.logger.error(`[LoyaltyPointsService] Background tier update failed for customer ${customer.id} after LC order points:`, tierError);
            });
            this.logger.log(`[LoyaltyPointsService] Tier update process initiated for customer ${customer.id}.`);

            return { pointsAwarded: finalPointsToAward };

        } catch (error) {
            this.logger.error(`[LoyaltyPointsService TX] Error during points awarding transaction for order ${order.id}, customer ${customer.id}:`, error);
            // No relanzamos el error para no hacer fallar la transacción principal de `markOrderAsPaid`
            // si la asignación de puntos es lo único que falla. Se loguea el error.
            // Si la asignación de puntos DEBE ser atómica con el pago, entonces se debería relanzar.
            // Por ahora, lo tratamos como un efecto secundario que puede fallar sin revertir el pago.
            // throw new InternalServerErrorException('Error al procesar los puntos de fidelidad.');
            return null; // Indicar que la asignación de puntos falló
        }
    }
}