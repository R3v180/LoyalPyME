// frontend/src/modules/camarero/types/publicOrder.types.ts
// VERSIÓN 2.1.1 - Eliminada dependencia de @prisma/client.

// Los enums y tipos compartidos deben estar en un lugar común, como 'shared/types'.
import { OrderStatus, OrderItemStatus } from '../../../shared/types/user.types';
import type { DisplayReward } from '../../../shared/types/user.types';

// --- TIPO PARA EL ESTADO DE RECOMPENSAS APLICADAS ---
export interface AppliedSelections {
    discount: DisplayReward | null;
    freeItems: DisplayReward[];
}

// --- TIPOS PARA EL CARRITO EN EL FRONTEND ---
export interface SelectedModifierFE {
    modifierOptionId: string;
    name_es?: string | null;
    name_en?: string | null;
    priceAdjustment: number;
    modifierGroupName_es?: string | null;
    modifierGroupName_en?: string | null;
}

export interface OrderItemFE {
    cartItemId: string;
    menuItemId: string;
    menuItemName_es: string | null;
    menuItemName_en: string | null;
    quantity: number;
    basePrice: number;
    currentPricePerUnit: number;
    totalPriceForItem: number;
    notes?: string | null;
    selectedModifiers: SelectedModifierFE[];
    redeemedRewardId?: string | null;
}

// --- TIPO PARA EL ESTADO DE CONFIGURACIÓN DE UN ÍTEM ---
export interface ConfiguringItemState {
    itemDetails: any; // Debería ser PublicMenuItem
    quantity: number;
    selectedOptionsByGroup: Record<string, string[] | string>;
    currentUnitPrice: number;
    itemNotes: string;
    areModifiersValid: boolean;
}

// --- TIPOS PARA PAYLOADS DE API (USADOS EN FRONTEND Y BACKEND) ---
export interface FrontendCreateOrderItemDto {
    menuItemId: string;
    quantity: number;
    notes?: string | null;
    selectedModifierOptions?: { modifierOptionId: string }[] | null;
    redeemedRewardId?: string | null;
}

export interface CreateOrderPayloadDto {
    tableIdentifier?: string | null;
    customerId?: string | null;
    customerNotes: string | null;
    items: FrontendCreateOrderItemDto[];
    appliedLcoRewardId?: string | null;
}

export interface AddItemsToOrderPayloadDto {
    items: FrontendCreateOrderItemDto[];
    customerNotes: string | null;
    appliedLcoRewardId?: string | null;
}

// --- TIPOS PARA LA LÓGICA INTERNA DEL BACKEND ---
// Estos tipos pueden vivir en el frontend, pero sin dependencias de Prisma.
// Representan la "forma" de los datos que el backend procesará.
export interface ModifierOptionToCreate {
    modifierOptionId: string;
    optionNameSnapshot: string;
    optionPriceAdjustmentSnapshot: number;
}

export interface ProcessedOrderItemData {
    menuItemId: string;
    quantity: number;
    priceAtPurchase: number; // Usamos 'number' en el frontend
    totalItemPrice: number;  // Usamos 'number' en el frontend
    notes?: string | null;
    kdsDestination: string | null;
    itemNameSnapshot: string;
    itemDescriptionSnapshot: string | null;
    status: OrderItemStatus;
    modifierOptionsToCreate: ModifierOptionToCreate[];
    redeemedRewardId?: string | null;
}

// --- TIPOS PARA RESPUESTAS DE API (USADOS EN FRONTEND) ---
export interface BackendOrderResponse {
    id: string;
    orderNumber?: string | null;
}

export interface PublicModifierStatusInfo {
    optionNameSnapshot: string | null;
    optionPriceAdjustmentSnapshot: number; 
}

export interface PublicOrderItemStatusInfo {
    id: string;
    itemNameSnapshot: string | null; 
    quantity: number;
    status: OrderItemStatus;
    priceAtPurchase: number;
    totalItemPrice: number;
    selectedModifiers: PublicModifierStatusInfo[];
}

export interface PublicOrderStatusInfo {
    orderId: string;
    orderNumber: string;
    orderStatus: OrderStatus;
    items: PublicOrderItemStatusInfo[];
    tableIdentifier?: string | null;
    orderNotes?: string | null;
    createdAt: string;
    isBillRequested?: boolean;
    totalAmount: number;
    discountAmount: number | null;
    finalAmount: number;
    appliedLcoRewardId: string | null;
}