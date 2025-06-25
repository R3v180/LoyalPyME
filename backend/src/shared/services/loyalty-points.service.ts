// backend/src/shared/services/loyalty-points.service.ts (CORREGIDO)
import {
    PrismaClient,
    Prisma,
    Order,
    User,
    Business,
    ActivityType,
    TierBenefit,
} from '@prisma/client';
import { Logger, InternalServerErrorException } from '@nestjs/common';
// --- RUTA CORREGIDA ---
import { updateUserTier } from '../../modules/loyalpyme/tiers/tier-logic.service';
// --- FIN RUTA CORREGIDA ---

type OrderForLoyalty = Pick<Order, 'id' | 'orderNumber' | 'finalAmount' | 'totalAmount' | 'customerLCoId' | 'businessId'>;
type CustomerForLoyalty = User & {
    currentTier?: ({ benefits: Pick<TierBenefit, 'type' | 'value' | 'isActive'>[] } & { id: string; name: string }) | null;
};
type BusinessForLoyalty = Pick<Business, 'id' | 'pointsPerEuro' | 'isLoyaltyCoreActive'>;


export class LoyaltyPointsService {
    private readonly logger = new Logger(LoyaltyPointsService.name);

    async awardPointsForLcOrder(
        tx: Prisma.TransactionClient,
        order: OrderForLoyalty,
        customer: CustomerForLoyalty,
        business: BusinessForLoyalty
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
             throw new InternalServerErrorException("Discrepancia en IDs de cliente al otorgar puntos.");
        }

        this.logger.log(`[LoyaltyPointsService TX] Processing LCo points for customer ${customer.id} (Order: ${order.id}, Business: ${business.id})`);

        const orderAmountForPoints = order.finalAmount ?? order.totalAmount;
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
            await tx.user.update({
                where: { id: customer.id },
                data: {
                    points: { increment: finalPointsToAward },
                    totalSpend: { increment: orderAmountForPoints.toNumber() },
                    totalVisits: { increment: 1 },
                    lastActivityAt: new Date(),
                },
            });
            this.logger.log(`[LoyaltyPointsService TX] Customer ${customer.id} updated: +${finalPointsToAward} points, +${orderAmountForPoints} spend, +1 visit.`);

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

            updateUserTier(customer.id).catch((tierError: any) => {
                this.logger.error(`[LoyaltyPointsService] Background tier update failed for customer ${customer.id} after LC order points:`, tierError);
            });
            this.logger.log(`[LoyaltyPointsService] Tier update process initiated for customer ${customer.id}.`);

            return { pointsAwarded: finalPointsToAward };

        } catch (error) {
            this.logger.error(`[LoyaltyPointsService TX] Error during points awarding transaction for order ${order.id}, customer ${customer.id}:`, error);
            return null;
        }
    }
}