// frontend/src/modules/camarero/services/kdsService.ts
// Version 1.0.3 - Corrected type imports to point to the shared types file.

import axiosInstance from '../../../shared/services/axiosInstance';
// --- CORRECCIÓN: Importar los enums desde la fuente correcta de tipos compartidos ---
import { OrderItemStatus, OrderStatus } from '../../../shared/types/user.types';

// --- Tipos para la respuesta del GET (la estructura interna no cambia) ---
export interface KdsListItem {
    id: string; 
    quantity: number;
    status: OrderItemStatus; // Ahora usa el tipo importado correctamente
    notes: string | null;
    kdsDestination: string | null;
    menuItemName_es: string | null;
    menuItemName_en: string | null; 
    selectedModifiers: {
        optionName_es: string | null;
        optionName_en: string | null; 
    }[];
    orderInfo: {
        id: string; 
        orderNumber: string;
        createdAt: string; 
        tableIdentifier: string | null;
    };
    preparationTime?: number | null; 
    preparedAt?: string | null; 
    servedAt?: string | null; 
}

// --- Tipos para la respuesta del PATCH (la estructura interna no cambia) ---
interface ModifierOptionInfo {
    id: string;
    name_es: string | null;
    name_en: string | null;
    priceAdjustment: string; 
    position: number;
    isDefault: boolean;
    isAvailable: boolean;
    groupId: string;
    createdAt: string; 
    updatedAt: string; 
}

interface SelectedModifierInfo {
    orderItemId: string;
    modifierOptionId: string;
    optionNameSnapshot: string | null;
    optionPriceAdjustmentSnapshot: string; 
    createdAt: string; 
    modifierOption: ModifierOptionInfo; 
}

interface MenuItemInfoForKdsPatchResponse {
    id: string;
    sku: string | null;
    name_es: string | null;
    name_en: string | null;
    description_es: string | null;
    description_en: string | null;
    price: string; 
    imageUrl: string | null;
    allergens: string[]; 
    tags: string[]; 
    isAvailable: boolean;
    position: number;
    preparationTime: number | null;
    calories: number | null;
    kdsDestination: string | null;
    categoryId: string;
    businessId: string;
    trackInventory: boolean;
    stockQuantity: number | null;
    createdAt: string; 
    updatedAt: string; 
}

interface OrderInfoForKdsPatchResponse {
    id: string;
    orderNumber: string;
    status: OrderStatus; // Usa el tipo correcto
    totalAmount: string; 
    discountAmount: string | null; 
    finalAmount: string; 
    notes: string | null;
    source: string | null; 
    tableId: string | null;
    customerLCoId: string | null;
    waiterId: string | null;
    businessId: string;
    createdAt: string; 
    updatedAt: string; 
    confirmedAt: string | null; 
    billedAt: string | null; 
    paidAt: string | null; 
    orderType: string; 
    paymentMethodPreference: string | null;
    amountToPayWith: string | null; 
    paymentIntentId: string | null;
    paymentProvider: string | null;
    deliveryAddressJson: string | null; 
    deliveryFee: string | null; 
    estimatedDeliveryTime: string | null; 
    appliedLcoRewardId: string | null;
    appliedLcoRewardDiscountAmount: string | null; 
    appliedLcoTierBenefitDiscountAmount: string | null; 
}

export interface FullOrderItemKdsResponse {
    id: string;
    quantity: number;
    priceAtPurchase: string; 
    totalItemPrice: string; 
    notes: string | null;
    status: OrderItemStatus; // Usa el tipo correcto
    kdsDestination: string | null;
    orderId: string;
    menuItemId: string;
    itemNameSnapshot: string | null;
    itemDescriptionSnapshot: string | null;
    servedById: string | null;
    preparedAt: string | null; 
    servedAt: string | null; 
    cancellationReason: string | null;
    createdAt: string; 
    updatedAt: string; 
    order: OrderInfoForKdsPatchResponse;
    menuItem: MenuItemInfoForKdsPatchResponse;
    selectedModifiers: SelectedModifierInfo[];
}

const KDS_API_PATH = '/camarero/kds';

export const getItemsForKds = async (
    destination: string,
    statusValues?: OrderItemStatus[] // Usa el tipo correcto
): Promise<KdsListItem[]> => {
    try {
        const params: Record<string, string | string[]> = { destination: destination.toUpperCase() };
        if (statusValues && statusValues.length > 0) {
            params.status = statusValues; 
        }
        const response = await axiosInstance.get<KdsListItem[]>(`${KDS_API_PATH}/items`, { params });
        console.log('[kdsService.getItemsForKds] Raw response data:', response.data);
        return response.data;
    } catch (error) {
        console.error('[kdsService.getItemsForKds] Error fetching KDS items:', error);
        throw error;
    }
};

export const updateOrderItemKdsStatus = async (
    orderItemId: string,
    newStatus: OrderItemStatus // Usa el tipo correcto
): Promise<FullOrderItemKdsResponse> => { 
    try {
        const response = await axiosInstance.patch<FullOrderItemKdsResponse>(
            `${KDS_API_PATH}/items/${orderItemId}/status`,
            { newStatus } 
        );
        console.log('[kdsService.updateOrderItemKdsStatus] Raw response data:', response.data);
        return response.data;
    } catch (error) {
        console.error(`[kdsService.updateOrderItemKdsStatus] Error updating KDS order item ${orderItemId} status:`, error);
        throw error;
    }
};