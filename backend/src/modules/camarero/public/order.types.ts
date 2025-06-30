// backend/src/modules/camarero/public/order.types.ts
import { OrderStatus, OrderItemStatus, Prisma } from '@prisma/client';

// --- DTOs y Tipos para la Lógica Interna (Sin cambios) ---

export interface SelectedModifierOptionInternalDto {
    modifierOptionId: string;
}
export interface OrderItemInternalDto {
    menuItemId: string;
    quantity: number;
    notes?: string | null;
    selectedModifierOptions?: SelectedModifierOptionInternalDto[] | null;
    redeemedRewardId?: string | null;
}
export interface CreateOrderPayloadInternalDto {
    tableIdentifier?: string | null;
    customerId?: string | null;
    orderNotes?: string | null;
    items: OrderItemInternalDto[];
    appliedLcoRewardId?: string | null;
}
export interface ProcessedOrderItemData {
    menuItemId: string;
    quantity: number;
    priceAtPurchase: Prisma.Decimal;
    totalItemPrice: Prisma.Decimal;
    notes?: string | null;
    kdsDestination: string | null;
    itemNameSnapshot: string;
    itemDescriptionSnapshot: string | null;
    status: OrderItemStatus;
    modifierOptionsToCreate: Prisma.OrderItemModifierOptionCreateManyOrderItemInput[];
    redeemedRewardId?: string | null;
}


// --- Estructuras para la Respuesta Pública del Estado del Pedido (CORREGIDAS) ---

export interface PublicModifierStatusInfo {
    optionNameSnapshot: string | null;
    // --- CORRECCIÓN: Permitir que sea null y usar `number` para el frontend ---
    optionPriceAdjustmentSnapshot: number; 
}

export interface PublicOrderItemStatusInfo {
    id: string;
    // --- CORRECCIÓN: Cambiar a `itemNameSnapshot` para que coincida con la consulta ---
    itemNameSnapshot: string | null; 
    quantity: number;
    status: OrderItemStatus;
    // --- CORRECCIÓN: Usar `number` para que el JSON sea consistente ---
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
    createdAt: Date; // Usar Date, JSON.stringify lo convertirá a string ISO
    isBillRequested?: boolean;
    // --- CORRECCIÓN: Usar `number` para el JSON ---
    totalAmount: number;
    discountAmount: number | null;
    finalAmount: number; // El frontend espera un número
}


// --- DTOs que representan los payloads esperados desde el Frontend/Controlador (Sin cambios) ---

export interface FrontendSelectedOrderModifierOptionDto {
    modifierOptionId: string;
}

export interface FrontendCreateOrderItemDto {
    menuItemId: string;
    quantity: number;
    notes?: string | null;
    selectedModifierOptions?: FrontendSelectedOrderModifierOptionDto[] | null;
    redeemedRewardId?: string | null;
}

export interface FrontendCreateOrderDto {
    tableIdentifier?: string | null;
    customerNotes?: string | null;
    customerId?: string | null;
    items: FrontendCreateOrderItemDto[];
    appliedLcoRewardId?: string | null;
}

// --- Tipos para AÑADIR items (corregidos para claridad) ---
export interface FrontendAddItemsOrderItemDto {
    menuItemId: string;
    quantity: number;
    notes?: string | null;
    selectedModifierOptions?: Array<{ modifierOptionId: string }>;
    redeemedRewardId?: string | null;
}

export interface FrontendAddItemsToOrderDto {
    items: FrontendAddItemsOrderItemDto[];
    customerNotes?: string;
    appliedLcoRewardId?: string | null;
}
// --- Fin tipos para añadir ---


export interface FrontendRequestBillClientPayloadDto {
  paymentPreference?: string | null;
}

export interface FrontendRequestBillStaffPayloadDto {
  paymentPreference?: string | null;
}

export interface FrontendMarkOrderAsPaidPayloadDto {
  method?: string;
  notes?: string | null;
}