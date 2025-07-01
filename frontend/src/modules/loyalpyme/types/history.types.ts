// frontend/src/modules/loyalpyme/types/history.types.ts
// Versión 1.1.1 - Añadida la propiedad opcional `appliedLcoRewardId` a CustomerOrder.

export interface OrderHistoryModifier {
    optionNameSnapshot: string | null;
    optionPriceAdjustmentSnapshot: number;
}

export interface OrderHistoryItem {
    itemNameSnapshot: string | null;
    quantity: number;
    totalItemPrice: number;
    priceAtPurchase: number;
    redeemedRewardId: string | null;
    selectedModifiers: OrderHistoryModifier[];
}

export interface CustomerOrder {
    id: string;
    orderNumber: string;
    finalAmount: number;
    paidAt: string | null;
    items: OrderHistoryItem[];
    // --- LÍNEA AÑADIDA ---
    appliedLcoRewardId?: string | null; // Hacerla opcional para no romper otros usos si no viene
    // --- FIN LÍNEA AÑADIDA ---
}

export interface PaginatedOrdersResponse {
    orders: CustomerOrder[];
    totalPages: number;
    currentPage: number;
    totalItems: number;
}