// frontend/src/modules/camarero/types/publicOrder.types.ts
// Version: 1.1.0 - Add redeemedRewardId to OrderItemFE

import { PublicMenuItem } from './menu.types';

// --- Tipos para el Frontend del Carrito y Configuración de Ítems ---
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
    // --- CAMPO AÑADIDO ---
    redeemedRewardId?: string | null; // ID de la Reward usada para obtener este ítem gratis
}

export interface ConfiguringItemState {
    itemDetails: PublicMenuItem;
    quantity: number;
    selectedOptionsByGroup: Record<string, string[] | string>;
    currentUnitPrice: number;
    itemNotes: string;
    areModifiersValid: boolean;
}

// --- Tipos para los DTOs de la API (Payloads para el Backend) ---
export interface CreateOrderItemModifierDto {
    modifierOptionId: string;
}

export interface CreateOrderItemDto {
    menuItemId: string;
    quantity: number;
    notes?: string | null;
    selectedModifierOptions?: CreateOrderItemModifierDto[] | null;
    // --- CAMPO AÑADIDO PARA CANJE DE ITEM ---
    redeemedRewardId?: string | null; 
}

export interface CreateOrderPayloadDto {
    tableIdentifier?: string | null;
    customerId?: string | null;
    customerNotes: string | null;
    items: CreateOrderItemDto[];
    businessId?: string;
    // --- CAMPO AÑADIDO PARA DESCUENTO TOTAL ---
    appliedLcoRewardId?: string | null;
}

export interface AddItemsToOrderPayloadDto {
    items: CreateOrderItemDto[];
    customerNotes: string | null;
    // --- CAMPO AÑADIDO PARA DESCUENTO TOTAL (en adición de items) ---
    appliedLcoRewardId?: string | null;
}

// --- Tipos para las Respuestas de la API de Pedidos ---
export interface BackendOrderResponse {
    id: string;
    orderNumber?: string | null;
}

// --- Tipos para la Gestión del Pedido Activo en localStorage ---
export interface ActiveOrderInfo {
    orderId: string;
    orderNumber: string;
    businessSlug: string;
    tableIdentifier?: string;
    savedAt: number;
}