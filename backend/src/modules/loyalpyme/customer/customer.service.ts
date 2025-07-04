// backend/src/modules/loyalpyme/customer/customer.service.ts
// VERSIÓN 3.1.1 - COMPLETA Y CORREGIDA

import {
    PrismaClient,
    Reward,
    Prisma,
    User,
    GrantedReward,
    Business,
    ActivityType,
    GrantedRewardStatus,
    Order,
    OrderStatus,
} from '@prisma/client';

const prisma = new PrismaClient();

export type OrderHistoryItem = Pick<Order, 'id' | 'orderNumber' | 'finalAmount' | 'paidAt'> & {
    items: Array<{
        itemNameSnapshot: string | null;
        quantity: number;
        totalItemPrice: Prisma.Decimal;
        priceAtPurchase: Prisma.Decimal;
        redeemedRewardId: string | null;
        selectedModifiers: Array<{
            optionNameSnapshot: string | null;
            optionPriceAdjustmentSnapshot: Prisma.Decimal;
        }>;
    }>;
};

export interface PaginatedOrdersResponse {
    orders: OrderHistoryItem[];
    totalPages: number;
    currentPage: number;
    totalItems: number;
}

export type CustomerBusinessConfig = Pick<Business, 'tierCalculationBasis'> | null;

export const findActiveRewardsForCustomer = async (businessId: string): Promise<Reward[]> => {
    console.log(`[CUST_SVC] Finding active rewards for customer view for business: ${businessId}`);
    try {
        const rewards = await prisma.reward.findMany({
            where: {
                businessId: businessId,
                isActive: true,
            },
            orderBy: {
                pointsCost: 'asc',
            },
        });
        console.log(`[CUST_SVC] Found ${rewards.length} active rewards for business ${businessId}`);
        return rewards;
    } catch (error) {
        console.error(`[CUST_SVC] Error fetching active rewards for business ${businessId}:`, error);
        if (error instanceof Prisma.PrismaClientKnownRequestError) {
            throw new Error(`Error de base de datos al buscar recompensas: ${error.message}`);
        }
        throw new Error('Error inesperado al buscar recompensas activas.');
    }
};

/**
 * Obtiene TODOS los GrantedReward (regalos pendientes, cupones disponibles, etc.) de un usuario.
 * @param userId - El ID del usuario.
 * @returns Una lista de todos los `GrantedReward` del usuario.
 */
export const getAllGrantedRewardsForUser = async (userId: string): Promise<GrantedReward[]> => {
    console.log(`[CUST_SVC] Fetching ALL granted rewards for user ${userId}`);
    try {
        const grantedRewards = await prisma.grantedReward.findMany({
            where: {
                userId: userId,
                // Se elimina el filtro de estado para devolver TODOS
            },
            include: {
                reward: {
                    select: {
                        id: true,
                        name_es: true,
                        name_en: true,
                        description_es: true,
                        description_en: true,
                        imageUrl: true,
                        type: true,
                        discountType: true,
                    }
                },
                assignedBy: { select: { name: true, email: true } },
                business: { select: { name: true } }
            },
            orderBy: { assignedAt: 'desc' }
        });
        console.log(`[CUST_SVC] Found ${grantedRewards.length} total granted rewards for user ${userId}`);
        return grantedRewards;
    } catch (error) {
        console.error(`[CUST_SVC] Error fetching all granted rewards for user ${userId}:`, error);
        if (error instanceof Prisma.PrismaClientKnownRequestError) {
             throw new Error(`Error de base de datos al buscar recompensas otorgadas: ${error.message}`);
        }
        throw new Error('Error inesperado al buscar recompensas otorgadas.');
    }
};

export const redeemGrantedReward = async (userId: string, grantedRewardId: string): Promise<GrantedReward> => {
    console.log(`[CUST_SVC] User ${userId} attempting to redeem granted reward ${grantedRewardId}`);
    try {
        const updatedGrantedReward = await prisma.$transaction(async (tx) => {
            const grantedReward = await tx.grantedReward.findUnique({
                where: { id: grantedRewardId },
                include: {
                    reward: {
                        select: {
                            id: true,
                            name_es: true,
                            name_en: true
                        }
                    },
                    business: { select: { id: true } }
                }
            });

            if (!grantedReward) { throw new Error(`Regalo con ID ${grantedRewardId} no encontrado.`); }
            if (!grantedReward.business?.id) { console.error(`[CUST_SVC] Critical: GrantedReward ${grantedRewardId} missing business relation!`); throw new Error(`Error interno: El regalo no está asociado a un negocio.`); }
            if (!grantedReward.reward?.id) { console.error(`[CUST_SVC] Critical: GrantedReward ${grantedRewardId} missing reward relation!`); throw new Error(`Error interno: El regalo no está asociado a una recompensa.`); }
            if (grantedReward.userId !== userId) { console.warn(`[CUST_SVC] Unauthorized attempt by user ${userId} to redeem granted reward ${grantedRewardId} belonging to user ${grantedReward.userId}`); throw new Error("Este regalo no te pertenece."); }
            
            if (grantedReward.status !== 'PENDING') {
                const rewardDisplayName = grantedReward.reward.name_es || grantedReward.reward.name_en || `ID ${grantedReward.reward.id}`;
                throw new Error(`Este regalo (${rewardDisplayName}) ya fue canjeado o no es válido (Estado: ${grantedReward.status}).`);
            }

            const redeemed = await tx.grantedReward.update({
                where: { id: grantedRewardId, userId: userId, status: 'PENDING' },
                data: { status: GrantedRewardStatus.APPLIED, redeemedAt: new Date() }
            });

            const logDescription = grantedReward.reward.name_es || grantedReward.reward.name_en || null;
            await tx.activityLog.create({
                data: {
                    userId: userId,
                    businessId: grantedReward.business.id,
                    type: ActivityType.GIFT_REDEEMED,
                    pointsChanged: null,
                    description: logDescription,
                    relatedGrantedRewardId: grantedRewardId
                }
            });

            console.log(`[CUST_SVC] Granted reward ${grantedRewardId} (${redeemed.rewardId}) successfully redeemed by user ${userId}. Activity logged.`);
            return redeemed;
        });
        return updatedGrantedReward;
    } catch (error) {
        console.error(`[CUST_SVC] Error redeeming granted reward ${grantedRewardId} for user ${userId}:`, error);
        if (error instanceof Prisma.PrismaClientKnownRequestError) { if (error.code === 'P2025') { throw new Error("El regalo no se encontró o ya no estaba pendiente al intentar canjearlo."); } throw new Error(`Error de base de datos al canjear el regalo: ${error.message}`); }
        if (error instanceof Error) { throw error; }
        throw new Error('Error inesperado al canjear el regalo.');
    }
};

export const getCustomerFacingBusinessConfig = async (businessId: string): Promise<CustomerBusinessConfig> => {
    console.log(`[CUST_SVC] Fetching customer-facing config for business: ${businessId}`);
    try {
        const config = await prisma.business.findUnique({
            where: { id: businessId },
            select: { tierCalculationBasis: true }
        });
        if (!config) {
            console.warn(`[CUST_SVC] Business not found when fetching config: ${businessId}`);
            return null;
        }
        return { tierCalculationBasis: config.tierCalculationBasis ?? null };
    } catch (error) {
        console.error(`[CUST_SVC] Error fetching customer-facing config for business ${businessId}:`, error);
        throw new Error('Error al obtener la configuración del negocio.');
    }
};

export const getAvailableCouponsForUser = async (userId: string): Promise<GrantedReward[]> => {
    console.log(`[CUST_SVC] Fetching available coupons (GrantedRewards) for user ${userId}`);
    try {
        const coupons = await prisma.grantedReward.findMany({
            where: {
                userId: userId,
                status: GrantedRewardStatus.AVAILABLE,
            },
            include: {
                reward: true 
            },
            orderBy: {
                assignedAt: 'desc'
            }
        });
        return coupons;
    } catch (error) {
        console.error(`[CUST_SVC] Error fetching available coupons for user ${userId}:`, error);
        throw new Error('Error al obtener los cupones disponibles.');
    }
};

export const getCustomerOrders = async (userId: string, page: number, limit: number): Promise<PaginatedOrdersResponse> => {
    console.log(`[CUST_SVC] Fetching order history for user ${userId}, Page: ${page}, Limit: ${limit}`);
    const skip = (page - 1) * limit;
    const whereClause: Prisma.OrderWhereInput = {
        customerLCoId: userId,
        status: OrderStatus.PAID,
    };
    try {
        const [totalItems, orders] = await prisma.$transaction([
            prisma.order.count({ where: whereClause }),
            prisma.order.findMany({
                where: whereClause,
                select: {
                    id: true,
                    orderNumber: true,
                    finalAmount: true,
                    paidAt: true,
                    items: {
                        where: { status: { not: 'CANCELLED' } },
                        select: {
                            itemNameSnapshot: true,
                            quantity: true,
                            totalItemPrice: true,
                            priceAtPurchase: true,
                            redeemedRewardId: true,
                            selectedModifiers: {
                                select: {
                                    optionNameSnapshot: true,
                                    optionPriceAdjustmentSnapshot: true,
                                }
                            }
                        }
                    }
                },
                orderBy: { paidAt: 'desc' },
                skip: skip,
                take: limit,
            })
        ]);
        const totalPages = Math.ceil(totalItems / limit);
        console.log(`[CUST_SVC] Found ${orders.length} orders for user ${userId} on page ${page}. Total: ${totalItems}`);
        return {
            orders: orders as OrderHistoryItem[],
            totalPages,
            currentPage: page,
            totalItems,
        };
    } catch (error) {
        console.error(`[CUST_SVC] Error fetching order history for user ${userId}:`, error);
        throw new Error('Error al obtener el historial de pedidos desde la base de datos.');
    }
};