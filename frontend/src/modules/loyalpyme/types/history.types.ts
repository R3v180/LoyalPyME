// frontend/src/modules/loyalpyme/types/history.types.ts
// Este archivo centralizará los tipos para el historial de compras del cliente.
// Versión 1.1.0 - Corregido: Se eliminó la dependencia de @prisma/client.

// Representa un modificador dentro de un ítem en el historial
export interface OrderHistoryModifier {
    optionNameSnapshot: string | null;
    // El frontend recibirá y usará esto como un número
    optionPriceAdjustmentSnapshot: number;
}

// Representa un ítem dentro de un pedido en el historial
export interface OrderHistoryItem {
    itemNameSnapshot: string | null;
    quantity: number;
    // El frontend recibirá y usará estos valores como números
    totalItemPrice: number;
    priceAtPurchase: number;
    redeemedRewardId: string | null;
    selectedModifiers: OrderHistoryModifier[];
}

// Representa un pedido completo en la lista del historial
export interface CustomerOrder {
    id: string;
    orderNumber: string;
    // El frontend recibirá y usará esto como un número
    finalAmount: number;
    paidAt: string | null; // La fecha se recibe como string ISO
    items: OrderHistoryItem[];
}

// Representa la respuesta completa y paginada de la API
export interface PaginatedOrdersResponse {
    orders: CustomerOrder[];
    totalPages: number;
    currentPage: number;
    totalItems: number;
}