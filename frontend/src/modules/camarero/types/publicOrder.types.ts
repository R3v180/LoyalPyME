// frontend/src/modules/camarero/types/publicOrder.types.ts
// Versión 1.2.1 - CORRECCIÓN: Añadir appliedLcoRewardId a PublicOrderStatusInfo

import { PublicMenuItem } from './menu.types';
import { OrderStatus, OrderItemStatus } from '../../../shared/types/user.types'; // Importar enums

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
    redeemedRewardId?: string | null; 
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
    redeemedRewardId?: string | null; 
}

export interface CreateOrderPayloadDto {
    tableIdentifier?: string | null;
    customerId?: string | null;
    customerNotes: string | null;
    items: CreateOrderItemDto[];
    businessId?: string;
    appliedLcoRewardId?: string | null;
}

export interface AddItemsToOrderPayloadDto {
    items: CreateOrderItemDto[];
    customerNotes: string | null;
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

// --- INTERFACES EXPORTADAS PARA EL ESTADO DEL PEDIDO (CORREGIDAS) ---
export interface PublicModifierStatusInfo {
    optionNameSnapshot: string | null;
    optionPriceAdjustmentSnapshot: number; // Ya es número
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
    createdAt: string; // La API lo envía como string ISO
    isBillRequested?: boolean;
    totalAmount: number;
    discountAmount: number | null;
    finalAmount: number;
    appliedLcoRewardId: string | null; // <--- ¡AÑADIDA ESTA PROPIEDAD!
}