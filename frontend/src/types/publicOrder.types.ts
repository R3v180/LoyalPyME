// frontend/src/types/publicOrder.types.ts
// Version: 1.0.4 (Final correction: DTO note fields are strictly string | null)

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
    notes?: string | null; // En el DTO del item, puede ser opcional y null
    selectedModifierOptions?: CreateOrderItemModifierDto[] | null;
}

export interface CreateOrderPayloadDto {
    tableIdentifier?: string | null; // Opcional en el payload
    customerId?: string | null;      // Opcional en el payload
    orderNotes: string | null;        // NO opcional, debe ser string o null si se envía el objeto payload
    items: CreateOrderItemDto[];
    businessId?: string;             // Opcional en el payload
}

export interface AddItemsToOrderPayloadDto {
    items: CreateOrderItemDto[];      // CORREGIDO: Usar CreateOrderItemDto[]
    customerNotes: string | null;   // NO opcional, debe ser string o null si se envía el objeto payload
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